<template>
  <AdminPageContainer
    class="admin-list-page"
    compact title="技能配置" description="统一维护技能目录、工作台模式、提示词模板、工作流模板与阶段文案。">
    <AdminListFrame>
      <template #toolbar>
        <AdminListToolbar
          :disabled="loading || saving"
          :has-active-filters="activeFilterCount > 0"
          :facets="listFacets"
          @update:facet="handleFacetUpdate"
          @clear="resetListFilters"
        >
          <input
            v-model.trim="filters.keyword"
            class="admin-list-toolbar__input is-wide"
            type="text"
            placeholder="搜索技能名称、标识或分类"
          >
          <template #actions>
            <button class="admin-button admin-button--secondary" type="button" @click="loadSkillList" :disabled="loading || saving">
              {{ loading ? '刷新中...' : '刷新列表' }}
            </button>
            <button class="admin-button admin-button--primary" type="button" @click="openCreateDialog" :disabled="saving">
              新增技能
            </button>
          </template>
        </AdminListToolbar>
      </template>

      <AdminEmptyState v-if="loading && !filteredSkills.length" message="正在加载技能列表..." :illustrated="false" compact />
      <AdminEmptyState v-else-if="!filteredSkills.length" message="当前还没有符合条件的技能。" />
      <div v-else class="admin-provider-grid admin-console-grid">
      <div v-for="skill in paginatedSkills" :key="skill.skillKey" class="admin-provider-tile admin-skill-tile">
        <div class="admin-provider-tile__header">
          <div class="admin-provider-tile__brand">
            <div class="admin-provider-avatar">
              <span>{{ getSkillInitial(skill.label) }}</span>
            </div>
            <div class="admin-provider-tile__meta">
              <div class="admin-provider-tile__title">{{ skill.label }}</div>
              <div class="admin-provider-tile__link">{{ skill.skillKey }}</div>
            </div>
          </div>
        </div>

        <div class="admin-provider-tile__status-row">
          <button
            class="admin-status admin-status--toggle"
            :class="[
              skill.isEnabled ? 'admin-status--success' : 'admin-status--warning',
              isSkillToggling(skill.skillKey) ? 'is-loading' : '',
            ]"
            type="button"
            :disabled="isSkillToggling(skill.skillKey)"
            :title="skill.isEnabled ? '点击快捷禁用' : '点击快捷启用'"
            @click="handleToggleSkillEnabled(skill)"
          >
            {{ isSkillToggling(skill.skillKey) ? '切换中...' : skill.isEnabled ? '已启用' : '已禁用' }}
          </button>
          <span class="admin-status" :class="skill.uiMode === 'WORKSPACE' ? 'admin-status--info' : 'admin-status--default'">
            {{ skill.uiMode === 'WORKSPACE' ? '工作台' : '普通对话' }}
          </span>
        </div>

        <div class="admin-provider-tile__chips">
          <span v-if="skill.category" class="admin-chip">{{ skill.category }}</span>
          <span class="admin-chip">{{ skill.executionMode }}</span>
          <span class="admin-chip">{{ skill.plannerModelCategory }}</span>
          <span v-if="skill.workflowType" class="admin-chip">{{ skill.workflowType }}</span>
        </div>

        <div class="admin-skill-tile__desc">{{ skill.description || '暂无描述' }}</div>

        <div class="admin-provider-tile__footer">
          <span>排序 {{ skill.sortOrder }}</span>
          <span>默认 {{ skill.expectedImageCount }} 张</span>
        </div>

        <div class="admin-skill-tile__binding">
          <span>图片模型</span>
          <strong>{{ getSkillImageModelSummary(skill.skillKey) }}</strong>
        </div>
        <div v-if="skill.skillKey === RESEARCH_REPORT_SKILL_KEY" class="admin-skill-tile__binding">
          <span>深度搜索</span>
          <strong>{{ getSkillResearchSearchSummary(skill.skillKey) }}</strong>
        </div>

        <div class="admin-skill-tile__meta-row">
          <span>提示词 {{ getPromptCount(skill.skillKey) }}</span>
          <span>工作流 {{ getWorkflowCount(skill.skillKey) }}</span>
          <span>计划 {{ getPlanCount(skill.skillKey) }}</span>
          <span>阶段 {{ getStageCount(skill.skillKey) }}</span>
        </div>

        <div class="admin-provider-card__actions admin-skill-tile__actions">
          <button class="admin-inline-button" type="button" @click="openEditDialog(skill.skillKey)">编辑</button>
          <button class="admin-inline-button" type="button" @click="handleCloneSkill(skill.skillKey)">复制技能</button>
          <button class="admin-inline-button admin-inline-button--danger" type="button" :disabled="skill.isBuiltIn" @click="handleDeleteSkill(skill)">
            {{ skill.isBuiltIn ? '内置不可删' : '删除' }}
          </button>
        </div>
      </div>
      </div>

      <template #pagination>
        <AdminPagination
          v-if="filteredSkills.length > 0"
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="filteredSkills.length"
          :disabled="loading || saving"
        />
      </template>
    </AdminListFrame>
  </AdminPageContainer>

  <div v-if="dialogVisible" class="admin-dialog-mask" @click="closeDialog">
    <div class="admin-dialog admin-dialog--provider-form admin-dialog--skill-form" @click.stop>
      <div class="admin-dialog__header">
        <div>
          <h3 class="admin-dialog__title">{{ editingSkillKey ? '编辑技能' : '新增技能' }}</h3>
          <div class="admin-dialog__desc">这里配置的是技能主定义与全部运行时模板。</div>
        </div>
        <button class="admin-dialog__close" type="button" @click="closeDialog">×</button>
      </div>

      <form class="admin-form admin-dialog__body" @submit.prevent="handleSaveSkill">
        <div class="admin-skill-layout">
          <div class="admin-skill-layout__main">
            <div class="admin-skill-tabs">
              <button
                v-for="tab in editorTabs"
                :key="tab.key"
                class="admin-skill-tabs__item"
                :class="{ 'is-active': activeEditorTab === tab.key }"
                type="button"
                @click="switchEditorTab(tab.key)"
              >
                <span>{{ tab.label }}</span>
                <small>{{ getTabCountText(tab.key) }}</small>
              </button>
            </div>

            <section v-show="activeEditorTab === 'basic-runtime'" id="skill-section-basic" class="admin-skill-panel">
              <div class="admin-skill-panel__header">
                <div>
                  <h4>基础信息</h4>
                  <p>先定义技能名称、标识和描述，便于后台检索与前台展示。</p>
                </div>
                <button class="admin-inline-button" type="button" @click="toggleSectionCollapse('basic')">
                  {{ isSectionCollapsed('basic') ? '展开' : '折叠' }}
                </button>
              </div>
              <div v-if="!isSectionCollapsed('basic')" class="admin-skill-field-group">
                <div class="admin-skill-field-group__header">
                  <h5>展示信息</h5>
                  <span>前台名称、分类与描述</span>
                </div>
                <div class="admin-form__grid">
                  <div class="admin-form__field">
                    <label class="admin-form__label">技能标识</label>
                    <input v-model.trim="skillForm.skillKey" class="admin-input" type="text" placeholder="例如 ecommerce-pack">
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">技能名称</label>
                    <input v-model.trim="skillForm.label" class="admin-input" type="text" placeholder="例如 电商套图">
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">分类</label>
                    <input v-model.trim="skillForm.category" class="admin-input" type="text" placeholder="例如 commerce">
                  </div>
                  <div class="admin-form__field">
                    <label class="admin-form__label">图标类型</label>
                    <input v-model.trim="skillForm.iconType" class="admin-input" type="text" placeholder="例如 shop">
                  </div>
                  <div class="admin-form__field admin-form__field--full">
                    <label class="admin-form__label">描述</label>
                    <textarea v-model="skillForm.description" class="admin-textarea" placeholder="技能用途描述"></textarea>
                  </div>
                </div>
              </div>
            </section>

            <section v-show="activeEditorTab === 'basic-runtime'" id="skill-section-runtime" class="admin-skill-panel">
              <div class="admin-skill-panel__header">
                <div>
                  <h4>运行配置</h4>
                  <p>这里决定技能走普通对话还是工作台，以及运行时依赖和工作流入口。</p>
                </div>
                <button class="admin-inline-button" type="button" @click="toggleSectionCollapse('runtime')">
                  {{ isSectionCollapsed('runtime') ? '展开' : '折叠' }}
                </button>
              </div>
              <div v-if="!isSectionCollapsed('runtime')" class="admin-skill-field-stack">
                <div class="admin-skill-field-group">
                  <div class="admin-skill-field-group__header">
                    <h5>执行参数</h5>
                    <span>运行模式、规划模型与工作流入口</span>
                  </div>
                  <div class="admin-form__grid">
                    <div class="admin-form__field">
                      <label class="admin-form__label">默认厂商</label>
                      <select v-model="skillForm.providerId" class="admin-input">
                        <option value="">不绑定</option>
                        <option v-for="provider in providerOptions" :key="provider.id" :value="provider.id">{{ provider.name }}</option>
                      </select>
                    </div>
                    <div class="admin-form__field">
                      <label class="admin-form__label">界面模式</label>
                      <select v-model="skillForm.uiMode" class="admin-input">
                        <option value="PLAIN_CHAT">普通对话</option>
                        <option value="WORKSPACE">工作台</option>
                      </select>
                    </div>
                    <div class="admin-form__field">
                      <label class="admin-form__label">执行模式</label>
                      <select v-model="skillForm.executionMode" class="admin-input">
                        <option value="CHAT_ONLY">仅对话</option>
                        <option value="PLANNER_THEN_GENERATE">规划后生成</option>
                        <option value="PLANNER_THEN_STORYBOARD">规划后分镜</option>
                        <option value="DIRECT_GENERATE">直接生成</option>
                      </select>
                    </div>
                    <div class="admin-form__field">
                      <label class="admin-form__label">规划器模型类型</label>
                      <select v-model="skillForm.plannerModelCategory" class="admin-input">
                        <option value="CHAT">CHAT</option>
                        <option value="IMAGE">IMAGE</option>
                        <option value="VIDEO">VIDEO</option>
                      </select>
                    </div>
                    <div class="admin-form__field">
                      <label class="admin-form__label">默认工作流类型</label>
                      <input v-model.trim="skillForm.workflowType" class="admin-input" type="text" placeholder="例如 text_to_image">
                    </div>
                    <div class="admin-form__field">
                      <label class="admin-form__label">默认图片数量</label>
                      <input v-model.number="skillForm.expectedImageCount" class="admin-input" type="number" min="0">
                    </div>
                    <div class="admin-form__field">
                      <label class="admin-form__label">排序值</label>
                      <input v-model.number="skillForm.sortOrder" class="admin-input" type="number" min="0">
                    </div>
                  </div>
                </div>
                <div class="admin-skill-field-group">
                  <div class="admin-skill-field-group__header">
                    <h5>运行时扩展</h5>
                    <span>技能键、依赖链与扩展配置</span>
                  </div>
                  <div class="admin-form__grid">
                    <div class="admin-form__field">
                      <label class="admin-form__label">运行时技能键</label>
                      <input v-model.trim="skillForm.workspaceSkillKey" class="admin-input" type="text" placeholder="例如 image-poster">
                    </div>
                    <div class="admin-form__field">
                      <label class="admin-form__label">图片模型厂商</label>
                      <select v-model="skillForm.imageModelProviderId" class="admin-input">
                        <option value="">跟随默认图片模型</option>
                        <option v-for="provider in imageModelProviderOptions" :key="provider.id" :value="provider.id">{{ provider.name }}</option>
                      </select>
                    </div>
                    <div class="admin-form__field">
                      <label class="admin-form__label">图片模型</label>
                      <select v-model="skillForm.imageModelKey" class="admin-input" :disabled="!skillForm.imageModelProviderId">
                        <option value="">{{ skillForm.imageModelProviderId ? '请选择图片模型' : '请先选择厂商' }}</option>
                        <option v-for="model in currentImageModelOptions" :key="model.id" :value="model.modelKey">{{ model.label }}（{{ model.modelKey }}）</option>
                      </select>
                    </div>
                    <div v-if="isResearchReportSkill" class="admin-form__field">
                      <label class="admin-form__label">深度搜索供应商</label>
                      <select v-model="skillForm.researchSearchProviderId" class="admin-input">
                        <option value="">请选择搜索供应商</option>
                        <option v-for="provider in researchSearchProviderOptions" :key="provider.id" :value="provider.id">{{ provider.name }}</option>
                      </select>
                    </div>
                    <div v-if="isResearchReportSkill" class="admin-form__field">
                      <label class="admin-form__label">深度搜索模型</label>
                      <select v-model="skillForm.researchSearchModelKey" class="admin-input" :disabled="!skillForm.researchSearchProviderId">
                        <option value="">{{ skillForm.researchSearchProviderId ? '请选择搜索模型' : '请先选择供应商' }}</option>
                        <option v-for="model in currentResearchSearchModelOptions" :key="model.id" :value="model.modelKey">{{ model.label }}（{{ model.modelKey }}）</option>
                      </select>
                      <div class="admin-form__hint">供应商的 Base URL、API Key 和接口路径在供应商配置中心维护。</div>
                    </div>
                    <div class="admin-form__field admin-form__field--full">
                      <label class="admin-form__label">依赖技能键（逗号分隔）</label>
                      <input v-model.trim="skillForm.dependencySkillKeysText" class="admin-input" type="text" placeholder="例如 image-main,image-style">
                    </div>
                    <div class="admin-form__field admin-form__field--full">
                      <label class="admin-form__label">扩展配置 JSON</label>
                      <textarea v-model="skillForm.configJsonText" class="admin-textarea" placeholder='例如 {"result_parser":"text_to_image_default"}'></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div v-show="activeEditorTab === 'basic-runtime'" class="admin-skill-section admin-skill-section--compact">
              <div class="admin-check-grid admin-check-grid--two">
                <label class="admin-check-item admin-check-item--switch">
                  <input v-model="skillForm.isEnabled" type="checkbox">
                  <span>启用技能</span>
                </label>
                <label class="admin-check-item admin-check-item--switch">
                  <input v-model="skillForm.isBuiltIn" type="checkbox">
                  <span>标记为内置</span>
                </label>
              </div>
            </div>

            <div v-show="activeEditorTab === 'templates'" id="skill-section-prompts" class="admin-skill-section">
              <div class="admin-skill-section__header">
                <div class="admin-skill-section__header-main">
                  <h4>提示词模板</h4>
                  <span class="admin-skill-section__count">{{ enabledPromptCount }}/{{ skillForm.promptTemplates.length }}</span>
                </div>
                <div class="admin-skill-section__header-actions">
                  <button class="admin-inline-button" type="button" @click="addPromptTemplate">新增模板</button>
                  <button class="admin-inline-button" type="button" @click="toggleSectionCollapse('prompts')">
                    {{ isSectionCollapsed('prompts') ? '展开' : '折叠' }}
                  </button>
                </div>
              </div>
              <template v-if="!isSectionCollapsed('prompts')">
                <div v-if="!skillForm.promptTemplates.length" class="admin-empty admin-empty--mini">暂无提示词模板</div>
                <div v-for="(item, index) in skillForm.promptTemplates" :key="`prompt-${index}`" class="admin-skill-editor-card">
                  <div class="admin-skill-editor-card__header">
                    <div class="admin-skill-editor-card__title">
                      <span class="admin-skill-editor-card__index">#{{ index + 1 }}</span>
                      <div class="admin-skill-editor-card__title-main">
                        <strong>{{ item.scene }} 模板</strong>
                        <small>{{ getPromptTemplateMeta(item) }}</small>
                      </div>
                      <span class="admin-skill-editor-card__badge" :class="item.isEnabled ? 'is-enabled' : 'is-disabled'">
                        {{ item.isEnabled ? '启用' : '禁用' }}
                      </span>
                    </div>
                    <div class="admin-skill-editor-card__toolbar">
                      <button class="admin-inline-button" type="button" :disabled="index === 0" @click="movePromptTemplate(index, 'up')">上移</button>
                      <button class="admin-inline-button" type="button" :disabled="index === skillForm.promptTemplates.length - 1" @click="movePromptTemplate(index, 'down')">下移</button>
                      <button class="admin-inline-button" type="button" @click="toggleTemplateItemCollapse('prompt-items', index)">
                        {{ isTemplateItemCollapsed('prompt-items', index) ? '展开' : '折叠' }}
                      </button>
                    </div>
                  </div>
                  <div v-if="isTemplateItemCollapsed('prompt-items', index)" class="admin-skill-editor-card__preview">
                    <div class="admin-skill-editor-card__preview-item">
                      <span>系统提示</span>
                      <strong>{{ getPromptTemplateSummary(item.systemPrompt) }}</strong>
                    </div>
                    <div class="admin-skill-editor-card__preview-item">
                      <span>用户模板</span>
                      <strong>{{ getPromptTemplateSummary(item.userPromptTemplate) }}</strong>
                    </div>
                  </div>
                  <div v-else class="admin-form__grid">
                    <div class="admin-form__field">
                      <label class="admin-form__label">场景</label>
                      <select v-model="item.scene" class="admin-input">
                        <option value="CHAT">CHAT</option>
                        <option value="PLANNER">PLANNER</option>
                      </select>
                    </div>
                    <div class="admin-form__field">
                      <label class="admin-form__label">是否启用</label>
                      <select v-model="item.isEnabled" class="admin-input">
                        <option :value="true">启用</option>
                        <option :value="false">禁用</option>
                      </select>
                    </div>
                    <div class="admin-form__field admin-form__field--full">
                      <label class="admin-form__label">系统提示词</label>
                      <textarea v-model="item.systemPrompt" class="admin-textarea" placeholder="系统提示词"></textarea>
                    </div>
                    <div class="admin-form__field admin-form__field--full">
                      <label class="admin-form__label">用户提示词模板</label>
                      <textarea v-model="item.userPromptTemplate" class="admin-textarea" placeholder="支持 {{input}}"></textarea>
                    </div>
                  </div>
                  <div class="admin-skill-editor-card__actions">
                    <button class="admin-inline-button admin-inline-button--danger" type="button" @click="removePromptTemplate(index)">删除模板</button>
                  </div>
                </div>
              </template>
            </div>

        <div v-show="activeEditorTab === 'templates'" id="skill-section-workflows" class="admin-skill-section">
          <div class="admin-skill-section__header">
            <div class="admin-skill-section__header-main">
              <h4>工作流模板</h4>
              <span class="admin-skill-section__count">{{ enabledWorkflowCount }}/{{ skillForm.workflowTemplates.length }}</span>
            </div>
            <div class="admin-skill-section__header-actions">
              <button class="admin-inline-button" type="button" @click="addWorkflowTemplate">新增模板</button>
              <button class="admin-inline-button" type="button" @click="toggleSectionCollapse('workflows')">
                {{ isSectionCollapsed('workflows') ? '展开' : '折叠' }}
              </button>
            </div>
          </div>
          <template v-if="!isSectionCollapsed('workflows')">
          <div v-if="!skillForm.workflowTemplates.length" class="admin-empty admin-empty--mini">暂无工作流模板</div>
          <div v-for="(item, index) in skillForm.workflowTemplates" :key="`workflow-${index}`" class="admin-skill-editor-card">
            <div class="admin-skill-editor-card__header">
              <div class="admin-skill-editor-card__title">
                <span class="admin-skill-editor-card__index">#{{ index + 1 }}</span>
                <div class="admin-skill-editor-card__title-main">
                  <strong>{{ item.workflowLabel || '未命名工作流' }}</strong>
                  <small>{{ getWorkflowTemplateMeta(item) }}</small>
                </div>
                <span class="admin-skill-editor-card__badge" :class="item.isEnabled ? 'is-enabled' : 'is-disabled'">
                  {{ item.isEnabled ? '启用' : '禁用' }}
                </span>
              </div>
              <div class="admin-skill-editor-card__toolbar">
                <button class="admin-inline-button" type="button" :disabled="index === 0" @click="moveWorkflowTemplate(index, 'up')">上移</button>
                <button class="admin-inline-button" type="button" :disabled="index === skillForm.workflowTemplates.length - 1" @click="moveWorkflowTemplate(index, 'down')">下移</button>
                <button class="admin-inline-button" type="button" @click="toggleTemplateItemCollapse('workflow-items', index)">
                  {{ isTemplateItemCollapsed('workflow-items', index) ? '展开' : '折叠' }}
                </button>
              </div>
            </div>
            <div v-if="isTemplateItemCollapsed('workflow-items', index)" class="admin-skill-editor-card__preview">
              <div class="admin-skill-editor-card__preview-item">
                <span>工作流类型</span>
                <strong>{{ item.workflowType || '未设置' }}</strong>
              </div>
              <div class="admin-skill-editor-card__preview-item">
                <span>参数摘要</span>
                <strong>{{ getWorkflowTemplateSummary(item.workflowParamsTemplateJsonText) }}</strong>
              </div>
            </div>
            <div v-else class="admin-form__grid">
              <div class="admin-form__field">
                <label class="admin-form__label">工作流名称</label>
                <input v-model.trim="item.workflowLabel" class="admin-input" type="text">
              </div>
              <div class="admin-form__field">
                <label class="admin-form__label">工作流类型</label>
                <input v-model.trim="item.workflowType" class="admin-input" type="text">
              </div>
              <div class="admin-form__field">
                <label class="admin-form__label">默认数量</label>
                <input v-model.number="item.expectedImageCount" class="admin-input" type="number" min="0">
              </div>
              <div class="admin-form__field">
                <label class="admin-form__label">是否启用</label>
                <select v-model="item.isEnabled" class="admin-input">
                  <option :value="true">启用</option>
                  <option :value="false">禁用</option>
                </select>
              </div>
              <div class="admin-form__field admin-form__field--full">
                <label class="admin-form__label">工作流参数模板 JSON</label>
                <textarea v-model="item.workflowParamsTemplateJsonText" class="admin-textarea" placeholder='例如 {"image_prompt":"需求：{{input}}"}'></textarea>
              </div>
            </div>
            <div class="admin-skill-editor-card__actions">
              <button class="admin-inline-button admin-inline-button--danger" type="button" @click="removeWorkflowTemplate(index)">删除模板</button>
            </div>
          </div>
          </template>
        </div>

        <div v-show="activeEditorTab === 'plan-stage'" id="skill-section-plans" class="admin-skill-section">
          <div class="admin-skill-section__header">
            <div class="admin-skill-section__header-main">
              <h4>计划模板</h4>
              <span class="admin-skill-section__count">{{ enabledPlanCount }}/{{ skillForm.planTemplates.length }}</span>
            </div>
            <div class="admin-skill-section__header-actions">
              <button class="admin-inline-button" type="button" @click="addPlanTemplate">新增计划项</button>
              <button class="admin-inline-button" type="button" @click="toggleSectionCollapse('plans')">
                {{ isSectionCollapsed('plans') ? '展开' : '折叠' }}
              </button>
            </div>
          </div>
          <template v-if="!isSectionCollapsed('plans')">
          <div v-if="!skillForm.planTemplates.length" class="admin-empty admin-empty--mini">暂无计划模板</div>
          <div v-for="(item, index) in skillForm.planTemplates" :key="`plan-${index}`" class="admin-skill-editor-card">
            <div class="admin-skill-editor-card__header">
              <div class="admin-skill-editor-card__title">
                <span class="admin-skill-editor-card__index">#{{ index + 1 }}</span>
                <div class="admin-skill-editor-card__title-main">
                  <strong>{{ item.titleTemplate || item.itemKey || '未命名计划项' }}</strong>
                  <small>{{ getPlanTemplateMeta(item) }}</small>
                </div>
                <span class="admin-skill-editor-card__badge" :class="item.isEnabled ? 'is-enabled' : 'is-disabled'">
                  {{ item.isEnabled ? '启用' : '禁用' }}
                </span>
              </div>
              <div class="admin-skill-editor-card__toolbar">
                <button class="admin-inline-button" type="button" :disabled="index === 0" @click="movePlanTemplate(index, 'up')">上移</button>
                <button class="admin-inline-button" type="button" :disabled="index === skillForm.planTemplates.length - 1" @click="movePlanTemplate(index, 'down')">下移</button>
                <button class="admin-inline-button" type="button" @click="toggleTemplateItemCollapse('plan-items', index)">
                  {{ isTemplateItemCollapsed('plan-items', index) ? '展开' : '折叠' }}
                </button>
              </div>
            </div>
            <div v-if="isTemplateItemCollapsed('plan-items', index)" class="admin-skill-editor-card__preview">
              <div class="admin-skill-editor-card__preview-item">
                <span>计划标识</span>
                <strong>{{ item.itemKey || '未设置' }}</strong>
              </div>
              <div class="admin-skill-editor-card__preview-item">
                <span>提示词摘要</span>
                <strong>{{ getPlanTemplateSummary(item.promptTemplate) }}</strong>
              </div>
            </div>
            <div v-else class="admin-form__grid">
              <div class="admin-form__field">
                <label class="admin-form__label">标识</label>
                <input v-model.trim="item.itemKey" class="admin-input" type="text">
              </div>
              <div class="admin-form__field">
                <label class="admin-form__label">标题模板</label>
                <input v-model.trim="item.titleTemplate" class="admin-input" type="text">
              </div>
              <div class="admin-form__field">
                <label class="admin-form__label">排序值</label>
                <input v-model.number="item.sortOrder" class="admin-input" type="number" min="0">
              </div>
              <div class="admin-form__field">
                <label class="admin-form__label">是否启用</label>
                <select v-model="item.isEnabled" class="admin-input">
                  <option :value="true">启用</option>
                  <option :value="false">禁用</option>
                </select>
              </div>
              <div class="admin-form__field admin-form__field--full">
                <label class="admin-form__label">提示词模板</label>
                <textarea v-model="item.promptTemplate" class="admin-textarea" placeholder="支持 {{base_prompt}} / {{input}}"></textarea>
              </div>
            </div>
            <div class="admin-skill-editor-card__actions">
              <button class="admin-inline-button admin-inline-button--danger" type="button" @click="removePlanTemplate(index)">删除计划项</button>
            </div>
          </div>
          </template>
        </div>

        <div v-show="activeEditorTab === 'plan-stage'" id="skill-section-stages" class="admin-skill-section">
          <div class="admin-skill-section__header">
            <div class="admin-skill-section__header-main">
              <h4>阶段模板</h4>
              <span class="admin-skill-section__count">{{ enabledStageCount }}/{{ skillForm.stageTemplates.length }}</span>
            </div>
            <div class="admin-skill-section__header-actions">
              <button class="admin-inline-button" type="button" @click="addStageTemplate">新增阶段</button>
              <button class="admin-inline-button" type="button" @click="toggleSectionCollapse('stages')">
                {{ isSectionCollapsed('stages') ? '展开' : '折叠' }}
              </button>
            </div>
          </div>
          <template v-if="!isSectionCollapsed('stages')">
          <div v-if="!skillForm.stageTemplates.length" class="admin-empty admin-empty--mini">暂无阶段模板</div>
          <div v-for="(item, index) in skillForm.stageTemplates" :key="`stage-${index}`" class="admin-skill-editor-card">
            <div class="admin-skill-editor-card__header">
              <div class="admin-skill-editor-card__title">
                <span class="admin-skill-editor-card__index">#{{ index + 1 }}</span>
                <div class="admin-skill-editor-card__title-main">
                  <strong>{{ item.stageLabel || item.stageKey || '未命名阶段' }}</strong>
                  <small>{{ getStageTemplateMeta(item) }}</small>
                </div>
                <span class="admin-skill-editor-card__badge" :class="item.isEnabled ? 'is-enabled' : 'is-disabled'">
                  {{ item.isEnabled ? '启用' : '禁用' }}
                </span>
              </div>
              <div class="admin-skill-editor-card__toolbar">
                <button class="admin-inline-button" type="button" :disabled="index === 0" @click="moveStageTemplate(index, 'up')">上移</button>
                <button class="admin-inline-button" type="button" :disabled="index === skillForm.stageTemplates.length - 1" @click="moveStageTemplate(index, 'down')">下移</button>
                <button class="admin-inline-button" type="button" @click="toggleTemplateItemCollapse('stage-items', index)">
                  {{ isTemplateItemCollapsed('stage-items', index) ? '展开' : '折叠' }}
                </button>
              </div>
            </div>
            <div v-if="isTemplateItemCollapsed('stage-items', index)" class="admin-skill-editor-card__preview">
              <div class="admin-skill-editor-card__preview-item">
                <span>阶段标识</span>
                <strong>{{ item.stageKey || '未设置' }}</strong>
              </div>
              <div class="admin-skill-editor-card__preview-item">
                <span>说明摘要</span>
                <strong>{{ getStageTemplateSummary(item.indicatorDescriptionTemplate) }}</strong>
              </div>
            </div>
            <div v-else class="admin-form__grid">
              <div class="admin-form__field">
                <label class="admin-form__label">阶段标识</label>
                <input v-model.trim="item.stageKey" class="admin-input" type="text">
              </div>
              <div class="admin-form__field">
                <label class="admin-form__label">阶段名称</label>
                <input v-model.trim="item.stageLabel" class="admin-input" type="text">
              </div>
              <div class="admin-form__field">
                <label class="admin-form__label">排序值</label>
                <input v-model.number="item.sortOrder" class="admin-input" type="number" min="0">
              </div>
              <div class="admin-form__field">
                <label class="admin-form__label">是否启用</label>
                <select v-model="item.isEnabled" class="admin-input">
                  <option :value="true">启用</option>
                  <option :value="false">禁用</option>
                </select>
              </div>
              <div class="admin-form__field admin-form__field--full">
                <label class="admin-form__label">指示器标题</label>
                <input v-model.trim="item.indicatorTitle" class="admin-input" type="text">
              </div>
              <div class="admin-form__field admin-form__field--full">
                <label class="admin-form__label">指示器描述模板</label>
                <textarea v-model="item.indicatorDescriptionTemplate" class="admin-textarea" placeholder="阶段说明文案"></textarea>
              </div>
            </div>
            <div class="admin-skill-editor-card__actions">
              <button class="admin-inline-button admin-inline-button--danger" type="button" @click="removeStageTemplate(index)">删除阶段</button>
            </div>
          </div>
          </template>
        </div>
          </div>

          <aside class="admin-skill-layout__aside">
            <section class="admin-skill-panel admin-skill-panel--sticky admin-skill-sidebar">
              <div class="admin-skill-panel__header">
                <div>
                  <h4>编辑侧栏</h4>
                  <p>把导航、摘要和快捷操作收敛到一处，减少长表单切换成本。</p>
                </div>
              </div>

              <div class="admin-skill-summary">
                <div class="admin-skill-summary__hero">
                  <div class="admin-provider-avatar">
                    <span>{{ getSkillInitial(skillForm.label || skillForm.skillKey) }}</span>
                  </div>
                  <div class="admin-skill-summary__hero-text">
                    <div class="admin-skill-summary__title">{{ skillForm.label || '未命名技能' }}</div>
                    <div class="admin-skill-summary__subtitle">{{ skillForm.skillKey || '请填写技能标识' }}</div>
                  </div>
                </div>

                <div class="admin-skill-summary__status-row">
                  <span class="admin-status" :class="skillForm.isEnabled ? 'admin-status--success' : 'admin-status--warning'">
                    {{ skillForm.isEnabled ? '已启用' : '已禁用' }}
                  </span>
                  <span class="admin-status" :class="skillForm.uiMode === 'WORKSPACE' ? 'admin-status--info' : 'admin-status--default'">
                    {{ skillForm.uiMode === 'WORKSPACE' ? '工作台' : '普通对话' }}
                  </span>
                </div>

                <div class="admin-skill-summary__grid">
                  <div class="admin-skill-summary__item">
                    <span class="admin-skill-summary__label">执行模式</span>
                    <strong>{{ skillForm.executionMode }}</strong>
                  </div>
                  <div class="admin-skill-summary__item">
                    <span class="admin-skill-summary__label">默认张数</span>
                    <strong>{{ skillForm.expectedImageCount || 0 }}</strong>
                  </div>
                  <div class="admin-skill-summary__item">
                    <span class="admin-skill-summary__label">工作流</span>
                    <strong>{{ skillForm.workflowType || '未设置' }}</strong>
                  </div>
                  <div class="admin-skill-summary__item">
                    <span class="admin-skill-summary__label">模板总数</span>
                    <strong>{{ totalTemplateCount }}</strong>
                  </div>
                </div>

                <div class="admin-skill-summary__list">
                  <div class="admin-skill-summary__row">
                    <span>运行时技能键</span>
                    <strong>{{ skillForm.workspaceSkillKey || skillForm.skillKey || '未设置' }}</strong>
                  </div>
                  <div class="admin-skill-summary__row">
                    <span>依赖技能</span>
                    <strong>{{ normalizedDependencySkillKeys.length ? normalizedDependencySkillKeys.join('、') : '无' }}</strong>
                  </div>
                  <div class="admin-skill-summary__row">
                    <span>图片模型</span>
                    <strong>{{ currentSkillImageModelSummary }}</strong>
                  </div>
                  <div v-if="isResearchReportSkill" class="admin-skill-summary__row">
                    <span>深度搜索</span>
                    <strong>{{ currentResearchSearchSummary }}</strong>
                  </div>
                  <div class="admin-skill-summary__row">
                    <span>提示词模板</span>
                    <strong>{{ enabledPromptCount }}/{{ skillForm.promptTemplates.length }}</strong>
                  </div>
                  <div class="admin-skill-summary__row">
                    <span>工作流模板</span>
                    <strong>{{ enabledWorkflowCount }}/{{ skillForm.workflowTemplates.length }}</strong>
                  </div>
                  <div class="admin-skill-summary__row">
                    <span>计划模板</span>
                    <strong>{{ enabledPlanCount }}/{{ skillForm.planTemplates.length }}</strong>
                  </div>
                  <div class="admin-skill-summary__row">
                    <span>阶段模板</span>
                    <strong>{{ enabledStageCount }}/{{ skillForm.stageTemplates.length }}</strong>
                  </div>
                </div>
              </div>

              <div class="admin-skill-sidebar__block">
                <div class="admin-skill-sidebar__block-header">
                  <h5>分区导航</h5>
                  <span>快速跳转</span>
                </div>
                <div class="admin-skill-nav">
                  <button
                    v-for="item in visibleSectionNavItems"
                    :key="item.key"
                    class="admin-skill-nav__item"
                    type="button"
                    @click="scrollToSection(item.anchorId)"
                  >
                    <span>{{ item.label }}</span>
                    <small>{{ getSectionCountText(item.key) }}</small>
                  </button>
                </div>
              </div>

              <div class="admin-skill-sidebar__block">
                <div class="admin-skill-sidebar__block-header">
                  <h5>快捷操作</h5>
                  <span>批量整理</span>
                </div>
                <div class="admin-skill-nav__footer">
                  <button class="admin-inline-button" type="button" @click="collapseAllTemplateSections">折叠全部模板区</button>
                  <button class="admin-inline-button" type="button" @click="expandAllSections">展开全部</button>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <div class="admin-form__footer admin-form__footer--sticky">
          <div class="admin-skill-footer__meta">
            <strong>{{ editingSkillKey ? '正在编辑技能' : '准备创建技能' }}</strong>
            <span>已配置 {{ totalTemplateCount }} 个模板项，保存按钮会始终固定在底部。</span>
          </div>
          <div class="admin-skill-footer__actions">
            <button class="admin-button admin-button--secondary" type="button" @click="closeDialog">取消</button>
            <button class="admin-button admin-button--primary" type="submit" :disabled="saving">
              {{ saving ? '保存中...' : editingSkillKey ? '保存技能' : '创建技能' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AdminEmptyState from '@/components/admin/common/AdminEmptyState.vue'
import AdminListFrame from '@/components/admin/common/AdminListFrame.vue'
import AdminListToolbar, { type AdminListToolbarFacet } from '@/components/admin/common/AdminListToolbar.vue'
import AdminPagination from '@/components/admin/common/AdminPagination.vue'
import AdminPageContainer from '@/components/admin/layout/AdminPageContainer.vue'
import { matchesAdminKeyword, useAdminListFilters } from '@/composables/useAdminListFilters'
import { useAdminPagination } from '@/composables/useAdminPagination'
import {
  createAdminSkill,
  deleteAdminSkill,
  getAdminSkillDetail,
  listAdminSkills,
  setAdminSkillEnabled,
  type AdminSkillDetail,
  type AdminSkillExecutionMode,
  type AdminSkillPayload,
  type AdminSkillPlannerModelCategory,
  type AdminSkillPromptScene,
  type AdminSkillUiMode,
} from '@/api/admin-skills'
import { listAdminProviders, type AdminProviderItem } from '@/api/admin-providers'
import { listAdminProviderModels, type AdminProviderModelItem } from '@/api/admin-models'
import { updateAdminSkill } from '@/api/admin-skills'

interface SkillPromptFormItem {
  scene: AdminSkillPromptScene
  systemPrompt: string
  userPromptTemplate: string
  isEnabled: boolean
}

interface SkillWorkflowFormItem {
  workflowLabel: string
  workflowType: string
  expectedImageCount: number
  workflowParamsTemplateJsonText: string
  isEnabled: boolean
}

interface SkillPlanFormItem {
  itemKey: string
  titleTemplate: string
  promptTemplate: string
  sortOrder: number
  isEnabled: boolean
}

interface SkillStageFormItem {
  stageKey: string
  stageLabel: string
  indicatorTitle: string
  indicatorDescriptionTemplate: string
  sortOrder: number
  isEnabled: boolean
}

type SkillSectionKey = 'basic' | 'runtime' | 'prompts' | 'workflows' | 'plans' | 'stages'
type SkillTemplateGroupKey = 'prompt-items' | 'workflow-items' | 'plan-items' | 'stage-items'
type SkillListUiModeFilter = 'ALL' | AdminSkillUiMode
type SkillListExecutionModeFilter = 'ALL' | AdminSkillExecutionMode
type SkillEditorTabKey = 'basic-runtime' | 'templates' | 'plan-stage'

const filters = reactive({
  keyword: '',
  status: 'ALL' as 'ALL' | 'ENABLED' | 'DISABLED',
  uiMode: 'ALL' as SkillListUiModeFilter,
  executionMode: 'ALL' as SkillListExecutionModeFilter,
  category: 'ALL',
})
const filterDefaults = {
  keyword: '',
  status: 'ALL' as 'ALL' | 'ENABLED' | 'DISABLED',
  uiMode: 'ALL' as SkillListUiModeFilter,
  executionMode: 'ALL' as SkillListExecutionModeFilter,
  category: 'ALL',
}
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingSkillKey = ref('')
const activeEditorTab = ref<SkillEditorTabKey>('basic-runtime')
const togglingSkillKeys = ref<Set<string>>(new Set())
const collapsedSectionKeys = ref<Set<SkillSectionKey>>(new Set())
const collapsedTemplateItemKeys = ref<Set<string>>(new Set())
const skills = ref<AdminSkillDetail['skill'][]>([])
const skillDetailMap = ref<Record<string, AdminSkillDetail>>({})
const providerOptions = ref<AdminProviderItem[]>([])
const providerImageModelMap = ref<Record<string, AdminProviderModelItem[]>>({})
const providerChatModelMap = ref<Record<string, AdminProviderModelItem[]>>({})
const RESEARCH_REPORT_SKILL_KEY = 'research-report'
const { activeFilterCount, resetFilters } = useAdminListFilters({
  filters,
  defaults: filterDefaults,
})

const handleFacetUpdate = ({ key, value }: { key: string; value: string }) => {
  if (key === 'status') filters.status = value as typeof filters.status
  else if (key === 'uiMode') filters.uiMode = value as typeof filters.uiMode
  else if (key === 'executionMode') filters.executionMode = value as typeof filters.executionMode
  else if (key === 'category') filters.category = value as typeof filters.category
}

const { pagination, sliceItems, resetPage } = useAdminPagination({
  initialPageSize: 12,
})

const sectionNavItems: Array<{ key: SkillSectionKey; label: string; anchorId: string }> = [
  { key: 'basic', label: '基础信息', anchorId: 'skill-section-basic' },
  { key: 'runtime', label: '运行配置', anchorId: 'skill-section-runtime' },
  { key: 'prompts', label: '提示词模板', anchorId: 'skill-section-prompts' },
  { key: 'workflows', label: '工作流模板', anchorId: 'skill-section-workflows' },
  { key: 'plans', label: '计划模板', anchorId: 'skill-section-plans' },
  { key: 'stages', label: '阶段模板', anchorId: 'skill-section-stages' },
]
const editorTabs: Array<{ key: SkillEditorTabKey; label: string; sections: SkillSectionKey[] }> = [
  { key: 'basic-runtime', label: '基础与运行', sections: ['basic', 'runtime'] },
  { key: 'templates', label: '提示词与工作流', sections: ['prompts', 'workflows'] },
  { key: 'plan-stage', label: '计划与阶段', sections: ['plans', 'stages'] },
]

const skillForm = reactive({
  providerId: '',
  skillKey: '',
  label: '',
  description: '',
  iconType: '',
  category: '',
  uiMode: 'WORKSPACE' as AdminSkillUiMode,
  executionMode: 'PLANNER_THEN_GENERATE' as AdminSkillExecutionMode,
  workflowType: 'text_to_image',
  plannerModelCategory: 'CHAT' as AdminSkillPlannerModelCategory,
  expectedImageCount: 4,
  isEnabled: true,
  isBuiltIn: false,
  sortOrder: 0,
  workspaceSkillKey: '',
  imageModelProviderId: '',
  imageModelKey: '',
  researchSearchProviderId: '',
  researchSearchModelKey: '',
  dependencySkillKeysText: '',
  configJsonText: '',
  promptTemplates: [] as SkillPromptFormItem[],
  workflowTemplates: [] as SkillWorkflowFormItem[],
  planTemplates: [] as SkillPlanFormItem[],
  stageTemplates: [] as SkillStageFormItem[],
})

const filteredSkills = computed(() => {
  return skills.value.filter((item) => {
    const matchedKeyword = matchesAdminKeyword(filters.keyword, [item.label, item.skillKey, item.category])

    const matchedStatus = filters.status === 'ALL'
      || (filters.status === 'ENABLED' && item.isEnabled)
      || (filters.status === 'DISABLED' && !item.isEnabled)

    const matchedUiMode = filters.uiMode === 'ALL'
      || item.uiMode === filters.uiMode

    const matchedExecutionMode = filters.executionMode === 'ALL'
      || item.executionMode === filters.executionMode

    const matchedCategory = filters.category === 'ALL'
      || item.category === filters.category

    return matchedKeyword && matchedStatus && matchedUiMode && matchedExecutionMode && matchedCategory
  })
})
const paginatedSkills = computed(() => sliceItems(filteredSkills.value))
const executionModeOptions = computed(() => {
  return Array.from(new Set(skills.value.map(item => item.executionMode).filter(Boolean)))
})
const categoryOptions = computed(() => {
  return Array.from(new Set(skills.value.map(item => item.category).filter(Boolean))).sort((left, right) => left.localeCompare(right, 'zh-CN'))
})

const listFacets = computed<AdminListToolbarFacet[]>(() => [
  {
    key: 'status',
    title: '技能状态',
    options: [
      { label: '已启用', value: 'ENABLED' },
      { label: '已禁用', value: 'DISABLED' },
    ],
    modelValue: filters.status,
    emptyValue: 'ALL',
  },
  {
    key: 'uiMode',
    title: '界面模式',
    options: [
      { label: '工作台', value: 'WORKSPACE' },
      { label: '普通对话', value: 'PLAIN_CHAT' },
    ],
    modelValue: filters.uiMode,
    emptyValue: 'ALL',
  },
  {
    key: 'executionMode',
    title: '执行模式',
    options: executionModeOptions.value.map((item) => ({ label: item, value: item })),
    modelValue: filters.executionMode,
    emptyValue: 'ALL',
  },
  {
    key: 'category',
    title: '技能分类',
    options: categoryOptions.value.map((item) => ({ label: item, value: item })),
    modelValue: filters.category,
    emptyValue: 'ALL',
  },
])

const imageModelProviderOptions = computed(() => {
  return providerOptions.value.filter((provider) => {
    const models = providerImageModelMap.value[provider.id] || []
    return models.length > 0
  })
})
const isResearchReportSkill = computed(() => skillForm.skillKey.trim() === RESEARCH_REPORT_SKILL_KEY)
const researchSearchProviderOptions = computed(() => {
  return providerOptions.value.filter((provider) => {
    const models = providerChatModelMap.value[provider.id] || []
    return models.length > 0
  })
})
const currentImageModelOptions = computed(() => {
  if (!skillForm.imageModelProviderId) {
    return []
  }
  return providerImageModelMap.value[skillForm.imageModelProviderId] || []
})
const currentResearchSearchModelOptions = computed(() => {
  if (!skillForm.researchSearchProviderId) {
    return []
  }
  return providerChatModelMap.value[skillForm.researchSearchProviderId] || []
})
const currentSkillImageModelSummary = computed(() => {
  return formatImageModelSummary(skillForm.imageModelProviderId, skillForm.imageModelKey)
})
const currentResearchSearchSummary = computed(() => {
  return formatResearchSearchSummary(skillForm.researchSearchProviderId, skillForm.researchSearchModelKey)
})
const visibleSectionNavItems = computed(() => {
  const currentTab = editorTabs.find(item => item.key === activeEditorTab.value)
  if (!currentTab) {
    return sectionNavItems
  }
  return sectionNavItems.filter(item => currentTab.sections.includes(item.key))
})

const normalizedDependencySkillKeys = computed(() => parseDependencySkillKeys(skillForm.dependencySkillKeysText))
const enabledPromptCount = computed(() => skillForm.promptTemplates.filter(item => item.isEnabled).length)
const enabledWorkflowCount = computed(() => skillForm.workflowTemplates.filter(item => item.isEnabled).length)
const enabledPlanCount = computed(() => skillForm.planTemplates.filter(item => item.isEnabled).length)
const enabledStageCount = computed(() => skillForm.stageTemplates.filter(item => item.isEnabled).length)
const totalTemplateCount = computed(() => (
  skillForm.promptTemplates.length
  + skillForm.workflowTemplates.length
  + skillForm.planTemplates.length
  + skillForm.stageTemplates.length
))

const getPromptCount = (skillKey: string) => skillDetailMap.value[skillKey]?.prompts.length || 0
const getWorkflowCount = (skillKey: string) => skillDetailMap.value[skillKey]?.workflowTemplates.length || 0
const getPlanCount = (skillKey: string) => skillDetailMap.value[skillKey]?.planTemplates.length || 0
const getStageCount = (skillKey: string) => skillDetailMap.value[skillKey]?.stageTemplates.length || 0

const formatImageModelSummary = (providerId?: string, modelKey?: string) => {
  const normalizedProviderId = String(providerId || '').trim()
  const normalizedModelKey = String(modelKey || '').trim()
  if (!normalizedProviderId || !normalizedModelKey) {
    return '跟随默认图片模型'
  }

  const provider = providerOptions.value.find(item => item.id === normalizedProviderId)
  const matchedModel = (providerImageModelMap.value[normalizedProviderId] || []).find(item => item.modelKey === normalizedModelKey)
  const modelLabel = matchedModel?.label || normalizedModelKey
  const providerLabel = provider?.name || normalizedProviderId

  return `${providerLabel} / ${modelLabel}`
}

const getSkillImageModelSummary = (skillKey: string) => {
  const detail = skillDetailMap.value[skillKey]
  const configJson = detail?.skill?.configJson as Record<string, unknown> | null | undefined
  const providerId = String(
    (configJson?.imageModelBinding as Record<string, unknown> | undefined)?.providerId
    || configJson?.imageModelProviderId
    || '',
  ).trim()
  const modelKey = String(
    (configJson?.imageModelBinding as Record<string, unknown> | undefined)?.modelKey
    || configJson?.imageModelKey
    || '',
  ).trim()

  return formatImageModelSummary(providerId, modelKey)
}

const formatResearchSearchSummary = (providerId?: string, modelKey?: string) => {
  const normalizedProviderId = String(providerId || '').trim()
  const normalizedModelKey = String(modelKey || '').trim()
  if (!normalizedProviderId || !normalizedModelKey) {
    return '未配置深度搜索'
  }

  const provider = providerOptions.value.find(item => item.id === normalizedProviderId)
  const matchedModel = (providerChatModelMap.value[normalizedProviderId] || []).find(item => item.modelKey === normalizedModelKey)
  const modelLabel = matchedModel?.label || normalizedModelKey
  const providerLabel = provider?.name || normalizedProviderId

  return `${providerLabel} / ${modelLabel}`
}

const getSkillResearchSearchSummary = (skillKey: string) => {
  const detail = skillDetailMap.value[skillKey]
  const configJson = detail?.skill?.configJson as Record<string, unknown> | null | undefined
  const researchSearch = configJson?.researchSearch as Record<string, unknown> | undefined
  const providerId = String(
    researchSearch?.providerId
    || researchSearch?.provider_id
    || configJson?.researchSearchProviderId
    || configJson?.research_search_provider_id
    || '',
  ).trim()
  const modelKey = String(
    researchSearch?.model
    || researchSearch?.modelKey
    || researchSearch?.model_key
    || configJson?.researchSearchModel
    || configJson?.research_search_model
    || '',
  ).trim()

  return formatResearchSearchSummary(providerId, modelKey)
}

const getSkillInitial = (label: string) => String(label || '').trim().slice(0, 1).toUpperCase() || 'S'
const isSkillToggling = (skillKey: string) => togglingSkillKeys.value.has(skillKey)

const buildInlineSummary = (value: string, fallback = '暂无内容') => {
  const normalizedValue = String(value || '').replace(/\s+/g, ' ').trim()
  if (!normalizedValue) {
    return fallback
  }
  return normalizedValue.length > 48 ? `${normalizedValue.slice(0, 48)}…` : normalizedValue
}

const getPromptTemplateMeta = (item: SkillPromptFormItem) => {
  return item.scene === 'PLANNER' ? '规划阶段提示词' : '对话阶段提示词'
}

const getPromptTemplateSummary = (value: string) => {
  return buildInlineSummary(value)
}

const getWorkflowTemplateMeta = (item: SkillWorkflowFormItem) => {
  const workflowType = item.workflowType.trim() || '未设置类型'
  return `${workflowType} · ${Number(item.expectedImageCount) || 0} 张`
}

const getWorkflowTemplateSummary = (value: string) => {
  return buildInlineSummary(value, '暂无参数模板')
}

const getPlanTemplateMeta = (item: SkillPlanFormItem) => {
  const itemKey = item.itemKey.trim() || '未设置标识'
  return `${itemKey} · 排序 ${Number(item.sortOrder) || 0}`
}

const getPlanTemplateSummary = (value: string) => {
  return buildInlineSummary(value)
}

const getStageTemplateMeta = (item: SkillStageFormItem) => {
  const stageKey = item.stageKey.trim() || '未设置标识'
  return `${stageKey} · 排序 ${Number(item.sortOrder) || 0}`
}

const getStageTemplateSummary = (value: string) => {
  return buildInlineSummary(value)
}

const getSectionTabKey = (sectionKey: SkillSectionKey): SkillEditorTabKey => {
  if (sectionKey === 'basic' || sectionKey === 'runtime') {
    return 'basic-runtime'
  }
  if (sectionKey === 'prompts' || sectionKey === 'workflows') {
    return 'templates'
  }
  return 'plan-stage'
}

const switchEditorTab = (tabKey: SkillEditorTabKey) => {
  activeEditorTab.value = tabKey
}

const isSectionCollapsed = (key: SkillSectionKey) => collapsedSectionKeys.value.has(key)

const buildTemplateItemCollapseKey = (groupKey: SkillTemplateGroupKey, index: number) => `${groupKey}-${index}`

const isTemplateItemCollapsed = (groupKey: SkillTemplateGroupKey, index: number) => {
  return collapsedTemplateItemKeys.value.has(buildTemplateItemCollapseKey(groupKey, index))
}

const toggleTemplateItemCollapse = (groupKey: SkillTemplateGroupKey, index: number) => {
  const key = buildTemplateItemCollapseKey(groupKey, index)
  const next = new Set(collapsedTemplateItemKeys.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  collapsedTemplateItemKeys.value = next
}

const resetTemplateItemCollapse = () => {
  collapsedTemplateItemKeys.value = new Set()
}

const toggleSectionCollapse = (key: SkillSectionKey) => {
  const next = new Set(collapsedSectionKeys.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  collapsedSectionKeys.value = next
}

const collapseAllTemplateSections = () => {
  collapsedSectionKeys.value = new Set<SkillSectionKey>(['prompts', 'workflows', 'plans', 'stages'])
}

const expandAllSections = () => {
  collapsedSectionKeys.value = new Set()
}

const scrollToSection = (anchorId: string) => {
  const navItem = sectionNavItems.find(item => item.anchorId === anchorId)
  if (navItem) {
    activeEditorTab.value = getSectionTabKey(navItem.key)
  }

  const target = document.getElementById(anchorId)
  if (!target) {
    return
  }

  window.requestAnimationFrame(() => {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  })
}

const getSectionCountText = (key: SkillSectionKey) => {
  switch (key) {
    case 'prompts':
      return `${enabledPromptCount.value}/${skillForm.promptTemplates.length}`
    case 'workflows':
      return `${enabledWorkflowCount.value}/${skillForm.workflowTemplates.length}`
    case 'plans':
      return `${enabledPlanCount.value}/${skillForm.planTemplates.length}`
    case 'stages':
      return `${enabledStageCount.value}/${skillForm.stageTemplates.length}`
    case 'basic':
      return skillForm.skillKey.trim() ? '已填写' : '待填写'
    case 'runtime':
      return normalizedDependencySkillKeys.value.length ? `${normalizedDependencySkillKeys.value.length} 个依赖` : '无依赖'
    default:
      return ''
  }
}

const getTabCountText = (tabKey: SkillEditorTabKey) => {
  switch (tabKey) {
    case 'basic-runtime':
      return skillForm.skillKey.trim() ? '基础已配置' : '待补充'
    case 'templates':
      return `${skillForm.promptTemplates.length + skillForm.workflowTemplates.length} 项`
    case 'plan-stage':
      return `${skillForm.planTemplates.length + skillForm.stageTemplates.length} 项`
    default:
      return ''
  }
}

const resetListFilters = () => {
  resetFilters()
  resetPage()
}

watch(() => [filters.keyword, filters.status, filters.uiMode, filters.executionMode, filters.category] as const, () => {
  resetPage()
})

const updateLocalSkillDetail = (detail: AdminSkillDetail) => {
  skillDetailMap.value = {
    ...skillDetailMap.value,
    [detail.skill.skillKey]: detail,
  }
  skills.value = skills.value.map(item => item.skillKey === detail.skill.skillKey ? detail.skill : item)
}

const resetForm = () => {
  activeEditorTab.value = 'basic-runtime'
  collapsedSectionKeys.value = new Set()
  resetTemplateItemCollapse()
  skillForm.providerId = ''
  skillForm.skillKey = ''
  skillForm.label = ''
  skillForm.description = ''
  skillForm.iconType = ''
  skillForm.category = ''
  skillForm.uiMode = 'WORKSPACE'
  skillForm.executionMode = 'PLANNER_THEN_GENERATE'
  skillForm.workflowType = 'text_to_image'
  skillForm.plannerModelCategory = 'CHAT'
  skillForm.expectedImageCount = 4
  skillForm.isEnabled = true
  skillForm.isBuiltIn = false
  skillForm.sortOrder = 0
  skillForm.workspaceSkillKey = ''
  skillForm.imageModelProviderId = ''
  skillForm.imageModelKey = ''
  skillForm.researchSearchProviderId = ''
  skillForm.researchSearchModelKey = ''
  skillForm.dependencySkillKeysText = ''
  skillForm.configJsonText = ''
  skillForm.promptTemplates = []
  skillForm.workflowTemplates = []
  skillForm.planTemplates = []
  skillForm.stageTemplates = []
}

const stringifyJson = (value: Record<string, unknown> | null | undefined) => {
  if (!value || typeof value !== 'object') {
    return ''
  }
  return JSON.stringify(value, null, 2)
}

const parseOptionalJson = (value: string, fieldLabel: string) => {
  const trimmedValue = String(value || '').trim()
  if (!trimmedValue) {
    return null
  }

  try {
    const parsed = JSON.parse(trimmedValue)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('必须是对象')
    }
    return parsed as Record<string, unknown>
  } catch {
    throw new Error(`${fieldLabel} 必须是合法的 JSON 对象`)
  }
}

const parseDependencySkillKeys = (value: string) => {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

const buildConfigJson = () => {
  const configJson = parseOptionalJson(skillForm.configJsonText, '扩展配置 JSON') || {}
  const nextConfigJson: Record<string, unknown> = { ...configJson }

  if (skillForm.workspaceSkillKey.trim()) {
    nextConfigJson.workspaceSkillKey = skillForm.workspaceSkillKey.trim()
  } else {
    delete nextConfigJson.workspaceSkillKey
  }

  if (skillForm.imageModelProviderId.trim() && skillForm.imageModelKey.trim()) {
    nextConfigJson.imageModelProviderId = skillForm.imageModelProviderId.trim()
    nextConfigJson.imageModelKey = skillForm.imageModelKey.trim()
    nextConfigJson.imageModelBinding = {
      providerId: skillForm.imageModelProviderId.trim(),
      modelKey: skillForm.imageModelKey.trim(),
    }
  } else {
    delete nextConfigJson.imageModelProviderId
    delete nextConfigJson.imageModelKey
    delete nextConfigJson.imageModelBinding
  }

  delete nextConfigJson.researchSearchProvider
  delete nextConfigJson.research_search_provider
  delete nextConfigJson.researchSearchProviderId
  delete nextConfigJson.research_search_provider_id
  delete nextConfigJson.researchSearchModel
  delete nextConfigJson.research_search_model
  delete nextConfigJson.researchSearchBaseUrl
  delete nextConfigJson.research_search_base_url
  delete nextConfigJson.researchSearchApiKey
  delete nextConfigJson.research_search_api_key

  if (skillForm.skillKey.trim() === RESEARCH_REPORT_SKILL_KEY) {
    const researchSearchProviderId = skillForm.researchSearchProviderId.trim()
    const researchSearchModelKey = skillForm.researchSearchModelKey.trim()
    if (!researchSearchProviderId || !researchSearchModelKey) {
      throw new Error('深度研究报告必须选择深度搜索供应商和模型')
    }

    const oldResearchSearch = (
      nextConfigJson.researchSearch
      && typeof nextConfigJson.researchSearch === 'object'
      && !Array.isArray(nextConfigJson.researchSearch)
    ) ? nextConfigJson.researchSearch as Record<string, unknown> : {}

    delete oldResearchSearch.baseUrl
    delete oldResearchSearch.base_url
    delete oldResearchSearch.apiKey
    delete oldResearchSearch.api_key

    nextConfigJson.researchSearch = {
      ...oldResearchSearch,
      provider: 'grok2api',
      providerId: researchSearchProviderId,
      model: researchSearchModelKey,
    }
    delete nextConfigJson.research_search
  } else {
    delete nextConfigJson.researchSearch
    delete nextConfigJson.research_search
  }

  const dependencySkillKeys = parseDependencySkillKeys(skillForm.dependencySkillKeysText)
  if (dependencySkillKeys.length) {
    nextConfigJson.dependencySkillKeys = dependencySkillKeys
  } else {
    delete nextConfigJson.dependencySkillKeys
  }

  return Object.keys(nextConfigJson).length ? nextConfigJson : null
}

const buildPayload = (): AdminSkillPayload => ({
  providerId: skillForm.providerId.trim(),
  skillKey: skillForm.skillKey.trim(),
  label: skillForm.label.trim(),
  description: skillForm.description.trim(),
  iconType: skillForm.iconType.trim(),
  category: skillForm.category.trim(),
  uiMode: skillForm.uiMode,
  executionMode: skillForm.executionMode,
  workflowType: skillForm.workflowType.trim(),
  plannerModelCategory: skillForm.plannerModelCategory,
  expectedImageCount: Number(skillForm.expectedImageCount) || 0,
  isEnabled: Boolean(skillForm.isEnabled),
  isBuiltIn: Boolean(skillForm.isBuiltIn),
  sortOrder: Number(skillForm.sortOrder) || 0,
  configJson: buildConfigJson(),
  dependencySkillKeys: parseDependencySkillKeys(skillForm.dependencySkillKeysText),
  promptTemplates: skillForm.promptTemplates.map(item => ({
    scene: item.scene,
    systemPrompt: item.systemPrompt,
    userPromptTemplate: item.userPromptTemplate,
    isEnabled: Boolean(item.isEnabled),
  })),
  workflowTemplates: skillForm.workflowTemplates.map(item => ({
    workflowLabel: item.workflowLabel.trim(),
    workflowType: item.workflowType.trim(),
    expectedImageCount: Number(item.expectedImageCount) || 0,
    workflowParamsTemplateJson: parseOptionalJson(item.workflowParamsTemplateJsonText, '工作流参数模板 JSON'),
    isEnabled: Boolean(item.isEnabled),
  })),
  planTemplates: skillForm.planTemplates.map(item => ({
    itemKey: item.itemKey.trim(),
    titleTemplate: item.titleTemplate.trim(),
    promptTemplate: item.promptTemplate,
    sortOrder: Number(item.sortOrder) || 0,
    isEnabled: Boolean(item.isEnabled),
  })),
  stageTemplates: skillForm.stageTemplates.map(item => ({
    stageKey: item.stageKey.trim(),
    stageLabel: item.stageLabel.trim(),
    indicatorTitle: item.indicatorTitle.trim(),
    indicatorDescriptionTemplate: item.indicatorDescriptionTemplate,
    sortOrder: Number(item.sortOrder) || 0,
    isEnabled: Boolean(item.isEnabled),
  })),
})

const applyDetailToForm = (detail: AdminSkillDetail) => {
  const configJson = detail.skill.configJson || {}

  skillForm.providerId = detail.skill.providerId || ''
  skillForm.skillKey = detail.skill.skillKey
  skillForm.label = detail.skill.label
  skillForm.description = detail.skill.description || ''
  skillForm.iconType = detail.skill.iconType || ''
  skillForm.category = detail.skill.category || ''
  skillForm.uiMode = detail.skill.uiMode
  skillForm.executionMode = detail.skill.executionMode
  skillForm.workflowType = detail.skill.workflowType || ''
  skillForm.plannerModelCategory = detail.skill.plannerModelCategory
  skillForm.expectedImageCount = detail.skill.expectedImageCount
  skillForm.isEnabled = detail.skill.isEnabled
  skillForm.isBuiltIn = detail.skill.isBuiltIn
  skillForm.sortOrder = detail.skill.sortOrder
  skillForm.workspaceSkillKey = String(configJson.workspaceSkillKey || '').trim()
  skillForm.imageModelProviderId = String(
    (configJson.imageModelBinding as Record<string, unknown> | undefined)?.providerId
    || configJson.imageModelProviderId
    || '',
  ).trim()
  skillForm.imageModelKey = String(
    (configJson.imageModelBinding as Record<string, unknown> | undefined)?.modelKey
    || configJson.imageModelKey
    || '',
  ).trim()
  const researchSearch = configJson.researchSearch as Record<string, unknown> | undefined
  skillForm.researchSearchProviderId = String(
    researchSearch?.providerId
    || researchSearch?.provider_id
    || configJson.researchSearchProviderId
    || configJson.research_search_provider_id
    || '',
  ).trim()
  skillForm.researchSearchModelKey = String(
    researchSearch?.model
    || researchSearch?.modelKey
    || researchSearch?.model_key
    || configJson.researchSearchModel
    || configJson.research_search_model
    || '',
  ).trim()
  skillForm.dependencySkillKeysText = (
    Array.isArray(configJson.dependencySkillKeys)
      ? configJson.dependencySkillKeys
      : detail.dependencies.map(item => item.dependencySkillKey)
  ).map(item => String(item || '').trim()).filter(Boolean).join(', ')
  skillForm.configJsonText = stringifyJson(configJson)
  skillForm.promptTemplates = detail.prompts.map(item => ({
    scene: item.scene,
    systemPrompt: item.systemPrompt,
    userPromptTemplate: item.userPromptTemplate,
    isEnabled: item.isEnabled,
  }))
  skillForm.workflowTemplates = detail.workflowTemplates.map(item => ({
    workflowLabel: item.workflowLabel,
    workflowType: item.workflowType,
    expectedImageCount: item.expectedImageCount,
    workflowParamsTemplateJsonText: stringifyJson(item.workflowParamsTemplateJson),
    isEnabled: item.isEnabled,
  }))
  skillForm.planTemplates = detail.planTemplates.map(item => ({
    itemKey: item.itemKey,
    titleTemplate: item.titleTemplate,
    promptTemplate: item.promptTemplate,
    sortOrder: item.sortOrder,
    isEnabled: item.isEnabled,
  }))
  skillForm.stageTemplates = detail.stageTemplates.map(item => ({
    stageKey: item.stageKey,
    stageLabel: item.stageLabel,
    indicatorTitle: item.indicatorTitle,
    indicatorDescriptionTemplate: item.indicatorDescriptionTemplate,
    sortOrder: item.sortOrder,
    isEnabled: item.isEnabled,
  }))
}

const loadProviders = async () => {
  providerOptions.value = await listAdminProviders()
  const modelEntries = await Promise.all(providerOptions.value.map(async (provider) => {
    try {
      const result = await listAdminProviderModels(provider.id)
      return {
        providerId: provider.id,
        imageModels: result.models.filter(model => model.category === 'IMAGE' && model.isEnabled),
        chatModels: result.models.filter(model => model.category === 'CHAT' && model.isEnabled),
      }
    } catch {
      return {
        providerId: provider.id,
        imageModels: [] as AdminProviderModelItem[],
        chatModels: [] as AdminProviderModelItem[],
      }
    }
  }))

  providerImageModelMap.value = modelEntries.reduce<Record<string, AdminProviderModelItem[]>>((result, item) => {
    result[item.providerId] = item.imageModels
    return result
  }, {})
  providerChatModelMap.value = modelEntries.reduce<Record<string, AdminProviderModelItem[]>>((result, item) => {
    result[item.providerId] = item.chatModels
    return result
  }, {})
}

const loadSkillList = async () => {
  loading.value = true
  try {
    skills.value = await listAdminSkills()
    const details = await Promise.all(
      skills.value.map(item => getAdminSkillDetail(item.skillKey).catch(() => null)),
    )
    skillDetailMap.value = details.reduce<Record<string, AdminSkillDetail>>((result, item) => {
      if (item) {
        result[item.skill.skillKey] = item
      }
      return result
    }, {})
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  editingSkillKey.value = ''
  resetForm()
  addPromptTemplate()
  addWorkflowTemplate()
  dialogVisible.value = true
}

const openEditDialog = async (skillKey: string) => {
  saving.value = true
  try {
    const detail = await getAdminSkillDetail(skillKey)
    editingSkillKey.value = skillKey
    resetForm()
    applyDetailToForm(detail)
    dialogVisible.value = true
  } finally {
    saving.value = false
  }
}

watch(() => skillForm.imageModelProviderId, (providerId) => {
  const currentModels = providerId ? (providerImageModelMap.value[providerId] || []) : []
  if (currentModels.some(model => model.modelKey === skillForm.imageModelKey)) {
    return
  }
  skillForm.imageModelKey = ''
})

watch(() => skillForm.researchSearchProviderId, (providerId) => {
  const currentModels = providerId ? (providerChatModelMap.value[providerId] || []) : []
  if (currentModels.some(model => model.modelKey === skillForm.researchSearchModelKey)) {
    return
  }
  skillForm.researchSearchModelKey = ''
})

const closeDialog = () => {
  dialogVisible.value = false
  editingSkillKey.value = ''
  resetForm()
}

const addPromptTemplate = () => {
  skillForm.promptTemplates.push({
    scene: 'CHAT',
    systemPrompt: '',
    userPromptTemplate: '',
    isEnabled: true,
  })
}

const removePromptTemplate = (index: number) => {
  skillForm.promptTemplates.splice(index, 1)
  resetTemplateItemCollapse()
}

const addWorkflowTemplate = () => {
  skillForm.workflowTemplates.push({
    workflowLabel: '',
    workflowType: skillForm.workflowType || 'text_to_image',
    expectedImageCount: skillForm.expectedImageCount || 4,
    workflowParamsTemplateJsonText: '',
    isEnabled: true,
  })
}

const removeWorkflowTemplate = (index: number) => {
  skillForm.workflowTemplates.splice(index, 1)
  resetTemplateItemCollapse()
}

const addPlanTemplate = () => {
  skillForm.planTemplates.push({
    itemKey: '',
    titleTemplate: '',
    promptTemplate: '',
    sortOrder: 0,
    isEnabled: true,
  })
}

const removePlanTemplate = (index: number) => {
  skillForm.planTemplates.splice(index, 1)
  resetTemplateItemCollapse()
}

const addStageTemplate = () => {
  skillForm.stageTemplates.push({
    stageKey: '',
    stageLabel: '',
    indicatorTitle: '',
    indicatorDescriptionTemplate: '',
    sortOrder: 0,
    isEnabled: true,
  })
}

const removeStageTemplate = (index: number) => {
  skillForm.stageTemplates.splice(index, 1)
  resetTemplateItemCollapse()
}

const moveArrayItem = <T,>(list: T[], fromIndex: number, toIndex: number) => {
  if (toIndex < 0 || toIndex >= list.length || fromIndex === toIndex) {
    return
  }

  const nextItem = list.splice(fromIndex, 1)[0]
  list.splice(toIndex, 0, nextItem)
  resetTemplateItemCollapse()
}

const movePromptTemplate = (index: number, direction: 'up' | 'down') => {
  moveArrayItem(skillForm.promptTemplates, index, direction === 'up' ? index - 1 : index + 1)
}

const moveWorkflowTemplate = (index: number, direction: 'up' | 'down') => {
  moveArrayItem(skillForm.workflowTemplates, index, direction === 'up' ? index - 1 : index + 1)
}

const movePlanTemplate = (index: number, direction: 'up' | 'down') => {
  moveArrayItem(skillForm.planTemplates, index, direction === 'up' ? index - 1 : index + 1)
}

const moveStageTemplate = (index: number, direction: 'up' | 'down') => {
  moveArrayItem(skillForm.stageTemplates, index, direction === 'up' ? index - 1 : index + 1)
}

const handleSaveSkill = async () => {
  saving.value = true
  try {
    const payload = buildPayload()
    if (editingSkillKey.value) {
      await updateAdminSkill(editingSkillKey.value, payload)
    } else {
      await createAdminSkill(payload)
    }
    await loadSkillList()
    closeDialog()
  } finally {
    saving.value = false
  }
}

const handleDeleteSkill = async (skill: AdminSkillDetail['skill']) => {
  if (skill.isBuiltIn) {
    return
  }

  if (!window.confirm(`确认删除技能“${skill.label}”吗？删除后全部模板将一起移除。`)) {
    return
  }

  await deleteAdminSkill(skill.skillKey)
  await loadSkillList()
}

const handleToggleSkillEnabled = async (skill: AdminSkillDetail['skill']) => {
  const next = new Set(togglingSkillKeys.value)
  next.add(skill.skillKey)
  togglingSkillKeys.value = next

  try {
    const detail = await setAdminSkillEnabled(skill.skillKey, !skill.isEnabled)
    updateLocalSkillDetail(detail)
  } finally {
    const current = new Set(togglingSkillKeys.value)
    current.delete(skill.skillKey)
    togglingSkillKeys.value = current
  }
}

const handleCloneSkill = async (skillKey: string) => {
  saving.value = true
  try {
    const detail = skillDetailMap.value[skillKey] || await getAdminSkillDetail(skillKey)
    editingSkillKey.value = ''
    resetForm()
    applyDetailToForm(detail)
    skillForm.skillKey = `${detail.skill.skillKey}-copy`
    skillForm.label = `${detail.skill.label}（副本）`
    skillForm.isBuiltIn = false
    dialogVisible.value = true
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadSkillList(),
    loadProviders(),
  ])
})
</script>

<style scoped>
.admin-skill-tile {
  gap: 16px;
}

.admin-skill-tile__desc {
  min-height: 44px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.admin-skill-tile__binding {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--bg-surface-secondary, #00000008);
}

.admin-skill-tile__binding span {
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-skill-tile__binding strong {
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.admin-skill-tile__meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-status--toggle {
  border: none;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: transform .2s ease, opacity .2s ease, box-shadow .2s ease, filter .2s ease;
}

.admin-status--toggle:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(15, 15, 18, 0.08);
  filter: saturate(1.05);
}

.admin-status--toggle:disabled {
  cursor: not-allowed;
}

.admin-status--toggle.is-loading {
  opacity: .78;
}

.admin-skill-tile__actions {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--line-divider, #00000014);
}

.admin-skill-toolbar {
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  padding: 18px 20px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 18px;
  background: var(--bg-surface);
  box-shadow: 0 8px 30px rgba(15, 15, 18, 0.04);
}

.admin-skill-toolbar__filters {
  display: grid;
  grid-template-columns: minmax(220px, 1.4fr) repeat(4, minmax(140px, 1fr));
  gap: 12px;
}

.admin-skill-toolbar__search-wrap {
  position: relative;
}

.admin-skill-toolbar__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.admin-skill-toolbar__summary {
  color: var(--text-secondary);
  font-size: 13px;
}

.admin-skill-toolbar__summary em {
  color: var(--text-tertiary);
  font-style: normal;
}

.admin-skill-toolbar__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.admin-dialog--skill-form {
  width: min(1120px, calc(100vw - 40px));
  max-height: calc(100vh - 32px);
}

.admin-skill-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 20px;
}

.admin-skill-layout__main {
  min-width: 0;
}

.admin-skill-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
  padding: 8px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 18px;
  background: color-mix(in srgb, var(--bg-surface) 86%, var(--bg-block-secondary-default));
}

.admin-skill-tabs__item {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color .2s ease, color .2s ease, border-color .2s ease, transform .2s ease, box-shadow .2s ease;
}

.admin-skill-tabs__item:hover {
  background: var(--bg-block-secondary-default);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.admin-skill-tabs__item.is-active {
  border-color: color-mix(in srgb, var(--brand-main-default) 30%, transparent);
  background: color-mix(in srgb, var(--brand-main-default) 16%, transparent);
  color: var(--brand-main-default);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand-main-default) 14%, transparent);
}

.admin-skill-tabs__item span {
  font-size: 13px;
  font-weight: 600;
}

.admin-skill-tabs__item small {
  color: inherit;
  opacity: .78;
  font-size: 12px;
}

.admin-skill-field-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.admin-skill-field-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.admin-skill-field-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--line-divider, #00000014);
}

.admin-skill-field-group__header h5 {
  margin: 0;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
}

.admin-skill-field-group__header span {
  color: var(--text-tertiary);
  font-size: 12px;
}

.admin-skill-layout__aside {
  min-width: 0;
}

.admin-dialog__body {
  overflow: auto;
}

.admin-skill-panel {
  padding: 18px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 18px;
  background: var(--bg-surface);
  box-shadow: 0 8px 30px rgba(15, 15, 18, 0.04);
}

.admin-skill-panel + .admin-skill-panel {
  margin-top: 16px;
}

.admin-skill-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.admin-skill-panel__header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}

