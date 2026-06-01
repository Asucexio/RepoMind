"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  LogOut,
  Send,
  RefreshCw,
  Search,
  ChevronDown,
  Star,
  Clock,
  Sparkles,
  Code2,
  MessageSquare,
  ExternalLink,
  Users,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Repo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  updated_at: string;
  stargazers_count: number;
  language: string;
  default_branch?: string;
  topics?: string[];
  open_issues_count?: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface GitHubProfile {
  username: string;
  name: string;
  avatarUrl: string;
  profileUrl: string;
  followers?: number;
  publicRepos?: number;
}

interface GitHubTreeItem {
  path: string;
  type: string;
  size?: number;
}

interface LoadingStage {
  label: string;
  done: boolean;
}

// ─── Priority file scoring ─────────────────────────────────────────────────
// Higher score = loaded first. Negative score = skipped entirely.

const SKIP_PATTERNS = [
  /node_modules/,
  /\.next\//,
  /dist\//,
  /build\//,
  /\.git\//,
  /coverage\//,
  /package-lock\.json/,
  /yarn\.lock/,
  /pnpm-lock/,
  /\.min\.(js|css)$/,
  /\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|mp4|mp3|pdf)$/,
  /\.map$/,
  /__pycache__/,
  /\.pyc$/,
  /\.DS_Store/,
];

const PRIORITY_PATTERNS: Array<[RegExp, number]> = [
  [/^(README|readme)\.(md|txt|rst)$/i, 100],
  [/^(package\.json|pyproject\.toml|Cargo\.toml|go\.mod|pom\.xml)$/, 90],
  [/^(next\.config|vite\.config|webpack\.config|tsconfig)\.(js|ts|mjs|json)$/, 80],
  [/^(docker-compose\.yml|Dockerfile|\.env\.example)$/, 75],
  [/^(src|app|lib)\/(index|main|app|server)\.(ts|tsx|js|jsx|py|go|rs)$/, 70],
  [/^(index|main|app|server)\.(ts|tsx|js|jsx|py|go|rs)$/, 68],
  [/\/(api|routes|controllers?|handlers?)\/.+\.(ts|tsx|js|jsx|py|go)$/, 60],
  [/\/(pages|app)\/.+\.(ts|tsx|js|jsx)$/, 58],
  [/\/(models?|schemas?|types?|interfaces?)\/.+\.(ts|tsx|js|py)$/, 55],
  [/\/(utils?|helpers?|lib|core|services?)\/.+\.(ts|tsx|js|py|go)$/, 50],
  [/\.(test|spec)\.(ts|tsx|js|jsx|py)$/, 40],
  [/\.(ts|tsx|js|jsx|py|go|rs|java|rb|php|swift|kt)$/, 20],
  [/\.(json|yaml|yml|toml|env\.example)$/, 10],
];

function scoreFile(path: string): number {
  if (SKIP_PATTERNS.some((p) => p.test(path))) return -1;
  let score = 0;
  for (const [pattern, pts] of PRIORITY_PATTERNS) {
    if (pattern.test(path)) {
      score = Math.max(score, pts);
    }
  }
  // Slightly penalise deep nesting
  score -= (path.split("/").length - 1) * 0.3;
  return score;
}

// ─── Markdown renderer ─────────────────────────────────────────────────────

