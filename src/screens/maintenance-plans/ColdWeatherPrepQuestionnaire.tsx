import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import type { ColdWeatherPrepAnswers } from "../../data/maintenancePlans";
import {
  HOME_HEAT_SOURCE_OPTIONS,
  canonicalizeHeatSource,
} from "../../data/maintenancePlans";
import { maintenancePlansStyles } from "./styles";
import {
  QuestionnaireShell,
  QuestionCard,
  QuestionLabel,
  QuestionHint,
  ChoiceRow,
} from "./questionnaireChrome";

interface ColdWeatherPrepQuestionnaireProps {
  onComplete: (answers: ColdWeatherPrepAnswers) => void;
  onBack: () => void;
  initialAnswers?: Partial<ColdWeatherPrepAnswers> | null;
}

export function ColdWeatherPrepQuestionnaire({
  onComplete,
  onBack,
  initialAnswers,
}: ColdWeatherPrepQuestionnaireProps) {
  const { colors } = useTheme();
  const [hasLawn, setHasLawn] = useState<boolean | null>(null);
  const [propertyType, setPropertyType] = useState<
    "house" | "condo_townhome" | null
  >(null);
  const [heatSource, setHeatSource] = useState<
    ColdWeatherPrepAnswers["heatSource"] | null
  >(null);

  useEffect(() => {
    setHasLawn(initialAnswers?.hasLawn ?? null);
    setPropertyType(initialAnswers?.propertyType ?? null);
    setHeatSource(canonicalizeHeatSource(initialAnswers?.heatSource) ?? null);
  }, [initialAnswers]);

  const answered =
    Number(hasLawn !== null) +
    Number(propertyType !== null) +
    Number(heatSource !== null);
  const canContinue = answered === 3;

  const handleContinue = () => {
    if (hasLawn === null || propertyType === null || heatSource === null) {
      return;
    }
    onComplete({
      hasLawn,
      propertyType,
      heatSource,
      heatSources: [heatSource],
    });
  };

  return (
    <QuestionnaireShell
      progressLabel={`${answered} of 3 answered`}
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
        Tell us about your home so your fall and winter checklist matches what
        you maintain — yard work, roof and gutters, outdoor plumbing, and
        heating type.
      </Text>

      <QuestionCard>
        <QuestionLabel>Do you have a lawn?</QuestionLabel>
        <ChoiceRow
          label="Yes"
          selected={hasLawn === true}
          onPress={() => setHasLawn(true)}
          accessibilityLabel="Yes, I have a lawn"
        />
        <ChoiceRow
          label="No"
          selected={hasLawn === false}
          onPress={() => setHasLawn(false)}
          accessibilityLabel="No lawn"
        />
      </QuestionCard>

      <QuestionCard>
        <QuestionLabel>What best describes your home?</QuestionLabel>
        <ChoiceRow
          label="House (I maintain my own exterior)"
          selected={propertyType === "house"}
          onPress={() => setPropertyType("house")}
          accessibilityLabel="House, I maintain exterior"
        />
        <ChoiceRow
          label="Condo or townhome"
          selected={propertyType === "condo_townhome"}
          onPress={() => setPropertyType("condo_townhome")}
          accessibilityLabel="Condo or townhome"
        />
      </QuestionCard>

      <QuestionCard>
        <QuestionLabel>How do you heat your home?</QuestionLabel>
        <QuestionHint>
          Pick the main system. Setup can record more than one if you use
          several.
        </QuestionHint>
        {HOME_HEAT_SOURCE_OPTIONS.map((option) => (
          <ChoiceRow
            key={option.id}
            label={option.label}
            selected={heatSource === option.id}
            onPress={() => setHeatSource(option.id)}
            accessibilityLabel={option.label}
          />
        ))}
      </QuestionCard>
    </QuestionnaireShell>
  );
}
