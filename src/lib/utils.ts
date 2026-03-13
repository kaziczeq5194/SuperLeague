import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getProgressPercentage(current: number, target: number): number {
  if (target === 0) return 100;
  return Math.min(Math.round((current / target) * 100), 100);
}

export function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    'NONE': '#5B5A56',
    'IRON': '#6B6B6B',
    'BRONZE': '#8C5A3C',
    'SILVER': '#9AA4AF',
    'GOLD': '#C89B3C',
    'PLATINUM': '#4E9996',
    'DIAMOND': '#576BCE',
    'MASTER': '#9D48E0',
    'GRANDMASTER': '#E84057',
    'CHALLENGER': '#F4C874',
  };
  return colors[tier.toUpperCase()] || colors['NONE'];
}

export function getMasteryColor(level: number): string {
  const colors: Record<number, string> = {
    0: '#5B5A56',
    1: '#5B5A56',
    2: '#5B5A56',
    3: '#5B5A56',
    4: '#5B5A56',
    5: '#E84057',
    6: '#9D48E0',
    7: '#0AC8B9',
    8: '#C89B3C',
    9: '#C89B3C',
    10: '#F4C874',
  };
  return colors[level] || colors[0];
}
