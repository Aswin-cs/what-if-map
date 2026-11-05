"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "../components/ThemeToggle";
import "./profile.css";
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
  Copy,
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
  const [copiedId, setCopiedId] = useState(null);

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

  /* Auth guard */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  /* Fetch Profile & Saved Decisions Data */
  const fetchProfile = useCallback(async () => {
    try {
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
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, fetchProfile]);

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
              <Image src="/what-if-map-logo-animated.svg" alt="What-If Map Logo" width={28} height={28} className="nav-brand-logo-img" priority />
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
                        <button
                          onClick={(e) => handleCopyPrompt(e, item.userPrompt, mapId || idx)}
                          className="prof-del-btn"
                          title="Copy prompt"
                          style={{
                            color: copiedId === (mapId || idx) ? '#10b981' : undefined,
                          }}
                        >
                          {copiedId === (mapId || idx) ? <Check size={13} /> : <Copy size={13} />}
                        </button>
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
    </div>
  );
}
