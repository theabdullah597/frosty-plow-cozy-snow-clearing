import React from 'react';
import { X, Trophy, CheckCircle, CircleDollarSign, Flame, CloudSnow, Sparkles } from 'lucide-react';
import { sound } from '../game/audio/SynthAudio';

export interface ShiftGoal {
  id: string;
  title: string;
  desc: string;
  target: number;
  current: number;
  rewardCoins: number;
  claimed: boolean;
  icon: string;
}

interface ShiftGoalsModalProps {
  goals: ShiftGoal[];
  onClaimGoal: (id: string, coins: number) => void;
  onClose: () => void;
}

export const ShiftGoalsModal: React.FC<ShiftGoalsModalProps> = ({
  goals,
  onClaimGoal,
  onClose,
}) => {
  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'combo':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'blizzard':
        return <CloudSnow className="w-5 h-5 text-sky-400" />;
      case 'treasure':
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
      default:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 select-none">
      <div className="relative w-full max-w-lg bg-[#0f172a] border border-slate-700/80 rounded-3xl shadow-2xl p-6 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-slate-100 uppercase">Shift Shift Goals</h2>
              <p className="text-xs text-slate-400">Complete snow plowing challenges to earn bonus coin payouts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Goals list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {goals.map((goal) => {
            const isCompleted = goal.current >= goal.target;
            const progressPercent = Math.min(100, Math.round((goal.current / goal.target) * 100));

            return (
              <div
                key={goal.id}
                className="p-3.5 rounded-2xl bg-[#1e293b]/50 border border-slate-800/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                    {getGoalIcon(goal.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-200 truncate">{goal.title}</h3>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-2">
                        {Math.min(goal.current, goal.target)}/{goal.target}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{goal.desc}</p>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-400' : 'bg-sky-400'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Claim action */}
                <div className="shrink-0">
                  {goal.claimed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 px-2.5 py-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Claimed
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        if (isCompleted) {
                          sound.playItemPickup();
                          onClaimGoal(goal.id, goal.rewardCoins);
                        }
                      }}
                      disabled={!isCompleted}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                        isCompleted
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95 cursor-pointer'
                          : 'bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                      }`}
                    >
                      <CircleDollarSign className="w-3.5 h-3.5" />
                      <span>+{goal.rewardCoins}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
