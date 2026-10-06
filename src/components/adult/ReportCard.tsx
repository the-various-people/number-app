import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ITEM_CODES } from '../../items/registry';
import { ACTIVITIES, LEVEL_LABELS } from '../../report/activities';
import {
  AREA_LABELS,
  areaReports,
  recommendations,
  startPoint,
  VERDICT_LABELS,
  type AreaReport,
  type Results,
  type StartPoint,
  type Verdict,
} from '../../report/report';

const VERDICT_COLORS: Record<Verdict, { bg: string; fg: string; bar: string }> = {
  reached: { bg: '#E8F5E9', fg: '#2E7D32', bar: '#66BB6A' },
  partial: { bg: '#FFF8E1', fg: '#B26A00', bar: '#FFB300' },
  focus: { bg: '#FFEBEE', fg: '#C62828', bar: '#EF5350' },
};

/** 어른 화면의 결과 요약: 영역별 점수·판정(3절), 출발점과 추천 놀이(4절) */
export function ReportCard({ results }: { results: Results }) {
  const reports = areaReports(ITEM_CODES, results);
  const start = startPoint(reports);
  const recs = recommendations(results);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>결과 요약</Text>

      <View style={styles.areas}>
        {reports.map((r) => (
          <AreaRow key={r.area} report={r} />
        ))}
      </View>
      <Text style={styles.muted}>
        판정: 만점의 80% 이상 도달, 50~79% 보완, 50% 미만 집중 지도. 건너뛴 문항은 0점이에요. 기준은 시범 사용 후 조정해요.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>출발점</Text>
        <Text style={styles.body}>{startText(start)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>추천 놀이</Text>
        {recs.length === 0 ? (
          <Text style={styles.body}>
            {start.kind === 'incomplete' ? '진단을 마치면 알려 드려요.' : '눈에 띄는 오류 신호가 없어요.'}
          </Text>
        ) : (
          recs.map((rec) => (
            <View key={rec.signal} style={styles.rec}>
              <Text style={styles.body}>
                <Text style={styles.bold}>{rec.signal}</Text>
                <Text style={styles.muted}> ({rec.items.join(', ')})</Text>
              </Text>
              <Text style={styles.body}>
                →{' '}
                {rec.activities.map((no, i) => (
                  <Text key={no}>
                    {i > 0 && ' → '}
                    {no}. {ACTIVITIES[no].name}
                    {!ACTIVITIES[no].implemented && <Text style={styles.muted}> (준비 중)</Text>}
                  </Text>
                ))}
                <Text style={styles.muted}> · {LEVEL_LABELS[rec.level]} 단계부터</Text>
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function startText(start: StartPoint): string {
  switch (start.kind) {
    case 'incomplete':
      return '아직 답하지 않은 문항이 있어 정할 수 없어요.';
    case 'allReached':
      return '모든 영역에 도달했어요. 다음 나이 단계 문항으로 확인해 볼 수 있어요.';
    case 'area':
      return `${AREA_LABELS[start.area]} — 선수 관계 순서(A → F)에서 처음으로 도달하지 못한 영역이에요.${
        start.alsoC ? ' C. 한눈에 알기도 함께 할 수 있어요.' : ''
      }`;
  }
}

function AreaRow({ report }: { report: AreaReport }) {
  const { area, score, max, pending, verdict } = report;
  const color = verdict ? VERDICT_COLORS[verdict] : null;
  // 휴대폰 세로처럼 좁으면 칸을 줄인다
  const narrow = useWindowDimensions().width < 600;
  return (
    <View style={[styles.areaRow, narrow && { gap: 8 }]}>
      <Text style={[styles.areaLabel, narrow && styles.areaLabelNarrow]}>{AREA_LABELS[area]}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(score / max) * 100}%`, backgroundColor: color?.bar ?? '#B0BEC5' }]} />
      </View>
      <Text style={[styles.points, narrow && { width: 48, fontSize: 13 }]}>
        {score}/{max}점
      </Text>
      {verdict && color ? (
        <View style={[styles.pill, narrow && { width: 72 }, { backgroundColor: color.bg }]}>
          <Text style={[styles.pillText, { color: color.fg }]}>{VERDICT_LABELS[verdict]}</Text>
        </View>
      ) : (
        <View style={[styles.pill, narrow && { width: 72 }, { backgroundColor: '#ECEFF1' }]}>
          <Text style={[styles.pillText, { color: '#607D8B' }]}>남은 문항 {pending}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, gap: 14 },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2933' },
  areas: { gap: 10 },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  areaLabel: { width: 150, fontSize: 16, color: '#3E4C59' },
  areaLabelNarrow: { width: 96, fontSize: 13 },
  track: { flex: 1, height: 12, borderRadius: 6, backgroundColor: '#ECEFF1', overflow: 'hidden', minWidth: 40 },
  fill: { height: '100%', borderRadius: 6 },
  points: { width: 64, fontSize: 15, color: '#3E4C59', textAlign: 'right' },
  pill: { width: 96, paddingVertical: 4, borderRadius: 999, alignItems: 'center' },
  pillText: { fontSize: 14, fontWeight: '700' },
  section: { gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#3E4C59' },
  body: { fontSize: 16, color: '#1F2933', lineHeight: 24 },
  bold: { fontWeight: '700' },
  muted: { fontSize: 14, color: '#7B8794' },
  rec: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#F0F4F8' },
});
