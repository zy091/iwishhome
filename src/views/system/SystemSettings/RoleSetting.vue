<template>
    <div class="layout">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="layout-title">
            <h1 class="title">角色管理</h1>
        </div>

        <!-- 搜索功能 -->
        <el-card shadow="always" style="margin-bottom: 20px;">
            <el-space wrap alignment="start" :size="30">
                <el-input v-model="searchQuery" style="width: 240px" placeholder="请输入角色名称" :suffix-icon="Search"
                    size="large" clearable />
                <el-button type="primary" size="large" @click="handleSearch">搜索</el-button>
                <el-button type="success" size="large" @click="handleAdd">添加角色</el-button>
            </el-space>
        </el-card>

        <div class="role-content">
            <el-card style="min-height: 400px;">
                <template #header>
                    <div class="card-header">
                        角色列表
                        <div class="header-actions">
                            <div style="font-size: 14px; color: #909399;">共计{{ pagination.total }}条数据</div>
                        </div>
                    </div>
                </template>

                <el-table v-loading="loading" :data="paginatedRoleList" row-key="role_id">
                    <el-table-column prop="role_id" label="ID" width="80" />
                    <el-table-column prop="name" label="角色名称" width="180" />
                    <el-table-column prop="description" label="描述" />
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
                                <el-button type="danger" @click="handleDelete(row)" v-if="Number(row.role_id) !== 0">
                                    删除
                                </el-button>
                            </el-button-group>
                        </template>
                    </el-table-column>
                </el-table>
            </el-card>
            <Pagination :pagination="pagination" @update:pagination="handlePaginationUpdate" />

            <!-- 添加/编辑角色对话框 -->
            <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
                <el-form :model="roleForm" :rules="rules" ref="roleFormRef" label-width="100px">
                    <el-form-item v-if="dialogTitle === '编辑角色'" label="角色ID" prop="role_id">
                        <el-input v-model="roleForm.role_id" disabled />
                    </el-form-item>
                    <el-form-item v-else label="角色ID" prop="role_id">
                        <el-input v-model="roleForm.role_id" />
                    </el-form-item>
                    <el-form-item label="角色名称" prop="name">
                        <el-input v-model="roleForm.name" />
                    </el-form-item>
                    <el-form-item label="描述" prop="description">
                        <el-input v-model="roleForm.description" />
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
import { ref, onMounted, computed, reactive } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Breadbcrum from '@/components/system/Breadcrumb.vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'
import { getRoleList, createRole, updateRole, deleteRole } from '@/api/role'

interface Role {
    id?: string | number
    role_id?:  string | number
    name: string
    mark:[]
    description: string
    created_at?: string
    updated_at?: string
}

const breadbcrum = [
    {
        name: '角色管理',
        path: '/system/role-setting'
    }
]

const loading = ref(false)
const roleList = ref<Role[]>([])
const searchQuery = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('')
const roleFormRef = ref<any>(null)

const pagination = reactive<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
})

const roleForm = ref<Role>({
    role_id: '',
    name: '',
    mark:[],
    description: ''
})

const rules = {
    role_id: [{ required: true, message: '请输入角色ID', trigger: 'blur' }],
    name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
    description: [{ required: true, message: '请输入描述', trigger: 'blur' }]
}

const originalRoleList = ref<Role[]>([])

const paginatedRoleList = computed(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return roleList.value.slice(start, end)
})

// 获取角色列表
const fetchRoleList = async () => {
    loading.value = true
    try {
        const res = await getRoleList()
        originalRoleList.value = res.data
        roleList.value = res.data
        pagination.total = res.data.length
    } catch (error) {
        console.error('获取角色列表失败:', error)
        ElMessage.error('获取角色列表失败')
    } finally {
        loading.value = false
    }
}

const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    fetchRoleList()
}

const handleSearch = () => {
    pagination.page = 1
    if (!searchQuery.value) {
        roleList.value = originalRoleList.value
        pagination.total = originalRoleList.value.length
        return
    }
    roleList.value = originalRoleList.value.filter(
        item => item.name.includes(searchQuery.value)
    )
    pagination.total = roleList.value.length
}

// 添加角色
const handleAdd = () => {
    dialogTitle.value = '添加角色'
    roleForm.value = {
        role_id: '',
        name: '',
        mark:[],
        description: ''
    }
    dialogVisible.value = true
}

// 编辑角色
const handleEdit = (row: Role) => {
    dialogTitle.value = '编辑角色'
    roleForm.value = { ...row }
    dialogVisible.value = true
}

// 删除角色
const handleDelete = async (row: Role) => {
    if (Number(row.role_id) === 0) {
        ElMessage.warning('系统内置角色不允许删除！')
        return
    }
    try {
        await ElMessageBox.confirm(
            '确定要删除该角色吗？此操作不可恢复。',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        await deleteRole(Number(row.role_id))
        ElMessage.success('删除成功')
        fetchRoleList()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除角色失败:', error)
            ElMessage.error('删除失败')
        }
    }
}

// 提交表单
const handleSubmit = async () => {
    if (!roleFormRef.value) return
    await roleFormRef.value.validate(async (valid: boolean) => {
        if (valid) {
            try {
                if (roleForm.value.id) {
                    await updateRole(Number(roleForm.value.role_id), roleForm.value)
                    ElMessage.success('更新成功')
                } else {
                    await createRole(roleForm.value)
                    ElMessage.success('创建成功')
                }
                dialogVisible.value = false
                fetchRoleList()
            } catch (error) {
                console.error(roleForm.value.role_id ? '更新失败:' : '创建失败:', error)
                ElMessage.error(roleForm.value.role_id ? '更新失败' : '创建失败')
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

onMounted(async () => {
    await fetchRoleList()
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