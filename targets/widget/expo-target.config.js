/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "widget",
  name: "HomeKeepWidget",
  displayName: "HomeKeep",
  icon: "../../assets/icon.png",
  deploymentTarget: "17.0",
  colors: {
    $accent: { light: "#C45C26", dark: "#D46B35" },
    $widgetBackground: { light: "#F4EFE6", dark: "#1E1B18" },
    hkBackground: { light: "#F4EFE6", dark: "#1E1B18" },
    hkInk: { light: "#1A1612", dark: "#F5F0E8" },
    hkMuted: { light: "#6B645C", dark: "#A39B91" },
    hkCopper: { light: "#C45C26", dark: "#D46B35" },
    hkSage: { light: "#2F5D50", dark: "#6FCF97" },
    hkWarning: { light: "#C49A3C", dark: "#D4A843" },
    hkOverdue: { light: "#C0392B", dark: "#E57373" },
    hkTrack: { light: "#E5DDD2", dark: "#3A3530" },
  },
  entitlements: {
    "com.apple.security.application-groups":
      config.ios.entitlements["com.apple.security.application-groups"],
  },
});
