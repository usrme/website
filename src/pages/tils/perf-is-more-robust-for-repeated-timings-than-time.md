---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2021-03-25
title: "'perf' is more robust for repeated timings than 'time'"
tags: ["azure-cli", "bash", "performance"]
---
A little while ago I ran into an [issue](https://github.com/Azure/azure-cli/issues/17247 "Azure CLI issue in GitHub") with the admittedly great Azure CLI tool. The problem stemmed from the fact that one command took roughly 30 seconds to complete and a similar command, at least in terms of the end result, took only 2 seconds. In order to present a more robust case to the developers I wanted to have concrete measurements of the timings I observed while reproducing the issue.

At first I did what probably everyone else would, and that's just prefixing the commands with `time` ([man page](https://linux.die.net/man/1/time "Linux man page for 'time' command")). That quickly become ardous as I had to manually store the results of all the runs, perform basic statistical analysis myself, and then have the gall to present all that as someone who prides himself as committed to automating as much as possible.

After doing a bit of digging and finding on more than one occasion the suggestion to just script my usage with `time` I stumbled upon [Brendan Gregg's perf examples](http://www.brendangregg.com/perf.html "Brendan Gregg's Linux perf examples"). It's a page I've stumbled across before, but I must have just glossed over it due to the seemingly complex nature of the tool. You're only a single page scroll away from closing the tab if the intricacies of measuring Linux system calls isn't your jam...

This time, for some reason or another, I was determined to find a quick and easy way to repeatedly measure a single command with arbitrary parameters without having to faff about with scripting; though I do enjoy a good bikeshedding every now and then. So, I started off with the very first command in the _Counting Events_ section, which produced a very scary-looking output:

```console frame="none"
$ perf stat az tag create --resource-id {} --tags my-tag=my-value --output none

  Performance counter stats for 'az tag create --resource-id {} --tags my-tag=my-value --output none':

          1 745,00 msec task-clock:u              #    0,391 CPUs utilized          
                  0      context-switches:u        #    0,000 K/sec                  
                  0      cpu-migrations:u          #    0,000 K/sec                  
            22 231      page-faults:u             #    0,013 M/sec                  
      3 640 476 525      cycles:u                  #    2,086 GHz                      (82,98%)
        151 682 554      stalled-cycles-frontend:u #    4,17% frontend cycles idle     (83,28%)
        708 159 207      stalled-cycles-backend:u  #   19,45% backend cycles idle      (83,51%)
      5 207 185 827      instructions:u            #    1,43  insn per cycle         
                                                  #    0,14  stalled cycles per insn  (83,52%)
      1 092 641 016      branches:u                #  626,154 M/sec                    (83,05%)
        36 442 666      branch-misses:u           #    3,34% of all branches          (83,65%)

        4,465562148 seconds time elapsed

        1,586694000 seconds user
        0,128060000 seconds sys
```

While that the immediate benefit of adding an air of legitimacy to what I was presenting (only those who suffer through cryptic examples of system call reports can have that), it still didn't alleviate the smaller issue of being automatically repeatable. Looking at the `perf-stat` [man page](https://linux.die.net/man/1/perf%2Dstat "Linux man page for 'perf-stat' command") there is an obvious `-r, --repeat=<n>` option that seems to do exactly that:

```console frame="none"
$ perf stat --repeat 5 az tag create --resource-id {} --tags my-tag=my-value --output none

  Performance counter stats for 'az tag create --resource-id {} --tags my-tag=my-value --output none' (5 runs):

          1 698,30 msec task-clock:u              #    0,505 CPUs utilized            ( +-  2,39% )
                  0      context-switches:u        #    0,000 K/sec                  
                  0      cpu-migrations:u          #    0,000 K/sec                  
            22 214      page-faults:u             #    0,013 M/sec                    ( +-  0,07% )
      3 516 454 135      cycles:u                  #    2,071 GHz                      ( +-  0,24% )  (83,33%)
        144 958 565      stalled-cycles-frontend:u #    4,12% frontend cycles idle     ( +-  2,14% )  (83,30%)
        657 451 659      stalled-cycles-backend:u  #   18,70% backend cycles idle      ( +-  0,88% )  (83,32%)
      5 167 409 019      instructions:u            #    1,47  insn per cycle         
                                                  #    0,13  stalled cycles per insn  ( +-  0,08% )  (83,33%)
      1 079 991 468      branches:u                #  635,926 M/sec                    ( +-  0,15% )  (83,38%)
        35 845 403      branch-misses:u           #    3,32% of all branches          ( +-  0,35% )  (83,33%)

              3,364 +- 0,263 seconds time elapsed  ( +-  7,81% )
```

That's _much_ better, but I am still left with those pesky CPU counters that would provide no benefit to the developers tasked with solving my original issue. Though the manual doesn't explicitly say _CPU_ counters for the `-n, --null` option, it supposedly does not start _any_ counters when running the command, so it was enough for me to give it a try:

```console frame="none"
$ perf stat --repeat 5 --null az tag create --resource-id {} --tags my-tag=my-value --output none

  Performance counter stats for 'az tag create --resource-id {} --tags my-tag=my-value --output none' (5 runs):

              3,010 +- 0,101 seconds time elapsed  ( +-  3,37% )
```

I feel like a veil has been lifted! For so many years I've relied on ad hoc repeated executions of the `time` command all the while being oblivious to such a great tool such as `perf`. Hardly ever being content with anything I kept looking around and somewhere along the line I came across a [subtly different manual page](https://www.man7.org/linux/man-pages/man1/perf-stat.1.html "Different Linux man page for 'perf-stat' command") for `perf-stat`, which made me aware of an additional option called `--table` that was missing from the original manual, which displays the time for each run in a table format; the missing link in the ultimately pretty output:

```console frame="none"
$ perf stat --repeat 5 --null --table az tag create --resource-id {} --tags my-tag=my-value --output none

  Performance counter stats for 'az tag create --resource-id {} --tags my-tag=my-value --output none' (5 runs):

            # Table of individual measurements:
            2,6722 (+0,0865) #
            2,4602 (-0,1255) ##
            2,7994 (+0,2137) ##
            2,4373 (-0,1484) ##
            2,5594 (-0,0263) #

            # Final result:
            2,5857 +- 0,0677 seconds time elapsed  ( +-  2,62% )
```

After that I finally felt that I had a robust case to present with all the commands necessary to reach the same conclusion I did. I'll still probably use `time` when I need a single measurement of how quick some command runs, but I'll never go back to repeating that arcane process for repeated measurements ever again; it's way quicker to utilize a nifty alias such as `alias perfs='perf stat --null --table --repeat '`.

## Notes

* If the command or tool you are timing doesn't natively support something like `--output none` you can just use the following to redirect _everything_ to `/dev/null`: `cmd > /dev/null 2>&1`
  * This isn't an issue with commands with sparse output and few repeated runs, but becomes a major eyesore otherwise
* I am not at all sure why the output of `perf-stat` is formatted so strangely, especially with the `--table` option doing such a clean job in all other respects
  * In the original linked GitHub issue I cleaned up the formatting myself, but I really do wonder whether there's a way to automatically get the output into a nicer format
