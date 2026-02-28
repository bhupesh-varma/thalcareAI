import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Emergency from './pages/Emergency';
import './App.css';

import React from 'react';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  const auth = useAuth();

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <header className="bg-white shadow">
          <nav className="max-w-3xl mx-auto p-4 flex justify-between items-center">
            <Link to="/" className="font-bold text-red-600 text-xl">
              ThalCare
            </Link>
            {auth.token && (
              <button
                onClick={auth.logout}
                className="btn-outline text-sm"
              >
                Logout
              </button>
            )}
          </nav>
        </header>
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

const AppWrapper = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWrapper;
