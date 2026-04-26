-- 首页瀑布流与资产页统一资源层
-- 资源层用于承接“可展示资源”，避免页面直接耦合 generation_outputs

CREATE TABLE `asset_items` (
  `id` VARCHAR(36) NOT NULL COMMENT '资源主键 ID',
  `user_id` VARCHAR(36) NULL COMMENT '资源归属用户 ID',
  `generation_record_id` VARCHAR(36) NULL COMMENT '来源生成记录 ID',
  `generation_output_id` VARCHAR(36) NULL COMMENT '来源输出结果 ID',
  `asset_type` ENUM('IMAGE', 'VIDEO') NOT NULL COMMENT '资源类型',
  `title` VARCHAR(255) NULL COMMENT '资源标题',
  `description` LONGTEXT NULL COMMENT '资源描述',
  `cover_url` LONGTEXT NULL COMMENT '资源封面地址',
  `file_url` LONGTEXT NOT NULL COMMENT '资源文件地址',
  `thumbnail_url` LONGTEXT NULL COMMENT '资源缩略图地址',
  `width` INT NULL COMMENT '资源宽度',
  `height` INT NULL COMMENT '资源高度',
  `duration_seconds` INT NULL COMMENT '资源时长（秒）',
  `file_size_bytes` BIGINT NULL COMMENT '文件大小（字节）',
  `prompt_text` LONGTEXT NULL COMMENT '资源对应提示词',
  `model_label` VARCHAR(100) NULL COMMENT '模型显示名称',
  `aspect_ratio` VARCHAR(32) NULL COMMENT '画幅比例',
  `visibility` ENUM('PRIVATE', 'PUBLIC', 'UNLISTED') NOT NULL DEFAULT 'PRIVATE' COMMENT '可见性：私有、公开、不公开链接',
  `publish_status` ENUM('DRAFT', 'PUBLISHED', 'HIDDEN') NOT NULL DEFAULT 'DRAFT' COMMENT '发布状态',
  `review_status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'APPROVED' COMMENT '审核状态',
  `favorite_count` INT NOT NULL DEFAULT 0 COMMENT '收藏次数',
  `view_count` INT NOT NULL DEFAULT 0 COMMENT '浏览次数',
  `download_count` INT NOT NULL DEFAULT 0 COMMENT '下载次数',
  `source` ENUM('GENERATED', 'UPLOADED', 'IMPORTED') NOT NULL DEFAULT 'GENERATED' COMMENT '资源来源',
  `source_meta_json` JSON NULL COMMENT '来源扩展信息 JSON',
  `is_deleted` BOOLEAN NOT NULL DEFAULT false COMMENT '是否已删除',
  `published_at` DATETIME(3) NULL COMMENT '发布时间',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  INDEX `idx_asset_items_user_type_created_at`(`user_id`, `asset_type`, `created_at`),
  INDEX `idx_asset_items_public_feed`(`asset_type`, `visibility`, `publish_status`, `review_status`, `created_at`),
  INDEX `idx_asset_items_generation_record_id`(`generation_record_id`),
  INDEX `idx_asset_items_generation_output_id`(`generation_output_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_asset_items_user_id` FOREIGN KEY (`user_id`) REFERENCES `app_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_asset_items_generation_record_id` FOREIGN KEY (`generation_record_id`) REFERENCES `generation_records`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_asset_items_generation_output_id` FOREIGN KEY (`generation_output_id`) REFERENCES `generation_outputs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='统一资源表';

CREATE TABLE `asset_favorites` (
  `id` VARCHAR(36) NOT NULL COMMENT '收藏关系主键 ID',
  `asset_id` VARCHAR(36) NOT NULL COMMENT '资源 ID',
  `user_id` VARCHAR(36) NULL COMMENT '收藏用户 ID',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  UNIQUE INDEX `uk_asset_favorites_asset_user`(`asset_id`, `user_id`),
  INDEX `idx_asset_favorites_user_created_at`(`user_id`, `created_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_asset_favorites_asset_id` FOREIGN KEY (`asset_id`) REFERENCES `asset_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_asset_favorites_user_id` FOREIGN KEY (`user_id`) REFERENCES `app_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='资源收藏关系表';
