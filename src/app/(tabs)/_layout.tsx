// Five-tab navigation: Memories · Photos · World · Stats · More.
// Soft Serif Gallery treatment: warm paper bar, hairline top border,
// ink active tint, serif labels.

import { Tabs } from 'expo-router';
import { useTheme } from '../../theme';
import {
  MemoriesGlyph,
  MoreGlyph,
  PhotosGlyph,
  StatsGlyph,
  WorldGlyph,
} from '../../components/TabGlyphs';

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.secondaryText,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.separator,
          borderTopWidth: 1,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontFamily: theme.serif,
          fontSize: 11,
          letterSpacing: 0.8,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Memories',
          tabBarIcon: ({ color }) => <MemoriesGlyph color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="photos"
        options={{
          title: 'Photos',
          tabBarIcon: ({ color }) => <PhotosGlyph color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="world"
        options={{
          title: 'World',
          tabBarIcon: ({ color }) => <WorldGlyph color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <StatsGlyph color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <MoreGlyph color={String(color)} />,
        }}
      />
    </Tabs>
  );
}
