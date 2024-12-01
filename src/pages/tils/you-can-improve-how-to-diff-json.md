---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2024-09-27
title: You can improve how to diff JSON
tags: ["cli", "git", "json"]
---
You are going about your day and all of a sudden come across a change in a JSON file in a repository you are working in. You try to gauge what has changed, but you see something akin to the following[^1]:

```diff
diff --git a/file.json b/file.json
index a88f093..749ce98 100644
--- a/file.json
+++ b/file.json
@@ -4,20 +4,20 @@
   "username": "Bret",
   "email": "Sincere@april.biz",
   "address": {
-    "street": "Kulas Light",
-    "suite": "Apt. 556",
-    "city": "Gwenborough",
-    "zipcode": "92998-3874",
     "geo": {
       "lat": "-37.3159",
       "lng": "81.1496"
-    }
+    },
+    "street": "Kulas Light",
+    "suite": "Apt. 556",
+    "city": "London",
+    "zipcode": "92998-3874"
   },
-  "phone": "1-770-736-8031 x56442",
-  "website": "hildegard.org",
   "company": {
     "name": "Romaguera-Crona",
     "catchPhrase": "Multi-layered client-server neural-net",
     "bs": "harness real-time e-markets"
-  }
-}
```

Okay, so it looks like some of the keys under `address` moved around and the value for `address.city` changed, but were `phone` and `website` really removed? Something doesn't feel right about that. Looking at the file confirms the suspicions:

```json
{
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "Sincere@april.biz",
  "address": {
    "geo": {
      "lat": "-37.3159",
      "lng": "81.1496"
    },
    "street": "Kulas Light",
    "suite": "Apt. 556",
    "city": "London",
    "zipcode": "92998-3874"
  },
  "company": {
    "name": "Romaguera-Crona",
    "catchPhrase": "Multi-layered client-server neural-net",
    "bs": "harness real-time e-markets"
  },
  "phone": "1-770-736-8031 x56442",
  "website": "hildegard.org"
}
```

Nothing about this change set has been really easy to follow and if this were to be done across multiple files with even bigger refactorings, then having an intuitive understanding about what was done would be impossible. Luckily, there's a tool called ['gron'](https://github.com/tomnomnom/gron) that can help.

Its whole raison d'être is to make JSON greppable by transforming it into discrete assignments. Here's the above file ran through `gron`:

```console
$ gron file.json
json = {};
json.address = {};
json.address.city = "London";
json.address.geo = {};
json.address.geo.lat = "-37.3159";
json.address.geo.lng = "81.1496";
json.address.street = "Kulas Light";
json.address.suite = "Apt. 556";
json.address.zipcode = "92998-3874";
json.company = {};
json.company.bs = "harness real-time e-markets";
json.company.catchPhrase = "Multi-layered client-server neural-net";
json.company.name = "Romaguera-Crona";
json.email = "Sincere@april.biz";
json.id = 1;
json.name = "Leanne Graham";
json.phone = "1-770-736-8031 x56442";
json.username = "Bret";
json.website = "hildegard.org";
```

Given just the existence of this tool on our system, the output of `git diff` against any JSON file(s) can be improved vastly. To do this, two things need to be done:

1. create a `.gitattributes` file at the root of your repository with the following contents:

```plaintext
*.json diff=gron
```

2. adjust your Git configuration to include the following:

```ini
[diff "gron"]
    textconv = gron
```

Now, running `git diff` against the same file will show the following:

```diff
diff --git a/file.json b/file.json
index a88f093..749ce98 100644
--- a/file.json
+++ b/file.json
@@ -1,6 +1,6 @@
 json = {};
 json.address = {};
-json.address.city = "Gwenborough";
+json.address.city = "London";
 json.address.geo = {};
 json.address.geo.lat = "-37.3159";
 json.address.geo.lng = "81.1496";
```

Jarring at first, but when you consider what was actually done it makes perfect sense! The `.gitattributes` change sets the internal diff algorithm[^2] for all JSON files and it is referring to a a custom diff algorithm within a Git configuration file. The custom diff algorithm specifies the `textconv` setting[^3], which converts the targeted files (by way of `*.json`) to another format (one controlled by `gron`). Since `gron` does discrete assignments, then any actual ordering that happened is not relevant, showing only what values changed.

I've found this to be incredibly useful and I truly hope people will start integrating these minor changes into their CI/CD workflows as well to make pull requests more meaningful.

[^1]: Example retrieved through: `curl -s http://jsonplaceholder.typicode.com/users/1`
[^2]: https://git-scm.com/docs/gitattributes#_setting_the_internal_diff_algorithm
[^3]: https://git-scm.com/docs/gitattributes#_performing_text_diffs_of_binary_files
