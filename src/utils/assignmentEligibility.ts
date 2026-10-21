import type { BeautyBooking, SuggestedBeautician } from '../types/beauty';

/**
 * Authoritative booking statuses allowed for beautician assignment,
 * mirroring AssignmentService.adminConfirmAssignment in beauty-backend.
 */
export const ASSIGNABLE_BOOKING_STATUSES = [
  'awaiting_assignment',
  'assigned',
  'accepted',
] as const;

export type AssignableBookingStatus = (typeof ASSIGNABLE_BOOKING_STATUSES)[number];

export function isBookingAssignable(bookingStatus?: string | null): bookingStatus is AssignableBookingStatus {
  if (!bookingStatus || typeof bookingStatus !== 'string') {
    return false;
  }
  return (ASSIGNABLE_BOOKING_STATUSES as readonly string[]).includes(bookingStatus);
}

export interface AssignmentEligibilityResult {
  isAssignable: boolean;
  buttonLabel: string;
  disabledReason: string | null;
}

/**
 * Evaluates whether a booking can be assigned or reassigned in the Admin UI.
 * Always fails closed when status is missing, unknown, or non-assignable.
 */
export function getAssignmentEligibility(
  booking?: Pick<BeautyBooking, 'bookingStatus' | 'paymentStatus' | 'assignedBeautician'> | null
): AssignmentEligibilityResult {
  const status = booking?.bookingStatus;

  if (!status || typeof status !== 'string') {
    return {
      isAssignable: false,
      buttonLabel: 'Unavailable',
      disabledReason: 'Assignment is unavailable because booking status is missing or unverified.',
    };
  }

  if (isBookingAssignable(status)) {
    return {
      isAssignable: true,
      buttonLabel: booking?.assignedBeautician ? 'Reassign' : 'Assign Beautician',
      disabledReason: null,
    };
  }

  switch (status) {
    case 'pending_payment':
      return {
        isAssignable: false,
        buttonLabel: 'Awaiting Payment',
        disabledReason: 'Assignment is unavailable until payment is confirmed.',
      };
    case 'payment_failed':
      return {
        isAssignable: false,
        buttonLabel: 'Payment Failed',
        disabledReason: 'Assignment is unavailable because customer payment failed.',
      };
    case 'cancelled':
      return {
        isAssignable: false,
        buttonLabel: 'Cancelled',
        disabledReason: 'Assignment is unavailable because this booking has been cancelled.',
      };
    case 'completed':
      return {
        isAssignable: false,
        buttonLabel: 'Completed',
        disabledReason: 'Assignment is unavailable because this appointment is already completed.',
      };
    case 'en_route':
    case 'arrived':
    case 'in_progress':
      return {
        isAssignable: false,
        buttonLabel: 'Service Active',
        disabledReason: `Assignment is locked while appointment is in '${status}' status.`,
      };
    default:
      return {
        isAssignable: false,
        buttonLabel: 'Unavailable',
        disabledReason: `Cannot assign beautician to booking in '${status}' status.`,
      };
  }
}

export type PaymentBadgeTone = 'paid' | 'warning' | 'danger' | 'neutral';

export interface PaymentBadgeInfo {
  tone: PaymentBadgeTone;
  label: string;
  sublabel: string | null;
}

/**
 * Computes the payment badge from the authoritative backend paymentStatus.
 * Never infers payment confirmation from advanceAmount, bookingStatus, or match score.
 */
export function getPaymentBadgeInfo(
  booking?: Pick<BeautyBooking, 'paymentStatus' | 'bookingStatus' | 'advanceAmount' | 'remainingAmount' | 'subtotal'> | null
): PaymentBadgeInfo {
  const paymentStatus = typeof booking?.paymentStatus === 'string' ? booking.paymentStatus.trim() : '';
  const bookingStatus = typeof booking?.bookingStatus === 'string' ? booking.bookingStatus.trim() : '';
  const advanceAmount = Number(booking?.advanceAmount ?? 0);
  const remainingAmount = Number(booking?.remainingAmount ?? 0);
  const subtotal = Number(booking?.subtotal ?? 0);

  if (
    paymentStatus === 'failed' ||
    paymentStatus === 'payment_failed' ||
    bookingStatus === 'payment_failed'
  ) {
    return {
      tone: 'danger',
      label: 'Payment Failed (Unpaid)',
      sublabel: advanceAmount > 0 ? `₹${advanceAmount} advance not collected` : null,
    };
  }

  switch (paymentStatus) {
    case 'pending':
      return {
        tone: 'warning',
        label:
          advanceAmount > 0
            ? `₹${advanceAmount} Advance Pending (Unpaid)`
            : 'Advance Pending (Unpaid)',
        sublabel: 'Awaiting customer payment',
      };
    case 'advance_paid':
    case 'partially_paid':
      return {
        tone: 'paid',
        label: `₹${advanceAmount} Adv Paid`,
        sublabel: remainingAmount > 0 ? `(₹${remainingAmount} COD)` : null,
      };
    case 'fully_paid':
      return {
        tone: 'paid',
        label: subtotal > 0 ? `₹${subtotal} Fully Paid` : 'Fully Paid',
        sublabel: 'No balance due',
      };
    case 'refunded':
      return {
        tone: 'neutral',
        label: 'Refunded',
        sublabel: advanceAmount > 0 ? `(₹${advanceAmount} refunded)` : null,
      };
    default:
      return {
        tone: 'neutral',
        label: 'Payment Unverified',
        sublabel: paymentStatus ? `Status: ${paymentStatus}` : 'Unknown payment state',
      };
  }
}

