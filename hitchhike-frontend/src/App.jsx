import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNav from "./components/BottomNav";
import PrivateRoute from './components/PrivateRoute';

// Import all pages
import Home from './pages/Home';
import BookRide from './pages/BookRide';
import OfferRide from './pages/OfferRide';
import DailyCommute from './pages/DailyCommute';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import MyRides from './pages/MyRides';

// Inside your Router/Routes:

    

function App() {
  return (
    <Router>
      <div className="min-h-screen pb-20">
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes: Wrap these inside PrivateRoute */}
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/book" element={<PrivateRoute><BookRide /></PrivateRoute>} />
          <Route path="/offer" element={<PrivateRoute><OfferRide /></PrivateRoute>} />
          <Route path="/commute" element={<PrivateRoute><DailyCommute /></PrivateRoute>} />
         <Route path="/register" element={<Register />} />
         <Route path="/my-rides" element={<MyRides />} />  
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        </Routes>
        
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;