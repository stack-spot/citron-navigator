import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link } from '../src/Link'
import { NavigatorMock } from './NavigatorMock'
import { RootRoute } from './routes'

describe('Link', () => {
  const root = new RootRoute()
  const navigator = new NavigatorMock(root)

  beforeEach(() => {
    navigator.reset()
    history.replaceState(null, '', 'http://localhost/')
  })

  async function shouldActLikeSimpleAnchor(href?: string, expectedUrl?: string, target?: React.HTMLAttributeAnchorTarget) {
    const user = userEvent.setup()
    const onWrapperEvent = jest.fn((event: React.UIEvent) => expect(event.defaultPrevented).toBe(false))
    const rendered = render(
      <div onClick={onWrapperEvent} onKeyDown={onWrapperEvent}>
        <Link data-testid="link" href={href} target={target}>Test</Link>
      </div>
    )
    const anchor = await rendered.findByTestId('link')
    await user.click(anchor)
    expect(onWrapperEvent).toHaveBeenCalled()
    expect(navigator.updateRoute).not.toHaveBeenCalled()
    if (expectedUrl) expect(location.href).toBe(expectedUrl)
  }

  describe('URLs without hash', () => {
    beforeAll(() => {
      navigator.useHash = false
    })

    test('should render an anchor tag with the correct attributes', async () => {
      const rendered = render(<Link data-testid="link" href="/test" className="class">Test</Link>)
      const anchor = await rendered.findByTestId('link')
      expect(anchor.tagName).toBe('A')
      expect(anchor.getAttribute('href')).toBe('/test')
      expect(anchor.getAttribute('class')).toBe('class')
    })

    async function shouldNavigateAndNotRefresh(
      fireUserEvent: (element: HTMLElement) => Promise<void>,
      target?: React.HTMLAttributeAnchorTarget,
    ) {
      const onWrapperEvent = jest.fn((event: React.UIEvent) => expect(event.defaultPrevented).toBe(true))
      const rendered = render(
        <div onClick={onWrapperEvent} onKeyDown={onWrapperEvent}>
          <Link data-testid="link" href="/test" target={target}>Test</Link>
        </div>
      )
      const anchor = await rendered.findByTestId('link')
      await fireUserEvent(anchor)
      expect(onWrapperEvent).toHaveBeenCalled()
      expect(navigator.updateRoute).toHaveBeenCalled()
      expect(location.href).toBe('http://localhost/test')
    }
  
    test('should navigate and not refresh when clicked', () => shouldNavigateAndNotRefresh((element) => {
      const user = userEvent.setup()
      return user.click(element)
    }))

    test('should navigate and not refresh when clicked', () => shouldNavigateAndNotRefresh((element) => {
      const user = userEvent.setup()
      return user.click(element)
    }))

    test('should create link from route and params', async () => {
      const rendered = render(<Link data-testid="link" to={root.studios.studio} params={{ studioId: '1' }}>Studio 1</Link>)
      const anchor = await rendered.findByTestId('link')
      expect(anchor.getAttribute('href')).toBe('/studios/1')
    })

    test('should navigate and not refresh when target is _self', () => shouldNavigateAndNotRefresh((element) => {
      const user = userEvent.setup()
      return user.click(element)
    }, '_self'))

    test('should act like simple anchor when target is _blank', () => shouldActLikeSimpleAnchor('/test', 'http://localhost/', '_blank'))

    test('should act like simple anchor when target is _parent', () => shouldActLikeSimpleAnchor('/test', 'http://localhost/', '_parent'))

    test('should act like simple anchor when target is _top', () => shouldActLikeSimpleAnchor('/test', 'http://localhost/', '_top'))
  })

  describe('URLs with hash', () => {
    beforeAll(() => {
      navigator.useHash = true
    })

    test('should render an anchor tag with the correct attributes', async () => {
      const rendered = render(<Link data-testid="link" href="/#/test" className="class">Test</Link>)
      const anchor = await rendered.findByTestId('link')
      expect(anchor.tagName).toBe('A')
      expect(anchor.getAttribute('href')).toBe('/#/test')
      expect(anchor.getAttribute('class')).toBe('class')
    })
  
    test('should act like simple anchor when clicked (/#/)', () => shouldActLikeSimpleAnchor('/#/test', 'http://localhost/#/test'))

    test('should act like simple anchor when clicked (#/)', () => shouldActLikeSimpleAnchor('#/test', 'http://localhost/#/test'))

    test('should create link from route and params', async () => {
      const rendered = render(<Link data-testid="link" to={root.studios.studio} params={{ studioId: '1' }}>Studio 1</Link>)
      const anchor = await rendered.findByTestId('link')
      expect(anchor.getAttribute('href')).toBe('/#/studios/1')
    })
  })

  describe('Absolute URLs', () => {
    test('should act like simple anchor when clicked', () => shouldActLikeSimpleAnchor('https://www.google.com'))
  })

  describe('Empty href', () => {
    test('should act like simple anchor when clicked', () => shouldActLikeSimpleAnchor())
  })
})
