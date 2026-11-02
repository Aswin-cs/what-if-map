"use client";

import { useEffect, useRef } from "react";

/**
 * Periodically calls /api/ai/analysis every 5 minutes (300,000 ms) in the background.
 * Strictly checks that no other /api/ai API call is currently in-flight before executing.
 *
 * @param {Object} options
 * @param {boolean} options.enabled - Whether polling is active (e.g. authenticated user)
 * @param {boolean} options.isAiBusy - True if another /api/ai API (e.g. /api/ai, /continue, /edit) is calling
 * @param {Function} options.onProfileUpdated - Callback receiving the updated character profile
 * @param {number} [options.intervalMs=300000] - Interval in ms (default: 5 minutes)
 * @param {boolean} [options.immediate=false] - Whether to trigger an initial call on mount
 */
export function useAnalysisScheduler({
  enabled = true,
  isAiBusy = false,
  onProfileUpdated,
  intervalMs = 5 * 60 * 1000, // 5 minutes
  immediate = false,
}) {
  const isAiBusyRef = useRef(isAiBusy);
  const onProfileUpdatedRef = useRef(onProfileUpdated);
  const isAnalysisCallingRef = useRef(false);

  // Keep references fresh without triggering interval re-instantiation
  useEffect(() => {
    isAiBusyRef.current = isAiBusy;
  }, [isAiBusy]);

  useEffect(() => {
    onProfileUpdatedRef.current = onProfileUpdated;
  }, [onProfileUpdated]);

  useEffect(() => {
    if (!enabled) return;

    const executeAnalysis = async () => {
      // 1. Guard: Check if another /api/ai call is in-flight or if analysis is already running
      if (isAiBusyRef.current || isAnalysisCallingRef.current) {
        console.log(
          "[useAnalysisScheduler] Skipped: Another /api/ai API is currently calling or analysis is in-progress."
        );
        return;
      }

      isAnalysisCallingRef.current = true;
      try {
        // Calls only /api/ai/analysis without triggering any other /api/ai endpoints
        const res = await fetch("/api/ai/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          const profile = data.profile || data.updatedProfile;
          if (profile && onProfileUpdatedRef.current) {
            onProfileUpdatedRef.current(profile);
          }
        }
      } catch (err) {
        console.warn("[useAnalysisScheduler] Analysis poll error:", err.message || err);
      } finally {
        isAnalysisCallingRef.current = false;
      }
    };

    if (immediate) {
      executeAnalysis();
    }

    const timerId = setInterval(executeAnalysis, intervalMs);

    return () => {
      clearInterval(timerId);
    };
  }, [enabled, intervalMs, immediate]);
}

