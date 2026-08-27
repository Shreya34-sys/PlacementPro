import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Eye, 
  AlertTriangle, 
  Camera, 
  Activity, 
  Volume2, 
  VolumeX, 
  Mic, 
  Headphones, 
  Radio, 
  Sparkles
} from 'lucide-react';
import { ProctoringEvent } from '../types';
import { motion } from 'motion/react';

interface ProctoringMonitorProps {
  proctoringLogs: ProctoringEvent[];
  onFlagStudent: (id: string) => void;
  onDismissViolation: (id: string) => void;
}

export const ProctoringMonitor: React.FC<ProctoringMonitorProps> = ({
  proctoringLogs,
  onFlagStudent,
  onDismissViolation,
}) => {
  const [selectedLog, setSelectedLog] = useState<ProctoringEvent | null>(proctoringLogs[0] || null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  
  // Audio surveillance states
  const [isAudioListening, setIsAudioListening] = useState<boolean>(false);
  const [volumeLevel, setVolumeLevel] = useState<number>(75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioDecibels, setAudioDecibels] = useState<number>(38);
  const [detectedVoiceAnomaly, setDetectedVoiceAnomaly] = useState<string | null>("Whisper / Ambient murmurs detected at 10:14:02 AM");
  const [isAiAudioEnhancerOn, setIsAiAudioEnhancerOn] = useState<boolean>(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const filteredLogs = proctoringLogs.filter(l => {
    if (filterSeverity === 'all') return true;
    return l.severity === filterSeverity;
  });

  // Simulated live fluctuating audio decibels
  useEffect(() => {
    if (!isLiveActive) return;
    const interval = setInterval(() => {
      const base = 32;
      const fluctuation = Math.floor(Math.random() * 25);
      const isPeak = Math.random() > 0.85;
      const currentDb = isPeak ? 68 + Math.floor(Math.random() * 15) : base + fluctuation;
      setAudioDecibels(currentDb);

      if (currentDb > 65) {
        setDetectedVoiceAnomaly("Secondary voice pattern detected (+14dB above room baseline)");
      }
    }, 900);

    return () => clearInterval(interval);
  }, [isLiveActive]);

  // Handle actual Web Audio synthesis when Admin listens to audio
  const handleToggleAudioListening = () => {
    if (isAudioListening) {
      // Stop audio
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch {
          // ignore
        }
        oscillatorRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setIsAudioListening(false);
    } else {
      // Start ambient room audio listening
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const gain = ctx.createGain();
        gain.gain.value = (volumeLevel / 100) * 0.08;

        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 1.2;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();

        audioContextRef.current = ctx;
        gainNodeRef.current = gain;
        setIsAudioListening(true);
        setIsMuted(false);
      } catch (err) {
        console.warn('AudioContext initialization error:', err);
        setIsAudioListening(true);
      }
    }
  };

  const handleVolumeChange = (newVal: number) => {
    setVolumeLevel(newVal);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = (newVal / 100) * 0.08;
    }
    if (newVal === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = (volumeLevel / 100) * 0.08;
      }
    } else {
      setIsMuted(true);
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = 0;
      }
    }
  };

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs transition-colors duration-500">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Audio-Visual Integrity &amp; Surveillance Console</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Live AI Proctoring &amp; Audio Surveillance Supervisor</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            Real-time candidate camera tracking, synchronized ambient room microphone audio listening, whisper detection, and multi-face gaze analysis.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Live Audio Listening Toggle */}
          <button
            id="proctoring-audio-listen-btn"
            onClick={handleToggleAudioListening}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer shadow-md ${
              isAudioListening 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 shadow-blue-500/25' 
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
            title="Listen to candidate room microphone audio stream"
          >
            <Headphones className={`w-3.5 h-3.5 ${isAudioListening ? 'text-cyan-300 animate-pulse' : 'text-slate-600 dark:text-slate-400'}`} />
            <span>{isAudioListening ? 'Listening to Room Audio' : 'Listen Live Audio'}</span>
            {isAudioListening && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
          </button>

          <button
            id="proctoring-stream-toggle"
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${
              isLiveActive 
                ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveActive ? 'bg-rose-600 animate-pulse' : 'bg-slate-400'}`} />
            <span>{isLiveActive ? 'Live Feeds Active' : 'Feed Paused'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Feed Simulation & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Live Simulated Video & Synchronized Audio Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-4 transition-colors duration-500">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Live Camera &amp; Acoustic Stream</h3>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 font-bold flex items-center space-x-1">
                  <Mic className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Mic: 48kHz Stereo</span>
                </span>
              </div>
            </div>

            {/* Simulated Live Camera Tile with Integrated Audio Controls Overlay */}
            <div 
              id="live-proctor-video-audio-tile"
              className="relative aspect-video bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-between p-3 group shadow-2xl"
            >
              
              {/* Mesh visual overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

              {/* Top Stream Header Overlay */}
              <div className="w-full flex items-center justify-between z-10">
                <div className="flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-bold text-white font-mono">LIVE REC</span>
                  <span className="text-slate-400 font-mono">| 1080p 30fps</span>
                </div>

                {/* Live Room Audio Waveform Decibel Meter Badge */}
                <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px]">
                  <Radio className={`w-3 h-3 ${audioDecibels > 60 ? 'text-amber-400 animate-ping' : 'text-emerald-400'}`} />
                  <span className="text-slate-300 font-mono">Room Audio:</span>
                  <span className={`font-bold font-mono ${audioDecibels > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {audioDecibels} dB
                  </span>
                </div>
              </div>

              {/* Center Bounding Box & Face Landmark Simulation */}
              <div className="w-36 h-40 border-2 border-emerald-400/90 rounded-2xl relative flex flex-col items-center justify-between p-2 shadow-lg shadow-emerald-500/20 z-10 backdrop-blur-[1px]">
                <span className="text-[9px] font-bold bg-emerald-400 text-slate-950 px-1.5 py-0.2 rounded uppercase tracking-wider">
                  Face &amp; Audio Locked
                </span>
                
                <div className="w-9 h-9 rounded-full border border-cyan-300/80 bg-slate-950/40 flex items-center justify-center shadow-inner">
                  <Eye className="w-4 h-4 text-cyan-200" />
                </div>

                {/* Real-time Dynamic Equalizer Bars inside Face Mesh */}
                <div className="flex items-end justify-center space-x-0.5 h-4 w-full px-4">
                  {[40, 70, 30, 90, 50, 80, 60, 100, 45, 75].map((val, idx) => {
                    const heightPercent = isLiveActive ? Math.min(100, Math.max(15, (val * (audioDecibels / 50)))) : 15;
                    return (
                      <div
                        key={idx}
                        className={`w-1 rounded-xs transition-all duration-150 ${
                          audioDecibels > 60 ? 'bg-amber-400' : 'bg-cyan-400'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    );
                  })}
                </div>

                <span className="text-[8px] font-mono text-cyan-200 bg-slate-950/90 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  Gaze: Focused | Mic: Live
                </span>
              </div>

              {/* Bottom Integrated Audio Player & Candidate Info Bar */}
              <div className="w-full z-10 space-y-1.5">
                
                {/* Audio Listening Control Panel */}
                <div className="flex items-center justify-between text-[11px] bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-white">
                  
                  {/* Left: Speaker/Mute & Volume Slider */}
                  <div className="flex items-center space-x-2">
                    <button
                      id="proctor-mic-mute-btn"
                      onClick={handleToggleMute}
                      className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-slate-800 transition cursor-pointer"
                      title={isMuted ? "Unmute room audio" : "Mute room audio"}
                    >
                      {isMuted || volumeLevel === 0 ? (
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </button>

                    <div className="flex items-center space-x-1.5">
                      <input
                        id="proctor-audio-volume-slider"
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volumeLevel}
                        onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                        className="w-16 sm:w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        title={`Audio Monitor Volume: ${volumeLevel}%`}
                      />
                      <span className="text-[10px] font-mono text-slate-400">{isMuted ? '0%' : `${volumeLevel}%`}</span>
                    </div>
                  </div>

                  {/* Right: Audio Listen Mode Indicator */}
                  <div className="flex items-center space-x-2">
                    {isAudioListening ? (
                      <span className="text-[10px] font-bold text-cyan-300 flex items-center space-x-1 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded-md">
                        <Headphones className="w-3 h-3 text-cyan-400 animate-pulse" />
                        <span>Live Audio Streaming</span>
                      </span>
                    ) : (
                      <button
                        onClick={handleToggleAudioListening}
                        className="text-[10px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded-md font-semibold border border-slate-700 transition cursor-pointer"
                      >
                        Click to Listen Audio
                      </button>
                    )}
                  </div>
                </div>

                {/* Candidate Name & AI Gaze status */}
                <div className="flex items-center justify-between text-[10px] bg-slate-950/90 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-white">{selectedLog?.studentName || 'Aaryan Yerudkar'}</span>
                    <span className="text-slate-400 font-mono">({selectedLog?.studentId || '2026-CSBS-01'})</span>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold">Gaze: 98% Focused</span>
                </div>

              </div>

            </div>

            {/* Audio Surveillance AI Anomaly Card */}
            <div className="p-3.5 bg-blue-50/90 dark:bg-slate-800/90 border border-blue-200/80 dark:border-slate-700 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 font-bold text-blue-700 dark:text-blue-300">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>AI Real-Time Acoustic &amp; Voice Analysis</span>
                </div>
                <button
                  onClick={() => setIsAiAudioEnhancerOn(!isAiAudioEnhancerOn)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer ${
                    isAiAudioEnhancerOn 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  AI Noise Filter: {isAiAudioEnhancerOn ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-start space-x-2">
                  <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white">Audio Telemetry:</strong> Room baseline is calibrated at <strong>34 dB</strong>. Current audio frequency spectrum confirms single speaker in room.
                    {detectedVoiceAnomaly && (
                      <div className="text-rose-600 dark:text-rose-400 font-bold mt-1 text-[10px] flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        <span>Recent Anomaly: {detectedVoiceAnomaly}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics summary */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 bg-slate-50/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Audio Violations</div>
                <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">2 Detected</div>
              </div>
              <div className="p-3 bg-slate-50/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Active Test Takers</div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">142 Streamed</div>
              </div>
              <div className="p-3 bg-slate-50/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Integrity Index</div>
                <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">97.8%</div>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Real-time Violation Event Stream (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-4 transition-colors duration-500">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Live Video &amp; Audio Violation Stream ({filteredLogs.length})</h3>
              </div>

              <div className="flex items-center space-x-1 text-xs">
                <select
                  id="proctoring-severity-select"
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Severities</option>
                  <option value="high">High Severity</option>
                  <option value="medium">Medium Severity</option>
                  <option value="low">Low Severity</option>
                </select>
              </div>
            </div>

            {/* Violation cards list */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const isAudioViolation = log.violationType.toLowerCase().includes('voice') || 
                                         log.violationType.toLowerCase().includes('audio') || 
                                         log.violationType.toLowerCase().includes('speech') ||
                                         log.details.toLowerCase().includes('voice') ||
                                         log.details.toLowerCase().includes('sound');

                return (
                  <motion.div
                    key={log.id}
                    id={`proctor-event-${log.id}`}
                    onClick={() => setSelectedLog(log)}
                    whileHover={{ y: -1 }}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 shadow-xs ring-1 ring-rose-400'
                        : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{log.studentName}</span>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">({log.studentId})</span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                            log.severity === 'high'
                              ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : log.severity === 'medium'
                              ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}>
                            {log.severity} severity
                          </span>

                          {isAudioViolation && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center space-x-1">
                              <Volume2 className="w-2.5 h-2.5" />
                              <span>Audio Anomaly</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-rose-700 dark:text-rose-400 font-semibold mt-1 flex items-center space-x-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{log.violationType.replace(/_/g, ' ').toUpperCase()}: {log.details}</span>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        AI Confidence: <strong>{Math.round(log.aiConfidence * 100)}%</strong>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismissViolation(log.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onFlagStudent(log.id);
                          }}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>Flag Candidate</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
