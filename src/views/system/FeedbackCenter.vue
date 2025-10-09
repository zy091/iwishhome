<template>
    <div class="layout">
        <Breadcrumb :breadcrumb="breadcrumb" />
        <div class="layout-title">
            <h1 class="title">FAQ中心</h1>
            <div class="status-tabs" >
                <el-tabs class="demo-tabs" v-model="activeStatus" @tab-change="handleStatusChange">
                    <el-tab-pane :name="'all'" label="全部反馈" />
                    <el-tab-pane  v-if="hasAdminPerm" :name="'replied'" label="已解决" />
                    <el-tab-pane  v-if="hasAdminPerm" :name="'in_progress'" label="处理中" />
                    <el-tab-pane  v-if="hasAdminPerm" :name="'pending'" label="待处理" />
                    <el-tab-pane  :name="'my_feedback'" label="我的反馈" />
                </el-tabs>
            </div>
        </div>

        <!-- 搜索功能 -->
        <el-card shadow="always" style="margin-bottom: 20px;">
            <el-space wrap alignment="start" :size="30">
                <el-input v-model="searchQuery" style="width: 240px" placeholder="请输入提交人或标题" :suffix-icon="Search"
                    size="large" clearable />
                <el-select v-model="selectedPlatform" placeholder="选择平台" style="width: 160px" size="large" clearable>
                    <el-option v-for="item in platformOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <el-select v-if="hasAdminPerm" v-model="showStatus" placeholder="选择展示状态" style="width: 160px" size="large" clearable>
                    <el-option label="显示" value="true" />
                    <el-option label="隐藏" value="false" />
                </el-select>
                <el-date-picker v-model="dateRange" type="daterange" unlink-panels range-separator="至"
                    start-placeholder="开始日期" end-placeholder="结束日期" :shortcuts="shortcuts" size="large" />
                <el-button type="primary" size="large" @click="searchFeedback">搜索</el-button>
                <el-button type="success" size="large" @click="showCreateDialog">添加反馈</el-button>
            </el-space>
        </el-card>

        <div class="feedback-content">
            <el-card style="min-height: 400px;">
                <template #header>
                    <div class="card-header">
                        反馈列表
                        <div class="header-actions" v-if="hasAdminPerm">
                            <el-button type="danger" :disabled="!selectedFeedbacks.length" @click="handleBatchDelete">
                                批量删除
                            </el-button>
                            <div style="font-size: 14px; color: #909399;">共计{{ pagination.total }}条数据</div>
                        </div>
                    </div>
                </template>

                <el-table v-loading="loading" :data="feedbacks" @selection-change="handleSelectionChange">
                    <el-table-column type="selection" width="55" v-if="hasAdminPerm" />
                    <el-table-column prop="title" label="标题" min-width="200" />
                    <el-table-column prop="platform" label="平台" width="130">
                        <template #default="{ row }">
                            <el-tag :type="getPlatformType(row.platform)" size="large">
                                {{ getPlatformLabel(row.platform) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column v-if="hasAdminPerm" prop="full_name" label="提交人" width="120" />
                    <el-table-column prop="status" label="状态" width="100">
                        <template #default="{ row }">
                            <el-tag style="font-size: 14px;" :type="getStatusType(row.status)" size="large">
                                {{ getStatusLabel(row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="reply_count" label="回复数" width="80">
                        <template #default="{ row }">
                            <el-tag v-if="row.reply_count > 0" type="info" size="small">
                                {{ row.reply_count }}
                            </el-tag>
                            <span v-else style="color: #909399;">0</span>
                        </template>
                    </el-table-column>
                    <el-table-column v-if="hasAdminPerm" prop="is_show" label="展示状态" width="100">
                        <template #default="{ row }">
                            <el-tag :type="row.is_show ? 'success' : 'danger'" size="large">
                                {{ row.is_show ? '显示' : '隐藏' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="created_at" label="创建时间" width="180">
                        <template #default="{ row }">
                            {{ new Date(row.created_at).toLocaleString() }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="150" fixed="right">
                        <template #default="{ row }">
                            <el-button-group>
                                <el-button type="primary" @click="showDetailDialog(row)">查看</el-button>
                                <el-button type="danger" @click="handleDelete(row)" v-if="hasAdminPerm || (row.user_id === currentUserId && activeStatus === 'my_feedback')"  :disabled="!hasAdminPerm && row.user_id == currentUserId && row.reply_count > 0">删除</el-button>
                            </el-button-group>
                        </template>
                    </el-table-column>
                    <el-empty>
                        <template #description>
                            暂无反馈数据
                        </template>
                    </el-empty>
                </el-table>
            </el-card>
            <Pagination :pagination="pagination" @update:pagination="handlePaginationUpdate" />

            <!-- 查看详情对话框 -->
            <el-dialog title="反馈详情" v-model="detailDialogVisible" width="60%" :close-on-click-modal="false"
                top="5vh" class="feedback-detail-dialog">
                <div class="dialog-content">
                    <div class="feedback-details">
                        <!-- 标题区 -->
                        <div class="feedback-header">
                            <h2 class="feedback-title">{{ selectedFeedback?.title || '无标题' }}</h2>
                            <div class="feedback-meta">
                                <span class="meta-item">
                                    <el-icon><User /></el-icon>
                                    <span>{{ selectedFeedback?.full_name || '未知用户' }}</span>
                                </span>
                                <span class="meta-item">
                                    <el-icon><Message /></el-icon>
                                    <span>{{ selectedFeedback?.email || '无邮箱' }}</span>
                                </span>
                                <span class="meta-item">
                                    <el-icon><Calendar /></el-icon>
                                    <span>{{ selectedFeedback ? new Date(selectedFeedback?.created_at).toLocaleString() : '未知时间' }}</span>
                                </span>
                                <span class="meta-item">
                                    <el-icon><Collection /></el-icon>
                                    <span>{{ getPlatformLabel(selectedFeedback?.platform || '') }}</span>
                                </span>
                            </div>
                        </div>

                        <!-- 内容区 -->
                        <div class="feedback-section">
                            <div class="section-title">内容</div>
                            <div class="feedback-content" style="padding: 10px">{{ selectedFeedback?.content || '无内容' }}</div>
                        </div>

                        <!-- 回复历史区 -->
                        <div v-if="feedbackReplies.length > 0" class="feedback-section">
                            <div class="section-title">回复历史 ({{ feedbackReplies.length }}条)</div>
                            <div class="replies-list">
                                <div v-for="reply in feedbackReplies" :key="reply.id" class="reply-item">
                                    <div class="reply-header">
                                        <span class="reply-author">{{ reply.full_name }}</span>
                                        <span class="reply-time">{{ new Date(reply.created_at).toLocaleString() }}</span>
                                    </div>
                                    <div class="reply-content">{{ reply.content }}</div>
                                </div>
                            </div>
                        </div>

                        <!-- 回复表单区 -->
                        <div class="feedback-section" v-if="hasAdminPerm">
                            <div class="section-title">添加回复</div>
                            <el-input type="textarea" v-model="adminReply" :rows="4" placeholder="请输入您的回复内容..."
                                class="reply-input"></el-input>
                            <div class="status-selector" style="margin-top: 15px;">
                                <span class="status-label">状态：</span>
                                <el-radio-group v-model="replyStatus">
                                    <el-radio label="in_progress">处理中</el-radio>
                                    <el-radio label="resolved">已解决</el-radio>
                                </el-radio-group>
                            </div>
                            <div class="status-selector" style="margin-top: 15px;">
                                <span class="status-label">是否显示：</span>
                                <el-switch v-if="selectedFeedback" v-model="isShow" active-text="显示" inactive-text="隐藏" />
                            </div>
                        </div>
                    </div>
                </div>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="detailDialogVisible = false">关闭</el-button>
                        <el-button type="primary" @click="submitReply" :loading="submitting" v-if="hasAdminPerm">
                            提交回复
                        </el-button>
                    </span>
                </template>
            </el-dialog>

            <!-- 创建反馈对话框 -->
            <el-dialog title="创建反馈" v-model="createDialogVisible" width="40%" :close-on-click-modal="false">
                <el-form :model="newFeedback" :rules="feedbackRules" ref="feedbackForm" label-width="80px">
                    <el-form-item label="标题" prop="title">
                        <el-input v-model="newFeedback.title" placeholder="请输入反馈标题"></el-input>
                    </el-form-item>
                    <el-form-item label="平台" prop="platform">
                        <el-select v-model="newFeedback.platform" placeholder="选择平台" style="width: 100%">
                            <el-option v-for="item in platformOptions" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="内容" prop="content">
                        <el-input type="textarea" v-model="newFeedback.content" :rows="6"
                            placeholder="请详细描述您的反馈内容"></el-input>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="createDialogVisible = false">取消</el-button>
                        <el-button type="primary" @click="createFeedback" :loading="creating">创建</el-button>
                    </span>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { Search, User, Message, Calendar, Collection } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { feedbackService, hasAdminPermission } from '@/stores/feedbackService'
import type { FeedbackWithUser, FeedbackReplyWithUser } from '@/stores/feedbackService'
import { useUserStore } from '@/stores/user'
import Breadcrumb from '@/components/system/Breadcrumb.vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'

const breadcrumb = reactive([
    {
        name: 'FAQ中心',
        path: '/system/feedback-center'
    }
])

const userStore = useUserStore()
const currentUserId = computed(() => userStore.user?.user_id || '')
const hasAdminPerm = computed(() => hasAdminPermission(Number(userStore.roleId)))
console.log(hasAdminPerm,'hasAdminPerm')

// 初始状态
const loading = ref(false)
const feedbacks = ref<FeedbackWithUser[]>([])
const detailDialogVisible = ref(false)
const createDialogVisible = ref(false)
const selectedFeedback = ref<FeedbackWithUser | null>(null)
const searchQuery = ref('')
const dateRange = ref<Date[]>([])
const adminReply = ref('')
const replyStatus = ref('resolved')
const isShow = ref(true)
const submitting = ref(false)
const creating = ref(false)
const activeStatus = ref('all')
const selectedPlatform = ref('')
const selectedFeedbacks = ref<FeedbackWithUser[]>([])
const feedbackForm = ref()
const showStatus = ref('')
const feedbackReplies = ref<FeedbackReplyWithUser[]>([])
const loadingReplies = ref(false)
const newFeedback = reactive({
    title: '',
    content: '',
    platform: ''
})


const feedbackRules = {
    title: [
        { required: true, message: '请输入反馈标题', trigger: 'blur' },
        { min: 2, max: 100, message: '标题长度应在2到100个字符之间', trigger: 'blur' }
    ],
    platform: [
        { required: true, message: '请选择平台', trigger: 'change' }
    ],
    content: [
        { required: true, message: '请输入反馈内容', trigger: 'blur' },
        { min: 4, max: 2000, message: '内容长度应在4到2000个字符之间', trigger: 'blur' }
    ]
}

const platformOptions = [
    { label: 'Google', value: 'google' },
    { label: 'Meta', value: 'meta' },
    { label: 'Criteo', value: 'criteo' },
    { label: 'Bing', value: 'bing' },
    { label: 'GMC', value: 'gmc' },
    { label: 'GA4', value: 'ga4' },
    { label: '插件应用', value: 'plugin' },
    { label: 'Shopify后台', value: 'shopify' },
    { label: '系统反馈', value: 'system' },
    { label: '其他', value: 'other' }
]

const pagination = reactive<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
})

const shortcuts = [
    {
        text: '最近一周',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            return [start, end]
        },
    },
    {
        text: '最近一个月',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            return [start, end]
        },
    },
    {
        text: '最近三个月',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            return [start, end]
        },
    },
]

// 平台类型标签样式
const getPlatformType = (platform: string) => {
    switch (platform) {
        case 'google': return 'success'
        case 'meta': return 'info'
        case 'criteo': return 'warning'
        case 'bing': return 'primary'
        case 'gmc': return 'danger'
        case 'ga4': return 'success'
        case 'plugin': return 'warning'
        case 'shopify': return 'info'
        case 'system': return 'primary'
        case 'other': return 'info'
        default: return 'info'
    }
}

// 平台标签文本
const getPlatformLabel = (platform: string) => {
    switch (platform) {
        case 'google': return 'Google'
        case 'meta': return 'Meta'
        case 'criteo': return 'Criteo'
        case 'bing': return 'Bing'
        case 'gmc': return 'GMC'
        case 'ga4': return 'GA4'
        case 'plugin': return '插件应用'
        case 'shopify': return 'Shopify后台'
        case 'system': return '系统反馈'
        case 'other': return '其他'
        default: return platform || '未知'
    }
}

// 状态类型标签样式
const getStatusType = (status: string) => {
    switch (status) {
        case 'pending': return 'info'
        case 'in_progress': return 'warning'
        case 'resolved': return 'success'
        default: return 'info'
    }
}

// 状态标签文本
const getStatusLabel = (status: string) => {
    switch (status) {
        case 'pending': return '待处理'
        case 'in_progress': return '处理中'
        case 'resolved': return '已解决'
        default: return status || '未知'
    }
}

// 更新分页
const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    searchFeedback()
}

// 搜索反馈
const searchFeedback = async () => {
    loading.value = true
    const startDate = dateRange.value != null && dateRange.value[0] != null ? dateRange.value[0].toDateString() : ''
    const endDate = dateRange.value != null && dateRange.value[1] != null ? dateRange.value[1].toDateString() : ''
    
    try {
        let result;
        if (hasAdminPerm.value) {
            // 管理员获取所有反馈
            result = await feedbackService.getAllFeedback({
                query: searchQuery.value,
                startDate,
                endDate,
                page: pagination.page,
                pageSize: pagination.pageSize,
                replyStatus: activeStatus.value,
                platform: selectedPlatform.value !== '' ? selectedPlatform.value : undefined,
                showStatus: showStatus.value !== '' ? showStatus.value : undefined
            })
        } else {
            // 普通用户获取所有反馈
            result = await feedbackService.getAllFeedback({
                query: searchQuery.value,
                startDate,
                endDate,
                page: pagination.page,
                pageSize: pagination.pageSize,
                platform: selectedPlatform.value !== '' ? selectedPlatform.value : undefined
            })
        }
        
        feedbacks.value = result.data
        pagination.total = result.total
    } catch (error) {
        ElMessage.error('搜索反馈失败')
        console.error('搜索反馈失败:', error)
    } finally {
        loading.value = false
    }
}

// 显示详情对话框
const showDetailDialog = async (feedback: FeedbackWithUser) => {
    detailDialogVisible.value = true
    selectedFeedback.value = feedback
    adminReply.value = ''
    replyStatus.value = feedback.status || 'resolved'
    isShow.value = feedback.is_show
    
    // 加载回复列表
    loadingReplies.value = true
    try {
        feedbackReplies.value = await feedbackService.getFeedbackReplies(feedback.id)
    } catch (error) {
        console.error('获取回复失败:', error)
        ElMessage.error('获取回复失败')
    } finally {
        loadingReplies.value = false
    }
}

// 显示创建对话框
const showCreateDialog = () => {
    createDialogVisible.value = true
    Object.assign(newFeedback, {
        title: '',
        content: '',
        platform: ''
    })
}

// 处理表格选择变化
const handleSelectionChange = (selection: FeedbackWithUser[]) => {
    selectedFeedbacks.value = selection
}

// 创建反馈
const createFeedback = async () => {
    if (!feedbackForm.value) return
    
    await feedbackForm.value.validate(async (valid: boolean) => {
        if (!valid) return
        
        creating.value = true
        try {
            await feedbackService.createFeedback({
                title: newFeedback.title,
                content: newFeedback.content,
                platform: newFeedback.platform
            })
            
            ElMessage.success('反馈已提交')
            createDialogVisible.value = false
            searchFeedback()
        } catch (error) {
            ElMessage.error('创建反馈失败')
            console.error('创建反馈失败:', error)
        } finally {
            creating.value = false
        }
    })
}

// 提交回复
const submitReply = async () => {
    if (!selectedFeedback.value || !hasAdminPerm.value) return
    
    if (!adminReply.value.trim()) {
        ElMessage.warning('请输入回复内容')
        return
    }
    
    submitting.value = true
    try {
        await feedbackService.submitReply(selectedFeedback.value.id, {
            content: adminReply.value.trim(),
            status: replyStatus.value,
            is_show: isShow.value
        })
        
        ElMessage.success('回复提交成功')
        
        // 重新加载回复列表
        feedbackReplies.value = await feedbackService.getFeedbackReplies(selectedFeedback.value.id)
        
        // 清空回复输入框
        adminReply.value = ''
        
        // 重新加载反馈列表以更新状态
        searchFeedback()
    } catch (error) {
        ElMessage.error('提交失败')
        console.error('提交失败:', error)
    } finally {
        submitting.value = false
    }
}

// 删除反馈
const handleDelete = async (feedback: FeedbackWithUser) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除 "${feedback.title}" 这条反馈吗？`,
            '提示',
            { type: 'warning' }
        )
        
        if (hasAdminPerm.value) {
            await feedbackService.deleteFeedback(feedback.id)
            // 管理员进行真删除
        } else {
            if(feedback.reply_count > 0){
                ElMessage.error('反馈已有回复，不能删除')
            }else{
                // 普通用户进行伪删除
                await feedbackService.hideFeedback(feedback.id)
            }
        }
        
        ElMessage.success('删除成功')
        
        // 如果是查看我的反馈，重新获取个人反馈
        if (activeStatus.value === 'my_feedback') {
            getPersonalFeedback()
        } else {
            searchFeedback()
        }
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败')
            console.error('删除失败:', error)
        }
    }
}

// 批量删除
const handleBatchDelete = async () => {
    if (selectedFeedbacks.value.length === 0) return
    
    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedFeedbacks.value.length} 条反馈吗？此操作不可恢复。`,
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        
        // 创建批量删除的承诺数组
        const deletePromises = selectedFeedbacks.value.map(feedback =>
            feedbackService.deleteFeedback(feedback.id)
        )
        
        // 等待所有删除操作完成
        await Promise.all(deletePromises)
        
        ElMessage.success(`成功删除 ${selectedFeedbacks.value.length} 条反馈`)
        selectedFeedbacks.value = []
        searchFeedback()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量删除反馈失败:', error)
            ElMessage.error('批量删除失败')
        }
    }
}

