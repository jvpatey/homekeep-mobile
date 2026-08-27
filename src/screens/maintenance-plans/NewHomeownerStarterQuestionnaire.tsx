import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import type { NewHomeownerStarterAnswers } from "../../data/maintenancePlans";
import { maintenancePlansStyles } from "./styles";
import {
  QuestionnaireShell,
  QuestionCard,
  QuestionLabel,
  QuestionHint,
  ChoiceRow,
} from "./questionnaireChrome";

interface NewHomeownerStarterQuestionnaireProps {
  onComplete: (answers: NewHomeownerStarterAnswers) => void;
  onBack: () => void;
  initialAnswers?: Partial<NewHomeownerStarterAnswers> | null;
}

export function NewHomeownerStarterQuestionnaire({
  onComplete,
  onBack,
  initialAnswers,
}: NewHomeownerStarterQuestionnaireProps) {
  const { colors } = useTheme();
  const [hasHeatPump, setHasHeatPump] = useState<boolean | null>(null);
  const [hasAirExchanger, setHasAirExchanger] = useState<boolean | null>(null);
  const [hasWaterSoftener, setHasWaterSoftener] = useState<boolean | null>(
    null
  );
  const [hasRefrigeratorWaterFilter, setHasRefrigeratorWaterFilter] =
    useState<boolean | null>(null);
  const [hasVentHoodFilters, setHasVentHoodFilters] = useState<boolean | null>(
    null
  );
  const [hasSeptic, setHasSeptic] = useState<boolean | null>(null);

  useEffect(() => {
    setHasHeatPump(initialAnswers?.hasHeatPump ?? null);
    setHasAirExchanger(initialAnswers?.hasAirExchanger ?? null);
    setHasWaterSoftener(initialAnswers?.hasWaterSoftener ?? null);
    setHasRefrigeratorWaterFilter(
      initialAnswers?.hasRefrigeratorWaterFilter ?? null
    );
    setHasVentHoodFilters(initialAnswers?.hasVentHoodFilters ?? null);
    setHasSeptic(initialAnswers?.hasSeptic ?? null);
  }, [initialAnswers]);

  const answered =
    Number(hasHeatPump !== null) +
    Number(hasAirExchanger !== null) +
    Number(hasWaterSoftener !== null) +
    Number(hasRefrigeratorWaterFilter !== null) +
    Number(hasVentHoodFilters !== null) +
    Number(hasSeptic !== null);
  const canContinue = answered === 6;

  const handleContinue = () => {
    if (
      hasHeatPump === null ||
      hasAirExchanger === null ||
      hasWaterSoftener === null ||
      hasRefrigeratorWaterFilter === null ||
      hasVentHoodFilters === null ||
      hasSeptic === null
    ) {
      return;
    }
    onComplete({
      hasHeatPump,
      hasAirExchanger,
      hasWaterSoftener,
      hasRefrigeratorWaterFilter,
      hasVentHoodFilters,
      hasSeptic,
    });
  };

  return (
    <QuestionnaireShell
      progressLabel={`${answered} of 6 answered`}
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
        A few quick answers so we only add equipment-specific routines—heat
        pump, ventilator, softener, fridge filter, vent hood, septic—when they
        apply.
      </Text>

      <QuestionCard>
        <QuestionLabel>Do you have a heat pump?</QuestionLabel>
        <QuestionHint>
          Includes ducted heat pumps and mini-splits used for heating or
          cooling. Choose No if you only use a furnace, boiler, or baseboards.
        </QuestionHint>
        <ChoiceRow
          label="Yes"
          selected={hasHeatPump === true}
          onPress={() => setHasHeatPump(true)}
          accessibilityLabel="Yes, I have a heat pump"
        />
        <ChoiceRow
          label="No"
          selected={hasHeatPump === false}
          onPress={() => setHasHeatPump(false)}
          accessibilityLabel="No heat pump"
        />
      </QuestionCard>

      <QuestionCard>
        <QuestionLabel>
          Do you have an HRV, ERV, or whole-home air exchanger?
        </QuestionLabel>
        <QuestionHint>
          Some newer homes have balanced ventilation (labeled HRV or ERV). Skip
          if you only use bathroom fans or open windows for fresh air.
        </QuestionHint>
        <ChoiceRow
          label="Yes"
          selected={hasAirExchanger === true}
          onPress={() => setHasAirExchanger(true)}
          accessibilityLabel="Yes, I have HRV or ERV"
        />
        <ChoiceRow
          label="No"
          selected={hasAirExchanger === false}
          onPress={() => setHasAirExchanger(false)}
          accessibilityLabel="No whole-home air exchanger"
        />
      </QuestionCard>

      <QuestionCard>
        <QuestionLabel>Do you have a water softener?</QuestionLabel>
        <QuestionHint>
          Usually a brine tank near the mechanical room or garage. Choose No if
          you are on municipal water only or use another treatment.
        </QuestionHint>
        <ChoiceRow
          label="Yes"
          selected={hasWaterSoftener === true}
          onPress={() => setHasWaterSoftener(true)}
          accessibilityLabel="Yes, I have a water softener"
        />
        <ChoiceRow
          label="No"
          selected={hasWaterSoftener === false}
          onPress={() => setHasWaterSoftener(false)}
          accessibilityLabel="No water softener"
        />
      </QuestionCard>

      <QuestionCard>
        <QuestionLabel>
          Does your refrigerator have a replaceable water filter?
        </QuestionLabel>
        <QuestionHint>
          Common if you have a water or ice dispenser through the door. Choose
          No if your fridge has no filter or you never use the dispenser.
        </QuestionHint>
        <ChoiceRow
          label="Yes"
          selected={hasRefrigeratorWaterFilter === true}
          onPress={() => setHasRefrigeratorWaterFilter(true)}
          accessibilityLabel="Yes, refrigerator has water filter"
        />
        <ChoiceRow
          label="No"
          selected={hasRefrigeratorWaterFilter === false}
          onPress={() => setHasRefrigeratorWaterFilter(false)}
          accessibilityLabel="No refrigerator water filter"
        />
      </QuestionCard>

      <QuestionCard>
        <QuestionLabel>
          Does your kitchen have a vent hood or microwave hood with grease
          filters?
        </QuestionLabel>
        <QuestionHint>
          Most hoods and over-the-range microwaves have removable metal mesh
          filters. Choose No only if you truly have no hood or downdraft with
          filters to clean.
        </QuestionHint>
        <ChoiceRow
          label="Yes"
          selected={hasVentHoodFilters === true}
          onPress={() => setHasVentHoodFilters(true)}
          accessibilityLabel="Yes, kitchen vent hood with grease filters"
        />
        <ChoiceRow
          label="No"
          selected={hasVentHoodFilters === false}
          onPress={() => setHasVentHoodFilters(false)}
          accessibilityLabel="No vent hood grease filters"
        />
      </QuestionCard>

      <QuestionCard>
        <QuestionLabel>Do you have a septic system?</QuestionLabel>
        <QuestionHint>
          Private tank and drain field—not city sewer. Choose No if your bill
          lists sewer charges or you know you are hooked up to municipal lines.
        </QuestionHint>
        <ChoiceRow
          label="Yes"
          selected={hasSeptic === true}
          onPress={() => setHasSeptic(true)}
          accessibilityLabel="Yes, I have septic"
        />
        <ChoiceRow
          label="No"
          selected={hasSeptic === false}
          onPress={() => setHasSeptic(false)}
          accessibilityLabel="No septic, connected to sewer"
        />
      </QuestionCard>
    </QuestionnaireShell>
  );
}
