import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Flag,
  Globe,
  Bell,
  Sparkles
} from 'lucide-react';
import { animateFadeIn } from '../utils/animation';

const CITIES = [
  { name: 'UTC', zone: 'UTC' },
  { name: 'New York', zone: 'America/New_York' },
  { name: 'London', zone: 'Europe/London' },
  { name: 'Paris', zone: 'Europe/Paris' },
  { name: 'Tokyo', zone: 'Asia/Tokyo' },
  { name: 'Sydney', zone: 'Australia/Sydney' }
];

export default function TimeToolsPage() {
  const [activeTab, setActiveTab] = useState<'stopwatch' | 'timer' | 'world'>('stopwatch');

  // World clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Stopwatch state
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0); // in ms
  const [laps, setLaps] = useState<number[]>([]);
  const stopwatchRef = useRef<number | null>(null);

  // Timer state
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(300); // 5 mins in seconds
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 300 });
    }
  }, []);

  // Update world clock every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Stopwatch interval
  useEffect(() => {
    if (stopwatchRunning) {
      const start = Date.now() - stopwatchTime;
      stopwatchRef.current = window.setInterval(() => {
        setStopwatchTime(Date.now() - start);
      }, 10);
    } else if (stopwatchRef.current) {
      clearInterval(stopwatchRef.current);
    }
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, [stopwatchRunning]);

  // Timer interval
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = window.setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            alert('Timer Finished!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  // Format Stopwatch ms to HH:MM:SS.ms
  const formatStopwatch = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  // Format Timer seconds to MM:SS
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLap = () => {
    if (stopwatchRunning) {
      setLaps([stopwatchTime, ...laps]);
    }
  };

  const resetStopwatch = () => {
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setLaps([]);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerRemaining(timerMinutes * 60 + timerSeconds);
  };

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock size={22} />
            </div>
            Time & Productivity Tools
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Precision stopwatch with lap tracking, countdown timer, and world city clocks.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['stopwatch', 'timer', 'world'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                activeTab === t ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* STOPWATCH TAB */}
      {activeTab === 'stopwatch' && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-6 shadow-xs">
          <div className="text-5xl md:text-6xl font-extrabold text-slate-900 font-mono tracking-tight py-4">
            {formatStopwatch(stopwatchTime)}
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setStopwatchRunning(!stopwatchRunning)}
              className={`px-6 py-3 rounded-xl font-bold text-sm text-white shadow-sm transition-all flex items-center gap-2 ${
                stopwatchRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {stopwatchRunning ? <Pause size={16} /> : <Play size={16} />}
              {stopwatchRunning ? 'Pause' : 'Start'}
            </button>

            <button
              onClick={handleLap}
              disabled={!stopwatchRunning}
              className="px-5 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              <Flag size={16} /> Lap
            </button>

            <button
              onClick={resetStopwatch}
              className="px-4 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>

          {/* Laps List */}
          {laps.length > 0 && (
            <div className="pt-4 border-t border-slate-100 max-h-48 overflow-y-auto space-y-1.5 text-xs">
              {laps.map((lap, i) => (
                <div key={i} className="flex justify-between p-2 bg-slate-50 rounded-lg font-mono">
                  <span className="text-slate-500 font-bold">Lap #{laps.length - i}</span>
                  <span className="text-slate-900 font-extrabold">{formatStopwatch(lap)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TIMER TAB */}
      {activeTab === 'timer' && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-6 shadow-xs">
          <div className="text-6xl font-extrabold text-indigo-600 font-mono tracking-tight py-4">
            {formatTimer(timerRemaining)}
          </div>

          {/* Presets and duration inputs */}
          {!timerRunning && (
            <div className="flex items-center justify-center gap-2">
              {[1, 3, 5, 10, 15, 25].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setTimerMinutes(m);
                    setTimerSeconds(0);
                    setTimerRemaining(m * 60);
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-400 text-slate-700"
                >
                  {m}m
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className={`px-6 py-3 rounded-xl font-bold text-sm text-white shadow-sm transition-all flex items-center gap-2 ${
                timerRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {timerRunning ? <Pause size={16} /> : <Play size={16} />}
              {timerRunning ? 'Pause' : 'Start Timer'}
            </button>

            <button
              onClick={resetTimer}
              className="px-4 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>
      )}

      {/* WORLD CLOCK TAB */}
      {activeTab === 'world' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {CITIES.map((c) => {
            const timeStr = currentTime.toLocaleTimeString('en-US', {
              timeZone: c.zone,
              hour12: true,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
            const dateStr = currentTime.toLocaleDateString('en-US', {
              timeZone: c.zone,
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            });

            return (
              <div key={c.name} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-900">{c.name}</span>
                  <span className="font-mono text-[11px]">{c.zone}</span>
                </div>
                <div className="text-2xl font-extrabold text-indigo-600 font-mono pt-1">
                  {timeStr}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {dateStr}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
