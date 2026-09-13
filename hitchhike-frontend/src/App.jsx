import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNav from "./components/BottomNav";
import PrivateRoute from './components/PrivateRoute';
import LiveRidePanel from './components/LiveRidePanel';
import FloatingChatButton from './components/FloatingChatButton';

// Import all pages
import Home from './pages/Home';
import BookRide from './pages/BookRide';
import OfferRide from './pages/OfferRide';

import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import MyRides from './pages/MyRides';
import Search from './pages/Search'; // <-- Yahan import kar liya Search page ko!
import Chat from './pages/Chat'; // Yahan import kar
function App() {
  return (
    <Router>
      <div className="min-h-screen pb-20">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes: Wrap these inside PrivateRoute */}
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/book" element={<PrivateRoute><BookRide /></PrivateRoute>} />
          <Route path="/offer" element={<PrivateRoute><OfferRide /></PrivateRoute>} />
        
          <Route path="/my-rides" element={<PrivateRoute><MyRides /></PrivateRoute>} />  
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/chat/:peerId" element={<Chat />} />          {/* 🔥 NAYA: Search Routes Added Here */}
          <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
       
        </Routes>
        
        <BottomNav />
        
        {/* 🔥 FLOATING CHAT BUTTON - Shows on all protected pages 🔥 */}
        <FloatingChatButton />
      </div>
    </Router>
  );
}

export default App;