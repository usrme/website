+++
date = 2021-03-25T07:33:00Z
draft = true
title = "Time commands better with 'perf'"

+++
A little while ago I ran into an [issue](https://github.com/Azure/azure-cli/issues/17247 "Azure CLI issue in GitHub") with the admittedly great Azure CLI tool. The problem stemmed from the fact that one command took roughly 30 seconds to complete and a similar command, at least in terms of the end result, took only 2 seconds. In order to present a more robust case to the developers I wanted to have concrete measurements of the timings I observed while reproducing the issue.

At first I did what probably everyone else would, and that's just prefix the commands with `time` ([man page](https://linux.die.net/man/1/time "Linux man page for 'time' command")). That quickly become ardous as I had to manually store the results of all the runs, perform basic statistical analysis myself, and then have the gall to present all that as someone who prides himself as committed to automating as much as possible. 