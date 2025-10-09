<template>
    <div class="layout">
        <Breadcrumb :breadcrumb="breadcrumb" />
        <div class="layout-title">
            <h1 class="title">任务管理</h1>
        </div>

        <!-- 搜索和添加 -->
        <el-card shadow="always" style="margin-bottom: 20px;">
            <el-space wrap alignment="start" :size="30">
                <el-input v-model="searchQuery" style="width: 240px" placeholder="请输入任务名称" :suffix-icon="Search"
                    size="large" clearable />
                <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 150px" size="large">
                    <el-option label="待完成" value="pending" />
                    <el-option label="进行中" value="in_progress" />
                    <el-option label="已完成" value="completed" />
                </el-select>
                <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
                    end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 300px" size="large" />
                <el-button type="primary" size="large" @click="handleSearch">搜索</el-button>
                <el-button type="success" size="large" @click="handleAdd">添加任务</el-button>
                <el-button v-if="isAdmin" type="info" size="large" @click="showAssignDialog = true">批量指派任务</el-button>
            </el-space>
        </el-card>

        <div class="task-content">
            <el-card shadow="always">
                <template #header>
                    <div class="card-header">
                        <div>
                            <span>任务列表</span>
                            <el-tooltip v-if="isSupperAdmin" content="您可以查看所有任务" placement="right">
                                <el-tag type="success" size="small" style="margin-left: 8px;">全部</el-tag>
                            </el-tooltip>
                            <el-tooltip v-else content="您只能查看本组织的任务" placement="right">
                                <el-tag type="info" size="small" style="margin-left: 8px;">本组织</el-tag>
                            </el-tooltip>
                        </div>
                        <div class="header-actions">
                            <el-button type="danger" :disabled="!selectedTasks.length" @click="handleBatchDelete">
                                批量删除
                            </el-button>
                            <div style="font-size: 14px; color: #909399;">共计{{ pagination.total }}条数据</div>
                        </div>
                    </div>
                </template>

                <el-table v-loading="loading" :data="paginatedTaskList" row-key="id" stripe height="400px" @selection-change="handleSelectionChange">
                    <el-table-column type="selection" width="55" />
                    <el-table-column prop="id" label="ID" width="80" />
                    <el-table-column prop="title" label="任务名称" width="200" />
                    <el-table-column prop="description" label="任务描述" show-overflow-tooltip />
                    <el-table-column prop="priority" label="优先级" width="100">
                        <template #default="{ row }">
                            <el-tag :type="getPriorityType(row.priority)">{{ getPriorityLabel(row.priority) }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="100">
                        <template #default="{ row }">
                            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="due_date" label="截止日期" width="120">
                        <template #default="{ row }">
                            {{ formatDate(row.due_date) }}
                        </template>
                    </el-table-column>
                    <el-table-column v-if="isAdmin" prop="assigned_to" label="指派给" width="150">
                        <template #default="{ row }">
                            {{ row.assignee?.full_name || '未指派' }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="user_id" label="创建人" width="150">
                        <template #default="{ row }">
                            {{ row.creator?.full_name || '未知' }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="created_at" label="创建时间" width="170">
                        <template #default="{ row }">
                            {{ formatDateTime(row.created_at) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="220" fixed="right">
                        <template #default="{ row }">
                            <el-button-group>
                                <el-button type="primary" @click="handleEdit(row)">
                                    编辑
                                </el-button>
                                <el-button type="success" @click="handleUpdateStatus(row)"
                                    :disabled="row.status === 'completed'">
                                    {{ getStatusActionLabel(row.status) }}
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

            <!-- 添加/编辑任务对话框 -->
            <el-dialog :title="dialogTitle" v-model="dialogVisible" width="40%" :close-on-click-modal="false">
                <el-form :model="taskForm" :rules="rules" ref="taskFormRef" label-width="80px">
                    <el-form-item label="任务名称" prop="title">
                        <el-input v-model="taskForm.title" placeholder="请输入任务名称" />
                        <div class="form-tip">请简要描述任务的主要内容</div>
                    </el-form-item>
                    <el-form-item label="任务描述" prop="description">
                        <el-input v-model="taskForm.description" type="textarea" :rows="6" placeholder="请详细描述任务的具体要求、步骤和注意事项" />
                        <div class="form-tip">详细描述任务的具体要求、执行步骤和相关注意事项</div>
                    </el-form-item>
                    <el-form-item label="优先级" prop="priority">
                        <el-select v-model="taskForm.priority" placeholder="请选择任务优先级" style="width: 100%">
                            <el-option label="低" value="low" />
                            <el-option label="中" value="medium" />
                            <el-option label="高" value="high" />
                            <el-option label="紧急" value="urgent" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="状态" prop="status">
                        <el-select v-model="taskForm.status" placeholder="请选择任务状态" style="width: 100%">
                            <el-option label="待完成" value="pending" />
                            <el-option label="进行中" value="in_progress" />
                            <el-option label="已完成" value="completed" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="截止日期" prop="due_date">
                        <el-date-picker v-model="taskForm.due_date" type="date" placeholder="选择截止日期" value-format="YYYY-MM-DD" style="width: 100%" />
                    </el-form-item>
                    <el-form-item v-if="isAdmin" label="指派给" prop="assigned_to">
                        <el-select v-model="taskForm.assigned_to" placeholder="请选择用户(支持模糊搜索)" filterable style="width: 100%">
                            <el-option filterable v-for="user in userList" :key="user.user_id" :label="user.full_name"
                                :value="user.user_id" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="创建人">
                        <el-input :model-value="creatorName" disabled />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="dialogVisible = false">取消</el-button>
                        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
                    </span>
                </template>
            </el-dialog>

            <!-- 批量指派任务对话框 -->
            <el-dialog title="批量指派任务" v-model="showAssignDialog" width="40%" :close-on-click-modal="false">
                <el-form :model="assignForm" :rules="assignRules" ref="assignFormRef" label-width="80px">
                    <el-form-item label="任务名称" prop="title">
                        <el-input v-model="assignForm.title" placeholder="请输入任务名称" />
                        <div class="form-tip">请简要描述任务的主要内容</div>
                    </el-form-item>
                    <el-form-item label="任务描述" prop="description">
                        <el-input v-model="assignForm.description" type="textarea" :rows="6" placeholder="请详细描述任务的具体要求、步骤和注意事项" />
                        <div class="form-tip">详细描述任务的具体要求、执行步骤和相关注意事项</div>
                    </el-form-item>
                    <el-form-item label="优先级" prop="priority">
                        <el-select v-model="assignForm.priority" placeholder="请选择任务优先级" style="width: 100%">
                            <el-option label="低" value="low" />
                            <el-option label="中" value="medium" />
                            <el-option label="高" value="high" />
                            <el-option label="紧急" value="urgent" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="截止日期" prop="due_date">
                        <el-date-picker v-model="assignForm.due_date" type="date" placeholder="选择截止日期" value-format="YYYY-MM-DD" style="width: 100%" />
                    </el-form-item>
                    <el-form-item label="指派给" prop="assigned_to">
                        <el-select v-model="assignForm.assigned_to" placeholder="请选择用户(支持模糊搜索)" filterable multiple
                            style="width: 100%">
                            <el-option filterable v-for="user in userList" :key="user.user_id" :label="user.full_name"
                                :value="user.user_id" />
                        </el-select>
                        <div class="form-tip">可以选择多个用户进行批量指派</div>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="showAssignDialog = false">取消</el-button>
                        <el-button type="primary" @click="handleBatchAssign" :loading="submitting">确定</el-button>
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
import Breadcrumb from '@/components/system/Breadcrumb.vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'
import { supabase } from '@/lib/supabaseClient'
import { useUserStore } from '@/stores/user'

interface Task {
    id?: number
    title: string
    description: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    status: 'pending' | 'in_progress' | 'completed'
    due_date: string
    assigned_to?: string | null
    user_id?: string
    organization_id?: string
    created_at?: string
    updated_at?: string
    assignee?: { user_id: string, full_name: string }
    creator?: { user_id: string, full_name: string }
}

interface User {
    user_id: string
    full_name: string
}

const breadcrumb = [
    {
        name: '任务管理',
        path: '/system/task-management'
    }
]

const userStore = useUserStore()
const userId = userStore.user?.user_id
const roleId = computed(() => Number(userStore.user?.role_id))

// 判断是否有管理权限
const isAdmin = computed(() => {
    return roleId.value === 0 || roleId.value === 1 || roleId.value === 11 || roleId.value === 15
})

// 判断是否为超级管理员
const isSupperAdmin = computed(() => {
    return roleId.value === 0 || roleId.value === 1
})

const creatorName = computed(() => {
    // 编辑时有 creator 字段
    if (taskForm.value.creator && taskForm.value.creator.full_name) {
        return taskForm.value.creator.full_name
    }
    // 新建时用当前登录用户
    return userStore.user?.full_name || ''
})

const loading = ref(false)
const submitting = ref(false)
const taskList = ref<Task[]>([])
const searchQuery = ref('')
const statusFilter = ref('')
const dateRange = ref<[string, string] | null>(null)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const taskFormRef = ref<any>(null)
const showAssignDialog = ref(false)
const assignFormRef = ref<any>(null)
const userList = ref<User[]>([])
const selectedTasks = ref<Task[]>([])

const pagination = ref<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
})

const taskForm = ref<Task>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    due_date: '',
    assigned_to: null,
    organization_id: undefined
})

const assignForm = ref({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: [] as string[]
})

const rules = {
    title: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
    description: [{ required: true, message: '请输入任务描述', trigger: 'blur' }],
    priority: [{ required: true, message: '请选择任务优先级', trigger: 'change' }],
    status: [{ required: true, message: '请选择任务状态', trigger: 'change' }],
    due_date: [{ required: true, message: '请选择截止日期', trigger: 'change' }]
}

const assignRules = {
    title: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
    description: [{ required: true, message: '请输入任务描述', trigger: 'blur' }],
    priority: [{ required: true, message: '请选择任务优先级', trigger: 'change' }],
    due_date: [{ required: true, message: '请选择截止日期', trigger: 'change' }],
    assigned_to: [{ required: true, message: '请选择要指派的用户', trigger: 'change' }]
}

const originalTaskList = ref<Task[]>([])

const paginatedTaskList = computed(() => {
    const start = (pagination.value.page - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize
    return taskList.value.slice(start, end)
})

// 获取任务列表
const fetchTaskList = async () => {
    loading.value = true
    try {
        let query = supabase
            .from('tasks')
            .select(`
                *,
                assignee:user_profiles!tasks_assigned_to_fkey(
                    user_id,
                    full_name
                ),
                creator:user_profiles!tasks_user_id_fkey(
                    user_id,
                    full_name
                )
            `)
            .order('created_at', { ascending: false })

        // 如果不是管理员，只查看自己的任务
        if (!isAdmin.value) {
            query = query.eq('assigned_to', userId)
        } else if (!isSupperAdmin.value) {
            // 非超级管理员只能查看本组织的任务
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('organization_id')
                .eq('user_id', userId)
                .single()
            
            if (profile?.organization_id) {
                query = query.eq('organization_id', profile.organization_id)
            }
        }

        const { data, error } = await query

        if (error) throw error

        taskList.value = data || []
        originalTaskList.value = data || []
        pagination.value.total = data?.length || 0
    } catch (error) {
        console.error('获取任务列表失败:', error)
        ElMessage.error('获取任务列表失败')
    } finally {
        loading.value = false
    }
}

// 获取用户列表（管理员使用）
const fetchUserList = async () => {
    if (!isAdmin.value) return

    try {
        let query = supabase
            .from('user_profiles')
            .select('user_id, full_name, organization_id')
            .neq('user_id', userId) // 排除当前用户
            .order('full_name')

        if (!isSupperAdmin.value) {
            // 非超级管理员只能看到本组织成员
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('organization_id')
                .eq('user_id', userId)
                .single()
            
            if (profile?.organization_id) {
                query = query.eq('organization_id', profile.organization_id)
            }
        }

        const { data, error } = await query

        if (error) throw error
        userList.value = data || []
    } catch (error) {
        console.error('获取用户列表失败:', error)
        ElMessage.error('获取用户列表失败')
    }
}

const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.value.page = newPagination.page
    pagination.value.pageSize = newPagination.pageSize
}

// 处理表格选择变化
const handleSelectionChange = (selection: Task[]) => {
    selectedTasks.value = selection
}

const handleSearch = () => {
    pagination.value.page = 1

    // 过滤逻辑
    let filtered = [...originalTaskList.value]

    // 名称搜索
    if (searchQuery.value) {
        filtered = filtered.filter(
            item => item.title.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
    }

    // 状态过滤
    if (statusFilter.value) {
        filtered = filtered.filter(item => item.status === statusFilter.value)
    }

    // 日期范围过滤
    if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
        const [start, end] = dateRange.value
        filtered = filtered.filter(item => {
            const dueDate = new Date(item.due_date).toISOString().split('T')[0]
            return dueDate >= start && dueDate <= end
        })
    }

    taskList.value = filtered
    pagination.value.total = filtered.length
}

// 添加任务
const handleAdd = () => {
    dialogTitle.value = '添加任务'
    taskForm.value = {
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
        assigned_to: isAdmin.value ? null : userId,
        organization_id: undefined
    }
    dialogVisible.value = true
}

// 编辑任务
const handleEdit = async (row: Task) => {
    dialogTitle.value = '编辑任务'
    taskForm.value = { ...row }
    
    // 确保非超级管理员编辑时设置正确的组织ID
    if (!isSupperAdmin.value && !row.organization_id) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('organization_id')
            .eq('user_id', userId)
            .single()
        
        if (profile?.organization_id) {
            taskForm.value.organization_id = profile.organization_id
        }
    }
    
    dialogVisible.value = true
}

