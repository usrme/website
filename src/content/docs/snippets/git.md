---
title: Git
description: Git oneliners.
---
## Push existing repository to new remote

```bash frame="none"
git remote add <name of new remote> <HTTPS or SSH URL>
git push <name of new remote> master
```

## Pretty-print branch graph

```bash frame="none"
git log --all --decorate --oneline --graph
```

## Move `master` back X amount of commits

```bash frame="none"
git checkout master
git reset --hard <old_commit_id>
git push -f origin master
```

## Replay changes on `master` to some other branch

Beware of blindly accepting any incoming changes in favor of your own. From [here](https://demisx.github.io/git/rebase/2015/07/02/git-rebase-keep-my-branch-changes.html).

```bash frame="none"
git checkout master
git pull
git checkout different_branch
git rebase -Xtheirs master
git push --force
```

## Show changed files in specified commit hash

From [here](https://stackoverflow.com/questions/49853177/how-to-see-which-files-were-changed-in-last-commit).

```bash frame="none"
git diff-tree --no-commit-id --name-only <commit hash>
```

## Create patch file from diff

```bash frame="none"
git diff file.json > file.patch
```

## Create patch file from commit

```bash frame="none"
git show <commit hash> > commit.patch
```

## Apply patch file

```bash frame="none"
git apply commit.patch
```

## Bulk create patch files from individual files when running `git diff` in a repository

From [here](https://raymii.org/s/tutorials/bash frame="none"_bits_split_a_file_in_blocks_and_do_something_with_each_block.html).

```bash frame="none"
OLDIFS=$IFS; IFS=';' \
  blocks=$(git diff | sed -n '/diff/,/(diff|$)/ {/diff / s/^/\;/; p}'); \
  for block in ${blocks#;}; do \
    echo "$block" > $(echo "$block" | head -n 1 | rev | cut -d "/" -f 1 | rev).patch; \
  done; \
IFS=$OLDIFS
```

## Show diff of stashed hunk

```bash frame="none"
git stash show -p [stash@{N}]
```

## Bulk create separate stashes of every changed file with a message equaling the filename

```bash frame="none"
git status -s | cut -d " " -f 3 | xargs -I {} git stash push {} -m "{}"
```

## Pop every entry from the stash back to the working tree

```bash frame="none"
git stash list | cut -d ":" -f 1 | xargs -I {} git stash pop
```

## Move unpushed commits to a new branch

Pull latest changes from 'origin/master' if haven't already. From [here](https://stackoverflow.com/a/46726955).

```bash frame="none"
git checkout -b new_branch
git checkout master
git reset --hard origin/master
```

## Copy commit to current branch

```bash frame="none"
git cherry-pick <commit hash>
```

## Undo pushed commit that nobody has yet pulled

```bash frame="none"
git reset HEAD^ --hard
git push --force origin
```

## View history of specific function in file

```bash frame="none"
git log -L :<function>:<file>
```

## Speed up Git for larger repositories

```bash frame="none"
git config feature.manyFiles 1
```

## Search through history for a specific word

```bash frame="none"
git rev-list --all | ( while read revision; do git grep -F 'word' "$revision"; done; )
```

## Delete remote branch

```bash frame="none"
git push origin --delete branch/name
```

## Bulk reset author of multiple (unpushed) commits (e.g. 9)

Set correct user name and email prior to this.

```bash frame="none"
git rebase --onto HEAD~9 --exec "git commit --amend --reset-author --no-edit" HEAD~9
```

## Re-order commits

Oldest commit will be at the top. Move commit down with `ddp`. Move commit up with `ddkP`

```bash frame="none"
git rebase --interactive
```

## Search for 'something' in a commit message

```bash frame="none"
git log --all -i --grep='something'
```

## Search for 'something' through all commits' contents

```bash frame="none"
git grep 'something' $(git rev-list --all)
```

## Clean new untracked files and directories

- `-d`: recurse into directories as well
- `-f`: go ahead with deletion
- `-n`: dry-run

```console frame="none"
$ git clean -dn
Would remove mdbook
Would remove public/snippets/
```

```console frame="none"
$ git clean -df
Removing mdbook
Removing public/snippets/
```

## Various Git aliases

[Here](https://www.hschne.at/git-aliases/)

## Find out number of changes per author per file

```bash frame="none"
git log --pretty=format:'%an' <file> | sort | uniq -c | sort -u | sort -n
```
