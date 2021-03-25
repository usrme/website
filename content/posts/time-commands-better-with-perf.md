+++
date = 2021-03-25T07:33:00Z
draft = true
title = "Time commands better with 'perf'"

+++
A little while ago I ran into an [issue](https://github.com/Azure/azure-cli/issues/17247 "Azure CLI issue in GitHub") with the admittedly great Azure CLI tool. The problem stemmed from the fact that one command took roughly 30 seconds to complete and a similar command, at least in terms of the end result, took only 2 seconds. In order to present a more robust case to the developers I wanted to have concrete measurements of the timings I observed while reproducing the issue.

At first I did what probably everyone else would, and that's just prefix the commands with `time` ([man page](https://linux.die.net/man/1/time "Linux man page for 'time' command")). That quickly become ardous as I had to manually store the results of all the runs, perform basic statistical analysis myself, and then have the gall to present all that as someone who prides himself as committed to automating as much as possible.

After doing a bit of digging and finding one more than one occasion the suggestion to just script my usage with `time` I stumbled upon [Brendan Gregg's perf examples](http://www.brendangregg.com/perf.html "Brendan Gregg's Linux perf examples"). It's a page I've stumbled across before, but I must have just glossed over it due to the seemingly complex nature of the tool. You're only a single page scroll away from closing the tab if the intricacies of measuring Linux system calls isn't your jam...

This time, for some reason or another, I was determined to find a quick and easy way to repeatedly measure a single command with arbitrary parameters without having to faff about with scripting; though I do enjoy a good bikeshedding every now and then. So, I started off with the very first command in the _Counting Events_ section, which produced a very scary-looking output:

**TODO**: add output of `perf stat az tag create ...`

While that the immediate benefit of adding an air of legitimacy to what I was presenting (we all know how important that is), it still didn't alleviate the smaller issue of being automatically repeatable. Looking at the `perf-stat` [man page](https://linux.die.net/man/1/perf%2Dstat "Linux man page for 'perf-stat' command") there is an obvious `-r, --repeat=<n>` option that seems to do exactly that:

**TODO**: add output of `perf stat --repeat 5 az tag create ...`

That's _much_ better, but I am still left with the presence of those pesky CPU counters that would provide no benefit to the developers tasked with solving my original issue. Though the manual doesn't explicitly say _CPU_ counters for the `-n, --null` option, it supposedly does not start _any_ counters, so it was enough for me to give it a try:

**TODO**: add output of `perf stat --repeat 5 --null az tag create ...`

I feel like a veil has been lifted! For so many years I've relied on ad hoc repeated executions of the `time` command all the while being oblivious to such a great tool such as `perf`.

Somewhere along the line I came across a [subtly different manual page](https://www.man7.org/linux/man-pages/man1/perf-stat.1.html "Different Linux man page for 'perf-stat' command") for `perf-stat`, which made me aware of an additional option called `--table` that displays the time for each run in a table format; the missing link in the ultimately pretty output:

**TODO**: add output of `perf stat --repeat 5 --null --table az tag create ...`