import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BookingsQueue } from '../src/pages/BookingsQueue';
import { AssignmentModal } from '../src/components/AssignmentModal';
import {
  ASSIGNABLE_BOOKING_STATUSES,
  classifyRecommendationReason,
  executeAssignmentConfirmation,
  getAssignmentEligibility,
  getCandidateCautionaryNotes,
  getPaymentBadgeInfo,
  isBookingAssignable,
  selectAssignableBooking,
} from '../src/utils/assignmentEligibility';
import { BeautyBooking, SuggestedBeautician } from '../src/types/beauty';

function makeBooking(overrides: Partial<BeautyBooking> = {}): BeautyBooking {
  return {
    id: 'bb-1207',
    bookingReference: 'UPB-20261015-1207',
    userId: 'usr-01',
    customerName: 'Dhruv Pal',
    customerPhone: '9876543210',
    customerEmail: 'dhruv@example.com',
    addressText: 'Testing Abandoned Booking',
    city: 'Delhi NCR',
    pincode: '110001',
    bookingDate: '2026-10-16',
    timeSlot: '02:00 PM - 03:00 PM',
    totalDurationMinutes: 60,
    subtotal: 999,
    advanceAmount: 299,
    remainingAmount: 700,
    paymentModeSelected: 'BOOKING_CHARGES',
    paymentStatus: 'pending',
    bookingStatus: 'pending_payment',
    assignedBeautician: null,
    startOtpVerified: false,
    completionVerified: false,
    items: [
      {
        id: 'item-1',
        serviceId: 'srv-1',
        serviceName: 'Classic Facial',
        categoryName: 'Facial & Cleanup',
        price: 999,
        quantity: 1,
        durationMinutes: 60,
      },
    ],
    createdAt: '2026-10-15T10:00:00.000Z',
    ...overrides,
  };
}

const priyaCandidate: SuggestedBeautician = {
  beauticianId: 'btc-b794',
  beauticianCode: 'B794',
  fullName: 'Priya Sharma',
  phone: '9876543222',
  ratingAverage: 5.0,
  totalCompletedJobs: 3,
  profilePhotoUrl: null,
  score: 80,
  reasons: [
    'Full skill match for all requested services',
    'Not scheduled on shift for FRI',
    'Capacity available (0/6 active jobs)',
    'High customer rating (5.0/5.0)',
    'Currently online and accepting assignments',
  ],
  isAvailableToday: false,
  activeJobsToday: 0,
};

