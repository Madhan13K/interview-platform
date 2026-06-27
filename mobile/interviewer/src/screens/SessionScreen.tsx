import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import client from '../api/client';

interface AISuggestion {
  id: string;
  type: 'follow_up' | 'probe' | 'redirect' | 'note';
  text: string;
  timestamp: string;
}

export default function SessionScreen({ route, navigation }: any) {
  const { interviewId } = route?.params || {};
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [sessionActive, setSessionActive] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Connect to AI copilot WebSocket for real-time suggestions
    const wsUrl = `${process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8080'}/ws/interview-copilot/${interviewId}`;
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const suggestion: AISuggestion = JSON.parse(event.data);
          setSuggestions((prev) => [...prev, suggestion].slice(-20));
        } catch (e) { console.error('Parse error:', e); }
      };

      ws.onerror = () => { ws.close(); };
      ws.onclose = () => { setSessionActive(false); };
    } catch (e) { console.error('WS error:', e); }

    // Timer
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [interviewId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const endSession = async () => {
    try {
      await client.post(`/api/v1/interviews/${interviewId}/end`);
      if (wsRef.current) wsRef.current.close();
      setSessionActive(false);
      navigation.navigate('Feedback', { interviewId });
    } catch (err) { console.error(err); }
  };

  const getSuggestionColor = (type: AISuggestion['type']) => {
    switch (type) {
      case 'follow_up': return '#4F46E5';
      case 'probe': return '#D97706';
      case 'redirect': return '#DC2626';
      case 'note': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: sessionActive ? '#10B981' : '#EF4444' }]} />
          <Text style={styles.statusText}>{sessionActive ? 'Live' : 'Ended'}</Text>
        </View>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>
      </View>

      <Text style={styles.sectionTitle}>AI Copilot Suggestions</Text>

      <ScrollView style={styles.suggestionsContainer}>
        {suggestions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>AI suggestions will appear here during the interview...</Text>
          </View>
        ) : (
          suggestions.map((s) => (
            <View key={s.id} style={styles.suggestionCard}>
              <View style={[styles.suggestionBadge, { backgroundColor: getSuggestionColor(s.type) }]}>
                <Text style={styles.suggestionType}>{s.type.replace('_', ' ')}</Text>
              </View>
              <Text style={styles.suggestionText}>{s.text}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {sessionActive && (
        <TouchableOpacity style={styles.endButton} onPress={endSession}>
          <Text style={styles.endButtonText}>End Interview</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  statusText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  timer: { fontSize: 20, fontWeight: 'bold', color: '#111827', fontVariant: ['tabular-nums'] },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 },
  suggestionsContainer: { flex: 1 },
  emptyState: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  suggestionCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  suggestionBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 6 },
  suggestionType: { fontSize: 11, fontWeight: '600', color: '#fff', textTransform: 'uppercase' },
  suggestionText: { fontSize: 15, color: '#374151', lineHeight: 21 },
  endButton: { backgroundColor: '#DC2626', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 12 },
  endButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
