---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2024-01-18
title: Quickly find out the minimum Go version for an application
tags: ["docker", "go"]
---
I was watching Dreams of Code's latest video on [using Docker in unusual ways](https://www.youtube.com/watch?v=zfNqp85g5JM) and there he mentioned that he uses it to find out whether a Go application works on older versions of Go[^1] by having a Dockerfile that just references the necessary Go version, copies everything over, tries `go build`, and then sets the `CMD`. Akin to the following:

```dockerfile
FROM golang:1.20

WORKDIR /app

COPY . .

RUN go build -o app

CMD ["app"]
```

I've long wondered what would be the most efficient way to find out the minimum Go version an application can support, but thus far I've come up short. This is simple enough that I can easily create a copy-pastable variant to use in most of my own Go code:

```bash
for i in $(seq 17 21); do
  docker build -f - . << EOF
FROM golang:1.${i}
WORKDIR /app
COPY . .
RUN go build -o app
CMD ["app"]
EOF
done
```

I initially found an incantation like `docker build -`, but that didn't take into account the current directory as the build context[^2], so the `-f` and an additional `.` was required.

Here's what it looks like to try and build a simple application. I'm using my own [Cometary](https://github.com/usrme/cometary) as the basis and starting from Go 1.17 for brevity as all the older ones fail:

```console
$ for i in $(seq 17 21); do
  docker build -f - . << EOF
FROM golang:1.${i}
WORKDIR /app
COPY . .
RUN go build -o app
CMD ["app"]
EOF
done

[+] Building 2.8s (8/8) FINISHED                                                                                                                                            docker:default
 => [internal] load .dockerignore                                                                                                                                                     0.0s
 => => transferring context: 2B                                                                                                                                                       0.0s
 => [internal] load build definition from Dockerfile                                                                                                                                  0.0s
 => => transferring dockerfile: 175B                                                                                                                                                  0.0s
 => [internal] load metadata for docker.io/library/golang:1.17                                                                                                                        0.5s
 => [1/4] FROM docker.io/library/golang:1.17@sha256:87262e4a4c7db56158a80a18fefdc4fee5accc41b59cde821e691d05541bbb18                                                                  0.0s
 => [internal] load build context                                                                                                                                                     0.0s
 => => transferring context: 51.88kB                                                                                                                                                  0.0s
 => CACHED [2/4] WORKDIR /app                                                                                                                                                         0.0s
 => CACHED [3/4] COPY . .                                                                                                                                                             0.0s
 => ERROR [4/4] RUN go build -o app                                                                                                                                                   2.2s
------                                                                                                                                                                                     
 > [4/4] RUN go build -o app:                                                                                                                                                              
0.245 go: downloading golang.org/x/exp v0.0.0-20230817173708-d852ddb80c63                                                                                                                  
0.246 go: downloading github.com/charmbracelet/bubbles v0.16.1                                                                                                                             
0.246 go: downloading github.com/charmbracelet/bubbletea v0.24.2                                                                                                                           
0.247 go: downloading github.com/charmbracelet/lipgloss v0.8.0                                                                                                                             
0.350 go: downloading github.com/mattn/go-localereader v0.0.1
0.350 go: downloading github.com/mattn/go-isatty v0.0.19
0.350 go: downloading github.com/containerd/console v1.0.4-0.20230313162750-1ae8d489ac81
0.362 go: downloading github.com/muesli/ansi v0.0.0-20230316100256-276c6243b2f6
0.364 go: downloading github.com/muesli/cancelreader v0.2.2
0.372 go: downloading github.com/muesli/reflow v0.3.0
0.382 go: downloading github.com/muesli/termenv v0.15.2
0.385 go: downloading golang.org/x/sync v0.3.0
0.390 go: downloading golang.org/x/term v0.12.0
0.397 go: downloading golang.org/x/sys v0.12.0
0.398 go: downloading github.com/mattn/go-runewidth v0.0.15
0.402 go: downloading github.com/atotto/clipboard v0.1.4
0.423 go: downloading github.com/sahilm/fuzzy v0.1.0
0.438 go: downloading github.com/rivo/uniseg v0.4.4
0.447 go: downloading github.com/lucasb-eyer/go-colorful v1.2.0
0.448 go: downloading github.com/aymanbagabas/go-osc52/v2 v2.0.1
1.363 # golang.org/x/exp/maps
1.363 /go/pkg/mod/golang.org/x/exp@v0.0.0-20230817173708-d852ddb80c63/maps/maps.go:10:10: syntax error: unexpected [, expecting (
1.363 /go/pkg/mod/golang.org/x/exp@v0.0.0-20230817173708-d852ddb80c63/maps/maps.go:20:12: syntax error: unexpected [, expecting (
1.363 /go/pkg/mod/golang.org/x/exp@v0.0.0-20230817173708-d852ddb80c63/maps/maps.go:30:11: syntax error: unexpected [, expecting (
1.363 /go/pkg/mod/golang.org/x/exp@v0.0.0-20230817173708-d852ddb80c63/maps/maps.go:44:15: syntax error: unexpected [, expecting (
1.363 /go/pkg/mod/golang.org/x/exp@v0.0.0-20230817173708-d852ddb80c63/maps/maps.go:44:100: method has multiple receivers
1.363 /go/pkg/mod/golang.org/x/exp@v0.0.0-20230817173708-d852ddb80c63/maps/maps.go:45:13: syntax error: unexpected != after top level declaration
1.363 /go/pkg/mod/golang.org/x/exp@v0.0.0-20230817173708-d852ddb80c63/maps/maps.go:57:11: syntax error: unexpected [, expecting (
1.363 /go/pkg/mod/golang.org/x/exp@v0.0.0-20230817173708-d852ddb80c63/maps/maps.go:65:11: syntax error: unexpected [, expecting (
1.363 /go/pkg/mod/golang.org/x/exp@v0.0.0-20230817173708-d852ddb80c63/maps/maps.go:81:10: syntax error: unexpected [, expecting (
1.363 /go/pkg/mod/golang.org/x/exp@v0.0.0-20230817173708-d852ddb80c63/maps/maps.go:88:16: syntax error: unexpected [, expecting (
1.363 /go/pkg/mod/golang.org/x/exp@v0.0.0-20230817173708-d852ddb80c63/maps/maps.go:88:16: too many errors
1.363 note: module requires Go 1.20
1.420 # github.com/rivo/uniseg
1.420 /go/pkg/mod/github.com/rivo/uniseg@v0.4.4/properties.go:137:6: missing function body
1.420 /go/pkg/mod/github.com/rivo/uniseg@v0.4.4/properties.go:137:20: syntax error: unexpected [, expecting (
1.420 note: module requires Go 1.18
------
Dockerfile:4
--------------------
   2 |     WORKDIR /app
   3 |     COPY . .
   4 | >>> RUN go build -o app
   5 |     CMD ["app"]
   6 |     
--------------------
ERROR: failed to solve: process "/bin/sh -c go build -o app" did not complete successfully: exit code: 2
[+] Building 0.3s (9/9) FINISHED                                                                                                                                            docker:default
 => ...
[+] Building 0.3s (9/9) FINISHED                                                                                                                                            docker:default
 => ...
[+] Building 0.4s (9/9) FINISHED                                                                                                                                            docker:default
 => ...
[+] Building 0.3s (9/9) FINISHED                                                                                                                                            docker:default
 => ...
```

After doing this I was able to adjust the `go.mod` file on my [latest application](https://github.com/usrme/gobarchar/commit/1c882771887e6d6dea2937aa1bdf910209a360d2) with confidence.

[^1]: Start from the one minute mark to learn more.
[^2]: [GitHub issue](https://github.com/moby/moby/issues/19197) where this is discussed.
