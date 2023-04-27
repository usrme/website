# Ansible

## Run role against arbitrary host

From [here](https://stackoverflow.com/a/38384205). Note the comma after the IP or FQDN as described [here](https://groups.google.com/d/msg/ansible-project/G_9JRGp5jGE/PTBZdgDb5OEJ). Additional hosts can be added by supplying `-i` parameter with more arguments (comma at the end only if total count is 1).

```bash
ansible-playbook -i '<IP or FQDN>,' -u '<user name>' --extra-vars \
  'ansible_winrm_server_cert_validation=ignore \
  ansible_connection=winrm \
  ansible_winrm_transport=credssp \
  ansible_password=<password>' --tags '<tag value for a role>' playbook.yml
```

## Run ad-hoc command against arbitrary host

Replace the final 'all' with a more precise host pattern if you passed more than one IP or FQDN to the initial list (comma at the end only if total count is 1).

```bash
ansible -i '<IP or FQDN>,' -u '<user name>' --extra-vars \
  'ansible_winrm_server_cert_validation=ignore \
  ansible_connection=winrm \
  ansible_winrm_transport=credssp \
  ansible_password=<password>' -m 'win_shell' -a 'ipconfig' 'all'
```

## Add timing information to playbook execution output

The below is from `ansible.cfg`. From [here](https://docs.ansible.com/ansible/latest/plugins/callback/profile_tasks.html).

```ini
[defaults]
callback_whitelist = profile_tasks
```

## Make verbose output more readable by using YAML instead of JSON

```ini
ANSIBLE_STDOUT_CALLBACK='yaml'
```

## Debug variables without running entire playbook

```bash
ansible -m debug <host> -a "var=hostvars[inventory_hostname].<variable>"
```
