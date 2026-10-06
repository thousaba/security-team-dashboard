import { useState } from "react"
import { useNavigate } from "react-router-dom";
import api from '../api';

const Login = () => {

  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' })
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('')

    try {
      await api.get('http://localhost:8000/sanctum/csrf-cookie')
      await api.post('/login', formData)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Giriş başarısız oldu!')
    }
  }
  
  return (
    <div className='login-page'>
      <div className='login-box'>
        <h2>Giriş Yap</h2>
        <input
          type='email'
          value={formData.email}
          placeholder='E Posta'
          onChange={(e)=> setFormData({...formData, email: e.target.value})}
          maxLength={64}
        />
        <input
          type='password'
          value={formData.password}
          placeholder='Şifre Giriniz'
          onChange={(e)=> setFormData({...formData, password: e.target.value})}
          maxLength={74}
        />
        {error && <p className="error-text">{error}</p>}
        <button
          type='submit'
          onClick={handleLogin}
        >
          Giriş
        </button>
      </div>
    </div>
  )
}

export default Login