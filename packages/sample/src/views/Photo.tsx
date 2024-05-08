import { Link } from '@stack-spot/citron-navigator'
import { ViewPropsOf } from '../generated/navigation'

export const Photo = ({ route, params: { albumId, photoId } }: ViewPropsOf<'root.photoAlbums.album.photo'>) => (
  <div>
    <h1>Album {albumId} - Photo {photoId}</h1>
    <nav>
      <ul>
        <li><Link to={route.$parent}>Go back</Link></li>
      </ul>
    </nav>
  </div>
)