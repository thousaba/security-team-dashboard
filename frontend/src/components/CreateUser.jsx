import {useEffect, useState} from 'react';
import api from '../api';

function CreateUser({roleOptions, onCreated, onClose}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');    
  const [formData, setFormData] = useState({ name: '', email: '', password: '', roles: [] });


  useEffect(() => {
    const onKeyDown = (e) => {
        if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/users', formData)
      onCreated(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Ekleme başarısız oldu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='modal-backdrop' onClick={onClose}>
      <div className='modal' onClick={(e)=> e.stopPropagation()}>    
        <form onSubmit={handleSubmit} className='user-form'>
        <h3>Yeni Kullanıcı Ekle</h3>

        <input
          type='text'
          placeholder='Ad Soyad'
          value={formData.name}
          maxLength={64}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          type='email'
          placeholder='Mail Adresi'
          value={formData.email}
          maxLength={255}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <input
          type='password'
          placeholder='Şifre Giriniz...'
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <details className='role-dropdown'>
          <summary>
            {formData.roles.length > 0
              ? `${formData.roles.length} rol seçili`
              : 'Rol seçiniz'}
          </summary>
          <div className='role-options'>
            {roleOptions.map(r => (
              <label key={r.value}>
                <input
                  type="checkbox"
                  checked={formData.roles.includes(r.value)}
                  onChange={() => setFormData({
                    ...formData,
                    roles: formData.roles.includes(r.value)
                      ? formData.roles.filter(x => x !== r.value)
                      : [...formData.roles, r.value],
                  })}
                />
                {r.label}
              </label>
            ))}
          </div>
        </details>

        {error && <p>{error}</p>}
        <button className='submit' type='submit' disabled={loading}>
          {loading ? 'Ekleniyor...' : 'Kaydet'}
        </button>
      </form>
      </div>
    </div>
  )
}

export default CreateUser