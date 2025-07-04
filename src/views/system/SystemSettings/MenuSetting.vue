<template>
    <div class="layout">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="layout-title">
            <h1 class="title">菜单管理</h1>
        </div>

        <!-- 搜索功能 -->
        <el-card shadow="always" style="margin-bottom: 20px;">
            <el-space wrap alignment="start" :size="30">
                <el-input v-model="searchQuery" style="width: 240px" placeholder="请输入菜单名称" :suffix-icon="Search"
                    size="large" clearable />
                <el-button type="primary" size="large" @click="handleSearch">搜索</el-button>
                <el-button type="success" size="large" @click="handleAdd">添加菜单</el-button>
            </el-space>
        </el-card>

        <div class="menu-content">
            <el-card style="min-height: 400px;">
                <template #header>
                    <div class="card-header">
                        菜单列表
                        <div class="header-actions">
                            <div style="font-size: 14px; color: #909399;">共计{{ pagination.total }}条数据</div>
                        </div>
                    </div>
                </template>

                <el-table v-loading="loading" :data="paginatedMenuList" row-key="id">
                    <el-table-column prop="name" label="菜单名称" width="180" />
                    <el-table-column prop="path" label="路由路径" width />
                    <el-table-column prop="parent_id" label="父级菜单" width="120" >
                        <template #default="{ row }">
                            {{ row.parent_id ? menuList.find(item => item.order_index === row.parent_id)?.name : '顶级菜单' }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="icon" label="图标" width="120">
                        <template #default="{ row }">
                            <el-icon>
                                <component :is="row.icon" />
                            </el-icon>
                        </template>
                    </el-table-column>
                    <el-table-column prop="order_index" label="排序" width="150" />
                    <el-table-column label="角色权限">
                        <template #default="{ row }">
                            <el-tag v-for="role in row.role_ids" :key="role" class="mx-1">
                                {{ roleList.find(item => item.role_id === role)?.name }}
                            </el-tag>
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

            <!-- 添加/编辑菜单对话框 -->
            <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
                <el-form :model="menuForm" :rules="rules" ref="menuFormRef" label-width="100px">
                    <el-form-item label="菜单名称" prop="name">
                        <el-input v-model="menuForm.name" />
                    </el-form-item>
                    <el-form-item label="路由路径" prop="path">
                        <el-input v-model="menuForm.path" />
                    </el-form-item>
                    <el-form-item label="图标" prop="icon">
                        <el-input v-model="menuForm.icon" />
                    </el-form-item>
                    <el-form-item label="父级菜单" prop="parent_id">
                        <el-select v-model="menuForm.parent_id" clearable>
                            <el-option v-for="item in menuOptions" :key="item.order_index" :label="item.name" :value="item.order_index" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="排序" prop="order_index">
                        <el-input-number v-model="menuForm.order_index" :min="0" />
                    </el-form-item>
                    <el-form-item label="角色权限" prop="role_ids">
                        <el-select v-model="menuForm.role_ids" multiple collapse-tags collapse-tags-tooltip>
                            <el-option v-for="role in roleList" :key="role.role_id" :label="role.name" :value="role.role_id" />
                        </el-select>
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
import { getMenuList, createMenu, updateMenu, deleteMenu } from '@/api/menu'
import { getRoleList } from '@/api/role'
import Breadbcrum from '@/components/system/Breadcrumb.vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'
import {
    Document,
    Menu as IconMenu,
    Location,
    Setting,
    CirclePlus,
    Briefcase,
    UserFilled,
    HomeFilled,
    ChromeFilled,
    SetUp
} from '@element-plus/icons-vue'
interface Menu {
    id?: string | number
    name: string
    path: string
    icon: string
    parent_id: number | null
    order_index: number
    role_ids: number[]
}

interface Role {
    role_id: number
    name: string
}

const breadbcrum = [
    {
        name: '菜单管理',
        path: '/system/menu-setting'
    }
]

const loading = ref(false)
const menuList = ref<Menu[]>([])
const roleList = ref<Role[]>([])
const searchQuery = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('')
const menuFormRef = ref<any>(null)

const pagination = reactive<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
})

const menuForm = ref<Menu>({
    name: '',
    path: '',
    icon: '',
    parent_id: null,
    order_index: 0,
    role_ids: []
})

const rules = {
    name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
    path: [{ required: true, message: '请输入路由路径', trigger: 'blur' }]
}

const menuOptions = computed(() => {
    return menuList.value.map(item => ({
        order_index: item.order_index,
        name: item.name
    }))
})

const originalMenuList = ref<Menu[]>([])

const paginatedMenuList = computed(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return menuList.value.slice(start, end)
})

// 获取菜单列表
const fetchMenuList = async () => {
    loading.value = true
    try {
        const res = await getMenuList()
        originalMenuList.value = res.data
        menuList.value = res.data
        pagination.total = res.data.length
    } catch (error) {
        console.error('获取菜单列表失败:', error)
        ElMessage.error('获取菜单列表失败')
    } finally {
        loading.value = false
    }
}

// 获取角色列表
const fetchRoleList = async () => {
    try {
        const res = await getRoleList()
        roleList.value = res.data
        console.log(roleList.value)
    } catch (error) {
        console.error('获取角色列表失败:', error)
        ElMessage.error('获取角色列表失败')
    }
}

const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    fetchMenuList()
}

const handleSearch = () => {
    pagination.page = 1
    if (!searchQuery.value) {
        menuList.value = originalMenuList.value
        pagination.total = originalMenuList.value.length
        return
    }
    menuList.value = originalMenuList.value.filter(
        item =>
            item.name.includes(searchQuery.value) ||
            (item.path && item.path.includes(searchQuery.value))
    )
    pagination.total = menuList.value.length
}

// 添加菜单
const handleAdd = () => {
    dialogTitle.value = '添加菜单'
    menuForm.value = {
        name: '',
        path: '',
        icon: '',
        parent_id: null,
        order_index: 0,
        role_ids: []
    }
    dialogVisible.value = true
}

// 编辑菜单
const handleEdit = (row: Menu) => {
    dialogTitle.value = '编辑菜单'
    menuForm.value = { ...row }
    dialogVisible.value = true
}

// 删除菜单
const handleDelete = async (row: Menu) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除该菜单吗？此操作不可恢复。',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        await deleteMenu(Number(row.id))
        ElMessage.success('删除成功')
        fetchMenuList()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除菜单失败:', error)
            ElMessage.error('删除失败')
        }
    }
}

// 提交表单
const handleSubmit = async () => {
    if (!menuFormRef.value) return
    await menuFormRef.value.validate(async (valid: boolean) => {
        if (valid) {
            try {
                if (menuForm.value.id) {
                    await updateMenu(Number(menuForm.value.id), menuForm.value)
                    ElMessage.success('更新成功')
                } else {
                    await createMenu(menuForm.value)
                    ElMessage.success('创建成功')
                }
                dialogVisible.value = false
                fetchMenuList()
            } catch (error) {
                console.error(menuForm.value.id ? '更新失败:' : '创建失败:', error)
                ElMessage.error(menuForm.value.id ? '更新失败' : '创建失败')
            }
        }
    })
}

onMounted(async () => {
    await Promise.all([fetchMenuList(), fetchRoleList()])
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

.mx-1 {
    margin: 0 4px;
}
</style>
