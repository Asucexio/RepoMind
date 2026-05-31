'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  GitBranch, LogOut, Send, RefreshCw, Search, Plus,
  ChevronDown, Settings, User, Star, Clock, Sparkles,
  Code2, MessageSquare, ExternalLink
} from 'lucide-react'
import { FaGithub, FaGoogle } from "react-icons/fa";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Repo {
  id: number
  name: string
  full_name: string
  description: string
  html_url: string
  updated_at: string
  stargazers_count: number
  language: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ─── Markdown renderer ─────────────────────────────────────────────────────

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g)
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lines = part.slice(3, -3).split('\n')
          const lang = lines[0].trim()
          const code = lines.slice(1).join('\n')
          return (
            <pre key={i} className="bg-[#0a0a0a] rounded-xl p-4 overflow-x-auto text-xs font-mono text-emerald-300 border border-white/5 mt-2">
              {lang && <div className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2 font-sans">{lang}</div>}
              <code>{code}</code>
            </pre>
          )
        }
        const inlineParts = part.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
        return (
          <p key={i} className="whitespace-pre-wrap">
            {inlineParts.map((s, j) => {
              if (s.startsWith('`') && s.endsWith('`'))
                return <code key={j} className="bg-white/10 text-emerald-300 px-1.5 py-0.5 rounded font-mono text-xs">{s.slice(1, -1)}</code>
              if (s.startsWith('**') && s.endsWith('**'))
                return <strong key={j} className="font-semibold text-white">{s.slice(2, -2)}</strong>
              return s
            })}
          </p>
        )
      })}
    </div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function RepoSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse">
          <div className="h-3.5 bg-white/10 rounded-full w-2/3 mb-2" />
          <div className="h-2.5 bg-white/5 rounded-full w-full mb-1" />
          <div className="h-2.5 bg-white/5 rounded-full w-1/2" />
        </div>
      ))}
    </div>
  )
}

// ─── Language color dots ────────────────────────────────────────────────────

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  Go: '#00ADD8', Rust: '#dea584', Java: '#b07219', Ruby: '#701516',
  CSS: '#563d7c', HTML: '#e34c26', Vue: '#41b883', default: '#6e7681'
}

