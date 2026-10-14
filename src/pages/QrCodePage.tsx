import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode as QrIcon,
  Download,
  Copy,
  Check,
  Link as LinkIcon,
  Type,
  Wifi,
  Mail,
  Phone,
  RefreshCw,
  Palette,
  Sparkles
} from 'lucide-react';
import { animateFadeIn } from '../utils/animation';

type QrType = 'url' | 'text' | 'wifi' | 'email' | 'phone';

export default function QrCodePage() {
  const [qrType, setQrType] = useState<QrType>('url');
  const [urlInput, setUrlInput] = useState('https://example.com');
  const [textInput, setTextInput] = useState('Welcome to Daily Tool Kit');
  const [wifiSsid, setWifiSsid] = useState('Home_WiFi');
  const [wifiPass, setWifiPass] = useState('');
  const [wifiSec, setWifiSec] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [emailTo, setEmailTo] = useState('contact@example.com');
  const [emailSubj, setEmailSubj] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [phoneNum, setPhoneNum] = useState('+1 555 123 4567');

  // Styling
  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 300 });
    }
  }, []);

  // Compute raw string to encode
  const getRawContent = () => {
    switch (qrType) {
      case 'url':
        return urlInput.startsWith('http') ? urlInput : `https://${urlInput}`;
      case 'text':
        return textInput;
      case 'wifi':
        return `WIFI:S:${wifiSsid};T:${wifiSec};P:${wifiPass};;`;
      case 'email':
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubj)}&body=${encodeURIComponent(emailBody)}`;
      case 'phone':
        return `tel:${phoneNum.replace(/\s+/g, '')}`;
      default:
        return urlInput;
    }
  };

  // Generate QR Code data URL
  useEffect(() => {
    const content = getRawContent();
    if (!content.trim()) return;

    QRCode.toDataURL(content, {
      width: 600,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor
      },
      errorCorrectionLevel: errorLevel
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [qrType, urlInput, textInput, wifiSsid, wifiPass, wifiSec, emailTo, emailSubj, emailBody, phoneNum, fgColor, bgColor, errorLevel]);

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleDownloadSvg = async () => {
    const content = getRawContent();
    try {
      const svgString = await QRCode.toString(content, {
        type: 'svg',
        color: {
          dark: fgColor,
          light: bgColor
        },
        errorCorrectionLevel: errorLevel
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = () => {
    if (!qrDataUrl) return;
    navigator.clipboard.writeText(getRawContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <QrIcon size={22} />
            </div>
            QR Code Generator
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Create custom styled QR codes for URLs, WiFi networks, contact cards, and text in PNG & vector SVG formats.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Config Panel */}
        <div className="lg:col-span-7 space-y-6">
          {/* Content Type Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 block">
              QR Code Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'url', label: 'URL / Link', icon: LinkIcon },
                { id: 'text', label: 'Plain Text', icon: Type },
                { id: 'wifi', label: 'Wi-Fi Network', icon: Wifi },
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'phone', label: 'Phone', icon: Phone }
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setQrType(t.id as QrType)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      qrType === t.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-xs font-bold">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Content Inputs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            {qrType === 'url' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Website URL</label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}

            {qrType === 'text' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Text Message / Note</label>
                <textarea
                  rows={4}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type any message..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}

            {qrType === 'wifi' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Network SSID (Name)</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="MyHomeNetwork"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
                  <input
                    type="text"
                    value={wifiPass}
                    onChange={(e) => setWifiPass(e.target.value)}
                    placeholder="WiFi Password"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Security Type</label>
                  <select
                    value={wifiSec}
                    onChange={(e) => setWifiSec(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (Open Network)</option>
                  </select>
                </div>
              </div>
            )}

            {qrType === 'email' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="hello@domain.com"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSubj}
                    onChange={(e) => setEmailSubj(e.target.value)}
                    placeholder="Inquiry"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}

            {qrType === 'phone' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNum}
                  onChange={(e) => setPhoneNum(e.target.value)}
                  placeholder="+1 555 123 4567"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Color & Error Correction Customization */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Colors & Error Correction
            </label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-600 block mb-1.5 font-medium">QR Foreground Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-600 block mb-1.5 font-medium">Background Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-600 block mb-1.5 font-medium">Error Correction Resilience</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'L', label: 'Low 7%' },
                  { id: 'M', label: 'Med 15%' },
                  { id: 'Q', label: 'Quart 25%' },
                  { id: 'H', label: 'High 30%' }
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setErrorLevel(lvl.id as any)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      errorLevel === lvl.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview & Download Card */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center shadow-xs space-y-6">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Live Preview
          </span>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-64 h-64 rounded-xl shadow-xs"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          <div className="w-full space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadPng}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Download size={14} /> Download PNG
              </button>
              <button
                onClick={handleDownloadSvg}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Download size={14} /> Vector SVG
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copied ? 'Copied encoded text!' : 'Copy Encoded String'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
