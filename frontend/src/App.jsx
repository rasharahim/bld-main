import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/dashboard/Dashboard';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ReceiverForm from './pages/forms/receiver/ReceiverForm';
import ReceiverThanks from './pages/forms/receiver/ReceiverThanks';
import ReceiverStatus from './pages/status/ReceiverStatus';
import DonorForm from './pages/forms/donor/DonorForm';
import DonorThanks from './pages/forms/donor/DonorThanks';
import DonorStatus from './pages/status/DonorStatus';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Profile Routes */}
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />

            {/* Receiver Routes */}
            <Route path="/receiver/request" element={
              <PrivateRoute>
                <ReceiverForm />
              </PrivateRoute>
            } />
            <Route path="/receiver/thanks" element={
              <PrivateRoute>
                <ReceiverThanks />
              </PrivateRoute>
            } />
            <Route path="/receiver/status" element={
              <PrivateRoute>
                <ReceiverStatus />
              </PrivateRoute>
            } />
            <Route path="/receiver/status/:requestId" element={
              <PrivateRoute>
                <ReceiverStatus />
              </PrivateRoute>
            } />

            {/* Donor Routes */}
            <Route path="/donor/register" element={
              <PrivateRoute>
                <DonorForm />
              </PrivateRoute>
            } />
            <Route path="/donor/thanks" element={
              <PrivateRoute>
                <DonorThanks />
              </PrivateRoute>
            } />
            <Route path="/donor/status" element={
              <PrivateRoute>
                <DonorStatus />
              </PrivateRoute>
            } />
            <Route path="/donor/status/:donorId" element={
              <PrivateRoute>
                <DonorStatus />
              </PrivateRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <PrivateRoute requireAdmin={true}>
                <AdminDashboard />
              </PrivateRoute>
            } />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;