<template>
    <div class="layout">
        <Breadcrumb :breadcrumb="breadcrumb" />
        <div class="layout-title">
            <h1 class="title">公司文档</h1>
            <div class="status-tabs">
                <el-tabs class="demo-tabs" v-model="activeCategory" @tab-change="handleCategoryChange">
                    <el-tab-pane :name="'all'" label="全部文档" />
                    <el-tab-pane :name="'attendance'" label="假勤" />
                    <el-tab-pane :name="'administrative'" label="行政" />
                    <el-tab-pane :name="'financial'" label="财务" />
                    <el-tab-pane :name="'hr'" label="人事" />
                    <el-tab-pane :name="'other'" label="其他" />
                </el-tabs>
            </div>
        </div>

        <!-- 搜索功能 -->
        <el-card shadow="always" style="margin-bottom: 20px;">
            <el-space wrap alignment="start" :size="30">
                <el-input v-model="searchQuery" style="width: 240px" placeholder="请输入文档标题" :suffix-icon="Search"
                    size="large" clearable />
                <el-date-picker v-model="dateRange" type="daterange" unlink-panels range-separator="至"
                    start-placeholder="开始日期" end-placeholder="结束日期" :shortcuts="shortcuts" size="large" />
                <el-select v-if="hasAdminPerm" v-model="showStatus" placeholder="选择展示状态" style="width: 160px" size="large" clearable>
                    <el-option label="显示" value="true" />
                    <el-option label="隐藏" value="false" />
                </el-select>
                <el-button type="primary" size="large" @click="searchDocuments">搜索</el-button>
                <el-button v-if="hasAdminPerm" type="success" size="large" @click="showCreateDialog">添加文档</el-button>
            </el-space>
        </el-card>

        <div class="documents-content">
            <el-card style="min-height: 400px;">
                <template #header>
                    <div class="card-header">
                        文档列表
                        <div class="header-actions" v-if="hasAdminPerm">
                            <el-button type="danger" :disabled="!selectedDocuments.length" @click="handleBatchDelete">
                                批量删除
                            </el-button>
                            <div style="font-size: 14px; color: #909399;">共计{{ pagination.total }}条数据</div>
                        </div>
                    </div>
                </template>

                <el-table v-loading="loading" :data="documents" @selection-change="handleSelectionChange">
                    <el-table-column type="selection" width="55" v-if="hasAdminPerm" />
                    <el-table-column prop="title" label="标题" min-width="200" />
                    <el-table-column prop="category" label="类型" width="130">
                        <template #default="{ row }">
                            <el-tag :type="getCategoryType(row.category)" size="large">
                                {{ getCategoryLabel(row.category) }}
                            </el-tag>
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
                    <el-table-column prop="created_by_name" label="创建人" width="120" v-if="hasAdminPerm" />
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
                    <el-table-column label="操作" width="230" fixed="right">
                        <template #default="{ row }">
                            <el-button-group>
                                <el-button type="primary" @click="showDetailDialog(row)">查看</el-button>
                                <el-button v-if="hasAdminPerm" type="warning" @click="showEditDialog(row)">编辑</el-button>
                                <el-button v-if="hasAdminPerm" type="danger" @click="handleDelete(row)">删除</el-button>
                            </el-button-group>
                        </template>
                    </el-table-column>
                    <el-empty>
                        <template #description>
                            暂无文档数据
                        </template>
                    </el-empty>
                </el-table>
            </el-card>
            <Pagination :pagination="pagination" @update:pagination="handlePaginationUpdate" />

            <!-- 查看详情对话框 -->
            <el-dialog title="文档详情" v-model="detailDialogVisible" width="60%" :close-on-click-modal="false"
                top="5vh" class="document-detail-dialog">
                <div class="dialog-content">
                    <div class="document-details">
                        <!-- 标题区 -->
                        <div class="document-header">
                            <h2 class="document-title">{{ selectedDocument?.title || '无标题' }}</h2>
                            <div class="document-meta">
                                <span class="meta-item">
                                    <el-icon><User /></el-icon>
                                    <span>{{ selectedDocument?.created_by_name || '未知用户' }}</span>
                                </span>
                                <span class="meta-item">
                                    <el-icon><Calendar /></el-icon>
                                    <span>{{ selectedDocument ? new Date(selectedDocument?.created_at).toLocaleString() : '未知时间' }}</span>
                                </span>
                                <span class="meta-item">
                                    <el-icon><Collection /></el-icon>
                                    <span>{{ getCategoryLabel(selectedDocument?.category || '') }}</span>
                                </span>
                            </div>
                        </div>

                        <!-- 内容区 -->
                        <div class="document-section">
                            <div class="section-title">内容</div>
                            <div class="document-content" style="padding: 10px" v-html="selectedDocument?.content || '无内容'"></div>
                        </div>

                        <!-- 附件区 (如果有) -->
                        <div v-if="selectedDocument?.attachment_url" class="document-section">
                            <div class="section-title">附件</div>
                            <div class="attachment-box">
                                <el-icon color="#409EFF" size="16"><paperclip /></el-icon>
                                <span class="attachment-name">{{ selectedDocument.attachment_name }}</span>
                                <el-button type="primary" size="small" @click="viewAttachmentDialog">查看附件</el-button>
                            </div>
                                </div>
                    </div>
                </div>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="detailDialogVisible = false">关闭</el-button>
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

            <!-- 创建文档对话框 -->
            <el-dialog :title="isEditing ? '编辑文档' : '创建文档'" v-model="createDialogVisible" width="50%" :close-on-click-modal="false">
                <el-form :model="newDocument" :rules="documentRules" ref="documentForm" label-width="80px" style="max-width: 800px">
                    <el-form-item label="标题" prop="title">
                        <el-input   v-model="newDocument.title" placeholder="请输入文档标题"></el-input>
                    </el-form-item>
                    <el-form-item label="类型" prop="category">
                        <el-select v-model="newDocument.category" placeholder="选择文档类型" style="width: 100%">
                            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="内容" prop="content">
                        <el-input type="textarea" v-model="newDocument.content" :rows="10"
                            placeholder="请输入文档内容"></el-input>
                    </el-form-item>
                    <el-form-item label="附件">
                        <el-upload
                            class="upload-box"
                            :auto-upload="false"
                            :on-change="handleFileChange"
                            :file-list="fileList"
                            :limit="1"
                            drag
                            action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
                            multiple>
                            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                            <div class="el-upload__text">
                                拖拽文件或<em>点击上传</em>
                            </div>
                            <template #tip>
                                <div class="el-upload__tip">
                                    支持 .pdf, .doc, .docx, .xls, .xlsx 格式文件，不超过10MB
                                </div>
                            </template>
                        </el-upload>
                    </el-form-item>
                    <el-form-item label="状态">
                        <el-switch v-model="newDocument.is_show" active-text="显示" inactive-text="隐藏" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="createDialogVisible = false">取消</el-button>
                        <el-button type="primary" @click="submitDocument" :loading="submitting">
                            {{ isEditing ? '更新' : '创建' }}
                        </el-button>
                    </span>
                </template>
            </el-dialog>
        </div>
    </div>


