-- CreateTable
CREATE TABLE `video_projects` (
    `id` VARCHAR(36) NOT NULL COMMENT '视频项目主键 ID',
    `user_id` VARCHAR(36) NOT NULL COMMENT '所属用户 ID',
    `name` VARCHAR(255) NOT NULL COMMENT '项目名称',
    `thumbnail` LONGTEXT NULL COMMENT '项目封面缩略图(dataURL 或 CDN URL)',
    `version` INTEGER NOT NULL DEFAULT 3 COMMENT 'cutia storage migration 版本号',
    `metadata_json` JSON NOT NULL COMMENT '项目元数据(SerializedProjectMetadata)',
    `settings_json` JSON NOT NULL COMMENT '项目设置(SerializedProjectSettings)',
    `scenes_json` JSON NOT NULL COMMENT '项目场景列表(SerializedScene[])',
    `timeline_view_state_json` JSON NULL COMMENT '时间轴视图状态',
    `agent_messages_json` JSON NULL COMMENT 'AI Agent 消息历史',
    `current_scene_id` VARCHAR(64) NULL COMMENT '当前激活场景 ID',
    `duration_seconds` INTEGER NULL COMMENT '项目总时长(秒)',
    `is_deleted` BOOLEAN NOT NULL DEFAULT false COMMENT '是否已软删除',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `updated_at` DATETIME(3) NOT NULL COMMENT '更新时间',

    INDEX `idx_video_projects_user_updated_at`(`user_id`, `is_deleted`, `updated_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='视频编辑器项目工程表';

-- AddForeignKey
ALTER TABLE `video_projects` ADD CONSTRAINT `video_projects_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `app_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;