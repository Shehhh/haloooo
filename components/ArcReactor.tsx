import React from 'react';

interface ArcReactorProps {
  active: boolean;
  volume: number; // 0-255 approx
}

const ArcReactor: React.FC<ArcReactorProps> = ({ active, volume }) => {
  // Map volume to scale and glow intensity
  const scale = active ? 1 + (volume / 255) * 0.2 : 1;
  const glow = active ? (volume / 255) : 0.2;
  const color = active ? `rgba(6, 182, 212, ${0.4 + glow})` : 'rgba(6, 182, 212, 0.2)';

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Outer Ring Static */}
      <div className={`absolute w-full h-full border-4 border-cyan-900 rounded-full opacity-50 ${active ? 'animate-[spin-slow_10s_linear_infinite]' : ''}`}></div>
      
      {/* Outer Ring Dashed */}
      <div className={`absolute w-[90%] h-[90%] border-2 border-dashed border-cyan-500 rounded-full ${active ? 'animate-[spin-reverse_15s_linear_infinite]' : ''}`}></div>

      {/* Core Glow */}
      <div 
        className="absolute w-[60%] h-[60%] rounded-full bg-cyan-500 blur-2xl transition-all duration-100 ease-out"
        style={{ 
            opacity: active ? 0.3 + (volume / 400) : 0.1,
            transform: `scale(${scale})`
        }}
      ></div>

      {/* Inner Mechanical Rings */}
      <div className="absolute w-[70%] h-[70%] border border-cyan-400 rounded-full flex items-center justify-center">
        <div className={`w-[80%] h-[80%] border-4 border-cyan-300 rounded-full ${active ? 'animate-pulse' : ''}`} style={{ boxShadow: `0 0 ${20 * glow}px ${color}` }}></div>
      </div>

      {/* Center Triangle/Circle */}
      <div className="absolute w-[30%] h-[30%] bg-cyan-950 border-2 border-cyan-200 rounded-full flex items-center justify-center z-10 shadow-lg shadow-cyan-500/50">
         <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff]"></div>
      </div>
      
      {/* Status Text */}
      <div className="absolute -bottom-16 text-center w-full font-tech tracking-widest text-cyan-500 text-xs">
         {active ? 'SYSTEM ONLINE' : 'STANDBY'}
      </div>
    </div>
  );
};

export default ArcReactor;
