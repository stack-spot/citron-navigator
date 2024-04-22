import { useEffect, useState } from 'react'
import { CitronNavigator } from './CitronNavigator'
import { AnyRoute } from './Route'

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
 * its key capitalized as its label.
 */
export function useNavigationList(labelFactory?: (key: string, params: Record<string, any>) => string) {
  const [data, setData] = useState<{ route?: AnyRoute, params?: Record<string, any> }>({
    route: CitronNavigator.instance?.currentRoute,
    params: CitronNavigator.instance?.currentParams,
  })

  useEffect(() => CitronNavigator.instance?.onRouteChange((route, params) => setData({ route, params })), [])

  if (!data.route) return []
  const branch = data.route.$getBranch()
  return branch.map(r => ({
    key: r.$key,
    href: r.$link({}),
    label: labelFactory ? labelFactory(r.$key, data.params ?? {}) : routeKeyToLabel(r.$key),
  }))
}
