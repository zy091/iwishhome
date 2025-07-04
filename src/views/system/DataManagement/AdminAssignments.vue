<template>
    <div class="layout">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="layout-title">
            <h1 class="title">作业管理</h1>
            <div class="status-tabs">
                <el-tabs 
                class="demo-tabs" v-model="activeStatus" @tab-change="handleStatusChange">
                    <el-tab-pane :name="'all'" label="全部作业" />
                    <el-tab-pane :name="'replied'" label="已完成并已回复" />
                    <el-tab-pane :name="'pending'" label="待处理作业" />
                </el-tabs>
            </div>
        </div>

        <!-- 搜索功能 -->
        <el-card shadow="always" style="margin-bottom: 20px;">
            <el-space wrap alignment="start" :size="30">
                <el-input v-model="searchQuery" style="width: 240px" placeholder="请输入作业标题或提交人" :suffix-icon="Search"
                    size="large" clearable />
                <el-date-picker v-model="dateRange" type="daterange" unlink-panels range-separator="至"
                    start-placeholder="开始日期" end-placeholder="结束日期" :shortcuts="shortcuts" size="large" />
                <el-button type="primary" size="large" @click="handleSearch">搜索</el-button>
                <el-button type="success" size="large" @click="showCreateDialog">布置作业</el-button>
            </el-space>
        </el-card>

        <div class="assignments-content">
            <el-card v-if="hasPermission" style="min-height: 400px;">
                <template #header>
                    <div class="card-header">
                        作业列表
                        <div class="header-actions">
                            <el-button type="danger" :disabled="!selectedAssignments.length" @click="handleBatchDelete">
                                批量删除
                            </el-button>
                            <div style="font-size: 14px; color: #909399;">共计{{ pagination.total }}条数据</div>
                        </div>
                    </div>
                </template>

                <el-table v-loading="loading" :data="assignments" @selection-change="handleSelectionChange">
                    <el-table-column type="selection" width="55" />
                    <el-table-column prop="title" label="作业题目" >
                        <template #default="{ row }">
                            <el-tooltip placement="top" :show-after="500" :max-width="300">
                                <template #content>
                                    <div class="tooltip-content">{{ row.title }}</div>
                                </template>
                                <div class="text-truncate">{{ row.title }}</div>
                            </el-tooltip>
                        </template>
                    </el-table-column>
                    <el-table-column prop="creator_profile.full_name" label="创建人" />
                    <el-table-column prop="assignee_profile.full_name" label="指定人员" />
                    <el-table-column label="回复状态">
                        <template #default="{ row }">
                            <el-tag size="large" style="font-size: 14px;"
                                :type="getReplyStatus(row).type">
                                {{ getReplyStatus(row).text }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="created_at" label="创建时间">
                        <template #default="{ row }">
                            {{ formatDate(row.created_at) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200" fixed="right">
                        <template #default="{ row }">
                            <el-button-group>
                                <el-button type="primary" @click="showReplyDialog(row)">回复</el-button>
                                <el-button type="info" @click="showDetailsDialog(row)">查看详情</el-button>
                            </el-button-group>
                        </template>
                    </el-table-column>
                    <el-empty>
                        <template #description>
                            暂无作业记录
                        </template>
                    </el-empty>
                </el-table>
            </el-card>
            <el-empty v-else description="您没有权限查看作业列表" />
            <Pagination :pagination="pagination" @update:pagination="handlePaginationUpdate" />

            <!-- 创建作业对话框 -->
            <el-dialog v-model="createDialogVisible" title="布置作业" width="600px">
                <el-form :model="newAssignment" :rules="rules" ref="createForm" label-width="80px">
                    <el-form-item label="标题" prop="title">
                        <el-input v-model="newAssignment.title" />
                    </el-form-item>
                    <el-form-item label="指定人员" prop="assigned_to">
                        <el-select v-model="newAssignment.assigned_to" placeholder="请选择">
                            <el-option
                                v-for="member in organizationMembers"
                                :key="member.user_id"
                                :label="member.full_name"
                                :value="member.user_id"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="内容" prop="content">
                        <el-input v-model="newAssignment.content" type="textarea" :autosize="{ minRows: 10, maxRows: 15 }" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="createDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleCreate">确定</el-button>
                </template>
            </el-dialog>

            <!-- 回复作业对话框 -->
            <el-dialog v-model="replyDialogVisible" title="回复作业" width="600px">
                <el-form :model="reply" :rules="replyRules" ref="replyForm" label-width="80px">
                    <el-form-item label="回复内容" prop="content">
                        <el-input v-model="reply.content" type="textarea" :autosize="{ minRows: 10, maxRows: 15 }" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="replyDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleReply">确定</el-button>
                </template>
            </el-dialog>

            <!-- 作业详情对话框 -->
            <el-dialog v-model="detailsDialogVisible" title="作业详情" width="700px">
                <div v-loading="loadingDetails">
                    <template v-if="selectedAssignment">
                        <div class="assignment-details">
                            <h3>{{ selectedAssignment?.title }}</h3>
                            <div class="details-header">
                                <div class="detail-item">
                                    <span class="label">创建人：</span>
                                    <span>{{ selectedAssignment?.creator_profile?.full_name }}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">指定人员：</span>
                                    <span>{{ selectedAssignment?.assignee_profile?.full_name }}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">创建时间：</span>
                                    <span>{{ formatDate(selectedAssignment?.created_at) }}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">状态：</span>
                                    <el-tag size="large" style="font-size: 14px;"
                                        :type="getReplyStatus(selectedAssignment).type">
                                        {{ getReplyStatus(selectedAssignment).text }}
                                    </el-tag>
                                </div>
                            </div>
                            
                            <el-divider />
                            
                            <div class="content">
                                <strong>作业内容：</strong>
                                <p>{{ selectedAssignment?.content }}</p>
                            </div>
                            
                            <div class="replies" v-if="selectedAssignment?.replies?.length">
                                <h4>回复列表</h4>
                                <div 
                                    v-for="reply in selectedAssignment.replies" 
                                    :key="reply.id" 
                                    class="reply-item"
                                    :class="{
                                        'admin-reply': reply.user_id !== selectedAssignment.assigned_to,
                                        'assignee-reply': reply.user_id === selectedAssignment.assigned_to
                                    }"
                                >
                                    <p><strong>{{ reply.profile?.full_name }}：</strong></p>
                                    <p>{{ reply.content }}</p>
                                    <p class="reply-time">{{ reply.created_at ? new Date(reply.created_at).toLocaleString() : '' }}</p>
                                </div>
                            </div>
                            
                            <div class="action-buttons" v-if="selectedAssignment">
                                <el-button type="primary" @click="showReplyDialogFromDetails">回复作业</el-button>
                            </div>
                        </div>
                    </template>
                </div>
            </el-dialog>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { assignmentService } from '@/stores/assignmentService'
import type { Assignment, AssignmentReply } from '@/stores/assignmentService'
import { useUserStore } from '@/stores/user'
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
        name: '作业管理',
        path: '/system/assignments'
    }
])

