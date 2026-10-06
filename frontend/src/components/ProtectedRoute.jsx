import { Navigate, Outlet } from 'react-router-dom';
import api from '../api';
import React, { useEffect, useState } from 'react'

function ProtectedRoute() {
    const [status, setStatus] = useState('loading');


    useEffect(() =>{
        api.get('/profile')
        .then(() => setStatus('authed'))
        .catch(() => setStatus('guest'))
    }, [])

    if (status === 'loading') return null
    if (status === 'guest') return <Navigate to='/login' replace />

    return (
    <Outlet />
    )

}

export default ProtectedRoute