---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2021-11-25
title: A simple way to wait for pipelines triggered with 'curl' in GitLab CI/CD
---
Let's set up an example scenario:

* there are multiple resources that need to be acted on;
* there exists a pipeline that copies a resource from one location to another;
* that pipeline takes as its input a resource ID;
* for every resource we need to trigger that pipeline;
* we need to wait for _all_ jobs in that pipeline to finish before continuing.

To create the right number of downstream pipelines per resource all that's really necessary is something akin to the following:

```yaml
upstream-job:
  script:
    - |
      echo "Creating pipelines"
      for resource_id in "${RESOURCE_IDS[@]}"; do
        response=$(curl -s -X POST \
          -F token="$CI_JOB_TOKEN" \
          -F ref=master \
          -F variables[RESOURCE_ID]="$resource_id" \
          https://gitlab.example.com/api/v4/projects/1/trigger/pipeline)
        resource_name=$(echo "$resource_id" | rev | cut -d "/" -f 1 | rev)
        echo "Created pipeline for '${resource_name}':"
        echo "* $(jq -r '.web_url' <<< "$response")"
      done
```

> Note the use of the [CI_JOB_TOKEN variable](https://docs.gitlab.com/ee/ci/jobs/ci_job_token.html "GitLab CI/CD job token documentation") that is hugely beneficial over manually creating other types of tokens that might always (more on that later) not even be necessary.

The downside of the loop above is that once those requests are sent out the job is considered to be successful and the pipeline carries on with any other stages/jobs, but this is not desired when you want other jobs to wait for the successful result of each of those downstream jobs. When creating normal [multi-project pipelines](https://docs.gitlab.com/ee/ci/pipelines/multi_project_pipelines.html "GitLab CI/CD multi-project pipelines documentation") or [parent-child pipelines](https://docs.gitlab.com/ee/ci/pipelines/parent_child_pipelines.html "GitLab CI/CD parent-child pipelines documentation") (i.e. ones that don't have dynamic input based on an array) there's the possibility of using `strategy: depend`, which should do what's necessary and wait for all downstream jobs, but even when you put the code above into a separate YAML, include that, add the `strategy`, it still doesn't actually wait.

When researching for a solution to this I came across the [pipeline-trigger project](https://gitlab.com/finestructure/pipeline-trigger "GitLab project: finestructure / pipeline-trigger"), which seems to do exactly what's required, but I was wary of depending on an external piece of code unless it did something I absolutely couldn't live without; something that might always change.

So, in keeping the fine art of starting from the basics alive I created a seemingly simple way of holding back the job that created the downstream jobs until all of them have succeeded[^1][^2]:

```yaml
upstream-job:
  script:
    - |
      unique_resource_ids_count=$(printf "%s\n" "${RESOURCE_IDS[@]}" | sort -u | wc -l)
      if [[ ${#RESOURCE_IDS[@]} -ne $unique_resource_ids_count ]]; then
        echo "There are duplicate resources as the total amount (${#RESOURCE_IDS[@]}) does not equal unique amount (${unique_resource_ids_count})"
        echo 'Exiting'
        exit 1
      fi
    - |
      echo "Creating pipelines"
      declare -A RESOURCE_PIPELINES
      for resource_id in "${RESOURCE_IDS[@]}"; do
        response=$(curl -s -X POST \
          -F token=$CI_JOB_TOKEN \
          -F ref=master \
          -F variables[RESOURCE_ID]=$resource_id \
          https://gitlab.example.com/api/v4/projects/1/trigger/pipeline)
        resource_name=$(echo "$resource_id" | rev | cut -d "/" -f 1 | rev)
        echo "Created pipeline for '${resource_name}':"
        echo "$(jq -r '.web_url' <<< "$response")"
        pipeline_id=$(jq -r '.id' <<< "$response")
        RESOURCE_PIPELINES[$resource_name]+="$pipeline_id"
      done
    - |
      required_success_count="${#RESOURCE_PIPELINES[@]}"
      current_success_count=0
      declare -A PIPELINE_STATUSES
      echo "Waiting for ${required_success_count} pipelines to succeed:"
      while [[ $required_success_count -ne $current_success_count ]]; do
        echo "--- BEGIN FOR LOOP ---"
        for resource in "${!RESOURCE_PIPELINES[@]}"; do
          if [[ $required_success_count -eq $current_success_count ]]; then
            break
          fi

          pipeline_id="${RESOURCE_PIPELINES[$resource]}"
          pipeline_url="https://gitlab.example.com/api/v4/projects/1/pipelines/${pipeline_id}"
          response=$(curl -s --header "PRIVATE-TOKEN: $DOWNSTREAM_REPO_READ_API_TOKEN" "$pipeline_url")
          status=$(jq -r '.status' <<< "$response")
          if [[ $status == "success" && ${PIPELINE_STATUSES[$resource]} != "success" ]]; then
            PIPELINE_STATUSES[$resource]+="$status"
            current_success_count=$((current_success_count+1))
            sleep 2
          elif [[ $status == "failed" ]]; then
            echo "Pipeline for '${resource}' failed: ${pipeline_url}"
            exit 1
          else
            sleep 5
          fi

          echo "(OK: ${current_success_count} / TOTAL: ${required_success_count}) ${status}: '${resource}'"
        done
        echo "--- END FOR LOOP ---"
      done
    - echo "All ${required_success_count} pipelines have succeeded"
```

What this logic revolves around is the use of an [associative array](https://www.gnu.org/software/bash/manual/html_node/Arrays.html#Arrays "Arrays (Bash Reference Manual)") to store both the name of the resource and its pipeline ID. This makes it easy to loop over all of the resources and be able to work with two bits of information instead of just one as you would with a normal array.

The only additional thing that needs to be done is to create a necessary [project access token](https://docs.gitlab.com/ee/user/project/settings/project_access_tokens.html#project-access-tokens "GitLab project access tokens documentation") that has `read_api` permissions **for the downstream repository** and add that as a CI/CD variable **for the upstream repository** (`$DOWNSTREAM_REPO_READ_API_TOKEN` in the code above). As far as I know, it's not possible to use the `CI_JOB_TOKEN` variable for authentication, though that would be extremely handy.

The caveats with this approach is that it is quite clunky and that it's an all or nothing endeavor in that _all_ of the downstream jobs need to succeed, which isn't a big deal for me (at the moment), but is something to keep in mind. I'm not sure whether the aforementioned "pipeline-trigger" project would remedy that either.

With the above in place it's trivial to set up follow-up jobs that gleefully wait until `upstream-job` finishes:

```yaml
follow-up-job:
  needs: ["upstream-job"]
  script: echo "Following up with important things"
```

And the same goes for jobs that might need to do clean-up:

```yaml
clean-up-job:
  rules:
    - if: $CI_COMMIT_BRANCH
      when: on_failure
  needs: ["upstream-job"]
  script: echo "Cleaning up"
```
      
[^1]: (05.01.22) Added an `if`-statement to guard against for when the number of unique resource IDs does not match the total number of resource IDs, which aims to guard against the situation where duplicates are in the list of resource IDs.

[^2]: (06.01.22) Added more robust solution to determine when to end `while` loop.
