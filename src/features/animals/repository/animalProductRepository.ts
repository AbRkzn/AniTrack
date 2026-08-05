import { AnimalProduct, AnimalProductQuery } from '../../../types';
import { queryAll, queryFirst, executeSql } from '../../../database';
import { recordSyncChange } from '../../../services/syncQueue';

export class AnimalProductRepository {
  async getAll(query?: AnimalProductQuery): Promise<AnimalProduct[]> {
    let sql = 'SELECT * FROM animal_products';
    const params: any[] = [];
    const conditions: string[] = [];

    if (query?.productType) {
      conditions.push('productType = ?');
      params.push(query.productType);
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

    sql += ' ORDER BY date DESC, createdAt DESC';
    if (query?.limit) {
      sql += ` LIMIT ${query.limit}`;
      if (query.offset) sql += ` OFFSET ${query.offset}`;
    }

    const rows = await queryAll<any>(sql, params);
    return rows.map(this.mapRowToRecord);
  }

  async getByAnimalId(animalId: string, query?: AnimalProductQuery): Promise<AnimalProduct[]> {
    let sql = 'SELECT * FROM animal_products WHERE animalId = ?';
    const params: any[] = [animalId];
    const conditions: string[] = [];

    if (query?.productType) {
      conditions.push('productType = ?');
      params.push(query.productType);
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
      sql += ' AND ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY date DESC, createdAt DESC';

    const rows = await queryAll<any>(sql, params);
    return rows.map(this.mapRowToRecord);
  }

  async getById(id: string): Promise<AnimalProduct | null> {
    const row = await queryFirst<any>('SELECT * FROM animal_products WHERE id = ?', [id]);
    return row ? this.mapRowToRecord(row) : null;
  }

  async create(data: Omit<AnimalProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnimalProduct> {
    const now = new Date().toISOString();
    const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await executeSql(
      'INSERT INTO animal_products (id, animalId, productType, date, quantity, unit, sellingPrice, buyer, revenue, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, data.animalId, data.productType, data.date, data.quantity, data.unit,
        data.sellingPrice || 0, data.buyer || null, data.revenue || 0, data.notes, now, now
      ]
    );

    const record = await this.getById(id);
    if (!record) throw new Error('Failed to create product record');
    await recordSyncChange('animal_products', 'create', id);
    return record;
  }

  async update(id: string, data: Partial<Omit<AnimalProduct, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AnimalProduct> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    const fields: (keyof typeof data)[] = ['productType', 'date', 'quantity', 'unit', 'sellingPrice', 'buyer', 'revenue', 'notes'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        if (field === 'buyer') {
          updates.push(`${field} = ?`);
          params.push((data[field] as string | undefined) || null);
        } else {
          updates.push(`${field} = ?`);
          params.push(data[field]);
        }
      }
    }

    if (updates.length === 0) {
      const record = await this.getById(id);
      if (!record) throw new Error('Product record not found');
      return record;
    }

    updates.push('updatedAt = ?');
    params.push(now, id);
    await executeSql(`UPDATE animal_products SET ${updates.join(', ')} WHERE id = ?`, params);

    const record = await this.getById(id);
    if (!record) throw new Error('Failed to update product record');
    await recordSyncChange('animal_products', 'update', id);
    return record;
  }

  async delete(id: string): Promise<void> {
    await executeSql('DELETE FROM animal_products WHERE id = ?', [id]);
    await recordSyncChange('animal_products', 'delete', id);
  }

  private mapRowToRecord(row: any): AnimalProduct {
    return {
      id: row.id,
      animalId: row.animalId,
      productType: row.productType,
      date: row.date,
      quantity: row.quantity,
      unit: row.unit,
      sellingPrice: row.sellingPrice || undefined,
      buyer: row.buyer || undefined,
      revenue: row.revenue || undefined,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt || row.createdAt,
    };
  }
}
