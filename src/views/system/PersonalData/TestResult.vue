<template>
    <div class="test-result">
        <div class="test-body">
            <div class="test-header">
                <div>共计{{ testResults.length }}条测试记录</div>
                <el-button type="primary" @click="startLearning" v-if="hasMark">开始学习</el-button>
            </div>
            <el-table v-loading="loading" :data="testResults"  height="300px">
                <el-table-column prop="test_title" label="测试标题" />
                <el-table-column prop="score" label="分数/评级">
                    <template #default="scope">
                        <el-tag size="large" style="font-size: 14px;"
                            :type="getScoreType(scope.row.score, scope.row.type, scope.row.is_graded, scope.row.grade_level || '')">
                            {{ getScoreText(scope.row) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="is_graded" label="批改状态">
                    <template #default="scope">
                        <el-tag style="font-size: 14px;" size="large"
                            :type="scope.row.is_graded ? 'success' : 'warning'">
                            {{ scope.row.is_graded ? '已批改' : '待批改' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="submitted_at" label="提交时间" width="180">
                    <template #default="scope">
                        {{ formatDate(scope.row.submitted_at) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                    <template #default="scope">
                        <el-button-group>
                            <el-button type="primary" @click="viewDetails(scope.row)">查看详情</el-button>
                        </el-button-group>
                    </template>
                </el-table-column>
                <el-empty>
                    <template #description>
                        暂无测试记录
                    </template>
                </el-empty>
            </el-table>
        </div>

        <!-- 详情对话框 -->
        <el-dialog v-model="detailsDialogVisible" title="测试详情" width="700px">
            <div v-loading="loadingDetails">
                <template v-if="currentTestResult">
                    <div class="details-header">
                        <div class="detail-item">
                            <span class="label">测试标题:</span>
                            <span>{{ currentTestResult.test_title || '无标题' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">满分:100</span>
                            <span></span>
                        </div>
                        <div class="detail-item">
                            <span class="label">{{ currentTestResult.type === 'case' && currentTestResult.grade_level ? '评级:' : '得分:' }}</span>
                            <el-tag size="large" style="font-size: 14px;"
                                :type="getScoreType(currentTestResult.score, currentTestResult.type, currentTestResult.is_graded, currentTestResult.grade_level || '')">
                                {{ getScoreText(currentTestResult) }}
                            </el-tag>
                        </div>
                        <div class="detail-item">
                            <span class="label">提交时间:</span>
                            <span>{{ formatDate(currentTestResult.submitted_at) }}</span>
                        </div>
                    </div>

                    <el-divider />

                    <div class="answer-list">
                        <div v-for="(answer, index) in answerDetails" :key="answer.id" class="answer-item">
                            <div class="question-header">
                                <div class="question-number">问题 {{ index + 1 }}</div>
                                <div class="question-type">
                                    <el-tag>{{ getQuestionTypeLabel(answer.question_type) }}</el-tag>
                                </div>
                                <template v-if="answer.is_correct !== null && answer.question_type != 'reading'">
                                    <div class="answer-result">
                                        <el-tag :type="answer.is_correct ? 'success' : 'danger'">
                                            {{ answer.is_correct ? '正确' : '错误' }}
                                        </el-tag>
                                    </div>
                                </template>
                            </div>

                            <div class="question-content">
                                <div class="label">题目:</div>
                                <div class="content">{{ answer.question_text }}</div>
                            </div>

                            <div class="answer-content">
                                <div class="label">您的答案:</div>
                                <div class="content">{{ answer.answer }}</div>
                            </div>
                            <div class="answer-content"
                                v-if="!(answer.question_type === 'reading' && answer.score == 0)">
                                <div class="label">得分:</div>
                                <div class="content">{{ answer.score }}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 添加案例分析题的评级和评价在答题列表后面 -->
                    <template v-if="currentTestResult.type === 'case' && currentTestResult.is_graded">
                        <el-divider content-position="left">教师评价</el-divider>
                        <div class="evaluation-section">
                            <div class="evaluation-header">
                                <div class="evaluation-item">
                                    <span class="label">综合评级:</span>
                                    <el-tag size="large" style="font-size: 16px;" :type="getGradeTagType(currentTestResult.grade_level)">
                                        {{ currentTestResult.grade_level || '-' }}
                                    </el-tag>
                                </div>
                            </div>
                            <div class="evaluation-feedback">
                                <div class="label">评语:</div>
                                <div class="feedback-content">
                                    {{ currentTestResult.feedback_text || '老师暂未留下具体评价。' }}
                                </div>
                            </div>
                        </div>
                    </template>
                </template>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { testResultService, type TestResult, type TestAnswerDetail } from '@/stores/testResultService'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const loading = ref(false)
const loadingDetails = ref(false)
const testResults = ref<TestResult[]>([])
const detailsDialogVisible = ref(false)
const currentTestResult = ref<TestResult | null>(null)
const answerDetails = ref<TestAnswerDetail[]>([])
const userStore = useUserStore()

const hasMark = computed(() => {
    const mark = userStore.user?.role?.mark
    return Array.isArray(mark) && mark.length > 0
})

// 获取测试记录列表
const fetchTestResults = async () => {
    loading.value = true
    try {
        const { data } = await testResultService.getUserTestResults({
            page: 1,
            pageSize: 100
        })
        testResults.value = data.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    } catch (error: any) {
        console.error('获取测试记录失败:', error)
        if (error.message === '用户未登录') {
            ElMessage.error('请先登录后再查看测试记录')
        } else if (error.message === '无效的用户ID格式') {
            ElMessage.error('用户信息异常，请重新登录')
        } else {
            ElMessage.error('获取测试记录失败，请稍后重试')
        }
        testResults.value = [] // 清空数据
    } finally {
        loading.value = false
    }
}

// 查看详情
const viewDetails = async (result: TestResult) => {
    loadingDetails.value = true
    currentTestResult.value = result
    detailsDialogVisible.value = true

    try {
        const details = await testResultService.getTestResultDetails(result.id!)
        answerDetails.value = details.answerDetails
    } catch (error) {
        console.error('加载测试详情失败:', error)
        ElMessage.error('加载测试详情失败，请稍后重试')
    } finally {
        loadingDetails.value = false
    }
}

// 格式化日期
const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// 获取分数类型
const getScoreType = (score: number | null, type: string, isGraded: boolean, grade_level: string) => {
    if (score === null) return 'info'
    if ( type == 'comprehensive') {
        return isGraded ? 'success' : 'warning';
    }
    if (type == 'case') {
        switch (grade_level) {
            case 'A': return 'success';
            case 'B': return 'warning';
            case 'C': return 'warning';
            case 'D': return 'danger';
            default: return 'info';
        }
    }
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'danger'
}

// 获取分数显示文本
const getScoreText = (result: TestResult) => {
    const { score, type, is_graded, grade_level ,} = result;
    
    if (!is_graded) return '待批改';
    
    if (type === 'case') {
        return grade_level ? `评级: ${grade_level}` : `${score}分`;
    } else if (type === 'comprehensive') {
        return `${score}分`;
    }
    
    return `${score}分`;
};

// 获取评级标签类型
const getGradeTagType = (grade?: string) => {
    switch (grade) {
        case 'A': return 'success';
        case 'B': return 'success';
        case 'C': return 'warning';
        case 'D': return 'danger';
        default: return 'info';
    }
};

// 获取题目类型标签
const getQuestionTypeLabel = (type: string) => {
    switch (type) {
        case 'select': return '选择题'
        case 'judge': return '判断题'
        case 'fill': return '填空题'
        case 'question': return '简答题'
        case 'reading': return '阅读题'
        default: return '未知类型'
    }
}

// 开始学习
const startLearning = () => {
    if (hasMark.value) {
        const mark = userStore.user?.role?.mark[0]
        router.push(`/system/exam-content?platform=${mark}`)
    } else {
        ElMessage.error('您没有权限进行学习')
    }
}

onMounted(() => {
    fetchTestResults()
})
</script>

<style scoped>
/* .test-result {
    padding: 10px 20px;
} */

.test-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.details-header {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 20px;
}

.detail-item {
    margin-right: 20px;
    margin-bottom: 10px;
}

.label {
    font-weight: bold;
    margin-right: 10px;
}

.answer-list {
    margin-top: 20px;
}

.answer-item {
    margin-bottom: 15px;
    border-bottom: 1px dashed #eee;
    padding-bottom: 15px;
}

.question-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
}

.question-number {
    font-weight: bold;
    margin-right: 15px;
}

.question-type {
    margin-right: 15px;
}

.question-content {
    margin-top: 10px;
    display: flex;
}

.question-content .label {
    min-width: 80px;
}

.question-content .content {
    white-space: pre-wrap;
    word-break: break-word;
    color: #303133;
    font-weight: 500;
}

.answer-content {
    margin-top: 10px;
    display: flex;
}

.answer-content .label {
    min-width: 80px;
}

.answer-content .content {
    white-space: pre-wrap;
    word-break: break-word;
}

:deep(.el-dialog) {
    padding: 30px;
}

.feedback-content {
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 4px;
    margin: 10px 0;
    min-height: 100px;
    white-space: pre-wrap;
    word-break: break-word;
}

.evaluation-section {
    margin-top: 20px;
}

.evaluation-header {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 15px;
}

.evaluation-item {
    margin-right: 20px;
    margin-bottom: 10px;
}

.evaluation-feedback {
    margin-top: 10px;
}
</style>