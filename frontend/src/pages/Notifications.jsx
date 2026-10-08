import React from 'react'
import { useEffect, useState } from 'react'
import api from '../api';
import { useOutletContext } from 'react-router-dom';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const { refreshNotify } = useOutletContext()

  useEffect(() => {
    api.get('/notifications')
      .then(response => setNotifications(response.data))
      .catch(error => console.log('HATA:', error))
  }, [])

  const handleRead = async (id) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? response.data : n));
      refreshNotify()
    } catch (err) {
      console.log('HATA:', err.response?.data?.message || 'Okuma başarısız oldu!');
    }
  };

  
  
  
  return (
    <div className='notification-list'>
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={notification.read_at ? '' : 'unread'}
          onClick={() => handleRead(notification.id)}
        >
          <strong>{notification.title}</strong>
          <p>{notification.message}</p>
          <small>{new Date(notification.created_at).toLocaleString('tr-TR')}</small>
        </div>
      ))}
    </div>
  )
}

export default Notifications