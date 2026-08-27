import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import type { PoolSpaAnswers } from "../../data/maintenancePlans";
import { maintenancePlansStyles } from "./styles";
import {
  QuestionnaireShell,
  QuestionCard,
  QuestionLabel,
  QuestionHint,
  ChoiceRow,
} from "./questionnaireChrome";

interface PoolSpaQuestionnaireProps {
  onComplete: (answers: PoolSpaAnswers) => void;
  onBack: () => void;
  initialAnswers?: Partial<PoolSpaAnswers> | null;
}

export function PoolSpaQuestionnaire({
  onComplete,
  onBack,
  initialAnswers,
}: PoolSpaQuestionnaireProps) {
  const { colors } = useTheme();
  const [hasPool, setHasPool] = useState<boolean | null>(null);
  const [hasSpa, setHasSpa] = useState<boolean | null>(null);
  const [poolUsesSaltChlorination, setPoolUsesSaltChlorination] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    setHasPool(initialAnswers?.hasPool ?? null);
    setHasSpa(initialAnswers?.hasSpa ?? null);
    setPoolUsesSaltChlorination(
      initialAnswers?.poolUsesSaltChlorination ?? null
    );
  }, [initialAnswers]);

  useEffect(() => {
    if (hasPool === false) {
      setPoolUsesSaltChlorination(null);
    }
  }, [hasPool]);

  const hasAtLeastOne = hasPool === true || hasSpa === true;
  const saltAnsweredIfNeeded =
    hasPool !== true ||
    poolUsesSaltChlorination === true ||
    poolUsesSaltChlorination === false;

  const totalQuestions = hasPool === true ? 3 : 2;
  const answered =
    Number(hasPool !== null) +
    Number(hasSpa !== null) +
    Number(hasPool === true && poolUsesSaltChlorination !== null);

  const canContinue =
    hasPool !== null && hasSpa !== null && hasAtLeastOne && saltAnsweredIfNeeded;

  const handleContinue = () => {
    if (!canContinue || hasPool === null || hasSpa === null) return;
    const salt =
      hasPool && poolUsesSaltChlorination !== null
        ? poolUsesSaltChlorination
        : false;
    onComplete({
      hasPool,
      hasSpa,
      poolUsesSaltChlorination: salt,
    });
  };

  return (
    <QuestionnaireShell
      progressLabel={`${answered} of ${totalQuestions} answered`}
      canContinue={canContinue}
      onContinue={handleContinue}
      onCancel={onBack}
    >
      <Text
        style={[
          maintenancePlansStyles.questionnaireIntro,
          { color: colors.textSecondary },
        ]}
      >
        Tell us what you maintain so we include pool care, spa care, and salt
        cell cleaning only when they apply.
      </Text>

      <QuestionCard>
        <QuestionLabel>Do you have a swimming pool?</QuestionLabel>
        <ChoiceRow
          label="Yes"
          selected={hasPool === true}
          onPress={() => setHasPool(true)}
          accessibilityLabel="Yes, I have a pool"
        />
        <ChoiceRow
          label="No"
          selected={hasPool === false}
          onPress={() => setHasPool(false)}
          accessibilityLabel="No swimming pool"
        />
      </QuestionCard>

      <QuestionCard>
        <QuestionLabel>Do you have a hot tub or spa?</QuestionLabel>
        <ChoiceRow
          label="Yes"
          selected={hasSpa === true}
          onPress={() => setHasSpa(true)}
          accessibilityLabel="Yes, I have a hot tub or spa"
        />
        <ChoiceRow
          label="No"
          selected={hasSpa === false}
          onPress={() => setHasSpa(false)}
          accessibilityLabel="No hot tub or spa"
        />
      </QuestionCard>

      {hasPool === true ? (
        <QuestionCard>
          <QuestionLabel>Does your pool use salt chlorination?</QuestionLabel>
          <QuestionHint>
            Saltwater systems generate chlorine from a salt cell. Choose No if
            you use tablets, liquid chlorine, or a non-salt sanitizer only.
          </QuestionHint>
          <ChoiceRow
            label="Yes"
            selected={poolUsesSaltChlorination === true}
            onPress={() => setPoolUsesSaltChlorination(true)}
            accessibilityLabel="Yes, salt chlorination"
          />
          <ChoiceRow
            label="No"
            selected={poolUsesSaltChlorination === false}
            onPress={() => setPoolUsesSaltChlorination(false)}
            accessibilityLabel="No salt chlorination"
          />
        </QuestionCard>
      ) : null}

      {hasPool === false && hasSpa === false ? (
        <Text
          style={[
            maintenancePlansStyles.warningHint,
            { color: colors.textSecondary },
          ]}
        >
          Choose at least a pool or a spa to continue.
        </Text>
      ) : null}
    </QuestionnaireShell>
  );
}
