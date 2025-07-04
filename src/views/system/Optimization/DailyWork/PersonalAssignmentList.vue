<template>
    <div class="personal-assignment-list">
        <el-card class="box-card" shadow="always" style="margin-top: 30px;min-height: 400px;">
            <template #header>
                <div class="card-header">
                    <span>我的作业列表</span>
                    <el-button type="primary" @click="refreshList">刷新</el-button>
                </div>
            </template>
            <div v-loading="loading">
                <template v-if="assignments.length > 0">
                    <el-table :data="assignments" style="width: 100%">
                        <el-table-column prop="title" label="标题" min-width="180">
                            <template #default="scope">
                                <el-tooltip placement="top" :show-after="500" :max-width="300">
                                    <template #content>
                                        <div class="tooltip-content">{{ scope.row.title }}</div>
                                    </template>
                                    <div class="text-truncate">{{ scope.row.title }}</div>
                                </el-tooltip>
                            </template>
                        </el-table-column>
                        <el-table-column label="内容" min-width="250">
                            <template #default="scope">
                                <el-tooltip placement="top" :show-after="500" >
                                    <template #content>
                                        <div class="tooltip-content" >{{ scope.row.content }}</div>
                                    </template>
                                    <div class="content-preview">{{ scope.row.content }}</div>
                                </el-tooltip>
                            </template>
                        </el-table-column>
                        <el-table-column prop="created_at" label="创建时间" width="180">
                            <template #default="scope">
                                {{ formatDate(scope.row.created_at) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="状态" width="100">
                            <template #default="scope">
                                <el-tag :type="getAssignmentStatus(scope.row).type">
                                    {{ getAssignmentStatus(scope.row).text }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="200">
                            <template #default="scope">
                                <el-button-group>
                                    <el-button type="primary" @click="viewAssignment(scope.row)">查看</el-button>
                                    <!-- <el-button type="danger" v-if="scope.row.created_by === userStore.user?.user_id" @click="deleteAssignment(scope.row)">删除</el-button> -->
                                </el-button-group>
                            </template>
                        </el-table-column>
                    </el-table>
                </template>
                <el-empty v-else description="暂无分配给您的作业" />
            </div>
        </el-card>
        <Pagination :pagination="pagination" @update:pagination="handlePaginationUpdate" />

        <!-- 查看作业详情对话框 -->
        <el-dialog v-model="dialogVisible" title="作业详情" width="600px">
            <div v-if="currentAssignment" class="assignment-detail">
                <h3>{{ currentAssignment.title }}</h3>
                <div class="assignment-meta">
                    <p>创建时间: {{ formatDate(currentAssignment.created_at) }}</p>
                </div>
                <div class="assignment-content">
                    <el-divider content-position="left">作业内容</el-divider>
                    <p>{{ currentAssignment.content }}</p>
                </div>
                
                <div class="assignment-replies" v-if="currentAssignment.replies && currentAssignment.replies.length > 0">
                    <el-divider content-position="left">回复记录</el-divider>
                    <div v-for="(reply, index) in currentAssignment.replies" :key="index" 
                        class="reply-item" 
                        :class="{ 
                            'my-reply': reply.user_id === userStore.user?.user_id,
                            'admin-reply': reply.user_id !== currentAssignment.assigned_to && reply.user_id !== userStore.user?.user_id,
                            'other-reply': reply.user_id !== userStore.user?.user_id && reply.user_id === currentAssignment.assigned_to
                        }"
                    >
                        <div class="reply-header">
                            <span class="reply-author">{{ reply.user_id === userStore.user?.user_id ? '我' : reply.full_name || '未知用户' }}</span>
                            <span v-if="reply.user_id !== currentAssignment.assigned_to && reply.user_id !== userStore.user?.user_id" class="reply-role">管理员</span>
                        </div>
                        <p>{{ reply.content }}</p>
                        <small>{{ formatDate(reply.created_at) }}</small>
                    </div>
                </div>

                <div class="reply-form">
                    <el-divider content-position="left">提交回复</el-divider>
                    <el-form>
                        <el-form-item>
                            <el-input
                                v-model="replyContent"
                                type="textarea"
                                :rows="4"
                                placeholder="请输入您的回复内容"
                            ></el-input>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="submitReply">提交回复</el-button>
                        </el-form-item>
                    </el-form>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { assignmentService } from '@/stores/assignmentService'
import type { Assignment } from '@/stores/assignmentService'
import { useUserStore } from '@/stores/user'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'
const userStore = useUserStore()
const loading = ref(false)
const assignments = ref<Assignment[]>([])
const dialogVisible = ref(false)
const currentAssignment = ref<Assignment | null>(null)
const replyContent = ref('')
import { useRoute } from 'vue-router'
const route = useRoute()
const platform = ref(route.query.platform || 'google')

const pagination = reactive<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
})

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

