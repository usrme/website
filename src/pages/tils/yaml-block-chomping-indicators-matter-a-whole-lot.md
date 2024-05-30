---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2021-10-27
title: YAML block chomping indicators matter a whole lot
tags: ["yaml"]
---
Given a Bash [command substitution](https://www.gnu.org/software/bash/manual/html_node/Command-Substitution.html "Command Substitution (Bash Reference Manual)") containing pipes within a GitLab CI/CD pipeline (using Runner version 14.4.0-rc1) the order of execution of some of the piped commands seemed unreliable. Consider the following to grab fixed values from a specifically formatted commit message, which is poor to begin with, but demonstrates the point just as well:

```yaml
variables:
  MESSAGE: |
    git@example.com:group/project
    subscription: sub1
    location: loc1

.shared-scripts:
  set-vars: &set-vars
    - >
      SUBSCRIPTION=$(echo "$MESSAGE" | tail -n 2 | head -n 1 | cut -d " " -f 2);
      LOCATION=$(echo "$MESSAGE" | tail -n 1 | cut -d " " -f 2);

anchored-job:
  before_script:
    - *set-vars
  script:
    - echo "'${SUBSCRIPTION}'"  # does not work
    - echo "'${LOCATION}'"  # does not work

regular-job-tail-first:
  before_script:
    - >
      SUBSCRIPTION=$(echo "$MESSAGE" | tail -n 2 | head -n 1 | cut -d " " -f 2);
      LOCATION=$(echo "$MESSAGE" | tail -n 1 | cut -d " " -f 2);
  script:
    - echo "'${SUBSCRIPTION}'"  # does not work
    - echo "'${LOCATION}'"  # does not work

regular-job-head-first:
  before_script:
    - >
      SUBSCRIPTION=$(echo "$MESSAGE" | head -n 2 | tail -n 1 | cut -d " " -f 2);
      LOCATION=$(echo "$MESSAGE" | tail -n 1 | cut -d " " -f 2);
  script:
    - echo "'${SUBSCRIPTION}'"  # works
    - echo "'${LOCATION}'"  # does not work

regular-job-more-pipes:
  before_script:
    - PROJECT=$(echo "$MESSAGE" | head -n 1 | cut -d ":" -f 2 | rev | cut -d "/" -f 1 | rev)
  script:
    - echo "'${PROJECT}'"  # works
```

While running this locally the result is deterministic, but within a CI job looking at the [debug output](https://docs.gitlab.com/ee/ci/variables/#debug-logging "GitLab CI/CD debug logging") it's apparent that the order in which the pipes are ran is not what is expected **when the first command is** `tail`:

```console
--- echo 'git@example.com:group/project
subscription: sub1
location: loc1
'
--- head -n 1
--- tail -n 2
--- cut -d ' ' -f 2
++ SUBSCRIPTION=loc1
```

Key piece is that `SUBSCRIPTION` should **not** be `loc1`, but rather `sub1`, because it should execute `tail` first and then `head`, not the other way around as it will end up targeting a totally different row in the given input. The same can be observed for the `LOCATION` variable:

```console
--- echo 'git@example.com:group/project
subscription: sub1
location: loc1
'
--- cut -d ' ' -f 2
--- tail -n 1
++ LOCATION=
```

It seems to me that the parser, or whatever is responsible, is acting differently when the first command is `tail`. This was easily remedied with switching to `grep`, which made more sense anyway and relying on only one pipe, but it's left me wary of using multiple piped operations in the future:

```yaml
.shared-scripts:
  set-vars: &set-vars
    - >
      SUBSCRIPTION=$(grep "subscription" <<< "$MESSAGE" | cut -d " " -f 2);
      LOCATION=$(grep "location" <<< "$MESSAGE" | cut -d " " -f 2);
```

Oddly enough something like this works just fine, so maybe the root cause lies in using those specific commands (i.e. `head` and `tail`):

```yaml
job1:
  before_script:
    - >
      EMAIL=$(echo "$CI_COMMIT_AUTHOR" | rev | cut -d " " -f 1 | rev);
      export EMAIL=${EMAIL:1:-1};
```

I've written up an [issue](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/28632 "GitLab.org / gitlab-runner issue: Piping into 'tail' first seems to cause out-of-order execution") for GitLab that hopefully will get a pair of more knowledgeable eyes on this matter.

***

You can read the [comment](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/28632#note_726282869 "Response in GitLab issue") where I explain a bit more, but long story short: it can be crucial to take into account the [block chomping indicators](https://yaml.org/spec/1.2.2/#8112-block-chomping-indicator "YAML v1.2 Block Chomping Indicators ") when working with multi-line variables as not stripping newlines from the end, while outputting just the same with `echo`, has the potential to throw off any piped operations that depend on the number of lines starting from the end of the variable.
