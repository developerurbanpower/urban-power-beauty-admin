import React, { useEffect, useState } from 'react';
import { X, Sparkles, CheckCircle, AlertCircle, AlertTriangle, Clock, MapPin, Lock } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { BeautyBooking, SuggestedBeautician } from '../types/beauty';
import {
  classifyRecommendationReason,
  executeAssignmentConfirmation,
  getAssignmentEligibility,
  getCandidateCautionaryNotes,
  getPaymentBadgeInfo,
  ReasonClassificationTone,
} from '../utils/assignmentEligibility';

interface Props {
  booking: BeautyBooking;
  onClose: () => void;
  onAssigned: () => void;
  initialSuggestions?: SuggestedBeautician[];
}

export const AssignmentModal: React.FC<Props> = ({
  booking,
  onClose,
  onAssigned,
  initialSuggestions,
}) => {
  const [currentBooking, setCurrentBooking] = useState<BeautyBooking>(booking);
  const [suggestions, setSuggestions] = useState<SuggestedBeautician[]>(initialSuggestions ?? []);
  const [loading, setLoading] = useState(initialSuggestions === undefined);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentBooking(booking);
  }, [booking]);

  const refreshBookingStatus = async () => {
    if (typeof adminApi.getBookingDetail !== 'function') {
      return;
    }
    try {
      const latest = await adminApi.getBookingDetail(booking.id);
      if (latest && latest.id) {
        setCurrentBooking(latest);
      }
    } catch {
      // Preserve existing booking prop if detail refresh fails
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    refreshBookingStatus();

    adminApi
      .getSuggestions(booking.id)
      .then((data) => {
        if (mounted) {
          setSuggestions(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.response?.data?.error?.message || err.message || 'Failed to load beautician recommendations');
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [booking.id]);

  const eligibility = getAssignmentEligibility(currentBooking);
  const paymentBadge = getPaymentBadgeInfo(currentBooking);

  const handleConfirmAssignment = async (beauticianId: string) => {
    setSubmittingId(beauticianId);
    setError(null);

    const result = await executeAssignmentConfirmation({
      booking: currentBooking,
      beauticianId,
      adminNote,
      assignBeautician: (bId, pId, note) => adminApi.assignBeautician(bId, pId, note),
      getBookingDetail:
        typeof adminApi.getBookingDetail === 'function'
          ? (bId) => adminApi.getBookingDetail(bId)
          : undefined,
      onAssigned,
    });

    if (!result.assigned) {
      setError(result.error);
      setSubmittingId(null);
      if (result.refreshedBooking) {
        setCurrentBooking(result.refreshedBooking);
      }
    }
  };

  const getReasonTagStyle = (tone: ReasonClassificationTone): React.CSSProperties => {
    if (tone === 'positive') {
      return {
        ...styles.reasonTag,
        backgroundColor: '#F0FDF4',
        color: '#15803D',
        border: '1px solid #BBF7D0',
      };
    }
    if (tone === 'warning') {
      return {
        ...styles.reasonTag,
        backgroundColor: '#FEF3C7',
        color: '#B45309',
        border: '1px solid #FDE68A',
      };
    }
    return styles.reasonTag;
  };

  return (
    <div className="admin-modal-overlay" style={styles.overlay}>
      <div className="admin-modal-box" style={{ ...styles.modal, maxWidth: '720px' }}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.headerBadge}>
              <Sparkles size={14} color="#7C3AED" style={{ marginRight: 6 }} />
              <span>Smart Recommendation Engine</span>
            </div>
            <h2 style={styles.title}>Assign Beautician to Appointment</h2>
            <p style={styles.subtitle}>
              Review algorithmically scored beauticians for{' '}
              <strong>{currentBooking.bookingReference}</strong>
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close modal">
            <X size={20} color="#64748B" />
          </button>
        </div>

        {/* Booking Summary Box */}
        <div style={styles.summaryBox}>
          <div style={styles.summaryCol}>
            <span style={styles.summaryLabel}>Customer</span>
            <span style={styles.summaryVal}>
              {currentBooking.customerName} ({currentBooking.customerPhone})
            </span>
          </div>
          <div style={styles.summaryCol}>
            <span style={styles.summaryLabel}>Schedule</span>
            <span style={styles.summaryVal}>
              <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
              {currentBooking.bookingDate} • {currentBooking.timeSlot}
            </span>
          </div>
          <div style={styles.summaryCol}>
            <span style={styles.summaryLabel}>Location</span>
            <span style={styles.summaryVal}>
              <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />
              {currentBooking.addressText}
            </span>
          </div>
          <div style={styles.summaryCol}>
            <span style={styles.summaryLabel}>Payment & Status</span>
            <span style={styles.summaryVal} data-testid="modal-payment-status">
              {paymentBadge.label} • {currentBooking.bookingStatus || 'unknown'}
            </span>
          </div>
        </div>

        {/* Independent Eligibility Guard Banner */}
        {!eligibility.isAssignable && (
          <div
            role="alert"
            data-testid="modal-ineligible-banner"
            style={styles.ineligibleBanner}
          >
            <AlertTriangle size={16} color="#B45309" style={{ marginRight: 8, flexShrink: 0 }} />
            <div>
              <strong>{eligibility.disabledReason}</strong>{' '}
              <span>
                Candidate beauticians below are shown in read-only preview mode and cannot be assigned until the booking is in an assignable state.
              </span>
            </div>
          </div>
        )}

        {error ? (
          <div role="alert" data-testid="modal-error-banner" style={styles.errorBox}>
            <AlertCircle size={16} color="#DC2626" style={{ marginRight: 8, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Admin Note Input */}
        <div style={styles.noteBox}>
          <label style={styles.noteLabel}>Admin Note (Optional instructions for beautician):</label>
          <input
            type="text"
            placeholder="e.g. Priority customer, please carry extra waxing strips"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            disabled={!eligibility.isAssignable}
            style={{
              ...styles.noteInput,
              ...(!eligibility.isAssignable ? { backgroundColor: '#F1F5F9', color: '#94A3B8' } : {}),
            }}
          />
        </div>

        {/* Suggestions List */}
        <div style={styles.listContainer}>
          <h3 style={styles.listHeading}>Ranked Candidate Beauticians</h3>

          {loading ? (
            <div style={styles.loadingBox}>Analyzing beauticians schedule, skills & capacity...</div>
          ) : suggestions.length === 0 ? (
            <div style={styles.emptyBox}>No active beauticians currently registered.</div>
          ) : (
            suggestions.map((cand) => {
              const cautionaryNotes = getCandidateCautionaryNotes(cand);
              const hasWarnings = cautionaryNotes.length > 0;

              return (
                <div key={cand.beauticianId} style={styles.candidateCard}>
                  <div style={styles.candHeader}>
                    <div>
                      <div style={styles.candNameRow}>
                        <span style={styles.candName}>{cand.fullName}</span>
                        <span style={styles.candCode}>{cand.beauticianCode}</span>
                        <span style={styles.candRating}>{cand.ratingAverage.toFixed(1)} ⭐</span>
                      </div>
                      <span style={styles.candPhone}>
                        {cand.phone} • {cand.totalCompletedJobs} jobs completed
                      </span>
                    </div>

                    <div
                      style={{
                        ...styles.scoreBadge,
                        ...(hasWarnings
                          ? { backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }
                          : {}),
                      }}
                    >
                      <span
                        style={{
                          ...styles.scoreVal,
                          ...(hasWarnings ? { color: '#B45309' } : {}),
                        }}
                      >
                        {cand.score}%
                      </span>
                      <span
                        style={{
                          ...styles.scoreLabel,
                          ...(hasWarnings ? { color: '#92400E' } : {}),
                        }}
                      >
                        {hasWarnings ? 'Score (Has Warnings)' : 'Match Score'}
                      </span>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  <div style={styles.reasonsList}>
                    {cand.reasons.map((r, idx) => {
                      const classified = classifyRecommendationReason(r);
                      return (
                        <span
                          key={idx}
                          data-testid={`reason-tag-${classified.tone}`}
                          aria-label={`${classified.ariaLabel} ${classified.text}`}
                          style={getReasonTagStyle(classified.tone)}
                        >
                          {classified.prefix} {classified.text}
                        </span>
                      );
                    })}
                  </div>

                  <div style={styles.cardFooter}>
                    <button
                      type="button"
                      data-testid={`confirm-assign-${cand.beauticianId}`}
                      style={{
                        ...styles.confirmBtn,
                        ...(!eligibility.isAssignable || submittingId !== null
                          ? styles.confirmBtnDisabled
                          : {}),
                      }}
                      onClick={() => handleConfirmAssignment(cand.beauticianId)}
                      disabled={!eligibility.isAssignable || submittingId !== null}
                      aria-disabled={!eligibility.isAssignable || submittingId !== null}
                      title={
                        !eligibility.isAssignable
                          ? eligibility.disabledReason || 'Assignment unavailable'
                          : 'Confirm beautician assignment'
                      }
                    >
                      {eligibility.isAssignable ? (
                        <CheckCircle size={16} style={{ marginRight: 6 }} />
                      ) : (
                        <Lock size={15} style={{ marginRight: 6 }} />
                      )}
                      {!eligibility.isAssignable
                        ? eligibility.buttonLabel
                        : submittingId === cand.beauticianId
                        ? 'Confirming...'
                        : 'Confirm Assignment'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
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
    zIndex: 1000,
    backdropFilter: 'blur(3px)',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '92%',
    maxWidth: '720px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
  },
  headerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    color: '#6D28D9',
    fontSize: '12px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '20px',
    marginBottom: '6px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '2px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
  },
  summaryBox: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
    padding: '14px 24px',
  },
  summaryCol: {
    flex: 1,
    minWidth: '140px',
    display: 'flex',
    flexDirection: 'column',
  },
  summaryLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  summaryVal: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1E293B',
    marginTop: '2px',
  },
  ineligibleBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    borderBottom: '1px solid #FDE68A',
    padding: '10px 24px',
    fontSize: '13px',
    lineHeight: 1.4,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    padding: '10px 24px',
    fontSize: '13px',
    fontWeight: '600',
  },
  noteBox: {
    padding: '12px 24px',
    borderBottom: '1px solid #E2E8F0',
  },
  noteLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
    display: 'block',
    marginBottom: '6px',
  },
  noteInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    boxSizing: 'border-box',
  },
  listContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
  },
  listHeading: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '14px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  loadingBox: {
    padding: '30px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '14px',
  },
  emptyBox: {
    padding: '30px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '14px',
  },
  candidateCard: {
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    backgroundColor: '#ffffff',
    transition: 'all 0.15s ease',
  },
  candHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  candNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  candName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
  },
  candCode: {
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#F1F5F9',
    padding: '2px 6px',
    borderRadius: '4px',
    color: '#475569',
  },
  candRating: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#D97706',
  },
  candPhone: {
    fontSize: '12px',
    color: '#64748B',
    display: 'block',
    marginTop: '4px',
  },
  scoreBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    padding: '6px 12px',
    borderRadius: '8px',
  },
  scoreVal: {
    fontSize: '18px',
    fontWeight: '900',
    color: '#15803D',
  },
  scoreLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#166534',
    textTransform: 'uppercase',
  },
  reasonsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    margin: '12px 0',
  },
  reasonTag: {
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#F8FAFC',
    color: '#334155',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  confirmBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  confirmBtnDisabled: {
    backgroundColor: '#CBD5E1',
    color: '#64748B',
    cursor: 'not-allowed',
  },
};
