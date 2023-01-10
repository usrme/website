---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-04-08
title: You might not need 'jq' for simpler use cases
---
I wanted to find out how other people use the `AZURE_CONFIG_DIR` environment variable[^1] and I came across a rather ingenious way[^2] to not rely on JQ[^3] for working with JSON in simpler use cases:

```shell
jq() {
    echo -n "$1" | python3 -c "import json, sys; print(json.load(sys.stdin)${2})"
}

$ jq "$(cat ~/.azure/azureProfile.json)" "['subscriptions'][0]['name']"
tst002
```

This is wholly unnecessary when working Azure CLI as that already has the `--query` option for defining a JMESPath[^4] query, but could still be useful nonetheless in more constrained environments.

[^1]: https://docs.microsoft.com/en-us/cli/azure/azure-cli-configuration
[^2]: https://github.com/vcheckzen/KeepAliveE5/blob/8ba3565400a0d5da4e9b907da974ae382ff78f05/register/register_apps_by_force.sh
[^3]: https://stedolan.github.io/jq/
[^4]: https://jmespath.org/
