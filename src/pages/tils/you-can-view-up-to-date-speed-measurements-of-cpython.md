---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2021-11-14
title: You can view up-to-date speed measurements of CPython
---
Nearing the end of Brett Cannon's [post on premature optimizations](https://snarky.ca/programming-language-selection-is-a-form-of-premature-optimization/ "Tall, Snarky Canadian - Selecting a programming language can be a form of premature optimization")
I came upon the [Codespeed](https://github.com/tobami/codespeed/ "A web application to monitor and analyze the performance of your code") project and its use case for [CPython](https://speed.python.org/ "Python Speed Center"). I had no idea that there was such a wonderfully automatic and up-to-date way to find out what the historical performances of various Python benchmarks have been. As an example, it's evident that the `python_startup` benchmark has seen an improvement of roughly 15% (calculating that lead me [off at a tangent](https://math.stackexchange.com/questions/1227389/what-is-the-difference-between-faster-by-factor-and-faster-by-percent "Mathematics Stack Exchange - What is the difference between faster by factor and faster by percent?"), but let's ignore that), going from 0.0151 seconds to 0.0127 seconds from October 15, 2021 to November 11, 2021:

![](/screenshot-2021-11-16-at-11-30-59-python-speed-center-timeline.png)

This is the kind of thing that if you wanted to verify by yourself would most likely cost you loads of time and be a source of a lot of headaches, unless you're already familiar with the required tooling, so this seems great as something of a concrete reference.

One of the things that stood out to me was in the **Executables** section: what on earth is `lto-pgo`? As one might have guessed it's two acronyms:

* LTO: Link Time Optimization
* PGO: Profile Guided Optimization

I'm not savvy enough to even begin explaining what both of those do exactly and will just defer to what the [official documentation](https://docs.python.org/3/using/configure.html?highlight=lto#performance-options "Configure Python - Performance options") says and leave a [Stack Overflow answer](https://stackoverflow.com/a/41408261 "Stack Overflow - what does --enable-optimizations do while compiling python?") as well:

> Configuring Python using `--enable-optimizations --with-lto` (PGO + LTO) is recommended for best performance.

So, the Python Speed Center page uses a custom compilation of CPython that is optimized for the best performance, is constantly compiled against the latest revisions, and then ran through various benchmarks. Neat!
