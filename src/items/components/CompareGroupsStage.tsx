import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CompareGroupsItemDef } from '../types';

interface Props {
  def: CompareGroupsItemDef;
  panelWidth: number;
  panelHeight: number;
  disabled: boolean;
  /** 고른 무리의 개수 */
  selected: number | null;
  onSelect(count: number): void;
}

/**
 * F1: 두 무리를 왼쪽·오른쪽 판에 놓는다. 판을 누르면 답이 된다(발문이 끝난 뒤).
 * big 무리는 크게 그려 판을 꽉 채우고, small 무리는 작게 가운데 모아 "크기에 속는지"를 본다.
 */
export function CompareGroupsStage({ def, panelWidth, panelHeight, disabled, selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {def.groups.map((group, g) => {
        const big = group.size === 'big';
        const perRow = big ? 2 : 3;
        const fontSize = big ? Math.min(panelWidth / 3, panelHeight / 3.2) : Math.min(panelWidth, panelHeight) / 9;
        const rows = Array.from({ length: Math.ceil(group.count / perRow) }, (_, r) =>
          Array.from({ length: Math.min(perRow, group.count - r * perRow) }, () => group.emoji),
        );
        return (
          <Pressable
            key={g}
            disabled={disabled || selected !== null}
            onPress={() => onSelect(group.count)}
            style={[
              styles.panel,
              { width: panelWidth, height: panelHeight, opacity: disabled ? 0.6 : 1 },
              selected === group.count && styles.panelSelected,
            ]}
          >
            {rows.map((row, r) => (
              <View key={r} style={[styles.groupRow, { gap: big ? fontSize * 0.2 : fontSize * 0.1 }]}>
                {row.map((emoji, i) => (
                  <Text key={i} style={{ fontSize }}>
                    {emoji}
                  </Text>
                ))}
              </View>
            ))}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 40,
  },
  panel: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  panelSelected: {
    borderColor: '#FFB300',
    backgroundColor: '#FFF8E1',
  },
  groupRow: {
    flexDirection: 'row',
  },
});
