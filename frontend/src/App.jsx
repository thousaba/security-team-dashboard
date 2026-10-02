import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Users from './pages/Users'
import Login from './pages/Login'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import LineSidebar from './components/LineSidebar'
import api from './api'
import {useNavigate} from 'react-router-dom'
import { FaMoon } from "react-icons/fa";
import { GoSun } from "react-icons/go";
import { IoMdExit } from "react-icons/io";
import {useState, useEffect} from 'react'

const paths = ['/home', '/profile', '/users', '/notifications', '/settings']

function App() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  const handleLogout = async () => {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('token')
      navigate('/login')
    }
  }

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
  <>
    {pathname !== '/login' && (
      <div style={{ position: 'fixed', top: 24, left: 0 }}>
        <LineSidebar
          textColor="var(--text)"
          markerColor="var(--border)"
          onItemClick={(index)=> navigate(paths[index])}
        />
      </div>
    )}
    {pathname !== '/login' && (
      <button className='quit' type='button' onClick={handleLogout}>
        <IoMdExit />
      </button>
    )}
    {pathname !== '/login' && (
      <button className='theme-toggle' type='button' onClick={handleThemeToggle}>
        {theme === 'dark' ? <GoSun /> : <FaMoon />}
      </button>
    )}
    <Routes>
      <Route path='/' element={<Navigate to='/home' replace />} />
      <Route path='/login' element={<Login />} />
      <Route path='/home' element={<Home />} />
      <Route path='/profile' element={<Profile />} />
      <Route path='/users' element={<Users />} />
      <Route path='/notifications' element={<Notifications />} />
      <Route path='/settings' element={<Settings />} />
    </Routes>
  </>
  )
}


export default App
