# Parameter serialization/deserialization
The serialization and deserialization of the parameters in the URL are made automatically according to the types defined in your YAML
file.

Strings, numbers and booleans are straight forward. Badly formatted numbers will result in `NaN` and a warning in the console. Badly
formatted booleans will result in `true` and a warning in the console.

Arrays will be serialized as plain strings when they're route parameters, using the character "-" to separate one element from another.
For arrays of strings, the character "-" can be escaped with "\".

When arrays are search parameters, they will have their keys repeated multiple times and keep the order they appear in the URL. Example:
`myUrl.com?arr=1&arr=2&arr=3` will result in `arr = [1, 2, 3]` if `arr` was registered as `number[]`.

Complex arrays can have the type `object` instead. Objects will always be serialized as JSONs.

Route parameters are encoded using `encodeURIComponent` for serialization and decoded using `decodeURIParameter` for deserialization.

Search parameters are created using the `URLSearchParams` class of Javascript, which already implements encoding and decoding.

## Custom serializers/deserializers
We don't support this. But it might be a good idea for the future. Would you like to see this implemented? Please, request the feature by
opening an issue!
