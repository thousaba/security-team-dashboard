import axios from 'axios'

const api = axios.create({ 
    baseURL: 'http://localhost:8000/api', 
    withCredentials: true,
    withXSRFToken: true
 })


export default api
