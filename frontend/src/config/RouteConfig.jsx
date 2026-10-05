import {Route, Routes, Navigate} from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home'
import Login from '../pages/Login';
import Notifications from '../pages/Notifications';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import Users from '../pages/Users';
import Chat from '../pages/Chat';

function RouteConfig () {
    return (
      <Routes>
        <Route path='/' element={<Navigate to='/home' replace />} />
        <Route path='/login' element={<Login />} />
        <Route element={<Layout />}>
          <Route path='/home' element={<Home />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/users' element={<Users />} />
          <Route path='/notifications' element={<Notifications />} />
          <Route path='/settings' element={<Settings />} />
          <Route path='/chat' element={<Chat />} />
        </Route>
      </Routes>
    )
}

export default RouteConfig;
