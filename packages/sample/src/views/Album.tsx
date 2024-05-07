import { ViewPropsOf } from '../generated/navigation'

export const Album = ({ route, params: { albumId, limit = 10, page = 1 } }: ViewPropsOf<'root.photoAlbums.album'>) => (
  <div>
    <h1>Album {albumId} (limit = {limit}, page = {page})</h1>
    <nav>
      <ul>
        <li><a href={route.$parent.$link()}>Go back</a></li>
        <li><a href={route.photo.$link({ photoId: '1' })}>Check photo 1</a></li>
        <li><a href={route.photo.$link({ photoId: '2' })}>Check photo 2</a></li>
        <li><a href={route.photo.$link({ photoId: '3' })}>Check photo 3</a></li>
      </ul>
    </nav>
  </div>
)