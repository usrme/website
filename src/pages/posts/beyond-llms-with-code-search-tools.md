---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2025-03-05
title: Beyond LLMs with code search tools
draft: false
tags: ["searching"]
---
In 2025, Large Language Models (LLMs) have become the go-to resource for software engineers facing technical challenges. Yet, despite their impressive capabilities, these tools aren't the be-all and end-all. Tools like [GitHub's advanced search](https://github.com/search/advanced) and [Sourcegraph](https://sourcegraph.com/search) should continue to play a critical role in an engineer's toolkit, offering something that even the most state-of-the-art language model cannot fully replicate: concrete, real-world code examples. I've shared my experience with GitHub's advanced search in the [past](https://usrme.xyz/tils/githubs-advanced-search-is-still-great/), but I want to write about this topic again because quite honestly I've never seen these used as often as I am.

Now, what can those two tools provide that an LLM trained on the same public code data set can't? While an LLM will be ever so confident that it has given me the correct answer, there's still an aura of disbelief around its answer, especially if it's related to a problem or tool I haven't come across before. However, if I'm stringing together search terms on Sourcegraph and going through the results, I'm more often than not seeing the fragments of code that I searched for now exist as part of a larger project. Those projects may be solo efforts by someone in Nebraska or by a massive group of contributors, but whatever the case, seeing those lines of code be made real through the hands of someone else is what gives it so much more credibility than the prediction of an LLM[^1].

When I was knee deep with a recent project of mine where I wanted to learn Laravel[^2], I knew for sure that my ability to even prompt an LLM properly was severely lacking due to not knowing the correct terminology. Hence, I turned to Sourcegraph and started a basic search iteration with something like `"new LengthAwarePaginator" file:.*php`. I refined this to exclude all matches from the `laravel/framework` repository using the `-repo:laravel/framework` filter to not see framework implementation tests. Just by looking at the [results](https://sourcegraph.com/search?q=%22new+LengthAwarePaginator%22+file:.*php+-repo:laravel/framework&patternType=keyword&sm=0) from such a basic search gave me tons of examples about how to work with Laravel's [LengthAwarePaginator](https://laravel.com/docs/12.x/pagination) and I was able to work towards my own implementation with a certain level of clarity I wouldn't otherwise have.

As an example of a scenario where I actually expected an LLM to outperform a run-of-the-mill code search happened when I had to modify this shell command:

```shell
gh api "$query" --jq '[.items[].repository | select(.name | contains("-$cloud-"))]'
```

The variable `$cloud` was a shell a variable that I had access to, but given the level of quoting present I needed a way for it to be evaluated correctly within the argument to the `--jq` parameter. After some back-and-forth with Claude, my go-to for coding-related questions, I wasn't able to get to a result quickly enough and I once again turned to Sourcegraph. I started by searching for `/gh api.*--jq.*/`[^3] and only a few results later I saw [this](https://sourcegraph.com/github.com/go-kod/kod/-/blob/.github/workflows/release.yml?L45-47):

```shell
RELEASE_ID=$(gh api -X GET repos/${{ github.repository }}/releases --jq '.[] | \
  select(.tag_name=="'"$RELEASE_TAG"'") | .id')
```

It's definitely not something you see often, but what is basically happening is the following:

* the argument to `--jq` is split into two: `'.[] | select(.tag_name=="'` and `'") | .id'`;
* the middle `$RELEASE_TAG` is evaluated during normal shell variable expansion;
* as a result of implicit string concatenation by the shell, all of the above are joined together.

I can't say that it's highly unlikely that an LLM would have ever given me such solutions, but I am extremely glad to have grown accustom to using such tools; they're something I can't imagine not having access to and I implore everyone to at least give them a try. A lot of the work we do isn't strictly novel and the sheer amount of problems that have already been solved for us is massive. Let's harness that fact and get back to the truly unique problems we face.

[^1]: I'm well aware that those lines of code may just as well be written by an LLM with little to no changes from a human, but I'm quite not there in defaulting to such a thought. I expect this may change in the future.
[^2]: <https://usrme.xyz/posts/learning-laravel-by-building-a-postal-code-finder/>
[^3]: Using forward slashes allows you to use regular expressions within your search.
