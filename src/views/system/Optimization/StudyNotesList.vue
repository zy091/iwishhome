<template>
    <div class="study-notes-list">
        <div class="study-body" style="min-height: 400px;">
            <div class="study-header">
                <div class="header-left">
                    <div class="header-title">学习心得列表</div>
                    <div class="header-stats">共计 {{ notes.length }} 篇心得</div>
                </div>
                <el-button type="primary" @click="refreshList">刷新</el-button>
            </div>
            <el-table v-loading="loading" :data="notes" v-if="notes.length > 0" >
                <el-table-column prop="title" label="标题" />
                <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.admin_reply ? 'success' : 'info'">
                            {{ row.admin_reply ? '已回复' : '未回复' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="附件" width="80">
                    <template #default="{ row }">
                        <el-button v-if="row.attachment_url" type="primary" link @click="viewAttachment(row)">
                            <el-icon color="#409EFF" size="18">
                                <paperclip />
                            </el-icon>
                        </el-button>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
                <el-table-column prop="created_at" label="创建时间" width="180">
                    <template #default="{ row }">
                        {{ new Date(row.created_at).toLocaleString() }}
                    </template>
                </el-table-column>
                <el-table-column prop="updated_at" label="修改时间" width="180">
                    <template #default="{ row }">
                        {{ row.updated_at ? new Date(row.updated_at).toLocaleString() : '-' }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="160">
                    <template #default="{ row }">
                        <el-button-group>
                            <el-button type="primary" @click="showViewDialog(row)">查看</el-button>
                            <el-button type="warning" @click="showEditDialog(row)"
                                :disabled="!!row.admin_reply">编辑</el-button>
                        </el-button-group>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 空状态显示 -->
            <div v-else-if="!loading" class="empty-state">
                <div class="empty-icon">
                    <el-icon size="60" color="#c0c4cc">
                        <Document />
                    </el-icon>
                </div>
                <div class="empty-text">暂无学习心得</div>
            </div>
        </div>

        <!-- 分页器 -->
        <Pagination :pagination="pagination" @update:pagination="handlePaginationUpdate" />

        <!-- 创建/编辑/查看对话框 -->
        <el-dialog :title="getDialogTitle()" v-model="dialogVisible" width="60%" :close-on-click-modal="false"
            top="10vh" class="note-detail-dialog">
            <!-- 编辑模式 -->
            <el-form :model="form" ref="formRef" :rules="rules" v-if="!isViewing">
                <el-form-item label="标题" prop="title">
                    <el-input v-model="form.title" />
                </el-form-item>
                <el-form-item label="内容" prop="content">
                    <el-input v-model="form.content" type="textarea" :rows="6" />
                </el-form-item>
                <el-form-item label="附件" v-if="!isEditing">
                    <el-upload class="upload-container" drag :auto-upload="true" :http-request="customUploadRequest"
                        :on-remove="handleRemoveFile" :before-upload="beforeUpload" :limit="1" :file-list="fileList">
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
                <!-- 编辑模式下显示现有附件 -->
                <el-form-item label="当前附件" v-if="isEditing && currentNote.attachment_url">
                    <div class="attachment-box">
                        <span class="attachment-name">{{ currentNote.attachment_name }}</span>
                        <el-button type="primary" size="small" @click="downloadAttachment">下载</el-button>
                    </div>
                    <div class="el-upload__tip" style="margin-top: 8px;">
                        注意：编辑模式下暂不支持修改附件
                    </div>
                </el-form-item>
            </el-form>

            <!-- 查看模式 -->
            <div v-else class="dialog-content">
                <div class="note-details">
                    <!-- 标题区 -->
                    <div class="note-header">
                        <h2 class="note-title">{{ currentNote.title || '无标题' }}</h2>
                        <div class="note-meta">
                            <span class="meta-item">
                                <i class="el-icon-time"></i>
                                <span>提交于: {{ new Date(currentNote.created_at).toLocaleString() }}</span>
                            </span>
                            <span class="meta-item"
                                v-if="currentNote.updated_at && currentNote.updated_at !== currentNote.created_at">
                                <i class="el-icon-edit"></i>
                                <span>修改于: {{ new Date(currentNote.updated_at).toLocaleString() }}</span>
                            </span>
                        </div>
                    </div>

                    <!-- 内容区 -->
                    <div class="note-section">
                        <div class="section-title">我的内容</div>
                        <div class="note-content">{{ currentNote.content || '无内容' }}</div>
                    </div>

                    <!-- 附件区 -->
                    <div v-if="currentNote.attachment_url" class="note-section">
                        <div class="section-title">附件</div>
                        <div class="attachment-box">
                            <span class="attachment-name">{{ currentNote.attachment_name }}</span>
                            <el-button type="primary" size="small" @click="viewAttachmentDialog">
                                {{ isImageAttachment ? '预览图片' : isPdfAttachment ? '预览PDF' : '查看附件' }}
                            </el-button>
                        </div>
                    </div>

                    <!-- 管理员回复区 -->
                    <div v-if="currentNote.admin_reply" class="note-section">
                        <div class="section-title">管理员回复</div>
                        <div class="previous-reply">
                            <div class="reply-header">
                                <span class="reply-author">{{ currentNote.admin_name || '未知' }}:</span>
                            </div>
                            <div class="admin-reply-content">{{ currentNote.admin_reply }}</div>
                            <div class="reply-timestamp" v-if="currentNote.replied_at">
                                回复于： {{ new Date(currentNote.replied_at).toLocaleString() }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">关闭</el-button>
                    <el-button v-if="!isViewing" type="primary" @click="handleSubmit">确定</el-button>
                </span>
            </template>
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
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElLoading, ElForm } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { UploadFile, UploadProps, UploadRequestOptions } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { studyNoteService } from '@/stores/studyNoteService'
import type { StudyNote } from '@/stores/studyNote'
import { supabase } from '@/lib/supabaseClient'
import { Paperclip, Document } from '@element-plus/icons-vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'

const router = useRouter()
const loading = ref(false)
const notes = ref<StudyNote[]>([])

// 分页相关
const pagination = reactive<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
})
const dialogVisible = ref(false)
const isEditing = ref(false)
const isViewing = ref(false)
const currentId = ref<string>('')
const formRef = ref()
const currentNote = ref<StudyNote>({} as StudyNote)
const fileList = ref<UploadFile[]>([])
const uploadLoading = ref(false)
const attachmentDialogVisible = ref(false)
const selectedAttachmentUrl = ref('')
const selectedAttachmentType = ref('')
const attachmentInfo = ref<{
    url: string;
    name: string;
    type: string;
} | null>(null)

const form = ref({
    title: '',
    content: ''
})

const rules = {
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
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

// 获取对话框标题
const getDialogTitle = () => {
    if (isViewing.value) return '查看心得'
    if (isEditing.value) return '编辑心得'
    return '新建心得'
}

// 获取所有笔记（用于前端分页）
const allNotes = ref<StudyNote[]>([])

// 获取笔记列表
const fetchNotes = async () => {
    loading.value = true
    try {
        // 获取所有笔记
        allNotes.value = await studyNoteService.getNotes()
        pagination.total = allNotes.value.length
        
        // 计算分页数据
        const startIndex = (pagination.page - 1) * pagination.pageSize
        const endIndex = startIndex + pagination.pageSize
        notes.value = allNotes.value.slice(startIndex, endIndex)
    } catch (error) {
        ElMessage.error('获取心得列表失败')
    } finally {
        loading.value = false
    }
}

// 显示查看对话框
const showViewDialog = (note: StudyNote) => {
    isViewing.value = true
    isEditing.value = false
    currentId.value = note.id
    currentNote.value = note
    dialogVisible.value = true
}

// 显示编辑对话框
const showEditDialog = (note: StudyNote) => {
    if (note.admin_reply) {
        ElMessage.warning('已回复的心得不能修改')
        return
    }

    isEditing.value = true
    isViewing.value = false
    currentId.value = note.id
    currentNote.value = note
    form.value = {
        title: note.title,
        content: note.content
    }
    fileList.value = []
    attachmentInfo.value = null
    dialogVisible.value = true
}

// 预览附件
const viewAttachment = (note: StudyNote) => {
    if (note.attachment_url) {
        selectedAttachmentUrl.value = note.attachment_url
        selectedAttachmentType.value = note.attachment_type || ''
        attachmentDialogVisible.value = true
    } else {
        ElMessage.warning('该心得没有附件')
    }
}

// 从详情对话框查看附件
const viewAttachmentDialog = () => {
    if (currentNote.value?.attachment_url) {
        selectedAttachmentUrl.value = currentNote.value.attachment_url
        selectedAttachmentType.value = currentNote.value.attachment_type || ''
        attachmentDialogVisible.value = true
    }
}

// 下载附件
const downloadAttachment = () => {
    if (selectedAttachmentUrl.value) {
        window.open(selectedAttachmentUrl.value, '_blank')
    } else if (currentNote.value.attachment_url) {
        window.open(currentNote.value.attachment_url, '_blank')
    }
}

// 上传前检查
const beforeUpload = (file: File) => {
    // 检查文件大小 (10MB)
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
        ElMessage.error('文件大小不能超过 10MB!')
        return false
    }
    return true
}

// 自定义上传请求处理
const customUploadRequest = async (options: UploadRequestOptions) => {
    const { file, onSuccess, onError } = options

    if (!file) {
        onError?.(new Error('文件不存在') as any)
        return
    }

    const loadingInstance = ElLoading.service({
        text: '正在上传文件...',
        background: 'rgba(0, 0, 0, 0.7)'
    })

    try {
        // 生成唯一文件名
        const fileObj = file as File
        const fileExt = fileObj.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        const filePath = `study_notes/${fileName}`

        // 上传到supabase存储
        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(filePath, fileObj, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) throw error

        // 获取公共URL
        const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(data.path)

        // 保存附件信息
        attachmentInfo.value = {
            url: publicUrl,
            name: fileObj.name,
            type: fileObj.type
        }

        // 上传成功回调
        onSuccess?.(attachmentInfo.value as any)
        ElMessage.success('文件上传成功')
    } catch (err) {
        console.error('文件上传错误:', err)
        onError?.(new Error(err instanceof Error ? err.message : '上传失败') as any)
        ElMessage.error('文件上传失败，请重试')
    } finally {
        loadingInstance.close()
    }
}

// 移除文件处理
const handleRemoveFile = () => {
    attachmentInfo.value = null
}

// 提交表单
const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid: boolean) => {
        if (valid) {
            try {
                if (isEditing.value) {
                    await studyNoteService.updateNote(currentId.value, {
                        title: form.value.title,
                        content: form.value.content
                    })
                    ElMessage.success('修改成功')
                } else {
                    // 创建笔记，包含附件信息
                    await studyNoteService.createNote({
                        ...form.value,
                        attachment_url: attachmentInfo.value?.url,
                        attachment_name: attachmentInfo.value?.name,
                        attachment_type: attachmentInfo.value?.type
                    })
                    ElMessage.success('创建成功')
                }
                dialogVisible.value = false
                fetchNotes()
            } catch (error) {
                ElMessage.error(isEditing.value ? '修改失败' : '创建失败')
            }
        }
    })
}

