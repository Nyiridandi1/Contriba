import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDashboard } from '../api';

const WINE = '#7A001F';
const GREEN = '#1A9E4A';
const WHITE = '#FFFFFF';
const LIGHT_GREY = '#F5F5F5';
const MID_GREY = '#E0E0E0';
const DARK_GREY = '#666666';
const TEXT = '#1A1A1A';

const QUICK_ACTIONS = [
  { id: '1', icon: 'share-social-outline', label: 'Share Event',         sub: 'Invite friends & family', screen: 'ShareEvent' },
  { id: '2', icon: 'people-outline',       label: 'Contributors',        sub: 'View & manage list',      screen: null         },
  { id: '3', icon: 'create-outline',       label: 'Edit Event',          sub: 'Update event info',       screen: null         },
  { id: '4', icon: 'bar-chart-outline',    label: 'View Reports',        sub: 'See full breakdown',      screen: null         },
];

export default function DashboardScreen({ navigation }) {
  const [activeTab, setActiveTab]   = useState('dashboard');
  const [dashboard, setDashboard]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [thankedIds, setThankedIds] = useState([]);

  useEffect(() => {
    loadDashboard();
    const unsubscribe = navigation.addListener('focus', loadDashboard);
    return unsubscribe;
  }, [navigation]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = await getDashboard();
      if (result.success) setDashboard(result.dashboard);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (val) => 'RWF ' + (val || 0).toLocaleString('en-RW');

  const getDaysLeft = (dateStr) => {
    if (!dateStr) return 0;
    const diff = new Date(dateStr) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleThankYou = (id) => {
    if (!thankedIds.includes(id)) setThankedIds([...thankedIds, id]);
  };

  const firstEvent = dashboard?.events?.[0];
  const progress = firstEvent && firstEvent.goal_amount > 0
    ? Math.min((firstEvent.total_raised || 0) / firstEvent.goal_amount, 1)
    : 0;
  const percent = Math.round(progress * 100);

  const TABS = [
    { id: 'dashboard',     icon: 'home',                label: 'Dashboard'     },
    { id: 'contributions', icon: 'people-outline',      label: 'Contributions' },
    { id: 'contribute',    icon: 'add',                 label: '', isCenter: true },
    { id: 'gifts',         icon: 'gift-outline',        label: 'Gifts'         },
    { id: 'more',          icon: 'ellipsis-horizontal', label: 'More'          },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Ionicons name="heart" size={18} color={WINE} />
          </View>
          <View>
            <Text style={styles.logoText}>Contriba</Text>
            <Text style={styles.logoSub}>Celebrate love, together</Text>
          </View>
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
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
            <Image source={require('../../assets/couple.png')} style={styles.avatar} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={WINE} size="large" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* GREETING */}
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingTitle}>Hello! 👋</Text>
              <Text style={styles.greetingSub}>Here's what's happening with your events.</Text>
            </View>
            <View style={styles.ownerBadge}>
              <Ionicons name="ribbon-outline" size={14} color={WINE} />
              <Text style={styles.ownerBadgeText}>Event Owner</Text>
            </View>
          </View>

          {/* STATS OVERVIEW */}
          <View style={styles.statsRow}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatValue}>{dashboard?.total_events || 0}</Text>
              <Text style={styles.miniStatLabel}>Events</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatValue}>{formatAmount(dashboard?.total_raised)}</Text>
              <Text style={styles.miniStatLabel}>Total Raised</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatValue}>{dashboard?.total_contributors || 0}</Text>
              <Text style={styles.miniStatLabel}>Contributors</Text>
            </View>
          </View>

          {/* MY EVENT CARD */}
          {firstEvent ? (
            <View style={styles.eventCard}>
              <Image source={require('../../assets/couple.png')} style={styles.eventImage} resizeMode="cover" />
              <View style={styles.eventInfo}>
                <Text style={styles.myEventLabel}>My Event</Text>
                <Text style={styles.eventTitle}>{firstEvent.title}</Text>
                <View style={styles.eventMeta}>
                  <Ionicons name="calendar-outline" size={12} color={DARK_GREY} />
                  <Text style={styles.eventMetaText}>{firstEvent.date}</Text>
                  <Text style={styles.metaDot}>|</Text>
                  <Ionicons name="location-outline" size={12} color={DARK_GREY} />
                  <Text style={styles.eventMetaText}>{firstEvent.location || 'Kigali'}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewEventBtn}
                onPress={() => navigation.navigate('EventPage', { event: firstEvent })}
              >
                <Text style={styles.viewEventText}>View</Text>
                <Ionicons name="arrow-forward" size={13} color={WINE} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.createEventPrompt}
              onPress={() => navigation.navigate('CreateEvent')}
            >
              <Ionicons name="add-circle-outline" size={32} color={WINE} />
              <Text style={styles.createEventText}>Create your first event!</Text>
            </TouchableOpacity>
          )}

          {/* OVERVIEW STATS */}
          {firstEvent && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Overview</Text>
              </View>

              <View style={styles.statsGrid}>
                {/* Total Collected */}
                <View style={[styles.statCard, styles.statCardWide]}>
                  <View style={[styles.statIconBox, { backgroundColor: '#FFE4E9' }]}>
                    <Ionicons name="wallet-outline" size={20} color={WINE} />
                  </View>
                  <Text style={styles.statLabel}>Total Collected</Text>
                  <Text style={[styles.statValue, { color: WINE, fontSize: 16 }]}>
                    {formatAmount(firstEvent.total_raised)}
                  </Text>
                  <Text style={styles.statGoal}>of {formatAmount(firstEvent.goal_amount)}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${percent}%` }]} />
                  </View>
                  <Text style={styles.progressPercent}>{percent}% of goal</Text>
                </View>

                {/* Days Left */}
                <View style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: '#EDE7F6' }]}>
                    <Ionicons name="time-outline" size={20} color="#7C3AED" />
                  </View>
                  <Text style={styles.statLabel}>Days Left</Text>
                  <Text style={[styles.statValue, { color: '#7C3AED' }]}>{getDaysLeft(firstEvent.date)}</Text>
                  <Text style={styles.untilText}>Until the event</Text>
                </View>

                {/* Wallet Balance */}
                <View style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="cash-outline" size={20} color={GREEN} />
                  </View>
                  <Text style={styles.statLabel}>Wallet</Text>
                  <Text style={[styles.statValue, { color: GREEN, fontSize: 13 }]}>
                    {formatAmount(dashboard?.wallet_balance)}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
                    <Text style={styles.statLinkText}>Withdraw →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* RECENT CONTRIBUTIONS */}
          {dashboard?.recent_contributions?.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Contributions</Text>
              </View>
              <View style={styles.contributionsCard}>
                {dashboard.recent_contributions.slice(0, 5).map((item, index) => (
                  <View key={item.id}>
                    <View style={styles.contributionRow}>
                      <View style={styles.initialsAvatar}>
                        <Text style={styles.initialsText}>{item.contributor_name?.[0] || '?'}</Text>
                      </View>
                      <View style={styles.contributorInfo}>
                        <Text style={styles.contributorName}>{item.contributor_name}</Text>
                        <Text style={styles.contributorTime}>{item.contributor_phone}</Text>
                      </View>
                      <View style={styles.contributionRight}>
                        <Text style={styles.contributionAmount}>{formatAmount(item.amount)}</Text>
                        <TouchableOpacity
                          style={[styles.thankBtn, thankedIds.includes(item.id) && styles.thankBtnActive]}
                          onPress={() => handleThankYou(item.id)}
                        >
                          <Text style={[styles.thankBtnText, thankedIds.includes(item.id) && styles.thankBtnTextActive]}>
                            Thank You
                          </Text>
                          <Ionicons name={thankedIds.includes(item.id) ? 'heart' : 'heart-outline'} size={13} color={thankedIds.includes(item.id) ? WHITE : WINE} style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {index < dashboard.recent_contributions.slice(0, 5).length - 1 && <View style={styles.rowDivider} />}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* QUICK ACTIONS */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                activeOpacity={0.7}
                onPress={() => action.screen && navigation.navigate(action.screen)}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name={action.icon} size={22} color={WINE} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
                <Text style={styles.quickActionSub}>{action.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* BOTTOM TAB BAR */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          if (tab.isCenter) {
            return (
              <TouchableOpacity key={tab.id} style={styles.tabCenter} activeOpacity={0.8} onPress={() => navigation.navigate('CreateEvent')}>
                <View style={styles.tabCenterBtn}>
                  <Ionicons name="add" size={28} color={WHITE} />
                </View>
              </TouchableOpacity>
            );
          }
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity key={tab.id} style={styles.tabItem} onPress={() => setActiveTab(tab.id)} activeOpacity={0.7}>
              <Ionicons name={tab.icon} size={22} color={isActive ? WINE : DARK_GREY} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: LIGHT_GREY },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFE4E9', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  logoText: { fontSize: 16, fontWeight: '800', color: WINE },
  logoSub: { fontSize: 10, color: DARK_GREY },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: { position: 'relative', padding: 4 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: WINE, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 9, color: WHITE, fontWeight: '700' },
  avatarBtn: { marginLeft: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: DARK_GREY },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  greetingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  greetingTitle: { fontSize: 22, fontWeight: '800', color: TEXT, marginBottom: 2 },
  greetingSub: { fontSize: 13, color: DARK_GREY },
  ownerBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: WINE, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  ownerBadgeText: { fontSize: 12, fontWeight: '600', color: WINE, marginLeft: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  miniStat: { flex: 1, backgroundColor: '#FDF0F3', borderRadius: 12, padding: 10, alignItems: 'center' },
  miniStatValue: { fontSize: 12, fontWeight: '800', color: WINE, marginBottom: 2 },
  miniStatLabel: { fontSize: 10, color: DARK_GREY, textAlign: 'center' },
  eventCard: { backgroundColor: LIGHT_GREY, borderRadius: 16, overflow: 'hidden', marginBottom: 20, flexDirection: 'row', alignItems: 'center', padding: 12 },
  eventImage: { width: 70, height: 70, borderRadius: 10 },
  eventInfo: { flex: 1, paddingHorizontal: 12 },
  myEventLabel: { fontSize: 11, fontWeight: '700', color: WINE, marginBottom: 2 },
  eventTitle: { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 4 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 3 },
  eventMetaText: { fontSize: 11, color: DARK_GREY, marginLeft: 2 },
  metaDot: { fontSize: 11, color: DARK_GREY, marginHorizontal: 2 },
  viewEventBtn: { borderWidth: 1.5, borderColor: WINE, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewEventText: { fontSize: 12, fontWeight: '600', color: WINE },
  createEventPrompt: { backgroundColor: '#FDF0F3', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, gap: 8, borderWidth: 1.5, borderColor: WINE, borderStyle: 'dashed' },
  createEventText: { fontSize: 15, fontWeight: '700', color: WINE },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: TEXT, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { backgroundColor: WHITE, borderRadius: 14, padding: 14, width: '47%', borderWidth: 1, borderColor: MID_GREY },
  statCardWide: { width: '100%' },
  statIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statLabel: { fontSize: 12, color: DARK_GREY, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  statGoal: { fontSize: 11, color: DARK_GREY, marginBottom: 6 },
  progressBar: { height: 6, backgroundColor: MID_GREY, borderRadius: 3, marginBottom: 4 },
  progressFill: { height: 6, backgroundColor: WINE, borderRadius: 3 },
  progressPercent: { fontSize: 11, fontWeight: '600', color: WINE },
  statLinkText: { fontSize: 11, fontWeight: '600', color: WINE, marginTop: 4 },
  untilText: { fontSize: 11, color: DARK_GREY, marginTop: 6 },
  contributionsCard: { backgroundColor: WHITE, borderRadius: 14, borderWidth: 1, borderColor: MID_GREY, marginBottom: 20, overflow: 'hidden' },
  contributionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  initialsAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFE4E9', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  initialsText: { fontSize: 13, fontWeight: '700', color: WINE },
  contributorInfo: { flex: 1 },
  contributorName: { fontSize: 14, fontWeight: '600', color: TEXT },
  contributorTime: { fontSize: 11, color: DARK_GREY, marginTop: 2 },
  contributionRight: { alignItems: 'flex-end', gap: 6 },
  contributionAmount: { fontSize: 13, fontWeight: '700', color: GREEN },
  thankBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: WINE, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  thankBtnActive: { backgroundColor: WINE },
  thankBtnText: { fontSize: 11, fontWeight: '600', color: WINE },
  thankBtnTextActive: { color: WHITE },
  rowDivider: { height: 1, backgroundColor: LIGHT_GREY, marginHorizontal: 14 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickActionCard: { backgroundColor: WHITE, borderRadius: 14, borderWidth: 1, borderColor: MID_GREY, padding: 14, width: '47%', alignItems: 'center' },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFE4E9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickActionLabel: { fontSize: 13, fontWeight: '700', color: TEXT, textAlign: 'center', marginBottom: 2 },
  quickActionSub: { fontSize: 11, color: DARK_GREY, textAlign: 'center' },
  tabBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: MID_GREY, paddingBottom: 4, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, color: DARK_GREY, marginTop: 2 },
  tabLabelActive: { color: WINE, fontWeight: '600' },
  tabCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabCenterBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: WINE, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: WINE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});