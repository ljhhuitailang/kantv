-- KanTV D1 数据库初始化脚本
-- 注意：应用会在首次运行时自动创建这些表，此脚本仅用于手动初始化（可选）

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 播放记录表
CREATE TABLE IF NOT EXISTS play_records (
  username TEXT NOT NULL,
  key TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  PRIMARY KEY (username, key)
);

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
  username TEXT NOT NULL,
  key TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  PRIMARY KEY (username, key)
);

-- 搜索历史表
CREATE TABLE IF NOT EXISTS search_history (
  username TEXT NOT NULL,
  keyword TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  PRIMARY KEY (username, keyword)
);

-- 跳过配置表
CREATE TABLE IF NOT EXISTS skip_configs (
  username TEXT NOT NULL,
  source TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  PRIMARY KEY (username, source, id)
);

-- 管理员配置表
CREATE TABLE IF NOT EXISTS admin_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_play_records_username ON play_records(username);
CREATE INDEX IF NOT EXISTS idx_favorites_username ON favorites(username);
CREATE INDEX IF NOT EXISTS idx_search_history_username ON search_history(username, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skip_configs_username ON skip_configs(username);
