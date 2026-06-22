import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Image, StatusBar, Animated, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const WINE = '#E8192C';
const GREEN = '#2EAD4B';
const WHITE = '#FFFFFF';
const LIGHT_GREY = '#F5F5F5';
const MID_GREY = '#CCCCCC';
const DARK_GREY = '#666666';
const TEXT = '#1A1A1A';

const CONTRIBA_FEE = 0.01; // ✅ Changed to 1%

const PAYMENT_LABELS = {
  mtn: 'MTN Mobile Money',
  airtel: 'Airtel Money',
  visa: 'Visa Card',
};

const CONFETTI_PIECES = [
  { color: '#FF6B6B', top: 60,  left: 30,  rotate: '20deg',  width: 10, height: 5 },
  { color: '#FFD93D', top: 40,  left: 80,  rotate: '-15deg', width: 8,  height: 4 },
  { color: '#6BCB77', top: 80,  left: 55,  rotate: '45deg',  width: 6,  height: 6 },
  { color: '#4D96FF', top: 35,  left: 160, rotate: '10deg',  width: 10, height: 5 },
  { color: '#FF922B', top: 65,  left: 200, rotate: '-30deg', width: 8,  height: 4 },
  { color: '#CC5DE8', top: 50,  left: 240, rotate: '25deg',  width: 6,  height: 6 },
  { color: '#FF6B6B', top: 90,  left: 270, rotate: '-10deg', width: 9,  height: 4 },
  { color: '#FFD93D', top: 100, left: 20,  rotate: '35deg',  width: 7,  height: 5 },
  { color: '#4D96FF', top: 110, left: 290, rotate: '-40deg', width: 8,  height: 4 },
  { color: '#6BCB77', top: 30,  left: 120, rotate: '55deg',  width: 5,  height: 5 },
  { color: '#CC5DE8', top: 120, left: 140, rotate: '-20deg', width: 9,  height: 4 },
  { color: '#FF922B', top: 45,  left: 310, rotate: '15deg',  width: 7,  height: 5 },
];

