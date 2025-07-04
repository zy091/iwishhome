<template>
    <div class="layout">
        <div class="dashboard-content">
            <!-- 欢迎信息 -->
            <div class="welcome-section">
                <h2>欢迎回来，{{ userName }}</h2>
                <p class="date">{{ currentDate }}</p>
            </div>
            <el-carousel indicator-position="outside">
                <el-carousel-item v-for="item in 4" :key="item">
                    <h3 text="2xl" justify="center">{{ item }}</h3>
                </el-carousel-item>
            </el-carousel>
            <template v-if="hasPermission">
                <!-- 统计卡片 -->
                <el-row :gutter="20" class="stat-cards">
                    <el-col :span="6">
                        <el-card shadow="hover" class="stat-card">
                            <el-link :underline="false" href="/system/users">
                                <div class="stat-icon">
                                    <el-icon>
                                        <User />
                                    </el-icon>
                                </div>
                            </el-link>
                            <div class="stat-info">
                                <div class="stat-title">系统用户</div>
                                <div class="stat-value">{{ stats.activeUsers }}</div>
                                <div class="stat-trend" v-show="stats.userTrend > 0" :class="{ 'up': stats.userTrend > 0 }">
                                    新增： {{ stats.userTrend > 0 ? '+' : '' }}{{ stats.userTrend }}
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="hover" class="stat-card">
                            <el-link :underline="false" href="/system/admin-study-notes">
                                <div class="stat-icon">
                                    <el-icon>
                                        <EditPen />
                                    </el-icon>
                                </div>
                            </el-link>
                            <div class="stat-info">
                                <div class="stat-title">学习心得</div>
                                <div class="stat-value">{{ stats.studyCount }}</div>
                                <div class="stat-trend " v-show="stats.studyPending > 0">
                                    待回复： {{ stats.studyPending }}
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="hover" class="stat-card">
                            <el-link :underline="false" href="/system/admin-test-result">
                                <div class="stat-icon">
                                    <el-icon>
                                        <Reading />
                                    </el-icon>
                                </div>
                            </el-link>
                            <div class="stat-info">
                                <div class="stat-title">测试结果</div>
                                <div class="stat-value">{{ stats.testCount }}</div>
                                <div class="stat-trend" v-show="stats.testPending > 0">
                                    待批改： {{ stats.testPending }}
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="hover" class="stat-card">
                            <el-link :underline="false" href="/system/admin-assignments">
                                <div class="stat-icon">
                                    <el-icon>
                                        <Document />
                                    </el-icon>
                                </div>
                            </el-link>
                            <div class="stat-info">
                                <div class="stat-title">日常作业</div>
                                <div class="stat-value">{{ stats.assignmentsCount }}</div>
                                <div class="stat-trend" v-show="stats.assignmentsPending > 0">
                                    待批改： {{ stats.assignmentsPending }}
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>
            </template>
            <!-- 统计卡片 -->
            <el-row :gutter="20" class="stat-cards">
                <el-col :span="6">
                    <el-card shadow="hover" class="stat-card">
                        <el-link :underline="false" href="/system/personal-data/study-notes">
                            <div class="stat-icon">
                                <el-icon>
                                    <EditPen />
                                </el-icon>
                            </div>
                        </el-link>
                        <div class="stat-info">
                            <div class="stat-title">我的心得</div>
                            <div class="stat-value">{{ stats.yourStudyCount }}</div>
                            <div class="stat-trend" v-show="stats.yourStudyPending > 0" :class="{ 'up': stats.yourStudyPending > 0 }">
                                待回复： {{ stats.yourStudyPending > 0 ? '+' : '' }}{{ stats.yourStudyPending }}
                            </div>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card shadow="hover" class="stat-card">
                        <el-link :underline="false" href="/system/personal-data/test-result">
                            <div class="stat-icon">
                                <el-icon>
                                    <Reading />
                                </el-icon>
                            </div>
                        </el-link>
                        <div class="stat-info">
                            <div class="stat-title">我的测试</div>
                            <div class="stat-value">{{ stats.yourTestCount }}</div>
                            <div class="stat-trend" v-show="stats.yourTestPending > 0" :class="{ 'up': stats.yourTestPending > 0 }">
                                待批改：{{ stats.yourTestPending > 0 ? '+' : '' }}{{ stats.yourTestPending }}
                            </div>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card shadow="hover" class="stat-card">
                        <el-link :underline="false" href="/system/personal-data/daily-assignments">
                            <div class="stat-icon">
                                <el-icon>
                                    <Document />
                                </el-icon>
                            </div>
                        </el-link>
                        <div class="stat-info">
                            <div class="stat-title">我的作业</div>
                            <div class="stat-value">{{ stats.yourAssignmentsCount }}</div>
                            <!-- <div class="stat-trend" :class="{ 'up': stats.yourAssignmentsPending > 0 }">
                                {{ stats.yourAssignmentsPending > 0 ? '+' : '' }}{{ stats.yourAssignmentsPending }}
                            </div> -->
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card shadow="hover" class="stat-card">
                        <el-link :underline="false" href="/system/feedback-center">
                            <div class="stat-icon">
                                <el-icon>
                                    <ChatLineRound />
                                </el-icon>
                            </div>
                        </el-link>
                        <div class="stat-info">
                            <div class="stat-title">我的反馈</div>
                            <div class="stat-value">{{ stats.myFeedbackCount }}</div>
                            <div class="stat-trend" v-show="stats.myFeedbackTrend > 0" :class="{ 'up': stats.myFeedbackTrend > 0 }">
                                待处理：{{ stats.myFeedbackTrend > 0 ? '+' : '' }}{{ stats.myFeedbackTrend }}
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>

            <!-- 主要内容区域 -->
            <el-row :gutter="20" class="main-content">
                <!-- 左侧：待办任务和通知 -->
                <el-col :span="16">
                    <el-card class="task-card">
                        <template #header>
                            <div class="card-header">
                                <span>待办任务</span>
                                <el-link type="primary" link :href="`/system/task-management`">
                                    查看全部
                                </el-link>
                            </div>
                        </template>
                        <el-timeline>
                            <el-timeline-item v-for="(task, index) in tasks" :key="index"
                                :type="getPriorityType(task.priority)" :timestamp="task.due_date" placement="top">
                                <el-card class="task-item">
                                    <div class="task-title">
                                        <h4>{{ task.title }}
                                        </h4><el-tag class="status-tag" :type="getStatusType(task.status)">{{
                                            getStatusLabel(task.status) }}</el-tag> <el-tag
                                            :type="getPriorityType(task.priority)">{{ getPriorityLabel(task.priority)
                                            }}</el-tag>
                                    </div>

                                    <p>{{ task.description }}</p>
                                    <p v-if="!task.isOverdue" 
                                        style="color: #909399;font-size: 12px;margin-top: 10px;">距离截止日期：{{ task.diffDays }}天</p>
                                    <p v-else
                                        style="color: #F56C6C;font-size: 12px;margin-top: 10px;">已过期：{{ task.diffDays }}天</p>
                                </el-card>
                            </el-timeline-item>
                        </el-timeline>
                    </el-card>
                </el-col>

                <!-- 右侧：快捷入口和公告 -->
                <el-col :span="8">
                    <el-card class="quick-access">
                        <template #header>
                            <div class="card-header">
                                <span>快捷入口</span>
                            </div>
                        </template>
                        <div class="quick-links">
                            <div class="quick-link-group">
                                <el-link :underline="false" href="/system/personal-data">
                                    <el-button type="primary" plain>
                                        <el-icon>
                                            <User />
                                        </el-icon>
                                        个人中心
                                    </el-button>
                                </el-link>
                                <el-link :underline="false"
                                    :href="`/system/training/study-material-folder?platform=${userStore.user?.role?.mark[0]}`">
                                    <el-button type="success" plain>
                                        <el-icon>
                                            <Reading />
                                        </el-icon>
                                        学习资料
                                    </el-button>
                                </el-link>
                            </div>
                            <div class="quick-link-group">
                                <el-link :underline="false" href="/system/feedback-center">
                                    <el-button type="warning" plain>
                                        <el-icon>
                                            <ChatLineRound />
                                        </el-icon>
                                        反馈中心
                                    </el-button>
                                </el-link>
                                <el-link :underline="false"
                                    :href="`/system/daily-work/personal-assignments?platform=${userStore.user?.role?.mark[0]}`">
                                    <el-button type="info" plain>
                                        <el-icon>
                                            <Document />
                                        </el-icon>
                                        日常作业
                                    </el-button>
                                </el-link>
                            </div>
                        </div>
                    </el-card>

                    <el-card class="notice-card">
                        <template #header>
                            <div class="card-header">
                                <span>系统公告</span>
                            </div>
                        </template>
                        <div class="notice-list fixed-notice-list">
                            <transition-group name="notice-fade" tag="div">
                                <div v-for="(notice, idx) in visibleAnnouncements"
                                    :key="notice.id ? notice.id : 'empty-' + idx" class="notice-item"
                                    @click="notice.id && handleNoticeClick(notice.id)">
                                    <el-tag v-if="notice.id" :type="getNoticeType(notice.type)" size="small">{{
                                        getNoticeTypeText(notice.type) }}</el-tag>
                                    <span class="notice-title">{{ notice.title || '' }}</span>
                                    <span class="notice-time">{{ notice.created_at ? formatDate(notice.created_at) : ''
                                    }}</span>
                                </div>
                            </transition-group>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="40%" class="notice-dialog"
            :close-on-click-modal="false">
            <template #header>
                <div class="notice-dialog-header">
                    <el-tag :type="getNoticeType(selectedNotice?.type || '')" size="small" class="notice-type-tag">
                        {{ getNoticeTypeText(selectedNotice?.type || '') }}
                    </el-tag>
                    <span class="notice-dialog-title">{{ selectedNotice?.title || '' }}</span>
                    <span class="notice-time">{{ formatDate(selectedNotice?.created_at || '') }}</span>
                </div>
            </template>
            <div class="notice-dialog-content">
                <div v-html="selectedNotice?.content" class="notice-content">

                </div>
            </div>
            <template #footer>
                <div class="notice-dialog-footer">
                    <el-button type="primary" @click="dialogVisible = false">关闭</el-button>
                </div>
            </template>
        </el-dialog>

    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { User, Document, Reading, ChatLineRound, Setting, EditPen } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { supabase } from '@/lib/supabaseClient'
