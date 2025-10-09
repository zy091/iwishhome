<template>
    <div class="layout">
        <Breadcrumb :breadcrumb="breadcrumb" />
        <div class="layout-title">
            <h1 class="title">测试记录</h1>
            <div class="status-tabs">
                <el-tabs 
                class="demo-tabs" v-model="isGrading" @tab-change="handleStatusChange">
                    <el-tab-pane :name="'all'" label="全部测试" />
                    <el-tab-pane :name="'graded'" label="已批改" />
                    <el-tab-pane :name="'ungraded'" label="待批改" />
                </el-tabs>
            </div>
        </div>

        

        <!-- 搜索功能 -->
        <el-card shadow="always" style="margin-bottom: 20px;">
            <el-space wrap alignment="start" :size="30" >
                <el-select v-model="searchType" placeholder="选择测试类型" size="large" style="width: 240px">
                    <el-option label="全部类型" value="" />
                    <el-option label="基础测试" value="select" />
                    <el-option label="案例分析" value="case" />
                    <el-option label="综合测验" value="comprehensive" />
                </el-select>
                <el-input v-model="searchQuery" style="width: 240px" placeholder="请输入提交人或测试标题" :suffix-icon="Search"
                    size="large" clearable />
                <el-date-picker v-model="dateRange" type="daterange" unlink-panels range-separator="至"
                    start-placeholder="开始日期" end-placeholder="结束日期" :shortcuts="shortcuts" size="large" />
                <el-button type="primary" size="large" @click="handleSearch">搜索</el-button>
            </el-space>
        </el-card>

        <div class="training-content">
            <el-card v-if="hasPermission" style="min-height: 400px;">
                <template #header>
                    <div class="card-header">
                        测试记录管理
                        <div class="header-actions">
                            <el-button type="danger" :disabled="!selectedResults.length" @click="handleBatchDelete">
                                批量删除
                            </el-button>
                            <div style="font-size: 14px; color: #909399;">共计{{ pagination.total }}条数据</div>
                        </div>
                    </div>
                </template>

                <el-table v-loading="loading" :data="testResults" @selection-change="handleSelectionChange">
                    <el-table-column type="selection" width="55" />
                    <el-table-column prop="profile.full_name" label="提交人">
                        <template #default="scope">
                            {{ scope.row.profile?.full_name || '未知用户' }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="test_title" label="测试标题" />
                    <el-table-column prop="score" label="分数">
                        <template #default="scope">
                            <el-tag size="large" style="font-size: 14px;"
                                :type="getScoreType(scope.row.score, scope.row.type, scope.row.is_graded, scope.row.grade_level)">
                                {{ getScoreText(scope.row.score, scope.row.type, scope.row.is_graded, scope.row.grade_level) }}
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
                <el-table-column prop="grader.full_name" label="批改人">
                    <template #default="scope">
                        <span v-if="scope.row.is_graded">
                            {{  scope.row.type=='select' ? '自动批改' : (scope.row.grader_full_name || '未知') }}
                        </span>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
                    <el-table-column prop="submitted_at" label="提交时间" width="200">
                        <template #default="scope">
                            {{ formatDate(scope.row.submitted_at) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200" fixed="right">
                        <template #default="scope">
                            <el-button-group>
                                <el-button type="primary" @click="viewDetails(scope.row)">
                                    查看
                                </el-button>
                                <el-button type="danger" @click="handleDelete(scope.row)">
                                    删除
                                </el-button>
                            </el-button-group>
                        </template>
                    </el-table-column>
                    <el-empty>
                        <template #description>
                            暂无测试记录
                        </template>
                    </el-empty>
                </el-table>
            </el-card>
            <el-empty v-else description="您没有权限查看所有测试记录" />
            <Pagination :pagination="pagination" @update:pagination="handlePaginationUpdate" />

            <!-- 详情对话框 -->
            <el-dialog v-model="detailsDialogVisible" title="测试详情" width="700px">
                <div v-loading="loadingDetails">
                    <template v-if="currentTestResult">
                        <div class="details-header">
                            <div class="detail-item">
                                <span class="label">提交人:</span>
                                <span>{{ currentTestResult.full_name || '未知用户' }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">测试标题:</span>
                                <span>{{ currentTestResult.test_title || '无标题' }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">满分:100</span>
                                <span></span>
                            </div>
                            <div class="detail-item">
                                <span class="label">得分:</span>
                                <el-tag size="large" style="font-size: 14px;"
                                    :type="getScoreType(currentTestResult.score, currentTestResult.type, currentTestResult.is_graded, currentTestResult.grade_level || '')">
                                    {{ getScoreText(currentTestResult.score, currentTestResult.type,
                                        currentTestResult.is_graded, currentTestResult.grade_level || '') }}
                                </el-tag>
                            </div>
                            <div class="detail-item">
                                <span class="label">提交时间:</span>
                                <span>{{ formatDate(currentTestResult.submitted_at) }}</span>
                            </div>
                            <div class="detail-item" v-if="currentTestResult.is_graded">
                                <span class="label">批改人:</span>
                                <span>{{ currentTestResult.grader_full_name || '系统' }}</span>
                            </div>
                            <div class="detail-item"
                                v-if="currentTestResult.type != 'select' && currentTestResult.is_graded">
                                <el-button type="warning" @click="handleReGrade">重新批改</el-button>
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
                                    <template v-if="answer.is_correct !== null">
                                        <div class="answer-result">
                                            <el-tag v-if="answer.question_type === 'select'"
                                                :type="answer.is_correct ? 'success' : 'danger'">
                                                {{ answer.is_correct ? '正确' : '错误' }}
                                            </el-tag>
                                            <el-tag v-if="answer.question_type === 'reading'"
                                                :type="answer.score != 0 ? 'success' : 'danger'">
                                                {{ answer.score != 0 ? '已批改' : '待批改' }}
                                            </el-tag>
                                        </div>
                                    </template>
                                </div>

                                <div class="question-content">
                                    <div class="label">题目:</div>
                                    <div class="content">{{ answer.question_text }}</div>
                                </div>

                                <div class="answer-content">
                                    <div class="label">答案:</div>
                                    <div class="content">{{ answer.answer }}</div>
                                </div>

                                <!-- 移除之前的批改分数功能，针对案例分析题 -->
                                <!-- <div v-if="answer.question_type === 'reading'" class="grading-section">
                                    <div class="label">批改分数:</div>
                                    <el-input-number v-if="currentTestResult?.type !== 'case'" v-model="scores[index]" :min="0" :max="20" placeholder="请输入分数"
                                        @change="handleScoreChange(answer, index)"
                                        :disabled="currentTestResult?.is_graded && !isGradingEnabled" />
                                    <div v-else class="grade-level-display">
                                        {{ currentTestResult?.grade_level || '未评级' }}
                                    </div>
                                </div> -->
                                <div class="answer-content"
                                    v-if="!(answer.question_type === 'reading' && answer.score == 0)">
                                    <div class="label">得分:</div>
                                    <div class="content">{{ answer.score }}</div>
                                </div>
                            </div>
                        </div>

                        <!-- 添加整体反馈和评级 (针对case类型) -->
                        <div v-if="currentTestResult?.type === 'case'" class="feedback-section">
                            <el-divider content-position="left">评价反馈</el-divider>
                            
                            <!-- 评级选择 -->
                            <div class="grading-section">
                                <div class="label">评级:</div>
                                <el-select 
                                    v-model="gradeLevel" 
                                    placeholder="请选择评级"
                                    :disabled="currentTestResult?.is_graded && !isGradingEnabled">
                                    <el-option label="A (优秀)" value="A" />
                                    <el-option label="B (良好)" value="B" />
                                    <el-option label="C (一般)" value="C" />
                                    <el-option label="D (不及格)" value="D" />
                                </el-select>
                            </div>
                            
                            <!-- 反馈文本 -->
                            <div class="grading-section">
                                <div class="label">反馈:</div>
                                <el-input 
                                    v-model="feedbackText" 
                                    type="textarea" 
                                    :rows="4" 
                                    placeholder="请输入您的反馈意见"
                                    :disabled="currentTestResult?.is_graded && !isGradingEnabled" 
                                    @input="handleFeedbackChange" />
                            </div>
                        </div>

                        <!-- 添加保存按钮 -->
                        <div v-if="hasGradingChanges" class="grading-actions">
                            <el-button type="primary" @click="saveGrading">保存批改结果</el-button>
                        </div>
                        <!-- 添加重新批改按钮 -->
                        <div v-else-if="currentTestResult?.is_graded && currentTestResult?.type != 'select'" class="grading-actions">
                            <el-button type="warning" @click="handleReGrade">重新批改</el-button>
                        </div>
                    </template>
                </div>
            </el-dialog>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus';
import { testResultService, type TestResult, type TestAnswerDetail } from '@/stores/testResultService';
import { studyNoteService, hasViewAllNotesPermission } from '@/stores/studyNoteService'
import { useUserStore } from '@/stores/user'
import { supabase } from '@/lib/supabaseClient'
import Breadcrumb from '@/components/system/Breadcrumb.vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'

const breadcrumb = reactive([
    {
        name: '数据管理',
        path: ''
    },
    {
        name: '测试记录',
        path: '/system/admin-test-result'
    }
])

const userStore = useUserStore()
const hasPermission = computed(() =>
    hasViewAllNotesPermission(Number(userStore.roleId))
)

const searchType = ref('')
const loading = ref(false)
const loadingDetails = ref(false)
const testResults = ref<TestResult[]>([])
const searchQuery = ref('')
const dateRange = ref<Date[]>([])
const shortcuts = [
    {
        text: 'Last week',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            return [start, end]
        },
    },
    {
        text: 'Last month',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            return [start, end]
        },
    },
    {
        text: 'Last 3 months',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            return [start, end]
        },
    },
]

const pagination = reactive<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
});

