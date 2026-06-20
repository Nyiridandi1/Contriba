import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const { darkMode, language, colors } = useTheme();
  const { BG, CARD, TEXT, SUB, BORDER } = colors;

  return (
    <View>
      <Text>Login</Text>
    </View>
  );
}
