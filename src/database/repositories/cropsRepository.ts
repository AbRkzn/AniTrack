import { BaseRepository } from "./BaseRepository";
import { Crop, CropStatus } from "@/types/models";

interface CropRow {
  id: string;
  name: string;
  variety: string | null;
  field_location: string | null;
  planting_date: string;
  expected_harvest_date: string | null;
  status: CropStatus;
  notes: string | null;
  primary_photo_uri: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  is_deleted: number;
}

function toModel(row: CropRow): Crop {
  return {
    id: row.id,
    name: row.name,
    variety: row.variety,
    fieldLocation: row.field_location,
    plantingDate: row.planting_date,
    expectedHarvestDate: row.expected_harvest_date,
    status: row.status,
    notes: row.notes,
    primaryPhotoUri: row.primary_photo_uri,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
    isDeleted: !!row.is_deleted,
  };
}

export type CreateCropInput = {
  name: string;
  variety?: string | null;
  fieldLocation?: string | null;
  plantingDate: string;
  expectedHarvestDate?: string | null;
  notes?: string | null;
  primaryPhotoUri?: string | null;
};

export type UpdateCropInput = Partial<CreateCropInput> & { status?: CropStatus };

class CropsRepository extends BaseRepository {
  async findAll(): Promise<Crop[]> {
    const db = await this.db();
    const rows = await db.getAllAsync<CropRow>(
      "SELECT * FROM crops WHERE is_deleted = 0 ORDER BY created_at DESC"
    );
    return rows.map(toModel);
  }

  async findById(id: string): Promise<Crop | null> {
    const db = await this.db();
    const row = await db.getFirstAsync<CropRow>(
      "SELECT * FROM crops WHERE id = ? AND is_deleted = 0",
      id
    );
    return row ? toModel(row) : null;
  }

  async findByStatus(status: CropStatus): Promise<Crop[]> {
    const db = await this.db();
    const rows = await db.getAllAsync<CropRow>(
      "SELECT * FROM crops WHERE status = ? AND is_deleted = 0 ORDER BY planting_date ASC",
      status
    );
    return rows.map(toModel);
  }

  async findUpcomingHarvests(withinDays = 14): Promise<Crop[]> {
    const db = await this.db();
    const cutoff = new Date(Date.now() + withinDays * 86400000).toISOString();
    const rows = await db.getAllAsync<CropRow>(
      `SELECT * FROM crops
       WHERE is_deleted = 0
         AND status IN ('growing','ready_for_harvest')
         AND expected_harvest_date IS NOT NULL
         AND expected_harvest_date <= ?
       ORDER BY expected_harvest_date ASC`,
      cutoff
    );
    return rows.map(toModel);
  }

  async create(input: CreateCropInput): Promise<Crop> {
    const db = await this.db();
    const id = this.generateId();
    const now = this.nowISO();

    await db.runAsync(
      `INSERT INTO crops
        (id, name, variety, field_location, planting_date, expected_harvest_date,
         status, notes, primary_photo_uri, created_at, updated_at, synced_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, 'growing', ?, ?, ?, ?, NULL, 0)`,
      id,
      input.name,
      input.variety ?? null,
      input.fieldLocation ?? null,
      input.plantingDate,
      input.expectedHarvestDate ?? null,
      input.notes ?? null,
      input.primaryPhotoUri ?? null,
      now,
      now
    );

    const created = await this.findById(id);
    if (!created) throw new Error("Failed to create crop");
    return created;
  }

  async update(id: string, input: UpdateCropInput): Promise<Crop> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Crop ${id} not found`);

    const merged: CreateCropInput & { status: CropStatus } = {
      name: input.name ?? existing.name,
      variety: input.variety ?? existing.variety,
      fieldLocation: input.fieldLocation ?? existing.fieldLocation,
      plantingDate: input.plantingDate ?? existing.plantingDate,
      expectedHarvestDate: input.expectedHarvestDate ?? existing.expectedHarvestDate,
      notes: input.notes ?? existing.notes,
      primaryPhotoUri: input.primaryPhotoUri ?? existing.primaryPhotoUri,
      status: input.status ?? existing.status,
    };

    const db = await this.db();
    await db.runAsync(
      `UPDATE crops SET
        name = ?, variety = ?, field_location = ?, planting_date = ?,
        expected_harvest_date = ?, notes = ?, primary_photo_uri = ?,
        status = ?, updated_at = ?
       WHERE id = ?`,
      merged.name,
      merged.variety,
      merged.fieldLocation,
      merged.plantingDate,
      merged.expectedHarvestDate,
      merged.notes,
      merged.primaryPhotoUri,
      merged.status,
      this.nowISO(),
      id
    );

    const updated = await this.findById(id);
    if (!updated) throw new Error("Failed to update crop");
    return updated;
  }

  /** Soft delete — keeps history for reports & future sync tombstones. */
  async delete(id: string): Promise<void> {
    const db = await this.db();
    await db.runAsync(
      "UPDATE crops SET is_deleted = 1, updated_at = ? WHERE id = ?",
      this.nowISO(),
      id
    );
  }

  async count(): Promise<number> {
    const db = await this.db();
    const row = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM crops WHERE is_deleted = 0"
    );
    return row?.count ?? 0;
  }
}

export const cropsRepository = new CropsRepository();
