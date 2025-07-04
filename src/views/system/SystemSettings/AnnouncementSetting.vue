<template>
    <div class="layout">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="layout-title">
            <h1 class="title">公告管理</h1>
        </div>

        <!-- 搜索功能 -->
        <el-card shadow="always" style="margin-bottom: 20px;">
            <el-space wrap alignment="start" :size="30">
                <el-input v-model="searchQuery" style="width: 240px" placeholder="请输入公告标题" :suffix-icon="Search"
                    size="large" clearable />
                <el-button type="primary" size="large" @click="handleSearch">搜索</el-button>
                <el-button type="success" size="large" @click="handleAdd">添加公告</el-button>
            </el-space>
        </el-card>

        <div class="announcement-content">
            <el-card style="min-height: 400px;">
                <template #header>
                    <div class="card-header">
                        公告列表
                        <div class="header-actions">
                            <div style="font-size: 14px; color: #909399;">共计{{ pagination.total }}条数据</div>
                        </div>
                    </div>
                </template>

                <el-table v-loading="loading" :data="paginatedAnnouncementList" row-key="id">
                    <el-table-column prop="id" label="ID" width="80" />
                    <el-table-column prop="title" label="标题" width="200" />
                    <el-table-column prop="content" label="内容" show-overflow-tooltip />
                    <el-table-column prop="type" label="类型" width="100">
                        <template #default="{ row }">
                            <el-tag :type="getTagType(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="100">
                        <template #default="{ row }">
                            <el-tag :type="row.status ? 'success' : 'info'">
                                {{ row.status ? '已发布' : '未发布' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="created_at" label="创建时间" width="180">
                        <template #default="{ row }">
                            {{ formatDate(row.created_at) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="updated_at" label="更新时间" width="180">
                        <template #default="{ row }">
                            {{ formatDate(row.updated_at) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200">
                        <template #default="{ row }">
                            <el-button-group>
                                <el-button type="primary" @click="handleEdit(row)">
                                    编辑
                                </el-button>
                                <el-button type="danger" @click="handleDelete(row)">
                                    删除
                                </el-button>
                            </el-button-group>
                        </template>
                    </el-table-column>
                </el-table>
            </el-card>
            <Pagination :pagination="pagination" @update:pagination="handlePaginationUpdate" />

            <!-- 添加/编辑公告对话框 -->
            <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
                <el-form :model="announcementForm" :rules="rules" ref="announcementFormRef" label-width="100px">
                    <el-form-item label="标题" prop="title">
                        <el-input v-model="announcementForm.title" />
                    </el-form-item>
                    <el-form-item label="内容" prop="content">
                        <el-input v-model="announcementForm.content" type="textarea" :rows="4" />
                    </el-form-item>
                    <el-form-item label="类型" prop="type">
                        <el-select v-model="announcementForm.type" placeholder="请选择公告类型">
                            <el-option label="重要" value="important" />
                            <el-option label="普通" value="normal" />
                            <el-option label="更新" value="update" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="状态" prop="status">
                        <el-switch v-model="announcementForm.status" active-text="发布" inactive-text="隐藏" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="dialogVisible = false">取消</el-button>
                        <el-button type="primary" @click="handleSubmit">确定</el-button>
                    </span>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Breadbcrum from '@/components/system/Breadcrumb.vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'
import { supabase } from '@/lib/supabaseClient'

interface Announcement {
    id?: number
    title: string
    content: string
    type: 'important' | 'normal' | 'update'
    status: boolean
    created_at?: string
    updated_at?: string
}

const breadbcrum = [
    {
        name: '公告管理',
        path: '/system/announcement-setting'
    }
]

const loading = ref(false)
const announcementList = ref<Announcement[]>([])
const searchQuery = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('')
const announcementFormRef = ref<any>(null)

const pagination = ref<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
})

const announcementForm = ref<Announcement>({
    title: '',
    content: '',
    type: 'normal',
    status: false
})

const rules = {
    title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
    content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }],
    type: [{ required: true, message: '请选择公告类型', trigger: 'change' }]
}

const originalAnnouncementList = ref<Announcement[]>([])

const paginatedAnnouncementList = computed(() => {
    const start = (pagination.value.page - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize
    return announcementList.value.slice(start, end)
})

// 获取公告列表
const fetchAnnouncementList = async () => {
    loading.value = true
    try {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (error) throw error
        
        originalAnnouncementList.value = data || []
        announcementList.value = data || []
        pagination.value.total = data?.length || 0
    } catch (error) {
        console.error('获取公告列表失败:', error)
        ElMessage.error('获取公告列表失败')
    } finally {
        loading.value = false
    }
}

const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.value.page = newPagination.page
    pagination.value.pageSize = newPagination.pageSize
    fetchAnnouncementList()
}

const handleSearch = () => {
    pagination.value.page = 1
    if (!searchQuery.value) {
        announcementList.value = originalAnnouncementList.value
        pagination.value.total = originalAnnouncementList.value.length
        return
    }
    announcementList.value = originalAnnouncementList.value.filter(
        item => item.title.includes(searchQuery.value)
    )
    pagination.value.total = announcementList.value.length
}

// 添加公告
const handleAdd = () => {
    dialogTitle.value = '添加公告'
    announcementForm.value = {
        title: '',
        content: '',
        type: 'normal',
        status: false
    }
    dialogVisible.value = true
}

// 编辑公告
const handleEdit = (row: Announcement) => {
    dialogTitle.value = '编辑公告'
    announcementForm.value = { ...row }
    dialogVisible.value = true
}

// 删除公告
const handleDelete = async (row: Announcement) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除该公告吗？此操作不可恢复。',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', row.id)
        
        if (error) throw error
        
        ElMessage.success('删除成功')
        fetchAnnouncementList()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除公告失败:', error)
            ElMessage.error('删除失败')
        }
    }
}

// 提交表单
const handleSubmit = async () => {
    if (!announcementFormRef.value) return
    await announcementFormRef.value.validate(async (valid: boolean) => {
        if (valid) {
            try {
                if (announcementForm.value.id) {
                    const { error } = await supabase
                        .from('announcements')
                        .update(announcementForm.value)
                        .eq('id', announcementForm.value.id)
                    
                    if (error) throw error
                    ElMessage.success('更新成功')
                } else {
                    const { error } = await supabase
                        .from('announcements')
                        .insert(announcementForm.value)
                    
                    if (error) throw error
                    ElMessage.success('创建成功')
                }
                dialogVisible.value = false
                fetchAnnouncementList()
            } catch (error) {
                console.error(announcementForm.value.id ? '更新失败:' : '创建失败:', error)
                ElMessage.error(announcementForm.value.id ? '更新失败' : '创建失败')
            }
        }
    })
}

function formatDate(dateString?: string) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
}

function getTagType(type: string) {
    switch (type) {
        case 'important':
            return 'danger'
        case 'update':
            return 'success'
        default:
            return 'info'
    }
}

function getTypeLabel(type: string) {
    switch (type) {
        case 'important':
            return '重要'
        case 'update':
            return '更新'
        default:
            return '普通'
    }
}

onMounted(async () => {
    await fetchAnnouncementList()
})
</script>

<style scoped>
.layout {
    padding: 20px;
}

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

.dialog-footer {
    margin-top: 20px;
    text-align: right;
}

.el-form {
    max-width: 500px;
    margin: 0 auto;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}
</style> 