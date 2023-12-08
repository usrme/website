---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2020-12-05
title: How to stash every changed file separately with readable names
tags: ["bash", "diffing", "git"]
---
In [my last foray](https://usrme.xyz/posts/quickly-generating-patch-files-for-every-changed-file/) into not using Git entirely correctly I dabbled with generating patch files from changed files as a way to quickly store the state within a repository and being able to excise that state piece by piece elsewhere.

Looking back now it was a bit ham-handed and in all honesty done more for the sake of breaking my blog's dry spell. But this time! Oh, this time there even may be _some_ value in what I'm about bring forth.

***

[Git-stash](https://www.git-scm.com/docs/git-stash) is the _de facto_ cool way to store state within a repository without branching or committing, and ever the _ingénieur_ I have devised of a way to automatically stash every file separately. This comes with an added bonus of being able to tell which stash relates to which file.

Before getting to the meat of the matter I should mention that I am aware of the `-p|--patch` option to `git stash [push]`, which allows you to interactively select hunks, but I do not see this as solving the same "problem" of quickly dumping the state, moving on, and being able to restore one's mental context when coming back without too much work.

You ready? Don't blink:

`git status -s | cut -d " " -f 3 | xargs -I {} git stash push {} -m "{}"`

Here's what everything does:

* show the working tree status in the [short-format](https://git-scm.com/docs/git-status#_short_format) with `git status -s`;
* cut the third field using space as the separator with  `cut -d " " -f 3` leaving just the file names;
* iterate over each of the file names using [xargs](https://manpage.me/?q=xargs) with `xargs -I {} git stash push {} -m "{}"`, where:
  * `xargs -I {}` means that the following Git sub-command will be executed for each line of input and arguments replaced where deemed necessary.

Now, when listing the contents of the stash we can see each changed file as a separate entry in the stash that can be acted upon:

```bash
> git stash list
stash@{0}: On master: Dockerfile.az
stash@{1}: On master: Dockerfile
```

Whereas previously if you had just done `git stash --all` to push everything to the stash, then your stash would have ended up looking like this:

```bash
> git stash list
stash@{0}: WIP on master: 9baefb6 Add bells and whistles
```

And you would have had to, as far as I know, popped or applied it all at once. That's a definite no-no in the eyes of this Git novice. Something that can be aliased to result in the following seems much cleaner:

```bash
> alias gsd
alias gsd='git status -s | cut -d " " -f 3 | xargs -I {} git stash push {} -m "{}"'
> gsd
Saved working directory and index state On master: Dockerfile
Saved working directory and index state On master: Dockerfile.az
```

Two parting tidbits if you didn't already know:

* you can view the patch form of any given entry by executing `git stash show -p [stash@{N}]`, where if you don't provide the optional name of the entry it will default to the one at the top of the list, namely `stash@{0}`:

```bash
> git stash show -p stash@{0}
diff --git a/Dockerfile.az b/Dockerfile.az
index 9342daa..622a007 100644
--- a/Dockerfile.az
--- b/Dockerfile.az
@@ -6,6 +6,7 @@ ARG AZ_COPY_VERSION=10.7.0
 ARG VIRTUAL_ENV=/root/env
 
 ENV PATH="/opt/azcopy:${PATH}"
+ENV KEY=value
 
 RUN apk update && \
     apk add \
```

* you can either `pop` or `apply` everything back to the working tree with this one-liner (not gonna make a separate post about that, I swear):

```bash
> git stash list | cut -d ":" -f 1 | xargs -I {} git stash pop
On branch master
Your branch is up to date with 'origin/master'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   Dockerfile.az

no changes added to commit (use "git add" and/or "git commit -a")
Dropped refs/stash@{0} (8767774d2e4244871116b16c7a79259abb1749a3)
On branch master
Your branch is up to date with 'origin/master'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   Dockerfile
        modified:   Dockerfile.az

no changes added to commit (use "git add" and/or "git commit -a")
Dropped refs/stash@{0} (d8240956a6bb8ca581b0d1d8ab5bda9b9f14441e)
```

***

Thanks to [Jemma Issroff's wonderful blog post](https://jemma.dev/blog/git-stash), which made me not be afraid of stashing as much as I was before!
