---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2023-12-31
title: Glee in 2023
draft: false
tags: ["yearly-review"]
---
## Few words

Yes, I'll most likely try to rhyme every yearly review post going forward, you'll definitely find the whimsy in it as much as I do. I considered leaving this section out completely as most of what has transpired this year has been of the personal kind, but rest assured, dear definitely existing reader, all is well! A year to look back on, for sure, but a year that is making me excited for all that is yet to come.

## Recap

### Writing more code

Continuing with last year's [Learning Go](https://usrme.xyz/posts/hullabaloo-with-2022/#learning-go) section, I've continued to double down on learning it, so much so that I requested to take the lead solo to rewrite a critical system at work that was previously a mix of Go _and_ Python to just Go. On top of that I've kept trying to improve [Cometary](https://github.com/usrme/cometary) and [Wishlist Lite](https://github.com/usrme/wishlistlite), both of which serve as a wonderful test bed in a familiar codebase. (Wishlist Lite also got [its first feature request](https://github.com/usrme/wishlistlite/issues/30) in July that wasn't by me, which just made my heart melt!) During all of that Go writing I also wanted to get a little bit of Python in and released a [Powerline segment for Tailscale](https://github.com/usrme/powerline-tailscale).

There is also a secret Go project in the works that is a little less derivative in terms of its core functionality. Whereas both of the Go projects above where inspired by existing solutions and were just adapted to fit my own needs (and to learn!), this one will be something I haven't yet come across. I hope to write this in a way where at the end I feel like I can really hold my own with Go.

### Learning Kubernetes

After falling down the rabbit hole of learning about [Crossplane](https://www.crossplane.io/), it became clear that my underlying knowledge of Kubernetes itself needs to be deeper and thus I started re-reading "Kubernetes: Up and Running", along with new ones, such as "Core Kubernetes" and the "Certified Kubernetes Administrator (CKA) Study Guide" by Benjamin Muschko. The latter will hopefully serve me well in actually becoming a Certified Kubernetes Administrator as I've also took it upon myself to complete the certification sooner rather than later. I decided for the official certification route as I remember that when I did my [LPIC-1](https://www.lpi.org/our-certifications/lpic-1-overview/) certification way back when, it actually taught me things that would have taken far longer to unearth on my own through day-to-day usage. I'm hoping the same will hold true for the CKA certification in 2024.

### Switching to (Neo)Vim

At one point during this summer, I completely switched away from Visual Studio Code over to using NeoVim as my editor of choice, and while it's difficult for me to quantify any increase or decrease in productivity, it is definitely a choice I do not regret. I was finally pushed over the edge by [ThePrimeagen's "Vim As Your Editor" series](https://www.youtube.com/playlist?list=PLm323Lc7iSW_wuxqmKx_xxNtJC_hJbQ7R) and [Dreams of Code's video](https://www.youtube.com/watch?v=Mtgo-nP_r8Y) on turning Vim into a fully featured IDE. It does take a lot more effort to properly configure compared to Visual Studio Code so that all the magic-y bits like type hints and code refactorings work, to say nothing of learning the actual motions to navigate within Vim, but once you get through the initial slog that may take a couple of weeks, everything starts to feel like second nature. I've really enjoyed that I can now far more comfortably carry myself both on my personal machine and on any machine I SSH into where Vi(m) is most likely always present.

ThePrimeagen has recommended several times that since the Vim way of doing things does require configuring and tinkering, it's best not to fall into the trap of doing every bit of configuration right away, but to instead write down any annoyances or feature requests, if you will, that you may have and tackle them piece by piece at a later date. That is something I'm going to be doing going into the new year, as from time to time, there are some actions that I wish I had a better way of doing, and if I don't write them down and commit to learning them, I'll just keep on doing them in the semi-automatic way, which is far from ideal given all the power (Neo)Vim has.

## Podcast listening

* Total (hours): 563
* Total (days): 23 days 11 hours
* Average per week (hours): ~10.8
* Average per day (hours): ~1.5

Down a whopping 20% from last year's 706 hours, I think there's still hope for me yet! I really wish I could find out personal viewing statistics from YouTube. Might be slightly terrifying though...

## Books read

Borrowing a page out of Tom MacWright's book, going forward I'm going to be showing visually the number of books I have read. He had a lovely bar chart that was created automatically in [his year in review](https://macwright.com/2023/12/28/year-in-review.html), but I'm going down the text-based path and am presenting the [data in ASCII](https://alexwlchan.net/2018/ascii-bar-charts/)[^1]. The earliest data point is from 2012, which is when I started noting down the books I read.

```bash
2012  ▏    8 ████████▎
2013  ▏    6 ██████▎
2014  ▏    8 ████████▎
2015  ▏   14 ██████████████▌
2016  ▏    8 ████████▎
2017  ▏    6 ██████▎
2018  ▏    0 ▏
2019  ▏   24 █████████████████████████
2020  ▏   17 █████████████████▋
2021  ▏   21 █████████████████████▉
2022  ▏   17 █████████████████▋
2023  ▏   13 █████████████▌
Total ▏  142
Avg.  ▏   12 ████████████▌
```

2018 was the year I met the love of my life, so it seems as though I didn't have the inclination to read even a single book... Anyway, down to 13 from 17, as compared to last year, but as always a handful really stood out to me (on top of [the one I already reviewed](https://usrme.xyz/posts/book-review-how-minds-change-by-david-mcraney/)) that I've laid out below.

### "Immune" by Philipp Dettmer

Though I'm not one to buy YouTube-channel-specific merchandise, this book being authored by the originator of [Kurzgesagt](https://www.youtube.com/@kurzgesagt) piqued my curiosity immensely, as I could honestly say that the chosen topic—our immune system—was (and is still, to an extent) a mystery to me, something I desperately wanted to remedy. This is one of those books that, despite just being an introduction to the vastness of immunology, leaves you feeling like you've had a whole other world opened to you after reading it! It is absolutely awe-inspiring how well Philipp put pen to paper and how incredibly the digital artwork that so many people have come to know and love from Kurzgesagt was dutifully brought over to the physical world.

### "Determined" by Robert M. Sapolsky

I think the first time I came across not treating free will as a given was in the context of considering whether those who have been punished to the fullest extent of the law for their crimes should be given leniency, given that, in all likelihood, they have had a rough go of it from the moment they were conceived. To me, it's not out of this world to consider this, as it stands to reason that in one way or another, we are who we are because of all the big and small moments that have led up to this very point; some have just had the misfortune to constantly be in the throes of both the micro and the macro. The author sheds light on what the micro and macro really entail and the current science behind it, and while it may sting to consider yourself less of the autonomous being you think you are, it's humbling on a more grand scale, and I honestly believe it will change the way you see the world.

### "The Lincoln Highway" by Amor Towles

I mentioned [last year](https://usrme.xyz/posts/hullabaloo-with-2022/#books-read) that after reading "A Gentleman in Moscow," I bought his other books as well: "Rules of Civility" and "The Lincoln Highway." I read the former first, and while Amor's way of captivating the reader is still strong, it wasn't anywhere near enough of a page-turner (for me) as "A Gentleman in Moscow" was. Maybe that's to be expected given that "Rules of Civility" was his first publication. His latest might just top all his previous books in my eyes. Instead of the story taking place over several years, decades even, this one unwinds its spool of literary genius over the course of just 10 days, which seems all the more amazing given that the physical book is thicker than an encyclopedia! I just could not stop reading one more chapter, and for a work of fiction, any book really, that has to be worth something. Here's to hoping his next one won't take five years to produce!

[^1]: This is now its own thing that you too can use! Check out the [GoBarChar project](https://github.com/usrme/gobarchar) for more information.
