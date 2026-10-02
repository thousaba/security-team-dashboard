import React from 'react'
import { GiPlagueDoctorProfile } from "react-icons/gi";
import { PiUsersFourFill } from "react-icons/pi";
import { MdNotificationsActive } from "react-icons/md";
import { IoSettingsSharp } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-box" onClick={() => navigate('/profile')}>
        <GiPlagueDoctorProfile color="white" size={100} />
      </div>
      <div className="home-box" onClick={() => navigate('/users')}>
        <PiUsersFourFill color="white" size={100} />
      </div>
      <div className="home-box" onClick={() => navigate('/notifications')}>
        <MdNotificationsActive color="white" size={100} />
      </div>
      <div className="home-box" onClick={() => navigate('/settings')}>
        <IoSettingsSharp color="white" size={100} />
      </div>
    </div>
  )
}

export default Home