import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThemeProvider } from "./src/context/ThemeContext";
import SplashScreen from "./src/screens/SplashScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import GetStartedScreen from "./src/screens/GetStartedScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import CreateEventScreen from "./src/screens/CreateEventScreen";
import EventPageScreen from "./src/screens/EventPageScreen";
import ContributeScreen from "./src/screens/ContributeScreen";
import PaymentConfirmScreen from "./src/screens/PaymentConfirmScreen";
import PaymentSuccessScreen from "./src/screens/PaymentSuccessScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import WalletScreen from "./src/screens/WalletScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import ShareEventScreen from "./src/screens/ShareEventScreen";
import LiveFeedScreen from "./src/screens/LiveFeedScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="GetStarted" component={GetStartedScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
          <Stack.Screen name="EventPage" component={EventPageScreen} />
          <Stack.Screen name="Contribute" component={ContributeScreen} />
          <Stack.Screen name="PaymentConfirm" component={PaymentConfirmScreen} />
          <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="ShareEvent" component={ShareEventScreen} />
          <Stack.Screen name="LiveFeed" component={LiveFeedScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
