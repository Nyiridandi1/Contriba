// src/screens/LoginScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { Ionicons } from '@expo/vector-icons';
import { sendOTP } from '../api';

// ─── COLORS ─────────────────────────────────────────────────────────────────
const WINE       = '#7A001F';
const WHITE      = '#FFFFFF';
const BLACK      = '#1A1A1A';
const GRAY       = '#888888';
const BORDER     = '#E5E5E5';
const WINE_LIGHT = '#F9EEF1';

export default function LoginScreen({ navigation }) {
  const [countryCode, setCountryCode] = useState('RW');
  const [callingCode, setCallingCode] = useState('250');
  const [showPicker, setShowPicker]   = useState(false);
  const [phone, setPhone]             = useState('');
  const [loading, setLoading]         = useState(false);

  const handleContinue = async () => {
    if (phone.length < 8) return;

    const fullPhone = `+${callingCode}${phone}`;
    setLoading(true);

    try {
      const result = await sendOTP(fullPhone);

      if (result.success) {
        navigation.navigate('OTP', { phone: fullPhone });
      } else {
        Alert.alert('Error', result.message || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      <View style={styles.content}>

        {/* Back arrow */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Welcome back 👋</Text>
        <Text style={styles.subtitle}>Login or create an account{'\n'}to continue</Text>

        {/* Phone number label */}
        <Text style={styles.label}>Phone number</Text>

        {/* Phone input row */}
        <View style={styles.phoneRow}>
          <TouchableOpacity
            style={styles.countryBox}
            onPress={() => setShowPicker(true)}
          >
            <CountryPicker
              countryCode={countryCode}
              withFlag
              withCallingCode
              withFilter
              withAlphaFilter
              onSelect={(country) => {
                setCountryCode(country.cca2);
                setCallingCode(country.callingCode[0]);
              }}
              visible={showPicker}
              onClose={() => setShowPicker(false)}
            />
            <Text style={styles.callingCode}>+{callingCode}</Text>
            <Text style={styles.dropArrow}> ▾</Text>
          </TouchableOpacity>

          <View style={styles.phoneDivider} />

          <TextInput
            style={styles.phoneInput}
            placeholder="781 234 567"
            placeholderTextColor="#BBBBBB"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={12}
          />
        </View>

        {/* Continue button */}
        <TouchableOpacity
          style={[styles.continueBtn, (phone.length < 8 || loading) && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <>
              <Text style={styles.continueBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={WHITE} />
            </>
          )}
        </TouchableOpacity>

        {/* OR divider */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        {/* Google button */}
        <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
          <Image
            source={require('../../assets/google.png')}
            style={styles.socialIcon}
            resizeMode="contain"
          />
          <Text style={styles.socialBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Apple button */}
        <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
          <Image
            source={require('../../assets/apple.png')}
            style={styles.socialIcon}
            resizeMode="contain"
          />
          <Text style={styles.socialBtnText}>Continue with Apple</Text>
        </TouchableOpacity>

        {/* Terms */}
        <View style={styles.termsRow}>
          <Text style={styles.shieldIcon}>🛡️</Text>
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms & Conditions</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>

      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.bottomLink}>  Create Account →</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  backBtn: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: BLACK, marginBottom: 8 },
  subtitle: { fontSize: 15, color: GRAY, lineHeight: 24, marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '700', color: BLACK, marginBottom: 10 },
  phoneRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderColor: '#E5E5E5', borderRadius: 14, height: 58,
    paddingHorizontal: 14, marginBottom: 16, backgroundColor: WHITE,
  },
  countryBox: { flexDirection: 'row', alignItems: 'center' },
  callingCode: { fontSize: 15, fontWeight: '600', color: BLACK, marginLeft: 4 },
  dropArrow: { fontSize: 12, color: GRAY },
  phoneDivider: { width: 1, height: 28, backgroundColor: '#E5E5E5', marginHorizontal: 12 },
  phoneInput: { flex: 1, fontSize: 16, color: BLACK },
  continueBtn: {
    backgroundColor: WINE, borderRadius: 14, height: 56,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 10, marginBottom: 20, shadowColor: WINE,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3,
    shadowRadius: 12, elevation: 7,
  },
  continueBtnDisabled: { opacity: 0.45 },
  continueBtnText: { color: WHITE, fontSize: 17, fontWeight: '700', letterSpacing: 0.4 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: '#E5E5E5' },
  orText: { fontSize: 14, color: GRAY },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E5E5E5', borderRadius: 14, height: 56,
    marginBottom: 12, gap: 14, backgroundColor: WHITE,
  },
  socialIcon: { width: 32, height: 32 },
  socialBtnText: { fontSize: 15, fontWeight: '600', color: BLACK },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 6 },
  shieldIcon: { fontSize: 18 },
  termsText: { flex: 1, fontSize: 13, color: GRAY, lineHeight: 20 },
  termsLink: { color: WINE, fontWeight: '600' },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 20, paddingHorizontal: 24, backgroundColor: WINE_LIGHT,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 10,
  },
  bottomText: { fontSize: 14, color: BLACK, fontWeight: '500' },
  bottomLink: { fontSize: 14, color: WINE, fontWeight: '700' },
});