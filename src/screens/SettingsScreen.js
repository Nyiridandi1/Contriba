// src/screens/SettingsScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Switch, Alert, Image, Platform, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { removeToken } from '../api';
import { useTheme } from '../context/ThemeContext';

const WINE       = '#E60012';
const WINE_LIGHT = '#FDF0F3';
const WHITE      = '#FFFFFF';
const GRAY       = '#888888';
const LIGHT_GREY = '#F5F5F5';
const MID_GREY   = '#E0E0E0';
const GREEN      = '#1A9E4A';

const PRIVACY_POLICY = `Last updated: June 2026

INTRODUCTION
Contriba ("we", "our", "us") is a digital event contribution platform built for Rwanda. We are committed to protecting your personal information and your right to privacy.

1. INFORMATION WE COLLECT
We collect the following information when you use Contriba:
- Full name and phone number during registration
- Email address for OTP verification
- Profile photo (optional)
- Event details you create
- Contribution amounts and payment history
- Device push notification tokens

2. HOW WE USE YOUR INFORMATION
We use your information to:
- Create and manage your Contriba account
- Process contributions via MTN MoMo and Airtel Money
- Send OTP verification codes to your email
- Send push notifications about contributions to your events
- Display your name on contributions (unless anonymous)
- Improve our platform and user experience

3. PAYMENT INFORMATION
- Contriba uses Paypack to process MTN MoMo and Airtel Money payments
- We do not store your mobile money PIN or full payment credentials
- Contriba charges a 1% platform fee on all contributions
- All payments go directly to the event owner's mobile money number

4. DATA SHARING
We do NOT sell your personal data to third parties. We may share data with:
- Paypack (payment processing)
- Supabase (secure database hosting)
- Firebase (push notifications)
- Resend (email OTP delivery)

5. DATA SECURITY
- Your data is stored securely on Supabase servers
- All API communications use HTTPS encryption
- Passwords are never stored — we use OTP authentication
- You can contribute anonymously if you prefer privacy

6. YOUR RIGHTS
You have the right to:
- Access your personal data at any time
- Update your profile information
- Delete your account and all associated data
- Opt out of push notifications
- Contribute anonymously to any event

7. ANONYMOUS CONTRIBUTIONS
When you choose to contribute anonymously, your name is hidden from public view. Only the event owner sees the contribution amount.

8. CHILDREN'S PRIVACY
Contriba is not intended for users under 18 years of age.

9. CONTACT US
For privacy concerns, contact us at:
privacy@contriba.rw
support@contriba.rw

Contriba is proudly made in Rwanda.`;

const TERMS_CONDITIONS = `Last updated: June 2026

WELCOME TO CONTRIBA
By using Contriba, you agree to these Terms and Conditions. Please read them carefully.

1. ABOUT CONTRIBA
Contriba is a digital platform that modernizes the traditional Rwandan practice of contributing money at events (Gutwerera). It allows users to:
- Create events (weddings, birthdays, graduations, funerals, church events)
- Share events with friends and family
- Receive and send contributions via MTN MoMo and Airtel Money

2. ELIGIBILITY
- You must be at least 18 years old to use Contriba
- You must have a valid Rwandan phone number
- You must provide accurate registration information

3. PLATFORM FEE
- Contriba charges a 1% fee on all contributions
- This fee is deducted before the event owner receives payment
- Example: RWF 10,000 contribution — Owner receives RWF 9,900

4. PAYMENTS
- All payments are processed through Paypack
- Supported methods: MTN Mobile Money, Airtel Money
- Contriba is not responsible for failed transactions due to insufficient balance
- Refunds are handled on a case-by-case basis

5. EVENT CREATION
- You are responsible for the accuracy of event information
- Private events are only accessible via shared link
- Public events are visible to all Contriba users
- Contriba reserves the right to remove events that violate our policies

6. CONTRIBUTIONS
- All contributions are final and non-refundable unless the event is fraudulent
- Anonymous contributions hide your name from public view
- Contributors receive confirmation via the app

7. PROHIBITED ACTIVITIES
You may NOT use Contriba to:
- Create fraudulent events to collect money
- Impersonate other users or organizations
- Use the platform for money laundering
- Spam other users with fake events
- Violate any Rwandan laws or regulations

8. ACCOUNT TERMINATION
We reserve the right to suspend or terminate accounts that:
- Violate these terms
- Engage in fraudulent activity
- Abuse the platform or other users

9. LIMITATION OF LIABILITY
Contriba is not liable for:
- Failed mobile money transactions
- Losses due to fraudulent events created by other users
- Technical downtime or service interruptions

10. CHANGES TO TERMS
We may update these terms at any time. Continued use of Contriba means you accept the updated terms.

11. GOVERNING LAW
These terms are governed by the laws of the Republic of Rwanda.

12. CONTACT US
For questions about these terms:
legal@contriba.rw
support@contriba.rw

Contriba — Contribute Easily. Smart & Secure.`;

