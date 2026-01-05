import React from 'react';
import { motion } from 'framer-motion';
import {
    Zap,
    Globe,
    Users,
    ChevronRight,
    Check,
    BarChart3,
    ShieldCheck,
    ArrowRight,
    Sparkles,
    GraduationCap,
    X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

const LandingPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [isDemoOpen, setIsDemoOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 overflow-x-hidden font-sans">
            <VideoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />



            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                            <Zap className="text-white" size={20} fill="currentColor" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Prep<span className="text-indigo-600">TEF</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-10">
                        <a href="#pro-features" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Candidats</a>
                        <a href="#partners" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Écoles & Centres</a>
                        <a href="#pricing" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Tarifs</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        {!isAuthenticated ? (
                            <>
                                <Link to="/login" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">Connexion</Link>
                                <Link
                                    to="/register"
                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-100 hover:shadow-xl hover:shadow-slate-200 dark:hover:shadow-none transition-all active:scale-95 border border-transparent"
                                >
                                    Démarrer
                                </Link>
                            </>
                        ) : (
                            <Link
                                to="/dashboard"
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-95"
                            >
                                Mon Espace
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section - Optimized & Dual CTAs */}
            <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden bg-white dark:bg-slate-950">
                {/* Background Decor - Subtle */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-full text-[11px] font-bold uppercase tracking-widest mb-6 border border-slate-200 dark:border-slate-800"
                        >
                            <Sparkles size={12} className="text-indigo-500" />
                            Nouvelle méthode d'apprentissage adaptative
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-[1.1]"
                        >
                            Passez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">TEF & TCF</span> du premier coup.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium max-w-2xl mx-auto"
                        >
                            Votre assistant personnel analyse vos points forts et cible vos lacunes.
                            Un programme sur-mesure pour maximiser votre score, sans perdre de temps.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col sm:flex-row items-stretch justify-center gap-4 px-4"
                        >
                            {/* Candidate CTA */}
                            <Link to="/register" className="flex-1 sm:flex-initial sm:min-w-[240px] px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex flex-col items-center justify-center gap-1 group active:scale-95">
                                <span className="flex items-center gap-2">Je suis Candidat <ChevronRight size={18} /></span>
                                <span className="text-[10px] opacity-80 font-normal uppercase tracking-wide">Testez votre niveau gratuitement</span>
                            </Link>

                            {/* School CTA */}
                            <a href="#partners" className="flex-1 sm:flex-initial sm:min-w-[240px] px-8 py-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex flex-col items-center justify-center gap-1 group active:scale-95">
                                <span className="flex items-center gap-2">Je suis une École <Globe size={16} /></span>
                                <span className="text-[10px] opacity-60 font-normal uppercase tracking-wide">Découvrez l'offre Partenaires</span>
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-10 flex items-center justify-center gap-6 text-xs font-semibold text-slate-400"
                        >
                            <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> Pas de carte requise</span>
                            <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> 10 minutes par jour</span>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Value Props Grid */}
            <section id="features-grid" className="py-16 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap className="text-amber-500" size={32} />}
                            title="Diagnostic IA & Personnalisation"
                            description="Nous analysons votre niveau réel (A1-C2) en 15 minutes. Recevez ensuite des exercices ciblant uniquement vos points faibles."
                        />
                        <FeatureCard
                            icon={<Users className="text-indigo-500" size={32} />}
                            title="Coach Vocal & Écrit"
                            description="Entraînez-vous à l'oral et à l'écrit. Notre IA corrige votre prononciation et votre grammaire instantanément."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="text-emerald-500" size={32} />}
                            title="Certificat Officiel Blockchain"
                            description="À chaque palier franchi, obtenez un certificat sécurisé vérifiable par les employeurs et écoles."
                        />
                    </div>
                </div>
            </section>

            {/* Candidate Deep Dive Features */}
            <section id="pro-features" className="py-20 bg-white dark:bg-slate-950 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16 mb-32">
                        <div className="lg:w-1/2 order-2 lg:order-1">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-video flex items-center justify-center group">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <img src="/assets/dashboard_radar_fr.png" alt="Interface Dashboard" className="absolute inset-0 w-full h-full object-cover object-top opacity-90 transition-transform duration-700 group-hover:scale-105" />
                            </div>
                        </div>
                        <div className="lg:w-1/2 order-1 lg:order-2">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mb-6">
                                <BarChart3 className="text-indigo-600 dark:text-indigo-400" size={24} />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">Visualisez vos progrès. Restez motivé.</h2>
                            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                                Notre tableau de bord inspiré des meilleures apps de sport vous montre exactement où vous en êtes. Suivez votre progression compétence par compétence.
                            </p>
                            <ul className="space-y-4">
                                <FeatureListItem text="Radar de compétences (CO, CE, EO, EE)" />
                                <FeatureListItem text="Historique détaillé des sessions" />
                                <FeatureListItem text="Comparaison avec la moyenne des candidats" />
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center mb-6">
                                <GraduationCap className="text-amber-600 dark:text-amber-400" size={24} />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">Des examens blancs en conditions réelles.</h2>
                            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                                Ne soyez pas surpris le jour J. Nos simulations respectent le timing et le format exact des examens officiels TEF et TCF.
                            </p>
                            <ul className="space-y-4">
                                <FeatureListItem text="Mode Chrono stress-test" />
                                <FeatureListItem text="Sujets mis à jour chaque semaine" />
                                <FeatureListItem text="Correction détaillée avec explications" />
                            </ul>
                        </div>
                        <div className="lg:w-1/2">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-video flex items-center justify-center group">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <img src="/assets/exam_simulation.png" alt="Interface Examen" className="absolute inset-0 w-full h-full object-cover object-top opacity-90 transition-transform duration-700 group-hover:scale-105" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof - Streamlined */}
            <section className="py-16 border-y border-slate-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">Reconnu par les experts</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {['Alliance Française', 'Institut Français', 'Campus France', 'TV5 Monde', 'RFI Savoirs'].map((partner) => (
                            <span key={partner} className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tighter italic">{partner}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Espace Partenaires (B2B) Section - KEPT AS IS BUT CLEANED UP */}
            <section id="partners" className="py-20 bg-indigo-900 text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16 mb-24">
                        <div className="lg:w-1/2">
                            <div className="inline-flex items-center gap-2 bg-indigo-800/50 border border-indigo-700/50 rounded-full px-4 py-1.5 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-8">
                                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                                Réservé aux Organismes de Formation
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-none tracking-tight">
                                Vos formateurs corrigent encore des copies ? <br />
                                <span className="text-indigo-400">Vous perdez de l'argent.</span>
                            </h2>
                            <p className="text-xl text-indigo-100/80 font-medium mb-10 leading-relaxed max-w-lg">
                                Automatisez 100% de la préparation TEF/TCF.
                                <strong className="text-white"> Multipliez vos marges par 3 </strong>
                                en supprimant les coûts de correction manuelle, sans baisser la qualité.
                            </p>

                            <div className="flex flex-col sm:flex-row items-stretch gap-4">
                                <Link
                                    to="/register-partner"
                                    className="px-8 py-4 bg-white text-indigo-900 font-black rounded-xl text-lg hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/50 flex items-center justify-center gap-2 active:scale-95"
                                >
                                    Créer un compte École Gratuit <ArrowRight size={20} />
                                </Link>
                                <button
                                    onClick={() => setIsDemoOpen(true)}
                                    className="px-8 py-4 bg-transparent border-2 border-indigo-700 text-white font-bold rounded-xl text-lg hover:bg-indigo-900/50 transition-all flex items-center justify-center gap-2"
                                >
                                    Voir la démo (3min)
                                </button>
                            </div>
                        </div>

                        {/* ROI Card */}
                        <div className="lg:w-1/2">
                            <div className="bg-white text-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative">
                                <div className="absolute -top-6 -right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg rotate-3">
                                    Rentabilité Immédiate
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                        <div>
                                            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">Coût Correction Humaine</div>
                                            <div className="text-2xl font-black text-rose-500">~150€ <span className="text-sm text-slate-400 font-medium">/ élève / mois</span></div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">Temps perdu</div>
                                            <div className="text-2xl font-black text-slate-900">12h <span className="text-sm text-slate-400 font-medium">/ prof</span></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <div>
                                            <div className="text-indigo-600 text-xs font-bold uppercase tracking-widest">Coût PrepTEF IA</div>
                                            <div className="text-3xl font-black text-emerald-600">Divisé par 10</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-indigo-600 text-xs font-bold uppercase tracking-widest">Temps perdu</div>
                                            <div className="text-3xl font-black text-indigo-600">0h</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3 Killer Features - B2B */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                        <B2BFeatureCard
                            icon={<Zap className="text-amber-400" size={32} />}
                            title="Correction IA"
                            desc="Évaluation instantanée prononciation & grammaire."
                        />
                        <B2BFeatureCard
                            icon={<ShieldCheck className="text-emerald-400" size={32} />}
                            title="Certificats Anti-Fraude"
                            desc="Sécurisés par Blockchain. Preuve irréfutable."
                        />
                        <B2BFeatureCard
                            icon={<BarChart3 className="text-blue-400" size={32} />}
                            title="Pilotage de Cohortes"
                            desc="Vue d'ensemble sur la progression de tous vos élèves."
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Section - Unified */}
            <section id="pricing" className="py-20 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">Tarifs simples. Sans engagement.</h2>
                        <p className="text-xl text-slate-500 dark:text-slate-400 font-medium font-sans">Rejoignez 10,000+ candidats qui ont réussi leur examen.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <PricingCard
                            name="Découverte"
                            price="0"
                            credits="50"
                            features={["Test de niveau complet", "5 exercices correctio IA", "Accès partiel dashboard"]}
                            buttonText="Créer un compte gratuit"
                        />
                        <PricingCard
                            name="Réussite"
                            price="49"
                            credits="2000"
                            features={["Entraînement illimité", "10 Examens Blancs", "Certification Blockchain", "Support Prioritaire"]}
                            isPopular={true}
                            buttonText="Commencer ma préparation"
                        />
                        <PricingCard
                            name="Business"
                            price="Contactez-nous"
                            credits="Illimité"
                            features={["Gestion multi-élèves", "Marque Blanche", "API Access", "Manager dédié"]}
                            buttonText="Offre École"
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="pt-20 pb-10 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                    <Zap className="text-white" size={16} fill="currentColor" />
                                </div>
                                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Prep<span className="text-indigo-600">TEF</span></span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed">
                                Plateforme d'entraînement n°1 pour le TEF et TCF.
                                Conçue par des experts FLE et propulsée par l'IA.
                            </p>
                        </div>
                        <div>
                            <h5 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Candidats</h5>
                            <ul className="space-y-3 text-slate-500 dark:text-slate-400 font-medium text-sm">
                                <li><Link to="/register" className="hover:text-indigo-600 transition-colors">S'inscrire</Link></li>
                                <li><a href="#" className="hover:text-indigo-600 transition-colors">Test gratuit</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition-colors">Tarifs</a></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Partenaires</h5>
                            <ul className="space-y-3 text-slate-500 dark:text-slate-400 font-medium text-sm">
                                <li><a href="#partners" className="hover:text-indigo-600 transition-colors">Offre Écoles</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition-colors">Devenir Affilié</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition-colors">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-400 font-medium">© 2026 PrepTEF. Tous droits réservés.</p>
                        <div className="flex items-center gap-4">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Système Opérationnel</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Sub-components for cleaner code
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all"
    >
        <div className="mb-6">{icon}</div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{description}</p>
    </motion.div>
);

const FeatureListItem = ({ text }: { text: string }) => (
    <li className="flex gap-3 items-center text-slate-700 dark:text-slate-300 font-bold">
        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        {text}
    </li>
);

const B2BFeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="bg-indigo-800/30 border border-indigo-700/50 p-8 rounded-3xl backdrop-blur-sm">
        <div className="mb-6">{icon}</div>
        <h3 className="text-xl font-black text-white mb-3">{title}</h3>
        <p className="text-indigo-200 text-sm leading-relaxed font-medium">{desc}</p>
    </div>
);

const PricingCard = ({ name, price, features, isPopular, buttonText }: { name: string, price: string, credits: string, features: string[], isPopular?: boolean, buttonText: string }) => (
    <div className={`relative p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border transition-all duration-300 ${isPopular ? 'border-indigo-600 shadow-2xl scale-105 z-10' : 'border-slate-200 dark:border-slate-800 hover:shadow-xl'}`}>
        {isPopular && (
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                Recommandé
            </span>
        )}
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{name}</h3>
        <div className="mb-6">
            <span className="text-4xl font-black text-slate-900 dark:text-white">{price}</span>
            {price !== "Contactez-nous" && <span className="text-xl font-black text-slate-900 dark:text-white">€</span>}
        </div>

        <div className="mb-8 space-y-4">
            {features.map((feat, i) => (
                <div key={i} className="flex gap-3 items-start text-sm font-bold text-slate-500 dark:text-slate-400">
                    <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    {feat}
                </div>
            ))}
        </div>

        <button className={`w-full py-4 rounded-xl font-black text-sm transition-all ${isPopular ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
            {buttonText}
        </button>
    </div>
);

const VideoModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                >
                    <X size={20} />
                </button>
                <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                    title="PrepTEF Demo"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </motion.div>
        </div>
    );
};

export default LandingPage;
