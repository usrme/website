---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2024-09-04
title: About the 'shar' command
tags: ["cli", "linux"]
---
I have a repository that I often `cd` into that starts with the word "shared". Recently I wanted to do just that, so I just typed "shar" and then Tab-completed the rest, but I was in the wrong directory in order for that to work, and the completion just resulted in `shar` on the command line. Really, there's a command called `shar`?

```console
$ shar
usage: shar file ...
```

Looks like it, but not really helpful off the bat. Let's learn more. The following is from the `man` page:

```plaintext
NAME
     shar – create a shell archive of files

SYNOPSIS
     shar file ...

DESCRIPTION
     The shar command writes a sh(1) shell script to the standard output which will 
     recreate the file hierarchy specified by the command line operands.
     Directories will be recreated and must be specified before the files they 
     contain (the find(1) utility does this correctly).

     The shar command is normally used for distributing files by ftp(1) or mail(1).

EXAMPLES
     To create a shell archive of the program ls(1) and mail it to Rick:

           cd ls
           shar `find . -print` | mail -s "ls source" rick

     To recreate the program directory:

           mkdir ls
           cd ls
           ...
           <delete header lines and examine mailed archive>
           ...
           sh archive
```

It still wasn't immediately obvious to me what was going on, so I wanted to try it for myself. I created a mock directory tree with a mock YAML file to work off of:

```console
$ mkdir -p parent/child/
$ cat <<EOF > parent/child/example.yaml
name: localhost
ip: 127.0.0.1
EOF
```

Now, running the `shar` command right next to the `parent` directory as follows will yield in a shell script that will recreate any directories and any files within those directories[^1]:

```console
$ shar $(find parent/ -print) > archive.sh
$ cat archive.sh
# This is a shell archive.  Save it in a file, remove anything before
# this line, and then unpack it by entering "sh file".  Note, it may
# create directories; files and directories will be owned by you and
# have default permissions.
#
# This archive contains:
#
#	parent/
#	parent//child
#	parent//child/example.yaml
#
echo c - parent/
mkdir -p parent/ > /dev/null 2>&1
echo c - parent//child
mkdir -p parent//child > /dev/null 2>&1
echo x - parent//child/example.yaml
sed 's/^X//' >parent//child/example.yaml << 'eee9f9aab4d93f0ed70c915ebe9f7d31'
Xname: localhost
Xip: 127.0.0.1
eee9f9aab4d93f0ed70c915ebe9f7d31
exit
```

Here's an example of doing the recreation in some other directory:

```console
$ sh archive.sh
c - parent/
c - parent//child
x - parent//child/example.yaml
$ tree parent/
parent/
└── child
    └── example.yaml
$ cat parent/child/example.yaml
name: localhost
ip: 127.0.0.1
```

So, the `shar` command could be used instead of archiving the entire directory using something like `tar` or `zip` and shipping those around if you just send the single `archive.sh` file to whomever!

[^1]: I tried learning more about why the `sed` command is necessary as opposed to something like `cat <<EOF`, but I came up short. Same goes for how the unique identifier was calculated. Some [homework](https://github.com/Distrotech/sharutils/blob/master/src/shar.c) for the curious.
