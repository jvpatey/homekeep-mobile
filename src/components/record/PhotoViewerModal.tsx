import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DISMISS_PULL = 90;

export interface PhotoViewerModalProps {
  visible: boolean;
  uri: string | null;
  title?: string;
  subtitle?: string;
  onClose: () => void;
}

/** Full-bleed photo with pinch-to-zoom (iOS) and pull-down to dismiss. */
export function PhotoViewerModal({
  visible,
  uri,
  title,
  subtitle,
  onClose,
}: PhotoViewerModalProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(1);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, zoomScale } = event.nativeEvent;
    setZoom(zoomScale ?? 1);
    if ((zoomScale ?? 1) <= 1.01 && contentOffset.y < -DISMISS_PULL) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      onShow={() => {
        setLoading(true);
        setFailed(false);
        setZoom(1);
      }}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.backdrop}>
        <ScrollView
          style={StyleSheet.absoluteFill}
          contentContainerStyle={{ width, height }}
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          bouncesZoom
          alwaysBounceVertical
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={(e) => setZoom(e.nativeEvent.zoomScale ?? zoom)}
          scrollEventThrottle={16}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width, height }}
              resizeMode="contain"
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
              accessibilityIgnoresInvertColors
              accessible
              accessibilityLabel={title ? `Photo: ${title}` : "Photo"}
            />
          ) : null}
        </ScrollView>

        {loading && uri && !failed ? (
          <View style={styles.center} pointerEvents="none">
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : null}
        {failed || !uri ? (
          <View style={styles.center} pointerEvents="none">
            <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.6)" />
            <Text style={styles.failedText}>Photo unavailable</Text>
          </View>
        ) : null}

        <View
          style={[styles.topBar, { paddingTop: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          <View style={styles.titleWrap} pointerEvents="none">
            {title ? (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [styles.close, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Close photo"
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {Platform.OS === "ios" && zoom <= 1.01 && !failed ? (
          <Text
            style={[styles.hint, { bottom: insets.bottom + 16 }]}
            pointerEvents="none"
          >
            Pinch to zoom · pull down to close
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#000000" },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  failedText: { color: "rgba(255,255,255,0.7)", fontSize: 15 },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    gap: 12,
  },
  titleWrap: { flex: 1, paddingTop: 6 },
  title: { color: "#FFFFFF", fontSize: 17, fontWeight: "600" },
  subtitle: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    position: "absolute",
    alignSelf: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
  },
});
