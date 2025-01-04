---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2025-01-04
title: Learning Laravel by building a postal code finder
tags: ["php", "laravel"]
---
## Introduction

Finding the right postal code in Estonia shouldn't be this hard, but it turns out it sort of is; annoying at the very least. After moving to our new home in 2024, I couldn't, for the life of me, remember the short and simple five-digit postal code that Estonia uses. So, every time I ended up searching for the equivalent of "postal codes" in Estonian, trying any of the top sites, and being frustrated with the experience.

Either the search field was expecting input in a very specific format (i.e. I couldn't just type the street name and building number, and get a fuzzy match of results across the country), or the results would be in an overly long list that would have to be scrolled through, or the site would present the information in a way that was far too verbose for the task at hand, or there not being a way to bookmark the found result(s). There was not a single site that I felt took the adequate time to provide such functionality in a truly user-friendly way.

Yes, I would have eventually remembered the postal code. Yes, most of the gripes were non-issues (the very specific input format still irks me). But by this point my heart was already set on creating a proper solution to the problem of querying and displaying postal codes.

As to not bury the lede any longer: enter [Sihtnumbrid](https://sihtnumbrid.ee/) (a word for "postal codes" in Estonian).

Last year it felt like the commotion around PHP was at an all-time high and I guess that spurred me on to revisit it again, which the site is written in. I had dabbled with PHP years ago back in college and I don't remember having any sort of negative experience. Nothing like the kind that gets thrown around in internet discourse whenever it gets mentioned. That's why I had no qualms giving it another look with a fresh perspective.

Since I wanted to get something tangible up and running as quickly as possible (the best way to learn, I feel), I also started looking into Laravel, something I never had experience with before. For the uninitiated: Laravel is a web framework for PHP that makes the task of creating web-based applications far easier than it otherwise would be.[^1] With those two as the pillars for the would-be site, I just needed a way to get up to speed.

## Way to success

You won't even get past the [Laravel home page](https://laravel.com/) without seeing [Laracasts](https://laracasts.com/) mentioned and it is through Laracasts that I started my journey to learn PHP again. The author, Jeffrey Way, has created a phenomenal platform to learn anything and everything related to the language and Laravel, and the surrounding ecosystem. I was quite honestly surprised at the amount of freely available series[^2] and wasted no time getting into the thick of it.

Because it had been so long since I wrote a single line of PHP, I wanted to reacquaint myself with the language and its syntax before diving into the specifics of the site I had in mind. I'm pretty sure I went through the [PHP For Beginners series](https://laracasts.com/series/php-for-beginners-2023-edition) in a week or two with all of the videos playing at 1.5x or 2x speed. Just goes to show you how much I wanted to get the thing that was in my head out into the real world. Would I recommend that series of videos to anyone else? Absolutely! I usually prefer written materials when learning, especially books, but given the amount of work put into Laracasts (and it truly shows), the way the series was structured into building a concrete project, and the availability of source materials, I didn't even think twice about jumping in.

Next, I took on the [30 Days to Learn Laravel series](https://laracasts.com/series/30-days-to-learn-laravel-11/). Again, zero to ~a hundred~ 26 (the number of lessons I completed[^3]) at 2x speed, and yet another home run for the man from Florida. A natural follow-up to the previous series where most everything done with pure PHP gets made easier with the introduction of Laravel. The number of tools and commands did feel a bit overwhelming at times, and I'm still not a 100% at home with most of them and have to google their usage, but it is a breath of fresh air to see the amount of care that is put into providing a smooth experience.

After gathering the knowledge I thought would be required to build what I imagined, it turns out that most examples online of creating a site with search functionality revolve around using [Livewire](https://livewire.laravel.com/) in one way or another. I wonder if old man Jeffrey has something up his sleeve for this too... Sure enough, Laracasts provides a completely free [Livewire 3 From Scratch series](https://laracasts.com/series/livewire-3-from-scratch/)! Took me even fewer lessons this time around with just the first six being completed before I removed the training wheels and got going on my own.

I'm by no means an expert in PHP nor Laravel at the time of writing this, don't think it would even be possible given that I quite literally started learning at the start of November, 2024, but I'm now at least comfortable reading some PHP without only seeing hieroglyphs and I'm able to navigate a typical project's structure thanks to the convention over configuration nature of Laravel.

## Hey, that's my data

> Where do postal codes even come from?

That was the first thought that came to my head when starting Sihtnumbrid[^4]. I had always relied on third-party sites to give me that information and I never actually considered what the true source would even be. I was worried I would have to do some sort of unnecessarily complicated scraping to get all of the data, but as luck would have it, Estonia is all about that open data craze and the exact right data was out in the open for all to consume.

This segment is brought to you through [Geoportal by the Land and Spatial Development Board of the Republic of Estonia](https://geoportaal.maaamet.ee/eng/spatial-data/address-data/postal-codes-p661.htm). A round of non-ironic applause, please! Really, my project quite literally wouldn't exist without such easy access to all the relevant data.

There's a ZIP file up for download that is updated on the fifth of every month that contains a single CSV file with only six columns: address ID, postal code, short address, long address, and X and Y coordinates. I knew I wanted to make the deployment scenario as simple as possible, so when setting up the Laravel project I chose SQLite as the database driver. This made developing locally a breeze as I could just import the CSV file into an existing database using a command like:

```shell
sqlite3 database/database.sqlite \
  '.mode csv' \
  '.separator ;' \
  '.import --skip 1 <path to the CSV file> <table name>'
```

And making temporary back-ups was only a matter of copying the `database.sqlite` file to some other path. The only amount of processing that occurs when data is added is the `--skip 1`, which tells SQLite to ignore the first row of headers in the CSV file. This is required because the database migrations already set up the table and if the table already exists, then trying to import _with_ headers will not work. If you are working with a brand new database with no tables, then you can forego the `--skip 1` option and everything should still work.

I intentionally wanted to keep any other data processing to a minimum if at all possible to make the maintenance of this site as frictionless as possible. There is no way I'll want to perform some sort of sacred ritual potentially years down the line just to keep the site running. Always try to keep it simple for as long as possible.

## Performance

While I knew that the site itself wouldn't be anything technically impressive like a more full-fledged application with a lot of user interaction possibilities, I still wanted to give my all into making it snappy; I didn't want any of the perceptible slowness I felt with most of the existing solutions.

I went through a few iterations early on where I only allowed a literal short address to be searched with a wildcard added to the end to make it sort of like a fuzzy search. This worked absolutely fine and was quite performant in that there was no delay in searching for something and getting back a result. It constantly tripped up my friend though who felt it more natural to search for just the street name and a building number with no clarifying terms like "street" or "avenue" in-between. So, as anyone bound to make simple mistakes, I turned to regular expressions to solve the matter[^5].

The query speeds tanked, but I was still happy that I got the searching to be more intuitive in that anything could be entered to get a result, thus I actually shipped that version of the site as well. As I've demonstrated [before](https://usrme.xyz/posts/how-to-trim-a-container-image-that-includes-azure-cli/) though, I'm not one to leave gains on the table without just cause. There was no way I'd leave it at that. And I'm thrilled that I didn't because after creating the necessary indeces and simplifying the queries, the delays are once again near-imperceptible and were improved from around 600ms to less than 100μs.

## Deployment

This site is hosted on [Fly](https://fly.io/), which was chosen mostly because I have a bunch of credits left over that I wanted to use[^6] and being a Fly stan making up another chunk of the reasoning. On top of that, since this project is written using Laravel, Fly's [guide to deploying Laravel](https://fly.io/docs/laravel/) made it very easy to get something up and running. To my great surprise I didn't have to specifically set up any volumes to support the fact that there is a database because Fly packaged the database file right along with the application itself, making everything even easier on me.

Because the site is meant to cater to Estonian visitors, I had wanted to locate the application right in Estonia to avoid any round-trips farther away, but another pleasant surprise was that despite the deployment being in Bucharest (as suggested by Fly), the speed of the site hasn't suffered whatsoever, in my opinion.

Using Fly is basically making whatever changes I want, running `fly deploy --ha=false`, and that's it. I'm using a single machine, with a single shared CPU with the lowest amount of memory possible at 256MB. All because I don't want to consume credits when it isn't strictly necessary; the site _can_ afford to go down after all. Thus far the memory usage has been half of what has been allotted, so I'm curious to see what happens should the traffic ever pick up.

## Current state

I ragged on other sites at the beginning, but did I even improve upon them? I like to think that I did and here's why.

### Usability

Right off the bat, the site is a no frills experience with everything presented directly: a search input field, a button to search, and the two most relevant columns shown, even if there are no results. The latter was intentional because I didn't want any unnecessary jumping around in the page depending on whether anything was found. And the no frills part is because while I am relying on the JavaScript that Livewire uses along with Tailwind, I didn't want to add anything more than was strictly necessary. That means no custom fonts, no special effects requiring more third-party libraries, etc.

When more than 15 results are found, the table's rows are paginated to avoid any scrolling for however long.

When any result is found, then a note is shown for when the data was updated. None of the alternative sites state this, which bothers me to no end. Yes, one can assume that the data is up-to-date everywhere, but there's no way to really know.

Query parameters have entered the chat. I'm a huge fan of being able to link whatever is in a site and yet again, none of the alternatives had this. Now it's possible to take a specific search term like "Tallinna 29" and [link](https://sihtnumbrid.ee/?q=Tallinna+29) to it, or even a [page within](https://sihtnumbrid.ee/?q=Tallinna+29&page=5) the results! I'm not sure if this can be quantified, but I like to think that this feature has a high Grandma Approve Factor. Something all sites should strive for.

#### Glory to Laravel

This goes back to the first section where I mentioned how Laravel simplifies creating web applications. All of the above was made so damn easy to a novice like me! Whether it's [pagination](https://livewire.laravel.com/docs/pagination), [query parameters](https://livewire.laravel.com/docs/url), or [storing history](https://livewire.laravel.com/docs/url#storing-in-history): it was surprisingly simple to implement all of them. And thanks to [Debugbar for Laravel](https://github.com/barryvdh/laravel-debugbar), I was also able to make good progress on personal pet peeves like slow database queries.

### Speed

Even if thousands or hundreds of thousands of results are found, the search is still very much instant, even if a brand new search term is entered. This all in an effort to break the mold to show that nowadays there's hardly ever any good technical reason for not making simple applications such as this fast.

Since the querying is only contained within one table and _only_ across 1.35M records, it's expected to be quick with additional thanks to the wonders of modern database engineering and query optimizations, but I'm still happy I got it to be _this_ quick.

## Future

I'm not yet ready to consider this thing to be done because there are various little bug fixes and improvements I still want to make in order for me to be _really_ proud of what I built. A short list of improvements in no particular order:

* have a custom logo created with a hand-drawn feel to it;
* add an optional button to use the current location for the search;
* trim the fat from the site wherever possible to make the payload even smaller;
* add an API to be able to make programmatic requests;
* add automatic source data retrieval.

None of these are critical in any way and the site is already a marked improvement on the rest, in my opinion, it's that I very much enjoy having some project to work on when I'm not involved with my day job. There are no grand aspirations for the site other than to have a concrete outlet for what I'm learning and dabbling with. All done [because _I_ wanted to](https://aaronfrancis.com/2024/because-i-wanted-to-12c5137c) and I hope more people do the same.

I'm most definitely not a software developer by profession, so I've probably made mistakes in the front-end and back-end. If without reading the source code you, dear reader, are able to spot oddities, then do please write to me at **yates+blog at protonmail.ch**. If you know of ways to make the querying even faster, then please also do contact me, I'd love to learn more!

[^1]: At this point I really had no idea just how easy things would be made for me.
[^2]: I guess PHP _does_ make the kind of bank that is amenable to giving things away.
[^3]: There's actually 30 lessons, but the last four videos are about creating a final project that Jeffrey had in mind. I desperately wanted nothing more to get started on mine.
[^4]: To make sense of the sub-heading, check out this classic [SQL Server ad featuring Bill Gates](https://www.youtube.com/watch?v=5ycx9hFGHog)
[^5]: A thousand (as if I have that many readers) database engineers just winced.
[^6]: [Here's](https://www.tigrisdata.com/blog/docker-registry-at-home/) a blog post over at [Tigris](https://tigrisdata.com) that gives away $50 in credits.
