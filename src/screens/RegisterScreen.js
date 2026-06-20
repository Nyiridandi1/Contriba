// src/screens/RegisterScreen.js

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, SafeAreaView, Image, ActivityIndicator, Alert,
  ScrollView, Platform,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerWithPin, saveToken } from '../api';
import { useTheme } from '../context/ThemeContext';

const WINE  = '#E60012';
const WHITE = '#FFFFFF';
const WINE_LIGHT = '#FDF0F3';

export default function RegisterScreen({ navigation }) {
  const { darkMode, language, colors } = useTheme();
  const { BG, CARD, TEXT, SUB, BORDER } = colors;

  const [name, setName]               = useState('');
  const [countryCode, setCountryCode] = useState('RW');
  const [callingCode, setCallingCode] = useState('250');
  const [showPicker, setShowPicker]   = useState(false);
  const [phone, setPhone]             = useState('');
  const [pin, setPin]                 = useState('');
  const [confirmPin, setConfirmPin]   = useState('');
  const [showPin, setShowPin]         = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [loading, setLoading]         = useState(false);

  const handleRegister = async () => {
    if (!name) {
      Alert.alert('Error', language === 'Kinyarwanda' ? 'Injiza amazina yawe' : 'Please enter your full name');
      return;
    }
    if (phone.length < 8) {
      Alert.alert('Error', language === 'Kinyarwanda' ? 'Injiza numero ya telefoni' : 'Please enter a valid phone number');
      return;
    }
    if (pin.length < 4) {
      Alert.alert('Error', language === 'Kinyarwanda' ? 'PIN igomba kuba imibare 4' : 'PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Error', language === 'Kinyarwanda' ? 'PIN ntizihura!' : 'PINs do not match!');
      return;
    }

    const fullPhone = `+${callingCode}${phone}`;
    setLoading(true);
    try {
      const result = await registerWithPin(name, fullPhone, pin);
      if (result.success) {
        await saveToken(result.token);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        navigation.replace('Home');
      } else {
        Alert.alert('Error', result.message || 'Failed to create account');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !name || phone.length < 8 || pin.length < 4 || confirmPin.length < 4 || loading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={BG} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Back arrow */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>

        {/* Logo */}
        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />

        {/* Title */}
        <Text style={[styles.title, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Fungura Konti' : 'Create Account'}
        </Text>
        <Text style={[styles.subtitle, { color: SUB }]}>
          {language === 'Kinyarwanda'
            ? 'Injira muri Contriba ugatange inkunga\nku birori ukunda!'
            : 'Join Contriba and start creating\nevents today!'}
        </Text>

        {/* Full Name */}
        <Text style={[styles.label, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Amazina Yose' : 'Full Name'}{' '}
          <Text style={styles.required}>*</Text>
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
          {language === 'Kinyarwanda' ? 'Numero ya Telefoni' : 'Phone Number'}{' '}
          <Text style={styles.required}>*</Text>
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

        {/* PIN Info Banner */}
        <View style={[styles.pinBanner, { backgroundColor: darkMode ? '#1A0A0E' : WINE_LIGHT }]}>
          <Ionicons name="lock-closed-outline" size={16} color={WINE} />
          <Text style={styles.pinBannerText}>
            {language === 'Kinyarwanda'
              ? 'Kora PIN yo kwinjira — nk\'iyi ya ATM!'
              : 'Create a PIN to login — just like your ATM PIN!'}
          </Text>
        </View>

        {/* Create PIN */}
        <Text style={[styles.label, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Kora PIN (imibare 4)' : 'Create PIN (4 digits)'}{' '}
          <Text style={styles.required}>*</Text>
        </Text>
        <View style={[styles.inputRow, { borderColor: BORDER, backgroundColor: CARD }]}>
          <Ionicons name="keypad-outline" size={20} color={SUB} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: TEXT }]}
            placeholder="● ● ● ●"
            placeholderTextColor="#BBBBBB"
            value={pin}
            onChangeText={setPin}
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry={!showPin}
          />
          <TouchableOpacity onPress={() => setShowPin(!showPin)}>
            <Ionicons name={showPin ? 'eye-outline' : 'eye-off-outline'} size={20} color={SUB} />
          </TouchableOpacity>
        </View>

        {/* Confirm PIN */}
        <Text style={[styles.label, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Emeza PIN' : 'Confirm PIN'}{' '}
          <Text style={styles.required}>*</Text>
        </Text>
        <View style={[styles.inputRow, { borderColor: confirmPin && confirmPin !== pin ? '#FF3B30' : BORDER, backgroundColor: CARD }]}>
          <Ionicons name="keypad-outline" size={20} color={SUB} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: TEXT }]}
            placeholder="● ● ● ●"
            placeholderTextColor="#BBBBBB"
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry={!showConfirmPin}
          />
          <TouchableOpacity onPress={() => setShowConfirmPin(!showConfirmPin)}>
            <Ionicons name={showConfirmPin ? 'eye-outline' : 'eye-off-outline'} size={20} color={SUB} />
          </TouchableOpacity>
        </View>

        {/* PIN mismatch warning */}
        {confirmPin.length > 0 && confirmPin !== pin && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={14} color="#FF3B30" />
            <Text style={styles.errorText}>
              {language === 'Kinyarwanda' ? 'PIN ntizihura!' : 'PINs do not match!'}
            </Text>
          </View>
        )}

        {/* PIN match success */}
        {confirmPin.length > 0 && confirmPin === pin && (
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#1A9E4A" />
            <Text style={styles.successText}>
              {language === 'Kinyarwanda' ? 'PIN zihura!' : 'PINs match!'}
            </Text>
          </View>
        )}

        {/* Create Account Button */}
        <TouchableOpacity
          style={[styles.continueBtn, isDisabled && styles.continueBtnDisabled]}
          onPress={handleRegister}
          disabled={isDisabled}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={20} color={WHITE} />
              <Text style={styles.continueBtnText}>
                {language === 'Kinyarwanda' ? 'Fungura Konti' : 'Create Account'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Terms */}
        <View style={styles.termsRow}>
          <View style={styles.shieldIconBox}>
            <Ionicons name="shield-checkmark-outline" size={16} color={WINE} />
          </View>
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
              {language === 'Kinyarwanda' ? '  Injira' : '  Login'}
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
  logo: { width: 100, height: 100, marginBottom: 16, borderRadius: 22 },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 24, marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  required: { color: WINE },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, height: 58, paddingHorizontal: 14, marginBottom: 20 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, height: 58, paddingHorizontal: 14, marginBottom: 20 },
  countryBox: { flexDirection: 'row', alignItems: 'center' },
  callingCode: { fontSize: 15, fontWeight: '600', marginLeft: 4 },
  dropArrow: { fontSize: 12 },
  phoneDivider: { width: 1, height: 28, marginHorizontal: 12 },
  phoneInput: { flex: 1, fontSize: 16 },

  // PIN Banner
  pinBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, marginBottom: 20 },
  pinBannerText: { fontSize: 13, color: WINE, fontWeight: '600', flex: 1 },

  // Error / Success
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -14, marginBottom: 14 },
  errorText: { fontSize: 12, color: '#FF3B30', fontWeight: '600' },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -14, marginBottom: 14 },
  successText: { fontSize: 12, color: '#1A9E4A', fontWeight: '600' },

  continueBtn: { backgroundColor: WINE, borderRadius: 14, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 20, shadowColor: WINE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7 },
  continueBtnDisabled: { opacity: 0.45 },
  continueBtnText: { color: WHITE, fontSize: 17, fontWeight: '700', letterSpacing: 0.4 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 6, marginBottom: 20 },
  shieldIconBox: { marginTop: 2 },
  termsText: { flex: 1, fontSize: 13, lineHeight: 20 },
  termsLink: { color: WINE, fontWeight: '600' },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  bottomText: { fontSize: 14, fontWeight: '500' },
  bottomLink: { fontSize: 14, color: WINE, fontWeight: '700' },
});