import { formatDate } from '@/utils/dateUtils'


const editor = ref<HTMLElement | null>(null)
let joditInstance: any = null

interface Announcement {
    id: number
    title: string
    content: string
    type: string
    status: string
    created_at: string
}
const userStore = useUserStore()
const userName = computed(() => userStore.user?.email || '用户')
const announcements = ref<Announcement[]>([])

// 当前日期
const currentDate = computed(() => {
    const now = new Date()
    return now.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    })
})

// 权限
const hasPermission = computed(() => {
    return userStore.user?.role_id === 0 || userStore.user?.role_id === 1 || userStore.user?.role_id === 11
})

// 统计数据
const stats = ref({
    activeUsers: 0,
    userTrend: 0,
    studyCount: 0,
    studyPending: 0,
    testCount: 0,
    testPending: 0,
    assignmentsCount: 0,
    assignmentsPending: 0,
    yourStudyCount: 0,
    yourStudyPending: 0,
    yourTestCount: 0,
    yourTestPending: 0,
    yourAssignmentsCount: 0,
    yourAssignmentsPending: 0,
    feedbackCount: 0,
    feedbackTrend: 0,
    myFeedbackCount: 0,
    myFeedbackTrend: 0

})

const getActiveUsers = async () => {
    try {
        const { data, error } = await supabase.from('user_profiles').select('*')
        if (error) throw error

        //过滤去今天之前创建的用户
        const today = new Date()
        const todayUsers = data?.filter(user => {
            const userDate = new Date(user.created_at)
            return userDate.toDateString() === today.toDateString()
        })
        stats.value.activeUsers = data?.length || 0
        stats.value.userTrend = todayUsers?.length || 0
    } catch (error) {
        console.error('获取用户失败:', error)
    }
}

