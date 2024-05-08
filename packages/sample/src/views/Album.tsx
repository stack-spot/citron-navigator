import { Link } from '@stack-spot/citron-navigator'
import { ViewPropsOf } from '../generated/navigation'

export const Album = ({ route, params: { albumId, limit = 10, page = 1 } }: ViewPropsOf<'root.photoAlbums.album'>) => (
  <div>
    <h1>Album {albumId} (limit = {limit}, page = {page})</h1>
    <nav>
      <ul>
        <li><Link to={route.$parent}>Go back</Link></li>
        <li><Link to={route.photo} params={{ photoId: '1' }}>Check photo 1</Link></li>
        <li><Link to={route.photo} params={{ photoId: '2' }}>Check photo 2</Link></li>
        <li><Link to={route.photo} params={{ photoId: '3' }}>Check photo 3</Link></li>
      </ul>
    </nav>
  </div>
)