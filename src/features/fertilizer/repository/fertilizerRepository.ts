import { FertilizerApplication, FertilizerQuery } from '../../../types';
import { queryAll, queryFirst, executeSql } from '../../../database';

export class FertilizerRepository {
  async getAll(query?: FertilizerQuery): Promise<FertilizerApplication[]> {
    let sql = 'SELECT * FROM fertilizer_schedules';
    const params: any[] = [];
    const conditions: string[] = [];

    if (query?.cropId) {
      conditions.push('cropId = ?');
      params.push(query.cropId);
    }
    if (query?.fertilizerType) {
      conditions.push('fertilizerType = ?');
      params.push(query.fertilizerType);
    }
    if (query?.dateFrom) {
      conditions.push('scheduledDate >= ?');
      params.push(query.dateFrom);
    }
    if (query?.dateTo) {
      conditions.push('scheduledDate <= ?');
      params.push(query.dateTo);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY scheduledDate ASC';
    if (query?.limit) {
      sql += ` LIMIT ${query.limit}`;
      if (query.offset) sql += ` OFFSET ${query.offset}`;
    }

    const rows = await queryAll<any>(sql, params);
    return rows.map(this.mapRowToApplication);
  }

  async getById(id: string): Promise<FertilizerApplication | null> {
    const row = await queryFirst<any>('SELECT * FROM fertilizer_schedules WHERE id = ?', [id]);
    return row ? this.mapRowToApplication(row) : null;
  }

  async create(data: Omit<FertilizerApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<FertilizerApplication> {
    const now = new Date().toISOString();
    const id = `fert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await executeSql(
      'INSERT INTO fertilizer_schedules (id, cropId, fertilizerName, fertilizerType, applicationMethod, amountPerUnit, totalAmount, unit, scheduledDate, completedDate, status, notes, reminderEnabled, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.cropId, data.fertilizerName, data.fertilizerType, data.applicationMethod, data.amountPerUnit, data.totalAmount, data.unit, data.scheduledDate, data.completedDate || null, data.status, data.notes, data.reminderEnabled ? 1 : 0, now, now]
    );

    const app = await this.getById(id);
    if (!app) throw new Error('Failed to create fertilizer schedule');
    return app;
  }

  async update(id: string, data: Partial<Omit<FertilizerApplication, 'id' | 'createdAt' | 'updatedAt'>>): Promise<FertilizerApplication> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    const fields: (keyof typeof data)[] = ['cropId', 'fertilizerName', 'fertilizerType', 'applicationMethod', 'amountPerUnit', 'totalAmount', 'unit', 'scheduledDate', 'completedDate', 'status', 'notes', 'reminderEnabled'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        if (field === 'reminderEnabled') {
          updates.push(`${field} = ?`);
          params.push(data[field] ? 1 : 0);
        } else {
          updates.push(`${field} = ?`);
          params.push(data[field]);
        }
      }
    }

    if (updates.length === 0) {
      const app = await this.getById(id);
      if (!app) throw new Error('Fertilizer schedule not found');
      return app;
    }

    updates.push('updatedAt = ?');
    params.push(now, id);

    await executeSql(`UPDATE fertilizer_schedules SET ${updates.join(', ')} WHERE id = ?`, params);

    const app = await this.getById(id);
    if (!app) throw new Error('Failed to update fertilizer schedule');
    return app;
  }

  async delete(id: string): Promise<void> {
    await executeSql('DELETE FROM fertilizer_schedules WHERE id = ?', [id]);
  }

  private mapRowToApplication(row: any): FertilizerApplication {
    return {
      id: row.id,
      cropId: row.cropId,
      fertilizerName: row.fertilizerName,
      fertilizerType: row.fertilizerType,
      applicationMethod: row.applicationMethod,
      amountPerUnit: row.amountPerUnit,
      totalAmount: row.totalAmount,
      unit: row.unit,
      scheduledDate: row.scheduledDate,
      completedDate: row.completedDate,
      status: row.status,
      notes: row.notes,
      reminderEnabled: row.reminderEnabled === 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}