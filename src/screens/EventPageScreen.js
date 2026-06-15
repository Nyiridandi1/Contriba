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

const { width, height } = Dimensions.get('window');

const WINE       = '#E60012';
const WINE_LIGHT = '#FDF0F3';
const WHITE      = '#FFFFFF';
const BLACK      = '#1A1A1A';
const GRAY       = '#888888';
const BORDER     = '#F0F0F0';
const GREEN      = '#1A9E4A';

const BASE_URL = 'https://contriba-backend-production.up.railway.app';

export default function EventPageScreen({ navigation, route }) {
  const eventParam = route?.params?.event;
  const [event, setEvent]             = useState(eventParam);
  const [loading, setLoading]         = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editModal, setEditModal]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // ✅ Comments state
  const [comments, setComments]           = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText]     = useState('');
  const [commenterName, setCommenterName] = useState('');
  const [isAnonymous, setIsAnonymous]     = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

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

  // ✅ Load comments
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

  // ✅ Send comment
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
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
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
        Alert.alert('Success! ✅', 'Event updated successfully!');
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
    Alert.alert('Delete Event', `Are you sure you want to delete "${event?.title}"? This cannot be undone.`,
      [
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
                Alert.alert('Deleted! 🗑️', 'Event deleted successfully!', [
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
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* ✅ Swipeable Photo Carousel */}
          <View style={styles.heroWrapper}>
            <View style={{ width, height: height * 0.48 }}>
              <FlatList
                data={photos}
                keyExtractor={(_, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / width);
                  setActivePhotoIndex(index);
                }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowControls(!showControls)}
                    style={{ width, height: height * 0.48 }}
                  >
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
                  <Ionicons name={event?.type === 'Wedding' ? 'heart' : event?.type === 'Birthday' ? 'gift' : 'calendar'} size={12} color={WHITE} />
                  <Text style={styles.typeBadgeText}>{event?.type || 'Event'}</Text>
                </View>
                {isOwner && (
                  <View style={styles.ownerBadge}>
                    <Ionicons name="ribbon-outline" size={12} color={WHITE} />
                    <Text style={styles.ownerBadgeText}>Your Event</Text>
                  </View>
                )}
                <View style={styles.heroInfo}>
                  <Text style={styles.heroName}>{event?.title || 'Event'}</Text>
                  <View style={styles.heroMetaRow}>
                    <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.heroDate}>{event?.date || ''}</Text>
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
                  <Text style={styles.tapHintText}>Tap to hide • Swipe for photos</Text>
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
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator color={WINE} size="large" style={{ marginVertical: 20 }} />
            ) : (
              <>
                {isOwner && (
                  <View style={styles.ownerActions}>
                    <TouchableOpacity style={styles.ownerActionBtn} onPress={handleEdit}>
                      <Ionicons name="pencil-outline" size={18} color={WINE} />
                      <Text style={styles.ownerActionText}>Edit Event</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.ownerActionBtn, styles.ownerDeleteBtn]} onPress={handleDelete}>
                      <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                      <Text style={[styles.ownerActionText, { color: '#FF3B30' }]}>Delete Event</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.amountSection}>
                  <View style={styles.amountRow}>
                    <View>
                      <Text style={styles.amountRaised}>{formatAmount(event?.total_raised)}</Text>
                      <Text style={styles.amountGoal}>raised of {formatAmount(event?.goal_amount)} goal</Text>
                    </View>
                    <View style={styles.percentBadge}>
                      <Text style={styles.percentText}>{percent}%</Text>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${percent}%` }]} />
                  </View>
                </View>

                <TouchableOpacity style={styles.liveFeedBtn} onPress={() => navigation.navigate('LiveFeed', { event })} activeOpacity={0.85}>
                  <View style={styles.liveDotContainer}><View style={styles.liveDot} /></View>
                  <View style={styles.liveFeedInfo}>
                    <Text style={styles.liveFeedTitle}>Live Contribution Feed</Text>
                    <Text style={styles.liveFeedSub}>{event?.total_contributors || 0} people contributed • Tap to see live updates</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={WINE} />
                </TouchableOpacity>

                <View style={styles.contributeCard}>
                  <View style={styles.contributeIconBox}><Ionicons name="heart" size={24} color={WINE} /></View>
                  <View style={styles.contributeText}>
                    <Text style={styles.contributeTitle}>Contribute to our happiness</Text>
                    <Text style={styles.contributeSubtitle}>Your love and support mean the world to us.</Text>
                  </View>
                </View>

                <View style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}><Ionicons name="calendar-outline" size={20} color={WINE} /></View>
                    <View><Text style={styles.detailLabel}>Event Date</Text><Text style={styles.detailValue}>{event?.date || 'TBD'}</Text></View>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}><Ionicons name="people-outline" size={20} color={WINE} /></View>
                    <View><Text style={styles.detailLabel}>Event Type</Text><Text style={styles.detailValue}>{event?.type || 'Event'}</Text></View>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}><Ionicons name="location-outline" size={20} color={WINE} /></View>
                    <View><Text style={styles.detailLabel}>Location</Text><Text style={styles.detailValue}>{event?.location || 'Kigali, Rwanda'}</Text></View>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}><Ionicons name="flag-outline" size={20} color={WINE} /></View>
                    <View><Text style={styles.detailLabel}>Goal Amount</Text><Text style={styles.detailValue}>{formatAmount(event?.goal_amount)}</Text></View>
                  </View>
                </View>

                <TouchableOpacity style={styles.contributorsRow} activeOpacity={0.8} onPress={() => navigation.navigate('LiveFeed', { event })}>
                  <View style={styles.avatarStack}>
                    {[0, 1, 2, 3].map((i) => (
                      <View key={i} style={[styles.avatarCircle, { marginLeft: i === 0 ? 0 : -12 }]}>
                        <Text style={styles.avatarText}>👤</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.contributorsInfo}>
                    <Text style={styles.contributorsCount}>{event?.total_contributors || 0} Contributors</Text>
                    <Text style={styles.contributorsSub}>Tap to see who contributed!</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={GRAY} />
                </TouchableOpacity>

                {/* ✅ COMMENTS SECTION */}
                <View style={styles.commentsSection}>
                  <View style={styles.commentsSectionHeader}>
                    <Ionicons name="chatbubbles-outline" size={20} color={BLACK} />
                    <Text style={styles.commentsSectionTitle}>Comments ({comments.length})</Text>
                    <TouchableOpacity onPress={loadComments}>
                      <Ionicons name="refresh-outline" size={18} color={GRAY} />
                    </TouchableOpacity>
                  </View>

                  {/* ✅ Comment Input */}
                  <View style={styles.commentInputBox}>
                    <View style={styles.commentNameRow}>
                      <TextInput
                        style={styles.commentNameInput}
                        placeholder="Your name"
                        placeholderTextColor="#BBBBBB"
                        value={isAnonymous ? 'Anonymous 🙈' : commenterName}
                        onChangeText={setCommenterName}
                        editable={!isAnonymous}
                      />
                      <TouchableOpacity
                        style={[styles.anonBtn, isAnonymous && styles.anonBtnActive]}
                        onPress={() => setIsAnonymous(!isAnonymous)}
                      >
                        <Text style={[styles.anonBtnText, isAnonymous && styles.anonBtnTextActive]}>
                          🙈 Anon
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.commentRow}>
                      <TextInput
                        style={styles.commentInput}
                        placeholder="Write a comment... 💬"
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

                  {/* ✅ Comments List */}
                  {commentsLoading ? (
                    <ActivityIndicator color={WINE} style={{ marginVertical: 20 }} />
                  ) : comments.length === 0 ? (
                    <View style={styles.emptyComments}>
                      <Ionicons name="chatbubble-outline" size={36} color={GRAY} />
                      <Text style={styles.emptyCommentsText}>No comments yet</Text>
                      <Text style={styles.emptyCommentsSub}>Be the first to leave a message! 💬</Text>
                    </View>
                  ) : (
                    comments.map((comment, index) => (
                      <View key={comment.id || index} style={styles.commentItem}>
                        <View style={styles.commentAvatar}>
                          <Text style={styles.commentAvatarText}>
                            {comment.is_anonymous ? '🙈' : (comment.name?.charAt(0) || '?')}
                          </Text>
                        </View>
                        <View style={styles.commentContent}>
                          <View style={styles.commentHeader}>
                            <Text style={styles.commentName}>
                              {comment.is_anonymous ? 'Anonymous 🙈' : comment.name}
                            </Text>
                            <Text style={styles.commentTime}>{formatTime(comment.created_at)}</Text>
                          </View>
                          <Text style={styles.commentMessage}>{comment.message}</Text>
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
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.contributeBtn} onPress={() => navigation.navigate('Contribute', { event })} activeOpacity={0.85}>
          <Text style={styles.contributeBtnText}>Contribute Gift 🎁</Text>
        </TouchableOpacity>
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => navigation.navigate('LiveFeed', { event })}>
            <View style={styles.liveSmallDot} />
            <Text style={styles.actionBtnText}>Live Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => navigation.navigate('ShareEvent', { event })}>
            <Ionicons name="share-social-outline" size={18} color={WINE} />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* EDIT MODAL */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Event ✏️</Text>
                <TouchableOpacity onPress={() => setEditModal(false)}>
                  <Ionicons name="close" size={24} color={BLACK} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalLabel}>Event Title *</Text>
              <TextInput style={styles.modalInput} value={editTitle} onChangeText={setEditTitle} placeholder="Event title" placeholderTextColor="#BBBBBB" />
              <Text style={styles.modalLabel}>Location</Text>
              <TextInput style={styles.modalInput} value={editLocation} onChangeText={setEditLocation} placeholder="Kigali, Rwanda" placeholderTextColor="#BBBBBB" />
              <Text style={styles.modalLabel}>Description</Text>
              <TextInput style={[styles.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]} value={editDescription} onChangeText={setEditDescription} placeholder="Tell guests about your event" placeholderTextColor="#BBBBBB" multiline />
              <Text style={styles.modalLabel}>Goal Amount (RWF)</Text>
              <TextInput style={styles.modalInput} value={editGoalAmount} onChangeText={setEditGoalAmount} placeholder="10000000" placeholderTextColor="#BBBBBB" keyboardType="numeric" />
              <Text style={styles.modalLabel}>Your Phone (for payments)</Text>
              <TextInput style={styles.modalInput} value={editOwnerPhone} onChangeText={setEditOwnerPhone} placeholder="0781 234 567" placeholderTextColor="#BBBBBB" keyboardType="phone-pad" />
              <Text style={styles.modalLabel}>Payment Method</Text>
              <View style={styles.paymentRow}>
                {['mtn', 'airtel'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[styles.paymentOption, editPaymentMethod === method && styles.paymentOptionActive]}
                    onPress={() => setEditPaymentMethod(method)}
                  >
                    <Text style={[styles.paymentOptionText, editPaymentMethod === method && { color: WINE }]}>
                      {method === 'mtn' ? '📱 MTN MoMo' : '📱 Airtel Money'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setEditModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={handleSaveEdit} disabled={saving}>
                  {saving ? <ActivityIndicator color={WHITE} size="small" /> : <Text style={styles.modalSaveText}>Save Changes</Text>}
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
  container: { flex: 1, backgroundColor: WHITE },
  heroWrapper: { width, height: height * 0.48, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
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
  amountGoal: { fontSize: 14, color: GRAY },
  percentBadge: { backgroundColor: WINE_LIGHT, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: WINE },
  percentText: { fontSize: 16, fontWeight: '800', color: WINE },
  progressBar: { height: 8, backgroundColor: '#F0D0D8', borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: WINE, borderRadius: 4 },
  liveFeedBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1.5, borderColor: GREEN, gap: 12, shadowColor: GREEN, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  liveDotContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  liveDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: GREEN },
  liveFeedInfo: { flex: 1 },
  liveFeedTitle: { fontSize: 15, fontWeight: '700', color: BLACK, marginBottom: 2 },
  liveFeedSub: { fontSize: 12, color: GRAY },
  liveSmallDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  contributeCard: { flexDirection: 'row', backgroundColor: WINE_LIGHT, borderRadius: 16, padding: 16, marginBottom: 16, gap: 14, alignItems: 'flex-start' },
  contributeIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center' },
  contributeText: { flex: 1 },
  contributeTitle: { fontSize: 15, fontWeight: '700', color: BLACK, marginBottom: 4 },
  contributeSubtitle: { fontSize: 13, color: GRAY, lineHeight: 20 },
  detailsCard: { borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 16, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  detailIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: WINE_LIGHT, justifyContent: 'center', alignItems: 'center' },
  detailDivider: { height: 1, backgroundColor: BORDER, marginVertical: 4 },
  detailLabel: { fontSize: 12, color: GRAY, marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '700', color: BLACK },
  contributorsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8, marginBottom: 16 },
  avatarStack: { flexDirection: 'row' },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: WINE_LIGHT, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: WHITE },
  avatarText: { fontSize: 16 },
  contributorsInfo: { flex: 1 },
  contributorsCount: { fontSize: 15, fontWeight: '700', color: BLACK },
  contributorsSub: { fontSize: 12, color: GRAY, marginTop: 2 },

  // ✅ Comments Styles
  commentsSection: { marginBottom: 20 },
  commentsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  commentsSectionTitle: { fontSize: 17, fontWeight: '800', color: BLACK, flex: 1 },
  commentInputBox: { backgroundColor: '#F9F9F9', borderRadius: 16, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  commentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  commentNameInput: { flex: 1, fontSize: 13, fontWeight: '600', color: BLACK, borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: WHITE },
  anonBtn: { borderWidth: 1.5, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  anonBtnActive: { borderColor: WINE, backgroundColor: WINE_LIGHT },
  anonBtnText: { fontSize: 12, fontWeight: '600', color: GRAY },
  anonBtnTextActive: { color: WINE },
  commentRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  commentInput: { flex: 1, fontSize: 14, color: BLACK, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: WHITE, maxHeight: 80 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: WINE, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#CCCCCC' },
  emptyComments: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  emptyCommentsText: { fontSize: 15, fontWeight: '700', color: BLACK },
  emptyCommentsSub: { fontSize: 13, color: GRAY },
  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: WINE_LIGHT, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  commentAvatarText: { fontSize: 14, fontWeight: '800', color: WINE },
  commentContent: { flex: 1, backgroundColor: '#F9F9F9', borderRadius: 14, padding: 10 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentName: { fontSize: 13, fontWeight: '700', color: BLACK },
  commentTime: { fontSize: 11, color: GRAY },
  commentMessage: { fontSize: 13, color: BLACK, lineHeight: 20 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: Platform.OS === 'android' ? 20 : 30, paddingTop: 12, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: BORDER, gap: 10 },
  contributeBtn: { backgroundColor: WINE, borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center', shadowColor: WINE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7 },
  contributeBtnText: { color: WHITE, fontSize: 17, fontWeight: '700' },
  bottomActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: WINE },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { justifyContent: 'flex-end' },
  modalBox: { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: BLACK },
  modalLabel: { fontSize: 14, fontWeight: '700', color: BLACK, marginBottom: 8 },
  modalInput: { borderWidth: 1.5, borderColor: '#E5E5E5', borderRadius: 14, height: 54, paddingHorizontal: 16, fontSize: 15, color: BLACK, marginBottom: 16 },
  paymentRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  paymentOption: { flex: 1, borderWidth: 1.5, borderColor: '#E5E5E5', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  paymentOptionActive: { borderColor: WINE, backgroundColor: WINE_LIGHT },
  paymentOptionText: { fontSize: 13, fontWeight: '600', color: GRAY },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancel: { flex: 1, borderWidth: 1.5, borderColor: '#E5E5E5', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: GRAY },
  modalSave: { flex: 1, backgroundColor: WINE, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: WHITE },
});