const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    searchResults();
}

const detailsDialogVisible = ref(false)
const currentTestResult = ref<TestResult | null>(null)
const answerDetails = ref<TestAnswerDetail[]>([])
const scores = ref<Record<string, number>>({});
const hasGradingChanges = ref(false);
const isGradingEnabled = ref(false);
const isGrading = ref<string>('all');
const selectedResults = ref<TestResult[]>([]);
const gradeLevel = ref<string>('');
const feedbackText = ref<string>('');

const searchResults = async () => {
    loading.value = true
    const startDate = dateRange.value != null && dateRange.value[0] != null ? dateRange.value[0].toDateString() : ''
    const endDate = dateRange.value != null && dateRange.value[1] != null ? dateRange.value[1].toDateString() : ''
    const gradeMap = {
        'all': undefined,
        'graded': true,
        'ungraded': false
    };
    try {
        const results = await testResultService.searchTestResultsUsingView(searchQuery.value, {
            startDate,
            endDate,
            page: pagination.page,
            pageSize: pagination.pageSize,
            type: searchType.value,
            is_graded: gradeMap[isGrading.value as keyof typeof gradeMap]
        });
        testResults.value = results.data;
        pagination.total = results.total;
    } catch (error) {
        console.error('加载测试结果失败:', error);
        ElMessage.error('加载测试结果失败，请稍后重试');
    } finally {
        loading.value = false;
    }
}

