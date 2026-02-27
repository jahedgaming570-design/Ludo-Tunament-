import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  User as UserIcon, 
  Wallet, 
  Gamepad2, 
  Calendar, 
  Map as MapIcon, 
  Users, 
  ChevronRight,
  LogOut,
  Plus,
  Coins,
  Newspaper,
  BarChart3,
  Shield,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';
import { User, Tournament, NewsItem, LeaderboardEntry } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [view, setView] = useState<'home' | 'tournaments' | 'news' | 'leaderboard' | 'profile' | 'login' | 'register' | 'tournament-detail'>('home');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', password: '', username: '', ff_id: '' });
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchData();
    const savedUser = localStorage.getItem('ff_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const fetchData = async () => {
    try {
      const [tRes, nRes, lRes] = await Promise.all([
        fetch('/api/tournaments'),
        fetch('/api/news'),
        fetch('/api/leaderboard')
      ]);
      setTournaments(await tRes.json());
      setNews(await nRes.json());
      setLeaderboard(await lRes.json());
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email, password: authForm.password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('ff_user', JSON.stringify(data));
        setView('home');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('ff_user', JSON.stringify(data));
        setView('home');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async (tId: number) => {
    if (!user) {
      setView('login');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/join-tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, tournamentId: tId })
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ ...user, balance: data.newBalance });
        localStorage.setItem('ff_user', JSON.stringify({ ...user, balance: data.newBalance }));
        fetchData();
        alert("Successfully joined!");
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Failed to join");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ff_user');
    setView('home');
  };

  const NavItem = ({ icon: Icon, label, id }: { icon: any, label: string, id: typeof view }) => (
    <button 
      onClick={() => { setView(id); setIsSidebarOpen(false); }}
      className={`nav-link w-full ${view === id ? 'active' : ''}`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  const renderTournamentCard = (t: Tournament) => (
    <motion.div 
      key={t.id}
      layoutId={`t-${t.id}`}
      onClick={() => { setSelectedTournament(t); setView('tournament-detail'); }}
      className="gamer-card cursor-pointer group"
    >
      <div className="relative h-40 overflow-hidden">
        <img src={t.image_url || `https://picsum.photos/seed/${t.id}/400/200`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={t.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent opacity-60" />
        <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold font-display uppercase">
          {t.mode}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-bold mb-1 truncate">{t.title}</h3>
        <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
          <Calendar size={12} />
          <span>{new Date(t.start_time).toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 p-2 rounded-lg">
            <p className="text-[8px] uppercase text-white/30">Prize Pool</p>
            <p className="font-display font-bold text-secondary text-sm">৳{t.prize_pool}</p>
          </div>
          <div className="bg-white/5 p-2 rounded-lg">
            <p className="text-[8px] uppercase text-white/30">Entry Fee</p>
            <p className="font-display font-bold text-primary text-sm">৳{t.entry_fee}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">{t.current_players}/{t.max_players} Joined</span>
          <div className="w-20 h-1 bg-white/10 rounded-full">
            <div className="h-full bg-primary rounded-full" style={{ width: `${(t.current_players / t.max_players) * 100}%` }} />
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="app-layout">
      {/* Sidebar (PC) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-white/5 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40">
              <Gamepad2 className="text-white" size={28} />
            </div>
            <div>
              <h1 className="font-display font-black text-xl tracking-tighter italic leading-none">FF PRO</h1>
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">International</span>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            <NavItem icon={Gamepad2} label="Home" id="home" />
            <NavItem icon={Trophy} label="Tournaments" id="tournaments" />
            <NavItem icon={Newspaper} label="Official News" id="news" />
            <NavItem icon={BarChart3} label="Leaderboard" id="leaderboard" />
            <NavItem icon={Shield} label="Teams" id="home" />
          </nav>

          {user && (
            <div className="mt-auto pt-6 border-t border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <UserIcon size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold truncate">{user.username}</p>
                  <p className="text-[10px] text-secondary font-display">৳{user.balance.toFixed(2)}</p>
                </div>
              </div>
              <button onClick={logout} className="flex items-center gap-2 text-red-500 text-xs font-bold hover:opacity-80 transition-opacity">
                <LogOut size={14} /> LOGOUT
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content flex flex-col bg-dark">
        {/* Top Header (Mobile & PC Search) */}
        <header className="sticky top-0 z-40 bg-dark/80 backdrop-blur-xl border-b border-white/5 px-4 py-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-white/60">
                <Menu size={24} />
              </button>
              <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-80">
                <Search size={18} className="text-white/40" />
                <input type="text" placeholder="Search tournaments..." className="bg-transparent border-none outline-none text-sm ml-3 w-full" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
              </button>
              {!user && (
                <button onClick={() => setView('login')} className="btn-primary py-2 px-5 text-xs">LOGIN</button>
              )}
              {user && (
                <button onClick={() => setView('profile')} className="lg:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <UserIcon size={20} />
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-6xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                {/* Hero Slider Placeholder */}
                <section className="relative h-64 lg:h-96 rounded-[2rem] overflow-hidden group">
                  <img src="https://picsum.photos/seed/esports/1200/600" className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000" alt="Hero" />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
                  <div className="absolute bottom-10 left-10 max-w-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Live Now</span>
                      <span className="text-white/60 text-xs font-bold">FFWS 2026 Finals</span>
                    </div>
                    <h2 className="font-display text-4xl lg:text-6xl font-black italic uppercase leading-none mb-6">The Ultimate Arena</h2>
                    <button onClick={() => setView('tournaments')} className="btn-primary">EXPLORE TOURNAMENTS</button>
                  </div>
                </section>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Active Players', value: '12.5K+', color: 'text-primary' },
                    { label: 'Total Prize Paid', value: '৳2.4M', color: 'text-secondary' },
                    { label: 'Matches Today', value: '48', color: 'text-white' },
                    { label: 'Verified Teams', value: '150+', color: 'text-white' }
                  ].map((stat, i) => (
                    <div key={i} className="gamer-card p-6 text-center">
                      <p className="text-[10px] uppercase text-white/40 font-bold tracking-widest mb-1">{stat.label}</p>
                      <p className={`text-2xl font-display font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Featured Tournaments */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl font-bold italic uppercase">Featured Events</h2>
                    <button onClick={() => setView('tournaments')} className="text-primary text-sm font-bold flex items-center gap-1">VIEW ALL <ChevronRight size={16} /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.slice(0, 3).map(renderTournamentCard)}
                  </div>
                </section>

                {/* Latest News */}
                <section>
                  <h2 className="font-display text-2xl font-bold italic uppercase mb-6">Latest News</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {news.slice(0, 2).map(n => (
                      <div key={n.id} className="gamer-card flex flex-col md:flex-row h-full">
                        <img src={n.image_url} className="w-full md:w-48 h-48 object-cover" alt={n.title} />
                        <div className="p-6 flex flex-col justify-center">
                          <span className="text-[10px] text-primary font-bold uppercase mb-2">{new Date(n.created_at).toLocaleDateString()}</span>
                          <h3 className="font-display text-xl font-bold mb-3">{n.title}</h3>
                          <p className="text-white/60 text-sm line-clamp-2">{n.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {view === 'tournaments' && (
              <motion.div key="tournaments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="font-display text-3xl font-black italic uppercase">All Tournaments</h2>
                  <div className="flex gap-2">
                    {['All', 'Solo', 'Duo', 'Squad'].map(f => (
                      <button key={f} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/20 hover:border-primary/40 transition-all">{f}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tournaments.map(renderTournamentCard)}
                </div>
              </motion.div>
            )}

            {view === 'news' && (
              <motion.div key="news" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <h2 className="font-display text-3xl font-black italic uppercase">Official News</h2>
                <div className="grid grid-cols-1 gap-6">
                  {news.map(n => (
                    <div key={n.id} className="gamer-card flex flex-col md:flex-row">
                      <img src={n.image_url} className="w-full md:w-80 h-60 object-cover" alt={n.title} />
                      <div className="p-8 flex flex-col justify-center">
                        <span className="text-xs text-primary font-bold uppercase mb-3">{new Date(n.created_at).toLocaleString()}</span>
                        <h3 className="font-display text-2xl font-bold mb-4">{n.title}</h3>
                        <p className="text-white/70 leading-relaxed">{n.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'leaderboard' && (
              <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <h2 className="font-display text-3xl font-black italic uppercase">Global Leaderboard</h2>
                <div className="gamer-card overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 text-[10px] uppercase font-bold tracking-widest text-white/40">
                        <th className="px-6 py-4">Rank</th>
                        <th className="px-6 py-4">Player</th>
                        <th className="px-6 py-4">Total Kills</th>
                        <th className="px-6 py-4">Total Earnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {leaderboard.length > 0 ? leaderboard.map((l, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-display font-bold text-primary">#{i + 1}</td>
                          <td className="px-6 py-4 font-bold">{l.username}</td>
                          <td className="px-6 py-4 font-mono">{l.total_kills}</td>
                          <td className="px-6 py-4 font-display text-secondary">৳{l.total_earnings}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-20 text-center text-white/20">No data available yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {view === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto pt-10">
                <div className="gamer-card p-10">
                  <h2 className="font-display text-3xl font-black italic uppercase mb-8 text-center">Login</h2>
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Email Address</label>
                      <input type="email" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:border-primary outline-none transition-all" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Password</label>
                      <input type="password" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:border-primary outline-none transition-all" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
                    </div>
                    {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                    <button type="submit" disabled={loading} className="btn-primary w-full py-4">{loading ? 'AUTHENTICATING...' : 'SIGN IN'}</button>
                  </form>
                  <p className="mt-8 text-center text-white/40 text-sm">New to FF PRO? <button onClick={() => setView('register')} className="text-primary font-bold">Create Account</button></p>
                </div>
              </motion.div>
            )}

            {view === 'register' && (
              <motion.div key="register" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto pt-10">
                <div className="gamer-card p-10">
                  <h2 className="font-display text-3xl font-black italic uppercase mb-8 text-center">Register</h2>
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Username</label>
                      <input type="text" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition-all" value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Email</label>
                      <input type="email" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition-all" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Free Fire ID</label>
                      <input type="text" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition-all" value={authForm.ff_id} onChange={e => setAuthForm({...authForm, ff_id: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Password</label>
                      <input type="password" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition-all" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
                    </div>
                    {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                    <button type="submit" disabled={loading} className="btn-primary w-full py-4">{loading ? 'CREATING...' : 'JOIN NOW'}</button>
                  </form>
                  <p className="mt-8 text-center text-white/40 text-sm">Already a member? <button onClick={() => setView('login')} className="text-primary font-bold">Login</button></p>
                </div>
              </motion.div>
            )}

            {view === 'tournament-detail' && selectedTournament && (
              <motion.div key="detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <button onClick={() => setView('tournaments')} className="text-white/40 flex items-center gap-2 font-bold text-xs uppercase tracking-widest"><ChevronRight className="rotate-180" size={14} /> Back to Events</button>
                
                <div className="gamer-card">
                  <div className="h-64 lg:h-80 relative">
                    <img src={selectedTournament.image_url} className="w-full h-full object-cover" alt={selectedTournament.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent" />
                    <div className="absolute bottom-10 left-10 right-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">{selectedTournament.mode}</span>
                          <span className="text-white/60 text-xs font-bold">{selectedTournament.map}</span>
                        </div>
                        <h2 className="font-display text-4xl lg:text-5xl font-black italic uppercase leading-none">{selectedTournament.title}</h2>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Prize Pool</p>
                          <p className="text-3xl font-display font-black text-secondary">৳{selectedTournament.prize_pool}</p>
                        </div>
                        <button onClick={() => joinTournament(selectedTournament.id)} disabled={loading || selectedTournament.current_players >= selectedTournament.max_players} className="btn-primary px-10 py-4">
                          {loading ? 'WAIT...' : 'JOIN NOW'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                      <section>
                        <h3 className="font-display text-xl font-bold italic uppercase mb-4 pb-2 border-b border-white/5">Description</h3>
                        <p className="text-white/70 leading-relaxed">{selectedTournament.description}</p>
                      </section>
                      <section>
                        <h3 className="font-display text-xl font-bold italic uppercase mb-4 pb-2 border-b border-white/5">Official Rules</h3>
                        <div className="bg-white/5 p-6 rounded-2xl">
                          <pre className="text-white/70 text-sm font-sans whitespace-pre-wrap leading-relaxed">{selectedTournament.rules}</pre>
                        </div>
                      </section>
                    </div>
                    <div className="space-y-6">
                      <div className="gamer-card p-6 bg-primary/5 border-primary/20">
                        <h4 className="font-display text-sm font-bold mb-4 uppercase tracking-widest text-primary">Match Info</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/40">Start Time</span>
                            <span className="text-xs font-bold">{new Date(selectedTournament.start_time).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/40">Entry Fee</span>
                            <span className="text-xs font-bold text-primary">৳{selectedTournament.entry_fee}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/40">Slots</span>
                            <span className="text-xs font-bold">{selectedTournament.current_players}/{selectedTournament.max_players}</span>
                          </div>
                        </div>
                      </div>
                      <div className="gamer-card p-6">
                        <h4 className="font-display text-sm font-bold mb-4 uppercase tracking-widest">Support</h4>
                        <p className="text-xs text-white/40 mb-4">Need help with this tournament? Contact our 24/7 official support team.</p>
                        <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Contact Support</button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'profile' && user && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-3xl font-black italic uppercase">My Dashboard</h2>
                  <button onClick={logout} className="text-red-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2"><LogOut size={14} /> Sign Out</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="space-y-6">
                    <div className="gamer-card p-8 text-center">
                      <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary mx-auto mb-6 flex items-center justify-center">
                        <UserIcon size={48} className="text-primary" />
                      </div>
                      <h3 className="font-display text-2xl font-bold mb-1">{user.username}</h3>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-6">FF ID: {user.ff_id}</p>
                      <div className="bg-white/5 p-4 rounded-2xl">
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Total Balance</p>
                        <p className="text-3xl font-display font-black text-secondary">৳{user.balance.toFixed(2)}</p>
                      </div>
                      <button className="btn-secondary w-full mt-6">DEPOSIT FUNDS</button>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-8">
                    <div className="gamer-card p-8 min-h-[400px]">
                      <h3 className="font-display text-xl font-bold italic uppercase mb-8 flex items-center gap-3">
                        <Trophy className="text-primary" /> My Tournaments
                      </h3>
                      <div className="flex flex-col items-center justify-center h-64 text-white/10">
                        <Trophy size={80} className="mb-6 opacity-5" />
                        <p className="text-sm font-bold uppercase tracking-widest">No active matches</p>
                        <button onClick={() => setView('tournaments')} className="text-primary font-bold mt-4 hover:underline">Find a Tournament</button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Nav (Mobile Only) */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface/80 backdrop-blur-xl border-t border-white/5 px-4 py-3 flex justify-around">
          <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-primary' : 'text-white/40'}`}>
            <Gamepad2 size={22} />
            <span className="text-[8px] font-bold uppercase">Home</span>
          </button>
          <button onClick={() => setView('tournaments')} className={`flex flex-col items-center gap-1 ${view === 'tournaments' ? 'text-primary' : 'text-white/40'}`}>
            <Trophy size={22} />
            <span className="text-[8px] font-bold uppercase">Events</span>
          </button>
          <button onClick={() => setView('news')} className={`flex flex-col items-center gap-1 ${view === 'news' ? 'text-primary' : 'text-white/40'}`}>
            <Newspaper size={22} />
            <span className="text-[8px] font-bold uppercase">News</span>
          </button>
          <button onClick={() => setView('leaderboard')} className={`flex flex-col items-center gap-1 ${view === 'leaderboard' ? 'text-primary' : 'text-white/40'}`}>
            <BarChart3 size={22} />
            <span className="text-[8px] font-bold uppercase">Stats</span>
          </button>
          <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-primary' : 'text-white/40'}`}>
            <UserIcon size={22} />
            <span className="text-[8px] font-bold uppercase">Me</span>
          </button>
        </nav>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
