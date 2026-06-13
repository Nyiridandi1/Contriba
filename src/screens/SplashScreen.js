import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
} from "react-native";

export default function SplashScreen({ navigation }) {
  return (
    <ImageBackground
      source={require("../../assets/couple.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" transparent />

      {/* Light overlay */}
      <View style={styles.overlay} />

      <View style={styles.content}>

        {/* Top Section */}
        <View style={styles.topSection}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.title}>Contriba</Text>

          {/* Divider with diamond */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.diamond}>◆</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.tagline}>Contribute Easily</Text>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Onboarding")}
          >
            <Text style={styles.buttonText}>Get Started →</Text>
          </TouchableOpacity>

          {/* ✅ Fixed: now navigates to Login */}
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginText}>
              I already{" "}
              <Text style={styles.loginBold}>have an account</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 50,
  },
  topSection: {
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginBottom: 8,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#7A001F",
    letterSpacing: 2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
    width: "60%",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#D6A23A",
  },
  diamond: {
    color: "#D6A23A",
    fontSize: 12,
  },
  tagline: {
    fontSize: 20,
    color: "#D6A23A",
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 4,
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    backgroundColor: "#7A001F",
    elevation: 8,
    shadowColor: "#7A001F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },
  loginText: {
    color: "#777777",
    fontSize: 15,
  },
  loginBold: {
    color: "#7A001F",
    fontWeight: "bold",
    fontSize: 15,
  },
});