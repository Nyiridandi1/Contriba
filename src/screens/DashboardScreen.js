import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, StatusBar, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDashboard, getToken } from '../api';

const WINE      = '#7A001F';
const WINE_LIGHT = '#FDF0F3';
const GREEN     = '#1A9E4A';
const WHITE     = '#FFFFFF';
const LIGHT_GREY = '#F5F5F5';
const MID_GREY  = '#E0E0E0';
const DARK_GREY = '#666666';
const TEXT      = '#1A1A1A';
const BASE_URL  = 'https://contriba-backend-production.up.railway.app';

const formatAmount = (val) => 'RWF ' + (val || 0).toLocaleString('en-RW');
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
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
  const [dashboard, setDashboard]           = useState(null);
  const [user, setUser]                     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [selectedEvent, setSelectedEvent]   = useState(null);
  const [contributions, setContributions]   = useState([]);
  const [loadingContrib, setLoadingContrib] = useState(false);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={WINE} size="large" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSub}>Hello, {getUserName()} 👋</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={TEXT} />
            {dashboard?.unread_notifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{dashboard.unread_notifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: WINE, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: WHITE, fontWeight: '800', fontSize: 14 }}>
                  {getInitials(user?.name)}
                </Text>
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
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboard?.total_events || 0}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatAmount(dashboard?.total_raised)}</Text>
            <Text style={styles.statLabel}>Total Raised</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboard?.total_contributors || 0}</Text>
            <Text style={styles.statLabel}>Contributors</Text>
          </View>
        </View>

        {/* MY EVENTS */}
        {dashboard?.events?.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>My Events</Text>
            {dashboard.events.map((event) => {
              const prog = event.goal_amount > 0 ? Math.min((event.total_raised || 0) / event.goal_amount, 1) : 0;
              const pct = Math.round(prog * 100);
              return (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.eventCard, selectedEvent?.id === event.id && styles.eventCardSelected]}
                  onPress={() => {
                    setSelectedEvent(event);
                    loadContributions(event.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={getEventImage(event)}
                    style={styles.eventImage}
                    resizeMode="cover"
                  />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventType}>{event.type} • {formatDate(event.date)}</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{formatAmount(event.total_raised)} raised • {pct}%</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => navigation.navigate('EventPage', { event })}
                  >
                    <Ionicons name="arrow-forward" size={16} color={WINE} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </>
        ) : (
          <TouchableOpacity style={styles.createPrompt} onPress={() => navigation.navigate('CreateEvent')}>
            <Ionicons name="add-circle-outline" size={32} color={WINE} />
            <Text style={styles.createPromptText}>Create your first event!</Text>
          </TouchableOpacity>
        )}

        {/* SELECTED EVENT DETAILS */}
        {selectedEvent && (
          <>
            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Event Overview</Text>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: '#FFE4E9' }]}>
                    <Ionicons name="wallet-outline" size={20} color={WINE} />
                  </View>
                  <Text style={styles.detailLabel}>Total Raised</Text>
                  <Text style={[styles.detailValue, { color: WINE }]}>{formatAmount(selectedEvent.total_raised)}</Text>
                </View>

                <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="people-outline" size={20} color={GREEN} />
                  </View>
                  <Text style={styles.detailLabel}>Contributors</Text>
                  <Text style={[styles.detailValue, { color: GREEN }]}>{selectedEvent.total_contributors || contributions.length}</Text>
                </View>

                <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: '#EDE7F6' }]}>
                    <Ionicons name="time-outline" size={20} color="#7C3AED" />
                  </View>
                  <Text style={styles.detailLabel}>Days Left</Text>
                  <Text style={[styles.detailValue, { color: '#7C3AED' }]}>{getDaysLeft(selectedEvent.date)}</Text>
                </View>

                <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="flag-outline" size={20} color="#F59E0B" />
                  </View>
                  <Text style={styles.detailLabel}>Goal</Text>
                  <Text style={[styles.detailValue, { color: '#F59E0B', fontSize: 12 }]}>{formatAmount(selectedEvent.goal_amount)}</Text>
                </View>
              </View>

              <View style={styles.bigProgressBar}>
                <View style={[styles.bigProgressFill, { width: `${percent}%` }]} />
              </View>
              <Text style={styles.bigProgressText}>{percent}% of goal reached</Text>
            </View>

            {/* CONTRIBUTIONS LIST */}
            <Text style={styles.sectionTitle}>All Contributions</Text>

            {loadingContrib ? (
              <ActivityIndicator color={WINE} style={{ marginVertical: 20 }} />
            ) : contributions.length === 0 ? (
              <View style={styles.emptyContrib}>
                <Ionicons name="heart-outline" size={40} color={DARK_GREY} />
                <Text style={styles.emptyContribText}>No contributions yet</Text>
                <Text style={styles.emptyContribSub}>Share your event to start receiving contributions!</Text>
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={() => navigation.navigate('ShareEvent', { event: selectedEvent })}
                >
                  <Ionicons name="share-social-outline" size={16} color={WHITE} />
                  <Text style={styles.shareBtnText}>Share Event</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.contribList}>
                {contributions.map((item, index) => (
                  <View key={item.id}>
                    <View style={styles.contribRow}>
                      <View style={[styles.contribAvatar, { backgroundColor: item.is_anonymous ? LIGHT_GREY : WINE_LIGHT }]}>
                        <Text style={[styles.contribInitials, { color: item.is_anonymous ? DARK_GREY : WINE }]}>
                          {item.is_anonymous ? '🙈' : getInitials(item.contributor_name)}
                        </Text>
                      </View>
                      <View style={styles.contribInfo}>
                        <Text style={styles.contribName}>
                          {item.is_anonymous ? 'Anonymous 🙈' : item.contributor_name}
                        </Text>
                        <Text style={styles.contribPhone}>
                          {item.is_anonymous ? '' : item.contributor_phone}
                        </Text>
                        {item.message ? (
                          <Text style={styles.contribMessage}>"{item.message}"</Text>
                        ) : null}
                        <Text style={styles.contribTime}>{formatTime(item.created_at)}</Text>
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
                    {index < contributions.length - 1 && <View style={styles.rowDivider} />}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('CreateEvent')}>
            <View style={[styles.quickIcon, { backgroundColor: WINE_LIGHT }]}>
              <Ionicons name="add-circle-outline" size={24} color={WINE} />
            </View>
            <Text style={styles.quickLabel}>New Event</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => selectedEvent && navigation.navigate('LiveFeed', { event: selectedEvent })}>
            <View style={[styles.quickIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="radio-outline" size={24} color={GREEN} />
            </View>
            <Text style={styles.quickLabel}>Live Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Wallet')}>
            <View style={[styles.quickIcon, { backgroundColor: '#EDE7F6' }]}>
              <Ionicons name="wallet-outline" size={24} color="#7C3AED" />
            </View>
            <Text style={styles.quickLabel}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => selectedEvent && navigation.navigate('ShareEvent', { event: selectedEvent })}>
            <View style={[styles.quickIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="share-social-outline" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.quickLabel}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* BOTTOM TAB */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color={DARK_GREY} />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="grid" size={22} color={WINE} />
          <Text style={[styles.tabLabel, { color: WINE, fontWeight: '700' }]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabCenter} onPress={() => navigation.navigate('CreateEvent')}>
          <View style={styles.tabCenterBtn}>
            <Ionicons name="add" size={28} color={WHITE} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Wallet')}>
          <Ionicons name="wallet-outline" size={22} color={DARK_GREY} />
          <Text style={styles.tabLabel}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={22} color={DARK_GREY} />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: DARK_GREY },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: LIGHT_GREY },
  headerTitle: { fontSize: 22, fontWeight: '800', color: TEXT },
  headerSub: { fontSize: 13, color: DARK_GREY, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: { position: 'relative', padding: 4 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: WINE, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 9, color: WHITE, fontWeight: '700' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: WINE_LIGHT, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 12, fontWeight: '800', color: WINE, marginBottom: 2, textAlign: 'center' },
  statLabel: { fontSize: 10, color: DARK_GREY, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: TEXT, marginBottom: 12 },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1.5, borderColor: MID_GREY, gap: 12 },
  eventCardSelected: { borderColor: WINE, backgroundColor: WINE_LIGHT },
  eventImage: { width: 60, height: 60, borderRadius: 10 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '800', color: TEXT, marginBottom: 2 },
  eventType: { fontSize: 12, color: DARK_GREY, marginBottom: 6 },
  progressBar: { height: 4, backgroundColor: MID_GREY, borderRadius: 2, marginBottom: 4 },
  progressFill: { height: 4, backgroundColor: WINE, borderRadius: 2 },
  progressText: { fontSize: 11, color: DARK_GREY },
  viewBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: WINE_LIGHT, justifyContent: 'center', alignItems: 'center' },
  createPrompt: { backgroundColor: WINE_LIGHT, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, gap: 8, borderWidth: 1.5, borderColor: WINE, borderStyle: 'dashed' },
  createPromptText: { fontSize: 15, fontWeight: '700', color: WINE },
  detailsCard: { backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: MID_GREY },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  detailItem: { width: '47%', backgroundColor: LIGHT_GREY, borderRadius: 12, padding: 12, alignItems: 'center' },
  detailIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  detailLabel: { fontSize: 11, color: DARK_GREY, marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '800' },
  bigProgressBar: { height: 8, backgroundColor: MID_GREY, borderRadius: 4, marginBottom: 6 },
  bigProgressFill: { height: 8, backgroundColor: WINE, borderRadius: 4 },
  bigProgressText: { fontSize: 12, color: DARK_GREY, textAlign: 'right', fontWeight: '600' },
  emptyContrib: { alignItems: 'center', paddingVertical: 32, gap: 8, marginBottom: 20 },
  emptyContribText: { fontSize: 16, fontWeight: '700', color: TEXT },
  emptyContribSub: { fontSize: 13, color: DARK_GREY, textAlign: 'center' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WINE, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 8 },
  shareBtnText: { color: WHITE, fontSize: 14, fontWeight: '600' },
  contribList: { backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: MID_GREY, marginBottom: 20, overflow: 'hidden' },
  contribRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  contribAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  contribInitials: { fontSize: 14, fontWeight: '800' },
  contribInfo: { flex: 1 },
  contribName: { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 2 },
  contribPhone: { fontSize: 12, color: DARK_GREY, marginBottom: 2 },
  contribMessage: { fontSize: 12, color: DARK_GREY, fontStyle: 'italic', marginBottom: 2 },
  contribTime: { fontSize: 11, color: DARK_GREY },
  contribRight: { alignItems: 'flex-end', gap: 4 },
  contribAmount: { fontSize: 13, fontWeight: '800' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '700' },
  rowDivider: { height: 1, backgroundColor: LIGHT_GREY, marginHorizontal: 14 },
  quickGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickCard: { flex: 1, backgroundColor: WHITE, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: MID_GREY, gap: 8 },
  quickIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '700', color: TEXT, textAlign: 'center' },
  tabBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: MID_GREY, paddingBottom: Platform.OS === 'android' ? 8 : 4, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, color: DARK_GREY, marginTop: 2 },
  tabCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabCenterBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: WINE, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: WINE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});