export default function SettingsScreen({ navigation }) {
  const { darkMode, language, toggleDarkMode, changeLanguage, colors } = useTheme();

  const [user, setUser]                             = useState(null);
  const [emailNotifs, setEmailNotifs]               = useState(true);
  const [contributionAlerts, setContributionAlerts] = useState(true);
  const [eventReminders, setEventReminders]         = useState(true);
  const [langModal, setLangModal]                   = useState(false);
  const [privacyModal, setPrivacyModal]             = useState(false);
  const [termsModal, setTermsModal]                 = useState(false);

  const { BG, CARD, TEXT, SUB, BORDER, DIV } = colors;

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  };

  const handleLanguageChange = async (lang) => {
    await changeLanguage(lang);
    setLangModal(false);
    Alert.alert(
      lang === 'Kinyarwanda' ? 'Ururimi rwahinduwe' : 'Language Changed',
      lang === 'Kinyarwanda' ? 'Ubu ukoresheje Kinyarwanda!' : 'App is now in English!'
    );
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          await removeToken();
          await AsyncStorage.removeItem('user');
          navigation.replace('Onboarding');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This will permanently delete your account and all your data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Coming Soon', 'Account deletion will be available soon.') },
    ]);
  };

  const SettingRow = ({ icon, iconBg, iconColor, label, sub, onPress, rightElement, showArrow = true }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.settingIcon, { backgroundColor: iconBg || WINE_LIGHT }]}>
        <Ionicons name={icon} size={20} color={iconColor || WINE} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: TEXT }]}>{label}</Text>
        {sub && <Text style={[styles.settingSub, { color: SUB }]}>{sub}</Text>}
      </View>
      {rightElement || (showArrow && onPress && <Ionicons name="chevron-forward" size={18} color={SUB} />)}
    </TouchableOpacity>
  );

  const SectionTitle = ({ title }) => (
    <Text style={[styles.sectionTitle, { color: SUB }]}>{title}</Text>
  );

  // ✅ Legal Modal with Logo — no emojis
  const LegalModal = ({ visible, onClose, title, content, icon, iconColor, iconBg }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.legalModalBox, { backgroundColor: CARD }]}>

          {/* Wine red logo header */}
          <View style={styles.legalLogoHeader}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.legalLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.legalLogoTitle}>Contriba</Text>
              <Text style={styles.legalLogoSub}>Contribute Easily. Smart & Secure.</Text>
            </View>
          </View>

          {/* Title Row */}
          <View style={[styles.legalModalHeader, { borderBottomColor: BORDER }]}>
            <View style={styles.legalModalTitleRow}>
              <View style={[styles.legalModalIcon, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={20} color={iconColor} />
              </View>
              <Text style={[styles.legalModalTitle, { color: TEXT }]}>{title}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.legalCloseBtn, { backgroundColor: darkMode ? '#2A2A2A' : LIGHT_GREY }]}
            >
              <Ionicons name="close" size={20} color={TEXT} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.legalScrollView}>
            <Text style={[styles.legalContent, { color: TEXT }]}>{content}</Text>
            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Bottom Button */}
          <TouchableOpacity style={styles.legalCloseFooterBtn} onPress={onClose}>
            <Text style={styles.legalCloseFooterText}>
              {language === 'Kinyarwanda' ? 'Nsohoye' : 'I Understand'}
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={CARD} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: CARD, borderBottomColor: BORDER }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: darkMode ? '#2A2A2A' : LIGHT_GREY }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Igenamigambi' : 'Settings'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* PROFILE CARD */}
        <TouchableOpacity style={[styles.profileCard, { backgroundColor: CARD, borderColor: BORDER }]} onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.profileAvatar} />
          ) : (
            <View style={[styles.profileAvatar, { backgroundColor: WINE, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={styles.profileInitials}>{getInitials(user?.name)}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: TEXT }]}>{user?.name || 'Your Name'}</Text>
            <Text style={[styles.profileEmail, { color: SUB }]}>{user?.email || user?.phone || ''}</Text>
            <Text style={styles.profileEdit}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={SUB} />
        </TouchableOpacity>

        {/* ACCOUNT */}
        <SectionTitle title={language === 'Kinyarwanda' ? 'Konti' : 'Account'} />
        <View style={[styles.section, { backgroundColor: CARD, borderColor: BORDER }]}>
          <SettingRow icon="person-outline" iconBg={WINE_LIGHT} iconColor={WINE}
            label={language === 'Kinyarwanda' ? 'Hindura Profili' : 'Edit Profile'}
            sub={language === 'Kinyarwanda' ? 'Vugurura izina, ifoto' : 'Update your name, photo'}
            onPress={() => navigation.navigate('Profile')} />
          <View style={[styles.rowDivider, { backgroundColor: DIV }]} />
          <SettingRow icon="mail-outline" iconBg="#E3F2FD" iconColor="#1877F2"
            label={language === 'Kinyarwanda' ? 'Hindura Imeli' : 'Change Email'}
            sub={user?.email || 'Not set'}
            onPress={() => Alert.alert('Coming Soon', 'Email change will be available soon.')} />
          <View style={[styles.rowDivider, { backgroundColor: DIV }]} />
          <SettingRow icon="call-outline" iconBg="#E8F5E9" iconColor={GREEN}
            label={language === 'Kinyarwanda' ? 'Numero ya Telefoni' : 'Phone Number'}
            sub={user?.phone || 'Not set'}
            onPress={() => Alert.alert('Info', 'Phone number cannot be changed.')} />
          <View style={[styles.rowDivider, { backgroundColor: DIV }]} />
          <SettingRow icon="wallet-outline" iconBg="#EDE7F6" iconColor="#7C3AED"
            label={language === 'Kinyarwanda' ? 'Ubutaka Bwanjye' : 'My Wallet'}
            sub={language === 'Kinyarwanda' ? 'Reba umuvuno & amafaranga' : 'View balance & transactions'}
            onPress={() => navigation.navigate('Wallet')} />
        </View>

        {/* NOTIFICATIONS */}
        <SectionTitle title={language === 'Kinyarwanda' ? 'Impinduka' : 'Notifications'} />
        <View style={[styles.section, { backgroundColor: CARD, borderColor: BORDER }]}>
          <SettingRow icon="mail-outline" iconBg={WINE_LIGHT} iconColor={WINE}
            label={language === 'Kinyarwanda' ? 'Impinduka za Imeli' : 'Email Notifications'}
            sub="OTP and account alerts" showArrow={false}
            rightElement={<Switch value={emailNotifs} onValueChange={setEmailNotifs} trackColor={{ false: MID_GREY, true: WINE }} thumbColor={WHITE} />}
          />
          <View style={[styles.rowDivider, { backgroundColor: DIV }]} />
          <SettingRow icon="heart-outline" iconBg="#FFE4E9" iconColor={WINE}
            label={language === 'Kinyarwanda' ? 'Impinduka z\'Inkunga' : 'Contribution Alerts'}
            sub={language === 'Kinyarwanda' ? 'Iyo umuntu yatanze' : 'When someone contributes'} showArrow={false}
            rightElement={<Switch value={contributionAlerts} onValueChange={setContributionAlerts} trackColor={{ false: MID_GREY, true: WINE }} thumbColor={WHITE} />}
          />
          <View style={[styles.rowDivider, { backgroundColor: DIV }]} />
          <SettingRow icon="calendar-outline" iconBg="#E8F5E9" iconColor={GREEN}
            label={language === 'Kinyarwanda' ? 'Ibiganiro by\'Ibirori' : 'Event Reminders'}
            sub={language === 'Kinyarwanda' ? 'Mbere y\'itariki y\'ikirori' : 'Before your event date'} showArrow={false}
            rightElement={<Switch value={eventReminders} onValueChange={setEventReminders} trackColor={{ false: MID_GREY, true: GREEN }} thumbColor={WHITE} />}
          />
        </View>

        {/* APP SETTINGS */}
        <SectionTitle title={language === 'Kinyarwanda' ? 'Igenamigambi rya App' : 'App Settings'} />
        <View style={[styles.section, { backgroundColor: CARD, borderColor: BORDER }]}>
          <SettingRow
            icon="language-outline" iconBg="#FFF3E0" iconColor="#F59E0B"
            label={language === 'Kinyarwanda' ? 'Ururimi' : 'Language'}
            sub={language}
            onPress={() => setLangModal(true)}
            rightElement={
              <View style={[styles.langBadge, { backgroundColor: darkMode ? '#2A2A2A' : LIGHT_GREY }]}>
                <Text style={[styles.langBadgeText, { color: TEXT }]}>
                  {language === 'English' ? 'EN' : 'RW'}
                </Text>
              </View>
            }
          />
          <View style={[styles.rowDivider, { backgroundColor: DIV }]} />
          <SettingRow
            icon={darkMode ? 'moon' : 'sunny-outline'}
            iconBg={darkMode ? '#1A1A2E' : '#FFF3E0'}
            iconColor={darkMode ? '#7C3AED' : '#F59E0B'}
            label={language === 'Kinyarwanda' ? 'Imiterere' : 'Appearance'}
            sub={darkMode
              ? (language === 'Kinyarwanda' ? 'Ubururu bw\'ijoro' : 'Dark mode')
              : (language === 'Kinyarwanda' ? 'Ubururu bw\'umunsi' : 'Light mode')}
            showArrow={false}
            rightElement={
              <Switch value={darkMode} onValueChange={toggleDarkMode} trackColor={{ false: MID_GREY, true: '#7C3AED' }} thumbColor={WHITE} />
            }
          />
        </View>

        {/* PRIVACY & SECURITY */}
        <SectionTitle title={language === 'Kinyarwanda' ? 'Ibanga & Umutekano' : 'Privacy & Security'} />
        <View style={[styles.section, { backgroundColor: CARD, borderColor: BORDER }]}>
          <SettingRow
            icon="shield-checkmark-outline" iconBg="#E8F5E9" iconColor={GREEN}
            label={language === 'Kinyarwanda' ? 'Politiki y\'Ibanga' : 'Privacy Policy'}
            sub={language === 'Kinyarwanda' ? 'Uburyo tubika amakuru yawe' : 'How we protect your data'}
            onPress={() => setPrivacyModal(true)}
          />
          <View style={[styles.rowDivider, { backgroundColor: DIV }]} />
          <SettingRow
            icon="document-text-outline" iconBg={WINE_LIGHT} iconColor={WINE}
            label={language === 'Kinyarwanda' ? 'Amategeko n\'Amabwiriza' : 'Terms & Conditions'}
            sub={language === 'Kinyarwanda' ? 'Amategeko yacu' : 'Our terms of service'}
            onPress={() => setTermsModal(true)}
          />
          <View style={[styles.rowDivider, { backgroundColor: DIV }]} />
          <SettingRow
            icon="lock-closed-outline" iconBg="#EDE7F6" iconColor="#7C3AED"
            label={language === 'Kinyarwanda' ? 'Umutekano' : 'Security'}
            sub="OTP-based authentication"
            onPress={() => Alert.alert('Security', 'Your account is protected with OTP-based authentication via email. No passwords are stored on our servers.')}
          />
        </View>

        {/* SUPPORT */}
        <SectionTitle title={language === 'Kinyarwanda' ? 'Ubufasha' : 'Support'} />
        <View style={[styles.section, { backgroundColor: CARD, borderColor: BORDER }]}>
          <SettingRow icon="help-circle-outline" iconBg="#FFF3E0" iconColor="#F59E0B"
            label={language === 'Kinyarwanda' ? 'Ikigo cy\'Ubufasha' : 'Help Center'}
            sub="FAQs and guides"
            onPress={() => Alert.alert('Help Center', 'For help, contact us at support@contriba.rw')} />
          <View style={[styles.rowDivider, { backgroundColor: DIV }]} />
          <SettingRow icon="chatbubble-outline" iconBg="#E3F2FD" iconColor="#1877F2"
            label={language === 'Kinyarwanda' ? 'Twandikire' : 'Contact Us'}
            sub="support@contriba.rw"
            onPress={() => Alert.alert('Contact Us', 'Email us at support@contriba.rw\nWe respond within 24 hours.')} />
          <View style={[styles.rowDivider, { backgroundColor: DIV }]} />
          <SettingRow icon="bug-outline" iconBg="#FCE4EC" iconColor={WINE}
            label={language === 'Kinyarwanda' ? 'Tanga Ikibazo' : 'Report a Problem'}
            sub={language === 'Kinyarwanda' ? 'Dufashe kunoza Contriba' : 'Help us improve Contriba'}
            onPress={() => Alert.alert('Report a Problem', 'Email us at bugs@contriba.rw')} />
          <View style={[styles.rowDivider, { backgroundColor: DIV }]} />
          <SettingRow icon="star-outline" iconBg="#FFF3E0" iconColor="#F59E0B"
            label={language === 'Kinyarwanda' ? 'Tuhe Amanota' : 'Rate the App'}
            sub={language === 'Kinyarwanda' ? 'Ukunda Contriba? Tuhe amanota' : 'Love Contriba? Rate us'}
            onPress={() => Alert.alert('Rate Us', 'Thank you for using Contriba! Rating will be available once we launch on App Store & Play Store.')} />
        </View>

        {/* ABOUT */}
        <SectionTitle title={language === 'Kinyarwanda' ? 'Ibyerekeye' : 'About'} />
        <View style={[styles.section, { backgroundColor: CARD, borderColor: BORDER }]}>
          <SettingRow icon="information-circle-outline" iconBg={WINE_LIGHT} iconColor={WINE}
            label={language === 'Kinyarwanda' ? 'Verisiyo y\'Porogaramu' : 'App Version'}
            sub="Version 1.0.0" showArrow={false} />
          <View style={[styles.rowDivider, { backgroundColor: DIV }]} />
          <SettingRow icon="heart" iconBg="#FFE4E9" iconColor={WINE}
            label={language === 'Kinyarwanda' ? 'Yakozwe mu Rwanda' : 'Made with love in Rwanda'}
            sub="Contriba 2026" showArrow={false} />
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={WINE} />
          <Text style={styles.logoutText}>{language === 'Kinyarwanda' ? 'Sohoka' : 'Log Out'}</Text>
        </TouchableOpacity>

        {/* DELETE ACCOUNT */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={18} color={GRAY} />
          <Text style={styles.deleteText}>{language === 'Kinyarwanda' ? 'Siba Konti' : 'Delete Account'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* LANGUAGE MODAL */}
      <Modal visible={langModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: CARD }]}>
            <Text style={[styles.modalTitle, { color: TEXT }]}>
              {language === 'Kinyarwanda' ? 'Hitamo Ururimi' : 'Choose Language'}
            </Text>
            <TouchableOpacity
              style={[styles.langOption, language === 'English' && styles.langOptionActive]}
              onPress={() => handleLanguageChange('English')}
            >
              <View style={[styles.langFlagBox, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="globe-outline" size={24} color="#1877F2" />
              </View>
              <View style={styles.langOptionInfo}>
                <Text style={[styles.langOptionLabel, { color: TEXT }]}>English</Text>
                <Text style={[styles.langOptionSub, { color: SUB }]}>English language</Text>
              </View>
              {language === 'English' && <Ionicons name="checkmark-circle" size={24} color={WINE} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langOption, language === 'Kinyarwanda' && styles.langOptionActive]}
              onPress={() => handleLanguageChange('Kinyarwanda')}
            >
              <View style={[styles.langFlagBox, { backgroundColor: WINE_LIGHT }]}>
                <Ionicons name="globe-outline" size={24} color={WINE} />
              </View>
              <View style={styles.langOptionInfo}>
                <Text style={[styles.langOptionLabel, { color: TEXT }]}>Kinyarwanda</Text>
                <Text style={[styles.langOptionSub, { color: SUB }]}>Ururimi rw'u Rwanda</Text>
              </View>
              {language === 'Kinyarwanda' && <Ionicons name="checkmark-circle" size={24} color={WINE} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setLangModal(false)}>
              <Text style={styles.modalCancelText}>{language === 'Kinyarwanda' ? 'Hagarika' : 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PRIVACY POLICY MODAL */}
      <LegalModal
        visible={privacyModal}
        onClose={() => setPrivacyModal(false)}
        title={language === 'Kinyarwanda' ? 'Politiki y\'Ibanga' : 'Privacy Policy'}
        content={PRIVACY_POLICY}
        icon="shield-checkmark-outline"
        iconColor={GREEN}
        iconBg="#E8F5E9"
      />

      {/* TERMS & CONDITIONS MODAL */}
      <LegalModal
        visible={termsModal}
        onClose={() => setTermsModal(false)}
        title={language === 'Kinyarwanda' ? 'Amategeko n\'Amabwiriza' : 'Terms & Conditions'}
        content={TERMS_CONDITIONS}
        icon="document-text-outline"
        iconColor={WINE}
        iconBg={WINE_LIGHT}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scroll: { paddingTop: Platform.OS === 'android' ? 8 : 0 },
  profileCard: { flexDirection: 'row', alignItems: 'center', margin: 16, borderRadius: 16, padding: 16, gap: 14, borderWidth: 1 },
  profileAvatar: { width: 56, height: 56, borderRadius: 28 },
  profileInitials: { fontSize: 20, fontWeight: '800', color: WHITE },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  profileEmail: { fontSize: 13, marginBottom: 4 },
  profileEdit: { fontSize: 13, color: WINE, fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '700', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  settingSub: { fontSize: 12, marginTop: 2 },
  rowDivider: { height: 1, marginLeft: 64 },
  langBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  langBadgeText: { fontSize: 12, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: WINE_LIGHT, marginHorizontal: 16, marginTop: 20, borderRadius: 14, paddingVertical: 16, borderWidth: 1.5, borderColor: WINE },
  logoutText: { fontSize: 16, fontWeight: '700', color: WINE },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, borderRadius: 14, paddingVertical: 14 },
  deleteText: { fontSize: 14, color: GRAY, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  langOption: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1.5, borderColor: MID_GREY },
  langOptionActive: { borderColor: WINE, backgroundColor: WINE_LIGHT },
  langFlagBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  langOptionInfo: { flex: 1 },
  langOptionLabel: { fontSize: 16, fontWeight: '700' },
  langOptionSub: { fontSize: 13, marginTop: 2 },
  modalCancel: { marginTop: 8, paddingVertical: 14, alignItems: 'center', borderRadius: 14, borderWidth: 1.5, borderColor: MID_GREY },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: GRAY },

  // Legal Modal
  legalModalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  legalLogoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, backgroundColor: WINE, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  legalLogo: { width: 44, height: 44, borderRadius: 10 },
  legalLogoTitle: { fontSize: 18, fontWeight: '800', color: WHITE },
  legalLogoSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  legalModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  legalModalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  legalModalIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  legalModalTitle: { fontSize: 17, fontWeight: '800' },
  legalCloseBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  legalScrollView: { paddingHorizontal: 20, paddingTop: 16 },
  legalContent: { fontSize: 14, lineHeight: 24 },
  legalCloseFooterBtn: { backgroundColor: WINE, margin: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: WINE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  legalCloseFooterText: { color: WHITE, fontSize: 16, fontWeight: '700' },
});