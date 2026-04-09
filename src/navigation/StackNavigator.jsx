import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useUserStore from '../Store/useUserStore';
import { checkAuth } from '../Services/UserService';
import IntroScreen from '../screens/IntroScreen';
import RegisterScreen from '../screens/RegisterScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ChatListScreen from '../screens/ChatListScreen';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  const { isAuthenticated, setUser, clearUser } = useUserStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const result = await checkAuth();
        if (result?.isAuthenticated) {
          setUser(result.user);
        } else {
          clearUser();
        }
      } catch (error) {
        clearUser();
      } finally {
        setIsChecking(false);
      }
    };
    verifyAuth();
  }, []);

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // Protected Screens
        <Stack.Group>
          <Stack.Screen name='Chat_List_Screen' component={ChatListScreen} />
        </Stack.Group>
      ) : (
        // Public Screens
        <Stack.Group>
          <Stack.Screen name='Intro_Screen' component={IntroScreen} />
          <Stack.Screen name='Welcome_Screen' component={WelcomeScreen} />
          <Stack.Screen name='Register_Screen' component={RegisterScreen} />
          <Stack.Screen name='SignUp_Screen' component={SignUpScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}