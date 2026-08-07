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
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import InitialLoader from "./components/InitialLoader";

/* ─── Sample Speculations (shown when user has no history) ─── */
// const sampleSpeculations = [
//   {
//     id: "sample_1",
//     category: "ARCHITECTURE",
//     categoryClass: "violet",
//     title: "What if we built cities under the ocean?",
//     desc: "Exploring the structural demands, societal shifts, and biological impacts of a deep-sea civilization adapting to high pressure and zero sunlight.",
//     timeAgo: "3 days ago",
//     wide: true,
//   },
//   {
//     id: "sample_2",
//     category: "PHYSICS",
//     categoryClass: "cyan",
//     title: "What if gravity was 20% weaker?",
//     desc: null,
//     timeAgo: "2 days ago",
//     wide: false,
//   },
//   {
//     id: "sample_3",
//     category: "BIOLOGY",
//     categoryClass: "green",
//     title: "What if sleep was optional?",
//     desc: null,
//     timeAgo: "1 week ago",
//     wide: false,
//   },
//   {
//     id: "sample_4",
//     category: "HISTORY",
//     categoryClass: "violet",
//     title: "What if the Library of Alexandria never burned?",
//     desc: "Tracing the potential technological acceleration and shifts in geopolitical power if ancient knowledge had been perfectly preserved and expanded upon.",
//     timeAgo: "5 days ago",
//     wide: true,
//   },
// ];



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
  const textareaRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  /* ─── Fetch history once auth resolves ─── */
  useEffect(() => {
    setIsLoading(true);
    async function fetchUserHistory() {
      if (status === "authenticated") {
        try {
          const res = await fetch("/api/history");
          const data = await res.json();
          if (data.success && data.history) {
            setHistoryItems(data.history);
          }
        } catch (err) {
          console.error("Error fetching prompt history:", err);
        }
        finally{
         setIsLoading(false);
        }
      }
    }
    fetchUserHistory();
  }, [status]);

  /* ─── Handlers ─── */
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isSubmitting) return;
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
    // Navigate to /hi/{_id} — the dynamic page fetches its own data from the API
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
              <Brain size={18} />
            </div>
            <span className="nav-brand-text">What If</span>
          </Link>

          <div className="nav-links">
            <Link href="/" className="nav-link active">Explore</Link>
            <Link href="/hi" className="nav-link">Map</Link>
          </div>

          <div className="nav-profile">
            {session ? (
              <>
                <div
                  className="nav-avatar"
                  title={session.user.name || session.user.email}
                >
                  {session.user.image ? (
                    <img alt="Profile" src={session.user.image} />
                  ) : (
                    (session.user.name || session.user.email || "U")[0].toUpperCase()
                  )}
                </div>
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
        {/* Hero */}
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
                className="btn-explore"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    <span>Exploring...</span>
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

        {/* ─── Your Speculations ─── */}
        <section>
          <div className="speculations-header">
            <div className="speculations-title-group">
              <div className="speculations-dot" />
              <h2 className="speculations-title">Your Speculations</h2>
            </div>
          </div>

          <div className="bento-grid">
            {historyItems.length > 0
              ? historyItems.map((item, idx) => {
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
              : (<div>
                <p>No history items found.</p>
                </div>)
            }
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="page-footer">
        <p>What If &mdash; Explore decision pathways and cognitive scenarios.</p>
      </footer>
    </div>
  );
}
