import React, { useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  StatusBar,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen({ navigation }) {

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      const seen = await AsyncStorage.getItem('onboarding_seen');
      if (seen) {
        // ✅ Always go Home — no login required!
        navigation.replace('Home');
      } else {
        // ✅ First time — show onboarding
        navigation.replace('Onboarding');
      }
    } catch (error) {
      navigation.replace('Onboarding');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" transparent />
      <Image
        source={require("../../assets/splash-icon.png")}
        style={styles.fullImage}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0000',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});