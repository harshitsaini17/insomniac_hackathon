import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                tabBarActiveTintColor: '#1A1A1A',
                tabBarInactiveTintColor: '#BDBDBD',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopColor: '#F0F0F0',
                    borderTopWidth: 1,
                    elevation: 0,
                    shadowOpacity: 0,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 4,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                },
                headerStyle: {
                    backgroundColor: '#FAFAFA',
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F0F0F0',
                },
                headerTitleStyle: {
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#1A1A1A',
                },
            }}
        >
            <Tabs.Screen
                name="train"
                options={{
                    title: 'Train',
                    headerTitle: 'Focus Training',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="fitness-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="meditate"
                options={{
                    title: 'Meditate',
                    headerTitle: 'Meditation',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="leaf-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="health"
                options={{
                    title: 'Health',
                    headerTitle: 'Health',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="heart-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
