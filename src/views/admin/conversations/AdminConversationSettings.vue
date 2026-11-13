<template>
  <AdminPageContainer
    class="admin-list-page"
    compact title="会话配置" description="统一维护会话规则、后台列表展示与创作入口展示，优先沉淀可运营、可复用的通用会话配置。">
    <template #actions>
      <button class="admin-button admin-button--secondary" type="button" :disabled="loading || saving" @click="handleReset">
        恢复默认
      </button>
      <button class="admin-button admin-button--primary" type="button" :disabled="loading || saving" @click="handleSave">
        {{ saving ? '保存中...' : '保存配置' }}
      </button>
    </template>

    <div class="admin-grid admin-grid--stats">
      <AdminStatCard label="默认分页" :value="form.listDisplay.defaultPageSize" hint="后台会话列表首次进入时的默认分页条数" />
      <AdminStatCard label="入口标题" :value="form.entryDisplay.hero.title || '未设置'" hint="创作页欢迎标题，影响首页输入区首屏感知" />
      <AdminStatCard label="模式数量" :value="form.entryDisplay.mode.options.length" hint="会话入口允许展示的模式选项数量" />
      <AdminStatCard
        :label="currentTab === 'progress' ? '文案阶段' : '策略开关'"
        :value="currentTab === 'progress' ? progressForm.stages.length : enabledPolicyCount"
        :hint="currentTab === 'progress' ? '当前已配置的生成进度阶段数量' : '当前已启用的管理策略数量'"
      />
    </div>

    <div class="admin-conversation-settings-shell">
      <aside class="admin-conversation-settings-nav">
        <AdminSectionCard
          title="配置分组"
          description="按规则、展示和治理三类视角维护会话体系。"
          compact
        >
        <div class="admin-conversation-settings-nav__content">
          <button
            v-for="item in tabItems"
            :key="item.key"
            class="admin-conversation-settings-tabs__item"
            :class="{ 'is-active': currentTab === item.key }"
            type="button"
            @click="currentTab = item.key"
          >
            <span class="admin-conversation-settings-tabs__title">{{ item.label }}</span>
            <span class="admin-conversation-settings-tabs__desc">{{ item.description }}</span>
          </button>
        </div>
        </AdminSectionCard>
      </aside>

      <div class="admin-conversation-settings-main">
        <AdminSectionCard compact card-class="admin-conversation-settings-section-head">
            <div class="admin-conversation-settings-section-head__inner">
              <div>
                <div class="admin-conversation-settings-section-head__eyebrow">当前分组</div>
                <h3 class="admin-conversation-settings-section-head__title">{{ activeTabMeta.label }}</h3>
                <p class="admin-conversation-settings-section-head__desc">{{ activeTabMeta.description }}</p>
              </div>
              <div class="admin-conversation-settings-section-head__tips">
                <span class="admin-conversation-settings-section-head__tip">保存后立即影响后台展示与前台入口默认行为</span>
              </div>
            </div>
        </AdminSectionCard>

        <AdminSectionCard
          v-if="currentTab === 'basic'"
          title="基础规则"
          description="控制会话默认命名、默认排序，以及后台允许执行的基础管理动作。"
          compact
        >
            <div class="admin-conversation-setting-grid">
              <section class="admin-conversation-setting-section">
                <div class="admin-conversation-setting-section__head">
                  <div>
                    <h5 class="admin-conversation-setting-section__title">命名与排序</h5>
                    <p class="admin-conversation-setting-section__desc">统一新会话命名规则，保证创作区和后台列表口径一致。</p>
                  </div>
                </div>
                <div class="admin-form__grid">
                  <div class="admin-form__field">
                    <label class="admin-form__label">默认会话标题</label>
                    <input v-model.trim="form.basicRules.defaultSessionTitle" class="admin-input" type="text" placeholder="新对话">
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">新建会话前缀</label>
                    <input v-model.trim="form.basicRules.newSessionTitlePrefix" class="admin-input" type="text" placeholder="新对话">
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">标题最大长度</label>
                    <input v-model.number="form.basicRules.sessionTitleMaxLength" class="admin-input" type="number" min="1" max="200">
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">默认排序方式</label>
                    <select v-model="form.basicRules.defaultSortMode" class="admin-select">
                      <option value="lastRecordAt_desc">最近活跃优先</option>
                      <option value="updatedAt_desc">更新时间优先</option>
                      <option value="createdAt_desc">创建时间优先</option>
                    </select>
                  </div>
                </div>
              </section>

              <section class="admin-conversation-setting-section">
                <div class="admin-conversation-setting-section__head">
                  <div>
                    <h5 class="admin-conversation-setting-section__title">后台操作权限</h5>
                    <p class="admin-conversation-setting-section__desc">控制运营和管理员可直接执行的会话操作，减少误删和越权操作。</p>
                  </div>
                </div>
                <div class="admin-conversation-switch-grid">
                  <label class="admin-conversation-switch-card">
                    <div class="admin-conversation-switch-card__main">
                      <span class="admin-conversation-switch-card__title">允许后台重命名</span>
                      <span class="admin-conversation-switch-card__desc">支持运营在列表中直接修正会话标题。</span>
                    </div>
                    <input v-model="form.basicRules.allowAdminRename" type="checkbox">
                  </label>
                  <label class="admin-conversation-switch-card">
                    <div class="admin-conversation-switch-card__main">
                      <span class="admin-conversation-switch-card__title">允许后台删除</span>
                      <span class="admin-conversation-switch-card__desc">允许管理员手动删除异常或无效会话。</span>
                    </div>
                    <input v-model="form.basicRules.allowAdminDelete" type="checkbox">
                  </label>
                  <label class="admin-conversation-switch-card">
                    <div class="admin-conversation-switch-card__main">
                      <span class="admin-conversation-switch-card__title">允许删除默认会话</span>
                      <span class="admin-conversation-switch-card__desc">默认会话也可在后台被清理，适合强治理场景。</span>
                    </div>
                    <input v-model="form.basicRules.allowDeleteDefaultSession" type="checkbox">
                  </label>
                </div>
              </section>
            </div>
        </AdminSectionCard>

        <AdminSectionCard
          v-else-if="currentTab === 'list'"
          title="列表展示"
          description="控制后台会话列表首次加载的分页大小，以及卡片上默认显示的信息维度。"
          compact
        >
            <div class="admin-conversation-setting-grid">
              <section class="admin-conversation-setting-section admin-conversation-setting-section--compact">
                <div class="admin-conversation-setting-section__head">
                  <div>
                    <h5 class="admin-conversation-setting-section__title">分页设置</h5>
                    <p class="admin-conversation-setting-section__desc">控制后台列表单次加载规模，平衡信息密度与浏览效率。</p>
                  </div>
                </div>
                <div class="admin-form__grid admin-form__grid--single-field">
                  <div class="admin-form__field">
                    <label class="admin-form__label">默认每页条数</label>
                    <input v-model.number="form.listDisplay.defaultPageSize" class="admin-input" type="number" min="1" max="100">
                  </div>
                </div>
              </section>

              <section class="admin-conversation-setting-section">
                <div class="admin-conversation-setting-section__head">
                  <div>
                    <h5 class="admin-conversation-setting-section__title">信息展示字段</h5>
                    <p class="admin-conversation-setting-section__desc">按运营排查、审核和查找需求决定会话卡片默认露出的信息层级。</p>
                  </div>
                </div>
                <div class="admin-conversation-switch-grid">
                  <label class="admin-conversation-switch-card">
                    <div class="admin-conversation-switch-card__main">
                      <span class="admin-conversation-switch-card__title">显示用户信息</span>
                      <span class="admin-conversation-switch-card__desc">展示用户昵称、邮箱等识别信息。</span>
                    </div>
                    <input v-model="form.listDisplay.showUserInfo" type="checkbox">
                  </label>
                  <label class="admin-conversation-switch-card">
                    <div class="admin-conversation-switch-card__main">
                      <span class="admin-conversation-switch-card__title">显示封面图</span>
                      <span class="admin-conversation-switch-card__desc">在列表中露出最近一张结果图，便于快速识别内容。</span>
                    </div>
                    <input v-model="form.listDisplay.showCoverImage" type="checkbox">
                  </label>
                  <label class="admin-conversation-switch-card">
                    <div class="admin-conversation-switch-card__main">
                      <span class="admin-conversation-switch-card__title">显示提示词摘要</span>
                      <span class="admin-conversation-switch-card__desc">帮助运营快速理解会话主题与用户意图。</span>
                    </div>
                    <input v-model="form.listDisplay.showLatestPrompt" type="checkbox">
                  </label>
                  <label class="admin-conversation-switch-card">
                    <div class="admin-conversation-switch-card__main">
                      <span class="admin-conversation-switch-card__title">显示状态统计</span>
                      <span class="admin-conversation-switch-card__desc">展示完成、失败、进行中等聚合结果。</span>
                    </div>
                    <input v-model="form.listDisplay.showStatusStats" type="checkbox">
                  </label>
                  <label class="admin-conversation-switch-card">
                    <div class="admin-conversation-switch-card__main">
                      <span class="admin-conversation-switch-card__title">显示会话 ID</span>
                      <span class="admin-conversation-switch-card__desc">便于技术排障、日志定位和跨系统联查。</span>
                    </div>
                    <input v-model="form.listDisplay.showSessionId" type="checkbox">
                  </label>
                  <label class="admin-conversation-switch-card">
                    <div class="admin-conversation-switch-card__main">
                      <span class="admin-conversation-switch-card__title">显示最近活跃时间</span>
                      <span class="admin-conversation-switch-card__desc">帮助判断会话热度与最新操作时间。</span>
                    </div>
                    <input v-model="form.listDisplay.showLastRecordTime" type="checkbox">
                  </label>
                  <label class="admin-conversation-switch-card">
                    <div class="admin-conversation-switch-card__main">
                      <span class="admin-conversation-switch-card__title">用户信息脱敏</span>
                      <span class="admin-conversation-switch-card__desc">对邮箱、手机号等敏感信息做默认脱敏展示。</span>
                    </div>
                    <input v-model="form.listDisplay.enableUserMasking" type="checkbox">
                  </label>
                </div>
              </section>
            </div>
        </AdminSectionCard>

        <div v-else-if="currentTab === 'entry'" class="admin-conversation-entry-layout">
          <div class="admin-conversation-entry-editor">
            <AdminSectionCard compact card-class="admin-conversation-entry-tabs-card">
                <div class="admin-conversation-entry-tabs">
                  <button
                    v-for="item in entryTabItems"
                    :key="item.key"
                    class="admin-conversation-entry-tabs__item"
                    :class="{ 'is-active': currentEntryTab === item.key }"
                    type="button"
                    @click="currentEntryTab = item.key"
                  >
                    <span class="admin-conversation-entry-tabs__title">{{ item.label }}</span>
                    <span class="admin-conversation-entry-tabs__desc">{{ item.description }}</span>
                  </button>
                </div>
            </AdminSectionCard>

            <AdminSectionCard
              v-if="currentEntryTab === 'hero'"
              title="欢迎区"
              description="维护创作入口首屏标题、副标题与输入区提示文案。"
              compact
            >
                <div class="admin-form__grid">
                  <div class="admin-form__field admin-form__field--full">
                    <label class="admin-form__label">欢迎区</label>
                    <div class="admin-toggle-grid admin-toggle-grid--single">
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.hero.enabled" type="checkbox">
                        <span>显示欢迎区</span>
                      </label>
                    </div>
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">欢迎标题</label>
                    <input v-model.trim="form.entryDisplay.hero.title" class="admin-input" type="text" placeholder="你好，想创作什么？">
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">欢迎副标题</label>
                    <input v-model.trim="form.entryDisplay.hero.subtitle" class="admin-input" type="text" placeholder="可留空">
                  </div>
                  <div class="admin-form__field admin-form__field--full">
                    <label class="admin-form__label">首页创作工作台标题</label>
                    <div class="admin-toggle-grid">
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.workbench.titleEnabled" type="checkbox">
                        <span>显示首页工作台标题</span>
                      </label>
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.workbench.showSiteName" type="checkbox">
                        <span>标题中显示站点名称</span>
                      </label>
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.workbench.showModeSelectorInTitle" type="checkbox">
                        <span>标题中显示模式标签</span>
                      </label>
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.workbench.generatorEnabled" type="checkbox">
                        <span>显示创作面板</span>
                      </label>
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.workbench.taskIndicatorEnabled" type="checkbox">
                        <span>显示任务状态</span>
                      </label>
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.workbench.bannerEnabled" type="checkbox">
                        <span>显示 Banner 区域</span>
                      </label>
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.workbench.showSubmitButton" type="checkbox">
                        <span>显示提交按钮</span>
                      </label>
                    </div>
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">标题前半句</label>
                    <input v-model.trim="form.entryDisplay.workbench.prefixText" class="admin-input" type="text" placeholder="开启你的">
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">标题后半句</label>
                    <input v-model.trim="form.entryDisplay.workbench.suffixText" class="admin-input" type="text" placeholder="即刻造梦！">
                  </div>
                  <div class="admin-form__field admin-form__field--full">
                    <label class="admin-form__label">输入框占位文案</label>
                    <input v-model.trim="form.entryDisplay.input.placeholder" class="admin-input" type="text" placeholder="说说今天想做点什么">
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">输入区最大宽度</label>
                    <input v-model.number="form.entryDisplay.input.maxWidth" class="admin-input" type="number" min="320" max="1600">
                  </div>
                </div>
            </AdminSectionCard>

            <AdminSectionCard
              v-else-if="currentEntryTab === 'mode'"
              title="模式与模型"
              description="控制模式选择、模型选择器、助手选择器及默认值。"
              compact
            >
                <div class="admin-form__grid">
                  <div class="admin-form__field">
                    <label class="admin-form__label">默认模式</label>
                    <select v-model="form.entryDisplay.mode.defaultMode" class="admin-select">
                      <option
                        v-for="item in enabledModeOptions"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </option>
                    </select>
                  </div>
                  <div class="admin-form__field admin-form__field--full">
                    <label class="admin-form__label">入口开关</label>
                    <div class="admin-toggle-grid">
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.mode.enabled" type="checkbox">
                        <span>显示模式选择</span>
                      </label>
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.modelSelector.enabled" type="checkbox">
                        <span>显示模型选择器</span>
                      </label>
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.assistantSelector.enabled" type="checkbox">
                        <span>显示助手选择器</span>
                      </label>
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.modelSelector.allowSkillOverride" type="checkbox">
                        <span>允许技能覆盖默认模型</span>
                      </label>
                    </div>
                  </div>
                  <div class="admin-form__field admin-form__field--full">
                    <label class="admin-form__label">模式选项</label>
                    <div class="admin-conversation-selector-panel">
                      <div class="admin-conversation-selector-panel__head">
                        <div class="admin-conversation-selector-panel__summary">
                          已启用 {{ enabledModeOptions.length }} 个创作模式
                        </div>
                        <div class="admin-conversation-selector-panel__desc">
                          前台仅识别系统内置模式，这里只做启用、排序和名称运营化配置。
                        </div>
                      </div>
                      <div class="admin-conversation-mode-list">
                        <div
                          v-for="item in modeEditorItems"
                          :key="item.value"
                          class="admin-conversation-mode-item"
                          :class="{ 'is-active': item.enabled }"
                        >
                          <div class="admin-conversation-mode-item__main">
                            <div class="admin-conversation-mode-item__top">
                              <div>
                                <div class="admin-conversation-mode-item__title">{{ item.systemLabel }}</div>
                                <div class="admin-conversation-mode-item__meta">{{ item.value }}</div>
                              </div>
                              <label class="admin-switch-row">
                                <input
                                  :checked="item.enabled"
                                  type="checkbox"
                                  @change="toggleModeEnabled(item.value)"
                                >
                                <span>{{ item.enabled ? '已启用' : '未启用' }}</span>
                              </label>
                            </div>
                            <div class="admin-conversation-mode-item__body">
                              <input
                                :value="item.label"
                                class="admin-input"
                                type="text"
                                placeholder="模式显示名称"
                                :disabled="!item.enabled"
                                @input="updateModeLabel(item.value, ($event.target as HTMLInputElement).value)"
                              >
                              <div class="admin-conversation-mode-item__actions">
                                <button
                                  class="admin-inline-button"
                                  type="button"
                                  :disabled="!item.enabled || !canMoveModeUp(item.value)"
                                  @click="moveModeOption(item.value, 'up')"
                                >
                                  上移
                                </button>
                                <button
                                  class="admin-inline-button"
                                  type="button"
                                  :disabled="!item.enabled || !canMoveModeDown(item.value)"
                                  @click="moveModeOption(item.value, 'down')"
                                >
                                  下移
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">默认模型</label>
                    <select v-model="form.entryDisplay.modelSelector.defaultModelKey" class="admin-select">
                      <option value="">跟随系统默认</option>
                      <option v-for="item in chatModelOptions" :key="item.value" :value="item.value">
                        {{ item.label }}
                      </option>
                    </select>
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">默认助手</label>
                    <select v-model="form.entryDisplay.assistantSelector.defaultAssistantKey" class="admin-select">
                      <option value="">跟随系统默认</option>
                      <option v-for="item in assistantOptions" :key="item.value" :value="item.value">
                        {{ item.label }}
                      </option>
                    </select>
                  </div>
                  <div class="admin-form__field admin-form__field--full">
                    <label class="admin-form__label">允许模型范围</label>
                    <div class="admin-conversation-selector-panel">
                      <div class="admin-conversation-selector-panel__head">
                        <div class="admin-conversation-selector-panel__summary">
                          {{ modelAllowlistSummary }}
                        </div>
                        <button
                          class="admin-inline-button"
                          type="button"
                          @click="form.entryDisplay.modelSelector.allowedModelKeys = []"
                        >
                          清空限制
                        </button>
                      </div>
                      <div class="admin-conversation-selector-panel__desc">
                        未选择任何模型时，默认展示系统当前可用的全部对话模型。
                      </div>
                      <div class="admin-conversation-selector-grid">
                        <label
                          v-for="item in chatModelOptions"
                          :key="item.value"
                          class="admin-conversation-selector-card"
                          :class="{ 'is-active': isModelAllowed(item.value) }"
                        >
                          <div class="admin-conversation-selector-card__main">
                            <span class="admin-conversation-selector-card__title">{{ item.label }}</span>
                            <span class="admin-conversation-selector-card__meta">{{ item.value }}</span>
                          </div>
                          <input
                            :checked="isModelAllowed(item.value)"
                            type="checkbox"
                            @change="toggleModelAllowed(item.value)"
                          >
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="admin-form__field admin-form__field--full">
                    <label class="admin-form__label">允许助手范围</label>
                    <div class="admin-conversation-selector-panel">
                      <div class="admin-conversation-selector-panel__head">
                        <div class="admin-conversation-selector-panel__summary">
                          {{ assistantAllowlistSummary }}
                        </div>
                        <button
                          class="admin-inline-button"
                          type="button"
                          @click="form.entryDisplay.assistantSelector.allowedAssistantKeys = []"
                        >
                          清空限制
                        </button>
                      </div>
                      <div class="admin-conversation-selector-panel__desc">
                        未选择任何助手时，默认跟随系统已启用的全部助手能力。
                      </div>
                      <div class="admin-conversation-selector-grid">
                        <label
                          v-for="item in assistantOptions"
                          :key="item.value"
                          class="admin-conversation-selector-card"
                          :class="{ 'is-active': isAssistantAllowed(item.value) }"
                        >
                          <div class="admin-conversation-selector-card__main">
                            <span class="admin-conversation-selector-card__title">{{ item.label }}</span>
                            <span class="admin-conversation-selector-card__meta">{{ item.value }}</span>
                          </div>
                          <input
                            :checked="isAssistantAllowed(item.value)"
                            type="checkbox"
                            @change="toggleAssistantAllowed(item.value)"
                          >
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
            </AdminSectionCard>

            <AdminSectionCard
              v-else
              title="功能按钮"
              description="控制底部能力条的显示与默认状态，便于统一入口交互策略。"
              compact
            >
                <div class="admin-form__field admin-form__field--full">
                  <label class="admin-form__label">功能按钮</label>
                  <div class="admin-conversation-action-grid">
                    <div class="admin-conversation-action-grid__item">
                      <div class="admin-conversation-action-grid__title">自动</div>
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.actions.auto.visible" type="checkbox">
                        <span>显示</span>
                      </label>
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.actions.auto.defaultEnabled" type="checkbox">
                        <span>默认开启</span>
                      </label>
                    </div>
                    <div class="admin-conversation-action-grid__item">
                      <div class="admin-conversation-action-grid__title">灵感搜索</div>
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.actions.inspiration.visible" type="checkbox">
                        <span>显示</span>
                      </label>
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.actions.inspiration.defaultEnabled" type="checkbox">
                        <span>默认开启</span>
                      </label>
                    </div>
                    <div class="admin-conversation-action-grid__item">
                      <div class="admin-conversation-action-grid__title">创意设计</div>
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.actions.creativeDesign.visible" type="checkbox">
                        <span>显示</span>
                      </label>
                      <label class="admin-switch-row">
                        <input v-model="form.entryDisplay.actions.creativeDesign.defaultEnabled" type="checkbox">
                        <span>默认开启</span>
                      </label>
                    </div>
                  </div>
                </div>
            </AdminSectionCard>
          </div>

          <AdminSectionCard
            title="实时预览"
            description="预览创作页输入区的欢迎语、输入框和底部工具栏显隐效果。"
            compact
            card-class="admin-conversation-preview-card"
          >
              <div class="conversation-preview">
                <div v-if="form.entryDisplay.hero.enabled" class="conversation-preview__hero">
                  <h3>{{ form.entryDisplay.hero.title || '你好，想创作什么？' }}</h3>
                  <p v-if="form.entryDisplay.hero.subtitle">{{ form.entryDisplay.hero.subtitle }}</p>
                </div>
                <div
                  class="conversation-preview__panel"
                  :style="{ maxWidth: `${Math.max(320, Math.min(1600, Number(form.entryDisplay.input.maxWidth) || 960))}px` }"
                >
                  <div v-if="form.entryDisplay.workbench.titleEnabled" class="conversation-preview__workbench-title">
                    <template v-if="form.entryDisplay.workbench.showSiteName">Canana · </template>
                    {{ form.entryDisplay.workbench.prefixText || '开启你的' }}
                    <span v-if="form.entryDisplay.workbench.showModeSelectorInTitle" class="conversation-preview__chip">{{ previewModeLabel }}</span>
                    {{ form.entryDisplay.workbench.suffixText || '即刻造梦！' }}
                  </div>
                  <template v-if="form.entryDisplay.workbench.generatorEnabled">
                    <div class="conversation-preview__placeholder">{{ form.entryDisplay.input.placeholder || '说说今天想做点什么' }}</div>
                    <div class="conversation-preview__toolbar">
                      <span v-if="form.entryDisplay.mode.enabled" class="conversation-preview__chip">{{ previewModeLabel }}</span>
                      <span v-if="form.entryDisplay.modelSelector.enabled" class="conversation-preview__chip">{{ previewModelLabel }}</span>
                      <span v-if="form.entryDisplay.assistantSelector.enabled" class="conversation-preview__chip">{{ previewAssistantLabel }}</span>
                      <span v-if="form.entryDisplay.actions.auto.visible" class="conversation-preview__chip">自动{{ form.entryDisplay.actions.auto.defaultEnabled ? ' · 开' : '' }}</span>
                      <span v-if="form.entryDisplay.actions.inspiration.visible" class="conversation-preview__chip">灵感搜索{{ form.entryDisplay.actions.inspiration.defaultEnabled ? ' · 开' : '' }}</span>
                      <span v-if="form.entryDisplay.actions.creativeDesign.visible" class="conversation-preview__chip">创意设计{{ form.entryDisplay.actions.creativeDesign.defaultEnabled ? ' · 开' : '' }}</span>
                      <button v-if="form.entryDisplay.workbench.showSubmitButton" class="conversation-preview__submit" type="button">↑</button>
                    </div>
                  </template>
                  <div v-if="form.entryDisplay.workbench.taskIndicatorEnabled" class="conversation-preview__toolbar">
                    <span class="conversation-preview__chip">任务状态 · 展示中</span>
                  </div>
                  <div v-if="form.entryDisplay.workbench.bannerEnabled" class="conversation-preview__placeholder">Banner 区域 · 展示中</div>
                </div>
              </div>
          </AdminSectionCard>
        </div>

        <AdminSectionCard
          v-else-if="currentTab === 'progress'"
          title="生成进度文案"
          description="按阶段配置前台“造梦中”徽章展示文案、百分比和说明，实时影响生成过程反馈。"
          compact
        >
            <template #actions>
              <button class="admin-button admin-button--secondary" type="button" @click="expandAllProgressStages">全部展开</button>
              <button class="admin-button admin-button--secondary" type="button" @click="collapseAllProgressStages">全部折叠</button>
              <button class="admin-button admin-button--secondary" type="button" @click="resetGenerationProgressSettings">恢复默认文案</button>
            </template>
            <div class="admin-conversation-progress-summary">
              <div class="admin-conversation-progress-summary__item">
                <span class="admin-conversation-progress-summary__label">配置开关</span>
                <label class="admin-switch-row">
                  <input v-model="progressForm.enabled" type="checkbox">
                  <span>启用后台生成进度文案配置</span>
                </label>
              </div>
              <div class="admin-conversation-progress-summary__item">
                <span class="admin-conversation-progress-summary__label">阶段数量</span>
                <span class="admin-conversation-progress-summary__value">{{ progressForm.stages.length }}</span>
              </div>
            </div>

            <div class="admin-conversation-progress-list">
              <div
                v-for="stage in progressForm.stages"
                :key="stage.key"
                class="admin-conversation-progress-card"
              >
                <div class="admin-conversation-progress-card__header">
                  <div>
                    <div class="admin-conversation-progress-card__title-row">
                      <div class="admin-conversation-progress-card__title">{{ stage.label || stage.key }}</div>
                      <span class="admin-chip admin-conversation-progress-card__key">{{ stage.key }}</span>
                    </div>
                    <div class="admin-conversation-progress-card__desc">{{ stage.description || '未填写阶段说明' }}</div>
                  </div>
                  <div class="admin-conversation-progress-card__header-actions">
                    <span class="admin-status" :class="stage.showPercent ? 'admin-status--success' : 'admin-status--muted'">
                      {{ stage.showPercent ? '显示进度' : '纯文案' }}
                    </span>
                    <label class="admin-switch-row">
                      <input v-model="stage.showPercent" type="checkbox">
                      <span>显示百分比</span>
                    </label>
                    <button class="admin-inline-button" type="button" @click="toggleProgressStageCollapse(stage.key)">
                      {{ collapsedProgressStages.has(stage.key) ? '展开' : '折叠' }}
                    </button>
                  </div>
                </div>
                <div v-if="!collapsedProgressStages.has(stage.key)" class="admin-conversation-progress-card__preview">
                  <span class="admin-conversation-progress-card__preview-label">前台预览</span>
                  <span class="admin-conversation-progress-card__badge">
                    {{ buildProgressStagePreview(stage) }}
                  </span>
                </div>
                <div v-if="!collapsedProgressStages.has(stage.key)" class="admin-form__grid admin-conversation-progress-card__body">
                  <div class="admin-form__field">
                    <label class="admin-form__label">展示文案</label>
                    <input v-model.trim="stage.label" class="admin-input" type="text" placeholder="例如：生成中">
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">展示百分比</label>
                    <input v-model.number="stage.percent" class="admin-input" type="number" min="0" max="100" placeholder="0-100">
                  </div>
                  <div class="admin-form__field admin-form__field--full">
                    <label class="admin-form__label">阶段说明</label>
                    <textarea v-model.trim="stage.description" class="admin-textarea" placeholder="用于后台识别当前阶段含义"></textarea>
                  </div>
                </div>
              </div>
            </div>
        </AdminSectionCard>

        <AdminSectionCard
          v-else
          title="管理策略"
          description="控制后台批量操作权限，以及后续自动清理与导出类能力的治理边界。"
          compact
        >
            <div class="admin-conversation-setting-grid">
              <section class="admin-conversation-setting-section">
                <div class="admin-conversation-setting-section__head">
                  <div>
                    <h5 class="admin-conversation-setting-section__title">操作治理</h5>
                    <p class="admin-conversation-setting-section__desc">限定后台可执行动作，避免批量操作影响线上创作资产。</p>
                  </div>
                </div>
                <div class="admin-conversation-switch-grid">
                  <label class="admin-conversation-switch-card">
                    <div class="admin-conversation-switch-card__main">
                      <span class="admin-conversation-switch-card__title">允许批量删除</span>
                      <span class="admin-conversation-switch-card__desc">支持在会话列表里批量清理无效或违规内容。</span>
                    </div>
                    <input v-model="form.managementPolicy.allowBatchDelete" type="checkbox">
                  </label>
                  <label class="admin-conversation-switch-card">
                    <div class="admin-conversation-switch-card__main">
                      <span class="admin-conversation-switch-card__title">允许导出明细</span>
                      <span class="admin-conversation-switch-card__desc">允许后台导出会话详情与记录结果，用于运营复盘。</span>
                    </div>
                    <input v-model="form.managementPolicy.allowExportSessions" type="checkbox">
                  </label>
                  <label class="admin-conversation-switch-card">
                    <div class="admin-conversation-switch-card__main">
                      <span class="admin-conversation-switch-card__title">启用自动清理</span>
                      <span class="admin-conversation-switch-card__desc">根据保留天数自动清理低价值或失效会话。</span>
                    </div>
                    <input v-model="form.managementPolicy.autoCleanupEnabled" type="checkbox">
                  </label>
                  <label class="admin-conversation-switch-card">
                    <div class="admin-conversation-switch-card__main">
                      <span class="admin-conversation-switch-card__title">级联删除记录</span>
                      <span class="admin-conversation-switch-card__desc">删除会话时同步删除会话下所有生成记录。</span>
                    </div>
                    <input v-model="form.managementPolicy.deleteCascadeRecords" type="checkbox">
                  </label>
                </div>
              </section>

              <section class="admin-conversation-setting-section admin-conversation-setting-section--compact">
                <div class="admin-conversation-setting-section__head">
                  <div>
                    <h5 class="admin-conversation-setting-section__title">保留策略</h5>
                    <p class="admin-conversation-setting-section__desc">以天为单位设定不同状态会话的保留周期，便于自动归档和清理。</p>
                  </div>
                </div>
                <div class="admin-form__grid">
                  <div class="admin-form__field">
                    <label class="admin-form__label">空会话保留天数</label>
                    <input v-model.number="form.managementPolicy.emptySessionRetentionDays" class="admin-input" type="number" min="1" max="3650">
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">已完成会话保留天数</label>
                    <input v-model.number="form.managementPolicy.completedSessionRetentionDays" class="admin-input" type="number" min="1" max="3650">
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">失败会话保留天数</label>
                    <input v-model.number="form.managementPolicy.failedSessionRetentionDays" class="admin-input" type="number" min="1" max="3650">
                  </div>
                </div>
              </section>
            </div>
        </AdminSectionCard>
      </div>
    </div>
  </AdminPageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AdminSectionCard from '@/components/admin/common/AdminSectionCard.vue'
