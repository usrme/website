---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2024-06-02
title: Improving the GitHub Actions experience with CUE
draft: true
tags: ["cicd", "github", "yaml"]
---
## Introduction

It's always YAML and there's seemingly no end in sight when it comes to relying on it to configure anything and everything. Don't get me wrong though, I find it way more readable than JSON and way more accessible than TOML in terms of support within programming languages and when working on the command line. At a point it all starts to fall apart and that point usually arrives when the number of lines and/or files increases, which tends to happen when more complicated configurations are needed.

## Pipelines make the world go around

Like it or not, tools like [Dagger](https://dagger.io) and [Earthly](https://earthly.dev) still aren't prevalent enough[^1] where the industry as a whole could move away from YAML[^2], thus whether it's Azure DevOps, GitLab or GitHub, the _lingua franca_ continues to be YAML.

[^1]: I've tried them on a proof-of-concept level and both have their upsides and downsides, but I ultimately decided against them due to it not being immediately apparent to me how I could easily template either tools' resulting files.
[^2]: Jenkins sure did try to make [Jenkinsfiles](https://www.jenkins.io/doc/book/pipeline/jenkinsfile/) a thing prior to the proliferation of other CI/CD platforms, but there doesn't seem to be a lot of love for that format.
