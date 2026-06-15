// src/screens/LoginScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, SafeAreaView, Image, ActivityIndicator, Alert, Platform, ScrollView,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session/providers/google';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveToken } from '../api';
import { useTheme } from '../context/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

const WINE       = '#E60012';
const WHITE      = '#FFFFFF';
const WINE_LIGHT = '#F9EEF1';
const BASE_URL   = 'https://contriba-backend-production.up.railway.app';

if (Platform.OS === 'android') {
  GoogleSignin.configure({
    webClientId: '445164086766-tv733jo8ufmsk7u6q42k09ojfq790r4t.apps.googleusercontent.com',
    androidClientId: '445164086766-tv733jo8ufmsk7u6q42k09ojfq790r4t.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
  });
}

export default function LoginScreen({ navigation }) {
  const { darkMode, language, colors } = useTheme();
  const { BG, CARD, TEXT, SUB, BORDER } = colors;

  const [countryCode, setCountryCode]     = useState('RW');
  const [callingCode, setCallingCode]     = useState('250');
  const [showPicker, setShowPicker]       = useState(false);
  const [phone, setPhone]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpInfo, setOtpInfo]             = useState(null);

  const [request, response, promptAsync] = AuthSession.useAuthRequest({
    androidClientId: '445164086766-tv733jo8ufmsk7u6q42k09ojfq790r4t.apps.googleusercontent.com',
    iosClientId: '445164086766-vsf1eab46e5oonfsqmdjcg3nic2g7l63.apps.googleusercontent.com',
    webClientId: '445164086766-tv733jo8ufmsk7u6q42k09ojfq790r4t.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.authentication.accessToken);
    }
  }, [response]);

  const handleGoogleResponse = async (accessToken) => {
    setGoogleLoading(true);
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await userInfoResponse.json();
      await sendGoogleToBackend(userInfo.email, userInfo.name, userInfo.picture, userInfo.id);
    } catch (error) {
      Alert.alert('Error', 'Google sign in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAndroidGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const { user } = userInfo;
      await sendGoogleToBackend(user.email, user.name, user.photo, user.id);
    } catch (error) {
      Alert.alert('Error', 'Google sign in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const sendGoogleToBackend = async (email, name, photo, google_id) => {
    const result = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, photo, google_id }),
    });
    const data = await result.json();
    if (data.success) {
      await saveToken(data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      navigation.replace('Home');
    } else {
      Alert.alert('Error', data.message || 'Google login failed');
    }
  };

  const handleGoogleLogin = () => {
    if (Platform.OS === 'android') {
      handleAndroidGoogleLogin();
    } else {
      promptAsync();
    }
  };

  const handleContinue = async () => {
    if (phone.length < 8) return;
    const fullPhone = `+${callingCode}${phone}`;
    setLoading(true);
    setOtpInfo(null);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, is_login: true }),
      });
      const result = await response.json();
      if (result.success) {
        if (result.email_sent) {
          setOtpInfo(`OTP sent to ${result.email_hint || 'your email'} 📧`);
        }
        setTimeout(() => navigation.navigate('OTP', { phone: fullPhone }), 1500);
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
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={BG} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>

        {/* LOGO */}
        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />

        <Text style={[styles.title, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Murakaza neza 👋' : 'Welcome back 👋'}
        </Text>
        <Text style={[styles.subtitle, { color: SUB }]}>
          {language === 'Kinyarwanda'
            ? 'Injiza numero ya telefoni yawe'
            : "Enter your phone number and we'll\nsend your OTP to your registered email!"}
        </Text>

        <Text style={[styles.label, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Numero ya Telefoni' : 'Phone number'}
        </Text>
        <View style={[styles.phoneRow, { borderColor: BORDER, backgroundColor: CARD }]}>
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
            <Text style={[styles.callingCode, { color: TEXT }]}>+{callingCode}</Text>
            <Text style={[styles.dropArrow, { color: SUB }]}> ▾</Text>
          </TouchableOpacity>
          <View style={[styles.phoneDivider, { backgroundColor: BORDER }]} />
          <TextInput
            style={[styles.phoneInput, { color: TEXT }]}
            placeholder="781 234 567"
            placeholderTextColor="#BBBBBB"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={12}
          />
        </View>

        {otpInfo && (
          <View style={styles.otpInfoBox}>
            <Ionicons name="mail-outline" size={16} color={WINE} />
            <Text style={styles.otpInfoText}>{otpInfo}</Text>
          </View>
        )}

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
              <Text style={styles.continueBtnText}>
                {language === 'Kinyarwanda' ? 'Komeza na Telefoni' : 'Continue with Phone'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={WHITE} />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.orRow}>
          <View style={[styles.orLine, { backgroundColor: BORDER }]} />
          <Text style={[styles.orText, { color: SUB }]}>
            {language === 'Kinyarwanda' ? 'cyangwa' : 'or'}
          </Text>
          <View style={[styles.orLine, { backgroundColor: BORDER }]} />
        </View>

        <TouchableOpacity
          style={[styles.socialBtn, { borderColor: BORDER, backgroundColor: CARD }]}
          activeOpacity={0.8}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color={TEXT} size="small" />
          ) : (
            <>
              <Image source={require('../../assets/google.png')} style={styles.socialIcon} resizeMode="contain" />
              <Text style={[styles.socialBtnText, { color: TEXT }]}>
                {language === 'Kinyarwanda' ? 'Komeza na Google' : 'Continue with Google'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity style={[styles.socialBtn, { borderColor: BORDER, backgroundColor: CARD }]} activeOpacity={0.8}>
            <Image source={require('../../assets/apple.png')} style={styles.socialIcon} resizeMode="contain" />
            <Text style={[styles.socialBtnText, { color: TEXT }]}>
              {language === 'Kinyarwanda' ? 'Komeza na Apple' : 'Continue with Apple'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.termsRow}>
          <Text style={styles.shieldIcon}>🛡️</Text>
          <Text style={[styles.termsText, { color: SUB }]}>
            {language === 'Kinyarwanda' ? 'Ukomeza, wemeye ' : 'By continuing, you agree to our '}
            <Text style={styles.termsLink}>
              {language === 'Kinyarwanda' ? 'Amategeko' : 'Terms & Conditions'}
            </Text>
            {language === 'Kinyarwanda' ? ' na ' : ' and '}
            <Text style={styles.termsLink}>
              {language === 'Kinyarwanda' ? 'Politiki y\'Ibanga' : 'Privacy Policy'}
            </Text>
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={[styles.bottomText, { color: TEXT }]}>
            {language === 'Kinyarwanda' ? 'Nta konti?' : "Don't have an account?"}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.bottomLink}>
              {language === 'Kinyarwanda' ? '  Iyandikishe →' : '  Sign Up →'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  logo: { width: 120, height: 120, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 24, marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, height: 58, paddingHorizontal: 14, marginBottom: 16 },
  countryBox: { flexDirection: 'row', alignItems: 'center' },
  callingCode: { fontSize: 15, fontWeight: '600', marginLeft: 4 },
  dropArrow: { fontSize: 12 },
  phoneDivider: { width: 1, height: 28, marginHorizontal: 12 },
  phoneInput: { flex: 1, fontSize: 16 },
  otpInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: WINE_LIGHT, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: WINE },
  otpInfoText: { fontSize: 13, color: WINE, fontWeight: '600', flex: 1 },
  continueBtn: { backgroundColor: WINE, borderRadius: 14, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 20, shadowColor: WINE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7 },
  continueBtnDisabled: { opacity: 0.45 },
  continueBtnText: { color: WHITE, fontSize: 17, fontWeight: '700', letterSpacing: 0.4 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 14 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 14, height: 56, marginBottom: 12, gap: 14 },
  socialIcon: { width: 32, height: 32 },
  socialBtnText: { fontSize: 15, fontWeight: '600' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 6, marginBottom: 20 },
  shieldIcon: { fontSize: 18 },
  termsText: { flex: 1, fontSize: 13, lineHeight: 20 },
  termsLink: { color: WINE, fontWeight: '600' },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  bottomText: { fontSize: 14, fontWeight: '500' },
  bottomLink: { fontSize: 14, color: WINE, fontWeight: '700' },
});