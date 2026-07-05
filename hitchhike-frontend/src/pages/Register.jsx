import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api_service'; // Import check karo: tumhara file api.js hai na?
console.log("Register Page Loaded");

const Register = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', password: '', role: 'passenger' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/users/register', formData);
      alert('Registration Successful! Please login.');
      navigate('/login');
   // src/pages/Register.jsx - update this catch block
} catch (error) {
  // Ye line check karo, console mein poora error object print hoga
  console.log("FULL ERROR OBJECT:", error);
  
  // Alert mein detail dikhao
  const message = error.response?.data?.message || error.response?.data?.error || "Registration failed!";
  alert("Error: " + message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-gray-50">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Create Account</h1>
      
      <form onSubmit={handleRegister} className="space-y-4">
        <input type="text" placeholder="Full Name" required className="w-full p-4 rounded-xl border border-gray-200" 
          onChange={(e) => setFormData({...formData, name: e.target.value})} />
        
        <input type="text" placeholder="Phone Number" required className="w-full p-4 rounded-xl border border-gray-200" 
          onChange={(e) => setFormData({...formData, phone: e.target.value})} />
        
        <input type="password" placeholder="Password" required className="w-full p-4 rounded-xl border border-gray-200" 
          onChange={(e) => setFormData({...formData, password: e.target.value})} />

        <select className="w-full p-4 rounded-xl border border-gray-200 bg-white" 
          value={formData.role}
          onChange={(e) => setFormData({...formData, role: e.target.value})}>
          <option value="passenger">Register as Passenger</option>
          <option value="rider">Register as Rider</option>
        </select>

        <button disabled={loading} className="w-full p-4 bg-orange-500 text-white font-bold rounded-xl">
          {loading ? 'Registering...' : 'REGISTER'}
        </button>
      </form>
    </div>
  );
};

export default Register;