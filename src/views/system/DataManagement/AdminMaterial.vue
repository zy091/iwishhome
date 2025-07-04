<template>
    <div class="layout">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="layout-title">
            <h1 class="title">学习资料管理</h1>
        </div>

        <!-- 搜索功能 -->
        <el-card shadow="always" style="margin-bottom: 20px;">
            <el-space wrap alignment="start" :size="30">
                <el-input v-model="searchQuery" style="width: 240px" placeholder="请输入资料标题" :suffix-icon="Search"
                    size="large" clearable />
                <el-select v-model="typeFilter" placeholder="文件类型" clearable style="width: 180px" size="large">
                    <el-option v-for="type in fileTypes" :key="type.value" :label="type.label" :value="type.value" />
                </el-select>
                <el-select v-model="platformFilter" placeholder="平台" clearable style="width: 180px" size="large">
                    <el-option v-for="platform in platforms" :key="platform.value" :label="platform.label" :value="platform.value" />
                </el-select>
                <el-button type="primary" size="large" @click="searchMaterials">搜索</el-button>
                <el-button type="primary" size="large" @click="addMaterial">资料上传</el-button>
            </el-space>
        </el-card>

        <div class="materials-content">
            <el-card style="min-height: 400px;">
                <template #header>
                    <div class="card-header">
                        学习资料列表
                        <div class="header-actions">
                            <el-button type="danger" :disabled="!selectedMaterials.length" @click="handleBatchDelete">
                                批量删除
                            </el-button>
                            <div style="font-size: 14px; color: #909399;">共计 {{pagination.total}} 条数据</div>
                        </div>
                    </div>
                </template>

                <el-table v-loading="loading" :data="materials" @selection-change="handleSelectionChange">
                    <el-table-column type="selection" width="55" />
                    <el-table-column label="类型" width="80">
                        <template #default="{ row }">
                            <el-image style="width: 30px; height: 30px" :src="getFileIcon(row.type)" fit="contain" />
                        </template>
                    </el-table-column>
                    <el-table-column prop="title" label="标题" />
                    <el-table-column prop="platform" label="平台" />
                    <el-table-column label="所在位置">
                        <template #default="{ row }">
                            <el-tooltip effect="dark" :content="getFolderPath(row)" placement="top">
                                <span>{{ getFolderPathShort(row) }}</span>
                            </el-tooltip>
                        </template>
                    </el-table-column>
                    <el-table-column prop="created_at" label="创建时间" width="180">
                        <template #default="{ row }">
                            {{ new Date(row.created_at).toLocaleString() }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="180">
                        <template #default="{ row }">
                            <el-button-group>
                                <el-button type="primary" @click="showViewDialog(row)">查看</el-button>
                                <el-button type="danger" @click="handleDelete(row)">删除</el-button>
                            </el-button-group>
                        </template>
                    </el-table-column>
                </el-table>
                <el-empty v-if="!loading && materials.length === 0" description="暂无学习资料" />
            </el-card>
            <Pagination :pagination="pagination" @update:pagination="handlePaginationUpdate" />

            <!-- 查看对话框 -->
            <el-dialog title="资料详情" v-model="dialogVisible" width="50%">
                <div class="dialog-content">
                    <div class="material-details">
                        <div class="material-header">
                            <el-image style="width: 40px; height: 40px" :src="getFileIcon(selectedMaterial?.type)" fit="contain" />
                            <h2 class="material-title">{{ selectedMaterial?.title || '无标题' }}</h2>
                        </div>
                        <p><strong>类型:</strong> <span>{{ getTypeName(selectedMaterial?.type) }}</span></p>
                        <p><strong>平台:</strong> <span>{{ getPlatformName(selectedMaterial?.platform) }}</span></p>
                        <p><strong>位置:</strong> <span>{{ getFolderPath(selectedMaterial) }}</span></p>
                        <p><strong>创建时间:</strong> <span>{{ selectedMaterial?.created_at ? new Date(selectedMaterial.created_at).toLocaleString() : '' }}</span></p>
                        <div class="material-actions">
                            <el-button type="primary" @click="openMaterial(selectedMaterial)" v-if="materialContent">
                                {{ selectedMaterial?.type === 'link' ? '打开链接' : '查看文件' }}
                            </el-button>
                        </div>
                    </div>
                </div>
                <template #footer>
                    <el-button @click="dialogVisible = false">关闭</el-button>
                </template>
            </el-dialog>
            <UploadMaterials v-model:visible="addMaterialDialogVisible" @update:visible="handleAddMaterialDialogVisible" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { supabase } from '@/lib/supabaseClient'
import Breadbcrum from '@/components/system/Breadcrumb.vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'
import UploadMaterials from './UploadMaterials.vue'
const breadbcrum = reactive([
    {
        name: '数据管理',
        path: '/system/data-management'
    },
    {
        name: '学习资料管理',
        path: '/system/admin-material'
    }
])

// 状态变量
const loading = ref(false)
const materials = ref<any[]>([])
const dialogVisible = ref(false)
const selectedMaterial = ref<any | null>(null)
const materialContent = ref('')
const searchQuery = ref('')
const typeFilter = ref('')
const platformFilter = ref('')
const selectedMaterials = ref<any[]>([])
const addMaterialDialogVisible = ref(false)

// 文件类型选项
const fileTypes = [
    { value: 'image', label: '图片' },
    { value: 'video', label: '视频' },
    { value: 'ppt', label: 'PPT' },
    { value: 'pdf', label: 'PDF' },
    { value: 'link', label: '链接' },
    { value: 'txt', label: '文本' },
    { value: 'word', label: 'Word' },
    { value: 'excel', label: 'Excel' },
    { value: 'zip', label: '压缩包' }
]

// 平台选项
const platforms = [
    { value: 'google', label: 'Google' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'microsoft', label: 'Microsoft' },
    { value: 'meta', label: 'Meta' },
    { value: 'other', label: 'Other' }
]

// 分页设置
const pagination = reactive<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
})