const userStore = useUserStore()
const hasPermission = computed(() => {
    // 根据角色ID判断权限
    const roleId = Number(userStore.roleId)
    return roleId === 0 || roleId === 1 || roleId ===11 // 管理员和运营管理员有权限
})

const loading = ref(false)
const loadingDetails = ref(false)
const activeStatus = ref('all')
const activeTab = ref('all')
const searchQuery = ref('')
const dateRange = ref<Date[]>([])
const assignments = ref<Assignment[]>([])
const organizationMembers = ref<any[]>([])
const createDialogVisible = ref(false)
const replyDialogVisible = ref(false)
const detailsDialogVisible = ref(false)
const selectedAssignment = ref<Assignment | null>(null)
const selectedAssignments = ref<Assignment[]>([])

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

const pagination = reactive<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
})

const rules = {
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
    assigned_to: [{ required: true, message: '请选择指定人员', trigger: 'change' }]
}

const replyRules = {
    content: [{ required: true, message: '请输入回复内容', trigger: 'blur' }]
}

const newAssignment = ref<Assignment>({
    title: '',
    content: '',
    assigned_to: undefined
})

const reply = ref<AssignmentReply>({
    assignment_id: '',
    user_id: '',
    content: '',
    full_name: ''
})

const createForm = ref<FormInstance>()
const replyForm = ref<FormInstance>()