const refreshList = () => {
    fetchNotes()
}

// 处理分页更新
const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    fetchNotes()
}

onMounted(() => {
    fetchNotes()
})
</script>

<style scoped>
.study-body {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin: 20px 0;
}

.study-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e4e7ed;
}

.header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.header-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.header-stats {
    font-size: 12px;
    color: #909399;
}



.upload-container {
    width: 100%;
}

.el-upload__tip {
    color: #909399;
    font-size: 12px;
    margin-top: 8px;
}

:deep(.el-upload-dragger) {
    width: 100%;
}

:deep(.el-icon--upload) {
    margin: 10px 0;
    font-size: 28px;
    color: #c0c4cc;
}

:deep(.el-upload__text) {
    color: #606266;
    font-size: 14px;
    margin: 8px 0;
}

:deep(.el-upload__text em) {
    color: #409EFF;
    font-style: normal;
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

/* 空状态样式 */
.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #909399;
}

.empty-icon {
    margin-bottom: 20px;
}

.empty-text {
    font-size: 16px;
    margin-bottom: 20px;
    color: #606266;
}

.empty-action {
    margin-top: 20px;
}

/* 表格样式 */
:deep(.el-table) {
    border-radius: 4px;
    overflow: hidden;
}

:deep(.el-table__header) {
    background-color: #f5f7fa;
}

