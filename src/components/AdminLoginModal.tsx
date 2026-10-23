import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, Zap, X } from 'lucide-react';
import { adminApi } from '../api/adminApi';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setError('Please provide both username/email and password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await adminApi.login(usernameOrEmail.trim(), password);
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setDevLoading(true);
    setError(null);
    try {
      await adminApi.devLogin();
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Dev authentication failed';
      setError(msg);
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay" style={styles.overlay}>
      <div className="admin-modal-box" style={{ ...styles.modalCard, maxWidth: '440px' }}>
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <div style={styles.iconCircle}>
              <Shield size={22} color="#DB2777" />
            </div>
            <div>
              <h3 style={styles.title}>Admin Authentication</h3>
              <p style={styles.subtitle}>Sign in to access Beauty Admin Operations</p>
            </div>
          </div>
          {onClose && (
            <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={18} color="#64748B" />
            </button>
          )}
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <AlertCircle size={16} color="#DC2626" style={{ marginRight: 8, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Admin Username or Email</label>
            <div style={styles.inputWrapper}>
              <User size={16} color="#94A3B8" style={styles.inputIcon} />
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="admin or admin@urbanpower.app"
                style={styles.input}
                autoFocus
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} color="#94A3B8" style={styles.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password (e.g. Admin@123)"
                style={styles.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || devLoading}
            style={{
              ...styles.submitBtn,
              opacity: loading || devLoading ? 0.7 : 1,
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>

        {import.meta.env.DEV && (
          <>
            <div style={styles.dividerRow}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>or local quick access</span>
              <div style={styles.dividerLine} />
            </div>

            <button
              type="button"
              onClick={handleDevLogin}
              disabled={loading || devLoading}
              style={{
                ...styles.devLoginBtn,
                opacity: loading || devLoading ? 0.7 : 1,
              }}
            >
              <Zap size={16} color="#059669" style={{ marginRight: 8 }} />
              {devLoading ? 'Generating Dev Token...' : '⚡ 1-Click Dev Sign-In (Local Dev)'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    padding: '28px',
    border: '1px solid #E2E8F0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconCircle: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    backgroundColor: '#FDF2F8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    margin: '2px 0 0 0',
    fontSize: '13px',
    color: '#64748B',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    color: '#B91C1C',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
  },
  input: {
    width: '100%',
    padding: '10px 12px 10px 36px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#0F172A',
  },
  submitBtn: {
    marginTop: '6px',
    backgroundColor: '#DB2777',
    color: '#ffffff',
    border: 'none',
    padding: '11px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    margin: '18px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    padding: '0 10px',
    fontSize: '12px',
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  devLoginBtn: {
    width: '100%',
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
    padding: '11px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
};
