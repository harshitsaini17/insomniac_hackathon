import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Pressable,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import type { DailyHealthInput } from '@/types';

interface DailyInputFormProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (input: DailyHealthInput) => void;
}

function RatingButtons({
    value,
    onChange,
    max = 5,
}: {
    value: number;
    onChange: (v: number) => void;
    max?: number;
}) {
    return (
        <View style={styles.ratingRow}>
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
                <Pressable
                    key={n}
                    style={[
                        styles.ratingBtn,
                        value === n && styles.ratingBtnActive,
                    ]}
                    onPress={() => onChange(n)}
                >
                    <Text
                        style={[
                            styles.ratingText,
                            value === n && styles.ratingTextActive,
                        ]}
                    >
                        {n}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}

export function DailyInputForm({ visible, onClose, onSubmit }: DailyInputFormProps) {
    const todayStr = new Date().toISOString().slice(0, 10);

    const [sleepHours, setSleepHours] = useState('7');
    const [sleepQuality, setSleepQuality] = useState(3);
    const [sleepDisturbances, setSleepDisturbances] = useState('0');
    const [exerciseMinutes, setExerciseMinutes] = useState('0');
    const [sedentaryHours, setSedentaryHours] = useState('4');
    const [waterMl, setWaterMl] = useState('1500');
    const [stressLevel, setStressLevel] = useState(2);
    const [fatigueLevel, setFatigueLevel] = useState(2);
    const [hrvMs, setHrvMs] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
        const input: DailyHealthInput = {
            date: todayStr,
            sleep_hours: parseFloat(sleepHours) || 0,
            sleep_quality: sleepQuality,
            sleep_disturbances: parseInt(sleepDisturbances) || 0,
            exercise_minutes: parseInt(exerciseMinutes) || 0,
            sedentary_hours: parseFloat(sedentaryHours) || 0,
            water_ml: parseInt(waterMl) || 0,
            stress_level: stressLevel,
            fatigue_level: fatigueLevel,
            ...(hrvMs ? { hrv_rmssd_ms: parseFloat(hrvMs) } : {}),
            ...(weightKg ? { weight_kg: parseFloat(weightKg) } : {}),
            ...(notes ? { notes } : {}),
        };
        onSubmit(input);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <KeyboardAvoidingView
                style={styles.modal}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Log Today's Health</Text>
                    <Pressable onPress={onClose}>
                        <Text style={styles.closeBtn}>✕</Text>
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.formScroll}
                    contentContainerStyle={styles.formContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Sleep Hours */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>🌙 Sleep Hours</Text>
                        <TextInput
                            style={styles.input}
                            value={sleepHours}
                            onChangeText={setSleepHours}
                            keyboardType="decimal-pad"
                            placeholder="7.5"
                        />
                    </View>

                    {/* Sleep Quality */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Sleep Quality (1–5)</Text>
                        <RatingButtons value={sleepQuality} onChange={setSleepQuality} />
                    </View>

                    {/* Disturbances */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Sleep Disturbances</Text>
                        <TextInput
                            style={styles.input}
                            value={sleepDisturbances}
                            onChangeText={setSleepDisturbances}
                            keyboardType="number-pad"
                            placeholder="0"
                        />
                    </View>

                    {/* Exercise */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>🏃 Exercise (minutes)</Text>
                        <TextInput
                            style={styles.input}
                            value={exerciseMinutes}
                            onChangeText={setExerciseMinutes}
                            keyboardType="number-pad"
                            placeholder="30"
                        />
                    </View>

                    {/* Sedentary */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>🪑 Sedentary Hours</Text>
                        <TextInput
                            style={styles.input}
                            value={sedentaryHours}
                            onChangeText={setSedentaryHours}
                            keyboardType="decimal-pad"
                            placeholder="6"
                        />
                    </View>

                    {/* Water */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>💧 Water (ml)</Text>
                        <TextInput
                            style={styles.input}
                            value={waterMl}
                            onChangeText={setWaterMl}
                            keyboardType="number-pad"
                            placeholder="2000"
                        />
                    </View>

                    {/* Stress */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Stress Level (1–5)</Text>
                        <RatingButtons value={stressLevel} onChange={setStressLevel} />
                    </View>

                    {/* Fatigue */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Fatigue Level (1–5)</Text>
                        <RatingButtons value={fatigueLevel} onChange={setFatigueLevel} />
                    </View>

                    {/* Optional: HRV */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>💓 HRV RMSSD (optional, ms)</Text>
                        <TextInput
                            style={styles.input}
                            value={hrvMs}
                            onChangeText={setHrvMs}
                            keyboardType="decimal-pad"
                            placeholder="e.g. 45"
                        />
                    </View>

                    {/* Optional: Weight */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>⚖️ Weight (optional, kg)</Text>
                        <TextInput
                            style={styles.input}
                            value={weightKg}
                            onChangeText={setWeightKg}
                            keyboardType="decimal-pad"
                            placeholder="e.g. 70"
                        />
                    </View>

                    {/* Notes */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>📝 Notes</Text>
                        <TextInput
                            style={[styles.input, styles.notesInput]}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            placeholder="How are you feeling?"
                        />
                    </View>

                    {/* Submit */}
                    <Pressable style={styles.submitBtn} onPress={handleSubmit}>
                        <Text style={styles.submitText}>Save & Compute Scores</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modal: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#FFF',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    closeBtn: {
        fontSize: 20,
        color: '#999',
        padding: 4,
    },
    formScroll: {
        flex: 1,
    },
    formContent: {
        padding: 20,
        paddingBottom: 40,
    },
    field: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 16,
        color: '#1A1A1A',
    },
    notesInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    ratingRow: {
        flexDirection: 'row',
        gap: 8,
    },
    ratingBtn: {
        width: 44,
        height: 44,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ratingBtnActive: {
        backgroundColor: '#1A1A1A',
        borderColor: '#1A1A1A',
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    ratingTextActive: {
        color: '#FFF',
    },
    submitBtn: {
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    submitText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
