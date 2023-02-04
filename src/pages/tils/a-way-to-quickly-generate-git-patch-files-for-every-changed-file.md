---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2020-11-12
title: A way to quickly generate Git patch files for every changed file
tags: ["bash", "diffing", "git"]
---
I've recently begun using Git at a slightly higher level than I have before, which isn't saying much, and with that I've discovered how wonderful [patch files](https://www.howtogeek.com/415442/how-to-apply-a-patch-to-a-file-and-create-patches-in-linux/) are to use. With that I've wanted a way to quickly save all the changes I've made to files into patch files on a per changed file basis.

Though I am aware of [git-stash](https://www.git-scm.com/docs/git-stash) it does not quite serve my quite probably broken needs, so I wondered if there was a way to quickly get patch files created for all of the files I changed prior to, for example, completely removing the repository from my machine. Given that Git is so damn expansive in its sub-commands and various parameters, I've most likely overlooked an existing command that does what I want (and better), but let's pretend I am a unique snowflake and that no one has wanted to do this exactly this way.

Upon googling I found [Remy van Elst's blog post](https://raymii.org/s/tutorials/Bash_bits_split_a_file_in_blocks_and_do_something_with_each_block.html) about splitting a file into blocks and doing something with those blocks, which pretty much got me 90% of what I wanted without spending more time than necessary on this bike shed of a venture. Here is the code as it stands currently:

```bash
OLDIFS=$IFS
IFS=';'
blocks=$(git diff | sed -n '/diff/,/(diff|$)/ {/diff / s/^/\;/; p}')
for block in ${blocks#;}; do
    echo "$block" > $(echo "$block" | head -n 1 | rev | cut -d "/" -f 1 | rev).patch
done
IFS=$OLDIFS
```

I won't go over lines 1, 2, 3, 4, 7 as those are explained well enough in the linked blog post above. The only difference is that I am executing `git diff` and passing the word "diff" as the starting marker and `(diff|$)` as the ending marker. The ending marker can be read as: match either the word "diff" or the dollar-symbol denoting the end of the string.

The 10% that I added is in line number 5 where I just echo the contents of the `block` variable and form the name of the patch file by:

* taking the first line of the block with `echo "$block" | head -n 1`;
  * `diff --git a/my-repository/Get-Good.ps1 b/my-repository/Get-Good.ps1`
* reversing that line by piping into `rev`;
  * `1sp.dooG-teG/yrotisoper-ym/b 1sp.dooG-teG/yrotisoper-ym/a tig-- ffid`
* cutting away everything after the first forward slash by piping into `cut -d "/" -f 1`;
  * `1sp.dooG-teG`
* piping that into `rev` again to return it into its original form;
  * `Get-Good.ps1`
* and appending `.patch` to the very end to uniquely identify it as a patch file.

This works with a single changed file and with multiple, so everything that is needed is to save that code as a function within your `.bashrc` or `.bash_aliases` (the former of which is then sourced) or to run this one-liner:

```bash
OLDIFS=$IFS; IFS=';' blocks=$(git diff | sed -n '/diff/,/(diff|$)/ {/diff / s/^/\;/; p}'); for block in ${blocks#;}; do echo "$block" > $(echo "$block" | head -n 1 | rev | cut -d "/" -f 1 | rev).patch; done; IFS=$OLDIFS
```