import AdminStatCard from '@/components/admin/common/AdminStatCard.vue'
import AdminPageContainer from '@/components/admin/layout/AdminPageContainer.vue'
import {
  createDefaultGenerationProgressSettings,
  createDefaultConversationSettings,
  getAdminConversationSettings,
  saveAdminConversationSettings,
  type AdminConversationSettingsBundle,
  type ConversationSettingsConfig,
  type SystemGenerationProgressSettingsConfig,
} from '@/api/admin-conversation-settings'
import { getAllChatModels, loadPublicModelCatalog } from '@/config/models'
import { listEnabledAgentSkills, loadPublicSkillCatalog } from '@/config/agentSkills'

const loading = ref(false)
const saving = ref(false)
const currentTab = ref<'basic' | 'list' | 'entry' | 'policy' | 'progress'>('basic')
const currentEntryTab = ref<'hero' | 'mode' | 'actions'>('hero')
const tabItems = [
  { key: 'basic', label: '基础规则', description: '命名、排序与基础管理权限' },
  { key: 'list', label: '列表展示', description: '后台会话列表默认展示项' },
  { key: 'entry', label: '入口展示', description: '欢迎标题、输入框与底部能力条' },
  { key: 'policy', label: '管理策略', description: '批量操作、清理与导出策略' },
  { key: 'progress', label: '生成文案', description: '进度阶段、百分比与展示文案' },
] as const
const entryTabItems = [
  { key: 'hero', label: '欢迎区', description: '首屏标题、副标题与输入提示' },
  { key: 'mode', label: '模式与模型', description: '模式、模型、助手与白名单范围' },
  { key: 'actions', label: '功能按钮', description: '底部能力条展示与默认状态' },
] as const

