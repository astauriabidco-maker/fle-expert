import { useState, useCallback, useEffect, useRef } from 'react';
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
    currentQuestionIndex: number;
    allQuestions: Question[];
    answers: Record<string, string>;
    isLoading: boolean;
    isFinished: boolean;
    error: string | null;
    progress: number;
    score?: number;
    level?: string;
    downloadUrl?: string;
    timeRemainingSeconds: number;
    durationMinutes: number;
    startedAt: Date | null;
}

export const useExamSession = (warningsCount: number = 0, examType: 'EXAM' | 'DIAGNOSTIC' = 'EXAM') => {
    const { token, user, organization } = useAuth();
    const [state, setState] = useState<ExamSessionState>({
        sessionId: null,
        currentQuestion: null,
        currentQuestionIndex: 0,
        allQuestions: [],
        answers: {},
        isLoading: false,
        isFinished: false,
        error: null,
        progress: 0,
        timeRemainingSeconds: examType === 'DIAGNOSTIC' ? 15 * 60 : 60 * 60,
        durationMinutes: examType === 'DIAGNOSTIC' ? 15 : 60,
        startedAt: null,
    });

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

    // Timer countdown effect
    useEffect(() => {
        if (state.sessionId && state.startedAt && !state.isFinished && state.timeRemainingSeconds > 0) {
            timerRef.current = setInterval(() => {
                setState(prev => {
                    const newTime = prev.timeRemainingSeconds - 1;
                    if (newTime <= 0) {
                        // Time's up - trigger completion
                        return { ...prev, timeRemainingSeconds: 0 };
                    }
                    return { ...prev, timeRemainingSeconds: newTime };
                });
            }, 1000);

            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
            };
        }
    }, [state.sessionId, state.startedAt, state.isFinished]);

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

                // Fetch session state with existing answers
                const stateRes = await fetch(`http://localhost:3333/exam/${existingSessionId}/state`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (stateRes.ok) {
                    const sessionState = await stateRes.json();
                    setState(prev => ({
                        ...prev,
                        sessionId: session.id,
                        allQuestions: sessionState.questions || [],
                        answers: sessionState.answers || {},
                        timeRemainingSeconds: sessionState.timeRemainingSeconds,
                        durationMinutes: sessionState.durationMinutes,
                        startedAt: sessionState.startedAt ? new Date(sessionState.startedAt) : new Date(),
                        currentQuestionIndex: sessionState.currentQuestionIndex || 0,
                    }));
                }
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
                        type: examType
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

            setState(prev => ({
                ...prev,
                sessionId: session.id,
                currentQuestion: nextData.question || null,
                allQuestions: nextData.question ? [...prev.allQuestions, nextData.question] : prev.allQuestions,
                isLoading: false,
                isFinished: nextData.finished,
                error: null,
                progress: 0,
                startedAt: session.startedAt ? new Date(session.startedAt) : new Date(),
                timeRemainingSeconds: (session.durationMinutes || 60) * 60,
                durationMinutes: session.durationMinutes || 60,
            }));

        } catch (err: any) {
            setState(s => ({ ...s, isLoading: false, error: err.message }));
        }
    }, [token, user, organization, examType]);

    const saveAnswer = useCallback(async (questionId: string, selectedOption: string) => {
        if (!state.sessionId || !token) return;

        // Update local state immediately
        setState(prev => ({
            ...prev,
            answers: { ...prev.answers, [questionId]: selectedOption }
        }));

        // Debounced API call
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        autoSaveRef.current = setTimeout(async () => {
            try {
                await fetch(`http://localhost:3333/exam/${state.sessionId}/save-answer`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ questionId, selectedOption })
                });
            } catch (err) {
                console.error('Auto-save failed:', err);
            }
        }, 1500); // 1.5 second debounce
    }, [state.sessionId, token]);

    const goToQuestion = useCallback((index: number) => {
        if (index >= 0 && index < state.allQuestions.length) {
            setState(prev => ({
                ...prev,
                currentQuestionIndex: index,
                currentQuestion: prev.allQuestions[index],
            }));
        }
    }, [state.allQuestions.length]);

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
                    allQuestions: nextData.question
                        ? [...prev.allQuestions.filter(q => q.id !== nextData.question.id), nextData.question]
                        : prev.allQuestions,
                    currentQuestionIndex: prev.allQuestions.length,
                    answers: { ...prev.answers, [questionId]: selectedOption },
                    isLoading: false,
                    progress: prev.progress + 1
                }));
            }

        } catch (err: any) {
            setState(s => ({ ...s, isLoading: false, error: err.message }));
        }
    }, [state.sessionId, token, completeExam]);

    // Calculate answered count
    const answeredCount = Object.keys(state.answers).length;

    return {
        ...state,
        answeredCount,
        startExam,
        submitAnswer,
        saveAnswer,
        goToQuestion,
        completeExam: () => state.sessionId && completeExam(state.sessionId),
    };
};
