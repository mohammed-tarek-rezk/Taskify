import React from 'react'
import { Link } from 'react-router-dom'

function Btn({link , styling , Icon , title}) {
  return (
    <Link to={link} className={`py-1 px-3 w-fit rounded-lg flex gap-1` + styling}><span>{Icon ? <Icon /> :""}</span> <span> {title} </span></Link>
  )
}

export default Btn