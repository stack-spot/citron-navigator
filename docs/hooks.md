# Hooks
Citron Navigator includes two React hooks: `useRouteData` and `useNavigationList`.

## useRouteData
This hook is created by the generated code and allows the developer to get the current route and the current parameters from anywhere.

Most components will be called by views. Prefer passing props instead of using this hook, since it's much safer (type-wise).

This hook is most useful when you need to render something outside the context of a `useNavigationContext` that must know the current route
and params. Let's see an example of how to use it:

```tsx
import { useRouteData } from 'src/generated/navigation'

const Header = () => {
  const { route, params } = useRouteData()

  return (
    <>
      <p>current page: {route.$key}</p>
      {params.search && <p>searching {params.search}</p>}
    </>
  )
}
```

This is an untyped usage of `useRouteData`. If you know which route the component will be used in, you can ask for a typed version of the
data:

```tsx
const { route, params } = useRouteData('root.photoAlbums')
```

`route`, when used by this hook, will always be the current route, despite the key passed as parameter.

## useNavigationList
Returns the navigation list for the current route. This is useful for building breadcrumb-like user interfaces.

The return value is a list where each item contains: key (unique id), label (name) and href (url).

This hooks may receive a function to create a label for a route. If not provided, every route will have the last part of its key transformed
into a more readable format (capitalized and with spaces instead of camel case).

Example: if the user is at the route with key `root.photoAlbums.album.photo`, `useNavigationList`returns:
```js
[
  {
    key: 'root',
    label: 'Root',
    href: '/#/', // "/" if hash urls are disabled
  },
  {
    key: 'root.photoAlbums',
    label: 'Photo albums',
    href: '/#/albums', // "/albums" if hash urls are disabled
  },
  {
    key: 'root.photoAlbums.album',
    label: 'Album',
    href: '/#/albums/albumId', // "/albums/albumId" if hash urls are disabled
  },
  {
    key: 'root.photoAlbums.album.photo',
    label: 'Photo',
    href: '/#/albums/albumId/photoId', // "/albums/albumId/photoId" if hash urls are disabled
  }
]
```
