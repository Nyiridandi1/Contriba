// src/screens/LiveFeedScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, SafeAreaView, ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getEvent } from '../api';
import { useTheme } from '../context/ThemeContext';

const WINE       = '#E60012';
const WINE_LIGHT = '#FDF0F3';
const WHITE      = '#FFFFFF';
const GREEN      = '#1A9E4A';

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
  if (!name || name === 'Anonymous') return '🙈';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getAvatarColor = (name) => {
  const colors = ['#E60012', '#1A9E4A', '#1976D2', '#F59E0B', '#7C3AED', '#E91E63'];
  if (!name || name === 'Anonymous') return '#888888';
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function LiveFeedScreen({ navigation, route }) {
  const { darkMode, language, colors } = useTheme();
  const { BG, CARD, TEXT, SUB, BORDER, DIV } = colors;

  const event = route?.params?.event;
  const [feedData, setFeedData]               = useState([]);
  const [eventData, setEventData]             = useState(event);
  const [loading, setLoading]                 = useState(true);
  const [refreshing, setRefreshing]           = useState(false);
  const [totalRaised, setTotalRaised]         = useState(0);
  const [totalContributors, setTotalContributors] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 30000);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
    return () => clearInterval(interval);
  }, []);

  const loadFeed = async () => {
    try {
      if (!event?.id) return;
      const result = await getEvent(event.id);
      if (result.success) {
        setEventData(result.event);
        setFeedData(result.public_feed || []);
        setTotalRaised(result.event.total_raised || 0);
        setTotalContributors(result.event.total_contributors || 0);
      }
    } catch (error) {
      console.error('Feed error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const progress = eventData?.goal_amount > 0
    ? Math.min(totalRaised / eventData.goal_amount, 1) : 0;
  const percent = Math.round(progress * 100);

  const renderItem = ({ item, index }) => {
    const isAnon = item.is_anonymous || item.name === 'Anonymous 🙈';
    const avatarColor = getAvatarColor(item.name);
    const initials = getInitials(item.name);

    return (
      <View style={[
        styles.feedItem,
        { backgroundColor: CARD, shadowColor: darkMode ? 'transparent' : '#000' },
        index === 0 && { borderWidth: 1.5, borderColor: WINE },
      ]}>
        <View style={[styles.avatar, { backgroundColor: isAnon ? (darkMode ? '#2A2A2A' : '#F0F0F0') : avatarColor }]}>
          {isAnon ? (
            <Text style={styles.avatarEmoji}>🙈</Text>
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>

        <View style={styles.feedContent}>
          <View style={styles.feedHeaderRow}>
            <Text style={[styles.feedName, { color: TEXT }]}>{item.name}</Text>
            <Text style={[styles.feedTime, { color: SUB }]}>{formatTime(item.created_at)}</Text>
          </View>

          {!isAnon && item.amount && (
            <View style={styles.amountBadge}>
              <Ionicons name="heart" size={12} color={WINE} />
              <Text style={styles.amountText}>RWF {item.amount?.toLocaleString()}</Text>
            </View>
          )}

          {isAnon && (
            <View style={[styles.amountBadge, { backgroundColor: darkMode ? '#2A2A2A' : '#F5F5F5' }]}>
              <Ionicons name="eye-off" size={12} color={SUB} />
              <Text style={[styles.amountText, { color: SUB }]}>
                {language === 'Kinyarwanda' ? 'Yatanze nta izina' : 'Contributed anonymously'}
              </Text>
            </View>
          )}

          {item.message && (
            <View style={[styles.messageBubble, { backgroundColor: darkMode ? '#2A2A2A' : '#F8F8F8' }]}>
              <Text style={[styles.messageText, { color: TEXT }]}>💬 "{item.message}"</Text>
            </View>
          )}
        </View>

        <View style={[styles.statusDot, { backgroundColor: item.status === 'success' ? GREEN : '#FFC403' }]} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" backgroundColor={WINE} />

      {/* Header - always wine red */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{eventData?.title || (language === 'Kinyarwanda' ? 'Ikiganiro Giheruka' : 'Live Feed')}</Text>
          <View style={styles.liveRow}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={22} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>RWF {totalRaised.toLocaleString()}</Text>
          <Text style={styles.statLabel}>{language === 'Kinyarwanda' ? 'Byakomejwe' : 'Total Raised'}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalContributors}</Text>
          <Text style={styles.statLabel}>{language === 'Kinyarwanda' ? 'Abakunzi' : 'Contributors'}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{percent}%</Text>
          <Text style={styles.statLabel}>{language === 'Kinyarwanda' ? 'by\'Intego' : 'of Goal'}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.progressGoal}>
          {language === 'Kinyarwanda' ? 'Intego' : 'Goal'}: RWF {eventData?.goal_amount?.toLocaleString() || 0}
        </Text>
      </View>

      {/* Feed List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={WINE} size="large" />
          <Text style={[styles.loadingText, { color: SUB }]}>
            {language === 'Kinyarwanda' ? 'Gutegereza...' : 'Loading live feed...'}
          </Text>
        </View>
      ) : feedData.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🎊</Text>
          <Text style={[styles.emptyTitle, { color: TEXT }]}>
            {language === 'Kinyarwanda' ? 'Nta nkunga nawe!' : 'No contributions yet!'}
          </Text>
          <Text style={[styles.emptySub, { color: SUB }]}>
            {language === 'Kinyarwanda'
              ? 'Banza gutanga inkunga kandi izina ryawe rizagaragara hano!'
              : 'Be the first to contribute and your name will appear here!'}
          </Text>
          <TouchableOpacity style={styles.contributeBtn} onPress={() => navigation.navigate('Contribute', { event: eventData })}>
            <Text style={styles.contributeBtnText}>
              {language === 'Kinyarwanda' ? 'Tanga Inkunga 🎁' : 'Contribute Now 🎁'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={feedData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.feedList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WINE} />}
          ListHeaderComponent={
            <View style={styles.feedHeaderRow2}>
              <Ionicons name="people" size={16} color={WINE} />
              <Text style={[styles.feedHeaderText, { color: SUB }]}>
                {feedData.length} {language === 'Kinyarwanda' ? 'inkunga — Gukurura gusubiramo' : 'contributions — Pull to refresh'}
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Contribute Button */}
      <View style={[styles.bottomBar, { backgroundColor: CARD, borderTopColor: BORDER }]}>
        <TouchableOpacity
          style={styles.bottomContributeBtn}
          onPress={() => navigation.navigate('Contribute', { event: eventData })}
          activeOpacity={0.85}
        >
          <Ionicons name="heart" size={18} color={WHITE} />
          <Text style={styles.bottomContributeBtnText}>
            {language === 'Kinyarwanda' ? 'Tanga Inkunga ku Kirori' : 'Contribute to this Event'}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: WINE, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: WHITE, marginBottom: 2 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  liveText: { fontSize: 11, fontWeight: '700', color: '#4CAF50', letterSpacing: 1 },
  refreshBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  statsBanner: { backgroundColor: WINE, flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '900', color: WHITE, marginBottom: 2 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  progressContainer: { backgroundColor: WINE, paddingHorizontal: 20, paddingBottom: 20 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, marginBottom: 6 },
  progressFill: { height: 6, backgroundColor: WHITE, borderRadius: 3 },
  progressGoal: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  contributeBtn: { backgroundColor: WINE, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  contributeBtnText: { color: WHITE, fontSize: 15, fontWeight: '700' },
  feedList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  feedHeaderRow2: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  feedHeaderText: { fontSize: 13, fontWeight: '600' },
  feedItem: { borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 12, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: WHITE },
  avatarEmoji: { fontSize: 20 },
  feedContent: { flex: 1 },
  feedHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  feedName: { fontSize: 15, fontWeight: '700' },
  feedTime: { fontSize: 11 },
  amountBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: WINE_LIGHT, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 6 },
  amountText: { fontSize: 13, fontWeight: '700', color: WINE },
  messageBubble: { borderRadius: 10, padding: 8, borderLeftWidth: 3, borderLeftColor: WINE },
  messageText: { fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 30, paddingTop: 12, borderTopWidth: 1 },
  bottomContributeBtn: { backgroundColor: WINE, borderRadius: 14, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: WINE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  bottomContributeBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' },
});