const activeTabMeta = computed(() => {
  return tabItems.find(item => item.key === currentTab.value) || tabItems[0]
})

const form = reactive<ConversationSettingsConfig>(createDefaultConversationSettings())
const progressForm = reactive<SystemGenerationProgressSettingsConfig>(createDefaultGenerationProgressSettings())
const collapsedProgressStages = ref<Set<string>>(new Set())
const chatModelOptions = ref<Array<{ value: string, label: string }>>([])
const assistantOptions = ref<Array<{ value: string, label: string }>>([])
const creationModeCatalog = [
  { value: 'agent', label: 'Agent 模式', description: '适合智能对话与技能助手创作。' },
  { value: 'image', label: '图片生成', description: '适合图片、海报与电商视觉生成。' },
  { value: 'video', label: '视频生成', description: '适合视频脚本、镜头和短片创作。' },
  { value: 'digital-human', label: '数字人', description: '适合数字人口播与人物驱动内容。' },
  { value: 'motion', label: '动作模仿', description: '适合动作迁移与表演模仿类创作。' },
] as const

const normalizeModeOptions = (options: ConversationSettingsConfig['entryDisplay']['mode']['options']) => {
  const optionMap = new Map(
    (Array.isArray(options) ? options : [])
      .map(item => ({
        value: String(item.value || '').trim(),
        label: String(item.label || '').trim(),
      }))
      .filter(item => item.value && item.label)
      .map(item => [item.value, item.label] as const),
  )

  const normalizedOptions = creationModeCatalog
    .filter(item => optionMap.has(item.value))
    .map(item => ({
      value: item.value,
      label: optionMap.get(item.value) || item.label,
    }))

  return normalizedOptions.length
    ? normalizedOptions
    : [{ value: 'agent', label: 'Agent 模式' }]
}

