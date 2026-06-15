// src/screens/GetStartedScreen.js

import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ImageBackground, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function GetStartedScreen({ navigation }) {

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('onboarding_seen', 'true');
    navigation.navigate('Register');
  };

  const handleLogin = async () => {
    await AsyncStorage.setItem('onboarding_seen', 'true');
    navigation.navigate('Login');
  };

  return (
    <ImageBackground
      source={require('../../assets/getstarted.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" transparent />

      {/* Dark overlay at bottom */}
      <View style={styles.overlay} />

      {/* Bottom Buttons */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleGetStarted}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Get Started →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogin}
          hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
        >
          <Text style={styles.loginText}>
            I already{' '}
            <Text style={styles.loginBold}>have an account</Text>
          </Text>
        </TouchableOpacity>
      </View>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.25,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 50,
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    backgroundColor: '#E60012',
    elevation: 8,
    shadowColor: '#E60012',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 1,
  },
  loginText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  loginBold: {
    color: '#E60012',
    fontWeight: '700',
    fontSize: 15,
  },
});