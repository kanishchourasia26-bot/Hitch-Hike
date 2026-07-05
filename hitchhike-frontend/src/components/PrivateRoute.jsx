import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  // Check karo ki localStorage mein 'user' hai ya nahi
  const user = localStorage.getItem('user');

  // Agar user mil gaya, toh page dikhao, nahi toh Login par bhejo
  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;