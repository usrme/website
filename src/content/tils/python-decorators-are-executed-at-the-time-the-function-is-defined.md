---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2021-11-03
title: Python decorators are executed at the time the function is defined
tags: ["python"]
---
When writing a CLI tool I've come to re-use a generic decorator that sets the correct subscription in Azure:

```python
def set_az_context(func):
    """Set Azure CLI context to match given subscription."""

    is_logged_in, result = get_az_context()
    if not is_logged_in:
        logger.error(result)
        sys.exit(1)

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        subscription = kwargs["subscription"].value

        if result["name"] != subscription:
            logger.debug(f"Current subscription not set to: '{subscription}'")
            logger.info(f"Changing subscription to: '{subscription}'")
            exit_code, _, logs = az(f"account set --subscription {subscription}")
            if exit_code != 0:
                logger.error(logs.rstrip())
                raise typer.Exit(exit_code)
        return func(*args, **kwargs)

    return wrapper
```

It works just fine and multiple sub-commands rely on this decorator. Since the main command imports all of the sub-commands with every execution, the decorator is actually ran every time a sub-command's (i.e. Python module's) `main` function (i.e. the decorated function) is imported.

This was news to me as I've read up a lot on decorators, but none of the sources has explicitly stated this, despite the proof being in the [PEP 318](https://www.python.org/dev/peps/pep-0318/ "PEP 318 -- Decorators for Functions and Methods") pudding:

> Some of the advantages of this form are that the decorators live outside the method body -- **they are obviously executed at the time the function is defined**.

There's no follow-up to the "obviously" part, which is leaving me at bit perplexed.

While the code above seems to sufficiently guard against constantly re-running a potentially expensive operation, it still kind of goes against the expectation that I had, obviously falsely, that it was only applied during run-time.
