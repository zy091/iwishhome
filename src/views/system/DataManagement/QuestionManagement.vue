<template>
    <div class="layout">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="layout-title">
            <h1 class="title">试题管理</h1>
        </div>

        <!-- 搜索功能 -->
        <el-card shadow="always" style="margin-bottom: 20px;">
            <el-space wrap alignment="start" :size="30">
                <el-input v-model="searchQuery" style="width: 240px" placeholder="请输入试题内容" :suffix-icon="Search"
                    size="large" clearable />
                <el-select v-model="typeFilter" placeholder="题型" clearable style="width: 180px" size="large">
                    <el-option v-for="type in questionTypes" :key="type.value" :label="type.label"
                        :value="type.value" />
                </el-select>
                <el-select v-model="platformFilter" placeholder="平台" clearable style="width: 180px" size="large">
                    <el-option v-for="platform in platforms" :key="platform.value" :label="platform.label"
                        :value="platform.value" />
                </el-select>
                <el-button type="primary" size="large" @click="searchQuestions">搜索</el-button>
                <el-button type="primary" size="large" @click="showAddDialog">添加试题</el-button>
            </el-space>
        </el-card>

        <!-- 问题列表 -->
        <el-card style="min-height: 400px;">
            <template #header>
                <div class="card-header">
                    <span>试题列表</span>
                    <div class="header-actions">
                        <el-button type="danger" :disabled="!selectedQuestions.length" @click="handleBatchDelete">
                            批量删除
                        </el-button>
                        <div style="font-size: 14px; color: #909399;">共计 {{ pagination.total }} 条数据</div>
                    </div>
                </div>
            </template>

            <el-table v-loading="loading" :data="questions" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" />
                <el-table-column prop="question_type" label="题型" width="100">
                    <template #default="{ row }">
                        {{ getQuestionTypeName(row.question_type) }}
                    </template>
                </el-table-column>
                <el-table-column prop="text" label="试题内容" >
                    <template #default="{ row }">
                        <el-tooltip placement="top" :show-after="500" :max-width="300">
                            <template #content>
                                <div class="tooltip-content">{{ row.text }}</div>
                            </template>
                            <div class="text-truncate">{{ row.text }}</div>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column prop="platform" label="平台" >
                    <template #default="{ row }">
                        {{ getPlatformName(row.platform) }}
                    </template>
                </el-table-column>
                <el-table-column prop="chapter" label="章节" width="200">
                    <template #default="{ row }">
                        <el-tag type="success" class="chapter-tag" size="large"
                            v-if="row.chapter === 'base'">基础</el-tag>
                        <el-tag type="warning" class="chapter-tag" size="large"
                            v-if="row.chapter === 'middle'">中级</el-tag>
                        <el-tag type="danger" class="chapter-tag" size="large"
                            v-if="row.chapter === 'advanced'">高级</el-tag>
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
            <el-empty v-if="!loading && questions.length === 0" description="暂无问题" />
        </el-card>
        <Pagination :pagination="pagination" @update:pagination="handlePaginationUpdate" />

        <!-- 添加/编辑问题对话框 -->
        <el-dialog :title="isEdit ? '编辑试题' : '添加试题'" v-model="dialogVisible" width="50%">
            <el-form :model="questionForm" :rules="rules" ref="questionFormRef" label-width="100px">
                <el-form-item label="题型" prop="question_type">
                    <el-radio-group v-model="questionForm.question_type">
                        <el-radio label="select">选择题</el-radio>
                        <el-radio label="reading">简答题</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="平台" prop="platform">
                    <el-select v-model="questionForm.platform" placeholder="请选择平台" style="width: 100%">
                        <el-option v-for="platform in platforms" :key="platform.value" :label="platform.label"
                            :value="platform.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="章节" prop="chapter">
                    <el-select v-model="questionForm.chapter" placeholder="请选择章节" style="width: 100%">
                        <el-option v-for="chapter in chapters" :key="chapter.value" :label="chapter.label"
                            :value="chapter.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="试题内容" prop="text">
                    <el-input v-if="questionForm.question_type === 'select'" v-model="questionForm.text" type="textarea"
                        :rows="4" placeholder="请输入试题内容"></el-input>
                    <el-input v-if="questionForm.question_type === 'reading'" v-model="questionForm.text"
                        type="textarea" :rows="8" placeholder="请输入试题内容"></el-input>

                </el-form-item>
                <el-form-item v-if="questionForm.question_type === 'reading'" label="参考答案">
                    <el-input v-model="questionForm.correct_answer" type="textarea" :rows="5"
                        placeholder="请输入参考答案"></el-input>
                </el-form-item>

                <!-- 选择题特有字段 -->
                <template v-if="questionForm.question_type === 'select'">
                    <el-form-item label="选项" prop="options">
                        <div v-for="(option, index) in questionForm.options" :key="index" class="option-item">
                            <el-input v-model="questionForm.options[index]" placeholder="请输入选项内容">
                                <template #prefix>
                                    <span>{{ String.fromCharCode(65 + index) }}. </span>
                                </template>
                                <template #append>
                                    <el-button @click="removeOption(index)"
                                        :disabled="questionForm.options.length <= 2">
                                        <el-icon>
                                            <Delete />
                                        </el-icon>
                                    </el-button>
                                </template>
                            </el-input>
                        </div>
                        <div style="margin-top: 10px;">
                            <el-button @click="addOption" :disabled="questionForm.options.length >= 6">添加选项</el-button>
                        </div>
                    </el-form-item>
                    <el-form-item label="正确答案" prop="correct_answer">
                        <el-select v-model="questionForm.correct_answer" placeholder="请选择正确答案" style="width: 100%">
                            <el-option v-for="(option, index) in questionForm.options" :key="index"
                                :label="`${String.fromCharCode(65 + index)}. ${option}`" :value="option" />
                        </el-select>
                    </el-form-item>
                </template>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="saveQuestion">确定</el-button>
            </template>
        </el-dialog>

        <!-- 查看问题对话框 -->
        <el-dialog title="试题详情" v-model="viewDialogVisible" width="50%">
            <div class="question-details">
                <div class="detail-row">
                    <p><strong>题型:</strong> <span>{{ getQuestionTypeName(selectedQuestion?.question_type) }}</span></p>
                    <p><strong>平台:</strong> <span>{{ getPlatformName(selectedQuestion?.platform) }}</span></p>
                    <el-tag :type="selectedQuestion?.chapter === 'base' ? 'success' :
                        selectedQuestion?.chapter === 'middle' ? 'warning' : 'danger'"
                        class="chapter-detail-tag">
                        {{ getChapterName(selectedQuestion?.chapter) }}
                    </el-tag>
                </div>
                <p><strong>试题内容:</strong></p>
                <div class="question-text">{{ selectedQuestion?.text }}</div>
                <p v-if="selectedQuestion?.question_type === 'reading'"><strong>参考答案:</strong></p>
                <div v-if="selectedQuestion?.question_type === 'reading'" class="question-text question-text-reading">{{
                    selectedQuestion?.correct_answer }}</div>

                <template v-if="selectedQuestion?.question_type === 'select'">
                    <p><strong>选项:</strong></p>
                    <div class="options-list">
                        <div v-for="(option, index) in selectedQuestion?.options" :key="index" class="option-item">
                            <div :class="{ 'correct-answer': option === selectedQuestion?.correct_answer }">
                                {{ String.fromCharCode(65 + index) }}. {{ option }}
                                <el-tag v-if="option === selectedQuestion?.correct_answer" size="small"
                                    type="success">正确答案</el-tag>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
            <template #footer>
                <el-button @click="viewDialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { supabase } from '@/lib/supabaseClient'
