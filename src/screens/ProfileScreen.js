import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const WINE = '#7A001F';
const WHITE = '#FFFFFF';
const LIGHT_GREY = '#F5F5F5';
const MID_GREY = '#E0E0E0';
const DARK_GREY = '#666666';
const TEXT = '#1A1A1A';

const SETTINGS_ITEMS = [
  { id: '1', icon: 'person-outline',            label: 'Personal Information', sub: 'Update your personal details'          },
  { id: '2', icon: 'shield-checkmark-outline',  label: 'Security',             sub: 'Change password, PIN & security settings' },
  { id: '3', icon: 'card-outline',              label: 'Payment Methods',      sub: 'Manage your payment options'           },
  { id: '4', icon: 'notifications-outline',     label: 'Notifications',        sub: 'Manage your notification preferences'  },
  { id: '5', icon: 'help-circle-outline',       label: 'Help & Support',       sub: 'Get help and contact support'          },
  { id: '6', icon: 'information-circle-outline',label: 'About Contriba',       sub: 'App version 1.0.0'                     },
];

export default function ProfileScreen({ navigation }) {
  const [balanceVisible, setBalanceVisible] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="settings-outline" size={22} color={TEXT} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Image source={require('../../assets/couple.png')} style={styles.avatar} />
            <TouchableOpacity style={styles.cameraBtn}>
              <Ionicons name="camera" size={14} color={WHITE} />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileDetail}>john.doe@email.com</Text>
            <Text style={styles.profileDetail}>+250 781 234 567</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="pencil-outline" size={14} color={WINE} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* WALLET BALANCE CARD */}
        <TouchableOpacity
          style={styles.walletCard}
          onPress={() => navigation.navigate('Wallet')}
          activeOpacity={0.9}
        >
          <View style={styles.walletTop}>
            <View>
              <Text style={styles.walletLabel}>My Wallet Balance</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.walletBalance}>
                  {balanceVisible ? 'RWF 250,000' : 'RWF ••••••'}
                </Text>
                <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
                  <Ionicons
                    name={balanceVisible ? 'eye-outline' : 'eye-off-outline'}
                    size={20} color={WHITE} style={{ marginLeft: 10 }}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.walletSub}>Available Balance</Text>
            </View>
            <View style={styles.walletRight}>
              <Ionicons name="wallet" size={40} color="rgba(255,255,255,0.4)" />
              <TouchableOpacity style={styles.topUpBtn}>
                <Ionicons name="add" size={14} color={WHITE} />
                <Text style={styles.topUpText}>Top Up</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.walletDivider} />

          <View style={styles.walletActions}>
            <TouchableOpacity style={styles.walletAction}>
              <View style={styles.walletActionIcon}>
                <Ionicons name="arrow-down" size={18} color={WINE} />
              </View>
              <Text style={styles.walletActionText}>Add Money</Text>
            </TouchableOpacity>
            <View style={styles.walletActionDivider} />
            <TouchableOpacity style={styles.walletAction}>
              <View style={styles.walletActionIcon}>
                <Ionicons name="arrow-up" size={18} color={WINE} />
              </View>
              <Text style={styles.walletActionText}>Withdraw</Text>
            </TouchableOpacity>
            <View style={styles.walletActionDivider} />
            <TouchableOpacity
              style={styles.walletAction}
              onPress={() => navigation.navigate('Wallet')}
            >
              <View style={styles.walletActionIcon}>
                <Ionicons name="time-outline" size={18} color={WINE} />
              </View>
              <Text style={styles.walletActionText}>Transaction History</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* WALLET OVERVIEW */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Wallet Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="arrow-down" size={20} color="#1A9E4A" />
              </View>
              <Text style={styles.overviewLabel}>Total In</Text>
              <Text style={[styles.overviewValue, { color: '#1A9E4A' }]}>RWF 550,000</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIcon, { backgroundColor: '#FFE4E9' }]}>
                <Ionicons name="arrow-up" size={20} color={WINE} />
              </View>
              <Text style={styles.overviewLabel}>Total Out</Text>
              <Text style={[styles.overviewValue, { color: WINE }]}>RWF 300,000</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIcon, { backgroundColor: '#EDE7F6' }]}>
                <Ionicons name="card-outline" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.overviewLabel}>Pending</Text>
              <Text style={[styles.overviewValue, { color: '#7C3AED' }]}>RWF 0</Text>
            </View>
          </View>
        </View>

        {/* ACCOUNT & SETTINGS */}
        <Text style={styles.sectionTitle}>Account & Settings</Text>
        <View style={styles.settingsCard}>
          {SETTINGS_ITEMS.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
                <View style={styles.settingsIconBox}>
                  <Ionicons name={item.icon} size={20} color={WINE} />
                </View>
                <View style={styles.settingsInfo}>
                  <Text style={styles.settingsLabel}>{item.label}</Text>
                  <Text style={styles.settingsSub}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={DARK_GREY} />
              </TouchableOpacity>
              {index < SETTINGS_ITEMS.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        {/* INVITE & EARN */}
        <View style={styles.inviteCard}>
          <View style={styles.inviteLeft}>
            <Text style={styles.inviteTitle}>Invite & Earn</Text>
            <Text style={styles.inviteSub}>Invite friends to Contriba and earn rewards</Text>
            <TouchableOpacity style={styles.inviteBtn}>
              <Text style={styles.inviteBtnText}>Invite Friends</Text>
              <Ionicons name="share-social-outline" size={16} color={WINE} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
          <View style={styles.inviteRight}>
            <Ionicons name="gift" size={60} color={WINE} style={{ opacity: 0.15 }} />
          </View>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={WINE} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: WHITE,
    borderBottomWidth: 1, borderBottomColor: LIGHT_GREY,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: LIGHT_GREY,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: TEXT },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },

  // Profile card
  profileCard: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
    backgroundColor: LIGHT_GREY, borderRadius: 16, padding: 14,
  },
  avatarWrapper: { position: 'relative', marginRight: 12 },
  avatar: { width: 70, height: 70, borderRadius: 35 },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: WINE,
    borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 3 },
  profileDetail: { fontSize: 12, color: DARK_GREY, marginBottom: 2 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: WINE, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  editBtnText: { fontSize: 12, fontWeight: '600', color: WINE, marginLeft: 4 },

  // Wallet card
  walletCard: { backgroundColor: WINE, borderRadius: 16, padding: 18, marginBottom: 16 },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  walletBalance: { fontSize: 28, fontWeight: '900', color: WHITE },
  walletSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  walletRight: { alignItems: 'flex-end', gap: 8 },
  topUpBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  topUpText: { fontSize: 12, fontWeight: '600', color: WHITE, marginLeft: 4 },
  walletDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 16 },
  walletActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  walletAction: { alignItems: 'center', gap: 6, flex: 1 },
  walletActionIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  walletActionText: { fontSize: 11, color: WHITE, fontWeight: '600', textAlign: 'center' },
  walletActionDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Overview
  overviewCard: {
    backgroundColor: WHITE, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: MID_GREY, marginBottom: 20,
  },
  overviewTitle: { fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 14 },
  overviewGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  overviewItem: { alignItems: 'center', flex: 1 },
  overviewIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  overviewLabel: { fontSize: 12, color: DARK_GREY, marginBottom: 4 },
  overviewValue: { fontSize: 14, fontWeight: '700' },
  overviewDivider: { width: 1, height: 60, backgroundColor: MID_GREY },

  // Settings
  sectionTitle: { fontSize: 17, fontWeight: '800', color: TEXT, marginBottom: 12 },
  settingsCard: {
    backgroundColor: WHITE, borderRadius: 16, borderWidth: 1,
    borderColor: MID_GREY, marginBottom: 16, overflow: 'hidden',
  },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingsIconBox: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFE4E9',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  settingsInfo: { flex: 1 },
  settingsLabel: { fontSize: 14, fontWeight: '600', color: TEXT },
  settingsSub: { fontSize: 12, color: DARK_GREY, marginTop: 2 },
  rowDivider: { height: 1, backgroundColor: LIGHT_GREY, marginHorizontal: 14 },

  // Invite
  inviteCard: {
    backgroundColor: '#FFF5F7', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: '#FFD6E0',
  },
  inviteLeft: { flex: 1 },
  inviteTitle: { fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 4 },
  inviteSub: { fontSize: 12, color: DARK_GREY, marginBottom: 12, lineHeight: 18 },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: WINE, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start',
  },
  inviteBtnText: { fontSize: 13, fontWeight: '600', color: WINE },
  inviteRight: { marginLeft: 16 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: WINE, borderRadius: 14,
    paddingVertical: 14, marginBottom: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: WINE, marginLeft: 6 },
});