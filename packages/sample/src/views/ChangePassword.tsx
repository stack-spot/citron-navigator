import { ViewPropsOf } from '../generated/navigation'

export const ChangePassword = ({ route }: ViewPropsOf<'root.account.changePassword'>) => (
  <div>
    <h1>Change Password</h1>
    <nav>
      <ul>
        <li><a href={route.$parent.$link()}>Go back</a></li>
      </ul>
    </nav>
  </div>
)