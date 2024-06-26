import { FunctionComponent, ReactNode, useCallback, useState } from 'react'

interface AsyncViewConfig {
  /**
   * A component to render when the view can't be loaded (error).
   * 
   * This component receives the prop "refresh" which is a function that refreshes the app when called.
   */
  ErrorComponent?: FunctionComponent<{ refresh: () => void }>,
  /**
   * Whether or not to automatically refresh the view with cache disabled when an error occurs.
   * 
   * If another error happens after refreshing, the `errorComponent` is rendered, it doesn't refresh again.
   */
  shouldRefreshOnError?: boolean,
  /**
   * The initial value for `content`.
   */
  initial?: ReactNode,
} 

// used to force the app to retrieve the latest version of index.html.
const refreshAppParam = 'update-app'

function isAppRefreshed() {
  return !!location.href.match(`[?&]${refreshAppParam}=\\d+`)
}

function refreshApp() {
  const now = new Date().getTime()
  const newUrl = isAppRefreshed()
    ? location.href.replace(new RegExp(`([?&]${refreshAppParam}=)\\d+`), `$1${now}`)
    : location.href.replace(/(\?.*)?$/, `$1${location.href.includes('?') ? '&' : '?'}${refreshAppParam}=${now}`)
  history.replaceState(null, '', newUrl)
  location.reload()
}

/**
 * A hook for helping loading views asynchronously.
 * 
 * Example:
 * ```tsx
 * const PageRenderer = () => {
 *   const { load, content } = useAsyncView({ ErrorComponent: UnderMaintenance })
 *   useNavigationContext((context) => {
 *     context.when('root', props => load(() => import('./Home'), 'Home', props))
 *   })
 *   return content
 * }
 * ```
 * @param options the options for loading async views. 
 * @returns the values and functions for manipulating the current view (content).
 */
export function useAsyncView({ ErrorComponent, shouldRefreshOnError = true, initial }: AsyncViewConfig = {}) {
  const [content, setContent] = useState<ReactNode>(initial)
  const load = useCallback(async<
    Props extends object,
    Import extends Record<string, React.FunctionComponent<Props>>,
    Key extends keyof Import,
  >(loader: () => Promise<Import>, key: Key, props: Props) => {
    try {
      const View: React.FunctionComponent<Props> = (await loader())[key]
      setContent(<View {...props} />)
    } catch (error) {
      if (!shouldRefreshOnError || isAppRefreshed()) {
        // eslint-disable-next-line no-console
        console.error(error)
        setContent(ErrorComponent ? <ErrorComponent refresh={refreshApp} /> : <p>Error while loading the view.</p>)
        return
      }
      // eslint-disable-next-line no-console
      console.warn('Error while loading page. This is probably because a new version of the site is available. Refreshing...')
      refreshApp()
    }
  }, [])

  return { load, content, setContent }
}
