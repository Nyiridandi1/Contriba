import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Image, Share, Clipboard, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const WINE      = '#7A001F';
const WHITE     = '#FFFFFF';
const LIGHT_GREY = '#F5F5F5';
const MID_GREY  = '#E0E0E0';
const DARK_GREY = '#666666';
const TEXT      = '#1A1A1A';

const SHARE_OPTIONS = [
  { id: '1', icon: 'logo-whatsapp',       label: 'WhatsApp',  color: '#25D366', bg: '#E8F5E9' },
  { id: '2', icon: 'logo-facebook',       label: 'Facebook',  color: '#1877F2', bg: '#E3F2FD' },
  { id: '3', icon: 'logo-instagram',      label: 'Instagram', color: '#E1306C', bg: '#FCE4EC' },
  { id: '4', icon: 'chatbubble-ellipses', label: 'SMS',       color: '#34C759', bg: '#E8F5E9' },
  { id: '5', icon: 'mail',               label: 'Email',     color: '#0078D4', bg: '#E3F2FD' },
  { id: '6', icon: 'ellipsis-horizontal', label: 'More',     color: DARK_GREY,  bg: LIGHT_GREY },
];

export default function ShareEventScreen({ navigation, route }) {
  const event = route?.params?.event;
  const [copied, setCopied] = useState(false);

  // Generate real share link from event data
  const getShareLink = () => {
    if (!event) return 'https://contriba.rw/event/my-event';
    if (event.share_link) return event.share_link;
    const slug = event.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'event';
    return `https://contriba.rw/e/${slug}-${event.id?.slice(0, 8)}`;
  };

  const shareLink = getShareLink();

  const getShareMessage = () => {
    return `🎉 You're invited to ${event?.title || 'our special event'}!\n\n${event?.description ? event.description + '\n\n' : ''}📅 Date: ${event?.date || ''}\n📍 Location: ${event?.location || 'Kigali, Rwanda'}\n\n💝 Contribute a gift and be part of our special day:\n${shareLink}`;
  };

  const handleCopyLink = () => {
    Clipboard.setString(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: getShareMessage(),
        url: shareLink,
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Event</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* EVENT CARD */}
        <View style={styles.eventCard}>
          <Image source={require('../../assets/couple.png')} style={styles.eventImage} resizeMode="cover" />
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{event?.title || 'My Event'}</Text>
            <View style={styles.eventMeta}>
              <Ionicons name="calendar-outline" size={13} color={DARK_GREY} />
              <Text style={styles.eventMetaText}>{event?.date || ''}</Text>
            </View>
            <View style={styles.eventMeta}>
              <Ionicons name="location-outline" size={13} color={DARK_GREY} />
              <Text style={styles.eventMetaText}>{event?.location || 'Kigali, Rwanda'}</Text>
            </View>
            {event?.total_raised > 0 && (
              <View style={styles.eventMeta}>
                <Ionicons name="heart" size={13} color={WINE} />
                <Text style={[styles.eventMetaText, { color: WINE, fontWeight: '700' }]}>
                  RWF {event.total_raised?.toLocaleString()} raised
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* SHARE BANNER */}
        <View style={styles.shareBanner}>
          <View style={styles.shareBannerLeft}>
            <Text style={styles.shareBannerTitle}>Share your event 🎉</Text>
            <Text style={styles.shareBannerSub}>
              Invite friends and family to contribute and be part of your special day!
            </Text>
          </View>
          <Ionicons name="share-social" size={40} color={WINE} style={{ opacity: 0.2 }} />
        </View>

        {/* EVENT LINK */}
        <Text style={styles.sectionTitle}>Your Event Link</Text>
        <View style={styles.linkBox}>
          <Ionicons name="link-outline" size={18} color={WINE} style={{ marginRight: 8 }} />
          <Text style={styles.linkText} numberOfLines={1}>{shareLink}</Text>
          <TouchableOpacity onPress={handleCopyLink} style={styles.copyIconBtn}>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={20}
              color={copied ? '#1A9E4A' : WINE}
            />
          </TouchableOpacity>
        </View>

        {copied && (
          <View style={styles.copiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#1A9E4A" />
            <Text style={styles.copiedText}>Link copied to clipboard!</Text>
          </View>
        )}

        {/* COPY LINK BUTTON */}
        <TouchableOpacity
          style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
          onPress={handleCopyLink}
          activeOpacity={0.85}
        >
          <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={20} color={WHITE} />
          <Text style={styles.copyBtnText}>{copied ? 'Link Copied! ✓' : 'Copy Link'}</Text>
        </TouchableOpacity>

        {/* SHARE NOW BUTTON */}
        <TouchableOpacity style={styles.shareNowBtn} onPress={handleShare} activeOpacity={0.85}>
          <Ionicons name="share-social-outline" size={20} color={WINE} />
          <Text style={styles.shareNowText}>Share Now</Text>
        </TouchableOpacity>

        {/* SHARE VIA */}
        <Text style={styles.sectionTitle}>Share via</Text>
        <View style={styles.shareGrid}>
          {SHARE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.shareOption}
              activeOpacity={0.7}
              onPress={handleShare}
            >
              <View style={[styles.shareIconBox, { backgroundColor: option.bg }]}>
                <Ionicons name={option.icon} size={26} color={option.color} />
              </View>
              <Text style={styles.shareOptionLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SHARE MESSAGE PREVIEW */}
        <Text style={styles.sectionTitle}>Message Preview</Text>
        <View style={styles.messagePreview}>
          <Text style={styles.messageText}>{getShareMessage()}</Text>
          <TouchableOpacity style={styles.copyMsgBtn} onPress={() => {
            Clipboard.setString(getShareMessage());
            Alert.alert('Copied!', 'Message copied to clipboard');
          }}>
            <Ionicons name="copy-outline" size={16} color={WINE} />
            <Text style={styles.copyMsgText}>Copy Message</Text>
          </TouchableOpacity>
        </View>

        {/* BOTTOM QUOTE */}
        <View style={styles.quoteSection}>
          <Ionicons name="heart" size={36} color={WINE} style={{ opacity: 0.3 }} />
          <View>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: LIGHT_GREY },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: LIGHT_GREY, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: TEXT },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  eventCard: { flexDirection: 'row', backgroundColor: LIGHT_GREY, borderRadius: 16, overflow: 'hidden', marginBottom: 16, alignItems: 'center' },
  eventImage: { width: 90, height: 90 },
  eventInfo: { flex: 1, padding: 12 },
  eventTitle: { fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 6 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  eventMetaText: { fontSize: 12, color: DARK_GREY, marginLeft: 4 },
  shareBanner: { backgroundColor: '#FFF5F7', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FFD6E0', gap: 12 },
  shareBannerLeft: { flex: 1 },
  shareBannerTitle: { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 4 },
  shareBannerSub: { fontSize: 12, color: DARK_GREY, lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 12 },
  linkBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: LIGHT_GREY, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8, borderWidth: 1, borderColor: MID_GREY },
  linkText: { flex: 1, fontSize: 13, color: DARK_GREY },
  copyIconBtn: { padding: 4 },
  copiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  copiedText: { fontSize: 13, color: '#1A9E4A', fontWeight: '600' },
  copyBtn: { backgroundColor: WINE, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10, shadowColor: WINE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  copyBtnSuccess: { backgroundColor: '#1A9E4A' },
  copyBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' },
  shareNowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: WINE, borderRadius: 14, paddingVertical: 14, marginBottom: 24 },
  shareNowText: { color: WINE, fontSize: 16, fontWeight: '700' },
  shareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24, justifyContent: 'flex-start' },
  shareOption: { alignItems: 'center', gap: 6, width: '20%' },
  shareIconBox: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  shareOptionLabel: { fontSize: 11, color: TEXT, fontWeight: '600', textAlign: 'center' },
  messagePreview: { backgroundColor: LIGHT_GREY, borderRadius: 14, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: MID_GREY },
  messageText: { fontSize: 13, color: DARK_GREY, lineHeight: 20, marginBottom: 12 },
  copyMsgBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end' },
  copyMsgText: { fontSize: 13, color: WINE, fontWeight: '600' },
  quoteSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 12 },
  quoteLineBold: { fontSize: 15, fontWeight: '800', color: TEXT },
  quoteLine: { fontSize: 14, color: DARK_GREY },
  quoteThanks: { fontSize: 14, color: WINE, fontWeight: '600', marginTop: 2 },
});