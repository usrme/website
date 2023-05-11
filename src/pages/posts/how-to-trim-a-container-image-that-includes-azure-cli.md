---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-11-11
title: How to trim a container image that includes Azure CLI
tags: ["azurecli", "docker", "performance"]
---
I've been using Azure CLI for a couple of years now and while it's mostly great one of its biggest downsides is its size, which has been echoed in the community as well[^1] [^2]. Using Azure CLI in a simple Bash script can thus balloon the required surrounding environment to an enormous size (1.29GB for version 2.42.0). Whenever possible I try to use [their official Docker image](https://learn.microsoft.com/en-us/cli/azure/run-azure-cli-docker) to avoid time-consuming package installs in CI/CD pipelines, but this has its own costs in that the image is, in my opinion, extremely large and can take a while to pull down when the cache gets invalidated or for a layer comparison to be performed.

After seeing their [official guide](https://github.com/Azure/azure-cli/issues/19591) on how to install Azure CLI on Alpine Linux, their own [Dockerfile](https://github.com/Azure/azure-cli/blob/dev/Dockerfile), and someone's [helpful comment](https://github.com/Azure/azure-cli/issues/7387#issuecomment-926389647) about botching together a somewhat functional install, I decided to go forth and reduce the size of our image from 1.17GB, which was based on version 2.38.0 that was _only_ 1.14GB and also included [AzCopy](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10), to something more manageable.

## The nitty-gritty

I started by looking at the aforementioned Dockerfile they base their official image on and for whatever reason they use a virtual package installation (`apk add --virtual`) in their Dockerfile (surrounding cut for brevity) but then totally disregard the eventual deletion at the end despite the packages only being required for when Azure CLI is installed with `pip`:

```docker
RUN apk add --no-cache bash openssh ca-certificates jq curl openssl perl git zip \
    && apk add --no-cache --virtual .build-deps gcc make openssl-dev libffi-dev musl-dev linux-headers \
    && apk add --no-cache libintl icu-libs libc6-compat \
    && apk add --no-cache bash-completion \
    && update-ca-certificates
```

Alleviating this was step number 1 for me[^3]. The reason I'm still deleting `/var/cache/apk/*` is because I noticed a slight increase in the resulting image size if I didn't. The eagle-eyed amongst you have also noticed that I am installing `cargo`, which wasn't in the original Dockerfile. This is because I am basing this new image on `python:alpine` and `cargo` is required to build libraries such as `cryptography` on Alpine Linux:

```docker
RUN : \
    && apk add --no-cache --virtual=build cargo gcc libffi-dev linux-headers make musl-dev openssl-dev python3-dev \
    ...
    && apk del --purge build \
    && rm -rf /var/cache/apk/* \
    ...
```

Step number 2, and the most arduous one, was finding out, which were the exact [SDK libraries](https://azure.github.io/azure-sdk/releases/latest/all/python.html) that I needed to install and this mostly just boiled down to running the main Bash script, waiting for a failure for a given `az` command, and then installing the missing package using `pip`. Luckily `az` was kind enough to fairly precisely name the missing package. Thus, for a script that uses the following `az` commands:

- `account`
- `disk`
- `group`
- `login`
- `resource`
- `rest`
- `tag`

Only the following Python packages are necessary:

```docker
RUN : \
    && apk add --no-cache --virtual=build cargo gcc libffi-dev linux-headers make musl-dev openssl-dev python3-dev \
    ...
    && pip install --no-dependencies azure-cli \
    && pip install azure-cli-core \
        azure-common \
        azure-mgmt-compute \
        azure-mgmt-monitor \
        azure-mgmt-resource \
        semver \
    && apk del --purge build \
    && rm -rf /var/cache/apk/* \
    ...
```

Thanks to this significantly decreased amount of packages I was able to decrease the size of the previous image from 1.17GB to 307MB, a reduction of almost 74%! Here's the full Dockerfile that also installs AzCopy, `bash`, `coreutils`, and `jq`[^4]:

```docker
# https://github.com/Azure/azure-cli/issues/19591
# Python 3.11 isn't yet supported by Azure CLI
FROM python:3.10.8-alpine3.16

# https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10#download-azcopy
#
# curl -sLI https://aka.ms/downloadazcopy-v10-linux | grep "Location"
# -s: silent or quiet mode
# -L: follow redirections
# -I: fetch headers only
#
# These two need to be changed simultaneously, so follow
# the 'curl' command above to get up-to-date values
ARG AZ_COPY_RELEASE=release20221108
ARG AZ_COPY_VERSION=10.16.2

ENV PATH="/opt/azcopy:${PATH}" \
    PIP_DEFAULT_TIMEOUT=100 \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_NO_CACHE_DIR=off \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Virtual (i.e. named 'build') packages installed with
# 'apk add' are required to install any Azure CLI
# dependencies and are removed afterwards with 'apk del'
#
# Despite using '--no-cache' for 'apk add', not clearing
# '/var/cache/apk/*' results in a larger image
#
# bash, coreutils, jq are required by 'script.sh'
# libc6-compat is required by AzCopy
#
# azure-cli-core, azure-common, azure-mgmt-compute, azure-mgmt-monitor,
# azure-mgmt-resource, semver are required by Azure CLI to
# run all its commands within 'script.sh'
RUN : \
    && apk update \
    && apk add --no-cache --virtual=build cargo gcc libffi-dev linux-headers make musl-dev openssl-dev python3-dev \
    && apk add --no-cache bash coreutils jq libc6-compat \
    && pip install --no-dependencies azure-cli==2.40.0 \
    && pip install azure-cli-core \
        azure-common \
        azure-mgmt-compute \
        azure-mgmt-monitor \
        azure-mgmt-resource \
        semver \
    && apk del --purge build \
    && rm -rf /var/cache/apk/* \
    && wget "https://azcopyvnext.azureedge.net/${AZ_COPY_RELEASE}/azcopy_linux_amd64_${AZ_COPY_VERSION}.tar.gz" \
    && mkdir /opt/azcopy \
    && tar -xvzf "azcopy_linux_amd64_${AZ_COPY_VERSION}.tar.gz" -C /opt/azcopy --strip-components 1 \
    && rm -f "azcopy_linux_amd64_${AZ_COPY_VERSION}.tar.gz"

COPY script.sh ./
```

## Caveats

One of the things I've noticed with this is that when running, for example, `az login` it says it is unable to load several modules, but then still proceeds to log in just fine:

```shell
$ az login ...
Error loading command module 'acs': No module named 'azure.mgmt.msi'
Error loading command module 'aro': No module named 'azure.mgmt.redhatopenshift'
Error loading command module 'batch': No module named 'azure.batch'
Error loading command module 'iot': No module named 'azure.mgmt.iothub'
Error loading command module 'network': No module named 'azure.mgmt.trafficmanager'
Error loading command module 'rdbms': No module named 'azure.mgmt.rdbms'
Error loading command module 'reservations': MGMT_RESERVATIONS
Error loading command module 'sqlvm': No module named 'azure.mgmt.loganalytics'
...
```

This can be alleviated by adding `--output none` to the end of the command, but in environments where STDERR is shown regardless (I experienced this in GitLab's pipelines) an additional `2> /dev/null` is required to be tacked onto the end.

Another minor thing was that I had to use a Tailscale exit node for work-related reasons and left it on, which caused `docker-slim` to time out. Just something to bear in mind if you, dear reader, experience the same.

## The folly of man

Despite the wonderful tool ['dive'](https://github.com/wagoodman/dive) reporting an efficiency score of 98%, I still wanted to learn more about how to decrease the size further, which lead me to [DockerSlim](https://dockersl.im/) and tangentially [Slim Container Starter Pack](https://github.com/slimdevops/slim-containers/). I'm not a 100% if I understood the documentation of Docker Slim correctly, but what I gathered was that I was supposed to, for this scenario where there isn't a single package that I run but rather a hodge-podge of various binaries and libraries, include all the relevant paths and binaries, and give it a script to run so that it can understand what are the bits and pieces it needs to keep in the minified container image. I set up a small script (`slim-exec.sh`) that to my understanding should cover the entire usage:

```shell
#!/bin/bash

az --version
azcopy --version
./script.sh --version

az login <actual options and values>
./script.sh <actual options and values>
```

I then ran `docker-slim` with all the bits and pieces given to it:

```shell
docker-slim build \
    --http-probe=false \
    --continue-after=exec \
    --include-shell \
    --include-bin=/bin/bash \
    --include-bin=/opt/azcopy/azcopy \
    --include-bin=/usr/local/bin/az \
    --include-path=/usr/local/lib/python3.10 \
    --include-path=/script.sh \
    --exec-file=slim-exec.sh \
    --target=registry/existing-image:latest
```

It ran just fine and I thought I was off to the races, but then I saw that now that when `slim-exec.sh` was passed to it the size was a far cry from what I had hoped and when opening the container to run the same commands again there were errors all over the place:

```
...
cmd=build info=results by='1.06X' size.original='307 MB' size.optimized='291 MB' status='MINIFIED'
...
```

I guess this means that I should just take the 307MB I managed to conjur up before and leave it be[^5]...

## The road often travelled

I knew I'd be back at it, and not even 24 hours later I managed to get the above incantations to work, though the results are unremarkable. The `slim-exec.sh` was good as it was and didn't require any modifications, but the paths that I included got a complete overhaul. So much so that I switched to the `--include-path-file` option with a file (`slim-paths.txt`), which included all the relevant paths and files:

```
/bin/cat
/bin/cp
/bin/mkdir
/bin/mktemp
/bin/rm
/bin/sed
/lib/libssl.so.1.1
/script.sh
/root/.azcopy
/usr/bin/basename
/usr/bin/cut
/usr/bin/install
/usr/bin/jq
/usr/bin/tr
/usr/lib/libonig.so.5
/usr/lib/libonig.so.5.3.0
/usr/local/lib/python3.10
```

All of those paths are required by either `script.sh` (e.g. `cat`, `cp`, `mkdir`, etc.), the executables it calls (e.g. `az`, `jq`, etc.) or libraries _those_ executables depend on (e.g. `libonig`). For transitive dependencies that were actually symbolic links I had to include both the source (i.e. `/usr/lib/libonig.so.5`) and the target (i.e. `/usr/lib/libonig.so.5.3.0`) as I couldn't figure out how to ensure that links were followed otherwise.

To find the relevant executables I just followed what the script did, noted any calls it made, and just ran `which <executable name>` in the original image. Doing it that way made me miss a couple, so I made another pass by searching for ` | ` (that's a space followed by a pipe operator followed by a space) to find any stragglers. There's maybe a clever call to `strace` here that might have unearthed everything automatically, but I am way too deep at this point to be side-tracked, and the script itself is only around 400 lines.

The invocation of `docker-slim` now looked like this:

```shell
docker-slim build \
  --http-probe=false \
  --continue-after=exec \
  --include-shell \
  --include-bin=/opt/azcopy/azcopy \
  --include-path-file=slim-paths.txt \
  --exec-file=slim-exec.sh \
  --target=registry/existing-image:latest
```

And everything worked as expected! To very little fanfare though as the resulting image was just 295MB compared to the 307MB from the previous iteration. Going through all that most definitely isn't worth a paltry 4% reduction. There is one more avenue I wanted to explore and that was installing everything Python-related in a virtual environment and including that instead. I made minor changes to the Dockerfile above and rebuilt the so called "fat" image:

```diff
diff --git a/Dockerfile b/Dockerfile
index 5a68ac8..08c078c 100644
--- a/Dockerfile
--- b/Dockerfile
@@ -14,7 +14,7 @@ FROM python:3.10.8-alpine3.16
ARG AZ_COPY_RELEASE=release20221108
ARG AZ_COPY_VERSION=10.16.2

-ENV PATH="/opt/azcopy:${PATH}" \
+ENV PATH="/opt/azcopy:/venv/bin:${PATH}" \
     PIP_DEFAULT_TIMEOUT=100 \
     PIP_DISABLE_PIP_VERSION_CHECK=on \
     PIP_NO_CACHE_DIR=off \
@@ -40,8 +40,10 @@ RUN : \
     && apk update \
     && apk add --no-cache --virtual=build cargo gcc libffi-dev linux-headers make musl-dev openssl-dev python3-dev \
     && apk add --no-cache bash coreutils jq libc6-compat \
-    && pip install --no-dependencies azure-cli==2.40.0 \
-    && pip install azure-cli-core \
+    && python -m venv /venv \
+    && source venv/bin/activate \
+    && venv/bin/pip install --no-dependencies azure-cli==2.40.0 \
+    && venv/bin/pip install azure-cli-core \
         azure-common \
         azure-mgmt-compute \
         azure-mgmt-monitor \
```

I modified `slim-paths.txt` to reflect this change and also added AzCopy's binary to clean up the call to `docker-slim`:

```diff
diff --git a/slim-paths.txt b/slim-paths.txt
index f4e9c85..99648f7 100644
--- a/slim-paths.txt
--- b/slim-paths.txt
@@ -5,6 +5,7 @@
 /bin/rm
 /bin/sed
 /lib/libssl.so.1.1
+/opt/azcopy/azcopy
 /script.sh
 /root/.azcopy
 /usr/bin/basename
@@ -14,4 +15,4 @@
 /usr/bin/tr
 /usr/lib/libonig.so.5
 /usr/lib/libonig.so.5.3.0
-/usr/local/lib/python3.10
+/venv
```

Again, fired up `docker-slim`:

```shell
$ docker-slim build \
  --http-probe=false \
  --continue-after=exec \
  --include-shell \
  --include-path-file=slim-paths.txt \
  --exec-file=slim-exec.sh \
  --target=registry/existing-image:latest
...
cmd=build info=results size.original='325 MB' size.optimized='290 MB' status='MINIFIED' by='1.12X'
...
```

The original size is 325MB because now there is a virtual environment where one wasn't before. Other than though, the size is now 290MB[^6]! Does it work though? Nope:

```shell
$ docker run --rm -it registry/existing-image.slim az login
Auto upgrade failed. name 'exit_code' is not defined
Traceback (most recent call last):
  File "/venv/lib/python3.10/site-packages/msal/oauth2cli/authcode.py", line 16, in <module>
    from http.server import HTTPServer, BaseHTTPRequestHandler
ModuleNotFoundError: No module named 'http.server'

During handling of the above exception, another exception occurred:
...
ModuleNotFoundError: No module named 'BaseHTTPServer'

During handling of the above exception, another exception occurred:
...
ModuleNotFoundError: No module named 'xml.etree'
```

Even after adding `--system-site-packages` to when the virtual environment was initialized makes no difference as probably the entirety of `/usr/local/lib/python3.10` needs to be made available, which will just increase the size again. I'll cut my losses and move on, but speaking of size...

## Super size me

At what point does the size get out of control? I created a run-of-the-mill virtual environment locally, installed every dependency, but after installing each checked the size of the directory using `du`:

```shell
$ pip install -qqq --no-dependencies azure-cli==2.40.0 && echo "After '--no-dependencies azure-cli'" && du -hc | tail -n 1
pip install -qqq azure-cli-core && echo "After 'azure-cli-core'" && du -hc | tail -n 1
pip install -qqq azure-common && echo "After 'azure-common'" && du -hc | tail -n 1
pip install -qqq azure-mgmt-compute && echo "After 'azure-mgmt-compute'" && du -hc | tail -n 1
pip install -qqq azure-mgmt-monitor && echo "After 'azure-mgmt-monitor'" && du -hc | tail -n 1
pip install -qqq azure-mgmt-resource && echo "After 'azure-mgmt-resource'" && du -hc | tail -n 1
pip install -qqq semver && echo "After 'semver'" && du -hc | tail -n 1
After '--no-dependencies azure-cli'
48M     total
After 'azure-cli-core'
97M     total
After 'azure-common'
98M     total
After 'azure-mgmt-compute'
203M    total
After 'azure-mgmt-monitor'
216M    total
After 'azure-mgmt-resource'
256M    total
After 'semver'
257M    total
```

So if you can get away with not using `azure-mgmt-compute` you might potentially save almost 100MB, which is a type of code golf I am most definitely not going to be doing[^7].

[^1]: <https://github.com/Azure/azure-cli/issues/7387>
[^2]: <https://github.com/Azure/azure-sdk-for-python/issues/11149>
[^3]: I'm using a fairly odd syntax for specifying `RUN`, but I feel this results in better readability and cleaner diffs when changing lines.
[^4]: I actually goofed with this as I forgot to [pin the dependencies](https://usrme.xyz/tils/it-makes-sense-to-pin-even-patch-versions-of-dependencies/) and just got bit by that...
[^5]: I predict another edit to this post in the future...
[^6]: Consider that exaltation to be ironic.
[^7]: Place your bets, ladies and gentlemen!
