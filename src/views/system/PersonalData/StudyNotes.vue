<template>
    <div class="study-notes">
        <div class="study-body">
            <div class="study-header">
                <div>共计{{ notes.length }}篇笔记</div>
                <el-button type="primary" @click="showCreateDialog">新建笔记</el-button>
            </div>
            <el-table v-loading="loading" :data="notes"  height="300px">
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
                        <el-button 
                            v-if="row.attachment_url" 
                            type="primary" 
                            link 
                            @click="viewAttachment(row)"
                        >
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
                        <el-button type="primary"  @click="showViewDialog(row)">查看</el-button>
                        <el-button type="warning"  @click="showEditDialog(row)" :disabled="!!row.admin_reply">编辑</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
        <!-- 创建/编辑/查看对话框 -->
        <el-dialog :title="getDialogTitle()" v-model="dialogVisible" width="40%" style="min-width: 400px;">
            <!-- 编辑模式 -->
            <el-form :model="form" ref="formRef" :rules="rules" v-if="!isViewing">
                <el-form-item label="标题" prop="title">
                    <el-input v-model="form.title" />
                </el-form-item>
                <el-form-item label="内容" prop="content">
                    <el-input v-model="form.content" type="textarea" :rows="6" />
                </el-form-item>
                <el-form-item label="附件" v-if="!isEditing">
                    <el-upload
                        class="upload-container"
                        drag
                        :auto-upload="true"
                        :http-request="customUploadRequest"
                        :on-remove="handleRemoveFile"
                        :before-upload="beforeUpload"
                        :limit="1"
                        :file-list="fileList"
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
            <div v-else class="note-view">
                <h3 class="note-title">{{ currentNote.title }}</h3>
                <div class="note-meta">
                    <p>提交于: {{ new Date(currentNote.created_at).toLocaleString() }}</p>
                    <p v-if="currentNote.updated_at && currentNote.updated_at !== currentNote.created_at">
                        修改于: {{ new Date(currentNote.updated_at).toLocaleString() }}
                    </p>
                </div>
                
                <div class="note-content-section">
                    <div class="section-title">我的内容:</div>
                    <div class="note-content">{{ currentNote.content }}</div>
                </div>
                
                <!-- 附件信息 -->
                <div class="note-attachment-section" v-if="currentNote.attachment_url">
                    <div class="section-title">附件:</div>
                    <div class="attachment-box">
                        <el-icon color="#409EFF" size="16"><paperclip /></el-icon>
                        <span class="attachment-name">{{ currentNote.attachment_name }}</span>
                        <el-button type="primary" size="small" @click="viewAttachmentDialog">查看附件</el-button>
                    </div>
                </div>
                
                <!-- 管理员回复 -->
                <div class="note-reply-section" v-if="currentNote.admin_reply">
                    <div class="section-title">管理员回复:</div>
                    <div class="admin-reply">
                        <p class="reply-content">{{ currentNote.admin_reply }}</p>
                        <p class="reply-time" v-if="currentNote.replied_at">
                            回复于: {{ new Date(currentNote.replied_at).toLocaleString() }}
                        </p>
                    </div>
                </div>
            </div>
            
            <template #footer>
                <el-button @click="dialogVisible = false">关闭</el-button>
                <el-button v-if="!isViewing" type="primary" @click="handleSubmit">确定</el-button>
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
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, ElLoading, ElForm } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { UploadFile, UploadProps, UploadRequestOptions } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { studyNoteService } from '@/stores/studyNoteService'
import type { StudyNote } from '@/stores/studyNote'
import { supabase } from '@/lib/supabaseClient'
import { Paperclip } from '@element-plus/icons-vue'

const loading = ref(false)
const notes = ref<StudyNote[]>([])
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
    if (isViewing.value) return '查看笔记'
    if (isEditing.value) return '编辑笔记'
    return '新建笔记'
}

// 获取笔记列表
const fetchNotes = async () => {
    loading.value = true
    try {
        notes.value = await studyNoteService.getNotes()
    } catch (error) {
        ElMessage.error('获取笔记列表失败')
    } finally {
        loading.value = false
    }
}

// 显示创建对话框
const showCreateDialog = () => {
    isEditing.value = false
    isViewing.value = false
    form.value = { title: '', content: '' }
    fileList.value = []
    attachmentInfo.value = null
    dialogVisible.value = true
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
        ElMessage.warning('已回复的笔记不能修改')
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
        ElMessage.warning('该笔记没有附件')
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

// 上传成功处理 - 保留这个函数用于兼容性，但实际在customUploadRequest中处理
const handleUploadSuccess = (response: any, file: UploadFile) => {
    uploadLoading.value = false
    ElMessage.success('文件上传成功')
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

// 删除笔记
const handleDelete = async (note: StudyNote) => {
    try {
        await ElMessageBox.confirm('确定要删除这条笔记吗？', '提示', {
            type: 'warning'
        })

        await studyNoteService.deleteNote(note.id)
        ElMessage.success('删除成功')
        fetchNotes()
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败')
        }
    }
}

onMounted(() => {
    fetchNotes()
})
</script>

<style scoped>
/* .study-notes {
    padding:10px 20px;
} */

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header h2 {
    margin: 0;
}

.study-header{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.note-view {
    padding: 10px 0;
}

.note-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
}

.note-meta {
    color: #909399;
    font-size: 14px;
    margin-bottom: 20px;
}

.note-meta p {
    margin: 5px 0;
}

.section-title {
    font-weight: bold;
    margin-bottom: 8px;
    font-size: 16px;
}

.note-content-section, .note-reply-section, .note-attachment-section {
    margin-bottom: 20px;
}

.note-content {
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 4px;
    min-height: 80px;
    white-space: pre-wrap;
    word-break: break-word;
}

.admin-reply {
    padding: 15px;
    background-color: #ecf8ff;
    border-radius: 4px;
    border-left: 4px solid #409EFF;
}

.reply-content {
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

.attachment-box {
    display: flex;
    align-items: center;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.attachment-name {
    flex: 1;
    margin-right: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
</style>