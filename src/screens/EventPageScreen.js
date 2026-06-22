// src/screens/EventPageScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, Image, Dimensions, ActivityIndicator,
  Platform, Alert, Modal, TextInput, FlatList, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEvent, getToken } from '../api';
import { useTheme } from '../context/ThemeContext';
import { formatEventDate } from '../utils/formatDate';

const { width, height } = Dimensions.get('window');

const WINE       = '#E50914';
const WINE_LIGHT = '#FDF0F3';
const WHITE      = '#FFFFFF';
const BLACK      = '#1A1A1A';
const GREEN      = '#1A9E4A';

const BASE_URL = 'https://contriba-backend-production.up.railway.app';

export default function EventPageScreen({ navigation, route }) {
  const { darkMode, language, colors } = useTheme();
  const { BG, CARD, TEXT, SUB, BORDER, DIV } = colors;

  const eventParam = route?.params?.event;
  const [event, setEvent]             = useState(eventParam);
  const [loading, setLoading]         = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editModal, setEditModal]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const [comments, setComments]               = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText]         = useState('');
  const [commenterName, setCommenterName]     = useState('');
  const [isAnonymous, setIsAnonymous]         = useState(false);
  const [sendingComment, setSendingComment]   = useState(false);

  const [editTitle, setEditTitle]               = useState('');
  const [editLocation, setEditLocation]         = useState('');
  const [editDescription, setEditDescription]   = useState('');
  const [editGoalAmount, setEditGoalAmount]     = useState('');
  const [editOwnerPhone, setEditOwnerPhone]     = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('mtn');

  useEffect(() => {
    loadUser();
    if (eventParam?.id) {
      loadEvent();
      loadComments();
    }
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      setCommenterName(user.name || '');
    }
  };

  const loadEvent = async () => {
    try {
      setLoading(true);
      const result = await getEvent(eventParam.id);
      if (result.success) setEvent(result.event);
    } catch (error) {
      console.error('Load event error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await fetch(`${BASE_URL}/api/comments/${eventParam.id}`);
      const result = await response.json();
      if (result.success) setComments(result.comments || []);
    } catch (error) {
      console.error('Load comments error:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      const response = await fetch(`${BASE_URL}/api/comments/${event.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: commentText.trim(),
          name: isAnonymous ? 'Anonymous' : (commenterName || 'Guest'),
          is_anonymous: isAnonymous,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setComments([result.comment, ...comments]);
        setCommentText('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send comment');
    } finally {
      setSendingComment(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return language === 'Kinyarwanda' ? 'Nonaha' : 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOwner = currentUser?.id === event?.owner_id;
  const formatAmount = (val) => 'RWF ' + (val || 0).toLocaleString();
  const progress = event?.goal_amount > 0
    ? Math.min((event?.total_raised || 0) / event?.goal_amount, 1) : 0;
  const percent = Math.round(progress * 100);

  const getPhotos = () => {
    const photos = [];
    if (event?.cover_image) photos.push(event.cover_image);
    if (event?.photo2_url) photos.push(event.photo2_url);
    if (event?.photo3_url) photos.push(event.photo3_url);
    if (event?.photo4_url) photos.push(event.photo4_url);
    if (photos.length === 0) photos.push(null);
    return photos;
  };

  const photos = getPhotos();

  const handleEdit = () => {
    setEditTitle(event?.title || '');
    setEditLocation(event?.location || '');
    setEditDescription(event?.description || '');
    setEditGoalAmount(event?.goal_amount?.toString() || '');
    setEditOwnerPhone(event?.owner_phone || '');
    setEditPaymentMethod(event?.owner_payment_method || 'mtn');
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle) { Alert.alert('Error', 'Event title is required'); return; }
    setSaving(true);
    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: editTitle, location: editLocation, description: editDescription,
          goal_amount: editGoalAmount ? parseInt(editGoalAmount) : 0,
          owner_phone: editOwnerPhone, owner_payment_method: editPaymentMethod,
          type: event.type, date: event.date,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setEvent({ ...event, title: editTitle, location: editLocation, description: editDescription, goal_amount: editGoalAmount ? parseInt(editGoalAmount) : 0, owner_phone: editOwnerPhone, owner_payment_method: editPaymentMethod });
        setEditModal(false);
        // ✅ No emoji in alert
        Alert.alert('Success', 'Event updated successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to update event');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Event', `Are you sure you want to delete "${event?.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const token = await getToken();
            const response = await fetch(`${BASE_URL}/api/events/${event.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` },
            });
            const result = await response.json();
            if (result.success) {
              // ✅ No emoji in alert
              Alert.alert('Deleted', 'Event deleted successfully.', [
                { text: 'OK', onPress: () => navigation.navigate('Home') },
              ]);
            } else {
              Alert.alert('Error', result.message || 'Failed to delete event');
            }
          } catch (error) {
            Alert.alert('Error', 'Something went wrong.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Photo Carousel */}
          <View style={styles.heroWrapper}>
            <View style={{ width, height: height * 0.48 }}>
              <FlatList
                data={photos}
                keyExtractor={(_, index) => index.toString()}
                horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / width);
                  setActivePhotoIndex(index);
                }}
                renderItem={({ item }) => (
                  <TouchableOpacity activeOpacity={1} onPress={() => setShowControls(!showControls)} style={{ width, height: height * 0.48 }}>
                    {item ? (
                      <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
                    ) : (
                      <Image source={require('../../assets/couple.png')} style={styles.heroImage} resizeMode="cover" />
                    )}
                    <View style={styles.heroOverlay} />
                  </TouchableOpacity>
                )}
              />
            </View>

            {photos.length > 1 && (
              <View style={styles.dotsContainer}>
                {photos.map((_, index) => (
                  <View key={index} style={[styles.dot, index === activePhotoIndex ? styles.dotActive : styles.dotInactive]} />
                ))}
              </View>
            )}

            {showControls && (
              <>
                {photos.length > 1 && (
                  <View style={styles.photoCountBadge}>
                    <Ionicons name="images-outline" size={12} color={WHITE} />
                    <Text style={styles.photoCountText}>{activePhotoIndex + 1}/{photos.length}</Text>
                  </View>
                )}
                <View style={styles.heroTop}>
                  <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color={BLACK} />
                  </TouchableOpacity>
                  <View style={styles.heroTopRight}>
                    {isOwner && (
                      <>
                        <TouchableOpacity style={styles.heroBtn} onPress={handleEdit}>
                          <Ionicons name="pencil-outline" size={20} color={BLACK} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.heroBtn, { backgroundColor: '#FFE4E4' }]} onPress={handleDelete}>
                          <Ionicons name="trash-outline" size={20} color={WINE} />
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.navigate('ShareEvent', { event })}>
                      <Ionicons name="share-social-outline" size={20} color={BLACK} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.typeBadge}>
                  <Ionicons name={
                    event?.type === 'Wedding'    ? 'heart' :
                    event?.type === 'Birthday'   ? 'gift' :
                    event?.type === 'Graduation' ? 'school' :
                    event?.type === 'Church'     ? 'sunny' :
                    event?.type === 'Funeral'    ? 'flower' :
                    'calendar'
                  } size={12} color={WHITE} />
                  <Text style={styles.typeBadgeText}>{event?.type || 'Event'}</Text>
                </View>
                {isOwner && (
                  <View style={styles.ownerBadge}>
                    <Ionicons name="ribbon-outline" size={12} color={WHITE} />
                    <Text style={styles.ownerBadgeText}>
                      {language === 'Kinyarwanda' ? 'Ikirori Cyawe' : 'Your Event'}
                    </Text>
                  </View>
                )}
                <View style={styles.heroInfo}>
                  <Text style={styles.heroName}>{event?.title || 'Event'}</Text>
                  <View style={styles.heroMetaRow}>
                    <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.heroDate}>{formatEventDate(event?.date)}</Text>
                    {event?.location && (
                      <>
                        <Text style={styles.heroDot}>•</Text>
                        <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.heroDate}>{event.location}</Text>
                      </>
                    )}
                  </View>
                  {event?.description && <Text style={styles.heroQuote}>"{event.description}"</Text>}
                </View>
                <View style={styles.tapHint}>
                  <Text style={styles.tapHintText}>
                    {language === 'Kinyarwanda' ? 'Kanda guhisha • Shusha amafoto' : 'Tap to hide • Swipe for photos'}
                  </Text>
                </View>
              </>
            )}

            {!showControls && (
              <TouchableOpacity style={[styles.heroBtn, styles.backBtnAlways]} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={20} color={BLACK} />
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          <View style={[styles.content, { backgroundColor: BG }]}>
            {loading ? (
              <ActivityIndicator color={WINE} size="large" style={{ marginVertical: 20 }} />
            ) : (
              <>
                {isOwner && (
                  <View style={styles.ownerActions}>
                    <TouchableOpacity style={styles.ownerActionBtn} onPress={handleEdit}>
                      <Ionicons name="pencil-outline" size={18} color={WINE} />
                      <Text style={styles.ownerActionText}>
                        {language === 'Kinyarwanda' ? 'Hindura' : 'Edit Event'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.ownerActionBtn, styles.ownerDeleteBtn]} onPress={handleDelete}>
                      <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                      <Text style={[styles.ownerActionText, { color: '#FF3B30' }]}>
                        {language === 'Kinyarwanda' ? 'Siba' : 'Delete Event'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Amount raised */}
                <View style={styles.amountSection}>
                  <View style={styles.amountRow}>
                    <View>
                      <Text style={styles.amountRaised}>{formatAmount(event?.total_raised)}</Text>
                      <Text style={[styles.amountGoal, { color: SUB }]}>
                        {language === 'Kinyarwanda' ? 'byakomejwe mu' : 'raised of'} {formatAmount(event?.goal_amount)} {language === 'Kinyarwanda' ? 'intego' : 'goal'}
                      </Text>
                    </View>
                    <View style={styles.percentBadge}>
                      <Text style={styles.percentText}>{percent}%</Text>
                    </View>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: darkMode ? '#3A1A20' : '#F0D0D8' }]}>
                    <View style={[styles.progressFill, { width: `${percent}%` }]} />
                  </View>
                </View>

                {/* Live Feed */}
                <TouchableOpacity style={[styles.liveFeedBtn, { backgroundColor: CARD }]} onPress={() => navigation.navigate('LiveFeed', { event })} activeOpacity={0.85}>
                  <View style={styles.liveDotContainer}><View style={styles.liveDot} /></View>
                  <View style={styles.liveFeedInfo}>
                    <Text style={[styles.liveFeedTitle, { color: TEXT }]}>
                      {language === 'Kinyarwanda' ? 'Ikiganiro Giheruka' : 'Live Contribution Feed'}
                    </Text>
                    <Text style={[styles.liveFeedSub, { color: SUB }]}>
                      {event?.total_contributors || 0} {language === 'Kinyarwanda' ? 'batanze • Kanda kureba' : 'people contributed • Tap to see live updates'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={WINE} />
                </TouchableOpacity>

                {/* Contribute card */}
                <View style={[styles.contributeCard, { backgroundColor: darkMode ? '#2A0A0F' : WINE_LIGHT }]}>
                  <View style={[styles.contributeIconBox, { backgroundColor: CARD }]}>
                    <Ionicons name="heart" size={24} color={WINE} />
                  </View>
                  <View style={styles.contributeText}>
                    <Text style={[styles.contributeTitle, { color: TEXT }]}>
                      {language === 'Kinyarwanda' ? 'Tanga inkunga ku ibyishimo byacu' : 'Contribute to our happiness'}
                    </Text>
                    <Text style={[styles.contributeSubtitle, { color: SUB }]}>
                      {language === 'Kinyarwanda' ? 'Urukundo rwawe ruradukomeza.' : 'Your love and support mean the world to us.'}
                    </Text>
                  </View>
                </View>

                {/* Event details */}
                <View style={[styles.detailsCard, { borderColor: BORDER, backgroundColor: CARD }]}>
                  {[
                    { icon: 'calendar-outline', label: language === 'Kinyarwanda' ? 'Itariki y\'Ikirori' : 'Event Date',    value: formatEventDate(event?.date) || 'TBD' },
                    { icon: 'people-outline',   label: language === 'Kinyarwanda' ? 'Ubwoko bw\'Ikirori' : 'Event Type',   value: event?.type || 'Event' },
                    { icon: 'location-outline', label: language === 'Kinyarwanda' ? 'Aho Bizabera' : 'Location',          value: event?.location || 'Kigali, Rwanda' },
                    { icon: 'flag-outline',     label: language === 'Kinyarwanda' ? 'Intego y\'Amafaranga' : 'Goal Amount', value: formatAmount(event?.goal_amount) },
                  ].map((item, i, arr) => (
                    <View key={i}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailIconBox}>
                          <Ionicons name={item.icon} size={20} color={WINE} />
                        </View>
                        <View>
                          <Text style={[styles.detailLabel, { color: SUB }]}>{item.label}</Text>
                          <Text style={[styles.detailValue, { color: TEXT }]}>{item.value}</Text>
                        </View>
                      </View>
                      {i < arr.length - 1 && <View style={[styles.detailDivider, { backgroundColor: BORDER }]} />}
                    </View>
                  ))}
                </View>

                {/* Creator Card */}
                {event?.creator && (
                  <View style={[styles.creatorCard, { backgroundColor: CARD, borderColor: BORDER }]}>
                    <View style={styles.creatorHeader}>
                      <Ionicons name="person-circle-outline" size={20} color={WINE} />
                      <Text style={[styles.creatorHeaderTitle, { color: TEXT }]}>Event Organizer</Text>
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="shield-checkmark" size={12} color={WHITE} />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    </View>
                    <View style={[styles.creatorDivider, { backgroundColor: BORDER }]} />
                    <View style={styles.creatorBody}>
                      {event.creator.avatar_url ? (
                        <Image source={{ uri: event.creator.avatar_url }} style={styles.creatorAvatar} />
                      ) : (
                        <View style={[styles.creatorAvatar, styles.creatorAvatarPlaceholder]}>
                          <Text style={styles.creatorAvatarText}>
                            {getInitials(event.creator.name)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.creatorInfo}>
                        <Text style={[styles.creatorName, { color: TEXT }]}>
                          {event.creator.name || 'Unknown'}
                        </Text>
                        {/* ✅ No emoji — use icon */}
                        <View style={styles.creatorRoleRow}>
                          <Ionicons name="ribbon-outline" size={13} color={SUB} />
                          <Text style={[styles.creatorRole, { color: SUB }]}>Event Organizer</Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.creatorDivider, { marginTop: 12, backgroundColor: BORDER }]} />
                    <View style={styles.creatorContacts}>
                      <View style={styles.creatorContactRow}>
                        <View style={[styles.creatorContactIcon, { backgroundColor: '#E8F5E9' }]}>
                          <Ionicons name="call-outline" size={16} color={GREEN} />
                        </View>
                        <View>
                          <Text style={[styles.creatorContactLabel, { color: SUB }]}>Phone Number</Text>
                          <Text style={[styles.creatorContactValue, { color: TEXT }]}>
                            {event.creator.phone || event.owner_phone || 'Not provided'}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.creatorDivider, { marginVertical: 8, backgroundColor: BORDER }]} />
                      <View style={styles.creatorContactRow}>
                        <View style={[styles.creatorContactIcon, { backgroundColor: '#E3F2FD' }]}>
                          <Ionicons name="location-outline" size={16} color="#1877F2" />
                        </View>
                        <View>
                          <Text style={[styles.creatorContactLabel, { color: SUB }]}>Location</Text>
                          <Text style={[styles.creatorContactValue, { color: TEXT }]}>
                            {event.location || 'Kigali, Rwanda'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Contributors */}
                <TouchableOpacity style={styles.contributorsRow} activeOpacity={0.8} onPress={() => navigation.navigate('LiveFeed', { event })}>
                  <View style={styles.avatarStack}>
                    {[0, 1, 2, 3].map((i) => (
                      <View key={i} style={[styles.avatarCircle, { marginLeft: i === 0 ? 0 : -12, backgroundColor: darkMode ? '#2A0A0F' : WINE_LIGHT }]}>
                        {/* ✅ No emoji — use icon */}
                        <Ionicons name="person" size={16} color={WINE} />
                      </View>
                    ))}
                  </View>
                  <View style={styles.contributorsInfo}>
                    <Text style={[styles.contributorsCount, { color: TEXT }]}>
                      {event?.total_contributors || 0} {language === 'Kinyarwanda' ? 'Abakunzi' : 'Contributors'}
                    </Text>
                    <Text style={[styles.contributorsSub, { color: SUB }]}>
                      {language === 'Kinyarwanda' ? 'Kanda kureba!' : 'Tap to see who contributed!'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={SUB} />
                </TouchableOpacity>

                {/* COMMENTS SECTION */}
                <View style={styles.commentsSection}>
                  <View style={styles.commentsSectionHeader}>
                    <Ionicons name="chatbubbles-outline" size={20} color={TEXT} />
                    <Text style={[styles.commentsSectionTitle, { color: TEXT }]}>
                      {language === 'Kinyarwanda' ? `Ibitekerezo (${comments.length})` : `Comments (${comments.length})`}
                    </Text>
                    <TouchableOpacity onPress={loadComments}>
                      <Ionicons name="refresh-outline" size={18} color={SUB} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.commentInputBox, { backgroundColor: darkMode ? '#1A1A1A' : '#F9F9F9', borderColor: BORDER }]}>
                    <View style={styles.commentNameRow}>
                      <TextInput
                        style={[styles.commentNameInput, { borderColor: BORDER, color: TEXT, backgroundColor: CARD }]}
                        placeholder={language === 'Kinyarwanda' ? 'Izina ryawe' : 'Your name'}
                        placeholderTextColor="#BBBBBB"
                        value={isAnonymous ? 'Anonymous' : commenterName}
                        onChangeText={setCommenterName}
                        editable={!isAnonymous}
                      />
                      {/* ✅ Anonymous button — no emoji */}
                      <TouchableOpacity
                        style={[styles.anonBtn, { borderColor: BORDER }, isAnonymous && styles.anonBtnActive]}
                        onPress={() => setIsAnonymous(!isAnonymous)}
                      >
                        <Ionicons
                          name={isAnonymous ? 'eye-off-outline' : 'eye-outline'}
                          size={14}
                          color={isAnonymous ? WINE : SUB}
                        />
                        <Text style={[styles.anonBtnText, { color: SUB }, isAnonymous && styles.anonBtnTextActive]}>
                          {language === 'Kinyarwanda' ? 'Nta izina' : 'Anon'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.commentRow}>
                      <TextInput
                        style={[styles.commentInput, { borderColor: BORDER, color: TEXT, backgroundColor: CARD }]}
                        placeholder={language === 'Kinyarwanda' ? 'Andika igitekerezo...' : 'Write a comment...'}
                        placeholderTextColor="#BBBBBB"
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                        maxLength={300}
                      />
                      <TouchableOpacity
                        style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
                        onPress={handleSendComment}
                        disabled={!commentText.trim() || sendingComment}
                      >
                        {sendingComment ? (
                          <ActivityIndicator color={WHITE} size="small" />
                        ) : (
                          <Ionicons name="send" size={18} color={WHITE} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {commentsLoading ? (
                    <ActivityIndicator color={WINE} style={{ marginVertical: 20 }} />
                  ) : comments.length === 0 ? (
                    <View style={styles.emptyComments}>
                      <Ionicons name="chatbubble-outline" size={36} color={SUB} />
                      <Text style={[styles.emptyCommentsText, { color: TEXT }]}>
                        {language === 'Kinyarwanda' ? 'Nta bitekerezo nawe' : 'No comments yet'}
                      </Text>
                      <Text style={[styles.emptyCommentsSub, { color: SUB }]}>
                        {language === 'Kinyarwanda' ? 'Banza gutanga ubutumwa!' : 'Be the first to leave a message!'}
                      </Text>
                    </View>
                  ) : (
                    comments.map((comment, index) => (
                      <View key={comment.id || index} style={styles.commentItem}>
                        {/* ✅ No emoji in avatar */}
                        <View style={[styles.commentAvatar, { backgroundColor: darkMode ? '#2A0A0F' : WINE_LIGHT }]}>
                          {comment.is_anonymous ? (
                            <Ionicons name="eye-off-outline" size={16} color={WINE} />
                          ) : (
                            <Text style={styles.commentAvatarText}>
                              {comment.name?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                          )}
                        </View>
                        <View style={[styles.commentContent, { backgroundColor: darkMode ? '#1A1A1A' : '#F9F9F9' }]}>
                          <View style={styles.commentHeader}>
                            <Text style={[styles.commentName, { color: TEXT }]}>
                              {comment.is_anonymous ? 'Anonymous' : comment.name}
                            </Text>
                            <Text style={[styles.commentTime, { color: SUB }]}>{formatTime(comment.created_at)}</Text>
                          </View>
                          <Text style={[styles.commentMessage, { color: TEXT }]}>{comment.message}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
            <View style={{ height: 200 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom buttons */}
      <View style={[styles.bottomBar, { backgroundColor: CARD, borderTopColor: BORDER }]}>
        {/* ✅ No emoji in contribute button */}
        <TouchableOpacity style={styles.contributeBtn} onPress={() => navigation.navigate('Contribute', { event })} activeOpacity={0.85}>
          <Ionicons name="heart" size={20} color={WHITE} />
          <Text style={styles.contributeBtnText}>
            {language === 'Kinyarwanda' ? 'Tanga Inkunga' : 'Contribute'}
          </Text>
        </TouchableOpacity>
        <View style={styles.bottomActions}>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: BORDER }]} activeOpacity={0.8} onPress={() => navigation.navigate('LiveFeed', { event })}>
            <View style={styles.liveSmallDot} />
            <Text style={styles.actionBtnText}>
              {language === 'Kinyarwanda' ? 'Ikiganiro' : 'Live Feed'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: BORDER }]} activeOpacity={0.8} onPress={() => navigation.navigate('ShareEvent', { event })}>
            <Ionicons name="share-social-outline" size={18} color={WINE} />
            <Text style={styles.actionBtnText}>
              {language === 'Kinyarwanda' ? 'Sangira' : 'Share'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* EDIT MODAL */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={[styles.modalBox, { backgroundColor: CARD }]}>
              <View style={styles.modalHeader}>
                {/* ✅ No emoji in modal title */}
                <Text style={[styles.modalTitle, { color: TEXT }]}>
                  {language === 'Kinyarwanda' ? 'Hindura Ikirori' : 'Edit Event'}
                </Text>
                <TouchableOpacity onPress={() => setEditModal(false)}>
                  <Ionicons name="close" size={24} color={TEXT} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.modalLabel, { color: TEXT }]}>Event Title *</Text>
              <TextInput style={[styles.modalInput, { borderColor: BORDER, color: TEXT, backgroundColor: BG }]} value={editTitle} onChangeText={setEditTitle} placeholder="Event title" placeholderTextColor="#BBBBBB" />
              <Text style={[styles.modalLabel, { color: TEXT }]}>Location</Text>
              <TextInput style={[styles.modalInput, { borderColor: BORDER, color: TEXT, backgroundColor: BG }]} value={editLocation} onChangeText={setEditLocation} placeholder="Kigali, Rwanda" placeholderTextColor="#BBBBBB" />
              <Text style={[styles.modalLabel, { color: TEXT }]}>Description</Text>
              <TextInput style={[styles.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 12, borderColor: BORDER, color: TEXT, backgroundColor: BG }]} value={editDescription} onChangeText={setEditDescription} placeholder="Tell guests about your event" placeholderTextColor="#BBBBBB" multiline />
              <Text style={[styles.modalLabel, { color: TEXT }]}>Goal Amount (RWF)</Text>
              <TextInput style={[styles.modalInput, { borderColor: BORDER, color: TEXT, backgroundColor: BG }]} value={editGoalAmount} onChangeText={setEditGoalAmount} placeholder="10000000" placeholderTextColor="#BBBBBB" keyboardType="numeric" />
              <Text style={[styles.modalLabel, { color: TEXT }]}>Your Phone (for payments)</Text>
              <TextInput style={[styles.modalInput, { borderColor: BORDER, color: TEXT, backgroundColor: BG }]} value={editOwnerPhone} onChangeText={setEditOwnerPhone} placeholder="0781 234 567" placeholderTextColor="#BBBBBB" keyboardType="phone-pad" />
              <Text style={[styles.modalLabel, { color: TEXT }]}>Payment Method</Text>
              <View style={styles.paymentRow}>
                {['mtn', 'airtel'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[styles.paymentOption, { borderColor: BORDER }, editPaymentMethod === method && styles.paymentOptionActive]}
                    onPress={() => setEditPaymentMethod(method)}
                  >
                    <Ionicons name="phone-portrait-outline" size={16} color={editPaymentMethod === method ? WINE : SUB} />
                    <Text style={[styles.paymentOptionText, { color: SUB }, editPaymentMethod === method && { color: WINE }]}>
                      {method === 'mtn' ? 'MTN MoMo' : 'Airtel Money'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalBtns}>
                <TouchableOpacity style={[styles.modalCancel, { borderColor: BORDER }]} onPress={() => setEditModal(false)}>
                  <Text style={[styles.modalCancelText, { color: SUB }]}>
                    {language === 'Kinyarwanda' ? 'Hagarika' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={handleSaveEdit} disabled={saving}>
                  {saving ? <ActivityIndicator color={WHITE} size="small" /> : (
                    <Text style={styles.modalSaveText}>
                      {language === 'Kinyarwanda' ? 'Bika Impinduka' : 'Save Changes'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroWrapper: { width, height: height * 0.48, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '%', backgroundColor: 'rgba(0,0,0,0.5)' },
  heroTop: { position: 'absolute', top: Platform.OS === 'android' ? 40 : 48, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTopRight: { flexDirection: 'row', gap: 10 },
  heroBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  backBtnAlways: { position: 'absolute', top: Platform.OS === 'android' ? 40 : 48, left: 16 },
  typeBadge: { position: 'absolute', top: Platform.OS === 'android' ? 100 : 110, left: 20, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: WINE, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: WHITE },
  ownerBadge: { position: 'absolute', top: Platform.OS === 'android' ? 100 : 110, right: 20, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  ownerBadgeText: { fontSize: 11, fontWeight: '700', color: WHITE },
  heroInfo: { position: 'absolute', bottom: 40, left: 20, right: 20 },
  heroName: { fontSize: 28, fontWeight: '800', color: WHITE, marginBottom: 6 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8, flexWrap: 'wrap' },
  heroDate: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  heroDot: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  heroQuote: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' },
  tapHint: { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' },
  tapHintText: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  dotsContainer: { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 20, backgroundColor: WHITE },
  dotInactive: { width: 6, backgroundColor: 'rgba(255,255,255,0.5)' },
  photoCountBadge: { position: 'absolute', top: Platform.OS === 'android' ? 40 : 48, alignSelf: 'center', left: '40%', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  photoCountText: { fontSize: 11, fontWeight: '700', color: WHITE },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  ownerActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  ownerActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: WINE_LIGHT, borderRadius: 12, paddingVertical: 12, borderWidth: 1.5, borderColor: WINE },
  ownerDeleteBtn: { backgroundColor: '#FFF0F0', borderColor: '#FF3B30' },
  ownerActionText: { fontSize: 14, fontWeight: '700', color: WINE },
  amountSection: { marginBottom: 16 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  amountRaised: { fontSize: 26, fontWeight: '800', color: WINE, marginBottom: 4 },
  amountGoal: { fontSize: 14 },
  percentBadge: { backgroundColor: WINE_LIGHT, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: WINE },
  percentText: { fontSize: 16, fontWeight: '800', color: WINE },
  progressBar: { height: 8, borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: WINE, borderRadius: 4 },
  liveFeedBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1.5, borderColor: GREEN, gap: 12, shadowColor: GREEN, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  liveDotContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  liveDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: GREEN },
  liveFeedInfo: { flex: 1 },
  liveFeedTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  liveFeedSub: { fontSize: 12 },
  liveSmallDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  contributeCard: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 16, gap: 14, alignItems: 'flex-start' },
  contributeIconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  contributeText: { flex: 1 },
  contributeTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  contributeSubtitle: { fontSize: 13, lineHeight: 20 },
  detailsCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  detailIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: WINE_LIGHT, justifyContent: 'center', alignItems: 'center' },
  detailDivider: { height: 1, marginVertical: 4 },
  detailLabel: { fontSize: 12, marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '700' },
  creatorCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  creatorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  creatorHeaderTitle: { fontSize: 15, fontWeight: '800', flex: 1 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GREEN, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  verifiedText: { fontSize: 10, fontWeight: '700', color: WHITE },
  creatorDivider: { height: 1, marginVertical: 4 },
  creatorBody: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  creatorAvatar: { width: 56, height: 56, borderRadius: 28 },
  creatorAvatarPlaceholder: { backgroundColor: WINE, justifyContent: 'center', alignItems: 'center' },
  creatorAvatarText: { fontSize: 20, fontWeight: '800', color: WHITE },
  creatorInfo: { flex: 1 },
  creatorName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  creatorRoleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  creatorRole: { fontSize: 13 },
  creatorContacts: { marginTop: 4 },
  creatorContactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  creatorContactIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  creatorContactLabel: { fontSize: 11, marginBottom: 2 },
  creatorContactValue: { fontSize: 14, fontWeight: '600' },
  contributorsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8, marginBottom: 16 },
  avatarStack: { flexDirection: 'row' },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: WHITE },
  contributorsInfo: { flex: 1 },
  contributorsCount: { fontSize: 15, fontWeight: '700' },
  contributorsSub: { fontSize: 12, marginTop: 2 },
  commentsSection: { marginBottom: 20 },
  commentsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  commentsSectionTitle: { fontSize: 17, fontWeight: '800', flex: 1 },
  commentInputBox: { borderRadius: 16, padding: 12, marginBottom: 16, borderWidth: 1 },
  commentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  commentNameInput: { flex: 1, fontSize: 13, fontWeight: '600', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  anonBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  anonBtnActive: { borderColor: WINE, backgroundColor: WINE_LIGHT },
  anonBtnText: { fontSize: 12, fontWeight: '600' },
  anonBtnTextActive: { color: WINE },
  commentRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  commentInput: { flex: 1, fontSize: 14, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, maxHeight: 80 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: WINE, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#CCCCCC' },
  emptyComments: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  emptyCommentsText: { fontSize: 15, fontWeight: '700' },
  emptyCommentsSub: { fontSize: 13 },
  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  commentAvatarText: { fontSize: 14, fontWeight: '800', color: WINE },
  commentContent: { flex: 1, borderRadius: 14, padding: 10 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentName: { fontSize: 13, fontWeight: '700' },
  commentTime: { fontSize: 11 },
  commentMessage: { fontSize: 13, lineHeight: 20 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: Platform.OS === 'android' ? 20 : 30, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  contributeBtn: { backgroundColor: WINE, borderRadius: 14, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: WINE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7 },
  contributeBtnText: { color: WHITE, fontSize: 17, fontWeight: '700' },
  bottomActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, borderWidth: 1.5 },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: WINE },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  modalInput: { borderWidth: 1.5, borderRadius: 14, height: 54, paddingHorizontal: 16, fontSize: 15, marginBottom: 16 },
  paymentRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  paymentOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12 },
  paymentOptionActive: { borderColor: WINE, backgroundColor: WINE_LIGHT },
  paymentOptionText: { fontSize: 13, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancel: { flex: 1, borderWidth: 1.5, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600' },
  modalSave: { flex: 1, backgroundColor: WINE, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: WHITE },
});