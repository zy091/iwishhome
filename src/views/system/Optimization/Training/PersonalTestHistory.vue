<template>
    <div class="personal-test-history">
        <el-table v-loading="loading" :data="testResults">
            <el-table-column prop="test_title" label="测试标题" />
            <el-table-column prop="score" label="分数/评级" width="120">
                <template #default="scope">
                    <el-tag size="large" style="font-size: 14px;" :type="getScoreType(scope.row.score, scope.row.type, scope.row.is_graded)">
                        {{ getScoreText(scope.row) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="submitted_at" label="提交时间" width="180">
                <template #default="scope">
                    {{ formatDate(scope.row.submitted_at) }}
                </template>
            </el-table-column>
            <el-table-column label="批改状态" width="100">
                <template #default="scope">
                    <el-tag style="font-size: 14px;" size="large" :type="scope.row.is_graded ? 'success' : 'warning'">
                        {{ scope.row.is_graded ? '已批改' : '待批改' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
                <template #default="scope">
                    <el-button v-if="scope.row.is_graded && scope.row.type === 'case'" size="small" type="primary" @click="showFeedback(scope.row)">查看反馈</el-button>
                </template>
            </el-table-column>
            <el-empty>
                <template #description>
                    暂无测试记录
                </template>
            </el-empty>
        </el-table>
        
        <!-- 反馈对话框 -->
        <el-dialog v-model="feedbackDialogVisible" title="评价反馈" width="600px">
            <template v-if="currentResult">
                <div class="feedback-header">
                    <div class="feedback-item">
                        <span class="label">评级:</span>
                        <el-tag size="large" style="font-size: 16px;" :type="getGradeTagType(currentResult.grade_level)">
                            {{ currentResult.grade_level || '-' }}
                        </el-tag>
                    </div>
                    <div class="feedback-item">
                        <span class="label">提交时间:</span>
                        <span>{{ formatDate(currentResult.submitted_at) }}</span>
                    </div>
                </div>
                
                <el-divider content-position="left">评价内容</el-divider>
                
                <div class="feedback-content">
                    {{ currentResult.feedback_text || '老师暂未留下具体评价。' }}
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { testResultService, type TestResult } from '@/stores/testResultService';

const props = defineProps<{
    testId: string;
}>();

const loading = ref(false);
const testResults = ref<TestResult[]>([]);
const feedbackDialogVisible = ref(false);
const currentResult = ref<TestResult | null>(null);

// 加载测试历史记录
const loadTestHistory = async () => {
    loading.value = true;
    try {
        const { data } = await testResultService.getUserTestResults({
            page: 1,
            pageSize: 100
        });
        
        // 筛选出当前测试的记录并按提交时间降序排序
        testResults.value = data
            .filter(result => result.test_id === props.testId)
            .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
    } catch (error) {
        console.error('加载测试历史记录失败:', error);
        ElMessage.error('加载测试历史记录失败，请稍后重试');
    } finally {
        loading.value = false;
    }
};

// 监听 testId 变化
watch(() => props.testId, () => {
    loadTestHistory();
});

// 格式化日期
const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 获取分数类型
const getScoreType = (score: number | null, type: string, isGraded: boolean) => {
    if (score === null) return 'info';
    if (type=='case' || type=='comprehensive') {
        return isGraded ? 'success' : 'warning';
    }
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
};

// 获取分数显示文本
const getScoreText = (result: TestResult) => {
    const { score, type, is_graded, grade_level } = result;
    
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

// 显示反馈
const showFeedback = (result: TestResult) => {
    currentResult.value = result;
    feedbackDialogVisible.value = true;
};

onMounted(() => {
    loadTestHistory();
});
</script>

<style scoped>
.personal-test-history {
    padding: 20px;
}

.feedback-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}

.feedback-item {
    margin-bottom: 10px;
}

.label {
    font-weight: bold;
    margin-right: 10px;
}

.feedback-content {
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 4px;
    min-height: 120px;
    white-space: pre-wrap;
    word-break: break-word;
}
</style> 