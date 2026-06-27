import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import client from '../api/client';

interface Interview {
  id: string;
  candidateName: string;
  position: string;
  startTime: string;
  endTime: string;
  status: string;
  roomUrl?: string;
}

export default function ScheduleScreen({ navigation }: any) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSchedule = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await client.get(`/api/v1/interviews/schedule?date=${today}`);
      setInterviews(data.content || data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadSchedule(); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadSchedule(); setRefreshing(false); };

  const handleJoin = (interview: Interview) => {
    navigation.navigate('Session', { interviewId: interview.id });
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Schedule</Text>
      <FlatList
        data={interviews}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.candidateName}>{item.candidateName}</Text>
              <Text style={[styles.statusBadge, item.status === 'IN_PROGRESS' && styles.statusActive]}>
                {item.status}
              </Text>
            </View>
            <Text style={styles.position}>{item.position}</Text>
            <Text style={styles.time}>
              {item.startTime ? `${formatTime(item.startTime)} - ${formatTime(item.endTime)}` : 'TBD'}
            </Text>
            <TouchableOpacity style={styles.joinButton} onPress={() => handleJoin(item)}>
              <Text style={styles.joinButtonText}>Join Interview</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No interviews scheduled for today</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F9FAFB' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  candidateName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  statusBadge: { fontSize: 11, fontWeight: '600', color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, overflow: 'hidden' },
  statusActive: { color: '#059669', backgroundColor: '#D1FAE5' },
  position: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  time: { fontSize: 13, color: '#4F46E5', marginTop: 4 },
  joinButton: { backgroundColor: '#4F46E5', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
  joinButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 15 },
});
