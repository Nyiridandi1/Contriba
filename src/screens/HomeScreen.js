// src/screens/HomeScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, FlatList, Image, Dimensions,
  ActivityIndicator, Platform, TextInput, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEvents, getDashboard } from '../api';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const WINE        = '#E50914';
const WINE_LIGHT  = '#FFF0F0';
const WHITE       = '#FFFFFF';
const BLACK       = '#1A1A1A';
const BORDER_COLOR = '#F0F0F0';

const CARD_WIDTH  = width * 0.54;
const CARD_HEIGHT = CARD_WIDTH * 1.58;

const CATEGORIES = [
  { key: 'All',          label: 'All',          icon: 'grid-outline'        },
  { key: 'Wedding',      label: 'Wedding',       icon: 'heart-outline'       },
  { key: 'Birthday',     label: 'Birthday',      icon: 'gift-outline'        },
  { key: 'Graduation',   label: 'Graduation',    icon: 'school-outline'      },
  { key: 'Funeral',      label: 'Funeral',       icon: 'flower-outline'      },
  { key: 'Church',       label: 'Church',        icon: 'sunny-outline'       },
  { key: 'Introduction', label: 'Introduction',  icon: 'people-outline'      },
  { key: 'Other',        label: 'Other',         icon: 'ellipsis-horizontal' },
];

