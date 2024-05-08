import { Link } from '@stack-spot/citron-navigator'
import { ViewPropsOf } from '../generated/navigation'

export const Home = ({ route }: ViewPropsOf<'root'>) => (
  <div>
    <h1>Home</h1>
    <nav>
      <ul>
        <li><Link to={route.account}>Account</Link></li>
        <li><Link to={route.photoAlbums}>Albums</Link></li>
      </ul>
    </nav>
  </div>
)