import React, { useEffect, useMemo, useState } from 'react';
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
  Plus,
  Sparkles,
  Users,
  Wifi,
  Briefcase,
  Download,
  Award,
  Check,
  Trash2,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { Beautician } from '../types/beauty';

export interface ServiceCatalogGroup {
  id: string;
  label: string;
  badgeColor: string;
  items: string[];
}

export const CORE_CATEGORIES: string[] = [
  'Facial & Cleanup',
  'Waxing & Hair Removal',
  'Waxing',
  'Manicure & Pedicure',
  'Hair Care & Styling',
  'Threading & Face Care',
  'Threading',
  'Bridal & Party Makeup',
  'Bleach & De-Tan',
  'Massage & Spa Therapy',
  'Nail Art & Extensions',
];

export const APP_SERVICE_CATALOG_GROUPS: ServiceCatalogGroup[] = [
  {
    id: 'core',
    label: 'Core App Categories',
    badgeColor: '#DB2777',
    items: CORE_CATEGORIES,
  },
  {
    id: 'facial',
    label: 'Facial & Skin Care',
    badgeColor: '#E11D48',
    items: [
      'Hydra Facial',
      'Diamond Facial',
      'Gold Facial',
      'Fruit Facial',
      'O3+ Bridal Facial',
      'Anti-Ageing Facial',
      'Acne & Pimple Treatment',
      'Skin Polishing',
      'Classic Cleanup',
      'Charcoal Detox Facial',
      'Korean Glass Skin Facial',
      'Vitamin C Glow Facial',
    ],
  },
  {
    id: 'waxing',
    label: 'Waxing & Hair Removal',
    badgeColor: '#D97706',
    items: [
      'Honey Waxing',
      'Chocolate Waxing',
      'Rica Brazilian Wax',
      'Roll-On Waxing',
      'Full Body Waxing',
      'Full Arms & Legs Waxing',
      'Underarms & Bikini Wax',
      'Face & Chin Waxing',
    ],
  },
  {
    id: 'manipedi',
    label: 'Manicure & Pedicure',
    badgeColor: '#0284C7',
    items: [
      'Classic Manicure',
      'Classic Pedicure',
      'Spa Manicure',
      'Spa Pedicure',
      'Crystal / Bomb Pedicure',
      'Paraffin Manicure & Pedicure',
      'Heel Peel & Crack Treatment',
      'Hand & Feet De-Tan',
    ],
  },
  {
    id: 'hair',
    label: 'Hair Care & Styling',
    badgeColor: '#9333EA',
    items: [
      'Hair Spa & Deep Conditioning',
      'Haircut & Advanced Trimming',
      'Hair Straightening',
      'Hair Smoothening & Keratin',
      'Hair Rebonding',
      'Root Touch-Up & Global Hair Color',
      'Highlights & Balayage',
      'Party Blow-Dry & Curls',
      'Anti-Dandruff Scalp Treatment',
    ],
  },
  {
    id: 'makeup',
    label: 'Bridal & Party Makeup',
    badgeColor: '#BE185D',
    items: [
      'HD Bridal Makeup',
      'Airbrush Bridal Makeup',
      'Luxury Signature Bridal Package',
      'Reception Makeup',
      'Engagement Makeup',
      'Haldi & Mehandi Makeup',
      'Cocktail & Party Makeup',
      'Saree & Lehenga Draping',
      'Complete Makeover Solution',
    ],
  },
  {
    id: 'nails_eyes',
    label: 'Nail Art, Eye & Threading',
    badgeColor: '#0D9488',
    items: [
      'Eyebrow & Upper Lip Threading',
      'Forehead & Full Face Threading',
      'Gel Nail Polish',
      'Acrylic & Gel Nail Extensions',
      '3D Custom Nail Art',
      'Eyelash Extensions',
      'Lash Lifting & Tinting',
    ],
  },
  {
    id: 'spa_detan',
    label: 'Bleach, De-Tan & Wellness Spa',
    badgeColor: '#15803D',
    items: [
      'Face & Neck De-Tan',
      'Full Body Bleach & De-Tan',
      'Oxy / Gold Face Bleach',
      'Full Body Relaxing Massage',
      'Aromatherapy Spa',
      'Swedish Body Massage',
      'Head, Neck & Shoulder Massage',
      'Body Scrub & Polishing',
    ],
  },
];

