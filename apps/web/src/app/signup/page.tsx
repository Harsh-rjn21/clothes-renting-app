"use client";

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (localStorage.getItem('token')) {
            router.push('/');
        }
    }, [router]);

    const handleGoogleLogin = async (response: any) => {
        try {
            const res = await fetch('/api/auth/google-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token: response.credential }),
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.access_token);
                router.push('/');
            } else {
                alert("Google Signup Failed");
            }
        } catch (error) {
            console.error("Google signup error", error);
        }
    };

    useEffect(() => {
        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
                callback: handleGoogleLogin
            });
            window.google.accounts.id.renderButton(
                document.getElementById("googleBtnSignup"),
                { theme: "outline", size: "large" }
            );
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, full_name: fullName }),
            });

            if (res.ok) {
                alert("Account created! A verification code has been sent to your email.");
                router.push('/login');
            } else {
                alert("Signup Failed");
            }
        } catch (error) {
            console.error("Signup error", error);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            <Navbar />
            <div className="flex flex-col justify-center py-20 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Join the Club</h2>
                    <p className="text-slate-500 font-bold text-sm">Access the world's finest garments</p>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-10 px-8 shadow-2xl shadow-slate-200/50 rounded-[40px] border border-slate-100">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-slate-900" placeholder="Ex: John Doe" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-slate-900" placeholder="your@email.com" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Create Password</label>
                                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-slate-900" placeholder="At least 8 chars" />
                            </div>

                            <div className="pt-2">
                                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 duration-300">
                                    Create Account
                                </button>
                            </div>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                <div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-slate-400 bg-white px-4">Or join with</div>
                            </div>

                            <div id="googleBtnSignup" className="w-full"></div>
                        </form>
                        
                        <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                            <p className="text-sm font-bold text-slate-400">
                                Already a member?{' '}
                                <Link href="/login" className="text-indigo-600 hover:underline">Log in</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
