import { ViewPropsOf } from '../generated/navigation'

export const Albums = ({ route }: ViewPropsOf<'root.photoAlbums'>) => (
  <div>
    <h1>Albums</h1>
    <nav>
      <ul>
        <li><a href={route.$parent.$link()}>Go back</a></li>
        <li><a href={route.album.$link({ albumId: '1' })}>Album 1</a></li>
        <li><a href={route.album.$link({ albumId: '2', limit: 20, page: 5 })}>Album 2: page 5, 20 photos per page</a></li>
        <li><a href={route.album.$link({ albumId: '3' })}>Album 3</a></li>
      </ul>
    </nav>
  </div>
)