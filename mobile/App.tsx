import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { apiGet, BASE_URL } from './src/api/client';
import type { HealthResponseDto } from './src/api/generated';
import { READING_STATUS_LABEL, READING_STATUSES } from './src/constants/reading-status';

export default function App() {
  const [health, setHealth] = useState<HealthResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHealth(await apiGet<HealthResponseDto>('/health'));
    } catch (e) {
      setHealth(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  const connected = health?.status === 'ok';

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>다읽어리</Text>
        <Text style={styles.subtitle}>readiary</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>서버 연결</Text>
          {loading ? (
            <ActivityIndicator style={styles.spinner} />
          ) : (
            <>
              <View style={styles.row}>
                <View style={[styles.dot, connected ? styles.dotOk : styles.dotBad]} />
                <Text style={styles.status}>
                  {connected ? '연결됨' : '연결 실패'}
                  {health ? ` · DB ${health.database}` : ''}
                </Text>
              </View>
              <Text style={styles.meta}>{BASE_URL}</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </>
          )}
          <Pressable style={styles.button} onPress={check}>
            <Text style={styles.buttonText}>다시 확인</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>독서 상태</Text>
          {READING_STATUSES.map((s) => (
            <Text key={s} style={styles.statusItem}>
              {READING_STATUS_LABEL[s]} <Text style={styles.code}>{s}</Text>
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  content: { padding: 24, paddingTop: 72, gap: 16 },
  title: { fontSize: 32, fontWeight: '700', color: '#2b2622' },
  subtitle: { fontSize: 14, color: '#9a8f84', marginTop: -4, marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#ece5dc',
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#9a8f84', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotOk: { backgroundColor: '#3f9142' },
  dotBad: { backgroundColor: '#c2453c' },
  status: { fontSize: 17, fontWeight: '600', color: '#2b2622' },
  statusItem: { fontSize: 16, color: '#2b2622' },
  code: { fontSize: 13, color: '#9a8f84' },
  meta: { fontSize: 12, color: '#b3a99e' },
  error: { fontSize: 12, color: '#c2453c' },
  spinner: { alignSelf: 'flex-start' },
  button: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#2b2622',
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
