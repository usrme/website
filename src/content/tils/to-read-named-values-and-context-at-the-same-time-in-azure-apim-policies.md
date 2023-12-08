---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-01-05
title: To read named values and context at the same time in Azure APIM policies
tags: ["azure", "apigateway"]
---
While needing to [set up the reading of secrets](https://vincentlauzon.com/2019/11/19/accessing-azure-key-vault-from-within-azure-api-management/ "Vincent-Philippe Lauzon - Accessing Azure Key Vault from within Azure API Management") from [Key Vault](https://azure.microsoft.com/en-us/services/key-vault/#product-overview "Azure Key Vault - Safeguard cryptographic keys and other secrets used by cloud apps and services") using [API Management](https://azure.microsoft.com/en-us/services/api-management/#overview "API Management - A hybrid, multicloud management platform for APIs across all environments"), I had to read both the stored named values and a query parameter from a request sent to an API. I've previously only had to either use only named values:

```xml
<policies>
    <inbound>
        <return-response>
            ...
            <set-body>{{named-value}}</set-body>
        </return-response>
    </inbound>
    ...
</policies>
```

Or work with simpler expressions:

```xml
<policies>
    <inbound>
        <set-variable name="callback_url" value="@(context.Request.Headers.GetValueOrDefault("Callback-Url","placeholder"))" />
    </inbound>
    ...
</policies>
```

But never to combine the two and I found it surprisingly difficult to find examples of both being leveraged. Only thanks to this Stack Overflow [answer](https://stackoverflow.com/a/51938615 "Stack Overflow - Read Named values from the context in Azure Apim") did I finally come upon the correct invocation:

```xml
<policies>
    <inbound>
        <send-request mode="new" response-variable-name="response" timeout="20" ignore-error="false">
            <set-url>@($"https://{{vault-name}}.vault.azure.net/secrets/{context.Request.OriginalUrl.Query.GetValueOrDefault("secretName")}?api-version=7.2")</set-url>
            ...
        </send-request>
    </inbound>
    ...
</policies>
```

This could also leverage a previously set variable if the use case calls for it:

```xml
<policies>
    <inbound>
        <set-variable name="secret-name" value="@(context.Request.OriginalUrl.Query.GetValueOrDefault("secretName"))" />
        <send-request mode="new" response-variable-name="response" timeout="20" ignore-error="false">
            <set-url>@($"https://{{vault-name}}.vault.azure.net/secrets/{(string)context.Variables["secret-name"]}?api-version=7.2")</set-url>
            ...
        </send-request>
    </inbound>
    ...
</policies>
```

I find that syntax to be just horrible, so here's to hoping this can save others some time in trying to find the right way to go about this when the official documentation is scarce[^1].

[^1]: I only found [one bit](https://docs.microsoft.com/en-us/azure/api-management/api-management-sample-send-request#making-the-validation-request "API Management documentation - Using external services from the Azure API Management service") in the [official documentation](https://docs.microsoft.com/en-us/azure/api-management/ "API Management documentation") and that was completely tangential to the problem at hand. It was also missing the crucial bit of using named values as well.
