# Shell

## Basic `for` loop to iterate over lines in a file

```bash
for pkg in $(cat pkgs.txt); do sudo apt purge "$pkg" -y; done
```

## More complex `for` loop using `if` statement

Useful for control actions, cleaning up output, etc.

```bash
for node in $(cat nodes.txt); do \
  echo "Node: ${node}"; \
  ssh -q -t "$node" 'if [[ $(lsblk | grep -i lvm) ]]; then sudo apt install mdadm -y; fi'; \
done
```

## Checking **very** busy log files for their contents

This does not hang your console as opposed to using `tail -f`.

```bash
watch -n 0.5 sudo tail /var/log/named/queries.log
```

## Alternative conditional logic in `for` loop iterating over array variable

Declare `nodes` variable separately or prepend to loop and separate with semicolon.

```bash
for node in "${nodes[@]}"; do \
  ping -c 2 -W 0.1 "$node" > /dev/null && \
  echo "OK: ${node}" || echo "NOT OK: ${node}"; \
done
```

## Use `while` loop to iterate over lines in a file

Avoids calls to `cat` as is the case with the `for` loop example. Using `madison` command rather than `policy` seems to be slightly faster.

```bash
while read pkg; do \
  if [[ $(apt-cache madison "$pkg") ]]; then \
    echo "OK: ${pkg} exists in some repo"; \
  else \
    echo "NOT OK: ${pkg} doesn't exist in any repo"; \
  fi; \
done < pkgs.txt
```

## Match lines into an array

```bash
types=($(grep -oE 'pattern' input.txt))
```

## Grab block of text between two patterns

```bash
sed -n '/pattern1/,/pattern2/p' input.txt
```

## Just see octal permissions for a file or directory

```bash
stat -c '%a' /etc/passwd
```

## Grab last character from string

```bash
last_character=${string_variable:-1}
```

## Parse file list from output of `grep` into subsequent commands

```bash
grep -rl '\-\- MARK \-\-' /var/log/* | \
  while read line; do \
    echo "Working with file '${line}'"; \
    grep MARK "$line" | tail -n1; \
  done
```

## Include lines before and after a `grep` match

```bash
grep -B 3 -A 3 -i "hv_fcopy" /var/log/messages
```

## Find all unique directories in listed directories that contain files modified 10 minutes ago since the command was ran

```bash
ls | xargs -I {} find {} -type f -mmin -10 | cut -d "/" -f2 | sort -u
```

## Find all files in the current directories that were modified at least a minute ago, are larger than 500MB, and long list them

```bash
find . -type f -mmin -1 -size +500M -exec ls -lsh {} \;
```

## Find all files in the current directories that were modified at least a day ago, are larger than 2GB, and empty their contents

```bash
find . -type f -mtime -1 -size +2G -exec bash -c 'echo > {}' \;
```

## Run arbitrary command against a list of directories

```bash
ls | xargs -I {} git -C {} pull
```

## Step-by-step debug Bash scripts

Move ahead with Enter key.

```bash
set -x
trap read debug
```

## Change timezone interactively

```bash
dpkg-reconfigure tzdata
```

## Search binary file that looks like text while ignoring case

```bash
grep -ai "end:" /var/log/syslog
```

## Count time, calls, and errors for each system call when performing a directory listing

```bash
strace -c ls test/
```

## Add to script to determine which line number the execution is at

```bash
echo "DEBUG: ${LINENO}"
```

## Remove duplicated lines from a file without messing up the order

```bash
awk '!visited[$0]++' your_file > deduplicated_file
```

## Run local script on a remote endpoint using SSH

```bash
ssh -q <username>@<endpoint> "sudo bash -s" < local_script.sh
```

## Create new directory and change right into it

### Oneliner

```bash
mkdir new_directory && cd $_
```

### Alias