</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive, onBeforeUnmount } from 'vue'
import { Search, User, Calendar, Collection, Download, UploadFilled, Paperclip } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { documentService, hasAdminPermission } from '@/stores'
import type { Document } from '@/stores'
import { useUserStore } from '@/stores/user'
import Breadcrumb from '@/components/system/Breadcrumb.vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'
import { supabase } from '@/lib/supabaseClient'
import { ElForm } from 'element-plus'

const breadcrumb = reactive([
    {
        name: '公司文档',
        path: '/system/company-documents'
    }
])

const userStore = useUserStore()
const currentUserId = computed(() => userStore.user?.user_id || '')
const hasAdminPerm = computed(() => hasAdminPermission(Number(userStore.roleId)))

// 初始状态
const loading = ref(false)
const documents = ref<Document[]>([])
const detailDialogVisible = ref(false)
const createDialogVisible = ref(false)
const selectedDocument = ref<Document | null>(null)
const searchQuery = ref('')
const dateRange = ref<Date[]>([])
const showStatus = ref('')
const submitting = ref(false)
const activeCategory = ref('all')
const selectedDocuments = ref<Document[]>([])
const documentForm = ref()
const isEditing = ref(false)
const attachmentDialogVisible = ref(false)
const selectedAttachmentUrl = ref('')
const selectedAttachmentType = ref('')

