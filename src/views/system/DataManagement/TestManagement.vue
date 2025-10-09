<template>
    <div class="layout">
        <Breadcrumb :breadcrumb="breadcrumb" />
        <div class="layout-title">
            <h1 class="title">测试管理</h1>
        </div>

        <!-- 搜索功能 -->
        <el-card shadow="always" style="margin-bottom: 20px;">
            <el-space wrap alignment="start" :size="30">
                <el-input v-model="searchQuery" style="width: 240px" placeholder="请输入测试标题" :suffix-icon="Search"
                    size="large" clearable />
                <el-select v-model="typeFilter" placeholder="测试类型" clearable style="width: 180px" size="large">
                    <el-option v-for="type in testTypes" :key="type.value" :label="type.label"
                        :value="type.value" />
                </el-select>
                <el-select v-model="platformFilter" placeholder="平台" clearable style="width: 180px" size="large">
                    <el-option v-for="platform in platforms" :key="platform.value" :label="platform.label"
                        :value="platform.value" />
                </el-select>
                <el-button type="primary" size="large" @click="searchTests">搜索</el-button>
                <el-button type="primary" size="large" @click="showAddDialog">添加测试</el-button>
            </el-space>
        </el-card>

        <!-- 测试列表 -->
        <el-card style="min-height: 400px;">
            <template #header>
                <div class="card-header">
                    <span>测试列表</span>
                    <div class="header-actions">
                        <el-button type="danger" :disabled="!selectedTests.length" @click="handleBatchDelete">
                            批量删除
                        </el-button>
                        <div style="font-size: 14px; color: #909399;">共计 {{ pagination.total }} 条数据</div>
                    </div>
                </div>
            </template>

            <el-table v-loading="loading" :data="tests" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" />
                <el-table-column prop="title" label="测试标题" min-width="200">
                    <template #default="{ row }">
                        <el-tooltip placement="top" :show-after="500" :max-width="300">
                            <template #content>
                                <div class="tooltip-content">{{ row.title }}</div>
                            </template>
                            <div class="text-truncate">{{ row.title }}</div>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column prop="type" label="测试类型" width="120">
                    <template #default="{ row }">
                        <el-tag :type="getTestTypeTagType(row.type)" size="large">
                            {{ getTestTypeName(row.type) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="platform" label="平台" width="120">
                    <template #default="{ row }">
                        {{ getPlatformName(row.platform) }}
                    </template>
                </el-table-column>
                <el-table-column prop="question_count" label="题目数量" width="100" align="center">
                    <template #default="{ row }">
                        <el-tag type="info" size="small">{{ row.question_count || 0 }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="score_weight" label="分数权重" width="100" align="center">
                    <template #default="{ row }">
                        {{ row.score_weight || 100 }}
                    </template>
                </el-table-column>
                <el-table-column prop="created_at" label="创建时间" width="180">
                    <template #default="{ row }">
                        {{ formatDate(row.created_at) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="220" fixed="right">
                    <template #default="{ row }">
                        <el-button-group>
                            <el-button type="primary" @click="showViewDialog(row)">查看</el-button>
                            <el-button type="success" @click="showEditDialog(row)">编辑</el-button>
                            <el-button type="danger" @click="handleDelete(row)">删除</el-button>
                        </el-button-group>
                    </template>
                </el-table-column>
            </el-table>
            <el-empty v-if="!loading && tests.length === 0" description="暂无测试" />
        </el-card>
        <Pagination :pagination="pagination" @update:pagination="handlePaginationUpdate" />

        <!-- 添加/编辑测试对话框 -->
        <el-dialog :title="isEdit ? '编辑测试' : '添加测试'" v-model="dialogVisible" width="50%">
            <el-form :model="testForm" :rules="rules" ref="testFormRef" label-width="100px">
                <el-form-item label="测试标题" prop="title">
                    <el-input v-model="testForm.title" placeholder="请输入测试标题" />
                </el-form-item>
                <el-form-item label="测试类型" prop="type">
                    <el-radio-group v-model="testForm.type">
                        <el-radio label="select">选择题测试</el-radio>
                        <el-radio label="case">案例分析</el-radio>
                        <el-radio label="comprehensive">综合测试</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="平台" prop="platform">
                    <el-select v-model="testForm.platform" placeholder="请选择平台" style="width: 100%">
                        <el-option v-for="platform in platforms" :key="platform.value" :label="platform.label"
                            :value="platform.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="题目数量" prop="question_count">
                    <el-input-number v-model="testForm.question_count" :min="0" :max="100" placeholder="题目数量" />
                </el-form-item>
                <el-form-item label="分数权重" prop="score_weight">
                    <el-input-number v-model="testForm.score_weight" :min="1" :max="1000" placeholder="分数权重" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="saveTest">确定</el-button>
            </template>
        </el-dialog>

        <!-- 查看测试对话框 -->
        <el-dialog title="测试详情" v-model="viewDialogVisible" width="50%">
            <div class="test-details">
                <div class="detail-row">
                    <p><strong>测试标题:</strong> <span>{{ selectedTest?.title }}</span></p>
                </div>
                <div class="detail-row">
                    <p><strong>测试类型:</strong></p>
                    <el-tag :type="getTestTypeTagType(selectedTest?.type)" size="large">
                        {{ getTestTypeName(selectedTest?.type) }}
                    </el-tag>
                </div>
                <div class="detail-row">
                    <p><strong>平台:</strong> <span>{{ getPlatformName(selectedTest?.platform) }}</span></p>
                    <p><strong>题目数量:</strong> <span>{{ selectedTest?.question_count || 0 }}</span></p>
                </div>
                <div class="detail-row">
                    <p><strong>分数权重:</strong> <span>{{ selectedTest?.score_weight || 100 }}</span></p>
                </div>
                <div class="detail-row">
                    <p><strong>创建时间:</strong> <span>{{ formatDate(selectedTest?.created_at) }}</span></p>
                    <p><strong>更新时间:</strong> <span>{{ formatDate(selectedTest?.updated_at) }}</span></p>
                </div>
            </div>
            <template #footer>
                <el-button @click="viewDialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { supabase } from '@/lib/supabaseClient'
import Breadcrumb from '@/components/system/Breadcrumb.vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'

const breadcrumb = reactive([
    {
        name: '数据管理',
        path: '/system/data-management'
    },
    {
        name: '测试管理',
        path: '/system/test-management'
    }
])

// 状态变量
const loading = ref(false)
const tests = ref<any[]>([])
const searchQuery = ref('')
const typeFilter = ref('')
const platformFilter = ref('')
const selectedTests = ref<any[]>([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const isEdit = ref(false)
const selectedTest = ref<any | null>(null)
const testFormRef = ref(null)

// 测试表单
const testForm = reactive({
    id: null as string | null,
    title: '',
    type: 'select',
    platform: '',
    question_count: 0,
    score_weight: 100
})

// 测试类型选项
const testTypes = [
    { label: '选择题测试', value: 'select' },
    { label: '案例分析', value: 'case' },
    { label: '综合测试', value: 'comprehensive' }
]

// 平台选项
const platforms = [
    { value: 'google', label: 'Google' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'microsoft', label: 'Microsoft' },
    { value: 'meta', label: 'Meta' },
    { value: 'other', label: 'Other' }
]

// 分页配置
const pagination = reactive<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
})

// 表单验证规则
const rules = {
    title: [{ required: true, message: '请输入测试标题', trigger: 'blur' }],
    type: [{ required: true, message: '请选择测试类型', trigger: 'change' }],
    platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
    question_count: [{ required: true, message: '请输入题目数量', trigger: 'blur' }],
    score_weight: [{ required: true, message: '请输入分数权重', trigger: 'blur' }]
}

// 获取测试类型名称
const getTestTypeName = (type: string) => {
    const found = testTypes.find(t => t.value === type)
    return found ? found.label : type
}

// 获取测试类型标签类型
const getTestTypeTagType = (type: string) => {
    switch (type) {
        case 'select': return 'primary'
        case 'case': return 'warning'
        case 'comprehensive': return 'danger'
        default: return 'info'
    }
}

// 获取平台名称
const getPlatformName = (platform: string) => {
    const found = platforms.find(p => p.value === platform)
    return found ? found.label : platform
}

// 格式化日期
const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN')
}

// 分页更新处理
const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    searchTests()
}

// 表格选择变化处理
const handleSelectionChange = (selection: any[]) => {
    selectedTests.value = selection
}

// 搜索测试
const searchTests = async () => {
    loading.value = true
    try {
        let query = supabase
            .from('tests')
            .select('*', { count: 'exact' })

        if (searchQuery.value) {
            query = query.ilike('title', `%${searchQuery.value}%`)
        }

        if (typeFilter.value) {
            query = query.eq('type', typeFilter.value)
        }

        if (platformFilter.value) {
            query = query.eq('platform', platformFilter.value)
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize - 1)

        if (error) throw error

        tests.value = data || []
        pagination.total = count || 0
    } catch (error) {
        ElMessage.error('搜索测试失败')
        console.error(error)
    } finally {
        loading.value = false
    }
}

// 显示添加对话框
const showAddDialog = () => {
    isEdit.value = false
    resetForm()
    dialogVisible.value = true
}

// 显示编辑对话框
const showEditDialog = (test: any) => {
    isEdit.value = true
    resetForm()

    testForm.id = test.id
    testForm.title = test.title
    testForm.type = test.type
    testForm.platform = test.platform
    testForm.question_count = test.question_count || 0
    testForm.score_weight = test.score_weight || 100

    dialogVisible.value = true
}

// 显示查看对话框
const showViewDialog = (test: any) => {
    selectedTest.value = test
    viewDialogVisible.value = true
}

// 重置表单
const resetForm = () => {
    testForm.id = null
    testForm.title = ''
    testForm.type = 'select'
    testForm.platform = ''
    testForm.question_count = 0
    testForm.score_weight = 100
}

// 保存测试
const saveTest = async () => {
    if (!testFormRef.value) return

    try {
        await (testFormRef.value as any).validate()

        const testData: any = {
            title: testForm.title,
            type: testForm.type,
            platform: testForm.platform,
            question_count: testForm.question_count,
            score_weight: testForm.score_weight,
            updated_at: new Date().toISOString()
        }

        if (isEdit.value && testForm.id) {
            const { error } = await supabase
                .from('tests')
                .update(testData)
                .eq('id', testForm.id)

            if (error) throw error
            ElMessage.success('测试更新成功')
        } else {
            const { error } = await supabase
                .from('tests')
                .insert(testData)

            if (error) throw error
            ElMessage.success('测试添加成功')
        }

        dialogVisible.value = false
        searchTests()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('保存测试失败:', error)
            ElMessage.error('保存失败，请检查表单')
        }
    }
}

// 删除测试
const handleDelete = async (test: any) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除测试"${test.title}"吗？此操作不可恢复。`,
            '警告',
            { type: 'warning' }
        )

        const { error } = await supabase
            .from('tests')
            .delete()
            .eq('id', test.id)

        if (error) throw error

        ElMessage.success('删除成功')
        searchTests()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除测试失败:', error)
            ElMessage.error('删除失败')
        }
    }
}

// 批量删除
const handleBatchDelete = async () => {
    if (selectedTests.value.length === 0) return

    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedTests.value.length} 个测试吗？此操作不可恢复。`,
            '警告',
            { type: 'warning' }
        )

        const testIds = selectedTests.value.map(t => t.id)

        const { error } = await supabase
            .from('tests')
            .delete()
            .in('id', testIds)

        if (error) throw error

        ElMessage.success(`成功删除 ${selectedTests.value.length} 个测试`)
        selectedTests.value = []
        searchTests()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量删除测试失败:', error)
            ElMessage.error('批量删除失败')
        }
    }
}

onMounted(() => {
    searchTests()
})
</script>

<style scoped>
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 15px;
}

.test-details {
    line-height: 1.8;
    font-size: 16px;
}

.detail-row {
    display: flex;
    flex-wrap: wrap;
    gap: 40px;
    align-items: center;
    margin-bottom: 15px;
}

.detail-row p {
    margin: 0;
}

.tooltip-content {
    max-width: 400px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
    padding: 5px;
}

.text-truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

:deep(.el-form-item__content) {
    align-items: flex-start;
}
</style>