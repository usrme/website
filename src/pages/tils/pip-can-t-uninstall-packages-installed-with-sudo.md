---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-04-26
title: "'pip' can't uninstall packages installed with 'sudo'"
tags: ["pip", "python"]
---
Mind-boggling, I know, but having never actually run into this before I thought you could at least force the uninstallation process through `pip` somehow, but it turns out that you can't:

```shell
$ cat pip_uninstall.txt | xargs -I {} pip uninstall -y {}
Found existing installation: azure-keyvault 4.0.0
Not uninstalling azure-keyvault at /usr/lib/python3/dist-packages, outside environment /usr
Can't uninstall 'azure-keyvault'. No files were found to uninstall.
Found existing installation: azure-common 1.1.24
Not uninstalling azure-common at /usr/lib/python3/dist-packages, outside environment /usr
Can't uninstall 'azure-common'. No files were found to uninstall.
...
```

This is the case both under the `root` user or any other user who can leverage `sudo` to try and perform the uninstallation. The only way seems to be to go and muck around in `/usr/lib/python3/dist-packages` with `rm -rf`, but even if I know exactly what I need to uninstall, then doing that just seems like a recipe for disaster.
