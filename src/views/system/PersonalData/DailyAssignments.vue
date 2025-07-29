<template>
    <div class="personal-assignments">
        <div class="assignments-header">
            <div>共计{{ assignments.length }}个作业</div>
            <el-button type="primary" @click="showCreateDialog">添加作业</el-button>
        </div>
        <el-table v-loading="loading" :data="assignments" height="300px">
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
            <!-- <el-table-column label="内容" min-width="250">
                <template #default="scope">
                    <el-tooltip placement="top" :show-after="500">
                        <template #content>
                            <div class="tooltip-content">{{ scope.row.content }}</div>
                        </template>
                        <div class="content-preview">{{ scope.row.content }}</div>
                    </el-tooltip>
                </template>
            </el-table-column> -->
            <el-table-column label="附件" width="80">
                <template #default="scope">
                    <el-button 
                        v-if="scope.row.attachment_url" 
                        type="primary" 
                        link 
                        @click="viewAttachment(scope.row)"
                    >
                        <el-icon color="#409EFF" size="18">
                            <paperclip />
                        </el-icon>
                    </el-button>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
                <template #default="scope">
                    <el-tag :type="getAssignmentStatus(scope.row).type">
                        {{ getAssignmentStatus(scope.row).text }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
                <template #default="scope">
                    {{ formatDate(scope.row.created_at) }}
                </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
                <template #default="scope">
                    <el-button type="primary" @click="viewAssignment(scope.row)">查看</el-button>
                </template>
            </el-table-column>
        </el-table>
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
                
                <!-- 附件信息 -->
                <div class="assignment-attachment" v-if="currentAssignment.attachment_url">
                    <el-divider content-position="left">附件</el-divider>
                    <div class="attachment-box">
                        <el-icon color="#409EFF" size="16"><paperclip /></el-icon>
                        <span class="attachment-name">{{ currentAssignment.attachment_name }}</span>
                        <el-button type="primary" size="small" @click="viewAttachmentDialog">查看附件</el-button>
                    </div>
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
                        <div v-if="reply.attachment_url" class="reply-attachment">
                            <el-icon color="#409EFF" size="14"><paperclip /></el-icon>
                            <span class="attachment-name">{{ reply.attachment_name }}</span>
                            <el-button type="primary" link size="small" @click="viewReplyAttachment(reply)">查看</el-button>
                        </div>
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
                        <el-form-item label="附件">
                            <el-upload
                                class="upload-container"
                                drag
                                :auto-upload="true"
                                :http-request="customUploadRequest"
                                :on-remove="handleRemoveReplyFile"
                                :before-upload="beforeUpload"
                                :limit="1"
                                :file-list="replyFileList"
                            >
                                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                                <div class="el-upload__text">
                                    将文件拖到此处，或<em>点击上传</em>
                                </div>
                                <template #tip>
                                    <div class="el-upload__tip">
                                        支持 PDF、Word、Excel、图片等类型文件，大小不超过10MB
                                    </div>
                                </template>
                            </el-upload>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="submitReply" :loading="submitting">提交回复</el-button>
                        </el-form-item>
                    </el-form>
                </div>
            </div>
        </el-dialog>

        <!-- 附件预览对话框 -->
        <el-dialog v-model="attachmentDialogVisible" title="附件预览" width="80%" destroy-on-close>
            <div class="attachment-preview">
                <template v-if="isImageAttachment">
                    <img :src="selectedAttachmentUrl" class="attachment-image" />
                </template>
                <template v-else-if="isPdfAttachment">
                    <iframe :src="selectedAttachmentUrl" class="attachment-frame"></iframe>
                </template>
                <template v-else>
                    <div class="attachment-download">
                        <p>无法预览此类型的文件，请下载后查看</p>
                        <el-button type="primary" @click="downloadAttachment">下载附件</el-button>
                    </div>
                </template>
            </div>
        </el-dialog>

        <!-- 创建作业对话框 -->
        <el-dialog v-model="createDialogVisible" title="添加作业" width="600px">
            <el-form :model="newAssignment" label-width="80px">
                <el-form-item label="标题" required>
                    <el-input v-model="newAssignment.title" placeholder="请输入作业标题" />
                </el-form-item>
                <el-form-item label="内容" required>
                    <el-input 
                        v-model="newAssignment.content" 
                        type="textarea" 
                        :rows="6"
                        placeholder="请输入作业内容"
                    />
                </el-form-item>
                <el-form-item label="附件">
                    <el-upload
                        class="upload-container"
                        drag
                        :auto-upload="true"
                        :http-request="customCreateUploadRequest"
                        :on-remove="handleRemoveCreateFile"
                        :before-upload="beforeUpload"
                        :limit="1"
                        :file-list="createFileList"
                    >
                        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                        <div class="el-upload__text">
                            将文件拖到此处，或<em>点击上传</em>
                        </div>
                        <template #tip>
                            <div class="el-upload__tip">
                                支持 PDF、Word、Excel、图片等类型文件，大小不超过10MB
                            </div>
                        </template>
                    </el-upload>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="createDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleCreate">添加</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { Paperclip, UploadFilled } from '@element-plus/icons-vue'
import type { UploadFile, UploadRequestOptions } from 'element-plus'
import { assignmentService } from '@/stores/assignmentService'
import type { Assignment } from '@/stores/assignmentService'
import { useUserStore } from '@/stores/user'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'
import { supabase } from '@/lib/supabaseClient'

const userStore = useUserStore()
const loading = ref(false)
const assignments = ref<Assignment[]>([])
const dialogVisible = ref(false)
const currentAssignment = ref<Assignment | null>(null)
const replyContent = ref('')
const submitting = ref(false)
const attachmentDialogVisible = ref(false)
const selectedAttachmentUrl = ref('')
const selectedAttachmentType = ref('')
const replyFileList = ref<UploadFile[]>([])
const replyAttachmentInfo = ref<{
    url: string
    name: string
    type: string
} | null>(null)
const createDialogVisible = ref(false)
const newAssignment = ref({
    title: '',
    content: '',
    assigned_to: ''
})
const createFileList = ref<UploadFile[]>([])
const createAttachmentInfo = ref<{
    url: string
    name: string
    type: string
} | null>(null)

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

// 判断附件类型
const isImageAttachment = computed(() => {
    if (!selectedAttachmentType.value) return false
    return selectedAttachmentType.value.startsWith('image/')
})

const isPdfAttachment = computed(() => {
    if (!selectedAttachmentType.value) return false
    return selectedAttachmentType.value === 'application/pdf'
})

// 从表格点击查看附件
const viewAttachment = (assignment: Assignment) => {
    if (assignment.attachment_url) {
        selectedAttachmentUrl.value = assignment.attachment_url
        selectedAttachmentType.value = assignment.attachment_type || ''
        attachmentDialogVisible.value = true
    }
}

// 从详情对话框查看附件
const viewAttachmentDialog = () => {
    if (currentAssignment.value?.attachment_url) {
        selectedAttachmentUrl.value = currentAssignment.value.attachment_url
        selectedAttachmentType.value = currentAssignment.value.attachment_type || ''
        attachmentDialogVisible.value = true
    }
}

// 下载附件
const downloadAttachment = () => {
    if (selectedAttachmentUrl.value) {
        window.open(selectedAttachmentUrl.value, '_blank')
    }
}

// 附件上传前检查
const beforeUpload = (file: File) => {
    const isValidSize = file.size / 1024 / 1024 < 10
    if (!isValidSize) {
        ElMessage.error('文件大小不能超过10MB!')
        return false
    }
    return true
}

// 自定义上传方法
const customUploadRequest = async (options: UploadRequestOptions) => {
    const { file } = options
    const loading = ElLoading.service({
        lock: true,
        text: '上传中...',
        background: 'rgba(0, 0, 0, 0.7)'
    })

    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `reply_${Date.now()}.${fileExt}`
        const filePath = `assignments/replies/${fileName}`

        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(filePath, file)

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath)

        replyAttachmentInfo.value = {
            url: publicUrl,
            name: file.name,
            type: file.type
        }

        ElMessage.success('文件上传成功')
    } catch (error) {
        console.error('文件上传失败:', error)
        ElMessage.error('文件上传失败')
        replyFileList.value = []
    } finally {
        loading.close()
    }
}

