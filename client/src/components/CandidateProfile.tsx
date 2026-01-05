import React from 'react';
import { User, CreditCard } from 'lucide-react';

export default function CandidateProfile() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                <User className="text-indigo-500" /> Mon Profil (TEST)
            </h2>

            <div className="p-10 bg-green-100 text-green-900 font-bold text-2xl border-4 border-green-500 rounded-xl">
                Si vous voyez ce message, le composant Profil fonctionne !
            </div>
        </div>
    );
}
