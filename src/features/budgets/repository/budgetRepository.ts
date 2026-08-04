import { Budget, BudgetQuery } from '../../../types';
import { queryAll, queryFirst, executeSql } from '../../../database';

export class BudgetRepository {
  async getAll(query?: BudgetQuery): Promise<Budget[]> {
    let sql = 'SELECT * FROM budgets';
    const params: any[] = [];
    const conditions: string[] = [];

    if (query?.category) {
      conditions.push('category = ?');
      params.push(query.category);
    }
    if (query?.month) {
      conditions.push('month = ?');
      params.push(query.month);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY month DESC, category ASC';

    const rows = await queryAll<any>(sql, params);
    return rows.map(this.mapRowToBudget);
  }

  async getById(id: string): Promise<Budget | null> {
    const row = await queryFirst<any>('SELECT * FROM budgets WHERE id = ?', [id]);
    return row ? this.mapRowToBudget(row) : null;
  }

  async getByCategoryAndMonth(category: string, month: string): Promise<Budget | null> {
    const row = await queryFirst<any>('SELECT * FROM budgets WHERE category = ? AND month = ?', [category, month]);
    return row ? this.mapRowToBudget(row) : null;
  }

  async create(data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    const now = new Date().toISOString();
    const id = `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await executeSql(
      'INSERT INTO budgets (id, category, amount, currency, month, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(category, month) DO UPDATE SET amount = excluded.amount, currency = excluded.currency, notes = excluded.notes, updatedAt = excluded.updatedAt',
      [id, data.category, data.amount, data.currency, data.month, data.notes || '', now, now]
    );

    const budget = await this.getByCategoryAndMonth(data.category, data.month);
    if (!budget) throw new Error('Failed to create budget');
    return budget;
  }

  async update(id: string, data: Partial<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Budget> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    const fields: (keyof typeof data)[] = ['category', 'amount', 'currency', 'month', 'notes'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (updates.length === 0) {
      const budget = await this.getById(id);
      if (!budget) throw new Error('Budget not found');
      return budget;
    }

    updates.push('updatedAt = ?');
    params.push(now, id);

    await executeSql(`UPDATE budgets SET ${updates.join(', ')} WHERE id = ?`, params);

    const budget = await this.getById(id);
    if (!budget) throw new Error('Failed to update budget');
    return budget;
  }

  async delete(id: string): Promise<void> {
    await executeSql('DELETE FROM budgets WHERE id = ?', [id]);
  }

  private mapRowToBudget(row: any): Budget {
    return {
      id: row.id,
      category: row.category,
      amount: row.amount,
      currency: row.currency,
      month: row.month,
      notes: row.notes || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
