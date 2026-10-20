import React, { useEffect } from 'react';
import { Volume2, VolumeX, Trophy, Play } from 'lucide-react';
import { DISTRICTS } from '../game/simulation/WorldGenerator';
import { sound } from '../game/audio/SynthAudio';

interface TitleScreenProps {
  onStart: () => void;
  selectedDistrict: number;
  onSelectDistrict: (id: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  coins: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  selectedDistrict,
  onSelectDistrict,
  isMuted,
  onToggleMute,
  coins,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStart]);

  const activeDistrict = DISTRICTS.find((d) => d.id === selectedDistrict) || DISTRICTS[0];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Bar with Audio & Coins */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0f172a]/80 border border-slate-700/60 shadow-lg text-xs font-semibold text-amber-300">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400">Total Coins:</span>
          <span className="tabular-nums font-bold text-amber-300">{coins}</span>
        </div>

        <button
          onClick={onToggleMute}
          className="p-2.5 rounded-full bg-[#0f172a]/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95 shadow-lg"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-sky-400" />}
        </button>
      </div>

      {/* Hero Centerpiece Lockup (Title & CTA) */}
      <div className="flex flex-col items-center justify-center text-center my-auto pointer-events-auto max-w-xl mx-auto">
        {/* Bespoke inline SVG Title Lockup */}
        <div className="mb-3 relative">
          <svg className="w-64 h-24 sm:w-80 sm:h-28" viewBox="0 0 320 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="snowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#93c5fd" />
              </linearGradient>
              <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0284c7" floodOpacity="0.4" />
              </filter>
            </defs>
            {/* Mountain Peaks Silhouette in background */}
            <path d="M40 85L85 30L125 75L165 20L215 85L270 38L305 85H15Z" fill="#1e293b" opacity="0.65" />
            <path d="M78 38L85 30L95 44L88 47Z" fill="#ffffff" opacity="0.9" />
            <path d="M158 29L165 20L175 32L167 36Z" fill="#ffffff" opacity="0.9" />
            <path d="M263 44L270 38L278 48L272 52Z" fill="#ffffff" opacity="0.9" />

            {/* Stylized Text: FROSTY */}
            <text x="160" y="58" textAnchor="middle" fill="url(#snowGrad)" filter="url(#softGlow)"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '38px', letterSpacing: '4px' }}>
              FROSTY
            </text>

            {/* Stylized Text: PLOW */}
            <text x="160" y="98" textAnchor="middle" fill="url(#orangeGrad)"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '42px', letterSpacing: '6px' }}>
              PLOW
            </text>
          </svg>
        </div>

        <p className="text-slate-300 text-sm sm:text-base font-medium mb-6 max-w-md drop-shadow">
          Clear snowy mountain roads, build blazing combo streaks, and upgrade your heavy winter rig.
        </p>

        {/* District Selector Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {DISTRICTS.map((d) => (
            <button
              key={d.id}
              onClick={() => onSelectDistrict(d.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition border ${
                selectedDistrict === d.id
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-[#0f172a]/80 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span className="font-bold mr-1">#{d.id}</span> {d.name}
            </button>
          ))}
        </div>

        {/* Start Game Primary CTA */}
        <button
          onClick={onStart}
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-extrabold text-lg sm:text-xl shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950 text-slate-950" />
          <span>START PLOWING</span>
          <span className="hidden sm:inline-block text-xs font-bold px-2 py-0.5 rounded bg-black/20 text-slate-900 border border-black/10">
            SPACE
          </span>
        </button>

        <p className="text-xs text-slate-400 mt-2 font-medium">
          Target: Clear <strong className="text-sky-300">{activeDistrict.targetPercent}%</strong> of snow in {activeDistrict.name}
        </p>
      </div>

      {/* Flat Control-Hint Line Footer */}
      <div className="w-full text-center pointer-events-auto">
        <div className="inline-flex items-center justify-center gap-2 sm:gap-4 px-4 py-2 rounded-xl bg-[#0b1320]/80 border border-slate-800 text-xs sm:text-sm text-slate-400 font-medium">
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono">WASD</kbd> or Arrows Drive</span>
          <span className="text-slate-600">·</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono">Space</kbd> Turbo Boost</span>
          <span className="text-slate-600">·</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono">E</kbd> Upgrades</span>
          <span className="text-slate-600">·</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono">Esc</kbd> Pause</span>
        </div>
      </div>
    </div>
  );
};
