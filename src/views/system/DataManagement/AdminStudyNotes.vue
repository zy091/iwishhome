<template>

    <div class="layout">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="layout-title">
            <h1 class="title">学习心得</h1>
            <div class="status-tabs">
                <el-tabs class="demo-tabs" v-model="activeStatus" @tab-change="handleStatusChange">
                    <el-tab-pane :name="'all'" label="全部心得" />
                    <el-tab-pane :name="'replied'" label="已回复" />
                    <el-tab-pane :name="'pending'" label="待回复" />
                </el-tabs>
            </div>
        </div>

        <!-- 搜索功能 -->
        <el-card shadow="always" style="margin-bottom: 20px;">
            <el-space alignment="start" :size="30">
                <el-input v-model="searchQuery" style="width: 240px" placeholder="请输入提交人或标题" :suffix-icon="Search"
                    size="large" clearable />
                <el-date-picker v-model="dateRange" type="daterange" unlink-panels range-separator="至"
                    start-placeholder="开始日期" end-placeholder="结束日期" :shortcuts="shortcuts" size="large" />
                <el-button type="primary" size="large" @click="searchNotes">搜索</el-button>
            </el-space>
        </el-card>

        <div class="training-content">
            <el-card v-if="hasPermission" style="min-height: 400px;">
                <template #header>
                    <div class="card-header">
                        <div>
                            <span>学习心得管理</span>
                            <el-tooltip v-if="isSupperAdmin" content="您可以查看所有学习心得" placement="right">
                                <el-tag type="success" size="small" style="margin-left: 8px;">全部</el-tag>
                            </el-tooltip>
                            <el-tooltip v-else content="您只能查看本组织的学习心得" placement="right">
                                <el-tag type="info" size="small" style="margin-left: 8px;">本组织</el-tag>
                            </el-tooltip>
                        </div>
                        <div class="header-actions">
                            <el-button type="danger" :disabled="!selectedNotes.length" @click="handleBatchDelete">
                                批量删除
                            </el-button>
                            <div style="font-size: 14px; color: #909399;">共计{{ pagination.total }}条数据</div>
                        </div>
                    </div>
                </template>

                <el-table v-loading="loading" :data="notes" @selection-change="handleSelectionChange">
                    <el-table-column type="selection" width="55" />
                    <el-table-column prop="profile.full_name" label="提交人" />
                    <el-table-column prop="title" label="标题" />
                    <el-table-column prop="admin_reply" label="状态">
                        <template #default="{ row }">
                            <el-tag style="font-size: 14px;"  :type="row.admin_reply ? 'success' : 'warning'" size="large">
                                {{ row.admin_reply ? '已回复' : '待回复' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="note_created_at" label="创建时间">
                        <template #default="{ row }">
                            {{ new Date(row.note_created_at).toLocaleString() }}
                        </template> 
                    </el-table-column>
                    <el-table-column label="操作" width="150" fixed="right">
                        <template #default="{ row }">
                            <el-button-group>
                                <el-button type="primary" @click="showEditDialog(row)">查看</el-button>
                                <el-button type="danger" @click="handleDelete(row)">删除</el-button>
                            </el-button-group>
                        </template>
                    </el-table-column>
                    <el-empty>
                        <template #description>
                            暂无学习心得
                        </template>
                    </el-empty>
                </el-table>
            </el-card>
            <el-empty v-else description="您没有权限查看所有笔记" />
            <Pagination :pagination="pagination" @update:pagination="handlePaginationUpdate" />

            <!-- 查看对话框 -->
            <el-dialog 
                title="学习心得详情" 
                v-model="dialogVisible" 
                width="60%" 
                :close-on-click-modal="false"
                top="5vh"
                class="note-detail-dialog"
            >
                <div class="dialog-content">
                    <div class="note-details">
                        <!-- 标题区 -->
                        <div class="note-header">
                            <h2 class="note-title">{{ selectedNote?.title || '无标题' }}</h2>
                            <div class="note-meta">
                                <span class="meta-item">
                                    <i class="el-icon-user"></i>
                                    <span>{{ selectedNote?.profile?.full_name || '未知用户' }}</span>
                                </span>
                                <span class="meta-item">
                                    <i class="el-icon-message"></i>
                                    <span>{{ selectedNote?.profile?.email || '无邮箱' }}</span>
                                </span>
                                <span class="meta-item">
                                    <i class="el-icon-time"></i>
                                    <span>{{ selectedNote ? new Date(selectedNote?.note_created_at).toLocaleString() : '未知时间' }}</span>
                                </span>
                            </div>
                        </div>

                        <!-- 内容区 -->
                        <div class="note-section">
                            <div class="section-title">内容</div>
                            <div class="note-content">{{ selectedNote?.content || '无内容' }}</div>
                        </div>
                        
                        <!-- 附件区 -->
                        <div v-if="selectedNote?.attachment_url" class="note-section">
                            <div class="section-title">附件</div>
                            <div class="attachment-box">
                                <span class="attachment-name">{{ selectedNote.attachment_name }}</span>
                                <el-button type="primary" size="small" @click="viewAttachment">
                                    {{ isImageAttachment ? '预览图片' : isPdfAttachment ? '预览PDF' : isWordAttachment ? '预览Word' : '查看附件' }}
                                </el-button>
                            </div>
                        </div>

                        <!-- 回复历史区 -->
                        <div v-if="selectedNote?.admin_reply" class="note-section">
                            <div class="section-title">历史回复</div>
                            <div class="previous-reply">
                                <div class="reply-header">
                                    <span class="reply-author">{{ selectedNote.admin_name || '未知' }}:</span>
                                </div>
                                <div class="admin-reply-content">{{ selectedNote.admin_reply }}</div>
                                <div class="reply-timestamp" v-if="selectedNote.replied_at">
                                    {{ new Date(selectedNote.replied_at).toLocaleString() }}
                                </div>
                                <div class="reply-actions">
                                    <el-button 
                                        type="primary" 
                                        size="small" 
                                        @click="showEditReply"
                                        v-if="!isEditingReply"
                                    >
                                        修改回复
                                    </el-button>
                                </div>
                            </div>
                        </div>

                        <!-- 回复表单区 -->
                        <div class="note-section" v-if="!selectedNote?.admin_reply || isEditingReply">
                            <div class="section-title">{{ selectedNote?.admin_reply ? '修改回复' : '添加回复' }}</div>
                            <el-input 
                                type="textarea" 
                                v-model="adminReply" 
                                :rows="4"
                                placeholder="请输入您的回复内容..."
                                class="reply-input"
                            ></el-input>
                        </div>
                    </div>
                </div>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="closeDialog">取消</el-button>
                        <el-button type="primary" @click="submitReply" :loading="submitting">
                            {{ selectedNote?.admin_reply ? '更新回复' : '提交回复' }}
                        </el-button>
                    </span>
                </template>
            </el-dialog>

            <!-- 附件预览对话框 -->
            <el-dialog v-model="attachmentDialogVisible" title="附件预览" width="80%" destroy-on-close>
                <div class="attachment-preview">
                    <template v-if="isImageAttachment">
                        <img :src="selectedNote?.attachment_url" class="attachment-image" @click="openFullscreen" />
                    </template>
                    <template v-else-if="isPdfAttachment">
                        <iframe :src="selectedNote?.attachment_url" class="attachment-frame"></iframe>
                    </template>
                    <template v-else-if="isWordAttachment">
                        <iframe :src="wordPreviewUrl" class="word-preview-frame"></iframe>
                    </template>
                    <template v-else>
                        <div class="attachment-download">
                            <p>无法预览此类型的文件，请下载后查看</p>
                            <el-button type="primary" @click="downloadAttachment">下载附件</el-button>
                        </div>
                    </template>
                </div>
                <template #footer>
                    <el-button @click="attachmentDialogVisible = false">关闭</el-button>
                    <el-button v-if="isImageAttachment || isPdfAttachment" type="primary" @click="openFullscreen">
                        全屏查看
                    </el-button>
                </template>
            </el-dialog>

            <!-- 全屏预览对话框 -->
            <el-dialog v-model="fullscreenVisible" title="全屏预览" width="100%" top="0" :show-close="true" destroy-on-close class="fullscreen-dialog">
                <div class="fullscreen-preview">
                    <template v-if="isImageAttachment">
                        <img :src="selectedNote?.attachment_url" class="fullscreen-image" />
                    </template>
                    <template v-else-if="isPdfAttachment">
                        <iframe :src="selectedNote?.attachment_url" class="fullscreen-frame"></iframe>
                    </template>
                </div>
            </el-dialog>


        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { studyNoteService, hasViewAllNotesPermission } from '@/stores/studyNoteService'
import type { StudyNoteWithProfile } from '@/stores/studyNote'
import type { StudyNote, StudyNoteView } from '@/stores/studyNote'
import { useUserStore } from '@/stores/user'
import Breadbcrum from '@/components/system/Breadcrumb.vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'
import { supabase } from '@/lib/supabaseClient'

const breadbcrum = reactive([
    {
        name: '数据管理',
        path: '/system/data'
    },
    {
        name: '学习心得',
        path: '/system/admin-study-notes'
    }
])

const userStore = useUserStore()
const hasPermission = computed(() =>
    hasViewAllNotesPermission(Number(userStore.roleId))
)

// 判断是否为超级管理员
const isSupperAdmin = computed(() => {
    const roleId = Number(userStore.roleId)
    return roleId === 0
})

const loading = ref(false)
const notes = ref<StudyNoteWithProfile[]>([])
const dialogVisible = ref(false)
const selectedNote = ref<StudyNoteWithProfile | null>(null)  // 用于存储选中的笔记
const searchQuery = ref('')  // 搜索查询
const dateRange = ref<Date[]>([])
const adminReply = ref('')  // 管理员回复内容
const submitting = ref(false)  // 提交状态
const attachmentDialogVisible = ref(false)  // 附件预览对话框
const activeStatus = ref('all')  // 当前激活的标签页
const isEditingReply = ref(false)  // 是否正在编辑回复
const fullscreenVisible = ref(false)  // 全屏预览对话框
const wordPreviewUrl = ref('')  // Word预览URL
const shortcuts = [
    {
        text: 'Last week',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            return [start, end]
        },
    },
    {
        text: 'Last month',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            return [start, end]
        },
    },
    {
        text: 'Last 3 months',
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
});
const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    searchNotes();
}
// 搜索笔记
const searchNotes = async () => {
    loading.value = true
    console.log(dateRange.value)
    const startDate = dateRange.value != null && dateRange.value[0] != null ? dateRange.value[0].toDateString() : ''
    const endDate = dateRange.value != null && dateRange.value[1] != null ? dateRange.value[1].toDateString() : ''
    try {
        const result = await studyNoteService.searchNotesUsingView(searchQuery.value, {
            startDate,
            endDate,
            page: pagination.page,
            pageSize: pagination.pageSize,
            replyStatus: activeStatus.value // 添加回复状态过滤
        })  // 调用搜索 API
        notes.value = result.data
        pagination.total = result.total
    } catch (error) {
        ElMessage.error('搜索笔记失败')
    } finally {
        loading.value = false
    }
}

