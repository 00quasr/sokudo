'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

export function Terminal() {
  const [terminalStep, setTerminalStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const terminalSteps = [
    'git commit -m "feat: add user auth"',
    'docker compose up -d',
    'kubectl apply -f deployment.yaml',
    'npm run build && npm test',
    'git rebase -i HEAD~3',
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setTerminalStep((prev) =>
        prev < terminalSteps.length - 1 ? prev + 1 : prev
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [terminalStep]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(terminalSteps.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-[#111113] border border-white/[0.08] font-mono text-sm">
      {/* Terminal header */}
      <div className="px-4 py-3 border-b border-white/[0.08] flex justify-between items-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-white/10"></div>
          <div className="w-3 h-3 rounded-full bg-white/10"></div>
          <div className="w-3 h-3 rounded-full bg-white/10"></div>
        </div>
        <span className="text-xs text-white/40">terminal</span>
        <button
          onClick={copyToClipboard}
          className="text-white/40 hover:text-white/70 transition-colors"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Terminal content */}
      <div className="p-4 space-y-2">
        {terminalSteps.map((step, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 ${index > terminalStep ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          >
            <span className="text-white/40 select-none">$</span>
            <span className="text-white/80">{step}</span>
          </div>
        ))}
        {terminalStep >= terminalSteps.length - 1 && (
          <div className="flex items-center gap-2 pt-2 mt-2 border-t border-white/[0.08]">
            <span className="text-white/40 select-none">$</span>
            <span className="w-2 h-4 bg-white animate-pulse"></span>
          </div>
        )}
      </div>
    </div>
  );
}