function MessageContent({ content }: { content: string }) {
  const renderInline = (text: string): React.ReactNode[] => {
    const parts = text.split(/(`[^`\n]+`|\*\*[^*]+\*\*)/g);
    return parts.map((s, j) => {
      if (s.startsWith("`") && s.endsWith("`") && s.length > 2)
        return (
          <code key={j} className="bg-white/10 text-emerald-300 px-1.5 py-0.5 rounded font-mono text-xs">
            {s.slice(1, -1)}
          </code>
        );
      if (s.startsWith("**") && s.endsWith("**"))
        return <strong key={j} className="font-semibold text-white">{s.slice(2, -2)}</strong>;
      return s;
    });
  };

  const parts = content.split(/(```[\s\S]*?```)/g);
  const elements: React.ReactNode[] = [];

  parts.forEach((part, i) => {
    if (part.startsWith("```")) {
      const lines = part.slice(3, -3).split("\n");
      const lang = lines[0].trim();
      const code = lines.slice(1).join("\n");
      elements.push(
        <pre key={`code-${i}`} className="bg-[#0a0a0a] rounded-xl p-4 overflow-x-auto text-xs font-mono text-emerald-300 border border-white/5 my-2">
          {lang && <div className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2 font-sans">{lang}</div>}
          <code>{code}</code>
        </pre>
      );
      return;
    }

    const lines = part.split("\n");
    let listItems: string[] = [];
    let listType: "ul" | "ol" | null = null;

    const flushList = (key: string) => {
      if (listItems.length > 0) {
        const Tag = listType === "ol" ? "ol" : "ul";
        elements.push(
          <Tag key={key} className={`${listType === "ol" ? "list-decimal" : "list-disc"} list-inside space-y-1 my-1 text-zinc-300 pl-1`}>
            {listItems.map((item, idx) => (
              <li key={idx} className="text-sm leading-relaxed">
                {renderInline(item.replace(/^[-*•]\s+/, "").replace(/^\d+\.\s+/, ""))}
              </li>
            ))}
          </Tag>
        );
        listItems = [];
        listType = null;
      }
    };

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      const isBullet = /^[-*•]\s/.test(trimmed);
      const isNumbered = /^\d+\.\s/.test(trimmed);
      const isHeading = /^#{1,3}\s/.test(trimmed);
      const isEmpty = trimmed === "";

      if (isBullet) {
        if (listType === "ol") flushList(`list-${i}-${lineIdx}`);
        listType = "ul";
        listItems.push(trimmed);
      } else if (isNumbered) {
        if (listType === "ul") flushList(`list-${i}-${lineIdx}`);
        listType = "ol";
        listItems.push(trimmed);
      } else {
        flushList(`list-${i}-${lineIdx}`);
        if (!isEmpty) {
          if (isHeading) {
            const level = trimmed.match(/^(#{1,3})/)?.[1].length ?? 1;
            const text = trimmed.replace(/^#+\s/, "");
            const sizeClass = level === 1 ? "text-base" : level === 2 ? "text-sm" : "text-xs";
            elements.push(
              <p key={`h-${i}-${lineIdx}`} className={`${sizeClass} font-bold text-white mt-3 mb-1 block`}>
                {text}
              </p>
            );
          } else {
            elements.push(
              <p key={`p-${i}-${lineIdx}`} className="text-sm leading-relaxed text-zinc-200 my-0.5">
                {renderInline(line)}
              </p>
            );
          }
        }
      }
    });

    flushList(`list-${i}-end`);
  });

  return <div className="space-y-0.5">{elements}</div>;
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
  );
}

// ─── Language color dots ───────────────────────────────────────────────────

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  Ruby: "#701516",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Vue: "#41b883",
  default: "#6e7681",
};

// ─── Relative time ─────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

// ─── Loading stages ────────────────────────────────────────────────────────

