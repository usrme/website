---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-08-17
title: To use 'git bisect' to find when something was fixed in CPython
tags: ["bash", "diffing", "git", "python"]
---
A colleague of mine recently stumbled upon an error in a Python script that uses [asynchronous I/O](https://docs.python.org/3/library/asyncio.html):

```
Traceback (most recent call last):
  File "script.py", line 175, in <module>
    asyncio.run(multiple_commands(progress, nsg_resource_ids, args.lock))
  File "/usr/lib64/python3.9/asyncio/runners.py", line 44, in run
    return loop.run_until_complete(main)
  File "/usr/lib64/python3.9/asyncio/base_events.py", line 647, in run_until_complete
    return future.result()
  File "script.py", line 81, in multiple_commands
    return await asyncio.gather(*tasks)
  File "script.py", line 40, in single_command
    async with limit:
  File "/usr/lib64/python3.9/asyncio/locks.py", line 14, in __aenter__
    await self.acquire()
  File "/usr/lib64/python3.9/asyncio/locks.py", line 417, in acquire
    await fut
RuntimeError: Task <Task pending name='Task-12' coro=<single_command() running at script.py:40> 
cb=[_gather.<locals>._done_callback() at /usr/lib64/python3.9/asyncio/tasks.py:767]>
got Future <Future pending> attached to a different loop
```

This was only apparent in the latest version of Python 3.9, namely 3.9.13, but not with the latest version at 3.10.6. Curious as I am I didn't want to just respond with "Well, just use a newer version of Python," but rather find out which version _exactly_ is the one with the fix.

While I was able to just install Python 3.9 on my Fedora-based system using [DNF](https://docs.fedoraproject.org/en-US/fedora/latest/system-administrators-guide/package-management/DNF/), installing more specific patch versions of Python didn't seem feasible. Not with a simple `dnf install` at least. I considered just pulling down the [relevant container images](https://hub.docker.com/_/python/), which very readily support even alpha releases of Python, but I really didn't want to faff about with potential issues that would only reveal themselves in containers and not on my own system.

I was reminded of [Anthony Sottile's video](https://www.youtube.com/watch?v=2ETZsYF5c7s) about how to make a virtual environment from CPython's source and got to work to just manually testing each patch version starting from 3.10.4[^1]. These are steps I used down until 3.10.0:

* clone CPython repository: `git clone git@github.com:python/cpython.git`
  * this will take a while the first time around
* navigate into it: `cd cpython`
* check out relevant version (e.g. 3.10.4): `git checkout tags/v3.10.4`
* create directory for upcoming build of Python: `mkdir prefix`
* run configuration script targeting that directory: `./configure --prefix "${PWD}/prefix"`
* build Python according to the number of available processors: `make -s -j8`
  * this will take a while depending on the host system
  * find out number of processors with: `grep "processor" /proc/cpuinfo | wc -l`
* install Python into previously created directory: `make install`
  * missing dependencies [may need to be installed](https://devguide.python.org/getting-started/setup-building/#build-dependencies) beforehand
    * if dependencies were installed, then `prefix` directory needs to be deleted and `./configure` and `make` need to be ran again
* confirm Python version:

```console frame="none"
$ ./prefix/bin/python3.10 --version
Python 3.10.4
```

* create virtual environment using that version of Python: `./prefix/bin/python3.10 -m venv venv3.10.4`
* activate virtual environment: `source venv3.10.4/bin/activate`
* navigate to project's directory with failing script
* install requirements: `pip install -r requirements.txt`
* run script: `python3 script.py`

Seeing the same traceback as shown above would have indicated that the version was still faulty in regards to executing this script. I used these exact same steps to divine that 3.10.0a2 was buggy but 3.10.0a3 wasn't.

There are 285 commits between those two versions and I _really_ didn't want to find the culprit using the methodology above as it would have just been too time-consuming. Luckily, since I've pretty much watched all of his explainer videos and knew this, Anthony Sottile had made a [video about finding regressions with 'git bisect'](https://www.youtube.com/watch?v=C2C7FTI8nB4) that I was reminded of. This paired with this [blog post](https://interrupt.memfault.com/blog/git-bisect) by Shiva Rajagopal resulted in me creating a nifty helper script that `git bisect` could use automatically:

```bash
#!/usr/bin/env bash

PROJECT_DIR="<absolute path to failing script's directory>"

git show -s --format="%h %s %ci"

rm -rf prefix/ bisect_venv/
mkdir prefix

echo "* Configuring"
./configure --prefix "${PWD}/prefix" > /dev/null 2>&1 || exit 125

echo "* Compiling"
make -s -j8 > /dev/null 2>&1 || exit 125

echo "* Installing"
make install > /dev/null 2>&1 || exit 125

echo "* Creating virtual environment"
./prefix/bin/python3 -m venv bisect_venv

echo "* Activating virtual environment"
# shellcheck source=/dev/null
source bisect_venv/bin/activate

export PATH="${PWD}/bisect_venv/bin:${PROJECT_DIR}/venv3.10/bin:${PATH}"

pushd "$PROJECT_DIR" > /dev/null 2>&1 || exit 125

pip install -r requirements.txt > /dev/null 2>&1 || exit 125

output=$(python3 script.py 2>&1)
echo "$output"

if grep -q "RuntimeError" <<< "$output"; then
  popd > /dev/null 2>&1 && echo -e "* Unfixed\n" && exit 1
else
  popd > /dev/null 2>&1 && echo -e "* Fixed\n" && exit 0
fi
```

With this at the ready I just had to start the bisection using the following commands[^2]:

* `git bisect start --term-new=fixed --term-old=unfixed`
* `git bisect fixed v3.10.0a3`
* `git bisect unfixed v3.10.0a2`
* `git bisect run bash -c "! ./bisect.sh"`

I spent a lot of time just trying pretty much an identical script, but using `git bisect run ./bisect.sh` instead, which resulted in the entire run not finding anything despite a manual flow of marking individual commits as either "fixed" or "unfixed" working as expected. It turns out that when trying to find a _good_ commit (i.e. where something was fixed) as opposed to a bad one means that the result of the helper script (i.e. its exit code) needs to be negated[^3]. This isn't entirely intuitive to me and if I hadn't found that then I might still be fiddling with the damn thing.

Either way that negation makes the bisection work like a charm and made me find the commit that fixed the issue fairly quickly (around 15-20 minutes of continuous builds, installs, etc.):

```console frame="none"
$ git bisect run bash -c "! ./bisect.sh"
...
0ec34cab9dd4a7bcddafaeeb445fae0f26afcdd1 is the first fixed commit
commit 0ec34cab9dd4a7bcddafaeeb445fae0f26afcdd1
Author: Yurii Karabas <1998uriyyo@gmail.com>
Date:   Tue Nov 24 20:08:54 2020 +0200

    bpo-42392: Remove loop parameter form asyncio locks and Queue (#23420)
    
    Co-authored-by: Andrew Svetlov <andrew.svetlov@gmail.com>

 Lib/asyncio/locks.py                               |  69 ++----
 Lib/asyncio/mixins.py                              |  21 ++
 Lib/asyncio/queues.py                              |  20 +-
 Lib/asyncio/tasks.py                               |   2 +-
 Lib/test/test_asyncio/test_events.py               | 242 ---------+-----------
 Lib/test/test_asyncio/test_locks.py                | 205 ---++------------
 Lib/test/test_asyncio/test_pep492.py               |  26 +--
 Lib/test/test_asyncio/test_queues.py               | 152 ---++--------
 Lib/test/test_asyncio/utils.py                     |  16 +-
 .../2020-11-20-14-01-29.bpo-42392.-OUzvl.rst       |   2 +
 10 files changed, 304 insertions(+), 451 deletions(-)
...
```

But what was required to fix the failing script? It was just a matter of moving the initialization of `asyncio.Semaphore` to the function that `asyncio.run()` calls and then passing that semaphore to each underlying task that gets created for the event loop[^4]. This is because prior to 3.10.0a3 `asyncio.Semaphore` and other primitives (e.g. `asyncio.Lock` and `asyncio.Queue`) initialized a separate event loop that was outside of the one that `asyncio.run()` created and didn't attempt to synchronize against the event loop created by `asyncio.run()` any time it created one. Moving the initialization fixed it because now both refer to the same event loop.

Addendum: it figures that a little time after going through this rigamarole [Real Python has a post](https://realpython.com/python-pre-release/) up about installing pre-release versions of Python and it seems like `pyenv` is _the_ way to go about doing that. That is definitely something I am going to keep in mind for the next time I need to do something like this.

[^1]: That version specifically because I noticed `asyncio`-related changes in the [change log](https://docs.python.org/3/whatsnew/changelog.html#python-3-10-4-final).
[^2]: These were ran from the root of the `cpython` repository.
[^3]: I discovered this through an [answer on Stack Overflow](https://stackoverflow.com/a/36157747). As one does...
[^4]: More greatness from [Stack Overflow](https://stackoverflow.com/a/55918049).
