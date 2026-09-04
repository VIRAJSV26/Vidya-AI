"use client";

import { useState } from "react";
import { QuizQuestion } from "@/lib/types";
import { Button, Icon, PATHS } from "./ui";
import { useApp } from "@/context/AppContext";

interface QuizModalProps {
  quiz?: QuizQuestion[];
  onClose: () => void;
  onComplete: (score: number) => void;
  onEmailScore?: (score: number) => void;
}

export default function QuizModal({ quiz, onClose, onComplete, onEmailScore }: QuizModalProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!quiz || quiz.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] grid place-items-center p-4">
        <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
        <div className="relative w-full max-w-lg bg-paper dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-3xl p-6 text-center shadow-pop">
          <h2 className="text-lg font-serif font-semibold">Quiz not available</h2>
          <p className="mt-2 text-sm text-stone-500">No questions were generated for this document.</p>
          <Button className="mt-4" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  const handleSelect = (qIndex: number, oIndex: number) => {
    if (submitted) return;
    setAnswers((p) => ({ ...p, [qIndex]: oIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.correctIndex) score++;
    });
    return score;
  };

  const score = calculateScore();
  const maxScore = quiz.length;

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete(score);
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4 py-8">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => !submitted && onClose()} aria-hidden />
      
      <div className="relative w-full max-w-3xl max-h-full flex flex-col bg-paper dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex-none flex items-center gap-3 px-6 py-5 border-b border-stone-200 dark:border-stone-800 bg-cream/30 dark:bg-stone-900/50">
          <span className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 grid place-items-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </span>
          <div className="flex-1">
            <h2 className="font-serif font-semibold text-xl">Knowledge Check</h2>
            <p className="text-xs text-ink-soft dark:text-stone-400">Answer these {maxScore} questions to test your understanding.</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            <Icon d={PATHS.x} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto nice-scroll p-6 space-y-8 bg-cream/10 dark:bg-stone-950">
          
          {submitted && (
            <div className="mb-8 p-8 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 text-center animate-in slide-in-from-bottom-4">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Your Score</p>
              <div className="text-5xl font-serif font-bold text-ink dark:text-white flex items-baseline justify-center gap-1">
                {score} <span className="text-3xl text-stone-400 font-medium">/ {maxScore}</span>
              </div>
              <p className="text-sm text-stone-500 mt-3">
                {score >= maxScore * 0.8 ? "Outstanding work! You've mastered this material." : score >= maxScore * 0.5 ? "Good effort. Review the explanations below." : "Keep studying! Use the tutor to explain the tricky parts."}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {quiz.map((q, i) => {
              const answered = answers[i] !== undefined;
              const isCorrect = answers[i] === q.correctIndex;

              return (
                <div key={q.id} className={`p-5 rounded-2xl border transition-all ${submitted ? (isCorrect ? 'border-green-200 bg-green-50/30 dark:border-green-900/40 dark:bg-green-900/10' : 'border-red-200 bg-red-50/30 dark:border-red-900/40 dark:bg-red-900/10') : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300'}`}>
                  <h3 className="text-sm font-medium leading-relaxed">
                    <span className="text-stone-400 font-semibold mr-2">{i + 1}.</span>
                    {q.question}
                  </h3>
                  
                  <div className="mt-4 space-y-2">
                    {q.options.map((opt, oIdx) => {
                      const selected = answers[i] === oIdx;
                      let btnClass = "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300";
                      
                      if (submitted) {
                        if (oIdx === q.correctIndex) {
                          btnClass = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 font-medium ring-1 ring-green-500/20";
                        } else if (selected) {
                          btnClass = "border-red-300 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 line-through opacity-70";
                        } else {
                          btnClass = "border-stone-200 dark:border-stone-800 opacity-50";
                        }
                      } else if (selected) {
                        btnClass = "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500";
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={submitted}
                          onClick={() => handleSelect(i, oIdx)}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-[13px] transition-all flex gap-3 ${btnClass}`}
                        >
                          <div className={`w-5 h-5 shrink-0 rounded-full border grid place-items-center transition-colors ${
                            submitted && oIdx === q.correctIndex ? 'border-green-500 bg-green-500 text-white' :
                            submitted && selected ? 'border-red-400 bg-red-400 text-white' :
                            selected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-stone-300 dark:border-stone-600'
                          }`}>
                            {submitted && oIdx === q.correctIndex && <Icon d={PATHS.check} className="w-3 h-3" />}
                          </div>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {submitted && (
                    <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800/60">
                      <p className="text-[13px] text-stone-600 dark:text-stone-400 leading-relaxed">
                        <strong className="text-stone-900 dark:text-stone-200 mr-1.5 font-medium">Explanation:</strong> 
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none p-5 border-t border-stone-200 dark:border-stone-800 bg-paper dark:bg-stone-900 flex justify-between items-center">
          <p className="text-xs text-stone-500">
            {!submitted ? `${Object.keys(answers).length} of ${maxScore} answered` : "Quiz complete"}
          </p>
          {!submitted ? (
            <Button onClick={handleSubmit} disabled={Object.keys(answers).length < maxScore}>
              Submit Answers
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button onClick={onClose} variant="ghost">Close</Button>
              <Button onClick={() => {
                onEmailScore?.(score);
                onClose();
              }} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Icon d={PATHS.mail} className="w-4 h-4 mr-1.5" /> Email my results
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