// 移除回复附件
const handleRemoveReplyFile = () => {
    replyAttachmentInfo.value = null
}

// 查看回复附件
const viewReplyAttachment = (reply: any) => {
    if (reply.attachment_url) {
        selectedAttachmentUrl.value = reply.attachment_url
        selectedAttachmentType.value = reply.attachment_type || ''
        attachmentDialogVisible.value = true
    }
}

// 获取个人作业列表
const fetchAssignments = async () => {
    loading.value = true
    try {
        const { data, total } = await assignmentService.getPersonalAssignments(
            pagination.page,
            pagination.pageSize,
            {
                status: '' // 获取所有状态的作业
            }
        )

        assignments.value = data
        pagination.total = total
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
    replyFileList.value = []
    replyAttachmentInfo.value = null
}

// 提交回复
const submitReply = async () => {
    if (!currentAssignment.value) return
    if (!replyContent.value.trim()) {
        ElMessage.warning('回复内容不能为空')
        return
    }

    submitting.value = true
    try {
        if (!userStore.user?.user_id || !currentAssignment.value.id) {
            ElMessage.error('用户信息或作业ID缺失')
            return
        }
        
        const reply = await assignmentService.addReply({
            assignment_id: currentAssignment.value.id,
            user_id: userStore.user.user_id,
            content: replyContent.value,
            full_name: userStore.user.full_name || '',
            attachment_url: replyAttachmentInfo.value?.url || undefined,
            attachment_name: replyAttachmentInfo.value?.name || undefined,
            attachment_type: replyAttachmentInfo.value?.type || undefined
        })

        // 添加回复到当前作业
        if (!currentAssignment.value.replies) {
            currentAssignment.value.replies = []
        }
        currentAssignment.value.replies.push(reply)
        
        ElMessage.success('提交回复成功')
        replyContent.value = ''
        replyFileList.value = []
        replyAttachmentInfo.value = null
        
        // 更新列表
        fetchAssignments()
    } catch (error) {
        console.error('提交回复失败:', error)
        ElMessage.error('提交回复失败')
    } finally {
        submitting.value = false
    }
}

// 显示创建作业对话框
const showCreateDialog = () => {
    createDialogVisible.value = true
    newAssignment.value = {
        title: '',
        content: '',
        assigned_to: userStore.user?.user_id || ''
    }
    createFileList.value = []
    createAttachmentInfo.value = null
}

// 创建附件上传方法
const customCreateUploadRequest = async (options: UploadRequestOptions) => {
    const { file } = options
    const loading = ElLoading.service({
        lock: true,
        text: '上传中...',
        background: 'rgba(0, 0, 0, 0.7)'
    })

    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `assignment_${Date.now()}.${fileExt}`
        const filePath = `assignments/${fileName}`

        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(filePath, file)

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath)

        createAttachmentInfo.value = {
            url: publicUrl,
            name: file.name,
            type: file.type
        }

        ElMessage.success('文件上传成功')
    } catch (error) {
        console.error('文件上传失败:', error)
        ElMessage.error('文件上传失败')
        createFileList.value = []
    } finally {
        loading.close()
    }
}

