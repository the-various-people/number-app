import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatAge, normalizeBirthMonth } from '../../children/age';
import { useSession, type Child, type Session } from '../../store/session';

const ROLE_LABELS: Record<NonNullable<Session['adultRole']>, string> = {
  teacher: '교사',
  parent: '부모',
};

/** 등록·고치기 칸 */
type FormMode = { kind: 'add' } | { kind: 'edit'; child: Child } | null;

/** 되돌리기 어려운 일은 한 번 더 묻는다 */
type Confirm = { kind: 'deleteChild'; child: Child } | { kind: 'deleteSession'; session: Session } | { kind: 'start' } | null;

/**
 * 어른 화면 위쪽: 아이 고르기·등록·고치기·지우기, 함께하는 어른, 지난 진단, 새 진단 시작.
 * 아이를 고르면 아래 결과가 그 아이의 가장 최근 진단으로 바뀐다.
 * 나중에 계정 기능이 생기면 이 칸은 "그 계정의 아이"만 보여 주게 된다(저장소가 거른다).
 */
export function ChildPanel() {
  const {
    loaded,
    childList,
    preferences,
    session,
    pastSessions,
    addChild,
    updateChild,
    deleteChild,
    deleteSession,
    selectChild,
    setAdultRole,
    openSession,
  } = useSession();
  const [form, setForm] = useState<FormMode>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  // 등록된 아이가 하나도 없으면 처음부터 등록 칸을 펼쳐 둔다 (목록을 다 불러온 뒤에 판단).
  const noChildren = loaded && childList.length === 0;
  useEffect(() => {
    if (noChildren) setForm({ kind: 'add' });
  }, [noChildren]);
  const [nickname, setNickname] = useState('');
  const [birth, setBirth] = useState('');
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  const currentChild = childList.find((c) => c.id === preferences.currentChildId) ?? null;

  const openForm = (next: FormMode) => {
    setForm(next);
    setConfirm(null);
    setError(null);
    setNickname(next?.kind === 'edit' ? next.child.nickname : '');
    setBirth(next?.kind === 'edit' ? next.child.birthMonth : '');
  };

  const submit = () => {
    const name = nickname.trim();
    const birthMonth = normalizeBirthMonth(birth);
    if (!name) return setError('별명을 적어 주세요.');
    if (!birthMonth) return setError('태어난 해와 달을 2021-05처럼 적어 주세요.');
    if (form?.kind === 'edit') updateChild(form.child.id, name, birthMonth);
    else addChild(name, birthMonth);
    openForm(null);
  };

  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === 'deleteChild') deleteChild(confirm.child.id);
    if (confirm.kind === 'deleteSession') deleteSession(confirm.session.id);
    // 아이 화면의 시작 화면으로 간다. 웹에서는 거기서 ▶를 눌러야 소리가 나므로 회기는 ▶가 시작한다.
    if (confirm.kind === 'start') router.replace('/');
    setConfirm(null);
  };

  // 시작 확인에 보이는 "누구와": 아이를 고르지 않았으면 null
  const roleText = preferences.adultRole ? ` · ${ROLE_LABELS[preferences.adultRole]}` : '';
  const who = currentChild ? `${currentChild.nickname} (${formatAge(currentChild.birthMonth, today)})${roleText}` : null;

  return (
    <View style={styles.panel}>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>아이</Text>
        <View style={styles.links}>
          {currentChild && (
            <>
              <LinkButton label="고치기" onPress={() => openForm({ kind: 'edit', child: currentChild })} />
              <LinkButton
                label="지우기"
                danger
                onPress={() => {
                  openForm(null);
                  setConfirm({ kind: 'deleteChild', child: currentChild });
                }}
              />
            </>
          )}
          <LinkButton
            label={form?.kind === 'add' ? '닫기' : '+ 아이 등록'}
            onPress={() => openForm(form?.kind === 'add' ? null : { kind: 'add' })}
          />
        </View>
      </View>

      <View style={styles.chips}>
        {childList.map((child) => (
          <Chip
            key={child.id}
            label={`${child.nickname} · ${formatAge(child.birthMonth, today)}`}
            selected={preferences.currentChildId === child.id}
            onPress={() => {
              setConfirm(null);
              selectChild(child.id);
            }}
          />
        ))}
        <Chip
          label="아이 고르지 않음"
          selected={preferences.currentChildId === null}
          onPress={() => {
            setConfirm(null);
            selectChild(null);
          }}
        />
      </View>

      {form && (
        <View style={styles.form}>
          {form.kind === 'edit' && <Text style={styles.label}>고치기:</Text>}
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
            onSubmitEditing={submit}
          />
          <Pressable onPress={submit} style={styles.primaryButton}>
            <Text style={styles.primaryText}>{form.kind === 'edit' ? '저장' : '등록'}</Text>
          </Pressable>
          {form.kind === 'edit' && <LinkButton label="취소" onPress={() => openForm(null)} />}
        </View>
      )}
      {form && error && <Text style={styles.error}>{error}</Text>}
      {form && <Text style={styles.muted}>개인정보는 별명과 태어난 해·달만 이 기기 안에 저장해요.</Text>}

      {pastSessions.length > 0 && (
        <View style={styles.roleRow}>
          <Text style={styles.label}>지난 진단</Text>
          <View style={styles.chips}>
            {pastSessions.slice(0, MAX_PAST).map((s, i) => (
              <Chip
                key={s.id}
                label={`${shortDate(s.startedAt)}${i === 0 ? ' (최근)' : ''}`}
                selected={session?.id === s.id}
                onPress={() => openSession(s.id)}
              />
            ))}
          </View>
          {session && pastSessions.some((s) => s.id === session.id) && (
            <LinkButton
              label="이 진단 지우기"
              danger
              onPress={() => {
                openForm(null);
                setConfirm({ kind: 'deleteSession', session });
              }}
            />
          )}
        </View>
      )}

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
        <Pressable
          onPress={() => {
            openForm(null);
            setConfirm({ kind: 'start' });
          }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryText}>▶ 새 진단 시작</Text>
        </Pressable>
      </View>

      {confirm && (
        <View style={[styles.confirm, confirm.kind !== 'start' && styles.confirmDanger]}>
          <Text style={styles.confirmText}>{confirmMessage(confirm, who)}</Text>
          <View style={styles.links}>
            <LinkButton label="취소" onPress={() => setConfirm(null)} />
            <Pressable
              onPress={runConfirm}
              style={[styles.primaryButton, confirm.kind !== 'start' && styles.dangerButton]}
            >
              <Text style={styles.primaryText}>{confirm.kind === 'start' ? '시작' : '지우기'}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function confirmMessage(confirm: NonNullable<Confirm>, who: string | null): string {
  switch (confirm.kind) {
    case 'start':
      return who
        ? `${who}, 이 아이로 새 진단을 시작할까요?`
        : '아이를 고르지 않고 새 진단을 시작할까요? 결과는 "아이 고르지 않음"에 저장돼요.';
    case 'deleteChild':
      return `"${confirm.child.nickname}"와 이 아이의 진단 기록을 모두 지울까요? 목록에서 사라져요.`;
    case 'deleteSession':
      return `${shortDate(confirm.session.startedAt)} 진단을 지울까요? 지난 진단 목록에서 사라져요.`;
  }
}

/** 지난 진단은 최근 것부터 이만큼만 보여 준다 */
const MAX_PAST = 8;

const shortDate = (ms: number) =>
  new Date(ms).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });

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

function LinkButton({ label, onPress, danger }: { label: string; onPress(): void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.linkButton}>
      <Text style={[styles.linkText, danger && styles.dangerText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, gap: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  links: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2933' },
  label: { fontSize: 16, color: '#3E4C59', marginRight: 4 },
  muted: { fontSize: 14, color: '#7B8794' },
  error: { fontSize: 15, color: '#D32F2F' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
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
  dangerButton: { backgroundColor: '#D32F2F' },
  linkButton: { paddingHorizontal: 8, paddingVertical: 6 },
  linkText: { fontSize: 16, fontWeight: '600', color: '#1E88E5' },
  dangerText: { color: '#D32F2F' },
  confirm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
  },
  confirmDanger: { backgroundColor: '#FFEBEE' },
  confirmText: { flex: 1, minWidth: 220, fontSize: 16, color: '#1F2933' },
});
