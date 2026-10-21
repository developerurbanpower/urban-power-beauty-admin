import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Calendar,
  IndianRupee,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Camera,
  UserCheck,
  ExternalLink,
  FileText,
  History,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { BeautyBooking, BookingAssignmentHistoryEntry } from '../types/beauty';
import {
  getAssignmentEligibility,
  getPaymentBadgeInfo,
} from '../utils/assignmentEligibility';

interface BookingDetailModalProps {
  booking: BeautyBooking;
  onClose: () => void;
  onOpenAssignModal?: (booking: BeautyBooking) => void;
}

const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  onClose,
  onOpenAssignModal,
}) => {
  const [currentBooking, setCurrentBooking] = useState<BeautyBooking>(booking);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    setCurrentBooking(booking);
    if (typeof adminApi.getBookingDetail !== 'function') {
      return;
    }
    let mounted = true;
    setLoadingDetail(true);
    adminApi
      .getBookingDetail(booking.id)
      .then((latest) => {
        if (mounted && latest && latest.id) {
          setCurrentBooking(latest);
        }
      })
      .catch(() => {
        // Keep initial booking data if detail endpoint fails
      })
      .finally(() => {
        if (mounted) {
          setLoadingDetail(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [booking]);

  const eligibility = getAssignmentEligibility(currentBooking);
  const paymentBadge = getPaymentBadgeInfo(currentBooking);
  const historyList: BookingAssignmentHistoryEntry[] = currentBooking.assignmentHistory || [];
  const latestRejection: BookingAssignmentHistoryEntry | null =
    currentBooking.lastRejection ||
    historyList.find((h) => h.assignmentStatus === 'rejected') ||
    null;

  const getBookingStatusInfo = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pending_payment: { bg: '#FEF3C7', text: '#B45309', label: 'Draft (Pending Payment)' },
      payment_failed: { bg: '#FEE2E2', text: '#991B1B', label: 'Payment Failed' },
      confirmed: { bg: '#DBEAFE', text: '#1E40AF', label: 'Confirmed (Paid)' },
      awaiting_assignment: { bg: '#FEE2E2', text: '#DC2626', label: 'Action Needed: Unassigned' },
      assigned: { bg: '#EDE9FE', text: '#6D28D9', label: 'Assigned to Partner' },
      accepted: { bg: '#E0E7FF', text: '#3730A3', label: 'Accepted by Partner' },
      en_route: { bg: '#CFFAFE', text: '#0E7490', label: 'Partner En Route' },
      arrived: { bg: '#FCE7F3', text: '#BE185D', label: 'Partner Arrived' },
      in_progress: { bg: '#DCFCE7', text: '#15803D', label: 'Service In Progress' },
      completed: { bg: '#DCFCE7', text: '#166534', label: 'Completed' },
      cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
    };
    return (
      map[status] || {
        bg: '#F1F5F9',
        text: '#475569',
        label: status || 'Unknown Status',
      }
    );
  };

  const getAssignmentStatusBadge = (status: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'rejected') {
      return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5', label: 'Rejected by Partner' };
    }
    if (normalized === 'accepted') {
      return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', label: 'Accepted' };
    }
    if (normalized === 'assigned') {
      return { bg: '#EDE9FE', text: '#6D28D9', border: '#C4B5FD', label: 'Assigned (Awaiting Response)' };
    }
    if (normalized === 'reassigned') {
      return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', label: 'Superseded / Reassigned' };
    }
    return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', label: status };
  };

  const statusInfo = getBookingStatusInfo(currentBooking.bookingStatus);
  const mapsQuery =
    currentBooking.latitude && currentBooking.longitude
      ? `${currentBooking.latitude},${currentBooking.longitude}`
      : encodeURIComponent(`${currentBooking.addressText}, ${currentBooking.city}`);

  return (
    <div
      className="admin-modal-overlay"
      style={styles.overlay}
      onClick={onClose}
      data-testid="booking-detail-modal"
    >
      <div
        className="admin-modal-box"
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.headerTopRow}>
              <span style={styles.refBadge}>{currentBooking.bookingReference}</span>
              <span
                style={{
                  ...styles.statusPill,
                  backgroundColor: statusInfo.bg,
                  color: statusInfo.text,
                }}
              >
                {statusInfo.label}
              </span>
              <span style={styles.paymentPill}>{paymentBadge.label}</span>
              {loadingDetail && (
                <span style={{ fontSize: '11px', color: '#64748B' }}>Syncing latest details...</span>
              )}
            </div>
            <h2 style={styles.title}>Complete Order & Service Details</h2>
            <p style={styles.subtitle}>
              Booking ID: <code>{currentBooking.id}</code> • Created:{' '}
              {formatDateTime(currentBooking.createdAt)}
              {currentBooking.updatedAt ? ` • Updated: ${formatDateTime(currentBooking.updatedAt)}` : ''}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onOpenAssignModal && eligibility.isAssignable && (
              <button
                type="button"
                data-testid="detail-modal-assign-btn"
                style={styles.assignHeaderBtn}
                onClick={() => {
                  onClose();
                  onOpenAssignModal(currentBooking);
                }}
              >
                <UserCheck size={15} style={{ marginRight: 6 }} />
                {currentBooking.assignedBeautician ? 'Reassign Partner' : 'Assign Partner'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={styles.closeBtn}
              aria-label="Close order details modal"
            >
              <X size={20} color="#475569" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={styles.body}>
          {/* Partner Rejection Alert Banner if rejected */}
          {latestRejection && (
            <div style={styles.rejectionAlertBanner} data-testid="detail-rejection-banner">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <XCircle size={22} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={styles.rejectionBannerTitle}>
                    Order Rejected by Beautician Partner:{' '}
                    <strong>
                      {latestRejection.beauticianName || 'Partner'}{' '}
                      {latestRejection.beauticianCode ? `(${latestRejection.beauticianCode})` : ''}
                    </strong>
                    {latestRejection.beauticianPhone ? ` • ${latestRejection.beauticianPhone}` : ''}
                  </div>
                  <div style={styles.rejectionReasonBox}>
                    <strong>Rejection Reason:</strong>{' '}
                    {latestRejection.rejectionReason || 'No reason specified by partner'}
                  </div>
                  <div style={styles.rejectionMeta}>
                    Rejected at: {formatDateTime(latestRejection.rejectedAt)} • Current Order Status:{' '}
                    <strong>{statusInfo.label}</strong>
                  </div>
                </div>
                {onOpenAssignModal && eligibility.isAssignable && (
                  <button
                    type="button"
                    style={styles.reassignUrgentBtn}
                    onClick={() => {
                      onClose();
                      onOpenAssignModal(currentBooking);
                    }}
                  >
                    <UserCheck size={14} style={{ marginRight: 6 }} />
                    Assign New Partner
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2-Column Top Grid: Customer & Schedule/Partner */}
          <div style={styles.twoColGrid}>
            {/* Customer & Doorstep Address Card */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                <User size={15} color="#7C3AED" style={{ marginRight: 6 }} />
                Customer & Doorstep Location
              </h3>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Customer Name</span>
                <span style={styles.infoValueStrong}>{currentBooking.customerName}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Phone Number</span>
                <a href={`tel:${currentBooking.customerPhone}`} style={styles.phoneLink}>
                  <Phone size={12} style={{ marginRight: 4 }} />
                  {currentBooking.customerPhone}
                </a>
              </div>

              {currentBooking.customerEmail && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Email</span>
                  <span style={styles.infoValue}>
                    <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {currentBooking.customerEmail}
                  </span>
                </div>
              )}

              <div style={styles.divider} />

              <div style={{ marginBottom: 8 }}>
                <span style={styles.infoLabel}>Full Service Address</span>
                <div style={styles.addressBlock}>
                  <MapPin size={14} color="#7C3AED" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>
                      {currentBooking.addressText}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: 2 }}>
                      {currentBooking.city}
                      {currentBooking.pincode ? ` - ${currentBooking.pincode}` : ''}
                    </div>
                    {(currentBooking.latitude || currentBooking.longitude) && (
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: 2 }}>
                        GPS: {currentBooking.latitude}, {currentBooking.longitude}
                      </div>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.mapLink}
                    >
                      <ExternalLink size={11} style={{ marginRight: 4 }} />
                      Open Location in Google Maps
                    </a>
                  </div>
                </div>
              </div>

              {currentBooking.notes && (
                <div style={styles.noteCallout}>
                  <FileText size={13} color="#6D28D9" style={{ marginRight: 6, flexShrink: 0 }} />
                  <div>
                    <strong>Customer Note:</strong> {currentBooking.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Schedule, Current Partner & OTP Verification Status */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                <Calendar size={15} color="#7C3AED" style={{ marginRight: 6 }} />
                Appointment Schedule & Assigned Partner
              </h3>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Appointment Date</span>
                <span style={styles.infoValueStrong}>{currentBooking.bookingDate}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Time Slot</span>
                <span style={styles.infoValueStrong}>
                  <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {currentBooking.timeSlot} ({currentBooking.totalDurationMinutes} mins)
                </span>
              </div>

              <div style={styles.divider} />

              <div style={{ marginBottom: 10 }}>
                <span style={styles.infoLabel}>Currently Assigned Beautician</span>
                {currentBooking.assignedBeautician ? (
                  <div style={styles.partnerBox}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                        {currentBooking.assignedBeautician.fullName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: 2 }}>
                        Code: <strong>{currentBooking.assignedBeautician.beauticianCode}</strong> •{' '}
                        {currentBooking.assignedBeautician.phone}
                      </div>
                    </div>
                    <span style={styles.ratingBadge}>
                      {Number(currentBooking.assignedBeautician.ratingAverage || 5).toFixed(1)} ★
                    </span>
                  </div>
                ) : (
                  <div style={styles.unassignedBox}>
                    <AlertTriangle size={14} color="#DC2626" style={{ marginRight: 6 }} />
                    <span>No beautician currently assigned to this order</span>
                  </div>
                )}
              </div>

              <div style={styles.divider} />

              {/* OTP & Execution Checkpoints */}
              <span style={styles.infoLabel}>Service Security & OTP Checkpoints</span>
              <div style={styles.otpGrid}>
                <div
                  style={{
                    ...styles.otpCard,
                    borderColor: currentBooking.startOtpVerified ? '#86EFAC' : '#E2E8F0',
                    backgroundColor: currentBooking.startOtpVerified ? '#F0FDF4' : '#F8FAFC',
                  }}
                >
                  <div style={styles.otpTitleRow}>
                    <ShieldCheck
                      size={14}
                      color={currentBooking.startOtpVerified ? '#15803D' : '#64748B'}
                    />
                    <span style={styles.otpTitle}>Start Service OTP</span>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: currentBooking.startOtpVerified ? '#15803D' : '#64748B',
                    }}
                  >
                    {currentBooking.startOtpVerified ? '✓ Verified' : 'Pending'}
                  </div>
                  {currentBooking.startOtpVerifiedAt && (
                    <div style={{ fontSize: '10px', color: '#475569', marginTop: 2 }}>
                      {formatDateTime(currentBooking.startOtpVerifiedAt)}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    ...styles.otpCard,
                    borderColor: currentBooking.completionVerified ? '#86EFAC' : '#E2E8F0',
                    backgroundColor: currentBooking.completionVerified ? '#F0FDF4' : '#F8FAFC',
                  }}
                >
                  <div style={styles.otpTitleRow}>
                    <CheckCircle
                      size={14}
                      color={currentBooking.completionVerified ? '#15803D' : '#64748B'}
                    />
                    <span style={styles.otpTitle}>Completion OTP</span>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: currentBooking.completionVerified ? '#15803D' : '#64748B',
                    }}
                  >
                    {currentBooking.completionVerified ? '✓ Verified' : 'Pending'}
                  </div>
                  {currentBooking.completionVerifiedAt && (
                    <div style={{ fontSize: '10px', color: '#475569', marginTop: 2 }}>
                      {formatDateTime(currentBooking.completionVerifiedAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Middle Grid: Booked Services + Financial & Doorstep Cash */}
          <div style={styles.twoColGrid}>
            {/* Booked Services Table */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                Booked Treatments & Services ({currentBooking.items.length})
              </h3>
              <table style={styles.serviceTable}>
                <thead>
                  <tr>
                    <th style={styles.serviceTh}>Treatment</th>
                    <th style={styles.serviceTh}>Duration</th>
                    <th style={styles.serviceTh}>Qty</th>
                    <th style={{ ...styles.serviceTh, textAlign: 'right' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBooking.items.map((item) => (
                    <tr key={item.id} style={styles.serviceTr}>
                      <td style={styles.serviceTd}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{item.serviceName}</div>
                        {item.categoryName && (
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            {item.categoryName}
                          </div>
                        )}
                      </td>
                      <td style={styles.serviceTd}>{item.durationMinutes} mins</td>
                      <td style={styles.serviceTd}>×{item.quantity}</td>
                      <td style={{ ...styles.serviceTd, textAlign: 'right', fontWeight: 700 }}>
                        ₹{item.price * item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financials & Doorstep Cash Collection */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                <IndianRupee size={15} color="#7C3AED" style={{ marginRight: 6 }} />
                Payment & Doorstep Cash Collection
              </h3>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Order Subtotal</span>
                <span style={styles.infoValueStrong}>₹{currentBooking.subtotal}</span>
              </div>

              {Number(currentBooking.discountAmount || 0) > 0 && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Discount</span>
                  <span style={{ ...styles.infoValue, color: '#15803D' }}>
                    -₹{currentBooking.discountAmount}
                  </span>
                </div>
              )}

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Online Advance Paid</span>
                <span style={{ ...styles.infoValueStrong, color: '#15803D' }}>
                  ₹{currentBooking.advanceAmount}
                </span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Remaining Doorstep Balance</span>
                <span
                  style={{
                    ...styles.infoValueStrong,
                    color: currentBooking.remainingAmount > 0 ? '#B45309' : '#15803D',
                  }}
                >
                  ₹{currentBooking.remainingAmount}
                </span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Payment Mode / Status</span>
                <span style={styles.infoValue}>
                  {currentBooking.paymentModeSelected} •{' '}
                  <strong>{currentBooking.paymentStatus}</strong>
                </span>
              </div>

              <div style={styles.divider} />

              <div
                style={{
                  ...styles.cashStatusBox,
                  backgroundColor: currentBooking.cashCollected ? '#F0FDF4' : '#FFFBEB',
                  borderColor: currentBooking.cashCollected ? '#86EFAC' : '#FDE68A',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A' }}>
                  Doorstep Cash Collection:{' '}
                  <span
                    style={{
                      color: currentBooking.cashCollected ? '#15803D' : '#B45309',
                    }}
                  >
                    {currentBooking.cashCollected
                      ? `Collected (₹${currentBooking.cashCollectedAmount ?? 0})`
                      : currentBooking.remainingAmount > 0
                      ? `Pending Collection (₹${currentBooking.remainingAmount} due)`
                      : 'No Doorstep Cash Due (Prepaid)'}
                  </span>
                </div>
                {currentBooking.cashCollectedAt && (
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: 4 }}>
                    Collected at: {formatDateTime(currentBooking.cashCollectedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Service Completion Proof Photo (Cloudinary) */}
          {currentBooking.completionPhotoUrl && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                <Camera size={15} color="#7C3AED" style={{ marginRight: 6 }} />
                Service Completion Proof Photo (Cloudinary Verified)
              </h3>
              <div style={styles.proofContainer}>
                <img
                  src={currentBooking.completionPhotoUrl}
                  alt="Service completion proof"
                  style={styles.proofImage}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>
                    Mandatory Service Completion Photo Uploaded
                  </div>
                  <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 10px' }}>
                    Uploaded by beautician at the time of service completion verification.
                  </p>
                  {currentBooking.completionPhotoPublicId && (
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: 8 }}>
                      Cloudinary ID: <code>{currentBooking.completionPhotoPublicId}</code>
                    </div>
                  )}
                  <a
                    href={currentBooking.completionPhotoUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.openImageBtn}
                  >
                    <ExternalLink size={13} style={{ marginRight: 6 }} />
                    Open Full Resolution Photo
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Partner Assignment & Rejection History */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <History size={15} color="#7C3AED" style={{ marginRight: 6 }} />
              Partner Assignment & Rejection History ({historyList.length})
            </h3>

            {historyList.length === 0 ? (
              <div style={styles.emptyHistory}>
                No partner assignment history recorded for this booking yet.
              </div>
            ) : (
              <div style={styles.historyList}>
                {historyList.map((entry) => {
                  const badge = getAssignmentStatusBadge(entry.assignmentStatus);
                  const isRejected = entry.assignmentStatus === 'rejected';
                  return (
                    <div
                      key={entry.id}
                      data-testid={`assignment-history-${entry.assignmentStatus}`}
                      style={{
                        ...styles.historyItem,
                        borderColor: isRejected ? '#FCA5A5' : '#E2E8F0',
                        backgroundColor: isRejected ? '#FEF2F2' : '#F8FAFC',
                      }}
                    >
                      <div style={styles.historyTopRow}>
                        <div>
                          <span style={styles.historyPartnerName}>
                            {entry.beauticianName || 'Beautician Partner'}
                          </span>
                          {entry.beauticianCode && (
                            <span style={styles.historyPartnerCode}>{entry.beauticianCode}</span>
                          )}
                          {entry.beauticianPhone && (
                            <span style={styles.historyPartnerPhone}>• {entry.beauticianPhone}</span>
                          )}
                        </div>
                        <span
                          style={{
                            ...styles.historyStatusBadge,
                            backgroundColor: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div style={styles.historyTimestamps}>
                        <span>Assigned: {formatDateTime(entry.assignedAt)}</span>
                        {entry.acceptedAt && (
                          <span> • Accepted: {formatDateTime(entry.acceptedAt)}</span>
                        )}
                        {entry.rejectedAt && (
                          <span style={{ color: '#B91C1C', fontWeight: 700 }}>
                            {' '}
                            • Rejected: {formatDateTime(entry.rejectedAt)}
                          </span>
                        )}
                      </div>

                      {entry.rejectionReason && (
                        <div style={styles.historyRejectionReason}>
                          <strong>Rejection Reason:</strong> "{entry.rejectionReason}"
                        </div>
                      )}

                      {entry.adminNote && (
                        <div style={styles.historyAdminNote}>
                          <strong>Admin Note:</strong> {entry.adminNote}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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
    zIndex: 1050,
    backdropFilter: 'blur(3px)',
    padding: '20px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '96%',
    maxWidth: '960px',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.28)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '18px 24px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  headerTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '6px',
  },
  refBadge: {
    backgroundColor: '#0F172A',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 800,
    padding: '3px 10px',
    borderRadius: '6px',
    letterSpacing: '0.4px',
  },
  statusPill: {
    fontSize: '12px',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: '12px',
  },
  paymentPill: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 9px',
    borderRadius: '6px',
    backgroundColor: '#F1F5F9',
    color: '#334155',
    border: '1px solid #CBD5E1',
  },
  title: {
    fontSize: '19px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '3px',
    marginBottom: 0,
  },
  assignHeaderBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  closeBtn: {
    background: '#ffffff',
    border: '1px solid #CBD5E1',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  rejectionAlertBanner: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  rejectionBannerTitle: {
    fontSize: '14px',
    color: '#991B1B',
    marginBottom: '6px',
  },
  rejectionReasonBox: {
    backgroundColor: '#FEE2E2',
    color: '#7F1D1D',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '6px',
  },
  rejectionMeta: {
    fontSize: '11px',
    color: '#991B1B',
  },
  reassignUrgentBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  twoColGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: 800,
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginTop: 0,
    marginBottom: '12px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
    fontSize: '13px',
  },
  infoLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    display: 'block',
  },
  infoValue: {
    fontSize: '13px',
    color: '#1E293B',
  },
  infoValueStrong: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
  },
  phoneLink: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: 700,
    color: '#7C3AED',
    textDecoration: 'none',
  },
  divider: {
    height: '1px',
    backgroundColor: '#F1F5F9',
    margin: '10px 0',
  },
  addressBlock: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    backgroundColor: '#F8FAFC',
    padding: '10px 12px',
    borderRadius: '8px',
    marginTop: '6px',
    fontSize: '13px',
  },
  mapLink: {
    display: 'inline-flex',
    alignItems: 'center',
    marginTop: '6px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#7C3AED',
    textDecoration: 'none',
  },
  noteCallout: {
    display: 'flex',
    alignItems: 'flex-start',
    backgroundColor: '#F5F3FF',
    color: '#4C1D95',
    padding: '8px 10px',
    borderRadius: '8px',
    fontSize: '12px',
    marginTop: '8px',
  },
  partnerBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '10px 12px',
    marginTop: '6px',
  },
  ratingBadge: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    fontWeight: 800,
    fontSize: '12px',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  unassignedBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    color: '#B91C1C',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    marginTop: '6px',
  },
  otpGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '6px',
  },
  otpCard: {
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 10px',
  },
  otpTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginBottom: '4px',
  },
  otpTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#334155',
  },
  serviceTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  serviceTh: {
    textAlign: 'left',
    padding: '8px',
    borderBottom: '1px solid #E2E8F0',
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  serviceTr: {
    borderBottom: '1px solid #F1F5F9',
  },
  serviceTd: {
    padding: '10px 8px',
    color: '#334155',
  },
  cashStatusBox: {
    border: '1px solid #FDE68A',
    borderRadius: '8px',
    padding: '10px 12px',
  },
  proofContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  proofImage: {
    width: '140px',
    height: '140px',
    objectFit: 'cover',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
  },
  openImageBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    color: '#0F172A',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    textDecoration: 'none',
    border: '1px solid #CBD5E1',
  },
  emptyHistory: {
    fontSize: '13px',
    color: '#94A3B8',
    fontStyle: 'italic',
    padding: '8px 0',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  historyItem: {
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 14px',
  },
  historyTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  historyPartnerName: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#0F172A',
    marginRight: '8px',
  },
  historyPartnerCode: {
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#E2E8F0',
    color: '#334155',
    padding: '2px 6px',
    borderRadius: '4px',
    marginRight: '6px',
  },
  historyPartnerPhone: {
    fontSize: '12px',
    color: '#475569',
  },
  historyStatusBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 9px',
    borderRadius: '12px',
  },
  historyTimestamps: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '6px',
  },
  historyRejectionReason: {
    marginTop: '8px',
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '12px',
  },
  historyAdminNote: {
    marginTop: '6px',
    fontSize: '12px',
    color: '#475569',
  },
};
