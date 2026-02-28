import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface HydrationRingProps {
    currentMl: number;
    targetMl: number;
    isLow: boolean;
}

export function HydrationRing({ currentMl, targetMl, isLow }: HydrationRingProps) {
    const pct = Math.min(100, Math.round((currentMl / targetMl) * 100));
    // We'll use a simple circular progress representation with View
    // A filled arc from 0 to pct%, using two half-circles

    return (
        <View style={styles.card}>
            <Text style={styles.title}>Hydration</Text>
            <View style={styles.ringRow}>
                <View style={styles.ringContainer}>
                    {/* Background circle */}
                    <View style={styles.ringBg}>
                        {/* Fill indicator — simple percentage fill from bottom */}
                        <View
                            style={[
                                styles.ringFill,
                                { height: `${pct}%` },
                            ]}
                        />
                        <View style={styles.ringInner}>
                            <Text style={styles.ringPct}>{pct}%</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.infoCol}>
                    <Text style={styles.mlText}>
                        {currentMl} / {targetMl} ml
                    </Text>
                    {isLow && (
                        <Pressable style={styles.ctaButton}>
                            <Text style={styles.ctaText}>💧 Drink now</Text>
                        </Pressable>
                    )}
                    {!isLow && pct >= 100 && (
                        <Text style={styles.doneText}>✓ Target reached</Text>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    ringRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ringContainer: {
        marginRight: 20,
    },
    ringBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EEEEEE',
        overflow: 'hidden',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    ringFill: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1A1A1A',
        borderRadius: 0,
    },
    ringInner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ringPct: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    infoCol: {
        flex: 1,
    },
    mlText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    ctaButton: {
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    ctaText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
    doneText: {
        fontSize: 13,
        color: '#2D8A4E',
        fontWeight: '500',
    },
});
