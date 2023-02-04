---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-12-15
title: Why I moved away from Poetry for Python
tags: ["poetry", "python"]
---
Or a short story about making mistakes choosing dependencies as a beginner. Skip to the section [The fault in Poetry's stars](#the-fault-in-poetrys-stars) if thou care not for mine beautiful prose!

## Introduction

Around two years ago a CLI tool written in Bash that was heavily used really started to show its age by being increasingly hard to iterate on. Though I've seen Bash tools that are expertly written with minimal external dependencies, that can run on multiple platforms, and are well-tested[^1], I have to admit that what my colleague and I came up with originally, and were trying to keep evolving in response to feature requests, was far from that ideal. This is on top of the fact that having a truly successful Bash-based project requires:

- knowledge about fairly esoteric aspects, maybe things like working with [indirect references](https://tldp.org/LDP/abs/html/ivr.html)
- thinking from the perspective of writing tests as well, which is not _that_ common for that language[^2]
- in-house buy-in to be able to support ongoing development and maintenance[^3]
- up-to-date documentation, reference and otherwise
- easy upgrade and deployment procedures

My colleague and I form a sort of ragtag team where neither of us has done software development to any meaningful level, so now caring for a tool that developers depend on a daily basis was wholly new to both of us.

By the time we realized the fault in _our_ stars we did not have most of those aforementioned requirements met. Thus we, with me at the helm, started the project of graduating this CLI tool to a more fully-featured language. We decided upon Python because it:

- lends itself much better to writing more complex business logic with proper data structures without losing readability
- allows for far easier packaging[^4]
- has better testing capabilities
- has automatic documentation tools
- is beginner-friendly[^5]
- has a wide ecosystem of libraries and frameworks
- has help available for solving common problems
- allowed us to rely more on in-house expertise for reviewing code that doesn't rely on [Bashisms](https://mywiki.wooledge.org/Bashism)

While Python gets a lot of flak for being slow, I knew that we weren't going to be hamstrung by the GIL ([Global Interpreter Lock](https://docs.python.org/3/glossary.html#term-global-interpreter-lock)) given that we were working with a CLI tool that did not have the speed requirements that an end-user-facing application might have, thus little to no parallelization would need to be relied upon. The tool mostly works with creating resources in Azure so most of the time spent would be waiting on Azure instead of the tool itself.

---

The ecosystem of Python libraries and frameworks is _vast_, and even within the narrower space of creating CLI tools there is a wide array of options to choose from. A decision I knew was important, but didn't realize how much so[^6]. Between all the options available I chose [Typer](https://github.com/tiangolo/typer) because it has a remarkably friendly documentation on how to get started and I was able to easily grasp how to take the canonical examples and form them into something required for our use case. [Click](https://github.com/pallets/click) was one of the other ones I considered, but was turned off of it by the rather excessive usage of [decorators](https://docs.python.org/3/glossary.html#term-decorator)[^7]. I also considered ['argparse'](https://docs.python.org/3/library/argparse.html) from the standard library, but shunned it due to the amount of boilerplate I thought we would have had to write. Looking back, I would now much rather opt for a little more boilerplate.

At the end of the tutorial for Typer though there is a section about [building a package](https://typer.tiangolo.com/tutorial/package/) and what does he recommend? Why it's [Poetry](https://python-poetry.org/), Python's dependency management and packaging made easy!

## The fault in Poetry's stars

As with a simple Bash script, it started out simple enough and things mostly just worked. Over time though I started running into issues: Poetry would take an inordinately long time to resolve the required dependencies to install a package. Perhaps it was a one-off type of thing? Unfortunately not. It got to the point where I actively avoided using `poetry` to install dependencies and resorted to adding the dependency in `pyproject.toml` by hand, installing it locally using `pip`, and exporting the requirements as I did before[^8]. At that point I felt invested enough that I just couldn't ditch it entirely, that would mean a whole bunch of busywork just to root it out[^9].

Then I ran into weird scenarios where asking Poetry to update a single dependency would update all of the dependencies, despite the CLI tool specifically showing how to update a single one. There was also the issue of using Poetry when building a container image using Docker in that it breaks caching... Since the dependencies are housed in not only `poetry.lock`, they are also housed in `pyproject.toml`, which also houses, among other properties, the version of your package. Now every time you bump the version the cache gets invalidated due to the file being effectively new[^10]. This can be worked around, but oh god what on earth is going on!

Fast-forward a year or so with me living with this hot mess that I don't even want to justify having around anymore and am kicking myself every time I even remotely come into contact with it. So, I stumble upon a video from Anthony Sottile [about why he will never use Poetry](https://www.youtube.com/watch?v=Gr9o8MW_pb0). In it he has his own list of grievances with one in particular standing out to me: the fact that the Poetry developers [intentionally introduced failures](https://github.com/python-poetry/poetry/pull/6297) to people's CI/CD pipelines to motivate them to move away from Poetry's legacy installer... Though we didn't rely on the installer in our pipelines, this was the death knell for the continued use of Poetry.

## Making do without

After reading James Bennett's wonderful [post on boring dependency management for Python](https://www.b-list.org/weblog/2022/may/13/boring-python-dependencies/) I was able to rather quickly swap out Poetry for something much more universal and with far less kludges in it. A real relief and a real lesson in thinking twice in adding additional dependencies to project's where they perhaps aren't even needed.

I get why Poetry exists and I am sure its developers are decent folk who are actively trying to improve the state of the Python world, and they can no doubt run circles around me with their programming prowess, but given the slew of issues with it and viable alternatives with far less drudgery[^11], what are the workflows where life with Poetry is so much better than life without it?

Truly interested in finding out as I am sure it's making a lot of people's lives easier by some metrics given its popularity. Surely it's not just a case of people hopping on a bandwagon and living with a sunk-cost fallacy...

[^1]: A good example is a tool called ['nb'](https://github.com/xwmx/nb).
[^2]: I did try to write tests when most of the tool hadn't seen any new features in a couple of months, but tacking on [BATS](https://github.com/bats-core/bats-core) after-the-fact was a hill that was just too big to climb for me. This is definitely _not_ the case when one opts for a more hard-line TDD approach and starts writing tests from the get-go.
[^3]: At the time of starting the original project buy-in wasn't a factor as working in a start-up environment required getting something usable out quickly.
[^4]: What was previously a somewhat loosely held set of scripts could now be installed as a whole Python package.
[^5]: This was especially relevant as neither I nor my colleague came with a professional software development background.
[^6]: Quite possibly due to my inexperience at the time.
[^7]: They also have this sort of "magic" quality that can make reasoning about them difficult in terms of explaining their validity to others and to even write tests for them.
[^8]: Remind me: why am I using Poetry again?
[^9]: It would have been very easy if I had just taken the time to do it.
[^10]: More information and a resolution [here](https://pythonspeed.com/articles/poetry-vs-docker-caching/)
[^11]: [Hatch](https://hatch.pypa.io/latest/) and [PDM](https://pdm.fming.dev/latest/) come to mind with PDM really standing out to me, but I've become so jaded at this point that I'm not even sure what enormous benefit it would have to bring that I'd actually start using it.
