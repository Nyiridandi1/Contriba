import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getNotifications, markNotificationRead } from '../api';

const WINE = '#7A001F';
const WHITE = '#FFFFFF';
const LIGHT_GREY = '#F5F5F5';
const MID_GREY = '#E0E0E0';
const DARK_GREY = '#666666';
const TEXT = '#1A1A1A';

const FILTERS = ['All', 'Contributions', 'Events', 'System'];

const getNotifStyle = (type) => {
  switch (type) {
    case 'contribution': return { icon: 'heart', iconBg: '#FFE4E9', iconColor: WINE };
    case 'wallet':       return { icon: 'wallet', iconBg: '#E8F5E9', iconColor: '#1A9E4A' };
    case 'event':        return { icon: 'calendar', iconBg: '#E3F2FD', iconColor: '#1976D2' };
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
  const [activeFilter, setActiveFilter]     = useState('All');
  const [notifications, setNotifications]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [unreadCount, setUnreadCount]       = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

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

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Contributions') return n.type === 'contribution';
    if (activeFilter === 'Events') return n.type === 'event';
    if (activeFilter === 'System') return n.type === 'system' || n.type === 'wallet';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && <Text style={styles.unreadCount}>{unreadCount} unread</Text>}
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={loadNotifications}>
          <Ionicons name="refresh-outline" size={22} color={TEXT} />
        </TouchableOpacity>
      </View>

      {/* FILTER TABS */}
      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <TouchableOpacity key={filter} style={styles.filterTab} onPress={() => setActiveFilter(filter)}>
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {filter}
            </Text>
            {activeFilter === filter && <View style={styles.filterUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {loading ? (
          <ActivityIndicator color={WINE} size="large" style={{ marginTop: 40 }} />
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="notifications-outline" size={56} color={DARK_GREY} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>You'll see updates about your events and contributions here!</Text>
          </View>
        ) : (
          <View style={styles.groupCard}>
            {filteredNotifications.map((item, index) => {
              const style = getNotifStyle(item.type);
              return (
                <View key={item.id}>
                  <TouchableOpacity
                    style={styles.notifRow}
                    activeOpacity={0.7}
                    onPress={() => handleMarkRead(item.id)}
                  >
                    <View style={[styles.notifIcon, { backgroundColor: style.iconBg }]}>
                      <Ionicons name={style.icon} size={20} color={style.iconColor} />
                    </View>
                    <View style={styles.notifContent}>
                      <View style={styles.notifTitleRow}>
                        <Text style={styles.notifTitle}>{item.title}</Text>
                        {!item.is_read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notifMessage}>{item.message}</Text>
                    </View>
                    <View style={styles.notifRight}>
                      <Text style={styles.notifTime}>{formatTime(item.created_at)}</Text>
                      <Ionicons name="chevron-forward" size={16} color={DARK_GREY} />
                    </View>
                  </TouchableOpacity>
                  {index < filteredNotifications.length - 1 && <View style={styles.rowDivider} />}
                </View>
              );
            })}
          </View>
        )}

        {/* STAY UPDATED BANNER */}
        <View style={styles.stayUpdatedCard}>
          <View style={styles.stayUpdatedLeft}>
            <Text style={styles.stayUpdatedTitle}>Stay Updated</Text>
            <Text style={styles.stayUpdatedSub}>Enable push notifications to never miss important updates.</Text>
          </View>
          <View style={styles.bellWrapper}>
            <Ionicons name="notifications" size={36} color={WINE} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.enableBtn}>
            <Text style={styles.enableBtnText}>Enable</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: LIGHT_GREY },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: LIGHT_GREY, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: TEXT, textAlign: 'center' },
  unreadCount: { fontSize: 11, color: WINE, fontWeight: '600', textAlign: 'center' },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: MID_GREY },
  filterTab: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  filterText: { fontSize: 13, fontWeight: '600', color: DARK_GREY },
  filterTextActive: { color: WINE },
  filterUnderline: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, backgroundColor: WINE, borderRadius: 2 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TEXT },
  emptySub: { fontSize: 14, color: DARK_GREY, textAlign: 'center', lineHeight: 22 },
  groupCard: { backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: MID_GREY, marginBottom: 20, overflow: 'hidden' },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
  notifIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: TEXT },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: WINE, marginLeft: 6 },
  notifMessage: { fontSize: 12, color: DARK_GREY, lineHeight: 18 },
  notifRight: { alignItems: 'flex-end', gap: 4, marginLeft: 8 },
  notifTime: { fontSize: 11, color: DARK_GREY },
  rowDivider: { height: 1, backgroundColor: LIGHT_GREY, marginHorizontal: 14 },
  stayUpdatedCard: { backgroundColor: LIGHT_GREY, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  stayUpdatedLeft: { flex: 1 },
  stayUpdatedTitle: { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 4 },
  stayUpdatedSub: { fontSize: 12, color: DARK_GREY, lineHeight: 18 },
  bellWrapper: { position: 'relative', padding: 4 },
  bellBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: WINE, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  bellBadgeText: { fontSize: 10, color: WHITE, fontWeight: '700' },
  enableBtn: { backgroundColor: WINE, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  enableBtnText: { fontSize: 13, fontWeight: '700', color: WHITE },
});