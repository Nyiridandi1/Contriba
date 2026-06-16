import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, StatusBar, ActivityIndicator, RefreshControl, Platform,
  Alert, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDashboard, getToken } from '../api';
import { useTheme } from '../context/ThemeContext';
import { formatEventDate } from '../utils/formatDate'; // ✅ Import

const WINE       = '#E60012';
const WINE_LIGHT = '#FDF0F3';
const GREEN      = '#1A9E4A';
const WHITE      = '#FFFFFF';
const BASE_URL   = 'https://contriba-backend-production.up.railway.app';

const formatAmount = (val) => 'RWF ' + (val || 0).toLocaleString('en-RW');

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const getInitials = (name) => {
  if (!name || name === 'Anonymous') return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getEventImage = (event) => {
  if (event?.cover_image) return { uri: event.cover_image };
  return require('../../assets/couple.png');
};

export default function DashboardScreen({ navigation }) {
  const { darkMode, language, colors } = useTheme();
  const { BG, CARD, TEXT, SUB, BORDER, DIV } = colors;

  const [dashboard, setDashboard]           = useState(null);
  const [user, setUser]                     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [selectedEvent, setSelectedEvent]   = useState(null);
  const [contributions, setContributions]   = useState([]);
  const [loadingContrib, setLoadingContrib] = useState(false);
  const [editModal, setEditModal]           = useState(false);
  const [saving, setSaving]                 = useState(false);

  const [editTitle, setEditTitle]                 = useState('');
  const [editLocation, setEditLocation]           = useState('');
  const [editDescription, setEditDescription]     = useState('');
  const [editGoalAmount, setEditGoalAmount]       = useState('');
  const [editOwnerPhone, setEditOwnerPhone]       = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('mtn');

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
      const result = await getDashboard();
      if (result.success) {
        setDashboard(result.dashboard);
        if (result.dashboard?.events?.length > 0) {
          const firstEvent = result.dashboard.events[0];
          setSelectedEvent(firstEvent);
          loadContributions(firstEvent.id);
        }
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadContributions = async (eventId) => {
    try {
      setLoadingContrib(true);
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/api/events/${eventId}/contributions`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) setContributions(result.contributions || []);
    } catch (error) {
      console.error('Contributions error:', error);
    } finally {
      setLoadingContrib(false);
    }
  };

  const getDaysLeft = (dateStr) => {
    if (!dateStr) return 0;
    const diff = new Date(dateStr) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const progress = selectedEvent?.goal_amount > 0
    ? Math.min((selectedEvent?.total_raised || 0) / selectedEvent?.goal_amount, 1) : 0;
  const percent = Math.round(progress * 100);

  const getUserName = () => {
    if (user?.name) return user.name.split(' ')[0];
    return 'there';
  };

  const handleEdit = (event) => {
    setEditTitle(event?.title || '');
    setEditLocation(event?.location || '');
    setEditDescription(event?.description || '');
    setEditGoalAmount(event?.goal_amount?.toString() || '');
    setEditOwnerPhone(event?.owner_phone || '');
    setEditPaymentMethod(event?.owner_payment_method || 'mtn');
    setSelectedEvent(event);
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle) { Alert.alert('Error', 'Event title is required'); return; }
    setSaving(true);
    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/api/events/${selectedEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: editTitle, location: editLocation, description: editDescription,
          goal_amount: editGoalAmount ? parseInt(editGoalAmount) : 0,
          owner_phone: editOwnerPhone, owner_payment_method: editPaymentMethod,
          type: selectedEvent.type, date: selectedEvent.date,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setEditModal(false);
        Alert.alert('Success! ✅', 'Event updated!');
        loadData();
      } else {
        Alert.alert('Error', result.message || 'Failed to update event');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (event) => {
    Alert.alert('Delete Event', `Are you sure you want to delete "${event?.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const token = await getToken();
            const response = await fetch(`${BASE_URL}/api/events/${event.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` },
            });
            const result = await response.json();
            if (result.success) {
              Alert.alert('Deleted! 🗑️', 'Event deleted successfully!');
              loadData();
            } else {
              Alert.alert('Error', result.message || 'Failed to delete');
            }
          } catch (error) {
            Alert.alert('Error', 'Something went wrong.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: BG }]}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={WINE} size="large" />
          <Text style={[styles.loadingText, { color: SUB }]}>
            {language === 'Kinyarwanda' ? 'Gutegereza...' : 'Loading dashboard...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: BG }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={CARD} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: CARD, borderBottomColor: BORDER }]}>
        <View>
          <Text style={[styles.headerTitle, { color: TEXT }]}>
            {language === 'Kinyarwanda' ? 'Ikibaho' : 'Dashboard'}
          </Text>
          <Text style={[styles.headerSub, { color: SUB }]}>
            {language === 'Kinyarwanda' ? `Muraho, ${getUserName()} 👋` : `Hello, ${getUserName()} 👋`}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={TEXT} />
            {dashboard?.unread_notifications > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{dashboard.unread_notifications}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: WINE, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: WHITE, fontWeight: '800', fontSize: 14 }}>{getInitials(user?.name)}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={WINE} />}
      >
        {/* STATS ROW */}
        <View style={styles.statsRow}>
          {[
            { value: dashboard?.total_events || 0, label: language === 'Kinyarwanda' ? 'Ibirori' : 'Events' },
            { value: formatAmount(dashboard?.total_raised), label: language === 'Kinyarwanda' ? 'Byakomejwe' : 'Total Raised' },
            { value: dashboard?.total_contributors || 0, label: language === 'Kinyarwanda' ? 'Abakunzi' : 'Contributors' },
          ].map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: darkMode ? '#1A1A1A' : WINE_LIGHT }]}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: SUB }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* MY EVENTS */}
        {dashboard?.events?.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: TEXT }]}>
              {language === 'Kinyarwanda' ? 'Ibirori Byanjye' : 'My Events'}
            </Text>
            {dashboard.events.map((event) => {
              const prog = event.goal_amount > 0 ? Math.min((event.total_raised || 0) / event.goal_amount, 1) : 0;
              const pct = Math.round(prog * 100);
              return (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.eventCard, { backgroundColor: CARD, borderColor: selectedEvent?.id === event.id ? WINE : BORDER }, selectedEvent?.id === event.id && { backgroundColor: darkMode ? '#2A0A0F' : WINE_LIGHT }]}
                  onPress={() => { setSelectedEvent(event); loadContributions(event.id); }}
                  activeOpacity={0.8}
                >
                  <Image source={getEventImage(event)} style={styles.eventImage} resizeMode="cover" />
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventTitle, { color: TEXT }]}>{event.title}</Text>
                    {/* ✅ Fixed date format */}
                    <Text style={[styles.eventType, { color: SUB }]}>
                      {event.type} • {formatEventDate(event.date)}
                    </Text>
                    <View style={[styles.progressBar, { backgroundColor: BORDER }]}>
                      <View style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={[styles.progressText, { color: SUB }]}>
                      {formatAmount(event.total_raised)} raised • {pct}%
                    </Text>
                  </View>
                  <View style={styles.eventActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(event)}>
                      <Ionicons name="pencil-outline" size={14} color={WINE} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(event)}>
                      <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.viewBtn} onPress={() => navigation.navigate('EventPage', { event })}>
                      <Ionicons name="arrow-forward" size={14} color={WINE} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        ) : (
          <TouchableOpacity style={[styles.createPrompt, { borderColor: WINE }]} onPress={() => navigation.navigate('CreateEvent')}>
            <Ionicons name="add-circle-outline" size={32} color={WINE} />
            <Text style={styles.createPromptText}>
              {language === 'Kinyarwanda' ? 'Shiraho ikirori cya mbere!' : 'Create your first event!'}
            </Text>
          </TouchableOpacity>
        )}

        {/* SELECTED EVENT DETAILS */}
        {selectedEvent && (
          <>
            <View style={[styles.detailsCard, { backgroundColor: CARD, borderColor: BORDER }]}>
              <View style={styles.detailsHeader}>
                <Text style={[styles.sectionTitle, { color: TEXT }]}>
                  {language === 'Kinyarwanda' ? 'Incamake y\'Ikirori' : 'Event Overview'}
                </Text>
                <View style={styles.detailsActions}>
                  <TouchableOpacity style={styles.detailEditBtn} onPress={() => handleEdit(selectedEvent)}>
                    <Ionicons name="pencil-outline" size={16} color={WINE} />
                    <Text style={styles.detailEditText}>{language === 'Kinyarwanda' ? 'Hindura' : 'Edit'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.detailDeleteBtn} onPress={() => handleDelete(selectedEvent)}>
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                    <Text style={styles.detailDeleteText}>{language === 'Kinyarwanda' ? 'Siba' : 'Delete'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                {[
                  { icon: 'wallet-outline', bg: '#FFE4E9', color: WINE, label: language === 'Kinyarwanda' ? 'Byakomejwe' : 'Total Raised', value: formatAmount(selectedEvent.total_raised) },
                  { icon: 'people-outline', bg: '#E8F5E9', color: GREEN, label: language === 'Kinyarwanda' ? 'Abakunzi' : 'Contributors', value: selectedEvent.total_contributors || contributions.length },
                  { icon: 'time-outline', bg: '#EDE7F6', color: '#7C3AED', label: language === 'Kinyarwanda' ? 'Iminsi Isigaye' : 'Days Left', value: getDaysLeft(selectedEvent.date) },
                  { icon: 'flag-outline', bg: '#FFF3E0', color: '#F59E0B', label: language === 'Kinyarwanda' ? 'Intego' : 'Goal', value: formatAmount(selectedEvent.goal_amount), small: true },
                ].map((item, i) => (
                  <View key={i} style={[styles.detailItem, { backgroundColor: darkMode ? '#2A2A2A' : '#F5F5F5' }]}>
                    <View style={[styles.detailIcon, { backgroundColor: item.bg }]}>
                      <Ionicons name={item.icon} size={20} color={item.color} />
                    </View>
                    <Text style={[styles.detailLabel, { color: SUB }]}>{item.label}</Text>
                    <Text style={[styles.detailValue, { color: item.color, fontSize: item.small ? 12 : 14 }]}>{item.value}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.bigProgressBar, { backgroundColor: BORDER }]}>
                <View style={[styles.bigProgressFill, { width: `${percent}%` }]} />
              </View>
              <Text style={[styles.bigProgressText, { color: SUB }]}>
                {percent}% {language === 'Kinyarwanda' ? 'by\'intego bigezweho' : 'of goal reached'}
              </Text>
            </View>

            {/* CONTRIBUTIONS LIST */}
            <Text style={[styles.sectionTitle, { color: TEXT }]}>
              {language === 'Kinyarwanda' ? 'Inkunga Zose' : 'All Contributions'}
            </Text>
            {loadingContrib ? (
              <ActivityIndicator color={WINE} style={{ marginVertical: 20 }} />
            ) : contributions.length === 0 ? (
              <View style={styles.emptyContrib}>
                <Ionicons name="heart-outline" size={40} color={SUB} />
                <Text style={[styles.emptyContribText, { color: TEXT }]}>
                  {language === 'Kinyarwanda' ? 'Nta nkunga nawe' : 'No contributions yet'}
                </Text>
                <Text style={[styles.emptyContribSub, { color: SUB }]}>
                  {language === 'Kinyarwanda' ? 'Sangira ikirori wawe!' : 'Share your event to start receiving contributions!'}
                </Text>
                <TouchableOpacity style={styles.shareBtn} onPress={() => navigation.navigate('ShareEvent', { event: selectedEvent })}>
                  <Ionicons name="share-social-outline" size={16} color={WHITE} />
                  <Text style={styles.shareBtnText}>
                    {language === 'Kinyarwanda' ? 'Sangira Ikirori' : 'Share Event'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.contribList, { backgroundColor: CARD, borderColor: BORDER }]}>
                {contributions.map((item, index) => (
                  <View key={item.id}>
                    <View style={styles.contribRow}>
                      <View style={[styles.contribAvatar, { backgroundColor: item.is_anonymous ? (darkMode ? '#2A2A2A' : '#F5F5F5') : WINE_LIGHT }]}>
                        <Text style={[styles.contribInitials, { color: item.is_anonymous ? SUB : WINE }]}>
                          {item.is_anonymous ? '🙈' : getInitials(item.contributor_name)}
                        </Text>
                      </View>
                      <View style={styles.contribInfo}>
                        <Text style={[styles.contribName, { color: TEXT }]}>
                          {item.is_anonymous ? 'Anonymous 🙈' : item.contributor_name}
                        </Text>
                        <Text style={[styles.contribPhone, { color: SUB }]}>
                          {item.is_anonymous ? '' : item.contributor_phone}
                        </Text>
                        {item.message ? <Text style={[styles.contribMessage, { color: SUB }]}>"{item.message}"</Text> : null}
                        <Text style={[styles.contribTime, { color: SUB }]}>{formatTime(item.created_at)}</Text>
                      </View>
                      <View style={styles.contribRight}>
                        <Text style={[styles.contribAmount, { color: item.status === 'success' ? GREEN : '#F59E0B' }]}>
                          {formatAmount(item.amount)}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: item.status === 'success' ? '#E8F5E9' : '#FFF3E0' }]}>
                          <Text style={[styles.statusText, { color: item.status === 'success' ? GREEN : '#F59E0B' }]}>
                            {item.status === 'success' ? '✓ Paid' : '⏳ Pending'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {index < contributions.length - 1 && <View style={[styles.rowDivider, { backgroundColor: DIV }]} />}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* QUICK ACTIONS */}
        <Text style={[styles.sectionTitle, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Ibikorwa Byihuse' : 'Quick Actions'}
        </Text>
        <View style={styles.quickGrid}>
          {[
            { icon: 'add-circle-outline', bg: WINE_LIGHT, color: WINE, label: language === 'Kinyarwanda' ? 'Ikirori Gishya' : 'New Event', screen: 'CreateEvent' },
            { icon: 'radio-outline', bg: '#E8F5E9', color: GREEN, label: language === 'Kinyarwanda' ? 'Ikiganiro Giheruka' : 'Live Feed', screen: 'LiveFeed' },
            { icon: 'wallet-outline', bg: '#EDE7F6', color: '#7C3AED', label: language === 'Kinyarwanda' ? 'Amafaranga' : 'Wallet', screen: 'Wallet' },
            { icon: 'share-social-outline', bg: '#FFF3E0', color: '#F59E0B', label: language === 'Kinyarwanda' ? 'Sangira' : 'Share', screen: 'ShareEvent' },
          ].map((action, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.quickCard, { backgroundColor: CARD, borderColor: BORDER }]}
              onPress={() => action.screen && navigation.navigate(action.screen, action.screen === 'LiveFeed' || action.screen === 'ShareEvent' ? { event: selectedEvent } : undefined)}
            >
              <View style={[styles.quickIcon, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={[styles.quickLabel, { color: TEXT }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* BOTTOM TAB */}
      <View style={[styles.tabBar, { backgroundColor: CARD, borderTopColor: BORDER }]}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color={SUB} />
          <Text style={[styles.tabLabel, { color: SUB }]}>{language === 'Kinyarwanda' ? 'Ahabanza' : 'Home'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="grid" size={22} color={WINE} />
          <Text style={[styles.tabLabel, { color: WINE, fontWeight: '700' }]}>{language === 'Kinyarwanda' ? 'Ikibaho' : 'Dashboard'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabCenter} onPress={() => navigation.navigate('CreateEvent')}>
          <View style={styles.tabCenterBtn}><Ionicons name="add" size={28} color={WHITE} /></View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Wallet')}>
          <Ionicons name="wallet-outline" size={22} color={SUB} />
          <Text style={[styles.tabLabel, { color: SUB }]}>{language === 'Kinyarwanda' ? 'Amafaranga' : 'Wallet'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={22} color={SUB} />
          <Text style={[styles.tabLabel, { color: SUB }]}>{language === 'Kinyarwanda' ? 'Umwirondoro' : 'Profile'}</Text>
        </TouchableOpacity>
      </View>

      {/* EDIT MODAL */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
            <View style={[styles.modalBox, { backgroundColor: CARD }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: TEXT }]}>Edit Event ✏️</Text>
                <TouchableOpacity onPress={() => setEditModal(false)}>
                  <Ionicons name="close" size={24} color={TEXT} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.modalLabel, { color: TEXT }]}>Event Title *</Text>
              <TextInput style={[styles.modalInput, { borderColor: BORDER, color: TEXT, backgroundColor: BG }]} value={editTitle} onChangeText={setEditTitle} placeholder="Event title" placeholderTextColor="#BBBBBB" />
              <Text style={[styles.modalLabel, { color: TEXT }]}>Location</Text>
              <TextInput style={[styles.modalInput, { borderColor: BORDER, color: TEXT, backgroundColor: BG }]} value={editLocation} onChangeText={setEditLocation} placeholder="Kigali, Rwanda" placeholderTextColor="#BBBBBB" />
              <Text style={[styles.modalLabel, { color: TEXT }]}>Description</Text>
              <TextInput style={[styles.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 12, borderColor: BORDER, color: TEXT, backgroundColor: BG }]} value={editDescription} onChangeText={setEditDescription} placeholder="Tell guests about your event" placeholderTextColor="#BBBBBB" multiline />
              <Text style={[styles.modalLabel, { color: TEXT }]}>Goal Amount (RWF)</Text>
              <TextInput style={[styles.modalInput, { borderColor: BORDER, color: TEXT, backgroundColor: BG }]} value={editGoalAmount} onChangeText={setEditGoalAmount} placeholder="10000000" placeholderTextColor="#BBBBBB" keyboardType="numeric" />
              <Text style={[styles.modalLabel, { color: TEXT }]}>Your Phone (for payments)</Text>
              <TextInput style={[styles.modalInput, { borderColor: BORDER, color: TEXT, backgroundColor: BG }]} value={editOwnerPhone} onChangeText={setEditOwnerPhone} placeholder="0781 234 567" placeholderTextColor="#BBBBBB" keyboardType="phone-pad" />
              <Text style={[styles.modalLabel, { color: TEXT }]}>Payment Method</Text>
              <View style={styles.paymentRow}>
                {['mtn', 'airtel'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[styles.paymentOption, { borderColor: BORDER }, editPaymentMethod === method && styles.paymentOptionActive]}
                    onPress={() => setEditPaymentMethod(method)}
                  >
                    <Text style={[styles.paymentOptionText, { color: SUB }, editPaymentMethod === method && { color: WINE }]}>
                      {method === 'mtn' ? '📱 MTN MoMo' : '📱 Airtel Money'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalBtns}>
                <TouchableOpacity style={[styles.modalCancel, { borderColor: BORDER }]} onPress={() => setEditModal(false)}>
                  <Text style={[styles.modalCancelText, { color: SUB }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={handleSaveEdit} disabled={saving}>
                  {saving ? <ActivityIndicator color={WHITE} size="small" /> : <Text style={styles.modalSaveText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: { position: 'relative', padding: 4 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: WINE, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 9, color: WHITE, fontWeight: '700' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 12, fontWeight: '800', color: WINE, marginBottom: 2, textAlign: 'center' },
  statLabel: { fontSize: 10, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  eventCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1.5, gap: 10 },
  eventImage: { width: 60, height: 60, borderRadius: 10 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  eventType: { fontSize: 12, marginBottom: 6 },
  progressBar: { height: 4, borderRadius: 2, marginBottom: 4 },
  progressFill: { height: 4, backgroundColor: WINE, borderRadius: 2 },
  progressText: { fontSize: 11 },
  eventActions: { flexDirection: 'column', gap: 6 },
  editBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: WINE_LIGHT, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: WINE },
  deleteBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FF3B30' },
  viewBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: WINE_LIGHT, justifyContent: 'center', alignItems: 'center' },
  createPrompt: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, gap: 8, borderWidth: 1.5, borderStyle: 'dashed', backgroundColor: WINE_LIGHT },
  createPromptText: { fontSize: 15, fontWeight: '700', color: WINE },
  detailsCard: { borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  detailsActions: { flexDirection: 'row', gap: 8 },
  detailEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: WINE_LIGHT, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: WINE },
  detailEditText: { fontSize: 12, fontWeight: '700', color: WINE },
  detailDeleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF0F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#FF3B30' },
  detailDeleteText: { fontSize: 12, fontWeight: '700', color: '#FF3B30' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  detailItem: { width: '47%', borderRadius: 12, padding: 12, alignItems: 'center' },
  detailIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  detailLabel: { fontSize: 11, marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '800' },
  bigProgressBar: { height: 8, borderRadius: 4, marginBottom: 6 },
  bigProgressFill: { height: 8, backgroundColor: WINE, borderRadius: 4 },
  bigProgressText: { fontSize: 12, textAlign: 'right', fontWeight: '600' },
  emptyContrib: { alignItems: 'center', paddingVertical: 32, gap: 8, marginBottom: 20 },
  emptyContribText: { fontSize: 16, fontWeight: '700' },
  emptyContribSub: { fontSize: 13, textAlign: 'center' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WINE, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 8 },
  shareBtnText: { color: WHITE, fontSize: 14, fontWeight: '600' },
  contribList: { borderRadius: 16, borderWidth: 1, marginBottom: 20, overflow: 'hidden' },
  contribRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  contribAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  contribInitials: { fontSize: 14, fontWeight: '800' },
  contribInfo: { flex: 1 },
  contribName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  contribPhone: { fontSize: 12, marginBottom: 2 },
  contribMessage: { fontSize: 12, fontStyle: 'italic', marginBottom: 2 },
  contribTime: { fontSize: 11 },
  contribRight: { alignItems: 'flex-end', gap: 4 },
  contribAmount: { fontSize: 13, fontWeight: '800' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '700' },
  rowDivider: { height: 1, marginHorizontal: 14 },
  quickGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, gap: 8 },
  quickIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  tabBar: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingBottom: Platform.OS === 'android' ? 8 : 4, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, marginTop: 2 },
  tabCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabCenterBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: WINE, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: WINE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  modalInput: { borderWidth: 1.5, borderRadius: 14, height: 54, paddingHorizontal: 16, fontSize: 15, marginBottom: 16 },
  paymentRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  paymentOption: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  paymentOptionActive: { borderColor: WINE, backgroundColor: WINE_LIGHT },
  paymentOptionText: { fontSize: 13, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, borderWidth: 1.5, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600' },
  modalSave: { flex: 1, backgroundColor: WINE, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: WHITE },
});