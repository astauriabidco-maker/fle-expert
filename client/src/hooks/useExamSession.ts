import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Question {
    id: string;
    text: string;
    options: string; // JSON string
    level: string;
    topic: string;
}

interface ExamSessionState {
    sessionId: string | null;
    currentQuestion: Question | null;
    isLoading: boolean;
    isFinished: boolean;
    error: string | null;
    progress: number;
    score?: number;
    level?: string;
    downloadUrl?: string;
}

export const useExamSession = (warningsCount: number = 0, examType: 'EXAM' | 'DIAGNOSTIC' = 'EXAM') => {
    const { token, user, organization } = useAuth();
    const [state, setState] = useState<ExamSessionState>({
        sessionId: null,
        currentQuestion: null,
        isLoading: false,
        isFinished: false,
        error: null,
        progress: 0
    });

    const startExam = useCallback(async () => {
        if (!token || !user || !organization) return;
        setState(s => ({ ...s, isLoading: true, error: null }));

        try {
            // Check for sessionId in URL
            const urlParams = new URLSearchParams(window.location.search);
            const existingSessionId = urlParams.get('sessionId');

            let session;

            if (existingSessionId) {
                // Resume/Start existing
                const res = await fetch(`http://localhost:3333/exam/${existingSessionId}/start`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ userId: user.id })
                });
                if (!res.ok) {
                    throw new Error('Impossible de démarrer cette session spécifique');
                }
                const data = await res.json();
                session = data.session;
            } else {
                // 1. Start NEW Session
                const startRes = await fetch('http://localhost:3333/exam/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        organizationId: organization.id,
                        type: examType  // Pass exam type to backend
                    })
                });

                if (!startRes.ok) throw new Error('Failed to start exam');
                const data = await startRes.json();
                session = data.session;
            }

            // 2. Get First Question
            const nextRes = await fetch(`http://localhost:3333/exam/${session.id}/next`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const nextData = await nextRes.json();

            setState({
                sessionId: session.id,
                currentQuestion: nextData.question || null,
                isLoading: false,
                isFinished: nextData.finished,
                error: null,
                progress: 0
            });

        } catch (err: any) {
            setState(s => ({ ...s, isLoading: false, error: err.message }));
        }
    }, [token, user, organization]);

    const completeExam = useCallback(async (sessionId: string) => {
        try {
            const res = await fetch(`http://localhost:3333/exam/${sessionId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ warningsCount })
            });

            const { result } = await res.json();

            setState(prev => ({
                ...prev,
                isFinished: true,
                isLoading: false,
                currentQuestion: null,
                score: result.score,
                level: result.level,
                downloadUrl: result.downloadUrl
            }));
        } catch (err: any) {
            setState(s => ({ ...s, isLoading: false, error: err.message }));
        }
    }, [token, warningsCount]);

    const submitAnswer = useCallback(async (questionId: string, selectedOption: string) => {
        if (!state.sessionId || !token) return;
        setState(s => ({ ...s, isLoading: true }));

        try {
            const res = await fetch(`http://localhost:3333/exam/${state.sessionId}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ questionId, selectedOption })
            });

            if (!res.ok) throw new Error('Failed to submit answer');

            const nextData = await res.json();

            if (nextData.finished) {
                await completeExam(state.sessionId);
            } else {
                setState(prev => ({
                    ...prev,
                    currentQuestion: nextData.question,
                    isLoading: false,
                    progress: prev.progress + 1
                }));
            }

        } catch (err: any) {
            setState(s => ({ ...s, isLoading: false, error: err.message }));
        }
    }, [state.sessionId, token, completeExam]);

    return {
        ...state,
        startExam,
        submitAnswer
    };
};
