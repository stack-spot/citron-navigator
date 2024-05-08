import { Link } from '@stack-spot/citron-navigator'
import { ViewPropsOf } from '../generated/navigation'

export const Account = ({ route }: ViewPropsOf<'root.account'>) => (
  <div>
    <h1>Account</h1>
    <nav>
      <ul>
        <li><Link to={route.$parent}>Go back</Link></li>
        <li><Link to={route.billing} params={{ year: 2024 }}>Billing</Link></li>
        <li><Link to={route.changePassword}>Change Password</Link></li>
        <li><Link to={route.profile}>Profile</Link></li>
      </ul>
    </nav>
  </div>
)