const fetchAssignments = async () => {
    loading.value = true
    try {
        const startDate = dateRange.value && dateRange.value[0] ? dateRange.value[0].toISOString() : undefined
        const endDate = dateRange.value && dateRange.value[1] ? dateRange.value[1].toISOString() : undefined
        
        const { data, total } = await assignmentService.getAssignments(pagination.page, pagination.pageSize, {
            query: searchQuery.value,
            startDate,
            endDate,
            status: 'all' // 获取所有作业
        })
        
        // 根据状态在前端过滤
        if (activeStatus.value === 'replied') {
            // 过滤出已完成并已回复的作业
            assignments.value = data.filter(assignment => {
                const status = getReplyStatus(assignment);
                return status.text === '已完成并已回复';
            });
        } else if (activeStatus.value === 'pending') {
            // 过滤出待回复的作业
            assignments.value = data.filter(assignment => {
                const status = getReplyStatus(assignment);
                return status.text === '待完成' || status.text === '已完成待回复' || status.text === '管理员已回复待完成' || status.text === '待回复';
            });
        } else {
            // 全部作业
            assignments.value = data;
        }
        
        pagination.total = assignments.value.length;
    } catch (error) {
        console.error('获取作业列表失败:', error)
        ElMessage.error('获取作业列表失败')
    } finally {
        loading.value = false
    }
}

const fetchOrganizationMembers = async () => {
    try {
        const data = await assignmentService.getOrganizationMembers()
        organizationMembers.value = data
    } catch (error) {
        console.error('获取组织成员失败:', error)
        ElMessage.error('获取组织成员失败')
    }
}

const showCreateDialog = () => {
    createDialogVisible.value = true
    newAssignment.value = {
        title: '',
        content: '',
        assigned_to: undefined
    }
}

const handleCreate = async () => {
    if (!createForm.value) return

    await createForm.value.validate(async (valid) => {
        if (valid) {
            try {
                await assignmentService.createAssignment(newAssignment.value)
                ElMessage.success('布置作业成功')
                createDialogVisible.value = false
                fetchAssignments()
            } catch (error) {
                console.error('布置作业失败:', error)
                ElMessage.error('布置作业失败')
            }
        }
    })
}

const showReplyDialog = (assignment: Assignment) => {
    selectedAssignment.value = assignment
    reply.value = {
        assignment_id: assignment.id || '',
        user_id: '',
        content: '',
        full_name: ''
    }
    replyDialogVisible.value = true
}

const showReplyDialogFromDetails = () => {
    if (!selectedAssignment.value) return
    replyDialogVisible.value = true
    reply.value = {
        assignment_id: selectedAssignment.value.id || '',
        user_id: '',
        content: '',
        full_name: '' // 添加full_name
    }
}

const handleReply = async () => {
    if (!replyForm.value) return

    await replyForm.value.validate(async (valid) => {
        if (valid) {
            try {
                await assignmentService.addReply(reply.value)
                ElMessage.success('回复成功')
                replyDialogVisible.value = false
                fetchAssignments()
                
                // 如果详情对话框仍然打开，刷新详情数据
                if (detailsDialogVisible.value && selectedAssignment.value) {
                    showDetailsDialog(selectedAssignment.value)
                }
            } catch (error) {
                console.error('回复失败:', error)
                ElMessage.error('回复失败')
            }
        }
    })
}