const normalizeDefaultMode = (defaultMode: string, options: ConversationSettingsConfig['entryDisplay']['mode']['options']) => {
  const normalizedMode = String(defaultMode || '').trim()
  const exists = options.some(item => item.value === normalizedMode)
  return exists ? normalizedMode : (options[0]?.value || 'agent')
}

const applyForm = (value?: ConversationSettingsConfig | null) => {
  const nextValue = value || createDefaultConversationSettings()
  Object.assign(form.basicRules, nextValue.basicRules)
  Object.assign(form.listDisplay, nextValue.listDisplay)
  Object.assign(form.entryDisplay.hero, nextValue.entryDisplay.hero)
  Object.assign(form.entryDisplay.workbench, nextValue.entryDisplay.workbench)
  Object.assign(form.entryDisplay.input, nextValue.entryDisplay.input)
  Object.assign(form.entryDisplay.mode, {
    ...nextValue.entryDisplay.mode,
    options: normalizeModeOptions(nextValue.entryDisplay.mode.options),
    defaultMode: normalizeDefaultMode(
      nextValue.entryDisplay.mode.defaultMode,
      normalizeModeOptions(nextValue.entryDisplay.mode.options),
    ),
  })
  Object.assign(form.entryDisplay.modelSelector, {
    ...nextValue.entryDisplay.modelSelector,
    allowedModelKeys: [...nextValue.entryDisplay.modelSelector.allowedModelKeys],
  })
  Object.assign(form.entryDisplay.assistantSelector, {
    ...nextValue.entryDisplay.assistantSelector,
    allowedAssistantKeys: [...nextValue.entryDisplay.assistantSelector.allowedAssistantKeys],
  })
  Object.assign(form.entryDisplay.actions.auto, nextValue.entryDisplay.actions.auto)
  Object.assign(form.entryDisplay.actions.inspiration, nextValue.entryDisplay.actions.inspiration)
  Object.assign(form.entryDisplay.actions.creativeDesign, nextValue.entryDisplay.actions.creativeDesign)
  Object.assign(form.managementPolicy, nextValue.managementPolicy)
}

