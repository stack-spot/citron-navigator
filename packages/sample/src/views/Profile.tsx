import { ViewPropsOf } from '../generated/navigation'

export const Profile = ({ route }: ViewPropsOf<'root.account.profile'>) => (
  <div>
    <h1>Profile</h1>
    <nav>
      <ul>
        <li><a href={route.$parent.$link()}>Go back</a></li>
      </ul>
    </nav>
  </div>
)