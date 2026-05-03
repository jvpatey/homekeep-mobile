import { useState, useEffect } from "react";
import { Dimensions, Platform } from "react-native";
import * as Device from "expo-device";

/**
 * Hook to detect device type and provide responsive sizing for iPad optimization
 */
export function useDevice() {
  const { width, height } = Dimensions.get("window");
  const [isTablet, setIsTablet] = useState(false);
  const [isIPad, setIsIPad] = useState(false);

  useEffect(() => {
    // Check if device is tablet using expo-device
    if (Device.deviceType) {
      setIsTablet(Device.deviceType === Device.DeviceType.TABLET);
      setIsIPad(Platform.OS === "ios" && Device.deviceType === Device.DeviceType.TABLET);
    } else {
      // Fallback: use screen dimensions (iPad typically has width >= 768)
      const isTabletSize = Math.min(width, height) >= 768;
      setIsTablet(isTabletSize);
      setIsIPad(Platform.OS === "ios" && isTabletSize);
    }
  }, [width, height]);

  // Calculate responsive values based on device type
  const getResponsiveValue = (
    phone: number,
    tablet: number,
    largeTablet?: number
  ) => {
    if (isTablet) {
      // Check if it's a large iPad (iPad Pro 12.9")
      if (largeTablet && Math.max(width, height) > 1300) {
        return largeTablet;
      }
      return tablet;
    }
    return phone;
  };

  // Get responsive font size multiplier
  const getFontMultiplier = () => {
    if (isTablet) {
      // Larger iPads get slightly larger text
      if (Math.max(width, height) > 1300) {
        return 1.25;
      }
      return 1.15;
    }
    return 1;
  };

  // Get max content width for iPad (centered layout)
  const getMaxContentWidth = () => {
    if (isTablet) {
      // Constrain content width for better readability
      if (Math.max(width, height) > 1300) {
        return 700; // iPad Pro 12.9"
      }
      return 600; // Standard iPad
    }
    return undefined; // No constraint on phone
  };

  // Get responsive gradient fade height
  const getGradientFadeHeight = () => {
    if (isTablet) {
      // Taller fade for larger screens (iPad Pro 13-inch has height ~1366)
      if (Math.max(width, height) > 1300) {
        return 380; // Much taller fade for iPad Pro 13-inch
      }
      return 200;
    }
    return 250; // Much taller fade for phones to prevent dark bar
  };

  const getGradientFadeLocations = (isDark: boolean) => {
    if (isTablet) {
      const screenMax = Math.max(width, height);
      if (screenMax > 1300) {
        return (isDark 
          ? [0, 0.15, 0.35, 0.55, 0.75, 1]
          : [0, 0.2, 0.45, 0.65, 0.85, 1]) as readonly [number, number, ...number[]];
      } else if (screenMax > 1100) {
        return (isDark 
          ? [0, 0.25, 0.55, 1]
          : [0, 0.35, 0.7, 1]) as readonly [number, number, ...number[]];
      }
      return (isDark ? [0, 0.4, 1] : [0, 0.6, 0.9, 1]) as readonly [number, number, ...number[]];
    }
    // For phones in light mode, use more gradual fade locations matching the 5-color array
    return (isDark ? [0, 0.4, 1] : [0, 0.5, 0.75, 0.9, 1]) as readonly [number, number, ...number[]];
  };

  const getGradientFadeColors = (isDark: boolean, backgroundColor: string) => {
    if (isTablet) {
      const screenMax = Math.max(width, height);
      if (screenMax > 1300) {
        return (isDark
          ? [
              "transparent",
              "transparent",
              "rgba(24, 26, 27, 0.15)",
              "rgba(24, 26, 27, 0.4)",
              "rgba(24, 26, 27, 0.75)",
              backgroundColor,
            ]
          : [
              "transparent",
              "rgba(255, 255, 255, 0.15)",
              "rgba(255, 255, 255, 0.35)",
              "rgba(255, 255, 255, 0.6)",
              "rgba(255, 255, 255, 0.85)",
              backgroundColor,
            ]) as readonly [string, string, ...string[]];
      } else if (screenMax > 1100) {
        return (isDark
          ? [
              "transparent",
              "transparent",
              `rgba(24, 26, 27, 0.5)`,
              backgroundColor,
            ]
          : [
              "transparent",
              "rgba(255, 255, 255, 0.25)",
              "rgba(255, 255, 255, 0.65)",
              backgroundColor,
            ]) as readonly [string, string, ...string[]];
      }
      return (isDark
        ? ["transparent", "transparent", backgroundColor]
        : ["transparent", "rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.6)", backgroundColor]) as readonly [string, string, ...string[]];
    }
    // For phones, use much stronger fade in light mode to prevent dark bar
    return (isDark
      ? ["transparent", "transparent", backgroundColor]
      : [
          "transparent",
          "rgba(255, 255, 255, 0.25)",
          "rgba(255, 255, 255, 0.55)",
          "rgba(255, 255, 255, 0.85)",
          backgroundColor,
        ]) as readonly [string, string, ...string[]];
  };

  // Get hero section height for vertical centering
  const getHeroSectionHeight = () => {
    if (!isTablet) return undefined;
    const screenMax = Math.max(width, height);
    if (screenMax > 1300) {
      return screenMax * 0.45; // iPad Pro 13"
    } else if (screenMax > 1100) {
      return screenMax * 0.35; // Standard iPads (Air, Pro 11")
    }
    return screenMax * 0.30; // Smaller iPads
  };

  return {
    isTablet,
    isIPad,
    width,
    height,
    getResponsiveValue,
    getFontMultiplier,
    getMaxContentWidth,
    getGradientFadeHeight,
    getGradientFadeLocations,
    getGradientFadeColors,
    getHeroSectionHeight,
  };
}

