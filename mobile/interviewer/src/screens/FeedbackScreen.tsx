import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import client from '../api/client';

interface FeedbackForm {
  rating: number;
  recommendation: 'STRONG_YES' | 'YES' | 'NEUTRAL' | 'NO' | 'STRONG_NO' | '';
  strengths: string;
  weaknesses: string;
  notes: string;
}

export default function FeedbackScreen({ route, navigation }: any) {
  const { interviewId } = route?.params || {};
  const [form, setForm] = useState<FeedbackForm>({
    rating: 0,
    recommendation: '',
    strengths: '',
    weaknesses: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const recommendations = [
    { label: 'Strong Yes', value: 'STRONG_YES' },
    { label: 'Yes', value: 'YES' },
    { label: 'Neutral', value: 'NEUTRAL' },
    { label: 'No', value: 'NO' },
    { label: 'Strong No', value: 'STRONG_NO' },
  ] as const;

  const handleSubmit = async () => {
    if (!form.recommendation || form.rating === 0) {
      Alert.alert('Incomplete', 'Please provide a rating and recommendation.');
      return;
    }
    setSubmitting(true);
    try {
      await client.post(`/api/v1/interviews/${interviewId}/feedback`, form);
      Alert.alert('Success', 'Feedback submitted successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Submit Feedback</Text>

      <Text style={styles.label}>Rating (1-5)</Text>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.ratingButton, form.rating === n && styles.ratingButtonActive]}
            onPress={() => setForm({ ...form, rating: n })}
          >
            <Text style={[styles.ratingText, form.rating === n && styles.ratingTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Recommendation</Text>
      <View style={styles.recRow}>
        {recommendations.map((rec) => (
          <TouchableOpacity
            key={rec.value}
            style={[styles.recButton, form.recommendation === rec.value && styles.recButtonActive]}
            onPress={() => setForm({ ...form, recommendation: rec.value })}
          >
            <Text style={[styles.recText, form.recommendation === rec.value && styles.recTextActive]}>
              {rec.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Strengths</Text>
      <TextInput
        style={styles.textArea}
        placeholder="What did the candidate do well?"
        value={form.strengths}
        onChangeText={(t) => setForm({ ...form, strengths: t })}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Areas for Improvement</Text>
      <TextInput
        style={styles.textArea}
        placeholder="What could the candidate improve?"
        value={form.weaknesses}
        onChangeText={(t) => setForm({ ...form, weaknesses: t })}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Additional Notes</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Any other observations..."
        value={form.notes}
        onChangeText={(t) => setForm({ ...form, notes: t })}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Feedback'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F9FAFB' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  ratingRow: { flexDirection: 'row', gap: 8 },
  ratingButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  ratingButtonActive: { backgroundColor: '#4F46E5' },
  ratingText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  ratingTextActive: { color: '#fff' },
  recRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6' },
  recButtonActive: { backgroundColor: '#4F46E5' },
  recText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  recTextActive: { color: '#fff' },
  textArea: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 15, textAlignVertical: 'top', minHeight: 80 },
  submitButton: { backgroundColor: '#4F46E5', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
