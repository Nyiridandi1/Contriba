// src/screens/HomeScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, FlatList, Image, Dimensions, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEvents, getDashboard } from '../api';

const { width } = Dimensions.get('window');

const WINE       = '#7A001F';
const WINE_LIGHT = '#FDF0F3';
const WHITE      = '#FFFFFF';
const BLACK      = '#1A1A1A';
const GRAY       = '#888888';
const BORDER     = '#F0F0F0';

export default function HomeScreen({ navigation }) {
  const [events, setEvents]       = useState([]);
  const [myEvents, setMyEvents]   = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [user, setUser]           = useState(null);

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

      const [eventsResult, dashboardResult] = await Promise.all([
        getEvents(),
        getDashboard(),
      ]);

      if (eventsResult.success) setEvents(eventsResult.events || []);
      if (dashboardResult.success) {
        setDashboard(dashboardResult.dashboard);
        setMyEvents(dashboardResult.dashboard.events || []);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserName = () => {
    if (user?.name) return user.name.split(' ')[0];
    if (user?.phone) return user.phone;
    return 'there';
  };

  const formatAmount = (amount) => `RWF ${amount?.toLocaleString() || 0}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getProgress = (event) => {
    if (!event.goal_amount || event.goal_amount === 0) return 0;
    return Math.min((event.total_raised || 0) / event.goal_amount, 1);
  };

  const getInitials = (name, phone) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (phone) return phone.slice(-2);
    return '?';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting} numberOfLines={1} adjustsFontSizeToFit>
              {getGreeting()}, {getUserName()} 👋
            </Text>
            <Text style={styles.subGreeting}>What are we celebrating today?</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={26} color={BLACK} />
              {dashboard?.unread_notifications > 0 && <View style={styles.bellDot} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => navigation.navigate('Profile')}
            >
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.profileAvatar} />
              ) : (
                <View style={[styles.profileAvatar, styles.profileAvatarPlaceholder]}>
                  <Text style={styles.profileAvatarInitials}>
                    {getInitials(user?.name, user?.phone)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        {dashboard && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{dashboard.total_events || 0}</Text>
              <Text style={styles.statLabel}>My Events</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatAmount(dashboard.total_raised)}</Text>
              <Text style={styles.statLabel}>Total Raised</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatAmount(dashboard.wallet_balance)}</Text>
              <Text style={styles.statLabel}>Wallet</Text>
            </View>
          </View>
        )}

        {/* Create New Event */}
        <TouchableOpacity
          style={styles.createBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Text style={styles.createBtnText}>＋  Create New Event</Text>
        </TouchableOpacity>

        {/* My Events */}
        {myEvents.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Events</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={myEvents}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.upcomingCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('EventPage', { event: item })}
                >
                  <Image source={require('../../assets/couple.png')} style={styles.upcomingImage} resizeMode="cover" />
                  <View style={styles.upcomingInfo}>
                    <Text style={styles.upcomingName}>{item.title}</Text>
                    <Text style={styles.upcomingType}>{item.type}</Text>
                    <Text style={styles.upcomingDate}>{formatDate(item.date)}</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${getProgress(item) * 100}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{Math.round(getProgress(item) * 100)}%</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {/* All Events */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Events</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={WINE} size="large" style={{ marginVertical: 20 }} />
        ) : events.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={48} color={GRAY} />
            <Text style={styles.emptyText}>No events yet</Text>
            <Text style={styles.emptySubText}>Create your first event!</Text>
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.featuredCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('EventPage', { event: item })}
              >
                <Image source={require('../../assets/couple.png')} style={styles.featuredImage} resizeMode="cover" />
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredName}>{item.title}</Text>
                  <Text style={styles.featuredType}>{item.type}</Text>
                  <Text style={styles.featuredDate}>{formatDate(item.date)}</Text>
                  <Text style={styles.featuredAmount}>{formatAmount(item.total_raised)} raised</Text>
                </View>
                <View style={styles.featuredActions}>
                  <TouchableOpacity style={styles.heartBtn}>
                    <Ionicons name="heart" size={18} color={WINE} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.plusBtn}
                    onPress={() => navigation.navigate('Contribute', { event: item })}
                  >
                    <Ionicons name="add" size={22} color={WINE} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.quickActionsRow}>
          {[
            { icon: 'people',       label: 'Contributors', screen: 'Dashboard'  },
            { icon: 'qr-code',      label: 'Share QR',     screen: 'ShareEvent' },
            { icon: 'wallet',       label: 'My Wallet',    screen: 'Wallet'     },
            { icon: 'grid-outline', label: 'Dashboard',    screen: 'Dashboard'  },
          ].map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAction}
              activeOpacity={0.8}
              onPress={() => action.screen && navigation.navigate(action.screen)}
            >
              <View style={[styles.quickActionIcon, action.label === 'Dashboard' && styles.dashboardIcon]}>
                <Ionicons name={action.icon} size={32} color={action.label === 'Dashboard' ? WHITE : WINE} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home" size={24} color={WINE} />
          <Text style={styles.tabLabelActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Dashboard')}>
          <Ionicons name="grid-outline" size={24} color={GRAY} />
          <Text style={styles.tabLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Wallet')}>
          <Ionicons name="wallet-outline" size={24} color={GRAY} />
          <Text style={styles.tabLabel}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={24} color={GRAY} />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 32 : 16,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft: { flex: 1, marginRight: 8 },
  greeting: { fontSize: 20, fontWeight: '800', color: BLACK },
  subGreeting: { fontSize: 14, color: GRAY, marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: { position: 'relative', padding: 4 },
  bellDot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: WINE },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: WINE, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  profileAvatar: { width: 40, height: 40, borderRadius: 20 },
  profileAvatarPlaceholder: { backgroundColor: WINE, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  profileAvatarInitials: { fontSize: 14, fontWeight: '800', color: WHITE },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: WINE_LIGHT, borderRadius: 14, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 13, fontWeight: '800', color: WINE, marginBottom: 4 },
  statLabel: { fontSize: 11, color: GRAY, textAlign: 'center' },
  createBtn: { backgroundColor: WINE, borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 28, elevation: 7, shadowColor: WINE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  createBtnText: { color: WHITE, fontSize: 17, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: BLACK },
  seeAll: { fontSize: 14, color: WINE, fontWeight: '600' },
  horizontalList: { paddingRight: 20, marginBottom: 24 },
  upcomingCard: { flexDirection: 'row', backgroundColor: WINE_LIGHT, borderRadius: 16, marginRight: 14, overflow: 'hidden', width: width * 0.75 },
  upcomingImage: { width: 110, height: 130 },
  upcomingInfo: { flex: 1, padding: 12 },
  upcomingName: { fontSize: 16, fontWeight: '800', color: BLACK, marginBottom: 2 },
  upcomingType: { fontSize: 13, color: GRAY, marginBottom: 4 },
  upcomingDate: { fontSize: 13, color: BLACK, marginBottom: 10 },
  progressBar: { height: 6, backgroundColor: '#F0D0D8', borderRadius: 4, marginBottom: 4 },
  progressFill: { height: 6, backgroundColor: WINE, borderRadius: 4 },
  progressText: { fontSize: 12, color: GRAY, textAlign: 'right' },
  featuredCard: { flexDirection: 'row', backgroundColor: WHITE, borderRadius: 16, marginRight: 14, width: width * 0.7, borderWidth: 1, borderColor: BORDER, alignItems: 'center', padding: 10, gap: 10 },
  featuredImage: { width: 80, height: 90, borderRadius: 12 },
  featuredInfo: { flex: 1 },
  featuredName: { fontSize: 15, fontWeight: '800', color: BLACK, marginBottom: 2 },
  featuredType: { fontSize: 13, color: GRAY, marginBottom: 4 },
  featuredDate: { fontSize: 13, color: BLACK, marginBottom: 2 },
  featuredAmount: { fontSize: 12, color: WINE, fontWeight: '600' },
  featuredActions: { gap: 8, alignItems: 'center' },
  heartBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: WINE_LIGHT, justifyContent: 'center', alignItems: 'center' },
  plusBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: WINE_LIGHT, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 40, marginBottom: 24 },
  emptyText: { fontSize: 18, fontWeight: '700', color: BLACK, marginTop: 12 },
  emptySubText: { fontSize: 14, color: GRAY, marginTop: 4 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  quickAction: { alignItems: 'center', gap: 8, flex: 1 },
  quickActionIcon: { width: 72, height: 72, borderRadius: 18, backgroundColor: WINE_LIGHT, justifyContent: 'center', alignItems: 'center' },
  dashboardIcon: { backgroundColor: WINE },
  quickActionLabel: { fontSize: 11, color: BLACK, fontWeight: '600', textAlign: 'center' },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: WHITE, paddingVertical: 10, paddingHorizontal: 10 },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabLabel: { fontSize: 10, color: GRAY },
  tabLabelActive: { fontSize: 10, color: WINE, fontWeight: '700' },
});