export default function PaymentSuccessScreen({ navigation, route }) {
  const {
    event = { title: 'Event' },
    amount,
    paymentMethod = 'mtn',
    phoneNumber = '',
    total,
  } = route?.params || {};

  // ✅ Fix NaN - ensure amount is always a number
  const safeAmount = parseInt(amount) || 0;
  const fee = Math.round(safeAmount * CONTRIBA_FEE);
  const safeTotal = parseInt(total) || safeAmount;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const formatAmount = (val) => 'RWF ' + (parseInt(val) || 0).toLocaleString('en-RW');

  const getPaymentLogo = (method) => {
    if (method === 'mtn') return require('../../assets/mtn.png');
    if (method === 'airtel') return require('../../assets/airtel.jpg');
    if (method === 'visa') return require('../../assets/Visa.png');
    return require('../../assets/mtn.png');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just contributed ${formatAmount(safeAmount)} to ${event?.title} via Contriba! 🎉 Download Contriba to contribute too!`,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleGoHome = () => navigation.navigate('Home');
  const handleBackToEvent = () => navigation.navigate('EventPage', { event });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoHome} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="home-outline" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Successful</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* CONFETTI + CHECKMARK */}
        <View style={styles.celebrationZone}>
          {CONFETTI_PIECES.map((p, i) => (
            <Animated.View
              key={i}
              style={[styles.confettiPiece, {
                backgroundColor: p.color, top: p.top, left: p.left,
                width: p.width, height: p.height,
                transform: [{ rotate: p.rotate }], opacity: fadeAnim,
              }]}
            />
          ))}
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
            <Ionicons name="checkmark" size={56} color={WHITE} />
          </Animated.View>
        </View>

        {/* SUCCESS TEXT */}
        <Animated.View style={[styles.successTextBlock, { opacity: fadeAnim }]}>
          <Text style={styles.successTitle}>Payment Successful 🎉</Text>
          <Text style={styles.successSub}>You have contributed</Text>
          <Text style={styles.bigAmount}>{formatAmount(safeAmount)}</Text>
          <Text style={styles.toEvent}>to {event?.title}</Text>
        </Animated.View>

        {/* PAYMENT METHOD CARD */}
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <Image source={getPaymentLogo(paymentMethod)} style={styles.methodLogo} resizeMode="contain" />
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>via {PAYMENT_LABELS[paymentMethod] || 'Mobile Money'}</Text>
            {phoneNumber ? <Text style={styles.methodPhone}>{phoneNumber}</Text> : null}
          </View>
        </Animated.View>

        {/* ✅ RECEIPT BREAKDOWN - Fixed NaN + 1% fee */}
        <Animated.View style={[styles.receiptCard, { opacity: fadeAnim }]}>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Amount</Text>
            <Text style={styles.receiptValue}>{formatAmount(safeAmount)}</Text>
          </View>
          <View style={styles.receiptDivider} />
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Platform Fee (1%)</Text>
            <Text style={[styles.receiptValue, { color: WINE }]}>- RWF {fee.toLocaleString()}</Text>
          </View>
          <View style={styles.receiptDivider} />
          <View style={styles.receiptRow}>
            <Text style={styles.receiptTotalLabel}>Total Paid</Text>
            <Text style={styles.receiptTotalValue}>{formatAmount(safeTotal)}</Text>
          </View>
          <View style={styles.receiptDivider} />
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Owner Receives</Text>
            <Text style={[styles.receiptValue, { color: GREEN, fontWeight: '700' }]}>
              RWF {(safeAmount - fee).toLocaleString()}
            </Text>
          </View>
        </Animated.View>

        {/* NOTE */}
        <Animated.View style={[styles.receiptNote, { opacity: fadeAnim }]}>
          <View style={styles.heartBubble}>
            <Ionicons name="heart" size={18} color={WINE} />
          </View>
          <Text style={styles.receiptNoteText}>
            Your contribution has been received! The event owner will be notified. 🎊
          </Text>
        </Animated.View>

      </ScrollView>

      {/* FOOTER BUTTONS */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleGoHome} activeOpacity={0.85}>
          <Ionicons name="home-outline" size={18} color={WHITE} />
          <Text style={styles.btnPrimaryText}>Back to Home</Text>
        </TouchableOpacity>
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.btnOutline} onPress={handleBackToEvent} activeOpacity={0.85}>
            <Ionicons name="calendar-outline" size={16} color={WINE} />
            <Text style={styles.btnOutlineText}>View Event</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnOutline} onPress={handleShare} activeOpacity={0.85}>
            <Ionicons name="share-social-outline" size={16} color={WINE} />
            <Text style={styles.btnOutlineText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: LIGHT_GREY },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: LIGHT_GREY, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: TEXT },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  celebrationZone: { height: 200, alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 8 },
  confettiPiece: { position: 'absolute', borderRadius: 2 },
  checkCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10 },
  successTextBlock: { alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 22, fontWeight: '800', color: TEXT, marginBottom: 6 },
  successSub: { fontSize: 14, color: DARK_GREY, marginBottom: 4 },
  bigAmount: { fontSize: 34, fontWeight: '900', color: TEXT, letterSpacing: -0.5, marginBottom: 4 },
  toEvent: { fontSize: 14, color: DARK_GREY },
  card: { backgroundColor: LIGHT_GREY, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  methodLogo: { width: 52, height: 40, borderRadius: 8, backgroundColor: WHITE, marginRight: 14 },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 14, fontWeight: '700', color: TEXT },
  methodPhone: { fontSize: 13, color: DARK_GREY, marginTop: 3 },
  receiptCard: { backgroundColor: LIGHT_GREY, borderRadius: 14, padding: 16, marginBottom: 12 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  receiptLabel: { fontSize: 14, color: DARK_GREY },
  receiptValue: { fontSize: 14, color: TEXT },
  receiptDivider: { height: 1, backgroundColor: MID_GREY, marginVertical: 8 },
  receiptTotalLabel: { fontSize: 15, fontWeight: '700', color: TEXT },
  receiptTotalValue: { fontSize: 15, fontWeight: '700', color: TEXT },
  receiptNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: LIGHT_GREY, borderRadius: 14, padding: 14, marginBottom: 8 },
  heartBubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFE4E9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  receiptNoteText: { fontSize: 13, color: DARK_GREY, flex: 1, lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: WHITE, gap: 10 },
  btnPrimary: { backgroundColor: WINE, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, shadowColor: WINE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  btnPrimaryText: { color: WHITE, fontSize: 16, fontWeight: '700' },
  footerRow: { flexDirection: 'row', gap: 10 },
  btnOutline: { flex: 1, borderWidth: 1.5, borderColor: WINE, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  btnOutlineText: { color: WINE, fontSize: 14, fontWeight: '700' },
});