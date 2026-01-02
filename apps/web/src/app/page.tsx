"use client";

import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-white">
      <Navbar />
      
      <main>
        {/* Modern Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center lg:text-left lg:grid lg:grid-cols-2 lg:gap-12 items-center">
              <div>
                <div className="inline-flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-full mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  <span className="text-indigo-600 text-xs font-black uppercase tracking-widest">New Arrivals Daily</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter">
                  Wear the <span className="text-indigo-600">Extraordinary</span> without the Price Tag.
                </h1>
                <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
                  Rent premium designer wear for any occasion. From grand weddings to stylish weekend parties, look your absolute best for a fraction of the cost.
                </p>
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link href="/catalog" className="px-8 py-4 bg-indigo-600 text-white rounded-full font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-300">
                    Explore Catalog
                  </Link>
                  <Link href="/signup" className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-100 rounded-full font-black text-lg hover:bg-slate-50 hover:border-slate-200 transition-all duration-300">
                    Start Renting Now
                  </Link>
                </div>
                
                <div className="mt-12 flex items-center justify-center lg:justify-start space-x-8 opacity-60 grayscale">
                    {/* Add some dummy brand logos later if needed */}
                </div>
              </div>
              
              <div className="mt-16 lg:mt-0 relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100 border-[12px] border-white">
                    <img 
                        src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200" 
                        alt="Fashionable woman in designer clothing"
                        className="w-full h-[500px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 p-6 glass rounded-2xl">
                        <div className="flex justify-between items-center text-white">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Trending Item</p>
                                <p className="text-xl font-bold italic">Linen Summer Suit</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs opacity-80">Starting at</p>
                                <p className="text-xl font-black">Rs. 499</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-100 rounded-full -z-10 blur-2xl opacity-60"></div>
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-100 rounded-full -z-10 blur-3xl opacity-60"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section className="bg-slate-50 py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Why StyleRent?</h2>
                    <p className="text-slate-500 font-medium">Experience luxury without the commitment.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: 'Wide Selection', desc: 'Over 10,000+ curated items from top designers.', icon: '👗' },
                        { title: 'Eco-Friendly', desc: 'Smarter consumption. Renting reduces fashion waste.', icon: '🌱' },
                        { title: 'Pristine Quality', desc: 'Every item is professionally cleaned and verified.', icon: '✨' }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 group">
                            <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
      </main>
      
      <footer className="bg-white border-t border-slate-100 py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">© 2026 StyleRent. All rights reserved.</p>
          </div>
      </footer>
    </div>
  );
}
