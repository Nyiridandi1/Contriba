// src/screens/SettingsScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Switch, Alert, Image, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { removeToken } from '../api';

const WINE       = '#E60012';
const WINE_LIGHT = '#FDF0F3';
const WHITE      = '#FFFFFF';
const BLACK      = '#1A1A1A';
const GRAY       = '#888888';
const LIGHT_GREY = '#F5F5F5';
const MID_GREY   = '#E0E0E0';
const GREEN      = '#1A9E4A';

export default function SettingsScreen({ navigation }) {
  const [user, setUser]                         = useState(null);
  const [emailNotifs, setEmailNotifs]           = useState(true);
  const [contributionAlerts, setContributionAlerts] = useState(true);
  const [eventReminders, setEventReminders]     = useState(true);
  const [language, setLanguage]                 = useState('English');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await removeToken();
            await AsyncStorage.removeItem('user');
            navigation.replace('Onboarding');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Coming Soon', 'Account deletion will be available soon.') },
      ]
    );
  };

  const toggleLanguage = () => {
    const newLang = language === 'English' ? 'Kinyarwanda' : 'English';
    setLanguage(newLang);
    Alert.alert('Language Changed', `App language set to ${newLang}! 🇷🇼`);
  };

  const SettingRow = ({ icon, iconBg, iconColor, label, sub, onPress, rightElement, showArrow = true }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.settingIcon, { backgroundColor: iconBg || WINE_LIGHT }]}>
        <Ionicons name={icon} size={20} color={iconColor || WINE} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sub && <Text style={styles.settingSub}>{sub}</Text>}
      </View>
      {rightElement || (showArrow && onPress && (
        <Ionicons name="chevron-forward" size={18} color={GRAY} />
      ))}
    </TouchableOpacity>
  );

  const SectionTitle = ({ title }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* PROFILE CARD */}
        <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.profileAvatar} />
          ) : (
            <View style={[styles.profileAvatar, styles.profileAvatarPlaceholder]}>
              <Text style={styles.profileInitials}>{getInitials(user?.name)}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Your Name'}</Text>
            <Text style={styles.profileEmail}>{user?.email || user?.phone || ''}</Text>
            <Text style={styles.profileEdit}>Edit Profile →</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={GRAY} />
        </TouchableOpacity>

        {/* ACCOUNT */}
        <SectionTitle title="Account" />
        <View style={styles.section}>
          <SettingRow
            icon="person-outline"
            iconBg={WINE_LIGHT}
            iconColor={WINE}
            label="Edit Profile"
            sub="Update your name, photo"
            onPress={() => navigation.navigate('Profile')}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="mail-outline"
            iconBg="#E3F2FD"
            iconColor="#1877F2"
            label="Change Email"
            sub={user?.email || 'Not set'}
            onPress={() => Alert.alert('Coming Soon', 'Email change will be available soon.')}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="call-outline"
            iconBg="#E8F5E9"
            iconColor={GREEN}
            label="Phone Number"
            sub={user?.phone || 'Not set'}
            onPress={() => Alert.alert('Info', 'Phone number cannot be changed.')}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="wallet-outline"
            iconBg="#EDE7F6"
            iconColor="#7C3AED"
            label="My Wallet"
            sub="View balance & transactions"
            onPress={() => navigation.navigate('Wallet')}
          />
        </View>

        {/* NOTIFICATIONS */}
        <SectionTitle title="Notifications" />
        <View style={styles.section}>
          <SettingRow
            icon="mail-outline"
            iconBg={WINE_LIGHT}
            iconColor={WINE}
            label="Email Notifications"
            sub="OTP and account alerts"
            showArrow={false}
            rightElement={
              <Switch
                value={emailNotifs}
                onValueChange={setEmailNotifs}
                trackColor={{ false: MID_GREY, true: WINE }}
                thumbColor={WHITE}
              />
            }
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="heart-outline"
            iconBg="#FFE4E9"
            iconColor={WINE}
            label="Contribution Alerts"
            sub="When someone contributes"
            showArrow={false}
            rightElement={
              <Switch
                value={contributionAlerts}
                onValueChange={setContributionAlerts}
                trackColor={{ false: MID_GREY, true: WINE }}
                thumbColor={WHITE}
              />
            }
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="calendar-outline"
            iconBg="#E8F5E9"
            iconColor={GREEN}
            label="Event Reminders"
            sub="Before your event date"
            showArrow={false}
            rightElement={
              <Switch
                value={eventReminders}
                onValueChange={setEventReminders}
                trackColor={{ false: MID_GREY, true: GREEN }}
                thumbColor={WHITE}
              />
            }
          />
        </View>

        {/* APP SETTINGS */}
        <SectionTitle title="App Settings" />
        <View style={styles.section}>
          <SettingRow
            icon="language-outline"
            iconBg="#FFF3E0"
            iconColor="#F59E0B"
            label="Language"
            sub={language}
            onPress={toggleLanguage}
            rightElement={
              <View style={styles.langBadge}>
                <Text style={styles.langBadgeText}>{language === 'English' ? '🇬🇧 EN' : '🇷🇼 RW'}</Text>
              </View>
            }
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="color-palette-outline"
            iconBg="#E3F2FD"
            iconColor="#1877F2"
            label="Appearance"
            sub="Light mode"
            onPress={() => Alert.alert('Coming Soon', 'Dark mode coming soon!')}
          />
        </View>

        {/* PRIVACY & SECURITY */}
        <SectionTitle title="Privacy & Security" />
        <View style={styles.section}>
          <SettingRow
            icon="shield-checkmark-outline"
            iconBg="#E8F5E9"
            iconColor={GREEN}
            label="Privacy Policy"
            sub="How we protect your data"
            onPress={() => Alert.alert('Privacy Policy', 'Contriba respects your privacy and never shares your data with third parties.')}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="document-text-outline"
            iconBg={WINE_LIGHT}
            iconColor={WINE}
            label="Terms & Conditions"
            sub="Our terms of service"
            onPress={() => Alert.alert('Terms & Conditions', 'By using Contriba, you agree to our terms of service. Contriba takes a 2% platform fee on all contributions.')}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="lock-closed-outline"
            iconBg="#EDE7F6"
            iconColor="#7C3AED"
            label="Security"
            sub="OTP-based authentication"
            onPress={() => Alert.alert('Security', 'Your account is protected with OTP-based authentication sent to your registered email.')}
          />
        </View>

        {/* SUPPORT */}
        <SectionTitle title="Support" />
        <View style={styles.section}>
          <SettingRow
            icon="help-circle-outline"
            iconBg="#FFF3E0"
            iconColor="#F59E0B"
            label="Help Center"
            sub="FAQs and guides"
            onPress={() => Alert.alert('Help Center', 'For help, contact us at support@contriba.rw')}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="chatbubble-outline"
            iconBg="#E3F2FD"
            iconColor="#1877F2"
            label="Contact Us"
            sub="support@contriba.rw"
            onPress={() => Alert.alert('Contact Us', 'Email us at support@contriba.rw\nWe respond within 24 hours!')}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="bug-outline"
            iconBg="#FCE4EC"
            iconColor={WINE}
            label="Report a Problem"
            sub="Help us improve Contriba"
            onPress={() => Alert.alert('Report a Problem', 'Email us at bugs@contriba.rw\nThank you for helping us improve!')}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="star-outline"
            iconBg="#FFF3E0"
            iconColor="#F59E0B"
            label="Rate the App"
            sub="Love Contriba? Rate us! ⭐"
            onPress={() => Alert.alert('Rate Us', 'Thank you for using Contriba! Rating will be available when we launch on the App Store.')}
          />
        </View>

        {/* ABOUT */}
        <SectionTitle title="About" />
        <View style={styles.section}>
          <SettingRow
            icon="information-circle-outline"
            iconBg={WINE_LIGHT}
            iconColor={WINE}
            label="App Version"
            sub="Version 1.0.0"
            showArrow={false}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="heart"
            iconBg="#FFE4E9"
            iconColor={WINE}
            label="Made with ❤️ in Rwanda"
            sub="Contriba © 2026 🇷🇼"
            showArrow={false}
          />
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={WINE} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* DELETE ACCOUNT */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={18} color={GRAY} />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: MID_GREY },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: LIGHT_GREY, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: BLACK },
  scroll: { paddingTop: Platform.OS === 'android' ? 8 : 0 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, margin: 16, borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: MID_GREY },
  profileAvatar: { width: 56, height: 56, borderRadius: 28 },
  profileAvatarPlaceholder: { backgroundColor: WINE, justifyContent: 'center', alignItems: 'center' },
  profileInitials: { fontSize: 20, fontWeight: '800', color: WHITE },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '800', color: BLACK, marginBottom: 2 },
  profileEmail: { fontSize: 13, color: GRAY, marginBottom: 4 },
  profileEdit: { fontSize: 13, color: WINE, fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: GRAY, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { backgroundColor: WHITE, marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: MID_GREY, overflow: 'hidden', marginBottom: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: BLACK },
  settingSub: { fontSize: 12, color: GRAY, marginTop: 2 },
  rowDivider: { height: 1, backgroundColor: LIGHT_GREY, marginLeft: 64 },
  langBadge: { backgroundColor: LIGHT_GREY, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  langBadgeText: { fontSize: 12, fontWeight: '700', color: BLACK },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: WINE_LIGHT, marginHorizontal: 16, marginTop: 20, borderRadius: 14, paddingVertical: 16, borderWidth: 1.5, borderColor: WINE },
  logoutText: { fontSize: 16, fontWeight: '700', color: WINE },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, borderRadius: 14, paddingVertical: 14 },
  deleteText: { fontSize: 14, color: GRAY, fontWeight: '500' },
});