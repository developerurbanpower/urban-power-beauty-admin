import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  RefreshCw,
  UserCheck,
  Clock,
  MapPin,
  IndianRupee,
  Lock,
  Eye,
  XCircle,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Download,
  X,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { BeautyBooking } from '../types/beauty';
import { AssignmentModal } from '../components/AssignmentModal';
import { BookingDetailModal } from '../components/BookingDetailModal';
import {
  getAssignmentEligibility,
  getPaymentBadgeInfo,
  PaymentBadgeTone,
  selectAssignableBooking,
} from '../utils/assignmentEligibility';

interface BookingsQueueProps {
  onOpenLogin?: () => void;
  initialBookings?: BeautyBooking[];
}

export const BookingsQueue: React.FC<BookingsQueueProps> = ({
  onOpenLogin,
  initialBookings,
}) => {
  const [bookings, setBookings] = useState<BeautyBooking[]>(initialBookings ?? []);
  const [loading, setLoading] = useState(initialBookings === undefined);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookingForAssignment, setSelectedBookingForAssignment] =
    useState<BeautyBooking | null>(null);
  const [selectedBookingForDetail, setSelectedBookingForDetail] =
    useState<BeautyBooking | null>(null);

  const fetchBookings = async () => {
    if (!adminApi.isAuthenticated()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const apiStatus =
        statusFilter !== 'ALL' && statusFilter !== 'rejected_by_partner'
          ? statusFilter
          : undefined;
      const data = await adminApi.getBookings({
        status: apiStatus,
        search: searchTerm.trim() || undefined,
      });
      setBookings(data);
    } catch (err: any) {
      console.error('Failed to fetch bookings:', err);
      if (err.response?.status === 401) {
        onOpenLogin?.();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    const handleAuthChanged = () => {
      fetchBookings();
    };

    window.addEventListener('up_admin_auth_changed', handleAuthChanged);
    return () => {
      window.removeEventListener('up_admin_auth_changed', handleAuthChanged);
    };
  }, [statusFilter]);

  const handleOpenAssignmentModal = (booking: BeautyBooking) => {
    const assignable = selectAssignableBooking(booking);
    if (!assignable) {
      return;
    }
    setSelectedBookingForAssignment(assignable);
  };

  const hasPartnerRejection = (booking: BeautyBooking): boolean => {
    if (booking.lastRejection) return true;
    return Boolean(
      booking.assignmentHistory?.some((h) => h.assignmentStatus === 'rejected')
    );
  };

  const getLatestRejection = (booking: BeautyBooking) => {
    if (booking.lastRejection) return booking.lastRejection;
    return (
      booking.assignmentHistory?.find((h) => h.assignmentStatus === 'rejected') ||
      null
    );
  };

  const todayIsoKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const displayedBookings = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter === 'rejected_by_partner' && !hasPartnerRejection(b)) {
        return false;
      }
      if (dateFilter === 'TODAY' && !(b.bookingDate || '').startsWith(todayIsoKey)) {
        return false;
      }
      if (q) {
        const matchesRef = (b.bookingReference || '').toLowerCase().includes(q);
        const matchesCustomer = (b.customerName || '').toLowerCase().includes(q);
        const matchesPhone = (b.customerPhone || '').toLowerCase().includes(q);
        const matchesCity = (b.city || '').toLowerCase().includes(q);
        const matchesService = b.items?.some((i) =>
          (i.serviceName || '').toLowerCase().includes(q)
        );
        if (
          !matchesRef &&
          !matchesCustomer &&
          !matchesPhone &&
          !matchesCity &&
          !matchesService
        ) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, statusFilter, dateFilter, searchTerm, todayIsoKey]);

  const queueStats = useMemo(() => {
    const total = bookings.length;
    const totalValue = bookings.reduce((s, b) => s + Number(b.subtotal || 0), 0);
    const unassignedCount = bookings.filter(
      (b) => b.bookingStatus === 'awaiting_assignment'
    ).length;
    const rejectedCount = bookings.filter(hasPartnerRejection).length;
    const activeCount = bookings.filter((b) =>
      ['assigned', 'accepted', 'en_route', 'arrived', 'in_progress'].includes(
        b.bookingStatus
      )
    ).length;
    const completedList = bookings.filter((b) => b.bookingStatus === 'completed');
    const completedValue = completedList.reduce(
      (s, b) => s + Number(b.subtotal || 0),
      0
    );

    return {
      total,
      totalValue,
      unassignedCount,
      rejectedCount,
      activeCount,
      completedCount: completedList.length,
      completedValue,
    };
  }, [bookings]);

  const handleExportCsv = () => {
    if (displayedBookings.length === 0) return;
    const headers = [
      'Booking Ref',
      'Date',
      'Time Slot',
      'Customer Name',
      'Customer Phone',
      'City',
      'Services',
      'Subtotal',
      'Advance Paid',
      'Remaining Balance',
      'Payment Status',
      'Booking Status',
      'Assigned Beautician',
    ];
    const rows = displayedBookings.map((b) => [
      b.bookingReference,
      b.bookingDate,
      `"${(b.timeSlot || '').replace(/"/g, '""')}"`,
      `"${(b.customerName || '').replace(/"/g, '""')}"`,
      b.customerPhone,
      `"${(b.city || '').replace(/"/g, '""')}"`,
      `"${b.items.map((i) => i.serviceName).join(', ').replace(/"/g, '""')}"`,
      String(b.subtotal),
      String(b.advanceAmount),
      String(b.remainingAmount),
      b.paymentStatus,
      b.bookingStatus,
      b.assignedBeautician
        ? `"${b.assignedBeautician.fullName} (${b.assignedBeautician.beauticianCode})"`
        : 'Unassigned',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `urban-power-bookings-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      pending_payment: { bg: '#FEF3C7', text: '#B45309', label: 'Draft (Pending Payment)' },
      payment_failed: { bg: '#FEE2E2', text: '#991B1B', label: 'Payment Failed' },
      confirmed: { bg: '#DBEAFE', text: '#1E40AF', label: 'Confirmed (Paid)' },
      awaiting_assignment: { bg: '#FEE2E2', text: '#DC2626', label: 'Action Needed: Unassigned' },
      assigned: { bg: '#FCE7F3', text: '#BE185D', label: 'Assigned to Partner' },
      accepted: { bg: '#E0E7FF', text: '#3730A3', label: 'Accepted by Partner' },
      en_route: { bg: '#CFFAFE', text: '#0E7490', label: 'Partner En Route' },
      arrived: { bg: '#FCE7F3', text: '#BE185D', label: 'Partner Arrived' },
      in_progress: { bg: '#DCFCE7', text: '#15803D', label: 'Service In Progress' },
      completed: { bg: '#F1F5F9', text: '#475569', label: 'Completed' },
      cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
    };

    const c = config[status] || {
      bg: '#F1F5F9',
      text: '#475569',
      label: status || 'Unknown Status',
    };

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '700',
          backgroundColor: c.bg,
          color: c.text,
        }}
      >
        {c.label}
      </span>
    );
  };

  const renderPaymentBadge = (booking: BeautyBooking, includeTestId = true) => {
    const paymentBadge = getPaymentBadgeInfo(booking);
    const toneColors: Record<PaymentBadgeTone, { bg: string; text: string; border: string }> = {
      paid: { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' },
      warning: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
      danger: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
      neutral: { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
    };
    const palette = toneColors[paymentBadge.tone];

    return (
      <div style={{ marginTop: 4 }}>
        <span
          data-testid={includeTestId ? `payment-badge-${booking.id}` : undefined}
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: '700',
            padding: '2px 8px',
            borderRadius: '6px',
            backgroundColor: palette.bg,
            color: palette.text,
            border: `1px solid ${palette.border}`,
          }}
        >
          {paymentBadge.label}
        </span>
        {paymentBadge.sublabel && (
          <span style={{ display: 'block', fontSize: '11px', color: '#64748B', marginTop: 2 }}>
            {paymentBadge.sublabel}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="admin-container" style={styles.container}>
      {/* Top Header */}
      <div className="admin-header-row" style={styles.headerRow}>
        <div className="admin-header-title-group">
          <h2 className="admin-page-title" style={styles.pageTitle}>
            Appointments & Assignment Queue
          </h2>
          <p className="admin-page-subtitle" style={styles.pageSubtitle}>
            Manage incoming doorstep beauty appointments, inspect partner rejections, and click any order for full details.
          </p>
        </div>

        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-outline" onClick={handleExportCsv}>
            <Download size={15} />
            Export CSV
          </button>
          <button
            className="admin-btn admin-btn-outline"
            style={styles.refreshBtn}
            onClick={fetchBookings}
          >
            <RefreshCw size={16} style={{ marginRight: 6 }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Live Operations KPI Summary Cards */}
      <div className="admin-kpi-grid">
        <div
          className="admin-kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => setStatusFilter('ALL')}
        >
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Total Bookings</span>
            <div className="admin-kpi-icon" style={{ backgroundColor: '#FCE7F3', color: '#DB2777' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div className="admin-kpi-value">{queueStats.total}</div>
          <div className="admin-kpi-sub">
            <span>Gross Value: ₹{queueStats.totalValue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div
          className="admin-kpi-card"
          style={{
            cursor: 'pointer',
            borderColor: queueStats.unassignedCount > 0 ? '#FECACA' : undefined,
          }}
          onClick={() => setStatusFilter('awaiting_assignment')}
        >
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Unassigned Queue</span>
            <div className="admin-kpi-icon" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: '#DC2626' }}>
            {queueStats.unassignedCount}
          </div>
          <div className="admin-kpi-sub">
            <span>Paid bookings awaiting partner dispatch</span>
          </div>
        </div>

        <div
          className="admin-kpi-card"
          style={{
            cursor: 'pointer',
            borderColor: queueStats.rejectedCount > 0 ? '#FDE68A' : undefined,
          }}
          onClick={() => setStatusFilter('rejected_by_partner')}
        >
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Rejected by Partner</span>
            <div className="admin-kpi-icon" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: '#B45309' }}>
            {queueStats.rejectedCount}
          </div>
          <div className="admin-kpi-sub">
            <span>Declined orders with partner reason</span>
          </div>
        </div>

        <div
          className="admin-kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => setStatusFilter('in_progress')}
        >
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Active & Completed</span>
            <div className="admin-kpi-icon" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: '#15803D' }}>
            {queueStats.activeCount} Active / {queueStats.completedCount} Done
          </div>
          <div className="admin-kpi-sub">
            <Activity size={13} color="#15803D" />
            <span>Completed Value: ₹{queueStats.completedValue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="admin-toolbar" style={styles.toolbar}>
        <div className="admin-search-box" style={styles.searchBox}>
          <Search size={16} color="#94A3B8" style={{ marginRight: 8, flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by reference, customer, phone, city or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBookings()}
            className="admin-search-input"
            style={styles.searchInput}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
            >
              <X size={14} color="#94A3B8" />
            </button>
          )}
        </div>

        <div className="admin-filter-controls">
          <div style={styles.filterTabs}>
            {[
              'ALL',
              'awaiting_assignment',
              'rejected_by_partner',
              'assigned',
              'accepted',
              'in_progress',
              'completed',
            ].map((st) => (
              <button
                key={st}
                style={{
                  ...styles.filterBtn,
                  ...(statusFilter === st ? styles.filterBtnActive : {}),
                }}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'ALL'
                  ? 'All Bookings'
                  : st === 'awaiting_assignment'
                  ? '🚨 Unassigned Queue'
                  : st === 'rejected_by_partner'
                  ? '⚠️ Rejected by Partner'
                  : st === 'assigned'
                  ? 'Assigned'
                  : st === 'accepted'
                  ? 'Accepted'
                  : st === 'in_progress'
                  ? 'In Progress'
                  : 'Completed'}
              </button>
            ))}
          </div>

          <select
            className="admin-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'ALL' | 'TODAY')}
            aria-label="Filter by date"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">📅 Today's Schedule ({todayIsoKey})</option>
          </select>
        </div>
      </div>

      {/* Bookings Table & Mobile Cards */}
      <div className="admin-table-card" style={styles.tableCard}>
        {loading ? (
          <div style={styles.loadingBox}>Loading appointments...</div>
        ) : displayedBookings.length === 0 ? (
          <div style={styles.emptyBox}>No appointments found matching current filters.</div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW */}
            <div className="admin-table-scroll desktop-only-table">
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Booking Ref</th>
                    <th style={styles.th}>Schedule</th>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Services</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Assigned Partner / Rejection</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedBookings.map((b) => {
                    const eligibility = getAssignmentEligibility(b);
                    const latestRejection = getLatestRejection(b);
                    return (
                      <tr
                        key={b.id}
                        data-testid={`booking-row-${b.id}`}
                        style={{
                          ...styles.tr,
                          cursor: 'pointer',
                          ...(latestRejection && !b.assignedBeautician
                            ? { backgroundColor: '#FFF5F5' }
                            : {}),
                        }}
                        onClick={() => setSelectedBookingForDetail(b)}
                        title="Click to view complete order details"
                      >
                        <td style={styles.td}>
                          <span style={styles.bookingRef}>{b.bookingReference}</span>
                          <span style={styles.clickHint}>Click to view details</span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.slotBox}>
                            <Clock size={12} color="#DB2777" style={{ marginRight: 4 }} />
                            <span>{b.bookingDate}</span>
                          </div>
                          <span style={styles.subtext}>{b.timeSlot}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.customerName}>{b.customerName}</span>
                          <span style={styles.subtext}>{b.customerPhone}</span>
                          <span style={styles.addressLine}>
                            <MapPin size={11} style={{ display: 'inline', marginRight: 2 }} />
                            {b.city}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontWeight: '600', fontSize: '13px' }}>
                            {b.items.length} service{b.items.length !== 1 ? 's' : ''} ({b.totalDurationMinutes}m)
                          </span>
                          <span style={styles.subtext}>
                            {b.items.map((i) => i.serviceName).join(', ')}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', fontWeight: '800' }}>
                            <IndianRupee size={12} />
                            <span>{b.subtotal}</span>
                          </div>
                          {renderPaymentBadge(b, true)}
                        </td>
                        <td style={styles.td}>
                          {renderStatusBadge(b.bookingStatus)}
                          {latestRejection && (
                            <div style={{ marginTop: 6 }}>
                              <span
                                data-testid={`rejected-badge-${b.id}`}
                                style={styles.rejectedInlineBadge}
                              >
                                <XCircle size={11} style={{ marginRight: 4 }} />
                                Rejected by Partner
                              </span>
                            </div>
                          )}
                        </td>
                        <td style={styles.td}>
                          {b.assignedBeautician ? (
                            <div>
                              <span style={styles.beauticianName}>{b.assignedBeautician.fullName}</span>
                              <span style={styles.subtext}>
                                {b.assignedBeautician.beauticianCode} • {b.assignedBeautician.phone}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#EF4444', fontWeight: '600', fontSize: '12px' }}>
                              Not Assigned
                            </span>
                          )}

                          {latestRejection && (
                            <div style={styles.rejectionCallout} data-testid={`rejection-info-${b.id}`}>
                              <div style={styles.rejectionCalloutHeader}>
                                Declined by{' '}
                                <strong>
                                  {latestRejection.beauticianName ||
                                    latestRejection.beauticianCode ||
                                    'Partner'}
                                </strong>
                              </div>
                              {latestRejection.rejectionReason && (
                                <div style={styles.rejectionCalloutReason}>
                                  "{latestRejection.rejectionReason}"
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td
                          style={styles.td}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={styles.actionBtnGroup}>
                            <button
                              type="button"
                              data-testid={`view-details-btn-${b.id}`}
                              style={styles.viewDetailsBtn}
                              onClick={() => setSelectedBookingForDetail(b)}
                              title="View full booking details, proof photo & assignment history"
                            >
                              <Eye size={13} style={{ marginRight: 4 }} />
                              Details
                            </button>

                            <button
                              type="button"
                              data-testid={`assign-btn-${b.id}`}
                              disabled={!eligibility.isAssignable}
                              aria-disabled={!eligibility.isAssignable}
                              title={eligibility.disabledReason || 'Open beautician assignment modal'}
                              style={{
                                ...styles.assignBtn,
                                ...(b.assignedBeautician && eligibility.isAssignable
                                  ? styles.reassignBtn
                                  : {}),
                                ...(!eligibility.isAssignable ? styles.assignBtnDisabled : {}),
                              }}
                              onClick={() => handleOpenAssignmentModal(b)}
                            >
                              {eligibility.isAssignable ? (
                                <UserCheck size={14} style={{ marginRight: 4 }} />
                              ) : (
                                <Lock size={13} style={{ marginRight: 4 }} />
                              )}
                              {eligibility.buttonLabel}
                            </button>
                          </div>
                          {!eligibility.isAssignable && eligibility.disabledReason && (
                            <span style={styles.disabledHint}>{eligibility.disabledReason}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE & TABLET BOOKING CARDS VIEW */}
            <div className="mobile-only-cards booking-card-grid">
              {displayedBookings.map((b) => {
                const eligibility = getAssignmentEligibility(b);
                const latestRejection = getLatestRejection(b);
                return (
                  <div
                    key={`mobile-${b.id}`}
                    className="booking-mobile-card"
                    style={
                      latestRejection && !b.assignedBeautician
                        ? { borderColor: '#FCA5A5', backgroundColor: '#FFFBFB' }
                        : undefined
                    }
                    onClick={() => setSelectedBookingForDetail(b)}
                  >
                    <div className="booking-mobile-card-header">
                      <div>
                        <span style={styles.bookingRef}>{b.bookingReference}</span>
                        <span style={styles.subtext}>
                          {b.bookingDate} • {b.timeSlot}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        {renderStatusBadge(b.bookingStatus)}
                        {latestRejection && (
                          <span style={styles.rejectedInlineBadge}>
                            <XCircle size={11} style={{ marginRight: 4 }} />
                            Rejected by Partner
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="booking-mobile-card-body">
                      <div className="beautician-card-row">
                        <div>
                          <span style={styles.customerName}>{b.customerName}</span>
                          <span style={styles.subtext}>
                            {b.customerPhone} • {b.city}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                            ₹{b.subtotal}
                          </div>
                          {renderPaymentBadge(b, false)}
                        </div>
                      </div>

                      <div
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: '12px',
                        }}
                      >
                        <strong>
                          {b.items.length} service{b.items.length !== 1 ? 's' : ''} ({b.totalDurationMinutes}m):
                        </strong>{' '}
                        {b.items.map((i) => i.serviceName).join(', ')}
                      </div>

                      <div className="beautician-card-row" style={{ fontSize: '12px' }}>
                        <span style={{ color: '#64748B' }}>Assigned Partner:</span>
                        {b.assignedBeautician ? (
                          <strong style={{ color: '#0F172A' }}>
                            {b.assignedBeautician.fullName} ({b.assignedBeautician.beauticianCode})
                          </strong>
                        ) : (
                          <strong style={{ color: '#DC2626' }}>Not Assigned</strong>
                        )}
                      </div>

                      {latestRejection && (
                        <div style={{ ...styles.rejectionCallout, maxWidth: '100%' }}>
                          <div style={styles.rejectionCalloutHeader}>
                            Declined by{' '}
                            <strong>
                              {latestRejection.beauticianName ||
                                latestRejection.beauticianCode ||
                                'Partner'}
                            </strong>
                          </div>
                          {latestRejection.rejectionReason && (
                            <div style={styles.rejectionCalloutReason}>
                              "{latestRejection.rejectionReason}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      className="booking-mobile-card-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        onClick={() => setSelectedBookingForDetail(b)}
                      >
                        <Eye size={13} />
                        Full Details
                      </button>
                      <button
                        type="button"
                        disabled={!eligibility.isAssignable}
                        className="admin-btn admin-btn-sm"
                        style={{
                          ...styles.assignBtn,
                          ...(b.assignedBeautician && eligibility.isAssignable
                            ? styles.reassignBtn
                            : {}),
                          ...(!eligibility.isAssignable ? styles.assignBtnDisabled : {}),
                        }}
                        onClick={() => handleOpenAssignmentModal(b)}
                      >
                        {eligibility.isAssignable ? (
                          <UserCheck size={14} />
                        ) : (
                          <Lock size={13} />
                        )}
                        {eligibility.buttonLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Order Full Details Modal */}
      {selectedBookingForDetail && (
        <BookingDetailModal
          booking={selectedBookingForDetail}
          onClose={() => setSelectedBookingForDetail(null)}
          onOpenAssignModal={(bookingToAssign) => {
            setSelectedBookingForDetail(null);
            handleOpenAssignmentModal(bookingToAssign);
          }}
        />
      )}

      {/* Assignment Modal Drawer */}
      {selectedBookingForAssignment && (
        <AssignmentModal
          booking={selectedBookingForAssignment}
          onClose={() => setSelectedBookingForAssignment(null)}
          onAssigned={() => {
            setSelectedBookingForAssignment(null);
            fetchBookings();
          }}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px 32px',
    maxWidth: '1440px',
    margin: '0 auto',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '2px',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    cursor: 'pointer',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '8px 14px',
    width: '340px',
    maxWidth: '100%',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '13px',
    color: '#0F172A',
    backgroundColor: 'transparent',
  },
  filterTabs: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #E2E8F0',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: '#DB2777',
    color: '#ffffff',
    borderColor: '#DB2777',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
  },
  loadingBox: {
    padding: '40px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '14px',
  },
  emptyBox: {
    padding: '40px',
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
    padding: '12px 16px',
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  tr: {
    borderBottom: '1px solid #F8EEF3',
    transition: 'background-color 0.15s ease',
  },
  td: {
    padding: '14px 16px',
    verticalAlign: 'top',
  },
  bookingRef: {
    fontSize: '13px',
    fontWeight: '800',
    color: '#0F172A',
    display: 'block',
  },
  clickHint: {
    display: 'block',
    fontSize: '10px',
    fontWeight: '600',
    color: '#64748B',
    marginTop: '3px',
  },
  slotBox: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: '600',
    color: '#0F172A',
  },
  subtext: {
    display: 'block',
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px',
  },
  customerName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
    display: 'block',
  },
  addressLine: {
    fontSize: '11px',
    color: '#64748B',
    display: 'block',
    marginTop: '2px',
  },
  beauticianName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
    display: 'block',
  },
  rejectedInlineBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    border: '1px solid #FCA5A5',
    borderRadius: '10px',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: '700',
  },
  rejectionCallout: {
    marginTop: '6px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    borderRadius: '8px',
    padding: '6px 8px',
    maxWidth: '240px',
  },
  rejectionCalloutHeader: {
    fontSize: '11px',
    color: '#991B1B',
  },
  rejectionCalloutReason: {
    fontSize: '11px',
    color: '#7F1D1D',
    fontStyle: 'italic',
    marginTop: '2px',
    lineHeight: 1.3,
  },
  actionBtnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  viewDetailsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    color: '#334155',
    border: '1px solid #CBD5E1',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  assignBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#DB2777',
    color: '#ffffff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  reassignBtn: {
    backgroundColor: '#475569',
  },
  assignBtnDisabled: {
    backgroundColor: '#E2E8F0',
    color: '#64748B',
    cursor: 'not-allowed',
  },
  disabledHint: {
    display: 'block',
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '4px',
    maxWidth: '170px',
    lineHeight: 1.3,
  },
};
