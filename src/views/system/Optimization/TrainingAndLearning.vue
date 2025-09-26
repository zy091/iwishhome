<template>
     <div class="training">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="training-title">
            <h1 class="title">{{ platformName }}考试内容</h1>
        </div>
        <!--  
        <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect" :router="true">
            <el-menu-item :index="`/system/training/study-material-folder?platform=${platform}`">学习资料</el-menu-item>
            <el-menu-item :index="`/system/training/testing?platform=${platform}&chapter=${chapter}`" >学习测试</el-menu-item>
            <el-menu-item index="/system/training/learn-experience">学习心得</el-menu-item>
        </el-menu>
        -->
        <div class="training-content" >
            <div class="test-list-container">
        <el-card class="testing-search" style="margin-bottom: 20px;">
            <el-space alignment="start" :size="30">
                <el-input size="large" style="width: 240px" v-model="searchQuery" placeholder="搜索测验名称"
                    class="search-input" clearable @input="handleSearch" />
                <el-select size="large" style="width: 240px" v-model="testType" placeholder="测验类型"
                    @change="handleSearch" class="filter-select">
                    <el-option label="全部类型" value="" />
                    <el-option label="选择题" value="select" />
                    <el-option label="案例分析" value="case" />
                    <el-option label="综合测验" value="comprehensive" />
                </el-select>
                <el-button type="primary" size="large" @click="handleSearch">搜索</el-button>
            </el-space>
        </el-card>

        <div v-loading="loading" class="test-list">
            <el-empty v-if="tests.length === 0 && !loading" description="暂无测验内容" />
            <div v-else class="test-grid">
                <el-card v-for="test in tests" :key="test.id" class="test-card" shadow="hover">
                    <div class="test-card-content">
                        <div class="test-type-tag flex ">
                            <el-tag :type="getTagType(test.type)">{{ getTestTypeLabel(test.type) }}</el-tag>
                            <el-tag :type="getTagType(test.platform || '')">{{ getTestTypeLabel(test.platform || '')
                                }}</el-tag>
                        </div>

                        <h3 class="test-title">{{ test.title }}</h3>

                        <div class="test-info">
                            <div class="info-item">
                                <i class="el-icon-question"></i>
                                <span>{{ test.question_count || 0 }}道题目</span>
                            </div>
                            <div class="info-item">
                                <i class="el-icon-medal"></i>
                                <span>{{ test.score_weight || 100 }}分值</span>
                            </div>
                            <div class="info-item">
                                <i class="el-icon-refresh"></i>
                                <span>尝试次数: {{ getTestAttemptCount(test.id) }}/{{ maxAttempts }}</span>
                            </div>
                        </div>

                        <div class="test-status">
                            <div v-if="getTestResult(test.id)?.completion_status === 'completed'" class="status-tag">
                                <el-tag type="success">已完成</el-tag>
                                <span class="score-text">最新分数: {{ getScoreText(getTestResult(test.id)) }}</span>
                            </div>
                            <div v-else-if="getTestResult(test.id)?.completion_status === 'in_progress'"
                                class="status-tag">
                                <el-tag type="warning">进行中</el-tag>
                            </div>
                            <div v-else class="status-tag">
                                <el-tag type="info">未开始</el-tag>
                            </div>
                        </div>

                        <div class="test-actions">
                            <el-button type="primary" :disabled="getTestResult(test.id)?.completion_status === 'in_progress' ||
                                ( getTestAttemptCount(test.id) >= maxAttempts)"
                                @click="startTest(test)">
                                {{ getActionButtonText(getTestResult(test.id)?.completion_status, test) }}
                            </el-button>

                            <el-button v-if="getTestResult(test.id)?.completion_status === 'completed'" type="info"
                                plain @click="viewHistory(test)">
                                查看历史
                            </el-button>
                        </div>
                    </div>
                </el-card>
            </div>

            <div class="pagination" v-if="pagination.total > 0">
                <Pagination :pagination="pagination" @update="handlePaginationUpdate" />
            </div>
        </div>

        <!-- 测试结果历史记录 -->
        <el-dialog v-model="historyDialogVisible" :title="currentTest?.title + ' - 测试历史记录'" width="800px">
            <PersonalTestHistory v-if="currentTest" :testId="currentTest.id" />
        </el-dialog>
    </div>
            
        </div>
    </div>
   
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed , watch} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { PaginationType } from '@/types/pagination'
import Pagination from '@/components/system/Pagination.vue'
import { testService } from '@/stores/testService'
import { testResultService, type TestResult } from '@/stores/testResultService'
import PersonalTestHistory from '@/views/system/Optimization/Training/PersonalTestHistory.vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { supabase } from '@/lib/supabaseClient'
import { useUserStore } from '@/stores/user'

