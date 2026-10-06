import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FaMoon } from "react-icons/fa";
import { GoSun } from "react-icons/go";
import { IoMdExit } from "react-icons/io";
import LineSidebar from './LineSidebar'
import api from '../api'
import useTheme from '../hooks/useTheme'
import { FaHome } from "react-icons/fa";
import { GiPlagueDoctorProfile } from "react-icons/gi";
import { PiUsersFourFill } from "react-icons/pi";
import { HiOutlineChatAlt } from "react-icons/hi";
import { MdNotificationsActive } from "react-icons/md";
import { IoSettingsSharp } from "react-icons/io5";
import { useEffect, useRef, useState } from 'react';
import createEcho from '../echo';



const paths = ['/home', '/profile', '/users', '/chat', '/notifications', '/settings']
const icons = [<FaHome />, 
               <GiPlagueDoctorProfile />, 
               <PiUsersFourFill />, 
               <HiOutlineChatAlt />,
               <MdNotificationsActive />,
               <IoSettingsSharp /> ]

function Layout() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { pathname } = useLocation()
  const [unread, setUnread] = useState(0)
  const [echo, setEcho] = useState(null)
  const pathRef = useRef(pathname)
  pathRef.current = pathname

  const fetchUnread = () =>
    api.get('/chat/unread').then(r => setUnread(r.data.count))


  useEffect(()=> {
    const e = createEcho()
    setEcho(e)
    fetchUnread()

    e.private('chat').listen('MessageSent', () => {
      if (pathRef.current !== '/chat') fetchUnread()
    })
    
    return () => e.disconnect()
  }, [])

  useEffect(() => {
    if (pathname !== '/chat') return
    api.post('/chat/read')
    setUnread(0)
    return() => {api.post('/chat/read')}
  }, [pathname])

  const handleLogout = async () => {
    try {
      await api.post('/logout')
    } finally {
      navigate('/login')
    }
  }

  return (
    <>
      <div style={{ position: 'fixed', top: 24, left: 0 }}>
        <LineSidebar 
          badges={[0, 0, 0, unread, 0, 0]}
          fontSize={1.5}
          icons={icons}
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
      <Outlet context={{echo}} />
    </>
  )
}

export default Layout
