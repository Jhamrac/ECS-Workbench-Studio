// Central App Version Definition
// Whenever a new update or build is deployed, this version changes.
export const APP_VERSION = '2.8.0';
export const BUILD_ID = '20260824-ecs-v2.8.0';
export const LAST_UPDATED_DATE = '2026-08-24';

export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  highlights: string[];
  type: 'major' | 'minor' | 'patch';
}

export const RECENT_RELEASES: ReleaseNote[] = [
  {
    version: '2.8.0',
    date: '2026-08-24',
    title: 'Authentic Niagara N4 Workbench Look & High-Contrast Mobile Ergonomics',
    type: 'minor',
    highlights: [
      'Authentic Niagara N4 Look & Feel: Enhanced logic blocks with signature rotated diamond pin handles for Boolean (amber), Numeric (sky blue), and Enum (purple) data types, authentic Niagara status badges ({ok}, {flt}, {ovr}, {alm}), and beveled header banners.',
      'High-Contrast Build Guide Typography: Overhauled text rendering across the Workbench Build Guide, replacing muted gray tones with deep black/slate text and high-contrast badges for maximum legibility on field laptops and tablet screens.',
      'Uncluttered Mobile System-Wide Revamp: Collapsed multi-tier desktop toolbars into a single compact header on mobile, integrated a slide-down mobile options drawer, and added semi-transparent backdrops for touch-to-close sidebars.',
      'Instant One-Tap Wire Deletion: Prominent DELETE pills on wire midpoint curves, selection toolbar actions, and dedicated Wire Interconnect Manager for bulk connection management.',
    ],
  },
  {
    version: '2.7.0',
    date: '2026-08-24',
    title: 'Workbench Build Guide Visual Parity & Mobile Ergonomics',
    type: 'minor',
    highlights: [
      'Workbench Build Guide Parity: Complete visual redesign of the in-app build guide matching the HTML export document with Step badges, Palette tags, Component types, slot interconnect details, and light-green Tridium Tip callout banners.',
      'Mobile Field Navigation: Added a dedicated fixed bottom navigation bar on touch devices with 1-tap view switching between Wire Sheet, Build Guide, SOO Narrative, Audit, and AI Assist.',
      'Synchronized Live Update Heartbeat: Version incrementing triggers instant update notification banners and 1-click zero-data-loss hot-swapping.',
    ],
  },
  {
    version: '2.6.0',
    date: '2026-08-24',
    title: 'Live Version Sync & In-App Build Guide Suite',
    type: 'minor',
    highlights: [
      'Synchronized Version Management: Unified status bar and update checker with live APP_VERSION (v2.6.0), eliminating stale v2.4.0 fallback states.',
      'In-App Workbench Build Guide: Fully interactive step-by-step Niagara 4 build guide viewer directly inside the application, removing print/export dependency.',
      'Reliable Wire Deletion: Enhanced SVG link intersection hitboxes and z-index pointer events for instant, one-click wire deletion.',
      'Responsive Mobile & Desktop Optimization: Seamless layout adaptation across mobile phones, tablets, and wide-format field engineering workstations.',
    ],
  },
  {
    version: '2.5.2',
    date: '2026-08-24',
    title: 'Canvas Interaction Fluidity & Precision Update Management',
    type: 'patch',
    highlights: [
      'Fluid Canvas Drag & Drop: Added global pointer release & zero-button cursor tracking to prevent sticky block drag or canvas panning glitches.',
      'Precision Version Sync: Fixed recurring update prompt on app relaunch by enforcing strict semantic versioning against the active build.',
      'Streamlined ECS Workbench Studio: Clean header layout with single-tool selector, collapsible "Nav Tree" margin tab, and on-canvas action toolbar.',
      'Universal Session Persistence: 100% preservation of active engineering sessions, custom library vaults, and station parameters across all reloads.',
    ],
  },
  {
    version: '2.4.0',
    date: '2026-08-24',
    title: 'Engineered Cooling Services (ECS) Enterprise Brand & Update Heartbeat',
    type: 'minor',
    highlights: [
      'Engineered Cooling Services (ECS) branding with official Royal Blue (#00529b) and Green Wave (#44b33c) palettes.',
      'A Service Logic Company insignia and custom field engine status indicators.',
      'Active PWA update heartbeat polling with zero-data-loss instant hot-swapping (~3s).',
      'Enhanced responsive status bar with device aspect ratio & resolution monitor.',
    ],
  },
];
