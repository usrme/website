---
title: PowerShell
description: PowerShell oneliners.
---
## Get today's date and time where time is set to midnight

```powershell
[DateTime]::Today
```

## Show list of logged on users

```powershell
query user /server:$SERVER
```

## Log off user by specifying session ID

```powershell
logoff <session ID>
```

## Reload a local module

```powershell
Import-Module -Name .\module.psd1 -Force
```

## Pretty-print minified JSON

```powershell
$String | ConvertFrom-Json | ConvertTo-Json -Depth 100
```

## Convert from Base64

```powershell
[Text.Encoding]::Utf8.GetString([Convert]::FromBase64String($String))
```

## Convert string to boolean

```powershell
[System.Convert]::ToBoolean($String)
```

## Resolve FQDN

```powershell
[System.Net.Dns]::GetHostByName($FQDN)
```