describe('Phase 16 — Admin Assignment UI Clarity & Eligibility Guards', () => {
  it('1. Pending payment shows an unpaid/warning badge and never displays Adv Paid solely because advanceAmount > 0', () => {
    const unpaidDraft = makeBooking({
      advanceAmount: 299,
      paymentStatus: 'pending',
      bookingStatus: 'pending_payment',
    });

    const badge = getPaymentBadgeInfo(unpaidDraft);
    assert.equal(badge.tone, 'warning');
    assert.equal(badge.label, '₹299 Advance Pending (Unpaid)');
    assert.ok(!badge.label.includes('Adv Paid'));

    const html = renderToStaticMarkup(<BookingsQueue initialBookings={[unpaidDraft]} />);
    assert.match(html, /₹299 Advance Pending \(Unpaid\)/);
    assert.doesNotMatch(html, /Adv Paid/);
  });

  it('2. Verified advance payment shows Adv Paid badge, and fully_paid / refunded / failed / unknown states map accurately', () => {
    const verifiedAdvance = makeBooking({
      id: 'bb-paid-1',
      advanceAmount: 299,
      remainingAmount: 700,
      paymentStatus: 'advance_paid',
      bookingStatus: 'awaiting_assignment',
    });
    const advBadge = getPaymentBadgeInfo(verifiedAdvance);
    assert.equal(advBadge.tone, 'paid');
    assert.equal(advBadge.label, '₹299 Adv Paid');
    assert.equal(advBadge.sublabel, '(₹700 COD)');

    const fullyPaid = getPaymentBadgeInfo(
      makeBooking({ subtotal: 999, remainingAmount: 0, paymentStatus: 'fully_paid' })
    );
    assert.equal(fullyPaid.tone, 'paid');
    assert.equal(fullyPaid.label, '₹999 Fully Paid');

    const refunded = getPaymentBadgeInfo(
      makeBooking({ advanceAmount: 299, paymentStatus: 'refunded', bookingStatus: 'cancelled' })
    );
    assert.equal(refunded.tone, 'neutral');
    assert.equal(refunded.label, 'Refunded');

    const failed = getPaymentBadgeInfo(
      makeBooking({ advanceAmount: 299, paymentStatus: 'pending', bookingStatus: 'payment_failed' })
    );
    assert.equal(failed.tone, 'danger');
    assert.equal(failed.label, 'Payment Failed (Unpaid)');

    const unknown = getPaymentBadgeInfo(
      makeBooking({ advanceAmount: 299, paymentStatus: '', bookingStatus: 'awaiting_assignment' })
    );
    assert.equal(unknown.tone, 'neutral');
    assert.equal(unknown.label, 'Payment Unverified');

    const html = renderToStaticMarkup(<BookingsQueue initialBookings={[verifiedAdvance]} />);
    assert.match(html, /₹299 Adv Paid/);
  });

  it('3. Pending-payment booking cannot be assigned through the UI and is blocked from opening the modal', () => {
    const unpaidDraft = makeBooking({
      id: 'bb-1207',
      bookingStatus: 'pending_payment',
      paymentStatus: 'pending',
    });

    const eligibility = getAssignmentEligibility(unpaidDraft);
    assert.equal(eligibility.isAssignable, false);
    assert.equal(eligibility.buttonLabel, 'Awaiting Payment');
    assert.equal(eligibility.disabledReason, 'Assignment is unavailable until payment is confirmed.');
    assert.equal(selectAssignableBooking(unpaidDraft), null);

    const html = renderToStaticMarkup(<BookingsQueue initialBookings={[unpaidDraft]} />);
    assert.match(html, /data-testid="assign-btn-bb-1207"[^>]*disabled=""/);
    assert.match(html, /Awaiting Payment/);
    assert.match(html, /Assignment is unavailable until payment is confirmed\./);
  });

  it('4. Cancelled, completed, payment_failed, active service, and missing-status bookings fail closed and cannot be assigned', () => {
    const ineligibleStatuses = [
      'cancelled',
      'completed',
      'payment_failed',
      'en_route',
      'arrived',
      'in_progress',
      'confirmed',
      '',
    ];

    for (const status of ineligibleStatuses) {
      const booking = makeBooking({ id: `bb-${status || 'empty'}`, bookingStatus: status });
      assert.equal(isBookingAssignable(status), false);
      const eligibility = getAssignmentEligibility(booking);
      assert.equal(eligibility.isAssignable, false);
      assert.ok(eligibility.disabledReason && eligibility.disabledReason.length > 0);
      assert.equal(selectAssignableBooking(booking), null);
    }

    const cancelledBooking = makeBooking({ id: 'bb-canc', bookingStatus: 'cancelled' });
    const completedBooking = makeBooking({ id: 'bb-comp', bookingStatus: 'completed' });
    const html = renderToStaticMarkup(
      <BookingsQueue initialBookings={[cancelledBooking, completedBooking]} />
    );
    assert.match(html, /data-testid="assign-btn-bb-canc"[^>]*disabled=""/);
    assert.match(html, /data-testid="assign-btn-bb-comp"[^>]*disabled=""/);
  });

  it('5. Eligible bookings (awaiting_assignment, assigned, accepted) enable the assignment flow', () => {
    assert.deepEqual(ASSIGNABLE_BOOKING_STATUSES, ['awaiting_assignment', 'assigned', 'accepted']);

    for (const status of ASSIGNABLE_BOOKING_STATUSES) {
      const unassigned = makeBooking({
        id: `bb-${status}`,
        bookingStatus: status,
        paymentStatus: 'advance_paid',
        assignedBeautician: null,
      });
      const eligibility = getAssignmentEligibility(unassigned);
      assert.equal(eligibility.isAssignable, true);
      assert.equal(eligibility.buttonLabel, 'Assign Beautician');
      assert.equal(eligibility.disabledReason, null);
      assert.equal(selectAssignableBooking(unassigned), unassigned);
    }

    const assignedBooking = makeBooking({
      id: 'bb-assigned',
      bookingStatus: 'assigned',
      paymentStatus: 'advance_paid',
      assignedBeautician: {
        id: 'btc-b794',
        beauticianCode: 'B794',
        fullName: 'Priya Sharma',
        phone: '9876543222',
        ratingAverage: 5.0,
      },
    });
    const reassignEligibility = getAssignmentEligibility(assignedBooking);
    assert.equal(reassignEligibility.isAssignable, true);
    assert.equal(reassignEligibility.buttonLabel, 'Reassign');
  });

  it('6. Ineligible booking cannot confirm assignment from AssignmentModal (independent modal guard)', async () => {
    const unpaidDraft = makeBooking({
      id: 'bb-1207',
      bookingStatus: 'pending_payment',
      paymentStatus: 'pending',
    });

    const modalHtml = renderToStaticMarkup(
      <AssignmentModal
        booking={unpaidDraft}
        initialSuggestions={[priyaCandidate]}
        onClose={() => {}}
        onAssigned={() => {}}
      />
    );

    // Modal renders explicit warning banner and disables confirm button
    assert.match(modalHtml, /data-testid="modal-ineligible-banner"/);
    assert.match(modalHtml, /Assignment is unavailable until payment is confirmed\./);
    assert.match(modalHtml, /data-testid="confirm-assign-btc-b794"[^>]*disabled=""/);

    // Direct invocation of executeAssignmentConfirmation also fails closed without calling API
    let apiCalled = false;
    let onAssignedCalled = false;
    const result = await executeAssignmentConfirmation({
      booking: unpaidDraft,
      beauticianId: 'btc-b794',
      assignBeautician: async () => {
        apiCalled = true;
        return { success: true };
      },
      onAssigned: () => {
        onAssignedCalled = true;
      },
    });

    assert.equal(result.assigned, false);
    assert.equal(result.error, 'Assignment is unavailable until payment is confirmed.');
    assert.equal(apiCalled, false);
    assert.equal(onAssignedCalled, false);
  });

  it('7. Positive recommendation reasons display as positive with checkmark indicator', () => {
    const positiveReasons = [
      'Full skill match for all requested services',
      'Scheduled on shift for MON',
      'Capacity available (0/6 active jobs)',
      'High customer rating (5.0/5.0)',
      'Currently online and accepting assignments',
    ];

    for (const reason of positiveReasons) {
      const classified = classifyRecommendationReason(reason);
      assert.equal(classified.tone, 'positive', `Expected '${reason}' to be positive`);
      assert.equal(classified.prefix, '✓');
    }
  });

  it('8. Off-shift, offline, capacity, and partial/no-skill warnings are classified as warnings (not green checkmarks), and unknown reasons are neutral', () => {
    const warningReasons = [
      'Not scheduled on shift for FRI',
      'Currently toggled offline',
      'Max daily capacity reached (6/6 jobs)',
      'No certified skills for requested services',
      'Partial skill match (1/2 categories)',
    ];

    for (const reason of warningReasons) {
      const classified = classifyRecommendationReason(reason);
      assert.equal(classified.tone, 'warning', `Expected '${reason}' to be warning`);
      assert.equal(classified.prefix, '⚠');
      assert.notEqual(classified.prefix, '✓');
    }

    const unknownClassified = classifyRecommendationReason('Custom dispatcher note');
    assert.equal(unknownClassified.tone, 'neutral');
    assert.equal(unknownClassified.prefix, '•');

    const warningsForPriya = getCandidateCautionaryNotes(priyaCandidate);
    assert.deepEqual(warningsForPriya, ['Not scheduled on shift for FRI']);

    const assignableBooking = makeBooking({
      bookingStatus: 'awaiting_assignment',
      paymentStatus: 'advance_paid',
    });
    const modalHtml = renderToStaticMarkup(
      <AssignmentModal
        booking={assignableBooking}
        initialSuggestions={[priyaCandidate]}
        onClose={() => {}}
        onAssigned={() => {}}
      />
    );

    assert.match(modalHtml, /✓ Full skill match for all requested services/);
    assert.match(modalHtml, /⚠ Not scheduled on shift for FRI/);
    assert.doesNotMatch(modalHtml, /✓ Not scheduled on shift for FRI/);
    assert.match(modalHtml, /Score \(Has Warnings\)/);
  });

  it('9. Backend assignment rejection for pending_payment is preserved and surfaced accurately in the modal', async () => {
    const stalePendingBooking = makeBooking({
      id: 'bb-1207',
      bookingStatus: 'awaiting_assignment',
      paymentStatus: 'advance_paid',
    });

    let onAssignedCalled = false;

    const result = await executeAssignmentConfirmation({
      booking: stalePendingBooking,
      beauticianId: 'btc-b794',
      adminNote: 'Priority customer',
      assignBeautician: async () => {
        const err: any = new Error('Request failed with status code 400');
        err.response = {
          status: 400,
          data: {
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: "Cannot assign beautician to booking in 'pending_payment' status",
            },
          },
        };
        throw err;
      },
      onAssigned: () => {
        onAssignedCalled = true;
      },
    });

    assert.equal(result.assigned, false);
    assert.equal(onAssignedCalled, false);
    assert.equal(result.error, "Cannot assign beautician to booking in 'pending_payment' status");
  });

  it('10. API errors are handled without falsely showing assignment success and trigger a booking detail refresh', async () => {
    const staleBooking = makeBooking({
      id: 'bb-stale-1',
      bookingStatus: 'awaiting_assignment',
      paymentStatus: 'advance_paid',
    });
    const updatedServerBooking = makeBooking({
      id: 'bb-stale-1',
      bookingStatus: 'cancelled',
      paymentStatus: 'refunded',
    });

    let onAssignedCalled = false;
    let detailFetched = false;

    const result = await executeAssignmentConfirmation({
      booking: staleBooking,
      beauticianId: 'btc-b794',
      adminNote: 'Priority',
      assignBeautician: async () => {
        const err: any = new Error('Request failed with status code 400');
        err.response = {
          status: 400,
          data: {
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: "Cannot assign beautician to booking in 'cancelled' status",
            },
          },
        };
        throw err;
      },
      getBookingDetail: async (id) => {
        detailFetched = id === 'bb-stale-1';
        return updatedServerBooking;
      },
      onAssigned: () => {
        onAssignedCalled = true;
      },
    });

    assert.equal(result.assigned, false);
    assert.equal(onAssignedCalled, false);
    assert.equal(detailFetched, true);
    assert.equal(result.error, "Cannot assign beautician to booking in 'cancelled' status");
    assert.equal(result.refreshedBooking?.bookingStatus, 'cancelled');
  });

  it('11. Rejected orders display partner rejection details in BookingsQueue and full order details in BookingDetailModal', async () => {
    const { BookingDetailModal } = await import('../src/components/BookingDetailModal');
    const rejectedBooking = makeBooking({
      id: 'bb-rejected-1',
      bookingReference: 'UPB-20261019-9901',
      bookingStatus: 'awaiting_assignment',
      paymentStatus: 'advance_paid',
      completionPhotoUrl: 'https://res.cloudinary.com/hv2c92zk/image/upload/v1/urban-power/proof.jpg',
      completionPhotoPublicId: 'urban-power/proof',
      cashCollected: true,
      cashCollectedAmount: 700,
      lastRejection: {
        id: 'asgn-rej-1',
        beauticianId: 'btc-b794',
        beauticianCode: 'B794',
        beauticianName: 'Priya Sharma',
        beauticianPhone: '9876543222',
        assignmentType: 'manual_admin',
        assignmentStatus: 'rejected',
        rejectionReason: 'Customer location is too far from current shift zone',
        adminNote: 'Please prioritize',
        assignedAt: '2026-10-19T06:00:00.000Z',
        acceptedAt: null,
        rejectedAt: '2026-10-19T06:15:00.000Z',
      },
      assignmentHistory: [
        {
          id: 'asgn-rej-1',
          beauticianId: 'btc-b794',
          beauticianCode: 'B794',
          beauticianName: 'Priya Sharma',
          beauticianPhone: '9876543222',
          assignmentType: 'manual_admin',
          assignmentStatus: 'rejected',
          rejectionReason: 'Customer location is too far from current shift zone',
          adminNote: 'Please prioritize',
          assignedAt: '2026-10-19T06:00:00.000Z',
          acceptedAt: null,
          rejectedAt: '2026-10-19T06:15:00.000Z',
        },
      ],
    });

    const queueHtml = renderToStaticMarkup(<BookingsQueue initialBookings={[rejectedBooking]} />);
    assert.match(queueHtml, /data-testid="rejected-badge-bb-rejected-1"/);
    assert.match(queueHtml, /Declined by <strong>Priya Sharma<\/strong>/);
    assert.match(queueHtml, /Customer location is too far from current shift zone/);
    assert.match(queueHtml, /data-testid="view-details-btn-bb-rejected-1"/);

    const detailHtml = renderToStaticMarkup(
      <BookingDetailModal booking={rejectedBooking} onClose={() => {}} />
    );
    assert.match(detailHtml, /data-testid="booking-detail-modal"/);
    assert.match(detailHtml, /data-testid="detail-rejection-banner"/);
    assert.match(detailHtml, /Customer location is too far from current shift zone/);
    assert.match(detailHtml, /Service Completion Proof Photo/);
    assert.match(detailHtml, /Collected \(₹700\)/);
  });
});
