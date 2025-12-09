import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalLogProps {
  logs: LogEntry[];
}

const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const isUrdu = (text: string) => {
    // Basic regex to detect Arabic/Urdu unicode range
    return /[\u0600-\u06FF]/.test(text);
  };

  return (
    <div className="w-full max-w-md h-64 overflow-y-auto bg-black/60 border-l-2 border-r-2 border-cyan-900/50 p-4 font-mono text-xs rounded-none backdrop-blur-md relative scanline shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
       {/* Decorative corner markers */}
       <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
       <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500"></div>
       <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500"></div>
       <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>

      {logs.map((log) => {
        const urdu = isUrdu(log.message);
        return (
          <div key={log.id} className={`mb-2 border-b border-cyan-900/10 pb-1 ${urdu ? 'text-right' : 'text-left'}`}>
            <span className="text-cyan-800 text-[10px] tracking-tighter block mb-0.5">
              [{log.timestamp.toLocaleTimeString([], { hour12: false })}.{log.timestamp.getMilliseconds().toString().padStart(3, '0')}]
            </span>{' '}
            <span 
              className={`
                ${log.type === 'system' ? 'text-yellow-500' : log.type === 'ai' ? 'text-cyan-300' : 'text-gray-400'}
                ${urdu ? 'font-urdu text-lg leading-relaxed' : 'font-mono'}
              `}
            >
              {log.type === 'system' ? '>>' : log.type === 'ai' ? (urdu ? 'جاروس:' : 'JARVIS:') : (urdu ? 'آپ:' : 'USER:')} {log.message}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default TerminalLog;