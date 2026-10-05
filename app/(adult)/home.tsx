import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatAge } from '../../src/children/age';
import { ChildPanel, roleLabel } from '../../src/components/adult/ChildPanel';
import { expectedLabel, formatAnswer, ITEMS, touchTargets, type TouchTargets } from '../../src/items/registry';
import type { ItemDef } from '../../src/items/types';
import { diagnosisPath } from '../../src/navigation';
import { areaOf, STRATEGY_LABELS, strategiesFor, type Area, type ItemStatus } from '../../src/scoring';
import { useSession, type ItemResponse } from '../../src/store/session';

const seconds = (ms: number) => `${(ms / 1000).toFixed(2)}초`;

const AREA_LABELS: Record<Area, string> = {
  A: 'A. 수 세기',
  B: 'B. 서수·기수',
  C: 'C. 한눈에 알기',
  D: 'D. 이어세기',
  E: 'E. 모으기·가르기',
  F: 'F. 크기 비교',
};

const STATUS_TEXT: Record<Exclude<ItemStatus, 'answered'>, string> = {
  pending: '아직 답하지 않았어요.',
  skipped: '건너뛰었어요. 이 영역에서 연속 2문항이 0점이었어요.',
};

/** 어른 화면: 아이 고르기·등록, 영역별 문항 결과, 도움 줌, 전략 수정, 메모 */
export default function AdultHomeScreen() {
  const { session, childList, responses, statuses, next } = useSession();
  const areas = [...new Set(ITEMS.map((def) => areaOf(def.code)))];

  // 아이 화면은 지금 낼 문항(또는 끝 화면)에서 이어 간다.
  const backToChild = () => router.replace(diagnosisPath(next));

  // 결과 머리말: 누구의, 언제, 몇 살 때, 누구와 한 진단인지
  const child = childList.find((c) => c.id === session?.childId);
  const startedAt = session ? new Date(session.startedAt) : null;
  const sessionInfo = session && startedAt
    ? [
        child ? `${child.nickname} (${formatAge(child.birthMonth, startedAt)})` : '아이 고르지 않음',
        roleLabel(session.adultRole),
        startedAt.toLocaleString('ko-KR'),
      ]
        .filter(Boolean)
        .join(' · ')
    : '아직 진단 기록이 없어요. 아래 "▶ 새 진단 시작"을 눌러 시작하세요.';

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>진단 결과</Text>
          <Text style={styles.muted}>{sessionInfo}</Text>
        </View>
        <View style={styles.headerButtons}>
          {session && <Button label="이어서 하기 (아이 화면)" onPress={backToChild} />}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <ChildPanel />
        {areas.map((area) => (
          <View key={area} style={styles.area}>
            <Text style={styles.areaTitle}>{AREA_LABELS[area]}</Text>
            {ITEMS.filter((def) => areaOf(def.code) === area).map((def) => (
              <ItemResult
                key={def.code}
                def={def}
                status={statuses[def.code] ?? 'pending'}
                response={responses[def.code]}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ItemResult({ def, status, response }: { def: ItemDef; status: ItemStatus; response?: ItemResponse }) {
  const { setHelped, setStrategyOverride, setNote, resetItem } = useSession();
  const targets = touchTargets(def);

  const retry = () => {
    resetItem(def.code);
    router.replace(diagnosisPath(def.code));
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {def.code} · {def.label}
        </Text>
        <Button label={response ? `${def.code} 다시 하기` : `${def.code} 하기`} onPress={retry} />
      </View>

      {!response || status !== 'answered' ? (
        <Text style={styles.muted}>{STATUS_TEXT[status === 'answered' ? 'pending' : status]}</Text>
      ) : (
        <>
          <View style={styles.summary}>
            <Field label="답" value={formatAnswer(def, response.answer)} />
            <Field label="정답" value={expectedLabel(def)} />
            <Field label="정오" value={response.correct ? '정답' : '오답'} />
            <Field label="점수" value={`${response.score}점`} />
            <Field label="응답 시간" value={seconds(response.responseMs)} hint="발문 끝 → 답" />
            {targets && <Field label="터치 수" value={`${response.touches.length}회`} />}
          </View>

          <Text style={styles.sectionTitle}>
            전략 · 자동 판별: {STRATEGY_LABELS[response.autoStrategyCode]}
            {response.autoStrategyCode === 'UNCLASSIFIED' && '  ⚠ 규칙에 맞지 않아요. 직접 골라 주세요.'}
          </Text>
          <View style={styles.chips}>
            <Chip
              label="자동"
              selected={response.strategyOverride === null}
              onPress={() => setStrategyOverride(def.code, null)}
            />
            {strategiesFor(def.code).map((code) => (
              <Chip
                key={code}
                label={STRATEGY_LABELS[code]}
                selected={response.strategyOverride === code}
                onPress={() => setStrategyOverride(def.code, code)}
              />
            ))}
          </View>

          <Pressable
            onPress={() => setHelped(def.code, !response.helped)}
            style={[styles.helpButton, response.helped && styles.helpButtonOn]}
          >
            <Text style={[styles.helpText, response.helped && styles.helpTextOn]}>
              {response.helped ? '✓ 도움 줌 (최대 1점)' : '도움 줌'}
            </Text>
          </Pressable>

          <NoteBox key={response.id} note={response.note} onSave={(note) => setNote(def.code, note)} />

          {targets && <TouchLog response={response} targets={targets} />}
        </>
      )}
    </View>
  );
}

/** 문항별 관찰 메모. 글을 멈추고 0.6초 뒤, 또는 칸을 벗어날 때 저장한다. */
function NoteBox({ note, onSave }: { note: string; onSave(note: string): void }) {
  const [text, setText] = useState(note);

  useEffect(() => {
    if (text === note) return;
    const timer = setTimeout(() => onSave(text), 600);
    return () => clearTimeout(timer);
  }, [text, note, onSave]);

  return (
    <View>
      <Text style={styles.sectionTitle}>관찰 메모</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        onBlur={() => text !== note && onSave(text)}
        placeholder="예: 손가락으로 짚으며 소리 내어 셈"
        multiline
        style={styles.noteInput}
        maxLength={500}
      />
    </View>
  );
}

function TouchLog({ response, targets }: { response: ItemResponse; targets: TouchTargets }) {
  const { count, label: objectLabel, name, showMissed, markRepeats } = targets;
  const seen = new Set<number>();
  const missed = (showMissed ? Array.from({ length: count }, (_, i) => i) : []).filter(
    (i) => !response.touches.some((t) => t.targetIndex === i),
  );

  return (
    <View>
      <Text style={styles.sectionTitle}>
        터치 기록 · 발문 끝 {seconds(response.promptEndMs)}
        {missed.length > 0 && ` · 안 누른 ${objectLabel}: ${missed.map((i) => i + 1).join(', ')}번`}
      </Text>
      {response.touches.length === 0 ? (
        <Text style={styles.muted}>터치 없음</Text>
      ) : (
        <View style={styles.table}>
          <Row cells={['순서', objectLabel, '화면 뜬 뒤', '발문 끝 기준', '']} header />
          {response.touches.map((t, i) => {
            const repeated = markRepeats && seen.has(t.targetIndex);
            seen.add(t.targetIndex);
            const sincePrompt = t.tMs - response.promptEndMs;
            return (
              <Row
                key={i}
                cells={[
                  String(i + 1),
                  name(t.targetIndex),
                  seconds(t.tMs),
                  `${sincePrompt >= 0 ? '+' : ''}${seconds(sincePrompt)}`,
                  repeated ? '다시 누름' : '',
                ]}
                highlight={repeated}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

function Row({ cells, header, highlight }: { cells: string[]; header?: boolean; highlight?: boolean }) {
  return (
    <View style={[styles.row, header && styles.rowHeader, highlight && styles.rowHighlight]}>
      {cells.map((cell, i) => (
        <Text key={i} style={[styles.cell, header && styles.cellHeader]}>
          {cell}
        </Text>
      ))}
    </View>
  );
}

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress(): void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function Button({ label, onPress }: { label: string; onPress(): void }) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E4EA',
    backgroundColor: '#FFFFFF',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1F2933' },
  headerButtons: { flexDirection: 'row', gap: 12 },
  content: { padding: 32, gap: 32 },
  area: { gap: 16 },
  areaTitle: { fontSize: 18, fontWeight: '700', color: '#3E4C59' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, gap: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1F2933' },
  muted: { fontSize: 16, color: '#7B8794' },
  summary: { flexDirection: 'row', gap: 32, flexWrap: 'wrap' },
  field: { minWidth: 96 },
  fieldLabel: { fontSize: 14, color: '#7B8794' },
  fieldValue: { fontSize: 22, fontWeight: '600', color: '#1F2933', marginTop: 2 },
  fieldHint: { fontSize: 12, color: '#9AA5B1' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#3E4C59', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD2D9',
  },
  chipSelected: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
  chipText: { fontSize: 16, color: '#3E4C59' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  noteInput: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: '#CBD2D9',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1F2933',
    textAlignVertical: 'top',
  },
  helpButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FB8C00',
  },
  helpButtonOn: { backgroundColor: '#FB8C00' },
  helpText: { fontSize: 18, fontWeight: '600', color: '#FB8C00' },
  helpTextOn: { color: '#FFFFFF' },
  table: { borderWidth: 1, borderColor: '#E0E4EA', borderRadius: 8, overflow: 'hidden' },
  row: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12 },
  rowHeader: { backgroundColor: '#F0F4F8' },
  rowHighlight: { backgroundColor: '#FFF3E0' },
  cell: { flex: 1, fontSize: 15, color: '#3E4C59' },
  cellHeader: { fontWeight: '600' },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E4E7EB',
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#1F2933' },
});
