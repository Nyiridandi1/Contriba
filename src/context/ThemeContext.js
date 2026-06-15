import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const savedDark = await AsyncStorage.getItem('dark_mode');
    const savedLang = await AsyncStorage.getItem('app_language');
    if (savedDark) setDarkMode(savedDark === 'true');
    if (savedLang) setLanguage(savedLang);
  };

  const toggleDarkMode = async (value) => {
    setDarkMode(value);
    await AsyncStorage.setItem('dark_mode', value.toString());
  };

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    await AsyncStorage.setItem('app_language', lang);
  };

  const theme = {
    darkMode,
    language,
    toggleDarkMode,
    changeLanguage,
    colors: {
      BG:     darkMode ? '#0A0A0A' : '#F8F8F8',
      CARD:   darkMode ? '#1A1A1A' : '#FFFFFF',
      TEXT:   darkMode ? '#FFFFFF' : '#1A1A1A',
      SUB:    darkMode ? '#888888' : '#888888',
      BORDER: darkMode ? '#2A2A2A' : '#E0E0E0',
      DIV:    darkMode ? '#2A2A2A' : '#F5F5F5',
    },
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}