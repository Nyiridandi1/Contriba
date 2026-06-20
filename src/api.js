import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://contriba-backend-production.up.railway.app';

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

export const registerWithPin = (name, phone, pin) => apiCall('/api/auth/register', 'POST', { name, phone, pin });
export const loginWithPin = (phone, pin) => apiCall('/api/auth/login', 'POST', { phone, pin });
export const changePin = (old_pin, new_pin) => apiCall('/api/auth/change-pin', 'POST', { old_pin, new_pin });
export const updateProfile = (name, email) => apiCall('/api/auth/update-profile', 'POST', { name, email });
export const updateAvatar = (avatar_url) => apiCall('/api/auth/update-avatar', 'POST', { avatar_url });
export const updatePushToken = (push_token) => apiCall('/api/auth/update-push-token', 'POST', { push_token });
export const getEvents = () => apiCall('/api/events');
export const getEvent = (id) => apiCall(`/api/events/${id}`);
export const createEvent = (eventData) => apiCall('/api/events', 'POST', eventData);
export const getMyEvents = () => apiCall('/api/events/my-events');
export const initiateContribution = (data) => apiCall('/api/contributions/initiate', 'POST', data);
export const getEventContributions = (eventId) => apiCall(`/api/contributions/event/${eventId}`);
export const getWallet = () => apiCall('/api/wallet');
export const getTransactions = () => apiCall('/api/wallet/transactions');
export const withdrawFunds = (data) => apiCall('/api/wallet/withdraw', 'POST', data);
export const topUpWallet = (data) => apiCall('/api/wallet/topup', 'POST', data);
export const getNotifications = () => apiCall('/api/notifications');
export const markNotificationRead = (id) => apiCall(`/api/notifications/${id}/read`, 'PUT');
export const getDashboard = () => apiCall('/api/dashboard');
export const saveToken = async (token) => await AsyncStorage.setItem('token', token);
export const getToken = async () => await AsyncStorage.getItem('token');
export const removeToken = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
};
