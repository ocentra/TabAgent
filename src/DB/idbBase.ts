// idbBase.ts

// NOTE: All DB worker messages should use { action: ... } not { type: ... } for action property.

export abstract class BaseCRUD<T> {
  public id: string;
  public label: string;
  protected dbWorker: Worker;

  constructor(id: string, label: string, dbWorker: Worker) {
    this.id = id;
    this.label = label;
    this.dbWorker = dbWorker;
  }

  static async create(..._args: any[]): Promise<string> {
    throw new Error('Static create() not implemented');
  }

  static async read(_id: string, ..._args: any[]): Promise<any> {
    throw new Error('Static read() not implemented');
  }

  // UPDATE (static, optional)
  static async update(_id: string, _updates: Partial<any>, ..._args: any[]): Promise<void> {
    throw new Error('Static update() not implemented');
  }

  // DELETE (static, optional)
  static async delete(_id: string, ..._args: any[]): Promise<void> {
    throw new Error('Static delete() not implemented');
  }

  // --- Instance CRUD ---

  abstract update(updates: Partial<T>): Promise<void>;
  abstract delete(): Promise<void>;
  abstract saveToDB(): Promise<string>;
}

// Generic Manifest interface for any asset type
export interface Manifest {
  id: string;
  fileName: string;
  fileType: string;
  status: string;
  addedAt?: number;
}