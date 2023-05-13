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

## Download audio and video using 'youtube-dl'

- List available formats for a video:

```console
$ youtube-dl -F https://www.youtube.com/watch?v=H5ejv-dTAaU
[youtube] H5ejv-dTAaU: Downloading webpage
[info] Available formats for H5ejv-dTAaU:
format code  extension  resolution note
249          webm       audio only tiny   50k , webm_dash container, opus  (48000Hz), 8.42MiB
250          webm       audio only tiny   60k , webm_dash container, opus  (48000Hz), 10.01MiB
251          webm       audio only tiny  109k , webm_dash container, opus  (48000Hz), 18.14MiB
140          m4a        audio only tiny  129k , m4a_dash container, mp4a.40.2 (44100Hz), 21.54MiB
160          mp4        256x144    144p   22k , mp4_dash container, avc1.4d400c, 24fps, video only, 3.76MiB
278          webm       256x144    144p   57k , webm_dash container, vp9, 24fps, video only, 9.51MiB
133          mp4        426x240    240p   42k , mp4_dash container, avc1.4d4015, 24fps, video only, 7.12MiB
242          webm       426x240    240p   62k , webm_dash container, vp9, 24fps, video only, 10.39MiB
134          mp4        640x360    360p   76k , mp4_dash container, avc1.4d401e, 24fps, video only, 12.77MiB
243          webm       640x360    360p  124k , webm_dash container, vp9, 24fps, video only, 20.72MiB
135          mp4        854x480    480p  111k , mp4_dash container, avc1.4d401e, 24fps, video only, 18.47MiB
244          webm       854x480    480p  189k , webm_dash container, vp9, 24fps, video only, 31.49MiB
136          mp4        1280x720   720p  165k , mp4_dash container, avc1.4d401f, 24fps, video only, 27.51MiB
247          webm       1280x720   720p  331k , webm_dash container, vp9, 24fps, video only, 55.13MiB
137          mp4        1920x1080  1080p  627k , mp4_dash container, avc1.640028, 24fps, video only, 104.35MiB
248          webm       1920x1080  1080p  633k , webm_dash container, vp9, 24fps, video only, 105.45MiB
18           mp4        640x360    360p  343k , avc1.42001E, 24fps, mp4a.40.2 (44100Hz), 57.20MiB
22           mp4        1280x720   720p  294k , avc1.64001F, 24fps, mp4a.40.2 (44100Hz) (best)
```

- Combine audio-only and video-only formats, and start downloading

```console
$ youtube-dl -f 248+251 https://www.youtube.com/watch?v=H5ejv-dTAaU
[youtube] H5ejv-dTAaU: Downloading webpage
[dashsegments] Total fragments: 11
[download] Destination: The Death of Globalization!-H5ejv-dTAaU.f248.webm
[download] 100% of 105.45MiB in 01:32
[dashsegments] Total fragments: 2
[download] Destination: The Death of Globalization!-H5ejv-dTAaU.f251.webm
[download] 100% of 18.14MiB in 00:47
[ffmpeg] Merging formats into "The Death of Globalization!-H5ejv-dTAaU.webm"
Deleting original file The Death of Globalization!-H5ejv-dTAaU.f248.webm (pass -k to keep)
Deleting original file The Death of Globalization!-H5ejv-dTAaU.f251.webm (pass -k to keep)
```