const applyProgressForm = (value?: SystemGenerationProgressSettingsConfig | null) => {
  const nextValue = value || createDefaultGenerationProgressSettings()
  progressForm.enabled = nextValue.enabled !== false
  progressForm.stages = nextValue.stages.map((item: SystemGenerationProgressSettingsConfig['stages'][number]) => ({ ...item }))
}

const buildPayload = (): AdminConversationSettingsBundle => ({
  conversationSettings: {
    basicRules: {
      ...form.basicRules,
    },
    listDisplay: {
      ...form.listDisplay,
    },
    entryDisplay: {
      hero: {
        ...form.entryDisplay.hero,
      },
      workbench: {
        ...form.entryDisplay.workbench,
      },
      input: {
        ...form.entryDisplay.input,
      },
      mode: {
        enabled: form.entryDisplay.mode.enabled,
        defaultMode: form.entryDisplay.mode.defaultMode,
        options: form.entryDisplay.mode.options
          .map(item => ({
            value: String(item.value || '').trim(),
            label: String(item.label || '').trim(),
          }))
          .filter(item => creationModeCatalog.some(mode => mode.value === item.value) && item.label),
      },
      modelSelector: {
        ...form.entryDisplay.modelSelector,
        allowedModelKeys: [...form.entryDisplay.modelSelector.allowedModelKeys],
      },
      assistantSelector: {
        ...form.entryDisplay.assistantSelector,
        allowedAssistantKeys: [...form.entryDisplay.assistantSelector.allowedAssistantKeys],
      },
      actions: {
        auto: {
          ...form.entryDisplay.actions.auto,
        },
        inspiration: {
          ...form.entryDisplay.actions.inspiration,
        },
        creativeDesign: {
          ...form.entryDisplay.actions.creativeDesign,
        },
      },
    },
    managementPolicy: {
      ...form.managementPolicy,
    },
  },
  generationProgressSettings: {
    enabled: progressForm.enabled,
    stages: progressForm.stages.map(item => ({
      key: item.key,
      label: item.label,
      percent: item.percent,
      showPercent: item.showPercent,
      description: item.description,
    })),
  },
})

