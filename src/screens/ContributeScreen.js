// src/screens/ContributeScreen.js

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, SafeAreaView, Image, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initiateContribution } from '../api';

const WINE       = '#E60012';
const WINE_LIGHT = '#FDF0F3';
const WHITE      = '#FFFFFF';
const BLACK      = '#1A1A1A';
const GRAY       = '#888888';
const BORDER     = '#E5E5E5';
const GREEN      = '#1A9E4A';

const quickAmounts = ['5,000', '10,000', '20,000', '50,000', '100,000'];

const paymentMethods = [
  { id: 'mtn',    label: 'MTN Mobile Money',      logo: require('../../assets/mtn.png'),    bg: '#FFC403' },
  { id: 'airtel', label: 'Airtel Money',          logo: require('../../assets/airtel.jpg'), bg: WHITE     },
  { id: 'visa',   label: 'Visa / Card',           logo: require('../../assets/Visa.png'),   bg: WHITE     },
];

export default function ContributeScreen({ navigation, route }) {
  const event = route?.params?.event;

  const [amount, setAmount]           = useState('10,000');
  const [selectedMethod, setMethod]   = useState(event?.owner_payment_method || 'mtn');
  const [name, setName]               = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [message, setMessage]         = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading]         = useState(false);

  const getCleanAmount = () => parseInt(amount.replace(/,/g, '')) || 0;

  // Platform fee 2%
  const platformFee = Math.round(getCleanAmount() * 0.02);
  const ownerReceives = getCleanAmount() - platformFee;

  const handleContinue = async () => {
    if (!isAnonymous && !name) {
      Alert.alert('Error', 'Please enter your name or choose anonymous');
      return;
    }
    if (!senderPhone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (getCleanAmount() < 1000) {
      Alert.alert('Error', 'Minimum contribution is RWF 1,000');
      return;
    }
    if (!event?.owner_phone) {
      Alert.alert('Error', 'This event has no receiver phone number set');
      return;
    }

    setLoading(true);
    try {
      const result = await initiateContribution({
        event_id: event?.id,
        contributor_name: isAnonymous ? 'Anonymous' : name,
        contributor_phone: senderPhone,
        amount: getCleanAmount(),
        payment_method: selectedMethod,
        message: message,
        is_anonymous: isAnonymous,
      });

      if (result.success) {
        navigation.navigate('PaymentConfirm', {
          amount,
          method: paymentMethods.find((m) => m.id === selectedMethod)?.label,
          contribution: result.contribution,
          event,
          senderPhone,
          receiverPhone: event?.owner_phone,
          platformFee,
          ownerReceives,
        });
      } else {
        Alert.alert('Error', result.message || 'Failed to initiate contribution');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contribute to Event</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Event card */}
        <View style={styles.eventCard}>
          <Image source={require('../../assets/couple.png')} style={styles.eventImage} resizeMode="cover" />
          <View style={styles.eventInfo}>
            <Text style={styles.eventName}>{event?.title || 'Event'}</Text>
            <Text style={styles.eventType}>{event?.type || ''}</Text>
            <View style={styles.eventDateRow}>
              <Ionicons name="calendar-outline" size={14} color={WINE} />
              <Text style={styles.eventDate}>{event?.date || ''}</Text>
            </View>
          </View>
        </View>

        {/* ── PAYMENT FLOW CARD ── */}
        <View style={styles.flowCard}>
          <Text style={styles.flowTitle}>💸 Payment Flow</Text>

          {/* Sender */}
          <View style={styles.flowRow}>
            <View style={styles.flowIcon}>
              <Ionicons name="person-outline" size={18} color={WINE} />
            </View>
            <View style={styles.flowInfo}>
              <Text style={styles.flowLabel}>From (You)</Text>
              <Text style={styles.flowValue}>{senderPhone || 'Your phone number'}</Text>
            </View>
          </View>

          <View style={styles.flowArrow}>
            <Ionicons name="arrow-down" size={16} color={GRAY} />
            <Text style={styles.flowFeeText}>Contriba fee: 2%</Text>
          </View>

          {/* Receiver */}
          <View style={styles.flowRow}>
            <View style={[styles.flowIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="person-circle-outline" size={18} color={GREEN} />
            </View>
            <View style={styles.flowInfo}>
              <Text style={styles.flowLabel}>To (Event Owner)</Text>
              <Text style={[styles.flowValue, { color: GREEN }]}>
                {event?.owner_phone || 'Not set'}
              </Text>
            </View>
            <View style={styles.methodBadge}>
              <Text style={styles.methodBadgeText}>
                {event?.owner_payment_method?.toUpperCase() || 'MTN'}
              </Text>
            </View>
          </View>
        </View>

        {/* Anonymous Toggle */}
        <View style={styles.anonymousCard}>
          <View style={styles.anonymousLeft}>
            <View style={styles.anonymousIconBox}>
              <Ionicons name={isAnonymous ? 'eye-off' : 'eye'} size={20} color={WINE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.anonymousTitle}>
                {isAnonymous ? 'Contributing Anonymously 🙈' : 'Contribute Publicly'}
              </Text>
              <Text style={styles.anonymousSub}>
                {isAnonymous ? 'Your name will be hidden from public' : 'Your name will be visible to others'}
              </Text>
            </View>
          </View>
          <Switch value={isAnonymous} onValueChange={setIsAnonymous} trackColor={{ false: BORDER, true: WINE }} thumbColor={WHITE} />
        </View>

        {/* Your Name */}
        {!isAnonymous && (
          <>
            <Text style={styles.label}>Your Name</Text>
            <TextInput style={styles.input} placeholder="Enter your full name" placeholderTextColor="#BBBBBB" value={name} onChangeText={setName} />
          </>
        )}

        {/* Sender Phone */}
        <Text style={styles.label}>Your Phone Number <Text style={styles.required}>*</Text></Text>
        <Text style={styles.labelSub}>Money will be deducted from this number</Text>
        <TextInput
          style={styles.input}
          placeholder="0781 234 567"
          placeholderTextColor="#BBBBBB"
          value={senderPhone}
          onChangeText={setSenderPhone}
          keyboardType="phone-pad"
        />

        {/* Amount input */}
        <Text style={styles.label}>Enter Amount (RWF)</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#BBBBBB"
        />

        {/* Quick amounts */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickAmounts}>
          {quickAmounts.map((a) => (
            <TouchableOpacity key={a} style={[styles.quickChip, amount === a && styles.quickChipActive]} onPress={() => setAmount(a)} activeOpacity={0.8}>
              <Text style={[styles.quickChipText, amount === a && styles.quickChipTextActive]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Fee breakdown */}
        {getCleanAmount() >= 1000 && (
          <View style={styles.feeCard}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>You pay</Text>
              <Text style={styles.feeValue}>RWF {getCleanAmount().toLocaleString()}</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Contriba fee (2%)</Text>
              <Text style={[styles.feeValue, { color: WINE }]}>- RWF {platformFee.toLocaleString()}</Text>
            </View>
            <View style={styles.feeDivider} />
            <View style={styles.feeRow}>
              <Text style={styles.feeLabelBold}>Owner receives</Text>
              <Text style={[styles.feeValueBold, { color: GREEN }]}>RWF {ownerReceives.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {/* Message */}
        <Text style={styles.label}>Message <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput style={styles.textarea} placeholder="Write a message to the couple..." placeholderTextColor="#BBBBBB" value={message} onChangeText={setMessage} multiline numberOfLines={3} textAlignVertical="top" />

        {/* Payment method */}
        <Text style={styles.label}>Payment Method</Text>
        {paymentMethods.map((method) => (
          <TouchableOpacity key={method.id} style={[styles.methodRow, selectedMethod === method.id && styles.methodRowActive]} onPress={() => setMethod(method.id)} activeOpacity={0.8}>
            <View style={[styles.logoBox, { backgroundColor: method.bg }]}>
              <Image source={method.logo} style={styles.logoImg} resizeMode="contain" />
            </View>
            <Text style={styles.methodLabel}>{method.label}</Text>
            <View style={[styles.radio, selectedMethod === method.id && styles.radioActive]}>
              {selectedMethod === method.id && <Ionicons name="checkmark" size={14} color={WHITE} />}
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Bottom */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.continueBtn, loading && { opacity: 0.7 }]}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <Text style={styles.continueBtnText}>
              {isAnonymous ? '🙈 Contribute Anonymously' : 'Continue'} → RWF {amount}
            </Text>
          )}
        </TouchableOpacity>
        <View style={styles.secureRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={WINE} />
          <Text style={styles.secureText}>Your payment is secure and encrypted</Text>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: WHITE },
  headerTitle: { fontSize: 18, fontWeight: '800', color: BLACK },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  eventCard: { flexDirection: 'row', backgroundColor: WINE_LIGHT, borderRadius: 16, marginBottom: 20, padding: 12, alignItems: 'center', gap: 14 },
  eventImage: { width: 80, height: 80, borderRadius: 12 },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 17, fontWeight: '800', color: BLACK, marginBottom: 2 },
  eventType: { fontSize: 14, color: GRAY, marginBottom: 6 },
  eventDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventDate: { fontSize: 13, color: WINE, fontWeight: '600' },
  flowCard: { backgroundColor: '#F8F8F8', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: BORDER },
  flowTitle: { fontSize: 14, fontWeight: '700', color: BLACK, marginBottom: 12 },
  flowRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: WINE_LIGHT, justifyContent: 'center', alignItems: 'center' },
  flowInfo: { flex: 1 },
  flowLabel: { fontSize: 11, color: GRAY, marginBottom: 2 },
  flowValue: { fontSize: 14, fontWeight: '700', color: BLACK },
  flowArrow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 18, paddingVertical: 6 },
  flowFeeText: { fontSize: 11, color: GRAY },
  methodBadge: { backgroundColor: WINE_LIGHT, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  methodBadgeText: { fontSize: 11, fontWeight: '700', color: WINE },
  anonymousCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: WINE_LIGHT, borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1.5, borderColor: WINE },
  anonymousLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  anonymousIconBox: { width: 38, height: 38, borderRadius: 19, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center' },
  anonymousTitle: { fontSize: 14, fontWeight: '700', color: BLACK, marginBottom: 2 },
  anonymousSub: { fontSize: 12, color: GRAY },
  label: { fontSize: 15, fontWeight: '700', color: BLACK, marginBottom: 6 },
  labelSub: { fontSize: 12, color: GRAY, marginBottom: 10 },
  optional: { fontSize: 13, fontWeight: '400', color: GRAY },
  required: { color: WINE },
  input: { borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, height: 54, paddingHorizontal: 16, fontSize: 15, color: BLACK, marginBottom: 20, backgroundColor: WHITE },
  amountInput: { borderWidth: 2, borderColor: WINE, borderRadius: 14, height: 64, paddingHorizontal: 16, fontSize: 28, fontWeight: '800', color: BLACK, marginBottom: 14, backgroundColor: WHITE },
  quickAmounts: { gap: 8, marginBottom: 20, paddingRight: 8 },
  quickChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE },
  quickChipActive: { borderColor: WINE, backgroundColor: WINE_LIGHT },
  quickChipText: { fontSize: 14, color: GRAY, fontWeight: '600' },
  quickChipTextActive: { color: WINE },
  feeCard: { backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: BORDER },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  feeLabel: { fontSize: 13, color: GRAY },
  feeValue: { fontSize: 13, fontWeight: '600', color: BLACK },
  feeDivider: { height: 1, backgroundColor: BORDER, marginVertical: 6 },
  feeLabelBold: { fontSize: 14, fontWeight: '700', color: BLACK },
  feeValueBold: { fontSize: 14, fontWeight: '800' },
  textarea: { borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, height: 80, paddingHorizontal: 16, paddingTop: 12, fontSize: 15, color: BLACK, marginBottom: 20, backgroundColor: WHITE },
  methodRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, padding: 14, marginBottom: 12, gap: 14, backgroundColor: WHITE },
  methodRowActive: { borderColor: WINE, backgroundColor: WINE_LIGHT },
  logoBox: { width: 72, height: 56, borderRadius: 10, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  logoImg: { width: 66, height: 50 },
  methodLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: BLACK },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: BORDER, justifyContent: 'center', alignItems: 'center' },
  radioActive: { backgroundColor: WINE, borderColor: WINE },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 30, paddingTop: 12, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: BORDER, gap: 10 },
  continueBtn: { backgroundColor: WINE, borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center', shadowColor: WINE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7 },
  continueBtnText: { color: WHITE, fontSize: 15, fontWeight: '700' },
  secureRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  secureText: { fontSize: 13, color: GRAY },
});