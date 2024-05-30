---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-06-29
title: Not to be afraid of GitLab's dynamic parent-child pipelines
tags: ["git", "gitlab", "jinja2"]
---
The time has finally come where I've truly needed to create a set of dynamic pipelines in GitLab, ones that can only be determined during runtime. So, what do I do? I crack open the [official documentation](https://docs.gitlab.com/ee/ci/pipelines/downstream_pipelines.html#parent-child-pipelines) and see that their example project uses something called [Jsonnet](https://jsonnet.org/), which is something I've never used before.

The example seems simple enough to mold into what I need, but fairly quickly it becomes apparent that while the saved file in GitLab's own example, and in various examples across the Internet, is saved as `.yml` indicating that it's YAML. It is actually formatted as JSON[^1]. As soon as I needed to do more complicated things like multi-line `script` blocks it became unwieldy if not impossible to work with JSON without destroying readability.

So, a lightbulb went off for my colleague. If it's supposedly YAML, but looks like JSON, and is parsed fine by GitLab then that means one should just be able to pass in a YAML file like in a regular `include`. How does one dynamically create a valid YAML file? With [Jinja2](https://palletsprojects.com/p/jinja/) of course! Since it's usually used as a library, for example within Ansible and Python, it was necessary to install an additional tool called [j2cli](https://pypi.org/project/j2cli/). After reading how to use the tool I had hoped I could just pass in a list through an environment variable, have it be looped over in a normal `for`-loop, and be done with it, but I had to first create a rudimentary INI file that contained all the elements of my list[^2] and pass that to the `j2` executable:

```shell
$ cat jobs.ini
[jobs]
job1=job1
job2=job2
$ j2 job-template.j2 jobs.ini
...
```

After that it was off to the races as I was able to replace something that far fewer people have used (i.e. Jsonnet) with something that is quite commonplace. I think if people knew that you don't have to necessarily use Jsonnet or [Dhall](https://dhall-lang.org/) or [ytt](https://carvel.dev/ytt/), as they mention in the documentation, then that would significantly lower the barriers to entry in creating more dynamic pipelines.

[^1]: Supposedly YAML is a superset of JSON, but that's neither here nor there when it comes to setting useful file extensions.
[^2]: The names of the jobs are duplicated and separated by an equals sign to make the syntax valid, otherwise `j2` complains.
