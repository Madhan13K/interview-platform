import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import client from '../api/client';

export default function PrepScreen() {
  const [tips, setTips] = useState<string[]>([]);

  useEffect(() => {
    client.get('/api/v1/candidate-portal/prep-tips/general').then(({ data }) => setTips(data || [])).catch(() => setTips(['Practice behavioral questions', 'Research the company', 'Prepare STAR examples', 'Test your tech setup']));
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Interview Prep</Text>
      <Text style={styles.subtitle}>AI-powered tips for your upcoming interview</Text>
      {tips.map((tip, i) => (
        <View key={i} style={styles.tipCard}>
          <Text style={styles.tipNumber}>{i + 1}</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F9FAFB' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  tipCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, alignItems: 'center', elevation: 1 },
  tipNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#4F46E5', color: '#fff', textAlign: 'center', lineHeight: 28, fontWeight: 'bold', marginRight: 12 },
  tipText: { flex: 1, fontSize: 15, color: '#374151' },
});
