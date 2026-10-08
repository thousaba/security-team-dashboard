import { useEffect, useState } from 'react'
import api from '../api';
import '../App.css'
import CreateUser from '../components/CreateUser';

function Users() {
  const [users, setUsers] = useState([]);
  const [options, setOptions] = useState({ roles: [] });
  const [editingUser, setEditingUser] = useState(null);
  const [editRoles, setEditRoles] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('')


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
    <div className='users-page'>
      {showAdd && (
        <CreateUser
          roleOptions={options.roles}
          onCreated={(user) => setUsers(prev => [...prev, user])}
          onClose={() => setShowAdd(false)}
        />
      )}

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

      {stats && (
        <div className='stats'>
          <div className='stat-card'
            onClick={() => setSelectedRole(null)}>
            <strong>{stats.totalUsers}</strong><span>Toplam Kullanıcı</span>
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

      <div className='list-header'>
        <h3>Kullanıcı Listesi</h3>
        <button className='add-user' onClick={() => setShowAdd(true)}>
          Kullanıcı Ekle
        </button>
      </div>

      <ul className='user-list'>
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
    </div>
  )
}

export default Users
