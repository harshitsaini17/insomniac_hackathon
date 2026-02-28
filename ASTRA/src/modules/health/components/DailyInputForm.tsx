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
import { AstraColors, AstraCard, AstraRadius, AstraShadow } from '@/constants/astraTheme';

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
                            placeholderTextColor={AstraColors.mutedForeground}
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
                            placeholderTextColor={AstraColors.mutedForeground}
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
                            placeholderTextColor={AstraColors.mutedForeground}
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
                            placeholderTextColor={AstraColors.mutedForeground}
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
                            placeholderTextColor={AstraColors.mutedForeground}
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
                            placeholderTextColor={AstraColors.mutedForeground}
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
                            placeholderTextColor={AstraColors.mutedForeground}
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
                            placeholderTextColor={AstraColors.mutedForeground}
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
    modal: { flex: 1, backgroundColor: AstraColors.background },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', padding: 20, paddingTop: 16,
        borderBottomWidth: 1, borderBottomColor: AstraColors.border,
        backgroundColor: AstraColors.card,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: AstraColors.foreground },
    closeBtn: { fontSize: 20, color: AstraColors.mutedForeground, padding: 4 },
    formScroll: { flex: 1 },
    formContent: { padding: 20, paddingBottom: 40 },
    field: { marginBottom: 20 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: AstraColors.foreground, marginBottom: 8 },
    input: {
        backgroundColor: AstraColors.card, borderWidth: 1,
        borderColor: AstraColors.border, borderRadius: AstraRadius.md,
        paddingHorizontal: 14, paddingVertical: 10,
        fontSize: 16, color: AstraColors.foreground,
    },
    notesInput: { minHeight: 80, textAlignVertical: 'top' },
    ratingRow: { flexDirection: 'row', gap: 8 },
    ratingBtn: {
        width: 44, height: 44, borderRadius: AstraRadius.md,
        borderWidth: 1, borderColor: AstraColors.border,
        backgroundColor: AstraColors.card, justifyContent: 'center', alignItems: 'center',
    },
    ratingBtnActive: {
        backgroundColor: AstraColors.primary, borderColor: AstraColors.primary,
    },
    ratingText: { fontSize: 16, fontWeight: '600', color: AstraColors.warmGray },
    ratingTextActive: { color: AstraColors.primaryForeground },
    submitBtn: {
        backgroundColor: AstraColors.primary,
        borderRadius: AstraRadius.lg, paddingVertical: 16,
        alignItems: 'center', marginTop: 8,
        ...AstraShadow.button,
    },
    submitText: { color: AstraColors.primaryForeground, fontSize: 16, fontWeight: '700' },
});
