/**
 * Removes the first occurrence of `element` from the `array`.
 * 
 * This modifies the array passed as parameter.
 * @param array the array to modify.
 * @param element the element to remove (SameValueZero).
 * @returns true if the element was removed, false otherwise.
 */
export function removeElementFromArray<T>(array: T[], element: T): boolean {
  const index = array.indexOf(element)
  if (index !== -1) array.splice(index, 1)
  return index !== -1
}

/**
 * Compares route `a` with route `b` according to their level in the navigation structure.
 * 
 * - If route `a` is deeper than route `b`, than this function returns a negative number.
 * - If route `b` is deeper than route `a`, than this function returns a positive number.
 * - If routes `a` and `b` are at the same level, 0 is returned.
 * 
 * In general, this returns `level_of_route_b - level_of_route_a`, where the level is number of elements of the key when splitted by ".".
 * 
 * This is used to order a list from more specific routes (deeper) to less specific routes (shallower).
 * @param a the key of the first route to compare.
 * @param b the key of the route to compare `a` with.
 * @returns the level of b minus the level of a.
 */
export function compareRouteKeysDesc(
  a: { key: string, handler: (...args: any) => any },
  b: { key: string, handler: (...args: any) => any },
): number {
  const partsA = a.key.split('.')
  const partsB = b.key.split('.')
  return partsB.length - partsA.length
}

/**
 * Splits a path into several parts. A path is split according to the character "/".
 * 
 * @param path the path to split.
 * @returns an array with every part of the path.
 */
export function splitPath(path = ''): string[] {
  // includes a trailing "/" to the path if it doesn't have one and then splits the whole string by "/".
  const parts = path.replace(/^\/?/, '/').split('/')
  // if the path had a trailing "/", let's just not count it.
  if (parts[parts.length - 1] === '') parts.pop()
  return parts
}
