// src/screens/EventPageScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, Image, Dimensions, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getEvent } from '../api';

const { width, height } = Dimensions.get('window');

const WINE       = '#7A001F';
const WINE_LIGHT = '#FDF0F3';
const WHITE      = '#FFFFFF';
const BLACK      = '#1A1A1A';
const GRAY       = '#888888';
const BORDER     = '#F0F0F0';
const GREEN      = '#1A9E4A';

export default function EventPageScreen({ navigation, route }) {
  const eventParam = route?.params?.event;
  const [event, setEvent]     = useState(eventParam);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventParam?.id) loadEvent();
  }, []);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const result = await getEvent(eventParam.id);
      if (result.success) setEvent(result.event);
    } catch (error) {
      console.error('Load event error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (val) => 'RWF ' + (val || 0).toLocaleString();

  const progress = event?.goal_amount > 0
    ? Math.min((event?.total_raised || 0) / event?.goal_amount, 1)
    : 0;
  const percent = Math.round(progress * 100);

  // Get hero image — real photo or fallback
  const getHeroImage = () => {
    if (event?.cover_image) return { uri: event.cover_image };
    return require('../../assets/couple.png');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero Image */}
        <View style={styles.heroWrapper}>
          <Image source={getHeroImage()} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />

          {/* Top buttons */}
          <View style={styles.heroTop}>
            <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={BLACK} />
            </TouchableOpacity>
            <View style={styles.heroTopRight}>
              <TouchableOpacity style={styles.heroBtn}>
                <Ionicons name="heart-outline" size={20} color={BLACK} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.navigate('ShareEvent', { event })}>
                <Ionicons name="share-social-outline" size={20} color={BLACK} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Event type badge */}
          <View style={styles.typeBadge}>
            <Ionicons
              name={
                event?.type === 'Wedding' ? 'heart' :
                event?.type === 'Birthday' ? 'gift' :
                event?.type === 'Introduction' ? 'people' : 'calendar'
              }
              size={12} color={WHITE}
            />
            <Text style={styles.typeBadgeText}>{event?.type || 'Event'}</Text>
          </View>

          {/* Event info on image */}
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{event?.title || 'Event'}</Text>
            <View style={styles.heroMetaRow}>
              <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroDate}>{event?.date || ''}</Text>
              {event?.location && (
                <>
                  <Text style={styles.heroDot}>•</Text>
                  <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.heroDate}>{event.location}</Text>
                </>
              )}
            </View>
            {event?.description && (
              <Text style={styles.heroQuote}>"{event.description}"</Text>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>

          {loading ? (
            <ActivityIndicator color={WINE} size="large" style={{ marginVertical: 20 }} />
          ) : (
            <>
              {/* Amount raised */}
              <View style={styles.amountSection}>
                <View style={styles.amountRow}>
                  <View>
                    <Text style={styles.amountRaised}>{formatAmount(event?.total_raised)}</Text>
                    <Text style={styles.amountGoal}>raised of {formatAmount(event?.goal_amount)} goal</Text>
                  </View>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentText}>{percent}%</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${percent}%` }]} />
                </View>
              </View>

              {/* LIVE FEED BUTTON */}
              <TouchableOpacity
                style={styles.liveFeedBtn}
                onPress={() => navigation.navigate('LiveFeed', { event })}
                activeOpacity={0.85}
              >
                <View style={styles.liveDotContainer}>
                  <View style={styles.liveDot} />
                </View>
                <View style={styles.liveFeedInfo}>
                  <Text style={styles.liveFeedTitle}>Live Contribution Feed</Text>
                  <Text style={styles.liveFeedSub}>
                    {event?.total_contributors || 0} people contributed • Tap to see live updates
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={WINE} />
              </TouchableOpacity>

              {/* Contribute card */}
              <View style={styles.contributeCard}>
                <View style={styles.contributeIconBox}>
                  <Ionicons name="heart" size={24} color={WINE} />
                </View>
                <View style={styles.contributeText}>
                  <Text style={styles.contributeTitle}>Contribute to our happiness</Text>
                  <Text style={styles.contributeSubtitle}>
                    Your love and support mean the world to us as we begin our forever.
                  </Text>
                </View>
              </View>

              {/* Second photo if available */}
              {event?.photo2_url && (
                <View style={styles.photo2Container}>
                  <Image source={{ uri: event.photo2_url }} style={styles.photo2} resizeMode="cover" />
                  <View style={styles.photo2Overlay}>
                    <Text style={styles.photo2Label}>Invitation Card</Text>
                  </View>
                </View>
              )}

              {/* Event details */}
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconBox}>
                    <Ionicons name="calendar-outline" size={20} color={WINE} />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Event Date</Text>
                    <Text style={styles.detailValue}>{event?.date || 'TBD'}</Text>
                  </View>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <View style={styles.detailIconBox}>
                    <Ionicons name="people-outline" size={20} color={WINE} />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Event Type</Text>
                    <Text style={styles.detailValue}>{event?.type || 'Event'}</Text>
                  </View>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <View style={styles.detailIconBox}>
                    <Ionicons name="location-outline" size={20} color={WINE} />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{event?.location || 'Kigali, Rwanda'}</Text>
                  </View>
                </View>
              </View>

              {/* Contributors row */}
              <TouchableOpacity
                style={styles.contributorsRow}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('LiveFeed', { event })}
              >
                <View style={styles.avatarStack}>
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={[styles.avatarCircle, { marginLeft: i === 0 ? 0 : -12 }]}>
                      <Text style={styles.avatarText}>👤</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.contributorsInfo}>
                  <Text style={styles.contributorsCount}>{event?.total_contributors || 0} Contributors</Text>
                  <Text style={styles.contributorsSub}>Tap to see who contributed!</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={GRAY} />
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 200 }} />
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.contributeBtn}
          onPress={() => navigation.navigate('Contribute', { event })}
          activeOpacity={0.85}
        >
          <Text style={styles.contributeBtnText}>Contribute Gift 🎁</Text>
        </TouchableOpacity>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('LiveFeed', { event })}
          >
            <View style={styles.liveSmallDot} />
            <Text style={styles.actionBtnText}>Live Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ShareEvent', { event })}
          >
            <Ionicons name="share-social-outline" size={18} color={WINE} />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  heroWrapper: { width, height: height * 0.48, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  heroTop: { position: 'absolute', top: Platform.OS === 'android' ? 40 : 48, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTopRight: { flexDirection: 'row', gap: 10 },
  heroBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  typeBadge: { position: 'absolute', top: Platform.OS === 'android' ? 100 : 110, left: 20, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: WINE, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: WHITE },
  heroInfo: { position: 'absolute', bottom: 24, left: 20, right: 20 },
  heroName: { fontSize: 28, fontWeight: '800', color: WHITE, marginBottom: 6 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8, flexWrap: 'wrap' },
  heroDate: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  heroDot: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  heroQuote: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  amountSection: { marginBottom: 16 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  amountRaised: { fontSize: 26, fontWeight: '800', color: WINE, marginBottom: 4 },
  amountGoal: { fontSize: 14, color: GRAY },
  percentBadge: { backgroundColor: WINE_LIGHT, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: WINE },
  percentText: { fontSize: 16, fontWeight: '800', color: WINE },
  progressBar: { height: 8, backgroundColor: '#F0D0D8', borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: WINE, borderRadius: 4 },
  liveFeedBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1.5, borderColor: GREEN, gap: 12, shadowColor: GREEN, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  liveDotContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  liveDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: GREEN },
  liveFeedInfo: { flex: 1 },
  liveFeedTitle: { fontSize: 15, fontWeight: '700', color: BLACK, marginBottom: 2 },
  liveFeedSub: { fontSize: 12, color: GRAY },
  liveSmallDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  contributeCard: { flexDirection: 'row', backgroundColor: WINE_LIGHT, borderRadius: 16, padding: 16, marginBottom: 16, gap: 14, alignItems: 'flex-start' },
  contributeIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center' },
  contributeText: { flex: 1 },
  contributeTitle: { fontSize: 15, fontWeight: '700', color: BLACK, marginBottom: 4 },
  contributeSubtitle: { fontSize: 13, color: GRAY, lineHeight: 20 },
  photo2Container: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, height: 180, position: 'relative' },
  photo2: { width: '100%', height: '100%' },
  photo2Overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)', padding: 10 },
  photo2Label: { color: WHITE, fontSize: 13, fontWeight: '700' },
  detailsCard: { borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 16, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  detailIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: WINE_LIGHT, justifyContent: 'center', alignItems: 'center' },
  detailDivider: { height: 1, backgroundColor: BORDER, marginVertical: 4 },
  detailLabel: { fontSize: 12, color: GRAY, marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '700', color: BLACK },
  contributorsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  avatarStack: { flexDirection: 'row' },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: WINE_LIGHT, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: WHITE },
  avatarText: { fontSize: 16 },
  contributorsInfo: { flex: 1 },
  contributorsCount: { fontSize: 15, fontWeight: '700', color: BLACK },
  contributorsSub: { fontSize: 12, color: GRAY, marginTop: 2 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: Platform.OS === 'android' ? 20 : 30, paddingTop: 12, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: BORDER, gap: 10 },
  contributeBtn: { backgroundColor: WINE, borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center', shadowColor: WINE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7 },
  contributeBtnText: { color: WHITE, fontSize: 17, fontWeight: '700' },
  bottomActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: WINE },
});