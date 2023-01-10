---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2020-01-11
title: More ways to clean up PowerShell code
---
Let it be known that I am stickler for clean and readable code, and with that come many moments of yak shaving before I feel good about the "final" version of the code. These are some of the methods I have come across that have helped me. Though I would have preferred to have a really nice and impressively long post written about the many ways I clean up my own code, then I am still, once again, coming back to Max Böck's [Good Enough](https://mxb.dev/blog/good-enough/), so here it is as it is. It may get added upon, but don't count on it.

## Splat calculated properties

A lot of people might be familiar with regular splatting, which allows us to clean up long lines (and they can get _really_ long) such as this:

```powershell
Get-AzLog -ResourceGroupName 'rg-eed5657e-c2ca-410f-8aff-f839492ba7b6' -StartTime '2019-12-27T10:30' -EndTime '2019-12-27T11:30' -Verbose
```

to something like this:

```powershell
$AzLogParams = @{
    ResourceGroupName = 'rg-eed5657e-c2ca-410f-8aff-f839492ba7b6'
    StartTime = '2019-12-27T10:30'
    EndTime = '2019-12-27T11:30'
    Verbose = $true
}

Get-AzLog @AzLogParams
```

And this could be cleaned up even further by using well-named variables, but when you now need to parse the output of the `Get-AzLog` command and get one of its many properties, then you will run into an issue where almost all of the useful properties need additional calculations. This is where splatting calculated properties comes in!

```powershell
Get-AzLog -ResourceGroupName 'rg-eed5657e-c2ca-410f-8aff-f839492ba7b6' -StartTime (Get-Date).AddDays(-1) | Select-Object -Property @{n='EventTimeStamp'; e={ Get-Date -Date ($_.EventTimeStamp) -Format 's' } }, @{n='Operation'; e={$Result = $_.OperationName.value -split '/'; $Result[-2], $Result[-1] -join ' - '}}, @{n='Resource'; e={($_.ResourceId -split '/')[-1]}}, @{n='Status'; e={$_.Status.value}}, @{n='SubStatus'; e={$_.SubStatus.LocalizedValue}}
```

I think we can all agree that the command above is far too long and requires far too much effort to grok. You could just shorten the first bit by splatting the parameters relevant to the `Get-AzLog` cmdlet, but that would still leave you with a very long line. You could then shorten it even more by splitting the lines after each comma, which would take you a step in the right direction, but is still a tad short from what _I_ see to be the superior solution:

```powershell
$AzLogParams = @{
    ResourceGroupName = $ResourceGroupName
    StartTime = $StartTime
}

$SelectObjectParams = @{
    Property = @{ Name = 'EventTimeStamp';
            Expression = { Get-Date -Date ($_.EventTimeStamp) -Format 's' } },
            @{ Name = 'Event';
            Expression = { $_.EventName.value } },
            @{ Name = 'Operation';
            Expression = { ($_.OperationName.value -split '/')[-2] } },
            @{ Name = 'ResourceName';
            Expression = { ($_.ResourceId -split '/')[-1] } },
            @{ Name = 'Status';
            Expression = { $_.Status.value } },
            @{ Name = 'SubStatus';
            Expression = { $_.SubStatus.LocalizedValue } }
}

Get-AzLog @AzLogParams | Select-Object @SelectObjectParams
```

Though it doesn't seem like it this version is easier to extend by modifying the variable `$SelectObjectParams` and it easier to re-use thanks to the aforementioned variable.

## Use scriptblocks more often

While scriptblocks aren't something that I have used a heck of a lot in the past I have recently started seeing more utility in them because they allow me to take a piece of code, execute it, append to it, and execute it again without writing duplicating code already written. Here's a simple example building on top of what we did before:

```powershell
$ScriptBlock = {
    $Result = Get-AzLog @AzLogParams |
        Select-Object @SelectObjectParams

    if ($ShowAdditionalResources) {
        $Filter = { $_.ResourceName -like "*$ResourceName*" }
    } else {
        $Filter = { $_.ResourceName -eq $ResourceName }
    }

    $Result = $Result | Where-Object $Filter
}

Invoke-Command -ScriptBlock $ScriptBlock -NoNewScope
```

Here I want to execute `Get-AzLog` with custom filtering (by way of splatted calculated properties) and based on another parameter do additional filtering. I am invoking the code inside this scriptblock and I'm passing the `NoNewScope` parameter because I want the context to be stored within the context of the entire script. By default `Invoke-Command` runs commands in their own scope.

Now, I want to add even more filtering on top of what I already have, but only if a certain parameter was passed to my script. I could have just not put the original commands in a scriptblock and executed the entire `Get-AzLog` and ensuing logic again, but that would be wasteful, even if it doesn't take all that long to execute. A much better route, in my opinion, is to do the following:

```powershell
if ($Wait) {
    $ScriptBlockFilter = {
        $Result |
            Where-Object { ($_.Event -eq 'EndRequest') -and
                        ($_.Operation -eq $WaitForOperation) -and
                        ($_.Status -eq 'Succeeded')
            }
    }

    $ScriptBlock = [scriptblock]::Create(
        $ScriptBlock.ToString() +
        "`n" +
        $ScriptBlockFilter.ToString()
    )

    $Result = Invoke-Command -ScriptBlock $ScriptBlock -NoNewScope
}
```

Admittedly, the usage of newline escape sequence isn't all that pretty, but it beats the heck out of repeating code when there are better solutions out there.
