// src/screens/OTPScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, SafeAreaView, Dimensions, Alert, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendOTP, saveToken } from '../api';

const { width } = Dimensions.get('window');

const WINE  = '#E60012';
const WHITE = '#FFFFFF';
const BLACK = '#1A1A1A';
const GRAY  = '#888888';
const LIGHT = '#F5F5F5';

const BASE_URL = 'https://contriba-backend-production.up.railway.app';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

export default function OTPScreen({ navigation, route }) {
  const phone     = route?.params?.phone || '';
  const userName  = route?.params?.name  || null;
  const userEmail = route?.params?.email || null;

  const [code, setCode]               = useState(['', '', '', '', '', '']);
  const [activeIndex, setActiveIndex] = useState(0);
  const [timer, setTimer]             = useState(30);
  const [canResend, setCanResend]     = useState(false);
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    if (timer === 0) { setCanResend(true); return; }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (t) => {
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = (t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleVerify = async (otpCode) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otp: otpCode,
          name: userName,
          email: userEmail,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await saveToken(result.token);
        const userData = {
          ...result.user,
          name: result.user.name || userName,
          email: result.user.email || userEmail,
        };
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        navigation.replace('Home');
      } else {
        Alert.alert('Invalid OTP', result.message || 'Please try again');
        setCode(['', '', '', '', '', '']);
        setActiveIndex(0);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (key) => {
    if (loading) return;

    if (key === '⌫') {
      const newCode = [...code];
      if (activeIndex > 0) {
        newCode[activeIndex - 1] = '';
        setCode(newCode);
        setActiveIndex(activeIndex - 1);
      } else if (code[0] !== '') {
        newCode[0] = '';
        setCode(newCode);
      }
      return;
    }

    if (key === '') return;

    if (activeIndex < 6) {
      const newCode = [...code];
      newCode[activeIndex] = key;
      setCode(newCode);
      const next = activeIndex + 1;
      setActiveIndex(next);

      if (next === 6) {
        const otpString = [...newCode].join('');
        setTimeout(() => handleVerify(otpString), 300);
      }
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCode(['', '', '', '', '', '']);
    setActiveIndex(0);
    setTimer(30);
    setCanResend(false);

    const result = await sendOTP(phone);
    if (!result.success) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={WINE} />

      {/* ✅ WINE RED LOGO BANNER */}
      <View style={styles.logoBanner}>
        <TouchableOpacity style={styles.backBtnWhite} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={styles.logoCenter}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.logoTitle}>Contriba</Text>
            <Text style={styles.logoSub}>Contribute Easily. Smart & Secure.</Text>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>

        <Text style={styles.title}>Verify your number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phoneText}>{phone}</Text>
        </Text>

        {userName && (
          <Text style={styles.welcomeText}>Welcome, {userName}! 👋</Text>
        )}

        {/* OTP Boxes */}
        <View style={styles.otpRow}>
          {code.map((digit, i) => (
            <View
              key={i}
              style={[
                styles.otpBox,
                i === activeIndex && styles.otpBoxActive,
                digit !== '' && styles.otpBoxFilled,
              ]}
            >
              <Text style={styles.otpDigit}>{digit}</Text>
            </View>
          ))}
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={WINE} size="small" />
            <Text style={styles.loadingText}>Verifying...</Text>
          </View>
        )}

        {!loading && (
          <TouchableOpacity onPress={handleResend} disabled={!canResend}>
            <Text style={styles.resendText}>
              {canResend ? (
                <Text style={styles.resendLink}>Resend code</Text>
              ) : (
                <>Resend code in <Text style={styles.timerText}>{formatTime(timer)}</Text></>
              )}
            </Text>
          </TouchableOpacity>
        )}

      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {KEYS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyRow}>
            {row.map((key, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                style={[styles.key, key === '' && styles.keyEmpty]}
                onPress={() => handleKey(key)}
                activeOpacity={key === '' ? 1 : 0.6}
                disabled={key === '' || loading}
              >
                <Text style={[styles.keyText, key === '⌫' && styles.keyBackspaceText]}>
                  {key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

    </SafeAreaView>
  );
}

const BOX_SIZE = (width - 48 - 40) / 6;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },

  // ✅ Logo Banner
  logoBanner: { backgroundColor: WINE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtnWhite: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  logoCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImg: { width: 40, height: 40, borderRadius: 10 },
  logoTitle: { fontSize: 17, fontWeight: '800', color: WHITE },
  logoSub: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 1 },

  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 28, fontWeight: '800', color: BLACK, marginBottom: 12 },
  subtitle: { fontSize: 15, color: GRAY, lineHeight: 24, marginBottom: 12 },
  phoneText: { color: BLACK, fontWeight: '700' },
  welcomeText: { fontSize: 16, fontWeight: '700', color: WINE, marginBottom: 24 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, gap: 8 },
  otpBox: { width: BOX_SIZE, height: BOX_SIZE + 8, borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: WHITE },
  otpBoxActive: { borderColor: WINE, borderWidth: 2 },
  otpBoxFilled: { borderColor: '#CCCCCC', backgroundColor: '#FAFAFA' },
  otpDigit: { fontSize: 22, fontWeight: '700', color: BLACK },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  loadingText: { fontSize: 14, color: WINE, fontWeight: '600' },
  resendText: { fontSize: 14, color: GRAY, textAlign: 'center' },
  resendLink: { color: WINE, fontWeight: '700' },
  timerText: { color: WINE, fontWeight: '700' },
  keypad: { backgroundColor: LIGHT, paddingTop: 12, paddingBottom: 8, paddingHorizontal: 8 },
  keyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  key: { flex: 1, marginHorizontal: 4, height: 64, backgroundColor: WHITE, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  keyEmpty: { backgroundColor: 'transparent', elevation: 0 },
  keyText: { fontSize: 24, fontWeight: '500', color: BLACK },
  keyBackspaceText: { fontSize: 20, color: WINE },
});