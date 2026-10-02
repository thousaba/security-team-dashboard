import { useEffect, useState } from 'react'
import api from '../api'

const emptyPasswords = { current_password: '', password: '', password_confirmation: '' }

function Profile() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/profile')
      .then(response => {
        setProfile(response.data)
        setName(response.data.name)
      })
      .catch(error => console.log('HATA:', error))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = { name };
    if (passwords.password) Object.assign(payload, passwords);

    try {
      const response = await api.put('/profile', payload);
      setProfile(response.data);
      setPasswords(emptyPasswords);
      setSuccess('Profil güncellendi!');
    } catch (err) {
      setError(err.response?.data?.message || 'Güncelleme başarısız oldu!');
    }
  }

  if (!profile) return null;

  return (
    <div className='profile-page'>
      <form onSubmit={handleSubmit} className='profile-box'>
        <h2>Profil</h2>

        <input type='email' value={profile.email} disabled />

        <input
          type='text'
          placeholder='Ad Soyad'
          value={name}
          maxLength={64}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type='password'
          placeholder='Mevcut Şifre'
          value={passwords.current_password}
          onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
        />
        <input
          type='password'
          placeholder='Yeni Şifre'
          value={passwords.password}
          onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
        />
        <input
          type='password'
          placeholder='Yeni Şifre (Tekrar)'
          value={passwords.password_confirmation}
          onChange={(e) => setPasswords({ ...passwords, password_confirmation: e.target.value })}
        />

        {error && <p className='error-text'>{error}</p>}
        {success && <p>{success}</p>}

        <button type='submit'>Kaydet</button>
      </form>
    </div>
  )
}

export default Profile
