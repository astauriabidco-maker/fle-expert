import React, { useState } from 'react';
import {
    Sparkles,
    CheckCircle2,
    ShieldCheck,
    Zap,
    Star,
    ArrowRight,
    Target,
    Award,
    Globe,
    Coins,
    Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const B2CLandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleBuyPass = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:3333/payments/create-b2c-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Stripe error:", error);
            // Fallback for demo
            navigate('/diagnostic-prep');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            {/* Header / Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                            <Sparkles size={24} />
                        </div>
                        <span className="text-xl font-black tracking-tight uppercase">PrepTEF <span className="text-indigo-600">Pro</span></span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#methode" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Notre Méthode</a>
                        <a href="#ecoles" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Écoles Partenaires</a>
                        <button
                            onClick={() => handleBuyPass()}
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                        >
                            Démarrer
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-40 pb-24 px-6 relative overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
                </div>

                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 text-indigo-600 text-xs font-bold uppercase tracking-widest mb-8 animate-bounce">
                        <Star size={14} className="fill-indigo-600" />
                        Accès Candidat Libre (B2C)
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight text-slate-900">
                        Évaluez votre niveau de français avec <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">précision IA</span>.
                    </h1>
                    <p className="text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                        Obtenez votre score CECRL officiel (A1-C2) en 20 minutes. Recevez votre plan de formation personnalisé et accédez aux meilleures écoles partenaires.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => handleBuyPass()}
                            disabled={isLoading}
                            className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-5 rounded-[1.5rem] font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-95 group"
                        >
                            {isLoading ? 'Initialisation...' : <>Lancer mon diagnostic (9,90€) <ArrowRight className="group-hover:translate-x-1 transition-transform" /></>}
                        </button>
                        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl">
                            <ShieldCheck className="text-emerald-500" size={20} />
                            <span className="text-sm font-bold text-slate-600">Paiement sécurisé par Stripe</span>
                        </div>
                    </div>

                    <div className="mt-16 flex flex-wrap justify-center gap-8 items-center opacity-50 grayscale hover:grayscale-0 transition-all">
                        <div className="flex items-center gap-2 font-black text-xl"><Globe size={20} /> CECRL</div>
                        <div className="flex items-center gap-2 font-black text-xl"><Target size={20} /> PRÉCIS</div>
                        <div className="flex items-center gap-2 font-black text-xl"><Award size={20} /> CERTIFIÉ</div>
                    </div>
                </div>
            </section>

            {/* Features (Grid) */}
            <section id="methode" className="py-24 bg-slate-50 border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black mb-4">Pourquoi passer notre Diagnostic ?</h2>
                        <p className="text-slate-500 font-medium max-w-xl mx-auto">Une technologie de pointe pour une évaluation humaine et scientifique de votre niveau de langue.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Analyse IA Vocale",
                                desc: "Notre IA analyse votre prononciation et votre aisance à l'oral en temps réel.",
                                icon: <Zap className="text-amber-500" />,
                                color: "bg-amber-50"
                            },
                            {
                                title: "Plan de Formation",
                                desc: "Recevez une préconisation d'heures exacte pour atteindre votre objectif (Naturalisation, Études).",
                                icon: <Target className="text-blue-500" />,
                                color: "bg-blue-50"
                            },
                            {
                                title: "Réseau d'Écoles",
                                desc: "Trouvez le centre partenaire idéal pour votre préparation intensive TEF/TCF.",
                                icon: <Building2 className="text-indigo-500" />,
                                color: "bg-indigo-50"
                            }
                        ].map((f, i) => (
                            <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform">
                                <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center mb-6`}>
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed font-medium">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Refund Levier */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden shadow-3xl">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <Coins size={200} />
                    </div>
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-1.5 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
                                Offre Exclusive
                            </div>
                            <h2 className="text-4xl font-black mb-6">Votre Diagnostic <span className="text-indigo-400">Remboursé.</span></h2>
                            <p className="text-indigo-100/70 text-lg mb-8 leading-relaxed">
                                Si vous choisissez de vous inscrire dans l'un de nos centres partenaires après votre test, les 9,90€ du diagnostic seront automatiquement déduits de vos frais d'inscription.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-sm font-bold">
                                    <CheckCircle2 size={18} className="text-emerald-400" /> Valable dans 150+ centres en France
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold">
                                    <CheckCircle2 size={18} className="text-emerald-400" /> Code promo généré automatiquement
                                </li>
                            </ul>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-[2rem] text-center">
                            <div className="text-5xl font-black mb-2 tracking-tighter">0€</div>
                            <div className="text-sm font-black text-indigo-300 uppercase tracking-widest mb-6">Prix net après inscription</div>
                            <button
                                onClick={() => handleBuyPass()}
                                className="w-full bg-white text-indigo-900 font-black py-4 rounded-2xl hover:bg-white/90 transition shadow-2xl active:scale-95"
                            >
                                J'en profite maintenant
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust / FAQ Minimal */}
            <section className="py-24 max-w-3xl mx-auto px-6 text-center">
                <h2 className="text-3xl font-black mb-12">Des questions ?</h2>
                <div className="space-y-6 text-left">
                    {[
                        { q: "Comment se passe le test ?", a: "C'est un test 100% en ligne de 20 minutes comprenant de la compréhension et une expression orale enregistrée." },
                        { q: "Le résultat est-il immédiat ?", a: "Oui, notre IA traite vos réponses instantanément pour vous fournir votre score CECRL." },
                        { q: "Quelles sont les écoles partenaires ?", a: "Nous travaillons avec les centres agréés les plus réputés (Alliance Française, etc.) partout en France." }
                    ].map((item, i) => (
                        <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                            <h4 className="font-black mb-2">{item.q}</h4>
                            <p className="text-sm text-slate-500 font-medium">{item.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-100 text-center">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">© 2024 PrepTEF Pro • Système d'Évaluation Linguistique par IA</p>
            </footer>
        </div>
    );
};

export default B2CLandingPage;
