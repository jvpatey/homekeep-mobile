import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import type { SpringRefreshAnswers } from "../../data/maintenancePlans";
import { maintenancePlansStyles } from "./styles";
import {
  QuestionnaireShell,
  QuestionCard,
  QuestionLabel,
  QuestionHint,
  ChoiceRow,
} from "./questionnaireChrome";

interface SpringRefreshQuestionnaireProps {
  onComplete: (answers: SpringRefreshAnswers) => void;
  onBack: () => void;
  initialAnswers?: Partial<SpringRefreshAnswers> | null;
}

export function SpringRefreshQuestionnaire({
  onComplete,
  onBack,
  initialAnswers,
}: SpringRefreshQuestionnaireProps) {
  const { colors } = useTheme();
  const [hasLawn, setHasLawn] = useState<boolean | null>(null);
  const [propertyType, setPropertyType] = useState<
    "house" | "condo_townhome" | null
  >(null);
  const [heatSource, setHeatSource] = useState<
    SpringRefreshAnswers["heatSource"] | null
  >(null);

  useEffect(() => {
    setHasLawn(initialAnswers?.hasLawn ?? null);
    setPropertyType(initialAnswers?.propertyType ?? null);
    setHeatSource(initialAnswers?.heatSource ?? null);
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
    onComplete({ hasLawn, propertyType, heatSource });
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
        Tell us a bit about your home so we only add maintenance you’re
        responsible for — lawn care, exterior access, and how you heat.
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
          We use this to suggest spring HVAC tasks (for example heat pumps vs.
          gas furnaces).
        </QuestionHint>
        <ChoiceRow
          label="Gas furnace"
          selected={heatSource === "gas_furnace"}
          onPress={() => setHeatSource("gas_furnace")}
          accessibilityLabel="Gas furnace"
        />
        <ChoiceRow
          label="Heat pump"
          selected={heatSource === "heat_pump"}
          onPress={() => setHeatSource("heat_pump")}
          accessibilityLabel="Heat pump"
        />
        <ChoiceRow
          label="Electric (radiant / baseboard)"
          selected={heatSource === "electric"}
          onPress={() => setHeatSource("electric")}
          accessibilityLabel="Electric heat"
        />
        <ChoiceRow
          label="Other"
          selected={heatSource === "other"}
          onPress={() => setHeatSource("other")}
          accessibilityLabel="Other heating"
        />
      </QuestionCard>
    </QuestionnaireShell>
  );
}
