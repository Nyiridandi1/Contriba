import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWallet, getTransactions, withdrawFunds } from '../api';

const WINE = '#E60012';
const GREEN = '#1A9E4A';
const WHITE = '#FFFFFF';
const LIGHT_GREY = '#F5F5F5';
const MID_GREY = '#E0E0E0';
const DARK_GREY = '#666666';
const TEXT = '#1A1A1A';

export default function WalletScreen({ navigation }) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeFilter, setActiveFilter]     = useState('all');
  const [wallet, setWallet]                 = useState(null);
  const [transactions, setTransactions]     = useState([]);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletResult, transResult] = await Promise.all([
        getWallet(),
        getTransactions(),
      ]);

      if (walletResult.success) setWallet(walletResult.wallet);
      if (transResult.success) setTransactions(transResult.transactions || []);
    } catch (error) {
      console.error('Wallet load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (val) => 'RWF ' + (val || 0).toLocaleString('en-RW');

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const filteredTransactions = transactions.filter((t) => {
    if (activeFilter === 'all') return true;
    return t.type === activeFilter;
  });

  const handleWithdraw = () => {
    Alert.prompt(
      'Withdraw Funds',
      'Enter amount to withdraw (RWF):',
      async (amount) => {
        if (!amount) return;
        const result = await withdrawFunds({
          amount: parseInt(amount),
          payment_method: 'mtn',
          phone_number: '+250781234567',
        });
        if (result.success) {
          Alert.alert('Success! 🎉', `Withdrawal of RWF ${parseInt(amount).toLocaleString()} initiated!`);
          loadWalletData();
        } else {
          Alert.alert('Error', result.message || 'Withdrawal failed');
        }
      },
      'plain-text'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={WINE} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={loadWalletData}>
          <Ionicons name="refresh-outline" size={22} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* BALANCE SECTION */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <View style={styles.balanceRow}>
          {loading ? (
            <ActivityIndicator color={WHITE} size="large" />
          ) : (
            <Text style={styles.balanceAmount}>
              {balanceVisible ? formatAmount(wallet?.balance) : 'RWF ••••••'}
            </Text>
          )}
          <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)} style={{ marginLeft: 10 }}>
            <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={22} color={WHITE} />
          </TouchableOpacity>
        </View>

        {/* Quick action buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="arrow-down" size={20} color={WINE} />
            </View>
            <Text style={styles.quickActionText}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={handleWithdraw}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="arrow-up" size={20} color={WINE} />
            </View>
            <Text style={styles.quickActionText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="swap-horizontal" size={20} color={WINE} />
            </View>
            <Text style={styles.quickActionText}>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="share-outline" size={20} color={WINE} />
            </View>
            <Text style={styles.quickActionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* OVERVIEW CARDS */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <View style={[styles.overviewIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="arrow-down" size={18} color={GREEN} />
            </View>
            <Text style={styles.overviewLabel}>Total In</Text>
            <Text style={[styles.overviewValue, { color: GREEN }]}>{formatAmount(wallet?.total_in)}</Text>
          </View>
          <View style={styles.overviewCard}>
            <View style={[styles.overviewIcon, { backgroundColor: '#FFE4E9' }]}>
              <Ionicons name="arrow-up" size={18} color={WINE} />
            </View>
            <Text style={styles.overviewLabel}>Total Out</Text>
            <Text style={[styles.overviewValue, { color: WINE }]}>{formatAmount(wallet?.total_out)}</Text>
          </View>
          <View style={styles.overviewCard}>
            <View style={[styles.overviewIcon, { backgroundColor: '#EDE7F6' }]}>
              <Ionicons name="card-outline" size={18} color="#7C3AED" />
            </View>
            <Text style={styles.overviewLabel}>Pending</Text>
            <Text style={[styles.overviewValue, { color: '#7C3AED' }]}>RWF 0</Text>
          </View>
        </View>

        {/* TRANSACTION HISTORY */}
        <Text style={styles.sectionTitle}>Transaction History</Text>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {['all', 'in', 'out'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f === 'all' ? 'All' : f === 'in' ? 'Money In' : 'Money Out'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions list */}
        <View style={styles.transactionsCard}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={40} color={DARK_GREY} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            filteredTransactions.map((item, index) => (
              <View key={item.id}>
                <View style={styles.transactionRow}>
                  <View style={[styles.transactionIcon, { backgroundColor: item.type === 'in' ? '#E8F5E9' : '#FFE4E9' }]}>
                    <Ionicons name={item.type === 'in' ? 'arrow-down' : 'arrow-up'} size={18} color={item.type === 'in' ? GREEN : WINE} />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionLabel}>{item.type === 'in' ? 'Money Received' : 'Withdrawal'}</Text>
                    <Text style={styles.transactionSub}>Ref: {item.reference || 'N/A'}</Text>
                    <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
                  </View>
                  <Text style={[styles.transactionAmount, { color: item.type === 'in' ? GREEN : WINE }]}>
                    {item.type === 'in' ? '+' : '-'}{formatAmount(item.amount)}
                  </Text>
                </View>
                {index < filteredTransactions.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))
          )}
        </View>

        {/* WITHDRAW BUTTON */}
        <TouchableOpacity style={styles.withdrawBtn} activeOpacity={0.85} onPress={handleWithdraw}>
          <Ionicons name="arrow-up-circle-outline" size={20} color={WHITE} />
          <Text style={styles.withdrawBtnText}>Withdraw Funds</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: WINE },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: WHITE },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  balanceSection: { backgroundColor: WINE, paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  balanceAmount: { fontSize: 32, fontWeight: '900', color: WHITE },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: WHITE, borderRadius: 16, padding: 16 },
  quickAction: { alignItems: 'center', gap: 8 },
  quickActionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFE4E9', alignItems: 'center', justifyContent: 'center' },
  quickActionText: { fontSize: 11, fontWeight: '600', color: TEXT },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  overviewGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  overviewCard: { flex: 1, backgroundColor: WHITE, borderRadius: 14, borderWidth: 1, borderColor: MID_GREY, padding: 12, alignItems: 'center' },
  overviewIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  overviewLabel: { fontSize: 11, color: DARK_GREY, marginBottom: 4 },
  overviewValue: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: TEXT, marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: LIGHT_GREY },
  filterBtnActive: { backgroundColor: WINE },
  filterText: { fontSize: 13, fontWeight: '600', color: DARK_GREY },
  filterTextActive: { color: WHITE },
  transactionsCard: { backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: MID_GREY, marginBottom: 16, overflow: 'hidden' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  transactionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  transactionInfo: { flex: 1 },
  transactionLabel: { fontSize: 14, fontWeight: '600', color: TEXT },
  transactionSub: { fontSize: 12, color: DARK_GREY, marginTop: 2 },
  transactionDate: { fontSize: 11, color: DARK_GREY, marginTop: 2 },
  transactionAmount: { fontSize: 13, fontWeight: '700' },
  rowDivider: { height: 1, backgroundColor: LIGHT_GREY, marginHorizontal: 14 },
  emptyBox: { alignItems: 'center', padding: 30, gap: 8 },
  emptyText: { fontSize: 14, color: DARK_GREY },
  withdrawBtn: { backgroundColor: WINE, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: WINE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  withdrawBtnText: { color: WHITE, fontSize: 16, fontWeight: '700', marginLeft: 6 },
});