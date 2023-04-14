---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2023-04-14
title: Uploading GoReleaser snapshot releases in GitLab
tags: ["cicd", "gitlab", "go"]
---
I'm wary about doing a short write-up about this as I don't want anyone to eat [Carlos Alexandro Becker's](https://github.com/caarlos0) lunch in any way. He seems to be an absolute lad and rockstar when it comes to his open source work, and I'm hoping this lands softly in regards to people still shelling out for the pro version of [GoReleaser](https://goreleaser.com/).

So, the nitty-gritty. Setting up GoReleaser for GitLab is trivial using the [official documentation](https://goreleaser.com/ci/gitlab/), but that only takes care of the tag-based releases. I wanted a system wherein people could create merge requests that would result in archives being created in [GitLab's Generic Packages Repository](https://docs.gitlab.com/ee/user/packages/generic_packages/).

At first I thought I would just be able to use the [HTTP upload](https://goreleaser.com/customization/upload/) functionality that GoReleaser has, but I didn't see a way I could do so without creating multiple `.goreleaser.yml` files. Not that multiple configuration files are inherently bad, but if I can I try to avoid having too many of them. Next I looked over the Generic Packages Repository documentation and saw that one can just use `curl` to upload files using `--upload-file`. A lightbulb moment if there ever was one!

By default, however, GoReleaser's [snapshots](https://goreleaser.com/customization/snapshots/) functionality creates archives that contain the current commit ID as well as the currently released tag in its name. This would have meant that every new commit in relation to a merge request would result in an entirely new package (in terms of GitLab) being created which has the potential to balloon the space requirements for a single Git repository. Luckily, the name can be changed. The example to change the name of a snapshot release though is as follows:

```yaml
# .goreleaser.yaml
snapshot:
  # Default is `{{ .Version }}-SNAPSHOT-{{.ShortCommit}}`.
  # Templates: allowed
  name_template: '{{ incpatch .Version }}-devel'
```

The ['incpatch' common field](https://goreleaser.com/customization/templates/#common-fields) bumps the patch segment of a given version by one. So, for example, if version 1.0.0 is currently released and someone creates a merge request with proposed changes, then a job would kick off that would create `1.0.1-devel`. Seems perfect. However, what if multiple people create merge requests? They would collide with each other! And in GitLab any file uploads for the same version would result in duplicates being appended under the same version.

For a given merge request within a project, its own ID (i.e. the merge request's ID) seems to be a unique enough value to be used within the name of the package in order to differentiate versions. GitLab has a bunch of [predefined variables](https://docs.gitlab.com/ee/ci/variables/predefined_variables.html). One of them is `CI_MERGE_REQUEST_IID`, which is:

> The project-level IID (internal ID) of the merge request. This ID is unique for the current project.

For local usage of GoReleaser I wanted to keep the `devel` string within the name, but for snapshot releases happening in merge requests I wanted to use the value of the environment variable `CI_MERGE_REQUEST_IID`. GoReleaser, again, has thought of pretty much everything and has [global environment variables](https://goreleaser.com/customization/env/), which I set up as follows:

```yaml
# .goreleaser.yaml
env:
  - ENV_MR_IID={{ if index .Env "CI_MERGE_REQUEST_IID" }}{{ .Env.CI_MERGE_REQUEST_IID }}{{ else }}devel{{ end }}

snapshot:
  name_template: "{{ incpatch .Version }}-{{ .Env.ENV_MR_IID }}"
```

This would result in a package version like `1.0.1-1` if this was the first merge request in the project. For GitLab's CI it's necessary to create a job that only triggers for merge request events. I usually use YAML anchoring for [rules](https://docs.gitlab.com/ee/ci/yaml/index.html#rules) as then I can just define them at the top and use aliases to reference them elsewhere. The following sets up two [variables](https://docs.gitlab.com/ee/ci/yaml/index.html#variables) - one for the [packages API](https://docs.gitlab.com/ee/api/packages.html) and one for the project-specific package registry - and one rule for triggering upon commits to an active merge request:

```yaml
# .gitlab-ci.yml
stages:
  - publish

variables:
  PACKAGE_API_URL: "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/packages"
  PACKAGE_REGISTRY_URL: "${PACKAGE_API_URL}/generic/${CI_PROJECT_NAME}"

.rules:
  rules:
    - if: &merge-request-criteria $CI_PIPELINE_SOURCE == "merge_request_event"
```

Now the actual job[^1]:

```yaml
# .gitlab-ci.yml
...

.publish:
  image:
    name: goreleaser/goreleaser:v1.17.0
    entrypoint: [""]
  variables:
    GIT_DEPTH: 0

merge-release:
  stage: publish
  extends: .publish
  before_script:
    - apk add jq
  script:
    - goreleaser release --snapshot --clean
    - cd dist/
    - |
      echo "Finding out current release version"
      export RELEASE_VERSION=$(find . -type f -iname "*checksums.txt" | cut -d "_" -f 2)
    - |
      echo "Finding out package ID for current merge request at version '${RELEASE_VERSION}'"
      export MR_PACKAGE_ID=$(curl -s --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" "$PACKAGE_API_URL" |\
        jq -r ".[] | select(.version==\"$RELEASE_VERSION\").id")
    - |
      echo "Deleting potentially existing package for current merge request at package ID '${MR_PACKAGE_ID}'"
      curl --request DELETE --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" "${PACKAGE_API_URL}/${MR_PACKAGE_ID}" > /dev/null 2>&1
    - |
      find . -type f -iname "*${RELEASE_VERSION}*" -exec bash -c \
        'echo "Uploading \"{}\" to package registry"; \
        curl -s --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" --upload-file {} ${PACKAGE_REGISTRY_URL}/${RELEASE_VERSION}/{}; \
        echo -e "\n"' \;
  rules:
    - if: *merge-request-criteria
```

First I created a generic `.publish` job, which by itself can never run (it can only be referenced through ['extends'](https://docs.gitlab.com/ee/ci/yaml/index.html#extends)). The `merge-release` job uses it as its base to get the correct image and any variables. In `before_script` I install `jq` just for the purposes of being able to reliably query for the correct package ID (as shown on line no. 25). I'm not enthused about having it download and install _anything_ at the start of every job, but I'm not at the point yet where I want to create a separate Docker image just for this.

Afterwards 5 steps are performed by the job:

1. it uses the `goreleaser release --snapshot` command to create a release, but not publish it
1. it finds out the current release version (e.g. `1.0.1-1`)
1. for that release version it founds out the package ID it needs to wipe beforehand[^2]
1. it deletes the package with the found ID or does nothing if no package existed at that ID
1. it uploads every file from the `dist/` directory, which includes the release version in its name[^3]

The astute among you may have noticed the `GITLAB_TOKEN` variable. This is different from a `CI_JOB_TOKEN`variable, which would effectively mimic you or whoever has permissions to make changes in the repository. As explained by GoReleaser's documentation this specific variable is a project access token with `api` scope. I also added the Maintainer role to this token so it would have enough permissions to perform the deletions required in the `merge-release` job.

Here's what an example run of this job would look like:

```python
$ apk add jq
fetch https://dl-cdn.alpinelinux.org/alpine/v3.17/main/x86_64/APKINDEX.tar.gz
fetch https://dl-cdn.alpinelinux.org/alpine/v3.17/community/x86_64/APKINDEX.tar.gz
(1/2) Installing oniguruma (6.9.8-r0)
(2/2) Installing jq (1.6-r2)
Executing busybox-1.35.0-r29.trigger
OK: 472 MiB in 71 packages
$ goreleaser release --snapshot --clean
  • starting release...
  • loading config file                              file=.goreleaser.yml
  • loading environment variables
    • using token from "$GITLAB_TOKEN"
  • getting and validating git state
    • couldn't find any tags before "v1.0.0"
    • building...                                    commit=067622c920472ae1266dcfc2def20ce9174630d2 latest tag=v1.0.0
    • pipe skipped                                   reason=disabled during snapshot mode
  • parsing tag
  • setting defaults
  • snapshotting
    • building snapshot...                           version=1.0.1-1
  • checking distribution directory
  • loading go mod information
    • pipe skipped                                   reason=not a go module
  • build prerequisites
  • writing effective config file
    • writing                                        config=dist/config.yaml
  • building binaries
    • building                                       binary=dist/client_windows_amd64_v1/client.exe
    • building                                       binary=dist/client_linux_amd64_v1/client
    • took: 2m17s
  • archives
    • creating                                       archive=dist/project_name_client_1.0.1-1_linux_amd64.tar.gz
    • creating                                       archive=dist/project_name_client_1.0.1-1_windows_amd64.zip
    • took: 6s
  • calculating checksums
  • storing release metadata
    • writing                                        file=dist/artifacts.json
    • writing                                        file=dist/metadata.json
  • release succeeded after 2m22s
$ cd dist/
$ echo "Finding out current release version" # collapsed multi-line command
Finding out current release version
$ echo "Finding out package ID for current merge request at version '${RELEASE_VERSION}'" # collapsed multi-line command
Finding out package ID for current merge request at version '1.0.1-1'
$ echo "Deleting potentially existing package for current merge request at package ID '${MR_PACKAGE_ID}'" # collapsed multi-line command
Deleting potentially existing package for current merge request at package ID '252'
$ find . -type f -iname "*${RELEASE_VERSION}*" -exec bash -c \ # collapsed multi-line command
Uploading "./project_name_1.0.1-1_checksums.txt" to package registry
{"message":"201 Created"}
Uploading "./project_name_client_1.0.1-1_linux_amd64.tar.gz" to package registry
{"message":"201 Created"}
Uploading "./project_name_client_1.0.1-1_windows_amd64.zip" to package registry
{"message":"201 Created"}
Cleaning up project directory and file based variables 00:00
Job succeeded
```

[^1]: Always pin your Docker images, kids.
[^2]: This wiping is necessary to combat the aforementioned append-only upload functionality.
[^3]: Since only the archives and the checksum include the version, this seemed like a simple enough heuristic.
