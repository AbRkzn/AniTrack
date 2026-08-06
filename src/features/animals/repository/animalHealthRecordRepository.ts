import { AnimalHealthRecord, AnimalHealthQuery } from '../../../types';
import { queryAll, queryFirst, executeSql } from '../../../database';
import { recordSyncChange } from '../../../services/syncQueue';

export class AnimalHealthRecordRepository {
  async getByAnimalId(animalId: string, query?: AnimalHealthQuery): Promise<AnimalHealthRecord[]> {
    let sql = 'SELECT * FROM animal_health_records WHERE animalId = ?';
    const params: any[] = [animalId];
    const conditions: string[] = [];

    if (query?.type) {
      conditions.push('type = ?');
      params.push(query.type);
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

  async getById(id: string): Promise<AnimalHealthRecord | null> {
    const row = await queryFirst<any>('SELECT * FROM animal_health_records WHERE id = ?', [id]);
    return row ? this.mapRowToRecord(row) : null;
  }

  async getAll(): Promise<AnimalHealthRecord[]> {
    const rows = await queryAll<any>('SELECT * FROM animal_health_records ORDER BY date DESC, createdAt DESC');
    return rows.map(this.mapRowToRecord);
  }

  async create(data: Omit<AnimalHealthRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnimalHealthRecord> {
    const now = new Date().toISOString();
    const id = `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await executeSql(
      'INSERT INTO animal_health_records (id, animalId, date, type, diagnosis, medication, dosage, veterinarian, cost, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, data.animalId, data.date, data.type, data.diagnosis || null,
        data.medication || null, data.dosage || null, data.veterinarian || null,
        data.cost ?? null, data.notes, now, now
      ]
    );

    const record = await this.getById(id);
    if (!record) throw new Error('Failed to create health record');
    await recordSyncChange('animal_health_records', 'create', id);
    return record;
  }

  async update(id: string, data: Partial<Omit<AnimalHealthRecord, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AnimalHealthRecord> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    const fields: (keyof typeof data)[] = ['date', 'type', 'diagnosis', 'medication', 'dosage', 'veterinarian', 'cost', 'notes'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        if (field === 'diagnosis' || field === 'medication' || field === 'dosage' || field === 'veterinarian') {
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
      if (!record) throw new Error('Health record not found');
      return record;
    }

    updates.push('updatedAt = ?');
    params.push(now, id);
    await executeSql(`UPDATE animal_health_records SET ${updates.join(', ')} WHERE id = ?`, params);

    const record = await this.getById(id);
    if (!record) throw new Error('Failed to update health record');
    await recordSyncChange('animal_health_records', 'update', id);
    return record;
  }

  async delete(id: string): Promise<void> {
    await executeSql('DELETE FROM animal_health_records WHERE id = ?', [id]);
    await recordSyncChange('animal_health_records', 'delete', id);
  }

  private mapRowToRecord(row: any): AnimalHealthRecord {
    return {
      id: row.id,
      animalId: row.animalId,
      date: row.date,
      type: row.type,
      diagnosis: row.diagnosis || undefined,
      medication: row.medication || undefined,
      dosage: row.dosage || undefined,
      veterinarian: row.veterinarian || undefined,
      cost: row.cost ?? undefined,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt || row.createdAt,
    };
  }
}