// ─── Relative time ──────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
  return `${Math.floor(diff / 2592000)}mo ago`
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [repos, setRepos] = useState<Repo[]>([])
  const [filteredRepos, setFilteredRepos] = useState<Repo[]>([])
  const [search, setSearch] = useState('')
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [repoContext, setRepoContext] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingRepos, setFetchingRepos] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login')
      else setUser(user)
    }
    getUser()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFilteredRepos(repos.filter(r =>
      r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
    ))
  }, [search, repos])

  const connectGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { scopes: 'repo read:user', redirectTo: `${window.location.origin}/dashboard` }
    })
    if (error) alert(error.message)
  }

  const fetchRepos = async () => {
    setFetchingRepos(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('https://api.github.com/user/repos?per_page=50&sort=updated', {
        headers: { Authorization: `Bearer ${session.provider_token}`, Accept: 'application/vnd.github.v3+json' }
      })
      if (res.ok) {
        const data = await res.json()
        setRepos(data)
        setFilteredRepos(data)
      }
    } catch {}
    setFetchingRepos(false)
  }

  const processRepository = async (repo: Repo) => {
    if (processing || selectedRepo?.id === repo.id) return
    setProcessing(true)
    setSelectedRepo(repo)
    setMessages([])
    setRepoContext('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const headers = { Authorization: `Bearer ${session.provider_token}`, Accept: 'application/vnd.github.v3+json' }

      const treeRes = await fetch(`https://api.github.com/repos/${repo.full_name}/git/trees/HEAD?recursive=1`, { headers })
      let fileTree = '', fileContents = ''

      if (treeRes.ok) {
        const treeData = await treeRes.json()
        const allFiles: string[] = treeData.tree?.filter((f: any) => f.type === 'blob').map((f: any) => f.path) ?? []
        fileTree = allFiles.slice(0, 80).join('\n')
        const importantFiles = allFiles.filter(f =>
          /\.(ts|tsx|js|jsx|py|go|rs|java|md|json|toml|yaml|yml)$/.test(f) &&
          !f.includes('node_modules') && !f.includes('package-lock') &&
          !f.includes('yarn.lock') && !f.includes('.min.')
        ).slice(0, 10)

        for (const filePath of importantFiles) {
          const fileRes = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${filePath}`, { headers })
          if (fileRes.ok) {
            const fileData = await fileRes.json()
            if (fileData.encoding === 'base64' && fileData.content) {
              const decoded = atob(fileData.content.replace(/\n/g, ''))
              if (decoded.length < 4000)
                fileContents += `\n\n### File: ${filePath}\n\`\`\`\n${decoded}\n\`\`\``
            }
          }
        }
      }

      setRepoContext(`Repository: ${repo.full_name}\nDescription: ${repo.description || 'No description'}\nURL: ${repo.html_url}\n\nFILE TREE:\n${fileTree}\n\nFILE CONTENTS:\n${fileContents}`)
      setMessages([{ role: 'assistant', content: `I've analysed **${repo.name}** — loaded the file tree and key source files. What would you like to know?` }])
    } catch {}
    setProcessing(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const sendMessage = async () => {
    if (!input.trim() || !selectedRepo || loading) return
    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage], context: repoContext })
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get a response. Please try again.' }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div
      className="h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* DM Sans font — same as landing page */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      {/* ── Top Nav ─────────────────────────────────────────────────────────── */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-5 border-b border-white/[0.07] bg-[#0a0a0a]/80 backdrop-blur-xl z-50 relative">
        <div className="flex items-center gap-2.5">
          {/* Same logo image as landing page */}
          <img
            src="https://ik.imagekit.io/sl226drpx/grok-image-da915e64-fb0b-4722-9896-e90a54cc9528-removebg-preview.png"
            alt="RepoMind"
            className="w-8 h-8 object-contain"
          />
          <span className="font-semibold text-[15px] tracking-tight text-white">RepoMind</span>
          {/* BETA badge — emerald tint */}
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>BETA</span>
        </div>

        <div className="flex items-center gap-3 relative">
          <button
            onClick={connectGitHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium transition-all duration-200"
          >
            <FaGithub size={13} /> Connect GitHub
          </button>

          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] transition-all duration-200"
          >
            {/* Avatar — emerald gradient matching btn-primary on landing */}
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 2px 8px -2px rgba(16,185,129,0.45)' }}>
              {userInitials}
            </div>
            <span className="text-xs text-zinc-300 max-w-[120px] truncate">{user?.user_metadata?.full_name || user?.email}</span>
            <ChevronDown size={12} className="text-zinc-500" />
          </button>

          {userMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-52 bg-[#141414] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 py-1.5 z-50" onClick={() => setUserMenuOpen(false)}>
              <div className="px-3.5 py-2.5 border-b border-white/[0.06] mb-1">
                <p className="text-xs font-medium text-white truncate">{user?.user_metadata?.full_name}</p>
                <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
              </div>
              {[
                { icon: User, label: 'Profile' },
                { icon: Settings, label: 'Settings' },
              ].map(({ icon: Icon, label }) => (
                <button key={label} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors">
                  <Icon size={13} /> {label}
                </button>
              ))}
              <div className="border-t border-white/[0.06] mt-1 pt-1">
                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/[0.07] transition-colors rounded-b-xl">
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0c0c0c]">
          <div className="p-3 border-b border-white/[0.06]">
            <div className="relative mb-2.5">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search repositories…"
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] transition-all"
              />
            </div>
            {/* Load button — emerald gradient, matching landing page btn-primary */}
            <button
              onClick={fetchRepos}
              disabled={fetchingRepos}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 14px -4px rgba(16,185,129,0.45)',
              }}
            >
              {fetchingRepos ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              {fetchingRepos ? 'Loading…' : 'Load repositories'}
            </button>
          </div>

          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>Repositories</span>
            {repos.length > 0 && <span className="text-[10px] text-zinc-600" style={{ fontFamily: "'DM Mono', monospace" }}>{filteredRepos.length}</span>}
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
            {fetchingRepos ? <div className="px-2"><RepoSkeleton /></div>
              : filteredRepos.length > 0 ? filteredRepos.map(repo => {
                const isActive = selectedRepo?.id === repo.id
                const langColor = LANG_COLORS[repo.language] ?? LANG_COLORS.default
                return (
                  <button
                    key={repo.id}
                    onClick={() => processRepository(repo)}
                    disabled={processing}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group ${
                      isActive
                        ? 'border-emerald-500/30 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/[0.07]'
                    }`}
                    style={isActive ? { background: 'rgba(16,185,129,0.08)', boxShadow: '0 1px 12px -4px rgba(16,185,129,0.2)' } : {}}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Code2 size={11} className={isActive ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-zinc-400'} />
                        <span className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-zinc-300'}`}>{repo.name}</span>
                      </div>
                      {isActive && processing && <RefreshCw size={10} className="text-emerald-400 animate-spin flex-shrink-0" />}
                    </div>
                    {repo.description && (
                      <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed mb-1.5">{repo.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: langColor }} />
                          {repo.language}
                        </span>
                      )}
                      {repo.stargazers_count > 0 && (
                        <span className="flex items-center gap-0.5"><Star size={9} />{repo.stargazers_count}</span>
                      )}
                      {repo.updated_at && (
                        <span className="flex items-center gap-0.5 ml-auto"><Clock size={9} />{relativeTime(repo.updated_at)}</span>
                      )}
                    </div>
                  </button>
                )
              }) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-3">
                    <GitBranch size={20} className="text-zinc-600" />
                  </div>
                  <p className="text-xs font-medium text-zinc-400 mb-1">No repositories yet</p>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">Connect your GitHub account and load your repositories to get started</p>
                </div>
              )
            }
          </div>

          <div className="p-3 border-t border-white/[0.06]">
            <button
              onClick={connectGitHub}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] hover:border-emerald-500/20 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-all duration-200"
            >
              <Plus size={12} /> Connect new repository
            </button>
          </div>
        </aside>

        {/* ── Chat area ───────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 relative">

          {/* Chat header */}
          <div className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#0a0a0a]/60 backdrop-blur-sm">
            {selectedRepo ? (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.07] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                    <Code2 size={13} className="text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{selectedRepo.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{selectedRepo.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {processing && (
                    <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                      <RefreshCw size={10} className="animate-spin" /> Analysing…
                    </span>
                  )}
                  <a href={selectedRepo.html_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] px-2.5 py-1 rounded-lg transition-all">
                    <ExternalLink size={10} /> Open in GitHub
                  </a>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-zinc-500">
                <MessageSquare size={15} />
                <span className="text-sm">Select a repository to begin</span>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {messages.length === 0 && !selectedRepo && (
              <div className="flex flex-col items-center justify-center h-full gap-6 text-center max-w-md mx-auto">
                {/* Glow orb — emerald, matching landing page CTA glow */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-3xl scale-150" style={{ background: 'rgba(16,185,129,0.15)' }} />
                  <div className="relative w-20 h-20 rounded-3xl border flex items-center justify-center"
                    style={{
                      background: 'rgba(16,185,129,0.08)',
                      borderColor: 'rgba(16,185,129,0.25)',
                      boxShadow: '0 8px 40px -12px rgba(16,185,129,0.3)',
                    }}>
                    <Sparkles size={28} className="text-emerald-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">Ask anything about your code</h2>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Select a repository from the sidebar, then ask questions about the codebase, architecture, or specific files.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {[
                    'Explain the project architecture',
                    'What does this function do?',
                    'Find potential bugs',
                    'Suggest improvements',
                  ].map(s => (
                    <div key={s} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs text-zinc-500 text-left hover:border-emerald-500/25 hover:bg-emerald-500/[0.04] hover:text-zinc-300 cursor-default transition-all">
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: 'rgba(16,185,129,0.1)',
                      borderColor: 'rgba(16,185,129,0.25)',
                      boxShadow: '0 4px 12px -4px rgba(16,185,129,0.2)',
                    }}>
                    <Sparkles size={12} className="text-emerald-400" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'text-white rounded-br-sm'
                      : 'bg-[#141414] border border-white/[0.07] text-zinc-200 rounded-bl-sm'
                  }`}
                  style={msg.role === 'user' ? {
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 0 0 1px rgba(16,185,129,0.25), 0 8px 32px -8px rgba(16,185,129,0.35)',
                  } : {}}
                >
                  <MessageContent content={msg.content} />
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-white"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 4px 12px -4px rgba(16,185,129,0.4)',
                    }}>
                    {userInitials}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator — emerald dots */}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)' }}>
                  <Sparkles size={12} className="text-emerald-400" />
                </div>
                <div className="bg-[#141414] border border-white/[0.07] px-4 py-3.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  {[0, 150, 300].map(delay => (
                    <span
                      key={delay}
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
                      style={{ animationDelay: `${delay}ms`, animationDuration: '900ms' }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 px-6 pb-6 pt-3">
            {/* Glow divider — emerald, same as landing page btn-primary glow */}
            <div className="h-px mb-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.2), transparent)' }} />

            <div className="relative flex items-end gap-3 bg-[#141414] border border-white/[0.09] rounded-2xl px-4 py-3 transition-all duration-300"
              style={{}}
              onFocus={() => {}}
              onBlur={() => {}}
            >
              <style>{`
                .chat-input-wrap:focus-within {
                  border-color: rgba(16,185,129,0.35) !important;
                  box-shadow: 0 0 0 1px rgba(16,185,129,0.12), 0 0 40px rgba(16,185,129,0.07);
                }
              `}</style>
              <div className="chat-input-wrap relative flex items-end gap-3 w-full bg-[#141414] border border-white/[0.09] rounded-2xl px-4 py-3 transition-all duration-300">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedRepo ? `Ask anything about ${selectedRepo.name}…` : 'Select a repository to start chatting'}
                  disabled={!selectedRepo || processing}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed disabled:opacity-40 disabled:cursor-not-allowed min-h-[24px]"
                  style={{ maxHeight: '160px' }}
                />
                {/* Send button — emerald gradient */}
                <button
                  onClick={sendMessage}
                  disabled={!selectedRepo || !input.trim() || loading || processing}
                  className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: (!selectedRepo || !input.trim() || loading || processing)
                      ? '#27272a'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: (!selectedRepo || !input.trim() || loading || processing)
                      ? 'none'
                      : '0 4px 14px -4px rgba(16,185,129,0.55)',
                  }}
                >
                  <Send size={14} className="text-white" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-zinc-700 mt-1.5 ml-1" style={{ fontFamily: "'DM Mono', monospace" }}>Enter to send · Shift+Enter for new line</p>
          </div>
        </main>
      </div>
    </div>
  )
}
