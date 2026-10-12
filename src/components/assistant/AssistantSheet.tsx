import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { useHaptics } from "../../hooks";
import { AiError, AiService, AssistantAction } from "../../services/AiService";
import { DesignSystem } from "../../theme/designSystem";
import { HearthSheet } from "../ui/HearthSheet";
import { useProfile } from "../../context/ProfileContext";
import { formatProfileAddressLines } from "../../utils/formatProfileAddress";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { KeeperMark } from "./KeeperMark";
import { useKeeperActions } from "./useKeeperActions";

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
    "Log that I changed the furnace filter today",
    "Where's the main water shutoff?",
  ];
}

function TypingDot({ index }: { index: number }) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const lift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    lift.value = withDelay(
      index * 140,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: 260 }),
        ),
        -1,
      ),
    );
  }, [index, reduceMotion, lift]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + lift.value * 0.65,
    transform: [{ translateY: -lift.value * 4 }],
  }));

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: colors.primary }, style]}
    />
  );
}

/**
 * Keeper, HomeKeep's AI assistant: chat grounded in this home's systems, equipment, schedule,
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
  const { profile } = useProfile();
  const { triggerLight, triggerSuccess, triggerError } = useHaptics();
  const { presentPaywall } = useSubscription();
  const keeper = useKeeperActions({
    equipmentId: equipment?.id ?? null,
    onLeave: onClose,
  });
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  /** Saved action keys, with a way to open what was saved. */
  const [saved, setSaved] = useState<Record<string, { view?: () => void }>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTurns([]);
    setSaved({});
    setDraft("");
  }, [equipment?.id]);

  useEffect(() => {
    const timer = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      60,
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
        equipment?.id ?? null,
      );
      if (__DEV__ && result.rejected?.length) {
        console.warn(
          "Keeper rejected actions",
          JSON.stringify(result.rejected),
        );
      }
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
    const done = saved[key];
    if (done) {
      done.view?.();
      return;
    }
    if (saving.has(key)) return;
    setSaving((prev) => new Set(prev).add(key));
    try {
      const result = await keeper.run(action);
      if (action.type === "open_emergency") return;
      if (result.error) {
        await triggerError();
        Alert.alert("Couldn't save that", result.error);
        return;
      }
      await triggerSuccess();
      setSaved((prev) => ({ ...prev, [key]: { view: result.view } }));
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const prompts = starterPrompts(equipment?.name ?? null);
  const street = formatProfileAddressLines(profile)[0];
  const heroBody = equipment
    ? `Ask me anything about the ${equipment.name}. I know its parts, upkeep, and what's been done, and I can save details, repairs, and reminders for you.`
    : `Ask me anything about ${street ?? "your home"}. I know your equipment, schedule, shutoffs, and recent work, and I can save reminders, repairs, equipment, pros, paint colours, and notes for you.`;

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title={equipment ? `Keeper · ${equipment.name}` : "Keeper"}
      fillMaxHeight
      maxHeightRatio={0.9}
      headerRight={
        turns.length > 0 ? (
          <Pressable
            onPress={() => {
              triggerLight();
              setTurns([]);
              setSaved({});
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
            placeholder="Ask Keeper anything…"
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
            <View style={styles.hero}>
              <KeeperMark size={88} greet />
              <Text style={[styles.heroEyebrow, { color: colors.primary }]}>
                Your HomeKeep AI
              </Text>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                Hi, I'm Keeper
              </Text>
              <Text style={[styles.heroBody, { color: colors.textSecondary }]}>
                {heroBody}
              </Text>
            </View>
            <Text style={[styles.tryLabel, { color: colors.textSecondary }]}>
              Try asking
            </Text>
            {prompts.map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => void send(prompt)}
                style={({ pressed }) => [
                  styles.prompt,
                  {
                    borderColor: colors.primary + "33",
                    backgroundColor: colors.primary + "0D",
                  },
                  pressed && { opacity: 0.6 },
                ]}
                accessibilityRole="button"
              >
                <Ionicons name="sparkles" size={15} color={colors.primary} />
                <Text style={[styles.promptText, { color: colors.text }]}>
                  {prompt}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={colors.textSecondary}
                />
              </Pressable>
            ))}
            <Text style={[styles.safety, { color: colors.textSecondary }]}>
              For anything urgent with gas, water, or electricity, call a pro.
            </Text>
          </View>
        ) : null}

        {turns.map((turn) => {
          const bubble = (
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
                <Pressable
                  onPress={retry}
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <Text style={[styles.retry, { color: colors.primary }]}>
                    Try again
                  </Text>
                </Pressable>
              ) : null}
              {turn.actions?.map((action, index) => {
                const key = `${turn.id}-${index}`;
                const done = saved[key];
                const busy = saving.has(key);
                const view = keeper.describe(action);
                const navigates = action.type === "open_emergency";
                return (
                  <Pressable
                    key={key}
                    onPress={() => void runAction(action, key)}
                    disabled={busy || (done && !done.view)}
                    style={({ pressed }) => [
                      styles.action,
                      {
                        borderColor: done
                          ? colors.success + "55"
                          : colors.primary + "44",
                        backgroundColor: colors.surface,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${done ? "Saved" : view.kind}: ${view.title}${view.detail ? `, ${view.detail}` : ""}`}
                    accessibilityHint={
                      done?.view ? "Opens where it was saved" : undefined
                    }
                  >
                    <View
                      style={[
                        styles.actionIcon,
                        {
                          backgroundColor: done
                            ? colors.success + "1F"
                            : colors.primary + "14",
                        },
                      ]}
                    >
                      {view.swatch && !done ? (
                        <View
                          style={[
                            styles.swatch,
                            {
                              backgroundColor: view.swatch,
                              borderColor: colors.border,
                            },
                          ]}
                        />
                      ) : (
                        <Ionicons
                          name={done ? "checkmark" : view.icon}
                          size={16}
                          color={done ? colors.success : colors.primary}
                        />
                      )}
                    </View>
                    <View style={styles.actionBody}>
                      <Text
                        style={[
                          styles.actionKind,
                          { color: done ? colors.success : colors.primary },
                        ]}
                      >
                        {done ? "Saved" : view.kind}
                      </Text>
                      <Text
                        style={[styles.actionTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {view.title}
                      </Text>
                      {view.detail ? (
                        <Text
                          style={[
                            styles.actionDetail,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={2}
                        >
                          {view.detail}
                        </Text>
                      ) : null}
                    </View>
                    {busy ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : done ? (
                      done.view ? (
                        <Text
                          style={[styles.actionCta, { color: colors.primary }]}
                        >
                          View
                        </Text>
                      ) : null
                    ) : (
                      <View
                        style={[
                          styles.actionButton,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text style={styles.actionButtonText}>
                          {navigates ? "Open" : "Save"}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          );
          return turn.role === "user" ? (
            bubble
          ) : (
            <View key={turn.id} style={styles.botRow}>
              <KeeperMark size={28} badge={false} />
              {bubble}
            </View>
          );
        })}

        {sending ? (
          <View
            style={styles.botRow}
            accessibilityLabel="Keeper is thinking"
            accessibilityLiveRegion="polite"
          >
            <KeeperMark size={28} mood="thinking" badge={false} />
            <View
              style={[
                styles.bubble,
                styles.botBubble,
                styles.typing,
                { backgroundColor: colors.fieldFill },
              ]}
            >
              {[0, 1, 2].map((index) => (
                <TypingDot key={index} index={index} />
              ))}
            </View>
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
  hero: {
    alignItems: "center",
    paddingTop: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
  },
  heroEyebrow: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: DesignSystem.spacing.md,
  },
  heroTitle: {
    ...DesignSystem.typography.title2,
    textAlign: "center",
    marginTop: DesignSystem.spacing.xs,
  },
  heroBody: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm,
  },
  tryLabel: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: DesignSystem.spacing.xs,
  },
  prompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 4,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: 1,
  },
  promptText: {
    ...DesignSystem.typography.callout,
    flex: 1,
  },
  safety: {
    ...DesignSystem.typography.caption,
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm,
  },
  bubble: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 2,
    borderRadius: DesignSystem.borders.radius.large,
    gap: DesignSystem.spacing.sm,
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "88%",
    borderBottomRightRadius: 6,
  },
  botRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: DesignSystem.spacing.sm,
    maxWidth: "94%",
    paddingTop: 4,
  },
  botBubble: {
    flexShrink: 1,
    borderBottomLeftRadius: 6,
  },
  typing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: DesignSystem.spacing.md,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
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
    gap: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.sm + 2,
    paddingVertical: DesignSystem.spacing.sm + 2,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: 1,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionBody: {
    flex: 1,
    minWidth: 0,
  },
  actionKind: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontSize: 10,
  },
  actionTitle: {
    ...DesignSystem.typography.smallSemiBold,
    marginTop: 1,
  },
  actionDetail: {
    ...DesignSystem.typography.caption,
    marginTop: 1,
  },
  actionButton: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: 6,
    borderRadius: DesignSystem.borders.radius.round,
  },
  actionButtonText: {
    ...DesignSystem.typography.smallSemiBold,
    color: "#FFFFFF",
  },
  actionCta: {
    ...DesignSystem.typography.smallSemiBold,
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
