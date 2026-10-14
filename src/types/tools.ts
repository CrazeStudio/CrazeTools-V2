import React from 'react';

export type ToolCategoryId = 'image' | 'pdf' | 'converters' | 'developer' | 'productivity';

export type ToolId =
  | 'dashboard'
  | 'image-enhance'
  | 'image-crop'
  | 'image-resize'
  | 'image-compress'
  | 'pdf-organize'
  | 'pdf-merge'
  | 'pdf-split'
  | 'pdf-compress'
  | 'unit-converter'
  | 'qr-generator'
  | 'text-tools'
  | 'color-studio'
  | 'json-formatter'
  | 'password-hash'
  | 'time-tools';

export interface ToolItem {
  id: ToolId;
  name: string;
  shortDesc: string;
  category: ToolCategoryId;
  iconName: string;
  badge?: string;
  keywords: string[];
}

export interface ToolCategory {
  id: ToolCategoryId;
  name: string;
  desc: string;
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  { id: 'image', name: 'Image Tools', desc: 'Auto enhance, crop, resize & convert' },
  { id: 'pdf', name: 'PDF Tools', desc: 'Reorder pages, merge, split & compress' },
  { id: 'converters', name: 'Converters & Calculators', desc: 'Units, colors & currency' },
  { id: 'developer', name: 'Dev & Text Utilities', desc: 'JSON formatter, text cases, hash' },
  { id: 'productivity', name: 'Daily Productivity', desc: 'QR code generator, timers, passwords' },
];

export const ALL_TOOLS: ToolItem[] = [
  {
    id: 'image-enhance',
    name: 'Auto Enhance & Color Grade',
    shortDesc: 'AI-style dynamic auto color grading, exposure & film filters',
    category: 'image',
    iconName: 'Sparkles',
    badge: 'Popular',
    keywords: ['photo', 'enhance', 'color', 'filter', 'grading', 'contrast', 'brightness', 'film']
  },
  {
    id: 'image-crop',
    name: 'Image Cropper & Rotate',
    shortDesc: 'Interactive canvas crop box, aspect ratios & 90° rotation',
    category: 'image',
    iconName: 'Crop',
    keywords: ['crop', 'cut', 'aspect', 'square', 'rotate', 'flip', 'avatar']
  },
  {
    id: 'image-resize',
    name: 'Image Resizer & Format Converter',
    shortDesc: 'Exact pixel dimensions, aspect ratio lock & PNG/JPEG/WebP export',
    category: 'image',
    iconName: 'Maximize2',
    keywords: ['resize', 'scale', 'dimensions', 'convert', 'png', 'jpg', 'webp']
  },
  {
    id: 'image-compress',
    name: 'Smart Image Compressor',
    shortDesc: 'Shrink photo file sizes up to 90% with target size control & lossless modes',
    category: 'image',
    iconName: 'Minimize2',
    badge: 'High Impact',
    keywords: ['compress', 'reduce size', 'shrink', 'smaller', 'mb to kb', 'optimize', 'photo']
  },
  {
    id: 'pdf-organize',
    name: 'PDF Page Organizer',
    shortDesc: 'Visual preview cards, drag & drop to switch page numbers, delete pages',
    category: 'pdf',
    iconName: 'ArrowUpDown',
    badge: 'Interactive',
    keywords: ['pdf', 'reorder', 'pages', 'preview', 'drag', 'drop', 'rotate', 'delete']
  },
  {
    id: 'pdf-merge',
    name: 'PDF Merger',
    shortDesc: 'Combine multiple PDF documents into one single consolidated file',
    category: 'pdf',
    iconName: 'Layers',
    keywords: ['merge', 'combine', 'join', 'pdf', 'concat', 'documents']
  },
  {
    id: 'pdf-split',
    name: 'PDF Splitter & Extractor',
    shortDesc: 'Extract chosen page ranges or split into individual documents',
    category: 'pdf',
    iconName: 'Scissors',
    keywords: ['split', 'extract', 'cut', 'pdf', 'pages', 'separate']
  },
  {
    id: 'pdf-compress',
    name: 'PDF Compressor',
    shortDesc: 'Reduce PDF file size via object deduplication and stream optimization',
    category: 'pdf',
    iconName: 'Minimize2',
    keywords: ['compress', 'reduce', 'optimize', 'shrink', 'smaller', 'pdf']
  },
  {
    id: 'unit-converter',
    name: 'Universal Unit Converter',
    shortDesc: '10 categories: Length, Mass, Temp, Storage, Area, Volume, Speed, Pressure',
    category: 'converters',
    iconName: 'Ruler',
    badge: '10 Units',
    keywords: ['unit', 'converter', 'metric', 'imperial', 'length', 'weight', 'temperature', 'storage']
  },
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    shortDesc: 'Generate custom styled QR codes for URLs, WiFi, contacts & text',
    category: 'productivity',
    iconName: 'QrCode',
    badge: 'New',
    keywords: ['qr', 'code', 'generator', 'wifi', 'link', 'barcode', 'scan']
  },
  {
    id: 'text-tools',
    name: 'Text & Case Converter',
    shortDesc: 'Word counter, case switching (UPPER, lower, Title, camelCase), Base64 & URL',
    category: 'developer',
    iconName: 'Type',
    keywords: ['text', 'case', 'word count', 'camelcase', 'kebab', 'base64', 'url encode']
  },
  {
    id: 'color-studio',
    name: 'Color Studio & Palettes',
    shortDesc: 'HEX/RGB/HSL conversion, harmonious color palettes & WCAG contrast tester',
    category: 'converters',
    iconName: 'Palette',
    keywords: ['color', 'hex', 'rgb', 'hsl', 'palette', 'contrast', 'wcag', 'harmonies']
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter & Validator',
    shortDesc: 'Prettify, validate syntax errors, minify and copy clean JSON code',
    category: 'developer',
    iconName: 'Code',
    keywords: ['json', 'formatter', 'beautify', 'validate', 'minify', 'syntax', 'parser']
  },
  {
    id: 'password-hash',
    name: 'Password & Hash Generator',
    shortDesc: 'Generate cryptographically strong passwords and SHA-256/SHA-512 hashes',
    category: 'productivity',
    iconName: 'KeyRound',
    keywords: ['password', 'generate', 'hash', 'sha256', 'sha512', 'security', 'crypto']
  },
  {
    id: 'time-tools',
    name: 'World Clock & Stopwatch',
    shortDesc: 'Stopwatch with lap tracking, countdown timer and multi-city timezone clock',
    category: 'productivity',
    iconName: 'Clock',
    keywords: ['time', 'stopwatch', 'timer', 'clock', 'timezone', 'world clock', 'utc']
  }
];
