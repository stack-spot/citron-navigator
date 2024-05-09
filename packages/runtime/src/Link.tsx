import { useMemo } from 'react'
import { CitronNavigator } from './CitronNavigator'
import { AnyRoute, Route } from './Route'
import { RequiredKeysOf } from './types'

type RouteProps<T extends AnyRoute | undefined> = { to?: T } & (T extends Route<any, infer Params, any>
  ? Params extends void
    ? unknown
    : RequiredKeysOf<Params> extends never ? { params?: Params } : { params: Params }
  : unknown)

type Props<T extends AnyRoute | undefined> = React.AnchorHTMLAttributes<HTMLAnchorElement> & RouteProps<T>

interface LinkFn {
  <T extends AnyRoute | undefined>(props: Props<T>): React.ReactElement,
}

export const Link: LinkFn = (props) => {
  const { to, params, href, children, target, onClick, onKeyDown, ...anchorProps } = props as Props<Route<any, object, any>>
  const { actualHref, shouldActLikeSimpleAnchor } = useMemo(() => {
    const actualHref = to ? to.$link(params) : href
    const isHashUrl = actualHref && /^\/?#/.test(actualHref)
    const isAbsoluteUrl = actualHref && /^\w+:\/\//.test(actualHref)
    const shouldActLikeSimpleAnchor = !actualHref || isHashUrl || (target && target != '_self') || isAbsoluteUrl
    return { actualHref, shouldActLikeSimpleAnchor }
  }, [to?.$key, href, params])

  if (shouldActLikeSimpleAnchor) {
    return <a href={actualHref} target={target} onClick={onClick} onKeyDown={onKeyDown} {...anchorProps}>{children}</a>
  }

  function navigate(event: React.UIEvent) {
    event.preventDefault()
    history.pushState(null, '', actualHref)
    // since we called event.preventDefault(), we now must manually trigger a navigation update
    CitronNavigator.instance?.updateRoute?.()
  }

  function handleNavigationClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
    navigate(event)
    onClick?.(event)
  }

  function handleNavigationKeyDown(event: React.KeyboardEvent<HTMLAnchorElement>) {
    if (event.key === 'Enter') navigate(event)
    onKeyDown?.(event)
  }
  
  return (
    <a href={actualHref} target={target} onClick={handleNavigationClick} onKeyDown={handleNavigationKeyDown} {...anchorProps}>
      {children}
    </a>
  )
}
