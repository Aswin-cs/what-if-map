"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [error, setError] = useState("");

  const handleOAuthLogin = async (provider) => {
    setLoadingProvider(provider);
    setError("");
    try {
      await signIn(provider, { callbackUrl: "/" });
    } catch (err) {
      setError(`Failed to sign in with ${provider}.`);
      setLoadingProvider(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#09090b",
        color: "#f4f4f5",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Radial Glow */}
      <div
        style={{
          position: "absolute",
          top: "-150px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "650px",
          height: "650px",
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(9, 9, 11, 0) 70%)",
          pointerEvents: "none",
        }}
      />

      <main
        style={{
          width: "100%",
          maxWidth: "420px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "16px",
            padding: "40px 32px",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "#3b82f6",
                  boxShadow: "0 0 14px rgba(59, 130, 246, 0.9)",
                }}
              />
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  letterSpacing: "-0.03em",
                  color: "#f4f4f5",
                }}
              >
                What-If Map
              </span>
            </div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "600",
                margin: "0 0 8px 0",
                color: "#ffffff",
              }}
            >
              Sign In to Your Account
            </h2>
            <p style={{ fontSize: "13px", color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>
              Authentication is managed securely via your preferred OAuth provider.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "24px",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          {/* OAuth Buttons Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Google OAuth Button */}
            <button
              onClick={() => handleOAuthLogin("google")}
              disabled={loadingProvider !== null}
              style={{
                width: "100%",
                backgroundColor: "#27272a",
                color: "#f4f4f5",
                border: "1px solid #3f3f46",
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: loadingProvider !== null ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                if (!loadingProvider) {
                  e.currentTarget.style.borderColor = "#52525b";
                  e.currentTarget.style.backgroundColor = "#3f3f46";
                }
              }}
              onMouseOut={(e) => {
                if (!loadingProvider) {
                  e.currentTarget.style.borderColor = "#3f3f46";
                  e.currentTarget.style.backgroundColor = "#27272a";
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {loadingProvider === "google" ? "Connecting to Google..." : "Continue with Google"}
            </button>

            {/* GitHub OAuth Button */}
            <button
              onClick={() => handleOAuthLogin("github")}
              disabled={loadingProvider !== null}
              style={{
                width: "100%",
                backgroundColor: "#27272a",
                color: "#f4f4f5",
                border: "1px solid #3f3f46",
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: loadingProvider !== null ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                if (!loadingProvider) {
                  e.currentTarget.style.borderColor = "#52525b";
                  e.currentTarget.style.backgroundColor = "#3f3f46";
                }
              }}
              onMouseOut={(e) => {
                if (!loadingProvider) {
                  e.currentTarget.style.borderColor = "#3f3f46";
                  e.currentTarget.style.backgroundColor = "#27272a";
                }
              }}
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              {loadingProvider === "github" ? "Connecting to GitHub..." : "Continue with GitHub"}
            </button>
          </div>

          {/* Security & Features Note */}
          <div
            style={{
              marginTop: "28px",
              paddingTop: "20px",
              borderTop: "1px solid #27272a",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "12px", color: "#71717a", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              🔒 Enterprise-grade security. No password storage required.
            </p>
            <Link
              href="/"
              style={{
                fontSize: "13px",
                color: "#a1a1aa",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#a1a1aa")}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

