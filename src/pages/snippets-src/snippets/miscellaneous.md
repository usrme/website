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