const enabledPolicyCount = computed(() => {
  let count = 0
  if (form.managementPolicy.allowBatchDelete) count += 1
  if (form.managementPolicy.allowExportSessions) count += 1
  if (form.managementPolicy.autoCleanupEnabled) count += 1
  if (form.managementPolicy.deleteCascadeRecords) count += 1
  return count
})

const buildProgressStagePreview = (stage: {
  label: string
  percent: number
  showPercent: boolean
}) => {
  const label = String(stage.label || '').trim() || '未命名阶段'
  const percent = Number.isFinite(Number(stage.percent)) ? Math.max(0, Math.min(100, Number(stage.percent))) : 0
  return stage.showPercent ? `${percent}%${label}` : label
}

const previewModeLabel = computed(() => {
  const matchedMode = form.entryDisplay.mode.options.find(item => item.value === form.entryDisplay.mode.defaultMode)
  return matchedMode?.label || form.entryDisplay.mode.options[0]?.label || 'Agent 模式'
})

const previewModelLabel = computed(() => {
  const target = chatModelOptions.value.find(item => item.value === form.entryDisplay.modelSelector.defaultModelKey)
  return target?.label || '默认模型'
})

const previewAssistantLabel = computed(() => {
  const target = assistantOptions.value.find(item => item.value === form.entryDisplay.assistantSelector.defaultAssistantKey)
  return target?.label || '通用助手'
})

const enabledModeOptions = computed(() => {
  return form.entryDisplay.mode.options.length
    ? form.entryDisplay.mode.options
    : [{ value: 'agent', label: 'Agent 模式' }]
})

const modeEditorItems = computed(() => {
  const currentMap = new Map(
    form.entryDisplay.mode.options.map(item => [item.value, item.label]),
  )

  return creationModeCatalog.map(item => ({
    value: item.value,
    systemLabel: item.label,
    description: item.description,
    label: currentMap.get(item.value) || item.label,
    enabled: currentMap.has(item.value),
  }))
})

const modelAllowlistSummary = computed(() => {
  const count = form.entryDisplay.modelSelector.allowedModelKeys.length
  return count ? `已限制 ${count} 个模型` : '当前不限制模型范围'
})