// 更新任务状态
const handleUpdateStatus = async (row: Task) => {
    const newStatus = row.status === 'pending' ? 'in_progress' : 'completed'

    try {
        const updateData: any = { 
            status: newStatus, 
            updated_at: new Date().toISOString() 
        }

        // 非超级管理员更新时需要确保组织ID
        if (!isSupperAdmin.value && !row.organization_id) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('organization_id')
                .eq('user_id', userId)
                .single()
            
            if (profile?.organization_id) {
                updateData.organization_id = profile.organization_id
            }
        }

        const { error } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', row.id)

        if (error) throw error

        ElMessage.success('更新状态成功')
        fetchTaskList()
    } catch (error) {
        console.error('更新状态失败:', error)
        ElMessage.error('更新状态失败')
    }
}

// 删除任务
const handleDelete = async (row: Task) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除该任务吗？此操作不可恢复。',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', row.id)

        if (error) throw error

        ElMessage.success('删除成功')
        fetchTaskList()
    } catch (error: any) {
        if (error !== 'cancel') {
            console.error('删除任务失败:', error)
            ElMessage.error('删除失败')
        }
    }
}

// 批量删除任务
const handleBatchDelete = async () => {
    if (selectedTasks.value.length === 0) return
    
    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedTasks.value.length} 条任务吗？此操作不可恢复。`,
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        
        // 创建批量删除的承诺数组
        const deletePromises = selectedTasks.value.map(task =>
            supabase
                .from('tasks')
                .delete()
                .eq('id', task.id)
        )
        
        // 等待所有删除操作完成
        await Promise.all(deletePromises)
        
        ElMessage.success(`成功删除 ${selectedTasks.value.length} 条任务`)
        selectedTasks.value = []
        fetchTaskList()
    } catch (error: any) {
        if (error !== 'cancel') {
            console.error('批量删除任务失败:', error)
            ElMessage.error('批量删除失败')
        }
    }
}

// 提交表单
const handleSubmit = async () => {
    if (!taskFormRef.value) return
    await taskFormRef.value.validate(async (valid: boolean) => {
        if (valid) {
            submitting.value = true
            try {
                // 确保非管理员只能创建自己的任务
                if (!isAdmin.value) {
                    taskForm.value.assigned_to = userId
                    taskForm.value.user_id = userId
                } else if (!taskForm.value.assigned_to) {
                    // 管理员必须指定给某人
                    ElMessage.warning('请选择要指派的用户')
                    return
                } else {
                    // 设置user_id与assigned_to一致
                    taskForm.value.user_id = userId
                }

                // 设置组织ID
                if (!isSupperAdmin.value) {
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('organization_id')
                        .eq('user_id', userId)
                        .single()
                    
                    if (profile?.organization_id) {
                        taskForm.value.organization_id = profile.organization_id
                    }
                }

                // 创建提交用的表单数据，移除user_profiles
                const submitData = { ...taskForm.value }
                delete submitData.assignee
                delete submitData.creator

                if (taskForm.value.id) {
                    // 更新任务
                    const { error } = await supabase
                        .from('tasks')
                        .update({
                            ...submitData,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', taskForm.value.id)

                    if (error) throw error
                    ElMessage.success('更新成功')
                } else {
                    // 创建任务
                    const { error } = await supabase
                        .from('tasks')
                        .insert({
                            ...submitData,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })

                    if (error) throw error
                    ElMessage.success('创建成功')
                }
                dialogVisible.value = false
                fetchTaskList()
            } catch (error) {
                console.error(taskForm.value.id ? '更新失败:' : '创建失败:', error)
                ElMessage.error(taskForm.value.id ? '更新失败' : '创建失败')
            } finally {
                submitting.value = false
            }
        }
    })
}

// 批量指派任务
const handleBatchAssign = async () => {
    if (!assignFormRef.value) return
    await assignFormRef.value.validate(async (valid: boolean) => {
        if (valid) {
            submitting.value = true
            try {
                // 获取组织ID
                let organizationId: string | undefined
                if (!isSupperAdmin.value) {
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('organization_id')
                        .eq('user_id', userId)
                        .single()
                    
                    organizationId = profile?.organization_id
                }

                const tasks = assignForm.value.assigned_to.map(userid => ({
                    title: assignForm.value.title,
                    description: assignForm.value.description,
                    priority: assignForm.value.priority,
                    status: 'pending',
                    due_date: assignForm.value.due_date,
                    assigned_to: userid,
                    user_id: userId,
                    organization_id: organizationId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }))

                const { error } = await supabase
                    .from('tasks')
                    .insert(tasks)

                if (error) throw error

                ElMessage.success(`成功指派任务给 ${tasks.length} 位用户`)
                showAssignDialog.value = false
                fetchTaskList()

                // 清空表单
                assignForm.value = {
                    title: '',
                    description: '',
                    priority: 'medium',
                    due_date: '',
                    assigned_to: []
                }
            } catch (error) {
                console.error('批量指派失败:', error)
                ElMessage.error('批量指派失败')
            } finally {
                submitting.value = false
            }
        }
    })
}

function formatDate(dateString?: string) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
}

function formatDateTime(dateString?: string) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}`
}

