---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-04-08
title: You might not need 'jq' for simpler use cases
tags: ["azure-cli", "json", "python"]
---
I wanted to find out how other people use the `AZURE_CONFIG_DIR` environment variable[^1] and I came across a rather ingenious way[^2] to not rely on [JQ](https://stedolan.github.io/jq/) for working with JSON in simpler use cases in the process, namely:

```console
jq() {
    echo -n "$1" | python3 -c "import json, sys; print(json.load(sys.stdin)${2})"
}

$ jq "$(cat ~/.azure/azureProfile.json)" "['subscriptions'][0]['name']"
tst002
```

This is wholly unnecessary when working Azure CLI as that already has the `--query` option for defining a [JMESPath](https://jmespath.org/) query, but could still be useful nonetheless in more constrained environments.

---

I've recently been using the command line interface of ['json'](https://docs.python.org/3/library/json.html#module-json.tool) as well as it can very easily do simple things like indenting:

```console
$ python -m json.tool --indent 2 < file.json
[
  {
    "username": "john.doe",
    "id": 1,
    "last_name": "Doe",
    "name": "John"
  },
  {
    "username": "ben.smith",
    "id": 2,
    "last_name": "Smith",
    "name": "John"
  }
]
```

And sorting:

```console
$ python -m json.tool --sort-keys < file.json
[
    {
        "id": 1,
        "last_name": "Doe",
        "name": "John",
        "username": "john.doe"
    },
    {
        "id": 2,
        "last_name": "Smith",
        "name": "John",
        "username": "ben.smith"
    }
]
```

And validating:

```console
$ echo '[{"id": 1, username: "john.doe"}]' | python -m json.tool
Expecting property name enclosed in double quotes: line 1 column 12 (char 11)
```

Consider this example from [Skopeo's](https://github.com/containers/skopeo) README (I've shortened the target image from `registry.fedoraproject.org/fedora:latest` to `image` to avoid horizontal scrolling):

```console
$ skopeo inspect --config docker://image  | jq
{
  "created": "2022-12-09T05:50:20Z",
  "architecture": "amd64",
  "os": "linux",
  "config": {
    "Env": [
      "DISTTAG=f37container",
      "FGC=f37",
      "container=oci"
    ],
    "Cmd": [
      "/bin/bash"
    ],
    "Labels": {
      "license": "MIT",
      "name": "fedora",
      "vendor": "Fedora Project",
      "version": "37"
    }
  },
  "rootfs": {
    "type": "layers",
    "diff_ids": [
      "sha256:ab03326cd6b0316148039cc3533a48126b41675046011565f840e042caab0cbf"
    ]
  },
  "history": [
    {
      "created": "2022-12-09T05:50:20Z",
      "comment": "Created by Image Factory"
    }
  ]
}
```

This is equivalent to:

```console
$ skopeo inspect --config docker://image | python -m json.tool --indent 2
{
  "created": "2022-12-09T05:50:20Z",
  "architecture": "amd64",
  "os": "linux",
  "config": {
    "Env": [
      "DISTTAG=f37container",
      "FGC=f37",
      "container=oci"
    ],
    "Cmd": [
      "/bin/bash"
    ],
    "Labels": {
      "license": "MIT",
      "name": "fedora",
      "vendor": "Fedora Project",
      "version": "37"
    }
  },
  "rootfs": {
    "type": "layers",
    "diff_ids": [
      "sha256:ab03326cd6b0316148039cc3533a48126b41675046011565f840e042caab0cbf"
    ]
  },
  "history": [
    {
      "created": "2022-12-09T05:50:20Z",
      "comment": "Created by Image Factory"
    }
  ]
}
```

The only thing that might be different for you is that the output of `jq` might be highlighted accordingly, but that might not be worth the extra dependency for you, though yes there is more typing if you aren't one to alias such long-ish incantations.

Here's another one:

```console
$ skopeo inspect docker://image | jq -r '.Digest'
sha256:ce08a91085403ecbc637eb2a96bd3554d75537871a12a14030b89243501050f2
```

The exact same value can be grabbed with:

```console
$ skopeo inspect docker://image | python3 -c "import json, sys; print(json.load(sys.stdin)['Digest'])"
sha256:ce08a91085403ecbc637eb2a96bd3554d75537871a12a14030b89243501050f2
```

If you are comfortable with Python, then any further manipulations are very accessible as well. All in all I'd say pure Python should at least be given a chance if your use cases are this trivial.

[^1]: https://docs.microsoft.com/en-us/cli/azure/azure-cli-configuration
[^2]: https://github.com/vcheckzen/KeepAliveE5/blob/e411be18699c5ba37a897416d712bb21ce7b8204/register/register_apps_by_force.sh
