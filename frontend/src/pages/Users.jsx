import { useEffect, useState } from 'react'
import api from '../api';
import '../App.css'

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', roles: [] });
  const [options, setOptions] = useState({ roles: [] });
  const [editingUser, setEditingUser] = useState(null);
  const [editRoles, setEditRoles] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    api.get('/options')
      .then(response => setOptions(response.data))
      .catch(error => console.log('HATA:', error))
  }, [])

  useEffect(() => {
    api.get('/users')
      .then(response => {
        console.log('USERS RESPONSE:', response)
        setUsers(response.data)
      })
      .catch(error => console.log('HATA:', error))
  }, [])

  useEffect(() => {
    api.get('/stats')
      .then(response => setStats(response.data))
      .catch(error => console.log('HATA:', error))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/users', formData)
      setUsers(prev => [...prev, response.data]);
      setFormData({ name: '', email: '', password: '', roles: [] });
    } catch (err) {
      setError(err.response?.data?.message || 'Ekleme başarısız oldu!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`${user.name} silinsin mi?`)) return;

    try {
      await api.delete(`/users/${user.id}`)
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Silme başarısız oldu!');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user)
    setEditRoles(user.roles.map(r => r.value))
  }

  const handleUpdate = async () => {
    try {
      const response = await api.put(`/users/${editingUser.id}`, { roles: editRoles })
      setUsers(prev => prev.map(u => u.id === editingUser.id ? response.data : u))
      setEditingUser(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Güncelleme başarısız oldu!')
    }
  }

  const visibleUsers = selectedRole
    ? users.filter(u => u.roles.some(r => r.value === selectedRole))
    : users;

  return (
    <div>
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
            {options.roles.map(r => (
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

      {editingUser && (
        <div className='edit-box'>
          <h3>{editingUser.name} rollerini düzenle</h3>

          <div className='role-options'>
            {options.roles.map(r => (
              <label key={r.value}>
                <input
                  type='checkbox'
                  checked={editRoles.includes(r.value)}
                  onChange={() => setEditRoles(
                    editRoles.includes(r.value)
                      ? editRoles.filter(x => x !== r.value)
                      : [...editRoles, r.value]
                  )}
                />
                {r.label}
              </label>
            ))}
          </div>

          <div className='form-actions'>
            <button type='button' onClick={handleUpdate}>Kaydet</button>
            <button type='button' onClick={() => setEditingUser(null)}>İptal</button>
          </div>
        </div>
      )}

      <ul className='user-list'>
        <h3>Kullanıcı Listesi</h3>
        {visibleUsers.map(user => (
          <li key={user.id}>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
            <span>{user.department?.label}</span>
            <button className='delete' type='button' onClick={() => handleDelete(user)}>Sil</button>
            <button className='delete' type='button' onClick={() => handleEdit(user)}>Düzenle</button>
          </li>
        ))}
      </ul>

      {stats && (
        <div className='stats'>
          <div className='stat-card'
            onClick={() => setSelectedRole(null)}>
            <strong>Toplam Kullanıcı: {stats.totalUsers}</strong>
          </div>
          {stats.byRole.map(r => (
            <div
              className={`stat-card${selectedRole === r.value ? ' active' : ''}`}
              key={r.value}
              onClick={() => setSelectedRole(selectedRole === r.value ? null : r.value)}
            >
              <strong>{r.count}</strong>
              <span>{r.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Users
