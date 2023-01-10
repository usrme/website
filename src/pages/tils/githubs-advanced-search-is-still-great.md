---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-01-01
title: GitHub's advanced search is still great
---
I've been using GitHub's [advanced search](https://github.com/search/advanced "GitHub advanced search") for quite some time now and am now shoehorning my own usage of it in as a Today I Learned post. Sue me. My most common use case is to search for a keyword or really small snippet of code to find more examples on how other people are getting by with the surrounding language, API, etc.

Recently I had to use the ['virtualenv' Python package](https://virtualenv.pypa.io/en/latest/ "'Virtualenv' documentation - homepage") to create a virtual environment in a piece of code. Looking at the User Guide section of the documentation there _is_ a [Programmatic API](https://virtualenv.pypa.io/en/latest/user_guide.html#programmatic-api "'Virtualenv' documentation - Programmatic API") page, but for me it's somewhat inadequate as there are no working examples aside from the paltry:

```python
from virtualenv import cli_run

cli_run(["venv"])
```

This provides no real value as any surrounding operations, such as activating the virtual environment, installing packages to it, and deactivating the virtual environment, are left up to the end user to figure out. GitHub's advanced search to the rescue!

Set `virtualenv.cli_run language:Python` as the search input[^1] and it's off to the races. From there, depending on the ambiguity of the search term, you might have to do a bit of trawling to find the bits that are most useful, but there's a high degree of certainty that _something_ is bound to come up. For example, here are some of the ones that ended up being valuable to me:

* [https://github.com/3dninjas/pdistx/blob/177d553a4d98b36b22ffeb12a46570fbc85cdd83/pyscriptpacker/environment.py](https://github.com/3dninjas/pdistx/blob/177d553a4d98b36b22ffeb12a46570fbc85cdd83/pyscriptpacker/environment.py "https://github.com/3dninjas/pdistx/blob/177d553a4d98b36b22ffeb12a46570fbc85cdd83/pyscriptpacker/environment.py")
* [https://github.com/JetBrains/teamcity-messages/blob/b03ddbfadf2090756976abe3581704f8bc9e781f/tests/integration-tests/virtual_environments.py](https://github.com/JetBrains/teamcity-messages/blob/b03ddbfadf2090756976abe3581704f8bc9e781f/tests/integration-tests/virtual_environments.py "https://github.com/JetBrains/teamcity-messages/blob/b03ddbfadf2090756976abe3581704f8bc9e781f/tests/integration-tests/virtual_environments.py")
* [https://github.com/jcwillox/dotfiles/blob/819e5820b6fec453dcd1d4de7cf3727df72bb82f/scripts/install-venv](https://github.com/jcwillox/dotfiles/blob/819e5820b6fec453dcd1d4de7cf3727df72bb82f/scripts/install-venv "https://github.com/jcwillox/dotfiles/blob/819e5820b6fec453dcd1d4de7cf3727df72bb82f/scripts/install-venv")

Theoretically the same value could be leveraged from GitLab's search functionality, but my go-to is still GitHub for the time being as it's just more popular and because of that has more examples I can use[^2].

[^1]: I've found no practical difference in using quotation marks around the search term if the term does **not** contain spaces, and specifying the language is wholly optional as well depending on the scenario.

[^2]: The same search term did not yield any results in GitLab.
