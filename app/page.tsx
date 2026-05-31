'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowRight, Gift, Zap, Brain, Users, GitBranch, MessageSquare, Lock, Check, Sun, Moon } from 'lucide-react'

const features = [
  { icon: Brain,        title: 'Deep Code Understanding', desc: 'RepoMind reads every file, every function, every dependency. Ask complex architectural questions and get precise answers.', accent: '#10b981', lightBg: '#ecfdf5', darkBg: '#052e16' },
  { icon: Zap,          title: 'Groq-Powered Speed',       desc: 'Responses in milliseconds, not seconds. Groq inference means you never wait for an answer.',                           accent: '#f59e0b', lightBg: '#fffbeb', darkBg: '#1c1400' },
  { icon: GitBranch,    title: 'Any GitHub Repo',           desc: 'Public or private. Connect once and explore all your repositories instantly.',                                         accent: '#6366f1', lightBg: '#eef2ff', darkBg: '#1e1b4b' },
  { icon: MessageSquare,title: 'Natural Conversations',     desc: 'Ask follow-ups, drill into specifics, or get a high-level overview. It feels like pair programming.',                  accent: '#ec4899', lightBg: '#fdf2f8', darkBg: '#2d0a1e' },
  { icon: Users,        title: 'Onboard Faster',            desc: 'New to a codebase? Get up to speed in minutes instead of days.',                                                       accent: '#14b8a6', lightBg: '#f0fdfa', darkBg: '#042f2e' },
  { icon: Lock,         title: 'Secure by Default',         desc: 'Your tokens never leave your session. We only read what you explicitly select.',                                       accent: '#8b5cf6', lightBg: '#f5f3ff', darkBg: '#1e1040' },
]

const steps = [
  { num: '01', title: 'Connect GitHub', desc: 'One-click OAuth. We request only read access.' },
  { num: '02', title: 'Pick a Repo',    desc: 'Browse your repos and select any project.' },
  { num: '03', title: 'AI Reads Code',  desc: 'RepoMind indexes files, structure, and logic.' },
  { num: '04', title: 'Ask Anything',   desc: 'Natural language. No prompting skills needed.' },
]

