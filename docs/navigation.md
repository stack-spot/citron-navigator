#  Navigation
To navigate under a Citron Navigator environment, you need access to a [Route object](docs/route-object.md). Inside a view, you can get it
through the view Props. Check the example below:

```tsx
const Home = ({ route }: ViewPropsOf<'root'>) => (
  <Link to={route.account}>Go to account</Link>
)
```

A navigation can be performed through the methods `$link` and `$go`. `$link` will create a URL (string) that can be placed in an anchor,
while `$go` will navigate immediately to the route. Both methods can accept parameters, it will depend on which parameters the route accept.
Route parameters are mandatory and Search parameters are optional.

- To change a URL parameter of the current route, just call `route.$go` or `route.$link`. To decide whether or not to merge the next
parameters with the current, pass a second object with options.
- To navigate forward, use the navigation tree exposed by the route. Example: `route.account.changePassword.$go()`.
- To navigate back, use the property `$parent` of the route. Example: `route.$parent.$go()`. Note that the root doesn't have a parent.
Attention: this will use `history.pushState` or `history.replaceState`, just like the forward navigation.

You can navigate to every route declared in your YAML file.

## The Link component
If you're using the default configuration, where `useHash = true` and don't intend to change this in the future, then you can ignore the
Link component and use the native `a` tag from HTML instead. Example of navigation using the `a` tag:

```tsx
const Home = ({ route }: ViewPropsOf<'root'>) => (
  <a href={route.account.$link()}>Go to account</a>
)
```

Otherwise, if you don't use hashes in the URL or want to support both mechanisms (with and without hashes), then you should use the Link
component to navigate with HTML anchors.

If a simple `a` tag is used and `useHash` is false, the browser will reload the page in order to perform a navigation. We don't want this.
`Link` prevents such reload.

The Link component can be used in one of two ways:
1. Passing a route and its parameters:
```tsx
const Albums = ({ route }: ViewPropsOf<'root.photoAlbums'>) => (
  <Link to={route.album} params={{ albumId: 1 }}>Go to Album 1</Link>
  <Link to={route.album} params={{ albumId: 2 }}>Go to Album 2</Link>
)
```
2. Passing the `href` prop:
```tsx
const Albums = ({ route }: ViewPropsOf<'root.photoAlbums'>) => (
  <Link href={route.album.$link({ albumId: 1 })}>Go to Album 1</Link>
  <Link href={route.album.$link({ albumId: 2 })}>Go to Album 2</Link>
)
```

A `Link` will always render an `a` tag in the HTML.
