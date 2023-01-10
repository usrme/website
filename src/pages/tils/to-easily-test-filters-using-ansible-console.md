---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-03-02
title: To easily test filters using 'ansible-console'
---
Today's [release](https://github.com/ansible-collections/ansible.netcommon/commit/538a9036e781e8504656f1a85bb53a5805ec78f8) of version 2.6.0 for `ansible.netcommon` [broke](https://github.com/ansible-collections/ansible.netcommon/issues/375) at least some people's environments and in the course of trying to debug that myself I wound up learning a bit more how to effectively use ['ansible-console'](https://docs.ansible.com/ansible/latest/cli/ansible-console.html). While I had known about 'ansible-console' for some time[^1], my usage of it had stayed relatively low, thus I didn't really know how to best interact with it. Here's how I validated that version 2.6.0 explicitly was to blame:

```bash
$ ansible --version
ansible 2.10.14
config file = None
configured module search path = ['/root/.ansible/plugins/modules', '/usr/share/ansible/plugins/modules']
ansible python module location = /usr/local/lib/python3.8/dist-packages/ansible
executable location = /usr/local/bin/ansible
python version = 3.8.10 (default, Jun  2 2021, 10:49:15) [GCC 9.4.0]

$ ansible-galaxy collection list ansible.netcommon

# /usr/local/lib/python3.8/dist-packages/ansible_collections
Collection        Version
----------------- -------
ansible.netcommon 1.2.1  

$ ansible-console localhost
[WARNING]: No inventory was parsed, only implicit localhost is available
Welcome to the ansible console.
Type help or ? to list commands.

root@localhost (1)[f:5]$ debug msg="{{ '192.168.0.1' | ipaddr }}"
localhost | SUCCESS => {
    "msg": "192.168.0.1"
}
root@localhost (1)[f:5]$ exit

$ ansible-galaxy collection install ansible.netcommon:2.6.0
Starting galaxy collection install process
Process install dependency map
Starting collection install process
Installing 'ansible.netcommon:2.6.0' to '/root/.ansible/collections/ansible_collections/ansible/netcommon'
Downloading https://galaxy.ansible.com/download/ansible-netcommon-2.6.0.tar.gz to /root/.ansible/tmp/ansible-local-28gxj1aybi/tmprfki827q
ansible.netcommon (2.6.0) was installed successfully
Installing 'ansible.utils:2.5.1' to '/root/.ansible/collections/ansible_collections/ansible/utils'
Downloading https://galaxy.ansible.com/download/ansible-utils-2.5.1.tar.gz to /root/.ansible/tmp/ansible-local-28gxj1aybi/tmprfki827q
ansible.utils (2.5.1) was installed successfully

$ ansible-galaxy collection list ansible.netcommon

# /usr/local/lib/python3.8/dist-packages/ansible_collections
Collection        Version
----------------- -------
ansible.netcommon 1.2.1  

# /root/.ansible/collections/ansible_collections
Collection        Version
----------------- -------
ansible.netcommon 2.6.0  

$ ansible-console localhost
[WARNING]: No inventory was parsed, only implicit localhost is available
Welcome to the ansible console.
Type help or ? to list commands.

root@localhost (1)[f:5]$ debug msg="{{ '192.168.0.1' | ipaddr }}"
localhost | FAILED! => {
    "msg": "template error while templating string: No filter named 'ipaddr'.. String: {{ '192.168.0.1' | ipaddr }}"
}
root@localhost (1)[f:5]$ exit

$ ansible-galaxy collection install ansible.netcommon:2.5.1 --force
Starting galaxy collection install process
Process install dependency map
Starting collection install process
Installing 'ansible.netcommon:2.5.1' to '/root/.ansible/collections/ansible_collections/ansible/netcommon'
Downloading https://galaxy.ansible.com/download/ansible-netcommon-2.5.1.tar.gz to /root/.ansible/tmp/ansible-local-43w7kl5evo/tmpbqlle7ku
ansible.netcommon (2.5.1) was installed successfully
Skipping 'ansible.utils' as it is already installed

$ ansible-console localhost
[WARNING]: No inventory was parsed, only implicit localhost is available
Welcome to the ansible console.
Type help or ? to list commands.

root@localhost (1)[f:5]$ debug msg="{{ '192.168.0.1' | ipaddr }}"
localhost | SUCCESS => {
    "msg": "192.168.0.1"
}
```

After that it was trivial to pin the version of in the collections `requirements.yml` file:

```yaml
---
collections:
- name: ansible.netcommon
    version: '==2.5.1'
```

[^1]: Big shout-out to Ian Miell for bringing attention to it: https://zwischenzugs.com/2021/08/27/five-ansible-techniques-i-wish-id-known-earlier/
