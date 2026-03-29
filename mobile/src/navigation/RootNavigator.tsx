import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/auth.store';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';

export function RootNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: '#FF6B00',
          background: '#1a1a1a',
          card: '#242424',
          text: '#F0F0F0',
          border: '#333333',
          notification: '#FF6B00',
        },
      }}
    >
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
