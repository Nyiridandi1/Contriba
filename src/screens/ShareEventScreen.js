import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Image, Share, Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const WINE = '#7A001F';
const WHITE = '#FFFFFF';
const LIGHT_GREY = '#F5F5F5';
const MID_GREY = '#E0E0E0';
const DARK_GREY = '#666666';
const TEXT = '#1A1A1A';

const EVENT_LINK = 'https://contriba.rw/e/john-mary-wedding';

const SHARE_OPTIONS = [
  { id: '1', icon: 'logo-whatsapp',  label: 'WhatsApp',  color: '#25D366', bg: '#E8F5E9' },
  { id: '2', icon: 'logo-facebook',  label: 'Facebook',  color: '#1877F2', bg: '#E3F2FD' },
  { id: '3', icon: 'chatbubble',     label: 'Messenger', color: '#0084FF', bg: '#E3F2FD' },
  { id: '4', icon: 'logo-instagram', label: 'Instagram', color: '#E1306C', bg: '#FCE4EC' },
  { id: '5', icon: 'chatbubble-ellipses', label: 'SMS',  color: '#34C759', bg: '#E8F5E9' },
  { id: '6', icon: 'mail',           label: 'Email',     color: '#0078D4', bg: '#E3F2FD' },
  { id: '7', icon: 'ellipsis-horizontal', label: 'More', color: DARK_GREY, bg: LIGHT_GREY },
];

