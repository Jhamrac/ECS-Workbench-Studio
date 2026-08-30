import { useState, useEffect, useCallback } from 'react';

export type DeviceType = 'mobile-portrait' | 'mobile-landscape' | 'tablet' | 'desktop' | 'ultrawide';

export interface DeviceAspectInfo {
  width: number;
  height: number;
  aspectRatio: number; // width / height
  aspectRatioFormatted: string; // e.g. "16:9", "9:16", "4:3", "20:9"
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  deviceType: DeviceType;
}

function getAspectRatioFormatted(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(Math.round(width), Math.round(height));
  const w = Math.round(width / divisor);
  const h = Math.round(height / divisor);

  // If simplified ratio is too complex, estimate standard ratios
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.08) return '16:9';
  if (Math.abs(ratio - 9 / 16) < 0.08) return '9:16';
  if (Math.abs(ratio - 4 / 3) < 0.08) return '4:3';
  if (Math.abs(ratio - 3 / 4) < 0.08) return '3:4';
  if (Math.abs(ratio - 16 / 10) < 0.08) return '16:10';
  if (Math.abs(ratio - 21 / 9) < 0.08) return '21:9';
  if (Math.abs(ratio - 19.5 / 9) < 0.08) return '19.5:9 (Phone)';
  if (Math.abs(ratio - 1) < 0.05) return '1:1';

  return `${w}:${h}`;
}

export function useDeviceAspect(): DeviceAspectInfo {
  const getAspectInfo = useCallback((): DeviceAspectInfo => {
    if (typeof window === 'undefined') {
      return {
        width: 1280,
        height: 800,
        aspectRatio: 1.6,
        aspectRatioFormatted: '16:10',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        isPortrait: false,
        isLandscape: true,
        deviceType: 'desktop',
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / Math.max(1, height);
    const isPortrait = height > width;
    const isLandscape = !isPortrait;
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    let deviceType: DeviceType = 'desktop';
    let isMobile = false;
    let isTablet = false;
    let isDesktop = false;

    if (width < 640 || (isPortrait && width < 768)) {
      deviceType = isPortrait ? 'mobile-portrait' : 'mobile-landscape';
      isMobile = true;
    } else if (width >= 640 && width < 1024) {
      deviceType = 'tablet';
      isTablet = true;
    } else if (width >= 1024 && width < 1800) {
      deviceType = 'desktop';
      isDesktop = true;
    } else {
      deviceType = 'ultrawide';
      isDesktop = true;
    }

    return {
      width,
      height,
      aspectRatio,
      aspectRatioFormatted: getAspectRatioFormatted(width, height),
      isMobile,
      isTablet,
      isDesktop,
      isTouch,
      isPortrait,
      isLandscape,
      deviceType,
    };
  }, []);

  const [aspectInfo, setAspectInfo] = useState<DeviceAspectInfo>(getAspectInfo);

  useEffect(() => {
    let timeoutId: any = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setAspectInfo(getAspectInfo());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, [getAspectInfo]);

  return aspectInfo;
}
