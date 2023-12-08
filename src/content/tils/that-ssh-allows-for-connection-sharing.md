---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2023-03-19
title: That SSH allows for connection sharing
tags: ["linux", "cli"]
---
I was hacking on [Wishlist Lite](https://github.com/usrme/wishlistlite) trying to get a simple spinner to appear prior to the actual SSH connection, but I didn't want to refactor the existing code to use the ['ssh' package](https://pkg.go.dev/golang.org/x/crypto/ssh) for Go, so I was fumbling around trying to start an SSH process in the background, wait for anything being written to the standard output within that process and all the while showing a spinner, and then somehow switch over the existing Wishlist Lite process to that SSH process. This didn't seem to be doable as I couldn't find a method to effectively take over a process, even if it is a child process, by just knowing the process ID.

After a lot of mucking about I stumbled across the ['ControlMaster'](https://www.mankier.com/5/ssh_config#ControlMaster), ['ControlPersist'](https://www.mankier.com/5/ssh_config#ControlPersist), and ['ControlPath'](https://www.mankier.com/5/ssh_config#ControlPath) SSH options. What these options enable is for multiple sessions over a single network connection. In all likelihood this is not what was intended for these options, but for what I was trying to do they fit the bill so perfectly that I actually couldn't even believe it at first!

Now when a user selects an item from the list (a visual representation of an SSH config with multiple hosts), an SSH process is started with that item (i.e. a hostname or alias) as the connection target and that SSH process gets the following options added to it:

* `ControlMaster=yes`
* `ControlPersist=5s`
* `ControlPath=/dev/shm/control:%h:%p:%r`

`ControlMaster=yes`:

> When set to `yes`, `ssh` will listen for connections on a control socket specified using the `ControlPath` argument. Additional sessions can connect to this socket using the same `ControlPath` with `ControlMaster` set to `no` (the default). These sessions will try to reuse the master instance's network connection rather than initiating new ones.

`ControlPersist=5s`:

> When used in conjunction with `ControlMaster`, specifies that the master connection should remain open in the background (waiting for future client connections) after the initial client connection has been closed. If set to `no` (the default), then the master connection will not be placed into the background, and will close as soon as the initial client connection is closed.

I needed to set this to something that times out eventually as I wanted the control socket that gets created to be cleaned up automatically as after I switch over to the connection that was created in the background I have no control to do any sort of clean-up. If the time between initiating the master instance's network connection and switching over to it exceeds the value given to `ControlPersist`, then that socket is just removed and the connection is re-established when the switch-over occurs. I haven't had any connections take this long, so I'm not all that bothered by this imperfection. If, however, everything goes smoothly and the switch-over happens in less than that value then that value will be represent the time the socket will stay active after the SSH session is terminated. I wouldn't set this value to be overly high as I, personally, wouldn't want those connections hanging around for too long.

`ControlPath=/dev/shm/control:%h:%p:%r`:

> Specify the path to the control socket used for connection sharing as described in the `ControlMaster` section above or the string `none` to disable connection sharing. [...] It is recommended that any `ControlPath` used for opportunistic connection sharing include at least `%h`, `%p`, and `%r` (or alternatively `%C`) and be placed in a directory that is not writable by other users. This ensures that shared connections are uniquely identified.

What these formatting options end up resulting is something like this:

```shell
ls -la /dev/shm
total 0
drwxrwxrwt.  2 root  root    60 19. märts 12:29 .
drwxr-xr-x. 21 root  root  4420 19. märts 12:01 ..
srw-------.  1 usrme usrme    0 19. märts 12:29 control:<hostname>:<port>:<user name>
```

I chose `/dev/shm` over `/tmp` because if it is available to me then I'd much rather not deal with any issues that may come up with if I were to use `/tmp` instead. See [this Super User answer](https://superuser.com/a/45509) for more detail.

---

Once that background process with those options is started, Wishlist Lite uses `syscall.Exec` to completely replace the existing Wishlist Lite process with another SSH process, but this time with a single option that just tells it which control socket to use instead of initiating a brand new connection: `-S /dev/shm/control:%h:%p:%r`. Since the entirety of Wishlist Lite relies on the SSH executable, which in turn relies on the validity of the user's SSH configuration, then this too just ends up automatically translating the formatting options into something it can use to find out the correct socket. After all this (it's not _too_ complicated in my eyes) a connection to the desired host just appears as if nothing had happened in the background. This can be demonstrated without Wishlist Lite as well:

```shell
$ # in one terminal
ssh <user name>@<hostname> -o ControlMaster=yes -o ControlPersist=5s -o ControlPath=/dev/shm/control:%h:%p:%r
Welcome to Ubuntu 20.04.1 LTS (GNU/Linux 5.4.0-1036-azure x86_64)

  System information as of Sun Mar 19 10:29:53 UTC 2023

  System load:  0.01               Processes:             130
  Usage of /:   11.6% of 28.90GB   Users logged in:       0
  Memory usage: 39%                IPv4 address for eth0: 10.0.0.4
  Swap usage:   0%

Last login: Fri Mar 17 14:22:40 2023 from ...
<user name>@<hostname>:~$

$ # in another terminal
ssh <user name>@<hostname> -S /dev/shm/control:%h:%p:%r
Last login: Sun Mar 19 10:30:29 2023 from ...
<user name>@<hostname>:~$
<user name>@<hostname>:~$ logout
Shared connection to <hostname> closed.
```

The second connection is near-instantaneous and the only way you can tell that it wasn't the master connection is by the lack of the message-of-the-day, which may or may not be a big deal, and by the "Shared connection to ... closed" message when closing the session.

All in all I would consider this a fantastic find for this particular use case and I'm gleeful that I got this to work without having to refactor my code to not rely on the SSH executable as much as I am. I realize there is possibly a small security concern with having an open socket, but for my own use case I'd consider this a non-issue.