const ALL_PRESET_SERVICES_SET = new Set(
  APP_SERVICE_CATALOG_GROUPS.flatMap((g) => g.items.map((i) => i.toLowerCase()))
);

interface ServiceCapabilitiesSelectorProps {
  selected: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
}

const ServiceCapabilitiesSelector: React.FC<ServiceCapabilitiesSelectorProps> = ({
  selected,
  onChange,
}) => {
  const [activeGroupTab, setActiveGroupTab] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [manualInput, setManualInput] = useState('');

  const hasItemCaseInsensitive = (list: string[], candidate: string) =>
    list.some((item) => item.trim().toLowerCase() === candidate.trim().toLowerCase());

  const handleToggleItem = (serviceName: string) => {
    const trimmed = serviceName.trim();
    if (!trimmed) return;
    onChange((prev) => {
      const exists = prev.some((p) => p.trim().toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        return prev.filter((p) => p.trim().toLowerCase() !== trimmed.toLowerCase());
      }
      return [...prev, trimmed];
    });
  };

  const handleAddManualServices = () => {
    if (!manualInput.trim()) return;
    // Allow adding a single service or comma-separated multiple services
    const parts = manualInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (parts.length === 0) return;

    onChange((prev) => {
      const next = [...prev];
      for (const part of parts) {
        if (!hasItemCaseInsensitive(next, part)) {
          next.push(part);
        }
      }
      return next;
    });
    setManualInput('');
  };

  const handleSelectCoreCategories = () => {
    onChange((prev) => {
      const next = [...prev];
      for (const core of CORE_CATEGORIES) {
        if (!hasItemCaseInsensitive(next, core)) {
          next.push(core);
        }
      }
      return next;
    });
  };

  const handleSelectVisibleItems = (items: string[]) => {
    onChange((prev) => {
      const next = [...prev];
      for (const item of items) {
        if (!hasItemCaseInsensitive(next, item)) {
          next.push(item);
        }
      }
      return next;
    });
  };

  const visibleGroups = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    return APP_SERVICE_CATALOG_GROUPS.filter(
      (g) => activeGroupTab === 'all' || g.id === activeGroupTab
    )
      .map((g) => ({
        ...g,
        items: query
          ? g.items.filter((item) => item.toLowerCase().includes(query))
          : g.items,
      }))
      .filter((g) => g.items.length > 0);
  }, [activeGroupTab, catalogSearch]);

  const allVisibleItems = useMemo(
    () => visibleGroups.flatMap((g) => g.items),
    [visibleGroups]
  );

  return (
    <div style={selectorStyles.wrapper}>
      {/* Header + Quick Bulk Actions */}
      <div style={selectorStyles.topBar}>
        <div>
          <label style={{ ...styles.label, marginBottom: 2 }}>
            Certified Beauty Categories & App Services ({selected.length} selected)
          </label>
          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            Select from Urban Power App categories & treatments below, or type any custom service manually.
          </span>
        </div>

        <div style={selectorStyles.quickActionsRow}>
          <button
            type="button"
            onClick={handleSelectCoreCategories}
            style={selectorStyles.quickActionBtn}
          >
            + All Core Categories
          </button>
          <button
            type="button"
            onClick={() => handleSelectVisibleItems(allVisibleItems)}
            style={selectorStyles.quickActionBtn}
          >
            + Select Visible ({allVisibleItems.length})
          </button>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              style={{
                ...selectorStyles.quickActionBtn,
                color: '#DC2626',
                borderColor: '#FECACA',
                backgroundColor: '#FEF2F2',
              }}
            >
              <Trash2 size={11} style={{ marginRight: 3 }} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Manual Text Input to Add Custom Services */}
      <div style={selectorStyles.manualAddBox}>
        <div style={selectorStyles.manualInputWrap}>
          <Sparkles size={15} color="#DB2777" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddManualServices();
              }
            }}
            placeholder="Type custom service(s) manually (comma-separated, e.g. Hydra Medi-Facial, Bridal Mehandi)..."
            style={selectorStyles.manualInput}
          />
        </div>
        <button
          type="button"
          onClick={handleAddManualServices}
          disabled={!manualInput.trim()}
          style={{
            ...selectorStyles.manualAddBtn,
            opacity: manualInput.trim() ? 1 : 0.55,
            cursor: manualInput.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          <Plus size={15} />
          Add Manual Service
        </button>
      </div>

      {/* Selected Services & Categories Chips Box */}
      <div style={selectorStyles.selectedContainer}>
        <div style={selectorStyles.selectedHeader}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
            Active Capabilities on Profile ({selected.length}):
          </span>
        </div>
        {selected.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
            No services selected yet. Click categories/services below or add manually above.
          </div>
        ) : (
          <div style={selectorStyles.selectedChipsWrap}>
            {selected.map((srv) => {
              const isCustom = !ALL_PRESET_SERVICES_SET.has(srv.trim().toLowerCase());
              return (
                <span
                  key={srv}
                  style={{
                    ...selectorStyles.selectedChip,
                    ...(isCustom ? selectorStyles.selectedChipCustom : {}),
                  }}
                >
                  <span>{srv}</span>
                  {isCustom && <span style={selectorStyles.customMiniBadge}>Custom</span>}
                  <button
                    type="button"
                    onClick={() => handleToggleItem(srv)}
                    style={selectorStyles.removeChipBtn}
                    title={`Remove ${srv}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Search + Category Group Filter Tabs */}
      <div style={selectorStyles.catalogFilterBar}>
        <div style={selectorStyles.catalogSearchWrap}>
          <Search size={14} color="#94A3B8" />
          <input
            type="text"
            value={catalogSearch}
            onChange={(e) => setCatalogSearch(e.target.value)}
            placeholder="Filter app services (e.g. Hydra, Rica, Bridal, Pedicure)..."
            style={selectorStyles.catalogSearchInput}
          />
          {catalogSearch && (
            <button
              type="button"
              onClick={() => setCatalogSearch('')}
              style={selectorStyles.clearSearchBtn}
            >
              <X size={13} color="#64748B" />
            </button>
          )}
        </div>

        <div style={selectorStyles.groupTabsRow}>
          <button
            type="button"
            onClick={() => setActiveGroupTab('all')}
            style={{
              ...selectorStyles.groupTabPill,
              ...(activeGroupTab === 'all' ? selectorStyles.groupTabPillActive : {}),
            }}
          >
            All App Services
          </button>
          {APP_SERVICE_CATALOG_GROUPS.map((grp) => (
            <button
              key={grp.id}
              type="button"
              onClick={() => setActiveGroupTab(grp.id)}
              style={{
                ...selectorStyles.groupTabPill,
                ...(activeGroupTab === grp.id ? selectorStyles.groupTabPillActive : {}),
              }}
            >
              {grp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categorized App Services Grid */}
      <div style={selectorStyles.catalogScrollBox}>
        {visibleGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '18px', color: '#64748B', fontSize: '12.5px' }}>
            No preset service matches "{catalogSearch}". You can add it using the{' '}
            <strong>Add Manual Service</strong> box above!
          </div>
        ) : (
          visibleGroups.map((group) => (
            <div key={group.id} style={selectorStyles.groupSection}>
              <div style={selectorStyles.groupSectionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: group.badgeColor,
                      display: 'inline-block',
                    }}
                  />
                  <span style={selectorStyles.groupSectionTitle}>{group.label}</span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    ({group.items.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectVisibleItems(group.items)}
                  style={selectorStyles.selectGroupMiniBtn}
                >
                  Select All in {group.label}
                </button>
              </div>

              <div style={selectorStyles.groupItemsGrid}>
                {group.items.map((serviceName) => {
                  const isChecked = hasItemCaseInsensitive(selected, serviceName);
                  return (
                    <button
                      key={serviceName}
                      type="button"
                      className={`admin-service-pill-btn ${isChecked ? 'selected' : ''}`}
                      onClick={() => handleToggleItem(serviceName)}
                    >
                      <span
                        style={{
                          ...selectorStyles.checkSquare,
                          backgroundColor: isChecked ? '#DB2777' : '#ffffff',
                          borderColor: isChecked ? '#DB2777' : '#CBD5E1',
                        }}
                      >
                        {isChecked && <Check size={11} color="#ffffff" strokeWidth={3} />}
                      </span>
                      <span style={{ flex: 1, lineHeight: 1.25 }}>{serviceName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface BeauticiansRosterProps {
  onOpenLogin?: () => void;
}

export const BeauticiansRoster: React.FC<BeauticiansRosterProps> = ({ onOpenLogin }) => {
  const [beauticians, setBeauticians] = useState<Beautician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive' | 'suspended'>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');
  const [skillFilter, setSkillFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'jobs' | 'rating' | 'name'>('newest');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Profile Preview Modal
  const [viewingBeautician, setViewingBeautician] = useState<Beautician | null>(null);

  // 1. Create Beautician State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createCode, setCreateCode] = useState('');
  const [createName, setCreateName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createMaxDaily, setCreateMaxDaily] = useState(5);
  const [createCategories, setCreateCategories] = useState<string[]>([
    'Facial & Cleanup',
    'Waxing & Hair Removal',
    'Manicure & Pedicure',
  ]);
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

  const generateNextPartnerCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `UP-B-${randomNum}`;
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

  // Computed KPI Metrics
  const rosterStats = useMemo(() => {
    const total = beauticians.length;
    const activeCount = beauticians.filter((b) => b.accountStatus === 'active').length;
    const onlineCount = beauticians.filter(
      (b) => b.accountStatus === 'active' && b.isAvailable
    ).length;
    const totalCompletedJobs = beauticians.reduce(
      (sum, b) => sum + Number(b.totalCompletedJobs || 0),
      0
    );
    const totalDailyCapacity = beauticians
      .filter((b) => b.accountStatus === 'active')
      .reduce((sum, b) => sum + Number(b.maxDailyBookings || 0), 0);
    const avgRating =
      total > 0
        ? beauticians.reduce((sum, b) => sum + Number(b.ratingAverage || 5), 0) / total
        : 5.0;

    return {
      total,
      activeCount,
      onlineCount,
      totalCompletedJobs,
      totalDailyCapacity,
      avgRating,
    };
  }, [beauticians]);

  // All unique skills across current roster + core categories for filter dropdown
  const availableSkillOptions = useMemo(() => {
    const set = new Set<string>(CORE_CATEGORIES);
    beauticians.forEach((b) => {
      b.categories.forEach((c) => {
        if (c.trim()) set.add(c.trim());
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [beauticians]);

  // Filtered & Sorted Beauticians
  const filteredBeauticians = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = beauticians.filter((b) => {
      if (availabilityFilter === 'ONLINE' && !b.isAvailable) return false;
      if (availabilityFilter === 'OFFLINE' && b.isAvailable) return false;
      if (
        skillFilter !== 'ALL' &&
        !b.categories.some((c) => c.trim().toLowerCase() === skillFilter.toLowerCase())
      ) {
        return false;
      }
      if (q) {
        const matchesName = b.fullName.toLowerCase().includes(q);
        const matchesCode = b.beauticianCode.toLowerCase().includes(q);
        const matchesPhone = b.phone.toLowerCase().includes(q);
        const matchesSkill = b.categories.some((c) => c.toLowerCase().includes(q));
        if (!matchesName && !matchesCode && !matchesPhone && !matchesSkill) {
          return false;
        }
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'jobs') return (b.totalCompletedJobs || 0) - (a.totalCompletedJobs || 0);
      if (sortBy === 'rating') return (b.ratingAverage || 0) - (a.ratingAverage || 0);
      if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
      return 0;
    });
  }, [beauticians, availabilityFilter, skillFilter, search, sortBy]);

  // Export CSV
  const handleExportCsv = () => {
    if (filteredBeauticians.length === 0) return;
    const headers = [
      'Partner Code',
      'Full Name',
      'Phone',
      'Email',
      'Account Status',
      'Availability',
      'Max Daily Bookings',
      'Rating',
      'Completed Jobs',
      'Certified Services & Categories',
    ];
    const rows = filteredBeauticians.map((b) => [
      b.beauticianCode,
      `"${(b.fullName || '').replace(/"/g, '""')}"`,
      b.phone,
      b.email || '',
      b.accountStatus,
      b.isAvailable ? 'Online' : 'Offline',
      String(b.maxDailyBookings),
      b.ratingAverage.toFixed(1),
      String(b.totalCompletedJobs),
      `"${b.categories.join(', ').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `urban-power-beauticians-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Open Create Modal with fresh defaults
  const handleOpenCreateModal = () => {
    setCreateCode(generateNextPartnerCode());
    setCreateName('');
    setCreatePhone('');
    setCreateEmail('');
    setCreatePassword(generateRandomPassword());
    setCreateMaxDaily(5);
    setCreateCategories([
      'Facial & Cleanup',
      'Waxing & Hair Removal',
      'Manicure & Pedicure',
    ]);
    setCreateError(null);
    setShowCreatePassword(true);
    setCreateModalOpen(true);
  };

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
      showToast('Beautician details & services updated successfully!');
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

  // Quick Online/Offline Availability Toggle
  const handleToggleAvailability = async (b: Beautician) => {
    const nextAvail = !b.isAvailable;
    try {
      await adminApi.updateBeautician(b.id, { isAvailable: nextAvail });
      fetchRoster();
      showToast(
        `${b.fullName} is now ${nextAvail ? 'ONLINE (Accepting Jobs)' : 'OFFLINE'}`
      );
    } catch (err) {
      console.error('Availability update failed:', err);
    }
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
            Manage verified beauty partners, configure full app service capabilities & custom treatments, and monitor live workload capacity.
          </p>
        </div>

        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-outline" onClick={handleExportCsv}>
            <Download size={15} />
            Export CSV
          </button>
          <button className="admin-btn admin-btn-outline" onClick={fetchRoster}>
            <RefreshCw size={15} />
            Refresh
          </button>
          <button className="admin-btn admin-btn-primary" onClick={handleOpenCreateModal}>
            <UserPlus size={16} />
            Onboard New Beautician
          </button>
        </div>
      </div>

      {/* Live KPI Summary Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Registered Partners</span>
            <div className="admin-kpi-icon" style={{ backgroundColor: '#FCE7F3', color: '#DB2777' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="admin-kpi-value">{rosterStats.total}</div>
          <div className="admin-kpi-sub">
            <span style={{ color: '#15803D', fontWeight: 700 }}>
              {rosterStats.activeCount} Active
            </span>
            <span>• {rosterStats.total - rosterStats.activeCount} Inactive/Suspended</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Online & Ready</span>
            <div className="admin-kpi-icon" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
              <Wifi size={18} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: '#15803D' }}>
            {rosterStats.onlineCount}
          </div>
          <div className="admin-kpi-sub">
            <span>Accepting live assignments right now</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Completed Sessions</span>
            <div className="admin-kpi-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <Award size={18} />
            </div>
          </div>
          <div className="admin-kpi-value">{rosterStats.totalCompletedJobs}</div>
          <div className="admin-kpi-sub">
            <Star size={13} color="#D97706" fill="#D97706" />
            <span style={{ color: '#B45309', fontWeight: 700 }}>
              {rosterStats.avgRating.toFixed(1)} Avg Partner Rating
            </span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Daily Fleet Capacity</span>
            <div className="admin-kpi-icon" style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
              <Briefcase size={18} />
            </div>
          </div>
          <div className="admin-kpi-value">{rosterStats.totalDailyCapacity}</div>
          <div className="admin-kpi-sub">
            <span>Max daily appointments across active partners</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search-box">
          <Search size={16} color="#94A3B8" style={{ marginRight: 8, flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by name, code, phone or service skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRoster()}
            className="admin-search-input"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
            >
              <X size={14} color="#94A3B8" />
            </button>
          )}
        </div>

        <div className="admin-filter-controls">
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
                {st === 'ALL' ? 'All Status' : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          <select
            className="admin-select"
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value as any)}
            aria-label="Filter by availability"
          >
            <option value="ALL">All Availability</option>
            <option value="ONLINE">🟢 Online Only</option>
            <option value="OFFLINE">⚪ Offline Only</option>
          </select>

          <select
            className="admin-select"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            aria-label="Filter by service skill"
          >
            <option value="ALL">All Service Skills</option>
            {availableSkillOptions.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>

          <select
            className="admin-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort beauticians"
          >
            <option value="newest">Sort: Default</option>
            <option value="jobs">Sort: Most Jobs Completed</option>
            <option value="rating">Sort: Highest Rating</option>
            <option value="name">Sort: Name (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="admin-table-card">
        {loading ? (
          <div style={styles.loadingBox}>
            <RefreshCw size={24} className="spinning" style={{ marginBottom: 10, color: '#DB2777' }} />
            <div>Loading beauticians roster...</div>
          </div>
        ) : filteredBeauticians.length === 0 ? (
          <div style={styles.emptyBox}>
            No beauticians found matching the selected filters.
          </div>
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
                    <th style={styles.th}>Certified Services & Skills</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBeauticians.map((b) => {
                    const visibleSkills = b.categories.slice(0, 6);
                    const extraCount = Math.max(0, b.categories.length - visibleSkills.length);
                    return (
                      <tr key={b.id} style={styles.tr}>
                        <td style={styles.td}>
                          <span
                            style={{ ...styles.codeBadge, cursor: 'pointer' }}
                            onClick={() => setViewingBeautician(b)}
                            title="Click to view full partner portfolio"
                          >
                            {b.beauticianCode}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{ ...styles.name, cursor: 'pointer' }}
                            onClick={() => setViewingBeautician(b)}
                          >
                            {b.fullName}
                          </span>
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
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(b)}
                            title="Click to toggle Online / Offline status"
                            style={{
                              ...styles.statusBadge,
                              border: '1px solid',
                              borderColor: b.isAvailable ? '#A7F3D0' : '#E2E8F0',
                              backgroundColor: b.isAvailable ? '#ECFDF5' : '#F1F5F9',
                              color: b.isAvailable ? '#059669' : '#64748B',
                              cursor: 'pointer',
                            }}
                          >
                            {b.isAvailable ? '🟢 Online' : '⚪ Offline'}
                          </button>
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
                            {visibleSkills.map((cat, idx) => (
                              <span key={idx} style={styles.chip}>
                                {cat}
                              </span>
                            ))}
                            {extraCount > 0 && (
                              <button
                                type="button"
                                onClick={() => setViewingBeautician(b)}
                                style={styles.moreSkillsChip}
                              >
                                +{extraCount} more
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionButtonGroup}>
                            <button
                              title="View Full Beautician Portfolio"
                              style={styles.viewBtn}
                              onClick={() => setViewingBeautician(b)}
                            >
                              <Eye size={13} style={{ marginRight: 4 }} />
                              View
                            </button>
                            <button
                              title="Edit Beautician Profile & Services"
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE & TABLET CARDS VIEW */}
            <div className="mobile-only-cards beautician-card-grid">
              {filteredBeauticians.map((b) => (
                <div key={b.id} className="beautician-card">
                  <div className="beautician-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(b)}
                        style={{
                          ...styles.statusBadge,
                          border: '1px solid',
                          borderColor: b.isAvailable ? '#A7F3D0' : '#E2E8F0',
                          backgroundColor: b.isAvailable ? '#ECFDF5' : '#F1F5F9',
                          color: b.isAvailable ? '#059669' : '#64748B',
                          cursor: 'pointer',
                        }}
                      >
                        {b.isAvailable ? '🟢 Online' : '⚪ Offline'}
                      </button>
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
                      <span>
                        Jobs Completed: <strong>{b.totalCompletedJobs}</strong>
                      </span>
                    </div>

                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#64748B',
                          display: 'block',
                          marginBottom: '4px',
                        }}
                      >
                        Certified Services & Capabilities ({b.categories.length}):
                      </span>
                      <div style={{ ...styles.chipsWrap, maxWidth: '100%' }}>
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
                      onClick={() => setViewingBeautician(b)}
                    >
                      <Eye size={13} />
                      View
                    </button>
                    <button
                      className="admin-btn admin-btn-outline admin-btn-sm"
                      style={{ color: '#BE185D', borderColor: '#FBCFE8' }}
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
                      Password
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

      {/* MODAL 0: VIEW BEAUTICIAN PORTFOLIO MODAL */}
      {viewingBeautician && (
        <div className="admin-modal-overlay" onClick={() => setViewingBeautician(null)}>
          <div
            className="admin-modal-box"
            style={{ maxWidth: '580px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={styles.codeBadge}>{viewingBeautician.beauticianCode}</span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor:
                        viewingBeautician.accountStatus === 'active' ? '#DCFCE7' : '#FEE2E2',
                      color:
                        viewingBeautician.accountStatus === 'active' ? '#15803D' : '#DC2626',
                    }}
                  >
                    {viewingBeautician.accountStatus.toUpperCase()}
                  </span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: viewingBeautician.isAvailable ? '#ECFDF5' : '#F1F5F9',
                      color: viewingBeautician.isAvailable ? '#059669' : '#64748B',
                    }}
                  >
                    {viewingBeautician.isAvailable ? '🟢 Online' : '⚪ Offline'}
                  </span>
                </div>
                <h3 className="admin-modal-title">{viewingBeautician.fullName}</h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Phone: {viewingBeautician.phone}
                  {viewingBeautician.email ? ` • ${viewingBeautician.email}` : ''}
                </span>
              </div>
              <button onClick={() => setViewingBeautician(null)} style={styles.closeBtn}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div style={selectorStyles.statMiniCard}>
                <span style={selectorStyles.statMiniLabel}>Completed Jobs</span>
                <span style={selectorStyles.statMiniVal}>
                  {viewingBeautician.totalCompletedJobs}
                </span>
              </div>
              <div style={selectorStyles.statMiniCard}>
                <span style={selectorStyles.statMiniLabel}>Rating</span>
                <span style={{ ...selectorStyles.statMiniVal, color: '#D97706' }}>
                  {viewingBeautician.ratingAverage.toFixed(1)} ★
                </span>
              </div>
              <div style={selectorStyles.statMiniCard}>
                <span style={selectorStyles.statMiniLabel}>Daily Limit</span>
                <span style={selectorStyles.statMiniVal}>
                  {viewingBeautician.maxDailyBookings} / day
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>
                Certified Services & Treatment Capabilities ({viewingBeautician.categories.length})
              </label>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                {viewingBeautician.categories.length === 0 ? (
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                    No services configured yet.
                  </span>
                ) : (
                  viewingBeautician.categories.map((cat, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#FCE7F3',
                        color: '#9D174D',
                        border: '1px solid #FBCFE8',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {cat}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div style={styles.modalFooter}>
              <a
                href={`tel:${viewingBeautician.phone}`}
                className="admin-btn admin-btn-outline"
              >
                <Phone size={14} />
                Call Partner
              </a>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  const target = viewingBeautician;
                  setViewingBeautician(null);
                  handleOpenEditModal(target);
                }}
              >
                <Edit3 size={14} />
                Edit Profile & Services
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT BEAUTICIAN PROFILE */}
      {editModalOpen && editingBeautician && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Edit Beautician Profile & Services</h3>
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
                    Update Password{' '}
                    <span style={{ fontWeight: 'normal', color: '#64748B' }}>
                      (Leave empty to keep existing password)
                    </span>
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
                      {showEditPassword ? (
                        <EyeOff size={16} color="#64748B" />
                      ) : (
                        <Eye size={16} color="#64748B" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="admin-form-grid-full">
                  <ServiceCapabilitiesSelector
                    selected={editCategories}
                    onChange={setEditCategories}
                  />
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
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: '#475569',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Login Mobile Phone: <strong>{resetTarget.phone}</strong>
                </span>

                <label style={styles.label}>New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      ...styles.input,
                      paddingRight: '75px',
                      fontWeight: '700',
                      letterSpacing: '0.5px',
                    }}
                    required
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      style={styles.iconActionBtn}
                      title={showResetPassword ? 'Hide password' : 'Show password'}
                    >
                      {showResetPassword ? (
                        <EyeOff size={15} color="#64748B" />
                      ) : (
                        <Eye size={15} color="#64748B" />
                      )}
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
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#15803D',
                      fontWeight: '600',
                      marginTop: '4px',
                      display: 'block',
                    }}
                  >
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
              <div>
                <h3 className="admin-modal-title">Onboard New Beautician Partner</h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Create partner login credentials and assign app service capabilities & custom skills.
                </span>
              </div>
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
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      placeholder="e.g. UP-B-1002"
                      value={createCode}
                      onChange={(e) => setCreateCode(e.target.value)}
                      style={styles.input}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setCreateCode(generateNextPartnerCode())}
                      style={selectorStyles.inlineGenBtn}
                      title="Generate Partner Code"
                    >
                      <Shuffle size={13} />
                    </button>
                  </div>
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
                      style={{ ...styles.input, paddingRight: '68px' }}
                      required
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                        style={styles.iconActionBtn}
                        title={showCreatePassword ? 'Hide password' : 'Show password'}
                      >
                        {showCreatePassword ? (
                          <EyeOff size={15} color="#64748B" />
                        ) : (
                          <Eye size={15} color="#64748B" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreatePassword(generateRandomPassword())}
                        style={styles.iconActionBtn}
                        title="Generate random password"
                      >
                        <Shuffle size={14} color="#DB2777" />
                      </button>
                    </div>
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
                  <ServiceCapabilitiesSelector
                    selected={createCategories}
                    onChange={setCreateCategories}
                  />
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

const selectorStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '14px',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '10px',
  },
  quickActionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  quickActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '11px',
    fontWeight: 700,
    padding: '5px 10px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#ffffff',
    color: '#334155',
    cursor: 'pointer',
  },
  manualAddBox: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  manualInputWrap: {
    flex: 1,
    minWidth: '220px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '7px 12px',
  },
  manualInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '12.5px',
    color: '#0F172A',
    backgroundColor: 'transparent',
  },
  manualAddBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#DB2777',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '12.5px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  selectedContainer: {
    backgroundColor: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '10px 12px',
  },
  selectedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  selectedChipsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    maxHeight: '110px',
    overflowY: 'auto',
  },
  selectedChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#FDF2F8',
    border: '1px solid #F9A8D4',
    color: '#9D174D',
    borderRadius: '999px',
    padding: '3px 9px',
    fontSize: '11.5px',
    fontWeight: 600,
  },
  selectedChipCustom: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FBCFE8',
    color: '#BE185D',
  },
  customMiniBadge: {
    fontSize: '9.5px',
    fontWeight: 800,
    backgroundColor: '#DB2777',
    color: '#ffffff',
    borderRadius: '4px',
    padding: '1px 4px',
    textTransform: 'uppercase',
  },
  removeChipBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: 'inherit',
  },
  catalogFilterBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  catalogSearchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '6px 10px',
  },
  catalogSearchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '12px',
    color: '#0F172A',
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
  },
  groupTabsRow: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '2px',
  },
  groupTabPill: {
    padding: '5px 10px',
    borderRadius: '999px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  groupTabPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
    color: '#ffffff',
  },
  catalogScrollBox: {
    maxHeight: '280px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingRight: '4px',
  },
  groupSection: {
    backgroundColor: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '10px 12px',
  },
  groupSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '6px',
  },
  groupSectionTitle: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#0F172A',
  },
  selectGroupMiniBtn: {
    background: 'none',
    border: 'none',
    color: '#DB2777',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
  },
  groupItemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
    gap: '6px',
  },
  checkSquare: {
    width: '15px',
    height: '15px',
    borderRadius: '4px',
    border: '1.5px solid #CBD5E1',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inlineGenBtn: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    color: '#334155',
    borderRadius: '8px',
    padding: '0 10px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statMiniCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '10px',
    textAlign: 'center',
  },
  statMiniLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
  },
  statMiniVal: {
    display: 'block',
    fontSize: '18px',
    fontWeight: 900,
    color: '#0F172A',
    marginTop: 2,
  },
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
    backgroundColor: '#DB2777',
    borderColor: '#DB2777',
    color: '#ffffff',
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
    backgroundColor: '#FDF4F8',
    borderBottom: '1px solid #F1E0EA',
  },
  th: {
    padding: '12px 14px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  tr: {
    borderBottom: '1px solid #F8EEF3',
  },
  td: {
    padding: '12px 14px',
    verticalAlign: 'top',
  },
  codeBadge: {
    display: 'inline-block',
    backgroundColor: '#FDF2F8',
    color: '#BE185D',
    border: '1px solid #FBCFE8',
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
    color: '#475569',
    display: 'block',
    marginTop: '2px',
    textDecoration: 'none',
    fontWeight: 500,
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
    maxWidth: '310px',
  },
  chip: {
    backgroundColor: '#FFF9FC',
    border: '1px solid #F1E0EA',
    padding: '2px 7px',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#334155',
  },
  moreSkillsChip: {
    backgroundColor: '#FDF2F8',
    border: '1px solid #FBCFE8',
    padding: '2px 7px',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#BE185D',
    cursor: 'pointer',
  },
  actionButtonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  viewBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    color: '#334155',
    padding: '5px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  editBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    border: '1px solid #FBCFE8',
    color: '#BE185D',
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
    color: '#334155',
    backgroundColor: '#F1F5F9',
    border: '1px solid #CBD5E1',
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
    border: '1px solid #CBD5E1',
    padding: '9px 16px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
  },
  modalSubmitBtn: {
    backgroundColor: '#DB2777',
    color: '#ffffff',
    border: 'none',
    padding: '9px 18px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
  },
};
