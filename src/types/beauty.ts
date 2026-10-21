export interface Beautician {
  id: string;
  beauticianCode: string;
  fullName: string;
  phone: string;
  email: string | null;
  profilePhotoUrl: string | null;
  accountStatus: 'pending' | 'active' | 'inactive' | 'suspended';
  isAvailable: boolean;
  maxDailyBookings: number;
  ratingAverage: number;
  totalCompletedJobs: number;
  categories: string[];
}

export interface BookingItem {
  id: string;
  serviceId: string;
  serviceName: string;
  categoryName: string;
  price: number;
  quantity: number;
  durationMinutes: number;
}

export type BeautyBookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'awaiting_assignment'
  | 'assigned'
  | 'accepted'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'payment_failed';

export type BeautyPaymentStatus =
  | 'pending'
  | 'advance_paid'
  | 'fully_paid'
  | 'refunded'
  | 'partially_paid'
  | 'failed'
  | 'payment_failed';

export interface BookingAssignmentHistoryEntry {
  id: string;
  beauticianId: string;
  beauticianCode: string | null;
  beauticianName: string | null;
  beauticianPhone: string | null;
  assignmentType: 'manual_admin' | 'auto_suggested_accepted' | string;
  assignmentStatus: 'assigned' | 'accepted' | 'rejected' | 'reassigned' | 'expired' | string;
  rejectionReason: string | null;
  adminNote: string | null;
  assignedAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
}

export interface BeautyBooking {
  id: string;
  bookingReference: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  addressText: string;
  city: string;
  pincode: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bookingDate: string;
  timeSlot: string;
  startTime?: string | null;
  endTime?: string | null;
  totalDurationMinutes: number;
  subtotal: number;
  discountAmount?: number;
  advanceAmount: number;
  remainingAmount: number;
  paymentModeSelected: string;
  paymentStatus: BeautyPaymentStatus | string;
  bookingStatus: BeautyBookingStatus | string;
  assignedBeautician?: {
    id: string;
    beauticianCode: string;
    fullName: string;
    phone: string;
    ratingAverage: number;
  } | null;
  startOtpVerified: boolean;
  startOtpVerifiedAt?: string | null;
  completionVerified: boolean;
  completionVerifiedAt?: string | null;
  completionPhotoUrl?: string | null;
  completionPhotoPublicId?: string | null;
  cashCollected?: boolean;
  cashCollectedAmount?: number;
  cashCollectedAt?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  notes?: string | null;
  items: BookingItem[];
  assignmentHistory?: BookingAssignmentHistoryEntry[];
  lastRejection?: BookingAssignmentHistoryEntry | null;
  createdAt: string;
  updatedAt?: string;
}

export interface SuggestedBeautician {
  beauticianId: string;
  beauticianCode: string;
  fullName: string;
  phone: string;
  ratingAverage: number;
  totalCompletedJobs: number;
  profilePhotoUrl: string | null;
  score: number;
  reasons: string[];
  isAvailableToday: boolean;
  activeJobsToday: number;
}
