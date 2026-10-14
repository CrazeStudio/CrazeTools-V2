import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Ruler,
  Scale,
  Thermometer,
  HardDrive,
  Maximize2,
  Boxes,
  Gauge,
  Clock,
  Zap,
  Compass,
  ArrowRightLeft,
  Copy,
  Check,
  RotateCw,
  Hash,
  Sparkles,
  Info
} from 'lucide-react';
import { animateFadeIn, animateRotate } from '../utils/animation';

type CategoryKey =
  | 'length'
  | 'weight'
  | 'temperature'
  | 'storage'
  | 'area'
  | 'volume'
  | 'speed'
  | 'time'
  | 'energy'
  | 'pressure';

interface UnitDef {
  id: string;
  name: string;
  symbol: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

interface CategoryConfig {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  defaultFrom: string;
  defaultTo: string;
  formulaNote?: string;
  units: UnitDef[];
  commonShortcuts: { label: string; from: string; to: string; val: number }[];
}

const CATEGORIES: Record<CategoryKey, CategoryConfig> = {
  length: {
    name: 'Length & Distance',
    icon: Ruler,
    defaultFrom: 'm',
    defaultTo: 'ft',
    formulaNote: 'Base unit: Meter (m)',
    units: [
      { id: 'mm', name: 'Millimeter', symbol: 'mm', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'cm', name: 'Centimeter', symbol: 'cm', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { id: 'm', name: 'Meter', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
      { id: 'km', name: 'Kilometer', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'in', name: 'Inch', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: 'ft', name: 'Foot', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: 'yd', name: 'Yard', symbol: 'yd', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { id: 'mi', name: 'Mile', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      { id: 'nmi', name: 'Nautical Mile', symbol: 'nmi', toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
    ],
    commonShortcuts: [
      { label: '1 km to mi', from: 'km', to: 'mi', val: 1 },
      { label: '6 ft to cm', from: 'ft', to: 'cm', val: 6 },
      { label: '100 m to ft', from: 'm', to: 'ft', val: 100 },
      { label: '10 in to cm', from: 'in', to: 'cm', val: 10 }
    ]
  },
  weight: {
    name: 'Mass & Weight',
    icon: Scale,
    defaultFrom: 'kg',
    defaultTo: 'lb',
    formulaNote: 'Base unit: Kilogram (kg)',
    units: [
      { id: 'mg', name: 'Milligram', symbol: 'mg', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
      { id: 'g', name: 'Gram', symbol: 'g', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'kg', name: 'Kilogram', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
      { id: 't', name: 'Metric Ton', symbol: 't', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'oz', name: 'Ounce', symbol: 'oz', toBase: (v) => v * 0.02834952, fromBase: (v) => v / 0.02834952 },
      { id: 'lb', name: 'Pound', symbol: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      { id: 'st', name: 'Stone', symbol: 'st', toBase: (v) => v * 6.35029318, fromBase: (v) => v / 6.35029318 },
    ],
    commonShortcuts: [
      { label: '1 kg to lb', from: 'kg', to: 'lb', val: 1 },
      { label: '150 lb to kg', from: 'lb', to: 'kg', val: 150 },
      { label: '1 oz to g', from: 'oz', to: 'g', val: 1 },
      { label: '1 t to kg', from: 't', to: 'kg', val: 1 }
    ]
  },
  temperature: {
    name: 'Temperature',
    icon: Thermometer,
    defaultFrom: 'c',
    defaultTo: 'f',
    formulaNote: '°F = (°C × 9/5) + 32 | K = °C + 273.15',
    units: [
      { id: 'c', name: 'Celsius', symbol: '°C', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', name: 'Fahrenheit', symbol: '°F', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      { id: 'k', name: 'Kelvin', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
    commonShortcuts: [
      { label: '0 °C (Freezing)', from: 'c', to: 'f', val: 0 },
      { label: '100 °C (Boiling)', from: 'c', to: 'f', val: 100 },
      { label: '37 °C (Body Temp)', from: 'c', to: 'f', val: 37 },
      { label: '72 °F (Room Temp)', from: 'f', to: 'c', val: 72 }
    ]
  },
  storage: {
    name: 'Digital Data & Storage',
    icon: HardDrive,
    defaultFrom: 'gb',
    defaultTo: 'mb',
    formulaNote: 'Standard binary base (1024 basis)',
    units: [
      { id: 'b', name: 'Byte', symbol: 'B', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kb', name: 'Kilobyte', symbol: 'KB', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      { id: 'mb', name: 'Megabyte', symbol: 'MB', toBase: (v) => v * 1048576, fromBase: (v) => v / 1048576 },
      { id: 'gb', name: 'Gigabyte', symbol: 'GB', toBase: (v) => v * 1073741824, fromBase: (v) => v / 1073741824 },
      { id: 'tb', name: 'Terabyte', symbol: 'TB', toBase: (v) => v * 1099511627776, fromBase: (v) => v / 1099511627776 },
      { id: 'pb', name: 'Petabyte', symbol: 'PB', toBase: (v) => v * 1125899906842624, fromBase: (v) => v / 1125899906842624 },
    ],
    commonShortcuts: [
      { label: '1 GB to MB', from: 'gb', to: 'mb', val: 1 },
      { label: '1 TB to GB', from: 'tb', to: 'gb', val: 1 },
      { label: '500 MB to KB', from: 'mb', to: 'kb', val: 500 },
      { label: '100 GB to TB', from: 'gb', to: 'tb', val: 100 }
    ]
  },
  area: {
    name: 'Area',
    icon: Maximize2,
    defaultFrom: 'sqm',
    defaultTo: 'sqft',
    formulaNote: 'Base unit: Square Meter (m²)',
    units: [
      { id: 'sqm', name: 'Square Meter', symbol: 'm²', toBase: (v) => v, fromBase: (v) => v },
      { id: 'sqkm', name: 'Square Kilometer', symbol: 'km²', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
      { id: 'sqft', name: 'Square Foot', symbol: 'ft²', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      { id: 'sqyd', name: 'Square Yard', symbol: 'yd²', toBase: (v) => v * 0.836127, fromBase: (v) => v / 0.836127 },
      { id: 'ac', name: 'Acre', symbol: 'ac', toBase: (v) => v * 4046.856, fromBase: (v) => v / 4046.856 },
      { id: 'ha', name: 'Hectare', symbol: 'ha', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    ],
    commonShortcuts: [
      { label: '100 m² to ft²', from: 'sqm', to: 'sqft', val: 100 },
      { label: '1 Acre to m²', from: 'ac', to: 'sqm', val: 1 },
      { label: '1 Hectare to Acres', from: 'ha', to: 'ac', val: 1 },
      { label: '1000 sq ft to m²', from: 'sqft', to: 'sqm', val: 1000 }
    ]
  },
  volume: {
    name: 'Volume & Capacity',
    icon: Boxes,
    defaultFrom: 'l',
    defaultTo: 'gal',
    formulaNote: 'Base unit: Liter (L)',
    units: [
      { id: 'ml', name: 'Milliliter', symbol: 'mL', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'l', name: 'Liter', symbol: 'L', toBase: (v) => v, fromBase: (v) => v },
      { id: 'm3', name: 'Cubic Meter', symbol: 'm³', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'floz', name: 'Fluid Ounce (US)', symbol: 'fl oz', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
      { id: 'cup', name: 'Cup (US)', symbol: 'cup', toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
      { id: 'pt', name: 'Pint (US)', symbol: 'pt', toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
      { id: 'gal', name: 'Gallon (US)', symbol: 'gal', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
    ],
    commonShortcuts: [
      { label: '1 Gallon to Liters', from: 'gal', to: 'l', val: 1 },
      { label: '1 Liter to fl oz', from: 'l', to: 'floz', val: 1 },
      { label: '2 Cups to mL', from: 'cup', to: 'ml', val: 2 },
      { label: '500 mL to Cups', from: 'ml', to: 'cup', val: 500 }
    ]
  },
  speed: {
    name: 'Speed & Velocity',
    icon: Gauge,
    defaultFrom: 'kmh',
    defaultTo: 'mph',
    formulaNote: 'Base unit: Meters per second (m/s)',
    units: [
      { id: 'ms', name: 'Meter/second', symbol: 'm/s', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kmh', name: 'Kilometer/hour', symbol: 'km/h', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { id: 'mph', name: 'Mile/hour', symbol: 'mph', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { id: 'knot', name: 'Knot', symbol: 'kn', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    ],
    commonShortcuts: [
      { label: '100 km/h to mph', from: 'kmh', to: 'mph', val: 100 },
      { label: '60 mph to km/h', from: 'mph', to: 'kmh', val: 60 },
      { label: '10 m/s to km/h', from: 'ms', to: 'kmh', val: 10 },
      { label: '25 knots to mph', from: 'knot', to: 'mph', val: 25 }
    ]
  },
  time: {
    name: 'Time',
    icon: Clock,
    defaultFrom: 'hr',
    defaultTo: 'min',
    formulaNote: 'Base unit: Second (s)',
    units: [
      { id: 'ms', name: 'Millisecond', symbol: 'ms', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 's', name: 'Second', symbol: 's', toBase: (v) => v, fromBase: (v) => v },
      { id: 'min', name: 'Minute', symbol: 'min', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      { id: 'hr', name: 'Hour', symbol: 'hr', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: 'day', name: 'Day', symbol: 'day', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      { id: 'wk', name: 'Week', symbol: 'wk', toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
      { id: 'yr', name: 'Year (365d)', symbol: 'yr', toBase: (v) => v * 31536000, fromBase: (v) => v / 31536000 },
    ],
    commonShortcuts: [
      { label: '24 Hours to Min', from: 'hr', to: 'min', val: 24 },
      { label: '7 Days to Hours', from: 'day', to: 'hr', val: 7 },
      { label: '1 Year to Days', from: 'yr', to: 'day', val: 1 },
      { label: '3600 s to Hours', from: 's', to: 'hr', val: 3600 }
    ]
  },
  energy: {
    name: 'Energy & Power',
    icon: Zap,
    defaultFrom: 'kcal',
    defaultTo: 'kj',
    formulaNote: 'Base unit: Joule (J)',
    units: [
      { id: 'j', name: 'Joule', symbol: 'J', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kj', name: 'Kilojoule', symbol: 'kJ', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cal', name: 'Calorie', symbol: 'cal', toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
      { id: 'kcal', name: 'Kilocalorie', symbol: 'kcal', toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
      { id: 'kwh', name: 'Kilowatt-hour', symbol: 'kWh', toBase: (v) => v * 3600000, fromBase: (v) => v / 3600000 },
    ],
    commonShortcuts: [
      { label: '2000 kcal to kJ', from: 'kcal', to: 'kj', val: 2000 },
      { label: '1 kWh to Joules', from: 'kwh', to: 'j', val: 1 },
      { label: '500 Cal to Joules', from: 'cal', to: 'j', val: 500 }
    ]
  },
  pressure: {
    name: 'Pressure',
    icon: Compass,
    defaultFrom: 'psi',
    defaultTo: 'bar',
    formulaNote: 'Base unit: Pascal (Pa)',
    units: [
      { id: 'pa', name: 'Pascal', symbol: 'Pa', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kpa', name: 'Kilopascal', symbol: 'kPa', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'bar', name: 'Bar', symbol: 'bar', toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
      { id: 'psi', name: 'Pounds/sq in', symbol: 'psi', toBase: (v) => v * 6894.757, fromBase: (v) => v / 6894.757 },
      { id: 'atm', name: 'Atmosphere', symbol: 'atm', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
    ],
    commonShortcuts: [
      { label: '32 psi (Tire) to Bar', from: 'psi', to: 'bar', val: 32 },
      { label: '1 atm to PSI', from: 'atm', to: 'psi', val: 1 },
      { label: '1 Bar to kPa', from: 'bar', to: 'kpa', val: 1 }
    ]
  }
};

export default function UnitConverters() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('length');
  const [fromUnitId, setFromUnitId] = useState<string>('m');
  const [toUnitId, setToUnitId] = useState<string>('ft');
  const [fromValue, setFromValue] = useState<string>('1');
  const [precision, setPrecision] = useState<number>(4);
  const [copied, setCopied] = useState<boolean>(false);

  const swapButtonRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateFadeIn(containerRef.current, { y: 15, duration: 320 });
    }
  }, []);

  // Update units on category change
  const handleCategoryChange = (key: CategoryKey) => {
    setActiveCategory(key);
    setFromUnitId(CATEGORIES[key].defaultFrom);
    setToUnitId(CATEGORIES[key].defaultTo);
  };

  const currentCategoryConfig = CATEGORIES[activeCategory];
  const fromUnit = currentCategoryConfig.units.find((u) => u.id === fromUnitId) || currentCategoryConfig.units[0];
  const toUnit = currentCategoryConfig.units.find((u) => u.id === toUnitId) || currentCategoryConfig.units[1];

  // Perform accurate conversion
  const convertedResult = useMemo(() => {
    const num = parseFloat(fromValue);
    if (isNaN(num)) return '';

    try {
      const baseValue = fromUnit.toBase(num);
      const targetValue = toUnit.fromBase(baseValue);

      if (Math.abs(targetValue) >= 10000000 || (Math.abs(targetValue) > 0 && Math.abs(targetValue) < 0.0001)) {
        return targetValue.toExponential(precision);
      }

      return targetValue.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: precision
      });
    } catch (err) {
      return 'Error';
    }
  }, [fromValue, fromUnit, toUnit, precision]);

  // Swap units with Anime.js icon spin
  const handleSwap = () => {
    if (swapButtonRef.current) {
      animateRotate(swapButtonRef.current, 180, 280);
    }
    const temp = fromUnitId;
    setFromUnitId(toUnitId);
    setToUnitId(temp);
  };

  // Copy result
  const handleCopy = () => {
    if (!convertedResult) return;
    navigator.clipboard.writeText(`${convertedResult} ${toUnit.symbol}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Ruler size={22} />
            </div>
            Universal Unit Converters
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time multi-system conversions for length, mass, temperature, data, volume, pressure, and more.
          </p>
        </div>

        {/* Precision Selector */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-xs">
          <Hash size={14} className="text-gray-500" />
          <span className="text-gray-600 font-medium">Decimals:</span>
          <select
            value={precision}
            onChange={(e) => setPrecision(Number(e.target.value))}
            className="bg-white border border-gray-200 rounded px-2 py-0.5 text-xs font-semibold text-gray-800 outline-none"
          >
            {[0, 2, 4, 6, 8].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(Object.keys(CATEGORIES) as CategoryKey[]).map((catKey) => {
          const cat = CATEGORIES[catKey];
          const IconComponent = cat.icon;
          const isActive = activeCategory === catKey;

          return (
            <button
              key={catKey}
              onClick={() => handleCategoryChange(catKey)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <IconComponent size={15} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Conversion Main Interactive Panel */}
      <div className="bg-gradient-to-b from-gray-50/80 to-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-xs space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* FROM INPUT & UNIT SELECT */}
          <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Convert From
            </span>

            <input
              type="number"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              placeholder="0"
              className="w-full text-3xl md:text-4xl font-bold text-gray-900 bg-transparent border-none outline-none font-mono"
            />

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <select
                value={fromUnitId}
                onChange={(e) => setFromUnitId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-semibold rounded-xl px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
              >
                {currentCategoryConfig.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SWAP BUTTON */}
          <div className="md:col-span-1 flex justify-center">
            <button
              ref={swapButtonRef}
              onClick={handleSwap}
              title="Swap Units"
              className="w-12 h-12 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-blue-400 hover:bg-blue-50/50 text-gray-600 hover:text-blue-600 flex items-center justify-center transition-all"
            >
              <ArrowRightLeft size={18} />
            </button>
          </div>

          {/* TO RESULT & UNIT SELECT */}
          <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3 relative group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Result To
              </span>
              <button
                onClick={handleCopy}
                className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-gray-50"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="text-3xl md:text-4xl font-bold text-blue-600 font-mono overflow-x-auto whitespace-nowrap py-0.5">
              {convertedResult || '0'}
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <select
                value={toUnitId}
                onChange={(e) => setToUnitId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-semibold rounded-xl px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
              >
                {currentCategoryConfig.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Shortcut Chips */}
        {currentCategoryConfig.commonShortcuts.length > 0 && (
          <div className="pt-2 space-y-2">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-500" /> Frequent Conversions:
            </span>
            <div className="flex flex-wrap gap-2">
              {currentCategoryConfig.commonShortcuts.map((sc) => (
                <button
                  key={sc.label}
                  onClick={() => {
                    setFromUnitId(sc.from);
                    setToUnitId(sc.to);
                    setFromValue(sc.val.toString());
                  }}
                  className="px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl text-xs font-medium text-gray-700 transition-all shadow-2xs"
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Formula / Conversion Reference Note */}
        {currentCategoryConfig.formulaNote && (
          <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-center gap-2">
            <Info size={15} className="text-blue-500 shrink-0" />
            <span>{currentCategoryConfig.formulaNote}</span>
          </div>
        )}
      </div>
    </div>
  );
}
