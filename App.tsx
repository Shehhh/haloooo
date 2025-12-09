import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GeminiLiveService } from './services/geminiService';
import ArcReactor from './components/ArcReactor';
import TerminalLog from './components/TerminalLog';
import { ConnectionState, LogEntry, SystemCommand, VoiceName } from './types';

const App: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [volume, setVolume] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Fenrir');
  const serviceRef = useRef<GeminiLiveService | null>(null);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'system') => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
        message,
        type,
      },
    ]);
  }, []);

  useEffect(() => {
    // Initial system check
    addLog('System initialized.', 'system');
    addLog('Language Module: URDU [Active]', 'system');
    addLog('Waiting for neural handshake...', 'system');
    
    // Cleanup on unmount
    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDisconnect = async () => {
    if (serviceRef.current) {
      await serviceRef.current.disconnect();
      setConnectionState(ConnectionState.DISCONNECTED);
      setVolume(0);
      addLog('Disengaging protocols. Goodbye, Sir.', 'system');
    }
  };

  const handleSystemCommand = useCallback((command: SystemCommand) => {
    switch (command) {
      case 'status_check':
        addLog('RUNNING DIAGNOSTICS...', 'system');
        setTimeout(() => addLog('CORE INTEGRITY: 100%', 'system'), 200);
        setTimeout(() => addLog('SHIELD PROTOCOLS: ACTIVE', 'system'), 400);
        setTimeout(() => addLog('NETWORK LATENCY: 12ms', 'system'), 600);
        setTimeout(() => addLog('ALL SYSTEMS NOMINAL', 'ai'), 800);
        break;
      case 'restart':
        addLog('INITIATING REBOOT SEQUENCE...', 'system');
        setConnectionState(ConnectionState.CONNECTING);
        setLogs([]); // Clear logs to simulate reboot
        setTimeout(() => {
             addLog('SYSTEM REBOOTED', 'system');
             setConnectionState(ConnectionState.CONNECTED);
        }, 1500);
        break;
      case 'shutdown':
        addLog('POWER DOWN SEQUENCE INITIATED...', 'system');
        setTimeout(() => {
            handleDisconnect();
        }, 2000);
        break;
    }
  }, [addLog]);

  const handleConnect = async () => {
    try {
      setConnectionState(ConnectionState.CONNECTING);
      addLog(`Initiating secure connection to JARVIS core [VOICE: ${selectedVoice.toUpperCase()}]...`, 'system');

      serviceRef.current = new GeminiLiveService();
      
      await serviceRef.current.connect(
        {
          onOpen: () => {
            setConnectionState(ConnectionState.CONNECTED);
            addLog('Connection established. Audio channels open.', 'system');
            addLog('اسلام علیکم سر، میں آپ کی کیا مدد کر سکتا ہوں؟', 'ai');
          },
          onClose: (event) => {
            setConnectionState(ConnectionState.DISCONNECTED);
            addLog('Connection terminated.', 'system');
          },
          onError: (error) => {
            setConnectionState(ConnectionState.ERROR);
            addLog(`Error detected: ${error.message || 'Unknown Protocol Failure'}`, 'system');
          },
          onAudioData: (vol) => {
            setVolume(vol);
          },
          onCommand: (command) => {
              handleSystemCommand(command);
          }
        },
        { voiceName: selectedVoice }
      );

    } catch (err: any) {
      setConnectionState(ConnectionState.ERROR);
      addLog(`Initialization failed: ${err.message}`, 'system');
    }
  };

  const voices: VoiceName[] = ['Fenrir', 'Kore', 'Puck', 'Charon', 'Zephyr'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center"></div>
      
      {/* HUD Grid Overlay */}
      <div className="absolute inset-0 z-0 hud-grid opacity-30 pointer-events-none"></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_90%)] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl gap-8">
        
        {/* Header HUD */}
        <header className="w-full flex justify-between items-start border-t-2 border-b-2 border-cyan-900/30 py-4 px-6 bg-black/40 backdrop-blur-sm relative">
          <div className="absolute top-0 left-0 w-4 h-full border-l-2 border-cyan-600 opacity-50"></div>
          <div className="absolute top-0 right-0 w-4 h-full border-r-2 border-cyan-600 opacity-50"></div>
          
          <div>
            <h1 className="text-5xl md:text-7xl font-tech font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
              J.A.R.V.I.S.
            </h1>
            <p className="text-cyan-400 font-mono text-xs tracking-[0.5em] mt-2 ml-1 opacity-80">
              JUST A RATHER VERY INTELLIGENT SYSTEM
            </p>
          </div>
          <div className="text-right hidden md:block">
             <div className="text-xs text-cyan-600 font-mono tracking-widest mb-1">SYS.V.2.5.LITE</div>
             <div className="text-xs text-emerald-500 font-mono tracking-widest flex items-center justify-end gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                SECURE CHANNEL
             </div>
             <div className="text-xs text-cyan-800 font-urdu mt-2 text-right dir-rtl">
                نظام فعال ہے
             </div>
          </div>
        </header>

        {/* Main Interface Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-start">
          
          {/* Left Column: Visualizer */}
          <div className="relative">
             {/* Decorative Frame */}
             <div className="absolute -inset-1 bg-gradient-to-r from-cyan-900/0 via-cyan-500/20 to-cyan-900/0 rounded-lg blur-sm"></div>
             
             <div className="relative flex flex-col items-center justify-center min-h-[400px] bg-black/30 border border-cyan-900/50 rounded-lg p-8 backdrop-blur-sm overflow-hidden">
                <div className="absolute top-4 left-4 text-[10px] text-cyan-700 font-mono">VISUAL_FEED_01</div>
                <div className="absolute bottom-4 right-4 text-[10px] text-cyan-700 font-mono">AUDIO_INPUT_GAIN: {(volume * 100).toFixed(1)}%</div>
                
                <ArcReactor active={connectionState === ConnectionState.CONNECTED} volume={volume} />
             </div>
          </div>

          {/* Right Column: Controls & Logs */}
          <div className="flex flex-col gap-6">
            
            {/* Logs Container */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                  <h2 className="text-lg font-tech text-cyan-400 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-cyan-400"></span>
                    COMMAND LOG
                  </h2>
                  <span className="text-[10px] text-cyan-800 font-mono">LIVE FEED</span>
              </div>
              <TerminalLog logs={logs} />
            </div>

            {/* Voice Config */}
            <div className="bg-black/40 border border-cyan-900/30 p-4 rounded-sm">
                 <div className="flex justify-between items-center mb-3">
                    <label className="text-xs text-cyan-500 font-mono tracking-widest">AUDIO OUTPUT SYNTHESIS</label>
                    <div className="h-px bg-cyan-900/50 flex-grow ml-4"></div>
                 </div>
                 
                 <div className="grid grid-cols-5 gap-2">
                     {voices.map(voice => (
                         <button
                            key={voice}
                            onClick={() => setSelectedVoice(voice)}
                            disabled={connectionState !== ConnectionState.DISCONNECTED && connectionState !== ConnectionState.ERROR}
                            className={`
                                relative text-[10px] py-2 border font-mono uppercase transition-all overflow-hidden group
                                ${selectedVoice === voice 
                                    ? 'bg-cyan-950 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                                    : 'bg-transparent border-cyan-900/40 text-cyan-700 hover:border-cyan-600 hover:text-cyan-400'}
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                         >
                             {selectedVoice === voice && (
                                <span className="absolute inset-0 bg-cyan-400/10 animate-pulse"></span>
                             )}
                             {voice}
                         </button>
                     ))}
                 </div>
            </div>

            {/* Main Action Button */}
            <div className="flex gap-4 mt-2">
              {connectionState === ConnectionState.DISCONNECTED || connectionState === ConnectionState.ERROR ? (
                <button
                  onClick={handleConnect}
                  className="relative flex-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 hover:border-cyan-300 px-6 py-5 font-tech tracking-[0.2em] uppercase transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center justify-center gap-3 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(6,182,212,0.1)_50%,transparent_75%)] bg-[length:250%_250%] group-hover:animate-[spin-slow_2s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="relative z-10 font-bold">Initialize System</span>
                </button>
              ) : (
                <button
                  onClick={handleDisconnect}
                  className="relative flex-1 bg-red-950/40 hover:bg-red-900/60 text-red-500 border border-red-900 hover:border-red-500 px-6 py-5 font-tech tracking-[0.2em] uppercase transition-all duration-300 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center gap-3"
                >
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold">Terminate</span>
                </button>
              )}
            </div>

            {/* System Stats Footer */}
            <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-cyan-800 font-mono">
              <div className="bg-cyan-950/20 border border-cyan-900/20 p-2">
                CPU LOAD
                <div className="text-cyan-400 text-sm font-bold mt-1">4%</div>
              </div>
              <div className="bg-cyan-950/20 border border-cyan-900/20 p-2">
                MEMORY
                <div className="text-cyan-400 text-sm font-bold mt-1">128TB</div>
              </div>
              <div className="bg-cyan-950/20 border border-cyan-900/20 p-2">
                UPTIME
                <div className="text-cyan-400 text-sm font-bold mt-1">99.9%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;