// 显示编辑对话框
const showEditDialog = (note: StudyNoteWithProfile) => {
    dialogVisible.value = true
    selectedNote.value = note
    adminReply.value = ''  // 不预填已有回复
    isEditingReply.value = false  // 重置编辑状态
}

// 显示编辑回复
const showEditReply = () => {
    isEditingReply.value = true
    adminReply.value = selectedNote.value?.admin_reply || ''  // 加载已有回复用于编辑
}

// 关闭对话框
const closeDialog = () => {
    dialogVisible.value = false
    isEditingReply.value = false
    adminReply.value = ''
}

const handleDelete = async (note: StudyNoteWithProfile) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除用户 ${note.profile?.full_name || '未知用户'} 的这条笔记吗？`,
            '提示',
            { type: 'warning' }
        )

        await studyNoteService.deleteNote(note.note_id)
        ElMessage.success('删除成功')
        searchNotes()
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败')
        }
    }
}

const selectedNotes = ref<StudyNoteWithProfile[]>([]);

// 处理表格选择变化
const handleSelectionChange = (selection: StudyNoteWithProfile[]) => {
    selectedNotes.value = selection;
};

// 批量删除学习心得
const handleBatchDelete = async () => {
    if (selectedNotes.value.length === 0) return;

    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedNotes.value.length} 条学习心得吗？此操作不可恢复。`,
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        );

        // 创建批量删除的承诺数组
        const deletePromises = selectedNotes.value.map(note =>
            studyNoteService.deleteNote(note.note_id)
        );

        // 等待所有删除操作完成
        await Promise.all(deletePromises);

        ElMessage.success(`成功删除 ${selectedNotes.value.length} 条学习心得`);
        selectedNotes.value = []; // 清空选择
        searchNotes(); // 重新加载数据
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量删除学习心得失败:', error);
            ElMessage.error('批量删除失败');
        }
    }
};

