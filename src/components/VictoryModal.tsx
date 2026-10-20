import React from 'react';
import { Trophy, ArrowRight, Wrench, Sparkles, RotateCcw } from 'lucide-react';
import { DISTRICTS } from '../game/simulation/WorldGenerator';

interface VictoryModalProps {
  districtId: number;
  stats: { score: number; coins: number; percent: number };
  onNextDistrict: () => void;
  onOpenGarage: () => void;
  onContinuePlowing: () => void;
  onRestartDistrict: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  districtId,
  stats,
  onNextDistrict,
  onOpenGarage,
  onContinuePlowing,
  onRestartDistrict,
}) => {
  const currentDistrict = DISTRICTS.find((d) => d.id === districtId) || DISTRICTS[0];
  const hasNext = districtId < 3;
  const nextDistrict = DISTRICTS.find((d) => d.id === districtId + 1) || DISTRICTS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 select-none">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-amber-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-center flex flex-col items-center">
        {/* Glow Trophy Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
          <Trophy className="w-8 h-8 text-slate-950" />
        </div>

        <span className="text-xs font-black tracking-widest uppercase text-amber-400">
          DISTRICT ROAD CLEARANCE COMPLETE
        </span>
        <h2 className="text-2xl font-black text-slate-100 mt-1">{currentDistrict.name}</h2>
        <p className="text-xs text-slate-400 mt-1">The mountain pass is safe and clear for winter travel!</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full my-6">
          <div className="p-3 rounded-2xl bg-[#1e293b]/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Clean Rate</span>
            <div className="text-xl font-black text-emerald-400 tabular-nums">{stats.percent}%</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#1e293b]/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Score</span>
            <div className="text-xl font-black text-sky-400 tabular-nums">{stats.score}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          {hasNext ? (
            <button
              onClick={onNextDistrict}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-sm sm:text-base hover:brightness-110 active:scale-95 transition shadow-lg shadow-orange-500/25 cursor-pointer"
            >
              <span>ADVANCE TO {nextDistrict.name.toUpperCase()}</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>
          ) : (
            <button
              onClick={onRestartDistrict}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-sm sm:text-base hover:brightness-110 active:scale-95 transition shadow-lg shadow-orange-500/25 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>REPLAY DISTRICTS (ALL CLEARED!)</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenGarage}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Garage Shop</span>
            </button>

            <button
              onClick={onContinuePlowing}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Keep Plowing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
