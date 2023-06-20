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

## Prepend multiple lines with a character

* Shift+V from point of cursor to enter Visual Block mode
* Move up/down to select multiple lines
* `:` to enter commands
* `s/^/#/g` to replace first character on the lines with a `#`

The prompt will look something like when all done: `:'<,'>s/^/#/g`