const newDocument = reactive({
    id: '',
    title: '',
    content: '',
    category: '',
    is_show: true,
    attachment_url: '',
    attachment_name: ''
})

const documentRules = {
    title: [
        { required: true, message: '请输入文档标题', trigger: 'blur' },
        { min: 2, max: 100, message: '标题长度应在2到100个字符之间', trigger: 'blur' }
    ],
    category: [
        { required: true, message: '请选择文档类型', trigger: 'change' }
    ],
    content: [
        { required: true, message: '请输入文档内容', trigger: 'blur' },
        { min: 8, max: 10000, message: '内容长度应在8到10000个字符之间', trigger: 'blur' }
    ]
}

const categoryOptions = [
    { label: '假勤', value: 'attendance' },
    { label: '行政', value: 'administrative' },
    { label: '财务', value: 'financial' },
    { label: '人事', value: 'hr' },
    { label: '其他', value: 'other' }
]

const pagination = reactive<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
})

// 文件处理相关状态
const editor = ref<HTMLElement | null>(null)
let joditInstance: any = null
const fileList = ref<any[]>([])
const selectedFile = ref<File | null>(null)

// 判断附件类型
const isImageAttachment = computed(() => {
    if (!selectedAttachmentType.value) return false
    return selectedAttachmentType.value.startsWith('image/')
})

const isPdfAttachment = computed(() => {
    if (!selectedAttachmentType.value) return false
    return selectedAttachmentType.value === 'application/pdf'
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

// 类型标签样式
const getCategoryType = (category: string) => {
    switch (category) {
        case 'attendance': return 'primary'
        case 'administrative': return 'success'
        case 'financial': return 'warning'
        case 'hr': return 'danger'
        case 'other': return 'info'
        default: return 'info'
    }
}

// 类型标签文本
const getCategoryLabel = (category: string) => {
    switch (category) {
        case 'attendance': return '假勤'
        case 'administrative': return '行政'
        case 'financial': return '财务'
        case 'hr': return '人事'
        case 'other': return '其他'
        default: return category || '未知'
    }
}

// 更新分页
const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    searchDocuments()
}

// 搜索文档
const searchDocuments = async () => {
    loading.value = true
    const startDate = dateRange.value != null && dateRange.value[0] != null ? dateRange.value[0].toDateString() : ''
    const endDate = dateRange.value != null && dateRange.value[1] != null ? dateRange.value[1].toDateString() : ''
    
    try {
        const result = await documentService.getAllDocuments({
            query: searchQuery.value,
            startDate,
            endDate,
            page: pagination.page,
            pageSize: pagination.pageSize,
            category: activeCategory.value !== 'all' ? activeCategory.value : undefined,
            showStatus: hasAdminPerm.value && showStatus.value !== '' ? showStatus.value : undefined
        })
        
        documents.value = result.data
        pagination.total = result.total
    } catch (error) {
        ElMessage.error('搜索文档失败')
        console.error('搜索文档失败:', error)
    } finally {
        loading.value = false
    }
}

// 显示详情对话框
const showDetailDialog = async (document: Document) => {
    detailDialogVisible.value = true
    selectedDocument.value = document
}

// 从表格点击查看附件
const viewAttachment = (document: Document) => {
    if (document.attachment_url) {
        selectedAttachmentUrl.value = document.attachment_url
        selectedAttachmentType.value = getFileTypeFromName(document.attachment_name)
        attachmentDialogVisible.value = true
    }
}

// 从详情对话框查看附件
const viewAttachmentDialog = () => {
    if (selectedDocument.value?.attachment_url) {
        selectedAttachmentUrl.value = selectedDocument.value.attachment_url
        selectedAttachmentType.value = getFileTypeFromName(selectedDocument.value.attachment_name)
        attachmentDialogVisible.value = true
                }
}

// 根据文件名获取文件类型
const getFileTypeFromName = (filename: string | undefined): string => {
    if (!filename) return ''
    const ext = getFileExtension(filename)
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        return 'image/' + ext
    } else if (ext === 'pdf') {
        return 'application/pdf'
    }
    return ''
}

