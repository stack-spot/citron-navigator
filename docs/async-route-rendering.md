# Asynchronous route rendering
Most applications are too large to load every view at once, so, instead of importing them statically we can import them dynamically and
only fetch them when the route is matched in `useNavigationContext`.

Let's see how we would rewrite the example used in
[Route based rendering](./route-based-rendering.md#rendering-a-view-based-on-the-current-route) with async route loading:

```tsx
export const Page = () => {
  const [content, setContent] = useState<React.Element>(<></>)
  
  useNavigationContext((context) => {
    context
      .when('root', async (props) => {
        const { Home } = await import('./Home')
        setContent(<Home {...props} />)
      })
      .when('root.account', async (props) => {
        const { AccountDashboard } = await import('./AccountDashboard')
        setContent(<AccountDashboard {...props} />)
      })
      .when('root.account.profile', async (props) => {
        const { Profile } = await import('./Profile')
        setContent(<Profile {...props} />)
      })
      .when('root.account.changePassword', async (props) => {
        const { ChangePassword } = await import('./ChangePassword')
        setContent(<ChangePassword {...props} />)
      })
      .when('root.account.billing', async (props) => {
        const { Billing } = await import('./Billing')
        setContent(<Billing {...props} />)
      })
      .when('root.photoAlbums', async (props) => {
        const { PhotoAlbums } = await import('./PhotoAlbums')
        setContent(<PhotoAlbums {...props} />)
      })
      .when('root.photoAlbums.album', async (props) => {
        const { Album } = await import('./Album')
        setContent(<Album {...props} />)
      })
      .when('root.photoAlbums.album.photo', async (props) => {
        const { Photo } = await import('./Photo')
        setContent(<Photo {...props} />)
      })
      .whenNotFound(() => setContent(<h1>404: Not Found</h1>))
  })

  return content
}
```