import { Link } from '@stack-spot/citron-navigator'
import { ViewPropsOf } from '../generated/navigation'

export const ChangePassword = ({ route }: ViewPropsOf<'root.account.changePassword'>) => (
  <div>
    <h1>Change Password</h1>
    <nav>
      <ul>
        <li><Link to={route.$parent}>Go back</Link></li>
      </ul>
    </nav>
  </div>
)