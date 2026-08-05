import { Expense, ExpenseQuery } from '../../../types';
import { queryAll, queryFirst, executeSql } from '../../../database';
import { addDays, addMonths, addYears, format } from 'date-fns';
import { recordSyncChange } from '../../../services/syncQueue';

export class ExpenseRepository {
  async getAll(query?: ExpenseQuery): Promise<Expense[]> {
    let sql = 'SELECT * FROM expenses';
    const params: any[] = [];
    const conditions: string[] = [];

    if (query?.category) {
      conditions.push('category = ?');
      params.push(query.category);
    }
    if (query?.cropId) {
      conditions.push('cropId = ?');
      params.push(query.cropId);
    }
    if (query?.dateFrom) {
      conditions.push('date >= ?');
      params.push(query.dateFrom);
    }
    if (query?.dateTo) {
      conditions.push('date <= ?');
      params.push(query.dateTo);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY date DESC';
    if (query?.limit) {
      sql += ` LIMIT ${query.limit}`;
      if (query.offset) sql += ` OFFSET ${query.offset}`;
    }

    const rows = await queryAll<any>(sql, params);
    return rows.map(this.mapRowToExpense);
  }

  async getById(id: string): Promise<Expense | null> {
    const row = await queryFirst<any>('SELECT * FROM expenses WHERE id = ?', [id]);
    return row ? this.mapRowToExpense(row) : null;
  }

  async getByHealthRecordId(healthRecordId: string): Promise<Expense | null> {
    const row = await queryFirst<any>('SELECT * FROM expenses WHERE healthRecordId = ?', [healthRecordId]);
    return row ? this.mapRowToExpense(row) : null;
  }

  async create(data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    const now = new Date().toISOString();
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await executeSql(
      'INSERT INTO expenses (id, cropId, category, amount, currency, date, vendor, receiptPhoto, notes, recurring, recurringInterval, healthRecordId, recurringSourceId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.cropId || null, data.category, data.amount, data.currency, data.date, data.vendor || null, data.receiptPhoto || null, data.notes, data.recurring ? 1 : 0, data.recurringInterval || null, data.healthRecordId || null, data.recurringSourceId || null, now, now]
    );

    const expense = await this.getById(id);
    if (!expense) throw new Error('Failed to create expense');
    await recordSyncChange('expenses', 'create', id);
    return expense;
  }

  async update(id: string, data: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Expense> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    const fields: (keyof typeof data)[] = ['cropId', 'category', 'amount', 'currency', 'date', 'vendor', 'receiptPhoto', 'notes', 'recurring', 'recurringInterval', 'healthRecordId', 'recurringSourceId'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        if (field === 'recurring') {
          updates.push(`${field} = ?`);
          params.push(data[field] ? 1 : 0);
        } else {
          updates.push(`${field} = ?`);
          params.push(data[field]);
        }
      }
    }

    if (updates.length === 0) {
      const expense = await this.getById(id);
      if (!expense) throw new Error('Expense not found');
      return expense;
    }

    updates.push('updatedAt = ?');
    params.push(now, id);

    await executeSql(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`, params);

    const expense = await this.getById(id);
    if (!expense) throw new Error('Failed to update expense');
    await recordSyncChange('expenses', 'update', id);
    return expense;
  }

  async delete(id: string): Promise<void> {
    await executeSql('DELETE FROM expenses WHERE id = ?', [id]);
    await recordSyncChange('expenses', 'delete', id);
  }

  private mapRowToExpense(row: any): Expense {
    return {
      id: row.id,
      cropId: row.cropId,
      category: row.category,
      amount: row.amount,
      currency: row.currency,
      date: row.date,
      vendor: row.vendor,
      receiptPhoto: row.receiptPhoto,
      notes: row.notes,
      recurring: row.recurring === 1,
      recurringInterval: row.recurringInterval,
      healthRecordId: row.healthRecordId || undefined,
      recurringSourceId: row.recurringSourceId || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async getRecurringSources(): Promise<Expense[]> {
    const rows = await queryAll<any>('SELECT * FROM expenses WHERE recurring = 1');
    return rows.map(this.mapRowToExpense);
  }

  async generateRecurringInstances(): Promise<void> {
    const sources = await this.getRecurringSources();
    const today = format(new Date(), 'yyyy-MM-dd');
    for (const source of sources) {
      const existing = await queryAll<{ date: string }>(
        'SELECT date FROM expenses WHERE recurringSourceId = ?',
        [source.id]
      );
      const existingDates = new Set(existing.map((row) => row.date));
      let nextDate = addInterval(source.date, source.recurringInterval);
      let guard = 0;
      while (nextDate <= today && guard < 120) {
        guard += 1;
        if (!existingDates.has(nextDate)) {
          await this.create({
            cropId: source.cropId,
            category: source.category,
            amount: source.amount,
            currency: source.currency,
            date: nextDate,
            vendor: source.vendor,
            notes: source.notes,
            recurring: false,
            recurringInterval: undefined,
            healthRecordId: undefined,
            recurringSourceId: source.id,
          });
          existingDates.add(nextDate);
        }
        nextDate = addInterval(nextDate, source.recurringInterval);
      }
    }
  }
}

function addInterval(dateStr: string, interval: Expense['recurringInterval']): string {
  const base = new Date(`${dateStr}T00:00:00`);
  let next: Date;
  switch (interval) {
    case 'daily':
      next = addDays(base, 1);
      break;
    case 'weekly':
      next = addDays(base, 7);
      break;
    case 'yearly':
      next = addYears(base, 1);
      break;
    default:
      next = addMonths(base, 1);
  }
  return format(next, 'yyyy-MM-dd');
}