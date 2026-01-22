import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiagnosticVoiceRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void;
}

export const DiagnosticVoiceRecorder: React.FC<DiagnosticVoiceRecorderProps> = ({
    onRecordingComplete
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [waveform, setWaveform] = useState<number[]>(Array(40).fill(5));
    const [error, setError] = useState<string | null>(null);
    const [playbackPlaying, setPlaybackPlaying] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const animationFrameRef = useRef<number>();
    const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyzerRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyzerRef.current);
            analyzerRef.current.fftSize = 256;

            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setRecordingBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                onRecordingComplete(blob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setError(null);
            setRecordingBlob(null);
            setAudioUrl(null);

            updateWaveform();
        } catch (err) {
            setError("Accès au microphone refusé ou non supporté.");
            console.error(err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        }
    };

    const updateWaveform = () => {
        if (!analyzerRef.current) return;
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);

        // Simple visualization: take a slice and map to heights
        const newWaveform = Array.from({ length: 40 }).map((_, i) => {
            const val = dataArray[i * 2] || 0;
            return Math.max(5, (val / 255) * 60);
        });

        setWaveform(newWaveform);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    const togglePlayback = () => {
        if (!playbackAudioRef.current) return;
        if (playbackPlaying) {
            playbackAudioRef.current.pause();
        } else {
            playbackAudioRef.current.play();
        }
    };

    return (
        <div className="w-full flex flex-col items-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800">
            {/* Waveform Visualization */}
            <div className="h-24 flex items-center justify-center gap-1 mb-10 w-full px-4">
                {waveform.map((height, i) => (
                    <motion.div
                        key={i}
                        className={`w-1.5 rounded-full ${isRecording ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                        animate={{ height }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-6">
                {!isRecording && !audioUrl && (
                    <button
                        onClick={startRecording}
                        className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-200 hover:scale-110 active:scale-95 transition-all"
                        title="Commencer l'enregistrement"
                    >
                        <Mic size={32} />
                    </button>
                )}

                {isRecording && (
                    <button
                        onClick={stopRecording}
                        className="w-20 h-20 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-rose-200 hover:scale-110 active:scale-95 transition-all"
                        title="Arrêter l'enregistrement"
                    >
                        <Square size={32} fill="currentColor" />
                    </button>
                )}

                {audioUrl && !isRecording && (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={startRecording}
                            className="p-5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors"
                            title="Refaire"
                        >
                            <RotateCcw size={24} />
                        </button>
                        <button
                            onClick={togglePlayback}
                            className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-200 hover:scale-110 active:scale-95 transition-all"
                            title={playbackPlaying ? "Pause" : "Réécouter"}
                        >
                            {playbackPlaying ? <Square size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>
                        <div className="p-5 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <Check size={24} />
                        </div>
                    </div>
                )}

                <audio
                    ref={playbackAudioRef}
                    src={audioUrl || ''}
                    onPlay={() => setPlaybackPlaying(true)}
                    onPause={() => setPlaybackPlaying(false)}
                    onEnded={() => setPlaybackPlaying(false)}
                    className="hidden"
                />

                <div className="text-center">
                    <p className={`text-sm font-black uppercase tracking-widest ${isRecording ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
                        {isRecording ? "Enregistrement en cours..." : audioUrl ? "Prêt pour validation" : "Cliquez sur le micro pour parler"}
                    </p>
                    {error && (
                        <div className="mt-4 flex items-center gap-2 text-rose-500 text-xs font-bold">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
