import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { BookingsQueue } from './pages/BookingsQueue';
import { BeauticiansRoster } from './pages/BeauticiansRoster';
import { AdminLoginModal } from './components/AdminLoginModal';
import { adminApi } from './api/adminApi';

export const App: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(!adminApi.isAuthenticated());

  useEffect(() => {
    const handleAuthRequired = () => {
      setIsLoginModalOpen(true);
    };

    window.addEventListener('up_admin_auth_required', handleAuthRequired);
    return () => {
      window.removeEventListener('up_admin_auth_required', handleAuthRequired);
    };
  }, []);

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar onOpenLogin={() => setIsLoginModalOpen(true)} />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/bookings" replace />} />
            <Route path="/bookings" element={<BookingsQueue onOpenLogin={() => setIsLoginModalOpen(true)} />} />
            <Route path="/beauticians" element={<BeauticiansRoster onOpenLogin={() => setIsLoginModalOpen(true)} />} />
            <Route path="*" element={<Navigate to="/bookings" replace />} />
          </Routes>
        </main>
        <AdminLoginModal
          isOpen={isLoginModalOpen}
          onClose={adminApi.isAuthenticated() ? () => setIsLoginModalOpen(false) : undefined}
          onSuccess={() => setIsLoginModalOpen(false)}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;
