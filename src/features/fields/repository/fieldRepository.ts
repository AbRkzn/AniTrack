import { Field, FieldQuery } from '../../../types';
import { queryAll, queryFirst, executeSql } from '../../../database';
import { recordSyncChange } from '../../../services/syncQueue';

export class FieldRepository {
  async getAll(query?: FieldQuery): Promise<Field[]> {
    let sql = 'SELECT * FROM fields';
    const params: any[] = [];

    if (query?.search) {
      sql += ' WHERE (name LIKE ? OR soilType LIKE ? OR notes LIKE ?)';
      const search = `%${query.search}%`;
      params.push(search, search, search);
    }

    sql += ' ORDER BY name ASC';

    const rows = await queryAll<any>(sql, params);
    return rows.map(this.mapRowToField);
  }

  async getById(id: string): Promise<Field | null> {
    const row = await queryFirst<any>('SELECT * FROM fields WHERE id = ?', [id]);
    return row ? this.mapRowToField(row) : null;
  }

  async create(data: Omit<Field, 'id' | 'createdAt' | 'updatedAt'>): Promise<Field> {
    const now = new Date().toISOString();
    const id = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await executeSql(
      'INSERT INTO fields (id, name, acreage, soilType, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, data.name, data.acreage, data.soilType || '', data.notes, now, now]
    );

    const field = await this.getById(id);
    if (!field) throw new Error('Failed to create field');
    await recordSyncChange('fields', 'create', id);
    return field;
  }

  async update(id: string, data: Partial<Omit<Field, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Field> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    const fields: (keyof typeof data)[] = ['name', 'acreage', 'soilType', 'notes'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (updates.length === 0) {
      const field = await this.getById(id);
      if (!field) throw new Error('Field not found');
      return field;
    }

    updates.push('updatedAt = ?');
    params.push(now, id);

    await executeSql(`UPDATE fields SET ${updates.join(', ')} WHERE id = ?`, params);

    const field = await this.getById(id);
    if (!field) throw new Error('Failed to update field');
    await recordSyncChange('fields', 'update', id);
    return field;
  }

  async delete(id: string): Promise<void> {
    await executeSql('DELETE FROM fields WHERE id = ?', [id]);
    await recordSyncChange('fields', 'delete', id);
  }

  private mapRowToField(row: any): Field {
    return {
      id: row.id,
      name: row.name,
      acreage: row.acreage,
      soilType: row.soilType || undefined,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
