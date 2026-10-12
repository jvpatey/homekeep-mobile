import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { useHaptics } from "../../hooks";
import {
  AiError,
  AiService,
  AssistantAction,
} from "../../services/AiService";
import { buildRoutinePayloadsFromItems } from "../../data/maintenancePlans";
import { formatRoutineInterval } from "../all-reminders/groupRoutines";
import { AppTabsParamList } from "../../navigation/types";
import { DesignSystem } from "../../theme/designSystem";
import { HearthSheet } from "../ui/HearthSheet";

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: AssistantAction[];
  failed?: boolean;
}

let turnSeq = 0;
const nextId = () => `turn-${++turnSeq}`;

function starterPrompts(equipmentName: string | null): string[] {
  if (equipmentName) {
    return [
      `What does the ${equipmentName} need this year?`,
      `Which parts or filters does the ${equipmentName} use?`,
      `Is the ${equipmentName} still under warranty?`,
    ];
  }
  return [
    "What should I take care of this month?",
    "Where's the main water shutoff?",
    "When did we last change the furnace filter?",
  ];
}

/**
 * Ask HomeKeep: chat grounded in this home's systems, equipment, schedule,
 * emergency spots, and recent work. HomeKeep + only (checked server-side).
 */
export function AssistantSheet({
  visible,
  onClose,
  equipment = null,
}: {
  visible: boolean;
  onClose: () => void;
  /** Scope the conversation to one piece of equipment. */
  equipment?: { id: string; name: string } | null;
}) {
  const { colors } = useTheme();
  const { triggerLight, triggerSuccess } = useHaptics();
  const { createTask } = useTasks();
  const { presentPaywall } = useSubscription();
  const navigation = useNavigation<NavigationProp<AppTabsParamList>>();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTurns([]);
    setAdded(new Set());
    setDraft("");
  }, [equipment?.id]);

  useEffect(() => {
    const timer = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      60
    );
    return () => clearTimeout(timer);
  }, [turns.length, sending]);

  const send = async (text: string, history: ChatTurn[] = turns) => {
    const question = text.trim();
    if (!question || sending) return;
    triggerLight();
    const userTurn: ChatTurn = { id: nextId(), role: "user", text: question };
    const base = history.filter((turn) => !turn.failed);
    const next = [...base, userTurn];
    setTurns(next);
    setDraft("");
    setSending(true);
    try {
      const { result } = await AiService.chat(
        next.map(({ role, text: body }) => ({ role, text: body })),
        equipment?.id ?? null
      );
      setTurns((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text: result.reply,
          actions: result.actions,
        },
      ]);
    } catch (error) {
      if (error instanceof AiError && error.code === "plus_required") {
        setTurns(base);
        setDraft(question);
        void presentPaywall({ force: true, reason: "assistant" });
        return;
      }
      setTurns((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text:
            error instanceof AiError
              ? error.message
              : "Something went wrong. Try again.",
          failed: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const retry = () => {
    const lastUser = [...turns].reverse().find((turn) => turn.role === "user");
    if (!lastUser) return;
    const index = turns.lastIndexOf(lastUser);
    void send(lastUser.text, turns.slice(0, index));
  };

  const runAction = async (action: AssistantAction, key: string) => {
    triggerLight();
    if (action.type === "open_emergency") {
      onClose();
      navigation.navigate("RecordTab", { screen: "EmergencyInfo" });
      return;
    }
    if (added.has(key)) return;
    const [payload] = buildRoutinePayloadsFromItems([
      {
        title: action.title,
        description: action.description ?? undefined,
        category: action.category,
        priority: "medium",
        estimated_duration_minutes: 30,
        interval_days: action.interval_days,
      },
    ]);
    const result = await createTask({
      ...payload,
      equipment_id: equipment?.id ?? null,
    });
    if (result.success) {
      await triggerSuccess();
      setAdded((prev) => new Set(prev).add(key));
    }
  };

  const prompts = starterPrompts(equipment?.name ?? null);

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title={equipment ? `Ask about ${equipment.name}` : "Ask HomeKeep"}
      fillMaxHeight
      maxHeightRatio={0.9}
      headerRight={
        turns.length > 0 ? (
          <Pressable
            onPress={() => {
              triggerLight();
              setTurns([]);
              setAdded(new Set());
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Start a new conversation"
          >
            <Ionicons name="refresh" size={20} color={colors.textSecondary} />
          </Pressable>
        ) : undefined
      }
      footer={
        <View
          style={[
            styles.composer,
            { backgroundColor: colors.fieldFill, borderColor: colors.border },
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask about your home"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text }]}
            multiline
            maxLength={2000}
            accessibilityLabel="Your question"
          />
          <Pressable
            onPress={() => void send(draft)}
            disabled={!draft.trim() || sending}
            style={[
              styles.send,
              {
                backgroundColor:
                  draft.trim() && !sending ? colors.primary : colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Send"
          >
            <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      }
    >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {turns.length === 0 ? (
          <View style={styles.intro}>
            <Text style={[styles.introText, { color: colors.textSecondary }]}>
              Answers use your equipment, schedule, shutoffs, and recent work.
              For anything urgent with gas, water, or electricity, call a pro.
            </Text>
            {prompts.map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => void send(prompt)}
                style={[styles.prompt, { borderColor: colors.border }]}
                accessibilityRole="button"
              >
                <Ionicons
                  name="sparkles-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.promptText, { color: colors.text }]}>
                  {prompt}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {turns.map((turn) => (
          <View
            key={turn.id}
            style={[
              styles.bubble,
              turn.role === "user"
                ? [styles.userBubble, { backgroundColor: colors.primary }]
                : [
                    styles.botBubble,
                    {
                      backgroundColor: turn.failed
                        ? colors.error + "14"
                        : colors.fieldFill,
                    },
                  ],
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                {
                  color:
                    turn.role === "user"
                      ? "#FFFFFF"
                      : turn.failed
                        ? colors.error
                        : colors.text,
                },
              ]}
              selectable
            >
              {turn.text}
            </Text>
            {turn.failed ? (
              <Pressable onPress={retry} hitSlop={8} accessibilityRole="button">
                <Text style={[styles.retry, { color: colors.primary }]}>
                  Try again
                </Text>
              </Pressable>
            ) : null}
            {turn.actions?.map((action, index) => {
              const key = `${turn.id}-${index}`;
              const done = added.has(key);
              return (
                <Pressable
                  key={key}
                  onPress={() => void runAction(action, key)}
                  disabled={done}
                  style={[
                    styles.action,
                    {
                      borderColor: colors.primary + "55",
                      backgroundColor: colors.surface,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={
                      action.type === "open_emergency"
                        ? "alert-circle-outline"
                        : done
                          ? "checkmark-circle"
                          : "add-circle-outline"
                    }
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.actionText, { color: colors.primary }]}
                    numberOfLines={2}
                  >
                    {action.type === "open_emergency"
                      ? `Open ${action.label}`
                      : done
                        ? `Added: ${action.title}`
                        : `Add reminder: ${action.title} · ${formatRoutineInterval(action.interval_days)}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        {sending ? (
          <View
            style={[
              styles.bubble,
              styles.botBubble,
              { backgroundColor: colors.fieldFill },
            ]}
          >
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}
      </ScrollView>
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
  },
  intro: {
    gap: DesignSystem.spacing.sm,
  },
  introText: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    marginBottom: DesignSystem.spacing.xs,
  },
  prompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
  },
  promptText: {
    ...DesignSystem.typography.body,
    flex: 1,
  },
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 2,
    borderRadius: DesignSystem.borders.radius.large,
    gap: DesignSystem.spacing.sm,
  },
  userBubble: {
    alignSelf: "flex-end",
  },
  botBubble: {
    alignSelf: "flex-start",
  },
  bubbleText: {
    ...DesignSystem.typography.body,
  },
  retry: {
    ...DesignSystem.typography.smallSemiBold,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs + 2,
    paddingHorizontal: DesignSystem.spacing.sm + 2,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
  },
  actionText: {
    ...DesignSystem.typography.smallSemiBold,
    flexShrink: 1,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: DesignSystem.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: DesignSystem.borders.radius.large,
    paddingLeft: DesignSystem.spacing.md,
    paddingRight: DesignSystem.spacing.xs + 2,
    paddingVertical: DesignSystem.spacing.xs + 2,
  },
  input: {
    ...DesignSystem.typography.body,
    flex: 1,
    maxHeight: 120,
    paddingVertical: DesignSystem.spacing.sm,
  },
  send: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
