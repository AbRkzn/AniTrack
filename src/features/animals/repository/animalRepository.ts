import { Animal, AnimalQuery } from '../../../types';
import { queryAll, queryFirst, executeSql } from '../../../database';

export class AnimalRepository {
  async getAll(query?: AnimalQuery): Promise<Animal[]> {
    let sql = 'SELECT * FROM animals';
    const params: any[] = [];
    const conditions: string[] = [];

    if (query?.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }

    if (query?.sex) {
      conditions.push('sex = ?');
      params.push(query.sex);
    }

    if (query?.search) {
      conditions.push('(tagNumber LIKE ? OR name LIKE ? OR species LIKE ? OR breed LIKE ?)');
      const search = `%${query.search}%`;
      params.push(search, search, search, search);
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
    return rows.map(this.mapRowToAnimal);
  }

  async getById(id: string): Promise<Animal | null> {
    const row = await queryFirst<any>('SELECT * FROM animals WHERE id = ?', [id]);
    return row ? this.mapRowToAnimal(row) : null;
  }

  async create(data: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Animal> {
    const now = new Date().toISOString();
    const id = `animal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const photos = JSON.stringify(data.photos || []);

    await executeSql(
      'INSERT INTO animals (id, tagNumber, name, species, breed, birthDate, sex, weight, weightUnit, status, location, notes, photos, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, data.tagNumber, data.name || null, data.species, data.breed || null,
        data.birthDate || null, data.sex, data.weight ?? null, data.weightUnit || 'kg',
        data.status, data.location, data.notes, photos, now, now
      ]
    );

    const animal = await this.getById(id);
    if (!animal) throw new Error('Failed to create animal');
    return animal;
  }

  async update(id: string, data: Partial<Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Animal> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    const fields: (keyof typeof data)[] = ['tagNumber', 'name', 'species', 'breed', 'birthDate', 'sex', 'weight', 'weightUnit', 'status', 'location', 'notes', 'photos'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        if (field === 'photos') {
          updates.push(`${field} = ?`);
          params.push(JSON.stringify(data[field]));
        } else if (field === 'name' || field === 'breed' || field === 'birthDate') {
          updates.push(`${field} = ?`);
          params.push((data[field] as string | undefined) || null);
        } else {
          updates.push(`${field} = ?`);
          params.push(data[field]);
        }
      }
    }

    if (updates.length === 0) {
      const animal = await this.getById(id);
      if (!animal) throw new Error('Animal not found');
      return animal;
    }

    updates.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    await executeSql(`UPDATE animals SET ${updates.join(', ')} WHERE id = ?`, params);

    const animal = await this.getById(id);
    if (!animal) throw new Error('Failed to update animal');
    return animal;
  }

  async delete(id: string): Promise<void> {
    await executeSql('DELETE FROM animals WHERE id = ?', [id]);
  }

  private mapRowToAnimal(row: any): Animal {
    return {
      id: row.id,
      tagNumber: row.tagNumber,
      name: row.name || undefined,
      species: row.species,
      breed: row.breed || undefined,
      birthDate: row.birthDate || undefined,
      sex: row.sex,
      weight: row.weight ?? undefined,
      weightUnit: row.weightUnit || 'kg',
      status: row.status,
      location: row.location,
      notes: row.notes,
      photos: row.photos ? JSON.parse(row.photos) : [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
