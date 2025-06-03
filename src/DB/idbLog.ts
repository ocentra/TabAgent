// idbLog.ts

import { BaseCRUD, DB_ENTITY_TYPES } from "./idbBase";
import { DBNames, LogLevel } from "./idbSchema";
import { DBActions } from "./dbActions";
import { assertDbWorker } from '../Utilities/dbChannels';
import { MESSAGE_EVENT } from '../Utilities/eventConstants';

export class LogEntry extends BaseCRUD<LogEntry> {
  public timestamp: number;
  public level: LogLevel;
  public message: string;
  public component: string;
  public extensionSessionId: string;
  public chatSessionId?: string;

  constructor(
    id: string,
    timestamp: number,
    level: LogLevel,
    message: string,
    component: string,
    extensionSessionId: string,
    dbWorker: Worker,
    chatSessionId?: string
  ) {
    super(id, message, dbWorker); // Use message as label for consistency
    this.timestamp = timestamp;
    this.level = level;
    this.message = message;
    this.component = component;
    this.extensionSessionId = extensionSessionId;
    this.chatSessionId = chatSessionId;
  }

  static async create(
    data: Omit<LogEntry, 'id' | 'dbWorker' | 'label'>,
    dbWorker: Worker
  ): Promise<string> {
    assertDbWorker(dbWorker, LogEntry.create.name, LogEntry.name);
    const id = crypto.randomUUID();
    const record = { id, ...data };
    const requestId = crypto.randomUUID();
    return new Promise<string>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          dbWorker.removeEventListener(MESSAGE_EVENT, handleMessage);
          if (event.data.success && typeof event.data.result === 'string') {
            resolve(event.data.result);
          } else {
            reject(new Error(event.data.error || 'Failed to create log entry'));
          }
        }
      };
      dbWorker.addEventListener(MESSAGE_EVENT, handleMessage);
      dbWorker.postMessage({ action: DBActions.PUT, payload: [DBNames.DB_LOGS, DBNames.DB_LOGS, record], requestId });
      setTimeout(() => {
        dbWorker.removeEventListener(MESSAGE_EVENT, handleMessage);
        reject(new Error('Timeout waiting for create log entry confirmation'));
      }, 5000);
    });
  }

  /**
   * Fetch a single log entry by its unique ID.
   * For fetching all or filtered logs, use getAll or the filtering methods.
   */
  static async read(id: string, dbWorker: Worker): Promise<LogEntry | undefined> {
    assertDbWorker(dbWorker, LogEntry.read.name, LogEntry.name);
    const requestId = crypto.randomUUID();
    return new Promise<LogEntry | undefined>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          dbWorker.removeEventListener(MESSAGE_EVENT, handleMessage);
          if (event.data.success && event.data.result) {
            const l = event.data.result;
            resolve(new LogEntry(l.id, l.timestamp, l.level, l.message, l.component, l.extensionSessionId, dbWorker, l.chatSessionId));
          } else if (event.data.success && !event.data.result) {
            resolve(undefined);
          } else {
            reject(new Error(event.data.error || `Failed to get log entry (id: ${id})`));
          }
        }
      };
      dbWorker.addEventListener(MESSAGE_EVENT, handleMessage);
      dbWorker.postMessage({ action: DBActions.GET, payload: [DBNames.DB_LOGS, DBNames.DB_LOGS, id], requestId });
      setTimeout(() => {
        dbWorker.removeEventListener(MESSAGE_EVENT, handleMessage);
        reject(new Error(`Timeout waiting for get log entry (id: ${id}) confirmation`));
      }, 5000);
    });
  }

  async update(updates: Partial<Omit<LogEntry, 'id' | 'dbWorker' | 'label'>>): Promise<void> {
    Object.assign(this, updates);
    await this.saveToDB();
  }

  async delete(): Promise<void> {
    assertDbWorker(this, 'delete', this.constructor.name);
    const requestId = crypto.randomUUID();
    return new Promise<void>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage);
          if (event.data.success) {
            resolve();
          } else {
            reject(new Error(event.data.error || `Failed to delete log entry (id: ${this.id})`));
          }
        }
      };
      this.dbWorker!.addEventListener(MESSAGE_EVENT, handleMessage);
      this.dbWorker!.postMessage({ action: DBActions.DELETE, payload: [DBNames.DB_LOGS, DBNames.DB_LOGS, this.id], requestId });
      setTimeout(() => {
        this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage);
        reject(new Error(`Timeout waiting for delete log entry (id: ${this.id}) confirmation`));
      }, 5000);
    });
  }

  async saveToDB(): Promise<string> {
    assertDbWorker(this, 'saveToDB', this.constructor.name);
    const requestId = crypto.randomUUID();
    const record = {
      id: this.id,
      timestamp: this.timestamp,
      level: this.level,
      message: this.message,
      component: this.component,
      extensionSessionId: this.extensionSessionId,
      chatSessionId: this.chatSessionId
    };
    return new Promise<string>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage);
          if (event.data.success && typeof event.data.result === 'string') {
            resolve(event.data.result);
          } else {
            reject(new Error(event.data.error || 'Failed to save log entry'));
          }
        }
      };
      this.dbWorker!.addEventListener(MESSAGE_EVENT, handleMessage);
      this.dbWorker!.postMessage({ action: DBActions.PUT, payload: [DBNames.DB_LOGS, DBNames.DB_LOGS, record], requestId });
      setTimeout(() => {
        this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage);
        reject(new Error('Timeout waiting for save log entry confirmation'));
      }, 5000);
    });
  }

  static async getAll(
    dbWorker: Worker,
    filters?: { levels?: LogLevel[]; component?: string }
  ): Promise<LogEntry[]> {
    assertDbWorker(dbWorker, LogEntry.getAll.name, LogEntry.name);
    const requestId = crypto.randomUUID();
    // Build where clause for queryObj
    let where: any = {};
    if (filters?.levels) {
      if (filters.levels.length === 1) {
        where.level = filters.levels[0];
      } else if (filters.levels.length > 1) {
        where.level = { op: 'in', value: filters.levels };
      }
    }
    if (filters?.component) {
      where.component = filters.component;
    }
    // If no filters, don't include where
    const queryObj: any = {
      from: DBNames.DB_LOGS,
      orderBy: [{ field: 'timestamp', direction: 'desc' }]
    };
    if (Object.keys(where).length > 0) {
      queryObj.where = where;
    }
    return new Promise<LogEntry[]>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          dbWorker.removeEventListener(MESSAGE_EVENT, handleMessage);
          if (event.data.success && Array.isArray(event.data.result)) {
            resolve(event.data.result.map((l: any) => new LogEntry(l.id, l.timestamp, l.level, l.message, l.component, l.extensionSessionId, dbWorker, l.chatSessionId)));
          } else if (event.data.success && !event.data.result) {
            resolve([]);
          } else {
            reject(new Error(event.data.error || 'Failed to get logs'));
          }
        }
      };
      dbWorker.addEventListener(MESSAGE_EVENT, handleMessage);
      dbWorker.postMessage({
        action: DBActions.QUERY,
        payload: [DBNames.DB_LOGS, queryObj],
        requestId
      });
      setTimeout(() => {
        dbWorker.removeEventListener(MESSAGE_EVENT, handleMessage);
        reject(new Error('Timeout waiting for log query confirmation'));
      }, 5000);
    });
  }

  static async getByLevel(level: LogLevel, dbWorker: Worker): Promise<LogEntry[]> {
    assertDbWorker(dbWorker, LogEntry.getByLevel.name, LogEntry.name);
    return LogEntry.getAll(dbWorker, { levels: [level] });
  }

  static async getByLevels(levels: LogLevel[], dbWorker: Worker): Promise<LogEntry[]> {
    assertDbWorker(dbWorker, LogEntry.getByLevels.name, LogEntry.name);
    return LogEntry.getAll(dbWorker, { levels });
  }

  static async getByComponent(component: string, dbWorker: Worker): Promise<LogEntry[]> {
    assertDbWorker(dbWorker, LogEntry.getByComponent.name, LogEntry.name);
    return LogEntry.getAll(dbWorker, { component });
  }

  static async getByComponentAndLevels(component: string, levels: LogLevel[], dbWorker: Worker): Promise<LogEntry[]> {
    assertDbWorker(dbWorker, LogEntry.getByComponentAndLevels.name, LogEntry.name);
    return LogEntry.getAll(dbWorker, { component, levels });
  }

  toJSON() {
    return {
      __type: DB_ENTITY_TYPES.LogEntry,
      id: this.id,
      timestamp: this.timestamp,
      level: this.level,
      message: this.message,
      component: this.component,
      extensionSessionId: this.extensionSessionId,
      chatSessionId: this.chatSessionId
    };
  }

  static fromJSON(obj: any, dbWorker: Worker): LogEntry {
    if (!obj) throw new Error('Cannot hydrate LogEntry from null/undefined');
    return new LogEntry(
      obj.id,
      obj.timestamp,
      obj.level,
      obj.message,
      obj.component,
      obj.extensionSessionId,
      dbWorker,
      obj.chatSessionId
    );
  }
}
