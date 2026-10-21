import React, { useEffect, useState } from 'react';
import {
  UserPlus,
  Search,
  RefreshCw,
  X,
  Star,
  Edit3,
  KeyRound,
  Power,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shuffle,
  Phone,
  Mail,
  Copy,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { Beautician } from '../types/beauty';

const ALL_CATEGORIES = [
  'Waxing',
  'Facial & Cleanup',
  'Manicure & Pedicure',
  'Hair Care & Styling',
  'Bleach & De-Tan',
  'Threading',
  'Bridal & Party Makeup',
];

interface BeauticiansRosterProps {
  onOpenLogin?: () => void;
}

export const BeauticiansRoster: React.FC<BeauticiansRosterProps> = ({ onOpenLogin }) => {
  const [beauticians, setBeauticians] = useState<Beautician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive' | 'suspended'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Create Beautician State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createCode, setCreateCode] = useState('');
  const [createName, setCreateName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createMaxDaily, setCreateMaxDaily] = useState(5);
  const [createCategories, setCreateCategories] = useState<string[]>(['Waxing', 'Facial & Cleanup']);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // 2. Edit Beautician Profile State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBeautician, setEditingBeautician] = useState<Beautician | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editMaxDaily, setEditMaxDaily] = useState(5);
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [editIsAvailable, setEditIsAvailable] = useState(true);
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // 3. Reset Password State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<Beautician | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(true);
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchRoster = async () => {
    if (!adminApi.isAuthenticated()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await adminApi.getBeauticians({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });
      setBeauticians(data);
    } catch (err: any) {
      console.error('Failed to load roster:', err);
      if (err.response?.status === 401) {
        onOpenLogin?.();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();

    const handleAuthChanged = () => {
      fetchRoster();
    };

    window.addEventListener('up_admin_auth_changed', handleAuthChanged);
    return () => {
      window.removeEventListener('up_admin_auth_changed', handleAuthChanged);
    };
  }, [statusFilter]);

  // Create Beautician Handler
  const handleCreateBeautician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminApi.isAuthenticated()) {
      setCreateError('Admin authentication required. Please sign in as an admin.');
      onOpenLogin?.();
      return;
    }

    if (!createCode.trim() || !createName.trim() || !createPhone.trim() || !createPassword.trim()) {
      setCreateError('Please fill all required fields');
      return;
    }

    setCreateSaving(true);
    setCreateError(null);
    try {
      await adminApi.createBeautician({
        beauticianCode: createCode.trim(),
        fullName: createName.trim(),
        phone: createPhone.trim(),
        email: createEmail.trim() || undefined,
        password: createPassword.trim(),
        maxDailyBookings: Number(createMaxDaily),
        categories: createCategories,
      });

      setCreateModalOpen(false);
      setCreateCode('');
      setCreateName('');
      setCreatePhone('');
      setCreateEmail('');
      setCreatePassword('');
      fetchRoster();
      showToast('New beautician onboarded successfully!');
    } catch (err: any) {
      setCreateError(err.response?.data?.error?.message || err.message || 'Creation failed');
      if (err.response?.status === 401) {
        onOpenLogin?.();
      }
    } finally {
      setCreateSaving(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (b: Beautician) => {
    setEditingBeautician(b);
    setEditCode(b.beauticianCode);
    setEditName(b.fullName);
    setEditPhone(b.phone);
    setEditEmail(b.email || '');
    setEditPassword('');
    setEditMaxDaily(b.maxDailyBookings);
    setEditStatus(b.accountStatus as 'active' | 'inactive' | 'suspended');
    setEditIsAvailable(b.isAvailable);
    setEditCategories([...b.categories]);
    setEditError(null);
    setEditModalOpen(true);
  };

  // Submit Edit Profile
  const handleUpdateBeautician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBeautician) return;

    if (!editCode.trim() || !editName.trim() || !editPhone.trim()) {
      setEditError('Beautician Code, Full Name and Mobile Phone are required.');
      return;
    }

    if (editPassword.trim() && editPassword.trim().length < 6) {
      setEditError('New password must be at least 6 characters long.');
      return;
    }

    setEditSaving(true);
    setEditError(null);
    try {
      await adminApi.updateBeautician(editingBeautician.id, {
        beauticianCode: editCode.trim(),
        fullName: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || null,
        password: editPassword.trim() || undefined,
        accountStatus: editStatus,
        isAvailable: editIsAvailable,
        maxDailyBookings: Number(editMaxDaily),
        categories: editCategories,
      });

      setEditModalOpen(false);
      setEditingBeautician(null);
      fetchRoster();
      showToast('Beautician details updated successfully!');
    } catch (err: any) {
      setEditError(err.response?.data?.error?.message || err.message || 'Update failed');
    } finally {
      setEditSaving(false);
    }
  };

  // Open Reset Password Modal
  const handleOpenResetPasswordModal = (b: Beautician) => {
    setResetTarget(b);
    setNewPassword(generateRandomPassword());
    setResetError(null);
    setCopiedNotice(false);
    setResetModalOpen(true);
  };

  // Generate cryptographically secure random password
  const generateRandomPassword = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghjkmnpqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '@#$%&*';
    const allChars = uppercase + lowercase + numbers + symbols;

    const getRandomChar = (charset: string) => {
      const buffer = new Uint32Array(1);
      window.crypto.getRandomValues(buffer);
      return charset.charAt(buffer[0] % charset.length);
    };

    const pwdChars = [
      getRandomChar(uppercase),
      getRandomChar(lowercase),
      getRandomChar(numbers),
      getRandomChar(symbols),
    ];

    for (let i = 0; i < 6; i++) {
      pwdChars.push(getRandomChar(allChars));
    }

    // Fisher-Yates shuffle with Web Crypto
    for (let i = pwdChars.length - 1; i > 0; i--) {
      const buffer = new Uint32Array(1);
      window.crypto.getRandomValues(buffer);
      const j = buffer[0] % (i + 1);
      [pwdChars[i], pwdChars[j]] = [pwdChars[j], pwdChars[i]];
    }

    return 'UP@' + pwdChars.join('');
  };

  // Submit Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;

    if (!newPassword.trim() || newPassword.trim().length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    setResetSaving(true);
    setResetError(null);
    try {
      const res = await adminApi.resetBeauticianPassword(resetTarget.id, newPassword.trim());
      setResetModalOpen(false);
      setResetTarget(null);
      showToast(res.message || 'Password reset successfully!');
    } catch (err: any) {
      setResetError(err.response?.data?.error?.message || err.message || 'Password reset failed');
    } finally {
      setResetSaving(false);
    }
  };

  // Copy password to clipboard
  const handleCopyPassword = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2000);
    }
  };

  // Quick Status Toggle
  const handleToggleStatus = async (b: Beautician) => {
    const nextStatus = b.accountStatus === 'active' ? 'inactive' : 'active';
    try {
      await adminApi.updateBeautician(b.id, { accountStatus: nextStatus });
      fetchRoster();
      showToast(`Beautician ${b.fullName} status set to ${nextStatus.toUpperCase()}`);
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const toggleCategoryInList = (
    cat: string,
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(currentList.includes(cat) ? currentList.filter((c) => c !== cat) : [...currentList, cat]);
  };

  return (
    <div className="admin-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={styles.toastBanner}>
          <CheckCircle2 size={18} color="#15803D" style={{ marginRight: 8, flexShrink: 0 }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Row */}
      <div className="admin-header-row">
        <div className="admin-header-title-group">
          <h2 className="admin-page-title">Beauticians Professional Roster</h2>
          <p className="admin-page-subtitle">
            Manage verified salon technicians, edit profiles, reset credentials, and monitor daily workload capacity.
          </p>
        </div>

        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-outline" onClick={fetchRoster}>
            <RefreshCw size={15} />
            Refresh
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => setCreateModalOpen(true)}>
            <UserPlus size={16} />
            Onboard New Beautician
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search-box">
          <Search size={16} color="#94A3B8" style={{ marginRight: 8, flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by beautician name, code or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRoster()}
            className="admin-search-input"
          />
        </div>

        <div style={styles.filterTabs}>
          {(['ALL', 'active', 'inactive', 'suspended'] as const).map((st) => (
            <button
              key={st}
              style={{
                ...styles.filterTabBtn,
                ...(statusFilter === st ? styles.filterTabBtnActive : {}),
              }}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'ALL' ? 'All Partners' : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="admin-table-card">
        {loading ? (
          <div style={styles.loadingBox}>
            <RefreshCw size={24} className="spinning" style={{ marginBottom: 10, color: '#7C3AED' }} />
            <div>Loading beauticians roster...</div>
          </div>
        ) : beauticians.length === 0 ? (
          <div style={styles.emptyBox}>No beauticians found in roster.</div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW */}
            <div className="admin-table-scroll desktop-only-table">
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Partner Code</th>
                    <th style={styles.th}>Full Name & Contact</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Availability</th>
                    <th style={styles.th}>Performance</th>
                    <th style={styles.th}>Certified Skills</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {beauticians.map((b) => (
                    <tr key={b.id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.codeBadge}>{b.beauticianCode}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.name}>{b.fullName}</span>
                        <a href={`tel:${b.phone}`} style={styles.contactLink}>
                          <Phone size={12} style={{ marginRight: 4, display: 'inline' }} />
                          {b.phone}
                        </a>
                        {b.email && (
                          <a href={`mailto:${b.email}`} style={styles.contactLink}>
                            <Mail size={12} style={{ marginRight: 4, display: 'inline' }} />
                            {b.email}
                          </a>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor:
                              b.accountStatus === 'active'
                                ? '#DCFCE7'
                                : b.accountStatus === 'suspended'
                                ? '#FEF3C7'
                                : '#FEE2E2',
                            color:
                              b.accountStatus === 'active'
                                ? '#15803D'
                                : b.accountStatus === 'suspended'
                                ? '#B45309'
                                : '#DC2626',
                          }}
                        >
                          {b.accountStatus.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: b.isAvailable ? '#ECFDF5' : '#F1F5F9',
                            color: b.isAvailable ? '#059669' : '#64748B',
                          }}
                        >
                          {b.isAvailable ? '🟢 Online' : '⚪ Offline'}
                        </span>
                        <span style={styles.subtext}>Max: {b.maxDailyBookings} jobs/day</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={14} color="#D97706" fill="#D97706" />
                          <span style={{ fontWeight: '800' }}>{b.ratingAverage.toFixed(1)}</span>
                        </div>
                        <span style={styles.subtext}>{b.totalCompletedJobs} completed jobs</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.chipsWrap}>
                          {b.categories.map((cat, idx) => (
                            <span key={idx} style={styles.chip}>
                              {cat}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtonGroup}>
                          <button
                            title="Edit Beautician Profile"
                            style={styles.editBtn}
                            onClick={() => handleOpenEditModal(b)}
                          >
                            <Edit3 size={13} style={{ marginRight: 4 }} />
                            Edit
                          </button>
                          <button
                            title="Reset Beautician Password"
                            style={styles.passwordBtn}
                            onClick={() => handleOpenResetPasswordModal(b)}
                          >
                            <KeyRound size={13} style={{ marginRight: 4 }} />
                            Password
                          </button>
                          <button
                            title={b.accountStatus === 'active' ? 'Deactivate Account' : 'Activate Account'}
                            style={{
                              ...styles.actionToggleBtn,
                              backgroundColor: b.accountStatus === 'active' ? '#FEE2E2' : '#DCFCE7',
                              color: b.accountStatus === 'active' ? '#DC2626' : '#15803D',
                            }}
                            onClick={() => handleToggleStatus(b)}
                          >
                            <Power size={12} style={{ marginRight: 4 }} />
                            {b.accountStatus === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE & TABLET CARDS VIEW */}
            <div className="mobile-only-cards beautician-card-grid">
              {beauticians.map((b) => (
                <div key={b.id} className="beautician-card">
                  <div className="beautician-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={styles.codeBadge}>{b.beauticianCode}</span>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor:
                            b.accountStatus === 'active'
                              ? '#DCFCE7'
                              : b.accountStatus === 'suspended'
                              ? '#FEF3C7'
                              : '#FEE2E2',
                          color:
                            b.accountStatus === 'active'
                              ? '#15803D'
                              : b.accountStatus === 'suspended'
                              ? '#B45309'
                              : '#DC2626',
                        }}
                      >
                        {b.accountStatus.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: b.isAvailable ? '#ECFDF5' : '#F1F5F9',
                          color: b.isAvailable ? '#059669' : '#64748B',
                        }}
                      >
                        {b.isAvailable ? '🟢 Online' : '⚪ Offline'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Star size={13} color="#D97706" fill="#D97706" />
                        <span style={{ fontSize: '12px', fontWeight: '800' }}>{b.ratingAverage.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="beautician-card-body">
                    <div>
                      <span style={{ ...styles.name, fontSize: '15px' }}>{b.fullName}</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
                        <a href={`tel:${b.phone}`} style={styles.contactLink}>
                          <Phone size={13} style={{ marginRight: 4, display: 'inline' }} />
                          {b.phone}
                        </a>
                        {b.email && (
                          <a href={`mailto:${b.email}`} style={styles.contactLink}>
                            <Mail size={13} style={{ marginRight: 4, display: 'inline' }} />
                            {b.email}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="beautician-card-row" style={{ color: '#64748B', fontSize: '12px' }}>
                      <span>Workload: Max {b.maxDailyBookings} bookings/day</span>
                      <span>Jobs Completed: <strong>{b.totalCompletedJobs}</strong></span>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                        Certified Capabilities:
                      </span>
                      <div style={styles.chipsWrap}>
                        {b.categories.map((cat, idx) => (
                          <span key={idx} style={styles.chip}>
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="beautician-card-actions">
                    <button
                      className="admin-btn admin-btn-outline admin-btn-sm"
                      style={{ color: '#6D28D9', borderColor: '#DDD6FE' }}
                      onClick={() => handleOpenEditModal(b)}
                    >
                      <Edit3 size={13} />
                      Edit Profile
                    </button>
                    <button
                      className="admin-btn admin-btn-outline admin-btn-sm"
                      style={{ color: '#0369A1', borderColor: '#BAE6FD' }}
                      onClick={() => handleOpenResetPasswordModal(b)}
                    >
                      <KeyRound size={13} />
                      Reset Password
                    </button>
                    <button
                      className="admin-btn admin-btn-sm"
                      style={{
                        backgroundColor: b.accountStatus === 'active' ? '#FEE2E2' : '#DCFCE7',
                        color: b.accountStatus === 'active' ? '#DC2626' : '#15803D',
                        border: 'none',
                      }}
                      onClick={() => handleToggleStatus(b)}
                    >
                      <Power size={13} />
                      {b.accountStatus === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* MODAL 1: EDIT BEAUTICIAN PROFILE */}
      {editModalOpen && editingBeautician && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Edit Beautician Profile</h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Updating details for <strong>{editingBeautician.fullName}</strong> ({editingBeautician.beauticianCode})
                </span>
              </div>
              <button onClick={() => setEditModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            {editError && (
              <div style={styles.formErrorBox}>
                <AlertCircle size={15} style={{ marginRight: 6, flexShrink: 0 }} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateBeautician} style={styles.form}>
              <div className="admin-form-grid">
                <div>
                  <label style={styles.label}>Partner Code *</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <div>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <div>
                  <label style={styles.label}>Mobile Phone Number *</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <div>
                  <label style={styles.label}>Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    style={styles.input}
                    placeholder="e.g. beautician@urbanpower.app"
                  />
                </div>

                <div>
                  <label style={styles.label}>Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    style={styles.input}
                  >
                    <option value="active">Active (Verified & Operational)</option>
                    <option value="inactive">Inactive (Deactivated)</option>
                    <option value="suspended">Suspended (Restricted)</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Max Daily Bookings (1-20)</label>
                  <input
                    type="number"
                    value={editMaxDaily}
                    onChange={(e) => setEditMaxDaily(Number(e.target.value))}
                    min={1}
                    max={20}
                    style={styles.input}
                  />
                </div>

                <div className="admin-form-grid-full">
                  <label style={{ ...styles.checkboxLabel, fontWeight: '700' }}>
                    <input
                      type="checkbox"
                      checked={editIsAvailable}
                      onChange={(e) => setEditIsAvailable(e.target.checked)}
                      style={{ marginRight: 8 }}
                    />
                    <span>Available for Online Job Allocations (🟢 Online Status)</span>
                  </label>
                </div>

                <div className="admin-form-grid-full">
                  <label style={styles.label}>
                    Update Password <span style={{ fontWeight: 'normal', color: '#64748B' }}>(Leave empty to keep existing password)</span>
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Enter at least 6 characters to reset"
                      style={{ ...styles.input, paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      style={styles.eyeBtn}
                      title={showEditPassword ? 'Hide password' : 'Show password'}
                    >
                      {showEditPassword ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
                    </button>
                  </div>
                </div>

                <div className="admin-form-grid-full">
                  <label style={styles.label}>Certified Service Capabilities</label>
                  <div className="admin-category-grid">
                    {ALL_CATEGORIES.map((cat) => (
                      <label key={cat} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={editCategories.includes(cat)}
                          onChange={() => toggleCategoryInList(cat, editCategories, setEditCategories)}
                          style={{ marginRight: 6 }}
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.modalCancelBtn}
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.modalSubmitBtn} disabled={editSaving}>
                  {editSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD */}
      {resetModalOpen && resetTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box" style={{ maxWidth: '480px' }}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Reset Beautician Password</h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Target: <strong>{resetTarget.fullName}</strong> ({resetTarget.beauticianCode})
                </span>
              </div>
              <button onClick={() => setResetModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            {resetError && (
              <div style={styles.formErrorBox}>
                <AlertCircle size={15} style={{ marginRight: 6, flexShrink: 0 }} />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} style={styles.form}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '8px' }}>
                  Login Mobile Phone: <strong>{resetTarget.phone}</strong>
                </span>

                <label style={styles.label}>New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ ...styles.input, paddingRight: '75px', fontWeight: '700', letterSpacing: '0.5px' }}
                    required
                  />
                  <div style={{ position: 'absolute', right: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      style={styles.iconActionBtn}
                      title={showResetPassword ? 'Hide password' : 'Show password'}
                    >
                      {showResetPassword ? <EyeOff size={15} color="#64748B" /> : <Eye size={15} color="#64748B" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      style={styles.iconActionBtn}
                      title="Copy Password"
                    >
                      <Copy size={15} color="#64748B" />
                    </button>
                  </div>
                </div>

                {copiedNotice && (
                  <span style={{ fontSize: '11px', color: '#15803D', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                    ✓ Password copied to clipboard!
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setNewPassword(generateRandomPassword())}
                  style={styles.randomBtn}
                >
                  <Shuffle size={13} style={{ marginRight: 4 }} />
                  Generate Strong Random Password
                </button>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.modalCancelBtn}
                  onClick={() => setResetModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.modalSubmitBtn} disabled={resetSaving}>
                  {resetSaving ? 'Resetting Password...' : 'Save & Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ONBOARD NEW BEAUTICIAN */}
      {createModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Onboard New Beautician</h3>
              <button onClick={() => setCreateModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            {createError && (
              <div style={styles.formErrorBox}>
                <AlertCircle size={15} style={{ marginRight: 6, flexShrink: 0 }} />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBeautician} style={styles.form}>
              <div className="admin-form-grid">
                <div>
                  <label style={styles.label}>Beautician Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. UP-B-1002"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
                <div>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
                <div>
                  <label style={styles.label}>Mobile Phone *</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
                <div>
                  <label style={styles.label}>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. priya@example.com"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Initial Password *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showCreatePassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      style={{ ...styles.input, paddingRight: '40px' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      style={styles.eyeBtn}
                      title={showCreatePassword ? 'Hide password' : 'Show password'}
                    >
                      {showCreatePassword ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={styles.label}>Max Daily Bookings</label>
                  <input
                    type="number"
                    value={createMaxDaily}
                    onChange={(e) => setCreateMaxDaily(Number(e.target.value))}
                    min={1}
                    max={20}
                    style={styles.input}
                  />
                </div>

                <div className="admin-form-grid-full">
                  <label style={styles.label}>Certified Service Capabilities</label>
                  <div className="admin-category-grid">
                    {ALL_CATEGORIES.map((cat) => (
                      <label key={cat} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={createCategories.includes(cat)}
                          onChange={() => toggleCategoryInList(cat, createCategories, setCreateCategories)}
                          style={{ marginRight: 6 }}
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.modalCancelBtn}
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.modalSubmitBtn} disabled={createSaving}>
                  {createSaving ? 'Registering...' : 'Register Beautician'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  toastBanner: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    border: '1px solid #86EFAC',
    color: '#14532D',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '16px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  filterTabs: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '2px',
  },
  filterTabBtn: {
    padding: '7px 12px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  filterTabBtnActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#7C3AED',
    color: '#6D28D9',
  },
  loadingBox: {
    padding: '50px 20px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyBox: {
    padding: '50px 20px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '14px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '12px 14px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '12px 14px',
    verticalAlign: 'top',
  },
  codeBadge: {
    display: 'inline-block',
    backgroundColor: '#EDE9FE',
    color: '#6D28D9',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '800',
  },
  name: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
    display: 'block',
  },
  contactLink: {
    fontSize: '12px',
    color: '#0284C7',
    display: 'block',
    marginTop: '2px',
    textDecoration: 'none',
  },
  subtext: {
    fontSize: '12px',
    color: '#64748B',
    display: 'block',
    marginTop: '2px',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
  },
  chipsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    maxWidth: '280px',
  },
  chip: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#334155',
  },
  actionButtonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  editBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    border: '1px solid #DDD6FE',
    color: '#6D28D9',
    padding: '5px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  passwordBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    border: '1px solid #BAE6FD',
    color: '#0369A1',
    padding: '5px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  actionToggleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    border: 'none',
    padding: '5px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  formErrorBox: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '14px',
    display: 'flex',
    alignItems: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
    display: 'block',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: '#ffffff',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#334155',
    cursor: 'pointer',
  },
  eyeBtn: {
    position: 'absolute',
    right: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  iconActionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  randomBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    marginTop: '10px',
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#7C3AED',
    backgroundColor: '#EDE9FE',
    border: '1px solid #DDD6FE',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '18px',
    borderTop: '1px solid #E2E8F0',
    paddingTop: '14px',
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: 'none',
    padding: '9px 16px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
  },
  modalSubmitBtn: {
    backgroundColor: '#7C3AED',
    color: '#ffffff',
    border: 'none',
    padding: '9px 18px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
  },
};
