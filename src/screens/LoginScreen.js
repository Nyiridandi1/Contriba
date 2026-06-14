// src/screens/LoginScreen.js

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, SafeAreaView, Image, ActivityIndicator, Alert, Platform,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendOTP, saveToken } from '../api';

WebBrowser.maybeCompleteAuthSession();

const WINE       = '#7A001F';
const WHITE      = '#FFFFFF';
const BLACK      = '#1A1A1A';
const GRAY       = '#888888';
const BORDER     = '#E5E5E5';
const WINE_LIGHT = '#F9EEF1';

const BASE_URL = 'https://contriba-backend-production.up.railway.app';

export default function LoginScreen({ navigation }) {
  const [countryCode, setCountryCode] = useState('RW');
  const [callingCode, setCallingCode] = useState('250');
  const [showPicker, setShowPicker]   = useState(false);
  const [phone, setPhone]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest({
    androidClientId: '445164086766-tv733jo8ufmsk7u6q42k09ojfq790r4t.apps.googleusercontent.com',
    iosClientId: '445164086766-vsf1eab46e5oonfsqmdjcg3nic2g7l63.apps.googleusercontent.com',
    webClientId: '445164086766-tv733jo8ufmsk7u6q42k09ojfq790r4t.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.authentication.accessToken);
    }
  }, [response]);

  const handleGoogleResponse = async (accessToken) => {
    setGoogleLoading(true);
    try {
      // Get user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const userInfo = await userInfoResponse.json();

      // Send to our backend
      const result = await fetch(`${BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userInfo.email,
          name: userInfo.name,
          photo: userInfo.picture,
          google_id: userInfo.id,
        }),
      });

      const data = await result.json();

      if (data.success) {
        await saveToken(data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        navigation.replace('Home');
      } else {
        Alert.alert('Error', data.message || 'Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'Google sign in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>

        {/* Logo */}
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />

        {/* Title */}
        <Text style={styles.title}>Welcome back 👋</Text>
        <Text style={styles.subtitle}>Login or create an account{'\n'}to continue</Text>

        {/* Phone number label */}
        <Text style={styles.label}>Phone number</Text>

        {/* Phone input row */}
        <View style={styles.phoneRow}>
          <TouchableOpacity style={styles.countryBox} onPress={() => setShowPicker(true)}>
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
          disabled={loading || phone.length < 8}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <>
              <Text style={styles.continueBtnText}>Continue with Phone</Text>
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
        <TouchableOpacity
          style={styles.socialBtn}
          activeOpacity={0.8}
          onPress={() => promptAsync()}
          disabled={googleLoading || !request}
        >
          {googleLoading ? (
            <ActivityIndicator color={BLACK} size="small" />
          ) : (
            <>
              <Image source={require('../../assets/google.png')} style={styles.socialIcon} resizeMode="contain" />
              <Text style={styles.socialBtnText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Apple button - iOS only */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
            <Image source={require('../../assets/apple.png')} style={styles.socialIcon} resizeMode="contain" />
            <Text style={styles.socialBtnText}>Continue with Apple</Text>
          </TouchableOpacity>
        )}

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
          <Text style={styles.bottomLink}>  Sign Up →</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  backBtn: { marginBottom: 16 },
  logo: { width: 80, height: 80, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: BLACK, marginBottom: 8 },
  subtitle: { fontSize: 15, color: GRAY, lineHeight: 24, marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '700', color: BLACK, marginBottom: 10 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, height: 58, paddingHorizontal: 14, marginBottom: 16, backgroundColor: WHITE },
  countryBox: { flexDirection: 'row', alignItems: 'center' },
  callingCode: { fontSize: 15, fontWeight: '600', color: BLACK, marginLeft: 4 },
  dropArrow: { fontSize: 12, color: GRAY },
  phoneDivider: { width: 1, height: 28, backgroundColor: BORDER, marginHorizontal: 12 },
  phoneInput: { flex: 1, fontSize: 16, color: BLACK },
  continueBtn: { backgroundColor: WINE, borderRadius: 14, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 20, shadowColor: WINE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7 },
  continueBtnDisabled: { opacity: 0.45 },
  continueBtnText: { color: WHITE, fontSize: 17, fontWeight: '700', letterSpacing: 0.4 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: BORDER },
  orText: { fontSize: 14, color: GRAY },
  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, height: 56, marginBottom: 12, gap: 14, backgroundColor: WHITE },
  socialIcon: { width: 32, height: 32 },
  socialBtnText: { fontSize: 15, fontWeight: '600', color: BLACK },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 6 },
  shieldIcon: { fontSize: 18 },
  termsText: { flex: 1, fontSize: 13, color: GRAY, lineHeight: 20 },
  termsLink: { color: WINE, fontWeight: '600' },
  bottomBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 24, backgroundColor: WINE_LIGHT, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  bottomText: { fontSize: 14, color: BLACK, fontWeight: '500' },
  bottomLink: { fontSize: 14, color: WINE, fontWeight: '700' },
});