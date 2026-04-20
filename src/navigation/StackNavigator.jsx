import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { checkAuth } from '../Services/UserService';
import { disconnectSocket, initializeSocket } from "../Services/ChatServices";

// Screens import
import IntroScreen from '../screens/IntroScreen';
import RegisterScreen from '../screens/RegisterScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import StatusScreen from '../screens/StatusScreen'
import SettingsScreen from '../screens/SettingsScreen'
import CallHistoryScreen from '../screens/CallHistoryScreen'
import UserDetailsScreen from '../screens/UserDetailsScreen'

// Store import
import useUserStore from '../Store/useUserStore';
import {useChatStore} from '../Store/useChatStore'

const Stack = createNativeStackNavigator();

export default function StackNavigator() {

  const { isAuthenticated, setUser, clearUser, user } = useUserStore();
  const { setCurrentUser, initSocketListeners, cleanUp, fetchConversations } =
    useChatStore();

  const [isChecking, setIsChecking] = useState(true);

  const verifyAuth = async () => {
    try {
      const result = await checkAuth();
      if (result?.isAuthenticated) {
        const currentToken = useUserStore.getState().token;
        setUser(result.user, currentToken);
      } else {
        clearUser();
      }
    } catch (error) {
      console.log('Auth check failed, keeping existing session', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    verifyAuth();
  }, []);

  useEffect(() => {
    let socket;
    if (isAuthenticated && user?._id) {
      socket = initializeSocket(); 

      if (socket) {
        setCurrentUser(user);
        initSocketListeners(); 
        fetchConversations();  
        // console.log("Socket initialized for user:", user._id);
      }
    }

    return () => {
      if (socket) {
        disconnectSocket();
        console.log("Socket disconnected");
      }
    };
  }, [isAuthenticated, user?._id]); 

  if (isChecking) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#111B21',
        }}
      >
        <ActivityIndicator size="large" color="#00A884" />
      </View>
    );
  }


  return (
    <Stack.Navigator screenOptions={{ headerShown: false, 
      animation: 'fade', 
    animationDuration: 100, 
      }}>

      {isAuthenticated ? (
        // Authenticated — protected screens
        <Stack.Group>
          <Stack.Screen name="Home_Screen" component={HomeScreen} />
          <Stack.Screen name="Status_Screen" component={StatusScreen} />
          <Stack.Screen name="Settings_Screen" component={SettingsScreen} />
          <Stack.Screen name="Call_Screen" component={CallHistoryScreen} />
          <Stack.Screen name='UserDetails' component={UserDetailsScreen} />
        </Stack.Group>
      ) : (
        // Not authenticated — public screens
        <Stack.Group>
          <Stack.Screen name="Intro_Screen" component={IntroScreen} />
          <Stack.Screen name="Welcome_Screen" component={WelcomeScreen} />
          <Stack.Screen name="Register_Screen" component={RegisterScreen} />
          <Stack.Screen name="SignUp_Screen" component={SignUpScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
