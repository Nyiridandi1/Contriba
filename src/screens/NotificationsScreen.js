import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, ActivityIndicator, Switch, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { getNotifications, markNotificationRead } from '../api';
import { useTheme } from '../context/ThemeContext';

const WINE  = '#CC0000';
const WHITE = '#FFFFFF';
const GREEN = '#1A9E4A';
const BASE_URL = 'https://contriba-backend-production.up.railway.app';

const getNotifStyle = (type) => {
  switch (type) {
    case 'contribution': return { icon: 'heart',         iconBg: '#FFE4E9', iconColor: WINE      };
    case 'wallet':       return { icon: 'wallet',        iconBg: '#E8F5E9', iconColor: '#1A9E4A' };
    case 'event':        return { icon: 'calendar',      iconBg: '#E3F2FD', iconColor: '#1976D2' };
    case 'comment':      return { icon: 'chatbubble',    iconBg: '#EDE7F6', iconColor: '#7C3AED' };
    case 'goal_reached': return { icon: 'trophy',        iconBg: '#FFF3E0', iconColor: '#F59E0B' };
    default:             return { icon: 'notifications', iconBg: '#EDE7F6', iconColor: '#7C3AED' };
  }
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function NotificationsScreen({ navigation }) {
  const { darkMode, language, colors } = useTheme();
  const { BG, CARD, TEXT, SUB, BORDER, DIV } = colors;

  const [activeFilter, setActiveFilter]   = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [pushEnabled, setPushEnabled]     = useState(false);
  const [navigating, setNavigating]       = useState(false);

  const FILTERS = [
    { key: 'All',           label: language === 'Kinyarwanda' ? 'Byose'    : 'All'           },
    { key: 'Contributions', label: language === 'Kinyarwanda' ? 'Inkunga'  : 'Contributions' },
    { key: 'Events',        label: language === 'Kinyarwanda' ? 'Ibirori'  : 'Events'        },
    { key: 'System',        label: language === 'Kinyarwanda' ? 'Sisitemu' : 'System'        },
  ];

  useEffect(() => {
    loadNotifications();
    checkPushPermission();
  }, []);

  // ✅ Fixed — no destructuring of 'status'
  const checkPushPermission = async () => {
    const permResult = await Notifications.getPermissionsAsync();
    setPushEnabled(permResult.status === 'granted');
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await getNotifications();
      if (result.success) {
        setNotifications(result.notifications || []);
        setUnreadCount(result.unread_count || 0);
      }
    } catch (error) {
      console.error('Notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fixed — no destructuring of 'status'
  const handleTogglePush = async (value) => {
    if (value) {
      const permResult = await Notifications.requestPermissionsAsync();
      setPushEnabled(permResult.status === 'granted');
    } else {
      setPushEnabled(false);
    }
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleNotifPress = async (item) => {
    await handleMarkRead(item.id);
    if (item.type === 'wallet') {
      navigation.navigate('Wallet');
      return;
    }
    if (item.event_id) {
      try {
        setNavigating(true);
        const response = await fetch(`${BASE_URL}/api/events/${item.event_id}`);
        const result = await response.json();
        if (result.success && result.event) {
          navigation.navigate('EventPage', { event: result.event });
        } else {
          navigation.navigate('Dashboard');
        }
      } catch (error) {
        console.error('Navigate error:', error);
        navigation.navigate('Dashboard');
      } finally {
        setNavigating(false);
      }
    } else {
      navigation.navigate('Dashboard');
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Contributions') return n.type === 'contribution' || n.type === 'goal_reached';
    if (activeFilter === 'Events') return n.type === 'event' || n.type === 'comment';
    if (activeFilter === 'System') return n.type === 'system' || n.type === 'wallet';
    return true;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: BG }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={WINE} />

      {/* WINE RED LOGO HEADER */}
      <View style={styles.logoHeader}>
        <View style={styles.logoHeaderLeft}>
          <Image source={require('../../assets/icon.png')} style={styles.logoImg} resizeMode="contain" />
          <View>
            <Text style={styles.logoTitle}>Contriba</Text>
            <Text style={styles.logoSub}>Contribute Easily. Smart & Secure.</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadNotifications}>
          <Ionicons name="refresh-outline" size={22} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* TITLE BAR */}
      <View style={[styles.titleBar, { backgroundColor: CARD, borderBottomColor: BORDER }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: darkMode ? '#2A2A2A' : '#F5F5F5' }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <View style={styles.titleCenter}>
          <Text style={[styles.headerTitle, { color: TEXT }]}>
            {language === 'Kinyarwanda' ? 'Impinduka' : 'Notifications'}
          </Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>
              {unreadCount} {language === 'Kinyarwanda' ? 'ntabisomwe' : 'unread'}
            </Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* FILTER TABS */}
      <View style={[styles.filterRow, { backgroundColor: CARD, borderBottomColor: BORDER }]}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={styles.filterTab}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Text style={[styles.filterText, { color: SUB }, activeFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
            {activeFilter === filter.key && <View style={styles.filterUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* NAVIGATING OVERLAY */}
      {navigating && (
        <View style={styles.navigatingOverlay}>
          <ActivityIndicator color={WINE} size="large" />
          <Text style={[styles.navigatingText, { color: TEXT }]}>
            {language === 'Kinyarwanda' ? 'Gutegereza...' : 'Opening event...'}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {loading ? (
          <ActivityIndicator color={WINE} size="large" style={{ marginTop: 40 }} />
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="notifications-outline" size={56} color={SUB} />
            <Text style={[styles.emptyTitle, { color: TEXT }]}>
              {language === 'Kinyarwanda' ? 'Nta mpinduka nawe' : 'No notifications yet'}
            </Text>
            <Text style={[styles.emptySub, { color: SUB }]}>
              {language === 'Kinyarwanda'
                ? 'Uzabona ibyerekeye ibirori n\'inkunga hano!'
                : "You'll see updates about your events and contributions here!"}
            </Text>
          </View>
        ) : (
          <View style={[styles.groupCard, { backgroundColor: CARD, borderColor: BORDER }]}>
            {filteredNotifications.map((item, index) => {
              const notifStyle = getNotifStyle(item.type);
              return (
                <View key={item.id}>
                  <TouchableOpacity
                    style={[styles.notifRow, !item.is_read && { backgroundColor: darkMode ? '#1A0A0E' : '#FFF5F7' }]}
                    activeOpacity={0.7}
                    onPress={() => handleNotifPress(item)}
                    disabled={navigating}
                  >
                    <View style={[styles.notifIcon, { backgroundColor: notifStyle.iconBg }]}>
                      <Ionicons name={notifStyle.icon} size={20} color={notifStyle.iconColor} />
                    </View>
                    <View style={styles.notifContent}>
                      <View style={styles.notifTitleRow}>
                        <Text style={[styles.notifTitle, { color: TEXT }]}>{item.title}</Text>
                        {!item.is_read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={[styles.notifMessage, { color: SUB }]}>{item.message}</Text>
                    </View>
                    <View style={styles.notifRight}>
                      <Text style={[styles.notifTime, { color: SUB }]}>{formatTime(item.created_at)}</Text>
                      <Ionicons name="chevron-forward" size={16} color={SUB} />
                    </View>
                  </TouchableOpacity>
                  {index < filteredNotifications.length - 1 && (
                    <View style={[styles.rowDivider, { backgroundColor: DIV }]} />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Push Notifications Toggle */}
        <View style={[styles.stayUpdatedCard, { backgroundColor: darkMode ? '#1A1A1A' : '#F5F5F5' }]}>
          <View style={styles.stayUpdatedLeft}>
            <Text style={[styles.stayUpdatedTitle, { color: TEXT }]}>
              {language === 'Kinyarwanda' ? 'Komeza Gutumanahana' : 'Push Notifications'}
            </Text>
            <Text style={[styles.stayUpdatedSub, { color: SUB }]}>
              {pushEnabled
                ? (language === 'Kinyarwanda' ? 'Impinduka zifunguye ✅' : 'Notifications enabled ✅')
                : (language === 'Kinyarwanda' ? 'Fungura kugirango utakaze amakuru' : 'Enable to never miss updates')}
            </Text>
          </View>
          <View style={styles.bellWrapper}>
            <Ionicons name={pushEnabled ? 'notifications' : 'notifications-off'} size={32} color={pushEnabled ? GREEN : SUB} />
            {unreadCount > 0 && pushEnabled && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={handleTogglePush}
            trackColor={{ false: '#CCCCCC', true: GREEN }}
            thumbColor={WHITE}
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  logoHeader: { backgroundColor: WINE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  logoHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImg: { width: 40, height: 40, borderRadius: 10 },
  logoTitle: { fontSize: 17, fontWeight: '800', color: WHITE },
  logoSub: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  refreshBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  titleBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  titleCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  unreadCount: { fontSize: 11, color: WINE, fontWeight: '600', textAlign: 'center' },
  filterRow: { flexDirection: 'row', borderBottomWidth: 1 },
  filterTab: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  filterText: { fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: WINE },
  filterUnderline: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, backgroundColor: WINE, borderRadius: 2 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  groupCard: { borderRadius: 16, borderWidth: 1, marginBottom: 20, overflow: 'hidden' },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
  notifIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: WINE, marginLeft: 6 },
  notifMessage: { fontSize: 12, lineHeight: 18 },
  notifRight: { alignItems: 'flex-end', gap: 4, marginLeft: 8 },
  notifTime: { fontSize: 11 },
  rowDivider: { height: 1, marginHorizontal: 14 },
  stayUpdatedCard: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  stayUpdatedLeft: { flex: 1 },
  stayUpdatedTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  stayUpdatedSub: { fontSize: 12, lineHeight: 18 },
  bellWrapper: { position: 'relative', padding: 4 },
  bellBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: WINE, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  bellBadgeText: { fontSize: 10, color: WHITE, fontWeight: '700' },
  navigatingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 999, justifyContent: 'center', alignItems: 'center', gap: 12 },
  navigatingText: { fontSize: 15, fontWeight: '600' },
});