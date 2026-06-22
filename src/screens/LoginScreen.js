import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, SafeAreaView, Image, ActivityIndicator, Alert,
  Platform, ScrollView, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginWithPin, saveToken } from '../api';
import { useTheme } from '../context/ThemeContext';

const WINE       = '#E50914';
const WHITE      = '#FFFFFF';
const WINE_LIGHT = '#F9EEF1';

const COUNTRIES = [
  { code: 'RW', name: 'Rwanda',       callingCode: '250', flag: '🇷🇼' },
  { code: 'UG', name: 'Uganda',       callingCode: '256', flag: '🇺🇬' },
  { code: 'KE', name: 'Kenya',        callingCode: '254', flag: '🇰🇪' },
  { code: 'TZ', name: 'Tanzania',     callingCode: '255', flag: '🇹🇿' },
  { code: 'BI', name: 'Burundi',      callingCode: '257', flag: '🇧🇮' },
  { code: 'CD', name: 'Congo (DRC)',  callingCode: '243', flag: '🇨🇩' },
  { code: 'US', name: 'USA',          callingCode: '1',   flag: '🇺🇸' },
  { code: 'GB', name: 'UK',           callingCode: '44',  flag: '🇬🇧' },
  { code: 'BE', name: 'Belgium',      callingCode: '32',  flag: '🇧🇪' },
  { code: 'FR', name: 'France',       callingCode: '33',  flag: '🇫🇷' },
  { code: 'CA', name: 'Canada',       callingCode: '1',   flag: '🇨🇦' },
  { code: 'DE', name: 'Germany',      callingCode: '49',  flag: '🇩🇪' },
  { code: 'NG', name: 'Nigeria',      callingCode: '234', flag: '🇳🇬' },
  { code: 'ZA', name: 'South Africa', callingCode: '27',  flag: '🇿🇦' },
  { code: 'ET', name: 'Ethiopia',     callingCode: '251', flag: '🇪🇹' },
  { code: 'GH', name: 'Ghana',        callingCode: '233', flag: '🇬🇭' },
  { code: 'SN', name: 'Senegal',      callingCode: '221', flag: '🇸🇳' },
  { code: 'CM', name: 'Cameroon',     callingCode: '237', flag: '🇨🇲' },
  { code: 'AU', name: 'Australia',    callingCode: '61',  flag: '🇦🇺' },
  { code: 'IN', name: 'India',        callingCode: '91',  flag: '🇮🇳' },
  { code: 'CN', name: 'China',        callingCode: '86',  flag: '🇨🇳' },
  { code: 'AE', name: 'UAE',          callingCode: '971', flag: '🇦🇪' },
];

export default function LoginScreen({ navigation }) {
  const { darkMode, language, colors } = useTheme();
  const { BG, CARD, TEXT, SUB, BORDER } = colors;

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showPicker, setShowPicker]           = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');
  const [phone, setPhone]                     = useState('');
  const [pin, setPin]                         = useState('');
  const [showPin, setShowPin]                 = useState(false);
  const [loading, setLoading]                 = useState(false);

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.callingCode.includes(searchQuery)
  );

  const handleLogin = async () => {
    if (phone.length < 8) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (pin.length < 4) {
      Alert.alert('Error', 'Please enter your PIN');
      return;
    }
    const fullPhone = `+${selectedCountry.callingCode}${phone}`;
    setLoading(true);
    try {
      const result = await loginWithPin(fullPhone, pin);
      if (result.success) {
        await saveToken(result.token);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        navigation.replace('Home');
      } else {
        Alert.alert('Error', result.message || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = phone.length < 8 || pin.length < 4 || loading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={BG} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>

        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />

        <Text style={[styles.title, { color: TEXT }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: SUB }]}>
          Enter your phone number and PIN to login
        </Text>

        <Text style={[styles.label, { color: TEXT }]}>
          Phone Number <Text style={styles.required}>*</Text>
        </Text>
        <View style={[styles.phoneRow, { borderColor: BORDER, backgroundColor: CARD }]}>
          <TouchableOpacity style={styles.countryBox} onPress={() => setShowPicker(true)}>
            <Text style={styles.flag}>{selectedCountry.flag}</Text>
            <Text style={[styles.callingCode, { color: TEXT }]}>+{selectedCountry.callingCode}</Text>
            <Ionicons name="chevron-down" size={14} color={SUB} />
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

        <Text style={[styles.label, { color: TEXT }]}>
          PIN <Text style={styles.required}>*</Text>
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

        <TouchableOpacity
          style={[styles.continueBtn, isDisabled && styles.continueBtnDisabled]}
          onPress={handleLogin}
          disabled={isDisabled}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={20} color={WHITE} />
              <Text style={styles.continueBtnText}>Login</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <Text style={[styles.bottomText, { color: TEXT }]}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.bottomLink}>  Sign Up</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: CARD }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: TEXT }]}>Select Country</Text>
              <TouchableOpacity onPress={() => { setShowPicker(false); setSearchQuery(''); }}>
                <Ionicons name="close" size={24} color={TEXT} />
              </TouchableOpacity>
            </View>
            <View style={[styles.searchBox, { borderColor: BORDER, backgroundColor: darkMode ? '#2A2A2A' : '#F5F5F5' }]}>
              <Ionicons name="search-outline" size={18} color={SUB} />
              <TextInput
                style={[styles.searchInput, { color: TEXT }]}
                placeholder="Search country..."
                placeholderTextColor="#BBBBBB"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryItem, { borderBottomColor: BORDER }, selectedCountry.code === item.code && { backgroundColor: WINE_LIGHT }]}
                  onPress={() => { setSelectedCountry(item); setShowPicker(false); setSearchQuery(''); }}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={[styles.countryName, { color: TEXT }]}>{item.name}</Text>
                  <Text style={[styles.countryCode, { color: SUB }]}>+{item.callingCode}</Text>
                  {selectedCountry.code === item.code && (
                    <Ionicons name="checkmark-circle" size={20} color={WINE} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

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
  required: { color: WINE },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, height: 58, paddingHorizontal: 14, marginBottom: 20 },
  countryBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flag: { fontSize: 22 },
  callingCode: { fontSize: 15, fontWeight: '600' },
  phoneDivider: { width: 1, height: 28, marginHorizontal: 12 },
  phoneInput: { flex: 1, fontSize: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, height: 58, paddingHorizontal: 14, marginBottom: 20 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  continueBtn: { backgroundColor: WINE, borderRadius: 14, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 20, shadowColor: WINE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7 },
  continueBtnDisabled: { opacity: 0.45 },
  continueBtnText: { color: WHITE, fontSize: 17, fontWeight: '700', letterSpacing: 0.4 },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  bottomText: { fontSize: 14, fontWeight: '500' },
  bottomLink: { fontSize: 14, color: WINE, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 15 },
  countryItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  countryFlag: { fontSize: 24 },
  countryName: { flex: 1, fontSize: 15, fontWeight: '500' },
  countryCode: { fontSize: 14, fontWeight: '600' },
});
