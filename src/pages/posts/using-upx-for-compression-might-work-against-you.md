---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2023-05-30
title: Using UPX for compression might work against you
tags: ["go", "performance"]
---
So I'm reading Hacker News, as one does[^1], about [starting a Go project in 2023](https://news.ycombinator.com/item?id=36046662) and one [commenter advises against using UPX](https://news.ycombinator.com/item?id=36048555) (as does the original author, to a degree). [UPX](https://upx.github.io/) is something I only have a passing familiarity with in one of my Go-based pet projects—[Wishlist Lite](https://github.com/usrme/wishlistlite). It's not that the binary's size would be anything of real significance to begin with, but it just seemed a low enough hanging fruit that I would be foolish _not_ to go for it. The contrarian from the comment above made me reconsider though. Here's why.

## Memory usage

While UPX succeeded in taking down the size of the binary from just 3.2MB when using `CGO_ENABLED=0 go build -ldflags="-s -w" -trimpath` to build, to 1.3MB after `upx --best`, it has the hidden cost of increasing memory usage, both in a single and multiple instance scenario. To quickly validate this I relied on ['ps_mem'](https://raw.githubusercontent.com/pixelb/ps_mem/master/ps_mem.py) and used the following steps:

- build application (compress if already tested normal build);
- run two instances of it;
- grab the memory usage statistics for both processes;
- compare results.

For the regular build (using the command above):

```console
$ ps_mem -p $(pgrep wishlistlite -d ",")
 Private  +   Shared  =  RAM used       Program

  4.5 MiB +   2.6 MiB =   7.2 MiB       wishlistlite (2)
---------------------------------
                          7.2 MiB
=================================
```

The Shared column indicates that some amount of memory is shared between the two instances. In a single instance scenario the Shared value is expectedly low:


```console
$ ps_mem -p $(pgrep wishlistlite -d ",")
 Private  +   Shared  =  RAM used       Program

  4.9 MiB +   0.5 KiB =   4.9 MiB       wishlistlite
---------------------------------
                          4.9 MiB
=================================
```

Now, after compressing with UPX in a single instance scenario:

```console
$ ps_mem -p $(pgrep wishlistliteupx -d ",")
 Private  +   Shared  =  RAM used       Program

  5.3 MiB +   0.5 KiB =   5.3 MiB       wishlistlite
---------------------------------
                          5.3 MiB
=================================
```

The memory usage has gone up somewhat, which isn't all that noticeable for an executable of an already small size, but crank up the instance count by just one and the differences are becoming more stark:

```console
$ ps_mem -p $(pgrep wishlistliteupx -d ",")
 Private  +   Shared  =  RAM used       Program

 10.5 MiB +   1.0 KiB =  10.5 MiB       wishlistlite (2)
---------------------------------
                         10.5 MiB
=================================
```

There is now almost no shared memory between the two instances as the entirety of the program needs to be loaded in order to work. This is still all very trivial in terms of memory usage given the times that we're living in and Wishlist Lite is an exceedingly simple application as well, but as evidenced the orders of magnitude can quite quickly start ramping up.

## Start-up speed

Mention of start-up speed was also mentioned, which is something I'm extremely picky about, especially for command-line programs, so I wanted to investigate that too. Since Wishlist Lite is a terminal user interface it will just display something until the user does something. To get around that I just added a simple quitting procedure right after the first draw of the interface, which would, in my eyes at least, simulate a complete start-up of the application which could also be done rapidly N number of times.

The quickest way for me to measure things these days is to use a simple [alias that relies on the 'perf' command](https://usrme.xyz/tils/perf-is-more-robust-for-repeated-timings-than-time/) and the differences between the two executables are apparent. First, here's the regular build:

```console
$ perf stat --null --table --repeat 10 ./wishlistlite

 Performance counter stats for './wishlistlite' (10 runs):

           # Table of individual measurements:
           0,03351 (-0,00763) #####
           0,04955 (+0,00841) ####
           0,05778 (+0,01664) ######
           0,03974 (-0,00139) #
           0,04125 (+0,00011) #
           0,03774 (-0,00340) ##
           0,03398 (-0,00716) #####
           0,04119 (+0,00005) #
           0,03947 (-0,00167) #
           0,03718 (-0,00396) ###

           # Final result:
           0,04114 +- 0,00233 seconds time elapsed  ( +-  5,67% )
```

And here's the compressed build:

```console
$ perf stat --null --table --repeat 10 ./wishlistliteupx

 Performance counter stats for './wishlistliteupx' (10 runs):

           # Table of individual measurements:
           0,07527 (+0,01408) ####
           0,05057 (-0,01062) #####
           0,05260 (-0,00859) ####
           0,07368 (+0,01249) ####
           0,07024 (+0,00904) ###
           0,07127 (+0,01007) ###
           0,05457 (-0,00662) ###
           0,05112 (-0,01007) ####
           0,06357 (+0,00238) #
           0,04905 (-0,01215) #####

           # Final result:
           0,06119 +- 0,00337 seconds time elapsed  ( +-  5,51% )
```

The compressed variant is roughly 50% slower according to `perf`. This is, of course, a micro benchmark, thus the real-world results might easily skew when number of executions is increased and a less noisy system is used, but there at the very least seems to be food for thought here. I also ran both through ['hyperfine'](https://github.com/sharkdp/hyperfine):

```console
$ hyperfine --warmup 10 './wishlistlite' './wishlistliteupx'
Benchmark 1: ./wishlistlite
  Time (mean ± σ):      29.8 ms ±   4.0 ms    [User: 8.6 ms, System: 8.8 ms]
  Range (min … max):    24.8 ms …  51.0 ms    94 runs
 
Benchmark 2: ./wishlistliteupx
  Time (mean ± σ):      57.8 ms ±  10.4 ms    [User: 36.0 ms, System: 11.0 ms]
  Range (min … max):    44.6 ms …  79.3 ms    40 runs
 
Summary
  './wishlistlite' ran
    1.94 ± 0.44 times faster than './wishlistliteupx'
```

## Conclusion

All of this was surprising to me and I honestly don't see the point in UPX anymore just to decrease the final artifact size when alternatives such as just creating an archive file exist. Using Wishlist Lite as an example, I was able to [remove the UPX hook from GoReleaser](https://github.com/usrme/wishlistlite/commit/6471959e02fd7fdfa3a869a058b6b669f96c16ca) and the resulting `.tar.gz` archives went up just 0.1MB in size. In scenarios where one doesn't care at all about memory or start-up speed[^2] and just want the smallest possible binary, perhaps due to the inability to uncompress _any_ archives, then UPX may be the way to go, but disregarding that there potentially seem to be some easy performance wins on the table.

---

After posting this to [Lobste.rs](https://lobste.rs/) a [commenter pointed out](https://lobste.rs/s/rdit0h/using_upx_for_compression_might_work#c_hfo1nj) that binaries compressed with UPX may be far more likely to be flagged as malware by Windows as apparently a lot of malware is also compressed with UPX. That's yet another aspect to keep in mind if that's an environment that one is working in.

[^1]: Far too often perhaps, but that's neither here nor there.
[^2]: It's interesting that on the UPX website they claim "no runtime or memory penalty for most of the supported formats".
