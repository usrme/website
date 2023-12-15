---
title: Kubernetes
description: Kubernetes oneliners.
---
These are currently specific to `kubectl` and there are tons more [here](https://kubernetes.io/docs/reference/kubectl/cheatsheet/).

## Set up short names for contexts

- Open `~/.kube.config`
- Modify `contexts` section:

```yaml
contexts:
- context:
    cluster: cluster1
    user: cluster1
  name: dev
- context:
    cluster: cluster2
    namespace: namespace1
    user: cluster2
  name: namespace1
- context:
    cluster: cluster3
    namespace: db
    user: cluster3
  name: prod
current-context: prod
```

## Just use Click

[Here](https://github.com/databricks/click).

## Just use K9s

[Here](https://k9scli.io/).

## Use specific context (i.e. cluster)

```bash
kubectl config use-context <context>
```

## List namespaces

```bash
kubectl get ns
```

## Set namespace

This will also update the relevant context's `namespace` value in the `~/.kube/config` file.

```bash
kubectl config set-context --current --namespace=<namespace>
```

## List everything

This doesn't actually list _everything_. See below for more.

```bash
kubectl get all
```

Actually list everything. May take awhile.

```bash
function k_get_all () {
    for i in $(kubectl api-resources --verbs=list --namespaced -o name | grep -v "events.events.k8s.io" | grep -v "events" | sort | uniq); do
        kubectl get --show-kind --ignore-not-found ${i};
    done
}
```

## Show pod logs

```bash
kubectl logs pod/<pod>
```

## Use 'helm upgrade' to install new version of a chart

This is far simpler than a more complex `helm install` command with tons of `--set` options. More infomration [here](https://helm.sh/docs/helm/helm_upgrade/)

```bash
helm upgrade <release name> <chart name> --reuse-values
```
