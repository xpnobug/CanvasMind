const SKIP_REASON_TEXT = {
  database_not_configured: '未配置 DATABASE_URL，跳过密钥同步',
  secret_tables_not_ready: '密钥表尚未就绪，跳过密钥同步',
}

const MIGRATE_SKIP_REASON_TEXT = {
  legacy_api_key_column_removed: '旧密钥列已删除，无法从 ai_providers 自动迁移（请在后台手动添加密钥）',
}

export const formatLegacySecretsSyncSummary = (result) => {
  if (!result || result.skipped) {
    const reason = result?.reason || 'unknown'
    return [
      SKIP_REASON_TEXT[reason] || `跳过密钥同步：${reason}`,
    ]
  }

  const lines = []
  const { templates, migrateKeys, backfillBaseUrl } = result

  if (templates) {
    if (templates.created > 0) {
      lines.push(`密钥模板：新增 ${templates.created} 个，当前共 ${templates.total} 个`)
    } else if (templates.updated > 0) {
      lines.push(`密钥模板：更新 ${templates.updated} 个字段配置，当前共 ${templates.total} 个`)
    } else {
      lines.push(`密钥模板：已是最新，共 ${templates.total} 个`)
    }
  }

  if (migrateKeys?.skipped) {
    const text = MIGRATE_SKIP_REASON_TEXT[migrateKeys.reason] || `厂商旧密钥：跳过（${migrateKeys.reason || '未知原因'}）`
    lines.push(text)
  } else if (migrateKeys) {
    const { migrated = 0, skippedProviders = 0, totalCandidates = 0, droppedLegacyColumns = [] } = migrateKeys

    if (migrated > 0) {
      lines.push(`厂商旧密钥：成功迁移 ${migrated} 条到密钥实例（待处理 ${totalCandidates} 条）`)
    } else if (totalCandidates > 0) {
      lines.push(`厂商旧密钥：待迁移 ${totalCandidates} 条，成功 0 条（请检查 PROVIDER_CONFIG_SECRET 是否正确）`)
    } else {
      lines.push('厂商旧密钥：无待迁移数据（厂商未配置旧密钥或已绑定新密钥）')
    }

    if (skippedProviders > 0) {
      lines.push(`厂商旧密钥：${skippedProviders} 条解密失败或为空，已跳过`)
    }

    if (droppedLegacyColumns.length > 0) {
      lines.push(`厂商旧密钥：已删除旧列 ${droppedLegacyColumns.join('、')}`)
    }
  }

  if (backfillBaseUrl) {
    const { updated = 0, skippedExistingBaseUrl = 0, failed = 0 } = backfillBaseUrl
    if (updated > 0) {
      lines.push(`baseUrl 回填：已更新 ${updated} 条密钥`)
    } else if (failed > 0) {
      lines.push(`baseUrl 回填：失败 ${failed} 条，请查看上方错误日志`)
    } else if (skippedExistingBaseUrl > 0) {
      lines.push(`baseUrl 回填：无需更新（${skippedExistingBaseUrl} 条已有 baseUrl）`)
    } else {
      lines.push('baseUrl 回填：无需更新')
    }
  }

  return lines.length ? lines : ['密钥同步：已完成，无变更']
}

export const printLegacySecretsSyncSummary = (result, options = {}) => {
  const prefix = options.prefix || '[start-production]'
  const lines = formatLegacySecretsSyncSummary(result)

  console.info(`${prefix} 密钥同步结果：`)
  for (const line of lines) {
    console.info(`${prefix}   · ${line}`)
  }
}