import Breadbcrum from '@/components/system/Breadcrumb.vue'

//activeIndex的值需要和路由的path对应，首次进入获取路由的path，然后赋值给activeIndex
const route = useRoute()
const router = useRouter()
const platform = ref(route.query.platform || 'google')
const chapter = ref(route.query.chapter || 'base')
//监听路由参数的变化
watch(() => route.query.platform, (newPlatform) => {
    platform.value = newPlatform || 'google'
}, { immediate: true })
watch(() => route.query.chapter, (newchapter) => {
    chapter.value = newchapter || 'base'
}, { immediate: true })

const platformName = computed(() => {
    switch(platform.value){
        case 'google':
            return 'Google'
        case 'facebook':
            return 'FaceBook'
        default:
            return 'Google'
    }
})


// const handleSelect = (key: string, keyPath: string[]) => {
//     console.log(key, keyPath)
// }
const breadbcrum = reactive([
    {
        name: `${platformName.value}培训过程考核`,
        path: `/system/optimize?platform=${platform.value}`
    },
    {
        name: `${platformName.value}考试内容`,
        path: '/system/training/study-materials'
    }
])

interface Test {
    id: string;
    title: string;
    type: string;
    platform?: string;
    question_count?: number;
    score_weight?: number;
}

const loading = ref(true);
const tests = ref<Test[]>([]);
const testResults = ref<Record<string, TestResult>>({});

const searchQuery = ref('');
const testType = ref('');
const historyDialogVisible = ref(false);
const maxAttempts = 2; // maxAttempts限制
const pagination = reactive<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
});
const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    loadTests();

}

const userTestResults = ref<TestResult[]>([]);
// 加载测试结果
const loadTestResults = async () => {
    try {
        const { data } = await testResultService.getUserTestResults({
            page: 1,
            pageSize: 100 // 获取足够多的结果
        });

        // 将测试结果转换为以 test_id 为键的对象，只保留每个测试的最新结果
        const resultsMap: Record<string, TestResult> = {};
        data.forEach(result => {
            if (result.test_id) {
                // 如果该测试已有结果，比较提交时间，保留最新的
                if (!resultsMap[result.test_id] ||
                    new Date(result.submitted_at) > new Date(resultsMap[result.test_id].submitted_at)) {
                    resultsMap[result.test_id] = result as TestResult;
                }
            }
        });
        userTestResults.value = data;
        testResults.value = resultsMap;
    } catch (error) {
        console.error('加载测试结果失败:', error);
        ElMessage.error('加载测试结果失败，请稍后重试');
    }
};

// 初始化
onMounted(async () => {
    await Promise.all([
        loadTests(),
        loadTestResults()
    ]);
});

import { title } from 'process';
//获取路由参数/exam-content?platform=google

// 加载测试
const loadTests = async () => {
    loading.value = true;
    try {
        const { data, total } = await testService.getTests({
            platform: platform.value as string,
        })
        pagination.total = total
        // 处理搜索筛选
        let filteredTests = [...data];

        if (searchQuery.value) {
            filteredTests = filteredTests.filter(test =>
                test.title.toLowerCase().includes(searchQuery.value.toLowerCase())
            );
        }

        if (testType.value) {
            filteredTests = filteredTests.filter(test => test.type === testType.value);
        }

        tests.value = filteredTests;
        pagination.total = filteredTests.length;
    } catch (error) {
        console.error('加载测验失败:', error);
        ElMessage.error('加载测验失败，请稍后重试');
    } finally {
        loading.value = false;
    }
};

// 处理搜索
const handleSearch = () => {
    pagination.page = 1;
    loadTests();
};

// 添加计算属性来获取测试结果
const getTestResult = computed(() => (testId: string) => testResults.value[testId]);

