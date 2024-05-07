# Route based rendering
With your configuration file (`navigation.yaml`) ready and code generated (`npx generate:navigation`), you can start using Citron Navigator
in your source code.

The main entrypoint for interacting with the navigator is the hook `useNavigationContext`. This hook allows you to execute a block of code
whenever a route condition is satisfied. The route conditions can be:

- `when(route_key, code_block)`: used to do something when the route is exactly the one we want;
- `whenSubrouteOf(route_key, code_block)`: used to do something when the route is the route we want or any of its sub-routes;
- `whenNotFound(code_block)`: block of code to run when the current route is invalid;
- `otherwise(code_block)`: block of code to run when the current route is valid, but doesn't satisfy any other condition.

For rendering a view, we'll normally use only `when`, while `whenSubrouteOf` is specially useful for rendering side-menus, where the content
changes based on the current section of the site.

## Configuration file (navigation.yaml)
For every example in this page, we'll consider the following configuration

```yaml
+ root (/):
  + account (/account):
    + profile (/profile):
    + changePassword (/password):
    + billing (/billing):
      year: number
  + photoAlbums (/albums):
    search: string
    year: number
    month: number (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)
    limit: number
    page: number
    type: string ('ownedByMe' | 'sharedWithMe' | 'all')
    + album (/{albumId}):
      limit: number
      page: number
      + photo (/{photoId}):
```

## Rendering a view based on the current route
```tsx
export const Page = () => {
  const [content, setContent] = useState<React.ReactElement>(<></>)
  
  useNavigationContext((context) => {
    context
      .when('root', props => setContent(<Home {...props} />))
      .when('root.account', props => setContent(<AccountDashboard {...props} />))
      .when('root.account.profile', props => setContent(<Profile {...props} />))
      .when('root.account.changePassword', props => setContent(<ChangePassword {...props} />))
      .when('root.account.billing', props => setContent(<Billing {...props} />))
      .when('root.photoAlbums', props => setContent(<PhotoAlbums {...props} />))
      .when('root.photoAlbums.album', props => setContent(<Album {...props} />))
      .when('root.photoAlbums.album.photo', props => setContent(<Photo {...props} />))
      .whenNotFound(() => setContent(<h1>404: Not Found</h1>))
  })

  return content
}
```

Every time the route changes, the conditions will be re-evaluated and the state `content` will be updated accordingly. Now, you just need
to call `<Page />` wherever you need the views to be rendered!

Notice that `context` is typed, so you can't, for instance, assign a view that requires `photoId` to a route that doesn't have the parameter
 `photoId`.

## Creating a view
A view is a React component that accepts as prop the type `ViewPropsOf<'key_of_view'>`. See the example below:

```tsx
const Album = ({ route, params: { albumId, limit, page } }: ViewPropsOf<'root.photoAlbums.album'>) => (
  <p>Album {albumId}</p>
  <p>limit is {limit}</p>
  <p>page is {page}</p>
  <p><a href={route.$parent.$link()}>Go back to albums</a></p>
  <p><a href={route.photo.$link({ photoId: '001' })}>Check out this picture</a></p>
)
```

Every view receives 2 properties:

#### route
The route corresponding to the key passed to `when` or `whenSubrouteOf`.

This is super useful for creating links and navigating. This route is contextualized, i.e., it knows where it is and won't ask for stuff it
doesn't need. For instance, suppose we're at `/albums/myAlbumId`. If we want to navigate to a photo, we just need to call
`route.photo.$go({ photoId: 'myPhotoId' })`. There's no need to pass the `albumId`. If instead we were at `/` (root), then `albumId` would
be required.

The route is also used to make changes to the variables in the url. If we are at `/albums` and want to set the value for the parameter
`search`, for instance, we just need to call `route.$go({ search: 'new value' })`. The URL will be updated, and the value of `params.search`
in the component props, will change.

To know more about what you can do with the Route object, check its documentation [here](route-object.md).

#### params
An object containing all route parameters and search parameters. The values received here are ready to use, i.e. they are already
deserialized.

## Rendering a menu based on the current route
As you can imagine, we can use the same approach we used to render a view to render anything we want. The only difference for a menu is that
we'll probably use `whenSubrouteOf` much more often. See the example below:

```tsx
export const Page = () => {
  const [content, setContent] = useState<React.Element>(<></>)
  
  useNavigationContext((context) => {
    context
      .whenSubrouteOf('root.account', props => setContent(<AccountMenu {...props} />))
      .whenSubrouteOf('root.photoAlbums', props => setContent(<PhotoAlbumMenu {...props} />))
      .otherwise(() => setContent(<MainMenu />))
  })

  return content
}
```

## Creating a menu
Just like a view, here we need a React component that accepts as prop the type `ViewPropsOf<'key_of_view'>`:

```tsx
export const AccountMenu = ({ route }: ViewPropsOf<'root.account'>) => (
  <ul>
    <li><a href={route.$link()} className={route.$isActive() ? 'active' : ''}>Dashboard</a></li>
    <li><a href={route.profile.$link()} className={route.profile.$isActive() ? 'active' : ''}>Profile</a></li>
    <li><a href={route.changePassword.$link()} className={route.changePassword.$isActive() ? 'active' : ''}>Change password</a></li>
    <li><a href={route.billing.$link()} className={route.billing.$isActive() ? 'active' : ''}>Billing</a></li>
  </ul>
)
```

Since the main menu doesn't need a context to render, we can use static routes instead of contextual routes:

```tsx
import { root } from 'src/generated/navigation' // replace this import for what works best for you, this needs to refer to the generated file

export const MainMenu = () => (
  <ul>
    <li><a href={root.$link()} className={root.$isActive() ? 'active' : ''}>Home</a></li>
    <li><a href={root.account.$link()}>Account</a></li>
    <li><a href={root.photoAlbums.$link()}>Photo albums</a></li>
  </ul>
)
```

## Asynchronous route rendering
Check the documentation for async rendering [here](async-route-rendering.md).
