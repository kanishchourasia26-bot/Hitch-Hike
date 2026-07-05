import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api_service';

const Login = () => {
  // Yahan se isLogin state hata di hai, ye ab sirf Login page hai
  const [formData, setFormData] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Ab ye sirf login API ko call karega
      const response = await api.post('/users/login', formData);
      
      // User data aur Token dono save kar lo
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.data.token); // Token save karna zaroori hai
      
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-gray-50">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-orange-500">Hitchhike</h1>
        <p className="text-gray-500 mt-2">Welcome back!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="tel"
          placeholder="Mobile Number"
          className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
        
        <button 
          disabled={loading}
          className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition"
        >
          {loading ? 'Processing...' : 'LOGIN'}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-500">
        Don't have an account?
        {/* NAYA LOGIC: Ye ab tumhare asli /register page par bhej dega */}
        <Link to="/register" className="text-orange-500 font-bold ml-1 hover:underline">
          Register here
        </Link>
      </p>
    </div>
  );
};

export default Login;