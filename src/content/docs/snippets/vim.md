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

### In the current file

```vim
:%s/search/replace/g
```

### Across all directories

* Open Telescope with fuzzy finding: `<leader>fw`
* Type in search term
* Add all results to quickfix list: `<Ctrl-q>`
  * Alternatively, press Tab on every desired entry
* Type the following command: `:cfdo %s/search/replace/g`
* Write all changes: `:wa`

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

## Format to certain column width

* Set text width to desired width: `:set textwidth=80`
* Move to start of file: `gg`
* Format text from start to the end: `gqG`
  * Use visual mode the selectively format (don't move to start of the file in that case)

## Measure start-up speed

* `hyperfine "nvim --headless +qa" --warmup 5`
* `nvim --startuptime startup.log -c exit && tail -100 startup.log`

## Re-indent according to file type

* A single line: `==`
* A range of lines: `<range>==`
* Entire file: `gg=G`
  * Probably won't be as intelligent as a language-specific formatter
