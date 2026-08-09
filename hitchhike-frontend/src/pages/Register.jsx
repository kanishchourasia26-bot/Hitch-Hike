import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api_service'; 
console.log("Register Page Loaded");

const Register = () => {
  // NAYE FIELDS ADD KIYE HAIN: age, gender, vehicleNumber
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    password: '', 
    role: 'passenger',
    age: '',
    gender: '',
    vehicleNumber: ''
  });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Backend ko poora data bheja jayega
      await api.post('/users/register', formData);
      alert('Registration Successful! Please login.');
      navigate('/login');
    } catch (error) {
      console.log("FULL ERROR OBJECT:", error);
      const message = error.response?.data?.message || error.response?.data?.error || "Registration failed!";
      alert("Error: " + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-gray-50 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Create Account</h1>
      <p className="text-gray-500 mb-8 text-sm">Join Hitchhike and start saving on your daily commutes.</p>
      
      <form onSubmit={handleRegister} className="space-y-4">
        
        <input type="text" placeholder="Full Name" required 
          className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500" 
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
        />
        
        <input type="tel" placeholder="Phone Number" required 
          className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500" 
          onChange={(e) => setFormData({...formData, phone: e.target.value})} 
        />
        
        {/* AGE & GENDER IN ONE ROW */}
        <div className="flex gap-4">
          <input type="number" placeholder="Age" required min="18" max="100"
            className="w-1/3 p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500" 
            onChange={(e) => setFormData({...formData, age: e.target.value})} 
          />
          <select required 
            className="w-2/3 p-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-orange-500"
            value={formData.gender}
            onChange={(e) => setFormData({...formData, gender: e.target.value})}>
            <option value="" disabled>Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <select className="w-full p-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-orange-500 font-bold text-gray-700" 
          value={formData.role}
          onChange={(e) => {
            setFormData({
              ...formData, 
              role: e.target.value,
              // Agar passenger wapas select kare, toh vehicle number clear kar do
              vehicleNumber: e.target.value === 'passenger' ? '' : formData.vehicleNumber
            });
          }}>
          <option value="passenger">Register as Passenger</option>
          <option value="rider">Register as Rider (Vehicle Owner)</option>
        </select>

        {/* SMART LOGIC: Sirf tabhi dikhega jab user Rider select karega */}
        {formData.role === 'rider' && (
          <input type="text" placeholder="Vehicle Number (e.g. MH01 AB 1234)" required 
            className="w-full p-4 rounded-xl border border-orange-300 bg-orange-50 focus:outline-none focus:border-orange-500 placeholder-orange-300" 
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})} 
          />
        )}

        <input type="password" placeholder="Create Password" required 
          className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500" 
          onChange={(e) => setFormData({...formData, password: e.target.value})} 
        />

        <button disabled={loading} className="w-full p-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors cursor-pointer mt-2 disabled:opacity-50">
          {loading ? 'Creating Account...' : 'REGISTER'}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-orange-500 font-bold hover:underline">Login here</Link>
        </p>

      </form>
    </div>
  );
};

export default Register;