import { ViewPropsOf } from '../generated/navigation'

export const Home = ({ route }: ViewPropsOf<'root'>) => (
  <div>
    <h1>Home</h1>
    <nav>
      <ul>
        <li><a href={route.account.$link()}>Account</a></li>
        <li><a href={route.photoAlbums.$link()}>Albums</a></li>
      </ul>
    </nav>
  </div>
)