"use client";
import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Pencil, Sparkles, X, Loader2, Target, ArrowRight, Save,
  Check, RotateCcw, ChevronRight, ChevronLeft, Maximize2, Minimize2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '../hooks/userContext';
import { AI_PROCESSING_WORDS } from '@/lib/aiProcessingWords';

export default function GlassPromptEditor({
  currentPrompt,
  historyId,
  onPromptUpdated,
  selectedPathInfo,
  nodes = [],
  edges = [],
  onSaveDecision,
  savingPath = false,
  saveSuccessMsg = '',
  onUndoDecision,
  undoingPath = false,
  undoSuccessMsg = '',
  onContinueStory,
  continuingStory = false,
  continueSuccessMsg = '',
  onSubmittingChange,
}) {
  const router = useRouter();
  const { setNodes, setEdges, setFlowData, setUserPrompt, setCurrentHistoryId } = useUserContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpandedView, setIsExpandedView] = useState(false);
  const [prevPrompt, setPrevPrompt] = useState(currentPrompt);
  const [promptText, setPromptText] = useState(currentPrompt || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingWordIndex, setLoadingWordIndex] = useState(0);
  const textareaRef = useRef(null);

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

  if (currentPrompt !== prevPrompt) {
    setPrevPrompt(currentPrompt);
    setPromptText(currentPrompt || '');
  }

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Extract node objects for selected path
  const selectedPathNodes = useMemo(() => {
    return selectedPathInfo?.nodeIds
      ? selectedPathInfo.nodeIds
          .map((id) => nodes.find((n) => n.id === id) || { id, data: { label: id } })
      : [];
  }, [selectedPathInfo, nodes]);

  /* ─── Draggable Slider Logic for Step Pipeline ─── */
  const pipelineRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);

  const checkScrollability = () => {
    const el = pipelineRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [selectedPathNodes]);

  const handleMouseDown = (e) => {
    const el = pipelineRef.current;
    if (!el) return;
    setIsMouseDown(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftStart(el.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown) return;
    e.preventDefault();
    const el = pipelineRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.6;
    el.scrollLeft = scrollLeftStart - walk;
    checkScrollability();
  };

  const scrollPipeline = (direction) => {
    const el = pipelineRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -200 : 200;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const handleRegenerate = async (customPrompt = null) => {
    const textToSubmit = (typeof customPrompt === 'string' ? customPrompt : promptText).trim();
    console.log('[GlassPromptEditor] handleRegenerate clicked!', { textToSubmit, isSubmitting, historyId });
    if (!textToSubmit || isSubmitting) return;

    setIsSubmitting(true);
    if (onSubmittingChange) onSubmittingChange(true);

    const hasSelectedPath = !!(selectedPathInfo && selectedPathNodes && selectedPathNodes.length > 0);
    try {
      const res = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object_id: historyId,
          userPrompt: textToSubmit,
          oldUserPrompt: currentPrompt || '',
          nodes: nodes || [],
          edges: edges || [],
          selectedPathNodes: selectedPathNodes || [],
          hasSelectedPath: hasSelectedPath,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUserPrompt(textToSubmit);
        if (setNodes) setNodes(data.data.output_1_paths || []);
        if (setEdges) setEdges(data.data.output_2_flow_edges || []);
        if (setFlowData) setFlowData(data.data.output_3_recommendation_and_advice || null);
        if (setCurrentHistoryId && data._id) setCurrentHistoryId(data._id);
        if (onPromptUpdated) onPromptUpdated(textToSubmit, data.data);
        setIsEditing(false);
        if (data._id && data._id !== historyId) {
          router.push(`/hi/${data._id}`);
        }
      } else {
        alert(data.error || 'Failed to edit scenario.');
      }
    } catch (err) {
      console.error('Error editing scenario:', err);
      alert('An error occurred while updating the scenario.');
    } finally {
      setIsSubmitting(false);
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  const handlePresetClick = (modifierText) => {
    const newText = promptText ? `${promptText.trim()} ${modifierText}` : modifierText;
    setPromptText(newText);
  };

  return (
    <>
      <style>{`
        @keyframes glass-prompt-popup {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(40px) scale(0.94);
            filter: blur(12px);
          }
          60% {
            opacity: 0.98;
            transform: translateX(-50%) translateY(-3px) scale(1.005);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
            filter: blur(0px);
          }
        }

        @keyframes glass-fade-in {
          0% {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.05); }
        }

        .glass-prompt-wrapper {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 40;
          width: 92%;
          max-width: 760px;
          pointer-events: auto;
          animation: glass-prompt-popup 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .glass-prompt-ambient-glow {
          position: absolute;
          inset: -3px;
          border-radius: 26px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.4), rgba(6, 182, 212, 0.3), rgba(245, 158, 11, 0.25));
          filter: blur(22px);
          opacity: 0.45;
          z-index: -1;
          transition: opacity 0.5s ease, filter 0.5s ease;
          animation: pulse-glow 4s ease-in-out infinite;
        }

        .glass-prompt-card {
          position: relative;
          background: var(--panel-bg, rgba(12, 10, 26, 0.88));
          backdrop-filter: blur(32px) saturate(210%);
          -webkit-backdrop-filter: blur(32px) saturate(210%);
          border: 1px solid var(--panel-border, rgba(139, 92, 246, 0.25));
          border-radius: 22px;
          padding: 18px 22px;
          box-shadow: var(--panel-shadow, 0 24px 60px rgba(0, 0, 0, 0.75));
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        [data-theme="light"] .glass-prompt-card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(139, 92, 246, 0.28);
          box-shadow: 0 24px 50px rgba(139, 92, 246, 0.18), 0 4px 14px rgba(0, 0, 0, 0.06);
        }

        .glass-prompt-card.editing {
          padding: 22px;
          border-color: rgba(139, 92, 246, 0.6);
          box-shadow: 0 28px 70px rgba(124, 58, 237, 0.28), 0 0 40px rgba(139, 92, 246, 0.3);
        }

        .glass-prompt-card.has-path {
          border-color: rgba(245, 158, 11, 0.45);
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.4), 0 0 35px rgba(245, 158, 11, 0.2);
        }

        .glass-anim-content {
          animation: glass-fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* ─── Header & Orb ─── */
        .glass-orb-wrapper {
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;
          box-shadow: 0 0 18px rgba(124, 58, 237, 0.5);
          padding: 1px;
        }

        .glass-orb-inner {
          width: 100%;
          height: 100%;
          border-radius: 11px;
          background: rgba(12, 10, 26, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        [data-theme="light"] .glass-orb-inner {
          background: rgba(255, 255, 255, 0.85);
          color: #7c3aed;
        }

        .glass-badge-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: var(--accent-purple, #c4b5fd);
          display: flex;
          align-items: center;
        }

        /* ─── Edit Button ─── */
        .glass-btn-edit {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.16), rgba(6, 182, 212, 0.12));
          border: 1px solid rgba(139, 92, 246, 0.3);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
          backdrop-filter: blur(10px);
        }

        .glass-btn-edit:hover {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.28), rgba(6, 182, 212, 0.22));
          border-color: rgba(139, 92, 246, 0.6);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
        }

        /* ─── Selected Path Section ─── */
        .glass-path-container {
          padding-top: 14px;
          margin-top: 4px;
          border-top: 1px solid var(--panel-border, rgba(139, 92, 246, 0.18));
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: glass-fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .glass-path-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .glass-path-badge-pill {
          display: flex;
          align-items: center;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 8px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
        }

        [data-theme="dark"] .glass-path-badge-pill {
          background: rgba(255, 215, 0, 0.1);
          border-color: rgba(255, 215, 0, 0.3);
          color: #ffd700;
        }

        /* ─── Timeline / Pipeline Step Track (Draggable Slider) ─── */
        .glass-path-pipeline-wrapper {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }

        .glass-path-pipeline {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding: 6px 4px 8px 4px;
          cursor: grab;
          user-select: none;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }

        .glass-path-pipeline::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }

        .glass-path-pipeline.dragging {
          cursor: grabbing;
        }

        /* Auto-Hide Navigation Arrow Buttons */
        .glass-slider-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--panel-bg, rgba(12, 10, 26, 0.9));
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--panel-border, rgba(139, 92, 246, 0.35));
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4), 0 0 10px rgba(139, 92, 246, 0.2);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease, transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }

        .glass-slider-arrow.show {
          opacity: 1;
          pointer-events: auto;
        }

        .glass-slider-arrow:hover {
          background: rgba(139, 92, 246, 0.35);
          border-color: rgba(139, 92, 246, 0.7);
          transform: translateY(-50%) scale(1.12);
        }

        .glass-slider-arrow.left {
          left: -10px;
        }

        .glass-slider-arrow.right {
          right: -10px;
        }

        /* ─── Expand Toggle Button ─── */
        .glass-expand-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 10px;
          background: rgba(139, 92, 246, 0.12);
          border: 1px solid rgba(139, 92, 246, 0.3);
          color: var(--accent-purple, #c4b5fd);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          backdrop-filter: blur(8px);
        }

        .glass-expand-btn:hover {
          background: rgba(139, 92, 246, 0.22);
          border-color: rgba(139, 92, 246, 0.55);
          transform: translateY(-1px);
        }

        /* ─── Expanded Timeline Detail View ─── */
        .glass-expanded-timeline-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 280px;
          overflow-y: auto;
          padding: 8px 4px 6px 4px;
          animation: glass-fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.3) transparent;
        }

        .glass-expanded-timeline-container::-webkit-scrollbar {
          width: 4px;
        }
        .glass-expanded-timeline-container::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.35);
          border-radius: 4px;
        }

        .glass-expanded-step-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          position: relative;
        }

        .glass-expanded-step-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex-shrink: 0;
          min-width: 60px;
        }

        .glass-expanded-step-badge {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.5px;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(139, 92, 246, 0.18);
          color: var(--accent-purple, #c4b5fd);
          border: 1px solid rgba(139, 92, 246, 0.3);
          text-transform: uppercase;
        }

        .glass-expanded-step-item.is-final .glass-expanded-step-badge {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
          border-color: rgba(245, 158, 11, 0.4);
        }

        .glass-expanded-line {
          width: 2px;
          flex: 1;
          min-height: 24px;
          margin-top: 6px;
          background: linear-gradient(180deg, rgba(139, 92, 246, 0.4), rgba(139, 92, 246, 0.1));
        }

        .glass-expanded-step-content {
          flex: 1;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          backdrop-filter: blur(10px);
        }

        [data-theme="light"] .glass-expanded-step-content {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(139, 92, 246, 0.18);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .glass-expanded-step-item.is-final .glass-expanded-step-content {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.06));
          border-color: rgba(245, 158, 11, 0.35);
        }

        .glass-expanded-step-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .glass-expanded-step-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .glass-expanded-final-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }

        .glass-expanded-step-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .glass-expanded-step-desc.muted {
          color: var(--text-muted);
          font-style: italic;
        }

        .glass-step-card {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          white-space: nowrap;
          transition: all 0.25s ease;
          flex-shrink: 0;
        }

        [data-theme="light"] .glass-step-card {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(139, 92, 246, 0.2);
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        }

        .glass-step-card:hover {
          border-color: rgba(139, 92, 246, 0.4);
          transform: translateY(-1px);
        }

        .glass-step-card.is-final {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(239, 68, 68, 0.08));
          border-color: rgba(245, 158, 11, 0.45);
          box-shadow: 0 0 14px rgba(245, 158, 11, 0.2);
        }

        .glass-step-num {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 6px;
          background: rgba(139, 92, 246, 0.2);
          color: var(--accent-purple, #c4b5fd);
        }

        .glass-step-card.is-final .glass-step-num {
          background: rgba(245, 158, 11, 0.25);
          color: #fbbf24;
        }

        .glass-step-text {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .glass-step-connector {
          color: var(--text-muted);
          opacity: 0.5;
          flex-shrink: 0;
        }

        /* ─── Action Buttons ─── */
        .glass-save-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 10px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #059669;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          backdrop-filter: blur(8px);
        }
        [data-theme="dark"] .glass-save-btn { color: #34d399; }

        .glass-save-btn:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.25);
          border-color: rgba(16, 185, 129, 0.6);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
        }

        .glass-undo-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #dc2626;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          backdrop-filter: blur(8px);
        }
        [data-theme="dark"] .glass-undo-btn { color: #f87171; }

        .glass-undo-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.25);
          border-color: rgba(239, 68, 68, 0.6);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
        }

        @property --btn-gradient-angle {
          syntax: '<angle>';
          initial-value: 135deg;
          inherits: false;
        }

        .glass-continue-btn {
          --btn-gradient-angle: 135deg;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 18px;
          border-radius: 12px;
          background: linear-gradient(var(--btn-gradient-angle), #7c3aed 0%, #2563eb 50%, #06b6d4 100%);
          background-size: 180% 180%;
          background-position: 0% 0%;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: --btn-gradient-angle 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      background-position 0.6s ease,
                      transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.25s ease;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.45);
        }

        .glass-continue-btn:hover:not(:disabled) {
          --btn-gradient-angle: 315deg;
          background-position: 100% 100%;
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.6), 0 0 18px rgba(6, 182, 212, 0.45);
        }

        .glass-continue-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }

        /* ─── Edit Mode Textarea & Presets ─── */
        .glass-textarea {
          width: 100%;
          background: var(--input-bg, rgba(17, 24, 39, 0.6));
          border: 1px solid var(--input-border, rgba(255, 255, 255, 0.12));
          border-radius: 14px;
          padding: 14px 16px;
          color: var(--text-primary);
          font-size: 14px;
          line-height: 1.55;
          outline: none;
          resize: none;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.2);
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .glass-textarea:focus {
          border-color: rgba(139, 92, 246, 0.8);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.25), inset 0 2px 6px rgba(0,0,0,0.1);
        }

        .glass-btn-regen {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 20px;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          border: none;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          min-width: 135px;
          box-shadow: 0 4px 18px rgba(124, 58, 237, 0.45);
          transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.35s cubic-bezier(0.16, 1, 0.3, 1), all 0.25s ease;
          overflow: hidden;
        }

        .glass-btn-regen.is-submitting {
          min-width: 220px;
        }

        .glass-btn-regen:hover:not(:disabled) {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 6px 24px rgba(139, 92, 246, 0.6);
        }

        .glass-preset-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 8px;
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid rgba(139, 92, 246, 0.2);
          color: var(--accent-purple, #c4b5fd);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .glass-preset-chip:hover {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.45);
          transform: translateY(-1px);
        }
      `}</style>

      <div className="glass-prompt-wrapper">
        <div className="glass-prompt-ambient-glow" />

        <div className={`glass-prompt-card ${isEditing ? 'editing' : ''} ${selectedPathNodes.length > 0 ? 'has-path' : ''}`}>
          {!isEditing ? (
            /* ─── View Mode ─── */
            <div className="glass-anim-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}>
                {/* Left: Icon Orb & Scenario Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', flex: 1 }}>
                  <div className="glass-orb-wrapper">
                    <div className="glass-orb-inner">
                      <Sparkles size={17} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '2px' }}>
                    <span className="glass-badge-label">
                      Scenario Prompt
                    </span>
                    <span style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      letterSpacing: '-0.2px',
                    }}>
                      {currentPrompt || 'Untitled Scenario'}
                    </span>
                  </div>
                </div>

                {/* Right: Edit Button */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="glass-btn-edit"
                  title="Modify scenario prompt"
                >
                  <Pencil size={14} />
                  <span>Edit</span>
                </button>
              </div>

              {/* ─── Selected Chosen Path Display ─── */}
              {selectedPathNodes.length > 0 && (
                <div className="glass-path-container">
                  <div className="glass-path-header">
                    <div className="glass-path-badge-pill">
                      <span>
                        {selectedPathInfo?.isSaved
                          ? 'Saved Decision Path'
                          : selectedPathInfo?.acceptedAi
                          ? 'AI Recommended Path'
                          : 'Chosen Path'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setIsExpandedView(v => !v)}
                        className="glass-expand-btn"
                        title={isExpandedView ? 'Switch to Compact View' : 'Expand Path Detail View'}
                      >
                        {isExpandedView ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                        <span>{isExpandedView ? 'Compact' : 'Expanded View'}</span>
                      </button>

                      {selectedPathInfo?.isSaved ? (
                        onUndoDecision && (
                          <button
                            onClick={onUndoDecision}
                            disabled={undoingPath || !!undoSuccessMsg}
                            className="glass-undo-btn"
                          >
                            {undoSuccessMsg ? <Check size={13} /> : <RotateCcw size={13} />}
                            <span>{undoingPath ? 'Undoing...' : undoSuccessMsg ? 'Unsaved!' : 'Undo Save'}</span>
                          </button>
                        )
                      ) : (
                        onSaveDecision && (
                          <button
                            onClick={onSaveDecision}
                            disabled={savingPath || !!saveSuccessMsg}
                            className="glass-save-btn"
                          >
                            {saveSuccessMsg ? <Check size={13} /> : <Save size={13} />}
                            <span>{savingPath ? 'Saving...' : saveSuccessMsg ? 'Path Saved!' : 'Save Path'}</span>
                          </button>
                        )
                      )}

                      {onContinueStory && (
                        <button
                          onClick={onContinueStory}
                          disabled={continuingStory || !!continueSuccessMsg}
                          className="glass-continue-btn"
                        >
                          {continuingStory ? (
                            <Loader2 size={13} className="spin" />
                          ) : continueSuccessMsg ? (
                            <Check size={13} />
                          ) : (
                            <Sparkles size={13} />
                          )}
                          <span>{continuingStory ? 'Continuing...' : continueSuccessMsg ? 'Continued!' : 'Continue Story'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Step Pipeline Display Mode: Expanded vs Compact Slider */}
                  {isExpandedView ? (
                    /* Detailed Vertical Timeline Breakdown */
                    <div className="glass-expanded-timeline-container">
                      {selectedPathNodes.map((n, idx) => {
                        const isFinal = idx === selectedPathNodes.length - 1;
                        const label = n.data?.label || n.data?.title || n.id;
                        const description = n.data?.msg || n.data?.description || n.data?.details || '';
                        return (
                          <div key={n.id || idx} className={`glass-expanded-step-item ${isFinal ? 'is-final' : ''}`}>
                            <div className="glass-expanded-step-left">
                              <span className="glass-expanded-step-badge">
                                Step {String(idx + 1).padStart(2, '0')}
                              </span>
                              {idx < selectedPathNodes.length - 1 && (
                                <div className="glass-expanded-line" />
                              )}
                            </div>

                            <div className="glass-expanded-step-content">
                              <div className="glass-expanded-step-header">
                                <span className="glass-expanded-step-title">{label}</span>
                                {isFinal && (
                                  <span className="glass-expanded-final-pill">
                                    <Target size={11} /> Final Destination
                                  </span>
                                )}
                              </div>
                              {description ? (
                                <p className="glass-expanded-step-desc">{description}</p>
                              ) : (
                                <p className="glass-expanded-step-desc muted">Decision node along this scenario subpath.</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* High-Tech Pipeline Step Sequence (Draggable Horizontal Slider) */
                    <div className="glass-path-pipeline-wrapper">
                      <button
                        type="button"
                        className={`glass-slider-arrow left ${canScrollLeft ? 'show' : ''}`}
                        onClick={() => scrollPipeline('left')}
                        aria-label="Scroll left"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <div
                        ref={pipelineRef}
                        className={`glass-path-pipeline ${isMouseDown ? 'dragging' : ''}`}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeaveOrUp}
                        onMouseUp={handleMouseLeaveOrUp}
                        onMouseMove={handleMouseMove}
                        onScroll={checkScrollability}
                      >
                        {selectedPathNodes.map((n, idx) => {
                          const isFinal = idx === selectedPathNodes.length - 1;
                          const label = n.data?.label || n.data?.title || n.id;
                          return (
                            <div key={n.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className={`glass-step-card ${isFinal ? 'is-final' : ''}`}>
                                <span className="glass-step-num">{String(idx + 1).padStart(2, '0')}</span>
                                <span className="glass-step-text">{label}</span>
                                {isFinal && <Target size={12} color="#fbbf24" style={{ marginLeft: '2px' }} />}
                              </div>
                              {!isFinal && (
                                <ChevronRight size={14} className="glass-step-connector" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        className={`glass-slider-arrow right ${canScrollRight ? 'show' : ''}`}
                        onClick={() => scrollPipeline('right')}
                        aria-label="Scroll right"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ─── Edit Mode ─── */
            <div className="glass-anim-content" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="glass-badge-label" style={{ fontSize: '11px' }}>
                  Edit & Re-Explore Scenario
                </span>
                <button
                  onClick={() => { setIsEditing(false); setPromptText(currentPrompt); }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  <X size={15} />
                </button>
              </div>

              <textarea
                ref={textareaRef}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Describe your what-if scenario..."
                rows={3}
                className="glass-textarea"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleRegenerate();
                  }
                }}
              />

              {/* Quick Suggestion Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', marginRight: '4px' }}>
                  Quick Add:
                </span>
                <button
                  type="button"
                  onClick={() => handlePresetClick('with unexpected plot twist')}
                  className="glass-preset-chip"
                >
                  Plot Twist
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick('focusing on high growth and scaling')}
                  className="glass-preset-chip"
                >
                  High Growth
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick('5 years down the road')}
                  className="glass-preset-chip"
                >
                  5 Years Later
                </button>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Press <kbd style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.3)', color: 'var(--text-primary)', fontWeight: '600' }}>Ctrl + Enter</kbd> to submit
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => { setIsEditing(false); setPromptText(currentPrompt); }}
                    disabled={isSubmitting}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '10px',
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRegenerate()}
                    disabled={!promptText.trim() || isSubmitting}
                    className={`glass-btn-regen ${isSubmitting ? 'is-submitting' : ''}`}
                    style={{
                      opacity: (!promptText.trim() || isSubmitting) ? 0.5 : 1,
                      cursor: (!promptText.trim() || isSubmitting) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="spin" />
                        <span key={loadingWordIndex} className="ai-processing-text">
                          {AI_PROCESSING_WORDS[loadingWordIndex]}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Re-Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
