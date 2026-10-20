import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Pause, Wrench, Zap, Trophy, Flame, ChevronUp, ChevronDown, CloudSnow, Sun, Wind, Compass } from 'lucide-react';
import { GameTelemetry, FloatingText, WeatherType } from '../game/types';
import { DISTRICTS } from '../game/simulation/WorldGenerator';

interface GameHUDProps {
  telemetry: GameTelemetry;
  districtId: number;
  floatingTexts: FloatingText[];
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenGarage: () => void;
  onOpenGoals: () => void;
  onCycleWeather: () => void;
  onVirtualJoystick: (joystick: { x: number; y: number }, boost: boolean) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  telemetry,
  districtId,
  floatingTexts,
  isMuted,
  onToggleMute,
  onPause,
  onOpenGarage,
  onOpenGoals,
  onCycleWeather,
  onVirtualJoystick,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const district = DISTRICTS.find((d) => d.id === districtId) || DISTRICTS[0];

  // Touch joystick tracking
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [virtualBoostActive, setVirtualBoostActive] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Combo tier title
  const getComboTitle = (combo: number) => {
    if (combo >= 8.0) return { title: 'AVALANCHE!', color: 'text-rose-400 bg-rose-950/80 border-rose-500' };
    if (combo >= 5.0) return { title: 'BLIZZARD!', color: 'text-amber-300 bg-amber-950/80 border-amber-500' };
    if (combo >= 3.0) return { title: 'FROST RUN!', color: 'text-cyan-300 bg-cyan-950/80 border-cyan-500' };
    if (combo >= 1.5) return { title: 'CRISP!', color: 'text-sky-300 bg-sky-950/80 border-sky-500' };
    return { title: 'CHILL', color: 'text-slate-300 bg-slate-900/80 border-slate-700' };
  };

  const comboInfo = getComboTitle(telemetry.combo);

  // Weather badge styling
  const getWeatherBadge = (weather: WeatherType) => {
    if (weather === 'clear') {
      return {
        label: 'Clear Skies',
        icon: <Sun className="w-4 h-4 text-amber-400" />,
        desc: 'Max Grip · High Visibility',
        bg: 'bg-amber-950/70 border-amber-500/50 text-amber-200',
      };
    }
    if (weather === 'blizzard') {
      return {
        label: 'Heavy Blizzard',
        icon: <CloudSnow className="w-4 h-4 text-sky-300" />,
        desc: 'Low Traction · High Wind Drift',
        bg: 'bg-rose-950/70 border-rose-500/60 text-rose-200',
      };
    }
    return {
      label: 'Gentle Snow',
      icon: <Wind className="w-4 h-4 text-cyan-300" />,
      desc: 'Standard Winter Road Handling',
      bg: 'bg-sky-950/70 border-sky-500/50 text-sky-200',
    };
  };

  const weatherBadge = getWeatherBadge(telemetry.weather);

  // Joystick touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const touch = e.touches[0];

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const maxRadius = rect.width / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const normX = dist > 0 ? (dx / dist) * Math.min(dist, maxRadius) : 0;
    const normY = dist > 0 ? (dy / dist) * Math.min(dist, maxRadius) : 0;

