import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import client from '../api/client';

export default function DashboardScreen() {
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const { data: portal } = await client.get('/api/v1/candidate-portal/me');
      setData(portal);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Welcome Back</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Application Status</Text>
        <Text style={styles.cardValue}>{data?.applicationStatus || 'Loading...'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upcoming Interviews</Text>
        <Text style={styles.cardValue}>{data?.upcomingInterviews?.length || 0}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Progress</Text>
        <Text style={styles.cardValue}>{data?.progressPercent || 0}%</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next Step</Text>
        <Text style={styles.cardValue}>{data?.nextStep || 'Waiting for update'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F9FAFB' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  cardValue: { fontSize: 20, fontWeight: '600', color: '#111827' },
});
