<template>
    <div class="layout">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="layout-title">
            <h1 class="title">用户管理</h1>
        </div>

        <!-- 搜索功能 -->
        <el-card shadow="always" style="margin-bottom: 20px;">
            <el-space wrap alignment="start" :size="30">
                <el-select clearable v-model="searchRole" placeholder="选择角色" size="large" style="width: 240px">
                    <el-option label="全部角色" value="all" />
                    <el-option v-for="role in roles" :key="role.role_id" :label="role.name" :value="role.role_id" />
                </el-select>
                <!-- 选择组织 -->
                <el-cascader v-model="selectedOrgId" :options="organizationOptions" :props="cascaderProps" clearable
                    size="large" style="width: 240px" placeholder="选择组织" @change="handleOrgChange" />
                <el-input v-model="searchQuery" style="width: 240px" placeholder="请输入用户名或邮箱" :suffix-icon="Search"
                    size="large" clearable />
                <el-button type="primary" size="large" @click="handleSearch">搜索</el-button>
                <el-button type="success" size="large" @click="handleCreateUser">创建用户</el-button>
            </el-space>
        </el-card>

        <div class="user-content">
            <el-card v-if="hasPermission" style="min-height: 400px;">
                <template #header>
                    <div class="card-header">
                        用户列表
                        <div class="header-actions">
                            <el-button type="danger" :disabled="!selectedUsers.length" @click="handleBatchDelete">
                                批量删除
                            </el-button>
                            <div style="font-size: 14px; color: #909399;">共计{{ pagination.total }}条数据</div>
                        </div>
                    </div>
                </template>

                <el-table v-loading="loading" :data="users" @selection-change="handleSelectionChange">
                    <el-table-column type="selection" width="55" />
                    <el-table-column prop="full_name" label="用户名" />
                    <el-table-column prop="email" label="邮箱" />
                    <el-table-column label="所属组织" min-width="200">
                        <template #default="{ row }">
                            <el-tooltip v-if="row.organization_path" :content="row.organization_path" placement="top"
                                :show-after="500">
                                <span>{{ row.organization_path}}</span>
                            </el-tooltip>
                            <span v-else>-</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="role.role_name" label="角色">
                        <template #default="scope">
                            {{ getRoleName(scope.row.role_id) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="created_at" label="创建时间" width="200">
                        <template #default="scope">
                            {{ formatDate(scope.row.created_at) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200">
                        <template #default="scope">
                            <el-button-group>
                                <el-button type="primary" @click="viewDetails(scope.row)">
                                    查看
                                </el-button>
                                <el-button type="danger" @click="handleDelete(scope.row)">
                                    删除
                                </el-button>
                            </el-button-group>
                        </template>
                    </el-table-column>
                </el-table>
            </el-card>
            <el-empty v-else description="您没有权限查看用户列表" />
            <Pagination :pagination="pagination" @update:pagination="handlePaginationUpdate" />

            <!-- 用户详情对话框 -->
            <el-dialog v-model="detailsDialogVisible" title="用户详情" width="600px" :teleported="false" append-to-body>
                <div>
                    <div v-if="loadingDetails" class="loading-container">
                        <el-icon class="is-loading"><Loading /></el-icon>
                        <span>加载中...</span>
                    </div>
                    <template v-else-if="currentUser">
                        <el-form :model="currentUser" label-width="120px">
                            <el-form-item label="用户名">
                                <el-input v-model="currentUser.full_name" :disabled="!isEditing" />
                            </el-form-item>
                            <el-form-item label="邮箱">
                                <el-input v-model="currentUser.email" disabled />
                            </el-form-item>
                            <el-form-item label="所属组织">
                                <el-tree-select v-model="currentUser.organization_id" :data="organizationTree"
                                    node-key="id" :props="{ label: 'name' }" check-strictly :disabled="!isEditing" />
                                <div class="org-path" v-if="currentUser.organization_path">
                                    <small>组织路径: {{ currentUser.organization_path }}</small>
                                </div>
                                <div class="org-path" v-if="currentUser.organization_parent_id">
                                    <small>上级组织ID: {{ currentUser.organization_parent_id }}</small>
                                </div>
                            </el-form-item>
                            <el-form-item label="角色">
                                <el-select v-model="currentUser.role_id" :disabled="!isEditing">
                                    <el-option v-for="role in roles" :key="role.role_id" :label="role.name"
                                        :value="role.role_id" />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="电话">
                                <el-input v-model="currentUser.phone_number" :disabled="!isEditing" />
                            </el-form-item>
                            <el-form-item label="地址">
                                <el-input v-model="currentUser.address" :disabled="!isEditing" />
                            </el-form-item>
                            <el-form-item label="简介">
                                <el-input type="textarea" v-model="currentUser.bio" :disabled="!isEditing" />
                            </el-form-item>
                        </el-form>

                        <div class="dialog-footer">
                            <el-button v-if="!isEditing" type="primary" @click="startEditing">编辑</el-button>
                            <template v-else>
                                <el-button @click="cancelEditing">取消</el-button>
                                <el-button type="primary" @click="saveChanges">保存</el-button>
                            </template>
                        </div>
                    </template>
                </div>
            </el-dialog>

            <!-- 创建用户对话框 -->
            <el-dialog v-model="createDialogVisible" title="创建用户" width="600px" :teleported="false" append-to-body>
                <div v-if="loadingCreatUser" class="loading-container">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    <span>创建中...</span>
                </div>
                <el-form v-else :model="newUser" :rules="userRules" ref="createForm" label-width="120px">
                    <el-form-item label="用户名" prop="full_name">
                        <el-input v-model="newUser.full_name" />
                    </el-form-item>
                    <el-form-item label="邮箱" prop="email">
                        <el-input v-model="newUser.email" />
                    </el-form-item>
                    <el-form-item label="密码" prop="password">
                        <el-input v-model="newUser.password" type="password" />
                    </el-form-item>
                    <el-form-item label="角色" prop="role_id">
                        <el-select v-model="newUser.role_id">
                            <el-option v-for="role in roles" :key="role.role_id" :label="role.name"
                                :value="role.role_id" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="所属组织" prop="organization_id">
                        <el-tree-select v-model="newUser.organization_id" :data="organizationTree" node-key="id"
                            :props="{ label: 'name' }" check-strictly placeholder="请选择所属组织" />
                    </el-form-item>
                    <el-form-item label="电话">
                        <el-input v-model="newUser.phone_number" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="createDialogVisible = false">取消</el-button>
                        <el-button type="primary" @click="createUser">创建</el-button>
                    </span>
                </template>
                <el-text class="mx-1" type="info" style="font-size: 12px;  ">创建用户后提醒用户登录邮箱确认，发送人：Supabase Auth</el-text>
            </el-dialog>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { Search, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus';
import { supabase } from '@/lib/supabaseClient'
import Breadbcrum from '@/components/system/Breadcrumb.vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'
import { useUserStore } from '@/stores/user'
import { roleService } from '@/stores/roleService'
import type { Role } from '@/stores/roleService'
import { organizationService } from '@/stores/organization';
import type { Organization } from '@/stores/organization';
const breadbcrum = reactive([
    {
        name: '用户管理',
        path: '/system/user'
    }
])

const organizationTree = ref<Organization[]>([]);
const selectedOrgId = ref<string | null>(null);
const selectedOrgName = ref<string>('');

const userStore = useUserStore()
const hasPermission = computed(() => {
    // 检查当前用户是否有管理所有用户的权限（角色ID为0）
    return Number(userStore.roleId) === 0
})

const loading = ref(false)
const loadingDetails = ref(false)
const loadingCreatUser = ref(false)
const users = ref<any[]>([])
const roles = ref<Role[]>([])
const searchQuery = ref('')
const searchRole = ref('')
const detailsDialogVisible = ref(false)
const createDialogVisible = ref(false)
const currentUser = ref<any>(null)
const isEditing = ref(false)
const userBackup = ref<any>(null)
const selectedUsers = ref<any[]>([])

const pagination = reactive<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
})

const newUser = reactive({
    full_name: '',
    email: '',
    password: '',
    role_id: null,
    department: '',
    phone_number: '',
    organization_id: ''
})

const userRules = {
    full_name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    role_id: [{ required: true, message: '请选择角色', trigger: 'change' }],
    organization_id: [{ required: true, message: '请选择所属组织', trigger: 'change' }]
}


const cascaderProps = {
    value: 'id',
    label: 'name',
    children: 'children',
    checkStrictly: true,
    emitPath: true, // 改为 true 以获取完整路径
    expandTrigger: 'hover' // 鼠标悬停时展开
};

// 组织选项数据
const organizationOptions = ref<any[]>([]);

// 将树形数据转换为级联选择器需要的格式
const transformOrganizationTree = (data: Organization[]): Array<{ id: string; name: string; children: any[] }> => {
    return data.map(item => ({
        id: item.id,
        name: item.name,
        children: item.children ? transformOrganizationTree(item.children) : []
    }));
};

// 修改获取组织树的方法
const fetchOrganizationTree = async () => {
    try {
        const treeData = await organizationService.getOrganizationTree();
        organizationTree.value = treeData;
        organizationOptions.value = transformOrganizationTree(treeData);
    } catch (error) {
        console.error('获取组织树失败:', error);
        ElMessage.error('获取组织树失败');
    }
};

// 处理组织选择变化
const handleOrgChange = async (value: string[] | null) => {
    if (value && value.length > 0) {
        const lastId = value[value.length - 1];
        const findOrg = (trees: Organization[], id: string): Organization | null => {
            for (const tree of trees) {
                if (tree.id === id) return tree;
                if (tree.children) {
                    const found = findOrg(tree.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        const selectedOrg = findOrg(organizationTree.value, lastId);
        if (selectedOrg) {
            selectedOrgId.value = selectedOrg.id;
            selectedOrgName.value = selectedOrg.name;
        }
    } else {
        selectedOrgId.value = null;
        selectedOrgName.value = '';
    }
    handleSearch();
};

// 修改 fetchUsers 函数，获取组织路径
const fetchUsers = async () => {
    loading.value = true;
    try {
        // 第一个查询：基于 organization_id
        let baseQuery = supabase
            .from('user_profiles')
            .select(`
                *,
                organization:organizations!organization_id(
                    id,
                    name,
                    parent_id,
                    level
                )
            `, { count: 'exact' });

        // 添加过滤条件
        if (searchQuery.value) {
            baseQuery = baseQuery.or(`full_name.ilike.%${searchQuery.value}%,email.ilike.%${searchQuery.value}%`);
        }

        if (searchRole.value && searchRole.value !== 'all') {
            baseQuery = baseQuery.eq('role_id', searchRole.value);
        }

        if (selectedOrgId.value) {
            // 分别查询 organization_id 和 organization_parent_id
            // 先获取基于 organization_id 的结果
            const { data: orgData, count: orgCount, error: orgError } = await baseQuery
                .eq('organization_id', selectedOrgId.value)
                .order('created_at', { ascending: false })
                .range((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize - 1);
                
            if (orgError) throw orgError;
            
            // 再查询基于 organization_parent_id 的结果
            const parentQuery = supabase
                .from('user_profiles')
                .select(`
                    *,
                    organization:organizations!organization_id(
                        id,
                        name,
                        parent_id,
                        level
                    )
                `, { count: 'exact' });
                
            // 添加相同的过滤条件
            if (searchQuery.value) {
                parentQuery.or(`full_name.ilike.%${searchQuery.value}%,email.ilike.%${searchQuery.value}%`);
            }

            if (searchRole.value) {
                parentQuery.eq('role_id', searchRole.value);
            }
            
            const { data: parentData, count: parentCount, error: parentError } = await parentQuery
                .eq('organization_parent_id', selectedOrgId.value)
                .order('created_at', { ascending: false })
                .range((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize - 1);
                
            if (parentError) throw parentError;
            
            // 合并两个查询结果
            const allData = [...(orgData || []), ...(parentData || [])];
            // 确保没有重复项
            const uniqueData = Array.from(new Map(allData.map(item => [item.id, item])).values());
            
            console.log('组织查询结果:', orgCount, parentCount);
            users.value = uniqueData;
            pagination.total = (orgCount || 0) + (parentCount || 0);
            return;
        }

        // 常规查询（无选定组织）
        const { data, error, count } = await baseQuery
            .order('created_at', { ascending: false })
            .range((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize - 1);

        if (error) throw error;
        
        users.value = data;
        pagination.total = count || 0;
    } catch (error) {
        console.error('获取用户列表失败:', error);
        ElMessage.error('获取用户列表失败');
    } finally {
        loading.value = false;
    }
};

const fetchRoles = async () => {
    try {
        const data = await roleService.getRoles()
        roles.value = data
    } catch (error) {
        console.error('获取角色列表失败:', error)
        ElMessage.error('获取角色列表失败')
    }
}

const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    fetchUsers()
}

const handleSearch = () => {
    pagination.page = 1
    fetchUsers()
}

const handleCreateUser = () => {
    createDialogVisible.value = true
}

// 修改 viewDetails 函数，获取组织路径
const viewDetails = async (user: any) => {
    loadingDetails.value = true;
    try {
        currentUser.value = { ...user };
        userBackup.value = { ...currentUser.value };
        detailsDialogVisible.value = true;
        isEditing.value = false;
    } catch (error) {
        console.error('获取用户详情失败:', error);
        ElMessage.error('获取用户详情失败');
    } finally {
        loadingDetails.value = false;
    }
};

const startEditing = () => {
    isEditing.value = true
}

const cancelEditing = () => {
    currentUser.value = { ...userBackup.value }
    isEditing.value = false
}

// 修改 saveChanges 函数，更新组织信息
const saveChanges = async () => {
    if (!currentUser.value) return;

    try {
        // 获取组织路径和父组织ID
        let organizationPath = '';
        let organizationParentId = null;
        
        if (currentUser.value.organization_id) {
            // 获取完整的组织信息
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('id, name, parent_id, level')
                .eq('id', currentUser.value.organization_id)
                .single();
                
            if (orgError) throw orgError;
            
            // 根据level设置organization_parent_id
            if (orgData) {
                if (orgData.level === 1) {
                    // 如果level为1，parent_id就是自己的id
                    organizationParentId = orgData.id;
                } else {
                    // 如果level不为1，parent_id就是组织的parent_id
                    organizationParentId = orgData.parent_id;
                }
            }
            
            const orgPath = await organizationService.getOrganizationPath(currentUser.value.organization_id);
            organizationPath = orgPath.map(org => org.name).join(' > ');
        }

        const { error } = await supabase
            .from('user_profiles')
            .update({
                full_name: currentUser.value.full_name,
                role_id: currentUser.value.role_id,
                organization_id: currentUser.value.organization_id,
                organization_parent_id: organizationParentId,
                organization_path: organizationPath,
                phone_number: currentUser.value.phone_number,
                address: currentUser.value.address,
                bio: currentUser.value.bio,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', currentUser.value.user_id);

        if (error) throw error;

        ElMessage.success('保存成功');
        isEditing.value = false;
        fetchUsers();
    } catch (error) {
        console.error('保存失败:', error);
        ElMessage.error('保存失败');
    }
};

// 修改 createUser 函数，添加组织信息
const createUser = async () => {
    loadingCreatUser.value = true;
    try {
        // 获取组织路径
        let organizationPath = '';
        let organizationParentId = null;
        
        if (newUser.organization_id) {
            // 获取完整的组织信息
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('id, name, parent_id, level')
                .eq('id', newUser.organization_id)
                .single();
                
            if (orgError) throw orgError;
            
            // 根据level设置organization_parent_id
            if (orgData) {
                if (orgData.level === 1) {
                    // 如果level为1，parent_id就是自己的id
                    organizationParentId = orgData.id;
                } else {
                    // 如果level不为1，parent_id就是组织的parent_id
                    organizationParentId = orgData.parent_id;
                }
            }
            
            const orgPath = await organizationService.getOrganizationPath(newUser.organization_id);
            organizationPath = orgPath.map(org => org.name).join(' > ');
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: newUser.email,
            password: newUser.password
        });

        if (authError) throw authError;

        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                user_id: authData.user!.id,
                full_name: newUser.full_name,
                email: newUser.email,
                role_id: newUser.role_id,
                organization_id: newUser.organization_id,
                organization_parent_id: organizationParentId,
                organization_path: organizationPath,
                phone_number: newUser.phone_number,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (profileError) throw profileError;

        ElMessage.success('用户创建成功');
        createDialogVisible.value = false;
        fetchUsers();

        // 重置表单
        Object.assign(newUser, {
            full_name: '',
            email: '',
            password: '',
            role_id: null,
            organization_id: '',
            phone_number: ''
        });
    } catch (error) {
        console.error('创建用户失败:', error);
        ElMessage.error('创建用户失败');
    } finally {
        loadingCreatUser.value = false;
    }
};

const handleDelete = async (user: any) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除该用户吗？此操作不可恢复。',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        // 使用 RPC 而不是 Admin API
        const { error } = await supabase.rpc('delete_user', {
            user_id_param: user.user_id
        })

        if (error) throw error

        ElMessage.success('删除成功')
        fetchUsers()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除用户失败:', error)
            ElMessage.error('删除失败')
        }
    }
}

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

const getRoleName = (roleId: number) => {
    const role = roles.value.find(r => r.role_id === roleId)
    return role ? role.name : '-'
}

// 处理表格选择变化
const handleSelectionChange = (selection: any[]) => {
    selectedUsers.value = selection;
};

// 批量删除用户
const handleBatchDelete = async () => {
    if (selectedUsers.value.length === 0) return;

    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedUsers.value.length} 个用户吗？此操作不可恢复。`,
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        );

        // 逐个删除用户
        let successCount = 0;
        const errors = [];

        for (const user of selectedUsers.value) {
            const { error } = await supabase.rpc('delete_user', {
                user_id_param: user.user_id
            });

            if (error) {
                errors.push(`${user.full_name}: ${error.message}`);
            } else {
                successCount++;
            }
        }

        if (successCount > 0) {
            ElMessage.success(`成功删除 ${successCount} 个用户`);
        }

        if (errors.length > 0) {
            console.error('部分用户删除失败:', errors);
            ElMessage.warning(`${errors.length} 个用户删除失败`);
        }

        selectedUsers.value = []; // 清空选择
        fetchUsers(); // 重新加载数据
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量删除用户失败:', error);
            ElMessage.error('批量删除失败');
        }
    }
};

onMounted(async () => {
    await Promise.all([fetchUsers(), fetchRoles(), fetchOrganizationTree()]);
})
</script>

<style scoped>
.org-path {
    margin-top: 8px;
    color: #909399;
    font-size: 12px;
}

.el-tooltip__trigger {
    display: inline-flex;
    align-items: center;
}

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

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #909399;
}

.loading-container .el-icon {
    font-size: 24px;
    margin-bottom: 10px;
}

.loading-container span {
    font-size: 14px;
}
</style>