const assistantAllowlistSummary = computed(() => {
  const count = form.entryDisplay.assistantSelector.allowedAssistantKeys.length
  return count ? `已限制 ${count} 个助手` : '当前不限制助手范围'
})

const toggleArrayValue = (list: string[], value: string) => {
  const normalizedValue = String(value || '').trim()
  if (!normalizedValue) {
    return list
  }

  return list.includes(normalizedValue)
    ? list.filter(item => item !== normalizedValue)
    : [...list, normalizedValue]
}

const isModelAllowed = (value: string) => {
  return form.entryDisplay.modelSelector.allowedModelKeys.includes(value)
}

const isAssistantAllowed = (value: string) => {
  return form.entryDisplay.assistantSelector.allowedAssistantKeys.includes(value)
}

const toggleModelAllowed = (value: string) => {
  form.entryDisplay.modelSelector.allowedModelKeys = toggleArrayValue(
    form.entryDisplay.modelSelector.allowedModelKeys,
    value,
  )
}

const toggleAssistantAllowed = (value: string) => {
  form.entryDisplay.assistantSelector.allowedAssistantKeys = toggleArrayValue(
    form.entryDisplay.assistantSelector.allowedAssistantKeys,
    value,
  )
}

const ensureDefaultModeValid = () => {
  const currentDefaultMode = String(form.entryDisplay.mode.defaultMode || '').trim()
  const exists = form.entryDisplay.mode.options.some(item => item.value === currentDefaultMode)
  if (exists) {
    return
  }

  form.entryDisplay.mode.defaultMode = form.entryDisplay.mode.options[0]?.value || 'agent'
}

const toggleModeEnabled = (value: string) => {
  const exists = form.entryDisplay.mode.options.some(item => item.value === value)

  if (exists) {
    if (form.entryDisplay.mode.options.length <= 1) {
      return
    }

    form.entryDisplay.mode.options = form.entryDisplay.mode.options.filter(item => item.value !== value)
    ensureDefaultModeValid()
    return
  }

  const catalogItem = creationModeCatalog.find(item => item.value === value)
  if (!catalogItem) {
    return
  }

  form.entryDisplay.mode.options.push({
    value: catalogItem.value,
    label: catalogItem.label,
  })
  ensureDefaultModeValid()
}

const updateModeLabel = (value: string, label: string) => {
  const normalizedLabel = String(label || '').trim()
  const target = form.entryDisplay.mode.options.find(item => item.value === value)
  if (!target) {
    return
  }

  const fallbackLabel = creationModeCatalog.find(item => item.value === value)?.label || target.label
  target.label = normalizedLabel || fallbackLabel
}

const canMoveModeUp = (value: string) => {
  return form.entryDisplay.mode.options.findIndex(item => item.value === value) > 0
}

const canMoveModeDown = (value: string) => {
  const index = form.entryDisplay.mode.options.findIndex(item => item.value === value)
  return index >= 0 && index < form.entryDisplay.mode.options.length - 1
}

const moveModeOption = (value: string, direction: 'up' | 'down') => {
  const index = form.entryDisplay.mode.options.findIndex(item => item.value === value)
  if (index < 0) {
    return
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= form.entryDisplay.mode.options.length) {
    return
  }

  const nextOptions = [...form.entryDisplay.mode.options]
  const [currentItem] = nextOptions.splice(index, 1)
  nextOptions.splice(targetIndex, 0, currentItem)
  form.entryDisplay.mode.options = nextOptions
}

const loadSelectorOptions = async () => {
  await loadPublicModelCatalog()
  chatModelOptions.value = getAllChatModels().map(model => ({
    value: model.key,
    label: model.label,
  }))

  await loadPublicSkillCatalog()
  assistantOptions.value = listEnabledAgentSkills().map(skill => ({
    value: skill.value,
    label: skill.label,
  }))
}

const loadSettings = async () => {
  loading.value = true
  try {
    const result = await getAdminConversationSettings()
    applyForm(result?.conversationSettings)
    applyProgressForm(result?.generationProgressSettings)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    const result = await saveAdminConversationSettings(buildPayload())
    applyForm(result?.conversationSettings)
    applyProgressForm(result?.generationProgressSettings)
  } finally {
    saving.value = false
  }
}

const handleReset = () => {
  applyForm(createDefaultConversationSettings())
  applyProgressForm(createDefaultGenerationProgressSettings())
  collapsedProgressStages.value = new Set()
}

const toggleProgressStageCollapse = (stageKey: string) => {
  const next = new Set(collapsedProgressStages.value)
  if (next.has(stageKey)) {
    next.delete(stageKey)
  } else {
    next.add(stageKey)
  }
  collapsedProgressStages.value = next
}

const collapseAllProgressStages = () => {
  collapsedProgressStages.value = new Set(progressForm.stages.map(item => item.key))
}

const expandAllProgressStages = () => {
  collapsedProgressStages.value = new Set()
}

const resetGenerationProgressSettings = () => {
  applyProgressForm(createDefaultGenerationProgressSettings())
  collapsedProgressStages.value = new Set()
}

onMounted(() => {
  void loadSelectorOptions()
  void loadSettings()
})
</script>

<style scoped>
.admin-conversation-settings-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.admin-conversation-settings-nav {
  position: sticky;
  top: 24px;
}

.admin-conversation-settings-nav__content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-conversation-settings-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-conversation-setting-grid {
  display: grid;
  gap: 16px;
}

.admin-conversation-setting-section {
  padding: 18px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 18px;
  background: color-mix(in srgb, var(--bg-surface) 90%, var(--bg-block-secondary-default));
}

.admin-conversation-setting-section--compact {
  padding: 16px;
}

.admin-conversation-setting-section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.admin-conversation-setting-section__title {
  margin: 0;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 700;
}

.admin-conversation-setting-section__desc {
  margin: 6px 0 0;
  color: var(--text-tertiary);
  font-size: 13px;
  line-height: 1.7;
}

.admin-conversation-switch-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.admin-conversation-switch-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 16px;
  background: var(--bg-surface);
}

.admin-conversation-switch-card__main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.admin-conversation-switch-card__title {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}

.admin-conversation-switch-card__desc {
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.6;
}

.admin-conversation-switch-card input {
  margin-top: 2px;
  flex-shrink: 0;
}

