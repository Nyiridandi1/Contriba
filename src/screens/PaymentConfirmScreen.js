import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const WINE = '#E60012';
const WHITE = '#FFFFFF';
const LIGHT_GREY = '#F5F5F5';
const MID_GREY = '#CCCCCC';
const DARK_GREY = '#666666';
const TEXT = '#1A1A1A';

const BASE_URL = 'https://contriba-backend-production.up.railway.app';

export default function PaymentConfirmScreen({ navigation, route }) {
  const {
    contribution,
    event,
    amount = '10,000',
    method = 'MTN Mobile Money',
  } = route?.params || {};

  const [selectedMethod, setSelectedMethod] = useState('mtn');
  const [isLoading, setIsLoading]           = useState(false);

  const cleanAmount = parseInt(String(amount).replace(/,/g, '')) || 0;
  const formatAmount = (val) => 'RWF ' + val.toLocaleString('en-RW');

  const paymentMethods = [
    { id: 'mtn',    label: 'MTN Mobile Money', logo: require('../../assets/mtn.png')    },
    { id: 'airtel', label: 'Airtel Money',      logo: require('../../assets/airtel.jpg') },
    { id: 'visa',   label: 'Visa / Card',       logo: require('../../assets/Visa.png')   },
  ];

  const handlePayNow = async () => {
    if (selectedMethod === 'visa') {
      Alert.alert('Coming Soon', 'Card payments will be available soon!');
      return;
    }

    if (!contribution?.contributor_phone) {
      Alert.alert('Error', 'Phone number is missing. Please go back and try again.');
      return;
    }

    setIsLoading(true);
    try {
      // Format phone number
      let phone = contribution.contributor_phone;
      if (phone.startsWith('+250')) phone = phone.replace('+250', '250');
      if (phone.startsWith('0')) phone = '250' + phone.slice(1);

      const response = await fetch(`${BASE_URL}/api/payments/cashin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cleanAmount,
          phone: phone,
          contribution_id: contribution?.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Navigate to success screen
        navigation.navigate('PaymentSuccess', {
          event,
          amount,
          paymentMethod: selectedMethod,
          phoneNumber: contribution.contributor_phone,
          transaction_ref: result.transaction_ref,
        });
      } else {
        Alert.alert('Payment Failed', result.message || 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
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
        <Text style={styles.headerTitle}>Confirm Payment</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* EVENT CARD */}
        <View style={styles.eventCard}>
          <Image source={require('../../assets/couple.png')} style={styles.eventImage} resizeMode="cover" />
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{event?.title || 'Event'}</Text>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={13} color={DARK_GREY} />
              <Text style={styles.dateText}>{event?.date || ''}</Text>
            </View>
          </View>
        </View>

        {/* YOU ARE SENDING */}
        <View style={styles.amountBlock}>
          <Text style={styles.youAreSending}>You are sending</Text>
          <Text style={styles.bigAmount}>{formatAmount(cleanAmount)}</Text>
          <Text style={styles.toEvent}>to {event?.title || 'this event'}</Text>
        </View>

        {/* CONTRIBUTOR INFO */}
        {contribution && (
          <View style={styles.contributorCard}>
            <Ionicons name="person-circle-outline" size={20} color={WINE} />
            <Text style={styles.contributorText}>
              {contribution.contributor_name} • {contribution.contributor_phone}
            </Text>
          </View>
        )}

        {/* CHOOSE PAYMENT METHOD */}
        <Text style={styles.sectionTitle}>Choose Payment Method</Text>
        <View style={styles.methodsCard}>
          {paymentMethods.map((m, index) => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.methodRow,
                index < paymentMethods.length - 1 && styles.methodRowBorder,
                selectedMethod === m.id && styles.methodRowSelected,
              ]}
              onPress={() => setSelectedMethod(m.id)}
              activeOpacity={0.7}
            >
              <Image source={m.logo} style={styles.methodLogo} resizeMode="contain" />
              <View style={styles.methodText}>
                <Text style={styles.methodLabel}>{m.label}</Text>
              </View>
              <View style={[styles.radio, selectedMethod === m.id && styles.radioSelected]}>
                {selectedMethod === m.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* AMOUNT BREAKDOWN */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Amount</Text>
            <Text style={styles.breakdownValue}>{formatAmount(cleanAmount)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Transaction Fee</Text>
            <Text style={styles.breakdownValue}>RWF 0</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatAmount(cleanAmount)}</Text>
          </View>
        </View>

        {/* SECURITY NOTE */}
        <View style={styles.securityNote}>
          <View style={styles.shieldBubble}>
            <Ionicons name="shield-checkmark-outline" size={20} color={WINE} />
          </View>
          <Text style={styles.securityText}>
            You will receive a mobile money prompt on your phone to confirm this payment.
          </Text>
        </View>

      </ScrollView>

      {/* PAY NOW BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payBtn, isLoading && styles.payBtnLoading]}
          onPress={handlePayNow}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <>
              <Text style={styles.payBtnText}>Pay Now {formatAmount(cleanAmount)}</Text>
              <Ionicons name="arrow-forward" size={20} color={WHITE} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: LIGHT_GREY },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: LIGHT_GREY, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: TEXT },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  eventCard: { flexDirection: 'row', backgroundColor: LIGHT_GREY, borderRadius: 14, overflow: 'hidden', marginBottom: 24, alignItems: 'center' },
  eventImage: { width: 80, height: 80 },
  eventInfo: { flex: 1, paddingHorizontal: 14 },
  eventTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 13, color: DARK_GREY, marginLeft: 4 },
  amountBlock: { alignItems: 'center', marginBottom: 24 },
  youAreSending: { fontSize: 14, color: DARK_GREY, marginBottom: 6 },
  bigAmount: { fontSize: 34, fontWeight: '900', color: TEXT, letterSpacing: -0.5, marginBottom: 4 },
  toEvent: { fontSize: 14, color: DARK_GREY },
  contributorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FDF0F3', borderRadius: 12, padding: 12, marginBottom: 20 },
  contributorText: { fontSize: 14, fontWeight: '600', color: TEXT },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 12 },
  methodsCard: { backgroundColor: LIGHT_GREY, borderRadius: 14, marginBottom: 16, overflow: 'hidden' },
  methodRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: WHITE },
  methodRowBorder: { borderBottomWidth: 1, borderBottomColor: LIGHT_GREY },
  methodRowSelected: { backgroundColor: '#FFF5F7' },
  methodLogo: { width: 50, height: 36, borderRadius: 8, backgroundColor: WHITE, marginRight: 12 },
  methodText: { flex: 1 },
  methodLabel: { fontSize: 14, fontWeight: '600', color: TEXT },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: MID_GREY, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: WINE },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: WINE },
  breakdownCard: { backgroundColor: LIGHT_GREY, borderRadius: 14, padding: 16, marginBottom: 16 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  breakdownLabel: { fontSize: 14, color: DARK_GREY },
  breakdownValue: { fontSize: 14, color: TEXT },
  divider: { height: 1, backgroundColor: MID_GREY, marginVertical: 8 },
  totalDivider: { height: 1, backgroundColor: MID_GREY, marginVertical: 8 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: TEXT },
  totalValue: { fontSize: 15, fontWeight: '700', color: TEXT },
  securityNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: LIGHT_GREY, borderRadius: 14, padding: 14, marginBottom: 8 },
  shieldBubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFE4E9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  securityText: { fontSize: 13, color: DARK_GREY, flex: 1, lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: LIGHT_GREY },
  payBtn: { backgroundColor: WINE, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: WINE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  payBtnLoading: { backgroundColor: '#A0354A' },
  payBtnText: { color: WHITE, fontSize: 17, fontWeight: '700' },
});