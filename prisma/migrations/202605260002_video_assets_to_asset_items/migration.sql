-- 复用 asset_items。
--
-- 2. 扩展 asset_items.asset_type 枚举
ALTER TABLE `asset_items`
  MODIFY COLUMN `asset_type` ENUM('IMAGE', 'VIDEO', 'AUDIO') NOT NULL COMMENT '资源类型';

-- 3. 扩展 asset_items.source 枚举
ALTER TABLE `asset_items`
  MODIFY COLUMN `source` ENUM('GENERATED', 'UPLOADED', 'IMPORTED', 'EDITOR_UPLOAD') NOT NULL DEFAULT 'GENERATED' COMMENT '资源来源';

-- 4. 新增 mime_type 列
ALTER TABLE `asset_items`
  ADD COLUMN `mime_type` VARCHAR(128) NULL COMMENT '资源 MIME 类型' AFTER `file_size_bytes`;
