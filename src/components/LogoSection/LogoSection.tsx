import React from "react";
import { View, Image } from "react-native";
import { styles } from "./styles";

// Function component for the logo section used in the home screen
export function LogoSection() {
  return (
    <View style={styles.logoContainer}>
      <Image
        source={require("../../../assets/images/homekeep-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}
