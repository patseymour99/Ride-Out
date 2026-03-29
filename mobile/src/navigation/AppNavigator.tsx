import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';

import { FeedScreen } from '../screens/feed/FeedScreen';
import { EventsScreen } from '../screens/events/EventsScreen';
import { EventDetailScreen } from '../screens/events/EventDetailScreen';
import { CreateEventScreen } from '../screens/events/CreateEventScreen';
import { ConversationsScreen } from '../screens/messages/ConversationsScreen';
import { ChatScreen } from '../screens/messages/ChatScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';

const Tab = createBottomTabNavigator();
const FeedStack = createStackNavigator();
const EventStack = createStackNavigator();
const MessageStack = createStackNavigator();
const ProfileStack = createStackNavigator();

function FeedStackNav() {
  return (
    <FeedStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#242424' }, headerTintColor: '#F0F0F0' }}>
      <FeedStack.Screen name="Feed" component={FeedScreen} options={{ title: 'Feed' }} />
    </FeedStack.Navigator>
  );
}

function EventStackNav() {
  return (
    <EventStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#242424' }, headerTintColor: '#F0F0F0' }}>
      <EventStack.Screen name="Events" component={EventsScreen} options={{ title: 'Ride-Outs' }} />
      <EventStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event' }} />
      <EventStack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Create Ride-Out' }} />
    </EventStack.Navigator>
  );
}

function MessageStackNav() {
  return (
    <MessageStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#242424' }, headerTintColor: '#F0F0F0' }}>
      <MessageStack.Screen name="Conversations" component={ConversationsScreen} options={{ title: 'Messages' }} />
      <MessageStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
    </MessageStack.Navigator>
  );
}

function ProfileStackNav() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#242424' }, headerTintColor: '#F0F0F0' }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
    </ProfileStack.Navigator>
  );
}

const ORANGE = '#FF6B00';
const MUTED = '#888888';

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#242424',
          borderTopColor: '#333333',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: ORANGE,
        tabBarInactiveTintColor: MUTED,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="FeedTab"
        component={FeedStackNav}
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventStackNav}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ color }) => <TabIcon name="map" color={color} />,
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessageStackNav}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color }) => <TabIcon name="chat" color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNav}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon name="person" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  // Simple text-based icons (replace with react-native-vector-icons or expo-symbols in production)
  const icons: Record<string, string> = {
    home: '⊞',
    map: '◎',
    chat: '◉',
    person: '◎',
  };
  return <Text style={{ color, fontSize: 20 }}>{icons[name] ?? '·'}</Text>;
}