const getStudyCount = async () => {
    try {
        const { data, error } = await supabase.from('study_notes').select('*')
        if (error) throw error

        stats.value.studyCount = data?.length || 0
        //过滤未回复的admin_reply
        const studyPending = data?.filter(item => {
            return item.admin_reply === null
        })
        stats.value.studyPending = studyPending?.length || 0
    } catch (error) {
        console.error('获取学习记录失败:', error)
    }
}

const getTestCount = async () => {
    try {
        const { data, error } = await supabase.from('test_results').select('*')
        if (error) throw error

        stats.value.testCount = data?.length || 0
        //过滤未批改的admin_reply
        const testPending = data?.filter(item => {
            return item.feedback_text === null && item.type === 'case'
        })
        stats.value.testPending = testPending?.length || 0
    } catch (error) {
        console.error('获取测试结果失败:', error)
    }
}

const getAssignmentsCount = async () => {
    try {
        const { data, error } = await supabase.from('assignments').select('*')
        if (error) throw error

        stats.value.assignmentsCount = data?.length || 0
        //过滤未批改的admin_reply
        const assignmentsPending = data?.filter(item => {
            return item.admin_reply === null
        })
        stats.value.assignmentsPending = assignmentsPending?.length || 0
    } catch (error) {
        console.error('获取日常作业失败:', error)
    }
}

