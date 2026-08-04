import { FarmTask, TaskQuery } from '../../../types';
import { queryAll, queryFirst, executeSql } from '../../../database';

export class TaskRepository {
  async getAll(query?: TaskQuery): Promise<FarmTask[]> {
    let sql = 'SELECT * FROM farm_tasks';
    const params: any[] = [];
    const conditions: string[] = [];

    if (query?.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }
    if (query?.category) {
      conditions.push('category = ?');
      params.push(query.category);
    }
    if (query?.cropId) {
      conditions.push('cropId = ?');
      params.push(query.cropId);
    }
    if (query?.fieldId) {
      conditions.push('fieldId = ?');
      params.push(query.fieldId);
    }
    if (query?.dateFrom) {
      conditions.push('dueDate >= ?');
      params.push(query.dateFrom);
    }
    if (query?.dateTo) {
      conditions.push('dueDate <= ?');
      params.push(query.dateTo);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY dueDate ASC, createdAt DESC';
    if (query?.limit) {
      sql += ` LIMIT ${query.limit}`;
      if (query.offset) sql += ` OFFSET ${query.offset}`;
    }

    const rows = await queryAll<any>(sql, params);
    return rows.map(this.mapRowToTask);
  }

  async getById(id: string): Promise<FarmTask | null> {
    const row = await queryFirst<any>('SELECT * FROM farm_tasks WHERE id = ?', [id]);
    return row ? this.mapRowToTask(row) : null;
  }

  async create(data: Omit<FarmTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<FarmTask> {
    const now = new Date().toISOString();
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await executeSql(
      'INSERT INTO farm_tasks (id, title, description, category, priority, status, dueDate, cropId, fieldId, assignedTo, reminderEnabled, reminderDate, completedDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, data.title, data.description, data.category, data.priority, data.status,
        data.dueDate, data.cropId || null, data.fieldId || null, data.assignedTo || null,
        data.reminderEnabled ? 1 : 0, data.reminderDate || null, data.completedDate || null,
        now, now,
      ]
    );

    const task = await this.getById(id);
    if (!task) throw new Error('Failed to create task');
    return task;
  }

  async update(id: string, data: Partial<Omit<FarmTask, 'id' | 'createdAt' | 'updatedAt'>>): Promise<FarmTask> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    const fields: (keyof typeof data)[] = ['title', 'description', 'category', 'priority', 'status', 'dueDate', 'cropId', 'fieldId', 'assignedTo', 'reminderEnabled', 'reminderDate', 'completedDate'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        if (field === 'reminderEnabled') {
          updates.push(`${field} = ?`);
          params.push(data[field] ? 1 : 0);
        } else if (field === 'completedDate') {
          updates.push(`${field} = ?`);
          params.push(data[field] ? data[field] : null);
        } else {
          updates.push(`${field} = ?`);
          params.push(data[field]);
        }
      }
    }

    if (updates.length === 0) {
      const task = await this.getById(id);
      if (!task) throw new Error('Task not found');
      return task;
    }

    updates.push('updatedAt = ?');
    params.push(now, id);

    await executeSql(`UPDATE farm_tasks SET ${updates.join(', ')} WHERE id = ?`, params);

    const task = await this.getById(id);
    if (!task) throw new Error('Failed to update task');
    return task;
  }

  async delete(id: string): Promise<void> {
    await executeSql('DELETE FROM farm_tasks WHERE id = ?', [id]);
  }

  private mapRowToTask(row: any): FarmTask {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      priority: row.priority,
      status: row.status,
      dueDate: row.dueDate,
      cropId: row.cropId || undefined,
      fieldId: row.fieldId || undefined,
      assignedTo: row.assignedTo || undefined,
      reminderEnabled: row.reminderEnabled === 1,
      reminderDate: row.reminderDate || undefined,
      completedDate: row.completedDate || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