const viewDetails = async (result: TestResult) => {
    loadingDetails.value = true;
    currentTestResult.value = result;
    detailsDialogVisible.value = true;
    scores.value = {}; // 重置分数
    hasGradingChanges.value = false;
    isGradingEnabled.value = !result.is_graded; // 如果未批改，则启用编辑
    
    // 重置反馈和评级
    feedbackText.value = result.feedback_text || '';
    gradeLevel.value = result.grade_level || 'A';

    try {
        const details = await testResultService.getTestResultDetails(result.id!);
        answerDetails.value = details.answerDetails;

        // 初始化分数
        details.answerDetails.forEach((answer, index) => {
            if (answer.question_type === 'reading') {
                scores.value[index] = answer.score || 0;
            }
        });
    } catch (error) {
        console.error('加载测试详情失败:', error);
        ElMessage.error('加载测试详情失败，请稍后重试');
    } finally {
        loadingDetails.value = false;
    }
};

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
const getScoreType = (score: number | null, type: string, isGraded: boolean, gradeLevel: string) => {
    if (score === null) return 'info';
    if ( type == 'comprehensive') {
        return isGraded ? 'success' : 'warning';
    }
    if (type == 'case') {
        switch (gradeLevel) {
            case 'A': return 'success';
            case 'B': return 'success';
            case 'C': return 'warning';
            case 'D': return 'danger';
            default: return 'info';
        }
    }
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
};

const getQuestionTypeLabel = (type: string) => {
    switch (type) {
        case 'select': return '选择题';
        case 'judge': return '判断题';
        case 'fill': return '填空题';
        case 'question': return '简答题';
        case 'reading': return '案例题';
        default: return '未知类型';
    }
};

const getScoreText = (score: number | null, type: string, isGraded: boolean, gradeLevel: string) => {
    if (type === 'case') {
        return isGraded ? `评级: ${gradeLevel || '-'}` : '待批改';
    } else if (type === 'comprehensive') {
        return isGraded ? `${score}分` : '待批改';
    }
    return `${score}分`;
};

const handleDelete = async (result: TestResult) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除这条测试记录吗？此操作不可恢复。',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        );

        await testResultService.deleteTestResult(result.id!);
        ElMessage.success('删除成功');
        searchResults(); // 重新加载数据
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除测试记录失败:', error);
            ElMessage.error('删除失败，请稍后重试');
        }
    }
};

// 处理分数变化
const handleScoreChange = (answer: TestAnswerDetail, index: number) => {
    hasGradingChanges.value = true;
};

// 重新批改
const handleReGrade = () => {
    isGradingEnabled.value = true;
    hasGradingChanges.value = true;
};

