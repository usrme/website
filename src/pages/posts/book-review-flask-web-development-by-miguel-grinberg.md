---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-02-07
title: 'Book review: "Flask Web Development" by Miguel Grinberg'
---
In short: I'd skip this book if you aren't averse to the [wonderful Flask user's guide](https://flask.palletsprojects.com/en/2.0.x/). Everything in the book is seemingly covered in at least the same depth as in the guide with the added benefit that more people have probably read the guide and thus will share the same level of context as you would should you have problems, and it will be kept up-to-date with newer versions of Flask, which is not a given with a book.

Not to put down the author for taking the time and effort to even write a book, not a small task in the least, and perhaps at the time of writing the project's own documentation wasn't as high quality as it is now and so the book filled a noticeable gap, but as of writing _this_ it seems to have not served its purpose all that well.

Unfortunately the [documentation builds](https://readthedocs.org/projects/flask/downloads/) are [no longer provided](https://github.com/pallets/flask/issues/4231), which would make _those_ an immediate recommendation instead of the book at hand. Luckily, it's very easy to generate those yourself if you are so inclined. Here's the ceremony required to create an ePub:

```bash
$ git clone git@github.com:pallets/flask.git
$ cd flask
$ python -m venv .docvenv
$ source .docvenv/bin/activate
# Install documentation requirements
$ pip install -r requirements/docs.txt
# Install Flask itself
$ pip install -e .
$ cd docs/
$ make epub
# Resulting ePub file is at "_build/epub/Flask.epub"
```

To make the PDF file[^1] is just as simple in the actual commands, but as aside from requiring all of the above it's necessary to install a _bunch_ of LaTeX-related packages. For example, I had to install `latexmk`, which was 140 MB when installed, and something called `texlive-scheme-full` (based on [Fedora Docs](https://docs.fedoraproject.org/en-US/neurofedora/latex/)), which was 4.7 GB when installed! I probably could have made due with a smaller set of packages, but after errors like:

```plaintext
! LaTeX Error: File `cmap.sty' not found.
```

Where `cmap.sty` was one of multiple LaTeX style files and other missing bits of dependencies that I didn't want to spend time resolving, I just accepted the large file size and got on with it:

```bash
# After doing all of the above, sans the "make epub"
$ cd docs/
$ make latexpdf
# Resulting ePub file is at "_build/latex/Flask-2.1.x.pdf"
```

[^1]: I'm not sure in what situations one would prefer a PDF over over something like an ePub, seeing how the latter conforms to various devices and readers much better.
