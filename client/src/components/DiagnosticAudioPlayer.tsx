import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DiagnosticAudioPlayerProps {
    src: string;
    maxListens: number;
    onFirstListen?: () => void;
}

export const DiagnosticAudioPlayer: React.FC<DiagnosticAudioPlayerProps> = ({
    src,
    maxListens,
    onFirstListen
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [listensLeft, setListensLeft] = useState(maxListens);
    const [hasListened, setHasListened] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            if (listensLeft > 0 || isPlaying) {
                audioRef.current.play();
                if (!hasListened) {
                    setHasListened(true);
                    setListensLeft(prev => prev - 1);
                    onFirstListen?.();
                }
            }
        }
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const duration = audioRef.current.duration;
        setProgress((current / duration) * 100);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    useEffect(() => {
        setListensLeft(maxListens);
        setHasListened(false);
        setProgress(0);
        setIsPlaying(false);
    }, [src, maxListens]);

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[3rem] border border-indigo-100/50 dark:border-indigo-900/30">
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />

            <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="5"
                        className="text-slate-200 dark:text-slate-800"
                    />
                    <motion.circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="5"
                        strokeDasharray="282.7"
                        strokeLinecap="round"
                        className="text-indigo-600"
                        animate={{ strokeDashoffset: 282.7 - (282.7 * progress) / 100 }}
                    />
                </svg>

                <button
                    onClick={togglePlay}
                    disabled={listensLeft === 0 && !isPlaying}
                    className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all transform active:scale-90 shadow-2xl ${listensLeft === 0 && !isPlaying
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-white dark:bg-slate-900 text-indigo-600 hover:scale-105'
                        }`}
                >
                    {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
                </button>
            </div>

            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 px-6 py-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex gap-1">
                        {Array.from({ length: maxListens }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${i < listensLeft ? 'bg-indigo-600' : 'bg-slate-200'}`}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-black uppercase text-slate-500 tracking-widest">
                        {listensLeft} écoute{listensLeft > 1 ? 's' : ''} restante{listensLeft > 1 ? 's' : ''}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                    <Volume2 size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Vérifiez votre volume</span>
                </div>
            </div>
        </div>
    );
};
