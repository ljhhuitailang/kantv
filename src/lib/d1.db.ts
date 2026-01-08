/* eslint-disable @typescript-eslint/no-explicit-any, no-console */

import { AdminConfig } from './admin.types';
import { Favorite, IStorage, PlayRecord, SkipConfig } from './types';

// 搜索历史最大条数
const SEARCH_HISTORY_LIMIT = 20;

/**
 * Cloudflare D1 数据库适配器
 *
 * 使用方法：
 * 1. 在 Cloudflare Pages 中绑定 D1 数据库，命名为 DB
 * 2. 设置环境变量 NEXT_PUBLIC_STORAGE_TYPE=d1
 * 3. 数据库会自动初始化表结构
 */
export class D1Storage implements IStorage {
  private db: any;
  private initialized = false;

  constructor(db?: any) {
    // 在 Cloudflare Workers/Pages 环境中，db 会通过环境绑定传入
    // 在开发环境中可能为 undefined
    this.db = db;

    if (!this.db) {
      console.warn('D1 database not available. Using fallback mode.');
    }
  }

  /**
   * 初始化数据库表结构
   */
  private async initDB(): Promise<void> {
    if (this.initialized || !this.db) return;

    try {
      // 创建用户表
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          username TEXT PRIMARY KEY,
          password TEXT NOT NULL,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);

      // 创建播放记录表
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS play_records (
          username TEXT NOT NULL,
          key TEXT NOT NULL,
          data TEXT NOT NULL,
          updated_at INTEGER DEFAULT (strftime('%s', 'now')),
          PRIMARY KEY (username, key)
        )
      `);

      // 创建收藏表
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS favorites (
          username TEXT NOT NULL,
          key TEXT NOT NULL,
          data TEXT NOT NULL,
          updated_at INTEGER DEFAULT (strftime('%s', 'now')),
          PRIMARY KEY (username, key)
        )
      `);