export default function ShareEventScreen({ navigation, route }) {
  const event = route?.params?.event || {
    title: 'John & Mary Wedding',
    date: '20 July 2026',
    location: 'Kigali, Rwanda',
    coverImage: require('../../assets/couple.png'),
  };

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    Clipboard.setString(EVENT_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (platform) => {
    try {
      await Share.share({
        message: `🎉 You're invited to ${event.title}!\n\nContribute a gift and be part of our special day.\n\n${EVENT_LINK}`,
        url: EVENT_LINK,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        message: `🎉 You're invited to ${event.title}!\n\nContribute a gift and be part of our special day.\n\n${EVENT_LINK}`,
      });
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Event</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* EVENT CARD */}
        <View style={styles.eventCard}>
          <Image source={event.coverImage} style={styles.eventImage} resizeMode="cover" />
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={styles.eventMeta}>
              <Ionicons name="calendar-outline" size={13} color={DARK_GREY} />
              <Text style={styles.eventMetaText}>{event.date}</Text>
            </View>
            <View style={styles.eventMeta}>
              <Ionicons name="location-outline" size={13} color={DARK_GREY} />
              <Text style={styles.eventMetaText}>{event.location}</Text>
            </View>
          </View>
        </View>

        {/* SHARE YOUR EVENT BANNER */}
        <View style={styles.shareBanner}>
          <View style={styles.shareBannerLeft}>
            <Text style={styles.shareBannerTitle}>Share your event</Text>
            <Text style={styles.shareBannerSub}>
              Invite friends and family to contribute and be part of our special day.
            </Text>
          </View>
          <View style={styles.shareBannerRight}>
            <Ionicons name="mail" size={48} color={WINE} style={{ opacity: 0.2 }} />
          </View>
        </View>

        {/* EVENT LINK */}
        <Text style={styles.sectionTitle}>Your Event Link</Text>
        <View style={styles.linkBox}>
          <Text style={styles.linkText} numberOfLines={1}>{EVENT_LINK}</Text>
          <TouchableOpacity onPress={handleCopyLink} style={styles.copyIconBtn}>
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={20}
              color={copied ? '#1A9E4A' : WINE}
            />
          </TouchableOpacity>
        </View>

        {/* COPY LINK BUTTON */}
        <TouchableOpacity
          style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
          onPress={handleCopyLink}
          activeOpacity={0.85}
        >
          <Ionicons
            name={copied ? 'checkmark-circle' : 'copy-outline'}
            size={20}
            color={WHITE}
          />
          <Text style={styles.copyBtnText}>
            {copied ? 'Link Copied!' : 'Copy Link'}
          </Text>
        </TouchableOpacity>

        {/* SHARE VIA */}
        <Text style={styles.sectionTitle}>Share via</Text>
        <View style={styles.shareGrid}>
          {SHARE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.shareOption}
              activeOpacity={0.7}
              onPress={() => option.id === '7' ? handleNativeShare() : handleShare(option.label)}
            >
              <View style={[styles.shareIconBox, { backgroundColor: option.bg }]}>
                <Ionicons name={option.icon} size={26} color={option.color} />
              </View>
              <Text style={styles.shareOptionLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SHARE AS IMAGE */}
        <TouchableOpacity style={styles.shareExtraCard} activeOpacity={0.7}>
          <View style={styles.shareExtraLeft}>
            <Text style={styles.shareExtraTitle}>Share as Image</Text>
            <Text style={styles.shareExtraSub}>
              Create and share a beautiful image of your event.
            </Text>
          </View>
          <View style={styles.shareExtraRight}>
            <Image source={event.coverImage} style={styles.shareExtraThumb} />
          </View>
          <Ionicons name="chevron-forward" size={18} color={DARK_GREY} style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {/* SHARE MESSAGE */}
        <TouchableOpacity style={styles.shareExtraCard} activeOpacity={0.7}>
          <View style={styles.shareExtraLeft}>
            <Text style={styles.shareExtraTitle}>Share Message</Text>
            <Text style={styles.shareExtraSub}>
              Use a message template or write your own.
            </Text>
          </View>
          <View style={[styles.shareExtraRight, { backgroundColor: '#FFE4E9', borderRadius: 10, padding: 8 }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color={WINE} />
          </View>
          <Ionicons name="chevron-forward" size={18} color={DARK_GREY} style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {/* BOTTOM QUOTE */}
        <View style={styles.quoteSection}>
          <View style={styles.quoteIcon}>
            <Ionicons name="heart" size={36} color={WINE} style={{ opacity: 0.3 }} />
          </View>
          <View style={styles.quoteText}>
            <Text style={styles.quoteLine}>The more you share,</Text>
            <Text style={styles.quoteLineBold}>the more love you receive.</Text>
            <Text style={styles.quoteThanks}>Thank you! ❤️</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: WHITE,
    borderBottomWidth: 1, borderBottomColor: LIGHT_GREY,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: LIGHT_GREY,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: TEXT },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },

  // Event card
  eventCard: {
    flexDirection: 'row', backgroundColor: LIGHT_GREY,
    borderRadius: 16, overflow: 'hidden', marginBottom: 16, alignItems: 'center',
  },
  eventImage: { width: 90, height: 90 },
  eventInfo: { flex: 1, padding: 12 },
  eventTitle: { fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 6 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  eventMetaText: { fontSize: 12, color: DARK_GREY, marginLeft: 4 },

  // Share banner
  shareBanner: {
    backgroundColor: '#FFF5F7', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#FFD6E0',
  },
  shareBannerLeft: { flex: 1 },
  shareBannerTitle: { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 4 },
  shareBannerSub: { fontSize: 12, color: DARK_GREY, lineHeight: 18 },
  shareBannerRight: { marginLeft: 12 },

  // Section title
  sectionTitle: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 12 },

  // Link box
  linkBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: LIGHT_GREY,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 12, borderWidth: 1, borderColor: MID_GREY,
  },
  linkText: { flex: 1, fontSize: 13, color: DARK_GREY },
  copyIconBtn: { padding: 4 },

  // Copy button
  copyBtn: {
    backgroundColor: WINE, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 24,
    shadowColor: WINE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  copyBtnSuccess: { backgroundColor: '#1A9E4A' },
  copyBtnText: { color: WHITE, fontSize: 16, fontWeight: '700', marginLeft: 6 },

  // Share grid
  shareGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 16, marginBottom: 20, justifyContent: 'flex-start',
  },
  shareOption: { alignItems: 'center', gap: 6, width: '20%' },
  shareIconBox: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  shareOptionLabel: { fontSize: 11, color: TEXT, fontWeight: '600', textAlign: 'center' },

  // Share extra cards
  shareExtraCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: LIGHT_GREY,
    borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: MID_GREY,
  },
  shareExtraLeft: { flex: 1 },
  shareExtraTitle: { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 3 },
  shareExtraSub: { fontSize: 12, color: DARK_GREY },
  shareExtraRight: { marginLeft: 12 },
  shareExtraThumb: { width: 48, height: 48, borderRadius: 8 },

  // Quote
  quoteSection: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 20, gap: 12,
  },
  quoteIcon: { alignItems: 'center', justifyContent: 'center' },
  quoteText: { alignItems: 'flex-start' },
  quoteLineBold: { fontSize: 15, fontWeight: '800', color: TEXT },
  quoteLine: { fontSize: 14, color: DARK_GREY },
  quoteThanks: { fontSize: 14, color: WINE, fontWeight: '600', marginTop: 2 },
});