From [here](https://unix.stackexchange.com/a/9124).

```bash
mkcd () {
  mkdir "$1"
  cd "$1"
}
```

## Recall argument to last used command

From [here](https://stackoverflow.com/a/3371711).

```bash
$_
!$
Alt + .
!:1
!:1-2
```

## Get SSH key fingerprint

### SHA-256

```bash
ssh-keygen -lf ~/.ssh/id_rsa.pub
```

### MD5

```bash
ssh-keygen -E md5 -lf ~/.ssh/id_rsa.pub
```

## Find broken symbolic links in current directory

```bash
find . -xtype l
```

## Bulk fix relative symbolic links

```bash
find . -lname '<relative-to-source target>*' \
  -exec sh -c 'ln -sfn "<new relative-to-source target>/$(basename $0)" $0' {} \;
```

## Run remote script on remote endpoint using SSH

```bash
ssh -q <username>@<endpoint> './location/to/script'
```

## Create ISO from directory without truncating long names (`-l`)

Also by not replacing hyphens with underscores (`-iso-level 4`).

```bash
genisoimage -o data.iso -iso-level 4 -R -l data/
```

## List ISO file contents without having to mount it

```bash
isoinfo -l -i data.iso
```

## Simple colouring for log files, both static and running output

From [here](https://automationrhapsody.com/coloured-log-files-linux/).

```bash
cat test.log | perl -pe 's/^\[\*\].*/\e[0;36m$&\e[0m/g; s/^\[\+\].*/\e[0;32m$&\e[0m/g; s/^\[\!\].*/\e[0;31m$&\e[0m/g'
```

## Suppress Python warnings

For situations like [these](https://github.com/Azure/azure-cli/pull/13435).

```bash
export PYTHONWARNINGS='ignore'
```

## Remove last column in string based on delimiter

```console
$ string='my_underscored_string_12345'
$ echo "$string" | rev | cut -d '_' -f 2- | rev
my_underscored_string
```

## Prefix aliased command with backslash to avoid triggering alias

```console
$ halt -p
REALLY!? -p
$ alias halt
alias halt='echo "REALLY!?"'
$ \halt -p
Connection to example.com closed by remote host.
```

## Pretty print CSV files

From [here](https://www.stefaanlippens.net/pretty-csv.html)

```bash
function pretty_csv {
    perl -pe 's/((?<=,)|(?<=^)),/ ,/g;' "$@" | column -t -s, | less  -F -S -X -K
}

$ pretty_csv data.csv
$ pretty_csv < data.csv
$ sort data.csv | pretty_csv
```

## Pretty print TSV files

```bash
function pretty_tsv {
    perl -pe 's/((?<=\t)|(?<=^))\t/ \t/g;' "$@" | column -t -s $'\t' | less  -F -S -X -K
}

$ pretty_tsv data.tsv
$ pretty_tsv < data.tsv
$ sort data.tsv | pretty_tsv
```

## Diff two files and save unified output to file

```bash
diff -u file1 file2 > files.diff
```

## Show build information for cloud-based image

```console
$ cat /etc/cloud/build.info 
build_name: server
serial: 20201211.1
```

## Show top disk usage and exclude certain directories under root

```bash
du -Sh / --exclude=/{proc,sys,dev,var} | sort -rh | head -n 10
```

## Use the built-in `:` as a short-hand for an infinite loop

```bash
while :; do "looping"; done
```

## Re-execute a Bash to 'unsource' variables and aliases

```bash
exec /bin/bash
```

## Use binary version of `time` instead of Bash built-in

This provides access to more information. From [here](https://stackoverflow.com/questions/9006596/is-the-unix-time-command-accurate-enough-for-benchmarks).

```bash
$(which time) --verbose echo "test"
```

## Use `perf stat` to easily repeat a command

Also provides additional useful measurements. More examples [here](https://usrme.xyz/tils/perf-is-more-robust-for-repeated-timings-than-time/)

```bash
perf stat --null --repeat 5 --table echo "test"
```

## Change nested key value in an array of JSON objects with `jq`

```text
.parameters.vmObjects.value |= map(if .vmName == "router" then .moduleSnapshot = "fixed" else . end)
```

## Use indirect references to use dynamic variable names

```bash
for host in "${hosts[@]}"; do
  declare "parent_disk_${host}=$parent_disk"
done

for host in "${hosts[@]}"; do
  parent_disk="parent_disk_${host}"
  echo "${!parent_disk}"
done
```

## Test terminal's colors

```bash
msgcat --color=test
```

## Bulk rename files in place

```bash
find . -type f -name '<file name>' -execdir mv {} "description.txt" \;
```

## Encode with Base64 on a single line

```bash
echo "text" | base64 -w 0
```

## Convert PEM to single-line

```bash
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' combined.pem
```

## Install requirements for Poetry using existing `requirements.txt`

```bash
cat requirements.txt | xargs poetry add
```

## Direct standard output to a file in a directory that might not yet exist

```bash
echo "something" | install -D /dev/stdin directory/file.txt
```

## Find and delete files older than 1 year

```bash
find /the/dir/to/start/in -type f -mtime +365 -ls -exec rm -f -- {} \;
```

## View permissions as a tree

- `-p`: permissions
- `-u`: username/userid
- `-f`: full path
- `-i`: don't print indentation lines
- `-d`: print directories only

```bash
tree -pufid
```

## Bulk uninstall `pip` packages according to a wildcard

```bash
pip freeze | grep "azure*" | xargs -n 1 pip uninstall -y
```

## Show transaction history for a package

```bash
dnf history list <package>
```

## Show information about specific transaction in history

More on ['history'](https://www.putorius.net/dnf-history.html)

```bash
dnf history info <transaction ID>
```

## Undo last transaction

```bash
dnf history undo last
```

## List SystemD timers

```bash
systemctl list-timers
```

## Show execution of service tied to a timer of an identical name

```bash
journalctl -u name.timer
journalctl -u name.service
```

## Copy remote directory to local system

```bash
scp -rCp <user>@<remote>:<remote path> <local path>
# OR (faster)
rsync -azvhP <user>@<remote>:<remote path> <local path>
```

## Overwrite existing directory with contents from another

```bash
rsync -av --delete ~/new/ ~/old
```

## Count number of installed kernels

```console
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

```console
$ sudo dnf install python3-dnf-plugins-extras-versionlock
$ # List kernel packages
$ rpm -qa kernel
kernel-6.0.18-300.fc37.x86_64
kernel-6.1.7-200.fc37.x86_64
kernel-6.1.8-200.fc37.x86_64
$ sudo dnf versionlock add kernel-6.0.18-300.fc37.x86_64
Last metadata expiration check: 3:51:11 ago on E 30 jaan  2023 15:47:21.
Adding versionlock on: kernel-0:6.0.18-300.fc37.*
$ # Remove pin
$ sudo dnf versionlock delete kernel-6.0.18-300.fc37.x86_64
...
```

## Undo ad hoc changes made to a SystemD service

For example `systemd-resolved`.

```console
$ systemctl revert systemd-resolved.service
Removed "/etc/systemd/system/systemd-resolved.service.d/override.conf".
Removed "/etc/systemd/system/systemd-resolved.service.d".
$ systemctl restart systemd-resolved.service
```

## Back up a file using brace expansion

Equivalent to `cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak`. More on [brace expansion](https://www.gnu.org/software/bash/manual/html_node/Brace-Expansion.html).

```bash
cp /etc/ssh/sshd_config{,.bak}
```

The same can be applied for directories:

```bash
cp -aR public{,.bak}
```

## Restore a backed up file

Equivalent to `cp /etc/ssh/sshd_config.bak /etc/ssh/sshd_config`.

```bash
cp /etc/ssh/sshd_config{.bak,}
```

## Download older version of a kernel

- More information about [Koji](https://docs.fedoraproject.org/en-US/quick-docs/kernel/installing-koji-kernel/)
- A list of all [kernels built for Fedora](https://bodhi.fedoraproject.org/updates/?packages=kernel)
- A list of [downloadable kernels built for Fedora](https://koji.fedoraproject.org/koji/packageinfo?packageID=8)
  - Some may be removed

Fedora Discussion [here](https://discussion.fedoraproject.org/t/how-do-i-install-an-old-kernel/76942).

```bash
koji download-build --arch=x86_64 <kernel package name>
```
