---
title: Vim
description: Vim oneliners.
---
## Write file opened as 'readonly'

```vim
:w !sudo tee "%"
```

## Visual editing can be used to delete any number of lines

Shift+V from point of cursor and press D key to delete

## Search and replace

```vim
:%s/search/replace/g
```

## Disable search highlight

```vim
:noh
```
