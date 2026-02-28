import { Stack } from 'expo-router';

export default function TrainLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#FAFAFA' },
                headerTitleStyle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
            }}
        >
            <Stack.Screen name="session" options={{ title: 'Focus Session' }} />
            <Stack.Screen name="n-back" options={{ title: 'N-Back' }} />
        </Stack>
    );
}
