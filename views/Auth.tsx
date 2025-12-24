
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import Header from '../components/Header';

interface AuthProps {
    onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Confirme seu e-mail para continuar!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onAuthSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark text-white font-body">
            <Header title="Comunidade MuseTera" mobileOnly={false} />

            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center">
                        <div className="inline-block relative size-32 rounded-full overflow-hidden shadow-2xl ring-4 ring-primary/40 mb-6 bg-[#0a1220]">
                            <img src="logo.png" className="size-full object-cover scale-[1.65]" alt="Logo" />
                        </div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                            {isSignUp ? 'Criar Conta' : 'Boas-vindas'}
                        </h2>
                        <p className="mt-2 text-sm text-white/50 font-medium">
                            {isSignUp
                                ? 'Junte-se à nossa rede de musicoterapia'
                                : 'Acesse seu painel clínico premium'}
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleAuth}>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">E-mail</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/20 group-focus-within:text-primary transition-colors">mail</span>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/5 bg-black/40 text-sm text-white focus:ring-1 focus:ring-primary/40 placeholder:text-white/20 outline-none transition-all"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Senha</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/20 group-focus-within:text-primary transition-colors">lock</span>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/5 bg-black/40 text-sm text-white focus:ring-1 focus:ring-primary/40 placeholder:text-white/20 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center animate-shake">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? 'Processando...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
                            </button>
                        </div>
                    </form>

                    <div className="text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-xs font-bold text-white/40 hover:text-primary transition-colors uppercase tracking-widest"
                        >
                            {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Crie uma agora'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
