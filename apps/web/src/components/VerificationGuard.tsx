"use client";

import { useEffect, useState } from 'react';

export default function VerificationGuard({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [showOverlay, setShowOverlay] = useState(false);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser(payload);
                if (!payload.is_verified_email) {
                    setShowOverlay(true);
                }
            } catch (e) {
                console.error("Token error", e);
            }
        }
    }, []);

    const resendCode = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.sub })
            });
            if (res.ok) {
                alert("New code sent to your email!");
            } else {
                alert("Failed to resend code");
            }
        } catch (error) {
            alert("Connection error");
        } finally {
            setLoading(false);
        }
    };

    const confirmCode = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.sub, code })
            });
            if (res.ok) {
                alert("Verification Successful! Please log in again to refresh your session.");
                localStorage.removeItem('token');
                window.location.href = '/login';
            } else {
                alert("Invalid or expired code");
            }
        } catch (error) {
            alert("Verification failed");
        } finally {
            setLoading(false);
        }
    };

    if (!showOverlay) return <>{children}</>;

    return (
        <>
            {children}
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl p-4">
                <div className="bg-white max-w-md w-full rounded-[40px] p-10 shadow-2xl border border-slate-100 text-center space-y-8 animate-in fade-in zoom-in duration-500 relative overflow-hidden">
                    <button 
                        onClick={() => {
                            localStorage.removeItem('token');
                            window.location.href = '/login';
                        }}
                        className="absolute top-6 left-6 text-slate-400 hover:text-slate-900 transition-colors"
                        title="Back to Login"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>

                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-4xl">📧</span>
                    </div>
                    
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Check Your Email</h2>
                        <p className="text-slate-500 font-bold text-sm">We've sent a 6-digit verification code to your inbox. Please enter it below to unlock your account.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">One-Time Code</label>
                            <input 
                                maxLength={6}
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder="••••••" 
                                className="w-full text-center p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-black text-3xl tracking-[0.2em] text-indigo-600 uppercase" 
                            />
                        </div>
                        <button 
                            onClick={confirmCode}
                            disabled={loading || code.length < 6}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                            Confirm & Unlock
                        </button>
                        <button 
                            onClick={resendCode}
                            disabled={loading}
                            className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 block mx-auto py-2"
                        >
                            Resend Verification Email
                        </button>
                    </div>

                    <p className="text-[10px] font-bold text-slate-400 leading-tight">
                        Mock Mode Active: Verification codes are printed to the backend terminal for development.
                    </p>
                </div>
            </div>
        </>
    );
}