const addMaterial = () => {
    addMaterialDialogVisible.value = true
}

const handleAddMaterialDialogVisible = (visible: boolean) => {
    addMaterialDialogVisible.value = visible
    if (!visible) {
        searchMaterials()
    }
}

// 分页更新处理
const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    searchMaterials()
}

// 搜索学习资料
const searchMaterials = async () => {
    loading.value = true
    try {
        // 构建查询
        let query = supabase
            .from('study_materials')
            .select(`
                *,
                platform_info:ad_platforms(name),
                category_info:ad_categories(name),
                subcategory_info:ad_subcategories(name),
                topic_info:ad_topics(name)
            `, { count: 'exact' })
        
        // 标题搜索
        if (searchQuery.value) {
            query = query.ilike('title', `%${searchQuery.value}%`)
        }
        
        // 类型过滤
        if (typeFilter.value) {
            query = query.eq('type', typeFilter.value)
        }
        
        // 平台过滤
        if (platformFilter.value) {
            query = query.eq('platform', platformFilter.value)
        }
        
        // 执行分页查询
        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize - 1)
        
        if (error) throw error
        
        materials.value = data
        pagination.total = count || 0
    } catch (error) {
        ElMessage.error('搜索学习资料失败')
        console.error(error)
    } finally {
        loading.value = false
    }
}

// 查看资料详情
const showViewDialog = async (material: any) => {
    selectedMaterial.value = material
    dialogVisible.value = true
    
    // 获取资料内容
    try {
        const { data, error } = await supabase
            .from('material_contents')
            .select('*')
            .eq('material_id', material.id)
            .single()
            
        if (error) throw error
        
        materialContent.value = data.content
    } catch (error) {
        console.error('获取资料内容失败:', error)
        materialContent.value = ''
    }
}

// 打开资料
const openMaterial = (material: any) => {
    if (materialContent.value) {
        window.open(materialContent.value, '_blank')
    }
}

// 删除资料
const handleDelete = async (material: any) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除资料 "${material.title}" 吗？此操作不可恢复。`,
            '警告',
            { type: 'warning' }
        )
        
        // 先删除内容记录
        const { error: contentError } = await supabase
            .from('material_contents')
            .delete()
            .eq('material_id', material.id)
            
        if (contentError) throw contentError
        
        // 再删除资料记录
        const { error: materialError } = await supabase
            .from('study_materials')
            .delete()
            .eq('id', material.id)
            
        if (materialError) throw materialError
        
        ElMessage.success('删除成功')
        searchMaterials()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除资料失败:', error)
            ElMessage.error('删除失败')
        }
    }
}

// 批量删除
const handleBatchDelete = async () => {
    if (selectedMaterials.value.length === 0) return
    
    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedMaterials.value.length} 个资料吗？此操作不可恢复。`,
            '警告',
            { type: 'warning' }
        )
        
        // 获取所有选中资料的ID
        const materialIds = selectedMaterials.value.map(m => m.id)
        
        // 先删除内容记录
        const { error: contentError } = await supabase
            .from('material_contents')
            .delete()
            .in('material_id', materialIds)
            
        if (contentError) throw contentError
        
        // 再删除资料记录
        const { error: materialError } = await supabase
            .from('study_materials')
            .delete()
            .in('id', materialIds)
            
        if (materialError) throw materialError
        
        ElMessage.success(`成功删除 ${selectedMaterials.value.length} 个资料`)
        selectedMaterials.value = []
        searchMaterials()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量删除资料失败:', error)
            ElMessage.error('批量删除失败')
        }
    }
}

// 表格选择变化处理
const handleSelectionChange = (selection: any[]) => {
    selectedMaterials.value = selection
}

// 获取文件图标
const getFileIcon = (type: string) => {
    return new URL(`/src/assets/icons/${type || 'file'}.png`, import.meta.url).href
}

// 获取类型名称
const getTypeName = (type: string) => {
    const found = fileTypes.find(t => t.value === type)
    return found?.label || type
}

// 获取平台名称
const getPlatformName = (platform: string) => {
    const found = platforms.find(p => p.value === platform)
    return found?.label || platform
}

// 获取完整文件夹路径
const getFolderPath = (material: any) => {
    if (!material) return ''
    
    const parts = []
    
    if (material.platform_info?.name) parts.push(material.platform_info.name)
    if (material.category_info?.name) parts.push(material.category_info.name)
    if (material.subcategory_info?.name) parts.push(material.subcategory_info.name)
    if (material.topic_info?.name) parts.push(material.topic_info.name)
    
    return parts.join(' > ') || '根目录'
}

// 获取缩短的文件夹路径
const getFolderPathShort = (material: any) => {
    const path = getFolderPath(material)
    return path.length > 30 ? path.substring(0, 27) + '...' : path
}

onMounted(() => {
    searchMaterials()
})
</script>

<style scoped>
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.dialog-content {
    padding: 20px;
}

.material-details {
    line-height: 1.6;
    font-size: 16px;
}

.material-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
}

.material-title {
    margin: 0;
    color: #409EFF;
}

.material-details p {
    margin: 10px 0;
}

.material-details strong {
    font-weight: bold !important;
}

.material-actions {
    margin-top: 20px;
}
</style>