// 获取个人反馈
const getPersonalFeedback = async () => {
    let result = await feedbackService.getPersonalFeedback()
    console.log(result,'result')
    feedbacks.value = result.data
    pagination.total = result.total
}

// 处理标签页变化
const handleStatusChange = (status: string) => {
    activeStatus.value = status
    // 重置分页到第一页
    pagination.page = 1
    if (status === 'my_feedback') {
        getPersonalFeedback()
    }else{
        searchFeedback()
    }
}

onMounted(() => {
    searchFeedback()
})
</script>

<style scoped>
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header h2 {
    margin: 0;
}

.dialog-content {
    padding: 20px;
}

.feedback-details {
    line-height: 1.6;
    font-size: 16px;
}

.feedback-header {
    margin-bottom: 20px;
    border-bottom: 1px solid #eaeaea;
    padding-bottom: 15px;
}

.feedback-title {
    font-size: 1.5em;
    font-weight: bold;
    color: #409EFF;
    margin-bottom: 10px;
}

.feedback-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    color: #909399;
    font-size: 14px;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
}

.feedback-section {
    margin-bottom: 25px;
    position: relative;
}

.section-title {
    font-weight: bold;
    margin-bottom: 12px;
    font-size: 16px;
    color: #606266;
    position: relative;
    padding-left: 12px;
}

