import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, Image as ImageIcon, Music, X, Copy, Check } from 'lucide-react';

interface MediaAsset {
    id: string;
    filename: string;
    url: string;
    type: 'IMAGE' | 'AUDIO';
    size: number;
    createdAt: string;
}

interface MediaLibraryProps {
    onClose: () => void;
    onSelect?: (media: MediaAsset) => void;
}

export default function MediaLibrary({ onClose, onSelect }: MediaLibraryProps) {
    const { token } = useAuth();
    const [media, setMedia] = useState<MediaAsset[]>([]);
    const [uploading, setUploading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchMedia = async () => {
        try {
            const res = await fetch('http://localhost:3333/media', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setMedia(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchMedia();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:3333/media/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) fetchMedia();
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const copyUrl = (url: string, id: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col h-[80vh]">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <ImageIcon size={20} /> Médiathèque
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <label className={`flex items-center gap-2 px-6 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'bg-slate-50 border-slate-300' : 'border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400'
                        }`}>
                        <input type="file" className="hidden" onChange={handleUpload} accept="image/*,audio/mpeg" disabled={uploading} />
                        <div className="mx-auto flex flex-col items-center text-slate-500">
                            <Upload size={32} className={`mb-2 ${uploading ? 'animate-bounce' : ''}`} />
                            <span className="font-bold">{uploading ? 'Envoi en cours...' : 'Cliquez pour uploader (Image ou Audio)'}</span>
                            <span className="text-xs mt-1">Max 5 Mo</span>
                        </div>
                    </label>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
                    {media.length === 0 && <p className="text-center text-slate-400 py-10">Aucun média. Uploaded-en un !</p>}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {media.map(m => (
                            <div key={m.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 group relative">
                                <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                    {m.type === 'IMAGE' ? (
                                        <img src={`http://localhost:3333${m.url}`} alt={m.filename} className="w-full h-full object-cover" />
                                    ) : (
                                        <Music size={40} className="text-slate-400" />
                                    )}
                                </div>
                                <p className="text-xs font-bold truncate text-slate-700 dark:text-slate-300 mb-1" title={m.filename}>{m.filename}</p>
                                <p className="text-[10px] text-slate-400 uppercase">{m.type} • {Math.round(m.size / 1024)} KB</p>

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl backdrop-blur-[1px]">
                                    {onSelect ? (
                                        <button
                                            onClick={() => onSelect(m)}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xs"
                                        >
                                            Choisir
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={() => copyUrl(m.url, m.id)} className="p-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50">
                                                {copiedId === m.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
