---
title: Shell
description: Shell oneliners.
---
## Basic `for` loop to iterate over lines in a file

```bash frame="none"
for pkg in $(cat pkgs.txt); do sudo apt purge "$pkg" -y; done
```

## More complex `for` loop using `if` statement

Useful for control actions, cleaning up output, etc.

```bash frame="none"
for node in $(cat nodes.txt); do \
  echo "Node: ${node}"; \
  ssh -q -t "$node" 'if [[ $(lsblk | grep -i lvm) ]]; then sudo apt install mdadm -y; fi'; \
done
```

## Checking **very** busy log files for their contents

This does not hang your console frame="none" as opposed to using `tail -f`.

```bash frame="none"
watch -n 0.5 sudo tail /var/log/named/queries.log
```

## Alternative conditional logic in `for` loop iterating over array variable

Declare `nodes` variable separately or prepend to loop and separate with semicolon.

```bash frame="none"
for node in "${nodes[@]}"; do \
  ping -c 2 -W 0.1 "$node" > /dev/null && \
  echo "OK: ${node}" || echo "NOT OK: ${node}"; \
done
```

## Use `while` loop to iterate over lines in a file

Avoids calls to `cat` as is the case with the `for` loop example. Using `madison` command rather than `policy` seems to be slightly faster.

```bash frame="none"
while read pkg; do \
  if [[ $(apt-cache madison "$pkg") ]]; then \
    echo "OK: ${pkg} exists in some repo"; \
  else \
    echo "NOT OK: ${pkg} doesn't exist in any repo"; \
  fi; \
done < pkgs.txt
```

## Match lines into an array

```bash frame="none"
types=($(grep -oE 'pattern' input.txt))
```

## Grab block of text between two patterns

```bash frame="none"
sed -n '/pattern1/,/pattern2/p' input.txt
```

## Just see octal permissions for a file or directory

```bash frame="none"
stat -c '%a' /etc/passwd
```

## Grab last character from string

```bash frame="none"
last_character=${string_variable:-1}
```

## Parse file list from output of `grep` into subsequent commands

```bash frame="none"
grep -rl '\-\- MARK \-\-' /var/log/* | \
  while read line; do \
    echo "Working with file '${line}'"; \
    grep MARK "$line" | tail -n1; \
  done
```

## Include lines before and after a `grep` match

```bash frame="none"
grep -B 3 -A 3 -i "hv_fcopy" /var/log/messages
```

## Find all unique directories in listed directories that contain files modified 10 minutes ago since the command was ran

```bash frame="none"
ls | xargs -I {} find {} -type f -mmin -10 | cut -d "/" -f2 | sort -u
```

## Find all files in the current directories that were modified at least a minute ago, are larger than 500MB, and long list them

```bash frame="none"
find . -type f -mmin -1 -size +500M -exec ls -lsh {} \;
```

## Find all files in the current directories that were modified at least a day ago, are larger than 2GB, and empty their contents

```bash frame="none"
find . -type f -mtime -1 -size +2G -exec bash frame="none" -c 'echo > {}' \;
```

## Run arbitrary command against a list of directories

```bash frame="none"
ls | xargs -I {} git -C {} pull
```

## Step-by-step debug bash frame="none" scripts

Move ahead with Enter key.

```bash frame="none"
set -x
trap read debug
```

## Change timezone interactively

```bash frame="none"
dpkg-reconfigure tzdata
```

## Search binary file that looks like text while ignoring case

```bash frame="none"
grep -ai "end:" /var/log/syslog
```

## Count time, calls, and errors for each system call when performing a directory listing

```bash frame="none"
strace -c ls test/
```

## Add to script to determine which line number the execution is at

```bash frame="none"
echo "DEBUG: ${LINENO}"
```

## Remove duplicated lines from a file without messing up the order

```bash frame="none"
awk '!visited[$0]++' your_file > deduplicated_file
```

## Run local script on a remote endpoint using SSH

```bash frame="none"
ssh -q <username>@<endpoint> "sudo bash frame="none" -s" < local_script.sh
```

## Create new directory and change right into it

### Oneliner

```bash frame="none"
mkdir new_directory && cd $_
```

### Alias

