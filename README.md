# Citron Navigator
Citron Navigator is a navigator for React web applications written with Typescript.

Main features:
- Render content based on the current URL.
- Use hooks to get the current route and url parameters from anywhere.
- Easily figure if a route or any of its sub-routes are active.
- Concentrate all route definitions in a single file.
- Automatic serialization/deserialization of variables in the URL.
- Type-safe! No more guessing which route accepts which parameters.
- Context-aware: navigating from `/resourceA/{resourceAId}` to `/resourceA/{resourceAId}/resourceB/{resourceBId}` should take only
`resourceBId` as a required parameter, `resourceAId` should be optional in this context.
- Support for modular applications (e.g. Module Federation).

## Motivation
We, at StackSpot, have some very large web applications, with an enormous amount of routes. Navigation became a problem where we couldn't
know for sure the contract of each page, i.e. what parameters they could receive from the URL (route and search parameters). Moreover,
it was impossible to easily see every route that existed in the application, since they would be all spread.

The current solutions for navigating a React web application don't embrace Typescript for a type-safe way of navigating, we normally have
to implement type-safe mechanisms on our own in order to guarantee a navigation will always be performed correctly. Unfortunately, it is
hard to force a developer to always use the "correct way of navigating" that we created locally, creating a big mess over time. Some
times we'd have no type-check at all and it can become very easy to go to page that requires a variable without passing this variable.

Another big problem we faced without typed-navigation was getting the search parameters in a page. How would the developer know what search
parameters the page can receive, where are they defined? How does the programmer make changes to these parameters? What's the correct way to
deserialize the string in the URL?

It can become quite complex to manage url variables in a large application, we needed a library that would take care of this for us, so we
created Citron Navigator.

## How does it work?
Citron Navigator is based in a yaml file that declares the whole navigation tree and the parameters for each of the routes. See the example
below:

```yaml
+ root (/):
  + account (/account):
    + profile: (/profile):
    + changePassword: (/password):
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

The file above defines that we have 8 routes in our application: root, account, profile, changePassword, billing, photoAlbums, album and
photo.

#### Paths
- root: /
- account: /account
- profile: /account/profile
- changePassword: /account/password
- billing: /account/billing
- photoAlbums: /albums
- album: /albums/{albumId}
- photo: /albums/{albumId}/{photoId}

#### Route parameters
- root, account, profile, changePassword, billing and photoAlbums are pages that don't accept any route parameter.
- album accepts an `albumId` as a route parameter.
- photo accepts a `photoId` and an `albumId` (from the parent) as route parameters.

#### Search parameters
- root, account, profile, changePassword and photo are pages that don't accept any search parameter.
- billing accepts one search parameter: "year", and it must be a number.
- photoAlbums accepts many search parameters, they are:
  - search: must be a string;
  - year: must be a number;
  - month: must be a number and be typed as `1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12`, not any number;
  - limit: must be a number;
  - page: must be a number;
  - type: must be a string and be typed as `'ownedByMe' | 'sharedWithMe' | 'all'`, not any string.
- album accepts 2 search parameters:
  - limit: must be a number;
  - page: must be a number.

### Code generation
The code for the navigator is generated based on the yaml file. It uses the runtime library to instantiate a navigator based on your
specifications.

### Usage
Let's render some content according to the current route:

```tsx
export const Page = () => {
  const [content, setContent] = useState<React.Element>(<></>)
  
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
  })

  return content
}
```

Let's see the implementation for `Album` which is rendered when the route is `root.photoAlbums.album`:

```tsx
const Album = ({ route, params: { albumId, limit, page } }: ViewPropsOf<'root.photoAlbums.album'>) => (
  <p>Album {albumId}</p>
  <p>limit is {limit}</p>
  <p>page is {page}</p>
  <p><a href={route.$parent.$link()}>Go back to albums</a></p>
  <p><a href={route.photo.$link({ photoId: '001' })}>Check out this picture</a></p>
)
```

Notice that, from "album", we can easily create a link to "photo" by passing only the `photoId`, the `albumId` is implicit.

When creating links or navigating to other pages, the type will always be checked by Typescript. In the example above, if we didn't pass
`photoId` when creating a link to "photo", we'd get a type error and the code wouldn't build.

## Installation
We're going to use [PNPM](https://pnpm.io) throughout this documentation, but feel free to use either NPM or YARN.
```sh
pnpm add -D @stack-spot/citron-navigator-cli
pnpm add @stack-spot/citron-navigator
```

`citron-navigator-cli` is responsible for generating the code while `@stack-spot/citron-navigator` is the runtime dependency.

## Configuration
1. If you're using git, ignore the file generated by the CLI. In `.gitignore`, add: "src/generated".
2. Create the file `navigation.yaml` in the root of your project. This file should contain the definition for the routes in your
application as showed in the first code example of this document.
3. This is optional, but to make it easier to import navigation related structures, create an alias to `src/generated/navigation.ts`. In
your tsconfig.json, add:
```json
"paths": {
  "navigation": ["./src/generated/navigation"],
}
```
You should do the same to whatever bundler you're using. In Vite, for instance, you should add the following to `vite.config.ts`:
```ts
{
  resolve: {
    alias: {
      navigation: resolve(__dirname, './src/generated/navigation'),
    },
  },
}
```

## Source code generation
```sh
pnpm citron
```

By default it will get the definitions from `navigation.yaml` and output the generated code to `src/generated/navigation.ts`. If you need
to change this, pass the options `--src` and `--out`.

The navigator uses hash-based URLs by default (/#/route). To change this behavior, you can pass the option `--useHash=false` to the command
`citron`.

It's a good idea to call `citron` before running the application locally or building, check the example below for Vite:

`package.json:`
```json
{
  "scripts": {
    "start": "citron && vite --port 3000",
    "build": "citron && tsc && vite build --mode production",
  }
}
```

## Documentation
- [Sample project](https://github.com/stack-spot/citron-navigator/blob/main/packages/sample)
- [Configuration file (yaml)](https://github.com/stack-spot/citron-navigator/blob/main/docs/configuration-file.md)
- [Route-based rendering](https://github.com/stack-spot/citron-navigator/blob/main/docs/route-based-rendering.md)
- [Loading routes asynchronously](https://github.com/stack-spot/citron-navigator/blob/main/docs/async-route-rendering.md)
- [Navigation](https://github.com/stack-spot/citron-navigator/blob/main/docs/navigation.md)
- [The Route object](https://github.com/stack-spot/citron-navigator/blob/main/docs/route-object.md)
- [Hooks](https://github.com/stack-spot/citron-navigator/blob/main/docs/hooks.md)
- [Parameter serialization/deserialization](https://github.com/stack-spot/citron-navigator/blob/main/docs/serialization.md)
- [Modular applications](https://github.com/stack-spot/citron-navigator/blob/main/docs/modular.md)