.admin-conversation-settings-section-head__inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.admin-conversation-settings-section-head__eyebrow {
  margin-bottom: 8px;
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-conversation-settings-section-head__title {
  margin: 0;
  color: var(--text-primary);
  font-size: 24px;
  line-height: 1.2;
}

.admin-conversation-settings-section-head__desc {
  margin: 8px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.admin-conversation-settings-section-head__tips {
  display: flex;
  justify-content: flex-end;
}

.admin-conversation-settings-section-head__tip {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid color-mix(in srgb, var(--brand-main-default) 22%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-main-default) 8%, var(--bg-surface));
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-conversation-settings-tabs__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  padding: 16px 18px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 16px;
  background: var(--bg-surface);
  color: var(--text-secondary);
  transition: all 0.2s ease;
  text-align: left;
}

.admin-conversation-settings-tabs__item:hover,
.admin-conversation-settings-tabs__item.is-active {
  border-color: color-mix(in srgb, var(--brand-main-default) 32%, transparent);
  background: color-mix(in srgb, var(--brand-main-default) 10%, var(--bg-surface));
  color: var(--text-primary);
}

.admin-conversation-settings-tabs__title {
  font-size: 15px;
  font-weight: 600;
}

.admin-conversation-settings-tabs__desc {
  font-size: 12px;
  line-height: 1.5;
}

.admin-toggle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.admin-toggle-grid--single {
  grid-template-columns: minmax(0, 1fr);
}

.admin-select {
  width: 100%;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 12px;
  background: var(--bg-surface);
  color: var(--text-primary);
}

.admin-conversation-entry-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.95fr);
  gap: 16px;
}

.admin-conversation-entry-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-conversation-entry-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.admin-conversation-entry-tabs__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 16px;
  background: var(--bg-surface);
  color: var(--text-secondary);
  text-align: left;
  transition: all 0.2s ease;
}

.admin-conversation-entry-tabs__item:hover,
.admin-conversation-entry-tabs__item.is-active {
  border-color: color-mix(in srgb, var(--brand-main-default) 32%, transparent);
  background: color-mix(in srgb, var(--brand-main-default) 10%, var(--bg-surface));
  color: var(--text-primary);
}

.admin-conversation-entry-tabs__title {
  font-size: 14px;
  font-weight: 600;
}

.admin-conversation-entry-tabs__desc {
  font-size: 12px;
  line-height: 1.5;
}

.admin-conversation-preview-card {
  overflow: hidden;
}

.admin-conversation-settings-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-conversation-settings-list__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 10px;
}

.admin-conversation-action-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.admin-conversation-action-grid__item {
  padding: 14px 16px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 16px;
  background: color-mix(in srgb, var(--bg-surface) 92%, var(--bg-block-secondary-default));
}

.admin-conversation-action-grid__title {
  margin-bottom: 10px;
  color: var(--text-primary);
  font-weight: 600;
}

.admin-conversation-selector-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 16px;
  background: color-mix(in srgb, var(--bg-surface) 92%, var(--bg-block-secondary-default));
}

.admin-conversation-selector-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.admin-conversation-selector-panel__summary {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}

.admin-conversation-selector-panel__desc {
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.6;
}

.admin-conversation-selector-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.admin-conversation-selector-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 16px;
  background: var(--bg-surface);
  transition: all 0.2s ease;
}

.admin-conversation-selector-card.is-active {
  border-color: color-mix(in srgb, var(--brand-main-default) 34%, transparent);
  background: color-mix(in srgb, var(--brand-main-default) 10%, var(--bg-surface));
}

.admin-conversation-selector-card__main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.admin-conversation-selector-card__title {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}

.admin-conversation-selector-card__meta {
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.admin-conversation-selector-card input {
  margin-top: 2px;
  flex-shrink: 0;
}

.admin-conversation-mode-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.admin-conversation-mode-item {
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 16px;
  background: var(--bg-surface);
  transition: all 0.2s ease;
}

.admin-conversation-mode-item.is-active {
  border-color: color-mix(in srgb, var(--brand-main-default) 34%, transparent);
  background: color-mix(in srgb, var(--brand-main-default) 8%, var(--bg-surface));
}

.admin-conversation-mode-item__main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.admin-conversation-mode-item__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-conversation-mode-item__title {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}

.admin-conversation-mode-item__meta {
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.admin-conversation-mode-item__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.admin-conversation-mode-item__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.admin-conversation-progress-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.admin-conversation-progress-summary__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 16px;
  background: color-mix(in srgb, var(--bg-surface) 92%, var(--bg-block-secondary-default));
}

.admin-conversation-progress-summary__label {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}

.admin-conversation-progress-summary__value {
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 700;
}

.admin-conversation-progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-conversation-progress-card {
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 18px;
  padding: 18px;
  background: var(--bg-surface);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--text-primary) 4%, transparent);
  transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
}

.admin-conversation-progress-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--brand-main-default) 18%, var(--line-divider, #00000014));
  box-shadow: 0 16px 32px color-mix(in srgb, var(--text-primary) 8%, transparent);
}

.admin-conversation-progress-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-conversation-progress-card__header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.admin-conversation-progress-card__title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.admin-conversation-progress-card__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.admin-conversation-progress-card__key {
  font-size: 12px;
  font-weight: 600;
}

.admin-conversation-progress-card__desc {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-tertiary);
}

.admin-conversation-progress-card__preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--bg-surface) 88%, var(--bg-block-secondary-default));
  border: 1px solid var(--line-divider, #00000014);
}

.admin-conversation-progress-card__preview-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.admin-conversation-progress-card__badge {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-main-default) 10%, var(--bg-surface));
  color: var(--brand-main-default);
  font-size: 13px;
  font-weight: 600;
  border: 1px solid color-mix(in srgb, var(--brand-main-default) 18%, transparent);
}

.admin-conversation-progress-card__body {
  padding-top: 2px;
}

.conversation-preview {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 40px 20px;
  border-radius: 24px;
  background: #121316;
}

.conversation-preview__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #f5f7fa;
  text-align: center;
}

.conversation-preview__hero h3 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.conversation-preview__hero p {
  margin: 0;
  color: rgba(245, 247, 250, 0.72);
}

.conversation-preview__panel {
  width: 100%;
  min-height: 208px;
  padding: 28px 28px 18px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 28px;
  background: #1f2127;
}

.conversation-preview__workbench-title {
  margin-bottom: 18px;
  color: #f5f7fa;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.6;
}

.conversation-preview__placeholder {
  min-height: 96px;
  color: rgba(245, 247, 250, 0.38);
  font-size: 16px;
}

.conversation-preview__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.conversation-preview__chip {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: rgba(245, 247, 250, 0.84);
  font-size: 13px;
}

.conversation-preview__submit {
  margin-left: auto;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

@media (max-width: 1200px) {
  .admin-conversation-settings-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-conversation-settings-nav {
    position: static;
  }

  .admin-conversation-settings-nav__content {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-conversation-entry-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 960px) {
  .admin-conversation-settings-nav__content,
  .admin-conversation-entry-tabs,
  .admin-conversation-progress-summary,
  .admin-conversation-action-grid,
  .admin-toggle-grid,
  .admin-conversation-switch-grid,
  .admin-conversation-selector-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-conversation-settings-section-head__inner {
    flex-direction: column;
  }

  .admin-conversation-settings-list__row {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-conversation-mode-item__top,
  .admin-conversation-mode-item__body {
    grid-template-columns: minmax(0, 1fr);
    flex-direction: column;
  }

  .admin-conversation-mode-item__actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .admin-conversation-progress-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-conversation-progress-card__header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
