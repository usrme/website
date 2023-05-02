# Miscellaneous

## Create colored prompt with Git branch for Windows terminals

For example ConEmu.

```text
PS1='${debian_chroot:+($debian_chroot)}\[\033[01;35m\] \w\[\033[01;33m\]$(__git_ps1)\[\033[01;m\] > '
```

## JMESPath query differences

- Query in [JMESPath website](https://jmespath.org/):

```text
[?tags.currently-used == 'False' || tags.currently_used == 'False'].name
```

- Same query in `jpterm`:

```text
[?tags."currently-used" == 'False' || tags."currently_used" == 'False']
```

- Same query in console:

```text
"[?tags.\"currently-used\" == 'False' || tags.\"currently_used\" == 'False'].name"
```

## Convert x265 MP4 to x264

```shell
ffmpeg -i input.mp4 -c:v libx264 -crf 20 -c:a copy output.mp4`
```

## Create Windows install media in Linux

- Download [WoeUSB](https://github.com/WoeUSB/WoeUSB)
- Download [Windows 10 ISO](https://www.microsoft.com/en-us/software-download/windows10ISO)
- Find out USB's disk: `sudo fdisk --list`
- Wipe disk entirely and burn ISO: `sudo ./woeusb-5.2.4.bash --target-filesystem NTFS --device Win10_22H2_EnglishInternational_x64.iso /dev/sda`

## Install specific version of Flatpak package

- Find relevant commit:

```console
$ flatpak remote-info --log flathub org.signal.Signal
        ID: org.signal.Signal
       Ref: app/org.signal.Signal/x86_64/stable
      Arch: x86_64
    Branch: stable
Collection: org.flathub.Stable
  Download: 150,0 MB
 Installed: 422,3 MB
   Runtime: org.freedesktop.Platform/x86_64/22.08
       Sdk: org.freedesktop.Sdk/x86_64/22.08

    Commit: 7a69cbffa53f8d4962a0a15cfd4c941537c9d2aab7e5175757848f3985adf35c
    Parent: 0a4d650514861c74f5a3a559c9116104922b9aeb4cdcaedc1b364d97b158031a
   Subject: Update signal-desktop.deb to 6.16.0 (8c5276b3)
      Date: 2023-04-26 03:05:43 +0000
   History: 

    Commit: 0a4d650514861c74f5a3a559c9116104922b9aeb4cdcaedc1b364d97b158031a
   Subject: Remove unnecessary permissions (#438) (3f78ec79)
      Date: 2023-04-25 08:09:46 +0000

    Commit: 92c53789a85b84f79248e03ddc5fb6c664f17ef988e98fc196d157d5d77a73bf
   Subject: Update org.signal.Signal.metainfo.xml (74c6adfa)
      Date: 2023-04-20 10:47:54 +0000

    ...
```

- Install it:

```console
$ flatpak update --commit=0a4d650514861c74f5a3a559c9116104922b9aeb4cdcaedc1b364d97b158031a org.signal.Signal
Looking for updates…

        ID                         Branch         Op         Remote          Download
 1. [✓] org.signal.Signal          stable         u          flathub         62,2 MB / 166,6 MB

Updates complete.
```
