// ─────────────────────────────────────────────────────────────────────────────
// Settings Screen — Personality Calibration, Feature Toggles, Privacy
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useFocusStore } from '../modules/focusTrainer/store/focusStore';
import { computeImpulsivityIndex } from '../modules/focusTrainer/math/personalityStrictness';
import { PersonalityProfile, BlockingLevel } from '../modules/focusTrainer/models/types';
import { setPersonalityProfile, setModuleEnabled } from '../storage/mmkvStore';

export default function SettingsScreen() {
    const {
        personality,
        currentStrictness,
        isModuleEnabled,
        userBlockingOverride,
        setPersonality,
        setStrictness,
        setModuleEnabled: setEnabled,
        setUserBlockingOverride,
    } = useFocusStore();

    const [conscientiousness, setC] = useState(personality.conscientiousness);
    const [neuroticism, setN] = useState(personality.neuroticism);
    const [usageTracking, setUsageTracking] = useState(true);
    const [healthTracking, setHealthTracking] = useState(true);
    const [cogTraining, setCogTraining] = useState(true);

    // ── Update personality ──────────────────────────────────────────────────
    const updatePersonality = useCallback(
        (c: number, n: number) => {
            const profile: PersonalityProfile = {
                conscientiousness: c,
                neuroticism: n,
            };
            setPersonality(profile);
            setPersonalityProfile(profile);
            const strictness = computeImpulsivityIndex(profile);
            setStrictness(strictness);
        },
        [setPersonality, setStrictness],
    );

    const handleCChange = (delta: number) => {
        const newC = Math.max(1, Math.min(7, conscientiousness + delta));
        setC(newC);
        updatePersonality(newC, neuroticism);
    };

    const handleNChange = (delta: number) => {
        const newN = Math.max(1, Math.min(7, neuroticism + delta));
        setN(newN);
        updatePersonality(conscientiousness, newN);
    };

    // ── Toggle module ───────────────────────────────────────────────────────
    const toggleModule = (value: boolean) => {
        setEnabled(value);
        setModuleEnabled(value);
    };

    // ── Blocking override ──────────────────────────────────────────────────
    const setOverride = (level: BlockingLevel | null) => {
        setUserBlockingOverride(level);
    };

    // ── Export data ────────────────────────────────────────────────────────
    const handleExport = () => {
        Alert.alert(
            'Export Data',
            'Your focus data would be exported as a JSON file to your device. (Feature coming soon)',
        );
    };

    const handleDeleteData = () => {
        Alert.alert(
            'Delete All Data',
            'This will permanently delete all your focus training data. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        // Reset store
                        useFocusStore.getState().resetState();
                        Alert.alert('Done', 'All data has been deleted.');
                    },
                },
            ],
        );
    };

    const strictness = computeImpulsivityIndex({
        conscientiousness,
        neuroticism,
    });

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>⚙️ Settings</Text>

            {/* ── Module Toggle ──────────────────────────────────────────────── */}
            <View style={styles.card}>
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Focus Trainer Module</Text>
                    <Switch
                        value={isModuleEnabled}
                        onValueChange={toggleModule}
                        trackColor={{ false: '#21262D', true: '#238636' }}
                        thumbColor="#E6EDF3"
                    />
                </View>
            </View>

            {/* ── Personality Calibration ────────────────────────────────────── */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>🧬 Personality Calibration</Text>
                <Text style={styles.sectionDesc}>
                    Adjust these to match your self-assessment. They determine how
                    strict the blocking recommendations are.
                </Text>

                {/* Conscientiousness */}
                <View style={styles.sliderRow}>
                    <Text style={styles.traitLabel}>Conscientiousness</Text>
                    <View style={styles.sliderControls}>
                        <TouchableOpacity
                            style={styles.sliderBtn}
                            onPress={() => handleCChange(-1)}
                        >
                            <Text style={styles.sliderBtnText}>−</Text>
                        </TouchableOpacity>
                        <View style={styles.sliderValue}>
                            <Text style={styles.sliderValueText}>{conscientiousness}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.sliderBtn}
                            onPress={() => handleCChange(1)}
                        >
                            <Text style={styles.sliderBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.scaleRow}>
                    <Text style={styles.scaleLabel}>Spontaneous</Text>
                    <View style={styles.scaleBar}>
                        <View
                            style={[
                                styles.scaleFill,
                                { width: `${((conscientiousness - 1) / 6) * 100}%` },
                            ]}
                        />
                    </View>
                    <Text style={styles.scaleLabel}>Disciplined</Text>
                </View>

                {/* Neuroticism */}
                <View style={[styles.sliderRow, { marginTop: 16 }]}>
                    <Text style={styles.traitLabel}>Neuroticism</Text>
                    <View style={styles.sliderControls}>
                        <TouchableOpacity
                            style={styles.sliderBtn}
                            onPress={() => handleNChange(-1)}
                        >
                            <Text style={styles.sliderBtnText}>−</Text>
                        </TouchableOpacity>
                        <View style={styles.sliderValue}>
                            <Text style={styles.sliderValueText}>{neuroticism}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.sliderBtn}
                            onPress={() => handleNChange(1)}
                        >
                            <Text style={styles.sliderBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.scaleRow}>
                    <Text style={styles.scaleLabel}>Calm</Text>
                    <View style={styles.scaleBar}>
                        <View
                            style={[
                                styles.scaleFill,
                                {
                                    width: `${((neuroticism - 1) / 6) * 100}%`,
                                    backgroundColor: '#FFD740',
                                },
                            ]}
                        />
                    </View>
                    <Text style={styles.scaleLabel}>Sensitive</Text>
                </View>

                {/* Strictness Result */}
                <View style={styles.strictnessResult}>
                    <Text style={styles.strictnessLabel}>
                        Impulsivity Index:{' '}
                        {(strictness.impulsivityIndex * 100).toFixed(0)}%
                    </Text>
                    <Text style={styles.strictnessLevel}>
                        Recommended: {strictness.label.replace(/-/g, ' ').toUpperCase()}
                    </Text>
                </View>
            </View>

            {/* ── Blocking Override ──────────────────────────────────────────── */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>🔒 Blocking Level Override</Text>
                <Text style={styles.sectionDesc}>
                    Override the automatic blocking level. You always have control.
                </Text>
                <View style={styles.levelRow}>
                    {([null, 1, 2, 3] as (BlockingLevel | null)[]).map((level) => (
                        <TouchableOpacity
                            key={String(level)}
                            style={[
                                styles.levelBtn,
                                userBlockingOverride === level && styles.levelBtnActive,
                            ]}
                            onPress={() => setOverride(level)}
                        >
                            <Text
                                style={[
                                    styles.levelBtnText,
                                    userBlockingOverride === level && styles.levelBtnTextActive,
                                ]}
                            >
                                {level === null ? 'Auto' : `Level ${level}`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* ── Feature Toggles ────────────────────────────────────────────── */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>📋 Features</Text>
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Usage Tracking</Text>
                    <Switch
                        value={usageTracking}
                        onValueChange={setUsageTracking}
                        trackColor={{ false: '#21262D', true: '#238636' }}
                        thumbColor="#E6EDF3"
                    />
                </View>
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Health Integration</Text>
                    <Switch
                        value={healthTracking}
                        onValueChange={setHealthTracking}
                        trackColor={{ false: '#21262D', true: '#238636' }}
                        thumbColor="#E6EDF3"
                    />
                </View>
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Cognitive Training</Text>
                    <Switch
                        value={cogTraining}
                        onValueChange={setCogTraining}
                        trackColor={{ false: '#21262D', true: '#238636' }}
                        thumbColor="#E6EDF3"
                    />
                </View>
            </View>

            {/* ── Privacy ────────────────────────────────────────────────────── */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>🔐 Privacy</Text>
                <Text style={styles.privacyText}>
                    ✅ All data stays on your device{'\n'}
                    ✅ No message content is ever read{'\n'}
                    ✅ No browsing content is ever read{'\n'}
                    ✅ Only app metadata is collected{'\n'}
                    ✅ You can disable any feature anytime{'\n'}
                    ✅ You can export or delete all data
                </Text>
            </View>

            {/* ── Data Management ────────────────────────────────────────────── */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>💾 Data</Text>
                <TouchableOpacity style={styles.dataBtn} onPress={handleExport}>
                    <Text style={styles.dataBtnText}>Export All Data</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.dataBtn, styles.deleteBtn]}
                    onPress={handleDeleteData}
                >
                    <Text style={[styles.dataBtnText, styles.deleteBtnText]}>
                        Delete All Data
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1117' },
    content: { padding: 16, paddingBottom: 100 },
    title: {
        fontSize: 28, fontWeight: '800', color: '#E6EDF3',
        marginTop: 8, marginBottom: 16,
    },
    card: {
        backgroundColor: '#161B22', borderRadius: 16, padding: 20,
        marginBottom: 12, borderWidth: 1, borderColor: '#21262D',
    },
    sectionTitle: {
        fontSize: 16, fontWeight: '600', color: '#E6EDF3', marginBottom: 8,
    },
    sectionDesc: {
        fontSize: 13, color: '#8B949E', marginBottom: 16, lineHeight: 18,
    },
    toggleRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 8,
    },
    toggleLabel: { fontSize: 15, color: '#E6EDF3' },
    sliderRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center',
    },
    traitLabel: { fontSize: 14, color: '#E6EDF3', fontWeight: '500' },
    sliderControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sliderBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#21262D', alignItems: 'center',
        justifyContent: 'center', borderWidth: 1, borderColor: '#30363D',
    },
    sliderBtnText: { fontSize: 20, color: '#E6EDF3', fontWeight: '300' },
    sliderValue: {
        width: 36, height: 36, borderRadius: 8,
        backgroundColor: '#0D1117', alignItems: 'center',
        justifyContent: 'center',
    },
    sliderValueText: { fontSize: 18, color: '#58A6FF', fontWeight: '700' },
    scaleRow: {
        flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8,
    },
    scaleLabel: { fontSize: 10, color: '#8B949E', width: 60 },
    scaleBar: {
        flex: 1, height: 4, backgroundColor: '#21262D', borderRadius: 2,
        overflow: 'hidden',
    },
    scaleFill: {
        height: '100%', backgroundColor: '#58A6FF', borderRadius: 2,
    },
    strictnessResult: {
        marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#21262D',
    },
    strictnessLabel: { fontSize: 14, color: '#E6EDF3' },
    strictnessLevel: { fontSize: 13, color: '#8B949E', marginTop: 4 },
    levelRow: { flexDirection: 'row', gap: 8 },
    levelBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 8,
        backgroundColor: '#21262D', alignItems: 'center',
        borderWidth: 1, borderColor: '#30363D',
    },
    levelBtnActive: {
        backgroundColor: '#1A3A2A', borderColor: '#238636',
    },
    levelBtnText: { fontSize: 13, color: '#8B949E', fontWeight: '600' },
    levelBtnTextActive: { color: '#3FB950' },
    privacyText: {
        fontSize: 14, color: '#8B949E', lineHeight: 24,
    },
    dataBtn: {
        paddingVertical: 12, borderRadius: 8,
        backgroundColor: '#21262D', alignItems: 'center',
        marginBottom: 8, borderWidth: 1, borderColor: '#30363D',
    },
    dataBtnText: { fontSize: 14, fontWeight: '600', color: '#E6EDF3' },
    deleteBtn: { borderColor: '#F85149' },
    deleteBtnText: { color: '#F85149' },
});
