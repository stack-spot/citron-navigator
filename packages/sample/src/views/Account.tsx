import { ViewPropsOf } from '../generated/navigation'

export const Account = ({ route }: ViewPropsOf<'root.account'>) => (
  <div>
    <h1>Account</h1>
    <nav>
      <ul>
        <li><a href={route.$parent.$link()}>Go back</a></li>
        <li><a href={route.billing.$link({ year: 2024 })}>Billing</a></li>
        <li><a href={route.changePassword.$link()}>Change Password</a></li>
        <li><a href={route.profile.$link()}>Profile</a></li>
      </ul>
    </nav>
  </div>
)