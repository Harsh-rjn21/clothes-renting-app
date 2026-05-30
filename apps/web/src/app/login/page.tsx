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
                
                // Get redirect url from query param
                const searchParams = new URLSearchParams(window.location.search);
                const redirect = searchParams.get('redirect') || '/';
                router.push(redirect);
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
                const searchParams = new URLSearchParams(window.location.search);
                const redirect = searchParams.get('redirect') || '/';
                router.push(redirect);
            } else {
                alert("Google Login Failed");
            }
        } catch (error) {
            console.error("Google login error", error);
        }
    };

    const handleFacebookLogin = async () => {
        if (!(window as any).FB) {
            alert("Meta login service is still loading, please try again in a few seconds.");
            return;
        }

        (window as any).FB.login((response: any) => {
            if (response.authResponse) {
                const accessToken = response.authResponse.accessToken;
                const performLogin = async () => {
                    try {
                        const res = await fetch('/api/auth/facebook-login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ access_token: accessToken }),
                        });

                        if (res.ok) {
                            const data = await res.json();
                            localStorage.setItem('token', data.access_token);
                            const searchParams = new URLSearchParams(window.location.search);
                            const redirect = searchParams.get('redirect') || '/';
                            router.push(redirect);
                        } else {
                            const err = await res.json();
                            alert(err.detail || "Meta Login Failed");
                        }
                    } catch (error) {
                        console.error("Meta login error", error);
                        alert("Connection error during Meta login");
                    }
                };
                performLogin();
            }
        }, { scope: 'public_profile,email' });
    };

    useEffect(() => {
        // Initialize Google Login
        const initGoogle = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
                    callback: handleGoogleLogin
                });
                window.google.accounts.id.renderButton(
                    document.getElementById("googleBtn"),
                    { theme: "outline", size: "large" }
                );
                return true;
            }
            return false;
        };

        if (!initGoogle()) {
            const interval = setInterval(() => {
                if (initGoogle()) {
                    clearInterval(interval);
                }
            }, 500);
        }

        // Initialize Meta / Facebook SDK
        if (!document.getElementById('facebook-jssdk')) {
            (window as any).fbAsyncInit = function() {
                (window as any).FB.init({
                    appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                });
            };
            (function(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                js = d.createElement(s) as HTMLScriptElement;
                js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                if (fjs && fjs.parentNode) {
                    fjs.parentNode.insertBefore(js, fjs);
                } else {
                    d.head.appendChild(js);
                }
            }(document, 'script', 'facebook-jssdk'));
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email or Phone Number</label>
                                <input type="text" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-slate-900" placeholder="your@email.com or +123456789" />
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div id="googleBtn" className="w-full flex justify-center"></div>
                                <button 
                                    type="button"
                                    onClick={handleFacebookLogin}
                                    className="w-full py-2 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:opacity-90 text-white font-bold rounded-lg text-sm transition-all flex items-center justify-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                                    </svg>
                                    <span>Instagram</span>
                                </button>
                            </div>
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
