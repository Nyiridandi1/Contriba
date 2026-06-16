// src/screens/CreateEventScreen.js

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, SafeAreaView, Image,
  Dimensions, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { createEvent } from '../api';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const WINE       = '#E60012';
const WINE_LIGHT = '#FDF0F3';
const WHITE      = '#FFFFFF';
const GRAY       = '#888888';
const GREEN      = '#1A9E4A';

const SUPABASE_URL      = 'https://etswwbmrfqeokmobvhwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c3d3Ym1yZnFlb2ttb2J2aHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzA0ODUsImV4cCI6MjA5Njg0NjQ4NX0.Y5okjJ1uXhWi0Sr6xVjKRf8eGgutDlWxTERc3ObVbIs';

const eventTypes = [
  { id: '1', label: 'Wedding',      icon: 'heart-circle-outline', type: 'Wedding'      },
  { id: '2', label: 'Birthday',     icon: 'gift-outline',         type: 'Birthday'     },
  { id: '3', label: 'Introduction', icon: 'people-outline',       type: 'Introduction' },
  { id: '4', label: 'Other',        icon: 'heart-outline',        type: 'Other'        },
];

const paymentMethods = [
  { id: 'mtn',    label: 'MTN MoMo',     icon: 'phone-portrait-outline', color: '#FFC403' },
  { id: 'airtel', label: 'Airtel Money', icon: 'phone-portrait-outline', color: '#FF0000' },
];

const uploadPhotoToSupabase = async (uri, fileName) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/event-photos/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': blob.type || 'image/jpeg',
          'x-upsert': 'true',
        },
        body: blob,
      }
    );
    if (uploadResponse.ok) {
      return `${SUPABASE_URL}/storage/v1/object/public/event-photos/${fileName}`;
    }
    return null;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
};

