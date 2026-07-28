import { Harvest, HarvestQuery } from '../../../types';
import { queryAll, queryFirst, executeSql } from '../../../database';

export class HarvestRepository {
  async getAll(query?: HarvestQuery): Promise<Harvest[]> {
    let sql = 'SELECT * FROM harvests';
    const params: any[] = [];
    const conditions: string[] = [];

    if (query?.cropId) {
      conditions.push('cropId = ?');
      params.push(query.cropId);
    }
    if (query?.dateFrom) {
      conditions.push('harvestDate >= ?');
      params.push(query.dateFrom);
    }
    if (query?.dateTo) {
      conditions.push('harvestDate <= ?');
      params.push(query.dateTo);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY harvestDate DESC';
    if (query?.limit) {
      sql += ` LIMIT ${query.limit}`;
      if (query.offset) sql += ` OFFSET ${query.offset}`;
    }

    const rows = await queryAll<any>(sql, params);
    return rows.map(this.mapRowToHarvest);
  }

  async getById(id: string): Promise<Harvest | null> {
    const row = await queryFirst<any>('SELECT * FROM harvests WHERE id = ?', [id]);
    return row ? this.mapRowToHarvest(row) : null;
  }

  async create(data: Omit<Harvest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Harvest> {
    const now = new Date().toISOString();
    const id = `harv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const photos = JSON.stringify(data.photos || []);

    await executeSql(
      'INSERT INTO harvests (id, cropId, harvestDate, quantity, unit, quality, moistureContent, photos, notes, sellingPrice, buyer, revenue, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.cropId, data.harvestDate, data.quantity, data.unit, data.quality || null, data.moistureContent || null, photos, data.notes, data.sellingPrice || 0, data.buyer || null, data.revenue || 0, now, now]
    );

    const harvest = await this.getById(id);
    if (!harvest) throw new Error('Failed to create harvest');
    return harvest;
  }

  async update(id: string, data: Partial<Omit<Harvest, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Harvest> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    const fields: (keyof typeof data)[] = ['cropId', 'harvestDate', 'quantity', 'unit', 'quality', 'moistureContent', 'photos', 'notes', 'sellingPrice', 'buyer', 'revenue'];

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
      const harvest = await this.getById(id);
      if (!harvest) throw new Error('Harvest not found');
      return harvest;
    }

    updates.push('updatedAt = ?');
    params.push(now, id);

    await executeSql(`UPDATE harvests SET ${updates.join(', ')} WHERE id = ?`, params);

    const harvest = await this.getById(id);
    if (!harvest) throw new Error('Failed to update harvest');
    return harvest;
  }

  async delete(id: string): Promise<void> {
    await executeSql('DELETE FROM harvests WHERE id = ?', [id]);
  }

  private mapRowToHarvest(row: any): Harvest {
    return {
      id: row.id,
      cropId: row.cropId,
      harvestDate: row.harvestDate,
      quantity: row.quantity,
      unit: row.unit,
      quality: row.quality,
      moistureContent: row.moistureContent,
      photos: row.photos ? JSON.parse(row.photos) : [],
      notes: row.notes,
      sellingPrice: row.sellingPrice,
      buyer: row.buyer,
      revenue: row.revenue,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}