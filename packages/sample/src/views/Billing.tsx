import { Link } from '@stack-spot/citron-navigator'
import { ViewPropsOf } from '../generated/navigation'

export const Billing = ({ route, params: { year } }: ViewPropsOf<'root.account.billing'>) => (
  <div>
    <h1>Billing ({year})</h1>
    <nav>
      <ul>
        <li><Link to={route.$parent}>Go back</Link></li>
      </ul>
    </nav>
  </div>
)