import Breadbcrum from '@/components/system/Breadcrumb.vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'

const breadbcrum = reactive([
    {
        name: '数据管理',
        path: '/system/data-management'
    },
    {
        name: '试题管理',
        path: '/system/question-management'
    }
])

// 状态变量
const loading = ref(false)
const questions = ref<any[]>([])
const searchQuery = ref('')
const typeFilter = ref('')
const platformFilter = ref('')
const selectedQuestions = ref<any[]>([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const isEdit = ref(false)
const selectedQuestion = ref<any | null>(null)
const questionFormRef = ref(null)

// 问题表单
const questionForm = reactive({
    id: null as number | null,
    text: '',
    options: ['', ''],
    correct_answer: '',
    question_type: 'select',
    platform: '',
    chapter: ''
})

// 题型选项
const questionTypes = [
    { label: '选择题', value: 'select' },
    { label: '简答题', value: 'reading' }
]

// 平台选项
const platforms = [
    { value: 'google', label: 'Google' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'microsoft', label: 'Microsoft' },
    { value: 'meta', label: 'Meta' },
    { value: 'other', label: 'Other' }
]

// 章节选项
const chapters = [
    { value: 'base', label: '基础' },
    { value: 'middle', label: '中级' },
    { value: 'advanced', label: '高级' }
]

// 分页配置
const pagination = reactive<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
})

