import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { promptPlayer } from '../../audio/player';
import { evaluateChoice, type TouchEvent } from '../../scoring';
import type { NewItemResponse } from '../../store/session';
import type { ChoiceItemDef, FillTenItemDef, FlashItemDef, HiddenOrderItemDef } from '../types';
import { AnswerCards } from './AnswerCards';
import { Dice, TenFrame } from './DotPatterns';
import { NumeralCards, NumeralFace } from './NumeralCards';
import { RewardSticker } from './RewardSticker';
import { useItemPrompt, wait, type PromptIntro } from './useItemPrompt';

interface Props {
  def: ChoiceItemDef;
  sticker: string;
  onAnswer(response: NewItemResponse): void;
}

/**
 * 답을 하나 골라 답하는 문항 (B3, C1~C3, D2, E2, F2, F3). 아이 화면이므로 글자가 없다.
 * 답 카드(F2·F3는 숫자 카드)는 발문이 끝난 뒤에 열린다. E2의 빈칸은 발문 중에도 누를 수 있다.
 * 정오 피드백 없이 어떤 답이든 같은 칭찬과 스티커를 준다.
 */
export function ChoiceItem({ def, sticker, onAnswer }: Props) {
  const { width, height } = useWindowDimensions();
  const [flashVisible, setFlashVisible] = useState(false);

  // C 영역: "잘 봐!" → 점을 showMs 동안 보여 주고 숨김 → "점이 몇 개였지?"
  const intro: PromptIntro | undefined =
    def.kind === 'flash'
      ? async (alive) => {
          await promptPlayer.play(def.introPromptId);
          if (!alive()) return;
          setFlashVisible(true);
          await wait(def.showMs);
          if (alive()) setFlashVisible(false);
        }
      : undefined;

  const { elapsed, promptEndMs } = useItemPrompt(def.promptId, intro);
  const [touches, setTouches] = useState<TouchEvent[]>([]);
  const [answer, setAnswer] = useState<number | null>(null);
  const promptDone = promptEndMs !== null;

  const handleTap = (targetIndex: number) => {
    if (answer !== null) return;
    const tMs = elapsed();
    setTouches((prev) => [...prev, { targetIndex, tMs }]);
  };

  const handleAnswer = (value: number) => {
    if (answer !== null || promptEndMs === null) return;
    const result = evaluateChoice({
      rule: def.rule,
      expected: def.answer,
      answer: value,
      promptEndMs,
      answeredAtMs: elapsed(),
      targetCount: def.kind === 'fillTen' ? 10 - def.filled : 0,
      touches,
    });
    setAnswer(value);
    onAnswer({
      itemCode: def.code,
      answer: value,
      correct: result.correct,
      autoStrategyCode: result.autoStrategy,
      responseMs: result.responseMs,
      promptEndMs,
      touches,
    });
    promptPlayer.play('praise.neutral');
  };

  // 답 카드 줄을 뺀 무대 높이 (대략)
  const stageHeight = height - 280;

  const renderStage = () => {
    switch (def.kind) {
      case 'hiddenOrder':
        return <HiddenOrderStage def={def} width={width} />;
      case 'flash':
        return <FlashStage def={def} size={Math.min(stageHeight * 0.8, width * 0.6)} visible={flashVisible} />;
      case 'nextNumber':
        return <NextNumberStage from={def.from} cardWidth={Math.min(180, stageHeight * 0.6)} />;
      case 'fillTen':
        return (
          <FillTenStage
            def={def}
            cell={Math.min(130, (width - 160) / 5, stageHeight / 2.4)}
            touches={touches}
            disabled={answer !== null}
            onTap={handleTap}
          />
        );
      case 'numeralChoice': {
        const rows = Math.ceil(def.options.length / def.perRow);
        const cardWidth = Math.min(
          def.perRow <= 2 ? 240 : 150,
          (width - 160 - (def.perRow <= 2 ? 120 : 20) * (def.perRow - 1)) / def.perRow,
          (height - 140 - 20 * (rows - 1)) / rows / 1.25,
        );
        return (
          <NumeralCards
            values={def.options}
            perRow={def.perRow}
            cardWidth={cardWidth}
            disabled={!promptDone}
            selected={answer}
            onSelect={handleAnswer}
          />
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        {renderStage()}
        <RewardSticker emoji={sticker} visible={answer !== null} />
      </View>
      {def.kind !== 'numeralChoice' && (
        <AnswerCards {...def.answerCards} disabled={!promptDone} selected={answer} onSelect={handleAnswer} />
      )}
    </View>
  );
}

/** B3: 왼쪽 깃발이 줄의 앞. hiddenIndex 자리는 가리개로 덮여 있다. */
function HiddenOrderStage({ def, width }: { def: HiddenOrderItemDef; width: number }) {
  const slots = def.animals.length + 1; // 깃발 자리 포함
  const size = Math.min(130, (width - 120) / slots - 16);
  return (
    <View style={styles.row}>
      <Text style={{ fontSize: size * 0.7 }}>🚩</Text>
      {def.animals.map((animal, i) =>
        i === def.hiddenIndex ? (
          <Cover key={i} size={size} />
        ) : (
          <View key={i} style={[styles.slot, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.75 }}>{animal}</Text>
          </View>
        ),
      )}
    </View>
  );
}

/** 가리개: 동물 하나를 덮은 천 */
function Cover({ size }: { size: number }) {
  return (
    <View style={[styles.slot, { width: size, height: size, pointerEvents: 'none' }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d="M10 92 L18 22 Q50 2 82 22 L90 92 Z" fill="#8D6E63" />
        <Path d="M34 14 L30 92 M50 8 L50 92 M66 14 L70 92" stroke="#6D4C41" strokeWidth={4} fill="none" />
      </Svg>
    </View>
  );
}

function FlashStage({ def, size, visible }: { def: FlashItemDef; size: number; visible: boolean }) {
  return def.pattern === 'dice' ? (
    <Dice size={Math.min(size, 320)} count={def.count} showDots={visible} />
  ) : (
    <TenFrame cell={Math.min(size / 5, 120)} filled={def.count} showDots={visible} />
  );
}

/** D2: [7] → [ ] */
function NextNumberStage({ from, cardWidth }: { from: number; cardWidth: number }) {
  const arrow = cardWidth * 0.6;
  return (
    <View style={[styles.row, { gap: 32 }]}>
      <NumeralFace value={from} width={cardWidth} />
      <Svg width={arrow} height={arrow} viewBox="0 0 100 100">
        <Path d="M10 50 L80 50 M55 25 L82 50 L55 75" stroke="#78909C" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <NumeralFace value={null} width={cardWidth} />
    </View>
  );
}

function FillTenStage({
  def,
  cell,
  touches,
  disabled,
  onTap,
}: {
  def: FillTenItemDef;
  cell: number;
  touches: TouchEvent[];
  disabled: boolean;
  onTap(emptyIndex: number): void;
}) {
  const emptyCount = 10 - def.filled;
  const tapCounts = Array.from({ length: emptyCount }, (_, i) => touches.filter((t) => t.targetIndex === i).length);
  return (
    <TenFrame
      cell={cell}
      filled={def.filled}
      showDots
      emptyTapCounts={tapCounts}
      onTapEmpty={onTap}
      disabled={disabled}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 24,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 48,
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
