import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import client from '../api/client';

export default function InterviewsScreen() {
  const [interviews, setInterviews] = useState<any[]>([]);

  useEffect(() => {
    client.get('/api/v1/interviews/my').then(({ data }) => setInterviews(data.content || data || [])).catch(console.error);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Interviews</Text>
      <FlatList
        data={interviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardStatus}>{item.status}</Text>
            <Text style={styles.cardDate}>{item.startTime ? new Date(item.startTime).toLocaleString() : 'TBD'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No interviews scheduled</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F9FAFB' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardStatus: { fontSize: 14, color: '#4F46E5', marginTop: 4 },
  cardDate: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
});