function getPriorityType(priority: string) {
    switch (priority) {
        case 'low': return 'info'
        case 'medium': return 'success'
        case 'high': return 'warning'
        case 'urgent': return 'danger'
        default: return 'info'
    }
}

function getPriorityLabel(priority: string) {
    switch (priority) {
        case 'low': return '低'
        case 'medium': return '中'
        case 'high': return '高'
        case 'urgent': return '紧急'
        default: return '未知'
    }
}

function getStatusType(status: string) {
    switch (status) {
        case 'pending': return 'info'
        case 'in_progress': return 'warning'
        case 'completed': return 'success'
        default: return 'info'
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'pending': return '待完成'
        case 'in_progress': return '进行中'
        case 'completed': return '已完成'
        default: return '未知'
    }
}

function getStatusActionLabel(status: string) {
    switch (status) {
        case 'pending': return '开始'
        case 'in_progress': return '完成'
        case 'completed': return '已完成'
        default: return '更新'
    }
}

onMounted(async () => {
    await Promise.all([
        fetchTaskList(),
        fetchUserList()
    ])
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

.el-table :deep(.el-table__row) {
    cursor: pointer;
}

.el-table :deep(.el-table__row:hover) {
    background-color: #f5f7fa;
}

.form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    line-height: 1.4;
}
</style>