function LoadingStages({ stages }: { stages: LoadingStage[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {stages.map((s, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          {s.done ? (
            <CheckCircle2 size={11} className="text-emerald-400 flex-shrink-0" />
          ) : (
            <RefreshCw size={11} className="text-emerald-400 animate-spin flex-shrink-0" />
          )}
          <span className={s.done ? "text-zinc-600 line-through" : "text-zinc-300"}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Suggested questions ───────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  "Explain the overall architecture",
  "What are the main entry points?",
  "Find potential bugs or issues",
  "How does the data flow work?",
  "What do recent commits tell us?",
  "How would I add a new feature?",
];

// ─── Main Dashboard ────────────────────────────────────────────────────────

export default function Dashboard() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [githubProfile, setGithubProfile] = useState<GitHubProfile | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [search, setSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [repoContext, setRepoContext] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingRepos, setFetchingRepos] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loadingStages, setLoadingStages] = useState<LoadingStage[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [contextStats, setContextStats] = useState<{ files: number; chars: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, loadingStages]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const metadata = user.user_metadata ?? {};
      const fallback: GitHubProfile = {
        username: metadata.user_name ?? metadata.preferred_username ?? metadata.name ?? user.email ?? "GitHub user",
        name: metadata.full_name ?? metadata.name ?? "GitHub profile",
        avatarUrl: metadata.avatar_url ?? metadata.picture ?? "",
        profileUrl: metadata.user_name ? `https://github.com/${metadata.user_name}` : "https://github.com",
      };
      setGithubProfile(fallback);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.provider_token) return;

      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${session.provider_token}`, Accept: "application/vnd.github.v3+json" },
      });
      if (!res.ok) return;
      const p = await res.json() as { login?: string; name?: string; avatar_url?: string; html_url?: string; followers?: number; public_repos?: number };
      setGithubProfile({
        username: p.login ?? fallback.username,
        name: p.name ?? fallback.name,
        avatarUrl: p.avatar_url ?? fallback.avatarUrl,
        profileUrl: p.html_url ?? fallback.profileUrl,
        followers: p.followers,
        publicRepos: p.public_repos,
      });
    };
    getUser();
  }, [router]);

  const filteredRepos = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return repos;
    return repos.filter((r) => r.name.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q));
  }, [search, repos]);

  const connectGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { scopes: "repo read:user", redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) alert(error.message);
  };

  const fetchRepos = async () => {
    setFetchingRepos(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator", {
        headers: { Authorization: `Bearer ${session.provider_token}`, Accept: "application/vnd.github.v3+json" },
      });
      if (res.ok) setRepos(await res.json());
    } catch {}
    setFetchingRepos(false);
  };

  const updateStage = useCallback((index: number) => {
    setLoadingStages((prev) => prev.map((s, i) => (i === index ? { ...s, done: true } : s)));
  }, []);

  const processRepository = async (repo: Repo) => {
    if (processing || selectedRepo?.id === repo.id) return;
    setProcessing(true);
    setSelectedRepo(repo);
    setMessages([]);
    setRepoContext("");
    setContextStats(null);

    const stages: LoadingStage[] = [
      { label: "Fetching repository metadata & languages", done: false },
      { label: "Mapping full file tree", done: false },
      { label: "Loading source files (smart-ranked)", done: false },
      { label: "Fetching commit history", done: false },
      { label: "Assembling AI context", done: false },
    ];
    setLoadingStages(stages);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const headers = {
        Authorization: `Bearer ${session.provider_token}`,
        Accept: "application/vnd.github.v3+json",
      };

      // ── Stage 0: Repo metadata + languages ──────────────────────────────
      let repoMeta = "";
      let languagesInfo = "";
      await Promise.all([
        fetch(`https://api.github.com/repos/${repo.full_name}`, { headers })
          .then((r) => r.ok ? r.json() : null)
          .then((meta) => {
            if (!meta) return;
            repoMeta = [
              `Repository: ${meta.full_name}`,
              `Description: ${meta.description || "No description"}`,
              `Primary Language: ${meta.language || "Unknown"}`,
              `Stars: ${meta.stargazers_count} | Forks: ${meta.forks_count} | Open Issues: ${meta.open_issues_count}`,
              `Default Branch: ${meta.default_branch}`,
              `Topics: ${(meta.topics || []).join(", ") || "none"}`,
              `License: ${meta.license?.name || "none"}`,
              `Created: ${meta.created_at?.slice(0, 10)} | Last pushed: ${meta.pushed_at?.slice(0, 10)}`,
              `URL: ${meta.html_url}`,
              meta.homepage ? `Homepage: ${meta.homepage}` : "",
            ].filter(Boolean).join("\n");
          }).catch(() => {}),

        fetch(`https://api.github.com/repos/${repo.full_name}/languages`, { headers })
          .then((r) => r.ok ? r.json() : null)
          .then((langs: Record<string, number> | null) => {
            if (!langs) return;
            const total = Object.values(langs).reduce((a, b) => a + b, 0);
            languagesInfo = "LANGUAGE BREAKDOWN:\n" + Object.entries(langs)
              .sort(([, a], [, b]) => b - a)
              .map(([lang, bytes]) => `  ${lang}: ${((bytes / total) * 100).toFixed(1)}%`)
              .join("\n");
          }).catch(() => {}),
      ]);
      updateStage(0);

      // ── Stage 1: File tree ──────────────────────────────────────────────
      let fileTree = "";
      let allFiles: GitHubTreeItem[] = [];
      try {
        const branch = repo.default_branch || "HEAD";
        const treeRes = await fetch(
          `https://api.github.com/repos/${repo.full_name}/git/trees/${branch}?recursive=1`,
          { headers }
        );
        if (treeRes.ok) {
          const treeData = await treeRes.json();
          allFiles = ((treeData.tree as GitHubTreeItem[]) || []).filter((f) => f.type === "blob");
          const visiblePaths = allFiles
            .map((f) => f.path)
            .filter((p) => !SKIP_PATTERNS.some((pat) => pat.test(p)));
          const shown = visiblePaths.slice(0, 300);
          fileTree = shown.join("\n");
          if (visiblePaths.length > 300) fileTree += `\n... and ${visiblePaths.length - 300} more files`;
        }
      } catch {}
      updateStage(1);

      // ── Stage 2: Smart file loading ─────────────────────────────────────
      let fileContents = "";
      let loadedCount = 0;

      try {
        const scored = allFiles
          .map((f) => ({ path: f.path, score: scoreFile(f.path) }))
          .filter((f) => f.score >= 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 15); // 15 files keeps total context well under Groq's limit

        const fetchFile = async (filePath: string): Promise<{ path: string; content: string } | null> => {
          try {
            const r = await fetch(
              `https://api.github.com/repos/${repo.full_name}/contents/${encodeURIComponent(filePath)}`,
              { headers }
            );
            if (!r.ok) return null;
            const data = await r.json();
            if (data.encoding !== "base64" || !data.content) return null;
            const decoded = atob(data.content.replace(/\n/g, ""));
            // README gets 5k; all other files capped at 3k to stay within token budget
            const maxLen = /^readme\./i.test(filePath) ? 5000 : 3000;
            const content = decoded.length > maxLen ? decoded.slice(0, maxLen) + "\n... [truncated]" : decoded;
            return { path: filePath, content };
          } catch {
            return null;
          }
        };

        // Fetch in batches of 5 in parallel
        const BATCH = 5;
        for (let i = 0; i < scored.length; i += BATCH) {
          const batch = scored.slice(i, i + BATCH);
          const results = await Promise.all(batch.map((f) => fetchFile(f.path)));
          results.forEach((r) => {
            if (r) {
              fileContents += `\n\n${"─".repeat(60)}\n### ${r.path}\n${"─".repeat(60)}\n${r.content}`;
              loadedCount++;
            }
          });
        }
      } catch {}
      updateStage(2);

      // ── Stage 3: Commit history + contributors ───────────────────────────
      let commitHistory = "";
      try {
        const commitsRes = await fetch(
          `https://api.github.com/repos/${repo.full_name}/commits?per_page=30`,
          { headers }
        );
        if (commitsRes.ok) {
          const commits = await commitsRes.json() as Array<{
            sha: string;
            commit: { message: string; author: { name: string; date: string } };
          }>;
          commitHistory = `RECENT COMMITS (${commits.length} shown):\n` + commits
            .map((c) =>
              `  [${c.sha.slice(0, 7)}] ${c.commit.author.date.slice(0, 10)} | ${c.commit.author.name} | ${c.commit.message.split("\n")[0].slice(0, 120)}`
            )
            .join("\n");
        }
      } catch {}
      updateStage(3);

      // ── Stage 4: Assemble full context ──────────────────────────────────
      const SEP = "═".repeat(70);
      const fullContext = [
        SEP,
        "REPOSITORY OVERVIEW",
        SEP,
        repoMeta,
        "",
        languagesInfo,
        "",
        SEP,
        `FILE TREE (all non-binary files, up to 300 shown)`,
        SEP,
        fileTree,
        "",
        SEP,
        commitHistory,
        "",
        SEP,
        `SOURCE CODE — ${loadedCount} files loaded (ranked by importance)`,
        SEP,
        fileContents,
      ].join("\n");

      updateStage(4);
      setRepoContext(fullContext);
      setContextStats({ files: loadedCount, chars: fullContext.length });

      setMessages([{
        role: "assistant",
        content: `✅ **${repo.name}** is fully loaded and ready.\n\n**Context summary:**\n- **${loadedCount} source files** loaded (prioritised: README, configs, entry points, API routes, models)\n- **Full file tree** mapped\n- **Last 30 commits** included\n- **Language breakdown** + repo metadata\n\nYou can now ask me anything about this codebase — architecture, specific functions, bugs, security, how to extend it, or just *"explain this repo"*.`,
      }]);
    } catch (err) {
      console.error(err);
      setMessages([{ role: "assistant", content: "❌ Failed to load repository context. Please try again." }]);
    }

    setProcessing(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Trim context client-side BEFORE sending — this is the primary 413 guard.
  // Next.js dev server has a ~1 MB body limit; production is 4 MB.
  // Groq's token budget is ~60k chars anyway, so capping here loses nothing useful.
 

// ─────────────────────────────────────────────────────────────────────────────
// STREAMING PATCH for dashboard/page.tsx
// Replace the sendMessage function (and the constant above it) with this block.
// ─────────────────────────────────────────────────────────────────────────────
 
  // Trim context client-side BEFORE sending — this is the primary 413 guard.
  const MAX_CLIENT_CONTEXT_CHARS = 26_000; // Must match route.ts HARD_CAP
 
  const sendMessage = async () => {
    if (!input.trim() || !selectedRepo || loading) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
 
    // Add an empty assistant message that we'll fill token-by-token
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
 
    try {
      const trimmedContext =
        repoContext.length > MAX_CLIENT_CONTEXT_CHARS
          ? repoContext.slice(0, MAX_CLIENT_CONTEXT_CHARS) + "\n[pre-trimmed on client]"
          : repoContext;
 
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage], context: trimmedContext }),
      });
 
      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}));
        const detail = (errData as { detail?: string }).detail ?? "";
        let userMsg = "Failed to get a response. Please try again.";
        if (res.status === 413) {
          userMsg = "⚠️ This repository context is too large for the model. Try asking a more specific question, or select a smaller repository.";
        } else if (res.status === 429) {
          userMsg = "⚠️ Rate limit reached. Please wait a moment and try again.";
        } else if (detail) {
          userMsg = `⚠️ Error: ${detail}`;
        }
        // Replace the empty assistant placeholder with the error
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: userMsg },
        ]);
        setLoading(false);
        return;
      }
 
      // Read the SSE stream and append each token to the last message
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
 
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
 
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // keep incomplete last line
 
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const token: string = JSON.parse(data);
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              return [
                ...prev.slice(0, -1),
                { ...last, content: last.content + token },
              ];
            });
          } catch {
            // malformed chunk — skip
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "⚠️ Network error. Please check your connection and try again." },
      ]);
    }
 
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  const displayName = githubProfile?.name || user?.user_metadata?.full_name || user?.email || "Developer";
  const githubUsername = githubProfile?.username || user?.user_metadata?.user_name || "Connect GitHub";
  const userInitials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-5 border-b border-white/[0.07] bg-[#0a0a0a]/80 backdrop-blur-xl z-50 relative">
        <div className="flex items-center gap-2.5">
          <div aria-label="RepoMind" className="w-8 h-8 bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: "url(https://ik.imagekit.io/sl226drpx/grok-image-da915e64-fb0b-4722-9896-e90a54cc9528-removebg-preview.png)" }} />
          <span className="font-semibold text-[15px] tracking-tight text-white">RepoMind</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>V 1.0</span>
        </div>

        <div className="flex items-center gap-3 relative">
          <button onClick={fetchRepos} disabled={fetchingRepos}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium transition-all duration-200 disabled:opacity-60">
            {fetchingRepos ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Sync repos
          </button>

          <button onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] transition-all duration-200">
            {githubProfile?.avatarUrl ? (
              <div className="w-7 h-7 rounded-lg bg-cover bg-center ring-1 ring-white/10" style={{ backgroundImage: `url(${githubProfile.avatarUrl})` }} />
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 2px 8px -2px rgba(16,185,129,0.45)" }}>
                {userInitials}
              </div>
            )}
            <span className="hidden sm:block text-xs text-zinc-300 max-w-[140px] truncate">@{githubUsername}</span>
            <ChevronDown size={12} className="text-zinc-500" />
          </button>

          {userMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-[#141414] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 p-2 z-50"
              onClick={() => setUserMenuOpen(false)}>
              <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 mb-2">
                {githubProfile?.avatarUrl ? (
                  <div className="w-11 h-11 rounded-xl bg-cover bg-center ring-1 ring-white/10 flex-shrink-0" style={{ backgroundImage: `url(${githubProfile.avatarUrl})` }} />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-300 flex-shrink-0">{userInitials}</div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                  <p className="text-xs text-emerald-300 truncate">@{githubUsername}</p>
                </div>
              </div>
              {githubProfile?.profileUrl && (
                <a href={githubProfile.profileUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-colors rounded-xl">
                  <FaGithub size={13} /> View GitHub profile
                </a>
              )}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/[0.07] transition-colors rounded-xl">
                <LogOut size={13} /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0c0c0c]">
          <div className="p-3 border-b border-white/[0.06] space-y-3">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3 shadow-2xl shadow-black/20">
              <div className="flex items-center gap-3">
                {githubProfile?.avatarUrl ? (
                  <div className="w-12 h-12 rounded-2xl bg-cover bg-center ring-1 ring-white/10 flex-shrink-0" style={{ backgroundImage: `url(${githubProfile.avatarUrl})` }} />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-300 flex-shrink-0">{userInitials}</div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                  <a href={githubProfile?.profileUrl ?? "https://github.com"} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200 truncate">
                    <FaGithub size={12} /> @{githubUsername}
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="rounded-xl bg-black/20 border border-white/[0.06] px-2.5 py-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500"><BookOpen size={11} /> Repos</div>
                  <p className="text-sm font-semibold text-white mt-0.5">{githubProfile?.publicRepos ?? repos.length}</p>
                </div>
                <div className="rounded-xl bg-black/20 border border-white/[0.06] px-2.5 py-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500"><Users size={11} /> Followers</div>
                  <p className="text-sm font-semibold text-white mt-0.5">{githubProfile?.followers ?? "—"}</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search repositories…"
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] transition-all" />
            </div>
            <button onClick={fetchRepos} disabled={fetchingRepos}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 4px 14px -4px rgba(16,185,129,0.45)" }}>
              {fetchingRepos ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              {fetchingRepos ? "Loading…" : "Load repositories"}
            </button>
          </div>

          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>Repositories</span>
            {repos.length > 0 && <span className="text-[10px] text-zinc-600" style={{ fontFamily: "'DM Mono', monospace" }}>{filteredRepos.length}</span>}
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
            {fetchingRepos ? (
              <div className="px-2"><RepoSkeleton /></div>
            ) : filteredRepos.length > 0 ? (
              filteredRepos.map((repo) => {
                const isActive = selectedRepo?.id === repo.id;
                const langColor = LANG_COLORS[repo.language] ?? LANG_COLORS.default;
                return (
                  <button key={repo.id} onClick={() => processRepository(repo)} disabled={processing}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group ${isActive ? "border-emerald-500/30 shadow-sm" : "bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/[0.07]"}`}
                    style={isActive ? { background: "rgba(16,185,129,0.08)", boxShadow: "0 1px 12px -4px rgba(16,185,129,0.2)" } : {}}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Code2 size={11} className={isActive ? "text-emerald-400" : "text-zinc-600 group-hover:text-zinc-400"} />
                        <span className={`text-xs font-semibold truncate ${isActive ? "text-white" : "text-zinc-300"}`}>{repo.name}</span>
                      </div>
                      {isActive && processing && <RefreshCw size={10} className="text-emerald-400 animate-spin flex-shrink-0" />}
                    </div>
                    {repo.description && <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed mb-1.5">{repo.description}</p>}
                    <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: langColor }} />
                          {repo.language}
                        </span>
                      )}
                      {repo.stargazers_count > 0 && <span className="flex items-center gap-0.5"><Star size={9} />{repo.stargazers_count}</span>}
                      {repo.updated_at && <span className="flex items-center gap-0.5 ml-auto"><Clock size={9} />{relativeTime(repo.updated_at)}</span>}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-3">
                  <GitBranch size={20} className="text-zinc-600" />
                </div>
                <p className="text-xs font-medium text-zinc-400 mb-1">No repositories yet</p>
                <p className="text-[11px] text-zinc-600 leading-relaxed">Load your repositories to get started</p>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-white/[0.06]">
            <button onClick={connectGitHub}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] hover:border-emerald-500/20 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-all duration-200">
              <FaGithub size={12} /> Connect GitHub
            </button>
          </div>
        </aside>

        {/* ── Chat area ────────────────────────────────────────────────── */}
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
                  {contextStats && !processing && (
                    <div className="hidden sm:flex items-center gap-1.5 ml-2 text-[10px] text-zinc-500 bg-white/[0.03] border border-white/[0.06] px-2 py-1 rounded-lg" style={{ fontFamily: "'DM Mono', monospace" }}>
                      <CheckCircle2 size={9} className="text-emerald-500" />
                      {contextStats.files} files · {(contextStats.chars / 1000).toFixed(0)}k ctx
                    </div>
                  )}
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
            {/* Empty state */}
            {messages.length === 0 && !selectedRepo && !processing && (
              <div className="flex flex-col items-center justify-center h-full gap-6 text-center max-w-lg mx-auto">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-3xl scale-150" style={{ background: "rgba(16,185,129,0.15)" }} />
                  <div className="relative w-20 h-20 rounded-3xl border flex items-center justify-center"
                    style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.25)", boxShadow: "0 8px 40px -12px rgba(16,185,129,0.3)" }}>
                    <Sparkles size={28} className="text-emerald-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">Ask anything about your code</h2>
                  <p className="text-zinc-500 text-sm leading-relaxed">Select a repository from the sidebar. RepoMind will load source files, commit history, and metadata so you can ask anything about the codebase.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {SUGGESTED_QUESTIONS.slice(0, 4).map((s) => (
                    <div key={s} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs text-zinc-500 text-left hover:border-emerald-500/25 hover:bg-emerald-500/[0.04] hover:text-zinc-300 cursor-default transition-all">{s}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Live loading stages */}
            {processing && loadingStages.length > 0 && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.25)" }}>
                  <Sparkles size={12} className="text-emerald-400" />
                </div>
                <div className="bg-[#141414] border border-white/[0.07] px-4 py-3 rounded-2xl rounded-bl-sm min-w-[260px]">
                  <p className="text-xs text-zinc-500 mb-2.5">Building deep context for {selectedRepo?.name}…</p>
                  <LoadingStages stages={loadingStages} />
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.25)", boxShadow: "0 4px 12px -4px rgba(16,185,129,0.2)" }}>
                    <Sparkles size={12} className="text-emerald-400" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === "user" ? "text-white rounded-br-sm" : "bg-[#141414] border border-white/[0.07] text-zinc-200 rounded-bl-sm"}`}
                  style={msg.role === "user" ? { background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 0 0 1px rgba(16,185,129,0.25), 0 8px 32px -8px rgba(16,185,129,0.35)" } : {}}>
                  <MessageContent content={msg.content} />
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 4px 12px -4px rgba(16,185,129,0.4)" }}>
                    {userInitials}
                  </div>
                )}
              </div>
            ))}

            {/* Suggested questions after first message */}
            {messages.length === 1 && !loading && !processing && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 flex-shrink-0" />
                <div className="flex flex-wrap gap-2 max-w-[80%]">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button key={q}
                      onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-xs text-zinc-400 hover:text-zinc-200 hover:border-emerald-500/25 hover:bg-emerald-500/[0.04] transition-all text-left">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.25)" }}>
                  <Sparkles size={12} className="text-emerald-400" />
                </div>
                <div className="bg-[#141414] border border-white/[0.07] px-4 py-3.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
                      style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 px-6 pb-6 pt-3">
            <div className="h-px mb-4" style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.2), transparent)" }} />
            <div className="relative flex items-end gap-3 bg-[#141414] border border-white/[0.09] rounded-2xl px-4 py-3 transition-all duration-300 focus-within:border-emerald-500/35 focus-within:[box-shadow:0_0_0_1px_rgba(16,185,129,0.12),0_0_40px_rgba(16,185,129,0.07)]">
              <textarea ref={inputRef} value={input}
                onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"; }}
                onKeyDown={handleKeyDown}
                placeholder={selectedRepo ? `Ask anything about ${selectedRepo.name}…` : "Select a repository to start chatting"}
                disabled={!selectedRepo || processing} rows={1}
                className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed disabled:opacity-40 disabled:cursor-not-allowed min-h-[24px]"
                style={{ maxHeight: "160px" }} />
              <button onClick={sendMessage} disabled={!selectedRepo || !input.trim() || loading || processing}
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: (!selectedRepo || !input.trim() || loading || processing) ? "#27272a" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  boxShadow: (!selectedRepo || !input.trim() || loading || processing) ? "none" : "0 4px 14px -4px rgba(16,185,129,0.55)",
                }}>
                <Send size={14} className="text-white" />
              </button>
            </div>
            <p className="text-[10px] text-zinc-700 mt-1.5 ml-1" style={{ fontFamily: "'DM Mono', monospace" }}>
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}