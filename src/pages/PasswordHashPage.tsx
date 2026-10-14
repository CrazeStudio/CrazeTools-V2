import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Hash,
  Lock,
  Sparkles,
  Sliders
} from 'lucide-react';
import { animateFadeIn } from '../utils/animation';

// Cryptographic hash helper using window.crypto.subtle
async function computeHash(message: string, algorithm: 'SHA-256' | 'SHA-512' | 'SHA-1'): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest(algorithm, msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function PasswordHashPage() {
  // Password Generator state
  const [length, setLength] = useState(18);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState('');
  const [copiedPass, setCopiedPass] = useState(false);

  // Hash Generator state
  const [hashInput, setHashInput] = useState('DailyToolKit');
  const [hashes, setHashes] = useState<{ sha256: string; sha512: string; sha1: string }>({
    sha256: '',
    sha512: '',
    sha1: ''
  });
  const [copiedHashKey, setCopiedHashKey] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 300 });
    }
  }, []);

  // Generate strong random password
  const generatePassword = () => {
    let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let lower = 'abcdefghijklmnopqrstuvwxyz';
    let numbers = '0123456789';
    let symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeAmbiguous) {
      upper = upper.replace(/[IO]/g, '');
      lower = lower.replace(/[lo]/g, '');
      numbers = numbers.replace(/[01]/g, '');
      symbols = symbols.replace(/[|]/g, '');
    }

    let charset = '';
    if (useUpper) charset += upper;
    if (useLower) charset += lower;
    if (useNumbers) charset += numbers;
    if (useSymbols) charset += symbols;

    if (!charset) {
      setPassword('');
      return;
    }

    const randomVals = new Uint32Array(length);
    window.crypto.getRandomValues(randomVals);

    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[randomVals[i] % charset.length];
    }
    setPassword(result);
  };

  useEffect(() => {
    generatePassword();
  }, [length, useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous]);

  // Compute live cryptographic hashes
  useEffect(() => {
    if (!hashInput) {
      setHashes({ sha256: '', sha512: '', sha1: '' });
      return;
    }
    Promise.all([
      computeHash(hashInput, 'SHA-256'),
      computeHash(hashInput, 'SHA-512'),
      computeHash(hashInput, 'SHA-1')
    ]).then(([sha256, sha512, sha1]) => {
      setHashes({ sha256, sha512, sha1 });
    });
  }, [hashInput]);

  // Password Entropy & Strength
  const strengthInfo = useMemo(() => {
    let poolSize = 0;
    if (useUpper) poolSize += 26;
    if (useLower) poolSize += 26;
    if (useNumbers) poolSize += 10;
    if (useSymbols) poolSize += 30;

    const entropy = Math.round(length * Math.log2(poolSize || 1));

    if (entropy < 40) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-600', entropy };
    if (entropy < 65) return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-600', entropy };
    if (entropy < 90) return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600', entropy };
    return { label: 'Very Strong', color: 'bg-indigo-600', text: 'text-indigo-600', entropy };
  }, [length, useUpper, useLower, useNumbers, useSymbols]);

  const copyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const copyHash = (hash: string, key: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashKey(key);
    setTimeout(() => setCopiedHashKey(null), 2000);
  };

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <KeyRound size={22} />
            </div>
            Password & Hash Generator
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Generate cryptographically random passwords and SHA-256 / SHA-512 cryptographic hashes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Password Generator Card */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={14} className="text-indigo-600" /> Random Password
            </span>
            <span className={`text-xs font-bold ${strengthInfo.text}`}>
              {strengthInfo.label} ({strengthInfo.entropy} bits)
            </span>
          </div>

          {/* Generated Password Box */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-3">
            <div className="font-mono text-base md:text-lg font-bold text-slate-900 break-all select-all">
              {password || 'Select options'}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={generatePassword}
                title="Regenerate"
                className="p-2 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={copyPassword}
                title="Copy Password"
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
              >
                {copiedPass ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Strength progress bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${strengthInfo.color} transition-all duration-300`}
              style={{ width: `${Math.min(100, (strengthInfo.entropy / 100) * 100)}%` }}
            />
          </div>

          {/* Length Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-700">
              <span className="font-medium">Password Length</span>
              <span className="font-mono font-bold text-indigo-600">{length} characters</span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Options Checkboxes */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={useUpper}
                onChange={(e) => setUseUpper(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              <span>Uppercase (A-Z)</span>
            </label>
            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={useLower}
                onChange={(e) => setUseLower(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              <span>Lowercase (a-z)</span>
            </label>
            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={useNumbers}
                onChange={(e) => setUseNumbers(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              <span>Numbers (0-9)</span>
            </label>
            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={useSymbols}
                onChange={(e) => setUseSymbols(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              <span>Symbols (!@#$)</span>
            </label>
            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer col-span-2">
              <input
                type="checkbox"
                checked={excludeAmbiguous}
                onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              <span>Exclude Ambiguous Characters (0, O, 1, l, I)</span>
            </label>
          </div>
        </div>

        {/* Cryptographic Hash Generator Card */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 block">
            <Hash size={14} className="text-indigo-600" /> Cryptographic Hashing (Web Crypto)
          </span>

          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1">Input Text to Hash</label>
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="Type any string..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-3">
            {[
              { label: 'SHA-256', val: hashes.sha256 },
              { label: 'SHA-512', val: hashes.sha512 },
              { label: 'SHA-1', val: hashes.sha1 }
            ].map((h) => (
              <div key={h.label} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-bold text-indigo-700 uppercase">{h.label}</span>
                  <button
                    onClick={() => copyHash(h.val, h.label)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600"
                  >
                    {copiedHashKey === h.label ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    {copiedHashKey === h.label ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="font-mono text-slate-800 break-all text-[11px] select-all">
                  {h.val || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
