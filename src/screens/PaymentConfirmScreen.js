import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const WINE = '#CC0000';
const WHITE = '#FFFFFF';
const LIGHT_GREY = '#F5F5F5';
const MID_GREY = '#CCCCCC';
const DARK_GREY = '#666666';
const TEXT = '#1A1A1A';
const GREEN = '#1A9E4A';

const BASE_URL = 'https://contriba-backend-production.up.railway.app';

export default function PaymentConfirmScreen({ navigation, route }) {
  const {
    contribution,
    event,
    amount = '10000',
  } = route?.params || {};

  const [selectedMethod, setSelectedMethod] = useState('mtn');
  const [isLoading, setIsLoading]           = useState(false);
  const [statusMessage, setStatusMessage]   = useState('');
  const [timedOut, setTimedOut]             = useState(false);
  const [lastRef, setLastRef]               = useState(null);
  const pollingRef                          = useRef(null);

  const cleanAmount = parseInt(String(amount).replace(/,/g, '')) || 0;
  const formatAmount = (val) => 'RWF ' + (val || 0).toLocaleString('en-RW');

  const paymentMethods = [
    { id: 'mtn',    label: 'MTN Mobile Money', logo: require('../../assets/mtn.png')    },
    { id: 'airtel', label: 'Airtel Money',      logo: require('../../assets/airtel.jpg') },
    { id: 'visa',   label: 'Visa / Card',       logo: require('../../assets/Visa.png')   },
  ];

  const startPolling = (ref) => {
    let attempts = 0;
    const maxAttempts = 60; // 3 minutes

    const checkStatus = async () => {
      attempts++;
      try {
        console.log(`Polling attempt ${attempts} for ref: ${ref}`);
        const statusRes = await fetch(`${BASE_URL}/api/payments/status/${ref}`);
        const statusData = await statusRes.json();
        console.log(`Status response:`, JSON.stringify(statusData));

        if (statusData.status === 'successful') {
          // ✅ Payment confirmed!
          setIsLoading(false);
          setStatusMessage('');
          setTimedOut(false);
          navigation.navigate('PaymentSuccess', {
            event,
            amount: cleanAmount,
            paymentMethod: selectedMethod,
            phoneNumber: contribution?.contributor_phone,
            transaction_ref: ref,
            total: cleanAmount,
          });
          return;
        }

        if (statusData.status === 'failed') {
          setIsLoading(false);
          setStatusMessage('');
          Alert.alert('Payment Failed', 'Your payment was declined. Please try again.');
          return;
        }

        // Still pending
        if (attempts < maxAttempts) {
          const seconds = attempts * 3;
          if (seconds < 60) {
            setStatusMessage(`Waiting for confirmation... (${seconds}s)`);
          } else {
            setStatusMessage(`Still waiting... (${Math.floor(seconds / 60)}m ${seconds % 60}s)`);
          }
          pollingRef.current = setTimeout(checkStatus, 3000);
        } else {
          // Timed out after 3 minutes
          setIsLoading(false);
          setStatusMessage('');
          setTimedOut(true);
        }

      } catch (err) {
        console.log(`Poll error attempt ${attempts}:`, err.message);
        if (attempts < maxAttempts) {
          pollingRef.current = setTimeout(checkStatus, 3000);
        } else {
          setIsLoading(false);
          setStatusMessage('');
          setTimedOut(true);
        }
      }
    };

    // Start first check after 5 seconds
    pollingRef.current = setTimeout(checkStatus, 5000);
  };

  const handlePayNow = async () => {
    if (selectedMethod === 'visa') {
      Alert.alert('Coming Soon', 'Card payments will be available soon!');
      return;
    }

    // Safety check for phone
    const rawPhone = contribution?.contributor_phone;
    if (!rawPhone) {
      Alert.alert('Error', 'Phone number is missing. Please go back and try again.');
      return;
    }

    // Format phone for Paypack
    let phone = String(rawPhone).replace(/[\s-]/g, '');
    if (phone.startsWith('+250')) phone = '250' + phone.slice(4);
    else if (phone.startsWith('0')) phone = '250' + phone.slice(1);
    else if (!phone.startsWith('250')) phone = '250' + phone;

    console.log(`Starting payment: amount=${cleanAmount}, phone=${phone}`);

    setIsLoading(true);
    setTimedOut(false);
    setStatusMessage('Sending payment request...');

    try {
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
      console.log('Cashin result:', JSON.stringify(result));

      if (result.success) {
        const ref = result.transaction_ref;
        setLastRef(ref);
        setStatusMessage('Check your phone to confirm payment 📱');
        console.log(`Cashin successful! ref=${ref}. Starting polling...`);
        startPolling(ref);
      } else {
        setIsLoading(false);
        setStatusMessage('');
        Alert.alert('Payment Failed', result.message || 'Please try again');
      }
    } catch (error) {
      console.log('Cashin error:', error.message);
      setIsLoading(false);
      setStatusMessage('');
      Alert.alert('Error', 'Could not connect to server. Please check your internet and try again.');
    }
  };

  const handleRetry = () => {
    if (lastRef) {
      setIsLoading(true);
      setTimedOut(false);
      setStatusMessage('Checking payment status...');
      startPolling(lastRef);
    } else {
      handlePayNow();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Payment</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {contribution && (
          <View style={styles.contributorCard}>
            <Ionicons name="person-circle-outline" size={20} color={WINE} />
            <Text style={styles.contributorText}>
              {contribution.contributor_name} • {contribution.contributor_phone}
            </Text>
          </View>
        )}

        <View style={styles.amountBlock}>
          <Text style={styles.youAreSending}>You are sending</Text>
          <Text style={styles.bigAmount}>{formatAmount(cleanAmount)}</Text>
          <Text style={styles.toEvent}>to {event?.title || 'this event'}</Text>
        </View>

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

        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Amount</Text>
            <Text style={styles.breakdownValue}>{formatAmount(cleanAmount)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Platform Fee (1%)</Text>
            <Text style={[styles.breakdownValue, { color: WINE }]}>
              - RWF {Math.round(cleanAmount * 0.01).toLocaleString()}
            </Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>{formatAmount(cleanAmount)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Owner Receives</Text>
            <Text style={[styles.breakdownValue, { color: GREEN, fontWeight: '700' }]}>
              RWF {(cleanAmount - Math.round(cleanAmount * 0.01)).toLocaleString()}
            </Text>
          </View>
        </View>

        {timedOut && (
          <View style={styles.timeoutBox}>
            <Ionicons name="time-outline" size={24} color={WINE} />
            <View style={{ flex: 1 }}>
              <Text style={styles.timeoutTitle}>Payment is taking longer than expected</Text>
              <Text style={styles.timeoutSub}>If you confirmed on your phone, tap "Check Status". Otherwise tap "Pay Again".</Text>
            </View>
          </View>
        )}

        <View style={styles.securityNote}>
          <View style={styles.shieldBubble}>
            <Ionicons name="shield-checkmark-outline" size={20} color={WINE} />
          </View>
          <Text style={styles.securityText}>
            You will receive a mobile money prompt on your phone to confirm this payment.
          </Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        {isLoading && statusMessage ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color={WINE} size="small" />
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : null}

        {timedOut && !isLoading ? (
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
            <Ionicons name="refresh-outline" size={20} color={WINE} />
            <Text style={styles.retryBtnText}>Check Status / Try Again</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.payBtn, isLoading && styles.payBtnLoading]}
          onPress={timedOut ? handlePayNow : handlePayNow}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <>
              <Text style={styles.payBtnText}>
                {timedOut ? 'Pay Again' : 'Pay Now'} {formatAmount(cleanAmount)}
              </Text>
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
  contributorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FDF0F3', borderRadius: 12, padding: 12, marginBottom: 20 },
  contributorText: { fontSize: 14, fontWeight: '600', color: TEXT },
  amountBlock: { alignItems: 'center', marginBottom: 24 },
  youAreSending: { fontSize: 14, color: DARK_GREY, marginBottom: 6 },
  bigAmount: { fontSize: 34, fontWeight: '900', color: TEXT, letterSpacing: -0.5, marginBottom: 4 },
  toEvent: { fontSize: 14, color: DARK_GREY },
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
  timeoutBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#FDF0F3', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: WINE },
  timeoutTitle: { fontSize: 14, fontWeight: '700', color: WINE, marginBottom: 4 },
  timeoutSub: { fontSize: 12, color: DARK_GREY, lineHeight: 18 },
  securityNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: LIGHT_GREY, borderRadius: 14, padding: 14, marginBottom: 8 },
  shieldBubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFE4E9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  securityText: { fontSize: 13, color: DARK_GREY, flex: 1, lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: LIGHT_GREY, gap: 10 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FDF0F3', borderRadius: 10, padding: 10 },
  statusText: { fontSize: 13, color: WINE, fontWeight: '600', flex: 1 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: WINE, borderRadius: 14, paddingVertical: 14 },
  retryBtnText: { fontSize: 15, fontWeight: '700', color: WINE },
  payBtn: { backgroundColor: WINE, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: WINE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  payBtnLoading: { backgroundColor: '#A0354A' },
  payBtnText: { color: WHITE, fontSize: 17, fontWeight: '700' },
});