// 保存批改结果
const saveGrading = async () => {
    if (!currentTestResult.value) return;

    try {
        // 针对不同类型的测试有不同的保存逻辑
        if (currentTestResult.value.type === 'case') {
            // 案例分析题：保存评级和反馈
            const { error: resultError } = await supabase
                .from('test_results')
                .update({
                    is_graded: true,
                    grader_id: userStore.user?.user_id,
                    feedback_text: feedbackText.value,
                    grade_level: gradeLevel.value,
                    // 根据评级设置分数和通过状态
                    score: getScoreFromGrade(gradeLevel.value),
                    is_passed: gradeLevel.value !== 'D' // D为不及格
                })
                .eq('id', currentTestResult.value.id);

            if (resultError) throw resultError;
            
        } else {
            // 其他类型测试：计算总分
            let totalScore = 0;
            
            // 如果是综合测试，需要计算选择题的自动得分
            if (currentTestResult.value.type === 'comprehensive') {
                // 计算选择题的得分
                answerDetails.value.forEach((answer) => {
                    if (answer.question_type === 'select' && answer.is_correct) {
                        totalScore += 5; // 每道选择题5分
                    }
                });
            }
            
            // 加上案例分析题的批改分数
            totalScore += Object.values(scores.value).reduce((sum, score) => sum + score, 0);

            // 更新测试结果
            const { error: resultError } = await supabase
                .from('test_results')
                .update({
                    score: totalScore,
                    is_passed: totalScore >= 60,
                    is_graded: true,
                    grader_id: userStore.user?.user_id
                })
                .eq('id', currentTestResult.value.id);

            if (resultError) throw resultError;

            // 更新答案详情
            for (const [index, score] of Object.entries(scores.value)) {
                const { error: detailsError } = await supabase
                    .from('test_answer_details')
                    .update({
                        is_correct: true,
                        score: score
                    })
                    .eq('test_result_id', currentTestResult.value.id)
                    .eq('question_type', 'reading')
                    .eq('id', answerDetails.value[Number(index)].id);

                if (detailsError) throw detailsError;
            }
        }

        ElMessage.success('批改结果保存成功');
        hasGradingChanges.value = false;
        isGradingEnabled.value = false;
        
        // 刷新当前测试结果显示
        if (currentTestResult.value.type === 'case') {
            currentTestResult.value = {
                ...currentTestResult.value,
                is_graded: true,
                feedback_text: feedbackText.value,
                grade_level: gradeLevel.value,
                score: getScoreFromGrade(gradeLevel.value),
                is_passed: gradeLevel.value !== 'D'
            };
        }
        
        await searchResults();
    } catch (error) {
        console.error('保存批改结果失败:', error);
        ElMessage.error('保存批改结果失败，请稍后重试');
    }
};

// 根据评级获取对应分数
const getScoreFromGrade = (grade: string) => {
    switch (grade) {
        case 'A': return 90;
        case 'B': return 80;
        case 'C': return 70;
        case 'D': return 50;
        default: return 0;
    }
};

// 处理状态切换
const handleStatusChange = (value: string) => {
    pagination.page = 1; // 重置页码
    searchResults();
};

// 处理搜索类型变化
const handleSearchTypeChange = () => {
    pagination.page = 1; // 重置页码
    searchResults();
};

// 处理搜索按钮点击
const handleSearch = () => {
    pagination.page = 1; // 重置页码
    searchResults();
};

// 处理表格选择变化
const handleSelectionChange = (selection: TestResult[]) => {
    selectedResults.value = selection;
};

// 批量删除测试记录
const handleBatchDelete = async () => {
    if (selectedResults.value.length === 0) return;
    
    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedResults.value.length} 条测试记录吗？此操作不可恢复。`,
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        );

        // 创建批量删除的承诺数组
        const deletePromises = selectedResults.value.map(result => 
            testResultService.deleteTestResult(result.id!)
        );
        
        // 等待所有删除操作完成
        await Promise.all(deletePromises);
        
        ElMessage.success(`成功删除 ${selectedResults.value.length} 条测试记录`);
        selectedResults.value = []; // 清空选择
        searchResults(); // 重新加载数据
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量删除测试记录失败:', error);
            ElMessage.error('批量删除失败');
        }
    }
};

// 处理反馈文本变化
const handleFeedbackChange = () => {
    hasGradingChanges.value = true;
};

onMounted(async () => {
    await searchResults();
});
</script>

<style scoped>
/* .layout {
    padding: 20px;
} */

.layout-title {
    margin-bottom: 20px;
}

.title {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header h2 {
    margin: 0;
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

.grading-section {
    margin-top: 10px;
    display: flex;
    align-items: center;
}

.grading-actions {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.feedback-section {
    margin-top: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 4px;
}

.grade-level-display {
    font-weight: bold;
    color: #409EFF;
    font-size: 16px;
    padding: 0 10px;
}

:deep(.el-dialog) {
    padding: 30px;
}


/* :deep(.el-tabs__nav-wrap::after) {
    display: none;
} */

:deep(.el-tabs__item) {
    font-size: 16px;
    height: 60px;
}

:deep(.el-tabs__active-bar) {
    background-color: #409eff;
    height: 3px;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}
</style>