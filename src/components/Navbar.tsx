import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Calendar, Users, ShieldCheck, LogOut, KeyRound } from 'lucide-react';
import { adminApi } from '../api/adminApi';

interface NavbarProps {
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(adminApi.isAuthenticated());
  const [adminUser, setAdminUser] = useState(adminApi.getCurrentAdmin());

  useEffect(() => {
    const handleAuthChanged = () => {
      setIsAuthenticated(adminApi.isAuthenticated());
      setAdminUser(adminApi.getCurrentAdmin());
    };

    window.addEventListener('up_admin_auth_changed', handleAuthChanged);
    return () => {
      window.removeEventListener('up_admin_auth_changed', handleAuthChanged);
    };
  }, []);

  const handleLogout = () => {
    adminApi.logout();
    onOpenLogin();
  };

  return (
    <header className="admin-navbar" style={styles.header}>
      <div style={styles.brandRow}>
        <div style={styles.logoBadge}>
          <Sparkles size={20} color="#ffffff" />
        </div>
        <div>
          <h1 style={styles.brandTitle}>Urban Power Beauty</h1>
          <span style={styles.brandSubtitle}>Operations & Assignment Admin</span>
        </div>
      </div>

      <nav className="admin-navbar-nav" style={styles.nav}>
        <NavLink
          to="/bookings"
          style={({ isActive }) => ({
            ...styles.navLink,
            ...(isActive ? styles.navLinkActive : {}),
          })}
        >
          <Calendar size={18} style={{ marginRight: 8 }} />
          Appointments Queue
        </NavLink>

        <NavLink
          to="/beauticians"
          style={({ isActive }) => ({
            ...styles.navLink,
            ...(isActive ? styles.navLinkActive : {}),
          })}
        >
          <Users size={18} style={{ marginRight: 8 }} />
          Beauticians Roster
        </NavLink>
      </nav>

      <div style={styles.authArea}>
        {isAuthenticated ? (
          <div style={styles.authRow}>
            <div style={styles.adminBadge}>
              <ShieldCheck size={16} color="#15803D" style={{ marginRight: 6 }} />
              <span>Admin: {adminUser?.username || 'Verified'}</span>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout} title="Sign Out">
              <LogOut size={14} style={{ marginRight: 4 }} />
              Sign Out
            </button>
          </div>
        ) : (
          <button style={styles.loginBtn} onClick={onOpenLogin}>
            <KeyRound size={15} style={{ marginRight: 6 }} />
            Sign In as Admin
          </button>
        )}
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #E2E8F0',
    padding: '12px 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#DB2777',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 1.2,
  },
  brandSubtitle: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: '0.3px',
  },
  nav: {
    display: 'flex',
    gap: '8px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#64748B',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.15s ease',
  },
  navLinkActive: {
    backgroundColor: '#FDF2F8',
    color: '#BE185D',
  },
  authArea: {
    display: 'flex',
    alignItems: 'center',
  },
  authRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  adminBadge: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#15803D',
    border: '1px solid #BBF7D0',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  loginBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#DB2777',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '7px 14px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
};
