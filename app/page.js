"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useUserContext } from "./hooks/userContext";
import CinematicLogoReveal from "./components/CinematicLogoReveal";
import {
  Brain,
  Sparkles,
  Send,
  History,
  Trash2,
  ArrowRight,
  LogOut,
  LogIn,
  GitFork,
  Eye,
  Zap,
  Shield,
  Clock,
  X,
  Loader2,
  ChevronRight,
  Compass,
  Layers,
  RotateCcw,
} from "lucide-react";

/* ─── Neural Particle Canvas ─── */
function NeuralBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let particles = [];
    const PARTICLE_COUNT = 60;
    const CONNECTION_DIST = 140;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 2 + 1;
        this.hue = Math.random() > 0.5 ? 250 : 280;
        this.opacity = Math.random() * 0.5 + 0.2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 70%, 65%, ${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const alpha = (1 - dist / CONNECTION_DIST) * 0.12;
            ctx.strokeStyle = `hsla(265, 60%, 55%, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

/* ─── Main Page ─── */
export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    isLoading,
    setIsLoading,
    setNodes,
    setEdges,
    setFlowData,
    setCurrentHistoryId,
  } = useUserContext();
  const [inputText, setInputText] = useState("");
  const [historyItems, setHistoryItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [revealKey, setRevealKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchUserHistory() {
      if (status === "authenticated") {
        setFetchingHistory(true);
        try {
          const res = await fetch("/api/history");
          const data = await res.json();
          if (data.success && data.history) {
            setHistoryItems(data.history);
          }
        } catch (err) {
          console.error("Error fetching prompt history:", err);
        } finally {
          setFetchingHistory(false);
        }
      }
    }
    fetchUserHistory();
  }, [status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setIsSubmitting(true);
    try {
      let res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPrompt: inputText }),
      });
      let data = await res.json();
      if (data.success && data.data) {
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
    if (item.ai_response) {
      if (item.ai_response.output_1_paths) setNodes(item.ai_response.output_1_paths);
      if (item.ai_response.output_2_flow_edges) setEdges(item.ai_response.output_2_flow_edges);
      if (item.ai_response.output_3_recommendation_and_advice) setFlowData(item.ai_response.output_3_recommendation_and_advice);
      if (setCurrentHistoryId) setCurrentHistoryId(item._id || null);
      router.push("/hi");
    }
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

  const features = [
    {
      icon: <GitFork size={22} />,
      title: "Decision Trees",
      desc: "Visualize branching life paths and scenario outcomes in real-time.",
      color: "#8b5cf6",
    },
    {
      icon: <Eye size={22} />,
      title: "Behavioral Analysis",
      desc: "AI-powered psychological profiling of your decision patterns.",
      color: "#3b82f6",
    },
    {
      icon: <Zap size={22} />,
      title: "Cognitive Mapping",
      desc: "Transform thoughts into interactive cognitive architecture maps.",
      color: "#f59e0b",
    },
    {
      icon: <Shield size={22} />,
      title: "Pattern Recognition",
      desc: "Discover hidden biases and recurring themes in your choices.",
      color: "#10b981",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#09090b",
        color: "#f4f4f5",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
        overflowX: "hidden",
        overflowY: "auto",
        position: "relative",
      }}
    >
      <NeuralBackground />

      {/* Radial Glows */}
      <div
        style={{
          position: "fixed",
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "900px",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ─── Navigation ─── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          background: "rgba(9, 9, 11, 0.7)",
          borderBottom: "1px solid rgba(39, 39, 42, 0.6)",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "14px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)",
              }}
            >
              <Brain size={18} color="#fff" />
            </div>
            <span
              style={{
                fontSize: "17px",
                fontWeight: "700",
                letterSpacing: "-0.03em",
                background: "linear-gradient(135deg, #c4b5fd, #93c5fd)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              What-If Map
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {session ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: "#a1a1aa",
                    background: "rgba(39, 39, 42, 0.5)",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(63, 63, 70, 0.5)",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#10b981",
                      boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
                    }}
                  />
                  {session.user.name || session.user.email}
                </div>
                <button
                  onClick={() => signOut()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#f87171",
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                    transition: "all 0.2s ease",
                  }}
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: "#f4f4f5",
                  textDecoration: "none",
                  background: "rgba(39, 39, 42, 0.6)",
                  border: "1px solid #3f3f46",
                  padding: "7px 16px",
                  borderRadius: "8px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                }}
              >
                <LogIn size={14} />
                Sign In
              </Link>
            )}
            <Link
              href="/hi"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "#c4b5fd",
                textDecoration: "none",
                background: "rgba(139, 92, 246, 0.1)",
                border: "1px solid rgba(139, 92, 246, 0.25)",
                padding: "7px 16px",
                borderRadius: "8px",
                fontWeight: "600",
                transition: "all 0.2s ease",
              }}
            >
              <Compass size={14} />
              Open Map
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero Section with Cinematic Logo Reveal ─── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "860px",
          margin: "0 auto",
          padding: "40px 24px 30px",
          textAlign: "center",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Cinematic Logo Reveal Visual Centerpiece */}
        <div style={{ position: "relative", marginBottom: "36px" }}>
          <CinematicLogoReveal
            key={revealKey}
            fullScreenIntro={false}
          />
          <button
            onClick={() => setRevealKey((k) => k + 1)}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(18, 18, 22, 0.8)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              color: "#c4b5fd",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(139, 92, 246, 0.25)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(18, 18, 22, 0.8)";
            }}
          >
            <RotateCcw size={12} />
            Replay Reveal
          </button>
        </div>

        {/* Floating badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(139, 92, 246, 0.1)",
            border: "1px solid rgba(139, 92, 246, 0.25)",
            padding: "6px 16px",
            borderRadius: "24px",
            fontSize: "12px",
            fontWeight: "600",
            color: "#c4b5fd",
            marginBottom: "24px",
            letterSpacing: "0.04em",
          }}
        >
          <Sparkles size={13} />
          COGNITIVE DECISION INTELLIGENCE
        </div>

        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: "800",
            lineHeight: 1.1,
            margin: "0 0 20px 0",
            letterSpacing: "-0.04em",
          }}
        >
          <span style={{ color: "#f4f4f5" }}>Map Your Mind's </span>
          <span
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #ec4899, #f97316, #eab308)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Hidden Pathways
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "#a1a1aa",
            maxWidth: "580px",
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          Explore the psychology of your choices. Transform &ldquo;what if&rdquo; scenarios into
          interactive cognitive maps that reveal your decision-making personality.
        </p>

        <div
          style={{
            display: "flex",
            gap: "14px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href="#scenario-input"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              textDecoration: "none",
              boxShadow: "0 8px 30px rgba(139, 92, 246, 0.3)",
              transition: "all 0.2s ease",
            }}
          >
            <Brain size={16} />
            Start Exploring
          </a>
          <Link
            href="/hi"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(39, 39, 42, 0.5)",
              color: "#d4d4d8",
              padding: "12px 28px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "500",
              textDecoration: "none",
              border: "1px solid #3f3f46",
              transition: "all 0.2s ease",
            }}
          >
            View My Maps
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "860px",
          margin: "0 auto",
          padding: "0 24px 48px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "14px",
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                background: "rgba(24, 24, 27, 0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(39, 39, 42, 0.6)",
                borderRadius: "14px",
                padding: "22px 18px",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                cursor: "default",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: f.color + "15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px",
                  color: f.color,
                  border: `1px solid ${f.color}25`,
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  margin: "0 0 6px 0",
                  color: "#e4e4e7",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "#71717a",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Scenario Input Section ─── */}
      <section
        id="scenario-input"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "760px",
          margin: "0 auto",
          padding: "0 24px 40px",
        }}
      >
        <div
          style={{
            background: "rgba(24, 24, 27, 0.5)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(39, 39, 42, 0.6)",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 16px 48px rgba(0, 0, 0, 0.3)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top gradient accent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: "linear-gradient(90deg, #8b5cf6, #ec4899, #f97316, #eab308)",
              borderRadius: "16px 16px 0 0",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <Layers size={18} color="#8b5cf6" />
            <h2
              style={{
                fontSize: "17px",
                fontWeight: "700",
                margin: 0,
                color: "#f4f4f5",
              }}
            >
              Create a New Scenario
            </h2>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "#71717a",
              margin: "0 0 22px 0",
              lineHeight: 1.5,
            }}
          >
            Describe a decision, dilemma, or &ldquo;what if&rdquo; thought — our cognitive engine will
            map every possible pathway.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div style={{ position: "relative" }}>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder='e.g. "What if I quit my job and start a business in 6 months?"'
                rows={4}
                style={{
                  width: "100%",
                  backgroundColor: "rgba(9, 9, 11, 0.6)",
                  border: "1px solid rgba(63, 63, 70, 0.5)",
                  borderRadius: "12px",
                  padding: "16px 18px",
                  paddingRight: "44px",
                  color: "#f4f4f5",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
              {inputText && (
                <button
                  type="button"
                  onClick={() => setInputText("")}
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "rgba(63, 63, 70, 0.5)",
                    border: "none",
                    borderRadius: "6px",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#71717a",
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "11px", color: "#52525b" }}>
                {inputText.length} characters
              </span>
              <button
                type="submit"
                disabled={!inputText.trim() || isSubmitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background:
                    !inputText.trim() || isSubmitting
                      ? "rgba(39, 39, 42, 0.5)"
                      : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                  color: !inputText.trim() || isSubmitting ? "#52525b" : "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 24px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: !inputText.trim() || isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      size={15}
                      style={{ animation: "spin-glow 1s linear infinite" }}
                    />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Generate Map
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ─── History Timeline Section ─── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "760px",
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        <div
          style={{
            background: "rgba(24, 24, 27, 0.4)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(39, 39, 42, 0.5)",
            borderRadius: "16px",
            padding: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3b82f6",
                }}
              >
                <History size={16} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    margin: 0,
                    color: "#e4e4e7",
                  }}
                >
                  Scenario History
                </h3>
                <span style={{ fontSize: "11px", color: "#52525b" }}>
                  {historyItems.length} explored scenario{historyItems.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            {fetchingHistory && (
              <Loader2
                size={16}
                color="#8b5cf6"
                style={{ animation: "spin-glow 1s linear infinite" }}
              />
            )}
          </div>

          {historyItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                borderRadius: "12px",
                border: "1px dashed rgba(63, 63, 70, 0.4)",
                background: "rgba(9, 9, 11, 0.3)",
              }}
            >
              <Brain size={28} color="#3f3f46" style={{ marginBottom: "12px" }} />
              <p
                style={{
                  fontSize: "13px",
                  color: "#52525b",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {status === "authenticated"
                  ? "No scenarios explored yet. Create your first cognitive map above."
                  : "Sign in to save and revisit your explored scenarios."}
              </p>
            </div>
          ) : (
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                paddingRight: "4px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {historyItems.map((item, idx) => (
                <div
                  key={item._id}
                  onClick={() => handleSelectHistoryItem(item)}
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    gap: "14px",
                    background: "rgba(9, 9, 11, 0.4)",
                    border: "1px solid rgba(39, 39, 42, 0.5)",
                    borderRadius: "12px",
                    padding: "16px",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "3px",
                      minHeight: "100%",
                      borderRadius: "3px",
                      background:
                        idx === 0
                          ? "linear-gradient(180deg, #8b5cf6, #ec4899)"
                          : "rgba(63, 63, 70, 0.4)",
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#8b5cf6",
                            fontWeight: "600",
                            background: "rgba(139, 92, 246, 0.1)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            border: "1px solid rgba(139, 92, 246, 0.2)",
                            fontFamily: "monospace",
                          }}
                        >
                          #{item._id.slice(-6)}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11px",
                            color: "#52525b",
                          }}
                        >
                          <Clock size={10} />
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteHistoryItem(e, item._id)}
                        title="Delete this scenario"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#3f3f46",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "14px",
                        color: "#d4d4d8",
                        lineHeight: 1.45,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {item.userPrompt}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#8b5cf6",
                      }}
                    >
                      View cognitive map
                      <ChevronRight size={13} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: "0 24px 32px",
          borderTop: "1px solid rgba(39, 39, 42, 0.3)",
          paddingTop: "24px",
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        <p style={{ fontSize: "11px", color: "#3f3f46", margin: 0 }}>
          What-If Map — Cognitive Decision Intelligence Platform
        </p>
      </footer>
    </div>
  );
}
