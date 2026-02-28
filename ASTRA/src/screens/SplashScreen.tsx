import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    Easing,
    runOnJS
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { AstraColors } from '../constants/astraTheme';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
    onInitializationComplete: () => void;
}

export default function SplashScreen({ onInitializationComplete }: SplashScreenProps) {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.9);

    useEffect(() => {
        // Run animation sequence
        opacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
        scale.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.back(1.5)) });

        // Simulate initialization tasks (e.g. SQLite setup, loading profile)
        // Ensure minimum screen time of 2.5s to let the animation play fully
        const timer = setTimeout(() => {
            // Fade out
            opacity.value = withTiming(0, { duration: 500, easing: Easing.in(Easing.cubic) }, (finished) => {
                if (finished) {
                    runOnJS(onInitializationComplete)();
                }
            });
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.content, animatedStyle]}>
                {/* SVG Logo recreated from provided image */}
                <Svg width={120} height={120} viewBox="0 0 100 100" fill="none">
                    {/* The A outer frame */}
                    <Path
                        d="M 50 10 L 80 80 L 68 80 L 58 55 M 50 10 L 32 50"
                        stroke="#4A4A4A"
                        strokeWidth="6"
                        strokeLinejoin="miter"
                        strokeLinecap="butt"
                    />
                    {/* The cutting star / swoosh in the center */}
                    <Path
                        d="M 30 52 L 45 40 L 50 25 L 53 40 L 85 30 L 55 50 L 60 70 L 45 55 L 20 57 Z"
                        fill="#4A4A4A"
                    />
                    {/* Refining to match the exact arrow geometry cutting the A: */}
                    <Path
                        d="M 15 50 L 35 35 L 50 50 L 70 30 L 60 55 L 75 75 L 50 65 L 30 75 Z"
                        fill={AstraColors.background} // cutout effect
                    />
                    <Path
                        d="M 30 55 L 45 45 L 80 35 L 60 55 Z"
                        fill="#4A4A4A"
                    />
                </Svg>

                <Text style={styles.brandText}>ASTRA</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AstraColors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    brandText: {
        marginTop: 16,
        fontSize: 42,
        fontWeight: '800',
        color: '#162331', // matched the deep blue-slate from the logo text
        letterSpacing: 4,
    }
});
