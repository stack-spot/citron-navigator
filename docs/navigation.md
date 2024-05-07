#  Navigation
To navigate under a Citron Navigator environment, you need access to a [Route object](docs/route-object.md). Inside a view, you can get it
through the view Props. Check the example below:

```tsx
const Home = ({ route }: ViewPropsOf<'root'>) => (
  <a href={route.account.$link()}>Go to account</a>
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
