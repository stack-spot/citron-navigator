import { ViewPropsOf } from '../generated/navigation'

export const Billing = ({ route, params: { year } }: ViewPropsOf<'root.account.billing'>) => (
  <div>
    <h1>Billing ({year})</h1>
    <nav>
      <ul>
        <li><a href={route.$parent.$link()}>Go back</a></li>
      </ul>
    </nav>
  </div>
)