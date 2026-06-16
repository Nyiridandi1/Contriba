// src/screens/RegisterScreen.js

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, SafeAreaView, Image, ActivityIndicator, Alert,
  ScrollView, Platform,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendOTP, saveToken } from '../api';
import { useTheme } from '../context/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

const WINE  = '#E60012';
const WHITE = '#FFFFFF';
const BASE_URL = 'https://contriba-backend-production.up.railway.app';

export default function RegisterScreen({ navigation }) {
  const { darkMode, language, colors } = useTheme();
  const { BG, CARD, TEXT, SUB, BORDER } = colors;

  const [name, setName]               = useState('');
  const [countryCode, setCountryCode] = useState('RW');
  const [callingCode, setCallingCode] = useState('250');
  const [showPicker, setShowPicker]   = useState(false);
  const [phone, setPhone]             = useState('');
  const [email, setEmail]             = useState('');
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
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const userInfo = await userInfoResponse.json();
      const result = await fetch(`${BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userInfo.email, name: userInfo.name,
          photo: userInfo.picture, google_id: userInfo.id,
        }),
      });
      const data = await result.json();
      if (data.success) {
        await saveToken(data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        navigation.replace('Home');
      } else {
        Alert.alert('Error', data.message || 'Google signup failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Google sign up failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!name) { Alert.alert('Error', language === 'Kinyarwanda' ? 'Injiza amazina yawe' : 'Please enter your full name'); return; }
    if (phone.length < 8) { Alert.alert('Error', language === 'Kinyarwanda' ? 'Injiza numero ya telefoni' : 'Please enter a valid phone number'); return; }
    const fullPhone = `+${callingCode}${phone}`;
    setLoading(true);
    try {
      const result = await sendOTP(fullPhone, email, name);
      if (result.success) {
        navigation.navigate('OTP', { phone: fullPhone, name, email });
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

        {/* Back arrow */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>

        {/* ✅ Updated logo */}
        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />

        {/* Title */}
        <Text style={[styles.title, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Fungura Konti 🎉' : 'Create Account 🎉'}
        </Text>
        <Text style={[styles.subtitle, { color: SUB }]}>
          {language === 'Kinyarwanda'
            ? 'Injira muri Contriba ugatange inkunga\nku birori ukunda!'
            : "Join Contriba and start contributing\nto events you love!"}
        </Text>

        {/* Full Name */}
        <Text style={[styles.label, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Amazina Yose' : 'Full Name'} <Text style={styles.required}>*</Text>
        </Text>
        <View style={[styles.inputRow, { borderColor: BORDER, backgroundColor: CARD }]}>
          <Ionicons name="person-outline" size={20} color={SUB} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: TEXT }]}
            placeholder={language === 'Kinyarwanda' ? 'Injiza amazina yawe' : 'Enter your full name'}
            placeholderTextColor="#BBBBBB"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Phone Number */}
        <Text style={[styles.label, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Numero ya Telefoni' : 'Phone Number'} <Text style={styles.required}>*</Text>
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

        {/* Email */}
        <Text style={[styles.label, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Imeli' : 'Email'}{' '}
          <Text style={styles.emailRequired}>
            * {language === 'Kinyarwanda' ? 'OTP zoherezwa hano' : 'OTP will be sent here'}
          </Text>
        </Text>
        <View style={[styles.inputRow, { borderColor: BORDER, backgroundColor: CARD }]}>
          <Ionicons name="mail-outline" size={20} color={SUB} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: TEXT }]}
            placeholder="your@email.com"
            placeholderTextColor="#BBBBBB"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Continue button */}
        <TouchableOpacity
          style={[styles.continueBtn, (!name || phone.length < 8 || loading) && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={loading || !name || phone.length < 8}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <>
              <Text style={styles.continueBtnText}>
                {language === 'Kinyarwanda' ? 'Fungura Konti' : 'Create Account'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={WHITE} />
            </>
          )}
        </TouchableOpacity>

        {/* OR divider */}
        <View style={styles.orRow}>
          <View style={[styles.orLine, { backgroundColor: BORDER }]} />
          <Text style={[styles.orText, { color: SUB }]}>
            {language === 'Kinyarwanda' ? 'cyangwa' : 'or sign up with'}
          </Text>
          <View style={[styles.orLine, { backgroundColor: BORDER }]} />
        </View>

        {/* Google button */}
        <TouchableOpacity
          style={[styles.socialBtn, { borderColor: BORDER, backgroundColor: CARD }]}
          activeOpacity={0.8}
          onPress={() => promptAsync()}
          disabled={googleLoading || !request}
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

        {/* Apple button - iOS only */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity style={[styles.socialBtn, { borderColor: BORDER, backgroundColor: CARD }]} activeOpacity={0.8}>
            <Image source={require('../../assets/apple.png')} style={styles.socialIcon} resizeMode="contain" />
            <Text style={[styles.socialBtnText, { color: TEXT }]}>
              {language === 'Kinyarwanda' ? 'Komeza na Apple' : 'Continue with Apple'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Terms */}
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

        {/* Already have account */}
        <View style={styles.bottomRow}>
          <Text style={[styles.bottomText, { color: TEXT }]}>
            {language === 'Kinyarwanda' ? 'Usanzwe ufite konti?' : 'Already have an account?'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.bottomLink}>
              {language === 'Kinyarwanda' ? '  Injira →' : '  Login →'}
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
  logo: { width: 100, height: 100, marginBottom: 16, borderRadius: 22 }, // ✅ Updated
  title: { fontSize: 30, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 24, marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  required: { color: WINE },
  emailRequired: { fontSize: 12, fontWeight: '400', color: WINE },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, height: 58, paddingHorizontal: 14, marginBottom: 20 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, height: 58, paddingHorizontal: 14, marginBottom: 20 },
  countryBox: { flexDirection: 'row', alignItems: 'center' },
  callingCode: { fontSize: 15, fontWeight: '600', marginLeft: 4 },
  dropArrow: { fontSize: 12 },
  phoneDivider: { width: 1, height: 28, marginHorizontal: 12 },
  phoneInput: { flex: 1, fontSize: 16 },
  continueBtn: { backgroundColor: WINE, borderRadius: 14, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 20, shadowColor: WINE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7 },
  continueBtnDisabled: { opacity: 0.45 },
  continueBtnText: { color: WHITE, fontSize: 17, fontWeight: '700', letterSpacing: 0.4 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 13 },
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