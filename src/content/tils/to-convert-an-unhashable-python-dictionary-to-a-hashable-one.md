---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2023-02-22
title: To convert an unhashable Python dictionary to a hashable one
tags: ["python", "caching"]
---
We started being throttled by an [API endpoint in Azure](https://learn.microsoft.com/en-us/rest/api/storagerp/storage-accounts/list-account-sas) due to sending [too many requests](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/request-limits-and-throttling#storage-throttling) all at once, so I had to implement some sort of caching to alleviate the situation.

The function in question responsible for fetching SAS tokens for storage accounts is something like this:

```python
def get_storage_account_sas(
    subscription_id: str,
    resource_group_name: str,
    account_name: str,
    permissions: dict[str, str],
) -> str:
    """Return storage account SAS token."""

    api_version = "2021-04-01"
    exit_code, result, logs = az(
        "rest --method post "
        f"--url https://management.azure.com/subscriptions/{subscription_id}/"
        f"resourceGroups/{resource_group_name}/providers/Microsoft.Storage/storageAccounts/"
        f"{account_name}/ListAccountSas?api-version={api_version} "
        f"--body '{json.dumps(permissions)}'"
    )
    if exit_code == 0:
        return result["accountSasToken"]
    logger.error(logs.rstrip())
    raise typer.Exit(1)
```

At first glance I wanted to just add the `@functools.lru_cache` decorator to the function, but I then got the following error when the above function was called:

```
...
File "utilities.py", line 361, in get_storage_account_details
    storage_account_sas = get_storage_account_sas(
TypeError: unhashable type: 'dict'
```

This lead me to the [official documentation for the decorator](https://docs.python.org/3/library/functools.html#functools.lru_cache) where it says:

> Since a dictionary is used to cache results, the positional and keyword arguments to the function must be [hashable](https://docs.python.org/3/glossary.html#term-hashable).

Dictionaries by default aren't hashable, so this needed solving. Luckily, making sure the given `permissions` dictionary is hashable was just a matter of the following:

```diff
+ class HashableDict(dict):
+     def __hash__(self):
+         return hash(frozenset(self))


@functools.lru_cache
def get_storage_account_sas(
    subscription_id: str,
    resource_group_name: str,
    account_name: str,
-   permissions: dict[str, str],
+   permissions: HashableDict,
) -> str:  # pragma: no cover
    """Return storage account SAS token."""

    raise typer.Exit(1)

@@ -358,6 +365,7 @@ def get_storage_account_details(
    else:
        permissions["signedExpiry"] = generate_sas_token_expiration(token_expiry_hours)

+   permissions = HashableDict(permissions)
    storage_account_sas = get_storage_account_sas(
        subscription_id=subscription.details["id"],
        resource_group_name=generic_resource_group,
        account_name=storage_account_name,
        permissions=permissions,
    )
```

Now the `@functools.lru_cache` decorator applied without issues! Here are some helpful links relating to this:

* <https://stackoverflow.com/a/16162138>
* <https://realpython.com/lru-cache-python/>