// 开始测试
const startTest = (test: Test) => {
    // 案例分析题检查尝试次数限制
    if (test.type === 'case') {
        const attemptCount = getTestAttemptCount(test.id);
        if (attemptCount >= maxAttempts) {
            ElMessage.warning(`您已达到maxAttempts(${maxAttempts}次)，不能再次作答`);
            return;
        }
    }

    const testType = test.type
    let testRoute = ''
    switch (testType) {
        case 'case':
            testRoute = 'case-study'
            break
        case 'select':
            testRoute = 'multiple-choice'
            break
        case 'comprehensive':
            testRoute = 'comprehensive-test'
            break
        default:
            testRoute = 'multiple-choice'
    }
    if (getTestResult.value(test.id)?.completion_status === 'completed') {
        // 确认重新开始
        ElMessageBox.confirm('您已完成此测验，确定要重新开始吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            router.push({
                name: testRoute,
                query: {
                    testId: test.id,
                    testName: getTestTypeLabel(test.platform || '') + '-' + test.title,
                    platform: test.platform,
                    score_weight: test.score_weight,
                    type: test.type
                }
            });
        }).catch(() => {
            // 取消
            ElMessage.info('已取消重新开始');
        });
    } else {
        router.push({
            name: testRoute,
            query: {
                testId: test.id,
                testName: getTestTypeLabel(test.platform || '') +  '-' + test.title,
                platform: test.platform,
                score_weight: test.score_weight,
                type: test.type
            }
        });
    }
};

const currentTest = ref<Test | null>(null);

// 查看历史
const viewHistory = (test: Test) => {
    currentTest.value = test;
    historyDialogVisible.value = true;
};

// 获取测试类型标签
const getTestTypeLabel = (type: string) => {
    switch (type) {
        case 'select': return '选择题';
        case 'case': return '案例分析';
        case 'comprehensive': return '综合测验';
        case 'google': return 'Google';
        case 'facebook': return 'FaceBook';
        case 'base': return '基础';
        case 'middle': return '中级';
        case 'advanced': return '高级';
        default: return '未知类型';
    }
};

// 获取标签类型
const getTagType = (type: string) => {
    switch (type) {
        case 'select': return 'primary';
        case 'case': return 'success';
        case 'comprehensive': return 'warning';
        case 'google': return 'danger';
        case 'facebook': return 'primary';
        case 'base': return 'primary';
        case 'middle': return 'success';
        case 'advanced': return 'warning';
        default: return 'info';
    }
};

// 计算用户对某个测试的尝试次数
const getTestAttemptCount = (testId: string) => {
    // 通过过滤所有测试结果，计算特定测试ID的尝试次数
    let count = 0;
    Object.values(userTestResults.value).forEach(result => {
        if (result.test_id === testId) {
            count++;
        }
    });
    return count;
};

// 获取操作按钮文本
const getActionButtonText = (status?: string, test?: Test) => {
    if (getTestAttemptCount(test?.id || '') >= maxAttempts) {
        return '尝试次数已用完';
    }

    switch (status) {
        case 'completed': return '重新测试';
        case 'in_progress': return '继续测试';
        default: return '开始测试';
    }
};

// 获取分数显示文本
const getScoreText = (result: TestResult | undefined) => {
    if (!result) return '0分';
    if (!result.is_graded) return '待批改';
    
    // 对于案例分析题，显示评级
    if (result.type === 'case' && result.grade_level) {
        return `评级: ${result.grade_level}`;
    }
    
    return `${result.score}分`;
};
</script>

<style scoped>
.test-list {
    min-height: 400px;
}

.test-list-container {
    margin: 0 auto;
    padding: 20px 0;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.header h1 {
    margin: 0;
    font-size: 24px;
}

.header-actions {
    display: flex;
    gap: 15px;
}

.search-input {
    width: 250px;
}

.filter-select {
    width: 150px;
}

.test-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.test-card {
    height: 100%;
    transition: transform 0.3s;
}

.test-card:hover {
    transform: translateY(-5px);
}

.test-card-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.test-type-tag {
    margin-bottom: 10px;
    gap: 10px;
    display: flex;
}

.test-title {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 18px;
    line-height: 1.4;
    height: 50px;
    overflow: hidden;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-box-orient: vertical;
}

.test-info {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-bottom: 20px;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #606266;
    font-size: 14px;
}

.test-status {
    margin-top: auto;
    margin-bottom: 15px;
}

.status-tag {
    display: flex;
    align-items: center;
    gap: 10px;
}

.score-text {
    font-weight: bold;
}

.test-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

.pagination {
    margin-top: 30px;
    display: flex;
    justify-content: flex-start;
}
</style>