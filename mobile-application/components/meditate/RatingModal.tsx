import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';

interface RatingModalProps {
    visible: boolean;
    onSubmit: (rating: 1 | 2 | 3 | 4 | 5) => void;
    onCancel: () => void;
}

const RATINGS: Array<{ value: 1 | 2 | 3 | 4 | 5; label: string }> = [
    { value: 1, label: 'Poor' },
    { value: 2, label: 'Fair' },
    { value: 3, label: 'Good' },
    { value: 4, label: 'Great' },
    { value: 5, label: 'Excellent' },
];

export function RatingModal({ visible, onSubmit, onCancel }: RatingModalProps) {
    const [selected, setSelected] = useState<1 | 2 | 3 | 4 | 5 | null>(null);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>How was your session?</Text>
                    <Text style={styles.subtitle}>Rate your experience</Text>

                    <View style={styles.ratingRow}>
                        {RATINGS.map((r) => (
                            <Pressable
                                key={r.value}
                                onPress={() => setSelected(r.value)}
                                style={[styles.ratingItem, selected === r.value && styles.ratingItemActive]}
                            >
                                <Text style={[styles.ratingNumber, selected === r.value && styles.ratingNumberActive]}>
                                    {r.value}
                                </Text>
                                <Text style={[styles.ratingLabel, selected === r.value && styles.ratingLabelActive]}>
                                    {r.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.actions}>
                        <Pressable style={styles.cancelBtn} onPress={onCancel}>
                            <Text style={styles.cancelText}>Skip</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.submitBtn, !selected && styles.submitDisabled]}
                            onPress={() => selected && onSubmit(selected)}
                            disabled={!selected}
                        >
                            <Text style={styles.submitText}>Submit</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modal: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 24,
    },
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    ratingItem: {
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 2,
    },
    ratingItemActive: {
        backgroundColor: '#1A1A1A',
    },
    ratingNumber: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    ratingNumberActive: {
        color: '#FFF',
    },
    ratingLabel: {
        fontSize: 10,
        color: '#888',
        marginTop: 2,
    },
    ratingLabelActive: {
        color: '#CCC',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        alignItems: 'center',
    },
    cancelText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    submitBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
    },
    submitDisabled: {
        opacity: 0.3,
    },
    submitText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
