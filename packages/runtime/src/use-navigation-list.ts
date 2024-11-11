import { useEffect, useState } from 'react'
import { CitronNavigator } from './CitronNavigator'
import { AnyRoute } from './Route'

interface NavigationItem {
  key: string,
  href: string,
  label: string,
}

function routeKeyToLabel(key: string) {
  const keyParts = key.split('.')
  const lastKeyPart = keyParts[keyParts.length - 1]
  // transforms uppercase letters into spaces + lowercase and capitalizes the first letter.
  return lastKeyPart.replace(/([A-Z])/g, m => ` ${m.toLowerCase()}`).replace(/^[a-z]/, m => m.toUpperCase())
}

/**
 * Returns the navigation list for the current route. This is useful for building breadcrumb-like user interfaces.
 * 
 * The return value is a list where each item contains: key (unique id), label (name) and href (url).
 * 
 * @param labelFactory optional. A function to create a label for a route. If not provided, every route will have the last part of
 * its key capitalized as its label. If the label factory returns undefined, the default rule for building labels is used. If it returns
 * null, the route is removed from the list.
 * @param shouldMergeSearchParams optional. A function that takes a route key and returns a boolean indicating whether the search
 * parameters (query string) from the current location should be merged into the route's URL. If the function returns `true`, the 
 * search parameters will be merged into the `href` of the route. If it returns `false` or is not provided, the search parameters 
 * will not be merged.
 * @returns the navigation list.
 */
export function useNavigationList(
  labelFactory?: (key: string, params: Record<string, any>) => string | undefined | null,
  shouldMergeSearchParams?: (key: string) => boolean
): NavigationItem[] {
  const [data, setData] = useState<{ route?: AnyRoute, params?: Record<string, any> }>({
    route: CitronNavigator.instance?.currentRoute,
    params: CitronNavigator.instance?.currentParams,
  })

  useEffect(() => CitronNavigator.instance?.onRouteChange((route, params) => setData({ route, params })), [])

  if (!data.route) return []
  const branch = data.route.$getBranch()
  return branch.reduce(
    (result, route) => {
      let label = labelFactory ? labelFactory(route.$key, data.params ?? {}) : routeKeyToLabel(route.$key)
      if (label === undefined) label = routeKeyToLabel(route.$key)
      return label === null
        ? result
        : [
          ...result,
          {
            key: route.$key,
            href: route.$link({}, { mergeSearchParameters: shouldMergeSearchParams?.(route.$key) }),
            label
          },
        ]
    },
    [] as NavigationItem[],
  )
}
