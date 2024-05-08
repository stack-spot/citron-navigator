import { useEffect, useRef } from 'react'
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
  <T extends AnyRoute | undefined>(props: Props<T>): React.ReactNode,
}

export const Link: LinkFn = (props) => {
  const { to, params, href, children, target, ...anchorProps } = props as Props<Route<any, object, any>>
  const actualHref = to ? to.$link(params) : href
  const ref = useRef<HTMLAnchorElement>(null)
  
  useEffect(() => {
    const isHashUrl = actualHref && /^\/?#/.test(actualHref)
    if (!ref.current || isHashUrl || (target && target != '_self')) return

    function navigate(event: Event) {
      event.preventDefault()
      history.pushState(null, '', actualHref)
      // since we called event.preventDefault(), we now must manually trigger a navigation update
      CitronNavigator.instance?.updateRoute?.()
    }

    function onKeyPress(event: KeyboardEvent) {
      if (event.key != 'Enter') return
      navigate(event)
    }

    ref.current.addEventListener('click', navigate)
    ref.current.addEventListener('keydown', onKeyPress)

    return () => {
      ref.current?.removeEventListener('click', navigate)
      ref.current?.removeEventListener('keydown', onKeyPress)
    }
  }, [actualHref, ref.current])
  
  return <a ref={ref} href={actualHref} target={target} {...anchorProps}>{children}</a>
}
