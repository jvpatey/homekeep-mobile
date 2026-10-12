import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  HomeContact,
  contactInitials,
  tradeMeta,
} from "../../types/homeContact";

/** Initials on a trade-tinted disc. */
export function ProAvatar({
  contact,
  size = 40,
}: {
  contact: Pick<HomeContact, "name" | "trade">;
  size?: number;
}) {
  const meta = tradeMeta(contact.trade);
  return (
    <View
      style={[
        styles.disc,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: meta.tint + "26",
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text
        style={[
          styles.initials,
          { color: meta.tint, fontSize: Math.round(size * 0.38) },
        ]}
      >
        {contactInitials(contact.name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: "700",
  },
});
