// src/screens/LiveFeedScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, SafeAreaView, ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getEvent } from '../api';

const WINE       = '#7A001F';
const WINE_LIGHT = '#FDF0F3';
const WHITE      = '#FFFFFF';
const BLACK      = '#1A1A1A';
const GRAY       = '#888888';
const BORDER     = '#F0F0F0';
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
  const colors = ['#7A001F', '#1A9E4A', '#1976D2', '#F59E0B', '#7C3AED', '#E91E63'];
  if (!name || name === 'Anonymous') return GRAY;
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function LiveFeedScreen({ navigation, route }) {
  const event = route?.params?.event;
  const [feedData, setFeedData]     = useState([]);
  const [eventData, setEventData]   = useState(event);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalRaised, setTotalRaised] = useState(0);
  const [totalContributors, setTotalContributors] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadFeed();
    // Auto refresh every 30 seconds
    const interval = setInterval(loadFeed, 30000);
    // Pulse animation for live dot
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
    ? Math.min(totalRaised / eventData.goal_amount, 1)
    : 0;
  const percent = Math.round(progress * 100);

  const renderItem = ({ item, index }) => {
    const isAnon = item.is_anonymous || item.name === 'Anonymous 🙈';
    const avatarColor = getAvatarColor(item.name);
    const initials = getInitials(item.name);

    return (
      <View style={[styles.feedItem, index === 0 && styles.feedItemFirst]}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: isAnon ? '#F0F0F0' : avatarColor }]}>
          {isAnon ? (
            <Text style={styles.avatarEmoji}>🙈</Text>
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>

        {/* Content */}
        <View style={styles.feedContent}>
          <View style={styles.feedHeader}>
            <Text style={styles.feedName}>{item.name}</Text>
            <Text style={styles.feedTime}>{formatTime(item.created_at)}</Text>
          </View>

          {/* Amount */}
          {!isAnon && item.amount && (
            <View style={styles.amountBadge}>
              <Ionicons name="heart" size={12} color={WINE} />
              <Text style={styles.amountText}>RWF {item.amount?.toLocaleString()}</Text>
            </View>
          )}

          {isAnon && (
            <View style={[styles.amountBadge, { backgroundColor: '#F5F5F5' }]}>
              <Ionicons name="eye-off" size={12} color={GRAY} />
              <Text style={[styles.amountText, { color: GRAY }]}>Contributed anonymously</Text>
            </View>
          )}

          {/* Message */}
          {item.message && (
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>💬 "{item.message}"</Text>
            </View>
          )}
        </View>

        {/* Status dot */}
        <View style={[styles.statusDot, { backgroundColor: item.status === 'success' ? GREEN : '#FFC403' }]} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={WINE} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{eventData?.title || 'Live Feed'}</Text>
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
          <Text style={styles.statLabel}>Total Raised</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalContributors}</Text>
          <Text style={styles.statLabel}>Contributors</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{percent}%</Text>
          <Text style={styles.statLabel}>of Goal</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.progressGoal}>
          Goal: RWF {eventData?.goal_amount?.toLocaleString() || 0}
        </Text>
      </View>

      {/* Feed List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={WINE} size="large" />
          <Text style={styles.loadingText}>Loading live feed...</Text>
        </View>
      ) : feedData.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🎊</Text>
          <Text style={styles.emptyTitle}>No contributions yet!</Text>
          <Text style={styles.emptySub}>Be the first to contribute and your name will appear here!</Text>
          <TouchableOpacity
            style={styles.contributeBtn}
            onPress={() => navigation.navigate('Contribute', { event: eventData })}
          >
            <Text style={styles.contributeBtnText}>Contribute Now 🎁</Text>
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
            <View style={styles.feedHeader2}>
              <Ionicons name="people" size={16} color={WINE} />
              <Text style={styles.feedHeaderText}>
                {feedData.length} contributions — Pull to refresh
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Contribute Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomContributeBtn}
          onPress={() => navigation.navigate('Contribute', { event: eventData })}
          activeOpacity={0.85}
        >
          <Ionicons name="heart" size={18} color={WHITE} />
          <Text style={styles.bottomContributeBtnText}>Contribute to this Event</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },

  // Header
  header: { backgroundColor: WINE, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: WHITE, marginBottom: 2 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  liveText: { fontSize: 11, fontWeight: '700', color: '#4CAF50', letterSpacing: 1 },
  refreshBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Stats
  statsBanner: { backgroundColor: WINE, flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '900', color: WHITE, marginBottom: 2 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },

  // Progress
  progressContainer: { backgroundColor: WINE, paddingHorizontal: 20, paddingBottom: 20 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, marginBottom: 6 },
  progressFill: { height: 6, backgroundColor: WHITE, borderRadius: 3 },
  progressGoal: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  // Loading
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: GRAY },

  // Empty
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: BLACK },
  emptySub: { fontSize: 14, color: GRAY, textAlign: 'center', lineHeight: 22 },
  contributeBtn: { backgroundColor: WINE, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  contributeBtnText: { color: WHITE, fontSize: 15, fontWeight: '700' },

  // Feed
  feedList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  feedHeader2: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  feedHeaderText: { fontSize: 13, color: GRAY, fontWeight: '600' },

  // Feed Item
  feedItem: { backgroundColor: WHITE, borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  feedItemFirst: { borderWidth: 1.5, borderColor: WINE },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: WHITE },
  avatarEmoji: { fontSize: 20 },
  feedContent: { flex: 1 },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  feedName: { fontSize: 15, fontWeight: '700', color: BLACK },
  feedTime: { fontSize: 11, color: GRAY },
  amountBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: WINE_LIGHT, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 6 },
  amountText: { fontSize: 13, fontWeight: '700', color: WINE },
  messageBubble: { backgroundColor: '#F8F8F8', borderRadius: 10, padding: 8, borderLeftWidth: 3, borderLeftColor: WINE },
  messageText: { fontSize: 13, color: BLACK, lineHeight: 18, fontStyle: 'italic' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },

  // Bottom
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 30, paddingTop: 12, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: BORDER },
  bottomContributeBtn: { backgroundColor: WINE, borderRadius: 14, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: WINE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  bottomContributeBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' },
});