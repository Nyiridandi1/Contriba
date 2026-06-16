import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTransactions } from '../api';
import { useTheme } from '../context/ThemeContext';

const WINE  = '#E60012';
const GREEN = '#1A9E4A';
const WHITE = '#FFFFFF';

export default function WalletScreen({ navigation }) {
  const { darkMode, language, colors } = useTheme();
  const { BG, CARD, TEXT, SUB, BORDER, DIV } = colors;

  const [activeFilter, setActiveFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);

  // ✅ Compute totals from transactions
  const totalIn  = transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalOut = transactions.filter(t => t.type === 'out').reduce((sum, t) => sum + (t.amount || 0), 0);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const result = await getTransactions();
      if (result.success) setTransactions(result.transactions || []);
    } catch (error) {
      console.error('Transactions load error:', error);
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: BG }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={WINE} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'Kinyarwanda' ? 'Amateka y\'Amafaranga' : 'Transaction History'}
        </Text>
        <TouchableOpacity style={styles.headerBtn} onPress={loadTransactions}>
          <Ionicons name="refresh-outline" size={22} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* ✅ TOTAL IN / OUT SUMMARY - clean and simple */}
      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconBox}>
            <Ionicons name="arrow-down-circle" size={28} color={GREEN} />
          </View>
          <Text style={styles.summaryLabel}>
            {language === 'Kinyarwanda' ? 'Yinjiye' : 'Total In'}
          </Text>
          <Text style={[styles.summaryAmount, { color: GREEN }]}>
            {formatAmount(totalIn)}
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCard}>
          <View style={styles.summaryIconBox}>
            <Ionicons name="arrow-up-circle" size={28} color={WINE} />
          </View>
          <Text style={styles.summaryLabel}>
            {language === 'Kinyarwanda' ? 'Yasohotse' : 'Total Out'}
          </Text>
          <Text style={[styles.summaryAmount, { color: WINE }]}>
            {formatAmount(totalOut)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* TRANSACTION HISTORY */}
        <Text style={[styles.sectionTitle, { color: TEXT }]}>
          {language === 'Kinyarwanda' ? 'Amateka y\'Amafaranga' : 'Transaction History'}
        </Text>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: language === 'Kinyarwanda' ? 'Byose'    : 'All'       },
            { key: 'in',  label: language === 'Kinyarwanda' ? 'Injiye'   : 'Money In'  },
            { key: 'out', label: language === 'Kinyarwanda' ? 'Sohotse'  : 'Money Out' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterBtn,
                { backgroundColor: darkMode ? '#2A2A2A' : '#F5F5F5' },
                activeFilter === f.key && styles.filterBtnActive,
              ]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text style={[styles.filterText, { color: SUB }, activeFilter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions list */}
        {loading ? (
          <ActivityIndicator color={WINE} size="large" style={{ marginTop: 40 }} />
        ) : (
          <View style={[styles.transactionsCard, { backgroundColor: CARD, borderColor: BORDER }]}>
            {filteredTransactions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="receipt-outline" size={48} color={SUB} />
                <Text style={[styles.emptyTitle, { color: TEXT }]}>
                  {language === 'Kinyarwanda' ? 'Nta mateka' : 'No transactions yet'}
                </Text>
                <Text style={[styles.emptyText, { color: SUB }]}>
                  {language === 'Kinyarwanda'
                    ? 'Amateka y\'amafaranga azagaragara hano'
                    : 'Your transaction history will appear here'}
                </Text>
              </View>
            ) : (
              filteredTransactions.map((item, index) => (
                <View key={item.id}>
                  <View style={styles.transactionRow}>
                    <View style={[styles.transactionIcon, { backgroundColor: item.type === 'in' ? '#E8F5E9' : '#FFE4E9' }]}>
                      <Ionicons
                        name={item.type === 'in' ? 'arrow-down' : 'arrow-up'}
                        size={18}
                        color={item.type === 'in' ? GREEN : WINE}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={[styles.transactionLabel, { color: TEXT }]}>
                        {item.type === 'in'
                          ? (language === 'Kinyarwanda' ? 'Amafaranga Yakiriwe' : 'Money Received')
                          : (language === 'Kinyarwanda' ? 'Amafaranga Yasohotse' : 'Money Sent')}
                      </Text>
                      {item.reference && (
                        <Text style={[styles.transactionSub, { color: SUB }]}>
                          Ref: {item.reference}
                        </Text>
                      )}
                      {item.event_title && (
                        <Text style={[styles.transactionSub, { color: SUB }]}>
                          📅 {item.event_title}
                        </Text>
                      )}
                      <Text style={[styles.transactionDate, { color: SUB }]}>
                        {formatDate(item.created_at)}
                      </Text>
                    </View>
                    <Text style={[styles.transactionAmount, { color: item.type === 'in' ? GREEN : WINE }]}>
                      {item.type === 'in' ? '+' : '-'}{formatAmount(item.amount)}
                    </Text>
                  </View>
                  {index < filteredTransactions.length - 1 && (
                    <View style={[styles.rowDivider, { backgroundColor: DIV }]} />
                  )}
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: WINE },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: WHITE },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // ✅ Summary section
  summarySection: { backgroundColor: WINE, flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8, alignItems: 'center' },
  summaryCard: { flex: 1, alignItems: 'center', gap: 4 },
  summaryIconBox: { marginBottom: 4 },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  summaryAmount: { fontSize: 18, fontWeight: '900', color: WHITE },
  summaryDivider: { width: 1, height: 60, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 },

  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterBtnActive: { backgroundColor: WINE },
  filterText: { fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: WHITE },
  transactionsCard: { borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  transactionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  transactionInfo: { flex: 1 },
  transactionLabel: { fontSize: 14, fontWeight: '600' },
  transactionSub: { fontSize: 12, marginTop: 2 },
  transactionDate: { fontSize: 11, marginTop: 2 },
  transactionAmount: { fontSize: 13, fontWeight: '700' },
  rowDivider: { height: 1, marginHorizontal: 14 },
  emptyBox: { alignItems: 'center', padding: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});