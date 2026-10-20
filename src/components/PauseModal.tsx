import React from 'react';
import { Play, RotateCcw, Wrench, Volume2, VolumeX, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestartDistrict: () => void;
  onOpenGarage: () => void;
  onTitleScreen: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestartDistrict,
  onOpenGarage,
  onTitleScreen,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 select-none">
      <div className="relative w-full max-w-sm bg-[#0f172a] border border-slate-700/80 rounded-3xl shadow-2xl p-6 text-center flex flex-col items-center">
        <h2 className="text-xl font-black text-slate-100 tracking-wide uppercase">Game Paused</h2>
        <p className="text-xs text-slate-400 mt-0.5">Take a cozy winter breather</p>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5 my-6">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-sm hover:brightness-110 active:scale-95 transition shadow-lg shadow-orange-500/20 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>RESUME PLOWING</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Garage Upgrades</span>
          </button>

          <button
            onClick={onRestartDistrict}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-sky-400" />
            <span>Restart District</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
            <span>{isMuted ? 'Unmute Sound' : 'Mute Sound'}</span>
          </button>

          <button
            onClick={onTitleScreen}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Title Screen</span>
          </button>
        </div>

        {/* Quick controls help */}
        <div className="w-full p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 text-left space-y-1">
          <div className="flex justify-between">
            <span>Steer / Drive:</span>
            <span className="font-mono text-slate-300">WASD / Arrow Keys</span>
          </div>
          <div className="flex justify-between">
            <span>Turbo Boost / Salt:</span>
            <span className="font-mono text-slate-300">Spacebar</span>
          </div>
          <div className="flex justify-between">
            <span>Garage Shop:</span>
            <span className="font-mono text-slate-300">E key</span>
          </div>
        </div>
      </div>
    </div>
  );
};
