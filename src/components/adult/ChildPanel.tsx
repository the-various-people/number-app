import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatAge, normalizeBirthMonth } from '../../children/age';
import { useSession, type Session } from '../../store/session';

const ROLE_LABELS: Record<NonNullable<Session['adultRole']>, string> = {
  teacher: '교사',
  parent: '부모',
};

/**
 * 어른 화면 위쪽: 아이 고르기·등록, 함께하는 어른, 새 진단 시작.
 * 아이를 고르면 아래 결과가 그 아이의 가장 최근 진단으로 바뀐다.
 */
export function ChildPanel() {
  const { loaded, childList, preferences, addChild, selectChild, setAdultRole } = useSession();
  const [adding, setAdding] = useState(false);
  // 등록된 아이가 하나도 없으면 처음부터 등록 칸을 펼쳐 둔다 (목록을 다 불러온 뒤에 판단).
  const noChildren = loaded && childList.length === 0;
  useEffect(() => {
    if (noChildren) setAdding(true);
  }, [noChildren]);
  const [nickname, setNickname] = useState('');
  const [birth, setBirth] = useState('');
  const [error, setError] = useState<string | null>(null);
  const today = new Date();

  const register = () => {
    const name = nickname.trim();
    const birthMonth = normalizeBirthMonth(birth);
    if (!name) return setError('별명을 적어 주세요.');
    if (!birthMonth) return setError('태어난 해와 달을 2021-05처럼 적어 주세요.');
    addChild(name, birthMonth);
    setNickname('');
    setBirth('');
    setError(null);
    setAdding(false);
  };

  // 아이 화면의 시작 화면으로 간다. 웹에서는 거기서 ▶를 눌러야 소리가 나므로 회기는 ▶가 시작한다.
  const startDiagnosis = () => router.replace('/');

  return (
    <View style={styles.panel}>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>아이</Text>
        <Pressable onPress={() => setAdding((v) => !v)} style={styles.linkButton}>
          <Text style={styles.linkText}>{adding ? '닫기' : '+ 아이 등록'}</Text>
        </Pressable>
      </View>

      <View style={styles.chips}>
        {childList.map((child) => (
          <Chip
            key={child.id}
            label={`${child.nickname} · ${formatAge(child.birthMonth, today)}`}
            selected={preferences.currentChildId === child.id}
            onPress={() => selectChild(child.id)}
          />
        ))}
        <Chip label="아이 고르지 않음" selected={preferences.currentChildId === null} onPress={() => selectChild(null)} />
      </View>

      {adding && (
        <View style={styles.form}>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            placeholder="별명 (예: 하늘)"
            style={[styles.input, { flex: 1 }]}
            maxLength={20}
          />
          <TextInput
            value={birth}
            onChangeText={setBirth}
            placeholder="태어난 해·달 (예: 2021-05)"
            style={[styles.input, { width: 220 }]}
            inputMode="numeric"
            onSubmitEditing={register}
          />
          <Pressable onPress={register} style={styles.primaryButton}>
            <Text style={styles.primaryText}>등록</Text>
          </Pressable>
        </View>
      )}
      {adding && error && <Text style={styles.error}>{error}</Text>}
      {adding && <Text style={styles.muted}>개인정보는 별명과 태어난 해·달만 이 기기 안에 저장해요.</Text>}

      <View style={styles.rowBetween}>
        <View style={styles.roleRow}>
          <Text style={styles.label}>함께하는 어른</Text>
          {(Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[]).map((role) => (
            <Chip
              key={role}
              label={ROLE_LABELS[role]}
              selected={preferences.adultRole === role}
              onPress={() => setAdultRole(preferences.adultRole === role ? null : role)}
            />
          ))}
        </View>
        <Pressable onPress={startDiagnosis} style={styles.primaryButton}>
          <Text style={styles.primaryText}>▶ 새 진단 시작</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function roleLabel(role: Session['adultRole']): string | null {
  return role ? ROLE_LABELS[role] : null;
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress(): void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, gap: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2933' },
  label: { fontSize: 16, color: '#3E4C59', marginRight: 4 },
  muted: { fontSize: 14, color: '#7B8794' },
  error: { fontSize: 15, color: '#D32F2F' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: '#CBD2D9' },
  chipSelected: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
  chipText: { fontSize: 16, color: '#3E4C59' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  form: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  input: {
    borderWidth: 1,
    borderColor: '#CBD2D9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
  },
  primaryButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: '#43A047' },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  linkButton: { paddingHorizontal: 8, paddingVertical: 6 },
  linkText: { fontSize: 16, fontWeight: '600', color: '#1E88E5' },
});
