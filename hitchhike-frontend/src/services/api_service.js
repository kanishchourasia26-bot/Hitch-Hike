import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Dhyan rakhna tumhara backend port yahi ho (5000 ya jo bhi tum use kar rahe ho)
});

// Ye interceptor har request se pehle automatically token add kar dega
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;