export type ReasonClassificationTone = 'positive' | 'warning' | 'neutral';

export interface ClassifiedReason {
  tone: ReasonClassificationTone;
  prefix: '✓' | '⚠' | '•';
  ariaLabel: string;
  text: string;
}

const WARNING_REASON_PATTERNS: RegExp[] = [
  /^not scheduled on shift/i,
  /^currently toggled offline/i,
  /\boffline\b/i,
  /^max daily capacity reached/i,
  /^no certified skills/i,
  /^partial skill match/i,
  /\bunavailable\b/i,
];

const POSITIVE_REASON_PATTERNS: RegExp[] = [
  /^full skill match for all requested services$/i,
  /^scheduled on shift for [a-z]{3}$/i,
  /^capacity available \(\d+\/\d+ active jobs\)$/i,
  /^high customer rating \(\d+(?:\.\d+)?\/5\.0\)$/i,
  /^currently online and accepting assignments$/i,
];

/**
 * Classifies a recommendation reason string from AssignmentEngineService.getRankedSuggestions.
 * Unknown or ambiguous reasons default to 'neutral' rather than 'positive'.
 */
export function classifyRecommendationReason(reason: string): ClassifiedReason {
  const normalized = (reason || '').trim();

  if (WARNING_REASON_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      tone: 'warning',
      prefix: '⚠',
      ariaLabel: 'Warning:',
      text: normalized,
    };
  }

  if (POSITIVE_REASON_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      tone: 'positive',
      prefix: '✓',
      ariaLabel: 'Positive:',
      text: normalized,
    };
  }

  return {
    tone: 'neutral',
    prefix: '•',
    ariaLabel: 'Info:',
    text: normalized,
  };
}

/**
 * Returns warning strings for a candidate beautician so high numerical scores
 * are never treated as proof that a beautician is on-shift or available.
 */
export function getCandidateCautionaryNotes(candidate: SuggestedBeautician): string[] {
  const warnings = (candidate.reasons || [])
    .map(classifyRecommendationReason)
    .filter((r) => r.tone === 'warning')
    .map((r) => r.text);

  if (!candidate.isAvailableToday && !warnings.some((w) => /not scheduled on shift/i.test(w))) {
    warnings.push('Not scheduled on shift for appointment date');
  }

  return warnings;
}

/**
 * Guard used by BookingsQueue before opening the AssignmentModal.
 * Returns the booking only when it is eligible for assignment; otherwise returns null.
 */
export function selectAssignableBooking(booking?: BeautyBooking | null): BeautyBooking | null {
  if (!booking) {
    return null;
  }
  const eligibility = getAssignmentEligibility(booking);
  return eligibility.isAssignable ? booking : null;
}

export interface ConfirmAssignmentActionParams {
  booking: BeautyBooking;
  beauticianId: string;
  adminNote?: string;
  assignBeautician: (
    bookingId: string,
    beauticianId: string,
    adminNote?: string
  ) => Promise<{ success: boolean }>;
  getBookingDetail?: (bookingId: string) => Promise<BeautyBooking>;
  onAssigned: () => void;
}

export interface ConfirmAssignmentActionResult {
  assigned: boolean;
  error: string | null;
  refreshedBooking: BeautyBooking | null;
}

/**
 * Executes the assignment confirmation flow with independent client-side eligibility verification,
 * graceful server error handling (never calling onAssigned on error), and stale-booking refresh.
 */
export async function executeAssignmentConfirmation(
  params: ConfirmAssignmentActionParams
): Promise<ConfirmAssignmentActionResult> {
  const eligibility = getAssignmentEligibility(params.booking);
  if (!eligibility.isAssignable) {
    return {
      assigned: false,
      error: eligibility.disabledReason || 'Assignment is unavailable for this booking status.',
      refreshedBooking: null,
    };
  }

  try {
    const trimmedNote = params.adminNote?.trim() || undefined;
    await params.assignBeautician(params.booking.id, params.beauticianId, trimmedNote);
    params.onAssigned();
    return {
      assigned: true,
      error: null,
      refreshedBooking: null,
    };
  } catch (err: any) {
    const serverMessage =
      err?.response?.data?.error?.message || err?.message || 'Assignment failed';
    let refreshedBooking: BeautyBooking | null = null;
    if (typeof params.getBookingDetail === 'function') {
      try {
        const latest = await params.getBookingDetail(params.booking.id);
        if (latest && latest.id) {
          refreshedBooking = latest;
        }
      } catch {
        refreshedBooking = null;
      }
    }
    return {
      assigned: false,
      error: serverMessage,
      refreshedBooking,
    };
  }
}

