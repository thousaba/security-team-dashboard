import { Outlet, useNavigate } from 'react-router-dom'
import { FaMoon } from "react-icons/fa";
import { GoSun } from "react-icons/go";
import { IoMdExit } from "react-icons/io";
import LineSidebar from './LineSidebar'
import api from '../api'
import useTheme from '../hooks/useTheme'

const paths = ['/home', '/profile', '/users', '/chat', '/notifications', '/settings']

function Layout() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('token')
      navigate('/login')
    }
  }

  return (
    <>
      <div style={{ position: 'fixed', top: 24, left: 0 }}>
        <LineSidebar
          textColor="var(--text)"
          markerColor="var(--border)"
          onItemClick={(index) => navigate(paths[index])}
        />
      </div>
      <button className='quit' type='button' onClick={handleLogout}>
        <IoMdExit />
      </button>
      <button className='theme-toggle' type='button' onClick={toggleTheme}>
        {theme === 'dark' ? <GoSun /> : <FaMoon />}
      </button>
      <Outlet />
    </>
  )
}

export default Layout
