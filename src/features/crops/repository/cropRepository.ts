import { Crop, CropQuery } from '../../../types';
import { queryAll, queryFirst, executeSql } from '../../../database';
import { recordSyncChange } from '../../../services/syncQueue';

export class CropRepository {
  async getAll(query?: CropQuery): Promise<Crop[]> {
    let sql = 'SELECT * FROM crops';
    const params: any[] = [];
    const conditions: string[] = [];

    if (query?.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }

    if (query?.search) {
      conditions.push('(name LIKE ? OR variety LIKE ? OR fieldLocation LIKE ?)');
      const search = `%${query.search}%`;
      params.push(search, search, search);
    }

    if (query?.fieldId) {
      conditions.push('fieldId = ?');
      params.push(query.fieldId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    if (query?.orderBy) {
      sql += ` ORDER BY ${query.orderBy} ${query.orderDir || 'ASC'}`;
    } else {
      sql += ' ORDER BY createdAt DESC';
    }

    if (query?.limit) {
      sql += ` LIMIT ${query.limit}`;
      if (query.offset) sql += ` OFFSET ${query.offset}`;
    }

    const rows = await queryAll<any>(sql, params);
    return rows.map(this.mapRowToCrop);
  }

  async getById(id: string): Promise<Crop | null> {
    const row = await queryFirst<any>('SELECT * FROM crops WHERE id = ?', [id]);
    return row ? this.mapRowToCrop(row) : null;
  }

  async create(data: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>): Promise<Crop> {
    const now = new Date().toISOString();
    const id = `crop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const photos = JSON.stringify(data.photos || []);

    await executeSql(
      'INSERT INTO crops (id, name, variety, fieldLocation, fieldId, plantingDate, expectedHarvestDate, actualHarvestDate, status, notes, photos, yieldEstimate, yieldUnit, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, data.name, data.variety, data.fieldLocation, data.fieldId || null, data.plantingDate,
        data.expectedHarvestDate, data.actualHarvestDate || null, data.status,
        data.notes, photos, data.yieldEstimate, data.yieldUnit, now, now
      ]
    );

    const crop = await this.getById(id);
    if (!crop) throw new Error('Failed to create crop');
    await recordSyncChange('crops', 'create', id);
    return crop;
  }

  async update(id: string, data: Partial<Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Crop> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    const fields: (keyof typeof data)[] = ['name', 'variety', 'fieldLocation', 'fieldId', 'plantingDate', 'expectedHarvestDate', 'actualHarvestDate', 'status', 'notes', 'photos', 'yieldEstimate', 'yieldUnit'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        if (field === 'photos') {
          updates.push(`${field} = ?`);
          params.push(JSON.stringify(data[field]));
        } else {
          updates.push(`${field} = ?`);
          params.push(data[field]);
        }
      }
    }

    if (updates.length === 0) {
      const crop = await this.getById(id);
      if (!crop) throw new Error('Crop not found');
      return crop;
    }

    updates.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    await executeSql(`UPDATE crops SET ${updates.join(', ')} WHERE id = ?`, params);

    const crop = await this.getById(id);
    if (!crop) throw new Error('Failed to update crop');
    await recordSyncChange('crops', 'update', id);
    return crop;
  }

  async delete(id: string): Promise<void> {
    await executeSql('DELETE FROM crops WHERE id = ?', [id]);
    await recordSyncChange('crops', 'delete', id);
  }

  private mapRowToCrop(row: any): Crop {
    return {
      id: row.id,
      name: row.name,
      variety: row.variety,
      fieldLocation: row.fieldLocation,
      fieldId: row.fieldId || undefined,
      plantingDate: row.plantingDate,
      expectedHarvestDate: row.expectedHarvestDate,
      actualHarvestDate: row.actualHarvestDate,
      status: row.status,
      notes: row.notes,
      photos: row.photos ? JSON.parse(row.photos) : [],
      yieldEstimate: row.yieldEstimate,
      yieldUnit: row.yieldUnit,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}