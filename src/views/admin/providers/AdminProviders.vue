<template>
  <AdminPageContainer
    class="admin-list-page"
    compact title="模型厂商" description="集中管理多个 AI 厂商，并在厂商维度下维护模型列表与模型能力。">
    <AdminListFrame>
      <template #toolbar>
        <AdminListToolbar
          :disabled="providerLoading || providerSaving || modelLoading || modelSaving"
          :has-active-filters="providerActiveFilterCount > 0"
          :facets="providerListFacets"
          @update:facet="handleProviderFacetUpdate"
          @clear="resetProviderFilters"
        >
          <input
            v-model.trim="providerFilters.keyword"
            class="admin-list-toolbar__input is-wide"
            type="text"
            placeholder="搜索供应商名称或厂商标识"
          >
          <template #actions>
            <button
              class="admin-button admin-button--secondary"
              type="button"
              :disabled="providerLoading || providerSaving || modelLoading || modelSaving"
              @click="loadProviders"
            >
              {{ providerLoading ? '刷新中...' : '刷新列表' }}
            </button>
          </template>
        </AdminListToolbar>
      </template>

      <div class="admin-provider-grid admin-console-grid">
        <button class="admin-provider-create-card admin-console-create-card" type="button" @click="openCreateProviderDialog">
          <div class="admin-provider-create-card__main">
            <div class="admin-provider-create-card__plus">+</div>
            <div class="admin-provider-create-card__copy">
              <div class="admin-provider-create-card__title">新增厂商</div>
              <div class="admin-provider-create-card__desc">添加新的自定义模型厂商</div>
            </div>
          </div>
          <div class="admin-provider-create-card__footer-actions">
            <span class="admin-provider-create-card__action admin-provider-create-card__action--muted">从配置文件导入</span>
            <span class="admin-provider-create-card__action">手动创建</span>
          </div>
        </button>

        <AdminEmptyState
          v-if="!providerLoading && !filteredProviders.length"
          class="admin-console-grid-span"
          message="当前筛选条件下暂无厂商，可清空筛选或新增厂商。"
        />

        <div v-for="provider in paginatedProviders" :key="provider.id" class="admin-provider-tile admin-console-card">
        <div class="admin-provider-tile__header">
          <div class="admin-provider-tile__brand">
            <div class="admin-provider-avatar">
              <img v-if="provider.iconUrl" :src="provider.iconUrl" :alt="provider.name">
              <span v-else>{{ getProviderInitial(provider.name) }}</span>
            </div>
            <div class="admin-provider-tile__meta">
              <div class="admin-provider-tile__title">{{ provider.name }}</div>
              <button class="admin-provider-tile__link" type="button" @click="openModelManager(provider)">
                管理模型({{ provider.modelCount }})
              </button>
            </div>
          </div>
          <div class="admin-provider-tile__actions" @click.stop>
            <button class="admin-icon-button" type="button" title="厂商操作" @click="toggleProviderMenu(provider.id)"><el-icon><MoreFilled /></el-icon></button>
            <div v-if="activeProviderMenuId === provider.id" class="admin-provider-menu">
              <button class="admin-provider-menu__item" type="button" @click="handleProviderMenuEdit(provider.id)">
                <span class="admin-provider-menu__icon"><el-icon><Edit /></el-icon></span>
                <span>编辑厂商</span>
              </button>
              <button class="admin-provider-menu__item" type="button" @click="handleProviderMenuManageModels(provider)">
                <span class="admin-provider-menu__icon"><el-icon><Setting /></el-icon></span>
                <span>管理模型</span>
              </button>
              <button class="admin-provider-menu__item" type="button" @click="handleProviderMenuTest(provider)">
                <span class="admin-provider-menu__icon">测</span>
                <span>{{ testingProviderId === provider.id ? '测试中...' : '测试连接' }}</span>
              </button>
              <div class="admin-provider-menu__divider"></div>
              <button class="admin-provider-menu__item admin-provider-menu__item--danger" type="button" @click="handleProviderMenuDelete(provider)">
                <span class="admin-provider-menu__icon"><el-icon><Delete /></el-icon></span>
                <span>删除</span>
              </button>
            </div>
          </div>
        </div>

        <div class="admin-provider-tile__status-row">
          <span class="admin-status" :class="provider.isEnabled ? 'admin-status--success' : 'admin-status--warning'">
            {{ provider.isEnabled ? '已启用' : '已禁用' }}
          </span>
        </div>

        <div class="admin-provider-tile__chips">
          <span v-for="type in provider.supportedTypes" :key="type" class="admin-chip">{{ getSupportedTypeLabel(type) }}</span>
        </div>

        <div v-if="providerTestResults[provider.id]" class="admin-storage-card__info">
          <div>
            <span class="admin-storage-card__label">连接测试</span>
            <span :class="providerTestResults[provider.id].ok ? 'admin-status admin-status--success' : 'admin-status admin-status--warning'">
              {{ providerTestResults[provider.id].ok ? '通过' : '失败' }}
            </span>
          </div>
          <div v-for="step in providerTestResults[provider.id].results" :key="step.name">
            <span class="admin-storage-card__label">{{ step.name }}</span>{{ formatConnectivityStep(step) }}
          </div>
        </div>

        <div class="admin-provider-tile__footer">
          <span>{{ provider.code }}</span>
          <span>启用模型 {{ provider.enabledModelCount }}/{{ provider.modelCount }}</span>
        </div>
      </div>
      </div>

      <template #pagination>
        <AdminPagination
          v-if="filteredProviders.length > 0"
          v-model:page="providerPagination.page"
          v-model:page-size="providerPagination.pageSize"
          :total="filteredProviders.length"
          :disabled="providerLoading || providerSaving || modelLoading || modelSaving"
        />
      </template>
    </AdminListFrame>
  </AdminPageContainer>

  <div v-if="providerDialogVisible" class="admin-dialog-mask" @click="closeProviderDialog">
    <div class="admin-dialog admin-dialog--provider-form" @click.stop>
      <div class="admin-dialog__header">
        <div>
          <h3 class="admin-dialog__title">{{ editingProviderId ? '编辑供应商' : '新增供应商' }}</h3>
          <div class="admin-dialog__desc">添加一个新的 AI 模型供应商</div>
        </div>
        <button class="admin-dialog__close" type="button" @click="closeProviderDialog">×</button>
      </div>

      <form class="admin-form admin-dialog__body" @submit.prevent="handleSaveProvider">
        <div class="admin-provider-form-layout">
          <div class="admin-provider-form-layout__left">
            <label class="admin-form__label">图标</label>
            <div class="admin-provider-icon-panel">
              <div class="admin-provider-icon-panel__preview">
                <img v-if="providerForm.iconUrl" :src="providerForm.iconUrl" :alt="providerForm.name || providerForm.code || 'provider'">
                <span v-else>✦</span>
              </div>
              <input v-model.trim="providerForm.iconUrl" class="admin-input" type="text" placeholder="图标 URL（可选）">
            </div>
          </div>

          <div class="admin-provider-form-layout__right">
            <div class="admin-form__field">
              <label class="admin-form__label">启用状态</label>
              <div class="admin-radio-group">
                <label class="admin-radio-item">
                  <input v-model="providerForm.isEnabled" :value="true" type="radio">
                  <span>启用</span>
                </label>
                <label class="admin-radio-item">
                  <input v-model="providerForm.isEnabled" :value="false" type="radio">
                  <span>禁用</span>
                </label>
              </div>
              <div class="admin-form__hint">请先选择密钥并配置厂商参数，再决定是否启用。</div>
            </div>
          </div>
        </div>

        <div class="admin-form__grid">
          <div class="admin-form__field admin-form__field--full">
            <label class="admin-form__label" for="provider-code">供应商标识</label>
            <input id="provider-code" v-model.trim="providerForm.code" class="admin-input" type="text" placeholder="例如: openai, deepseek, doubao">
            <div class="admin-form__hint">唯一标识符，创建后建议不要频繁变更。</div>
          </div>

          <div class="admin-form__field admin-form__field--full">
            <label class="admin-form__label" for="provider-name">供应商名称</label>
            <input id="provider-name" v-model.trim="providerForm.name" class="admin-input" type="text" placeholder="例如: OpenAI, DeepSeek, 字节豆包">
          </div>

          <div class="admin-form__field admin-form__field--full">
            <label class="admin-form__label" for="provider-description">描述</label>
            <textarea id="provider-description" v-model="providerForm.description" class="admin-textarea" placeholder="供应商描述信息（可选）"></textarea>
          </div>

          <div class="admin-form__field admin-form__field--full">
            <label class="admin-form__label" for="provider-api-key">绑定密钥</label>
            <input id="provider-api-key" v-model.trim="providerForm.apiKey" class="admin-input" type="password" placeholder="选择或填写密钥配置">
          </div>

          <div class="admin-form__field admin-form__field--full">
            <label class="admin-form__label">支持的模型类型</label>
            <div class="admin-check-grid">
              <label v-for="option in providerTypeOptions" :key="option.value" class="admin-check-item">
                <input :checked="providerForm.supportedTypes.includes(option.value)" type="checkbox" @change="toggleSupportedType(option.value)">
                <span>{{ option.label }}</span>
              </label>
            </div>
          </div>

          <div class="admin-form__field admin-form__field--full">
            <label class="admin-form__label" for="provider-base-url">基础地址</label>
            <input id="provider-base-url" v-model.trim="providerForm.baseUrl" class="admin-input" type="text" placeholder="https://api.example.com/v1">
          </div>

          <div class="admin-form__field">
            <label class="admin-form__label" for="provider-chat-endpoint">对话端点</label>
            <input id="provider-chat-endpoint" v-model.trim="providerForm.chatEndpoint" class="admin-input" type="text" placeholder="/chat/completions">
          </div>

          <div class="admin-form__field">
            <label class="admin-form__label" for="provider-image-endpoint">图片端点</label>
            <input id="provider-image-endpoint" v-model.trim="providerForm.imageEndpoint" class="admin-input" type="text" placeholder="/images/generations">
          </div>

          <div class="admin-form__field">
            <label class="admin-form__label" for="provider-image-edit-endpoint">图片编辑端点</label>
            <input id="provider-image-edit-endpoint" v-model.trim="providerForm.imageEditEndpoint" class="admin-input" type="text" placeholder="/images/edits">
          </div>

          <div class="admin-form__field">
            <label class="admin-form__label" for="provider-video-endpoint">视频端点</label>
            <input id="provider-video-endpoint" v-model.trim="providerForm.videoEndpoint" class="admin-input" type="text" placeholder="/videos">
          </div>

          <div class="admin-form__field">
            <label class="admin-form__label" for="provider-default-chat-model">默认对话模型</label>
            <input id="provider-default-chat-model" v-model.trim="providerForm.defaultChatModel" class="admin-input" type="text" placeholder="例如: gpt-4.1-mini">
          </div>

          <div class="admin-form__field admin-form__field--full">
            <label class="admin-form__label" for="provider-sort-order">排序权重</label>
            <input id="provider-sort-order" v-model.number="providerForm.sortOrder" class="admin-input" type="number" min="0" placeholder="0">
          </div>
        </div>

        <div class="admin-form__footer">
          <button class="admin-button admin-button--secondary" type="button" @click="closeProviderDialog">取消</button>
          <button class="admin-button admin-button--primary" type="submit" :disabled="providerSaving">
            {{ providerSaving ? '保存中...' : editingProviderId ? '保存' : '创建' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <div v-if="modelManagerVisible" class="admin-dialog-mask" @click="closeModelManager">
    <div class="admin-dialog admin-dialog--model-manager" @click.stop>
      <div class="admin-dialog__header">
        <div class="admin-model-manager__title-wrap">
          <div class="admin-provider-avatar admin-provider-avatar--small">
            <img v-if="selectedProvider?.iconUrl" :src="selectedProvider.iconUrl" :alt="selectedProvider.name">
            <span v-else>{{ getProviderInitial(selectedProvider?.name || '') }}</span>
          </div>
          <div>
            <h3 class="admin-dialog__title">{{ selectedProvider?.name || '模型管理' }}</h3>
            <div class="admin-dialog__desc">{{ selectedProvider?.baseUrl || '请先选择厂商' }}</div>
          </div>
        </div>
        <div class="admin-dialog__header-actions">
          <button class="admin-button admin-button--secondary" type="button" @click="openDiscoverModelsDialog" :disabled="!selectedProvider || modelLoading || modelSaving || discoveringModels">
            {{ discoveringModels ? '获取中...' : '拉取模型' }}
          </button>
          <button class="admin-button admin-button--primary" type="button" @click="openCreateModelDialog" :disabled="!selectedProvider">添加模型</button>
          <button class="admin-dialog__close" type="button" @click="closeModelManager">×</button>
        </div>
      </div>

      <div class="admin-dialog__body">
        <div class="admin-model-toolbar">
          <input v-model.trim="modelKeyword" class="admin-input" type="text" placeholder="搜索模型名称...">
          <select v-model="modelStatus" class="admin-input">
            <option value="ALL">全部状态</option>
            <option value="ENABLED">已启用</option>
            <option value="DISABLED">已禁用</option>
          </select>
          <select v-model="modelCategoryFilter" class="admin-input">
            <option value="ALL">全部类型</option>
            <option v-for="option in modelCategoryOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>

        <div class="admin-model-list-title">模型列表({{ filteredModels.length }})</div>

        <div v-if="modelLoading" class="admin-empty">正在加载模型列表...</div>
        <div v-else-if="!filteredModels.length" class="admin-empty">当前厂商下还没有模型。</div>
        <div v-else class="admin-model-list">
          <div v-for="model in paginatedModels" :key="model.id" class="admin-model-row">
            <div class="admin-model-row__main">
              <div class="admin-model-row__title">{{ model.modelKey }}</div>
              <div class="admin-model-row__badges">
                <span class="admin-chip">{{ getModelCategoryLabel(model.category) }}</span>
                <span v-if="readCapabilityFlag(model.capabilityJson, 'supportsVision')" class="admin-chip">视觉</span>
                <span v-if="readCapabilityFlag(model.capabilityJson, 'supportsToolCall')" class="admin-chip">工具</span>
                <span v-if="readCapabilityFlag(model.capabilityJson, 'supportsReasoning')" class="admin-chip">推理</span>
                <span v-if="readCapabilityFlag(model.capabilityJson, 'supportsStructuredOutput')" class="admin-chip">结构化</span>
                <span v-if="readModelPrice(model) === 0" class="admin-chip">免费</span>
              </div>
            </div>
            <div class="admin-model-row__right">
              <button class="admin-inline-button admin-inline-button--danger" type="button" @click="handleDeleteModel(model)">删除</button>
              <button class="admin-inline-button" type="button" @click="openEditModelDialog(model)">配置</button>
              <label class="admin-switch">
                <input :checked="model.isEnabled" type="checkbox" @change="toggleModelEnabled(model)">
                <span class="admin-switch__slider" />
              </label>
            </div>
          </div>
          <AdminPagination
            v-model:page="modelPagination.page"
            v-model:page-size="modelPagination.pageSize"
            :total="filteredModels.length"
            :disabled="modelLoading || modelSaving"
          />
        </div>
      </div>
    </div>
  </div>

  <div v-if="discoverDialogVisible" class="admin-dialog-mask admin-dialog-mask--inner" @click="closeDiscoverModelsDialog">
    <div class="admin-dialog admin-dialog--model-discover" @click.stop>
      <div class="admin-dialog__header">
        <div>
          <h3 class="admin-dialog__title">拉取上游模型</h3>
          <div class="admin-dialog__desc">{{ discoveredRequestUrl || '将根据当前厂商配置请求 /v1/models' }}</div>
        </div>
        <button class="admin-dialog__close" type="button" @click="closeDiscoverModelsDialog">×</button>
      </div>

      <div class="admin-dialog__body">
        <div class="admin-form__grid">
          <div class="admin-form__field">
            <label class="admin-form__label">批量模型类型</label>
            <select v-model="discoverBatchSettings.category" class="admin-input">
              <option v-for="option in modelCategoryOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>
          <div class="admin-form__field">
            <label class="admin-form__label">排序起点</label>
            <input v-model.number="discoverBatchSettings.sortOrderStart" class="admin-input" type="number" min="0">
          </div>
          <div class="admin-form__field">
            <label class="admin-form__label">排序步长</label>
            <input v-model.number="discoverBatchSettings.sortOrderStep" class="admin-input" type="number" min="1">
          </div>
          <div class="admin-form__field">
            <label class="admin-form__label">导入状态</label>
            <select v-model="discoverBatchSettings.isEnabled" class="admin-input">
              <option :value="true">启用</option>
              <option :value="false">禁用</option>
            </select>
          </div>
        </div>

        <div class="admin-model-discover__toolbar">
          <label class="admin-check-item">
            <input :checked="isAllDiscoveredSelected" type="checkbox" @change="handleSelectAllDiscoveredModelsChange">
            <span>全选</span>
          </label>
          <span class="admin-model-discover__summary">
            已选 {{ selectedDiscoveredModelCount }} / {{ discoveredModels.length }}
            <em v-if="selectedDiscoveredModelCount">，将新建 {{ selectedDiscoveredCreateCount }} 个，更新 {{ selectedDiscoveredUpdateCount }} 个</em>
          </span>
        </div>

        <div v-if="!discoveredModels.length" class="admin-empty">当前未获取到可导入的模型。</div>
        <div v-else class="admin-model-discover__list">
          <label v-for="item in discoveredModels" :key="item.modelKey" class="admin-model-discover__row">
            <input v-model="selectedDiscoveredModelKeys" :value="item.modelKey" type="checkbox">
            <div class="admin-model-discover__content">
              <div class="admin-model-discover__headline">
                <strong>{{ item.label }}</strong>
                <span class="admin-model-discover__badge" :class="getDiscoveredModelImportAction(item) === 'update' ? 'is-update' : 'is-create'">
                  {{ getDiscoveredModelImportAction(item) === 'update' ? '将更新' : '将新建' }}
                </span>
              </div>
              <span>{{ item.modelKey }}</span>
              <small>{{ item.description || '暂无描述' }}</small>
            </div>
          </label>
        </div>
      </div>

      <div class="admin-form__footer">
        <button class="admin-button admin-button--secondary" type="button" @click="closeDiscoverModelsDialog">取消</button>
        <button class="admin-button admin-button--primary" type="button" :disabled="discoverImporting || !selectedDiscoveredModelCount" @click="handleBatchImportModels">
          {{ discoverImporting ? '导入中...' : `导入所选模型（${selectedDiscoveredModelCount}）` }}
        </button>
      </div>
    </div>
  </div>

  <div v-if="modelDialogVisible" class="admin-dialog-mask admin-dialog-mask--inner" @click="closeModelDialog">
    <div class="admin-dialog admin-dialog--model-form" @click.stop>
      <div class="admin-dialog__header">
        <div>
          <h3 class="admin-dialog__title">{{ editingModelId ? '添加模型配置' : '添加模型' }}</h3>
          <div class="admin-dialog__desc">为当前供应商添加一个新的 AI 模型</div>
        </div>
        <button class="admin-dialog__close" type="button" @click="closeModelDialog">×</button>
      </div>

      <form class="admin-form admin-dialog__body" @submit.prevent="handleSaveModel">
        <div class="admin-model-tabs" role="tablist">
          <button
            v-for="tab in modelDialogTabs"
            :key="tab.key"
            type="button"
            role="tab"
            :aria-selected="activeModelTab === tab.key"
            class="admin-model-tabs__item"
            :class="{ 'is-active': activeModelTab === tab.key }"
            @click="activeModelTab = tab.key"
          >
            <span>{{ tab.label }}</span>
            <small>{{ tab.hint }}</small>
          </button>
        </div>

        <div v-show="activeModelTab === 'basic'" class="admin-form__grid admin-model-tab-panel">
          <div class="admin-form__field admin-form__field--full">
            <label class="admin-form__label" for="model-label">模型名称</label>
            <input id="model-label" v-model.trim="modelForm.label" class="admin-input" type="text" placeholder="例如: GPT-4o, DeepSeek-V3">
          </div>

          <div class="admin-form__field admin-form__field--full">
            <label class="admin-form__label" for="model-key">模型标识符</label>
            <input id="model-key" v-model.trim="modelForm.modelKey" class="admin-input" type="text" placeholder="例如: gpt-4o, deepseek-chat">
            <div class="admin-form__hint">API 调用时使用的模型标识</div>
          </div>

          <div class="admin-form__field">
            <label class="admin-form__label" for="model-category">模型类型</label>
            <select id="model-category" v-model="modelForm.category" class="admin-input">
              <option v-for="option in modelCategoryOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>

          <div class="admin-form__field">
            <label class="admin-form__label" for="model-description">描述</label>
            <textarea id="model-description" v-model="modelForm.description" class="admin-textarea" placeholder="模型描述信息（可选）"></textarea>
          </div>

          <div class="admin-form__field">
            <label class="admin-form__label" for="model-billing-power">计费规则</label>
            <div class="admin-composite-input">
              <input id="model-billing-power" v-model.number="modelForm.billingPower" class="admin-input" type="number" min="0" placeholder="请输入模型计费">
              <span class="admin-composite-input__suffix">积分 / {{ modelForm.billingTokens || 1000 }} Tokens</span>
            </div>
          </div>

          <div class="admin-form__field">
            <label class="admin-form__label" for="model-membership-levels">指定会员可用</label>
            <input id="model-membership-levels" v-model.trim="modelForm.membershipLevelsText" class="admin-input" type="text" placeholder="选择会员等级（逗号分隔，可选）">
            <div class="admin-form__hint">例如: vip, pro。为空表示所有用户可用。</div>
          </div>

          <div class="admin-form__field">
            <label class="admin-form__label" for="model-sort-order">排序权重</label>
            <input id="model-sort-order" v-model.number="modelForm.sortOrder" class="admin-input" type="number" min="0" placeholder="0">
          </div>

          <div class="admin-form__field admin-form__field--full">
            <div class="admin-check-grid admin-check-grid--two">
              <label class="admin-check-item admin-check-item--switch">
                <input v-model="modelForm.isEnabled" type="checkbox">
                <span>已启用</span>
              </label>
              <label class="admin-check-item admin-check-item--switch">
                <input v-model="modelForm.isDefault" type="checkbox">
                <span>设为默认</span>
              </label>
            </div>
          </div>
        </div>

        <div v-show="activeModelTab === 'capability'" class="admin-form__grid admin-model-tab-panel">
          <div class="admin-form__field admin-form__field--full">
            <label class="admin-form__label">模型能力</label>
            <div class="admin-form__hint">勾选当前模型支持的基础能力，影响前端能力开关与上游字段透传</div>
            <div class="admin-check-grid">
              <label v-for="option in modelCapabilityOptions" :key="option.key" class="admin-check-item">
                <input :checked="readCapabilityFlag(modelForm.capabilityJson, option.key)" type="checkbox" @change="toggleModelCapability(option.key)">
                <span>{{ option.label }}</span>
              </label>
            </div>
          </div>

          <div class="admin-form__field admin-form__field--full">
            <ModelCapabilityEditor v-model="modelForm.capabilityJson" />
          </div>
        </div>

        <div v-show="activeModelTab === 'advanced'" class="admin-form__grid admin-model-tab-panel">
          <div class="admin-form__field">
            <label class="admin-form__label" for="model-max-context">最大上下文条数</label>
            <input id="model-max-context" v-model.number="modelForm.maxContext" class="admin-input" type="number" min="1" placeholder="3">
            <div class="admin-form__hint">单次请求附带的历史消息上限</div>
          </div>

          <!-- 图片模型专属：单次最大出图张数（写入 capabilityJson.maxImagesPerRequest） -->
          <div v-if="modelForm.category === 'IMAGE'" class="admin-form__field">
            <label class="admin-form__label" for="model-max-images-per-request">单次最大出图张数</label>
            <input
              id="model-max-images-per-request"
              v-model.number="modelForm.maxImagesPerRequest"
              class="admin-input"
              type="number"
              min="1"
              max="20"
              step="1"
              placeholder="1"
            >
            <div class="admin-form__hint">
              对应上游 n 参数的硬上限。不同上游限制不一致（gpt-image-2 = 4，dall-e-3 = 1，dall-e-2 = 10），未配置时按 1 保守处理。
            </div>
          </div>

          <div class="admin-form__field admin-form__field--full">
            <label class="admin-form__label" for="model-default-params">默认参数 JSON</label>
            <textarea id="model-default-params" v-model="modelForm.defaultParamsJsonText" class="admin-textarea" placeholder='例如 {"temperature": 0.7}'></textarea>
            <div class="admin-form__hint">透传到上游的兜底参数；与「能力配置」字段冲突时，能力配置优先</div>
          </div>
        </div>

        <div class="admin-form__footer">
          <button class="admin-button admin-button--secondary" type="button" @click="closeModelDialog">取消</button>
          <button class="admin-button admin-button--primary" type="submit" :disabled="modelSaving">
            {{ modelSaving ? '保存中...' : editingModelId ? '保存' : '创建' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import './admin-providers.css'
import './admin-providers.scoped.css'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { Edit, MoreFilled, Setting, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import AdminPagination from '@/components/admin/common/AdminPagination.vue'
import AdminEmptyState from '@/components/admin/common/AdminEmptyState.vue'
import AdminListFrame from '@/components/admin/common/AdminListFrame.vue'
import AdminListToolbar, { type AdminListToolbarFacet } from '@/components/admin/common/AdminListToolbar.vue'
import AdminPageContainer from '@/components/admin/layout/AdminPageContainer.vue'
import ModelCapabilityEditor from '@/components/admin/common/ModelCapabilityEditor.vue'
import { matchesAdminKeyword, useAdminListFilters } from '@/composables/useAdminListFilters'
import { useAdminPagination } from '@/composables/useAdminPagination'
import {
  createAdminProvider,
  deleteAdminProvider,
  getAdminProviderDetail,
  listAdminProviders,
  testAdminProviderConnectivity,
  updateAdminProvider,
  type AdminProviderConnectivityStep,
  type AdminProviderConnectivityResult,
  type AdminProviderDetail,
  type AdminProviderItem,
  type AdminProviderPayload,
} from '@/api/admin-providers'
import {
  batchUpsertAdminProviderModels,
  createAdminProviderModel,
  deleteAdminProviderModel,
  discoverAdminProviderModels,
  listAdminProviderModels,
  updateAdminProviderModel,
  type AdminModelCategory,
  type DiscoveredProviderModelItem,
  type AdminProviderModelItem,
  type AdminProviderModelPayload,
} from '@/api/admin-models'

const providerTypeOptions = [
  { label: 'LLM', value: 'CHAT' },
  { label: 'TEXT EMBEDDING', value: 'TEXT_EMBEDDING' },
  { label: 'RERANK', value: 'RERANK' },
  { label: 'TTS', value: 'TTS' },
  { label: 'SPEECH2TEXT', value: 'SPEECH2TEXT' },
  { label: '图片生成', value: 'IMAGE' },
  { label: '视频生成', value: 'VIDEO' },
]

const modelCategoryOptions: Array<{ label: string; value: AdminModelCategory }> = [
  { label: 'LLM（文本生成、对话、推理等）', value: 'CHAT' },
  { label: '图片生成', value: 'IMAGE' },
  { label: '视频生成', value: 'VIDEO' },
]

const modelCapabilityOptions = [
  { key: 'supportsVision', label: '视觉能力' },
  { key: 'supportsToolCall', label: '工具调用' },
  { key: 'supportsReasoning', label: '深度思考' },
  { key: 'supportsStructuredOutput', label: '结构化输出' },
]

const providerLoading = ref(false)
const providerSaving = ref(false)
const modelLoading = ref(false)
const modelSaving = ref(false)
const testingProviderId = ref('')

const providerFilters = reactive({
  keyword: '',
  status: 'ALL' as 'ALL' | 'ENABLED' | 'DISABLED',
})
const providerFilterDefaults = {
  keyword: '',
  status: 'ALL' as 'ALL' | 'ENABLED' | 'DISABLED',
}
const providers = ref<AdminProviderItem[]>([])
const providerTestResults = reactive<Record<string, AdminProviderConnectivityResult>>({})
const selectedProvider = ref<AdminProviderItem | null>(null)
const providerDialogVisible = ref(false)
const modelManagerVisible = ref(false)
const modelDialogVisible = ref(false)
type ModelDialogTab = 'basic' | 'capability' | 'advanced'
const modelDialogTabs: Array<{ key: ModelDialogTab; label: string; hint: string }> = [
  { key: 'basic', label: '基础信息', hint: '名称 / 计费 / 会员' },
  { key: 'capability', label: '能力配置', hint: '联网 / 思考 / 工具' },
  { key: 'advanced', label: '高级参数', hint: '上下文 / 默认参数' },
]
const activeModelTab = ref<ModelDialogTab>('basic')
const discoverDialogVisible = ref(false)
const editingProviderId = ref('')
const editingModelId = ref('')
const activeProviderMenuId = ref('')

const modelKeyword = ref('')
const modelStatus = ref<'ALL' | 'ENABLED' | 'DISABLED'>('ALL')
const modelCategoryFilter = ref<'ALL' | AdminModelCategory>('ALL')
const models = ref<AdminProviderModelItem[]>([])
const discoveredModels = ref<DiscoveredProviderModelItem[]>([])
const discoveredRequestUrl = ref('')
const selectedDiscoveredModelKeys = ref<string[]>([])
const discoveringModels = ref(false)
const discoverImporting = ref(false)
const { activeFilterCount: providerActiveFilterCount, resetFilters: resetProviderFilterValues } = useAdminListFilters({
  filters: providerFilters,
  defaults: providerFilterDefaults,
})

const providerListFacets = computed<AdminListToolbarFacet[]>(() => [
  {
    key: 'status',
    title: '供应商状态',
    options: [
      { label: '已启用', value: 'ENABLED' },
      { label: '已禁用', value: 'DISABLED' },
    ],
    modelValue: providerFilters.status,
    emptyValue: 'ALL',
  },
])

const handleProviderFacetUpdate = ({ key, value }: { key: string; value: string }) => {
  if (key === 'status') {
    providerFilters.status = value as typeof providerFilters.status
  }
}

const { pagination: providerPagination, sliceItems: sliceProviderItems, resetPage: resetProviderPage } = useAdminPagination({
  initialPageSize: 8,
})
const { pagination: modelPagination, sliceItems: sliceModelItems, resetPage: resetModelPage } = useAdminPagination({
  initialPageSize: 10,
})

const providerForm = reactive<AdminProviderPayload>({
  code: '',
  name: '',
  description: '',
  iconUrl: '',
  baseUrl: '',
  apiKey: '',
  chatEndpoint: '/chat/completions',
  imageEndpoint: '/images/generations',
  imageEditEndpoint: '/images/edits',
  videoEndpoint: '/videos',
  defaultChatModel: '',
  supportedTypes: ['CHAT'],
  isEnabled: true,
  sortOrder: 0,
})

const modelForm = reactive({
  category: 'CHAT' as AdminModelCategory,
  label: '',
  modelKey: '',
  description: '',
  sortOrder: 0,
  isEnabled: true,
  capabilityJson: {} as Record<string, any>,
  defaultParamsJsonText: '',
  billingPower: 0,
  billingTokens: 1000,
  membershipLevelsText: '',
  maxContext: 3,
  isDefault: false,
  // 单次最大出图张数（仅 IMAGE 类别有意义）。最终落入 capabilityJson.maxImagesPerRequest。
  // 不同上游限制不同：gpt-image-2 = 4，dall-e-3 = 1，dall-e-2 = 10。
  maxImagesPerRequest: 1,
})

const discoverBatchSettings = reactive({
  category: 'CHAT' as AdminModelCategory,
  isEnabled: true,
  sortOrderStart: 0,
  sortOrderStep: 10,
})

const filteredProviders = computed(() => {
  return providers.value.filter((provider) => {
    const matchedKeyword = matchesAdminKeyword(providerFilters.keyword, [provider.name, provider.code])

    const matchedStatus = providerFilters.status === 'ALL'
      || (providerFilters.status === 'ENABLED' && provider.isEnabled)
      || (providerFilters.status === 'DISABLED' && !provider.isEnabled)

    return matchedKeyword && matchedStatus
  })
})
const paginatedProviders = computed(() => sliceProviderItems(filteredProviders.value))

const resetProviderFilters = () => {
  resetProviderFilterValues()
  resetProviderPage()
}

const filteredModels = computed(() => {
  return models.value
    .filter((model) => {
      const matchedKeyword = !modelKeyword.value
        || model.label.toLowerCase().includes(modelKeyword.value.toLowerCase())
        || model.modelKey.toLowerCase().includes(modelKeyword.value.toLowerCase())

      const matchedStatus = modelStatus.value === 'ALL'
        || (modelStatus.value === 'ENABLED' && model.isEnabled)
        || (modelStatus.value === 'DISABLED' && !model.isEnabled)

      const matchedCategory = modelCategoryFilter.value === 'ALL' || model.category === modelCategoryFilter.value

      return matchedKeyword && matchedStatus && matchedCategory
    })
    .sort((prevItem, nextItem) => prevItem.sortOrder - nextItem.sortOrder)
})
const paginatedModels = computed(() => sliceModelItems(filteredModels.value))
const selectedDiscoveredModelCount = computed(() => selectedDiscoveredModelKeys.value.length)
const isAllDiscoveredSelected = computed(() => {
  return discoveredModels.value.length > 0 && selectedDiscoveredModelKeys.value.length === discoveredModels.value.length
})
const selectedDiscoveredItems = computed(() => {
  return discoveredModels.value.filter(item => selectedDiscoveredModelKeys.value.includes(item.modelKey))
})
const selectedDiscoveredCreateCount = computed(() => {
  return selectedDiscoveredItems.value.filter(item => getDiscoveredModelImportAction(item) === 'create').length
})
const selectedDiscoveredUpdateCount = computed(() => {
  return selectedDiscoveredItems.value.filter(item => getDiscoveredModelImportAction(item) === 'update').length
})

const resetProviderForm = () => {
  providerForm.code = ''
  providerForm.name = ''
  providerForm.description = ''
  providerForm.iconUrl = ''
  providerForm.baseUrl = ''
  providerForm.apiKey = ''
  providerForm.chatEndpoint = '/chat/completions'
  providerForm.imageEndpoint = '/images/generations'
  providerForm.imageEditEndpoint = '/images/edits'
  providerForm.videoEndpoint = '/videos'
  providerForm.defaultChatModel = ''
  providerForm.supportedTypes = ['CHAT']
  providerForm.isEnabled = true
  providerForm.sortOrder = 0
}

// 编辑厂商时统一把接口返回值灌入表单，避免字段遗漏。
const applyProviderForm = (provider: AdminProviderDetail) => {
  providerForm.code = provider.code
  providerForm.name = provider.name
  providerForm.description = provider.description || ''
  providerForm.iconUrl = provider.iconUrl || ''
  providerForm.baseUrl = provider.baseUrl
  providerForm.apiKey = provider.apiKey || ''
  providerForm.chatEndpoint = provider.chatEndpoint
  providerForm.imageEndpoint = provider.imageEndpoint
  providerForm.imageEditEndpoint = provider.imageEditEndpoint
  providerForm.videoEndpoint = provider.videoEndpoint
  providerForm.defaultChatModel = provider.defaultChatModel || ''
  providerForm.supportedTypes = Array.isArray(provider.supportedTypes) ? [...provider.supportedTypes] : ['CHAT']
  providerForm.isEnabled = provider.isEnabled
  providerForm.sortOrder = provider.sortOrder
}

const stringifyJson = (value: Record<string, any> | null | undefined) => {
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
    return parsed as Record<string, any>
  } catch {
    throw new Error(`${fieldLabel} 必须是合法的 JSON 对象`)
  }
}

const normalizeMembershipLevels = (value: string) => {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

const resetModelForm = () => {
  editingModelId.value = ''
  modelForm.category = 'CHAT'
  modelForm.label = ''
  modelForm.modelKey = ''
  modelForm.description = ''
  modelForm.sortOrder = 0
  modelForm.isEnabled = true
  modelForm.capabilityJson = {}
  modelForm.defaultParamsJsonText = ''
  modelForm.billingPower = 0
  modelForm.billingTokens = 1000
  modelForm.membershipLevelsText = ''
  modelForm.maxContext = 3
  modelForm.isDefault = false
  modelForm.maxImagesPerRequest = 1
}

// 编辑模型时统一回填，避免能力字段和默认参数丢失。
const applyModelForm = (model: AdminProviderModelItem) => {
  editingModelId.value = model.id
  modelForm.category = model.category
  modelForm.label = model.label
  modelForm.modelKey = model.modelKey
  modelForm.description = model.description || ''
  modelForm.sortOrder = model.sortOrder
  modelForm.isEnabled = model.isEnabled

  const capabilityJson = { ...(model.capabilityJson || {}) }
  const defaultParamsJson = (model.defaultParamsJson || {}) as Record<string, any>
  const billingRule = (defaultParamsJson.billingRule || {}) as Record<string, any>

  modelForm.capabilityJson = capabilityJson
  modelForm.defaultParamsJsonText = stringifyJson(defaultParamsJson)
  modelForm.billingPower = Number(billingRule.power || 0) || 0
  modelForm.billingTokens = Number(billingRule.tokens || 1000) || 1000
  modelForm.membershipLevelsText = Array.isArray(defaultParamsJson.membershipLevels)
    ? defaultParamsJson.membershipLevels.join(', ')
    : ''
  modelForm.maxContext = Number(defaultParamsJson.maxContext || 3) || 3
  modelForm.isDefault = Boolean(defaultParamsJson.isDefault)
  // 从 capabilityJson.maxImagesPerRequest 回填；非法/缺失时落到 1
  const storedMaxImages = Number(capabilityJson.maxImagesPerRequest)
  modelForm.maxImagesPerRequest = Number.isFinite(storedMaxImages) && storedMaxImages >= 1
    ? Math.floor(storedMaxImages)
    : 1
}

const loadProviders = async () => {
  providerLoading.value = true
  try {
    providers.value = await listAdminProviders()

    if (selectedProvider.value) {
      const nextSelectedProvider = providers.value.find(item => item.id === selectedProvider.value?.id) || null
      selectedProvider.value = nextSelectedProvider
    }
  } finally {
    providerLoading.value = false
  }
}

const loadModels = async (providerId?: string) => {
  const targetProviderId = providerId || selectedProvider.value?.id || ''
  if (!targetProviderId) {
    models.value = []
    return
  }

  modelLoading.value = true
  try {
    const result = await listAdminProviderModels(targetProviderId)
    models.value = result.models
    selectedProvider.value = result.provider
    resetModelPage()
  } finally {
    modelLoading.value = false
  }
}

const getProviderInitial = (name: string) => String(name || '').trim().slice(0, 1).toUpperCase() || 'A'

const getSupportedTypeLabel = (value: string) => {
  const matched = providerTypeOptions.find(item => item.value === value)
  return matched?.label || value
}

const getModelCategoryLabel = (value: AdminModelCategory) => {
  const matched = modelCategoryOptions.find(item => item.value === value)
  return matched?.label.split('（')[0] || value
}

const openCreateProviderDialog = () => {
  editingProviderId.value = ''
  resetProviderForm()
  providerDialogVisible.value = true
}

const openEditProviderDialog = async (providerId: string) => {
  providerSaving.value = true
  try {
    const detail = await getAdminProviderDetail(providerId)
    editingProviderId.value = providerId
    applyProviderForm(detail)
    providerDialogVisible.value = true
  } finally {
    providerSaving.value = false
  }
}

const closeProviderDialog = () => {
  providerDialogVisible.value = false
  editingProviderId.value = ''
  resetProviderForm()
}

const buildProviderPayload = (): AdminProviderPayload => ({
  code: providerForm.code,
  name: providerForm.name,
  description: providerForm.description,
  iconUrl: providerForm.iconUrl,
  baseUrl: providerForm.baseUrl,
  apiKey: providerForm.apiKey,
  chatEndpoint: providerForm.chatEndpoint,
  imageEndpoint: providerForm.imageEndpoint,
  imageEditEndpoint: providerForm.imageEditEndpoint,
  videoEndpoint: providerForm.videoEndpoint,
  defaultChatModel: providerForm.defaultChatModel,
  supportedTypes: providerForm.supportedTypes,
  isEnabled: Boolean(providerForm.isEnabled),
  sortOrder: Number(providerForm.sortOrder) || 0,
})

const handleSaveProvider = async () => {
  providerSaving.value = true
  try {
    const payload = buildProviderPayload()
    if (editingProviderId.value) {
      await updateAdminProvider(editingProviderId.value, payload)
    } else {
      await createAdminProvider(payload)
    }
    await loadProviders()
    closeProviderDialog()
  } finally {
    providerSaving.value = false
  }
}

const toggleSupportedType = (value: string) => {
  if (providerForm.supportedTypes.includes(value)) {
    providerForm.supportedTypes = providerForm.supportedTypes.filter(item => item !== value)
    if (!providerForm.supportedTypes.length) {
      providerForm.supportedTypes = ['CHAT']
    }
    return
  }

  providerForm.supportedTypes = [...providerForm.supportedTypes, value]
}

const closeProviderMenu = () => {
  activeProviderMenuId.value = ''
}

const toggleProviderMenu = (providerId: string) => {
  activeProviderMenuId.value = activeProviderMenuId.value === providerId ? '' : providerId
}

const handleProviderMenuEdit = async (providerId: string) => {
  closeProviderMenu()
  await openEditProviderDialog(providerId)
}

const handleProviderMenuManageModels = async (provider: AdminProviderItem) => {
  closeProviderMenu()
  await openModelManager(provider)
}

const handleProviderMenuTest = async (provider: AdminProviderItem) => {
  closeProviderMenu()
  testingProviderId.value = provider.id
  try {
    providerTestResults[provider.id] = await testAdminProviderConnectivity(provider.id)
  } catch (error: any) {
    ElMessage.error(error?.message || '测试连接失败')
  } finally {
    testingProviderId.value = ''
  }
}

const handleProviderMenuDelete = async (provider: AdminProviderItem) => {
  closeProviderMenu()
  await handleDeleteProvider(provider)
}

const handleDeleteProvider = async (provider: AdminProviderItem) => {
  if (!window.confirm(`确认删除厂商“${provider.name}”吗？删除后其模型也会一起删除。`)) {
    return
  }

  await deleteAdminProvider(provider.id)
  if (selectedProvider.value?.id === provider.id) {
    closeModelManager()
  }
  await loadProviders()
}

const openModelManager = async (provider: AdminProviderItem) => {
  closeProviderMenu()
  selectedProvider.value = provider
  modelKeyword.value = ''
  modelStatus.value = 'ALL'
  modelCategoryFilter.value = 'ALL'
  modelManagerVisible.value = true
  resetModelPage()
  await loadModels(provider.id)
}

const closeModelManager = () => {
  modelManagerVisible.value = false
  modelDialogVisible.value = false
  discoverDialogVisible.value = false
  selectedProvider.value = null
  models.value = []
  discoveredModels.value = []
  discoveredRequestUrl.value = ''
  selectedDiscoveredModelKeys.value = []
  resetModelForm()
  resetModelPage()
}

watch(() => [providerFilters.keyword, providerFilters.status] as const, () => {
  resetProviderPage()
})

watch(() => [modelKeyword.value, modelStatus.value, modelCategoryFilter.value] as const, () => {
  resetModelPage()
})

const openCreateModelDialog = () => {
  resetModelForm()
  activeModelTab.value = 'basic'
  modelDialogVisible.value = true
}

const resetDiscoverState = () => {
  discoveredModels.value = []
  discoveredRequestUrl.value = ''
  selectedDiscoveredModelKeys.value = []
  discoverBatchSettings.category = 'CHAT'
  discoverBatchSettings.isEnabled = true
  discoverBatchSettings.sortOrderStart = 0
  discoverBatchSettings.sortOrderStep = 10
}

const openDiscoverModelsDialog = async () => {
  if (!selectedProvider.value) {
    ElMessage.error('请先选择厂商')
    return
  }

  try {
    discoveringModels.value = true
    resetDiscoverState()
    const result = await discoverAdminProviderModels(selectedProvider.value.id)
    discoveredModels.value = result.models
    discoveredRequestUrl.value = result.requestUrl
    selectedDiscoveredModelKeys.value = result.models.map(item => item.modelKey)
    discoverDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error?.message || '拉取模型失败')
  } finally {
    discoveringModels.value = false
  }
}

const closeDiscoverModelsDialog = () => {
  discoverDialogVisible.value = false
  resetDiscoverState()
}

const toggleSelectAllDiscoveredModels = (checked: boolean) => {
  selectedDiscoveredModelKeys.value = checked ? discoveredModels.value.map(item => item.modelKey) : []
}

const handleSelectAllDiscoveredModelsChange = (event: Event) => {
  toggleSelectAllDiscoveredModels(Boolean((event.target as HTMLInputElement | null)?.checked))
}

const getDiscoveredModelImportAction = (item: DiscoveredProviderModelItem) => {
  const matchedModel = models.value.find(model => {
    return model.category === discoverBatchSettings.category && model.modelKey === item.modelKey
  })
  return matchedModel ? 'update' : 'create'
}

const handleBatchImportModels = async () => {
  if (!selectedProvider.value) {
    ElMessage.error('请先选择厂商')
    return
  }
  const selectedItems = discoveredModels.value.filter(item => selectedDiscoveredModelKeys.value.includes(item.modelKey))
  if (!selectedItems.length) {
    ElMessage.error('请至少选择一个模型')
    return
  }

  try {
    discoverImporting.value = true
    const payloadItems = selectedItems.map((item, index) => ({
      category: discoverBatchSettings.category,
      label: item.label || item.modelKey,
      modelKey: item.modelKey,
      description: item.description || '',
      sortOrder: Number(discoverBatchSettings.sortOrderStart) + index * Math.max(1, Number(discoverBatchSettings.sortOrderStep) || 10),
      isEnabled: Boolean(discoverBatchSettings.isEnabled),
      capabilityJson: null,
      defaultParamsJson: null,
    }))

    await batchUpsertAdminProviderModels(selectedProvider.value.id, {
      items: payloadItems,
    })
    await loadModels(selectedProvider.value.id)
    await loadProviders()
    closeDiscoverModelsDialog()
  } catch (error: any) {
    ElMessage.error(error?.message || '批量导入模型失败')
  } finally {
    discoverImporting.value = false
  }
}

const openEditModelDialog = (model: AdminProviderModelItem) => {
  applyModelForm(model)
  activeModelTab.value = 'basic'
  modelDialogVisible.value = true
}

const closeModelDialog = () => {
  modelDialogVisible.value = false
  resetModelForm()
}

const readCapabilityFlag = (value: Record<string, any> | null | undefined, key: string) => Boolean(value && value[key])

const toggleModelCapability = (key: string) => {
  const nextCapabilityJson = { ...(modelForm.capabilityJson || {}) }
  if (nextCapabilityJson[key]) {
    delete nextCapabilityJson[key]
  } else {
    nextCapabilityJson[key] = true
  }
  modelForm.capabilityJson = nextCapabilityJson
}

const mergeModelDefaultParams = () => {
  const parsedDefaultParams = parseOptionalJson(modelForm.defaultParamsJsonText, '默认参数 JSON') || {}

  return {
    ...parsedDefaultParams,
    billingRule: {
      power: Number(modelForm.billingPower) || 0,
      tokens: Number(modelForm.billingTokens) || 1000,
    },
    membershipLevels: normalizeMembershipLevels(modelForm.membershipLevelsText),
    maxContext: Number(modelForm.maxContext) || 3,
    isDefault: Boolean(modelForm.isDefault),
  }
}

const buildModelPayload = (): AdminProviderModelPayload => {
  const capabilityJson = { ...(modelForm.capabilityJson || {}) }

  // 仅在 IMAGE 类别保留单次最大出图张数；其它类别去掉，避免无关字段污染。
  if (modelForm.category === 'IMAGE') {
    const value = Number(modelForm.maxImagesPerRequest)
    if (Number.isFinite(value) && value >= 1) {
      capabilityJson.maxImagesPerRequest = Math.floor(value)
    } else {
      delete capabilityJson.maxImagesPerRequest
    }
  } else {
    delete capabilityJson.maxImagesPerRequest
  }

  return {
    category: modelForm.category,
    label: modelForm.label,
    modelKey: modelForm.modelKey,
    description: modelForm.description,
    sortOrder: Number(modelForm.sortOrder) || 0,
    isEnabled: Boolean(modelForm.isEnabled),
    capabilityJson: Object.keys(capabilityJson).length ? capabilityJson : null,
    defaultParamsJson: mergeModelDefaultParams(),
  }
}

const readModelPrice = (model: AdminProviderModelItem) => {
  const defaultParams = (model.defaultParamsJson || {}) as Record<string, any>
  const billingRule = (defaultParams.billingRule || {}) as Record<string, any>
  return Number(billingRule.power || 0) || 0
}

const formatConnectivityStep = (step: AdminProviderConnectivityStep) => {
  const statusText = step.ok ? '通过' : step.error || '失败'
  return `${statusText} · ${step.durationMs}ms`
}

const handleSaveModel = async () => {
  if (!selectedProvider.value) {
    ElMessage.error('请先选择厂商')
    return
  }

  try {
    modelSaving.value = true
    const payload = buildModelPayload()
    if (editingModelId.value) {
      await updateAdminProviderModel(selectedProvider.value.id, editingModelId.value, payload)
    } else {
      await createAdminProviderModel(selectedProvider.value.id, payload)
    }
    await loadModels(selectedProvider.value.id)
    await loadProviders()
    closeModelDialog()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存模型失败')
  } finally {
    modelSaving.value = false
  }
}

const toggleModelEnabled = async (model: AdminProviderModelItem) => {
  if (!selectedProvider.value) {
    return
  }

  await updateAdminProviderModel(selectedProvider.value.id, model.id, {
    category: model.category,
    label: model.label,
    modelKey: model.modelKey,
    description: model.description,
    sortOrder: model.sortOrder,
    isEnabled: !model.isEnabled,
    capabilityJson: model.capabilityJson,
    defaultParamsJson: model.defaultParamsJson,
  })
  await loadModels(selectedProvider.value.id)
  await loadProviders()
}

const handleDeleteModel = async (model: AdminProviderModelItem) => {
  if (!selectedProvider.value) {
    return
  }

  if (!window.confirm(`确认删除模型“${model.label}”吗？`)) {
    return
  }

  await deleteAdminProviderModel(selectedProvider.value.id, model.id)
  await loadModels(selectedProvider.value.id)
  await loadProviders()
}

const handleWindowClick = () => {
  closeProviderMenu()
}

onMounted(() => {
  window.addEventListener('click', handleWindowClick)
  void loadProviders()
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleWindowClick)
})
</script>

<style scoped>
.admin-model-discover__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 0 12px;
}

.admin-model-discover__summary {
  color: var(--text-secondary);
  font-size: 13px;
}

.admin-model-discover__summary em {
  font-style: normal;
}

.admin-model-discover__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 420px;
  overflow: auto;
}

.admin-model-discover__row {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 12px 14px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 12px;
  background: var(--bg-surface);
}

.admin-model-discover__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.admin-model-discover__headline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.admin-model-discover__content strong,
.admin-model-discover__content span,
.admin-model-discover__content small {
  word-break: break-word;
}

.admin-model-discover__content span {
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-model-discover__content small {
  color: var(--text-tertiary, #8a8f98);
  font-size: 12px;
  line-height: 1.5;
}

.admin-model-discover__badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1.5;
}

.admin-model-discover__badge.is-update {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}

.admin-model-discover__badge.is-create {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.admin-model-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
  padding: 6px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 16px;
  background: color-mix(in srgb, var(--bg-surface) 86%, var(--bg-block-secondary-default));
}

.admin-model-tabs__item {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  flex: 1 1 auto;
  min-width: 120px;
  padding: 8px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color .2s ease, color .2s ease, border-color .2s ease, box-shadow .2s ease;
}

.admin-model-tabs__item:hover {
  background: var(--bg-block-secondary-default);
  color: var(--text-primary);
}

.admin-model-tabs__item.is-active {
  border-color: color-mix(in srgb, var(--brand-main-default) 30%, transparent);
  background: color-mix(in srgb, var(--brand-main-default) 16%, transparent);
  color: var(--brand-main-default);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand-main-default) 14%, transparent);
}

.admin-model-tabs__item span {
  font-size: 13px;
  font-weight: 600;
}

.admin-model-tabs__item small {
  color: inherit;
  opacity: .72;
  font-size: 12px;
}

.admin-model-tab-panel {
  margin-bottom: 8px;
}
</style>
