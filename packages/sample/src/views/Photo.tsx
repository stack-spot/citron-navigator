import { ViewPropsOf } from '../generated/navigation'

export const Photo = ({ route, params: { albumId, photoId } }: ViewPropsOf<'root.photoAlbums.album.photo'>) => (
  <div>
    <h1>Album {albumId} - Photo {photoId}</h1>
    <nav>
      <ul>
        <li><a href={route.$parent.$link()}>Go back</a></li>
      </ul>
    </nav>
  </div>
)