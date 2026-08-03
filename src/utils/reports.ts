import { format, parseISO } from 'date-fns';
import { Crop, Expense, Harvest, ChartDataPoint } from '../types';
import { getStatusLabel } from './helpers';

const CHART_COLORS = [
  '#2196F3',
  '#FF9800',
  '#9C27B0',
  '#009688',
  '#4CAF50',
  '#F9A825',
  '#D32F2F',
  '#3F51B5',
  '#FF5722',
  '#607D8B',
  '#795548',
  '#9E9E9E',
];

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function groupExpensesByCategory(expenses: Expense[]): ChartDataPoint[] {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    totals.set(expense.category, (totals.get(expense.category) || 0) + expense.amount);
  }
  return Array.from(totals.entries())
    .map(([category, value]) => ({
      label: getStatusLabel(category),
      value: Math.round(value * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);
}

function groupByMonth(points: { date: string; value: number }[]): ChartDataPoint[] {
  const totals = new Map<string, number>();
  for (const point of points) {
    const key = point.date.slice(0, 7);
    totals.set(key, (totals.get(key) || 0) + point.value);
  }
  return Array.from(totals.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => ({
      label: format(parseISO(`${key}-01`), 'MMM'),
      value: Math.round(value * 100) / 100,
    }));
}

export function groupRevenueByMonth(harvests: Harvest[]): ChartDataPoint[] {
  return groupByMonth(
    harvests
      .filter((h) => h.revenue != null)
      .map((h) => ({ date: h.harvestDate, value: h.revenue as number }))
  );
}

export function groupExpensesByMonth(expenses: Expense[]): ChartDataPoint[] {
  return groupByMonth(expenses.map((e) => ({ date: e.date, value: e.amount })));
}

export interface YieldComparisonData {
  labels: string[];
  actual: number[];
  estimated: number[];
}

export function yieldComparison(crops: Crop[], harvests: Harvest[]): YieldComparisonData {
  const actualByCrop = new Map<string, number>();
  for (const harvest of harvests) {
    actualByCrop.set(harvest.cropId, (actualByCrop.get(harvest.cropId) || 0) + harvest.quantity);
  }

  const relevant = crops.filter((c) => c.status === 'harvested' || actualByCrop.has(c.id));
  const labels: string[] = [];
  const actual: number[] = [];
  const estimated: number[] = [];

  for (const crop of relevant) {
    labels.push(crop.name.length > 8 ? `${crop.name.slice(0, 7)}…` : crop.name);
    actual.push(Math.round((actualByCrop.get(crop.id) || 0) * 100) / 100);
    estimated.push(crop.yieldEstimate);
  }

  return { labels, actual, estimated };
}
