import { Link } from '@stack-spot/citron-navigator'
import { ViewPropsOf } from '../generated/navigation'

export const Albums = ({ route }: ViewPropsOf<'root.photoAlbums'>) => (
  <div>
    <h1>Albums</h1>
    <nav>
      <ul>
        <li><Link to={route.$parent}>Go back</Link></li>
        <li><Link to={route.album} params={{ albumId: '1' }}>Album 1</Link></li>
        <li><Link to={route.album} params={{ albumId: '2', limit: 20, page: 5 }}>Album 2: page 5, 20 photos per page</Link></li>
        <li><Link to={route.album} params={{ albumId: '3' }}>Album 3</Link></li>
      </ul>
    </nav>
  </div>
)