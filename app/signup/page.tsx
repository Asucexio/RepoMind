'use client'

import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Check } from 'lucide-react'

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

function getPasswordStrength(pw: string): { score: number; label: string; colorHex: string } {
  if (!pw) return { score: 0, label: '', colorHex: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const map = [
    { label: 'Too short', colorHex: '#ef4444' },
    { label: 'Weak',      colorHex: '#ef4444' },
    { label: 'Fair',      colorHex: '#f59e0b' },
    { label: 'Good',      colorHex: '#10b981' },
    { label: 'Strong',    colorHex: '#10b981' },
  ]
  return { score, ...map[score] }
}

export default function Signup() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [agreed, setAgreed]         = useState(false)
  const [showPassword, setShowPw]   = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const router = useRouter()

  const strength = useMemo(() => getPasswordStrength(password), [password])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) { setError('Please accept the terms to continue.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else router.push('/verify-email')
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#f0fdf4', fontSize: '14px', outline: 'none',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  const onFocusInput = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(16,185,129,0.5)'
    e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'
  }
  const onBlurInput = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.08)'
    e.target.style.boxShadow = 'none'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: '32px 16px',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* ── Atmospheric background ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Top-right orb */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-60px',
          width: '520px', height: '520px',
          background: 'radial-gradient(circle, rgba(16,185,129,0.16) 0%, rgba(16,185,129,0.05) 40%, transparent 70%)',
          filter: 'blur(70px)', borderRadius: '50%',
        }} />
        {/* Bottom-left orb */}
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-60px',
          width: '480px', height: '480px',
          background: 'radial-gradient(circle, rgba(5,150,105,0.14) 0%, rgba(5,150,105,0.04) 40%, transparent 70%)',
          filter: 'blur(80px)', borderRadius: '50%',
        }} />
        {/* Center glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '900px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.03) 0%, transparent 60%)',
          filter: 'blur(40px)',
        }} />
        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(16,185,129,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.025) 1px, transparent 1px)
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 0 30px rgba(16,185,129,0.4), 0 0 60px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <img
              src="https://ik.imagekit.io/sl226drpx/grok-image-da915e64-fb0b-4722-9896-e90a54cc9528-removebg-preview.png"
              alt="RepoMind"
              style={{ width: '28px', height: '28px', objectFit: 'contain' }}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em', margin: 0 }}>
                Create your account
              </h1>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                background: 'rgba(16,185,129,0.1)', color: '#34d399',
                border: '1px solid rgba(16,185,129,0.2)', letterSpacing: '0.02em',
              }}>
                FREE
              </span>
            </div>
            <p style={{ color: '#4b5563', fontSize: '14px', margin: 0 }}>
              Join thousands of developers
            </p>
          </div>

          {/* Social buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {[
              { provider: 'google' as const, icon: <GoogleIcon />, label: 'Sign up with Google' },
              { provider: 'github' as const, icon: <GitHubIcon />, label: 'Sign up with GitHub' },
            ].map(({ provider, icon, label }) => (
              <button
                key={provider}
                onClick={() => signInWithProvider(provider)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', padding: '11px 16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
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
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', letterSpacing: '0.01em' }}>
                Email address
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                style={inputStyle} onFocus={onFocusInput} onBlur={onBlurInput}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', letterSpacing: '0.01em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters" required
                  style={{ ...inputStyle, paddingRight: '40px' }}
                  onFocus={onFocusInput} onBlur={onBlurInput}
                />
                <button
                  type="button" onClick={() => setShowPw(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563',
                    display: 'flex', alignItems: 'center', transition: 'color 0.15s', padding: '2px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Strength meter */}
              {password && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '3px', borderRadius: '2px',
                        background: i <= strength.score ? strength.colorHex : 'rgba(255,255,255,0.07)',
                        transition: 'background 0.2s',
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', color: '#4b5563', margin: 0 }}>
                    Strength:{' '}
                    <span style={{ color: strength.colorHex, fontWeight: 600 }}>{strength.label}</span>
                    {strength.score < 3 && <span style={{ color: '#374151' }}> — add uppercase, numbers or symbols</span>}
                  </p>
                </div>
              )}
            </div>

            {/* Terms checkbox */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <div
                onClick={() => setAgreed(!agreed)}
                style={{
                  marginTop: '1px', width: '16px', height: '16px', flexShrink: 0,
                  borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${agreed ? '#10b981' : 'rgba(255,255,255,0.12)'}`,
                  background: agreed ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.03)',
                  boxShadow: agreed ? '0 0 10px rgba(16,185,129,0.2)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {agreed && <Check size={10} strokeWidth={3} color="#fff" />}
              </div>
              <span style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.5' }}>
                I agree to the{' '}
                <a href="/terms" style={{ color: '#10b981', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#34d399')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#10b981')}
                >terms of service</a>
                {' '}and{' '}
                <a href="/privacy" style={{ color: '#10b981', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#34d399')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#10b981')}
                >privacy policy</a>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
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
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.15)' }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.15)' }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                  }} />
                  Creating account…
                </>
              ) : 'Create account'}
            </button>
          </form>

          {/* Footer link */}
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#374151', marginTop: '20px' }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#34d399')}
              onMouseLeave={e => (e.currentTarget.style.color = '#10b981')}
            >
              Sign in →
            </a>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#1f2937', marginTop: '24px' }}>
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