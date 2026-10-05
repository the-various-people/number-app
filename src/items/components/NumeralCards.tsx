import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  /** 놓는 순서 그대로 */
  values: number[];
  perRow: number;
  /** 카드 한 장 너비 */
  cardWidth: number;
  disabled: boolean;
  selected: number | null;
  onSelect(value: number): void;
}

/** 숫자만 적힌 카드 (F2, F3). 숫자 읽기를 보는 문항이라 점을 그리지 않는다. */
export function NumeralCards({ values, perRow, cardWidth, disabled, selected, onSelect }: Props) {
  // 두 장이면 "이쪽과 저쪽"으로 보이게 멀리 띄운다.
  const gap = perRow <= 2 ? 120 : 20;
  const rows = Array.from({ length: Math.ceil(values.length / perRow) }, (_, r) =>
    values.slice(r * perRow, (r + 1) * perRow),
  );
  return (
    <View style={[styles.grid, { opacity: disabled ? 0.4 : 1 }]}>
      {rows.map((row, r) => (
        <View key={r} style={[styles.row, { gap }]}>
          {row.map((value) => (
            <Pressable
              key={value}
              disabled={disabled || selected !== null}
              onPress={() => onSelect(value)}
              style={[
                styles.card,
                { width: cardWidth, height: cardWidth * 1.25 },
                selected === value && styles.cardSelected,
              ]}
            >
              <Text style={[styles.numeral, { fontSize: cardWidth * 0.6 }]}>{value}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

/** 누를 수 없는 숫자 카드와 빈 카드 (D2 화면) */
export function NumeralFace({ value, width }: { value: number | null; width: number }) {
  return (
    <View style={[styles.card, { width, height: width * 1.25 }, value === null && styles.cardBlank]}>
      {value !== null && <Text style={[styles.numeral, { fontSize: width * 0.6 }]}>{value}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 20,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSelected: {
    borderColor: '#FFB300',
    backgroundColor: '#FFF8E1',
  },
  cardBlank: {
    borderStyle: 'dashed',
    borderColor: '#90A4AE',
    backgroundColor: 'transparent',
  },
  numeral: {
    fontWeight: '700',
    color: '#263238',
  },
});
