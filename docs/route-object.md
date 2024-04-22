# The Route object
A route object is any instance of any class that extends `Route`. All routes declared in the `navigation.yaml` file becomes route objects
at runtime.

A route object can be accessed:
- directly by importing it from the generated file (e.g. `import { root } from 'src/generated/navigation'`);
- by the prop `route` of a view;
- by the hook `useRouteData()`.

A route object is important for creating links, navigating and checking if it's currently active.

The properties and methods of a route object are always prefixed with `$`, while the children of the route have no prefix. To create a link
to the page `photo`, for instance, we could write: `root.photoAlbums.album.photo.$link({ albumId: 'a_id', photoId: 'p_id' })`.

Every route has:
- $key: the unique key of the route.
- $path: the path for this route, as written in `navigation.yaml`.
- $parent: the parent route in the navigation tree. Will be undefined for the root route.
- $paramMetadata: the metadata for the parameters this route receives: used internally for serialization/deserialization.
- $go(): navigate to this route using the history api.
- $link(): create a link (path) to this route.
- $is(): checks if a key is the same as the key of this route.
- $containsSubroute(): checks if a key corresponds to this route or any of its sub-routes (descendants).
- $isSubrouteOf(): checks if a key corresponds to this route or any of its super-routes (ascendants).
- $match(): checks how a path matches the path of this route: exact, subroute or super-route.
- $isActive(): checks if this route is currently active.
- $isSubrouteActive(): checks if this route or any of its sub-routes are currently active.
- $getBranch(): gets a path from the root route to this route.
