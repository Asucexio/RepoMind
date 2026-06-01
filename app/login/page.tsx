'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

const GoogleIcon = () => (
  <svg viewBox="0 0 18 18" width="17" height="17">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.251 17.64 11.943 17.64 9.2z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
)

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  const signInWithProvider = async (provider: 'google' | 'github') => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) setError(error.message)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Atmospheric background ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Top-left emerald orb */}
        <div style={{
          position: 'absolute', top: '-120px', left: '-80px',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.06) 40%, transparent 70%)',
          filter: 'blur(60px)',
          borderRadius: '50%',
        }} />
        {/* Bottom-right deep green orb */}
        <div style={{
          position: 'absolute', bottom: '-100px', right: '-60px',
          width: '450px', height: '450px',
          background: 'radial-gradient(circle, rgba(5,150,105,0.15) 0%, rgba(5,150,105,0.05) 40%, transparent 70%)',
          filter: 'blur(70px)',
          borderRadius: '50%',
        }} />
        {/* Center subtle glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.04) 0%, transparent 60%)',
          filter: 'blur(40px)',
        }} />
        {/* Subtle grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>

        {/* ── Logo ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #e2ede9 0%, #f7f9f8 100%)',
            boxShadow: '0 0 30px rgba(16,185,129,0.4), 0 0 60px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <img
              src="https://ik.imagekit.io/sl226drpx/grok-image-da915e64-fb0b-4722-9896-e90a54cc9528-removebg-preview.png"
              alt="RepoMind"
              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
            />
          </div>
          <span style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>
            RepoMind
          </span>
        </div>

        {/* ── Card ── */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(16,185,129,0.12)',
          borderRadius: '20px',
          padding: '32px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(16,185,129,0.05)',
        }}>

          {/* Heading */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em', margin: 0 }}>
              Welcome back
            </h1>
            <p style={{ color: '#bcc3cc', fontSize: '14px', marginTop: '4px' }}>
              Sign in to continue to your workspace
            </p>
          </div>

          {/* Social buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {[
              { provider: 'google' as const, icon: <GoogleIcon />, label: 'Continue with Google' },
              { provider: 'github' as const, icon: <GitHubIcon />, label: 'Continue with GitHub' },
            ].map(({ provider, icon, label }) => (
              <button
                key={provider}
                onClick={() => signInWithProvider(provider)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', padding: '11px 16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#d1d5db', fontSize: '14px', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(16,185,129,0.07)'
                  el.style.borderColor = 'rgba(16,185,129,0.2)'
                  el.style.color = '#d1fae5'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(255,255,255,0.04)'
                  el.style.borderColor = 'rgba(255,255,255,0.08)'
                  el.style.color = '#d1d5db'
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: '11px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: '16px', padding: '11px 14px', borderRadius: '12px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
              color: '#fca5a5', fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgb(187, 193, 204)', marginBottom: '6px', letterSpacing: '0.01em' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#f0fdf4', fontSize: '14px', outline: 'none',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(16,185,129,0.5)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#bec3cf', letterSpacing: '0.01em' }}>
                  Password
                </label>
                <a href="/forgot-password" style={{ fontSize: '12px', color: '#10b981', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#34d399')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#10b981')}
                >
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '11px 40px 11px 14px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#f0fdf4', fontSize: '14px', outline: 'none',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(16,185,129,0.5)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#4b5563', padding: '2px', display: 'flex', alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '12px',
                background: loading ? 'rgba(16,185,129,0.5)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                boxShadow: loading ? 'none' : '0 4px 20px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                transition: 'all 0.15s ease', letterSpacing: '0.01em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
              onMouseEnter={e => {
                if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.15)'
              }}
              onMouseLeave={e => {
                if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                  }} />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Footer link */}
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#f2f6fd', marginTop: '20px' }}>
            No account?{' '}
            <a href="/signup" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#34d399')}
              onMouseLeave={e => (e.currentTarget.style.color = '#10b981')}
            >
              Create one free →
            </a>
          </p>
        </div>

        {/* Bottom tagline */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#929aa6', marginTop: '24px' }}>
          Trusted by developers worldwide
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #374151; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}