.admin-skill-panel__header p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.admin-skill-panel--sticky {
  position: sticky;
  top: 0;
}

.admin-skill-sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.admin-skill-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--line-divider, #00000014);
}

.admin-skill-section--compact {
  margin-top: 16px;
  padding-top: 0;
  border-top: none;
}

.admin-skill-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.admin-skill-section__header-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.admin-skill-section__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-skill-section__header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.admin-skill-section__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--bg-block-secondary-default);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.admin-skill-editor-card {
  padding: 16px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 16px;
  background: var(--bg-surface);
}

.admin-skill-editor-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.admin-skill-editor-card__title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.admin-skill-editor-card__title-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.admin-skill-editor-card__title-main strong,
.admin-skill-editor-card__title-main small {
  display: block;
  min-width: 0;
}

.admin-skill-editor-card__title-main strong {
  font-size: 14px;
  color: var(--text-primary);
}

.admin-skill-editor-card__title-main small {
  color: var(--text-tertiary);
  font-size: 12px;
}

.admin-skill-editor-card__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--bg-block-secondary-default);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.admin-skill-editor-card__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.admin-skill-editor-card__badge.is-enabled {
  background: color-mix(in srgb, var(--brand-main-default) 14%, transparent);
  color: var(--brand-main-default);
}