import { studyNoteService } from '@/stores/studyNoteService'
const getYourStudyCount = async () => {
    const data = await studyNoteService.getNotes()
    stats.value.yourStudyCount = data?.length || 0
    const studyPending = data?.filter(item => {
        return item.admin_reply === null
    })
    stats.value.yourStudyPending = studyPending?.length || 0
    if (!data) {
        console.error('获取你的心得失败')
    }
}

import { testResultService } from '@/stores/testResultService'
const getYourTestCount = async () => {
    const { data, total } = await testResultService.getUserTestResults({
        page: 1,
        pageSize: 1000
    })
    stats.value.yourTestCount = data?.length || 0
    const testPending = data?.filter(item => {
        return item.feedback_text === null && item.type === 'case'
    })
    stats.value.yourTestPending = testPending?.length || 0
    if (!data) {
        console.error('获取你的测试失败')
    }
}

import { assignmentService } from '@/stores/assignmentService'
const getYourAssignmentsCount = async () => {
    const { data, total, error } = await assignmentService.getPersonalAssignments(1, 1000)
    stats.value.yourAssignmentsCount = total || 0

    if (error) {
        console.error('获取你的作业失败:', error)
    }
}

import { feedbackService } from '@/stores/feedbackService'
// Get feedback stats
const getFeedbackCount = async () => {
    try {
        const { data } = await feedbackService.getPersonalFeedback()
        stats.value.myFeedbackCount = data?.length || 0
        
        stats.value.myFeedbackTrend = data?.filter(feedback => {
            return  feedback.replied_at == null 
        })?.length || 0
    } catch (error) {
        console.error('获取反馈失败:', error)
    }
}

