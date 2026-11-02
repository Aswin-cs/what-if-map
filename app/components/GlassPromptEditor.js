"use client";
import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Pencil, Sparkles, X, Loader2, Target, ArrowRight, Save, Bookmark,
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
          width: 94%;
          max-width: 820px;
          pointer-events: auto;
          animation: glass-prompt-popup 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .glass-prompt-ambient-glow {
          position: absolute;
          inset: -3px;
          border-radius: 28px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.35), rgba(6, 182, 212, 0.25), rgba(245, 158, 11, 0.2));
          filter: blur(24px);
          opacity: 0.45;
          z-index: -1;
          transition: opacity 0.5s ease, filter 0.5s ease;
          animation: pulse-glow 4s ease-in-out infinite;
        }

        .glass-prompt-card {
          position: relative;
          background: #ffffff;
          backdrop-filter: blur(32px) saturate(210%);
          -webkit-backdrop-filter: blur(32px) saturate(210%);
          border: 1px solid #eef2f6;
          border-radius: 24px;
          padding: 24px 26px;
          box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.08), 0 8px 20px -4px rgba(0, 0, 0, 0.04);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        [data-theme="dark"] .glass-prompt-card {
          background: var(--panel-bg, rgba(15, 12, 34, 0.94));
          border: 1px solid rgba(139, 92, 246, 0.25);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7);
        }

        .glass-prompt-card.editing {
          padding: 24px 26px;
          border-color: rgba(139, 92, 246, 0.6);
          box-shadow: 0 28px 70px rgba(124, 58, 237, 0.25), 0 0 40px rgba(139, 92, 246, 0.25);
        }

        .glass-anim-content {
          animation: glass-fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* ─── Header & Badge ─── */
        .glass-header-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: #eff2fe;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4338ca;
          flex-shrink: 0;
        }

        [data-theme="dark"] .glass-header-icon {
          background: rgba(99, 102, 241, 0.16);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        .glass-badge-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #4338ca;
        }

        [data-theme="dark"] .glass-badge-label {
          color: #818cf8;
        }

        .glass-prompt-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          line-height: 1.25;
          margin: 3px 0 0 0;
          word-break: break-word;
        }

        [data-theme="dark"] .glass-prompt-title {
          color: #f8fafc;
        }

        /* ─── Edit Button ─── */
        .glass-btn-edit {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .glass-btn-edit:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        [data-theme="dark"] .glass-btn-edit {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          color: #f1f5f9;
        }

        [data-theme="dark"] .glass-btn-edit:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }

        /* ─── Chosen Path Sub-card ─── */
        .glass-chosen-path-box {
          background: #f8fafc;
          border-radius: 18px;
          padding: 18px 22px;
          border: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        [data-theme="dark"] .glass-chosen-path-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .glass-chosen-path-header {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .glass-chosen-path-tag {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #0f172a;
        }

        [data-theme="dark"] .glass-chosen-path-tag {
          color: #f8fafc;
        }

        .glass-chosen-path-count {
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
        }

        [data-theme="dark"] .glass-chosen-path-count {
          color: #94a3b8;
        }

        /* ─── Stepper Track ─── */
        .glass-stepper-track {
          display: flex;
          width: 100%;
          align-items: flex-start;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding-bottom: 2px;
        }

        .glass-stepper-track::-webkit-scrollbar {
          display: none;
        }

        .glass-stepper-step {
          flex: 1;
          min-width: 140px;
          display: flex;
          flex-direction: column;
        }

        .glass-stepper-node-row {
          display: flex;
          align-items: center;
          width: 100%;
          height: 32px;
        }

        .glass-stepper-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 13px;
          font-weight: 800;
          transition: all 0.2s ease;
        }

        .glass-stepper-circle.is-completed {
          background: #4338ca;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(67, 56, 202, 0.25);
        }

        [data-theme="dark"] .glass-stepper-circle.is-completed {
          background: #6366f1;
        }

        .glass-stepper-circle.is-current {
          background: #ffffff;
          border: 2.5px solid #4338ca;
          color: #4338ca;
        }

        [data-theme="dark"] .glass-stepper-circle.is-current {
          background: #1e1b4b;
          border-color: #818cf8;
          color: #c7d2fe;
        }

        .glass-stepper-line {
          flex: 1;
          margin: 0 10px;
        }

        .glass-stepper-line.solid {
          height: 2px;
          background: #4338ca;
        }

        [data-theme="dark"] .glass-stepper-line.solid {
          background: #6366f1;
        }

        .glass-stepper-line.dashed {
          height: 0;
          border-top: 2px dashed #cbd5e1;
        }

        [data-theme="dark"] .glass-stepper-line.dashed {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .glass-stepper-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-top: 8px;
          padding-right: 14px;
        }

        .glass-stepper-step-label {
          font-size: 11px;
          font-weight: 500;
          color: #64748b;
        }

        .glass-stepper-step-label.is-current {
          color: #4338ca;
          font-weight: 700;
        }

        [data-theme="dark"] .glass-stepper-step-label {
          color: #94a3b8;
        }

        [data-theme="dark"] .glass-stepper-step-label.is-current {
          color: #818cf8;
        }

        .glass-stepper-step-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.35;
          word-break: break-word;
        }

        [data-theme="dark"] .glass-stepper-step-title {
          color: #f1f5f9;
        }

        /* ─── Bottom Action Bar ─── */
        .glass-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 4px;
        }

        .glass-action-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .glass-action-btn-outline {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 9px 16px;
          background: #ffffff;
          color: #0f172a;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 7px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .glass-action-btn-outline:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        .glass-action-btn-outline:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        [data-theme="dark"] .glass-action-btn-outline {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          color: #f1f5f9;
        }

        [data-theme="dark"] .glass-action-btn-outline:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }

        @property --btn-gradient-angle {
          syntax: '<angle>';
          initial-value: 135deg;
          inherits: false;
        }

        .glass-action-btn-primary,
        .glass-prompt-card .spp-btn-continue {
          --btn-gradient-angle: 135deg;
          width: auto !important;
          min-width: 0 !important;
          max-width: fit-content !important;
          background: linear-gradient(var(--btn-gradient-angle), #7c3aed 0%, #2563eb 50%, #06b6d4 100%) !important;
          background-size: 180% 180% !important;
          background-position: 0% 0% !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          color: #ffffff !important;
          border-radius: 12px !important;
          padding: 10px 20px !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          cursor: pointer !important;
          white-space: nowrap !important;
          flex-shrink: 0 !important;
          box-shadow: 0 4px 18px rgba(124, 58, 237, 0.45) !important;
          transition: --btn-gradient-angle 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      background-position 0.6s ease,
                      transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.25s ease !important;
        }

        .glass-action-btn-primary:hover:not(:disabled),
        .glass-prompt-card .spp-btn-continue:hover:not(:disabled) {
          --btn-gradient-angle: 315deg;
          background-position: 100% 100% !important;
          box-shadow: 0 8px 26px rgba(124, 58, 237, 0.6), 0 0 18px rgba(6, 182, 212, 0.45) !important;
          transform: translateY(-2px) scale(1.02) !important;
        }

        .glass-action-btn-primary:active:not(:disabled),
        .glass-prompt-card .spp-btn-continue:active:not(:disabled) {
          transform: translateY(0) scale(0.98) !important;
        }

        .glass-action-btn-primary:disabled,
        .glass-prompt-card .spp-btn-continue:disabled {
          opacity: 0.65 !important;
          cursor: not-allowed !important;
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
          background: rgba(67, 56, 202, 0.12);
          color: #4338ca;
          border: 1px solid rgba(67, 56, 202, 0.25);
          text-transform: uppercase;
        }

        [data-theme="dark"] .glass-expanded-step-badge {
          background: rgba(139, 92, 246, 0.18);
          color: var(--accent-purple, #c4b5fd);
          border: 1px solid rgba(139, 92, 246, 0.3);
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
          background: linear-gradient(180deg, rgba(67, 56, 202, 0.4), rgba(67, 56, 202, 0.1));
        }

        .glass-expanded-step-content {
          flex: 1;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 14px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          backdrop-filter: blur(10px);
        }

        [data-theme="dark"] .glass-expanded-step-content {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
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
          --btn-gradient-angle: 135deg;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 20px;
          border-radius: 12px;
          background: linear-gradient(var(--btn-gradient-angle), #7c3aed 0%, #2563eb 50%, #06b6d4 100%);
          background-size: 180% 180%;
          background-position: 0% 0%;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          min-width: 135px;
          box-shadow: 0 4px 18px rgba(124, 58, 237, 0.45);
          transition: --btn-gradient-angle 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      background-position 0.6s ease,
                      transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.25s ease,
                      width 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      min-width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .glass-btn-regen.is-submitting {
          min-width: 220px;
        }

        .glass-btn-regen:hover:not(:disabled) {
          --btn-gradient-angle: 315deg;
          background-position: 100% 100%;
          box-shadow: 0 8px 26px rgba(124, 58, 237, 0.6), 0 0 18px rgba(6, 182, 212, 0.45);
          transform: translateY(-2px) scale(1.02);
        }

        .glass-btn-regen:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }

        .glass-btn-regen:disabled {
          opacity: 0.55;
          cursor: not-allowed;
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
            <div className="glass-anim-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Top Row: Icon Badge, Scenario Prompt Title & Edit Button */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
              }}>
                {/* Left: Soft Square Badge & Scenario Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                  <div className="glass-header-icon">
                    <Sparkles size={20} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span className="glass-badge-label">
                      Scenario Prompt
                    </span>
                    <h2 className="glass-prompt-title">
                      {currentPrompt || 'Untitled Scenario'}
                    </h2>
                  </div>
                </div>

                {/* Right: Edit Button */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="glass-btn-edit"
                  title="Modify scenario prompt"
                >
                  <Pencil size={15} />
                  <span>Edit</span>
                </button>
              </div>

              {/* ─── Chosen Path Sub-Card Section ─── */}
              {selectedPathNodes.length > 0 && (
                <div className="glass-chosen-path-box">
                  <div className="glass-chosen-path-header">
                    <span className="glass-chosen-path-tag">CHOSEN PATH</span>
                    <span className="glass-chosen-path-count">
                      {selectedPathNodes.length} {selectedPathNodes.length === 1 ? 'step' : 'steps'} so far
                    </span>
                  </div>

                  {isExpandedView ? (
                    /* Detailed Vertical Breakdown View */
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
                    /* Horizontal Stepper Timeline (User Reference Design) */
                    <div
                      ref={pipelineRef}
                      className="glass-stepper-track"
                      onMouseDown={handleMouseDown}
                      onMouseLeave={handleMouseLeaveOrUp}
                      onMouseUp={handleMouseLeaveOrUp}
                      onMouseMove={handleMouseMove}
                    >
                      {selectedPathNodes.map((n, idx) => {
                        const isCurrent = idx === selectedPathNodes.length - 1;
                        const isCompleted = idx < selectedPathNodes.length - 1;
                        const label = n.data?.label || n.data?.title || n.id;
                        return (
                          <div key={n.id || idx} className="glass-stepper-step">
                            <div className="glass-stepper-node-row">
                              <div className={`glass-stepper-circle ${isCurrent ? 'is-current' : 'is-completed'}`}>
                                {isCompleted ? (
                                  <Check size={14} strokeWidth={2.8} />
                                ) : (
                                  <span>{idx + 1}</span>
                                )}
                              </div>
                              {idx < selectedPathNodes.length - 1 ? (
                                <div className="glass-stepper-line solid" />
                              ) : (
                                <div className="glass-stepper-line dashed" />
                              )}
                            </div>
                            <div className="glass-stepper-info">
                              <span className={`glass-stepper-step-label ${isCurrent ? 'is-current' : ''}`}>
                                {isCurrent ? 'Current step' : `Step ${idx + 1}`}
                              </span>
                              <span className="glass-stepper-step-title">{label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ─── Bottom Action Row ─── */}
              {selectedPathNodes.length > 0 && (
                <div className="glass-action-bar">
                  <div className="glass-action-left">
                    <button
                      type="button"
                      onClick={() => setIsExpandedView(v => !v)}
                      className="glass-action-btn-outline"
                      title={isExpandedView ? 'Switch to Compact Stepper' : 'Expand Path Detail View'}
                    >
                      {isExpandedView ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                      <span>{isExpandedView ? 'Compact view' : 'Expanded view'}</span>
                    </button>

                    {selectedPathInfo?.isSaved ? (
                      onUndoDecision && (
                        <button
                          onClick={onUndoDecision}
                          disabled={undoingPath || !!undoSuccessMsg}
                          className="glass-action-btn-outline"
                        >
                          {undoSuccessMsg ? <Check size={15} /> : <RotateCcw size={15} />}
                          <span>{undoingPath ? 'Undoing...' : undoSuccessMsg ? 'Unsaved!' : 'Undo save'}</span>
                        </button>
                      )
                    ) : (
                      onSaveDecision && (
                        <button
                          onClick={onSaveDecision}
                          disabled={savingPath || !!saveSuccessMsg}
                          className="glass-action-btn-outline"
                        >
                          {saveSuccessMsg ? <Check size={15} /> : <Bookmark size={15} />}
                          <span>{savingPath ? 'Saving...' : saveSuccessMsg ? 'Path Saved!' : 'Save path'}</span>
                        </button>
                      )
                    )}
                  </div>

                  {onContinueStory && (
                    <button
                      onClick={onContinueStory}
                      disabled={continuingStory || !!continueSuccessMsg}
                      className="glass-action-btn-primary spp-btn-continue"
                    >
                      {continuingStory ? (
                        <>
                          <Loader2 size={16} className="spin" />
                          <span>Continuing...</span>
                        </>
                      ) : continueSuccessMsg ? (
                        <>
                          <Check size={16} />
                          <span>Continued!</span>
                        </>
                      ) : (
                        <>
                          <span>Continue story</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
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