.section-title::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 16px;
    background-color: #409EFF;
    border-radius: 2px;
}

.feedback-content {
    background-color: #f8f9fa;
    border-radius: 4px;
    min-height: 100px;
    white-space: pre-wrap;
    word-break: break-word;
}

.previous-reply {
    padding: 15px;
    background-color: #ecf8ff;
    border-radius: 4px;
    border-left: 4px solid #409EFF;
}

.admin-reply-content {
    margin-bottom: 10px;
    white-space: pre-wrap;
    word-break: break-word;
}

.reply-time {
    text-align: right;
    color: #909399;
    font-size: 12px;
    margin-bottom: 0;
}

.replies-list {
    max-height: 300px;
    overflow-y: auto;
}

.reply-item {
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 4px;
    margin-bottom: 10px;
    border-left: 4px solid #409EFF;
}

.reply-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.reply-author {
    font-weight: bold;
    color: #409EFF;
    font-size: 14px;
}

.reply-content {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
}

.reply-input {
    width: 100%;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
}

.feedback-detail-dialog :deep(.el-dialog__body) {
    padding: 20px 25px;
}

.feedback-detail-dialog :deep(.el-dialog__header) {
    padding: 15px 25px;
    margin-right: 0;
    background-color: #f5f7fa;
    border-bottom: 1px solid #eaeaea;
}

.feedback-detail-dialog :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}

.feedback-detail-dialog :deep(.el-dialog__footer) {
    padding: 15px 25px;
    border-top: 1px solid #eaeaea;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.status-selector {
    display: flex;
    align-items: center;
}

.status-label {
    margin-right: 10px;
    color: #606266;
}

.status-tabs {
    margin-bottom: 20px;
}

.demo-tabs>.el-tabs__content {
    padding: 15px;
}

:deep(.el-tabs__item) {
    font-size: 16px;
    height: 60px;
}

:deep(.el-tabs__active-bar) {
    background-color: #409eff;
    height: 3px;
}
</style> 