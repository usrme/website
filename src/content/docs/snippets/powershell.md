---
title: PowerShell
description: PowerShell oneliners.
---
## Get today's date and time where time is set to midnight

```powershell frame="none"
[DateTime]::Today
```

## Show list of logged on users

```powershell frame="none"
query user /server:$SERVER
```

## Log off user by specifying session ID

```powershell frame="none"
logoff <session ID>
```

## Reload a local module

```powershell frame="none"
Import-Module -Name .\module.psd1 -Force
```

## Pretty-print minified JSON

```powershell frame="none"
$String | ConvertFrom-Json | ConvertTo-Json -Depth 100
```

## Convert from Base64

```powershell frame="none"
[Text.Encoding]::Utf8.GetString([Convert]::FromBase64String($String))
```

## Convert string to boolean

```powershell frame="none"
[System.Convert]::ToBoolean($String)
```

## Resolve FQDN

```powershell frame="none"
[System.Net.Dns]::GetHostByName($FQDN)
```
