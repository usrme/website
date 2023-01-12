---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2023-01-12
title: Not to use the 'file' prefix for 'iso_checksum' in Packer
---
I spent quite a long time today fiddling with a Packer configuration for Hyper-V trying to pass a SHA-256 hash through a file and after hours of trying multiple variations I stumbled upon quite an ingenious way to go about it.

What we previously had was a PowerShell script that just spat out the hash into a file willy-nilly[^1]:

```powershell
Get-FileHash ubuntu-server-cloudimg-amd64.vhdx | \
  Select-Object -Property Hash | \
  Out-File -FilePath D:\checksum
```

Originally the Packer configuration was set up to actually ignore the checksum entirely[^2]:

```hcl
source "hyperv-iso" "ubuntu_cloudimg" {
  disk_block_size      = 1
  cd_files             = [ "./files/meta-data", "./files/user-data" ]
  cd_label             = "cidata"
  generation           = 2
  iso_checksum         = "none"
  iso_url              = "D:\\ubuntu-server-cloudimg-amd64.vhdx"
  ...
}
```

After changing the PowerShell bit above, I tried to remedy not comparing checksums by setting `iso_checksum` to `file://D:\\checksum`, but no matter how I set up the contents of the file Packer wasn't able to read it; every time `packer validate` declaring that no checksum could be found. Then I stumbled upon an article about [Ubuntu cloud images on Hyper-V](https://www.wildtechgarden.ca/docs/deploy-admin/windows-and-linux/ubuntu-cloud-images-on-hyper-v/) where the author among other useful things used an environment variable to pass this value. This was immediately intriguing to me and through that I got to learn about Packer automatically reading environment variables prefixed with `PKR_VAR_<variable name>` prior to starting[^3].

After that all that was necessary was to modify the Packer configuration a little:

```diff
+variable "iso_checksum" {
+  type = string
+}
+
source "hyperv-iso" "ubuntu_cloudimg" {
  disk_block_size      = 1
  cd_files             = [ "./files/meta-data", "./files/user-data" ]
  cd_label             = "cidata"
  generation           = 2
- iso_checksum         = "none"
+ iso_checksum         = "sha256:${var.iso_checksum}"
  iso_url              = "D:\\ubuntu-server-cloudimg-amd64.vhdx"
  ...
}
```

And then ensure that the previous PowerShell bit was removed and replaced with something that stores just the value into the correct variable:

```diff
-Get-FileHash ubuntu-server-cloudimg-amd64.vhdx | \
-  Select-Object -Property Hash | \
-  Out-File -FilePath D:\checksum
+Get-FileHash ubuntu-server-cloudimg-amd64.vhdx -OutVariable VHDXHash
+$env:PKR_VAR_iso_checksum = $VHDXHash.Hash
```

You can optionally pipe `Get-FileHash` into `Out-Null` as otherwise the result will be displayed in standard output as well as being stored into the defined variable. Also note that for large files this command may take several minutes to run, though your mileage will vary. Now, as long as `$env:PKR_VAR_iso_checksum` was set from the same console session as `packer validate` / `packer build` or from the same script, then Packer will immediately be able to fill in the `iso_checksum` variable's value!

[^1]: This would actually result in an unusable file for checksum purposes anyway as the file would include the `Hash` property as a table header with the checksum appearing on another row.
[^2]: No doubt because getting it to work through a file would have proved difficult either way.
[^3]: <https://developer.hashicorp.com/packer/guides/hcl/variables#from-environment-variables>
