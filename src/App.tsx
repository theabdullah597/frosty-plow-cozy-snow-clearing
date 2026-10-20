/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/simulation/GameEngine';
import { GameState, GameTelemetry, FloatingText, Upgrades, TruckColor } from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GarageModal } from './components/GarageModal';
import { VictoryModal } from './components/VictoryModal';
import { PauseModal } from './components/PauseModal';
import { ShiftGoalsModal, ShiftGoal } from './components/ShiftGoalsModal';
import { sound } from './game/audio/SynthAudio';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High-level Game State
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [selectedDistrict, setSelectedDistrict] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isGoalsOpen, setIsGoalsOpen] = useState<boolean>(false);

  // Shift Goals
  const [goals, setGoals] = useState<ShiftGoal[]>([
    { id: 'snow_100', title: 'Snow Cadet', desc: 'Clear 100 snow piles', target: 100, current: 0, rewardCoins: 60, claimed: false, icon: 'trophy' },
    { id: 'blizzard_100', title: 'Blizzard Battler', desc: 'Plow 100 snow piles in a blizzard', target: 100, current: 0, rewardCoins: 120, claimed: false, icon: 'blizzard' },
    { id: 'combo_5', title: 'Avalanche Chaser', desc: 'Reach 5.0x combo multiplier', target: 5, current: 1, rewardCoins: 150, claimed: false, icon: 'combo' },
    { id: 'treasure_3', title: 'Winter Archaeologist', desc: 'Unearth 3 hidden buried snow treasures', target: 3, current: 0, rewardCoins: 140, claimed: false, icon: 'treasure' },
    { id: 'clear_80', title: 'Pass Protector', desc: 'Reach 80% district road clearance', target: 80, current: 0, rewardCoins: 200, claimed: false, icon: 'trophy' },
    { id: 'speed_25', title: 'Alpine Express', desc: 'Reach 25 km/h with turbo boost', target: 25, current: 0, rewardCoins: 90, claimed: false, icon: 'combo' },
  ]);

  // Upgrades & Color State
  const [upgrades, setUpgrades] = useState<Upgrades>({
    bladeWidth: 1,
    enginePower: 1,
    snowCapacity: 1,
    saltTurbo: 1,
    gripTires: 1,
  });
  const [truckColor, setTruckColor] = useState<TruckColor>('orange');

  // Telemetry reported from 60fps simulation
  const [telemetry, setTelemetry] = useState<GameTelemetry>({
    snowCleared: 0,
    totalSnow: 1000,
    percentCleared: 0,
    coins: 50, // Starting bonus coins to try garage!
    score: 0,
    combo: 1.0,
    comboTimer: 0,
    maxCombo: 1.0,
    boostEnergy: 100,
    isBoosting: false,
    speed: 0,
    isPlowing: false,
    fps: 60,
    weather: 'light_snow',
    weatherTimer: 0,
    windSpeed: 22,
    traction: 85,
    itemsFound: 0,
    blizzardSnowPlowed: 0,
  });

  // Floating score popups
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Victory stats snapshot
  const [victoryStats, setVictoryStats] = useState<{ score: number; coins: number; percent: number }>({
    score: 0,
    coins: 0,
    percent: 0,
  });

  // Floating text spawn callback
  const handleSpawnFloatingText = useCallback((textItem: FloatingText) => {
    setFloatingTexts((prev) => [...prev.slice(-10), textItem]);
  }, []);

  // District Cleared callback
  const handleDistrictCleared = useCallback(
    (distId: number, stats: { score: number; coins: number; percent: number }) => {
      setVictoryStats(stats);
      setGameState('VICTORY');
    },
    []
  );

  // Mount WebGL Game Engine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onTelemetry: (t) => {
        setTelemetry(t);
        setGoals((prev) =>
          prev.map((g) => {
            if (g.claimed) return g;
            let cur = g.current;
            if (g.id === 'snow_100') cur = Math.max(cur, t.snowCleared);
            if (g.id === 'blizzard_100') cur = Math.max(cur, t.blizzardSnowPlowed);
            if (g.id === 'combo_5') cur = Math.max(cur, t.maxCombo);
            if (g.id === 'treasure_3') cur = Math.max(cur, t.itemsFound);
            if (g.id === 'clear_80') cur = Math.max(cur, t.percentCleared);
            if (g.id === 'speed_25') cur = Math.max(cur, t.speed);
            return { ...g, current: cur };
          })
        );
      },
      onDistrictCleared: handleDistrictCleared,
      onSpawnFloatingText: handleSpawnFloatingText,
    });

    // Provide initial bonus coins
    engine.addCoins(50);
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleDistrictCleared, handleSpawnFloatingText]);

  const handleClaimGoal = (id: string, coins: number) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, claimed: true } : g)));
    engineRef.current?.addCoins(coins);
    handleSpawnFloatingText({
      id: Date.now(),
      text: `+${coins} GOAL REWARD!`,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 - 50,
      color: '#34d399',
      scale: 1.3,
      opacity: 1,
    });
  };

  // Floating text fading tick
  useEffect(() => {
    const timer = setInterval(() => {
      setFloatingTexts((prev) =>
        prev
          .map((item) => ({
            ...item,
            y: item.y - 1.5,
            opacity: item.opacity - 0.05,
          }))
          .filter((item) => item.opacity > 0)
      );
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        if (gameState === 'PLAYING') {
          engineRef.current?.setState('PAUSED');
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED' || gameState === 'GARAGE') {
          engineRef.current?.setState('PLAYING');
          setGameState('PLAYING');
        }
      } else if (e.code === 'KeyE') {
        if (gameState === 'PLAYING') {
          engineRef.current?.setState('GARAGE');
          setGameState('GARAGE');
        } else if (gameState === 'GARAGE') {
          engineRef.current?.setState('PLAYING');
          setGameState('PLAYING');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Start game from title
  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.loadDistrict(selectedDistrict);
      engineRef.current.setState('PLAYING');
      setGameState('PLAYING');
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Upgrades
  const handleUpgrade = (key: keyof Upgrades) => {
    if (!engineRef.current) return;

    const upgradeCosts: Record<keyof Upgrades, number[]> = {
      bladeWidth: [150, 350, 750, 1500],
      enginePower: [120, 300, 650, 1400],
      snowCapacity: [100, 250, 600, 1200],
      saltTurbo: [140, 320, 700, 1450],
      gripTires: [110, 280, 620, 1300],
    };

    const currentLvl = upgrades[key];
    if (currentLvl >= 5) return;
    const cost = upgradeCosts[key][currentLvl - 1];

    if (engineRef.current.spendCoins(cost)) {
      const nextUpgrades = {
        ...upgrades,
        [key]: currentLvl + 1,
      };
      setUpgrades(nextUpgrades);
      engineRef.current.setUpgrades(nextUpgrades);
    }
  };

  const handleSelectColor = (color: TruckColor) => {
    setTruckColor(color);
    engineRef.current?.setTruckColor(color);
  };

  const handleNextDistrict = () => {
    const nextId = selectedDistrict >= 3 ? 1 : selectedDistrict + 1;
    setSelectedDistrict(nextId);
    if (engineRef.current) {
      engineRef.current.loadDistrict(nextId);
      engineRef.current.setState('PLAYING');
      setGameState('PLAYING');
    }
  };

  const handleRestartDistrict = () => {
    if (engineRef.current) {
      engineRef.current.restartDistrict();
      engineRef.current.setState('PLAYING');
      setGameState('PLAYING');
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0b1320] text-slate-100 select-none">
      {/* Isolated WebGL Canvas Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Title Screen Overlay */}
      {gameState === 'TITLE' && (
        <div className="relative z-20 w-full h-full">
          <TitleScreen
            onStart={handleStartGame}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={(id) => {
              setSelectedDistrict(id);
              engineRef.current?.loadDistrict(id);
            }}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            coins={telemetry.coins}
          />
        </div>
      )}

      {/* In-Game Active HUD Overlay */}
      {gameState === 'PLAYING' && (
        <div className="relative z-20 w-full h-full">
          <GameHUD
            telemetry={telemetry}
            districtId={selectedDistrict}
            floatingTexts={floatingTexts}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onPause={() => {
              engineRef.current?.setState('PAUSED');
              setGameState('PAUSED');
            }}
            onOpenGarage={() => {
              engineRef.current?.setState('GARAGE');
              setGameState('GARAGE');
            }}
            onOpenGoals={() => {
              setIsGoalsOpen(true);
            }}
            onCycleWeather={() => {
              engineRef.current?.cycleWeather();
            }}
            onVirtualJoystick={(joy, boost) => {
              engineRef.current?.setVirtualInput(joy, boost);
            }}
          />
        </div>
      )}

      {/* Shift Goals Modal */}
      {isGoalsOpen && (
        <ShiftGoalsModal
          goals={goals}
          onClaimGoal={handleClaimGoal}
          onClose={() => setIsGoalsOpen(false)}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={() => {
            engineRef.current?.setState('PLAYING');
            setGameState('PLAYING');
          }}
          onRestartDistrict={handleRestartDistrict}
          onOpenGarage={() => {
            setGameState('GARAGE');
          }}
          onTitleScreen={() => {
            engineRef.current?.setState('TITLE');
            setGameState('TITLE');
          }}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Garage Upgrades Modal */}
      {gameState === 'GARAGE' && (
        <GarageModal
          upgrades={upgrades}
          onUpgrade={handleUpgrade}
          coins={telemetry.coins}
          selectedColor={truckColor}
          onSelectColor={handleSelectColor}
          onClose={() => {
            engineRef.current?.setState('PLAYING');
            setGameState('PLAYING');
          }}
        />
      )}

      {/* Victory Celebration Modal */}
      {gameState === 'VICTORY' && (
        <VictoryModal
          districtId={selectedDistrict}
          stats={victoryStats}
          onNextDistrict={handleNextDistrict}
          onOpenGarage={() => {
            setGameState('GARAGE');
          }}
          onContinuePlowing={() => {
            engineRef.current?.setState('PLAYING');
            setGameState('PLAYING');
          }}
          onRestartDistrict={handleRestartDistrict}
        />
      )}
    </main>
  );
}