:deep(.el-table th) {
    background-color: #f5f7fa;
    color: #606266;
    font-weight: 600;
}

/* 对话框样式 - 参考AdminStudyNotes */
.dialog-content {
    padding: 20px;
}

.note-details {
    line-height: 1.6;
    font-size: 16px;
}

.note-header {
    margin-bottom: 20px;
    border-bottom: 1px solid #eaeaea;
    padding-bottom: 15px;
}

.note-title {
    font-size: 1.5em;
    font-weight: bold;
    color: #409EFF;
    margin-bottom: 10px;
}

.note-meta {
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

.note-section {
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

.note-content {
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 4px;
    min-height: 100px;
    white-space: pre-wrap;
    word-break: break-word;
}

.attachment-box {
    display: flex;
    align-items: center;
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    border: 1px dashed #dcdfe6;
}

.attachment-name {
    flex: 1;
    margin-right: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.previous-reply {
    padding: 15px;
    background-color: #ecf8ff;
    border-radius: 4px;
    border-left: 4px solid #409EFF;
}

.reply-header {
    margin-bottom: 8px;
}

.reply-author {
    color: #303133;
    font-size: 14px;
    font-weight: 500;
}

.admin-reply-content {
    margin-bottom: 8px;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 16px;
    line-height: 1.5;
}

.reply-timestamp {
    text-align: right;
    color: #909399;
    font-size: 12px;
    margin-bottom: 0;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
}

.note-detail-dialog :deep(.el-dialog__body) {
    padding: 20px 25px;
}

.note-detail-dialog :deep(.el-dialog__header) {
    padding: 15px 25px;
    margin-right: 0;
    background-color: #f5f7fa;
    border-bottom: 1px solid #eaeaea;
}

.note-detail-dialog :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}

.note-detail-dialog :deep(.el-dialog__footer) {
    padding: 15px 25px;
    border-top: 1px solid #eaeaea;
}
</style>