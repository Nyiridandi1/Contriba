// src/screens/HomeScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, FlatList, Image, Dimensions,
  ActivityIndicator, Platform, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEvents, getDashboard } from '../api';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const WINE       = '#E60012';
const WINE_LIGHT = '#FDF0F3';
const WHITE      = '#FFFFFF';
const BLACK      = '#1A1A1A';
const GRAY       = '#888888';
const BORDER     = '#F0F0F0';

const CARD_WIDTH  = width * 0.52;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const CATEGORIES = [
  { key: 'All',          label: 'All',          icon: 'grid-outline'         },
  { key: 'Wedding',      label: 'Wedding',       icon: 'heart-outline'        },
  { key: 'Birthday',     label: 'Birthday',      icon: 'gift-outline'         },
  { key: 'Graduation',   label: 'Graduation',    icon: 'school-outline'       },
  { key: 'Funeral',      label: 'Funeral',       icon: 'flower-outline'       },
  { key: 'Church',       label: 'Church',        icon: 'sunny-outline'        },
  { key: 'Introduction', label: 'Introduction',  icon: 'people-outline'       },
  { key: 'Other',        label: 'Other',         icon: 'ellipsis-horizontal'  },
];

export default function HomeScreen({ navigation }) {
  const { darkMode, language, colors } = useTheme();
  const { BG, CARD, TEXT, SUB, BORDER: BORDER_C } = colors;

  const [events, setEvents]                 = useState([]);
  const [myEvents, setMyEvents]             = useState([]);
  const [dashboard, setDashboard]           = useState(null);
  const [loading, setLoading]               = useState(true);
  const [user, setUser]                     = useState(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchActive, setSearchActive]     = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

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

  const filteredEvents = events.filter((e) => {
    const matchCategory = activeCategory === 'All' || e.type === activeCategory;
    if (!searchQuery.trim()) return matchCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = (
      e.title?.toLowerCase().includes(q) ||
      e.type?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q)
    );
    return matchCategory && matchSearch;
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === 'Kinyarwanda') {
      if (hour < 12) return 'Mwaramutse';
      if (hour < 17) return 'Mwiriwe';
      return 'Muraho';
    }
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

  const getEventImage = (item) => {
    if (item.cover_image) return { uri: item.cover_image };
    return require('../../assets/couple.png');
  };

  // Portrait Event Card
  const PortraitCard = ({ item, onPress, onContribute }) => {
    const progress = getProgress(item);
    return (
      <TouchableOpacity style={styles.portraitCard} activeOpacity={0.9} onPress={onPress}>
        <Image source={getEventImage(item)} style={styles.portraitImage} resizeMode="cover" />
        <View style={styles.portraitOverlay} />
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{item.type || 'Event'}</Text>
        </View>
        {item.is_private && (
          <View style={styles.privateBadge}>
            <Ionicons name="lock-closed" size={10} color={WHITE} />
          </View>
        )}
        <View style={styles.portraitBottom}>
          <Text style={styles.portraitName} numberOfLines={2}>{item.title}</Text>
          <View style={styles.portraitDateRow}>
            <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.8)" />
            <Text style={styles.portraitDate}>{formatDate(item.date)}</Text>
          </View>
          {item.location && (
            <View style={styles.portraitDateRow}>
              <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.8)" />
              <Text style={styles.portraitDate} numberOfLines={1}>{item.location}</Text>
            </View>
          )}
          <View style={styles.portraitProgressBar}>
            <View style={[styles.portraitProgressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.portraitAmountRow}>
            <Text style={styles.portraitAmount}>{formatAmount(item.total_raised)}</Text>
            <Text style={styles.portraitPercent}>{Math.round(progress * 100)}%</Text>
          </View>
          <TouchableOpacity style={styles.portraitBtn} onPress={onContribute} activeOpacity={0.85}>
            <Ionicons name="heart" size={12} color={WHITE} />
            <Text style={styles.portraitBtnText}>
              {language === 'Kinyarwanda' ? 'Tanga' : 'Contribute'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Search Result Card
  const SearchCard = ({ item }) => {
    const progress = getProgress(item);
    return (
      <TouchableOpacity
        style={[styles.searchCard, { backgroundColor: CARD, borderColor: BORDER_C }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('EventPage', { event: item })}
      >
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.searchCardImage} resizeMode="cover" />
        ) : (
          <Image source={require('../../assets/couple.png')} style={styles.searchCardImage} resizeMode="cover" />
        )}
        <View style={styles.searchCardInfo}>
          <View style={styles.searchCardTop}>
            <View style={styles.searchTypeBadge}>
              <Text style={styles.searchTypeBadgeText}>{item.type || 'Event'}</Text>
            </View>
            {item.is_private && (
              <View style={styles.searchPrivateBadge}>
                <Ionicons name="lock-closed" size={10} color={WHITE} />
                <Text style={styles.searchPrivateText}>Private</Text>
              </View>
            )}
          </View>
          <Text style={[styles.searchCardTitle, { color: TEXT }]} numberOfLines={2}>{item.title}</Text>
          <View style={styles.searchCardMeta}>
            <Ionicons name="calendar-outline" size={12} color={SUB} />
            <Text style={[styles.searchCardMetaText, { color: SUB }]}>{formatDate(item.date)}</Text>
          </View>
          {item.location && (
            <View style={styles.searchCardMeta}>
              <Ionicons name="location-outline" size={12} color={SUB} />
              <Text style={[styles.searchCardMetaText, { color: SUB }]} numberOfLines={1}>{item.location}</Text>
            </View>
          )}
          <View style={[styles.searchProgressBar, { backgroundColor: darkMode ? '#2A2A2A' : '#F0D0D8' }]}>
            <View style={[styles.searchProgressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.searchCardBottom}>
            <Text style={styles.searchCardAmount}>{formatAmount(item.total_raised)}</Text>
            <TouchableOpacity
              style={styles.searchContributeBtn}
              onPress={() => navigation.navigate('Contribute', { event: item })}
            >
              <Text style={styles.searchContributeBtnText}>
                {language === 'Kinyarwanda' ? 'Tanga' : 'Contribute'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ✅ Beautiful Empty State Component
  const EmptyState = () => (
    <View style={styles.emptyStateBox}>
      <Image
        source={require('../../assets/empty-events.png')}
        style={styles.emptyStateImage}
        resizeMode="contain"
      />
      <Text style={[styles.emptyStateTitle, { color: TEXT }]}>
        {activeCategory === 'All'
          ? (language === 'Kinyarwanda' ? 'Nta birori nawe' : 'No Events Yet')
          : (language === 'Kinyarwanda' ? `Nta birori bya ${activeCategory}` : `No ${activeCategory} Events Yet`)}
      </Text>
      <Text style={[styles.emptyStateSub, { color: SUB }]}>
        {language === 'Kinyarwanda'
          ? 'Banza gushiraho ikirori cyawe\nugatange inkunga n\'umuryango!'
          : 'Create your first event and start\nreceiving contributions from friends\nand family!'}
      </Text>
      <TouchableOpacity
        style={styles.emptyStateBtn}
        onPress={() => navigation.navigate('CreateEvent')}
        activeOpacity={0.85}
      >
        <Ionicons name="add-circle-outline" size={20} color={WHITE} />
        <Text style={styles.emptyStateBtnText}>
          {language === 'Kinyarwanda' ? 'Shiraho Ikirori' : 'Create Event'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={BG} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: TEXT }]} numberOfLines={1} adjustsFontSizeToFit>
              {getGreeting()}, {getUserName()}
            </Text>
            <Text style={[styles.subGreeting, { color: SUB }]}>
              {language === 'Kinyarwanda' ? 'Ni iki tugiye gusezerana?' : 'What are we celebrating today?'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={26} color={TEXT} />
              {dashboard?.unread_notifications > 0 && <View style={styles.bellDot} />}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.avatarContainer, { borderColor: WINE }]} onPress={() => navigation.navigate('Profile')}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.profileAvatar} />
              ) : (
                <View style={[styles.profileAvatar, { backgroundColor: WINE, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={styles.profileAvatarInitials}>{getInitials(user?.name, user?.phone)}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={[styles.searchBar, { backgroundColor: CARD, borderColor: BORDER_C }]}>
          <Ionicons name="search-outline" size={20} color={searchActive ? WINE : SUB} />
          <TextInput
            style={[styles.searchInput, { color: TEXT }]}
            placeholder={language === 'Kinyarwanda' ? 'Shakisha ibirori...' : 'Search events, weddings, birthdays...'}
            placeholderTextColor="#BBBBBB"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setSearchActive(text.length > 0);
            }}
            onFocus={() => setSearchActive(true)}
            onBlur={() => setSearchActive(searchQuery.length > 0)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchActive(false); }}>
              <Ionicons name="close-circle" size={20} color={SUB} />
            </TouchableOpacity>
          )}
        </View>

        {/* CATEGORY CHIPS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
          style={{ marginBottom: 20 }}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryChip,
                { backgroundColor: darkMode ? '#2A2A2A' : '#F5F5F5', borderColor: BORDER_C },
                activeCategory === cat.key && styles.categoryChipActive,
              ]}
              onPress={() => setActiveCategory(cat.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={cat.icon}
                size={14}
                color={activeCategory === cat.key ? WHITE : SUB}
              />
              <Text style={[
                styles.categoryLabel,
                { color: SUB },
                activeCategory === cat.key && styles.categoryLabelActive,
              ]}>
                {cat.key === 'All' && language === 'Kinyarwanda' ? 'Byose' : cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* SEARCH RESULTS or NORMAL VIEW */}
        {searchActive && searchQuery.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: TEXT }]}>
                {language === 'Kinyarwanda' ? `Ibisubizo (${filteredEvents.length})` : `Results (${filteredEvents.length})`}
              </Text>
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchActive(false); }}>
                <Text style={styles.seeAll}>{language === 'Kinyarwanda' ? 'Hagarika' : 'Clear'}</Text>
              </TouchableOpacity>
            </View>
            {filteredEvents.length === 0 ? (
              <EmptyState />
            ) : (
              filteredEvents.map((item) => (
                <SearchCard key={item.id} item={item} />
              ))
            )}
          </>
        ) : (
          <>
            {/* Stats Row */}
            {dashboard && (
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: darkMode ? '#1A1A1A' : WINE_LIGHT }]}>
                  <Text style={styles.statValue}>{dashboard.total_events || 0}</Text>
                  <Text style={[styles.statLabel, { color: SUB }]}>
                    {language === 'Kinyarwanda' ? 'Ibirori' : 'My Events'}
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: darkMode ? '#1A1A1A' : WINE_LIGHT }]}>
                  <Text style={styles.statValue}>{formatAmount(dashboard.total_raised)}</Text>
                  <Text style={[styles.statLabel, { color: SUB }]}>
                    {language === 'Kinyarwanda' ? 'Byakomejwe' : 'Total Raised'}
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: darkMode ? '#1A1A1A' : WINE_LIGHT }]}>
                  <Text style={styles.statValue}>{formatAmount(dashboard.wallet_balance)}</Text>
                  <Text style={[styles.statLabel, { color: SUB }]}>
                    {language === 'Kinyarwanda' ? 'Amafaranga' : 'Wallet'}
                  </Text>
                </View>
              </View>
            )}

            {/* Create New Event */}
            <TouchableOpacity style={styles.createBtn} activeOpacity={0.85} onPress={() => navigation.navigate('CreateEvent')}>
              <Ionicons name="add-circle-outline" size={22} color={WHITE} />
              <Text style={styles.createBtnText}>
                {language === 'Kinyarwanda' ? 'Shiraho Ikirori' : 'Create New Event'}
              </Text>
            </TouchableOpacity>

            {/* My Events */}
            {myEvents.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: TEXT }]}>
                    {language === 'Kinyarwanda' ? 'Ibirori Byanjye' : 'My Events'}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
                    <Text style={styles.seeAll}>{language === 'Kinyarwanda' ? 'Reba byose' : 'See all'}</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={myEvents}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({ item }) => (
                    <PortraitCard
                      item={item}
                      onPress={() => navigation.navigate('EventPage', { event: item })}
                      onContribute={() => navigation.navigate('Contribute', { event: item })}
                    />
                  )}
                />
              </>
            )}

            {/* All Events */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: TEXT }]}>
                {activeCategory === 'All'
                  ? (language === 'Kinyarwanda' ? 'Ibirori Byose' : 'All Events')
                  : `${activeCategory} Events`}
              </Text>
              {activeCategory !== 'All' && (
                <TouchableOpacity onPress={() => setActiveCategory('All')}>
                  <Text style={styles.seeAll}>
                    {language === 'Kinyarwanda' ? 'Reba byose' : 'Clear'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <ActivityIndicator color={WINE} size="large" style={{ marginVertical: 20 }} />
            ) : filteredEvents.length === 0 ? (
              // ✅ Beautiful empty state with illustration
              <EmptyState />
            ) : (
              <FlatList
                data={filteredEvents}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <PortraitCard
                    item={item}
                    onPress={() => navigation.navigate('EventPage', { event: item })}
                    onContribute={() => navigation.navigate('Contribute', { event: item })}
                  />
                )}
              />
            )}

            {/* Quick Actions */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: TEXT }]}>
                {language === 'Kinyarwanda' ? 'Ibikorwa Byihuse' : 'Quick Actions'}
              </Text>
            </View>

            <View style={styles.quickActionsRow}>
              {[
                { icon: 'people',       label: language === 'Kinyarwanda' ? 'Abakunzi'  : 'Contributors', screen: 'Dashboard'  },
                { icon: 'qr-code',      label: language === 'Kinyarwanda' ? 'Sangira'   : 'Share QR',     screen: 'ShareEvent' },
                { icon: 'wallet',       label: language === 'Kinyarwanda' ? 'Amafaranga': 'My Wallet',    screen: 'Wallet'     },
                { icon: 'grid-outline', label: language === 'Kinyarwanda' ? 'Ikibaho'   : 'Dashboard',    screen: 'Dashboard'  },
              ].map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickAction}
                  activeOpacity={0.8}
                  onPress={() => action.screen && navigation.navigate(action.screen)}
                >
                  <View style={[
                    styles.quickActionIcon,
                    { backgroundColor: darkMode ? '#1A1A1A' : WINE_LIGHT },
                    (action.label === 'Dashboard' || action.label === 'Ikibaho') && styles.dashboardIcon,
                  ]}>
                    <Ionicons
                      name={action.icon}
                      size={32}
                      color={(action.label === 'Dashboard' || action.label === 'Ikibaho') ? WHITE : WINE}
                    />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: TEXT }]}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: CARD, borderTopColor: darkMode ? '#2A2A2A' : BORDER }]}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home" size={24} color={WINE} />
          <Text style={styles.tabLabelActive}>{language === 'Kinyarwanda' ? 'Ahabanza' : 'Home'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Dashboard')}>
          <Ionicons name="grid-outline" size={24} color={SUB} />
          <Text style={[styles.tabLabel, { color: SUB }]}>{language === 'Kinyarwanda' ? 'Ikibaho' : 'Dashboard'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Wallet')}>
          <Ionicons name="wallet-outline" size={24} color={SUB} />
          <Text style={[styles.tabLabel, { color: SUB }]}>{language === 'Kinyarwanda' ? 'Amafaranga' : 'Wallet'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={24} color={SUB} />
          <Text style={[styles.tabLabel, { color: SUB }]}>{language === 'Kinyarwanda' ? 'Umwirondoro' : 'Profile'}</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 32 : 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft: { flex: 1, marginRight: 8 },
  greeting: { fontSize: 20, fontWeight: '800' },
  subGreeting: { fontSize: 14, marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: { position: 'relative', padding: 4 },
  bellDot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: WINE },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  profileAvatar: { width: 40, height: 40, borderRadius: 20 },
  profileAvatarInitials: { fontSize: 14, fontWeight: '800', color: WHITE },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, height: 52, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15 },
  categoryScroll: { gap: 8, paddingRight: 20 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  categoryChipActive: { backgroundColor: WINE, borderColor: WINE },
  categoryLabel: { fontSize: 13, fontWeight: '600' },
  categoryLabelActive: { color: WHITE },
  searchCard: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  searchCardImage: { width: 100, height: 120 },
  searchCardInfo: { flex: 1, padding: 12 },
  searchCardTop: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  searchTypeBadge: { backgroundColor: WINE, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  searchTypeBadgeText: { fontSize: 10, fontWeight: '700', color: WHITE },
  searchPrivateBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#333', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  searchPrivateText: { fontSize: 10, fontWeight: '700', color: WHITE },
  searchCardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6, lineHeight: 20 },
  searchCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  searchCardMetaText: { fontSize: 12 },
  searchProgressBar: { height: 4, borderRadius: 2, marginVertical: 6 },
  searchProgressFill: { height: 4, backgroundColor: WINE, borderRadius: 2 },
  searchCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchCardAmount: { fontSize: 12, fontWeight: '700', color: WINE },
  searchContributeBtn: { backgroundColor: WINE, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  searchContributeBtnText: { fontSize: 12, fontWeight: '700', color: WHITE },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 13, fontWeight: '800', color: WINE, marginBottom: 4 },
  statLabel: { fontSize: 11, textAlign: 'center' },
  createBtn: { backgroundColor: WINE, borderRadius: 14, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 28, elevation: 7, shadowColor: WINE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  createBtnText: { color: WHITE, fontSize: 17, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  seeAll: { fontSize: 14, color: WINE, fontWeight: '600' },
  horizontalList: { paddingRight: 20, paddingBottom: 8, marginBottom: 24 },
  portraitCard: { width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 20, marginRight: 14, overflow: 'hidden', backgroundColor: BLACK, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  portraitImage: { width: '100%', height: '100%', position: 'absolute' },
  portraitOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20 },
  typeBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: WINE, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { color: WHITE, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  privateBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 4 },
  portraitBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  portraitName: { fontSize: 14, fontWeight: '800', color: WHITE, marginBottom: 4, lineHeight: 18 },
  portraitDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  portraitDate: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  portraitProgressBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginBottom: 4 },
  portraitProgressFill: { height: 3, backgroundColor: WINE, borderRadius: 2 },
  portraitAmountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  portraitAmount: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  portraitPercent: { fontSize: 10, color: WINE, fontWeight: '700' },
  portraitBtn: { backgroundColor: WINE, borderRadius: 20, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  portraitBtnText: { color: WHITE, fontSize: 11, fontWeight: '700' },

  // ✅ Beautiful Empty State
  emptyStateBox: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20, marginBottom: 24 },
  emptyStateImage: { width: width * 0.99, height: width * 0.90, marginBottom: 30, backgroundColor: 'transparent' },
  emptyStateTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  emptyStateSub: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyStateBtn: { backgroundColor: WINE, borderRadius: 14, height: 52, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: WINE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  emptyStateBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' },

  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  quickAction: { alignItems: 'center', gap: 8, flex: 1 },
  quickActionIcon: { width: 72, height: 72, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  dashboardIcon: { backgroundColor: WINE },
  quickActionLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 10, paddingHorizontal: 10 },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabLabel: { fontSize: 10 },
  tabLabelActive: { fontSize: 10, color: WINE, fontWeight: '700' },
});