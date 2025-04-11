import React from 'react'
import Btn from '../components/Btn'
import { MAIN_LINKS } from '../utils/constants'

function MainPage() {
  return (
    <div className='p-5'>
      <Btn link={MAIN_LINKS.dashboard} styling={" bg-red-500"} title={"Dashboard"}  />
    </div>
  )
}

export default MainPage