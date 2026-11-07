<template>
	<div class="vpl-root">
		<header class="vpl-header">
			<div>
				<h1 class="vpl-title">我的视频项目</h1>
				<p class="vpl-subtitle">编辑过的项目会自动云端保存,跨设备可继续创作</p>
			</div>
			<el-button type="primary" :loading="submitting" @click="handleCreate">
				<el-icon><Plus /></el-icon>
				新建项目
			</el-button>
		</header>

		<div v-if="loading && !projects.length" class="vpl-grid">
			<el-skeleton v-for="i in 4" :key="i" animated class="vpl-card-skeleton">
				<template #template>
					<el-skeleton-item variant="image" style="height: 160px; width: 100%" />
					<div style="padding: 12px">
						<el-skeleton-item variant="h3" style="width: 60%" />
						<el-skeleton-item variant="text" style="margin-top: 8px; width: 40%" />
					</div>
				</template>
			</el-skeleton>
		</div>

		<el-empty
			v-else-if="!projects.length"
			description="还没有项目"
			class="vpl-empty"
		>
			<el-button type="primary" :loading="submitting" @click="handleCreate">
				创建第一个项目
			</el-button>
		</el-empty>

		<div v-else class="vpl-grid">
			<article
				v-for="project in projects"
				:key="project.metadata.id"
				class="vpl-card"
				tabindex="0"
				@click="handleOpen(project.metadata.id)"
				@keyup.enter="handleOpen(project.metadata.id)"
			>
				<div class="vpl-thumb">
					<img
						v-if="project.thumbnail"
						:src="project.thumbnail"
						:alt="project.metadata.name"
						loading="lazy"
					/>
					<div v-else class="vpl-thumb-placeholder">
						<el-icon :size="32"><VideoCamera /></el-icon>
					</div>
				</div>
				<div class="vpl-info">
					<h3 class="vpl-name" :title="project.metadata.name">
						{{ project.metadata.name || '未命名项目' }}
					</h3>
					<div class="vpl-meta">
						<span>{{ formatDuration(project.metadata.duration) }}</span>
						<span class="vpl-dot">·</span>
						<span>{{ formatRelativeTime(project.updatedAt) }}</span>
					</div>
				</div>
				<el-popconfirm
					title="确定删除该项目?"
					confirm-button-text="删除"
					cancel-button-text="取消"
					@confirm.stop="handleDelete(project.metadata.id)"
				>
					<template #reference>
						<el-button
							class="vpl-delete-btn"
							size="small"
							type="danger"
							text
							circle
							:loading="submitting"
							@click.stop
						>
							<el-icon><Delete /></el-icon>
						</el-button>
					</template>
				</el-popconfirm>
			</article>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Delete, Plus, VideoCamera } from '@element-plus/icons-vue'
import { useVideoProjectStore } from '@/stores/video-project'

const router = useRouter()
const { projects, loading, submitting, loadProjects, createProject, removeProject } =
	useVideoProjectStore()

onMounted(() => {
	void loadProjects()
})

const handleCreate = async () => {
	try {
		const { value: name } = await ElMessageBox.prompt('请输入项目名称', '新建视频项目', {
			confirmButtonText: '创建',
			cancelButtonText: '取消',
			inputPlaceholder: '我的视频项目',
			inputValue: '',
			inputValidator: (v) => (v && v.trim().length > 0) || '名称不能为空',
		})
		const newId = await createProject(name)
		void router.push({ name: 'VideoEditor', params: { projectId: newId } })
	} catch {
		// 用户取消,无需处理
	}
}

const handleOpen = (id: string) => {
	void router.push({ name: 'VideoEditor', params: { projectId: id } })
}

const handleDelete = async (id: string) => {
	await removeProject(id)
}

const formatDuration = (seconds: number) => {
	const total = Math.max(0, Math.round(seconds || 0))
	const m = Math.floor(total / 60)
	const s = total % 60
	return `${m}:${String(s).padStart(2, '0')}`
}

const formatRelativeTime = (iso: string) => {
	const ts = new Date(iso).getTime()
	if (!Number.isFinite(ts)) return ''
	const diff = Date.now() - ts
	const min = Math.floor(diff / 60_000)
	if (min < 1) return '刚刚'
	if (min < 60) return `${min} 分钟前`
	const hr = Math.floor(min / 60)
	if (hr < 24) return `${hr} 小时前`
	const day = Math.floor(hr / 24)
	if (day < 30) return `${day} 天前`
	return new Date(ts).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
/*
 * 命名规则:统一 vpl-* 前缀,避免与 styles.css 中遗留的全局通用类名
 * (.card / .grid / .meta / .info / .name 等)产生冲突。
 * 历史教训:styles.css L5271 残留了一条全局 `.card { position: absolute;
 * top: -164px; opacity: 0; transform: scale(.2) }`,会把任何 .card 元素
 * 推到屏幕外+透明,导致本页 11 个项目卡片不可见。
 */
.vpl-root {
	max-width: 1280px;
	margin: 0 auto;
	padding: 32px 24px;
}

.vpl-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 28px;
	gap: 16px;
}

.vpl-title {
	margin: 0 0 4px;
	font-size: 24px;
	font-weight: 600;
}

.vpl-subtitle {
	margin: 0;
	color: var(--el-text-color-secondary);
	font-size: 13px;
}

.vpl-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
	gap: 20px;
}

.vpl-card-skeleton {
	border-radius: 12px;
	overflow: hidden;
	background: var(--el-bg-color-page);
}

.vpl-card {
	position: relative;
	background: var(--el-bg-color);
	border: 1px solid var(--el-border-color-light);
	border-radius: 12px;
	overflow: hidden;
	cursor: pointer;
	transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.vpl-card:hover,
.vpl-card:focus-visible {
	transform: translateY(-2px);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
	border-color: var(--el-color-primary-light-7);
	outline: none;
}

.vpl-thumb {
	aspect-ratio: 16 / 9;
	overflow: hidden;
	background: var(--el-bg-color-page);
}

.vpl-thumb img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.vpl-thumb-placeholder {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--el-text-color-placeholder);
}

.vpl-info {
	padding: 12px 14px;
}

.vpl-name {
	margin: 0 0 6px;
	font-size: 14px;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.vpl-meta {
	display: flex;
	align-items: center;
	gap: 6px;
	color: var(--el-text-color-secondary);
	font-size: 12px;
}

.vpl-meta .vpl-dot {
	opacity: 0.5;
}

.vpl-delete-btn {
	position: absolute;
	top: 8px;
	right: 8px;
	background: rgba(255, 255, 255, 0.92);
}

.vpl-empty {
	padding: 64px 0;
}
</style>