.admin-skill-editor-card__badge.is-disabled {
  background: var(--bg-block-secondary-default);
  color: var(--text-tertiary);
}

.admin-skill-editor-card__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.admin-skill-editor-card + .admin-skill-editor-card {
  margin-top: 12px;
}

.admin-skill-editor-card__preview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--bg-block-secondary-default);
}

.admin-skill-editor-card__preview-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.admin-skill-editor-card__preview-item span {
  color: var(--text-tertiary);
  font-size: 12px;
}

.admin-skill-editor-card__preview-item strong {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.6;
  word-break: break-word;
}

.admin-skill-editor-card__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.admin-empty--mini {
  padding: 12px 0;
}

.admin-skill-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-skill-nav__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 12px;
  background: var(--bg-surface);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition: background-color .2s ease, border-color .2s ease, transform .2s ease;
}

.admin-skill-nav__item:hover {
  background: var(--bg-block-secondary-default);
  transform: translateY(-1px);
}

.admin-skill-nav__item small {
  color: var(--text-tertiary);
  font-size: 12px;
}

.admin-skill-nav__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.admin-skill-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-skill-summary__status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.admin-skill-summary__hero {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-skill-summary__hero-text {
  min-width: 0;
}

.admin-skill-summary__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.admin-skill-summary__subtitle {
  margin-top: 4px;
  color: var(--text-tertiary);
  font-size: 12px;
  word-break: break-all;
}

.admin-skill-summary__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.admin-skill-summary__item {
  padding: 12px;
  border-radius: 14px;
  background: var(--bg-block-secondary-default);
}

.admin-skill-summary__label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.admin-skill-summary__item strong,
.admin-skill-summary__row strong {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
  word-break: break-word;
}

.admin-skill-summary__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-skill-summary__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--line-divider, #00000014);
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-skill-summary__row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.admin-skill-sidebar__block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 18px;
  border-top: 1px solid var(--line-divider, #00000014);
}

.admin-skill-sidebar__block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.admin-skill-sidebar__block-header h5 {
  margin: 0;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
}

.admin-skill-sidebar__block-header span {
  color: var(--text-tertiary);
  font-size: 12px;
}

.admin-form__footer--sticky {
  position: sticky;
  bottom: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 24px;
  padding: 16px 20px;
  border-top: 1px solid var(--line-divider, #00000014);
  background: color-mix(in srgb, var(--bg-body) 88%, transparent);
  backdrop-filter: blur(12px);
}

.admin-skill-footer__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.admin-skill-footer__meta strong {
  color: var(--text-primary);
  font-size: 13px;
}

.admin-skill-footer__meta span {
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-skill-footer__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

@media (max-width: 1100px) {
  .admin-skill-toolbar__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-skill-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-skill-panel--sticky {
    position: static;
  }
}

@media (max-width: 768px) {
  .admin-skill-toolbar {
    padding: 16px;
  }

  .admin-skill-toolbar__filters {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-skill-toolbar__meta,
  .admin-skill-toolbar__actions,
  .admin-skill-tabs {
    flex-direction: column;
  }

  .admin-skill-tabs__item {
    justify-content: space-between;
  }

  .admin-skill-panel__header,
  .admin-skill-section__header,
  .admin-skill-field-group__header {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-skill-section__header-main,
  .admin-skill-section__header-actions {
    justify-content: space-between;
  }

  .admin-skill-summary__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-skill-editor-card__preview {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-skill-editor-card__header {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-skill-editor-card__toolbar {
    justify-content: flex-start;
  }

  .admin-form__footer--sticky {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-skill-footer__actions {
    justify-content: flex-end;
  }
}
</style>
