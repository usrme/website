---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-02-25
title: How to add multiple secrets to Azure Key Vault using Terraform
tags: ["azure", "hashicorp", "keyvault", "terraform"]
---
I previously had a set-up where I needed to create a type of Azure Key Vault secret that didn't need to have an expiration date and one that did:

```hcl title="main.tf"
module "key_vaults" {
  source         = "./modules/key-vaults"
  principals     = {
    ci      = module.service_principals.ci_object
    grafana = module.service_principals.grafana_object
  }
  depends_on = [
    module.service_principals
  ]
}
```

```hcl title="./modules/key-vaults"
resource "azurerm_key_vault_secret" "principal_appid" {
  for_each     = var.principals
  name         = "sp-${terraform.workspace}-${each.key}-appid"
  value        = each.value.application_id
  key_vault_id = azurerm_key_vault.kv["mgmt"].id
}

resource "azurerm_key_vault_secret" "principal_token" {
  for_each        = var.principals
  name            = "sp-${terraform.workspace}-${each.key}-token"
  value           = each.value.client_secret
  expiration_pubDate: each.value.client_secret_expiration
  key_vault_id    = azurerm_key_vault.kv["mgmt"].id
}
```

```hcl title="./modules/key-vaults/variables.tf"
variable "principals" {
  type    = map(any)
  default = null
}
```

```hcl title="./modules/service-principals/outputs.tf"
output "ci_object" {
  description = "'ci' application object."
  value       = {
    application_id           = azuread_application.app["ci"].application_id,
    object_id                = azuread_service_principal.service["ci"].object_id
    client_secret            = azuread_application_password.app["ci"].value
    client_secret_expiration = azuread_application_password.app["ci"].end_date
  }
}

output "grafana_object" {
  description = "'grafana' application object."
  value       = {
    application_id           = azuread_application.app["grafana"].application_id,
    object_id                = azuread_service_principal.service["grafana"].object_id
    client_secret            = azuread_application_password.app["grafana"].value
    client_secret_expiration = azuread_application_password.app["grafana"].end_date
  }
}
```

While this worked as expected it had the downside of unnecessary duplication and inflexibility in that I couldn't `token`-type secrets that _don't_ have an expiration date. Here's what I came up with to solve this after reading [Terraform's Dependency Inversion documentation](https://www.terraform.io/language/modules/develop/composition#dependency-inversion):

```hcl title="main.tf"
module "key_vaults" {
  source         = "./modules/key-vaults"
  secrets = [
    module.service_principals.ci_object.secrets,
    module.service_principals.grafana_object.secrets,
  ]
  depends_on = [
    module.service_principals
  ]
}
```

```hcl title="./modules/key-vaults"
resource "azurerm_key_vault_secret" "secret" {
  for_each        = { for pair in local.secret_pairs : "${pair.secret_name}" => pair.secret_value }
  name            = each.key
  # Accommodate values that are maps and contain key "value" that holds
  # actual value, plus additional meta-data like an expiration date
  value           = try(lookup(each.value, "value", each.value), each.value)
  # When no "expiration" key exists for "value", then it is safe to assign
  # a "null" value and then no expiration date is set
  expiration_pubDate: try(each.value.expiration, null)
  key_vault_id    = azurerm_key_vault.kv["mgmt"].id
}
```

```hcl title="./modules/key-vaults/variables.tf"
variable "secrets" {
  type    = any
  default = []
}

locals {
  secret_pairs = flatten([
    for secret_group in var.secrets : [ for k, v in secret_group : { "secret_name" = k, "secret_value" = v } ]
  ])
}
```

```hcl title="./modules/service-principals/outputs.tf"
output "ci_object" {
  description = "'ci' application object."
  value       = {
    app       = azuread_application.app["ci"]
    principal = azuread_service_principal.service["ci"]
    secrets   = {
      "${var.principal_prefix}-${terraform.workspace}-ci-appid" = azuread_application.app["ci"].application_id
      "${var.principal_prefix}-${terraform.workspace}-ci-token" = {
        value      = azuread_application_password.app["ci"].value
        expiration = azuread_application_password.app["ci"].end_date
      }
    }
  }
}

output "grafana_object" {
  description = "'grafana' application object."
  value       = {
    app       = azuread_application.app["grafana"]
    principal = azuread_service_principal.service["grafana"]
    secrets   = {
      "${var.principal_prefix}-${terraform.workspace}-grafana-appid" = azuread_application.app["grafana"].application_id
      "${var.principal_prefix}-${terraform.workspace}-grafana-token" = {
        value      = azuread_application_password.app["grafana"].value
        expiration = azuread_application_password.app["grafana"].end_date
      }
    }
  }
}
```

```hcl title="./modules/service-principals/variables.tf"
variable "principal_prefix" {
  type    = string
  default = "sp"
}
```

To me, this seems way more cleaner and introduces only a small amount of additional complexity.
