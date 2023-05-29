---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2023-05-24
title: Using UPX for compression might work against you
draft: true
tags: ["go", "performance"]
---
So I'm reading Hacker News, as one does[^1], about [starting a Go project in 2023](https://news.ycombinator.com/item?id=36046662) and one [commenter advises against using UPX](https://news.ycombinator.com/item?id=36048555) (as does the original author, to a degree). [UPX](https://github.com/upx/upx) is something I only have a passing familiarity with in one of my pet projects—[Wishlist Lite](https://github.com/usrme/wishlistlite). It's not that the binary's size would be anything of real significance to begin with, but it just seemed a low enough hanging fruit that I would be foolish _not_ to go for it. The contrarian from the comment above made me reconsider though. Here's why.

While UPX succeeded in taking down the size of the binary from just 3.2MB when using `CGO_ENABLED=0 go build -ldflags="-s -w" -trimpath` to build, to 1.3MB after `upx --best`, it has the hidden cost of increasing memory usage when the application. For me, both in a single and multiple instance scenario. To quickly validate this I used ['ps_mem'](https://raw.githubusercontent.com/pixelb/ps_mem/master/ps_mem.py) and used the following steps:

- build Wishlist Lite (compress if already tested normal build);
- run two instances of it;
- grab the memory usage statistics for both processes;
- compare results.

For the regular build (using the command above):

```console
$ ps_mem -S -p 56986
 Private  +   Shared  =  RAM used   Swap used   Program

  2.2 MiB +   1.3 MiB =   3.6 MiB     0.0 KiB   wishlistlite
---------------------------------------------
                          3.6 MiB     0.0 KiB
=============================================

$ ps_mem -S -p 56996
 Private  +   Shared  =  RAM used   Swap used   Program

  2.1 MiB +   1.3 MiB =   3.4 MiB     0.0 KiB   wishlistlite
---------------------------------------------
                          3.4 MiB     0.0 KiB
=============================================
```

Notice how the Shared column is identical showing that the two instances are able to use a fair amount of the same bit of memory. Now, after compressing with UPX:

```console
$ ps_mem -S -p 57140
 Private  +   Shared  =  RAM used   Swap used   Program

  5.2 MiB +   0.5 KiB =   5.2 MiB     0.0 KiB   wishlistlite
---------------------------------------------
                          5.2 MiB     0.0 KiB
=============================================

$ ps_mem -S -p 57152
 Private  +   Shared  =  RAM used   Swap used   Program

  5.3 MiB +   0.5 KiB =   5.3 MiB     0.0 KiB   wishlistlite
---------------------------------------------
                          5.3 MiB     0.0 KiB
=============================================
```

[^1]: Far too often perhaps, but that's neither here nor there.
