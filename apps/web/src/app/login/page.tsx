"use client";

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (localStorage.getItem('token')) {
            router.push('/');
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('username', email); 
            formData.append('password', password);

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.access_token);
                router.push('/');
            } else {
                alert("Invalid credentials. Please try again.");
            }
        } catch (error) {
            console.error("Login error", error);
        }
    };

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
                alert("Google Login Failed");
            }
        } catch (error) {
            console.error("Google login error", error);
        }
    };

    useEffect(() => {
        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
                callback: handleGoogleLogin
            });
            window.google.accounts.id.renderButton(
                document.getElementById("googleBtn"),
                { theme: "outline", size: "large" }
            );
        }
    }, [router]);

    return (
        <div className="bg-slate-50 min-h-screen">
            <Navbar />
            <div className="flex flex-col justify-center py-20 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Welcome Back</h2>
                    <p className="text-slate-500 font-bold text-sm">Continue your journey with StyleRent</p>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-10 px-8 shadow-2xl shadow-slate-200/50 rounded-[40px] border border-slate-100">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-slate-900" placeholder="your@email.com" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secret Password</label>
                                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-slate-900" placeholder="••••••••" />
                            </div>

                            <div className="pt-2">
                                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 duration-300">
                                    Sign In
                                </button>
                            </div>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                <div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-slate-400 bg-white px-4">Or continue with</div>
                            </div>

                            <div id="googleBtn" className="w-full"></div>
                        </form>
                        
                        <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                            <p className="text-sm font-bold text-slate-400">
                                Don't have an account?{' '}
                                <Link href="/signup" className="text-indigo-600 hover:underline">Register now</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
