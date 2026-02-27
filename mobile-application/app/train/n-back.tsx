import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusStore } from '@/store/focus-store';

// Simplified dual N-Back: show a sequence of letters; user taps if current matches N-back
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROUNDS = 20;

function randomLetter(): string {
    return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

export default function NBackScreen() {
    const router = useRouter();
    const { currentDifficulty, addSession } = useFocusStore();
    const nLevel = Math.min(currentDifficulty, 4); // N = 1–4

    const [round, setRound] = useState(0);
    const [sequence, setSequence] = useState<string[]>([]);
    const [currentLetter, setCurrentLetter] = useState('');
    const [isMatch, setIsMatch] = useState(false);
    const [hits, setHits] = useState(0);
    const [misses, setMisses] = useState(0);
    const [responded, setResponded] = useState(false);
    const [running, setRunning] = useState(false);
    const [finished, setFinished] = useState(false);
    const startTime = useRef(Date.now());
    const reactionTimes = useRef<number[]>([]);
    const roundStart = useRef(Date.now());

    const startGame = useCallback(() => {
        setRunning(true);
        startTime.current = Date.now();
        // Pre-generate partial sequence
        const initial: string[] = [];
        for (let i = 0; i < nLevel; i++) initial.push(randomLetter());
        setSequence(initial);
        advanceRound(initial, 0);
    }, [nLevel]);

    const advanceRound = useCallback(
        (seq: string[], r: number) => {
            if (r >= ROUNDS) {
                setFinished(true);
                setRunning(false);
                return;
            }

            // ~30% chance of match
            let letter: string;
            if (r >= nLevel && Math.random() < 0.3) {
                letter = seq[seq.length - nLevel];
            } else {
                letter = randomLetter();
            }

            const newSeq = [...seq, letter];
            const match = r >= nLevel && letter === newSeq[newSeq.length - 1 - nLevel];

            setSequence(newSeq);
            setCurrentLetter(letter);
            setIsMatch(match);
            setResponded(false);
            setRound(r + 1);
            roundStart.current = Date.now();

            // Auto advance after 2.5 seconds
            setTimeout(() => {
                setResponded((prev) => {
                    if (!prev && match) {
                        setMisses((m) => m + 1); // missed a match
                    }
                    return true;
                });
                setTimeout(() => advanceRound(newSeq, r + 1), 300);
            }, 2500);
        },
        [nLevel],
    );

    const handleTap = useCallback(() => {
        if (responded || !running) return;
        setResponded(true);
        const rt = Date.now() - roundStart.current;
        reactionTimes.current.push(rt);

        if (isMatch) {
            setHits((h) => h + 1);
        } else {
            setMisses((m) => m + 1); // false positive
        }
    }, [responded, running, isMatch]);

    const saveAndExit = useCallback(() => {
        const totalMatches = hits + misses;
        const accuracy = totalMatches > 0 ? Math.round((hits / Math.max(totalMatches, 1)) * 100) : 50;
        const avgRT =
            reactionTimes.current.length > 0
                ? Math.round(
                    reactionTimes.current.reduce((a, b) => a + b, 0) / reactionTimes.current.length,
                )
                : 400;

        addSession({
            type: 'n-back',
            startedAt: startTime.current,
            duration: Math.round((Date.now() - startTime.current) / 1000),
            accuracy,
            reactionTimeMs: avgRT,
            completed: true,
            difficulty: currentDifficulty,
        });

        router.back();
    }, [hits, misses, currentDifficulty, addSession, router]);

    return (
        <View style={styles.container}>
            {!running && !finished && (
                <View style={styles.center}>
                    <Text style={styles.title}>{nLevel}-Back</Text>
                    <Text style={styles.instructions}>
                        Tap when the current letter matches{'\n'}the one shown {nLevel} step
                        {nLevel > 1 ? 's' : ''} ago.
                    </Text>
                    <Pressable style={styles.button} onPress={startGame}>
                        <Text style={styles.buttonText}>Start</Text>
                    </Pressable>
                </View>
            )}

            {running && (
                <View style={styles.center}>
                    <Text style={styles.roundLabel}>
                        Round {round}/{ROUNDS}
                    </Text>
                    <Pressable style={styles.letterBox} onPress={handleTap}>
                        <Text style={styles.letter}>{currentLetter}</Text>
                    </Pressable>
                    <Text style={styles.hint}>
                        {responded ? (isMatch ? '✓ Match!' : 'Next…') : 'Tap if match'}
                    </Text>
                </View>
            )}

            {finished && (
                <View style={styles.center}>
                    <Text style={styles.title}>Complete</Text>
                    <View style={styles.resultRow}>
                        <View style={styles.resultItem}>
                            <Text style={styles.resultValue}>{hits}</Text>
                            <Text style={styles.resultLabel}>Hits</Text>
                        </View>
                        <View style={styles.resultItem}>
                            <Text style={styles.resultValue}>{misses}</Text>
                            <Text style={styles.resultLabel}>Misses</Text>
                        </View>
                    </View>
                    <Pressable style={styles.button} onPress={saveAndExit}>
                        <Text style={styles.buttonText}>Save & Exit</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    instructions: {
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    roundLabel: {
        fontSize: 14,
        color: '#999',
        marginBottom: 20,
        fontWeight: '500',
    },
    letterBox: {
        width: 140,
        height: 140,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginBottom: 24,
    },
    letter: {
        fontSize: 64,
        fontWeight: '300',
        color: '#1A1A1A',
    },
    hint: {
        fontSize: 14,
        color: '#888',
    },
    button: {
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 48,
        paddingVertical: 16,
        borderRadius: 8,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    resultRow: {
        flexDirection: 'row',
        gap: 40,
        marginBottom: 32,
    },
    resultItem: {
        alignItems: 'center',
    },
    resultValue: {
        fontSize: 36,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    resultLabel: {
        fontSize: 12,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 4,
    },
});
