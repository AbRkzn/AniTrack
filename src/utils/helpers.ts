import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { IconName } from '../components/ui/Icon';

export function formatDate(dateString: string, formatStr: string = 'MMM dd, yyyy'): string {
  try {
    return format(parseISO(dateString), formatStr);
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString: string): string {
  return formatDate(dateString, 'MM/dd/yy');
}

export function formatCurrency(amount: number, currency: string = 'PHP'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function getCurrencySymbol(currency: string = 'PHP'): string {
  try {
    return (
      new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value ?? currency
    );
  } catch {
    return currency;
  }
}

export function formatNumber(num: number, decimals: number = 1): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function daysUntil(dateString: string): number {
  return differenceInDays(parseISO(dateString), new Date());
}

export function getMonthRange(monthsBack: number = 0): { start: string; end: string } {
  const date = subMonths(new Date(), monthsBack);
  return {
    start: startOfMonth(date).toISOString().split('T')[0],
    end: endOfMonth(date).toISOString().split('T')[0],
  };
}

export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

export function getGrowthProgress(plantingDate: string, expectedHarvestDate: string): number {
  const planted = parseISO(plantingDate);
  const harvest = parseISO(expectedHarvestDate);
  const now = new Date();
  const totalDays = differenceInDays(harvest, planted);
  const elapsedDays = differenceInDays(now, planted);
  if (totalDays <= 0) return 100;
  const progress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);
  return Math.round(progress);
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    growing: '#4CAF50',
    ready_for_harvest: '#F9A825',
    harvested: '#66BB6A',
    failed: '#D32F2F',
    pending: '#FF9800',
    in_progress: '#2196F3',
    completed: '#4CAF50',
    skipped: '#9E9E9E',
    active: '#4CAF50',
    sold: '#2196F3',
    deceased: '#D32F2F',
    transferred: '#9C27B0',
  };
  return colorMap[status] || '#666666';
}

export function getStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getCategoryIcon(category: string): IconName {
  const icons: Record<string, IconName> = {
    seed: 'leaf-outline',
    fertilizer: 'flask-outline',
    pesticide: 'bug-outline',
    equipment: 'build-outline',
    labor: 'people-outline',
    irrigation: 'water-outline',
    fuel: 'flame-outline',
    maintenance: 'construct-outline',
    transport: 'car-outline',
    utility: 'flash-outline',
    insurance: 'shield-checkmark-outline',
    rent: 'home-outline',
    other: 'cube-outline',
  };
  return icons[category] || 'cube-outline';
}

export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}