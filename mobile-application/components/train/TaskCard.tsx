import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface TaskCardProps {
    title: string;
    description: string;
    icon: string;
    onPress: () => void;
}

export function TaskCard({ title, description, icon, onPress }: TaskCardProps) {
    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={onPress}
        >
            <Text style={styles.icon}>{icon}</Text>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    pressed: {
        backgroundColor: '#FAFAFA',
    },
    icon: {
        fontSize: 28,
        marginRight: 14,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    description: {
        fontSize: 13,
        color: '#888',
        lineHeight: 18,
    },
    arrow: {
        fontSize: 24,
        color: '#CCC',
        fontWeight: '300',
    },
});
