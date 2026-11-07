-- 给 generation_sessions 表加 source 字段，用于物理隔离不同入口（/generate、画布助手等）的会话列表。
-- 主要变更:
--   1. 新增 source VARCHAR(64) NOT NULL DEFAULT 'generate' 列
--   2. 新增联合索引 (user_id, source, last_record_at)，加速按入口分组的会话列表查询

-- 1. 新增列（已有记录全部默认归为 'generate' 入口，对存量行为零影响）
ALTER TABLE `generation_sessions`
  ADD COLUMN `source` VARCHAR(64) NOT NULL DEFAULT 'generate' COMMENT '会话来源（generate / canvas-assistant 等）' AFTER `user_id`;

-- 2. 新增按 source 分组的复合索引
CREATE INDEX `idx_generation_sessions_user_source_last_record_at`
  ON `generation_sessions` (`user_id`, `source`, `last_record_at`);
