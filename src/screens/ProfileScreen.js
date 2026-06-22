import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, StatusBar, Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { getWallet, removeToken, getToken } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const WINE = '#E50914';
const WHITE = '#FFFFFF';

const SUPABASE_URL = 'https://etswwbmrfqeokmobvhwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c3d3Ym1yZnFlb2ttb2J2aHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzA0ODUsImV4cCI6MjA5Njg0NjQ4NX0.Y5okjJ1uXhWi0Sr6xVjKRf8eGgutDlWxTERc3ObVbIs';
const BASE_URL = 'https://contriba-backend-production.up.railway.app';

export default function ProfileScreen({ navigation }) {
  const { darkMode, language, colors } = useTheme();
  const { BG, CARD, TEXT, SUB, BORDER, DIV } = colors;

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [wallet, setWallet]                 = useState(null);
  const [user, setUser]                     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [editModal, setEditModal]           = useState(false);
  const [editName, setEditName]             = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadProfile();
    const unsubscribe = navigation.addListener('focus', loadProfile);
    return unsubscribe;
  }, [navigation]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
      const walletResult = await getWallet();
      if (walletResult.success) setWallet(walletResult.wallet);
    } catch (error) {
      console.error('Profile load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadPhotoToSupabase = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `avatars/${user?.id}-${Date.now()}.jpg`;
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

  const handlePickPhoto = async () => {
    Alert.alert('Profile Photo', 'Choose an option', [
      {
        text: 'Choose from Library',
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) { Alert.alert('Permission needed', 'Please allow access to your photo library.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled) await updateProfilePhoto(result.assets[0].uri);
        },
      },
      {
        text: 'Take Photo',
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) { Alert.alert('Permission needed', 'Please allow camera access.'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled) await updateProfilePhoto(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const updateProfilePhoto = async (uri) => {
    setUploadingPhoto(true);
    try {
      const avatarUrl = await uploadPhotoToSupabase(uri);
      if (!avatarUrl) { Alert.alert('Error', 'Failed to upload photo. Please try again.'); return; }
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/api/auth/update-avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ avatar_url: avatarUrl }),
      });
      const result = await response.json();
      if (result.success) {
        const updatedUser = { ...user, avatar_url: avatarUrl };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        Alert.alert('Success! ✅', 'Profile photo updated!');
      } else {
        Alert.alert('Error', 'Failed to save photo to database');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          await removeToken();
          await AsyncStorage.removeItem('user');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const formatAmount = (val) => 'RWF ' + (val || 0).toLocaleString('en-RW');

  const getInitials = (name, phone) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (phone) return phone.slice(-2);
    return '?';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: BG }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={CARD} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: CARD, borderBottomColor: BORDER }]}>
        <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: darkMode ? '#2A2A2A' : '#F5F5F5' }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Umwirondoro Wanjye' : 'My Profile'}
        </Text>
        <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: darkMode ? '#2A2A2A' : '#F5F5F5' }]} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={22} color={TEXT} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={[styles.loadingBox, { backgroundColor: BG }]}>
          <ActivityIndicator color={WINE} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* PROFILE CARD */}
          <View style={[styles.profileCard, { backgroundColor: CARD, borderColor: BORDER, borderWidth: 1 }]}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickPhoto} activeOpacity={0.8}>
              {uploadingPhoto ? (
                <View style={[styles.avatar, { backgroundColor: WINE, justifyContent: 'center', alignItems: 'center' }]}>
                  <ActivityIndicator color={WHITE} size="small" />
                </View>
              ) : user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: WINE, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={styles.avatarInitials}>{getInitials(user?.name, user?.phone)}</Text>
                </View>
              )}
              <View style={styles.cameraBtn}>
                <Ionicons name="camera" size={14} color={WHITE} />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: TEXT }]}>{user?.name || 'Add your name'}</Text>
              {user?.email ? <Text style={[styles.profileDetail, { color: SUB }]}>{user.email}</Text> : null}
              <Text style={[styles.profileDetail, { color: SUB }]}>{user?.phone || ''}</Text>
              <TouchableOpacity onPress={handlePickPhoto}>
                <Text style={styles.changePhotoText}>
                  {language === 'Kinyarwanda' ? 'Kanda ifoto guhindura' : 'Tap photo to change'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => { setEditName(user?.name || ''); setEditModal(true); }}>
              <Ionicons name="pencil-outline" size={14} color={WINE} />
              <Text style={styles.editBtnText}>{language === 'Kinyarwanda' ? 'Hindura' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {/* WALLET BALANCE CARD */}
          <TouchableOpacity style={styles.walletCard} onPress={() => navigation.navigate('Wallet')} activeOpacity={0.9}>
            <View style={styles.walletTop}>
              <View>
                <Text style={styles.walletLabel}>
                  {language === 'Kinyarwanda' ? 'Umuvuno Wanjye' : 'My Wallet Balance'}
                </Text>
                <View style={styles.balanceRow}>
                  <Text style={styles.walletBalance}>
                    {balanceVisible ? formatAmount(wallet?.balance) : 'RWF ••••••'}
                  </Text>
                  <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
                    <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={20} color={WHITE} style={{ marginLeft: 10 }} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.walletSub}>
                  {language === 'Kinyarwanda' ? 'Amafaranga Aboneka' : 'Available Balance'}
                </Text>
              </View>
              <Ionicons name="wallet" size={40} color="rgba(255,255,255,0.4)" />
            </View>
            <View style={styles.walletDivider} />
            <View style={styles.walletActions}>
              <TouchableOpacity style={styles.walletAction} onPress={() => navigation.navigate('Wallet')}>
                <View style={styles.walletActionIcon}><Ionicons name="arrow-down" size={18} color={WINE} /></View>
                <Text style={styles.walletActionText}>{language === 'Kinyarwanda' ? 'Injiza' : 'Add Money'}</Text>
              </TouchableOpacity>
              <View style={styles.walletActionDivider} />
              <TouchableOpacity style={styles.walletAction} onPress={() => navigation.navigate('Wallet')}>
                <View style={styles.walletActionIcon}><Ionicons name="arrow-up" size={18} color={WINE} /></View>
                <Text style={styles.walletActionText}>{language === 'Kinyarwanda' ? 'Sohora' : 'Withdraw'}</Text>
              </TouchableOpacity>
              <View style={styles.walletActionDivider} />
              <TouchableOpacity style={styles.walletAction} onPress={() => navigation.navigate('Wallet')}>
                <View style={styles.walletActionIcon}><Ionicons name="time-outline" size={18} color={WINE} /></View>
                <Text style={styles.walletActionText}>{language === 'Kinyarwanda' ? 'Amateka' : 'History'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* WALLET OVERVIEW */}
          <View style={[styles.overviewCard, { backgroundColor: CARD, borderColor: BORDER }]}>
            <Text style={[styles.overviewTitle, { color: TEXT }]}>
              {language === 'Kinyarwanda' ? 'Incamake y\'Amafaranga' : 'Wallet Overview'}
            </Text>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewItem}>
                <View style={[styles.overviewIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="arrow-down" size={20} color="#1A9E4A" />
                </View>
                <Text style={[styles.overviewLabel, { color: SUB }]}>
                  {language === 'Kinyarwanda' ? 'Injiye' : 'Total In'}
                </Text>
                <Text style={[styles.overviewValue, { color: '#1A9E4A' }]}>{formatAmount(wallet?.total_in)}</Text>
              </View>
              <View style={[styles.overviewDivider, { backgroundColor: BORDER }]} />
              <View style={styles.overviewItem}>
                <View style={[styles.overviewIcon, { backgroundColor: '#FFE4E9' }]}>
                  <Ionicons name="arrow-up" size={20} color={WINE} />
                </View>
                <Text style={[styles.overviewLabel, { color: SUB }]}>
                  {language === 'Kinyarwanda' ? 'Sohotse' : 'Total Out'}
                </Text>
                <Text style={[styles.overviewValue, { color: WINE }]}>{formatAmount(wallet?.total_out)}</Text>
              </View>
              <View style={[styles.overviewDivider, { backgroundColor: BORDER }]} />
              <View style={styles.overviewItem}>
                <View style={[styles.overviewIcon, { backgroundColor: '#EDE7F6' }]}>
                  <Ionicons name="card-outline" size={20} color="#7C3AED" />
                </View>
                <Text style={[styles.overviewLabel, { color: SUB }]}>
                  {language === 'Kinyarwanda' ? 'Bitegereje' : 'Pending'}
                </Text>
                <Text style={[styles.overviewValue, { color: '#7C3AED' }]}>RWF 0</Text>
              </View>
            </View>
          </View>

          {/* QUICK SETTINGS */}
          <Text style={[styles.sectionTitle, { color: TEXT }]}>
            {language === 'Kinyarwanda' ? 'Konti & Igenamigambi' : 'Account & Settings'}
          </Text>
          <View style={[styles.settingsCard, { backgroundColor: CARD, borderColor: BORDER }]}>
            {[
              { icon: 'settings-outline', label: language === 'Kinyarwanda' ? 'Igenamigambi' : 'Settings', sub: language === 'Kinyarwanda' ? 'Impinduka, ururimi' : 'Notifications, language, security', screen: 'Settings', iconBg: '#FFF3E0', iconColor: '#F59E0B' },
              { icon: 'wallet-outline', label: language === 'Kinyarwanda' ? 'Amafaranga Yanjye' : 'My Wallet', sub: language === 'Kinyarwanda' ? 'Reba umuvuno' : 'View balance & transactions', screen: 'Wallet', iconBg: '#EDE7F6', iconColor: '#7C3AED' },
              { icon: 'notifications-outline', label: language === 'Kinyarwanda' ? 'Impinduka' : 'Notifications', sub: language === 'Kinyarwanda' ? 'Genzura impinduka zawe' : 'Manage your alerts', screen: 'Notifications', iconBg: '#E3F2FD', iconColor: '#1877F2' },
              { icon: 'shield-checkmark-outline', label: language === 'Kinyarwanda' ? 'Umutekano' : 'Privacy & Security', sub: 'OTP-based authentication', screen: 'Settings', iconBg: '#E8F5E9', iconColor: '#1A9E4A' },
              { icon: 'help-circle-outline', label: language === 'Kinyarwanda' ? 'Ubufasha' : 'Help & Support', sub: language === 'Kinyarwanda' ? 'Bona ubufasha' : 'Get help and contact us', screen: 'Settings', iconBg: '#FFE4E9', iconColor: WINE },
            ].map((item, index, arr) => (
              <View key={item.label}>
                <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7} onPress={() => navigation.navigate(item.screen)}>
                  <View style={[styles.settingsIconBox, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon} size={20} color={item.iconColor} />
                  </View>
                  <View style={styles.settingsInfo}>
                    <Text style={[styles.settingsLabel, { color: TEXT }]}>{item.label}</Text>
                    <Text style={[styles.settingsSub, { color: SUB }]}>{item.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={SUB} />
                </TouchableOpacity>
                {index < arr.length - 1 && <View style={[styles.rowDivider, { backgroundColor: DIV }]} />}
              </View>
            ))}
          </View>

          {/* INVITE & EARN */}
          <View style={[styles.inviteCard, { backgroundColor: darkMode ? '#1A0A0E' : '#FFF5F7', borderColor: darkMode ? '#3A1A20' : '#FFD6E0' }]}>
            <View style={styles.inviteLeft}>
              <Text style={[styles.inviteTitle, { color: TEXT }]}>
                {language === 'Kinyarwanda' ? 'Zaprisha & Unguke' : 'Invite & Earn'}
              </Text>
              <Text style={[styles.inviteSub, { color: SUB }]}>
                {language === 'Kinyarwanda' ? 'Zaprisha inshuti kuri Contriba' : 'Invite friends to Contriba and earn rewards'}
              </Text>
              <TouchableOpacity style={styles.inviteBtn}>
                <Text style={styles.inviteBtnText}>
                  {language === 'Kinyarwanda' ? 'Zaprisha Inshuti' : 'Invite Friends'}
                </Text>
                <Ionicons name="share-social-outline" size={16} color={WINE} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
            <Ionicons name="gift" size={60} color={WINE} style={{ opacity: 0.15, marginLeft: 16 }} />
          </View>

          {/* LOGOUT */}
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={WINE} />
            <Text style={styles.logoutText}>{language === 'Kinyarwanda' ? 'Sohoka' : 'Log Out'}</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* EDIT NAME MODAL */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: CARD }]}>
            <Text style={[styles.modalTitle, { color: TEXT }]}>
              {language === 'Kinyarwanda' ? 'Hindura Profili' : 'Edit Profile'}
            </Text>
            <Text style={[styles.modalLabel, { color: TEXT }]}>
              {language === 'Kinyarwanda' ? 'Amazina Yose' : 'Full Name'}
            </Text>
            <TextInput
              style={[styles.modalInput, { borderColor: BORDER, color: TEXT, backgroundColor: BG }]}
              placeholder="Your full name"
              placeholderTextColor="#BBBBBB"
              value={editName}
              onChangeText={setEditName}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: BORDER }]} onPress={() => setEditModal(false)}>
                <Text style={[styles.modalCancelText, { color: SUB }]}>
                  {language === 'Kinyarwanda' ? 'Hagarika' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={async () => {
                  try {
                    const token = await getToken();
                    await fetch(`${BASE_URL}/api/auth/update-profile`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ name: editName }),
                    });
                    const updatedUser = { ...user, name: editName };
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                    setUser(updatedUser);
                    setEditModal(false);
                    Alert.alert('Success! ✅', 'Profile updated!');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to update profile');
                  }
                }}
              >
                <Text style={styles.modalSaveText}>
                  {language === 'Kinyarwanda' ? 'Bika' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  profileCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderRadius: 16, padding: 14 },
  avatarWrapper: { position: 'relative', marginRight: 12 },
  avatar: { width: 70, height: 70, borderRadius: 35 },
  avatarInitials: { fontSize: 24, fontWeight: '800', color: WHITE },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: WINE, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  profileDetail: { fontSize: 12, marginBottom: 2 },
  changePhotoText: { fontSize: 11, color: WINE, fontWeight: '600', marginTop: 4 },
  editBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: WINE, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  editBtnText: { fontSize: 12, fontWeight: '600', color: WINE, marginLeft: 4 },
  walletCard: { backgroundColor: WINE, borderRadius: 16, padding: 18, marginBottom: 16 },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  walletBalance: { fontSize: 28, fontWeight: '900', color: WHITE },
  walletSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  walletDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 16 },
  walletActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  walletAction: { alignItems: 'center', gap: 6, flex: 1 },
  walletActionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  walletActionText: { fontSize: 11, color: WHITE, fontWeight: '600', textAlign: 'center' },
  walletActionDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  overviewCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 20 },
  overviewTitle: { fontSize: 16, fontWeight: '800', marginBottom: 14 },
  overviewGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  overviewItem: { alignItems: 'center', flex: 1 },
  overviewIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  overviewLabel: { fontSize: 12, marginBottom: 4 },
  overviewValue: { fontSize: 14, fontWeight: '700' },
  overviewDivider: { width: 1, height: 60 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  settingsCard: { borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingsIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingsInfo: { flex: 1 },
  settingsLabel: { fontSize: 14, fontWeight: '600' },
  settingsSub: { fontSize: 12, marginTop: 2 },
  rowDivider: { height: 1, marginHorizontal: 14 },
  inviteCard: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 1 },
  inviteLeft: { flex: 1 },
  inviteTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  inviteSub: { fontSize: 12, marginBottom: 12, lineHeight: 18 },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: WINE, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start' },
  inviteBtnText: { fontSize: 13, fontWeight: '600', color: WINE },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: WINE, borderRadius: 14, paddingVertical: 14, marginBottom: 8, backgroundColor: '#FDF0F3' },
  logoutText: { fontSize: 15, fontWeight: '700', color: WINE, marginLeft: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  modalInput: { borderWidth: 1.5, borderRadius: 14, height: 54, paddingHorizontal: 16, fontSize: 15, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, borderWidth: 1.5, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600' },
  modalSave: { flex: 1, backgroundColor: WINE, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: WHITE },
});