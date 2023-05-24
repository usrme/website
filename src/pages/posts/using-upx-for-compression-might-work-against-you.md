---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2023-05-24
title: Using UPX for compression might work against you
draft: true
tags: ["go", "performance"]
---
So I'm reading Hacker News, as one does[^1], about [starting a Go project in 2023](https://news.ycombinator.com/item?id=36046662) and one [commenter advises against using UPX](https://news.ycombinator.com/item?id=36048555) (as does the original author, to a degree). [UPX](https://github.com/upx/upx) is something I only have a passing familiarity with in one of my pet projects—[Wishlist Lite](https://github.com/usrme/wishlistlite)—where I use it to trim down the resulting binary. It's not that the binary's size would be anything of real significance to begin with, but it just seemed a low enough hanging fruit that I would be foolish _not_ to go for it. The contrarian from the comment above made me reconsider though. Here's why.

[^1]: Far too often perhaps, but that's neither here nor there.