      // 创建搜索历史表
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS search_history (
          username TEXT NOT NULL,
          keyword TEXT NOT NULL,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          PRIMARY KEY (username, keyword)
        )
      `);

      // 创建跳过配置表
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS skip_configs (
          username TEXT NOT NULL,
          source TEXT NOT NULL,
          id TEXT NOT NULL,
          data TEXT NOT NULL,
          updated_at INTEGER DEFAULT (strftime('%s', 'now')),
          PRIMARY KEY (username, source, id)
        )
      `);

      // 创建管理员配置表
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS admin_config (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          data TEXT NOT NULL,
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);

      // 创建索引
      await this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_play_records_username ON play_records(username);
        CREATE INDEX IF NOT EXISTS idx_favorites_username ON favorites(username);
        CREATE INDEX IF NOT EXISTS idx_search_history_username ON search_history(username, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_skip_configs_username ON skip_configs(username);
      `);

      this.initialized = true;
      console.log('D1 database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize D1 database:', error);
      throw error;
    }
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDB(): Promise<void> {
    if (!this.db) {
      throw new Error('D1 database not available');
    }
    if (!this.initialized) {
      await this.initDB();
    }
  }

  // ---------- 播放记录 ----------
  async getPlayRecord(userName: string, key: string): Promise<PlayRecord | null> {
    await this.ensureDB();
    try {
      const result = await this.db
        .prepare('SELECT data FROM play_records WHERE username = ? AND key = ?')
        .bind(userName, key)
        .first();

      return result ? JSON.parse(result.data) : null;
    } catch (error) {
      console.error('Failed to get play record:', error);
      return null;
    }
  }

  async setPlayRecord(userName: string, key: string, record: PlayRecord): Promise<void> {
    await this.ensureDB();
    try {
      await this.db
        .prepare(`
          INSERT INTO play_records (username, key, data, updated_at)
          VALUES (?, ?, ?, strftime('%s', 'now'))
          ON CONFLICT(username, key) DO UPDATE SET
            data = excluded.data,
            updated_at = excluded.updated_at
        `)
        .bind(userName, key, JSON.stringify(record))
        .run();
    } catch (error) {
      console.error('Failed to set play record:', error);
      throw error;
    }
  }

  async getAllPlayRecords(userName: string): Promise<{ [key: string]: PlayRecord }> {
    await this.ensureDB();
    try {
      const results = await this.db
        .prepare('SELECT key, data FROM play_records WHERE username = ?')
        .bind(userName)
        .all();

      const records: { [key: string]: PlayRecord } = {};
      for (const row of results.results || []) {
        records[row.key] = JSON.parse(row.data);
      }
      return records;
    } catch (error) {
      console.error('Failed to get all play records:', error);
      return {};
    }
  }

  async deletePlayRecord(userName: string, key: string): Promise<void> {
    await this.ensureDB();
    try {
      await this.db
        .prepare('DELETE FROM play_records WHERE username = ? AND key = ?')
        .bind(userName, key)
        .run();
    } catch (error) {
      console.error('Failed to delete play record:', error);
      throw error;
    }
  }

  // ---------- 收藏 ----------
  async getFavorite(userName: string, key: string): Promise<Favorite | null> {
    await this.ensureDB();
    try {
      const result = await this.db
        .prepare('SELECT data FROM favorites WHERE username = ? AND key = ?')
        .bind(userName, key)
        .first();

      return result ? JSON.parse(result.data) : null;
    } catch (error) {
      console.error('Failed to get favorite:', error);
      return null;
    }
  }

  async setFavorite(userName: string, key: string, favorite: Favorite): Promise<void> {
    await this.ensureDB();
    try {
      await this.db
        .prepare(`
          INSERT INTO favorites (username, key, data, updated_at)
          VALUES (?, ?, ?, strftime('%s', 'now'))
          ON CONFLICT(username, key) DO UPDATE SET
            data = excluded.data,
            updated_at = excluded.updated_at
        `)
        .bind(userName, key, JSON.stringify(favorite))
        .run();
    } catch (error) {
      console.error('Failed to set favorite:', error);
      throw error;
    }
  }

  async getAllFavorites(userName: string): Promise<{ [key: string]: Favorite }> {
    await this.ensureDB();
    try {
      const results = await this.db
        .prepare('SELECT key, data FROM favorites WHERE username = ?')
        .bind(userName)
        .all();

      const favorites: { [key: string]: Favorite } = {};
      for (const row of results.results || []) {
        favorites[row.key] = JSON.parse(row.data);
      }
      return favorites;
    } catch (error) {
      console.error('Failed to get all favorites:', error);
      return {};
    }
  }

  async deleteFavorite(userName: string, key: string): Promise<void> {
    await this.ensureDB();
    try {
      await this.db
        .prepare('DELETE FROM favorites WHERE username = ? AND key = ?')
        .bind(userName, key)
        .run();
    } catch (error) {
      console.error('Failed to delete favorite:', error);
      throw error;
    }
  }

  // ---------- 用户相关 ----------
  async registerUser(userName: string, password: string): Promise<void> {
    await this.ensureDB();
    try {
      await this.db
        .prepare('INSERT INTO users (username, password) VALUES (?, ?)')
        .bind(userName, password)
        .run();
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint')) {
        throw new Error('用户已存在');
      }
      console.error('Failed to register user:', error);
      throw error;
    }
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    await this.ensureDB();
    try {
      const result = await this.db
        .prepare('SELECT password FROM users WHERE username = ?')
        .bind(userName)
        .first();

      return result ? result.password === password : false;
    } catch (error) {
      console.error('Failed to verify user:', error);
      return false;
    }
  }

  async checkUserExist(userName: string): Promise<boolean> {
    await this.ensureDB();
    try {
      const result = await this.db
        .prepare('SELECT 1 FROM users WHERE username = ?')
        .bind(userName)
        .first();

      return !!result;
    } catch (error) {
      console.error('Failed to check user exist:', error);
      return false;
    }
  }

  async changePassword(userName: string, newPassword: string): Promise<void> {
    await this.ensureDB();
    try {
      await this.db
        .prepare('UPDATE users SET password = ? WHERE username = ?')
        .bind(newPassword, userName)
        .run();
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }

  async deleteUser(userName: string): Promise<void> {
    await this.ensureDB();
    try {
      // 使用事务删除用户及其所有数据
      await this.db.batch([
        this.db.prepare('DELETE FROM users WHERE username = ?').bind(userName),
        this.db.prepare('DELETE FROM play_records WHERE username = ?').bind(userName),
        this.db.prepare('DELETE FROM favorites WHERE username = ?').bind(userName),
        this.db.prepare('DELETE FROM search_history WHERE username = ?').bind(userName),
        this.db.prepare('DELETE FROM skip_configs WHERE username = ?').bind(userName),
      ]);
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  // ---------- 搜索历史 ----------
  async getSearchHistory(userName: string): Promise<string[]> {
    await this.ensureDB();
    try {
      const results = await this.db
        .prepare(`
          SELECT keyword FROM search_history
          WHERE username = ?
          ORDER BY created_at DESC
          LIMIT ?
        `)
        .bind(userName, SEARCH_HISTORY_LIMIT)
        .all();

      return (results.results || []).map((row: any) => row.keyword);
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    await this.ensureDB();
    try {
      // 先删除已存在的记录，再插入新记录
      await this.db.batch([
        this.db
          .prepare('DELETE FROM search_history WHERE username = ? AND keyword = ?')
          .bind(userName, keyword),
        this.db
          .prepare('INSERT INTO search_history (username, keyword) VALUES (?, ?)')
          .bind(userName, keyword),
      ]);

      // 限制历史记录数量
      await this.db
        .prepare(`
          DELETE FROM search_history
          WHERE username = ?
          AND keyword NOT IN (
            SELECT keyword FROM search_history
            WHERE username = ?
            ORDER BY created_at DESC
            LIMIT ?
          )
        `)
        .bind(userName, userName, SEARCH_HISTORY_LIMIT)
        .run();
    } catch (error) {
      console.error('Failed to add search history:', error);
      throw error;
    }
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    await this.ensureDB();
    try {
      if (keyword) {
        await this.db
          .prepare('DELETE FROM search_history WHERE username = ? AND keyword = ?')
          .bind(userName, keyword)
          .run();
      } else {
        await this.db
          .prepare('DELETE FROM search_history WHERE username = ?')
          .bind(userName)
          .run();
      }
    } catch (error) {
      console.error('Failed to delete search history:', error);
      throw error;
    }
  }

  // ---------- 用户列表 ----------
  async getAllUsers(): Promise<string[]> {
    await this.ensureDB();
    try {
      const results = await this.db
        .prepare('SELECT username FROM users ORDER BY username')
        .all();

      return (results.results || []).map((row: any) => row.username);
    } catch (error) {
      console.error('Failed to get all users:', error);
      return [];
    }
  }

  // ---------- 管理员配置 ----------
  async getAdminConfig(): Promise<AdminConfig | null> {
    await this.ensureDB();
    try {
      const result = await this.db
        .prepare('SELECT data FROM admin_config WHERE id = 1')
        .first();

      return result ? JSON.parse(result.data) : null;
    } catch (error) {
      console.error('Failed to get admin config:', error);
      return null;
    }
  }

  async setAdminConfig(config: AdminConfig): Promise<void> {
    await this.ensureDB();
    try {
      await this.db
        .prepare(`
          INSERT INTO admin_config (id, data, updated_at)
          VALUES (1, ?, strftime('%s', 'now'))
          ON CONFLICT(id) DO UPDATE SET
            data = excluded.data,
            updated_at = excluded.updated_at
        `)
        .bind(JSON.stringify(config))
        .run();
    } catch (error) {
      console.error('Failed to set admin config:', error);
      throw error;
    }
  }

  // ---------- 跳过片头片尾配置 ----------
  async getSkipConfig(
    userName: string,
    source: string,
    id: string
  ): Promise<SkipConfig | null> {
    await this.ensureDB();
    try {
      const result = await this.db
        .prepare('SELECT data FROM skip_configs WHERE username = ? AND source = ? AND id = ?')
        .bind(userName, source, id)
        .first();

      return result ? JSON.parse(result.data) : null;
    } catch (error) {
      console.error('Failed to get skip config:', error);
      return null;
    }
  }

  async setSkipConfig(
    userName: string,
    source: string,
    id: string,
    config: SkipConfig
  ): Promise<void> {
    await this.ensureDB();
    try {
      await this.db
        .prepare(`
          INSERT INTO skip_configs (username, source, id, data, updated_at)
          VALUES (?, ?, ?, ?, strftime('%s', 'now'))
          ON CONFLICT(username, source, id) DO UPDATE SET
            data = excluded.data,
            updated_at = excluded.updated_at
        `)
        .bind(userName, source, id, JSON.stringify(config))
        .run();
    } catch (error) {
      console.error('Failed to set skip config:', error);
      throw error;
    }
  }

  async deleteSkipConfig(userName: string, source: string, id: string): Promise<void> {
    await this.ensureDB();
    try {
      await this.db
        .prepare('DELETE FROM skip_configs WHERE username = ? AND source = ? AND id = ?')
        .bind(userName, source, id)
        .run();
    } catch (error) {
      console.error('Failed to delete skip config:', error);
      throw error;
    }
  }

  async getAllSkipConfigs(userName: string): Promise<{ [key: string]: SkipConfig }> {
    await this.ensureDB();
    try {
      const results = await this.db
        .prepare('SELECT source, id, data FROM skip_configs WHERE username = ?')
        .bind(userName)
        .all();

      const configs: { [key: string]: SkipConfig } = {};
      for (const row of results.results || []) {
        const key = `${row.source}+${row.id}`;
        configs[key] = JSON.parse(row.data);
      }
      return configs;
    } catch (error) {
      console.error('Failed to get all skip configs:', error);
      return {};
    }
  }

  // ---------- 数据清理 ----------
  async clearAllData(): Promise<void> {
    await this.ensureDB();
    try {
      await this.db.batch([
        this.db.prepare('DELETE FROM users'),
        this.db.prepare('DELETE FROM play_records'),
        this.db.prepare('DELETE FROM favorites'),
        this.db.prepare('DELETE FROM search_history'),
        this.db.prepare('DELETE FROM skip_configs'),
        this.db.prepare('DELETE FROM admin_config'),
      ]);
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }
}