export default function HomeScreen({ navigation }) {
  const { darkMode, language, colors } = useTheme();
  const { BG, CARD, TEXT, SUB, BORDER: BORDER_C } = colors;

  const [events, setEvents]                 = useState([]);
  const [myEvents, setMyEvents]             = useState([]);
  const [dashboard, setDashboard]           = useState(null);
  const [loading, setLoading]               = useState(true);
  const [user, setUser]                     = useState(null);
  const [isLoggedIn, setIsLoggedIn]         = useState(false);
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
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      if (token && userData) {
        setIsLoggedIn(true);
        setUser(JSON.parse(userData));
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
      const eventsResult = await getEvents();
      if (eventsResult.success) setEvents(eventsResult.events || []);
      if (token) {
        const dashboardResult = await getDashboard();
        if (dashboardResult.success) {
          setDashboard(dashboardResult.dashboard);
          setMyEvents(dashboardResult.dashboard.events || []);
        }
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      navigation.navigate('CreateEvent');
    } else {
      navigation.navigate('Login');
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchCategory = activeCategory === 'All' || e.type === activeCategory;
    if (!searchQuery.trim()) return matchCategory;
    const q = searchQuery.toLowerCase();
    return matchCategory && (
      e.title?.toLowerCase().includes(q) ||
      e.type?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q)
    );
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
    return language === 'Kinyarwanda' ? 'Murakaza' : 'Welcome';
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

  // ✅ HORIZONTAL CARD — My Events (ChatGPT style)
  const HorizontalCard = ({ item, onPress, onContribute }) => {
    const progress = getProgress(item);
    return (
      <TouchableOpacity
        style={[styles.hCard, { backgroundColor: CARD, borderColor: BORDER_C }]}
        activeOpacity={0.92}
        onPress={onPress}
      >
        {/* LEFT — Photo */}
        <View style={styles.hCardLeft}>
          <ImageBackground source={getEventImage(item)} style={styles.hCardImage} resizeMode="cover">
            {/* Type badge */}
            <View style={styles.hCardTypeBadge}>
              <Ionicons name="heart" size={10} color={WHITE} />
              <Text style={styles.hCardTypeBadgeText}>{item.type || 'Event'}</Text>
            </View>
          </ImageBackground>
        </View>

        {/* RIGHT — Info */}
        <View style={styles.hCardRight}>
          {/* Title + bookmark */}
          <View style={styles.hCardTitleRow}>
            <Text style={[styles.hCardTitle, { color: TEXT }]} numberOfLines={2}>{item.title}</Text>
            <TouchableOpacity style={[styles.hCardBookmark, { backgroundColor: WINE_LIGHT }]}>
              <Ionicons name="bookmark-outline" size={14} color={WINE} />
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View style={styles.hCardMeta}>
            <Ionicons name="calendar-outline" size={12} color={SUB} />
            <Text style={[styles.hCardMetaText, { color: SUB }]}>{formatDate(item.date)}</Text>
          </View>

          {/* Location */}
          {item.location && (
            <View style={styles.hCardMeta}>
              <Ionicons name="location-outline" size={12} color={SUB} />
              <Text style={[styles.hCardMetaText, { color: SUB }]} numberOfLines={1}>{item.location}</Text>
            </View>
          )}

          <View style={[styles.hCardDivider, { backgroundColor: BORDER_C }]} />

          {/* Raised */}
          <Text style={[styles.hCardRaisedLabel, { color: SUB }]}>
            {language === 'Kinyarwanda' ? 'Byakomejwe' : 'Raised so far'}
          </Text>
          <View style={styles.hCardAmountRow}>
            <Text style={styles.hCardAmount}>{formatAmount(item.total_raised)}</Text>
            <Text style={styles.hCardPercent}>{Math.round(progress * 100)}%</Text>
          </View>

          {/* Progress */}
          <View style={[styles.hCardProgressTrack, { backgroundColor: darkMode ? '#2A2A2A' : '#FFE0E0' }]}>
            <View style={[styles.hCardProgressFill, { width: `${progress * 100}%` }]} />
          </View>

          {/* Target */}
          <Text style={[styles.hCardTarget, { color: SUB }]}>
            {language === 'Kinyarwanda' ? 'Intego:' : 'Target:'} {item.goal_amount ? formatAmount(item.goal_amount) : 'TBA'}
          </Text>

          {/* Contribute button */}
          <TouchableOpacity style={styles.hCardBtn} onPress={onContribute} activeOpacity={0.85}>
            <Ionicons name="heart" size={14} color={WHITE} />
            <Text style={styles.hCardBtnText}>
              {language === 'Kinyarwanda' ? 'Tanga Ubu' : 'Contribute Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ✅ PORTRAIT CARD — All Events (frosted glass style)
  const PortraitCard = ({ item, onPress, onContribute }) => {
    const progress = getProgress(item);
    return (
      <TouchableOpacity style={styles.portraitCard} activeOpacity={0.92} onPress={onPress}>
        <ImageBackground source={getEventImage(item)} style={styles.portraitImage} resizeMode="cover">
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText} numberOfLines={1}>{item.type || 'Event'}</Text>
          </View>
          {item.is_private && (
            <View style={styles.privateBadge}>
              <Ionicons name="lock-closed" size={10} color={WHITE} />
            </View>
          )}
          <View style={styles.glassPanel}>
            <View style={styles.glassPanelAccent} />
            <Text style={styles.portraitName} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
            <View style={styles.portraitMetaRow}>
              <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.75)" />
              <Text style={styles.portraitMeta} numberOfLines={1}>{formatDate(item.date)}</Text>
            </View>
            {item.location ? (
              <View style={styles.portraitMetaRow}>
                <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.75)" />
                <Text style={styles.portraitMeta} numberOfLines={1}>{item.location}</Text>
              </View>
            ) : null}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${getProgress(item) * 100}%` }]} />
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountText} numberOfLines={1}>{formatAmount(item.total_raised)}</Text>
              <Text style={styles.percentText}>{Math.round(progress * 100)}%</Text>
            </View>
            <TouchableOpacity style={styles.contributeBtn} onPress={onContribute} activeOpacity={0.85}>
              <Ionicons name="heart" size={12} color={WHITE} />
              <Text style={styles.contributeBtnText}>{language === 'Kinyarwanda' ? 'Tanga' : 'Contribute'}</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
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
                <Text style={styles.searchPrivateText}>{'Private'}</Text>
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
            <TouchableOpacity style={styles.searchContributeBtn} onPress={() => navigation.navigate('Contribute', { event: item })}>
              <Text style={styles.searchContributeBtnText}>{language === 'Kinyarwanda' ? 'Tanga' : 'Contribute'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Empty State
  const EmptyState = () => (
    <View style={styles.emptyStateBox}>
      <Image source={require('../../assets/empty-events.png')} style={styles.emptyStateImage} resizeMode="contain" />
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
      <TouchableOpacity style={styles.emptyStateBtn} onPress={handleCreateEvent} activeOpacity={0.85}>
        <Ionicons name="add-circle-outline" size={20} color={WHITE} />
        <Text style={styles.emptyStateBtnText}>{language === 'Kinyarwanda' ? 'Shiraho Ikirori' : 'Create Event'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={BG} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <Image source={require('../../assets/icon.png')} style={styles.logoImg} />
            <View>
              <Text style={[styles.logoName, { color: TEXT }]}>contriba</Text>
              <Text style={[styles.logoSlogan, { color: darkMode ? '#AAAAAA' : '#444444' }]}>
                {language === 'Kinyarwanda' ? 'Tanga neza, vugurura' : 'Contribute easily, smart & secure'}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.bellBtn, { backgroundColor: darkMode ? '#1A1A1A' : WINE_LIGHT }]}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={WINE} />
              {dashboard?.unread_notifications > 0 && <View style={styles.bellDot} />}
            </TouchableOpacity>
            {isLoggedIn ? (
              <TouchableOpacity style={[styles.avatarContainer, { borderColor: WINE }]} onPress={() => navigation.navigate('Profile')}>
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.profileAvatar} />
                ) : (
                  <View style={[styles.profileAvatar, { backgroundColor: WINE, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={styles.profileAvatarInitials}>{getInitials(user?.name, user?.phone)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
                <Ionicons name="log-in-outline" size={16} color={WHITE} />
                <Text style={styles.loginBtnText}>{language === 'Kinyarwanda' ? 'Injira' : 'Login'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={[styles.searchBar, { backgroundColor: CARD, borderColor: searchActive ? WINE : BORDER_C }]}>
          <Ionicons name="search-outline" size={20} color={searchActive ? WINE : SUB} />
          <TextInput
            style={[styles.searchInput, { color: TEXT }]}
            placeholder={language === 'Kinyarwanda' ? 'Shakisha ibirori...' : 'Search events, weddings, birthdays...'}
            placeholderTextColor="#BBBBBB"
            value={searchQuery}
            onChangeText={(text) => { setSearchQuery(text); setSearchActive(text.length > 0); }}
            onFocus={() => setSearchActive(true)}
            onBlur={() => setSearchActive(searchQuery.length > 0)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchActive(false); }}>
              <Ionicons name="close-circle" size={20} color={SUB} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── CATEGORY CHIPS ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll} style={{ marginBottom: 24 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryChip, { backgroundColor: darkMode ? '#2A2A2A' : '#F5F5F5', borderColor: BORDER_C }, activeCategory === cat.key && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={cat.icon} size={14} color={activeCategory === cat.key ? WHITE : SUB} />
              <Text style={[styles.categoryLabel, { color: activeCategory === cat.key ? WHITE : SUB }, activeCategory === cat.key && { fontWeight: '700' }]}>
                {cat.key === 'All' && language === 'Kinyarwanda' ? 'Byose' : cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── CONTENT ── */}
        {searchActive && searchQuery.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: TEXT }]}>{language === 'Kinyarwanda' ? `Ibisubizo (${filteredEvents.length})` : `Results (${filteredEvents.length})`}</Text>
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchActive(false); }}>
                <Text style={styles.seeAll}>{language === 'Kinyarwanda' ? 'Hagarika' : 'Clear'}</Text>
              </TouchableOpacity>
            </View>
            {filteredEvents.length === 0 ? <EmptyState /> : filteredEvents.map((item) => <SearchCard key={item.id} item={item} />)}
          </>
        ) : (
          <>
            {/* STATS */}
            {isLoggedIn && dashboard && (
              <View style={styles.statsRow}>
                {[
                  { icon: 'calendar', label: language === 'Kinyarwanda' ? 'Ibirori' : 'My Events', value: dashboard.total_events || 0 },
                  { icon: 'trending-up', label: language === 'Kinyarwanda' ? 'Byakomejwe' : 'Total Raised', value: formatAmount(dashboard.total_raised) },
                  { icon: 'wallet', label: language === 'Kinyarwanda' ? 'Amafaranga' : 'Wallet', value: formatAmount(dashboard.wallet_balance) },
                ].map((stat, i) => (
                  <View key={i} style={[styles.statCard, { backgroundColor: darkMode ? '#1A1A1A' : WHITE, borderColor: darkMode ? '#2A2A2A' : BORDER_COLOR }]}>
                    <View style={[styles.statIconBox, { backgroundColor: WINE_LIGHT }]}>
                      <Ionicons name={stat.icon} size={18} color={WINE} />
                    </View>
                    <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{stat.value}</Text>
                    <Text style={[styles.statLabel, { color: SUB }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* CREATE BUTTON */}
            <TouchableOpacity style={styles.createBtn} activeOpacity={0.85} onPress={handleCreateEvent}>
              <View style={styles.createBtnLeft}>
                <View style={styles.createBtnIcon}>
                  <Ionicons name="add" size={22} color={WINE} />
                </View>
                <View>
                  <Text style={styles.createBtnText}>{language === 'Kinyarwanda' ? 'Shiraho Ikirori' : 'Create New Event'}</Text>
                  <Text style={styles.createBtnSub}>{language === 'Kinyarwanda' ? 'Tangira gutunga inkunga' : 'Start collecting contributions'}</Text>
                </View>
              </View>
              <View style={styles.createBtnArrow}>
                <Ionicons name="arrow-forward" size={18} color={WINE} />
              </View>
            </TouchableOpacity>

            {/* ✅ MY EVENTS — Horizontal Cards */}
            {isLoggedIn && myEvents.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={[styles.sectionTitle, { color: TEXT }]}>{language === 'Kinyarwanda' ? 'Ibirori Byanjye' : 'My Events'}</Text>
                    <View style={styles.sectionUnderline} />
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Text style={styles.seeAll}>{language === 'Kinyarwanda' ? 'Reba byose' : 'See all'}</Text>
                    <Ionicons name="chevron-forward" size={14} color={WINE} />
                  </TouchableOpacity>
                </View>
                {myEvents.slice(0, 3).map((item) => (
                  <HorizontalCard
                    key={item.id}
                    item={item}
                    onPress={() => navigation.navigate('EventPage', { event: item })}
                    onContribute={() => navigation.navigate('Contribute', { event: item })}
                  />
                ))}
              </>
            )}

            {/* ✅ ALL EVENTS — Portrait Cards */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: TEXT }]}>
                  {activeCategory === 'All' ? (language === 'Kinyarwanda' ? 'Ibirori Byose' : 'All Events') : `${activeCategory} Events`}
                </Text>
                <View style={styles.sectionUnderline} />
              </View>
              {activeCategory !== 'All' && (
                <TouchableOpacity onPress={() => setActiveCategory('All')}>
                  <Text style={styles.seeAll}>{language === 'Kinyarwanda' ? 'Reba byose' : 'Clear'}</Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <ActivityIndicator color={WINE} size="large" style={{ marginVertical: 30 }} />
            ) : filteredEvents.length === 0 ? (
              <EmptyState />
            ) : (
              <FlatList
                data={filteredEvents}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <PortraitCard item={item} onPress={() => navigation.navigate('EventPage', { event: item })} onContribute={() => navigation.navigate('Contribute', { event: item })} />
                )}
              />
            )}

            {/* QUICK ACTIONS */}
            {isLoggedIn && (
              <>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={[styles.sectionTitle, { color: TEXT }]}>{language === 'Kinyarwanda' ? 'Ibikorwa Byihuse' : 'Quick Actions'}</Text>
                    <View style={styles.sectionUnderline} />
                  </View>
                </View>
                <View style={styles.quickActionsRow}>
                  {[
                    { icon: 'people',       label: language === 'Kinyarwanda' ? 'Abakunzi'   : 'Contributors', screen: 'Dashboard'  },
                    { icon: 'qr-code',      label: language === 'Kinyarwanda' ? 'Sangira'    : 'Share QR',     screen: 'ShareEvent' },
                    { icon: 'wallet',       label: language === 'Kinyarwanda' ? 'Amafaranga' : 'My Wallet',    screen: 'Wallet'     },
                    { icon: 'grid-outline', label: language === 'Kinyarwanda' ? 'Ikibaho'    : 'Dashboard',    screen: 'Dashboard'  },
                  ].map((action, index) => (
                    <TouchableOpacity key={index} style={styles.quickAction} activeOpacity={0.8} onPress={() => action.screen && navigation.navigate(action.screen)}>
                      <View style={[styles.quickActionIcon, { backgroundColor: darkMode ? '#1A1A1A' : WINE_LIGHT }, (action.label === 'Dashboard' || action.label === 'Ikibaho') && styles.dashboardIcon]}>
                        <Ionicons name={action.icon} size={28} color={(action.label === 'Dashboard' || action.label === 'Ikibaho') ? WHITE : WINE} />
                      </View>
                      <Text style={[styles.quickActionLabel, { color: TEXT }]}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* JOIN BANNER */}
            {!isLoggedIn && (
              <View style={[styles.joinBanner, { backgroundColor: darkMode ? '#1A0A0E' : WINE_LIGHT, borderColor: darkMode ? '#3A1A1E' : '#FFD0D5' }]}>
                <View style={[styles.joinIconBox, { backgroundColor: WINE }]}>
                  <Ionicons name="person-add-outline" size={24} color={WHITE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.joinTitle, { color: TEXT }]}>{language === 'Kinyarwanda' ? 'Fungura Konti' : 'Create Your Own Event'}</Text>
                  <Text style={[styles.joinSub, { color: SUB }]}>{language === 'Kinyarwanda' ? 'Injira kugirango ushireho ibirori byawe!' : 'Login or sign up to create events!'}</Text>
                </View>
                <TouchableOpacity style={styles.joinBtn} onPress={() => navigation.navigate('Register')} activeOpacity={0.85}>
                  <Text style={styles.joinBtnText}>{language === 'Kinyarwanda' ? 'Injira' : 'Join'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── BOTTOM TAB BAR ── */}
      <View style={[styles.tabBar, { backgroundColor: CARD, borderTopColor: darkMode ? '#2A2A2A' : BORDER_COLOR }]}>
        {[
          { icon: 'home',   iconO: 'home-outline',   label: language === 'Kinyarwanda' ? 'Ahabanza'    : 'Home',      screen: null        },
          { icon: 'grid',   iconO: 'grid-outline',   label: language === 'Kinyarwanda' ? 'Ikibaho'     : 'Dashboard', screen: 'Dashboard' },
          { icon: 'wallet', iconO: 'wallet-outline', label: language === 'Kinyarwanda' ? 'Amafaranga'  : 'Wallet',    screen: 'Wallet'    },
          { icon: 'person', iconO: 'person-outline', label: language === 'Kinyarwanda' ? 'Umwirondoro' : 'Profile',   screen: 'Profile'   },
        ].map((tab, index) => {
          const isActive = index === 0;
          return (
            <TouchableOpacity key={index} style={styles.tabItem} onPress={() => tab.screen && navigation.navigate(tab.screen)}>
              {isActive && <View style={styles.tabIndicator} />}
              <Ionicons name={isActive ? tab.icon : tab.iconO} size={24} color={isActive ? WINE : SUB} />
              <Text style={[styles.tabLabel, { color: isActive ? WINE : SUB, fontWeight: isActive ? '700' : '500' }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 32 : 16 },

  // HEADER
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLogo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImg: { width: 38, height: 38, borderRadius: 10 },
  logoName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  logoSlogan: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  bellDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: WINE },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, borderWidth: 2.5, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  profileAvatar: { width: 40, height: 40, borderRadius: 20 },
  profileAvatarInitials: { fontSize: 14, fontWeight: '800', color: WHITE },
  loginBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WINE, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  loginBtnText: { color: WHITE, fontSize: 13, fontWeight: '700' },

  // GREETING
  greetingBox: { marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 2 },
  greetingSmall: { fontSize: 14, fontWeight: '400' },

  // SEARCH
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, height: 54, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  searchInput: { flex: 1, fontSize: 15 },

  // CATEGORIES
  categoryScroll: { gap: 8, paddingRight: 20 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, borderWidth: 1.5 },
  categoryChipActive: { backgroundColor: WINE, borderColor: WINE },
  categoryLabel: { fontSize: 13, fontWeight: '600' },

  // SEARCH CARDS
  searchCard: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
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

  // STATS
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 18, padding: 14, alignItems: 'center', borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  statIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 13, fontWeight: '900', color: WINE, marginBottom: 3 },
  statLabel: { fontSize: 10, textAlign: 'center', fontWeight: '500' },

  // CREATE BUTTON
  createBtn: { backgroundColor: WINE, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, elevation: 8, shadowColor: WINE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 },
  createBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  createBtnIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center' },
  createBtnText: { color: WHITE, fontSize: 16, fontWeight: '800' },
  createBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  createBtnArrow: { width: 38, height: 38, borderRadius: 19, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center' },

  // SECTION
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  sectionUnderline: { width: 28, height: 3, backgroundColor: WINE, borderRadius: 2, marginTop: 4 },
  seeAll: { fontSize: 14, color: WINE, fontWeight: '700' },
  horizontalList: { paddingRight: 20, paddingBottom: 8, marginBottom: 24 },

  // ✅ HORIZONTAL CARD (My Events)
  hCard: { borderRadius: 20, borderWidth: 1, marginBottom: 16, flexDirection: 'row', overflow: 'hidden', height: 210, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
  hCardLeft: { width: '38%' },
  hCardImage: { width: '100%', height: '100%', justifyContent: 'flex-start' },
  hCardTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: WINE, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, margin: 8, alignSelf: 'flex-start' },
  hCardTypeBadgeText: { color: WHITE, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  hCardRight: { flex: 1, padding: 12 },
  hCardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  hCardTitle: { fontSize: 14, fontWeight: '900', flex: 1, lineHeight: 19, marginRight: 6 },
  hCardBookmark: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  hCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  hCardMetaText: { fontSize: 11 },
  hCardDivider: { height: 1, marginVertical: 6 },
  hCardRaisedLabel: { fontSize: 10, marginBottom: 2 },
  hCardAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  hCardAmount: { fontSize: 14, fontWeight: '900', color: WINE },
  hCardPercent: { fontSize: 11, fontWeight: '800', color: WINE },
  hCardProgressTrack: { height: 3, borderRadius: 2, marginBottom: 4 },
  hCardProgressFill: { height: 3, backgroundColor: WINE, borderRadius: 2 },
  hCardTarget: { fontSize: 10, marginBottom: 8 },
  hCardBtn: { backgroundColor: WINE, borderRadius: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, elevation: 4, shadowColor: WINE, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6 },
  hCardBtnText: { color: WHITE, fontSize: 12, fontWeight: '800' },

  // ✅ PORTRAIT CARD (All Events)
  portraitCard: { width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 22, marginRight: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 20, elevation: 16 },
  portraitImage: { width: '100%', height: '100%', justifyContent: 'flex-end' },
  typeBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: WINE, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, maxWidth: '70%' },
  typeBadgeText: { color: WHITE, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  privateBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20, padding: 5 },
  glassPanel: { backgroundColor: 'rgba(20, 16, 16, 0.6)', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  glassPanelAccent: { width: 28, height: 2.5, backgroundColor: WINE, borderRadius: 2, marginBottom: 8 },
  portraitName: { fontSize: 14, fontWeight: '900', color: WHITE, marginBottom: 5, lineHeight: 18 },
  portraitMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  portraitMeta: { fontSize: 10, color: 'rgba(255,255,255,0.75)', flex: 1 },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 8, marginBottom: 5 },
  progressFill: { height: 3, backgroundColor: WINE, borderRadius: 2 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  amountText: { fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: '700', flex: 1 },
  percentText: { fontSize: 10, color: '#FF6B6B', fontWeight: '800' },
  contributeBtn: { backgroundColor: WINE, borderRadius: 20, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, elevation: 3, shadowColor: WINE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.45, shadowRadius: 5 },
  contributeBtnText: { color: WHITE, fontSize: 11, fontWeight: '800' },

  // EMPTY STATE
  emptyStateBox: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20, marginBottom: 24 },
  emptyStateImage: { width: width * 0.85, height: width * 0.75, marginBottom: 20 },
  emptyStateTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  emptyStateSub: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyStateBtn: { backgroundColor: WINE, borderRadius: 14, height: 52, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 6 },
  emptyStateBtnText: { color: WHITE, fontSize: 16, fontWeight: '800' },

  // JOIN BANNER
  joinBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 16, marginBottom: 20, borderWidth: 1 },
  joinIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  joinTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  joinSub: { fontSize: 12, lineHeight: 18 },
  joinBtn: { backgroundColor: WINE, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  joinBtnText: { color: WHITE, fontSize: 13, fontWeight: '800' },

  // QUICK ACTIONS
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  quickAction: { alignItems: 'center', gap: 8, flex: 1 },
  quickActionIcon: { width: 68, height: 68, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  dashboardIcon: { backgroundColor: WINE, elevation: 4, shadowColor: WINE, shadowOpacity: 0.35 },
  quickActionLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // TAB BAR
  tabBar: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 10, paddingHorizontal: 10, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 8 },
  tabItem: { flex: 1, alignItems: 'center', gap: 3, position: 'relative', paddingTop: 4 },
  tabIndicator: { position: 'absolute', top: -10, width: 28, height: 3, backgroundColor: WINE, borderRadius: 2 },
  tabLabel: { fontSize: 10 },
});