// 下载附件
const downloadAttachment = () => {
    if (selectedAttachmentUrl.value) {
        window.open(selectedAttachmentUrl.value, '_blank')
    }
}

// 显示编辑对话框
const showEditDialog = (document: Document) => {
    isEditing.value = true
    createDialogVisible.value = true
    Object.assign(newDocument, {
        id: document.id,
        title: document.title,
        content: document.content,
        category: document.category,
        is_show: document.is_show,
        attachment_url: document.attachment_url,
        attachment_name: document.attachment_name
    })
}

// 显示创建对话框
const showCreateDialog = () => {
    isEditing.value = false
    createDialogVisible.value = true
    Object.assign(newDocument, {
        id: '',
        title: '',
        content: '',
        category: '',
        is_show: true,
        attachment_url: '',
        attachment_name: ''
    })
}

// 处理表格选择变化
const handleSelectionChange = (selection: Document[]) => {
    selectedDocuments.value = selection
}

// 文件工具函数
const getFileExtension = (filename: string | undefined): string => {
    if (!filename) return ''
    const parts = filename.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}



// 文件选择处理函数
const handleFileChange = (file: any) => {
    // 验证文件类型和大小
    const validTypes = [
        'application/pdf',
        'application/msword',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',

    ]
    const isTypeValid = file.raw && validTypes.includes(file.raw.type)
    const isSizeValid = file.raw && (file.raw.size / 1024 / 1024 < 10) // 10MB 限制

    if (!isTypeValid) {
        ElMessage.error('文件类型不支持！')
        return false
    }
    if (!isSizeValid) {
        ElMessage.error('文件大小超过 10MB 限制！')
        return false
    }

    selectedFile.value = file.raw
    console.log('Selected file:', selectedFile.value)
}

// 上传到 storage 的函数
const uploadFileToStorage = async (file: File): Promise<string> => {
    if (!file) throw new Error('No file selected')
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `companydocuments/${fileName}`
    
    // 上传文件到 storage
    const { data, error } = await supabase
        .storage
        .from('materials')
        .upload(filePath, file)
    
    if (error) throw error
    
    // 获取公共 URL
    const { data: urlData } = supabase
        .storage
        .from('materials')
        .getPublicUrl(data.path)
    
    return urlData.publicUrl
}

