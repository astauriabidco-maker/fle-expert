import React, { useState } from 'react';
import { ExamGuard } from './ExamGuard';
import { CandidateExamRunner } from './CandidateExamRunner';

const ExamSessionPage: React.FC = () => {
    // Shared state for warnings to pass to ExamRunner -> useExamSession
    const [warningsCount, setWarningsCount] = useState(0);

    return (
        <ExamGuard onWarningsUpdate={setWarningsCount}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
                <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 flex justify-between items-center">
                    <h1 className="font-bold text-slate-800 dark:text-white">Session d'Examen TCF</h1>
                    <div className="text-sm font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded border border-gray-200 dark:border-slate-700">
                        Mode Sécurisé Actif
                    </div>
                </header>

                <main className="flex-grow p-4 sm:p-8 w-full max-w-5xl mx-auto flex flex-col items-center">
                    <CandidateExamRunner warningsCount={warningsCount} />
                </main>
            </div>
        </ExamGuard>
    );
};

export default ExamSessionPage;
