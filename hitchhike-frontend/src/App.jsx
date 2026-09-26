import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import BottomNav from "./components/BottomNav";
import PrivateRoute from './components/PrivateRoute';

import FloatingChatButton from './components/FloatingChatButton';

// Import all pages
import Home from './pages/Home';
import BookRide from './pages/BookRide';
import OfferRide from './pages/OfferRide';

import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import MyRides from './pages/MyRides';
import Search from './pages/Search';
import Chat from './pages/Chat';

// Layout wrapper to conditionally show footer & chat
function AppLayout() {
  const location = useLocation();
  const token = localStorage.getItem('token');
  
  // Don't show footer & chat on login/register pages
  const hideNavAndChat = ['/login', '/register'].includes(location.pathname);
  const showNavAndChat = token && !hideNavAndChat;

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/book" element={<PrivateRoute><BookRide /></PrivateRoute>} />
        <Route path="/offer" element={<PrivateRoute><OfferRide /></PrivateRoute>} />
        <Route path="/my-rides" element={<PrivateRoute><MyRides /></PrivateRoute>} />  
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/chat/:peerId" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
      </Routes>
      
      {/* Only show BottomNav and FloatingChatButton when logged in and not on auth pages */}
      {showNavAndChat && (
        <>
          <BottomNav />
          <FloatingChatButton />
        </>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen pb-20">
        <AppLayout />
      </div>
    </Router>
  );
}

export default App;