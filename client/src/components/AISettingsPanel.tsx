import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bot, Key, Zap, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';

interface AISettings {
    provider: 'platform' | 'openai' | 'gemini' | 'custom';
    openaiKey?: string;
    geminiKey?: string;
    transcriptionProvider: 'openai' | 'platform';
    generationProvider: 'openai' | 'gemini' | 'platform';
}

const DEFAULT_SETTINGS: AISettings = {
    provider: 'platform',
    openaiKey: '',
    geminiKey: '',
    transcriptionProvider: 'platform',
    generationProvider: 'platform'
};

const AISettingsPanel: React.FC = () => {
    const { token, organization } = useAuth();
    const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});
    const [showOpenAIKey, setShowOpenAIKey] = useState(false);
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/analytics/org/${organization?.id}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSettings({ ...DEFAULT_SETTINGS, ...data });
            }
        } catch (err) {
            console.error('Failed to fetch AI settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/analytics/org/${organization?.id}/settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Paramètres IA sauvegardés avec succès !' });
            } else {
                throw new Error('Failed to save');
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde des paramètres.' });
        } finally {
            setSaving(false);
        }
    };

    const testConnection = async (provider: 'openai' | 'gemini') => {
        const apiKey = provider === 'openai' ? settings.openaiKey : settings.geminiKey;
        if (!apiKey) {
            setMessage({ type: 'error', text: `Veuillez entrer une clé API ${provider === 'openai' ? 'OpenAI' : 'Gemini'}.` });
            return;
        }

        setTesting(provider);
        setTestResults(prev => ({ ...prev, [provider]: null }));

        try {
            const res = await fetch('/api/analytics/test-ai-connection', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ provider, apiKey })
            });
            const data = await res.json();
            setTestResults(prev => ({ ...prev, [provider]: data.success ? 'success' : 'error' }));
            setMessage({
                type: data.success ? 'success' : 'error',
                text: data.success ? `Connexion ${provider} réussie !` : `Échec de connexion : ${data.error}`
            });
        } catch (err) {
            setTestResults(prev => ({ ...prev, [provider]: 'error' }));
            setMessage({ type: 'error', text: 'Erreur lors du test de connexion.' });
        } finally {
            setTesting(null);
        }
    };

    const maskKey = (key?: string) => {
        if (!key) return '';
        if (key.length <= 8) return '••••••••';
        return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configuration IA</h2>
                    <p className="text-slate-500 dark:text-slate-400">Configurez vos propres clés API pour la transcription et la génération</p>
                </div>
            </div>

            {/* Message Banner */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            {/* Provider Mode Selection */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Mode de fonctionnement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setSettings(s => ({ ...s, provider: 'platform' }))}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${settings.provider === 'platform'
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <div className="font-bold text-slate-900 dark:text-white mb-1">🏢 Plateforme</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Utiliser les clés de la plateforme (inclus dans l'abonnement)</div>
                    </button>
                    <button
                        onClick={() => setSettings(s => ({ ...s, provider: 'openai' }))}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${settings.provider === 'openai'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <div className="font-bold text-slate-900 dark:text-white mb-1">🤖 OpenAI</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">GPT-4 + Whisper (votre propre clé)</div>
                    </button>
                    <button
                        onClick={() => setSettings(s => ({ ...s, provider: 'custom' }))}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${settings.provider === 'custom'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <div className="font-bold text-slate-900 dark:text-white mb-1">⚡ Personnalisé</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Choisir provider par fonctionnalité</div>
                    </button>
                </div>
            </div>

            {/* API Keys Configuration */}
            {settings.provider !== 'platform' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Key className="w-5 h-5 text-amber-500" />
                        Clés API
                    </h3>

                    <div className="space-y-6">
                        {/* OpenAI Key */}
                        {(settings.provider === 'openai' || settings.provider === 'custom') && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Clé API OpenAI
                                </label>
                                <div className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <input
                                            type={showOpenAIKey ? 'text' : 'password'}
                                            value={settings.openaiKey || ''}
                                            onChange={(e) => setSettings(s => ({ ...s, openaiKey: e.target.value }))}
                                            placeholder="sk-..."
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showOpenAIKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => testConnection('openai')}
                                        disabled={testing === 'openai' || !settings.openaiKey}
                                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {testing === 'openai' ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : testResults.openai === 'success' ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        ) : testResults.openai === 'error' ? (
                                            <XCircle className="w-4 h-4 text-red-500" />
                                        ) : (
                                            <Zap className="w-4 h-4" />
                                        )}
                                        Tester
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">Utilisée pour Whisper (transcription) et GPT-4 (évaluation)</p>
                            </div>
                        )}

                        {/* Gemini Key */}
                        {settings.provider === 'custom' && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Clé API Google Gemini
                                </label>
                                <div className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <input
                                            type={showGeminiKey ? 'text' : 'password'}
                                            value={settings.geminiKey || ''}
                                            onChange={(e) => setSettings(s => ({ ...s, geminiKey: e.target.value }))}
                                            placeholder="AIza..."
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowGeminiKey(!showGeminiKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showGeminiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => testConnection('gemini')}
                                        disabled={testing === 'gemini' || !settings.geminiKey}
                                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {testing === 'gemini' ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : testResults.gemini === 'success' ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        ) : testResults.gemini === 'error' ? (
                                            <XCircle className="w-4 h-4 text-red-500" />
                                        ) : (
                                            <Zap className="w-4 h-4" />
                                        )}
                                        Tester
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">Utilisée pour la génération de questions</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Provider Selection */}
            {settings.provider === 'custom' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Configuration avancée</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                🎙️ Transcription audio
                            </label>
                            <select
                                value={settings.transcriptionProvider}
                                onChange={(e) => setSettings(s => ({ ...s, transcriptionProvider: e.target.value as any }))}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            >
                                <option value="platform">Plateforme (défaut)</option>
                                <option value="openai">OpenAI Whisper</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                ✨ Génération de questions
                            </label>
                            <select
                                value={settings.generationProvider}
                                onChange={(e) => setSettings(s => ({ ...s, generationProvider: e.target.value as any }))}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            >
                                <option value="platform">Plateforme (défaut)</option>
                                <option value="openai">OpenAI GPT-4</option>
                                <option value="gemini">Google Gemini</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Sauvegarder les paramètres
                </button>
            </div>
        </div>
    );
};

export default AISettingsPanel;
