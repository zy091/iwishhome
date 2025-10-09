<template>
    <div class="layout">
        <Breadcrumb :breadcrumb="breadcrumb" />
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
                <el-table-column prop="platform" label="平台"  width="100">
                    <template #default="{ row }">
                        {{ getPlatformName(row.platform) }}
                    </template>
                </el-table-column>
                <el-table-column prop="tests_title" label="所属测试" width="220">
                    <template #default="{ row }">
                        <el-tag type="primary" class="test-tag" size="large" v-if="row.tests_title">
                            {{ row.tests_title }}
                        </el-tag>
                        <el-tag type="info" class="test-tag" size="large" v-else>
                            未分配
                        </el-tag>
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
                        <el-radio label="judge">判断题</el-radio>
                        <el-radio label="fill">填空题</el-radio>
                        <el-radio label="question">问答题</el-radio>
                        <el-radio label="reading">阅读题</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="平台" prop="platform">
                    <el-select v-model="questionForm.platform" placeholder="请选择平台" style="width: 100%">
                        <el-option v-for="platform in platforms" :key="platform.value" :label="platform.label"
                            :value="platform.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="所属测试" prop="tests_id">
                    <el-select v-model="questionForm.tests_id" placeholder="请选择测试" style="width: 100%" 
                        @change="handleTestChange" clearable>
                        <el-option v-for="test in availableTests" :key="test.id" :label="test.title"
                            :value="test.id" />
                    </el-select>
                </el-form-item>
                <el-form-item v-if="questionForm.question_type === 'select'" label="题目类型">
                    <el-switch v-model="questionForm.is_multiple" 
                        active-text="多选题" 
                        inactive-text="单选题" />
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
                        <!-- 单选题 -->
                        <el-select v-if="!questionForm.is_multiple" v-model="questionForm.correct_answer" 
                            placeholder="请选择正确答案" style="width: 100%">
                            <el-option v-for="(option, index) in questionForm.options" :key="index"
                                :label="`${String.fromCharCode(65 + index)}. ${option}`" :value="option" />
                        </el-select>
                        <!-- 多选题 -->
                        <el-select v-else v-model="questionForm.correct_answer" 
                            placeholder="请选择正确答案（多选）" style="width: 100%" multiple>
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
                    <p v-if="selectedQuestion?.question_type === 'select'"><strong>类型:</strong> 
                        <el-tag :type="selectedQuestion?.is_multiple ? 'warning' : 'primary'" size="small">
                            {{ selectedQuestion?.is_multiple ? '多选题' : '单选题' }}
                        </el-tag>
                    </p>
                    <p><strong>平台:</strong> <span>{{ getPlatformName(selectedQuestion?.platform) }}</span></p>
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
                            <div :class="{ 'correct-answer': isCorrectAnswer(option, selectedQuestion) }">
                                {{ String.fromCharCode(65 + index) }}. {{ option }}
                                <el-tag v-if="isCorrectAnswer(option, selectedQuestion)" size="small"
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
import Breadcrumb from '@/components/system/Breadcrumb.vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'

const breadcrumb = reactive([
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
const availableTests = ref<any[]>([])

// 问题表单
const questionForm = reactive({
    id: null as number | null,
    text: '',
    options: ['', ''],
    correct_answer: '',
    question_type: 'select',
    platform: '',
    tests_id: null as string | null,
    tests_title: '',
    is_multiple: false
})

// 题型选项
const questionTypes = [
    { label: '选择题', value: 'select' },
    { label: '判断题', value: 'judge' },
    { label: '填空题', value: 'fill' },
    { label: '问答题', value: 'question' },
    { label: '阅读题', value: 'reading' }
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
    question_type: [{ required: true, message: '请选择题型', trigger: 'change' }],
    platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
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

// 判断选项是否为正确答案
const isCorrectAnswer = (option: string, question: any) => {
    if (!question || !question.correct_answer) return false
    
    if (question.is_multiple) {
        // 多选题：correct_answer是分号分隔的字符串
        const correctAnswers = question.correct_answer.split(';')
        return correctAnswers.includes(option)
    } else {
        // 单选题：直接比较
        return option === question.correct_answer
    }
}

// 获取可用测试列表
const fetchAvailableTests = async () => {
    try {
        const { data, error } = await supabase
            .from('tests')
            .select('id, title')
            .order('created_at', { ascending: false })

        if (error) throw error
        availableTests.value = data || []
    } catch (error) {
        console.error('获取测试列表失败:', error)
        ElMessage.error('获取测试列表失败')
    }
}

// 处理测试选择变化
const handleTestChange = (testId: string | null) => {
    if (testId) {
        const selectedTest = availableTests.value.find(test => test.id === testId)
        questionForm.tests_title = selectedTest?.title || ''
    } else {
        questionForm.tests_title = ''
    }
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
    questionForm.tests_id = question.tests_id
    questionForm.tests_title = question.tests_title || ''
    questionForm.is_multiple = question.is_multiple || false

    // 处理选择题特有字段
    if (question.question_type === 'select') {
        questionForm.options = [...question.options]
        
        // 处理多选题的正确答案
        if (question.is_multiple && question.correct_answer) {
            questionForm.correct_answer = question.correct_answer.split(';')
        } else {
            questionForm.correct_answer = question.correct_answer
        }
    } else {
        questionForm.correct_answer = question.correct_answer
    }

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
    questionForm.tests_id = null
    questionForm.tests_title = ''
    questionForm.is_multiple = false
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
            tests_id: questionForm.tests_id,
            tests_title: questionForm.tests_title
        }

        // 选择题特有字段
        if (questionForm.question_type === 'select') {
            questionData.options = questionForm.options
            questionData.is_multiple = questionForm.is_multiple
            
            // 处理正确答案格式
            if (questionForm.is_multiple && Array.isArray(questionForm.correct_answer)) {
                // 多选题：将数组转换为分号分隔的字符串
                questionData.correct_answer = questionForm.correct_answer.join(';')
            } else {
                // 单选题：直接使用字符串
                questionData.correct_answer = questionForm.correct_answer
            }
        } else {
            // 问答题不需要选项和正确答案
            questionData.options = null
            questionData.correct_answer = null
            questionData.is_multiple = false
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
    fetchAvailableTests()
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

.test-tag {
    font-size: 12px;
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