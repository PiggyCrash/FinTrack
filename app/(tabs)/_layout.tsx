import { Tabs } from 'expo-router';
import { StyleSheet, View, Text, Platform } from 'react-native';

interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
}

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Text style={styles.tabIcon}>{icon}</Text>
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📊" label="Dashboard" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.addTabWrapper}>
              <View style={[styles.addTabBtn, focused && styles.addTabBtnActive]}>
                <Text style={styles.addTabIcon}>＋</Text>
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🗂️" label="History" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 78 : 64,
    paddingBottom: Platform.OS === 'ios' ? 16 : 6,
    paddingTop: 6,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarItem: {
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    width: 60,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#2563EB18',
  },
  tabIcon: { fontSize: 16, textAlign: 'center' },
  tabLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '600', textAlign: 'center' },
  tabLabelActive: { color: '#2563EB' },

  addTabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  addTabBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  addTabBtnActive: { backgroundColor: '#1D4ED8' },
  addTabIcon: { color: '#FFF', fontSize: 24, fontWeight: '300', marginTop: -2 },
});