// 提交文档（创建或更新）
const submitDocument = async () => {
    if (!documentForm.value) return
    
    await documentForm.value.validate(async (valid: boolean) => {
        if (!valid) return
        
        submitting.value = true
        try {
            // 如果有文件需要上传
            if (selectedFile.value) {
                try {
                    const fileUrl = await uploadFileToStorage(selectedFile.value)
                    // 设置文件信息
                    newDocument.attachment_url = fileUrl
                    newDocument.attachment_name = selectedFile.value.name
                } catch (uploadError: any) {
                    ElMessage.error(`文件上传失败: ${uploadError.message || '未知错误'}`)
                    submitting.value = false
                    return
                }
            }
            
            if (isEditing.value) {
                // 更新文档
                await documentService.updateDocument(newDocument.id, {
                    title: newDocument.title,
                    content: newDocument.content,
                    category: newDocument.category,
                    is_show: newDocument.is_show,
                    attachment_url: newDocument.attachment_url,
                    attachment_name: newDocument.attachment_name
                })
                ElMessage.success('文档已更新')
            } else {
                // 创建文档
                await documentService.createDocument({
                    title: newDocument.title,
                    content: newDocument.content,
                    category: newDocument.category,
                    is_show: newDocument.is_show,
                    attachment_url: newDocument.attachment_url,
                    attachment_name: newDocument.attachment_name
                })
                ElMessage.success('文档已创建')
            }
            
            createDialogVisible.value = false
            searchDocuments()
            // 重置文件列表
            fileList.value = []
            selectedFile.value = null
        } catch (error) {
            ElMessage.error(isEditing.value ? '更新文档失败' : '创建文档失败')
            console.error(isEditing.value ? '更新文档失败:' : '创建文档失败:', error)
        } finally {
            submitting.value = false
        }
    })
}

// 删除文档
const handleDelete = async (document: Document) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除 "${document.title}" 这份文档吗？`,
            '提示',
            { type: 'warning' }
        )
        
        await documentService.deleteDocument(document.id)
        ElMessage.success('删除成功')
        searchDocuments()
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败')
            console.error('删除失败:', error)
        }
    }
}

// 批量删除
const handleBatchDelete = async () => {
    if (selectedDocuments.value.length === 0) return
    
    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedDocuments.value.length} 份文档吗？此操作不可恢复。`,
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        
        // 创建批量删除的承诺数组
        const deletePromises = selectedDocuments.value.map((document: Document) =>
            documentService.deleteDocument(document.id)
        )
        
        // 等待所有删除操作完成
        await Promise.all(deletePromises)
        
        ElMessage.success(`成功删除 ${selectedDocuments.value.length} 份文档`)
        selectedDocuments.value = []
        searchDocuments()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量删除文档失败:', error)
            ElMessage.error('批量删除失败')
        }
    }
}

// 处理标签页变化
const handleCategoryChange = (category: string) => {
    activeCategory.value = category
    // 重置分页到第一页
    pagination.page = 1
    searchDocuments()
}

onMounted(() => {
    searchDocuments()
})

// 清理资源
onBeforeUnmount(() => {
    if (joditInstance) {
        joditInstance.destruct()
        joditInstance = null
    }
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

.document-details {
    line-height: 1.6;
    font-size: 16px;
}

.document-header {
    margin-bottom: 20px;
    border-bottom: 1px solid #eaeaea;
    padding-bottom: 15px;
}

.document-title {
    font-size: 1.5em;
    font-weight: bold;
    color: #409EFF;
    margin-bottom: 10px;
}

.document-meta {
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

.document-section {
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

.document-content {
    background-color: #f8f9fa;
    border-radius: 4px;
    min-height: 100px;
    white-space: pre-wrap;
    word-break: break-word;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
}

.document-detail-dialog :deep(.el-dialog__body) {
    padding: 20px 25px;
}

.document-detail-dialog :deep(.el-dialog__header) {
    padding: 15px 25px;
    margin-right: 0;
    background-color: #f5f7fa;
    border-bottom: 1px solid #eaeaea;
}

.document-detail-dialog :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}

.document-detail-dialog :deep(.el-dialog__footer) {
    padding: 15px 25px;
    border-top: 1px solid #eaeaea;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.attachment-box {
    display: flex;
    align-items: center;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
    border: 1px dashed #dcdfe6;
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

.attachment-link {
    margin-top: 10px;
}

.download-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #409EFF;
    text-decoration: none;
    font-weight: 500;
}

.download-link:hover {
    color: #66b1ff;
    text-decoration: underline;
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

/* 新增样式 */
.upload-box {
    width: 100%;
}

:deep(.el-upload) {
    --el-upload-dragger-padding-horizontal: 10px;
}

:deep(.el-upload-dragger) {
    width: 100%;
}

.el-upload__text {
    margin: 10px 0;
}
</style>