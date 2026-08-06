import { format, parseISO } from 'date-fns';
import { Crop, Expense, Harvest, ChartDataPoint, AnimalProduct } from '../types';
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

export function groupRevenueByMonth(harvests: Harvest[], products?: AnimalProduct[]): ChartDataPoint[] {
  const points: { date: string; value: number }[] = harvests
    .filter((h) => h.revenue != null)
    .map((h) => ({ date: h.harvestDate, value: h.revenue as number }));
  if (products) {
    for (const p of products) {
      if (p.revenue == null) continue;
      points.push({ date: p.date, value: p.revenue });
    }
  }
  return groupByMonth(points);
}

export function groupExpensesByMonth(expenses: Expense[]): ChartDataPoint[] {
  return groupByMonth(expenses.map((e) => ({ date: e.date, value: e.amount })));
}

export interface MonthlyProfitLoss {
  labels: string[];
  revenue: number[];
  expenses: number[];
  net: number[];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function groupProfitLossByMonth(harvests: Harvest[], expenses: Expense[], products?: AnimalProduct[]): MonthlyProfitLoss {
  const revenueByMonth = new Map<string, number>();
  const expensesByMonth = new Map<string, number>();

  for (const harvest of harvests) {
    if (harvest.revenue == null) continue;
    const key = harvest.harvestDate.slice(0, 7);
    revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + harvest.revenue);
  }
  if (products) {
    for (const product of products) {
      if (product.revenue == null) continue;
      const key = product.date.slice(0, 7);
      revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + product.revenue);
    }
  }
  for (const expense of expenses) {
    const key = expense.date.slice(0, 7);
    expensesByMonth.set(key, (expensesByMonth.get(key) || 0) + expense.amount);
  }

  const keys = Array.from(new Set([...revenueByMonth.keys(), ...expensesByMonth.keys()])).sort();

  return {
    labels: keys.map((key) => format(parseISO(`${key}-01`), 'MMM yy')),
    revenue: keys.map((key) => round2(revenueByMonth.get(key) || 0)),
    expenses: keys.map((key) => round2(expensesByMonth.get(key) || 0)),
    net: keys.map((key) => round2((revenueByMonth.get(key) || 0) - (expensesByMonth.get(key) || 0))),
  };
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
