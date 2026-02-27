import { useState, useEffect, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
    '480771594956-mikoonp06d4ejphk87dmgfv8m981t9cq.apps.googleusercontent.com';

const CLASSROOM_SCOPES = [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
];

const GMAIL_SCOPES = [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/gmail.readonly',
];

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface ServiceState {
    status: ConnectionStatus;
    userEmail?: string;
    accessToken?: string;
    error?: string;
}

export interface GoogleAuthState {
    classroom: ServiceState;
    gmail: ServiceState;
    connectClassroom: () => Promise<void>;
    connectGmail: () => Promise<void>;
}

async function fetchUserInfo(accessToken: string): Promise<{ email: string }> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Failed to fetch user info');
    return res.json();
}

export function useGoogleAuth(): GoogleAuthState {
    const [classroom, setClassroom] = useState<ServiceState>({ status: 'idle' });
    const [gmail, setGmail] = useState<ServiceState>({ status: 'idle' });

    // 1) Setup Classroom Request
    const [classroomRequest, classroomResponse, classroomPromptAsync] = Google.useAuthRequest(
        {
            webClientId: GOOGLE_CLIENT_ID,
            // @ts-ignore - Some versions of expo-auth-session require expoClientId for proxy behavior
            expoClientId: GOOGLE_CLIENT_ID,
            scopes: CLASSROOM_SCOPES,
        },
        {
            // @ts-ignore - Forcing proxy fallback for Expo Go
            useProxy: true,
        }
    );

    // 2) Setup Gmail Request
    const [gmailRequest, gmailResponse, gmailPromptAsync] = Google.useAuthRequest(
        {
            webClientId: GOOGLE_CLIENT_ID,
            // @ts-ignore
            expoClientId: GOOGLE_CLIENT_ID,
            scopes: GMAIL_SCOPES,
        },
        {
            // @ts-ignore
            useProxy: true,
        }
    );

    // Watch Classroom response
    useEffect(() => {
        if (classroomResponse?.type === 'success' && classroomResponse.authentication?.accessToken) {
            const token = classroomResponse.authentication.accessToken;
            fetchUserInfo(token)
                .then((info) => {
                    setClassroom({ status: 'connected', userEmail: info.email, accessToken: token });
                })
                .catch(() => {
                    setClassroom({ status: 'error', error: 'Failed to fetch user info' });
                });
        } else if (classroomResponse?.type === 'cancel' || classroomResponse?.type === 'dismiss') {
            setClassroom({ status: 'idle' });
        } else if (classroomResponse?.type === 'error') {
            setClassroom({ status: 'error', error: classroomResponse.error?.message || 'Auth failed' });
        }
    }, [classroomResponse]);

    // Watch Gmail response
    useEffect(() => {
        if (gmailResponse?.type === 'success' && gmailResponse.authentication?.accessToken) {
            const token = gmailResponse.authentication.accessToken;
            fetchUserInfo(token)
                .then((info) => {
                    setGmail({ status: 'connected', userEmail: info.email, accessToken: token });
                })
                .catch(() => {
                    setGmail({ status: 'error', error: 'Failed to fetch user info' });
                });
        } else if (gmailResponse?.type === 'cancel' || gmailResponse?.type === 'dismiss') {
            setGmail({ status: 'idle' });
        } else if (gmailResponse?.type === 'error') {
            setGmail({ status: 'error', error: gmailResponse.error?.message || 'Auth failed' });
        }
    }, [gmailResponse]);

    const connectClassroom = useCallback(async () => {
        try {
            setClassroom({ status: 'connecting' });
            // @ts-ignore
            await classroomPromptAsync({ useProxy: true });
        } catch (e: any) {
            setClassroom({ status: 'error', error: e.message || 'Error launching auth' });
        }
    }, [classroomPromptAsync]);

    const connectGmail = useCallback(async () => {
        try {
            setGmail({ status: 'connecting' });
            // @ts-ignore
            await gmailPromptAsync({ useProxy: true });
        } catch (e: any) {
            setGmail({ status: 'error', error: e.message || 'Error launching auth' });
        }
    }, [gmailPromptAsync]);

    return { classroom, gmail, connectClassroom, connectGmail };
}
