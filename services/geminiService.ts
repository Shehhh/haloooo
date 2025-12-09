import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { createAudioBuffer, createBlob, decodePCM } from './audioUtils';
import { SystemCommand, VoiceName } from '../types';

interface ServiceCallbacks {
  onOpen: () => void;
  onClose: (event: CloseEvent) => void;
  onError: (error: ErrorEvent) => void;
  onAudioData: (amplitude: number) => void; // For visualizer
  onCommand: (command: SystemCommand) => void;
}

interface ServiceConfig {
  voiceName: VoiceName;
}

const systemCommandTool: FunctionDeclaration = {
  name: 'executeSystemCommand',
  description: 'Execute a system level command regarding the interface or application state. Use this when the user asks to shutdown, restart, or check system status.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      command: {
        type: Type.STRING,
        enum: ['shutdown', 'restart', 'status_check'],
        description: 'The specific command to execute.',
      },
    },
    required: ['command'],
  },
};

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private activeStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private sessionPromise: Promise<any> | null = null;
  private outputNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(callbacks: ServiceCallbacks, config: ServiceConfig) {
    // 1. Setup Audio Contexts
    // Input context is 16kHz for Gemini compatibility
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000,
    });
    
    // Output context is 24kHz for high quality response
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
    
    this.outputNode = this.outputAudioContext.createGain();
    this.outputNode.connect(this.outputAudioContext.destination);

    // Setup Analyser for visualization
    this.analyser = this.outputAudioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.outputNode.connect(this.analyser);
    
    // Start Visualizer Loop
    const updateVisualizer = () => {
        if (!this.analyser) return;
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        callbacks.onAudioData(average); // normalized somewhat by logic in component
        this.animationFrameId = requestAnimationFrame(updateVisualizer);
    };
    updateVisualizer();

    // 2. Get Microphone Access
    this.activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // 3. Connect to Gemini Live
    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-lite',
      callbacks: {
        onopen: () => {
          this.startInputStreaming();
          callbacks.onOpen();
        },
        onmessage: async (message: LiveServerMessage) => {
          this.handleServerMessage(message, callbacks);
        },
        onclose: (e) => callbacks.onClose(e),
        onerror: (e) => callbacks.onError(e),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName } },
        },
        tools: [{ functionDeclarations: [systemCommandTool] }],
        systemInstruction: `
            You are J.A.R.V.I.S. (Just A Rather Very Intelligent System). 
            You are a highly advanced AI assistant.
            
            IMPORTANT: You must communicate entirely in URDU.
            Your responses should be concise, precise, and polite, often addressing the user as "Sir" or "Janab".
            
            If the user asks to perform a system action like "shut down" (band kar do), "restart" (phir se chalao), or "status check" (kya haal hai), YOU MUST use the 'executeSystemCommand' tool.
            Do not just say you will do it, actually call the function.
            
            Maintain the persona of a helpful AI assistant from a sci-fi movie, but strictly speaking Urdu.
        `,
      },
    });
  }

  private startInputStreaming() {
    if (!this.inputAudioContext || !this.activeStream || !this.sessionPromise) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.activeStream);
    // Buffer size 4096 is a good balance for latency/performance
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = createBlob(inputData);
      
      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({ media: pcmData });
      });
    };

    source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleServerMessage(message: LiveServerMessage, callbacks: ServiceCallbacks) {
    // Handle Tool Calls (Function Calling)
    if (message.toolCall) {
      const responses = [];
      for (const fc of message.toolCall.functionCalls) {
        if (fc.name === 'executeSystemCommand') {
          const command = (fc.args as any).command as SystemCommand;
          callbacks.onCommand(command);
          
          responses.push({
            id: fc.id,
            name: fc.name,
            response: { result: 'Command executed successfully' } 
          });
        }
      }
      
      if (responses.length > 0) {
        this.sessionPromise?.then(session => {
          session.sendToolResponse({ functionResponses: responses });
        });
      }
      // Note: We don't return here because the model might send audio along with the tool call (or after it)
    }

    if (!this.outputAudioContext || !this.outputNode) return;

    // Handle Interruption
    if (message.serverContent?.interrupted) {
      this.sources.forEach((source) => {
        try { source.stop(); } catch (e) {}
      });
      this.sources.clear();
      this.nextStartTime = 0;
      return;
    }

    // Handle Audio Data
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);

      const audioBytes = decodePCM(base64Audio);
      const audioBuffer = await createAudioBuffer(audioBytes, this.outputAudioContext, 24000);

      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputNode); // Connects to graph including analyser

      source.addEventListener('ended', () => {
        this.sources.delete(source);
      });

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);
    }
  }

  async disconnect() {
    if (this.sessionPromise) {
        // There is no explicit .close() on the session object exposed easily, 
        // but typically we stop the media streams to close the connection implicitly 
        // or just let the object garbage collect if the API doesn't expose disconnect.
        // However, we must stop our local processing.
        // Actually the Live API client usually has a close method on the session if returned,
        // but the SDK pattern shown is `ai.live.connect` returns a promise resolving to session.
        // We will just stop local resources which effectively ends interaction.
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
    }

    if (this.activeStream) {
      this.activeStream.getTracks().forEach(track => track.stop());
    }

    if (this.inputAudioContext) {
      await this.inputAudioContext.close();
    }
    if (this.outputAudioContext) {
      await this.outputAudioContext.close();
    }
    
    if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
    }

    this.sources.clear();
    this.activeStream = null;
    this.inputAudioContext = null;
    this.outputAudioContext = null;
  }
}
