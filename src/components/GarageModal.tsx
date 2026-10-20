import React from 'react';
import { X, Wrench, Shield, Zap, CircleDollarSign, ArrowUpRight, Check, Paintbrush, Gauge } from 'lucide-react';
import { Upgrades, TruckColor } from '../game/types';
import { TRUCK_COLORS } from '../game/graphics/models';
import { sound } from '../game/audio/SynthAudio';

interface GarageModalProps {
  upgrades: Upgrades;
  onUpgrade: (key: keyof Upgrades) => void;
  coins: number;
  selectedColor: TruckColor;
  onSelectColor: (c: TruckColor) => void;
  onClose: () => void;
}

interface UpgradeConfig {
  key: keyof Upgrades;
  title: string;
  desc: string;
  icon: React.ReactNode;
  costs: number[]; // cost for levels 2, 3, 4, 5
  labels: string[];
}

const UPGRADE_CONFIGS: UpgradeConfig[] = [
  {
    key: 'bladeWidth',
    title: 'Heavy Plow Blade',
    desc: 'Widens the snow clearing sweep arc, plowing more snow in fewer passes.',
    icon: <Shield className="w-5 h-5 text-sky-400" />,
    costs: [150, 350, 750, 1500],
    labels: ['2.4m Standard', '2.8m Winged', '3.4m V-Plow', '4.0m Commercial', '4.6m Titan Gold'],
  },
  {
    key: 'enginePower',
    title: 'V8 Turbocharged Engine',
    desc: 'Increases forward acceleration, top speed, and plowing torque through heavy snow.',
    icon: <Gauge className="w-5 h-5 text-amber-400" />,
    costs: [120, 300, 650, 1400],
    labels: ['Stock 220hp', 'Tuned 300hp', 'V8 Twin Turbo', 'Supercharged', 'Alpine Dominator'],
  },
  {
    key: 'snowCapacity',
    title: 'Salt Hopper & Cash Yield',
    desc: 'Multiplies coins collected per cubic meter of snow and rewards combo streaks.',
    icon: <CircleDollarSign className="w-5 h-5 text-emerald-400" />,
    costs: [100, 250, 600, 1200],
    labels: ['Basic Hopper (+0%)', 'Heated Bed (+40%)', 'Crusher Bed (+80%)', 'Automated (+120%)', 'Midas Melt (+160%)'],
  },
  {
    key: 'saltTurbo',
    title: 'Nitro Jet & Salt Spreader',
    desc: 'Recharges boost energy faster and gives higher top speed during Space/Boost.',
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    costs: [140, 320, 700, 1450],
    labels: ['Manual Salt', 'Quick Jet (+25%)', 'Dual Afterburner', 'Plasma Salt Jet', 'Blizzard Thruster'],
  },
  {
    key: 'gripTires',
    title: 'Chained All-Terrain Tires',
    desc: 'Provides tight steering responsiveness and prevents uncontrollable slipping on ice.',
    icon: <Wrench className="w-5 h-5 text-indigo-400" />,
    costs: [110, 280, 620, 1300],
    labels: ['All-Season', 'Deep Treads', 'Steel Studs', 'Diamond Chains', 'Magnetic Track-Grip'],
  },
];

export const GarageModal: React.FC<GarageModalProps> = ({
  upgrades,
  onUpgrade,
  coins,
  selectedColor,
  onSelectColor,
  onClose,
}) => {
  const handleUpgradeClick = (key: keyof Upgrades, cost: number) => {
    if (coins >= cost && upgrades[key] < 5) {
      sound.playCoin();
      onUpgrade(key);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 select-none">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#131d31]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Wrench className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-slate-100 uppercase">Alpine Rig Garage</h2>
              <p className="text-xs text-slate-400">Upgrade vehicle components & customize custom snowplow paint</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-amber-300 font-bold text-sm">
              <CircleDollarSign className="w-4 h-4 text-amber-400" />
              <span className="tabular-nums">{coins}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Paint Swatches */}
          <div className="p-4 rounded-2xl bg-[#1e293b]/50 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Paintbrush className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Truck Livery Finish</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {(Object.keys(TRUCK_COLORS) as TruckColor[]).map((cKey) => {
                const conf = TRUCK_COLORS[cKey];
                const isSelected = selectedColor === cKey;
                return (
                  <button
                    key={cKey}
                    onClick={() => {
                      sound.playComboChime(2);
                      onSelectColor(cKey);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                      isSelected
                        ? 'border-amber-400 bg-slate-800 text-slate-100 shadow-md'
                        : 'border-slate-700/80 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: `#${conf.hex.toString(16).padStart(6, '0')}` }}
                    />
                    <span>{conf.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-amber-400 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upgrades List */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Performance Upgrades</span>

            {UPGRADE_CONFIGS.map((u) => {
              const currentLvl = upgrades[u.key];
              const isMax = currentLvl >= 5;
              const nextCost = isMax ? 0 : u.costs[currentLvl - 1];
              const canAfford = coins >= nextCost && !isMax;

              return (
                <div
                  key={u.key}
                  className="p-4 rounded-2xl bg-[#1e293b]/40 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                      {u.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-200">{u.title}</h3>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                          LVL {currentLvl}/5
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 max-w-sm">{u.desc}</p>
                      <p className="text-[11px] text-amber-300/90 font-medium mt-1 font-mono">
                        Current: {u.labels[currentLvl - 1]}
                      </p>

                      {/* 5-Segment Level Pip Bar */}
                      <div className="flex items-center gap-1.5 mt-2">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div
                            key={lvl}
                            className={`h-1.5 w-7 rounded-full transition-colors ${
                              lvl <= currentLvl
                                ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                                : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <div className="sm:self-center shrink-0">
                    {isMax ? (
                      <span className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-950/70 text-emerald-400 border border-emerald-800 text-xs font-bold">
                        <Check className="w-4 h-4" />
                        MAX LEVEL
                      </span>
                    ) : (
                      <button
                        onClick={() => handleUpgradeClick(u.key, nextCost)}
                        disabled={!canAfford}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition shadow-md ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110 active:scale-95 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                        }`}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>UPGRADE</span>
                        <span className="flex items-center gap-0.5 ml-1 tabular-nums">
                          <CircleDollarSign className="w-3.5 h-3.5" />
                          {nextCost}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#131d31] flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Drive into clear snow to earn more coins!</span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Back to Plowing
          </button>
        </div>
      </div>
    </div>
  );
};
