import axios from 'axios';
import { Beautician, BeautyBooking, SuggestedBeautician } from '../types/beauty';

const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;

const API_BASE =
  metaEnv?.VITE_BEAUTY_ADMIN_API_URL ||
  metaEnv?.VITE_API_URL ||
  'http://localhost:5002/api/v1/beauty/admin';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('up_admin_token') || localStorage.getItem('token')
      : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('up_admin_auth_required', { detail: { error } }));
    }
    return Promise.reject(error);
  }
);

export const adminApi = {
  getToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem('up_admin_token') || localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },

  async login(usernameOrEmail: string, password: string) {
    const res = await apiClient.post('/auth/login', { usernameOrEmail, password });
    if (res.data?.data?.token) {
      localStorage.setItem('up_admin_token', res.data.data.token);
      localStorage.setItem('up_admin_user', JSON.stringify(res.data.data.admin));
      window.dispatchEvent(new CustomEvent('up_admin_auth_changed', { detail: res.data.data }));
    }
    return res.data?.data;
  },

  async devLogin() {
    const res = await apiClient.post('/auth/dev-token');
    if (res.data?.data?.token) {
      localStorage.setItem('up_admin_token', res.data.data.token);
      localStorage.setItem('up_admin_user', JSON.stringify(res.data.data.admin));
      window.dispatchEvent(new CustomEvent('up_admin_auth_changed', { detail: res.data.data }));
    }
    return res.data?.data;
  },

  logout() {
    localStorage.removeItem('up_admin_token');
    localStorage.removeItem('token');
    localStorage.removeItem('up_admin_user');
    window.dispatchEvent(new CustomEvent('up_admin_auth_changed', { detail: null }));
  },

  getCurrentAdmin(): { id?: string; username?: string; email?: string } | null {
    try {
      const data = localStorage.getItem('up_admin_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    return res.data?.data?.admin;
  },

  async getBeauticians(params?: { status?: string; isAvailable?: boolean; search?: string }): Promise<Beautician[]> {
    const res = await apiClient.get('/beauticians', { params });
    return res.data.data;
  },

  async createBeautician(data: {
    beauticianCode: string;
    fullName: string;
    phone: string;
    email?: string;
    password: string;
    maxDailyBookings?: number;
    categories?: string[];
  }): Promise<Beautician> {
    const res = await apiClient.post('/beauticians', data);
    return res.data.data;
  },

  async updateBeautician(
    id: string,
    data: {
      beauticianCode?: string;
      fullName?: string;
      phone?: string;
      email?: string | null;
      password?: string;
      profilePhotoUrl?: string | null;
      accountStatus?: string;
      isAvailable?: boolean;
      maxDailyBookings?: number;
      categories?: string[];
    }
  ): Promise<Beautician> {
    const res = await apiClient.patch(`/beauticians/${id}`, data);
    return res.data.data;
  },

  async resetBeauticianPassword(
    id: string,
    newPassword: string
  ): Promise<{ message: string; beauticianId: string }> {
    const res = await apiClient.post(`/beauticians/${id}/reset-password`, { newPassword });
    return res.data.data;
  },

  async getBookings(params?: { status?: string; search?: string }): Promise<BeautyBooking[]> {
    const res = await apiClient.get('/bookings', { params });
    return res.data.data;
  },

  async getBookingDetail(id: string): Promise<BeautyBooking> {
    const res = await apiClient.get(`/bookings/${id}`);
    return res.data.data;
  },

  async getSuggestions(bookingId: string): Promise<SuggestedBeautician[]> {
    const res = await apiClient.get(`/bookings/${bookingId}/suggestions`);
    return res.data.data;
  },

  async assignBeautician(bookingId: string, beauticianId: string, adminNote?: string): Promise<{ success: boolean }> {
    const res = await apiClient.post(`/bookings/${bookingId}/assign`, {
      beauticianId,
      adminNote,
    });
    return res.data.data;
  },
};
