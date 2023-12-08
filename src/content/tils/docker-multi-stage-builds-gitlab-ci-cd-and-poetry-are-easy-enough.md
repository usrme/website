---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2021-12-08
title: Docker multi-stage builds, GitLab CI/CD, and Poetry are easy enough
tags: ["cicd", "docker", "gitlab", "poetry", "python"]
---
After upgrading one of the many development dependencies in a Python project I ran into an [issue](https://github.com/python-poetry/poetry/issues/4493 "GitHub.com  python-poetry/poetry issue: ModuleNotFoundError: No module named 'platformdirs' when doing poetry install --dev ") where Poetry wasn't able to install dependencies as it could before:

```
Step 4/4 : RUN poetry install --no-dev
 ---> Running in fc4ff2783ec4
Traceback (most recent call last):
  File "/usr/local/bin/poetry", line 5, in <module>
    from poetry.console import main
  File "/usr/local/lib/python3.9/site-packages/poetry/console/__init__.py", line 1, in <module>
    from .application import Application
  File "/usr/local/lib/python3.9/site-packages/poetry/console/application.py", line 7, in <module>
    from .commands.about import AboutCommand
  File "/usr/local/lib/python3.9/site-packages/poetry/console/commands/__init__.py", line 4, in <module>
    from .check import CheckCommand
  File "/usr/local/lib/python3.9/site-packages/poetry/console/commands/check.py", line 2, in <module>
    from poetry.factory import Factory
  File "/usr/local/lib/python3.9/site-packages/poetry/factory.py", line 18, in <module>
    from .repositories.pypi_repository import PyPiRepository
  File "/usr/local/lib/python3.9/site-packages/poetry/repositories/pypi_repository.py", line 33, in <module>
    from ..inspection.info import PackageInfo
  File "/usr/local/lib/python3.9/site-packages/poetry/inspection/info.py", line 25, in <module>
    from poetry.utils.env import EnvCommandError
  File "/usr/local/lib/python3.9/site-packages/poetry/utils/env.py", line 23, in <module>
    import virtualenv
  File "/usr/local/lib/python3.9/site-packages/virtualenv/__init__.py", line 3, in <module>
    from .run import cli_run, session_via_cli
  File "/usr/local/lib/python3.9/site-packages/virtualenv/run/__init__.py", line 7, in <module>
    from ..app_data import make_app_data
  File "/usr/local/lib/python3.9/site-packages/virtualenv/app_data/__init__.py", line 9, in <module>
    from platformdirs import user_data_dir
ModuleNotFoundError: No module named 'platformdirs'
```

Reading [finswimmer's answer](https://github.com/python-poetry/poetry/issues/4493#issuecomment-916771927) in the issue above brought to light that my usage of `poetry config virtualenvs.create false`[^1], while functional for the time being, had been erroneous and was now breaking things. Among other things, this lead me down a path of trying to get things to work using [pipx](https://pypa.github.io/pipx/ "pipx - Install and Run Python Applications in Isolated Environments"), but to no avail. Throughout _that_ process I stumbled upon [Michael Oliver's multi-stage builds Dockerfile](https://github.com/python-poetry/poetry/discussions/1879#discussioncomment-216865), which seemed promising. Now, I really didn't want to switch from how I currently had my builds set up, both in the Dockerfiles and in GitLab CI/CD, but I was at a loss and decided to go for it.

Prior to this I had been using the [builder pattern](https://blog.alexellis.io/mutli-stage-docker-builds/ "Alex Ellis - Builder pattern vs. Multi-stage builds in Docker") for Docker, but there are also [multi-stage builds](https://docs.docker.com/develop/develop-images/multistage-build/ "Docker Docs: Use multi-stage builds") and those serve to greatly reduce complexity (and bring forth other improvements) when using multiple Dockerfiles. Let's see an example. Here is the first Dockerfile that contains the prerequisite software[^2]:

```docker
# Dockerfile.prereq
FROM python:3.9.7-slim-buster

RUN : \
    && apt-get update \
    && apt-get install -y \
      curl \
      git \
      jq \
      openssh-client \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --disable-pip-version-check --no-cache-dir poetry

COPY pyproject.toml poetry.lock ./

# Skip creation of virtual environment: https://github.com/python-poetry/poetry/issues/4557
RUN poetry config virtualenvs.create false && poetry install --no-root --no-dev
```

And here's the Dockerfile that's supposed to set up the project itself:

```docker
# Dockerfile
FROM prereq:master

WORKDIR /var/opt/group

COPY . ./project

RUN cd project && poetry install --no-dev
```

Setting those up as separately running jobs was easy as well in GitLab CI/CD[^3] [^4]:

```yaml
stages:
- build-prerequisites
- publish

prerequisites:
  stage: build-prerequisites
  script:
    - docker build . --file Dockerfile.prereq --tag "prereq:$CI_COMMIT_REF_SLUG"
    - docker push "prereq:$CI_COMMIT_REF_SLUG"
  rules:
    - if: "$CI_COMMIT_BRANCH"
      changes:
        - Dockerfile.prereq
        - poetry.lock

docker-image:
  stage: publish
  script:
    - docker build . --file Dockerfile --tag "project:$CI_COMMIT_REF_SLUG"
    - docker push "project:$CI_COMMIT_REF_SLUG"
  rules:
    - if: "$CI_COMMIT_BRANCH"
      changes:
        - Dockerfile.prereq
        - Dockerfile
        - poetry.lock
        - pyproject.toml
        - "**/*.py"
```

Implementing the same with a multi-stage build is as follows, note how only a single Dockerfile is required[^5]:

```docker
FROM python:3.9.7-slim-buster as python-base

ENV PYTHONUNBUFFERED=1 \
    # Prevents Python creating '.pyc' files
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    # https://python-poetry.org/docs/configuration/#using-environment-variables
    POETRY_VERSION=1.1.12 \
    # Poetry install location
    POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_NO_INTERACTION=1 \
    PROJECT_PATH="/var/opt/group/project" \
    VENV_PATH="/var/opt/group/project/.venv"

ENV PATH="${POETRY_HOME}/bin:${VENV_PATH}/bin:${PATH}"

FROM python-base as prerequisites
RUN : \
    && apt-get update \
    && apt-get install -y \
      curl \
      git \
      jq \
      openssh-client \
    && rm -rf /var/lib/apt/lists/*

# Installing this way respects 'POETRY_VERSION' and 'POETRY_HOME' environment variables
# https://python-poetry.org/docs/master/#installation
RUN curl -sSL https://install.python-poetry.org | python3 -

WORKDIR $PROJECT_PATH
COPY poetry.lock pyproject.toml ./

RUN poetry install --no-root --no-dev

FROM prerequisites
WORKDIR $PROJECT_PATH

COPY . .

RUN poetry install --no-dev
```

And the requisite GitLab CI/CD setup:

```yaml
stages:
- build-prerequisites
- publish

prerequisites:
  stage: build-prerequisites
  variables:
    DOCKER_BUILDKIT: 1
  script:
    - |
      docker build . \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --cache-from "prereq:$CI_COMMIT_REF_SLUG" \
        --target prerequisites \
        --tag "prereq:$CI_COMMIT_REF_SLUG"
    - docker push "prereq:$CI_COMMIT_REF_SLUG"
  rules:
    - if: "$CI_COMMIT_BRANCH"
      changes:
        - Dockerfile
        - poetry.lock

docker-image:
  stage: publish
  variables:
    DOCKER_BUILDKIT: 1
  script:
    - |
      docker build . \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --cache-from "project:$CI_COMMIT_REF_SLUG" \
        --cache-from "prereq:$CI_COMMIT_REF_SLUG" \
        --tag "project:$CI_COMMIT_REF_SLUG"
    - docker push "project:$CI_COMMIT_REF_SLUG"
  rules:
    - if: "$CI_COMMIT_BRANCH"
      changes:
        - Dockerfile.prereq
        - Dockerfile
        - poetry.lock
        - pyproject.toml
        - "**/*.py"
```

So much better! While there a lot of seemingly scary environment variables that seem to bulk up the Dockerfile, they are nothing out of this world and serve to make the actual `RUN` instructions more concise, in my opinion.

[^1]: [This](https://usrme.xyz/tils/it-makes-sense-to-pin-even-patch-versions-of-dependencies/ "Üllar Seerme - It makes sense to pin even patch versions of dependencies") is where the configuration option was used initially and what it basically did was to install packages globally as the environment was isolated through containerization anyway.

[^2]: Pay no mind to the other mistakes... The most of egregious of which is not pinning the version of `poetry` I was installing.

[^3]: It's not actually necessary to define `--file Dockerfile` if the file exists within the targeted build directory because `docker` defaults to it; shown just to be explicit.

[^4]: The `CI_COMMIT_REF_SLUG` variable is used instead of hard-coding `master` to support creating images off of different branches as well.

[^5]: If you make use of the additional metadata fields in the `pyproject.toml` file, such as the version number that gets changed regularly, then you might want to read [Itamar Turner-Trauring's article on Docker, Poetry, and caching](https://pythonspeed.com/articles/poetry-vs-docker-caching/)
