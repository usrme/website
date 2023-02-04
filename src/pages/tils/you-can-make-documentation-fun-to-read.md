---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-01-19
title: You can make documentation fun to read
tags: ["docs"]
---
If nothing else this is a small note of praise to the people who have written the documentation for the [uWSGI project](https://uwsgi-docs.readthedocs.io/en/latest/ "The uWSGI project - documentation"). I went through the [quickstart for Python/WSGI applications](https://uwsgi-docs.readthedocs.io/en/latest/WSGIquickstart.html "The uWSGI project - quickstart for Python/WSGI applications") and just that page already has more bits that made me smirk than any documentation page in recent memory. Here are some of them (citations mine):

> uWSGI natively speaks HTTP, FastCGI, SCGI and its specific protocol named “uwsgi” (yes, wrong naming choice).

> If you are thinking about firing up vi and writing an init.d script for spawning uWSGI, just sit (and calm) down and make sure your system doesn’t offer a better (more modern) approach first.

`uwsgi --socket 127.0.0.1:3031 --chdir /home/foobar/myproject/ --wsgi-file myproject/wsgi.py --master --processes 4 --threads 2 --stats 127.0.0.1:9191`

> Argh! What the hell is this?! Yes, you’re right, you’re right… dealing with such long command lines is unpractical, foolish and error-prone. Never fear! uWSGI supports various configuration styles.

> A common problem with webapp deployment is “stuck requests”. All of your threads/workers are stuck (blocked on request) and your app cannot accept more requests. To avoid that problem you can set a `harakiri`[^1] timer.

> You should already be able to go into production with such few concepts, but uWSGI is an enormous project with hundreds of features and configurations. If you want to be a better sysadmin, continue reading the full docs.

Sure, it's possible to go overboard with humor to the point of distraction, but _some_ amount is definitely welcome as it removes the tinge of seriousness from a project making it seem more accessible where it otherwise might not be. Hopefully I come across more examples of taking the mickey out of documentation.

[^1]: https://en.wikipedia.org/wiki/Seppuku
