"use client";

import { useState, useEffect, useRef } from "react";
import { useUserContext } from "./hooks/userContext";
import {
  Brain,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Wand2,
  LogIn,
  LogOut,
  CheckCircle2,
  History,
  Activity,
  Cpu,
  Clock,
  Trash2,
  Loader2,
  X,
  Compass,
  Zap,
  ShieldCheck,
  Copy,
  Check
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import InitialLoader from "./components/InitialLoader";
import ThemeToggle from "./components/ThemeToggle";
import { AI_PROCESSING_WORDS } from "@/lib/aiProcessingWords";

/* ─── Sample Speculations (shown to unauthenticated / guest users) ─── */
const sampleSpeculations = [
  {
    id: "sample_1",
    category: "ARCHITECTURE",
    categoryClass: "violet",
    title: "What if we built cities under the ocean?",
    desc: "Exploring structural demands, societal shifts, and biological impacts of a deep-sea civilization adapting to high pressure and zero sunlight.",
    timeAgo: "Sample Scenario",
    wide: true,
  },
  {
    id: "sample_2",
    category: "PHYSICS",
    categoryClass: "cyan",
    title: "What if gravity was 20% weaker?",
    desc: "Analyzing architectural structural shifts, atmospheric changes, and athletic adaptations.",
    timeAgo: "Sample Scenario",
    wide: false,
  },
  {
    id: "sample_3",
    category: "BIOLOGY",
    categoryClass: "green",
    title: "What if sleep was optional?",
    desc: "Evaluating economic productivity gains, neurological effects, and human lifespan redesign.",
    timeAgo: "Sample Scenario",
    wide: false,
  },
  {
    id: "sample_4",
    category: "HISTORY",
    categoryClass: "violet",
    title: "What if the Library of Alexandria never burned?",
    desc: "Tracing potential technological acceleration and scientific advances preserved from ancient times.",
    timeAgo: "Sample Scenario",
    wide: true,
  },
];

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    setNodes,
    setEdges,
    setFlowData,
    setCurrentHistoryId,
    setUserPrompt
  } = useUserContext();
  const [inputText, setInputText] = useState("");
  const [historyItems, setHistoryItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingWordIndex, setLoadingWordIndex] = useState(0);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const textareaRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  /* ─── Rotate AI processing word array while submitting ─── */
  useEffect(() => {
    if (!isSubmitting) {
      setLoadingWordIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingWordIndex((prev) => (prev + 1) % AI_PROCESSING_WORDS.length);
    }, 1700);

    return () => clearInterval(interval);
  }, [isSubmitting]);

  const handleCopyPrompt = (e, text, id) => {
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 1800);
    }
  };

  /* ─── Fetch history once auth resolves ─── */
  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }
    if (status === "authenticated") {
      setIsLoading(true);
      async function fetchUserHistory() {
        try {
          const res = await fetch("/api/history");
          const data = await res.json();
          if (data.success && data.history) {
            setHistoryItems(data.history);
          }
        } catch (err) {
          console.error("Error fetching prompt history:", err);
        } finally {
          setIsLoading(false);
        }
      }
      fetchUserHistory();
    } else {
      setIsLoading(false);
    }
  }, [status]);

  /* ─── Handlers ─── */
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    // If unauthenticated, show glassmorphic sign-in modal instead of failing
    if (!session) {
      setShowSignInModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      let res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPrompt: inputText }),
      });
      let data = await res.json();
      if (data.success && data.data) {
        setUserPrompt(inputText.trim());
        setNodes(data.data.output_1_paths);
        setEdges(data.data.output_2_flow_edges);
        setFlowData(data.data.output_3_recommendation_and_advice);
        if (setCurrentHistoryId) setCurrentHistoryId(data._id || null);
        const newHistoryItem = {
          _id: data._id || `temp_${Date.now()}`,
          userPrompt: inputText.trim(),
          ai_response: data.data,
          createdAt: new Date().toISOString(),
        };
        setHistoryItems((prev) => [newHistoryItem, ...prev]);
        setInputText("");
        router.push("/hi");
      } else {
        alert(data.error || "Failed to generate scenario. Please sign in to continue.");
      }
    } catch (err) {
      console.error("Submission Error:", err);
      alert("An error occurred while submitting scenario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectHistoryItem = (item) => {
    router.push(`/hi/${item._id}`);
  };

  const handleDeleteHistoryItem = async (e, id) => {
    e.stopPropagation();
    try {
      setHistoryItems((prev) => prev.filter((item) => item._id !== id));
      await fetch(`/api/history?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  /* ═══════════════════════════════════════════════ */
  /*  RENDER                                         */
  /* ═══════════════════════════════════════════════ */
  if (isLoading) {
    return <InitialLoader />;
  }

  return (
    <div className="page-shell">
      {/* Ambient Glow Orbs */}
      <div className="glow-accent" />
      <div className="glow-accent-secondary" />

      {/* ─── Glass Navigation ─── */}
      <nav className="glass-nav">
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            <div className="nav-brand-icon">
              <img src="/logo.svg" alt="What If Logo" className="nav-brand-logo-img" />
            </div>
            <span className="nav-brand-text">What If</span>
          </Link>

          <div className="nav-links">
            <Link href="/" className="nav-link active">Explore</Link>
            <Link href="/hi" className="nav-link">Map</Link>
            <Link href="/profile" className="nav-link">Profile</Link>
          </div>

          <div className="nav-profile">
            <ThemeToggle />
            {session ? (
              <>
                <Link
                  href="/profile"
                  className="nav-avatar"
                  title={session.user.name || session.user.email}
                  style={{ textDecoration: 'none' }}
                >
                  {session.user.image ? (
                    <img alt="Profile" src={session.user.image} />
                  ) : (
                    (session.user.name || session.user.email || "U")[0].toUpperCase()
                  )}
                </Link>
                <button onClick={() => signOut()} className="nav-signout">
                  <LogOut size={12} /> Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" className="nav-signin">
                <LogIn size={14} /> Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Main Content ─── */}
      <main className="main-content visible">



        {/* Hero Section & Input Form */}
        <section className="hero-section">
          <h1 className="hero-title">
            What if <span className="accent">everything changed</span>?
          </h1>

          <form onSubmit={handleSubmit} className="input-form">
            <div className="speculative-input">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="What if the world was powered by bioluminescence?"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSubmitting}
                className={`btn-explore ${isSubmitting ? "is-submitting" : ""}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    <span key={loadingWordIndex} className="ai-processing-text">
                      {AI_PROCESSING_WORDS[loadingWordIndex]}
                    </span>
                  </>
                ) : (
                  <>
                    <span>Explore</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ─── Speculations Section ─── */}
        <section>
          <div className="speculations-header">
            <div className="speculations-title-group">
              <div className="speculations-dot" />
              <h2 className="speculations-title">
                {session ? "Your Speculations" : "Featured Sample Scenarios"}
              </h2>
            </div>
          </div>

          <div className="bento-grid">
            {session && historyItems.length > 0 ? (
              historyItems.map((item, idx) => {
                const isWide = idx % 3 === 0;
                return (
                  <div
                    key={item._id}
                    onClick={() => handleSelectHistoryItem(item)}
                    className={`bento-card ${isWide ? "wide" : ""}`}
                  >
                    <div className="bento-card-top">
                      <span className="bento-category violet">
                        Scenario #{item._id.slice(-4)}
                      </span>
                      <div className="bento-card-actions">
                        <button
                          onClick={(e) => handleCopyPrompt(e, item.userPrompt, item._id)}
                          title="Copy prompt to clipboard"
                          className="bento-delete-btn"
                          style={{
                            color: copiedId === item._id ? '#10b981' : undefined,
                          }}
                        >
                          {copiedId === item._id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button
                          onClick={(e) => handleDeleteHistoryItem(e, item._id)}
                          title="Delete scenario"
                          className="bento-delete-btn"
                        >
                          <Trash2 size={14} />
                        </button>
                        <ArrowUpRight size={18} className="bento-arrow" />
                      </div>
                    </div>

                    <h3 className="bento-card-title">{item.userPrompt}</h3>

                    <div className="bento-card-time">
                      <Clock size={14} />
                      <span>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })
                          : "Recently"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Display interactive sample scenario cards for guest/unauthenticated users */
              sampleSpeculations.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => {
                    setInputText(sample.title);
                    if (textareaRef.current) textareaRef.current.focus();
                  }}
                  className={`bento-card ${sample.wide ? "wide" : ""}`}
                >
                  <div className="bento-card-top">
                    <span className={`bento-category ${sample.categoryClass}`}>
                      {sample.category}
                    </span>
                    <div className="bento-card-actions">
                      <button
                        onClick={(e) => handleCopyPrompt(e, sample.title, sample.id)}
                        title="Copy prompt to clipboard"
                        className="bento-delete-btn"
                        style={{
                          color: copiedId === sample.id ? '#10b981' : undefined,
                        }}
                      >
                        {copiedId === sample.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <ArrowUpRight size={18} className="bento-arrow" />
                    </div>
                  </div>

                  <h3 className="bento-card-title">{sample.title}</h3>

                  {sample.desc && (
                    <p className="bento-card-desc">{sample.desc}</p>
                  )}

                  <div className="bento-card-time">
                    <Clock size={14} />
                    <span>{sample.timeAgo} &bull; Click to pre-fill</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* ─── Glassmorphic Sign-In Modal (when unauthenticated user attempts submission) ─── */}
      {showSignInModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(16px)',
          padding: '24px',
          animation: 'modal-fade-in 0.3s ease',
        }}>
          <div style={{
            background: 'rgba(18, 18, 26, 0.9)',
            backdropFilter: 'blur(28px)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            borderRadius: '24px',
            padding: '36px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(139, 92, 246, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowSignInModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 24px rgba(124, 58, 237, 0.5)',
            }}>
              <LogIn size={26} />
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
              Sign In Required
            </h3>

            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.65)', margin: 0, lineHeight: 1.55 }}>
              Please sign in to your account to generate custom AI decision trees, explore multi-branch scenarios, and save your prompt history.
            </p>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button
                onClick={() => setShowSignInModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <Link
                href="/login"
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
                }}
              >
                <LogIn size={16} />
                <span>Sign In Now</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="page-footer">
        <p>What If &mdash; Explore decision pathways and cognitive scenarios.</p>
      </footer>
    </div>
  );
}
