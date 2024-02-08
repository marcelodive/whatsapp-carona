import fs from 'fs';
import path from 'path';
import { LowSync } from 'lowdb';
import { JSONFileSyncPreset } from 'lowdb/node';

export type BaseType = {
  id: string,
}

export abstract class BaseRepository<T extends BaseType> {
  private db: LowSync<{[key: string] : T}>;

  constructor (entity: string) {
    this.db = JSONFileSyncPreset<{[key: string] : T}>(`./dbs/${entity}.json`, {});
  }

  findAll() {
    return this.db.data;
  }

  findById(id: string) {
    return this.db.data[id];
  }

  update(key: string, entity: T) {
    return this.db.update((data) => data[key] = entity);
  }
}
