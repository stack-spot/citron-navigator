# Configuration file (YAML)
All the routes in an application with Citron Navigator must be declared in a YAML file: "navigation.yaml" by default.

The YAML file must contain a single element in the root: the root view, which will generally correspond to the home page.

```yaml
+ root (/):
```

A view must be declared in the format `+ name_of_view (path_in_url):`. Any sub-view in this path must be declared as a child, see the
example below:

```yaml
+ root (/):
  + account (/account):
    + settings (/settings):
    + changePassword (/password/change):
  + friends (/friends):
```

The yaml file represents the navigation tree of the site, see above how we declared each view as a child of another (except the root).
Considering the configuration above, the navigator would render the following pages given a path:

- `/`: root
- `/account`: account
- `/settings`: *nothing*
- `/account/settings`: settings
- `/password`: *nothing*
- `/changePassword`: *nothing*
- `/account/password`: *nothing*
- `/account/password/change`: changePassword
- `/friends`: friends
- `/friends/id`: *nothing*

Notice that we declared "changePassword" as `/password/change`. One might think that doing the following is the same, but it isn't:

```yaml
+ root (/):
  + account (/account):
    + password (/password):
      + changePassword (/change):
```

This last config says that both `/account/password` and `/account/password/change` exist, while the first configuration says only
`/account/password/change` does.

## Route keys
The name of a route is used to create its unique id called "key". Considering our first examples, our keys would be:
- root: root;
- account: root.account;
- settings: root.account.settings;
- changePassword: root.account.changePassword;
- friends: root.friends.

These keys will be used to render content and to type a view correctly.

## Route parameters
A very important part of any navigation system is declaring route parameters. To specify the variables in a route, use the format
`/{variable_name}`. See the example below:

```yaml
+ root (/):
  + friends (/friends):
    + friend (/{friendId}):
```

Now the path `/friends/id` will render "friend". Notice that "friend" is a view where the path is not static, it includes a variable. A
path can have as many variables as you need. It's important to remember that every route parameter is required, so, when navigating to
the route "friend", a `friendId` will be necessary.

A route parameter name cannot contain special chars, spaces or start with a number.

By default, every route parameter is a string, if you need to change this, you must specify the parameter type right below the view
declaration:

```yaml
+ root (/):
  + example (/example/{var1}/{var2}/{var3}/{var4}):
    var1: number
    var2: boolean
    var3: string[]
```

Above, the view "example" will have 4 variables in its path, only the 4th variable will be interpreted as string. The first will be a
number, the second a boolean and the 3rd an array of strings.

> Attention: you don't need to worry about how the variables are serialized/deserialized, Citron Navigator will take care of this for you.

## Search (query) parameters:
A view can also have search parameters, i.e. optional variables added at the end of the URL, after the symbol "?". To declare the search
parameters of a view, you must do the same as you did for typing route parameters, just add them below the route definition:

```yaml
+ root (/):
  + clients (/clients):
    search: string
    limit: number
    page: number
```

In this example we have a searchable view with pagination. The search term, the page and the number of elements in a page can be passed as
search parameters.

> Attention: names of search parameters and route parameters occupy the same space in Citric Navigator, so a view can not have a route
parameter with the same name as a search parameter.

## Valid types
The valid types for navigation variables are:

- string
- number
- boolean
- object
- string[]
- number[]
- boolean[]

## Advanced typing (Typescript type)
There are lots of situations where the types of the previous section are not enough to describe a variable. In these cases, we can specify
the Typescript type of the variable, just add it in between parenthesis, after the type:

```yaml
+ root (/):
  + photos (/photos):
    search: string
    ownership: string ('owner' | 'shared' | 'all')
    year: number
    month: number (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)
    containsColors: string[] (('blue' | 'red' | 'green'  | 'white' | 'black' | 'gray' | 'purple' | 'orange' | 'yellow' | 'pink' | 'brown')[])
```

Above, we declared a view that shows photos. The photos that will be displayed depend on a series of filters:
- search: a text that may represent the image: any string
- ownership: if we should display only pictures owned by the user, only pictures shared with the user or all of them.
- year: the year when the picture was taken: any number
- month: the month when the picture was taken: 1 to 12
- containsColors: colors that dominates the image: an array with valid colors.

You can use any Typescript type between the parenthesis, as long as it doesn't break the yaml format.

#### Declaring TS types in an external file
Sometimes your type is too complex to be written in the yaml file; or you need to reuse it; or you need to easily access it from another
file. In any of these cases, the best approach is to declare them in a separate TS file. See the example below:

`src/Navigation.d.ts`
```ts
declare namespace Navigation {
  type Ownership = 'owner' | 'shared' | 'all'
  type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  type Color = 'blue' | 'red' | 'green'  | 'white' | 'black' | 'gray' | 'purple' | 'orange' | 'yellow' | 'pink' | 'brown'
  type User = {
    name: string,
    age: number,
    id: string,
  }
}
```

`navigation.yaml`
```yaml
+ root (/):
  + photos (/photos):
    search: string
    ownership: string (Navigation.Ownership)
    year: number
    month: number (Navigation.Month)
    containsColors: string[] (Navigation.Color[])
  + example (/example):
    user: object (Navigation.User)
```

In this example we replaced every inline TS type with a type from the external type file. We also added a new route that accepts a typed
object as a search parameter.

## Modifiers
Modifiers are prefixes to route or search parameters that modifies their behavior. As of now, we have a single modifier: `propagate`.

`propagate` can only be used for search parameters and it tells the navigator every descendent route will also accept the parameter (route
parameters are by definition propagated, so they don't need it).

Let's say we want to be able to set the application language with a search parameter, and this can be done in every route of the
application:

```yaml
+ root (/):
  propagate language: string ('en' | 'es' | 'pt' | 'fr')
  + account (/account):
  + photos (/photos):
```

The search parameter "language" will exist in "root", "account" and "photos".

## Wildcards and route links
Check the [documentation for modular applications](modular.md) for more details.