const showDetailsDialog = async (assignment: Assignment) => {
    loadingDetails.value = true
    selectedAssignment.value = assignment
    detailsDialogVisible.value = true
    
    try {
        // 获取最新的作业详情包含回复
        const refreshedAssignment = await assignmentService.getAssignmentById(assignment.id || '')
        if (refreshedAssignment) {
            selectedAssignment.value = refreshedAssignment
        }
    } catch (error) {
        console.error('获取作业详情失败:', error)
    } finally {
        loadingDetails.value = false
    }
}

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

const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    fetchAssignments()
}

// 处理状态切换
const handleStatusChange = (value: string) => {
    pagination.page = 1 // 重置页码
    fetchAssignments()
}

// 处理搜索按钮点击
const handleSearch = () => {
    pagination.page = 1 // 重置页码
    fetchAssignments()
}

// 处理表格选择变化
const handleSelectionChange = (selection: Assignment[]) => {
    selectedAssignments.value = selection
}

// 删除单个作业
const handleDelete = async (assignment: Assignment) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除该作业吗？此操作不可恢复。',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        if (!assignment.id) throw new Error('作业ID不存在')
        
        await assignmentService.deleteAssignment(assignment.id)
        ElMessage.success('删除成功')
        fetchAssignments()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除作业失败:', error)
            ElMessage.error('删除失败')
        }
    }
}

// 批量删除作业
const handleBatchDelete = async () => {
    if (selectedAssignments.value.length === 0) return
    
    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedAssignments.value.length} 个作业吗？此操作不可恢复。`,
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        // 创建批量删除的承诺数组
        const deletePromises = selectedAssignments.value.map(assignment => 
            assignment.id ? assignmentService.deleteAssignment(assignment.id) : Promise.resolve()
        )
        
        // 等待所有删除操作完成
        await Promise.all(deletePromises)
        
        ElMessage.success(`成功删除 ${selectedAssignments.value.length} 个作业`)
        selectedAssignments.value = [] // 清空选择
        fetchAssignments() // 重新加载数据
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量删除作业失败:', error)
            ElMessage.error('批量删除失败')
        }
    }
}

const getReplyStatus = (assignment: Assignment | null) => {
    if (!assignment || !assignment.replies || assignment.replies.length === 0) {
        return { type: 'info', text: '待完成', hasAssigneeReply: false };
    }
    
    // 检查是否有指定人员的回复
    const hasAssigneeReply = assignment.replies.some(reply => 
        reply.user_id === assignment.assigned_to
    );
    
    // 检查是否有非指定人员的回复（管理员回复）
    const hasAdminReply = assignment.replies.some(reply => 
        reply.user_id !== assignment.assigned_to
    );
    
    if (hasAssigneeReply && hasAdminReply) {
        return { type: 'success', text: '已完成并已回复', hasAssigneeReply: true };
    } else if (hasAssigneeReply) {
        return { type: 'warning', text: '已完成待回复', hasAssigneeReply: true };
    } else if (hasAdminReply) {
        return { type: 'warning', text: '管理员已回复待完成', hasAssigneeReply: false };
    } else {
        return { type: 'waring', text: '待回复', hasAssigneeReply: false };
    }
}

onMounted(async () => {
    await Promise.all([fetchAssignments(), fetchOrganizationMembers()])
})
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

.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
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

.assignment-details {
    line-height: 1.6;
}

.assignment-details h3 {
    margin-bottom: 20px;
}

.assignment-details p {
    margin: 10px 0;
}

.assignment-details .content {
    margin-top: 20px;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.replies {
    margin-top: 20px;
}

.reply-item {
    margin: 15px 0;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.reply-time {
    font-size: 0.8em;
    color: #666;
    margin-top: 5px;
}

.action-buttons {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

:deep(.el-dialog) {
    padding: 30px;
}

:deep(.el-tabs__item) {
    font-size: 16px;
    height: 60px;
}

:deep(.el-tabs__active-bar) {
    background-color: #409eff;
    height: 3px;
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

.admin-reply {
    background-color: #f0f9eb;
    border-left: 3px solid #67c23a;
}

.assignee-reply {
    background-color: #ecf5ff;
    border-left: 3px solid #409eff;
}
</style>