// 获取个人作业列表
const fetchAssignments = async () => {
    loading.value = true
    try {
        // 使用新方法直接获取分配给当前用户的作业
        const { data, total } = await assignmentService.getPersonalAssignments(
            pagination.page,
            pagination.pageSize,
            {
                status: '' // 获取所有状态的作业
            }
        )

        assignments.value = data
        pagination.total = total // 直接使用返回的total，无需额外过滤
    } catch (error) {
        console.error('获取作业列表失败:', error)
        ElMessage.error('获取作业列表失败')
    } finally {
        loading.value = false
    }
}

// 查看作业详情
const viewAssignment = (assignment: Assignment) => {
    currentAssignment.value = assignment
    dialogVisible.value = true
    replyContent.value = ''
}

// 提交回复
const submitReply = async () => {
    if (!currentAssignment.value) return
    if (!replyContent.value.trim()) {
        ElMessage.warning('回复内容不能为空')
        return
    }

    try {
        if (!userStore.user?.user_id || !currentAssignment.value.id) {
            ElMessage.error('用户信息或作业ID缺失')
            return
        }
        
        const reply = await assignmentService.addReply({
            assignment_id: currentAssignment.value.id,
            user_id: userStore.user.user_id,
            content: replyContent.value,
            full_name: userStore.user.full_name || ''
        })

        // 添加回复到当前作业
        if (!currentAssignment.value.replies) {
            currentAssignment.value.replies = []
        }
        currentAssignment.value.replies.push(reply)
        
        ElMessage.success('提交回复成功')
        replyContent.value = ''
        
        // 更新列表
        fetchAssignments()
    } catch (error) {
        console.error('提交回复失败:', error)
        ElMessage.error('提交回复失败')
    }
}

// 删除作业
const deleteAssignment = async (assignment: Assignment) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除这个作业吗？此操作不可恢复。',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        await assignmentService.deleteAssignment(assignment.id!)
        ElMessage.success('删除成功')
        fetchAssignments()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除作业失败:', error)
            ElMessage.error('删除作业失败')
        }
    }
}

// 刷新列表
const refreshList = () => {
    fetchAssignments()
}

const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    fetchAssignments()
}

// 获取作业状态
const getAssignmentStatus = (assignment: Assignment) => {
    if (!assignment.replies || assignment.replies.length === 0) {
        return { type: 'warning', text: '待完成' };
    }
    
    // 检查当前用户是否完成了作业
    const hasUserReply = assignment.replies.some(reply => 
        reply.user_id === userStore.user?.user_id
    );
    
    // 检查是否有管理员的回复
    const hasAdminReply = assignment.replies.some(reply => 
        reply.user_id !== assignment.assigned_to
    );
    
    if (hasUserReply) {
        return { type: 'success', text: '已完成' };
    } else {
        return { type: 'warning', text: '待完成' };
    }
}

onMounted(() => {
    fetchAssignments()
})
</script>

<style scoped>
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.content-preview {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 250px;
}

.text-truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

.assignment-detail {
    padding: 0 20px;
}

.assignment-meta {
    color: #666;
    font-size: 14px;
    margin-bottom: 15px;
}

.assignment-meta p {
    margin: 5px 0;
}

.assignment-content {
    margin: 10px 0;
    white-space: pre-line;
}

.reply-item {
    background-color: #f8f8f8;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 10px;
}

.my-reply {
    background-color: #e6f7ff;
    border-left: 3px solid #1890ff;
}

.admin-reply {
    background-color: #f0f9eb;
    border-left: 3px solid #67c23a;
}

.other-reply {
    background-color: #f9f2f4;
    border-left: 3px solid #d4237a;
}

.reply-role {
    font-size: 12px;
    background-color: #67c23a;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: 8px;
}

.reply-header {
    margin-bottom: 5px;
}

.reply-author {
    font-weight: bold;
}

.reply-item small {
    display: block;
    color: #999;
    text-align: right;
}

.reply-form {
    margin-top: 20px;
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
</style> 