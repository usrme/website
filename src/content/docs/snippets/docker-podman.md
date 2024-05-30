---
title: Docker/Podman
description: Docker and Podman oneliners.
---
## Parse lines from an arguments file to separate parameters for building

From [here](https://ilhicas.com/2018/11/03/docker-build-with-build-arg-wit-multiple-arguments.html)

```bash
podman build -t foo \
  $(while IFS= read -r line; do args+="--build-arg ${line} "; \above
  done < <(cat .arg); \
echo "$args"; unset args) .
```

## Remove all 'exited' containers

```shell
podman rm $(podman ps --all -q -f status=exited)
```

## Build and run container based on Dockerfile in current context

```shell
podman build -t foo . && podman run --rm -it foo
```

## Prune everything that shouldn't exist anymore without any confirmation

```shell
podman system prune -a -f
```

## Remove all images except `latest`

```shell
podman images | grep -v "latest" | tail -n +2 | awk '{ print $3 }' | xargs --no-run-if-empty podman rmi
```

## Possible improvement when executing `RUN` within a Dockerfile

Benefit is that when a specific line fails, then the error message is much more concise as opposed to the standard method of using ampersands.

```dockerfile
RUN set -eu; \
    python3 -m venv venv; \
    venv/bin/pip install -r requirements.txt; \
    venv/bin/pip install -r requirements-dev.txt; \
    echo 'Venv creation + requirements installation: OK';
```

## Remove dangling `<none>:<none>` images

```shell
docker rmi $(docker images -f "dangling=true" -q)
```