interface Task {
    id: number
    title: string
    description: string
    due_date: string
    type: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    status: 'pending' | 'in_progress' | 'completed'
    created_at: string
    updated_at: string
    assignee: { user_id: string, full_name: string }
    creator: { user_id: string, full_name: string }
    diffDays: number
    isOverdue: boolean
}
// 待办任务
const tasks = ref<Task[]>([])
const getTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*').eq('assigned_to', userStore.user?.user_id)
    if (error) throw error
    tasks.value = data.filter((item: Task) => {
        return item.status !== 'completed'
    }).map((item: Task) => {
        //根据截至日期，计算距离当前时间的天数
        const dueDate = new Date(item.due_date)
        const now = new Date()
        const isOverdue = dueDate < now
        const diffTime = Math.abs(dueDate.getTime() - now.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return {
            ...item,
            diffDays: diffDays,
            isOverdue: isOverdue
        }
    }).sort((a, b) => {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    })
    console.log(tasks.value)
}

function getPriorityType(priority: string) {
    switch (priority) {
        case 'low': return 'info'
        case 'medium': return 'success'
        case 'high': return 'warning'
        case 'urgent': return 'danger'
        default: return 'info'
    }
}

function getPriorityLabel(priority: string) {
    switch (priority) {
        case 'low': return '低'
        case 'medium': return '中'
        case 'high': return '高'
        case 'urgent': return '紧急'
        default: return '未知'
    }
}

function getStatusType(status: string) {
    switch (status) {
        case 'pending': return 'info'
        case 'in_progress': return 'warning'
        case 'completed': return 'success'
        default: return 'info'
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'pending': return '待完成'
        case 'in_progress': return '进行中'
        case 'completed': return '已完成'
        default: return '未知'
    }
}


// 系统公告
const getAnnouncements = async () => {
    try {
        const { data, error } = await supabase.from('announcements').select('*')

        if (error) throw error
        announcements.value = data
    } catch (error) {
        console.error('获取系统公告失败:', error)
    }
}

const getNoticeType = (type: string) => {
    switch (type) {
        case 'important':
            return 'danger'
        case 'normal':
            return 'success'
        case 'update':
            return 'warning'
        default:
            return 'info'
    }
}

const getNoticeTypeText = (type: string) => {
    switch (type) {
        case 'important':
            return '重要'
        case 'normal':
            return '新'
        case 'update':
            return '更新'
        default:
            return '其他'
    }
}

const dialogVisible = ref(false)
const dialogTitle = ref('')
const selectedNoticeId = ref<number | null>(null)

const selectedNotice = computed(() => {
    return announcements.value.find(item => item.id === selectedNoticeId.value) || null
})

const handleNoticeClick = (id: number) => {
    selectedNoticeId.value = id
    dialogVisible.value = true
}

const windowStart = ref(0)
const ANNOUNCE_WINDOW_SIZE = 5
let scrollTimer: any = null

const visibleAnnouncements = computed(() => {
    const arr = []
    const len = announcements.value.length
    for (let i = 0; i < ANNOUNCE_WINDOW_SIZE; i++) {
        if (len === 0) {
            arr.push({ id: null, title: '', type: '', created_at: '' })
        } else {
            const idx = (windowStart.value + i) % len
            arr.push(announcements.value[idx] || { id: null, title: '', type: '', created_at: '' })
        }
    }
    return arr
})

onMounted(() => {
    // 使用 Promise.all 并行加载所有数据
    Promise.all([
        getActiveUsers(),
        getStudyCount(),
        getTestCount(),
        getAssignmentsCount(),
        getYourStudyCount(),
        getYourTestCount(),
        getYourAssignmentsCount(),
        getAnnouncements(),
        getTasks(),
        getFeedbackCount()
    ]).catch(error => {
        console.error('加载数据失败:', error)
    })
    scrollTimer = setInterval(() => {
        if (announcements.value.length > ANNOUNCE_WINDOW_SIZE) {
            windowStart.value = (windowStart.value + 1) % announcements.value.length
        } else {
            windowStart.value = 0
        }
    }, 3000)

})

onBeforeUnmount(() => {
    if (scrollTimer) clearInterval(scrollTimer)
})
</script>

