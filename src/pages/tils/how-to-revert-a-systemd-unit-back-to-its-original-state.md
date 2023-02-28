---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2023-02-28
title: How to revert a SystemD unit back to its original state
tags: ["linux", "cli"]
---
I was faffing about with the `systemd-resolved` service today and wanted to increase the verbosity of its logging, which I did through `systemctl edit systemd-resolved`. That opened up an editor where I just added the following:

```
[Service]
Environment=SYSTEMD_LOG_LEVEL=debug
```

And restarted the service. Now though I didn't want to go spelunking for the override file myself (I know it lives under `/etc/systemd/system`, but still) and go through the rigamarole of reverting it myself. Turns out one can just use the `systemctl revert` command:

```shell
$ systemctl revert systemd-resolved.service
Removed "/etc/systemd/system/systemd-resolved.service.d/override.conf".
Removed "/etc/systemd/system/systemd-resolved.service.d".
```

Afterwards just `systemctl restart systemd-resolved` and that's it!

This command is useful if you know you've ever modified a unit file at some other point in time and just want to go back to how it was originally. From [its man page](https://www.mankier.com/1/systemctl) (emphasis mine):

> Revert one or more unit files to their vendor versions. This command removes drop-in configuration files that modify the specified units, as well as any user-configured unit file that overrides a matching vendor supplied unit file. Specifically, for a unit "foo.service" the matching directories "foo.service.d/" with all their contained files are removed, both below the persistent and runtime configuration directories (i.e. below /etc/systemd/system and /run/systemd/system); if the unit file has a vendor-supplied version (i.e. a unit file located below /usr/) any matching persistent or runtime unit file that overrides it is removed, too. Note that if a unit file has no vendor-supplied version (i.e. is only defined below /etc/systemd/system or /run/systemd/system, but not in a unit file stored below /usr/), then it is not removed. Also, if a unit is masked, it is unmasked.
>
> **Effectively, this command may be used to undo all changes made with `systemctl edit`, `systemctl set-property` and `systemctl mask` and puts the original unit file with its settings back in effect.**