// 判断附件类型
const isImageAttachment = computed(() => {
    if (!selectedNote.value?.attachment_type) return false
    return selectedNote.value.attachment_type.startsWith('image/')
})

const isPdfAttachment = computed(() => {
    if (!selectedNote.value?.attachment_type) return false
    return selectedNote.value.attachment_type === 'application/pdf'
})

const isWordAttachment = computed(() => {
    if (!selectedNote.value?.attachment_type) return false
    return selectedNote.value.attachment_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
           selectedNote.value.attachment_type === 'application/msword'
})

// 查看附件
const viewAttachment = () => {
    if (selectedNote.value?.attachment_url) {
        // 如果是Word文档，准备预览URL
        if (isWordAttachment.value) {
            wordPreviewUrl.value = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedNote.value.attachment_url)}`
        }
        attachmentDialogVisible.value = true
    }
}

// 下载附件
const downloadAttachment = () => {
    if (selectedNote.value?.attachment_url) {
        window.open(selectedNote.value.attachment_url, '_blank')
    }
}

// 打开全屏预览
const openFullscreen = () => {
    fullscreenVisible.value = true
}



// 提交管理员回复
const submitReply = async () => {
    if (!selectedNote.value) return

    submitting.value = true
    try {
        // 获取当前用户ID
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
            throw new Error('用户未登录')
        }

        console.log('正在更新笔记，ID:', selectedNote.value.note_id)

        // 检查笔记是否存在
        const exists = await studyNoteService.checkNoteExists(selectedNote.value.note_id)
        if (!exists) {
            throw new Error(`笔记不存在: ${selectedNote.value.note_id}`)
        }

        // 更新笔记
        await studyNoteService.updateNoteWithReply(
            selectedNote.value.note_id,
            {
                admin_reply: adminReply.value,
                admin_id: userData.user.id,
                replied_at: new Date().toISOString()
            }
        )

        ElMessage.success('回复已提交')
        // 更新本地数据
        if (selectedNote.value) {
            selectedNote.value.admin_reply = adminReply.value
            selectedNote.value.admin_id = userData.user.id
            selectedNote.value.replied_at = new Date().toISOString()
        }

        // 重新加载数据
        searchNotes()
        dialogVisible.value = false
        isEditingReply.value = false  // 重置编辑状态
    } catch (error) {
        console.error('提交回复失败:', error)
        ElMessage.error('提交回复失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
        submitting.value = false
    }
}

// 处理标签页变化
const handleStatusChange = (status: string) => {
    activeStatus.value = status
    // 重置分页到第一页
    pagination.page = 1
    searchNotes()
}

onMounted(() => {
    searchNotes()
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

.admin-reply-content {
    margin-bottom: 8px;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 16px;
    line-height: 1.5;
}

.reply-header {
    margin-bottom: 8px;
}

.reply-author {
    color: #303133;
    font-size: 14px;
    font-weight: 500;
}

.reply-timestamp {
    color: #303133;
    font-size: 12px;
    margin-top: 8px;
}

.reply-actions {
    margin-top: 15px;
    text-align: right;
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

.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.note-attachment {
    margin: 15px 0;
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

.word-preview {
    text-align: center;
    padding: 30px;
}

.fullscreen-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
}

.fullscreen-image {
    max-width: 100%;
    max-height: 100vh;
    cursor: pointer;
}

.fullscreen-frame {
    width: 100vw;
    height: 100vh;
    border: none;
}

.word-preview-frame {
    width: 100%;
    height: 70vh;
    border: none;
}

.attachment-image {
    cursor: pointer;
    transition: transform 0.2s;
}

.attachment-image:hover {
    transform: scale(1.02);
}

/* 全屏对话框样式 */
:deep(.fullscreen-dialog .el-dialog) {
    margin: 0 !important;
    height: 100vh;
    width: 100vw;
    max-width: 100vw;
    max-height: 100vh;
}

:deep(.fullscreen-dialog .el-dialog__body) {
    padding: 0;
    height: calc(100vh - 60px);
}

:deep(.fullscreen-dialog .el-dialog__header) {
    padding: 10px 20px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
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