# Modular applications
Sometimes we need an application to be modularized, i.e. have each part of it be a different React project.

We assume, a modular application will have a host (or shell project) and many more child projects, that are imported via something like
[Module Federation](https://webpack.js.org/concepts/module-federation/).

In summary, each module will know only its own navigation tree and append it to the host's navigation tree as soon as loaded. To allow this
we introduce the concepts of wildcards (host) and route links (child projects).

#### Wildcards
Wildcards are accepted at the end of paths. This tells the navigator we don't yet know all the routes in that path and we should accept anything
as valid instead of throwing a 404.

This is only useful in a host application, see the example below:

```yaml
+ root (/):
  + account (/account/*):
  + photos (/photos/*):
```

`account` and `photos` are modules that will load their own routes, the host application has no idea yet what these routes are, so we add the
wildcard.

#### Route Links (modules)
In a module, we must tell the navigator this is a module and where it should attach itself in the host application. Let's take the module `account`
as an example.

All the routes of the module `account` must replace the route named `root.account` in the host application. We declare this in the `navigation.yaml`
of the module:

```yaml
+ root ~ root.account (/account):
  + billing (/billing):
    month: number
  + changePassword (/change-password):
  + profile (/profile):
```

In the module `application` we'll access the routes normally, but when running in a modular environment, the navigator will know that the root route
of this module must replace `root.account` in the parent. The character `~` is what indicates the link between the module and the host.

- NOTE 1: when running `application` as a standalone app, the route `/` will result in a 404, since our root is actually at the path `/account`.
- NOTE 2: the host navigator will accept everything under `account/` until the module is loaded. When it is loaded, the wildcard is replaced by the
actual route (from the module) and any attempt to access an invalid route will result in a 404.