// 移除创建附件
const handleRemoveCreateFile = () => {
    createAttachmentInfo.value = null
}

// 创建作业
const handleCreate = async () => {
    if (!newAssignment.value.title.trim()) {
        ElMessage.warning('请输入作业标题')
        return
    }
    if (!newAssignment.value.content.trim()) {
        ElMessage.warning('请输入作业内容')
        return
    }

    try {
        const assignmentData = {
            title: newAssignment.value.title,
            content: newAssignment.value.content,
            assigned_to: newAssignment.value.assigned_to,
            attachment_url: createAttachmentInfo.value?.url || undefined,
            attachment_name: createAttachmentInfo.value?.name || undefined,
            attachment_type: createAttachmentInfo.value?.type || undefined
        }

        await assignmentService.createAssignment(assignmentData)
        ElMessage.success('作业创建成功')
        createDialogVisible.value = false
        fetchAssignments()
    } catch (error) {
        console.error('创建作业失败:', error)
        ElMessage.error('创建作业失败')
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
/* .personal-assignments {
    padding: 10px 0;
} */

.assignments-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
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

.assignment-attachment {
    margin: 15px 0;
}

.attachment-box {
    display: flex;
    align-items: center;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.attachment-name {
    flex: 1;
    margin: 0 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.attachment-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.attachment-image {
    max-width: 100%;
    max-height: 70vh;
}

.attachment-frame {
    width: 100%;
    height: 70vh;
    border: none;
}

.attachment-download {
    text-align: center;
    padding: 30px;
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
    max-width: 400px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
    padding: 5px;
}

.upload-container {
    width: 100%;
}

.upload-container :deep(.el-upload-dragger) {
    width: 100%;
    height: 120px;
}

.reply-attachment {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
    padding: 6px 10px;
    background-color: rgba(64, 158, 255, 0.1);
    border-radius: 4px;
    font-size: 12px;
}

.reply-attachment .attachment-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #606266;
}
</style> 