    setJoystickPos({ x: normX, y: normY });
    onVirtualJoystick({ x: normX / maxRadius, y: normY / maxRadius }, virtualBoostActive);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setJoystickPos({ x: 0, y: 0 });
    onVirtualJoystick({ x: 0, y: 0 }, virtualBoostActive);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* Dynamic Blizzard Screen Vignette */}
      {telemetry.weather === 'blizzard' && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(15,23,42,0.55)_100%)] transition-opacity duration-1000" />
      )}

      {/* 1. TOP-LEFT PERIMETER CLUSTER: Snow Progress & District Info */}
      <div className="absolute top-4 left-4 pointer-events-auto flex flex-col gap-2 max-w-[280px] sm:max-w-xs">
        {/* District & Coins Badge */}
        <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-[#0f172a]/90 border border-slate-700/80 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">{district.name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="tabular-nums">{telemetry.coins}</span>
          </div>
        </div>

        {/* Snow Cleared Progress Bar */}
        <div className="p-3 rounded-xl bg-[#0f172a]/90 border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Snow Cleared</span>
            <span className="font-extrabold tabular-nums text-slate-100">
              {telemetry.percentCleared}% <span className="text-slate-500 font-normal">/ {district.targetPercent}% target</span>
            </span>
          </div>

          <div className="relative w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
              style={{ left: `${district.targetPercent}%` }}
              title={`Target: ${district.targetPercent}%`}
            />
            <div
              className={`h-full transition-all duration-150 rounded-full ${
                telemetry.percentCleared >= district.targetPercent
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-sky-500 to-cyan-400'
              }`}
              style={{ width: `${Math.min(100, telemetry.percentCleared)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 tabular-nums font-mono">
            <span>{telemetry.snowCleared} piles cleared</span>
            <span>Score: {telemetry.score}</span>
          </div>
        </div>

        {/* Dynamic Weather Forecast Button & Badge */}
        <button
          onClick={onCycleWeather}
          className={`flex items-center justify-between px-3 py-2 rounded-xl border shadow-md transition active:scale-95 text-left cursor-pointer ${weatherBadge.bg}`}
          title="Click to switch weather (Clear Skies, Gentle Snow, Heavy Blizzard)"
        >
          <div className="flex items-center gap-2">
            {weatherBadge.icon}
            <div>
              <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>{weatherBadge.label}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 font-mono text-slate-300">
                  {telemetry.windSpeed} km/h
                </span>
              </div>
              <div className="text-[10px] opacity-80">{weatherBadge.desc}</div>
            </div>
          </div>
          <div className="text-[10px] font-mono opacity-60 ml-2">Click to cycle ↻</div>
        </button>
      </div>

      {/* 2. TOP-RIGHT PERIMETER CLUSTER: Combo Meter & Actions */}
      <div className="absolute top-4 right-4 pointer-events-auto flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGoals}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0f172a]/90 border border-amber-500/40 text-amber-300 hover:text-white hover:bg-slate-800 active:scale-95 transition shadow-md cursor-pointer"
            title="Shift Goals & Challenges"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-extrabold hidden sm:inline">GOALS</span>
          </button>
          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-[#0f172a]/90 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition shadow-md"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
          <button
            onClick={onPause}
            className="p-2 rounded-xl bg-[#0f172a]/90 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition shadow-md"
            title="Pause Game (Esc)"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Combo Meter */}
        <div
          className={`px-3 py-2 rounded-xl border shadow-lg transition-all duration-150 flex flex-col items-end min-w-[130px] ${comboInfo.color}`}
        >
          <div className="flex items-center gap-1.5">
            <Flame className={`w-4 h-4 ${telemetry.combo > 1.5 ? 'text-amber-400' : 'text-slate-500'}`} />
            <span className="text-[11px] font-extrabold tracking-wider">{comboInfo.title}</span>
            <span className="text-base font-black tabular-nums tracking-tight">x{telemetry.combo.toFixed(1)}</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-black/40 mt-1.5 overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-75"
              style={{ width: `${Math.max(0, Math.min(100, telemetry.comboTimer * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. FLOATING POPUP TEXTS */}
      {floatingTexts.map((item) => (
        <div
          key={item.id}
          className="absolute font-black pointer-events-none transform -translate-x-1/2 -translate-y-1/2 text-shadow-cozy animate-bounce"
          style={{
            left: `${item.x}px`,
            top: `${item.y}px`,
            color: item.color,
            fontSize: `${18 * item.scale}px`,
            opacity: item.opacity,
            transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
          }}
        >
          {item.text}
        </div>
      ))}

      {/* 4. UNIFIED BOTTOM CONTROL DOCK (Collapsible, low occlusion) */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-auto transition-transform duration-300 ease-out flex flex-col items-center ${
          isDockCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
        }`}
      >
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="px-3 py-1 rounded-t-lg bg-[#0f172a]/95 border-t border-x border-slate-700/80 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 shadow-md cursor-pointer"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Show Rig Telemetry & Upgrades</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Hide Dock</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-3 sm:gap-4 px-4 py-2.5 rounded-2xl bg-[#0f172a]/95 border border-slate-700/90 shadow-2xl max-w-[95vw]">
          {/* Speedometer */}
          <div className="flex flex-col items-center min-w-[50px]">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Speed</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-black tabular-nums text-slate-100">{telemetry.speed}</span>
              <span className="text-[10px] text-slate-500 font-mono">km/h</span>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-800" />

          {/* Road Traction Gauge */}
          <div className="flex flex-col items-center min-w-[50px]">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Grip</span>
            <div className="flex items-baseline gap-0.5">
              <span
                className={`text-lg font-black tabular-nums ${
                  telemetry.traction >= 80 ? 'text-emerald-400' : telemetry.traction >= 60 ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {telemetry.traction}%
              </span>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-800" />

          {/* Boost Energy Gauge */}
          <div className="flex flex-col gap-1 min-w-[100px] sm:min-w-[120px]">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="flex items-center gap-1 text-amber-400">
                <Zap className="w-3 h-3 fill-amber-400" />
                <span>TURBO SALT</span>
              </span>
              <span className="text-slate-400 tabular-nums">{telemetry.boostEnergy}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  telemetry.isBoosting
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 animate-pulse'
                    : 'bg-gradient-to-r from-amber-500 to-amber-300'
                }`}
                style={{ width: `${telemetry.boostEnergy}%` }}
              />
            </div>
          </div>

          <div className="w-px h-8 bg-slate-800" />

          {/* Garage Upgrades Action CTA */}
          <button
            onClick={onOpenGarage}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-slate-950" />
            <span>GARAGE SHOP</span>
          </button>
        </div>
      </div>

      {/* 5. MOBILE TOUCH CONTROLS */}
      {isTouchDevice && (
        <>
          <div
            ref={joystickBaseRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="absolute bottom-6 left-6 w-28 h-28 rounded-full bg-slate-900/60 border-2 border-slate-600/70 pointer-events-auto flex items-center justify-center touch-none"
          >
            <div
              className="w-12 h-12 rounded-full bg-sky-500/80 border-2 border-sky-300 shadow-lg pointer-events-none"
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
            />
          </div>

          <button
            onTouchStart={() => {
              setVirtualBoostActive(true);
              onVirtualJoystick({ x: 0, y: 0 }, true);
            }}
            onTouchEnd={() => {
              setVirtualBoostActive(false);
              onVirtualJoystick({ x: 0, y: 0 }, false);
            }}
            className="absolute bottom-6 right-6 w-18 h-18 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 border-2 border-amber-200 pointer-events-auto flex flex-col items-center justify-center shadow-xl active:scale-90 transition text-slate-950 font-black touch-none"
          >
            <Zap className="w-6 h-6 fill-slate-950" />
            <span className="text-[10px] uppercase font-extrabold">BOOST</span>
          </button>
        </>
      )}
    </div>
  );
};
