---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-05-13
title: Of the awesome power of Mitogen for Ansible
---
In short: [it's](https://mitogen.networkgenomics.com/ansible_detailed.html) incredible! While I haven't had the misfortune of working daily with Ansible playbook runs that take in excess of tens of minutes, I've still felt the tedium of even waiting for a simple 3-4 minute role to finish doing its thing. Now the entire thing takes around 50 seconds (about 250% faster) and the process of iterating on several changes is no longer such a bore.

The only downside I've personally come across is that this magnificent speed improvement does not extend to [ad hoc commands](https://docs.ansible.com/ansible/latest/user_guide/intro_adhoc.html), so something like `ANSIBLE_STRATEGY=mitogen_free ansible 'group1' -m shell -a 'reboot'` is still bound to take as much time as prior to installing Mitogen, though I'm far less concerned with improving such executions.