export default function LandingPage() {
  const [dark, setDark] = useState(false)

  // Persist preference
  useEffect(() => {
    const saved = localStorage.getItem('repomind-theme')
    if (saved === 'dark') setDark(true)
  }, [])

  const toggleDark = () => {
    setDark(d => {
      localStorage.setItem('repomind-theme', !d ? 'dark' : 'light')
      return !d
    })
  }

  const d = dark  // shorthand for inline conditionals

  return (
    <div
      data-theme={d ? 'dark' : 'light'}
      style={{ fontFamily: "'DM Sans', sans-serif", colorScheme: d ? 'dark' : 'light' }}
      className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${d ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        .mono { font-family: 'DM Mono', monospace; }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade-up  { animation: fadeUp 0.65s cubic-bezier(0.16,1,0.3,1) both; }
        .delay-1  { animation-delay: 0.08s; }
        .delay-2  { animation-delay: 0.18s; }
        .delay-3  { animation-delay: 0.28s; }
        .delay-4  { animation-delay: 0.40s; }
        .delay-5  { animation-delay: 0.55s; }

        @keyframes pulse-dot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.4; transform:scale(0.65); }
        }
        .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }

        /* Toggle pill */
        .theme-toggle {
          width: 52px; height: 28px;
          border-radius: 999px;
          display: flex; align-items: center;
          padding: 3px;
          cursor: pointer;
          transition: background 0.3s;
          border: none; outline: none;
        }
        .theme-toggle-thumb {
          width: 22px; height: 22px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), background 0.3s;
        }

        .feature-card { transition: box-shadow 0.2s, transform 0.2s; }
        .feature-card:hover { transform: translateY(-2px); }

        .step-line-light::after {
          content:''; position:absolute; top:26px;
          left:calc(50% + 30px); width:calc(100% - 60px);
          height:1px; background:linear-gradient(90deg,#d1d5db,transparent);
        }
        .step-line-dark::after {
          content:''; position:absolute; top:26px;
          left:calc(50% + 30px); width:calc(100% - 60px);
          height:1px; background:linear-gradient(90deg,rgba(255,255,255,0.12),transparent);
        }

        .btn-primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 4px 20px -4px rgba(16,185,129,0.45);
          transition: box-shadow 0.2s, transform 0.15s;
        }
        .btn-primary:hover {
          box-shadow: 0 6px 28px -4px rgba(16,185,129,0.55);
          transform: translateY(-1px);
        }

        .dot-grid {
          background-image: radial-gradient(circle, rgba(128,128,128,0.12) 1px, transparent 1px);
          background-size: 28px 28px;
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav
        className="fixed w-full z-50 top-0 transition-colors duration-300"
        style={{
          background: d ? 'rgba(10,10,10,0.85)' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: d ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://ik.imagekit.io/sl226drpx/grok-image-da915e64-fb0b-4722-9896-e90a54cc9528-removebg-preview.png"
              alt="RepoMind logo"
              className="w-9 h-9 object-contain"
              style={{ filter: d ? 'none' : 'brightness(0)' }}
            />
            <span className="text-base font-semibold tracking-tight">RepoMind</span>
          </div>

          <div className={`hidden md:flex items-center gap-8 text-sm ${d ? 'text-zinc-400' : 'text-gray-500'}`}>
            <a href="#features"     className="transition-colors hover:text-emerald-500">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-emerald-500">How it works</a>
            <a href="#pricing"      className="transition-colors hover:text-emerald-500">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              aria-label="Toggle dark mode"
              className="theme-toggle"
              style={{ background: d ? '#1e293b' : '#e2e8f0' }}
            >
              <div
                className="theme-toggle-thumb"
                style={{
                  transform: d ? 'translateX(24px)' : 'translateX(0)',
                  background: d ? '#f1f5f9' : '#334155',
                }}
              >
                {d
                  ? <Sun  size={13} style={{ color: '#0f172a' }} />
                  : <Moon size={13} style={{ color: '#f8fafc' }} />
                }
              </div>
            </button>

            <Link href="/login">
              <Button variant="ghost" className={`text-sm h-9 font-normal ${d ? 'text-zinc-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="btn-primary text-white text-sm h-9 px-5 font-medium border-0 rounded-lg">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative pt-40 pb-28 px-6 overflow-hidden transition-colors duration-300"
        style={{
          background: d
            ? `radial-gradient(ellipse 80% 60% at 10% 0%,  rgba(99,102,241,0.12) 0%, transparent 55%),
               radial-gradient(ellipse 60% 50% at 90% 10%, rgba(16,185,129,0.13) 0%, transparent 50%),
               radial-gradient(ellipse 50% 40% at 50% 80%, rgba(236,72,153,0.08) 0%, transparent 55%),
               #0a0a0a`
            : `radial-gradient(ellipse 80% 60% at 10% 0%,  rgba(99,102,241,0.08) 0%, transparent 55%),
               radial-gradient(ellipse 60% 50% at 90% 10%, rgba(16,185,129,0.09) 0%, transparent 50%),
               radial-gradient(ellipse 50% 40% at 50% 80%, rgba(236,72,153,0.06) 0%, transparent 55%),
               #ffffff`
        }}
      >
        <div className="dot-grid absolute inset-0 opacity-40 pointer-events-none" />

        {/* Blur blobs */}
        <div style={{ position:'absolute', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none', width:380, height:380, background: d ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.12)', top:-60, left:-80 }} />
        <div style={{ position:'absolute', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none', width:300, height:300, background: d ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.1)',  top:60, right:-60 }} />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className={`fade-up delay-1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-8 text-xs mono ${d ? 'border-zinc-700 bg-zinc-900/80 text-zinc-400' : 'border-gray-200 bg-white/80 shadow-sm text-gray-500'}`}>
            <span className="pulse-dot w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
            Powered by Groq LLM&nbsp;·&nbsp;Free to use
          </div>

          <h1 className="fade-up delay-2 text-[clamp(2.8rem,7vw,5.5rem)] font-bold tracking-[-0.04em] leading-[1.05] mb-6">
            <span style={{
              background: d
                ? 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 40%, #10b981 100%)'
                : 'linear-gradient(135deg, #111827 0%, #374151 40%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline',
            }}>Chat with your<br />entire codebase</span>
          </h1>

          <p className={`fade-up delay-3 text-lg max-w-xl mx-auto mb-10 leading-relaxed font-light ${d ? 'text-zinc-400' : 'text-gray-500'}`}>
            Connect your GitHub repositories and ask anything about your code in plain English. Instant, precise answers powered by AI.
          </p>

          <div className="fade-up delay-4 flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link href="/signup">
              <Button size="lg" className="btn-primary text-white font-medium text-base px-8 h-12 rounded-xl border-0 flex items-center gap-2.5">
                <Gift className="w-4 h-4" />
                Connect GitHub — it's free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline"
                className={`h-12 px-8 rounded-xl text-base ${d ? 'bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'}`}>
                See how it works
              </Button>
            </Link>
          </div>

          <p className={`fade-up delay-5 text-xs mono ${d ? 'text-zinc-600' : 'text-gray-400'}`}>
            No credit card · No setup · Works in 30 seconds
          </p>
        </div>

        {/* Chat preview card */}
        <div className="fade-up delay-5 max-w-2xl mx-auto mt-16 relative">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: d ? '#111111' : '#ffffff',
              border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
              boxShadow: d ? '0 20px 60px -20px rgba(0,0,0,0.6)' : '0 20px 60px -20px rgba(0,0,0,0.12)',
            }}
          >
            <div className={`flex items-center gap-2 px-4 py-3 border-b ${d ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-100'}`}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
              <span className={`ml-2 text-xs mono ${d ? 'text-zinc-500' : 'text-gray-400'}`}>RepoMind · my-saas-app</span>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex justify-end">
                <div className={`rounded-2xl rounded-br-sm px-4 py-2.5 max-w-sm text-sm ${d ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white'}`}>
                  Where is the auth middleware and how does it validate JWT tokens?
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-emerald-600 text-xs font-bold mono">R</span>
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-md space-y-2"
                  style={{ background: d ? 'rgba(255,255,255,0.05)' : '#f9fafb', color: d ? '#e4e4e7' : '#374151' }}
                >
                  <p>The auth middleware lives in <code className={`px-1.5 py-0.5 rounded mono text-xs ${d ? 'bg-zinc-700 text-emerald-300' : 'bg-indigo-50 text-indigo-600'}`}>src/middleware/auth.ts</code>.</p>
                  <p>JWT validation is in <code className={`px-1.5 py-0.5 rounded mono text-xs ${d ? 'bg-zinc-700 text-emerald-300' : 'bg-indigo-50 text-indigo-600'}`}>verifyToken()</code> on line 34, using <code className={`px-1.5 py-0.5 rounded mono text-xs ${d ? 'bg-zinc-700 text-emerald-300' : 'bg-indigo-50 text-indigo-600'}`}>JWT_SECRET</code> from env.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof bar ── */}
      <div className={`border-y py-4 transition-colors duration-300 ${d ? 'border-zinc-800 bg-zinc-900/40' : 'border-gray-100 bg-gray-50/80'}`}>
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm">
          {[
            <span key="gh"  className="flex items-center gap-1.5"><Gift className="w-4 h-4" /> GitHub OAuth</span>,
            <span key="dev">2,400+ developers</span>,
            <span key="gr"  className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block pulse-dot" /> Groq inference</span>,
            <span key="lang">Works with any language</span>,
          ].map((el, i, arr) => (
            <>
              <span key={i} className={d ? 'text-zinc-500' : 'text-gray-400'}>{el}</span>
              {i < arr.length - 1 && <Separator key={`sep-${i}`} orientation="vertical" className={`h-4 hidden sm:block ${d ? 'bg-zinc-700' : 'bg-gray-200'}`} />}
            </>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-28">
        <div className="mb-14">
          <Badge variant="outline" className={`text-xs mono mb-4 ${d ? 'border-zinc-700 text-zinc-400 bg-zinc-900' : 'border-gray-200 text-gray-400 bg-white'}`}>Features</Badge>
          <h2 className="text-4xl font-bold tracking-tight max-w-lg">Built for developers who want real answers</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="feature-card rounded-2xl p-6"
              style={{
                background: d ? 'rgba(255,255,255,0.03)' : '#ffffff',
                border: d ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
                boxShadow: d ? 'none' : '0 1px 6px rgba(0,0,0,0.04)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ background: d ? f.darkBg : f.lightBg, border: `1px solid ${f.accent}30` }}
              >
                <f.icon className="w-5 h-5" style={{ color: f.accent }} />
              </div>
              <h3 className="font-semibold text-base mb-2">{f.title}</h3>
              <p className={`text-sm leading-relaxed ${d ? 'text-zinc-400' : 'text-gray-500'}`}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how-it-works"
        className={`border-y py-28 transition-colors duration-300 ${d ? 'border-zinc-800/50 bg-zinc-900/30' : 'border-gray-100 bg-gray-50/70'}`}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className={`text-xs mono mb-4 ${d ? 'border-zinc-700 text-zinc-400 bg-zinc-900' : 'border-gray-200 text-gray-400 bg-white'}`}>How it works</Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-3">Up and running in 30 seconds</h2>
            <p className={d ? 'text-zinc-400' : 'text-gray-500'}>No config files. No API keys. Just connect and ask.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            {steps.map((s, i) => (
              <div key={s.num} className={`relative text-center ${i < steps.length - 1 ? (d ? 'step-line-dark' : 'step-line-light') : ''}`}>
                <div
                  className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mono text-lg font-bold mb-5"
                  style={{
                    background: d ? '#1a1a1a' : '#ffffff',
                    border: d ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
                    boxShadow: d ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  {s.num}
                </div>
                <h3 className="font-semibold text-base mb-2">{s.title}</h3>
                <p className={`text-sm leading-relaxed ${d ? 'text-zinc-500' : 'text-gray-400'}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-4xl mx-auto px-6 py-28">
        <div className="text-center mb-12">
          <Badge variant="outline" className={`text-xs mono mb-4 ${d ? 'border-zinc-700 text-zinc-400 bg-zinc-900' : 'border-gray-200 text-gray-400 bg-white'}`}>Pricing</Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-3">Simple, honest pricing</h2>
          <p className={d ? 'text-zinc-400' : 'text-gray-500'}>Start free. Upgrade when you're ready.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Free */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: d ? 'rgba(255,255,255,0.03)' : '#ffffff',
              border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e5e7eb',
            }}
          >
            <p className={`text-sm mb-1 mono ${d ? 'text-zinc-400' : 'text-gray-400'}`}>Free forever</p>
            <div className="flex items-end gap-1.5 mb-6">
              <span className="text-5xl font-bold tracking-tight">$0</span>
              <span className={`mb-2 text-sm ${d ? 'text-zinc-400' : 'text-gray-400'}`}>/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {['5 repositories','100 questions/month','Public & private repos','Groq-powered AI'].map(f => (
                <li key={f} className={`flex items-center gap-2.5 text-sm ${d ? 'text-zinc-300' : 'text-gray-600'}`}>
                  <Check className={`w-4 h-4 shrink-0 ${d ? 'text-zinc-500' : 'text-gray-400'}`} />{f}
                </li>
              ))}
            </ul>
            <Link href="/signup">
              <Button variant="outline" className={`w-full rounded-xl h-11 font-medium ${d ? 'border-zinc-700 text-white hover:bg-zinc-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                Get started free
              </Button>
            </Link>
          </div>

          {/* Pro */}
          <div
            className="rounded-2xl p-8 relative overflow-hidden"
            style={{
              background: d ? 'rgba(16,185,129,0.07)' : 'linear-gradient(145deg,#f0fdf4,#ecfdf5)',
              border: d ? '1.5px solid rgba(16,185,129,0.3)' : '1.5px solid #6ee7b7',
              boxShadow: d ? '0 8px 40px -12px rgba(16,185,129,0.2)' : '0 8px 40px -12px rgba(16,185,129,0.2)',
            }}
          >
            <div style={{ position:'absolute', top:0, right:0, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', transform:'translate(35%,-35%)', pointerEvents:'none' }} />
            <div className="flex items-center gap-2 mb-1">
              <p className={`text-sm mono ${d ? 'text-zinc-400' : 'text-gray-500'}`}>Pro</p>
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs font-medium">Popular</Badge>
            </div>
            <div className="flex items-end gap-1.5 mb-6">
              <span className="text-5xl font-bold tracking-tight">$12</span>
              <span className={`mb-2 text-sm ${d ? 'text-zinc-400' : 'text-gray-400'}`}>/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {['Unlimited repositories','Unlimited questions','Priority AI responses','Team access','Early features'].map(f => (
                <li key={f} className={`flex items-center gap-2.5 text-sm ${d ? 'text-zinc-300' : 'text-gray-700'}`}>
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link href="/signup">
              <Button className="w-full btn-primary text-white border-0 rounded-xl h-11 font-medium">
                Start Pro trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-3xl mx-auto px-6 pb-28">
        <div
          className="rounded-3xl p-12 text-center relative overflow-hidden"
          style={{
            background: d
              ? 'rgba(16,185,129,0.06)'
              : 'linear-gradient(135deg,#ecfdf5 0%,#f0fdf4 50%,#eff6ff 100%)',
            border: d ? '1px solid rgba(16,185,129,0.2)' : '1px solid #d1fae5',
          }}
        >
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 65%)', pointerEvents:'none' }} />
          <h2 className="text-4xl font-bold tracking-tight mb-4 relative">
            Start understanding<br />your code today
          </h2>
          <p className={`mb-8 relative ${d ? 'text-zinc-400' : 'text-gray-500'}`}>
            Join thousands of developers who use RepoMind to ship faster.
          </p>
          <Link href="/signup" className="relative inline-block">
            <Button size="lg" className="btn-primary text-white font-medium text-base px-10 h-12 rounded-xl border-0 flex items-center gap-2.5">
              <Gift className="w-4 h-4" />
              Connect GitHub — it's free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className={`text-xs mt-4 mono relative ${d ? 'text-zinc-600' : 'text-gray-400'}`}>No credit card required</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={`border-t py-10 px-6 transition-colors duration-300 ${d ? 'border-zinc-800 bg-zinc-900/20' : 'border-gray-100 bg-gray-50/50'}`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img
              src="https://ik.imagekit.io/sl226drpx/grok-image-da915e64-fb0b-4722-9896-e90a54cc9528-removebg-preview.png"
              alt="RepoMind logo"
              className="w-7 h-7 object-contain"
              style={{ filter: d ? 'none' : 'brightness(0)' }}
            />
            <span className="font-semibold text-sm tracking-tight">RepoMind</span>
          </div>
          <p className={`text-xs mono order-last md:order-none ${d ? 'text-zinc-600' : 'text-gray-400'}`}>
            © {new Date().getFullYear()} RepoMind. All rights reserved.
          </p>
          <div className={`flex gap-7 text-sm ${d ? 'text-zinc-500' : 'text-gray-400'}`}>
            {['Twitter','Discord','Privacy','Terms'].map(l => (
              <a key={l} href="#" className={`transition-colors ${d ? 'hover:text-white' : 'hover:text-gray-900'}`}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}