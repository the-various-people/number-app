import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

interface Props {
  min: number;
  max: number;
  showNumeral: boolean;
  /** 발문이 끝나기 전에는 고를 수 없다 */
  disabled: boolean;
  selected: number | null;
  onSelect(value: number): void;
}

const GAP = 12;
const SIDE_PADDING = 24;
const MIN_TOUCH = 64;

/** 숫자와 그만큼의 점이 함께 그려진 답 카드. 점은 10격자처럼 위 줄 5개부터 채운다. */
export function AnswerCards({ min, max, showNumeral, disabled, selected, onSelect }: Props) {
  const { width } = useWindowDimensions();
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const cardWidth = Math.max(
    MIN_TOUCH,
    Math.min(110, (width - SIDE_PADDING * 2 - GAP * (values.length - 1)) / values.length),
  );
  const dot = Math.floor(cardWidth / 7);

  return (
    <View style={[styles.row, { opacity: disabled ? 0.4 : 1 }]}>
      {values.map((value) => (
        <Pressable
          key={value}
          disabled={disabled || selected !== null}
          onPress={() => onSelect(value)}
          style={[
            styles.card,
            { width: cardWidth, minHeight: cardWidth * 1.3 },
            selected === value && styles.cardSelected,
          ]}
        >
          {showNumeral && <Text style={[styles.numeral, { fontSize: cardWidth * 0.42 }]}>{value}</Text>}
          <View style={{ gap: dot / 2 }}>
            {[0, 5].map((offset) => (
              <View key={offset} style={{ flexDirection: 'row', gap: dot / 2 }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      width: dot,
                      height: dot,
                      borderRadius: dot / 2,
                      backgroundColor: offset + i < value ? '#1E88E5' : 'transparent',
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: GAP,
    paddingHorizontal: SIDE_PADDING,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 8,
  },
  cardSelected: {
    borderColor: '#FFB300',
    backgroundColor: '#FFF8E1',
  },
  numeral: {
    fontWeight: '700',
    color: '#263238',
  },
});
