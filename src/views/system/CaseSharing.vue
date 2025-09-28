<template>
    <div class="layout">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="layout-title">
            <h1 class="title">知识分享</h1>
            <div class="status-tabs">
                <el-tabs class="demo-tabs" v-model="activeViewType" @tab-change="handleViewTypeChange">
                    <el-tab-pane :name="'all'" label="全部分享" />
                    <el-tab-pane :name="'my'" label="我的分享" />
                </el-tabs>
            </div>
        </div>

        <!-- 搜索功能 -->
        <el-card shadow="always" style="margin-bottom: 20px;">
            <el-space wrap alignment="start" :size="30">
                <el-input v-model="searchQuery" style="width: 400px" placeholder="搜索标题、分享人、部门（支持模糊搜索）" :suffix-icon="Search"
                    size="large" clearable />
                <el-select v-model="categoryFilter" placeholder="分享类型" clearable style="width: 180px" size="large">
                    <el-option v-for="category in categoryOptions" :key="category.value" :label="category.label" :value="category.value" />
                </el-select>
                <el-date-picker v-model="dateRange" type="daterange" unlink-panels range-separator="至"
                    start-placeholder="开始日期" end-placeholder="结束日期" :shortcuts="shortcuts" size="large" />
                <el-select v-if="hasAdminPerm" v-model="showStatus" placeholder="选择展示状态" style="width: 160px" size="large" clearable>
                    <el-option label="显示" value="true" />
                    <el-option label="隐藏" value="false" />
                </el-select>
                <el-button type="primary" size="large" @click="searchCases">搜索</el-button>
                <el-button type="success" size="large" @click="showCreateDialog">添加分享</el-button>
            </el-space>
        </el-card>

        <div class="cases-content">
            <el-card style="min-height: 400px;">
                <template #header>
                    <div class="card-header">
                        分享列表
                        <div class="header-actions" v-if="hasAdminPerm">
                            <el-button type="danger" :disabled="!selectedCases.length" @click="handleBatchDelete">
                                批量删除
                            </el-button>
                            <div style="font-size: 14px; color: #909399;">共计{{ pagination.total }}条数据</div>
                        </div>
                    </div>
                </template>

                <el-table 
                    v-loading="loading" 
                    :data="cases" 
                    @selection-change="handleSelectionChange"
                    :scrollbar-always-on="true"
                    style="width: 100%"
                >
                    <el-table-column type="selection" width="55" v-if="hasAdminPerm" fixed="left" />
                    <el-table-column label="分享月份" width="120" >
                        <template #default="{ row }">
                            <div class="month-info">
                                <div v-if="row.custom_month" class="month-item">
                                    <el-icon color="#E6A23C" size="14"><Calendar /></el-icon>
                                    <span class="month-text ">{{ row.custom_month }}</span>
                                </div>
                                <div v-else class="month-empty">
                                    <span class="empty-text">-</span>
                                </div>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="title" label="标题" min-width="200" />
                    <el-table-column label="分享人/部门" min-width="150">
                        <template #default="{ row }">
                            <div class="sharer-dept-info">
                                <div v-if="row.custom_sharer" class="sharer-item">
                                    <el-icon color="#67C23A" size="14"><User /></el-icon>
                                    <span class="sharer-text">{{ row.custom_sharer }}</span>
                                </div>
                                <div v-if="row.custom_department" class="dept-item">
                                    <el-icon color="#F56C6C" size="14"><OfficeBuilding /></el-icon>
                                    <span class="dept-text">{{ row.custom_department }}</span>
                                </div>
                                <div v-if="!row.custom_sharer && !row.custom_department" class="sharer-dept-empty">
                                    <span class="empty-text">-</span>
                                </div>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="category" label="类型" width="100">
                        <template #default="{ row }">
                            <el-tag :type="getCategoryType(row.category)" size="large">
                                {{ getCategoryLabel(row.category) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="附件/链接" width="100">
                        <template #default="{ row }">
                            <el-button 
                                v-if="row.attachment_url" 
                                type="primary" 
                                link 
                                @click="viewAttachment(row)"
                            >
                                <el-icon color="#409EFF" size="18">
                                    <Paperclip />
                                </el-icon>
                            </el-button>
                            <el-button 
                                v-else-if="row.link_url" 
                                type="primary" 
                                link 
                                @click="openLink(row.link_url)"
                            >
                                <el-icon color="#67C23A" size="18">
                                    <Link />
                                </el-icon>
                            </el-button>
                            <span v-else>-</span>
                        </template>
                    </el-table-column>
                    <el-table-column v-if="hasAdminPerm" prop="is_show" label="展示状态" width="80">
                        <template #default="{ row }">
                            <el-tag :type="row.is_show ? 'success' : 'danger'" size="large">
                                {{ row.is_show ? '显示' : '隐藏' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="created_at" label="创建时间" width="150">
                        <template #default="{ row }">
                            {{ new Date(row.created_at).toLocaleString() }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="created_by_name" label="创建人" width="80" v-if="hasAdminPerm" />
                    <el-table-column label="操作" width="230" fixed="right">
                        <template #default="{ row }">
                            <el-button-group>
                                <el-button type="primary" @click="showDetailDialog(row)">查看</el-button>
                                <el-button v-if="canEdit(row)" type="warning" @click="showEditDialog(row)">编辑</el-button>
                                <el-button v-if="canDelete(row)" type="danger" @click="handleDelete(row)">删除</el-button>
                            </el-button-group>
                        </template>
                    </el-table-column>
                    <el-empty>
                        <template #description>
                            暂无分享数据
                        </template>
                    </el-empty>
                </el-table>
            </el-card>
            <Pagination :pagination="pagination" @update:pagination="handlePaginationUpdate" />

            <!-- 查看详情对话框 -->
            <el-dialog title="分享详情" v-model="detailDialogVisible" width="60%" :close-on-click-modal="false"
                top="5vh" class="case-detail-dialog">
                <div class="dialog-content">
                    <div class="case-details">
                        <!-- 标题区 -->
                        <div class="case-header">
                            <h2 class="case-title">{{ selectedCase?.title || '无标题' }}</h2>
                            <div class="case-meta">
                                <span class="meta-item">
                                    <el-icon><User /></el-icon>
                                    <span>{{ selectedCase?.created_by_name || '未知用户' }}</span>
                                </span>
                                <span class="meta-item">
                                    <el-icon><Calendar /></el-icon>
                                    <span>{{ selectedCase ? new Date(selectedCase?.created_at).toLocaleString() : '未知时间' }}</span>
                                </span>
                                <span class="meta-item">
                                    <el-icon><Collection /></el-icon>
                                    <span>{{ getCategoryLabel(selectedCase?.category || '') }}</span>
                                </span>
                            </div>
                        </div>

                        <!-- 内容区 -->
                        <div class="case-section">
                            <div class="section-title">内容</div>
                            <div class="case-content" style="padding: 10px" v-html="selectedCase?.content || '无内容'"></div>
                        </div>

                        <!-- 附件区 (如果有) -->
                        <div v-if="selectedCase?.attachment_url" class="case-section">
                            <div class="section-title">附件</div>
                            <div class="attachment-box">
                                <el-icon color="#409EFF" size="16"><Paperclip /></el-icon>
                                <span class="attachment-name">{{ selectedCase.attachment_name }}</span>
                                <el-button type="primary" size="small" @click="viewAttachmentDialog">查看附件</el-button>
                            </div>
                        </div>

                        <!-- 链接区 (如果有) -->
                        <div v-if="selectedCase?.link_url" class="case-section">
                            <div class="section-title">相关链接</div>
                            <div class="link-box">
                                <el-icon color="#67C23A" size="16"><link /></el-icon>
                                <span class="link-url">{{ selectedCase.link_url }}</span>
                                <el-button type="success" size="small" @click="openLink(selectedCase.link_url)">打开链接</el-button>
                            </div>
                        </div>

                        <!-- 自定义信息区 -->
                        <div v-if="selectedCase?.custom_month || selectedCase?.custom_sharer || selectedCase?.custom_department" class="case-section">
                            <div class="section-title">分享信息</div>
                            <div class="custom-info">
                                <div v-if="selectedCase?.custom_month" class="custom-item">
                                    <el-icon color="#E6A23C" size="16"><Calendar /></el-icon>
                                    <span class="custom-label">月份：</span>
                                    <span class="custom-value">{{ selectedCase.custom_month }}</span>
                                </div>
                                <div v-if="selectedCase?.custom_sharer" class="custom-item">
                                    <el-icon color="#67C23A" size="16"><User /></el-icon>
                                    <span class="custom-label">分享人：</span>
                                    <span class="custom-value">{{ selectedCase.custom_sharer }}</span>
                                </div>
                                <div v-if="selectedCase?.custom_department" class="custom-item">
                                    <el-icon color="#F56C6C" size="16"><OfficeBuilding /></el-icon>
                                    <span class="custom-label">部门：</span>
                                    <span class="custom-value">{{ selectedCase.custom_department }}</span>
                                </div>
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
                        <img :src="selectedAttachmentUrl" class="attachment-image" @click="openFullscreen" />
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
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="attachmentDialogVisible = false">关闭</el-button>
                        <el-button v-if="isImageAttachment || isPdfAttachment" type="primary" @click="openFullscreen">
                            全屏查看
                        </el-button>
                    </span>
                </template>
            </el-dialog>

            <!-- 全屏预览对话框 -->
            <el-dialog v-model="fullscreenVisible" title="全屏预览" width="100%" top="0" :show-close="true" destroy-on-close class="fullscreen-dialog">
                <div class="fullscreen-preview">
                    <template v-if="isImageAttachment">
                        <img :src="selectedAttachmentUrl" class="fullscreen-image" />
                    </template>
                    <template v-else-if="isPdfAttachment">
                        <iframe :src="selectedAttachmentUrl" class="fullscreen-frame"></iframe>
                    </template>
                </div>
            </el-dialog>

            <!-- 创建分享对话框 -->
            <el-dialog :title="isEditing ? '编辑分享' : '知识分享'" v-model="createDialogVisible" width="50%" :close-on-click-modal="false">
                <el-form :model="newCase" :rules="caseRules" ref="caseForm" label-width="80px" style="max-width: 800px">
                    <el-form-item label="标题" prop="title">
                        <el-input v-model="newCase.title" placeholder="请输入分享标题"></el-input>
                    </el-form-item>
                    <el-form-item label="类型" prop="category">
                        <el-select v-model="newCase.category" placeholder="选择分享类型" style="width: 100%">
                            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="内容" prop="content">
                        <el-input type="textarea" v-model="newCase.content" :rows="10"
                            placeholder="请输入分享内容"></el-input>
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
                                    支持 .pdf, .doc, .docx, .xls, .xlsx, 图片等格式文件，不超过10MB
                                </div>
                            </template>
                        </el-upload>
                    </el-form-item>
                    <el-form-item label="链接">
                        <el-input v-model="newCase.link_url" placeholder="请输入相关链接（可选）"></el-input>
                    </el-form-item>
                    <el-form-item label="分享月份">
                        <el-date-picker
                            v-model="newCase.custom_month"
                            type="month"
                            placeholder="选择月份（可选）"
                            format="YYYY年MM月"
                            value-format="YYYY年MM月"
                            style="width: 100%"
                        />
                    </el-form-item>
                    <el-form-item label="分享人">
                        <el-input v-model="newCase.custom_sharer" placeholder="请输入自定义分享人（可选）"></el-input>
                    </el-form-item>
                    <el-form-item label="分享部门">
                        <el-input v-model="newCase.custom_department" placeholder="请输入分享部门（可选）"></el-input>
                    </el-form-item>
                    <el-form-item label="状态" v-if="hasAdminPerm">
                        <el-switch v-model="newCase.is_show" active-text="显示" inactive-text="隐藏" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="createDialogVisible = false">取消</el-button>
                        <el-button type="primary" @click="submitCase" :loading="submitting">
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
import { Search, User, Calendar, Collection, Download, UploadFilled, Paperclip, Link, OfficeBuilding } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { caseSharingService, hasAdminPermission } from '@/stores/caseSharingService'
import type { CaseSharing } from '@/stores/caseSharingService'
import { useUserStore } from '@/stores/user'
import Breadbcrum from '@/components/system/Breadcrumb.vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'
import { supabase } from '@/lib/supabaseClient'
import { ElForm } from 'element-plus'

const breadbcrum = reactive([
    {
        name: '分享分享',
        path: '/system/case-sharing'
    }
])

const userStore = useUserStore()
const currentUserId = computed(() => userStore.user?.user_id || '')
const hasAdminPerm = computed(() => hasAdminPermission(Number(userStore.roleId)))

// 初始状态
const loading = ref(false)
const cases = ref<CaseSharing[]>([])
const detailDialogVisible = ref(false)
const createDialogVisible = ref(false)
const selectedCase = ref<CaseSharing | null>(null)
const searchQuery = ref('')
const dateRange = ref<Date[]>([])
const showStatus = ref('')
const submitting = ref(false)
const activeViewType = ref('all')
const selectedCases = ref<CaseSharing[]>([])
const caseForm = ref()
const isEditing = ref(false)
const categoryFilter = ref('')
const attachmentDialogVisible = ref(false)
const selectedAttachmentUrl = ref('')
const selectedAttachmentType = ref('')
const fullscreenVisible = ref(false)  // 全屏预览对话框

const newCase = reactive({
    id: '',
    title: '',
    content: '',
    category: '',
    is_show: true,
    attachment_url: '',
    attachment_name: '',
    attachment_type: '',
    link_url: '',
    custom_month: '',
    custom_sharer: '',
    custom_department: ''
})

const caseRules = {
    title: [
        { required: true, message: '请输入分享标题', trigger: 'blur' },
        { min: 2, max: 100, message: '标题长度应在2到100个字符之间', trigger: 'blur' }
    ],
    category: [
        { required: true, message: '请选择分享类型', trigger: 'change' }
    ],
    content: [
        { required: false, message: '请输入分享内容', trigger: 'blur' },
        { min: 2, max: 10000, message: '内容长度应在8到10000个字符之间', trigger: 'blur' }
    ]
}

const categoryOptions = [
    { label: '广告', value: 'advertising' },
    { label: '素材', value: 'material' },
    { label: '日常运营', value: 'daily_operation' },
    { label: '客户案例', value: 'customer_case' },
    { label: '技术分享', value: 'technical' },
    { label: '其他', value: 'other' }
]

const pagination = reactive<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
})

// 文件处理相关状态
const fileList = ref<any[]>([])
const selectedFile = ref<File | null>(null)

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

// 判断附件类型
const isImageAttachment = computed(() => {
    if (!selectedAttachmentType.value) return false
    return selectedAttachmentType.value.startsWith('image/')
})

const isPdfAttachment = computed(() => {
    if (!selectedAttachmentType.value) return false
    return selectedAttachmentType.value === 'application/pdf'
})

// 类型标签样式
const getCategoryType = (category: string) => {
    switch (category) {
        case 'advertising': return 'primary'
        case 'material': return 'success'
        case 'daily_operation': return 'warning'
        case 'customer_case': return 'danger'
        case 'technical': return 'info'
        case 'other': return ''
        default: return 'info'
    }
}

// 类型标签文本
const getCategoryLabel = (category: string) => {
    switch (category) {
        case 'advertising': return '广告'
        case 'material': return '素材'
        case 'daily_operation': return '日常运营'
        case 'customer_case': return '客户分享'
        case 'technical': return '技术分享'
        case 'other': return '其他'
        default: return category || '未知'
    }
}

// 权限检查
const canEdit = (caseItem: CaseSharing) => {
    if (hasAdminPerm.value) return true
    return caseItem.created_by === currentUserId.value
}

const canDelete = (caseItem: CaseSharing) => {
    if (hasAdminPerm.value) return true
    return caseItem.created_by === currentUserId.value
}

// 更新分页
const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    searchCases()
}

// 搜索分享
const searchCases = async () => {
    loading.value = true
    const startDate = dateRange.value != null && dateRange.value[0] != null ? dateRange.value[0].toDateString() : ''
    const endDate = dateRange.value != null && dateRange.value[1] != null ? dateRange.value[1].toDateString() : ''
    
    try {
        const result = await caseSharingService.getAllCases({
            query: searchQuery.value,
            startDate,
            endDate,
            page: pagination.page,
            pageSize: pagination.pageSize,
            category: categoryFilter.value !== '' ? categoryFilter.value : undefined,
            showStatus: hasAdminPerm.value && showStatus.value !== '' ? showStatus.value : undefined,
            viewType: activeViewType.value as 'all' | 'my'
        })
        
        cases.value = result.data
        pagination.total = result.total
    } catch (error) {
        ElMessage.error('搜索分享失败')
        console.error('搜索分享失败:', error)
    } finally {
        loading.value = false
    }
}

// 显示详情对话框
const showDetailDialog = async (caseItem: CaseSharing) => {
    detailDialogVisible.value = true
    selectedCase.value = caseItem
}

// 从表格点击查看附件
const viewAttachment = (caseItem: CaseSharing) => {
    if (caseItem.attachment_url) {
        selectedAttachmentUrl.value = caseItem.attachment_url
        selectedAttachmentType.value = getFileTypeFromName(caseItem.attachment_name)
        attachmentDialogVisible.value = true
    }
}

// 从详情对话框查看附件
const viewAttachmentDialog = () => {
    if (selectedCase.value?.attachment_url) {
        selectedAttachmentUrl.value = selectedCase.value.attachment_url
        selectedAttachmentType.value = getFileTypeFromName(selectedCase.value.attachment_name)
        attachmentDialogVisible.value = true
    }
}

// 下载附件
const downloadAttachment = () => {
    if (selectedAttachmentUrl.value) {
        window.open(selectedAttachmentUrl.value, '_blank')
    }
}

// 打开全屏预览
const openFullscreen = () => {
    fullscreenVisible.value = true
}

// 打开链接
const openLink = (url: string) => {
    if (url) {
        window.open(url, '_blank')
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

// 获取文件扩展名
const getFileExtension = (filename: string | undefined): string => {
    if (!filename) return ''
    const parts = filename.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

// 显示创建对话框
const showCreateDialog = () => {
    isEditing.value = false
    createDialogVisible.value = true
    Object.assign(newCase, {
        id: '',
        title: '',
        content: '',
        category: '',
        is_show: true,
        attachment_url: '',
        attachment_name: '',
        attachment_type: '',
        link_url: '',
        custom_month: '',
        custom_sharer: '',
        custom_department: ''
    })
    fileList.value = []
    selectedFile.value = null
}

// 显示编辑对话框
const showEditDialog = (caseItem: CaseSharing) => {
    isEditing.value = true
    createDialogVisible.value = true
    Object.assign(newCase, {
        id: caseItem.id,
        title: caseItem.title,
        content: caseItem.content,
        category: caseItem.category,
        is_show: caseItem.is_show,
        attachment_url: caseItem.attachment_url,
        attachment_name: caseItem.attachment_name,
        attachment_type: caseItem.attachment_type,
        link_url: caseItem.link_url,
        custom_month: caseItem.custom_month,
        custom_sharer: caseItem.custom_sharer,
        custom_department: caseItem.custom_department
    })
    fileList.value = []
    selectedFile.value = null
}

// 处理表格选择变化
const handleSelectionChange = (selection: CaseSharing[]) => {
    selectedCases.value = selection
}

// 处理文件选择
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

// 上传文件到 storage
const uploadFileToStorage = async (file: File): Promise<string> => {
    if (!file) throw new Error('No file selected')
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `casesharing/${fileName}`
    
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

// 提交分享（创建或更新）
const submitCase = async () => {
    if (!caseForm.value) return
    
    await caseForm.value.validate(async (valid: boolean) => {
        if (!valid) return
        
        submitting.value = true
        try {
            // 如果有文件需要上传
            if (selectedFile.value) {
                try {
                    const fileUrl = await uploadFileToStorage(selectedFile.value)
                    // 设置文件信息
                    newCase.attachment_url = fileUrl
                    newCase.attachment_name = selectedFile.value.name
                    newCase.attachment_type = selectedFile.value.type
                } catch (uploadError: any) {
                    ElMessage.error(`文件上传失败: ${uploadError.message || '未知错误'}`)
                    submitting.value = false
                    return
                }
            }
            
            if (isEditing.value) {
                // 更新分享
                await caseSharingService.updateCase(newCase.id, {
                    title: newCase.title,
                    content: newCase.content,
                    category: newCase.category,
                    is_show: newCase.is_show,
                    attachment_url: newCase.attachment_url,
                    attachment_name: newCase.attachment_name,
                    attachment_type: newCase.attachment_type,
                    link_url: newCase.link_url,
                    custom_month: newCase.custom_month,
                    custom_sharer: newCase.custom_sharer,
                    custom_department: newCase.custom_department
                })
                ElMessage.success('分享已更新')
            } else {
                // 创建分享
                await caseSharingService.createCase({
                    title: newCase.title,
                    content: newCase.content,
                    category: newCase.category,
                    is_show: newCase.is_show,
                    attachment_url: newCase.attachment_url,
                    attachment_name: newCase.attachment_name,
                    attachment_type: newCase.attachment_type,
                    link_url: newCase.link_url,
                    custom_month: newCase.custom_month,
                    custom_sharer: newCase.custom_sharer,
                    custom_department: newCase.custom_department
                })
                ElMessage.success('分享已创建')
            }
            
            createDialogVisible.value = false
            searchCases()
            // 重置文件列表
            fileList.value = []
            selectedFile.value = null
        } catch (error) {
            ElMessage.error(isEditing.value ? '更新分享失败' : '创建分享失败')
            console.error(isEditing.value ? '更新分享失败:' : '创建分享失败:', error)
        } finally {
            submitting.value = false
        }
    })
}

// 删除分享
const handleDelete = async (caseItem: CaseSharing) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除 "${caseItem.title}" 这个分享吗？`,
            '提示',
            { type: 'warning' }
        )
        
        await caseSharingService.deleteCase(caseItem.id)
        ElMessage.success('删除成功')
        searchCases()
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败')
            console.error('删除失败:', error)
        }
    }
}

// 批量删除
const handleBatchDelete = async () => {
    if (selectedCases.value.length === 0) return
    
    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedCases.value.length} 个分享吗？此操作不可恢复。`,
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        
        // 创建批量删除的承诺数组
        const deletePromises = selectedCases.value.map((caseItem: CaseSharing) =>
            caseSharingService.deleteCase(caseItem.id)
        )
        
        // 等待所有删除操作完成
        await Promise.all(deletePromises)
        
        ElMessage.success(`成功删除 ${selectedCases.value.length} 个分享`)
        selectedCases.value = []
        searchCases()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量删除分享失败:', error)
            ElMessage.error('批量删除失败')
        }
    }
}

// 处理查看类型变化
const handleViewTypeChange = (viewType: string) => {
    activeViewType.value = viewType
    // 重置分页到第一页
    pagination.page = 1
    searchCases()
}

onMounted(() => {
    searchCases()
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

.case-details {
    line-height: 1.6;
    font-size: 16px;
}

.case-header {
    margin-bottom: 20px;
    border-bottom: 1px solid #eaeaea;
    padding-bottom: 15px;
}

.case-title {
    font-size: 1.5em;
    font-weight: bold;
    color: #409EFF;
    margin-bottom: 10px;
}

.case-meta {
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

.case-section {
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

.case-content {
    background-color: #f8f9fa;
    border-radius: 4px;
    min-height: 100px;
    white-space: pre-wrap;
    word-break: break-word;
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

.link-box {
    display: flex;
    align-items: center;
    padding: 10px;
    background-color: #f0f9ff;
    border-radius: 4px;
    border: 1px dashed #67C23A;
}

.link-url {
    flex: 1;
    margin: 0 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #67C23A;
}

.custom-info {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.custom-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background-color: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #e9ecef;
}

.custom-label {
    font-weight: 500;
    color: #606266;
    margin: 0 8px;
    min-width: 60px;
}

.custom-value {
    color: #303133;
    font-weight: 500;
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
    cursor: pointer;
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

.fullscreen-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.fullscreen-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.fullscreen-frame {
    width: 100vw;
    height: 100vh;
    border: none;
}

/* 全屏对话框样式 */
:deep(.fullscreen-dialog .el-dialog) {
    margin: 0 !important;
    height: 100vh;
    max-height: 100vh;
}

:deep(.fullscreen-dialog .el-dialog__body) {
    padding: 0;
    height: calc(100vh - 60px);
}

:deep(.fullscreen-dialog .el-dialog__header) {
    padding: 10px 20px;
    background-color: #f5f7fa;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
}

.case-detail-dialog :deep(.el-dialog__body) {
    padding: 20px 25px;
}

.case-detail-dialog :deep(.el-dialog__header) {
    padding: 15px 25px;
    margin-right: 0;
    background-color: #f5f7fa;
    border-bottom: 1px solid #eaeaea;
}

.case-detail-dialog :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}

.case-detail-dialog :deep(.el-dialog__footer) {
    padding: 15px 25px;
    border-top: 1px solid #eaeaea;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
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

/* 分享月份列样式 */
.month-info {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 0;
}

.month-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    line-height: 1.4;
}

.month-text {
    /* color: #E6A23C; */
    font-weight: 500;
    font-size: 14px;
     
}

.month-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 20px;
}

/* 分享人/部门列样式 */
.sharer-dept-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px 0;
}

.sharer-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    line-height: 1.4;
}

.sharer-text {
    /* color: #67C23A; */
    font-weight: 500;
}

.dept-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    line-height: 1.4;
}

.dept-text {
    /* color: #F56C6C; */
    font-weight: 500;
}

.sharer-dept-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 20px;
}

.empty-text {
    color: #C0C4CC;
    font-size: 13px;
}

/* 表格滚动优化样式 */
:deep(.el-table) {
    overflow-x: auto;
}

:deep(.el-table__body-wrapper) {
    overflow-x: auto;
}

:deep(.el-table__fixed-right) {
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-table__fixed-left) {
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

/* 确保固定列在滚动时有正确的层级 */
:deep(.el-table__fixed-right-patch) {
    background-color: #fafafa;
}

:deep(.el-table__fixed-left-patch) {
    background-color: #fafafa;
}
 </style>

