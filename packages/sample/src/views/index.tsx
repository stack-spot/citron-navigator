import { useState } from 'react'
import { useNavigationContext } from '../generated/navigation'
import { Account } from './Account'
import { Album } from './Album'
import { Albums } from './Albums'
import { Billing } from './Billing'
import { ChangePassword } from './ChangePassword'
import { Home } from './Home'
import { Photo } from './Photo'
import { Profile } from './Profile'

export const Page = () => {
  const [content, setContent] = useState<React.ReactElement>(<></>)
  
  useNavigationContext((context) => {
    context
      .when('root', props => setContent(<Home {...props} />))
      .when('root.account', props => setContent(<Account {...props} />))
      .when('root.account.profile', props => setContent(<Profile {...props} />))
      .when('root.account.changePassword', props => setContent(<ChangePassword {...props} />))
      .when('root.account.billing', props => setContent(<Billing {...props} />))
      .when('root.photoAlbums', props => setContent(<Albums {...props} />))
      .when('root.photoAlbums.album', props => setContent(<Album {...props} />))
      .when('root.photoAlbums.album.photo', props => setContent(<Photo {...props} />))
      .whenNotFound(() => setContent(<h1>404: Not Found</h1>))
  })

  return content
}
