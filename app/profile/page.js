"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";
import {
  Brain,
  Sparkles,
  Shield,
  Zap,
  Target,
  ArrowRight,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
  Check,
  Compass,
  Layers,
  Activity,
  LogOut,
  UserCheck,
  TrendingUp,
} from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [savedDecisions, setSavedDecisions] = useState([]);
  const [stats, setStats] = useState({
    totalScenariosCreated: 0,
    totalSavedDecisions: 0,
    acceptedAiCount: 0,
    aiAcceptanceRate: 0,
    totalStepsInPaths: 0,
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMsg, setAnalysisMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [deletingId, setDeletingId] = useState(null);

  /* Auth guard */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  /* Fetch Profile & Saved Decisions Data */
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.success) {
        setProfileData(data.profile);
        setSavedDecisions(data.savedDecisions || []);
        setStats(
          data.stats || {
            totalScenariosCreated: 0,
            totalSavedDecisions: 0,
            acceptedAiCount: 0,
            aiAcceptanceRate: 0,
            totalStepsInPaths: 0,
          }
        );
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  /* Re-analyze Character Profile */
  const handleReanalyze = async () => {
    if (analyzing) return;
    try {
      setAnalyzing(true);
      setAnalysisMsg("");
      const res = await fetch("/api/user/profile", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAnalysisMsg("Character profile updated!");
        await fetchProfile();
        setTimeout(() => setAnalysisMsg(""), 3000);
      }
    } catch (err) {
      console.error("Error re-analyzing profile:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  /* Delete a Saved Decision */
  const handleDeleteSaved = async (objId) => {
    if (!objId || deletingId) return;
    try {
      setDeletingId(objId);
      const res = await fetch(`/api/history/save-decision?obj_id=${objId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSavedDecisions((prev) => prev.filter((d) => d.obj_id !== objId));
        setStats((prev) => ({
          ...prev,
          totalSavedDecisions: Math.max(0, prev.totalSavedDecisions - 1),
        }));
      }
    } catch (err) {
      console.error("Error deleting decision:", err);
    } finally {
      setDeletingId(null);
    }
  };

  /* Filter decisions */
  const filteredDecisions = savedDecisions.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.userPrompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.chosenPath?.some(
        (p) =>
          p.pathName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.story?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (!matchesSearch) return false;

    if (filterType === "ai") return item.acceptedAiRecommendation === true;
    if (filterType === "custom") return item.acceptedAiRecommendation === false;
    return true;
  });

  if (status === "loading" || loading) {
    return (
      <div className="prof-loading-screen">
        <div className="prof-loader-spinner" />
        <span className="prof-loader-text">Loading Cognitive Profile...</span>
        <style>{`
          .prof-loading-screen {
            width: 100vw; height: 100vh; background: #06070a;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 16px; font-family: 'Sora', sans-serif; color: #fafafa;
          }
          .prof-loader-spinner {
            width: 44px; height: 44px; border-radius: 50%;
            border: 2px solid rgba(139, 92, 246, 0.15);
            border-top-color: #8b5cf6; animation: prof-spin 0.9s linear infinite;
          }
          .prof-loader-text { font-size: 13px; color: rgba(255, 255, 255, 0.4); }
          @keyframes prof-spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const user = session?.user || {};
  const userInitials = (user.name || user.email || "U")[0].toUpperCase();
  const riskTolerance = profileData?.riskTolerance || "Balanced";
  const decisionStyle = profileData?.decisionStyle || "Calculated Risk-Taker";
  const traitsSummary =
    profileData?.traitsSummary ||
    "The user exhibits a nuanced approach to risk, favoring soft probing and low-risk testing in sensitive personal scenarios while embracing ambitious, high-stakes ventures in career decisions. They combine cautious initial validation with a willingness to execute bold moves.";

  return (
    <div className="prof-page-root">
      {/* Background Glow */}
      <div className="prof-bg-glow" />

      {/* Floating Glass Navigation */}
      <nav className="glass-nav">
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            <div className="nav-brand-icon">
              <img src="/logo.svg" alt="What If Logo" className="nav-brand-logo-img" />
            </div>
            <span className="nav-brand-text">What If</span>
          </Link>

          <div className="nav-links">
            <Link href="/" className="nav-link">
              Explore
            </Link>
            <Link href="/hi" className="nav-link">
              Map
            </Link>
            <Link href="/profile" className="nav-link active">
              Profile
            </Link>
          </div>

          <div className="nav-profile">
            <ThemeToggle />
            <div className="nav-avatar" title={user.name || user.email}>
              {user.image ? <img alt="Profile" src={user.image} /> : userInitials}
            </div>
            <button onClick={() => signOut()} className="nav-signout">
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="prof-main-container">
        {/* ─── Card 1: User Identity & Stats Card ─── */}
        <section className="prof-card-block">
          <div className="prof-user-row">
            <div className="prof-avatar-glow-container">
              {user.image ? (
                <img src={user.image} alt={user.name} className="prof-user-avatar-img" />
              ) : (
                <div className="prof-user-avatar-fallback">{userInitials}</div>
              )}
            </div>

            <div className="prof-user-details">
              <div className="prof-name-verified-row">
                <h1 className="prof-display-name">{user.name || "Aswin Vijayan"}</h1>
                <span className="prof-verified-pill">
                  <Shield size={12} /> Verified Analyst
                </span>
              </div>
              <p className="prof-display-email">{user.email || "aswinvijayan.c.s@gmail.com"}</p>
            </div>
          </div>

          {/* 4 Stats Grid Cards */}
          <div className="prof-stats-4grid">
            <div className="prof-stat-box">
              <div className="prof-stat-icon-circle purple-icon">
                <Layers size={18} />
              </div>
              <div className="prof-stat-num">{stats.totalScenariosCreated}</div>
              <div className="prof-stat-sublabel">Scenarios Created</div>
            </div>

            <div className="prof-stat-box">
              <div className="prof-stat-icon-circle cyan-icon">
                <Target size={18} />
              </div>
              <div className="prof-stat-num">{stats.totalSavedDecisions}</div>
              <div className="prof-stat-sublabel">Saved Paths</div>
            </div>

            <div className="prof-stat-box">
              <div className="prof-stat-icon-circle pink-icon">
                <Zap size={18} />
              </div>
              <div className="prof-stat-num">{stats.aiAcceptanceRate}%</div>
              <div className="prof-stat-sublabel">AI Recommendation Rate</div>
            </div>

            <div className="prof-stat-box">
              <div className="prof-stat-icon-circle indigo-icon">
                <TrendingUp size={18} />
              </div>
              <div className="prof-stat-num">{stats.totalStepsInPaths}</div>
              <div className="prof-stat-sublabel">Executed Steps</div>
            </div>
          </div>
        </section>

        {/* ─── Card 2: AI Decision Character Profile ─── */}
        <section className="prof-card-block">
          <div className="prof-header-flex-row">
            <div className="prof-title-left-group">
              <div className="prof-ai-head-icon">
                <Brain size={22} />
              </div>
              <div>
                <h2 className="prof-main-title">AI Decision Character Profile</h2>
                <div className="prof-sub-meta-header">
                  BEHAVIORAL MINDSET &amp; BEHAVIORAL FINGERPRINT
                </div>
              </div>
            </div>

            <button onClick={handleReanalyze} disabled={analyzing} className="prof-refresh-pill-btn">
              <RefreshCw size={13} className={analyzing ? "prof-spin-icon" : ""} />
              <span>{analyzing ? "Analyzing..." : "Refresh AI Profile"}</span>
            </button>
          </div>

          {analysisMsg && <div className="prof-toast-notif">{analysisMsg}</div>}

          {/* 2-Column Trait Cards */}
          <div className="prof-traits-2col-grid">
            <div className="prof-trait-item-card">
              <span className="prof-trait-item-label">RISK TOLERANCE</span>
              <div className="prof-trait-value-pill">
                <Shield size={14} />
                <span>{riskTolerance}</span>
              </div>
            </div>

            <div className="prof-trait-item-card">
              <span className="prof-trait-item-label">DECISION STYLE</span>
              <div className="prof-trait-value-pill">
                <Sparkles size={14} />
                <span>{decisionStyle}</span>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="prof-traits-summary-card">
            <div className="prof-summary-glowing-indicator" />
            <p className="prof-summary-paragraph">{traitsSummary}</p>
          </div>
        </section>

        {/* ─── Card 3: Saved Decisions Journeys Log ─── */}
        <section className="prof-card-block">
          <div className="prof-header-flex-row">
            <div>
              <h2 className="prof-main-title">Saved Decision Journeys</h2>
              <div className="prof-sub-meta-header">HISTORICAL DECISION PATH LOGS</div>
            </div>

            {/* Filter Tabs */}
            <div className="prof-filter-pill-bar">
              <button
                onClick={() => setFilterType("all")}
                className={`prof-filter-btn ${filterType === "all" ? "active" : ""}`}
              >
                All ({savedDecisions.length})
              </button>
              <button
                onClick={() => setFilterType("ai")}
                className={`prof-filter-btn ${filterType === "ai" ? "active" : ""}`}
              >
                <Zap size={12} /> AI Recommended
              </button>
              <button
                onClick={() => setFilterType("custom")}
                className={`prof-filter-btn ${filterType === "custom" ? "active" : ""}`}
              >
                <Target size={12} /> Custom Saved
              </button>
            </div>
          </div>

          {savedDecisions.length > 0 && (
            <div className="prof-search-bar">
              <Search size={15} className="prof-search-icon" />
              <input
                type="text"
                placeholder="Search decision journeys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="prof-search-input"
              />
            </div>
          )}

          {filteredDecisions.length > 0 ? (
            <div className="prof-decisions-stack">
              {filteredDecisions.map((item, idx) => {
                const mapId = item.obj_id?.toString() || item._id?.toString();
                const isAiAcc = item.acceptedAiRecommendation;
                const formattedDate = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Saved";

                return (
                  <div key={item._id || idx} className="prof-journey-card">
                    <div className="prof-journey-header">
                      <div className="prof-journey-title-wrap">
                        <span className={`prof-journey-badge ${isAiAcc ? "ai-badge" : "custom-badge"}`}>
                          {isAiAcc ? (
                            <>
                              <Zap size={11} /> AI Recommendation Adopted
                            </>
                          ) : (
                            <>
                              <Target size={11} /> Custom Path Saved
                            </>
                          )}
                        </span>
                        <h3 className="prof-journey-prompt">{item.userPrompt}</h3>
                      </div>

                      <div className="prof-journey-actions">
                        <span className="prof-journey-date">{formattedDate}</span>
                        {mapId && (
                          <Link href={`/hi/${mapId}`} className="prof-open-map-btn">
                            <span>Open Map</span>
                            <ExternalLink size={12} />
                          </Link>
                        )}
                        {mapId && (
                          <button
                            onClick={() => handleDeleteSaved(mapId)}
                            disabled={deletingId === mapId}
                            className="prof-del-btn"
                            title="Delete Decision"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="prof-journey-timeline">
                      {item.chosenPath?.map((step, stepIdx) => (
                        <div key={stepIdx} className="prof-timeline-step">
                          <div className="prof-timeline-step-head">
                            <span className="prof-step-idx">{stepIdx + 1}.</span>
                            <span className="prof-step-title">{step.pathName}</span>
                            {step.category && (
                              <span className={`prof-cat-tag cat-${step.category}`}>
                                {step.category}
                              </span>
                            )}
                          </div>
                          {step.story && <p className="prof-step-desc">{step.story}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="prof-empty-state">
              <Compass size={36} color="#8b5cf6" />
              <h3>No Saved Journeys</h3>
              <p>
                {searchQuery
                  ? "No decision paths matched your query."
                  : "Save chosen decision paths in scenario maps to build your psychological decision log."}
              </p>
              <Link href="/hi" className="prof-launch-btn">
                <Sparkles size={14} />
                <span>Launch Scenario Studio</span>
              </Link>
            </div>
          )}
        </section>
      </main>

      <style>{`
        .prof-page-root {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
          overflow-x: hidden;
          padding-top: 104px;
          padding-bottom: 80px;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .prof-bg-glow {
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 800px; height: 600px;
          background: var(--glow-orb-1);
          pointer-events: none;
          z-index: 0;
          transition: background 0.3s ease;
        }

        .prof-main-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: relative;
          z-index: 10;
        }

        /* ─── Card Block Base Style ─── */
        .prof-card-block {
          background: var(--card-bg);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--card-border);
          border-radius: 24px;
          padding: 32px 36px;
          box-shadow: var(--card-shadow);
          display: flex;
          flex-direction: column;
          gap: 28px;
          transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }

        /* ─── User Profile Row ─── */
        .prof-user-row {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .prof-avatar-glow-container {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          padding: 3px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(6, 182, 212, 0.3));
          box-shadow: 0 0 24px rgba(139, 92, 246, 0.35);
          flex-shrink: 0;
        }
        .prof-user-avatar-img {
          width: 100%; height: 100%;
          border-radius: 50%; object-fit: cover;
        }
        .prof-user-avatar-fallback {
          width: 100%; height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; font-weight: 700; color: #ffffff;
        }

        .prof-user-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .prof-name-verified-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .prof-display-name {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          margin: 0;
        }

        .prof-verified-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          background: rgba(139, 92, 246, 0.1);
          color: var(--accent-purple);
          border: 1px solid rgba(139, 92, 246, 0.25);
          padding: 3px 12px;
          border-radius: 9999px;
        }

        .prof-display-email {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
        }

        /* ─── 4 Stats Cards Grid ─── */
        .prof-stats-4grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        @media (max-width: 768px) {
          .prof-stats-4grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .prof-stat-box {
          background: var(--input-bg);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 22px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        .prof-stat-icon-circle {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .purple-icon { background: rgba(139, 92, 246, 0.12); color: var(--accent-purple); }
        .cyan-icon { background: rgba(6, 182, 212, 0.12); color: #0891b2; }
        [data-theme="dark"] .cyan-icon { color: #67e8f9; }
        .pink-icon { background: rgba(236, 72, 153, 0.12); color: #db2777; }
        [data-theme="dark"] .pink-icon { color: #f472b6; }
        .indigo-icon { background: rgba(99, 102, 241, 0.12); color: #4f46e5; }
        [data-theme="dark"] .indigo-icon { color: #a5b4fc; }

        .prof-stat-num {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }

        .prof-stat-sublabel {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary);
          line-height: 1.3;
        }

        /* ─── AI Profile Header ─── */
        .prof-header-flex-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .prof-title-left-group {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .prof-ai-head-icon {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.3);
          color: var(--accent-purple);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 16px rgba(139, 92, 246, 0.25);
        }
        [data-theme="light"] .prof-ai-head-icon {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.18), rgba(79, 70, 229, 0.14));
          border-color: rgba(124, 58, 237, 0.4);
          color: #6d28d9;
          box-shadow: 0 0 16px rgba(124, 58, 237, 0.25);
        }

        .prof-main-title {
          font-size: 19px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.01em;
        }

        .prof-sub-meta-header {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .prof-refresh-pill-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid var(--card-border);
          color: var(--text-primary);
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .prof-refresh-pill-btn:hover:not(:disabled) {
          background: rgba(139, 92, 246, 0.18);
          border-color: rgba(139, 92, 246, 0.35);
        }

        [data-theme="light"] .prof-refresh-pill-btn {
          background: rgba(124, 58, 237, 0.12);
          border-color: rgba(124, 58, 237, 0.3);
          color: #6d28d9;
          font-weight: 700;
        }
        [data-theme="light"] .prof-refresh-pill-btn:hover:not(:disabled) {
          background: rgba(124, 58, 237, 0.22);
          border-color: rgba(124, 58, 237, 0.5);
        }

        .prof-toast-notif {
          padding: 8px 16px;
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #16a34a;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        [data-theme="dark"] .prof-toast-notif { color: #86efac; }

        /* 2-Column Traits Grid */
        .prof-traits-2col-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        @media (max-width: 640px) {
          .prof-traits-2col-grid {
            grid-template-columns: 1fr;
          }
        }

        .prof-trait-item-card {
          background: var(--input-bg);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .prof-trait-item-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .prof-trait-value-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 18px;
          border-radius: 9999px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.25);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          width: fit-content;
        }

        [data-theme="light"] .prof-trait-value-pill {
          background: rgba(124, 58, 237, 0.12);
          border-color: rgba(124, 58, 237, 0.3);
          color: #6d28d9;
          font-weight: 700;
        }

        /* Summary Card */
        .prof-traits-summary-card {
          position: relative;
          background: var(--input-bg);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 24px 28px 24px 32px;
          overflow: hidden;
        }

        .prof-summary-glowing-indicator {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, #8b5cf6 0%, #ec4899 100%);
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.8);
        }

        .prof-summary-paragraph {
          font-size: 13.5px;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.7;
          font-weight: 400;
        }

        /* Filter Pills Bar */
        .prof-filter-pill-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(139, 92, 246, 0.06);
          border: 1px solid var(--card-border);
          border-radius: 9999px;
          padding: 3px;
        }

        .prof-filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 9999px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .prof-filter-btn.active {
          background: rgba(139, 92, 246, 0.2);
          color: var(--accent-purple);
        }
        [data-theme="light"] .prof-filter-btn.active {
          background: #7c3aed;
          color: #ffffff;
        }

        /* Search input */
        .prof-search-bar {
          position: relative;
          width: 100%;
        }

        .prof-search-icon {
          position: absolute; left: 18px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .prof-search-input {
          width: 100%;
          background: var(--input-bg);
          border: 1px solid var(--card-border);
          border-radius: 14px;
          padding: 13px 18px 13px 44px;
          color: var(--text-primary);
          font-size: 13px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .prof-search-input:focus {
          border-color: rgba(139, 92, 246, 0.4);
        }

        /* Decisions Journeys Stack */
        .prof-decisions-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .prof-journey-card {
          background: var(--input-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: 26px 30px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .prof-journey-card:hover {
          border-color: rgba(139, 92, 246, 0.3);
          box-shadow: var(--card-shadow);
        }

        .prof-journey-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .prof-journey-title-wrap {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 580px;
        }

        .prof-journey-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 9999px;
          width: fit-content;
        }
        .ai-badge {
          background: rgba(139, 92, 246, 0.12);
          color: var(--accent-purple);
          border: 1px solid rgba(139, 92, 246, 0.3);
        }
        [data-theme="light"] .ai-badge {
          background: rgba(124, 58, 237, 0.12);
          color: #6d28d9;
          border-color: rgba(124, 58, 237, 0.3);
          font-weight: 700;
        }
        .custom-badge {
          background: rgba(6, 182, 212, 0.12);
          color: #0891b2;
          border: 1px solid rgba(6, 182, 212, 0.3);
        }
        [data-theme="light"] .custom-badge {
          background: rgba(6, 182, 212, 0.14);
          color: #0369a1;
          border-color: rgba(6, 182, 212, 0.3);
          font-weight: 700;
        }
        [data-theme="dark"] .custom-badge { color: #67e8f9; }

        .prof-journey-prompt {
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.35;
          letter-spacing: -0.01em;
        }

        .prof-journey-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .prof-journey-date {
          font-size: 12px;
          color: var(--text-muted);
        }

        .prof-open-map-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 18px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid var(--card-border);
          color: var(--text-primary);
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .prof-open-map-btn:hover {
          background: rgba(139, 92, 246, 0.18);
          border-color: rgba(139, 92, 246, 0.35);
          transform: translateY(-1px);
        }

        [data-theme="light"] .prof-open-map-btn {
          background: rgba(124, 58, 237, 0.12);
          border-color: rgba(124, 58, 237, 0.3);
          color: #6d28d9;
          font-weight: 700;
        }
        [data-theme="light"] .prof-open-map-btn:hover {
          background: rgba(124, 58, 237, 0.22);
          border-color: rgba(124, 58, 237, 0.5);
        }

        .prof-del-btn {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        [data-theme="light"] .prof-del-btn {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.3);
          color: #dc2626;
        }
        .prof-del-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
          color: #dc2626;
        }

        /* Timeline steps */
        .prof-journey-timeline {
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          padding-left: 20px;
          border-left: 2px solid rgba(139, 92, 246, 0.18);
        }

        .prof-timeline-step {
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
        }

        .prof-timeline-step-head {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .prof-step-idx {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .prof-step-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .prof-cat-tag {
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2.5px 8px;
          border-radius: 6px;
          letter-spacing: 0.05em;
        }
        .prof-cat-tag.cat-mindset { background: rgba(139, 92, 246, 0.15); color: var(--accent-purple); }
        [data-theme="light"] .prof-cat-tag.cat-mindset {
          background: rgba(124, 58, 237, 0.14);
          color: #6d28d9;
          border: 1px solid rgba(124, 58, 237, 0.25);
        }
        .prof-cat-tag.cat-action { background: rgba(6, 182, 212, 0.15); color: #0891b2; }
        [data-theme="light"] .prof-cat-tag.cat-action {
          background: rgba(6, 182, 212, 0.14);
          color: #0369a1;
          border: 1px solid rgba(6, 182, 212, 0.25);
        }
        [data-theme="dark"] .prof-cat-tag.cat-action { color: #67e8f9; }

        .prof-cat-tag.cat-risk { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        [data-theme="light"] .prof-cat-tag.cat-risk {
          background: rgba(239, 68, 68, 0.14);
          color: #b91c1c;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }
        [data-theme="dark"] .prof-cat-tag.cat-risk { color: #fca5a5; }

        .prof-cat-tag.cat-outcome { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
        [data-theme="light"] .prof-cat-tag.cat-outcome {
          background: rgba(34, 197, 94, 0.14);
          color: #15803d;
          border: 1px solid rgba(34, 197, 94, 0.25);
        }
        [data-theme="dark"] .prof-cat-tag.cat-outcome { color: #86efac; }

        .prof-step-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.55;
        }

        .prof-empty-state {
          background: var(--input-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: 48px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 14px;
        }
        .prof-empty-state h3 {
          font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0;
        }
        .prof-empty-state p {
          font-size: 13px; color: var(--text-secondary); max-width: 400px; margin: 0;
        }

        .prof-launch-btn {
          margin-top: 6px;
          display: flex; align-items: center; gap: 8px;
          padding: 9px 22px;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: #fff; border-radius: 9999px;
          font-size: 13px; font-weight: 600;
          text-decoration: none;
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.35);
        }
      `}</style>
    </div>
  );
}
