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
import { createEvent, getToken } from '../api';

const { width } = Dimensions.get('window');

const WINE       = '#E60012';
const WINE_LIGHT = '#FDF0F3';
const WHITE      = '#FFFFFF';
const BLACK      = '#1A1A1A';
const GRAY       = '#888888';
const BORDER     = '#E5E5E5';

const SUPABASE_URL = 'https://etswwbmrfqeokmobvhwy.supabase.co';
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
  const [selectedType, setSelectedType]             = useState('1');
  const [title, setTitle]                           = useState('');
  const [date, setDate]                             = useState(new Date());
  const [showDatePicker, setShowDatePicker]         = useState(false);
  const [location, setLocation]                     = useState('');
  const [message, setMessage]                       = useState('');
  const [goalAmount, setGoalAmount]                 = useState('');
  const [ownerPhone, setOwnerPhone]                 = useState('');
  const [ownerPaymentMethod, setOwnerPaymentMethod] = useState('mtn');
  // ✅ 4 photos instead of 2
  const [photos, setPhotos] = useState([null, null, null, null]);
  const [loading, setLoading]                       = useState(false);
  const [uploadProgress, setUploadProgress]         = useState('');

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
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Choose from Library',
          onPress: async () => {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) { Alert.alert('Permission needed', 'Please allow access to your photo library.'); return; }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true, aspect: [4, 3], quality: 0.8,
            });
            if (!result.canceled) {
              const newPhotos = [...photos];
              newPhotos[index] = result.assets[0].uri;
              setPhotos(newPhotos);
            }
          },
        },
        {
          text: 'Take Photo',
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
        { text: 'Cancel', style: 'cancel' },
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
    if (type === 'Wedding') {
      const labels = ['Couple Photo', 'Invitation Card', 'Venue Photo', 'Extra Photo'];
      return labels[index];
    }
    if (type === 'Birthday') {
      const labels = ['Birthday Person', 'Invitation Card', 'Venue Photo', 'Extra Photo'];
      return labels[index];
    }
    return `Event Photo ${index + 1}`;
  };

  const handleCreate = async () => {
    if (!title) { Alert.alert('Error', 'Please enter an event title'); return; }
    if (!ownerPhone) { Alert.alert('Error', 'Please enter your phone number to receive contributions'); return; }

    const selectedEventType = eventTypes.find(t => t.id === selectedType);
    setLoading(true);

    try {
      const photoUrls = [null, null, null, null];

      for (let i = 0; i < photos.length; i++) {
        if (photos[i]) {
          setUploadProgress(`Uploading photo ${i + 1} of ${photos.filter(p => p).length}...`);
          const fileName = `event-${Date.now()}-photo${i + 1}.jpg`;
          photoUrls[i] = await uploadPhotoToSupabase(photos[i], fileName);
        }
      }

      setUploadProgress('Creating event...');

      const result = await createEvent({
        title,
        type: selectedEventType.type,
        date: formatDateAPI(date),
        location,
        description: message,
        goal_amount: goalAmount ? parseInt(goalAmount) : 0,
        owner_phone: ownerPhone,
        owner_payment_method: ownerPaymentMethod,
        cover_image: photoUrls[0],
        photo2_url: photoUrls[1],
        photo3_url: photoUrls[2],
        photo4_url: photoUrls[3],
      });

      if (result.success) {
        Alert.alert(
          'Event Created! 🎉',
          `Your event "${title}" has been created successfully!`,
          [
            { text: 'View Event', onPress: () => navigation.navigate('EventPage', { event: result.event }) },
            { text: 'Go Home', onPress: () => navigation.navigate('Home') },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to create event');
      }
    } catch (error) {
      console.error('Create event error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Event</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Event Type */}
        <Text style={styles.label}>Event Type</Text>
        <View style={styles.typeRow}>
          {eventTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.typeCard, selectedType === type.id && styles.typeCardActive]}
              onPress={() => setSelectedType(type.id)}
              activeOpacity={0.8}
            >
              <Ionicons name={type.icon} size={28} color={selectedType === type.id ? WINE : GRAY} />
              <Text style={[styles.typeLabel, selectedType === type.id && styles.typeLabelActive]}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Event Title */}
        <Text style={styles.label}>Event Title</Text>
        <TextInput style={styles.input} placeholder="John & Mary Wedding" placeholderTextColor="#BBBBBB" value={title} onChangeText={setTitle} />

        {/* Event Date */}
        <Text style={styles.label}>Event Date</Text>
        <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
          <Text style={styles.dateText}>{formatDateDisplay(date)}</Text>
          <Ionicons name="calendar-outline" size={22} color={WINE} />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={date} mode="date" display="spinner" minimumDate={new Date()} onChange={onDateChange} />
        )}

        {/* Location */}
        <Text style={styles.label}>Location <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput style={styles.input} placeholder="Kigali, Rwanda" placeholderTextColor="#BBBBBB" value={location} onChangeText={setLocation} />

        {/* Goal Amount */}
        <Text style={styles.label}>Goal Amount <Text style={styles.optional}>(optional)</Text></Text>
        <View style={styles.dateRow}>
          <Text style={styles.currency}>RWF</Text>
          <TextInput style={styles.dateInput} placeholder="10,000,000" placeholderTextColor="#BBBBBB" value={goalAmount} onChangeText={setGoalAmount} keyboardType="numeric" />
        </View>

        {/* Short Message */}
        <Text style={styles.label}>Short Message <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput style={styles.textarea} placeholder="We are getting married and would love you to be part of our special day." placeholderTextColor="#BBBBBB" value={message} onChangeText={setMessage} multiline numberOfLines={4} textAlignVertical="top" />

        {/* Receive Payments */}
        <View style={styles.sectionDivider}>
          <Ionicons name="cash-outline" size={18} color={WINE} />
          <Text style={styles.sectionDividerText}>Where to Receive Contributions</Text>
        </View>

        <Text style={styles.label}>Your Phone Number <Text style={styles.required}>*</Text></Text>
        <Text style={styles.labelSub}>Contributions will be sent directly to this number</Text>
        <TextInput style={styles.input} placeholder="0781 234 567" placeholderTextColor="#BBBBBB" value={ownerPhone} onChangeText={setOwnerPhone} keyboardType="phone-pad" />

        <Text style={styles.label}>Payment Method <Text style={styles.required}>*</Text></Text>
        <View style={styles.paymentMethodRow}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.paymentMethodCard, ownerPaymentMethod === method.id && styles.paymentMethodCardActive]}
              onPress={() => setOwnerPaymentMethod(method.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.paymentMethodIcon, { backgroundColor: method.color + '20' }]}>
                <Ionicons name={method.icon} size={24} color={method.color} />
              </View>
              <Text style={[styles.paymentMethodLabel, ownerPaymentMethod === method.id && styles.paymentMethodLabelActive]}>
                {method.label}
              </Text>
              {ownerPaymentMethod === method.id && (
                <Ionicons name="checkmark-circle" size={20} color={WINE} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ Event Photos — 4 photos */}
        <View style={styles.sectionDivider}>
          <Ionicons name="images-outline" size={18} color={WINE} />
          <Text style={styles.sectionDividerText}>Event Photos (up to 4)</Text>
        </View>

        <Text style={styles.photosHint}>📸 Add up to 4 photos to make your event stand out!</Text>

        {/* 2x2 Photo Grid */}
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <TouchableOpacity
              key={index}
              style={styles.photoBox}
              onPress={() => handlePickPhoto(index)}
              activeOpacity={0.8}
            >
              {photo ? (
                <>
                  <Image source={{ uri: photo }} style={styles.photoPreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={22} color={WHITE} />
                  </TouchableOpacity>
                  <View style={styles.photoOverlay}>
                    <Ionicons name="camera-outline" size={16} color={WHITE} />
                  </View>
                </>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="add-circle-outline" size={32} color={WINE} />
                  <Text style={styles.photoPlaceholderText}>{getPhotoLabel(index)}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Create Event Button */}
      <View style={styles.bottomBtn}>
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
              <Text style={styles.createBtnText}>Creating Event...</Text>
            </View>
          ) : (
            <Text style={styles.createBtnText}>Create Event 🎉</Text>
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { fontSize: 18, fontWeight: '800', color: BLACK },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  label: { fontSize: 15, fontWeight: '700', color: BLACK, marginBottom: 6 },
  labelSub: { fontSize: 12, color: GRAY, marginBottom: 10 },
  optional: { fontSize: 13, fontWeight: '400', color: GRAY },
  required: { color: WINE },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 8 },
  typeCard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE, gap: 6 },
  typeCardActive: { borderColor: WINE, backgroundColor: WINE_LIGHT },
  typeLabel: { fontSize: 11, color: GRAY, fontWeight: '600', textAlign: 'center' },
  typeLabelActive: { color: WINE },
  input: { borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, height: 54, paddingHorizontal: 16, fontSize: 15, color: BLACK, marginBottom: 20, backgroundColor: WHITE },
  dateRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, height: 54, paddingHorizontal: 16, marginBottom: 20, backgroundColor: WHITE },
  dateText: { flex: 1, fontSize: 15, color: BLACK, fontWeight: '500' },
  dateInput: { flex: 1, fontSize: 15, color: BLACK },
  currency: { fontSize: 15, fontWeight: '700', color: GRAY, marginRight: 8 },
  textarea: { borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, height: 100, paddingHorizontal: 16, paddingTop: 14, fontSize: 15, color: BLACK, marginBottom: 24, backgroundColor: WHITE },
  sectionDivider: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: WINE_LIGHT, borderRadius: 12, padding: 12, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: WINE },
  sectionDividerText: { fontSize: 15, fontWeight: '700', color: WINE },
  paymentMethodRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  paymentMethodCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, padding: 12, backgroundColor: WHITE },
  paymentMethodCardActive: { borderColor: WINE, backgroundColor: WINE_LIGHT },
  paymentMethodIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  paymentMethodLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: GRAY },
  paymentMethodLabelActive: { color: WINE },
  photosHint: { fontSize: 13, color: WINE, fontWeight: '600', marginBottom: 16, backgroundColor: WINE_LIGHT, padding: 10, borderRadius: 10 },

  // ✅ 2x2 Photo Grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  photoBox: {
    width: (width - 50) / 2,
    height: (width - 50) / 2,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderStyle: 'dashed',
    position: 'relative',
  },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  photoPlaceholderText: { fontSize: 11, color: GRAY, fontWeight: '600', textAlign: 'center', paddingHorizontal: 8 },
  photoOverlay: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 },
  removePhotoBtn: { position: 'absolute', top: 6, right: 6, zIndex: 10 },

  bottomBtn: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: Platform.OS === 'android' ? 20 : 30, paddingTop: 12, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: BORDER },
  uploadProgressBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  uploadProgressText: { fontSize: 13, color: WINE, fontWeight: '600' },
  createBtn: { backgroundColor: WINE, borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center', shadowColor: WINE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7 },
  createBtnText: { color: WHITE, fontSize: 17, fontWeight: '700', letterSpacing: 0.4 },
});