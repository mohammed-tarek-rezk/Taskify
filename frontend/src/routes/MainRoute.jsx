import React from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'
import { MAIN_LINKS } from '../utils/constants'
import { Dashboard, Login, MainPage, Profile, Project, Projects, SignUp, Task, Tasks } from '../pages'


function MainRoute() {
  return (
    <Routes>
      <Route  path={MAIN_LINKS.home}  element={<MainPage />}/>
      <Route  path={MAIN_LINKS.login}  element={<Login />}/>
      <Route  path={MAIN_LINKS.signUp}  element={<SignUp />}/>
      <Route  path={MAIN_LINKS.tasks}  element={<Outlet />}>
        <Route path='' element={<Tasks />}/>
        <Route path=':id' element={<Task />}/>
      </Route>
      <Route  path={MAIN_LINKS.projects}  element={<Outlet />}>
        <Route path='' element={<Projects />}/>
        <Route path=':id' element={<Project />}/>
      </Route>
      <Route  path={MAIN_LINKS.profile}  element={<Profile />}/>
      <Route  path={MAIN_LINKS.dashboard}  element={<Dashboard />}/>

    </Routes>

  )
}

export default MainRoute