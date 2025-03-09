---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2025-03-09
title: Easy reproductions with 'txtar' and 'testscript'
tags: ["linux", "cli", "cue", "performance", "go"]
---
Perusing the CUE language's [wiki page](https://github.com/cue-lang/cue/wiki), I came across their page for creating test or performance reproducers where they mention [creating a 'txtar' archive](https://github.com/cue-lang/cue/wiki/Creating-test-or-performance-reproducers#creating-a-txtar-archive). I've seen that format being relied on in their issue tracker as well, but it never really clicked for me how I could use it myself.

While creating tooling around our Backstage installation, I came across a rather nasty bug that took me hours to debug and I was dead set on it being a bug in the language itself because I could not for the life of me find another way to explain it. I needed another pair of eyes on the problem and before I asked my colleague, I wanted a clean way to reproduce the issue and somewhere in the back of my mind `txtar` made an appearance.

The installation just to use from the command line wasn't made explicit anywhere but, for future reference, I found this to work (assumes the Go language is already installed)[^1]:

```console
$ go install github.com/rogpeppe/go-internal/cmd/txtar-c@latest
go: downloading github.com/rogpeppe/go-internal v1.14.1
go: downloading golang.org/x/tools v0.26.0
```

With the package all ready to go, I could start building up the reproduction. The instructions mention running something like `txtar-c /some/directory > repro.txtar` to create the archive file, but what I was initially working on spanned so many different directories that I found it easier to compose the file manually[^2]. I'll spare you the gnarly details, but essentially something like the following in a file like `repro.txtar` will include:

* creating any necessary directory structures along with their files;
* invoking any commands that assumes the existence of said directories;
* comparing the standard output to something expected.

```cue
exec cue cmd generate
cmp stdout stdout.golden

-- parent/max/maximum/diagram.md --
# Maximum
Contents

-- parent/max/history/diagram.md --
# History
Contents

-- main_tool.cue --
package main

import (
	"strings"
	"tool/cli"
	"tool/file"
)

command: generate: {
	maximumDir: "parent/max/maximum"
	historyDir: "parent/max/history"
	domain: "max"
	maximumMarkdownFiles: file.Glob & {glob: "\(maximumDir)/*.md"}
	historyMarkdownFiles: file.Glob & {glob: "\(historyDir)/*.md"}

	for _, f in maximumMarkdownFiles.files {
		let filePath = strings.Split(f, domain)[1]
		"debug-maximum": cli.Print & {text: filePath}
	}
	for _, f in historyMarkdownFiles.files {
		let filePath = strings.Split(f, domain)[1]
		"debug-history": cli.Print & {text: filePath}
	}
}

-- stdout.golden --
/history/diagram.md
/maximum/diagram.md
```

Now, in order to actually validate what is going on, another executable called `testscript` is needed:

```console
$ go install github.com/rogpeppe/go-internal/cmd/testscript@latest
go: downloading golang.org/x/mod v0.21.0
go: downloading golang.org/x/sys v0.26.0
```

In the same directory as the archive file, run the following:

```diff
$ testscript repro.txtar
> exec cue cmd generate
[stdout]
/history/diagram.md
/
> cmp stdout stdout.golden
diff stdout stdout.golden
--- stdout
+++ stdout.golden
@@ -1,2 +1,2 @@
 /history/diagram.md
-/
+/maximum/diagram.md

FAIL: repro.txtar:2: stdout and stdout.golden differ
failed run
```

With a solid reproduction in hand, I was able to iterate towards a solution much more quickly and thanks to help from my colleague the problem became apparent and solved! The fix really isn't relevant to this post, but I'm sharing it to be able to share another helpful bit to using `testscript`. Showing it in diff format to more clearly show the differences:

```diff
--- repro.txtar 2025-03-09 18:14:14
+++ fixed.txtar 2025-03-09 18:23:29
@@ -26,11 +26,11 @@
        historyMarkdownFiles: file.Glob & {glob: "\(historyDir)/*.md"}

        for _, f in maximumMarkdownFiles.files {
-               let filePath = strings.Split(f, domain)[1]
+               let filePath = strings.SplitAfterN(f, domain, 2)[1]
                "debug-maximum": cli.Print & {text: filePath}
        }
        for _, f in historyMarkdownFiles.files {
-               let filePath = strings.Split(f, domain)[1]
+               let filePath = strings.SplitAfterN(f, domain, 2)[1]
                "debug-history": cli.Print & {text: filePath}
        }
 }
```

If `testscript` is ran against this file, then its output is rather bare:

```console
$ testscript fixed.txtar
PASS
```

To see something similar as when the test case failed, just add the `-v` flag:

```console
$ testscript -v fixed.txtar
WORK=$WORK
PATH=<a bunch of paths>
GOTRACEBACK=system
HOME=/no-home
TMPDIR=$WORK/.tmp
devnull=/dev/null
/=/
:=:
$=$
exe=
GOPATH=$WORK/.gopath
CCACHE_DISABLE=1
GOARCH=arm64
GOOS=darwin
GOROOT=/opt/homebrew/Cellar/go/1.24.1/libexec
GOCACHE=/Users/ullar.seerme/Library/Caches/go-build
GOPROXY=https://proxy.golang.org,direct
goversion=1.24

> exec cue cmd generate
[stdout]
/history/diagram.md
/maximum/diagram.md
> cmp stdout stdout.golden
PASS
```

Go forth and ~reproduce~ produce reproduction cases!

[^1]: I'm using Roger Peppe's version because of a disclaimer in the [repository](https://github.com/rogpeppe/go-internal).
[^2]: The installation of `txtar-c` is **not** necessary if you already know you are creating the `.txtar` files yourself. Just delete the `txtar-c` binary from `"${GOPATH}/bin/"` to clean up.