// 表单验证规则
const rules = {
    question_type: [{ required: true, message: '请选择题型', trigger: 'change' }],
    platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
    chapter: [{ required: true, message: '请输入章节', trigger: 'blur' }],
    text: [{ required: true, message: '请输入问题内容', trigger: 'blur' }],
    correct_answer: [{ required: true, message: '请选择正确答案', trigger: 'change' }]
}

// 获取题型名称
const getQuestionTypeName = (type: string) => {
    const found = questionTypes.find(t => t.value === type)
    return found ? found.label : type
}

// 获取平台名称
const getPlatformName = (platform: string) => {
    const found = platforms.find(p => p.value === platform)
    return found ? found.label : platform
}

// 获取章节名称
const getChapterName = (chapter: string) => {
    const found = chapters.find(c => c.value === chapter)
    return found ? found.label : chapter
}

// 分页更新处理
const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    searchQuestions()
}

// 表格选择变化处理
const handleSelectionChange = (selection: any[]) => {
    selectedQuestions.value = selection
}

// 搜索问题
const searchQuestions = async () => {
    loading.value = true
    try {
        // 构建查询
        let query = supabase
            .from('googlequestions')
            .select('*', { count: 'exact' })

        // 文本搜索
        if (searchQuery.value) {
            query = query.ilike('text', `%${searchQuery.value}%`)
        }

        // 题型过滤
        if (typeFilter.value) {
            query = query.eq('question_type', typeFilter.value)
        }

        // 平台过滤
        if (platformFilter.value) {
            query = query.eq('platform', platformFilter.value)
        }

        // 执行分页查询
        const { data, error, count } = await query
            .order('id', { ascending: false })
            .range((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize - 1)

        if (error) throw error

        questions.value = data || []
        pagination.total = count || 0
    } catch (error) {
        ElMessage.error('搜索问题失败')
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
const showEditDialog = (question: any) => {
    isEdit.value = true
    resetForm()

    // 填充表单数据
    questionForm.id = question.id
    questionForm.text = question.text
    questionForm.question_type = question.question_type
    questionForm.platform = question.platform
    questionForm.chapter = question.chapter

    // 处理选择题特有字段
    if (question.question_type === 'select') {
        questionForm.options = [...question.options]
    }
    questionForm.correct_answer = question.correct_answer

    dialogVisible.value = true
}

// 显示查看对话框
const showViewDialog = (question: any) => {
    selectedQuestion.value = question
    viewDialogVisible.value = true
}

// 重置表单
const resetForm = () => {
    questionForm.id = null
    questionForm.text = ''
    questionForm.options = ['', '']
    questionForm.correct_answer = ''
    questionForm.question_type = 'select'
    questionForm.platform = ''
    questionForm.chapter = ''
}

// 添加选项
const addOption = () => {
    if (questionForm.options.length < 6) {
        questionForm.options.push('')
    }
}

// 移除选项
const removeOption = (index: number) => {
    if (questionForm.options.length > 2) {
        questionForm.options.splice(index, 1)
        // 如果删除的是正确答案，清空正确答案
        if (questionForm.correct_answer === questionForm.options[index]) {
            questionForm.correct_answer = ''
        }
    }
}

// 保存问题
const saveQuestion = async () => {
    if (!questionFormRef.value) return

    try {
        // 表单验证
        await (questionFormRef.value as any).validate()

        // 准备数据
        const questionData: any = {
            text: questionForm.text,
            question_type: questionForm.question_type,
            platform: questionForm.platform,
            chapter: questionForm.chapter
        }

        // 选择题特有字段
        if (questionForm.question_type === 'select') {
            questionData.options = questionForm.options
            questionData.correct_answer = questionForm.correct_answer
        } else {
            // 问答题不需要选项和正确答案
            questionData.options = null
            questionData.correct_answer = null
        }

        let result

        if (isEdit.value && questionForm.id) {
            // 更新问题
            const { data, error } = await supabase
                .from('googlequestions')
                .update(questionData)
                .eq('id', questionForm.id)
                .select()

            if (error) throw error
            result = data
            ElMessage.success('问题更新成功')
        } else {
            // 新增问题
            const { data, error } = await supabase
                .from('googlequestions')
                .insert(questionData)
                .select()

            if (error) throw error
            result = data
            ElMessage.success('问题添加成功')
        }

        dialogVisible.value = false
        searchQuestions() // 刷新列表
    } catch (error) {
        if (error !== 'cancel') {
            console.error('保存问题失败:', error)
            ElMessage.error('保存失败，请检查表单')
        }
    }
}

// 删除问题
const handleDelete = async (question: any) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除这个问题吗？此操作不可恢复。`,
            '警告',
            { type: 'warning' }
        )

        const { error } = await supabase
            .from('googlequestions')
            .delete()
            .eq('id', question.id)

        if (error) throw error

        ElMessage.success('删除成功')
        searchQuestions() // 刷新列表
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除问题失败:', error)
            ElMessage.error('删除失败')
        }
    }
}

// 批量删除
const handleBatchDelete = async () => {
    if (selectedQuestions.value.length === 0) return

    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedQuestions.value.length} 个问题吗？此操作不可恢复。`,
            '警告',
            { type: 'warning' }
        )

        // 获取所有选中问题的ID
        const questionIds = selectedQuestions.value.map(q => q.id)

        const { error } = await supabase
            .from('googlequestions')
            .delete()
            .in('id', questionIds)

        if (error) throw error

        ElMessage.success(`成功删除 ${selectedQuestions.value.length} 个问题`)
        selectedQuestions.value = []
        searchQuestions() // 刷新列表
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量删除问题失败:', error)
            ElMessage.error('批量删除失败')
        }
    }
}

onMounted(() => {
    searchQuestions()
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

.question-details {
    line-height: 1.8;
    font-size: 16px;
}

.question-text {
    margin: 10px 0;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
    border-left: 4px solid #409EFF;
    white-space: pre-wrap;
}

.question-text-reading {
    border-left: 4px solid #71c647;
}

.options-list {
    margin: 10px 0;
}

.option-item {
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 4px;
}

.correct-answer {
    color: #67C23A;
    font-weight: bold;
}

:deep(.el-form-item__content) {
    align-items: flex-start;
}

.chapter-tag {
    font-size: 14px;
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

.chapter-detail-tag {
    font-size: 14px;
    padding: 5px 10px;
}
.tooltip-content {
    /* max-height: 200px; */
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
</style>