---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-12-04
title: About the funky 'scanelf' command in Dockerfiles
tags: ["bash", "chatgpt", "docker"]
---
I've now ran into this funky `scanelf` command in enough Dockerfiles[^1][^2] that I got curious about what it actually means:

```bash
scanelf --needed --nobanner --recursive /usr/local \
    | awk '{ gsub(/,/, "\nso:", $2); print "so:" $2 }' \
    | sort -u \
    | xargs -r apk info --installed \
    | sort -u
```

I had initially wanted to do this myself by building up each of the commands in the pipeline, but I also wanted to mess around with the latest hotness, which is [ChatGPT](https://chat.openai.com/chat), which can do a lot of crazy code-related things out of the box. So, I just asked it:

> **Me**: Explain this code:
>
> `scanelf --needed --nobanner --recursive /usr/local | awk '{ gsub(/,/, "\nso:", $2); print "so:" $2 }' | sort -u | xargs -r apk info --installed | sort -u`
>
> **ChatGPT**:
> This code uses a combination of Linux command line tools to list all shared libraries (also known as "shared objects," or "SOs") that are required by the executables in the `/usr/local` directory. Here is a breakdown of what each command does:
>
> `scanelf`: This command scans the specified directory (`/usr/local` in this case) for ELF (Executable and Linkable Format) files, which are the executables used in Linux systems. The `--needed` and `--nobanner` options are specified to include only the shared objects that are required by the executables, and to exclude the command's own output banner. The `--recursive` option tells scanelf to search for executables in the `/usr/local` directory and all of its subdirectories.
>
> `awk`: This command processes the output of `scanelf` and reformats it to be more readable. The `awk` script replaces all commas in the second column of the input (which contains a list of required shared objects) with newline characters and the string "so:", and then prints the resulting string. This allows each shared object to be printed on a separate line.
>
> `sort -u`: This command sorts the output of `awk` alphabetically and removes any duplicate entries. The `-u` option stands for "unique."
>
> `xargs -r apk info --installed`: This command takes the output of the previous sort command and uses it as input to the `apk` command, which is used to manage applications on Android systems. The `apk info` subcommand is used to display information about installed applications. The `--installed` option tells `apk` to only show information about applications that are currently installed on the system. The `xargs` command is used to run `apk info` for each shared object listed in the input. The `-r` option stands for "no-run-if-empty" and prevents `xargs` from running `apk info` if the input is empty.
>
> `sort -u`: This is the same as the previous sort command, but it is applied to the output of `apk info` to sort the application names alphabetically and remove any duplicates.
>
> Overall, this code is useful for determining which applications on an Android system require a particular shared object. It can be helpful for troubleshooting or for identifying potential conflicts between different applications.

The only thing that it seemingly got wrong was the bit about `apk` being Android-related, which isn't technically wrong, but was in this context. As far as I gathered from my own investigations this command isn't helpful for identifying conflicts, but to ensure that run-time dependencies exist for a given application. Even when I tried to give it more context about being related to Dockerfiles instead, it still insisted on Android:

> **Me:** How is that code relevant for Dockerfiles?
>
> **ChatGPT**:
>
> A Dockerfile is a text file that contains instructions for building a Docker image. It is used to define the environment and dependencies for a Docker container. The code shown in the previous example has nothing to do with Dockerfiles or with building Docker images. It is a script that uses Linux command line tools to list shared objects required by executables in a directory, which has no relevance to Dockerfiles.
>
> However, if you were building a Docker image for an application that runs on an Android system, you might want to include instructions in your Dockerfile to install the `pax-utils` package (which contains the `scanelf` command used in the code) in order to be able to run the code as part of your build process. In this case, the code could potentially be useful for determining which shared objects are required by the executables in your container, which could be helpful for troubleshooting or for identifying potential conflicts between different containers.

I've seen people use ChatGPT for some amazing things[^3] and can't wait to poke around more! Here are a few non-AI links related to the original topic:

- <https://www.mankier.com/1/scanelf>
- <https://www.mankier.com/1/gawk>
- <https://wiki.gentoo.org/wiki/Hardened/PaX_Utilities>
- <https://en.wikipedia.org/wiki/Executable_and_Linkable_Format>
- <https://sourcegraph.com/github.com/thorgate/django-project-template/-/blob/%7B%7Bcookiecutter.repo_name%7D%7D/Dockerfile-django.production?L26>
- <https://unix.stackexchange.com/questions/120015/how-to-find-out-the-dynamic-libraries-executables-loads-when-run>

[^1]: <https://github.com/Azure/azure-cli/blob/c6abf9e43d5474373a8875f0cfef81cc95240f1f/Dockerfile>
[^2]: <https://medium.com/c0d1um/building-django-docker-image-with-alpine-32de65d2706>
[^3]: <https://news.ycombinator.com/item?id=33851460>
