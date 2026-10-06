import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { repository } from '../../db/repository';
import { toCsv } from '../../export/csv';
import { collectRows, exportFileName } from '../../export/records';
import { saveTextFile } from '../../export/save';

/**
 * 어른 화면 아래쪽: 이 기기의 모든 진단 기록을 CSV(엑셀에서 열림)로 내보낸다.
 * 기록은 이 기기 안에만 있어서, 브라우저 기록을 지우거나 기기를 바꾸면 사라진다. 그래서 내보내 보관한다.
 */
export function ExportPanel() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const exportAll = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const rows = await collectRows(repository);
      const count = rows.length - 1; // 머리줄 빼고
      if (count === 0) {
        setMessage('내보낼 진단 기록이 아직 없어요.');
        return;
      }
      const how = await saveTextFile(exportFileName(new Date()), toCsv(rows));
      setMessage(
        how === 'saved'
          ? `문항 결과 ${count}줄을 파일로 저장했어요. 다운로드(파일) 폴더를 확인하세요.`
          : `문항 결과 ${count}줄을 보냈어요.`,
      );
    } catch (e) {
      console.warn('내보내지 못했어요', e);
      setMessage('내보내지 못했어요. 다시 해 보세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <View style={styles.texts}>
          <Text style={styles.title}>기록 내보내기</Text>
          <Text style={styles.muted}>
            모든 아이의 진단 기록을 엑셀에서 열 수 있는 파일(CSV)로 저장해요. 기록은 이 기기에만 있으니 가끔 내보내
            보관해 주세요.
          </Text>
        </View>
        <Pressable onPress={exportAll} disabled={busy} style={[styles.button, busy && styles.busy]}>
          <Text style={styles.buttonText}>{busy ? '모으는 중…' : '⬇ CSV로 내보내기'}</Text>
        </Pressable>
      </View>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  texts: { flex: 1, minWidth: 240, gap: 4 },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2933' },
  muted: { fontSize: 14, color: '#7B8794' },
  button: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: '#1E88E5' },
  busy: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  message: { fontSize: 15, color: '#3E4C59' },
});