export default function CreateEventScreen({ navigation }) {
  const { darkMode, language, colors } = useTheme();
  const { BG, CARD, TEXT, SUB, BORDER } = colors;

  const [selectedType, setSelectedType]             = useState('1');
  const [title, setTitle]                           = useState('');
  const [date, setDate]                             = useState(new Date());
  const [showDatePicker, setShowDatePicker]         = useState(false);
  const [location, setLocation]                     = useState('');
  const [message, setMessage]                       = useState('');
  const [goalAmount, setGoalAmount]                 = useState('');
  const [ownerPhone, setOwnerPhone]                 = useState('');
  const [ownerPaymentMethod, setOwnerPaymentMethod] = useState('mtn');
  const [photos, setPhotos]                         = useState([null, null, null, null]);
  const [loading, setLoading]                       = useState(false);
  const [uploadProgress, setUploadProgress]         = useState('');
  const [isPrivate, setIsPrivate]                   = useState(false); // ✅ Privacy toggle

  const formatDateDisplay = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const formatDateAPI = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handlePickPhoto = async (index) => {
    Alert.alert(
      language === 'Kinyarwanda' ? 'Ongeraho Ifoto' : 'Add Photo',
      language === 'Kinyarwanda' ? 'Hitamo uburyo' : 'Choose an option',
      [
        {
          text: language === 'Kinyarwanda' ? 'Hitamo muri Galeri' : 'Choose from Library',
          onPress: async () => {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) { Alert.alert('Permission needed', 'Please allow access to your photo library.'); return; }
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8 });
            if (!result.canceled) {
              const newPhotos = [...photos];
              newPhotos[index] = result.assets[0].uri;
              setPhotos(newPhotos);
            }
          },
        },
        {
          text: language === 'Kinyarwanda' ? 'Fota' : 'Take Photo',
          onPress: async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) { Alert.alert('Permission needed', 'Please allow camera access.'); return; }
            const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
            if (!result.canceled) {
              const newPhotos = [...photos];
              newPhotos[index] = result.assets[0].uri;
              setPhotos(newPhotos);
            }
          },
        },
        { text: language === 'Kinyarwanda' ? 'Hagarika' : 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos[index] = null;
    setPhotos(newPhotos);
  };

  const getPhotoLabel = (index) => {
    const type = eventTypes.find(t => t.id === selectedType)?.type;
    if (language === 'Kinyarwanda') {
      if (type === 'Wedding') return ['Ifoto y\'Abubatse', 'Ubutumire', 'Ifoto y\'Aho', 'Ifoto Yindi'][index];
      if (type === 'Birthday') return ['Ifoto y\'Ubyukuwe', 'Ubutumire', 'Ifoto y\'Aho', 'Ifoto Yindi'][index];
      return `Ifoto ${index + 1}`;
    }
    if (type === 'Wedding') return ['Couple Photo', 'Invitation Card', 'Venue Photo', 'Extra Photo'][index];
    if (type === 'Birthday') return ['Birthday Person', 'Invitation Card', 'Venue Photo', 'Extra Photo'][index];
    return `Event Photo ${index + 1}`;
  };

  const handleCreate = async () => {
    if (!title) { Alert.alert('Error', language === 'Kinyarwanda' ? 'Injiza izina ry\'ikirori' : 'Please enter an event title'); return; }
    if (!ownerPhone) { Alert.alert('Error', language === 'Kinyarwanda' ? 'Injiza numero ya telefoni' : 'Please enter your phone number to receive contributions'); return; }

    const selectedEventType = eventTypes.find(t => t.id === selectedType);
    setLoading(true);

    try {
      const photoUrls = [null, null, null, null];
      for (let i = 0; i < photos.length; i++) {
        if (photos[i]) {
          setUploadProgress(language === 'Kinyarwanda' ? `Kohereza ifoto ${i + 1}...` : `Uploading photo ${i + 1} of ${photos.filter(p => p).length}...`);
          const fileName = `event-${Date.now()}-photo${i + 1}.jpg`;
          photoUrls[i] = await uploadPhotoToSupabase(photos[i], fileName);
        }
      }

      setUploadProgress(language === 'Kinyarwanda' ? 'Gushyiraho ikirori...' : 'Creating event...');

      const result = await createEvent({
        title, type: selectedEventType.type, date: formatDateAPI(date),
        location, description: message,
        goal_amount: goalAmount ? parseInt(goalAmount) : 0,
        owner_phone: ownerPhone, owner_payment_method: ownerPaymentMethod,
        cover_image: photoUrls[0], photo2_url: photoUrls[1],
        photo3_url: photoUrls[2], photo4_url: photoUrls[3],
        is_private: isPrivate, // ✅ send privacy setting
      });

      if (result.success) {
        Alert.alert(
          language === 'Kinyarwanda' ? 'Ikirori Gishyizweho! 🎉' : 'Event Created! 🎉',
          language === 'Kinyarwanda' ? `Ikirori "${title}" gishyizweho!` : `Your event "${title}" has been created successfully!`,
          [
            { text: language === 'Kinyarwanda' ? 'Reba Ikirori' : 'View Event', onPress: () => navigation.navigate('EventPage', { event: result.event }) },
            { text: language === 'Kinyarwanda' ? 'Ahabanza' : 'Go Home', onPress: () => navigation.navigate('Home') },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to create event');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={CARD} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: CARD, borderBottomColor: BORDER }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Shiraho Ikirori Gishya' : 'Create New Event'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Event Type */}
        <Text style={[styles.label, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Ubwoko bw\'Ikirori' : 'Event Type'}
        </Text>
        <View style={styles.typeRow}>
          {eventTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.typeCard, { borderColor: BORDER, backgroundColor: CARD }, selectedType === type.id && styles.typeCardActive]}
              onPress={() => setSelectedType(type.id)}
              activeOpacity={0.8}
            >
              <Ionicons name={type.icon} size={28} color={selectedType === type.id ? WINE : SUB} />
              <Text style={[styles.typeLabel, { color: SUB }, selectedType === type.id && styles.typeLabelActive]}>
                {language === 'Kinyarwanda'
                  ? { Wedding: 'Ubukwe', Birthday: 'Isabukuru', Introduction: 'Gukwa', Other: 'Ibindi' }[type.type]
                  : type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Event Title */}
        <Text style={[styles.label, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Izina ry\'Ikirori' : 'Event Title'}
        </Text>
        <TextInput
          style={[styles.input, { borderColor: BORDER, backgroundColor: CARD, color: TEXT }]}
          placeholder="John & Mary Wedding"
          placeholderTextColor="#BBBBBB"
          value={title}
          onChangeText={setTitle}
        />

        {/* Event Date */}
        <Text style={[styles.label, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Itariki y\'Ikirori' : 'Event Date'}
        </Text>
        <TouchableOpacity style={[styles.dateRow, { borderColor: BORDER, backgroundColor: CARD }]} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
          <Text style={[styles.dateText, { color: TEXT }]}>{formatDateDisplay(date)}</Text>
          <Ionicons name="calendar-outline" size={22} color={WINE} />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={date} mode="date" display="spinner" minimumDate={new Date()} onChange={onDateChange} />
        )}

        {/* Location */}
        <Text style={[styles.label, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Aho Bizabera' : 'Location'} <Text style={styles.optional}>{language === 'Kinyarwanda' ? '(si ngombwa)' : '(optional)'}</Text>
        </Text>
        <TextInput
          style={[styles.input, { borderColor: BORDER, backgroundColor: CARD, color: TEXT }]}
          placeholder="Kigali, Rwanda"
          placeholderTextColor="#BBBBBB"
          value={location}
          onChangeText={setLocation}
        />

        {/* Goal Amount */}
        <Text style={[styles.label, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Intego y\'Amafaranga' : 'Goal Amount'} <Text style={styles.optional}>{language === 'Kinyarwanda' ? '(si ngombwa)' : '(optional)'}</Text>
        </Text>
        <View style={[styles.dateRow, { borderColor: BORDER, backgroundColor: CARD }]}>
          <Text style={[styles.currency, { color: SUB }]}>RWF</Text>
          <TextInput
            style={[styles.dateInput, { color: TEXT }]}
            placeholder="10,000,000"
            placeholderTextColor="#BBBBBB"
            value={goalAmount}
            onChangeText={setGoalAmount}
            keyboardType="numeric"
          />
        </View>

        {/* Short Message */}
        <Text style={[styles.label, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Ubutumwa Bugufi' : 'Short Message'} <Text style={styles.optional}>{language === 'Kinyarwanda' ? '(si ngombwa)' : '(optional)'}</Text>
        </Text>
        <TextInput
          style={[styles.textarea, { borderColor: BORDER, backgroundColor: CARD, color: TEXT }]}
          placeholder={language === 'Kinyarwanda' ? 'Twubaka no gukunda...' : 'We are getting married and would love you to be part of our special day.'}
          placeholderTextColor="#BBBBBB"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* ✅ PRIVACY TOGGLE */}
        <View style={[styles.sectionDivider, { backgroundColor: darkMode ? '#1A0A0E' : WINE_LIGHT }]}>
          <Ionicons name="shield-outline" size={18} color={WINE} />
          <Text style={styles.sectionDividerText}>Event Privacy</Text>
        </View>

        <View style={[styles.privacyCard, { backgroundColor: CARD, borderColor: BORDER }]}>
          {/* Public Option */}
          <TouchableOpacity
            style={[styles.privacyOption, !isPrivate && styles.privacyOptionActive, { borderColor: !isPrivate ? GREEN : BORDER }]}
            onPress={() => setIsPrivate(false)}
            activeOpacity={0.8}
          >
            <View style={[styles.privacyIconBox, { backgroundColor: !isPrivate ? '#E8F5E9' : (darkMode ? '#2A2A2A' : '#F5F5F5') }]}>
              <Ionicons name="globe-outline" size={24} color={!isPrivate ? GREEN : SUB} />
            </View>
            <View style={styles.privacyInfo}>
              <Text style={[styles.privacyTitle, { color: TEXT }]}>🌍 Public</Text>
              <Text style={[styles.privacySub, { color: SUB }]}>Everyone on Contriba can see this event</Text>
            </View>
            {!isPrivate && <Ionicons name="checkmark-circle" size={22} color={GREEN} />}
          </TouchableOpacity>

          <View style={[styles.privacyDivider, { backgroundColor: BORDER }]} />

          {/* Private Option */}
          <TouchableOpacity
            style={[styles.privacyOption, isPrivate && styles.privacyOptionActiveWine, { borderColor: isPrivate ? WINE : BORDER }]}
            onPress={() => setIsPrivate(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.privacyIconBox, { backgroundColor: isPrivate ? '#FFE4E9' : (darkMode ? '#2A2A2A' : '#F5F5F5') }]}>
              <Ionicons name="lock-closed-outline" size={24} color={isPrivate ? WINE : SUB} />
            </View>
            <View style={styles.privacyInfo}>
              <Text style={[styles.privacyTitle, { color: TEXT }]}>🔒 Private</Text>
              <Text style={[styles.privacySub, { color: SUB }]}>Only people with the link can view</Text>
            </View>
            {isPrivate && <Ionicons name="checkmark-circle" size={22} color={WINE} />}
          </TouchableOpacity>
        </View>

        {/* Privacy info banner */}
        <View style={[styles.privacyBanner, { backgroundColor: isPrivate ? (darkMode ? '#1A0A0E' : WINE_LIGHT) : (darkMode ? '#0A1A0E' : '#E8F5E9') }]}>
          <Ionicons name={isPrivate ? 'lock-closed' : 'globe'} size={16} color={isPrivate ? WINE : GREEN} />
          <Text style={[styles.privacyBannerText, { color: isPrivate ? WINE : GREEN }]}>
            {isPrivate
              ? '🔒 Private event — Share the link to invite people'
              : '🌍 Public event — Visible to everyone on Contriba'}
          </Text>
        </View>

        {/* Receive Payments */}
        <View style={[styles.sectionDivider, { backgroundColor: darkMode ? '#1A0A0E' : WINE_LIGHT }]}>
          <Ionicons name="cash-outline" size={18} color={WINE} />
          <Text style={styles.sectionDividerText}>
            {language === 'Kinyarwanda' ? 'Aho Amafaranga Yoherezwa' : 'Where to Receive Contributions'}
          </Text>
        </View>

        <Text style={[styles.label, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Numero ya Telefoni Yawe' : 'Your Phone Number'} <Text style={styles.required}>*</Text>
        </Text>
        <Text style={[styles.labelSub, { color: SUB }]}>
          {language === 'Kinyarwanda' ? 'Inkunga zoherezwa kuri iyi numero' : 'Contributions will be sent directly to this number'}
        </Text>
        <TextInput
          style={[styles.input, { borderColor: BORDER, backgroundColor: CARD, color: TEXT }]}
          placeholder="0781 234 567"
          placeholderTextColor="#BBBBBB"
          value={ownerPhone}
          onChangeText={setOwnerPhone}
          keyboardType="phone-pad"
        />

        <Text style={[styles.label, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Uburyo bw\'Kwishyura' : 'Payment Method'} <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.paymentMethodRow}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.paymentMethodCard, { borderColor: BORDER, backgroundColor: CARD }, ownerPaymentMethod === method.id && styles.paymentMethodCardActive]}
              onPress={() => setOwnerPaymentMethod(method.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.paymentMethodIcon, { backgroundColor: method.color + '20' }]}>
                <Ionicons name={method.icon} size={24} color={method.color} />
              </View>
              <Text style={[styles.paymentMethodLabel, { color: SUB }, ownerPaymentMethod === method.id && styles.paymentMethodLabelActive]}>
                {method.label}
              </Text>
              {ownerPaymentMethod === method.id && (
                <Ionicons name="checkmark-circle" size={20} color={WINE} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Event Photos */}
        <View style={[styles.sectionDivider, { backgroundColor: darkMode ? '#1A0A0E' : WINE_LIGHT }]}>
          <Ionicons name="images-outline" size={18} color={WINE} />
          <Text style={styles.sectionDividerText}>
            {language === 'Kinyarwanda' ? 'Amafoto y\'Ikirori (kugeza 4)' : 'Event Photos (up to 4)'}
          </Text>
        </View>

        <Text style={[styles.photosHint, { backgroundColor: darkMode ? '#1A0A0E' : WINE_LIGHT }]}>
          📸 {language === 'Kinyarwanda' ? 'Ongeraho amafoto kugeza 4!' : 'Add up to 4 photos to make your event stand out!'}
        </Text>

        {/* 2x2 Photo Grid */}
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.photoBox, { backgroundColor: darkMode ? '#1A1A1A' : '#F5F5F5', borderColor: BORDER }]}
              onPress={() => handlePickPhoto(index)}
              activeOpacity={0.8}
            >
              {photo ? (
                <>
                  <Image source={{ uri: photo }} style={styles.photoPreview} resizeMode="cover" />
                  <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(index)}>
                    <Ionicons name="close-circle" size={22} color={WHITE} />
                  </TouchableOpacity>
                  <View style={styles.photoOverlay}>
                    <Ionicons name="camera-outline" size={16} color={WHITE} />
                  </View>
                </>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="add-circle-outline" size={32} color={WINE} />
                  <Text style={[styles.photoPlaceholderText, { color: SUB }]}>{getPhotoLabel(index)}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Create Event Button */}
      <View style={[styles.bottomBtn, { backgroundColor: CARD, borderTopColor: BORDER }]}>
        {uploadProgress ? (
          <View style={styles.uploadProgressBox}>
            <ActivityIndicator color={WINE} size="small" />
            <Text style={styles.uploadProgressText}>{uploadProgress}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.createBtn, loading && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color={WHITE} size="small" />
              <Text style={styles.createBtnText}>
                {language === 'Kinyarwanda' ? 'Gushyiraho Ikirori...' : 'Creating Event...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.createBtnText}>
              {language === 'Kinyarwanda' ? 'Shiraho Ikirori 🎉' : 'Create Event 🎉'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  labelSub: { fontSize: 12, marginBottom: 10 },
  optional: { fontSize: 13, fontWeight: '400', color: GRAY },
  required: { color: WINE },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 8 },
  typeCard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, gap: 6 },
  typeCardActive: { borderColor: WINE, backgroundColor: WINE_LIGHT },
  typeLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  typeLabelActive: { color: WINE },
  input: { borderWidth: 1.5, borderRadius: 14, height: 54, paddingHorizontal: 16, fontSize: 15, marginBottom: 20 },
  dateRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, height: 54, paddingHorizontal: 16, marginBottom: 20 },
  dateText: { flex: 1, fontSize: 15, fontWeight: '500' },
  dateInput: { flex: 1, fontSize: 15 },
  currency: { fontSize: 15, fontWeight: '700', marginRight: 8 },
  textarea: { borderWidth: 1.5, borderRadius: 14, height: 100, paddingHorizontal: 16, paddingTop: 14, fontSize: 15, marginBottom: 24 },
  sectionDivider: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: WINE },
  sectionDividerText: { fontSize: 15, fontWeight: '700', color: WINE },

  // ✅ Privacy styles
  privacyCard: { borderWidth: 1, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  privacyOption: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  privacyOptionActive: { backgroundColor: '#F0FFF4' },
  privacyOptionActiveWine: { backgroundColor: WINE_LIGHT },
  privacyIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  privacyInfo: { flex: 1 },
  privacyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  privacySub: { fontSize: 12, lineHeight: 18 },
  privacyDivider: { height: 1, marginHorizontal: 14 },
  privacyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, marginBottom: 24 },
  privacyBannerText: { fontSize: 13, fontWeight: '600', flex: 1 },

  paymentMethodRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  paymentMethodCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 14, padding: 12 },
  paymentMethodCardActive: { borderColor: WINE, backgroundColor: WINE_LIGHT },
  paymentMethodIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  paymentMethodLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  paymentMethodLabelActive: { color: WINE },
  photosHint: { fontSize: 13, color: WINE, fontWeight: '600', marginBottom: 16, padding: 10, borderRadius: 10 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  photoBox: { width: (width - 50) / 2, height: (width - 50) / 2, borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderStyle: 'dashed', position: 'relative' },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  photoPlaceholderText: { fontSize: 11, fontWeight: '600', textAlign: 'center', paddingHorizontal: 8 },
  photoOverlay: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 },
  removePhotoBtn: { position: 'absolute', top: 6, right: 6, zIndex: 10 },
  bottomBtn: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: Platform.OS === 'android' ? 20 : 30, paddingTop: 12, borderTopWidth: 1 },
  uploadProgressBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  uploadProgressText: { fontSize: 13, color: WINE, fontWeight: '600' },
  createBtn: { backgroundColor: WINE, borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center', shadowColor: WINE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7 },
  createBtnText: { color: WHITE, fontSize: 17, fontWeight: '700', letterSpacing: 0.4 },
});