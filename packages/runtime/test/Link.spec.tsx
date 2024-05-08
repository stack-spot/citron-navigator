import { fireEvent, render } from '@testing-library/react'
import { Link } from '../src/Link'
import { NavigatorMock } from './NavigatorMock'
import { RootRoute } from './routes'
import { delay } from './utils'

describe('Link', () => {
  const root = new RootRoute()
  const navigator = new NavigatorMock(root)

  beforeEach(() => {
    navigator.reset()
    history.replaceState(null, '', 'http://localhost/')
  })

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

    async function shouldNavigateAndNotRefresh(event: Event) {
      const rendered = render(<Link data-testid="link" href="/test">Test</Link>)
      const anchor = await rendered.findByTestId('link')
      event.preventDefault = jest.fn(event.preventDefault)
      fireEvent(anchor, event)
      await delay()
      expect(navigator.updateRoute).toHaveBeenCalled()
      expect(location.href).toBe('http://localhost/test')
      expect(event.preventDefault).toHaveBeenCalled()
    }
  
    test('should navigate and not refresh when clicked', () => shouldNavigateAndNotRefresh(new MouseEvent('click')))

    test(
      'should navigate and not refresh when enter is pressed',
      () => shouldNavigateAndNotRefresh(new KeyboardEvent('keydown', { key: 'Enter' })),
    )

    test('should create link from route and params', async () => {
      const rendered = render(<Link data-testid="link" to={root.studios.studio} params={{ studioId: '1' }}>Studio 1</Link>)
      const anchor = await rendered.findByTestId('link')
      expect(anchor.getAttribute('href')).toBe('/studios/1')
    })

    test('should open in another context (target != _self)', async () => {
      const rendered = render(<Link data-testid="link" href="/test" target="_blank">Test</Link>)
      const anchor = await rendered.findByTestId('link')
      const event = new MouseEvent('click')
      event.preventDefault = jest.fn(event.preventDefault)
      fireEvent(anchor, event)
      await delay()
      expect(navigator.updateRoute).not.toHaveBeenCalled()
      expect(location.href).toBe('http://localhost/')
      expect(event.preventDefault).not.toHaveBeenCalled()
    })
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
  
    test('should act like simple anchor when clicked', async () => {
      const rendered = render(<Link data-testid="link" href="/#/test">Test</Link>)
      const anchor = await rendered.findByTestId('link')
      const event = new MouseEvent('click')
      event.preventDefault = jest.fn(event.preventDefault)
      fireEvent(anchor, event)
      await delay()
      expect(navigator.updateRoute).not.toHaveBeenCalled()
      expect(location.href).toBe('http://localhost/#/test')
      expect(event.preventDefault).not.toHaveBeenCalled()
    })

    test('should create link from route and params', async () => {
      const rendered = render(<Link data-testid="link" to={root.studios.studio} params={{ studioId: '1' }}>Studio 1</Link>)
      const anchor = await rendered.findByTestId('link')
      expect(anchor.getAttribute('href')).toBe('/#/studios/1')
    })
  })
})
