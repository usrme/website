---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2024-12-31
title: No encore for 2024
draft: false
tags: ["yearly-review"]
---
## Few words

Not gonna mince any words here: 2024 was definitely a year I would have rather skipped. It's not that anything tragic happened, it was more of a "death by a thousand paper cuts" type of year with one thing happening after the other with very little respite. That should hopefully explain away the lack of a proper blog post throughout the year with only a few TILs making it in. The most major of them was having to move, _twice_! Not something that bodes well for such a creature of habit like me. By now, though, we've settled into our new home and are on our way with furnishing it, however long that may take. I have been feeling a lot better since the last move, so I'm very positive about things going forward.

## Recap

### Invest in your tools

When I made the [switch to NeoVim last year](https://usrme.xyz/posts/gleen-in-2023/#switching-to-neovim), foregoing Visual Studio Code entirely, I was using a distribution of NeoVim called [NvChad](https://nvchad.com/). Up until a few months ago that was still the case. It had everything a novice could want, with good looks to boot, but as time went on I found myself struggling to make changes to it as I thought a tool like NeoVim would be easily amenable to.

I had heard of ['kickstart.nvim'](https://github.com/nvim-lua/kickstart.nvim) before, a small starting point for one's own NeoVim configuration, but I thought that, given the amount of configuration I still had to do with NvChad, the work I would have to do just to get into a usable state would waste away far too much time. But oh, boy, how wrong was I! The accompanying code comments and the number of dotfile repositories out there from which to borrow snippets of configuration from made things a breeze. I wholeheartedly recommend anyone who has felt the same pains with NvChad (or any other distribution for that matter) to do the same!

While I started the migration from NvChad out of frustration, it made me realize the importance of investing in tools even more. I don't think it's merely enough to use whatever is out there without giving it a second thought. The way something is, how it behaves, and how it looks, is very much a distillation of the creator's mind, and nowhere does it say that we just have to be content with that. I've been writing my own tools going on a few years now (notably [Cometary](https://github.com/usrme/cometary), [Wishlist Lite](https://github.com/usrme/wishlistlite), and [GoBarChar](https://github.com/usrme/gobarchar)) and all of them were created as a desire to scratch a personal itch: whether it's because the existing tools didn't work exactly like I wanted or because I wanted to have a tangible outlet to learning something new. Though none of them have become anywhere near household names in the world of open source tools (never a goal in my mind), they're still very much important to me to have them as an extension of how I work and how I learn on a continuing basis.

Even if there isn't a gap in the market with a tool that you would want to use, but just doesn't exist (god knows there are more than a fair amount of tools out there), there's surely a case to be made that what you're working with be made better, be tailor-made for _you_. Don't be satisfied with the state of the world, don't let people tell you that there's no point in doing something, do it, if only, [because you wanted to](https://aaronfrancis.com/2024/because-i-wanted-to-12c5137c). This applies not only in the engineering realm, but in the physical space as well. You can do a whole lot more than you think you can.

On a related note: this year I also started using the terminal multiplexer Tmux and what a blast it has been! I had been holding off in the time investment, mainly because I considered it to be yet another tool to endlessly configure and more keybindings I needed to learn to make the most of it, but I gotta say that that has not been my experience at all. The amount of configuring Tmux requires is very small and the same goes for the keybindings; there are just a handful of core combinations to be more effective than your run of the mill terminal user. The sheer speed with which I am now able to context switch between projects is just astonishing to me, not that I _want_ to do it but sometimes urgent issues do come in. There is no way I would ever want to go back to any other way of navigating the command line.

My overarching point being: find out what you can do to make better use of your tools. In all likelihood, you're leaving gains on the table by not having just a small amount of curiosity.

### Falling short

Last year I said that I wanted to get my Certified Kubernetes Administrator certificate sooner rather later. Well, it's a year later and I've made no progress on that goal. Because I switched jobs, the means with which I could financially afford the certification are no longer there, but since Kubernetes is still something I'm very much active with, I am still aiming to make due on the promise to myself, _sooner rather than later_.

## Podcast listening

* Total (hours): 655
* Total (days): 27 days 7 hours
* Average per week (hours): ~12.6
* Average per day (hours): ~1.8

Might as well keep making use of [GoBarChar](https://gobarchar.usrme.xyz/?2018=355&2019=591&2020=562&2021=772&2022=706&2023=563&2024=648&title=Total%20hours%20of%20podcasts%20listened%20to):

```bash
2018     355 ███████████▍
2019     591 ███████████████████▏
2020     562 ██████████████████▏
2021     772 █████████████████████████
2022     706 ██████████████████████▊
2023     563 ██████████████████▏
2024     655 █████████████████████▏
Avg.  600.57 ███████████████████▍
Total   4204 █████████████████████████
```

From a down-year to an up-year with a 15% increase. I'm pretty sure Peter Attia's [Drive](https://peterattiamd.com/podcast/) podcast is to blame for this one; an absolute wealth of knowledge. I'm expecting 2025 to decrease because the Changelog podcast universe is retiring a lot of their podcasts that have contributed to the number of hours listened, but I will be taking on a few new ones that I hope will broaden my horizons.

## Books read

Opening [this](https://gobarchar.usrme.xyz/?2012=8&2013=6&2014=8&2015=14&2016=8&2017=6&2018=0&2019=24&2020=17&2021=21&2022=17&2023=13&2024=8) link or running `curl` against that link will get you, dear reader, the same graph:

```bash
2012       8 ████████▎
2013       6 ██████▎
2014       8 ████████▎
2015      14 ██████████████▌
2016       8 ████████▎
2017       6 ██████▎
2018       0 ▏
2019      24 █████████████████████████
2020      17 █████████████████▋
2021      21 █████████████████████▉
2022      17 █████████████████▋
2023      13 █████████████▌
2024       8 ████████▎
Avg.   11.54 ████████████
Total    150 █████████████████████████
```

I usually aim for around 10 books every year as that seems like a fairly achievable number given that I don't listen to audiobooks at all, but with the craziness that went on this year, the count is noticeably smaller than usual. I'm not at all bothered by the number itself, I just wish I had found more time to learn more. The pick of the litter is as follows:

### "The Grapes of Wrath" by John Steinbeck

I'm trying to keep in mind to read at least something in the fictional space and this was my pick for 2024. It's a book that has been referenced to no end in various forms of media, but I couldn't bring myself to actually go ahead and read it; probably my general aversion to anything that isn't popular science or anything like that.

I absolutely loved it! If the book does indeed match what it was like to be a farmer during the Great Depression, then Steinbeck has painted many a pictures of the harrowing times masterfully. For me, it was one of those books that I could not put down and I suspect it was because every success the Joads had (though there were not many) I felt as if things could be looking up for them, only to be gut-punched by another incident. And the way the punches rolled could only be described as "visceral". Do not sit this one out.

### "Scarcity Brain" by Michael Easter

I learned of this through the inimitable Peter Attia and his podcast Drive (linked above), namely his [episode](https://peterattiamd.com/michaeleaster2/) with the book's author. The book itself is yet another of those that appeal to a subset of the population that want to eek out even more productivity by getting rid of bad habits and it is genuinely insightful in many regards, but I do wonder how many people really become better versions of themselves and how many just find tidbits of information to sprinkle into conversations with others.

The book covers a wide range of topics from casinos to dieting and everything in between that pertains to our desires to want more in a world that is already filled to the brim. I suspect not all readers of "Scarcity Brain" are familiar with stoicism, but if they are, then I think they'll have far less to take away from this book. I've been exposed to stoicism going back to at least 2017 (though I suspect it's even earlier) with "A Guide to the Good Life: The Ancient Art of Stoic Joy" by William B. Irvine, which changed my outlook on life immensely. Everything from noticing what is worth our attention to making things harder in order to have more to enjoy later.

There are tons of interesting stories in the book and I definitely wouldn't have highlighted this book if it weren't for one key moment:

> About five years ago, my wife and I had a dumb argument. I wasn't backing down. She wasn't backing down. It was as if we were both sipping strong cocktails of the fundamental attribution error, overconfidence effect, and naive cynicism.
>
> During the stalemate, I vented to this friend. I explained to him in agonizing detail why I was right, why my wife was wrong, how the world would be better off if I could just get her to understand this—and did this guy have any advice for convincing her I was right?
>
> His response: “Do you want to be right or happy?”

I was absolutely floored by this and it's now constantly on my mind any time an argument arises. If for nothing else, this book might have a story in it that isn't necessarily germane to what the author set out to write about and that story might just be what actually takes this book from another source of factoids to unlocking something bigger.
