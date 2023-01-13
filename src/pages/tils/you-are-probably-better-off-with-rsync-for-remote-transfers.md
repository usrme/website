---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-11-04
title: You are probably better off with 'rsync' for remote transfers
---
I recently had to transfer a roughly 90MB directory from a remote machine to my local machine for debugging purposes and my first inclination was to use `scp`. Probably out of habit as I am used to just replacing `ssh` with `scp` when I need a file; hadn't really done whole-directory transfers before.

I looked up the relevant options[^1] and with a combination of `r`, `C`, and `p` (`scp -rCp ...`) I was off to the races. If you can even call it a race as during the time that this invocation was running I was able to use `rsync` instead and come up with the whole of this post. Here's how long `rsync` took to copy said directory from the east coast of the US to Estonia:

```
$ rsync -azv <user>@<remote>:<remote path> <local path>
receiving incremental file list
...
sent 33.635 bytes  received 90.267.295 bytes  6.688.957,78 bytes/sec
total size is 90.098.094  speedup is 1,00

real    0m12,697s
user    0m1,073s
sys     0m1,614s
```

After what seemed like forever, `scp` reported as being done when a whopping 20 minutes had passed. To not completely discount `scp` though: if you first archive a directory to a `.tar.gz` file, then the transfer will take far less time; roughly 10 seconds instead.

---

If the direction you're transferring from is Windows to Linux and the files are large enough that you feel yourself being mildly annoyed over the wait times, then look into [CDC File Transfer](https://github.com/google/cdc-file-transfer). If not, then read the main README anyway as it is wonderfully informative!

[^1]: I continue to prefer Mankier for this with the help of a DuckDuckGo bang (namely `!mankier`): <https://www.mankier.com/1/scp>.
