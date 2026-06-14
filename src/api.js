import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://contriba-backend-production.up.railway.app';

// ── Helper function to make API calls ──
const apiCall = async (endpoint, method = 'GET', body = null) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: 'Network error' };
  }
};

// ── AUTH ──
export const sendOTP = (phone, email = null, name = null) =>
  apiCall('/api/auth/send-otp', 'POST', { phone, email, name });

export const verifyOTP = (phone, otp, name = null, email = null) =>
  apiCall('/api/auth/verify-otp', 'POST', { phone, otp, name, email });

// ── EVENTS ──
export const getEvents = () => apiCall('/api/events');
export const getEvent = (id) => apiCall(`/api/events/${id}`);
export const createEvent = (eventData) => apiCall('/api/events', 'POST', eventData);
export const getMyEvents = () => apiCall('/api/events/my-events');

// ── CONTRIBUTIONS ──
export const initiateContribution = (data) => apiCall('/api/contributions/initiate', 'POST', data);
export const getEventContributions = (eventId) => apiCall(`/api/contributions/event/${eventId}`);

// ── WALLET ──
export const getWallet = () => apiCall('/api/wallet');
export const getTransactions = () => apiCall('/api/wallet/transactions');
export const withdrawFunds = (data) => apiCall('/api/wallet/withdraw', 'POST', data);
export const topUpWallet = (data) => apiCall('/api/wallet/topup', 'POST', data);

// ── NOTIFICATIONS ──
export const getNotifications = () => apiCall('/api/notifications');
export const markNotificationRead = (id) => apiCall(`/api/notifications/${id}/read`, 'PUT');

// ── DASHBOARD ──
export const getDashboard = () => apiCall('/api/dashboard');

// ── TOKEN ──
export const saveToken = async (token) => await AsyncStorage.setItem('token', token);
export const getToken = async () => await AsyncStorage.getItem('token');
export const removeToken = async () => await AsyncStorage.removeItem('token');