From [here](https://unix.stackexchange.com/a/9124).

```bash frame="none"
mkcd () {
  mkdir "$1"
  cd "$1"
}
```

## Recall argument to last used command

From [here](https://stackoverflow.com/a/3371711).

```bash frame="none"
$_
!$
Alt + .
!:1
!:1-2
```

## Get SSH key fingerprint

### SHA-256

```bash frame="none"
ssh-keygen -lf ~/.ssh/id_rsa.pub
```

### MD5

```bash frame="none"
ssh-keygen -E md5 -lf ~/.ssh/id_rsa.pub
```

## Find broken symbolic links in current directory

```bash frame="none"
find . -xtype l
```

## Bulk fix relative symbolic links

```bash frame="none"
find . -lname '<relative-to-source target>*' \
  -exec sh -c 'ln -sfn "<new relative-to-source target>/$(basename $0)" $0' {} \;
```

## Run remote script on remote endpoint using SSH

```bash frame="none"
ssh -q <username>@<endpoint> './location/to/script'
```

## Create ISO from directory without truncating long names (`-l`)

Also by not replacing hyphens with underscores (`-iso-level 4`).

```bash frame="none"
genisoimage -o data.iso -iso-level 4 -R -l data/
```

## List ISO file contents without having to mount it

```bash frame="none"
isoinfo -l -i data.iso
```

## Simple colouring for log files, both static and running output

From [here](https://automationrhapsody.com/coloured-log-files-linux/).

```bash frame="none"
cat test.log | perl -pe 's/^\[\*\].*/\e[0;36m$&\e[0m/g; s/^\[\+\].*/\e[0;32m$&\e[0m/g; s/^\[\!\].*/\e[0;31m$&\e[0m/g'
```

## Suppress Python warnings

For situations like [these](https://github.com/Azure/azure-cli/pull/13435).

```bash frame="none"
export PYTHONWARNINGS='ignore'
```

## Remove last column in string based on delimiter

```console frame="none"
$ string='my_underscored_string_12345'
$ echo "$string" | rev | cut -d '_' -f 2- | rev
my_underscored_string
```

## Prefix aliased command with backslash to avoid triggering alias

```console frame="none"
$ halt -p
REALLY!? -p
$ alias halt
alias halt='echo "REALLY!?"'
$ \halt -p
Connection to example.com closed by remote host.
```

## Pretty print CSV files

From [here](https://www.stefaanlippens.net/pretty-csv.html)

```bash frame="none"
function pretty_csv {
    perl -pe 's/((?<=,)|(?<=^)),/ ,/g;' "$@" | column -t -s, | less  -F -S -X -K
}

$ pretty_csv data.csv
$ pretty_csv < data.csv
$ sort data.csv | pretty_csv
```

## Pretty print TSV files

```bash frame="none"
function pretty_tsv {
    perl -pe 's/((?<=\t)|(?<=^))\t/ \t/g;' "$@" | column -t -s $'\t' | less  -F -S -X -K
}

$ pretty_tsv data.tsv
$ pretty_tsv < data.tsv
$ sort data.tsv | pretty_tsv
```

## Diff two files and save unified output to file

```bash frame="none"
diff -u file1 file2 > files.diff
```

## Show build information for cloud-based image

```console frame="none"
$ cat /etc/cloud/build.info 
build_name: server
serial: 20201211.1
```

## Show top disk usage and exclude certain directories under root

```bash frame="none"
du -Sh / --exclude=/{proc,sys,dev,var} | sort -rh | head -n 10
```

## Use the built-in `:` as a short-hand for an infinite loop

```bash frame="none"
while :; do "looping"; done
```

## Re-execute a bash frame="none" to 'unsource' variables and aliases

```bash frame="none"
exec /bin/bash frame="none"
```

## Use binary version of `time` instead of bash frame="none" built-in

This provides access to more information. From [here](https://stackoverflow.com/questions/9006596/is-the-unix-time-command-accurate-enough-for-benchmarks).

```bash frame="none"
$(which time) --verbose echo "test"
```

## Use `perf stat` to easily repeat a command

Also provides additional useful measurements. More examples [here](https://usrme.xyz/tils/perf-is-more-robust-for-repeated-timings-than-time/)

```bash frame="none"
perf stat --null --repeat 5 --table echo "test"
```

## Change nested key value in an array of JSON objects with `jq`

```text
.parameters.vmObjects.value |= map(if .vmName == "router" then .moduleSnapshot = "fixed" else . end)
```

## Use indirect references to use dynamic variable names

```bash frame="none"
for host in "${hosts[@]}"; do
  declare "parent_disk_${host}=$parent_disk"
done

for host in "${hosts[@]}"; do
  parent_disk="parent_disk_${host}"
  echo "${!parent_disk}"
done
```

## Test terminal's colors

```bash frame="none"
msgcat --color=test
```

## Bulk rename files in place

```bash frame="none"
find . -type f -name '<file name>' -execdir mv {} "description.txt" \;
```

## Encode with Base64 on a single line

```bash frame="none"
echo "text" | base64 -w 0
```

## Convert PEM to single-line

```bash frame="none"
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' combined.pem
```

## Install requirements for Poetry using existing `requirements.txt`

```bash frame="none"
cat requirements.txt | xargs poetry add
```

## Direct standard output to a file in a directory that might not yet exist

```bash frame="none"
echo "something" | install -D /dev/stdin directory/file.txt
```

## Find and delete files older than 1 year

```bash frame="none"
find /the/dir/to/start/in -type f -mtime +365 -ls -exec rm -f -- {} \;
```

## View permissions as a tree

- `-p`: permissions
- `-u`: username/userid
- `-f`: full path
- `-i`: don't print indentation lines
- `-d`: print directories only

```bash frame="none"
tree -pufid
```

## Bulk uninstall `pip` packages according to a wildcard

```bash frame="none"
pip freeze | grep "azure*" | xargs -n 1 pip uninstall -y
```

## Show transaction history for a package

```bash frame="none"
dnf history list <package>
```

## Show information about specific transaction in history

More on ['history'](https://www.putorius.net/dnf-history.html)

```bash frame="none"
dnf history info <transaction ID>
```

## Undo last transaction

```bash frame="none"
dnf history undo last
```

## List SystemD timers

```bash frame="none"
systemctl list-timers
```

## Show execution of service tied to a timer of an identical name

```bash frame="none"
journalctl -u name.timer
journalctl -u name.service
```

## Copy remote directory to local system

```bash frame="none"
scp -rCp <user>@<remote>:<remote path> <local path>
# OR (faster)
rsync -azvhP <user>@<remote>:<remote path> <local path>
```

## Overwrite existing directory with contents from another

```bash frame="none"
rsync -av --delete ~/new/ ~/old
```

## Count number of installed kernels

```console frame="none"
$ sudo dnf list --installed kernel-core* | tail -n +2 | wc -l
9
```

## Increase number of installed kernels in `/etc/dnf/dnf.conf`

```text
...
installonly_limit=10
...
```

## Pin specific kernel version

```console frame="none"
$ sudo dnf install python3-dnf-plugins-extras-versionlock
$ # List kernel packages
$ rpm -qa kernel
kernel-6.0.18-300.fc37.x86_64
kernel-6.1.7-200.fc37.x86_64
kernel-6.1.8-200.fc37.x86_64
$ Add pin
$ sudo dnf versionlock add kernel-6.0.18-300.fc37.x86_64
Last metadata expiration check: 3:51:11 ago on E 30 jaan  2023 15:47:21.
Adding versionlock on: kernel-0:6.0.18-300.fc37.*
$ # Remove pin
$ sudo dnf versionlock delete kernel-6.0.18-300.fc37.x86_64
...
```

## Undo ad hoc changes made to a SystemD service

For example `systemd-resolved`.

```console frame="none"
$ systemctl revert systemd-resolved.service
Removed "/etc/systemd/system/systemd-resolved.service.d/override.conf".
Removed "/etc/systemd/system/systemd-resolved.service.d".
$ systemctl restart systemd-resolved.service
```

## Back up a file using brace expansion

Equivalent to `cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak`. More on [brace expansion](https://www.gnu.org/software/bash frame="none"/manual/html_node/Brace-Expansion.html).

```bash frame="none"
cp /etc/ssh/sshd_config{,.bak}
```

The same can be applied for directories:

```bash frame="none"
cp -aR public{,.bak}
```

## Restore a backed up file

Equivalent to `cp /etc/ssh/sshd_config.bak /etc/ssh/sshd_config`.

```bash frame="none"
cp /etc/ssh/sshd_config{.bak,}
```

## Download older version of a kernel

- More information about [Koji](https://docs.fedoraproject.org/en-US/quick-docs/kernel/installing-koji-kernel/)
- A list of all [kernels built for Fedora](https://bodhi.fedoraproject.org/updates/?packages=kernel)
- A list of [downloadable kernels built for Fedora](https://koji.fedoraproject.org/koji/packageinfo?packageID=8)
  - Some may be removed

Fedora Discussion [here](https://discussion.fedoraproject.org/t/how-do-i-install-an-old-kernel/76942).

```bash frame="none"
koji download-build --arch=x86_64 <kernel package name>
```

## Read lines from a file into an array and execute in parallel

```bash frame="none"
$ readarray -t items < items.txt
$ parallel -kj 20 echo {1} ::: "${items[@]}"
```

## Verify SSL certificate against domain

```bash frame="none"
openssl s_client -connect google.com:443 2> /dev/null | openssl x509 -noout -dates
```

## Run programs with 'systemd-run' to leverage SystemD's features

Documentation [here](https://www.freedesktop.org/software/systemd/man/systemd-run.html).

```bash frame="none"
$ systemd-run env
Running as unit: run-19945.service
$ journalctl -u run-19945.service
Sep 08 07:37:21 bupkis systemd[1]: Starting /usr/bin/env...
Sep 08 07:37:21 bupkis systemd[1]: Started /usr/bin/env.
Sep 08 07:37:21 bupkis env[19948]: PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
Sep 08 07:37:21 bupkis env[19948]: LANG=en_US.UTF-8
Sep 08 07:37:21 bupkis env[19948]: BOOT_IMAGE=/vmlinuz-3.11.0-0.rc5.git6.2.fc20.x86_64
```

## Working with 'screen'

- Start a session: `screen`
- Start any long-running commands
- Detach from session: `Ctrl+A+D`
- List sessions: `screen -ls`
- Attach to a running session: `screen -r <session ID>`

## Don't send anything identifiable over SSH

```bash frame="none"
ssh -a -i /dev/null -o IdentityAgent=/dev/null whoami.filippo.io
```
