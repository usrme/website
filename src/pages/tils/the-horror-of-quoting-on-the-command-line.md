---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2021-07-07
title: The horror of quoting on the command line
tags: ["azure-cli", "bash"]
---
While I am usually very pro-JMESPath and pro-JQ, they can sometimes be a real pain, and this post serves no other purpose than to exemplify this.

I just spent close to three hours trying to get a simple query working and I'm not even happy I got it working after spending so much time on it...

Here's a sample of the data I was working on just in case you want to practice masochism as well:

```json
[
    {
        "name": "resource1",
        "tags": {
            "currently-used": "False"
        }
    },
    {
        "name": "resource2",
        "tags": {
            "currently-used": "False"
        }
    },
    {
        "name": "resource3",
        "tags": {
            "currently-used": "True"
        }
    },
    {
        "name": "resource4",
        "tags": {
            "currently_used": "False"
        }
    }
]
```

Feed that into the [JMESPath](https://jmespath.org/ "JMESPath is a query language for JSON") website and try to **get the names of the resources whose tag 'currently-used' OR 'currently_used'** (note the hyphen and underscore) **is set to the string 'False'** (the value itself does not contain quotes).

***

Got it? Great! It took me a heck of a lot more time than I initially expected because I was adding quotes around the names of the tags. That is required when you're working on the command line, even though I wasn't... The following will work on the website:

```
[?tags.currently-used == 'False' || tags.currently_used == 'False'].name
```

Now, I knew I definitely needed to add quotes around the names of the tags when moving over to the command line, but I didn't want to do a bunch of unnecessary queries against Azure, so I turned to [jpterm](https://github.com/jmespath/jmespath.terminal "JMESPath exploration tool in the terminal"). I thought that if I got it working there then it would just be directly applicable for my ultimate usage with Azure CLI. How foolish of me. This query will yield the same result in `jpterm`

```
[?tags."currently-used" == 'False' || tags."currently_used" == 'False'].name
```

So, now it's working in something that's close to the actual implementation that Azure CLI will use. Should be smooth sailing from here on out, but after many failed attempts where I was returned both **True** and **False**:

```
"[?tags.\"currently-used\" == "False" || tags.\"currently_used\" == "False"].name"
"[?tags.\"currently-used\" == "False" || tags.currently_used == "False"].name"
"[?tags.\"currently-used\" == \"False\" || tags.\"currently_used\" == \"False\"].name"
'[?tags."currently-used" == 'False' || tags."currently_used" == 'False'].name'
```

And shown straight-up errors:

```bash
$ az resource list --query "[?tags."currently-used" == 'False' || tags."currently_used" == 'False'].name"
argument --query: invalid jmespath_type value: "[?tags.currently-used == 'False' || tags.currently_used == 'False'].name"
```

I finally stumbled on the correct incantation:

```
"[?tags.\"currently-used\" == 'False' || tags.\"currently_used\" == 'False'].name"
```

***

In my defense sections labeled **Important** shouldn't be way down in the [official documentation](https://docs.microsoft.com/en-us/cli/azure/query-azure-cli#filter-arrays "Documentation to query Azure CLI command output")...
