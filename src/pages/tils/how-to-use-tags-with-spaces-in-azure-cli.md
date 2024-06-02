---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2021-08-06
title: How to use tags with spaces in Azure CLI
tags: ["azure", "azure-cli", "bash"]
---
I've been using [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/ "Azure Command-Line Interface overview") for well over a year now and while I'm more than happy to recommend it as a tool for working with Azure, it does have its shortcomings. One of the most recent ones, that I've stumbled upon, is using tags with spaces in them.

Tags in Azure allow you to logically organize resources, resource groups, and subscriptions into a taxonomy where each tag consists of a name and a value. When they highlight [limitations](https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/tag-resources?tabs=json#limitations "Azure tags' limitations") there is the usual cadre of character and symbol restraints, but no mention of spaces of any kind.

"Everything is coming up Milhouse," I thought, and even adding whole sentences as tag values in the Azure Portal does seem to work as expected. Trouble is around the corner though. As soon as I wanted to programmatically get a set of tags from one resource and apply them to another resource I saw that things aren't quite like they seem.

***

The way you add an initial set of tags to a resource is usually during creation-time. Meaning, you run a `az <type> create` command and pass the `--tags` parameter which takes in space-separated tags in the following format: `key[=value] [key[=value] ...]`. You can also leverage the `az resource tag` command or `az tag` commands to achieve the same result after-the-fact. (Be wary of the more than a [1000% decrease in speed](https://github.com/Azure/azure-cli/issues/17247 "'az resource tag' speed issue in GitHub") though when using `az resource tag`).

So, being the engineer that I am I quickly created a Bash function to condense the set of tags from JSON into a single-line format that `az` expects:

```bash
function condense_resource_tags() {
  # $1 - JSON object of a resource's tags

  # sed '1d;$d' - remove first and last line from tags object
  # as it is in JSON, thus has opening and ending curly braces
  #
  # sed 's/: /=/g' - replace colon and space with an equals sign
  #
  # sed 's/"//g' - remove double quotes
  #
  # sed 's/,//g' - remove commas
  #
  # awk '{$1=$1;print}' - remove leading whitespace
  #
  # tr '\n' ' ' - replace newlines with spaces
  echo "$1" |
    sed '1d;$d; s/: /=/g; s/"//g; s/,//g' |
    awk '{$1=$1;print}' |
    tr '\n' ' '
}
```

All of that can probably very well be achieved with a [JQ](https://stedolan.github.io/jq/ "jq is a lightweight and flexible command-line JSON processor") or [JMESPath](https://jmespath.org/ "JMESPath is a query language for JSON") expression, but what's done is done. Here's an example of the getting an input for the function, what it would output, and how it could be used down the line:

```console
$ snapshot_metadata=$(az resource show --ids "$SNAPSHOT_RESOURCE_ID")
$ snapshot_tags=$(jq -r '.tags' <<< "$snapshot_metadata")
$ echo "$snapshot_tags"
{
  "owner": "Me"
}
$ snapshot_tags_condensed=$(condense_resource_tags "$snapshot_tags")
$ echo "$snapshot_tags_condensed"
owner=Me
# Adding quotes around '$snapshot_tags_condensed' will
# cause command to improperly add tags
#
# shellcheck disable=SC2086
$ az snapshot create \
  --name "$SNAPSHOT_NAME" \
  --resource-group "$TARGET_RESOURCE_GROUP" \
  --source "$SNAPSHOT_RESOURCE_ID" \
  --tags $snapshot_tags_condensed \
  --output none
...
```

The above works fine and will most likely keep working fine as long as a tag's value never contains a space. Introducing one will cause this solution to break down horribly. Cue the sad trombone.

I tried various combinations of wrapping the both the tag names and values with single or double quotes, but no dice. After a bit of googling I started noticing that it's [not that uncommon](https://github.com/Azure/azure-cli/issues/1863 "Azure CLI GitHub issue with using spaces in tags") of [a problem](https://web.archive.org/web/20230206142321/https://social.msdn.microsoft.com/Forums/azure/en-US/263f098e-a515-4a0b-b730-2e6e1fa35516/azure-cli-add-azure-tag-values-with-spaces?forum=azurescripting "MSDN post about using spaces in tags"). I did come across a potential [solution that relied on PowerShell](https://stackoverflow.com/questions/59198657/how-to-pass-tags-with-space "StackOverflow solution to using spaces in tags") and that got some gears going in my head.

***

Every single command you execute with Azure CLI is at the end of the day nothing more than a call or several calls made for you against [their REST API endpoints](https://docs.microsoft.com/en-us/rest/api/azure/ "Azure REST API reference documentation"). I don't know what made them decide for creating it (I am so thankful that they did though), but there is a command for interacting more directly with those endpoints called `az rest`.

Using that it's possible to forego some or all of the parsing the initial sub-command does to the given arguments, thus it's possible to achieve some things that aren't even doable otherwise. Using tags with spaces in them now being one of them, luckily.

To use `az rest` you need to know what endpoint to target and with which HTTP method. Since I knew I couldn't monkeypatch the `az snapshot create` command, as an example, to include the tags the way I wanted them, I had to resort to an additional command called `az tag update` to get the tags in place.

I started by trying to add the same broken tags with that command, but adding the `--debug` parameter at the very end. That exposes all the nitty-gritty details of everything a command does, including any and all API endpoints it calls:

```plaintext
<output omitted>
cli.azure.cli.core.sdk.policies: Request URL: 'https://management.azure.com/subscriptions/<subscription ID>/resourceGroups/<resource group name>/providers/Microsoft.Compute/snapshots/<snapshot name>/providers/Microsoft.Resources/tags/default?api-version=2021-04-01'
cli.azure.cli.core.sdk.policies: Request method: 'PATCH'
cli.azure.cli.core.sdk.policies: Request headers:
cli.azure.cli.core.sdk.policies:     'Content-Type': 'application/json'
cli.azure.cli.core.sdk.policies:     'Accept': 'application/json'
cli.azure.cli.core.sdk.policies:     'Content-Length': '126'
cli.azure.cli.core.sdk.policies:     'x-ms-client-request-id': '16b9bac0-f6e9-11eb-be2d-04ed3383f2e3'
cli.azure.cli.core.sdk.policies:     'CommandName': 'tag update'
cli.azure.cli.core.sdk.policies:     'ParameterSetName': '--operation --resource-id --tags --debug'
cli.azure.cli.core.sdk.policies:     'User-Agent': 'AZURECLI/2.27.0 (RPM) azsdk-python-azure-mgmt-resource/18.0.0 Python/3.9.6 (Linux-5.13.6-200.fc34.x86_64-x86_64-with-glibc2.33)'
cli.azure.cli.core.sdk.policies:     'Authorization': '*****'
cli.azure.cli.core.sdk.policies: Request body:
cli.azure.cli.core.sdk.policies: {"operation": "Replace", "properties": {"tags": {"name": "Tag", "with": "", "spaces": "", "in": "", "it": "", "owner": "Me"}}}
<output omitted>
```

You can see that it uses the `PATCH` HTTP request method against the `/Microsoft.Resources/tags/default` endpoint. If you are at all familiar with Azure you can spot that the bulk of the URL is composed of the target resource's ID with the latter portion tacked on, meaning you can (probably) target any valid resource. That final portion will clue you in on [the exact API endpoint ](https://docs.microsoft.com/en-us/rest/api/resources/tags/update-at-scope "Tags - Update At Scope REST API reference")you can look up in the reference. You can also see that the request has a body, which means that if you want to call that endpoint directly then you're the one who has to create the body. With all that it's off to function creation races!

```bash
function update_tags() {
  # Use 'az rest' to update tags instead of relying on 'az tag update'
  # to properly work with space-separated tag values

  # $1 - resource ID of target resource
  # $2 - operation to perform (Delete, Merge, Replace)
  # $3 - JSON object of tags
  # $4 - API version to use for request

  local resource_id="$1"
  local operation="$2"
  local tags="$3"
  local api_version="${4:-2021-04-01}"

  az rest \
    --method patch \
    --url "https://management.azure.com${resource_id}/providers/Microsoft.Resources/tags/default?api-version=${api_version}" \
    --body "{\
      \"operation\": \"${operation}\",\
      \"properties\": {\
        \"tags\": ${tags}\
        }\
      }" \
    --output none
}
```

Note how the `\"tags\": ${tags}\` line does not contain double quotes around the variable. Adding those would make the JSON invalid as those double quotes would wrap around the included curly braces (see `echo "$snapshot_tags"` above). There's also the possibility of passing in a file as the body using `--body @body.json`, but I didn't want to needlessly create a file if I absolutely didn't have to.

Now it's very easy to just make minor alterations to the previous code (shown in full) and be able to support tags with spaces in them as well:

```console
$ snapshot_metadata=$(az resource show --ids "$SNAPSHOT_RESOURCE_ID")
$ snapshot_tags=$(jq -r '.tags' <<< "$snapshot_metadata")
$ echo "$snapshot_tags"
{
  "name": "Tag with spaces in it",
  "owner": "Me"
}
$ snapshot_create_result=$(az snapshot create \
  --name "$SNAPSHOT_NAME" \
  --resource-group "$TARGET_RESOURCE_GROUP" \
  --source "$SNAPSHOT_RESOURCE_ID")
$ update_tags \
  "$(jq -r '.id' <<< "$snapshot_create_result")" \
  'Replace' \
  "$snapshot_tags"
...
```

As far as I've tested using double or single quotes within the tag value also works as expected, so happy tagging!
