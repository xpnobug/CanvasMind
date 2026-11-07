<template>
	<div class="admin-video-projects">
		<header class="page-header">
			<h2 class="title">视频项目管理</h2>
			<div class="filters">
				<el-input
					v-model="keyword"
					placeholder="按项目名搜索"
					clearable
					:prefix-icon="Search"
					style="width: 240px"
					@change="handleSearch"
				/>
				<el-button @click="refresh">刷新</el-button>
			</div>
		</header>

		<el-table
			v-loading="loading"
			:data="items"
			border
			stripe
			style="width: 100%"
		>
			<el-table-column label="项目名" min-width="200">
				<template #default="{ row }">
					<div class="name-cell">
						<img
							v-if="row.thumbnail"
							:src="row.thumbnail"
							class="thumb"
							alt=""
						/>
						<div v-else class="thumb thumb-placeholder">—</div>
						<span class="name">{{ row.metadata.name || '未命名项目' }}</span>
					</div>
				</template>
			</el-table-column>
			<el-table-column label="所属用户" min-width="160">
				<template #default="{ row }">
					<div v-if="row.owner">
						<div>{{ row.owner.name }}</div>
						<div class="email">{{ row.owner.email }}</div>
					</div>
					<span v-else>—</span>
				</template>
			</el-table-column>
			<el-table-column label="时长" width="100">
				<template #default="{ row }">
					{{ formatDuration(row.metadata.duration) }}
				</template>
			</el-table-column>
			<el-table-column prop="version" label="版本" width="80" align="center" />
			<el-table-column label="更新时间" width="180">
				<template #default="{ row }">
					{{ formatTime(row.updatedAt) }}
				</template>
			</el-table-column>
		</el-table>

		<div class="pagination">
			<el-pagination
				v-model:current-page="page"
				v-model:page-size="pageSize"
				:page-sizes="[20, 50, 100]"
				:total="totalCount"
				layout="total, sizes, prev, pager, next, jumper"
				background
				@change="refresh"
				@size-change="refresh"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import {
	listAllVideoProjects,
	type VideoProjectListItem,
} from '@/api/video-projects'

const items = ref<VideoProjectListItem[]>([])
const totalCount = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')

const refresh = async () => {
	loading.value = true
	try {
		const result = await listAllVideoProjects({
			page: page.value,
			pageSize: pageSize.value,
			keyword: keyword.value || undefined,
		})
		items.value = result.items
		totalCount.value = result.summary.totalCount
	} finally {
		loading.value = false
	}
}

const handleSearch = () => {
	page.value = 1
	void refresh()
}

onMounted(() => {
	void refresh()
})

const formatDuration = (seconds: number) => {
	const total = Math.max(0, Math.round(seconds || 0))
	const m = Math.floor(total / 60)
	const s = total % 60
	return `${m}:${String(s).padStart(2, '0')}`
}

const formatTime = (iso: string) => {
	const ts = new Date(iso).getTime()
	if (!Number.isFinite(ts)) return '—'
	return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}
</script>

<style scoped>
.admin-video-projects {
	padding: 24px;
}

.page-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16px;
	gap: 16px;
}

.title {
	margin: 0;
	font-size: 18px;
	font-weight: 600;
}

.filters {
	display: flex;
	gap: 12px;
	align-items: center;
}

.name-cell {
	display: flex;
	align-items: center;
	gap: 10px;
}

.thumb {
	width: 56px;
	height: 32px;
	object-fit: cover;
	border-radius: 4px;
	flex-shrink: 0;
}

.thumb-placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--el-bg-color-page);
	color: var(--el-text-color-placeholder);
	font-size: 12px;
}

.email {
	font-size: 12px;
	color: var(--el-text-color-secondary);
}

.pagination {
	display: flex;
	justify-content: flex-end;
	margin-top: 16px;
}
</style>