<style scoped>
.el-carousel__item h3 {
    display: flex;
    color: #475669;
    opacity: 0.75;
    line-height: 300px;
    margin: 0;
}

.el-carousel__item:nth-child(2n) {
    background-color: #99a9bf;
}

.el-carousel__item:nth-child(2n + 1) {
    background-color: #d3dce6;
}

.layout {
    /* padding: 20px; */
    /* background-color: #f5f7fa; */
    min-height: calc(100vh - 60px);
}

.dashboard-content {
    /* max-width: 1400px; */
    margin: 0 auto;
}

.welcome-section {
    margin-bottom: 24px;
}

.welcome-section h2 {
    font-size: 24px;
    color: #303133;
    margin: 0;
}

.welcome-section .date {
    color: #909399;
    margin: 8px 0 0;
}

.stat-cards {
    margin-bottom: 24px;
}

.stat-card {
    display: flex;
    align-items: center;
    padding: 20px;
    height: 100%;
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background-color: #ecf5ff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
}

.stat-icon .el-icon {
    font-size: 24px;
    color: #409eff;
}

.stat-info {
    flex: 1;
}

.stat-title {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 4px;
}

.stat-trend {
    font-size: 12px;
    color: #f56c6c;
}

.stat-trend.up {
    color: #67c23a;
}

.main-content {
    margin-top: 24px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.task-card {
    margin-bottom: 24px;
}

.task-item {
    margin-bottom: 8px;
}

.task-item h4 {
    min-width: 80px;
    color: #303133;
}

.task-item p {
    margin: 0;
    color: #606266;
}

.task-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px;
}

.quick-access {
    margin-bottom: 24px;
}

.quick-links {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.quick-link-group {
    display: flex;
    gap: 8px;
}

.quick-link-group .el-link,
.quick-link-group :deep(.el-link__inner),
.quick-link-group :deep(.el-button) {
    flex: 1;
    width: 100%;
}


.notice-card :deep(.el-card__body) {
    padding-top: 10px;
    padding-bottom: 10px;
}

.notice-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.notice-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid #ebeef5;
    cursor: pointer;
}

.notice-item:last-child {
    border-bottom: none;
}

.notice-title {
    flex: 1;
    color: #303133;
}

.notice-time {
    color: #909399;
    font-size: 12px;
}

:deep(.el-timeline-item__node) {
    background-color: #409eff;
}

:deep(.el-timeline-item__tail) {
    border-left: 2px solid #e4e7ed;
}

.notice-dialog>>>.el-dialog__body {
    padding: 0 24px 24px 24px;
    max-height: 400px;
    overflow-y: auto;
}

.notice-dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #ebeef5;
    padding-bottom: 8px;
    margin-bottom: 12px;
}

.notice-type-tag {
    flex-shrink: 0;
}

.notice-dialog-title {
    font-size: 18px;
    font-weight: 500;
    color: #303133;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.notice-time {
    color: #909399;
    font-size: 13px;
    flex-shrink: 0;
}

.notice-dialog-content {
    min-height: 80px;
    max-height: 300px;
    overflow-y: auto;
    font-size: 15px;
    color: #444;
    line-height: 1.8;
    padding: 8px 0 0 0;
    width: 95%;
    margin: 0 auto;
}

.notice-content {
    word-break: break-all;
}

.notice-dialog-footer {
    text-align: center;
    padding-top: 8px;
}

.fixed-notice-list {
    overflow: hidden;
    height: 300px;
}

.notice-item {
    height: 60px;
    display: flex;
    align-items: center;
    cursor: pointer;
    border-bottom: 1px solid #ebeef5;
    transition: background 0.2s;
}

.notice-item:last-child {
    border-bottom: none;
}

.notice-fade-move,
.notice-fade-enter-active,
.notice-fade-leave-active {
    transition: all 0.5s;
}

.notice-fade-enter-from,
.notice-fade-leave-to {
    opacity: 0;
    transform: translateY(30px);
}
</style>