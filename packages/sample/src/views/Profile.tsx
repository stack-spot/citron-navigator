import { Link } from '@stack-spot/citron-navigator'
import { ViewPropsOf } from '../generated/navigation'

export const Profile = ({ route }: ViewPropsOf<'root.account.profile'>) => (
  <div>
    <h1>Profile</h1>
    <nav>
      <ul>
        <li><Link to={route.$parent}>Go back</Link></li>
      </ul>
    </nav>
  </div>
)