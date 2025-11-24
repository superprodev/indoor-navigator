import { Icon } from '@/components/ui/icon';
import { useColor } from '@/hooks/useColor';
import { PlatformPressable } from '@react-navigation/elements';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Home, Stars, PenTool, ToolCase, Map, Settings, TestTube } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

export default function TabLayout() {
  const primary = useColor('primary');

  return (
    <Tabs
      detachInactiveScreens={true}
      initialRouteName='sensors'
      screenOptions={{
        tabBarActiveTintColor: primary,
        headerShown: false,
        tabBarButton: (props) => (
          <PlatformPressable
            {...props}
            onPressIn={(ev) => {
              if (process.env.EXPO_OS === 'ios') {
                // Add a soft haptic feedback when pressing down on the tabs.
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              props.onPressIn?.(ev);
            }}
          />
        ),
        tabBarBackground: () => {
          if (Platform.OS === 'ios') {
            return (
              <BlurView
                tint='systemChromeMaterial'
                intensity={100}
                style={StyleSheet.absoluteFill}
              />
            );
          }

          // On Android & Web: no background
          return null;
        },
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >

      <Tabs.Screen
        name='sensors'
        options={{
          title: 'Test',
          tabBarIcon: ({ color }) => (
            <Icon name={ToolCase} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name='map'
        options={{
          title: 'Floor Map',
          tabBarIcon: ({ color }) => (
            <Icon name={Map} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name='index'
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Icon name={Settings} size={24} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}
