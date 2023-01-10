---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-09-25
title: How to speed up development using 'requests-cache' for Python
---
There was a project at work that required a lot of requests be made against both GitLab and Azure, and I noticed a colleague of mine using something called ['requests-cache'](https://pypi.org/project/requests-cache/) to significantly speed up his development iterations. Think in terms of having the entire script run for 15 minutes every time or run for 5 seconds...

I had assumed that such a wide-reaching and effective cache would be bothersome to add to a codebase, but it turns out it's pretty much just a matter of installing the package `requests-cache` (in a virtual environment, please) and then importing it as `requests_cache`.

The simplest way is to create the cache globally in the script's entrypoint and that way every new request gets cached automatically, and subsequent identical requests go against a SQLite database that is created alongside the script:

```python
#!/usr/bin/env python

import requests
import requests_cache

URL = "https://example.com/"


def main() -> int:
    requests_cache.install_cache("url_cache")
    requests.get(URL)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

I'm growing more weary about introducing dependencies to pieces of code that might not actually need it, but seeing as the main benefit here is during actual development, and not once the thing is in production[^1], I have no qualms about making use of it if it really is _that_ easy to work with.

[^1]: Assuming the time it takes for the script to do its thing isn't critical (i.e. it's something that runs only once a day or even on an ad hoc basis).
