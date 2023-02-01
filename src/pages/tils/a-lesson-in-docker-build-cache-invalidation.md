---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-03-15
title: A lesson in Docker build cache invalidation
---
While I had known that if you change a line a Dockerfile then the layer corresponding to that instruction (e.g. `FROM`, `RUN`, `COPY`, etc) will cause that layer to be recreated in the resulting image. Remembering only that I had completely forgotten that the order of instructions matters just as well, especially for caching. Consider this:

```docker
FROM python:3.10.2-slim

# https://docs.python.org/3/using/cmdline.html#cmdoption-u
ENV PYTHONUNBUFFERED=1 \
    # https://docs.python.org/3/using/cmdline.html#cmdoption-B
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    VENV_PATH="/app/.venv"

ENV PATH="${VENV_PATH}/bin:${PATH}"

WORKDIR /app

COPY . .

RUN : \
    && python -m venv "$VENV_PATH" \
    && pip install -r requirements.txt

CMD ["gunicorn", "--config", "gunicorn.conf.py", "start:app"]
```

Since this Dockerfile is using an older syntax it has no way to cache the packages I am installing with `pip`, which means that every invocation of `docker build` means another round of downloading packages off of PyPI. In this particular scenario it meant that despite only changing the application code I was spending 30-40 seconds to recreate the image; terribly time-consuming.

After reading Itamar Turner-Trauring's article on speeding up 'pip' downloads[^1] I had modified my Dockerfile to be like this:

```diff
+# syntax = docker/dockerfile:1.3
 FROM python:3.10.2-slim
 
 # https://docs.python.org/3/using/cmdline.html#cmdoption-u
@@ -15,8 +16,8 @@
 
 COPY . .
 
-RUN : \
-    && python -m venv "$VENV_PATH" \
+RUN --mount=type=cache,target=/root/.cache \
+    python -m venv "$VENV_PATH" \
     && pip install -r requirements.txt
 
 CMD ["gunicorn", "--config", "gunicorn.conf.py", "start:app"]
```

After prepending `DOCKER_BUILDKIT=1` to `docker build` there was still no cache to speak of after several invocations despite only changing the application code. Looking at it now it's painfully obvious that of course it couldn't have worked.

It all has to do with the fact that every layer is a delta of the previous layer. So, the layer `RUN` is stacked on top of the `COPY` layer and when the `COPY` layer changes it means that the `RUN` layer needs to be changed as well to reflect those changes. With `COPY` (and `ADD`) according to the official best practices for leveraging build cache[^2]:

> [...] the contents of the file(s) in the image are examined and a checksum is calculated for each file. [...] During the cache lookup, the checksum is compared against the checksum in the existing images. If anything has changed in the file(s), such as the contents and metadata, then the cache is invalidated.

So, the cache for the `pip` packages actually worked, but only if I made no changes to the application code and didn't invalidate _that_ layer's (i.e. `COPY`) cache, which would have made the cache of `RUN` be invalid thus requiring it to download the packages again. A quick modification to the Dockerfile and it was off to the races:

```diff
WORKDIR /app
 
-COPY . .
+COPY requirements.txt .
 
 RUN --mount=type=cache,target=/root/.cache \
     python -m venv "$VENV_PATH" \
     && pip install -r requirements.txt
 
+COPY . .
+
 CMD ["gunicorn", "--config", "gunicorn.conf.py", "start:app"]
```

As a bonus, the same type of caching can be leveraged for something like `apt` as well[^3]:

```docker
RUN  --mount=type=cache,target=/var/cache/apt \
    apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
    && rm -rf /var/lib/apt/lists/*
```

[^1]: https://pythonspeed.com/articles/docker-cache-pip-downloads/
[^2]: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#leverage-build-cache
[^3]: https://vsupalov.com/buildkit-cache-mount-dockerfile/
