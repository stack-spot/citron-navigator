export function removeElementFromArray<T>(array: T[], element: T): boolean {
  const index = array.indexOf(element)
  if (index !== -1) array.splice(index, 1)
  return index !== -1
}

export function compareRouteKeysDesc(
  a: { key: string, handler: (...args: any) => any },
  b: { key: string, handler: (...args: any) => any },
): number {
  const partsA = a.key.split('.')
  const partsB = b.key.split('.')
  return partsB.length - partsA.length
}

export function splitPath(path = ''): string[] {
  const parts = path.replace(/^\/?/, '/').split('/')
  if (parts[parts.length - 1] === '') parts.pop()
  return parts
}
