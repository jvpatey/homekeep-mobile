import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, View, Text, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Defs, Mask, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../ui";
import { AvatarCrop } from "../../../types/avatar";
import {
  AVATAR_MAX_ZOOM,
  AVATAR_MIN_ZOOM,
  avatarBaseScale,
  avatarCropToTransform,
  transformToAvatarCrop,
} from "../../../utils/avatarCrop";
import { getImageSize } from "../../../services/AvatarStorageService";
import { DesignSystem } from "../../../theme/designSystem";
import { styles } from "./styles";

interface AvatarCropModalProps {
  visible: boolean;
  imageUri: string | null;
  imageSize?: { width: number; height: number } | null;
  initialCrop?: AvatarCrop | null;
  onCancel: () => void;
  onConfirm: (crop: AvatarCrop) => void;
}

function clampTranslation(
  nextTx: number,
  nextTy: number,
  zoom: number,
  displayWidth: number,
  displayHeight: number,
  circleSize: number
) {
  "worklet";
  const width = displayWidth * zoom;
  const height = displayHeight * zoom;
  const minX = circleSize / 2 - width / 2;
  const maxX = width / 2 - circleSize / 2;
  const minY = circleSize / 2 - height / 2;
  const maxY = height / 2 - circleSize / 2;
  return {
    x: minX <= maxX ? Math.min(maxX, Math.max(minX, nextTx)) : 0,
    y: minY <= maxY ? Math.min(maxY, Math.max(minY, nextTy)) : 0,
  };
}

export function AvatarCropModal({
  visible,
  imageUri,
  imageSize: imageSizeProp,
  initialCrop,
  onCancel,
  onConfirm,
}: AvatarCropModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [measuredSize, setMeasuredSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const imageSize = imageSizeProp ?? measuredSize;

  const circleSize = useMemo(
    () => Math.min(windowWidth - 48, windowHeight * 0.48, 320),
    [windowWidth, windowHeight]
  );

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  const displayWidth = useSharedValue(circleSize);
  const displayHeight = useSharedValue(circleSize);
  const circle = useSharedValue(circleSize);

  useEffect(() => {
    if (!visible || !imageUri || imageSizeProp) {
      if (!visible) setMeasuredSize(null);
      return;
    }
    let cancelled = false;
    void getImageSize(imageUri)
      .then((size) => {
        if (!cancelled) setMeasuredSize(size);
      })
      .catch(() => {
        if (!cancelled) setMeasuredSize(null);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, imageUri, imageSizeProp]);

  useEffect(() => {
    if (!visible || !imageSize) return;
    const baseScale = avatarBaseScale(
      imageSize.width,
      imageSize.height,
      circleSize
    );
    const nextDisplayWidth = imageSize.width * baseScale;
    const nextDisplayHeight = imageSize.height * baseScale;
    const start = initialCrop
      ? avatarCropToTransform(
          initialCrop,
          imageSize.width,
          imageSize.height,
          circleSize
        )
      : { zoom: 1, tx: 0, ty: 0 };

    displayWidth.value = nextDisplayWidth;
    displayHeight.value = nextDisplayHeight;
    circle.value = circleSize;
    scale.value = start.zoom;
    savedScale.value = start.zoom;
    tx.value = start.tx;
    ty.value = start.ty;
    savedTx.value = start.tx;
    savedTy.value = start.ty;
  }, [
    visible,
    imageSize,
    initialCrop,
    circleSize,
    circle,
    displayHeight,
    displayWidth,
    savedScale,
    savedTx,
    savedTy,
    scale,
    tx,
    ty,
  ]);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      const nextZoom = Math.min(
        AVATAR_MAX_ZOOM,
        Math.max(AVATAR_MIN_ZOOM, savedScale.value * event.scale)
      );
      scale.value = nextZoom;
      const clamped = clampTranslation(
        savedTx.value,
        savedTy.value,
        nextZoom,
        displayWidth.value,
        displayHeight.value,
        circle.value
      );
      tx.value = clamped.x;
      ty.value = clamped.y;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      const clamped = clampTranslation(
        savedTx.value + event.translationX,
        savedTy.value + event.translationY,
        scale.value,
        displayWidth.value,
        displayHeight.value,
        circle.value
      );
      tx.value = clamped.x;
      ty.value = clamped.y;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  const emitCrop = useCallback(
    (zoom: number, nextTx: number, nextTy: number) => {
      if (!imageSize) return;
      onConfirm(
        transformToAvatarCrop({
          zoom,
          tx: nextTx,
          ty: nextTy,
          imageWidth: imageSize.width,
          imageHeight: imageSize.height,
          circleSize,
        })
      );
    },
    [circleSize, imageSize, onConfirm]
  );

  const handleUsePhoto = () => {
    if (!imageSize) return;
    runOnUI(() => {
      runOnJS(emitCrop)(scale.value, tx.value, ty.value);
    })();
  };

  const overlayWidth = windowWidth;
  const overlayHeight = windowHeight;
  const cx = overlayWidth / 2;
  const cy = overlayHeight / 2;
  const radius = circleSize / 2;
  const displayW = imageSize
    ? imageSize.width * avatarBaseScale(imageSize.width, imageSize.height, circleSize)
    : circleSize;
  const displayH = imageSize
    ? imageSize.height *
      avatarBaseScale(imageSize.width, imageSize.height, circleSize)
    : circleSize;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.root} accessibilityViewIsModal>
        <GestureDetector gesture={composed}>
          <Animated.View style={styles.canvas}>
            {imageUri && imageSize ? (
              <Animated.Image
                source={{ uri: imageUri }}
                style={[
                  styles.image,
                  imageStyle,
                  {
                    width: displayW,
                    height: displayH,
                    left: cx - displayW / 2,
                    top: cy - displayH / 2,
                  },
                ]}
                resizeMode="cover"
              />
            ) : null}
          </Animated.View>
        </GestureDetector>

        <View style={styles.overlay} pointerEvents="none">
          <Svg width={overlayWidth} height={overlayHeight}>
            <Defs>
              <Mask id="avatar-crop-hole">
                <Rect
                  width={overlayWidth}
                  height={overlayHeight}
                  fill="white"
                />
                <Circle cx={cx} cy={cy} r={radius} fill="black" />
              </Mask>
            </Defs>
            <Rect
              width={overlayWidth}
              height={overlayHeight}
              fill="rgba(0,0,0,0.58)"
              mask="url(#avatar-crop-hole)"
            />
            <Circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.92)"
              strokeWidth={2}
            />
          </Svg>
        </View>

        <View
          style={[
            styles.chrome,
            { paddingBottom: insets.bottom + DesignSystem.spacing.sm },
          ]}
        >
          <Text
            style={styles.hint}
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
          >
            Pinch to zoom · drag to reposition
          </Text>
          <View style={styles.footerRow}>
            <View style={styles.footerButton}>
              <Button label="Cancel" variant="secondary" onPress={onCancel} />
            </View>
            <View style={styles.footerButton}>
              <Button
                label="Use photo"
                onPress={handleUsePhoto}
                disabled={!imageSize}
                accessibilityLabel="Use photo"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
