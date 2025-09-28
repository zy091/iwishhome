<template>
    <div class="layout">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="layout-title">
            <h1 class="title">学习资料管理</h1>
        </div>

        <!-- 标签页切换 -->
        <el-tabs v-model="activeTab" class="tabs-container">
            <el-tab-pane label="资料管理" name="materials">
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
                            <el-table-column prop="platform" label="平台" >
                                <template #default="{ row }"> 
                                    {{ getPlatformName(row.platform) }}
                                </template>
                            </el-table-column>
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
                            <el-table-column label="操作" width="180" fixed="right">
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
                </div>
            </el-tab-pane>

            <el-tab-pane label="文件夹管理" name="folders">
                <!-- 文件夹管理面板 -->
                <el-card style="margin-bottom: 20px;">
                    <el-space wrap alignment="start" :size="30">
                        <el-input 
                            v-model="folderSearchQuery" 
                            placeholder="搜索文件夹名称" 
                            clearable 
                            style="width: 240px" 
                            size="large"
                        
                            @keyup.enter="searchFolders"
                            :suffix-icon="Search"
                        />
                        <el-button type="primary" size="large" @click="searchFolders">搜索</el-button>
                        <el-button type="primary" size="large" @click="showCreateFolderDialog">新建文件夹</el-button>
                    </el-space>
                </el-card>

                <!-- 面包屑导航 -->
                <el-card class="folder-breadcrumb" style="margin-bottom: 20px;">
                    <!-- 返回上一级 -->
                    <el-text @click="navigateToParent()" style="cursor: pointer; margin-right: 10px;">
                        <el-icon :size="16" color="#000">
                            <ArrowLeft />
                        </el-icon>
                    </el-text>
                    <!-- 返回根目录 -->
                    <el-text @click="navigateToRoot()" style="cursor: pointer; margin-right: 10px;">
                        <el-icon :size="16" color="#000">
                            <House />
                        </el-icon>
                    </el-text>
                    <el-breadcrumb separator="/">
                        <!-- <el-breadcrumb-item :to="{ path: '' }" @click="navigateToRoot()">
                            {{ currentPlatformName || "根目录" }} 
                        </el-breadcrumb-item> -->
                        <el-breadcrumb-item v-for="item in currentPath" :key="item.id"
                            @click="navigateToLevel(item)">
                            {{ item.name }}
                        </el-breadcrumb-item>
                    </el-breadcrumb>
                </el-card>

                <!-- 文件夹列表 -->
                <el-card v-loading="folderLoading" style="min-height: 400px;">
                    <template #header>
                        <div class="card-header">
                            文件夹列表
                        </div>
                    </template>

                    <el-table :data="folderItems" style="width: 100%">
                        <el-table-column label="" width="60">
                            <template #default="{ row }">
                                <el-image style="width: 24px; height: 24px"
                                    :src="row.is_folder ? getFolderIcon() : getFileIcon(row.type)"
                                    fit="contain" />
                            </template>
                        </el-table-column>
                        <el-table-column prop="name" label="名称">
                            <template #default="{ row }">
                                <el-text class="folder-title" @click="handleFolderItemClick(row)">
                                    {{ row.is_folder ? row.name : row.title }}
                                </el-text>
                            </template>
                        </el-table-column>
                        <el-table-column prop="path_info" label="路径" v-if="!!folderSearchQuery.trim()">
                            <template #default="{ row }">
                                <el-tooltip effect="dark" :content="row.path_info || ''" placement="top" v-if="row.path_info">
                                    <span>{{ row.path_info?.length > 30 ? row.path_info.substring(0, 27) + '...' : row.path_info }}</span>
                                </el-tooltip>
                            </template>
                        </el-table-column>
                        <el-table-column prop="type" label="类型">
                            <template #default="{ row }">
                                {{ row.is_folder ? '文件夹' : getTypeName(row.type) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="created_at" label="创建时间" width="180">
                            <template #default="{ row }">
                                {{ formatDate(row.created_at) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="300">
                            <template #default="{ row }">
                                <el-button-group>
                                    <el-button type="primary" @click="handleFolderItemClick(row)">
                                        {{ row.is_folder ? '打开' : '查看' }}
                                    </el-button>
                                    <el-button type="danger" @click="handleFolderItemDelete(row)" :disabled="row.is_folder ? false : false">
                                        删除
                                    </el-button>
                                    <el-button v-if="row.is_folder" type="success" @click="showCreateFolderDialog(row)">
                                        新建
                                    </el-button>
                                </el-button-group>
                            </template>
                        </el-table-column>
                    </el-table>
                    <el-empty v-if="!folderLoading && folderItems.length === 0" description="暂无数据" />
                </el-card>
            </el-tab-pane>
        </el-tabs>

        <!-- 查看资料对话框 -->
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
                        <el-button type="primary" @click="viewMaterial">
                            {{ getPreviewButtonText() }}
                        </el-button>
                    </div>
                    </div>
            </div>
            <template #footer>
                <el-button @click="dialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>

        <!-- 文件预览对话框 -->
        <el-dialog v-model="previewDialogVisible" title="文件预览" width="80%" destroy-on-close>
            <div class="material-preview">
                <template v-if="isImageMaterial">
                    <img :src="materialContent" class="material-image" @click="openFullscreen" />
                </template>
                <template v-else-if="isPdfMaterial">
                    <iframe :src="materialContent" class="material-frame"></iframe>
                </template>
                <template v-else-if="isWordMaterial">
                    <iframe :src="wordPreviewUrl" class="word-preview-frame"></iframe>
                </template>
                <template v-else-if="isExcelMaterial">
                    <iframe :src="wordPreviewUrl" class="word-preview-frame"></iframe>
                </template>
                <template v-else-if="isLinkMaterial">
                    <div class="link-preview">
                        <p>链接地址：{{ materialContent }}</p>
                        <el-button type="primary" @click="openLink">打开链接</el-button>
                    </div>
                </template>
                <template v-else-if="isVideoMaterial">
                    <div class="video-preview">
                        <video :src="materialContent" controls class="material-video"></video>
                </div>
                </template>
                <template v-else-if="isTextMaterial">
                    <div class="text-preview">
                        <div v-html="materialContent" class="text-content"></div>
                    </div>
                </template>
                <template v-else-if="isMd">
                    <div class="markdown-preview">
                        <div class="markdown-toolbar">
                            <el-button-group>
                                <el-button :type="markdownViewMode === 'preview' ? 'primary' : ''" @click="markdownViewMode = 'preview'">
                                    预览
                                </el-button>
                                <el-button :type="markdownViewMode === 'edit' ? 'primary' : ''" @click="markdownViewMode = 'edit'">
                                    编辑
                                </el-button>
                                <el-button :type="markdownViewMode === 'split' ? 'primary' : ''" @click="markdownViewMode = 'split'">
                                    分屏
                                </el-button>
                            </el-button-group>
                            <el-button type="success" @click="saveMarkdown" :loading="savingMarkdown">
                                保存
                            </el-button>
                        </div>
                        
                        <div class="markdown-container" :class="markdownViewMode">
                            <!-- 编辑器区域 -->
                            <div v-if="markdownViewMode === 'edit' || markdownViewMode === 'split'" class="markdown-editor">
                                <el-input
                                    v-model="markdownContent"
                                    type="textarea"
                                    :rows="20"
                                    placeholder="请输入Markdown内容..."
                                    class="markdown-textarea"
                                />
                            </div>
                            
                            <!-- 预览区域 -->
                            <div v-if="markdownViewMode === 'preview' || markdownViewMode === 'split'" class="markdown-preview-content">
                                <div v-html="renderedMarkdown" class="markdown-html"></div>
                            </div>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="material-download">
                        <p>无法预览此类型的文件，请下载后查看</p>
                        <el-button type="primary" @click="downloadMaterial">下载文件</el-button>
                    </div>
                </template>
            </div>
            <template #footer>
                <el-button @click="previewDialogVisible = false">关闭</el-button>
                <el-button v-if="isImageMaterial || isPdfMaterial || isExcelMaterial" type="primary" @click="openFullscreen">
                    全屏查看
                </el-button>
            </template>
        </el-dialog>

        <!-- 全屏预览对话框 -->
        <el-dialog v-model="fullscreenVisible" title="全屏预览" width="100%" top="0" :show-close="true" destroy-on-close class="fullscreen-dialog">
            <div class="fullscreen-preview">
                <template v-if="isImageMaterial">
                    <img :src="materialContent" class="fullscreen-image" />
                </template>
                <template v-else-if="isPdfMaterial">
                    <iframe :src="materialContent" class="fullscreen-frame"></iframe>
                </template>
                <template v-else-if="isExcelMaterial">
                    <iframe :src="wordPreviewUrl" class="fullscreen-frame"></iframe>
                </template>
            </div>
        </el-dialog>

        <!-- 上传资料对话框 -->
        <UploadMaterials v-model:visible="addMaterialDialogVisible" @update:visible="handleAddMaterialDialogVisible" />

        <!-- 创建文件夹对话框 -->
        <el-dialog v-model="createFolderDialogVisible" :title="parentFolder ? `在 '${parentFolder.name || parentFolder.title || ''}' 下创建文件夹` : '创建文件夹'" width="30%">
            <el-form :model="newFolder" label-width="80px">
                <el-form-item label="名称">
                    <el-input v-model="newFolder.name" placeholder="请输入文件夹名称"></el-input>
                </el-form-item>
                <!-- 仅当从顶部按钮创建时显示位置选择器 -->
                <el-form-item label="所在位置" v-if="!parentFolder">
                    <el-cascader v-model="newFolder.folderPath"
                        :options="folderCreateOptions" :props="{
                            checkStrictly: true,
                            emitPath: true, 
                            value: 'id',
                            label: 'name',
                            children: 'children'
                        }" clearable placeholder="请选择文件夹位置" style="width: 100%">
                        <template #default="{ node, data }">
                            <span>{{ data.name }}</span>
                            <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
                        </template>
                        <template #empty>
                            <el-empty description="加载中..." />
                        </template>
                    </el-cascader>
                </el-form-item>
                <!-- 当通过表格项的新建按钮创建时显示所在位置信息 -->
                <el-form-item label="所在位置" v-else-if="parentFolder">
                    <el-tag type="info">{{ parentFolder.is_folder ? parentFolder.name : parentFolder.title }}</el-tag>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="createFolderDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="createFolder">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch, onBeforeUnmount } from 'vue'
import { Search, ArrowLeft, House } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { supabase } from '@/lib/supabaseClient'
import Breadbcrum from '@/components/system/Breadcrumb.vue'
import Pagination from '@/components/system/Pagination.vue'
import type { PaginationType } from '@/types/pagination'
import UploadMaterials from './UploadMaterials.vue'
import { Jodit } from 'jodit'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import { marked } from 'marked'
import hljs from 'highlight.js'

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

// 标签页状态
const activeTab = ref('materials')

// 资料管理状态
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
const previewDialogVisible = ref(false)  // 文件预览对话框
const fullscreenVisible = ref(false)  // 全屏预览对话框
const wordPreviewUrl = ref('')  // Word预览URL

// Markdown相关变量
const markdownViewMode = ref<'preview' | 'edit' | 'split'>('preview')
const markdownContent = ref('')
const savingMarkdown = ref(false)

// 文件夹管理状态
const folderLoading = ref(false)
const selectedPlatform = ref('')
const folderSearchQuery = ref('')
const currentPlatformId = ref<string | null>(null)
const currentPlatformName = ref<string | null>(null)
const currentLevel = ref<string | null>(null)
const currentPath = ref<any[]>([])
const folderItems = ref<any[]>([])
const createFolderDialogVisible = ref(false)
const parentFolder = ref<any | null>(null)
const folderCreateOptions = ref<any[]>([])

// 缓存机制，减少重复请求
const folderCache = ref<Map<string, any[]>>(new Map())
const materialCache = ref<Map<string, any[]>>(new Map())
const deletePermissionCache = ref<Map<string, boolean>>(new Map())
// 添加文件夹选项缓存
const folderOptionsCache = ref<Map<string, any[]>>(new Map())

// 文件类型判断
const isImageMaterial = computed(() => {
    return selectedMaterial.value?.type === 'image'
})

const isPdfMaterial = computed(() => {
    return selectedMaterial.value?.type === 'pdf' 
})

const isWordMaterial = computed(() => {
    return selectedMaterial.value?.type === 'word' 
})

const isLinkMaterial = computed(() => {
    return selectedMaterial.value?.type === 'link'
})

const isVideoMaterial = computed(() => {
    return selectedMaterial.value?.type === 'video'
})

const isTextMaterial = computed(() => {
    return selectedMaterial.value?.type === 'txt'
})
const isMd = computed(() => {
    return selectedMaterial.value?.type === 'md'
})

const isExcelMaterial = computed(() => {
    return selectedMaterial.value?.type === 'excel'
})

// 配置marked
marked.setOptions({
    highlight: function(code: string, lang: string) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value
            } catch (err) {
                console.error('代码高亮错误:', err)
            }
        }
        return hljs.highlightAuto(code).value
    },
    breaks: true,
    gfm: true
} as any)

// 渲染markdown内容
const renderedMarkdown = computed(() => {
    if (!markdownContent.value) return ''
    return marked(markdownContent.value)
})

// 获取预览按钮文字
const getPreviewButtonText = () => {
    if (isImageMaterial.value) return '预览图片'
    if (isPdfMaterial.value) return '预览PDF'
    if (isWordMaterial.value) return '预览Word'
    if (isExcelMaterial.value) return '预览Excel'
    if (isLinkMaterial.value) return '打开链接'
    if (isVideoMaterial.value) return '预览视频'
    if (isTextMaterial.value) return '预览文本'
    if (isMd.value) return '预览Markdown'
    return '查看文件'
}

const newFolder = reactive({
    name: '',
    platform: '',
    folderPath: [] as string[]
})

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
    { value: 'zip', label: '压缩包' },
    { value: 'md', label: 'Markdown' }
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

const editor = ref<HTMLElement | null>(null)
let joditInstance: any = null

// ========== 资料管理功能 ==========

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
    
    // 如果有之前的编辑器实例，先销毁
    if (joditInstance) {
        joditInstance.destruct()
        joditInstance = null
    }
    
    // 提前初始化编辑器
    if (material.type !== 'link' && material.type !== 'video' && material.type !== 'pdf' && editor.value) {
        joditInstance = Jodit.make(editor.value, {
            height: 500,
            readonly: true,
            toolbar: false,
            statusbar: false,
            language: 'zh_cn',
            uploader: {
                insertImageAsBase64URI: true
            }
        })
        
        // 显示加载提示
        joditInstance.value = '<div style="text-align: center; padding: 50px;">文件加载中，请稍候...</div>'
    }
    
    try {
        // 获取资料内容
        const { data, error } = await supabase
            .from('material_contents')
            .select('*')
            .eq('material_id', material.id)
            .single()
            
        if (error) throw error
        
        console.log('Material content data:', data)
        
        // 如果是链接类型，直接使用链接内容
        if (material.type === 'link' || material.type === 'video' || material.type === 'pdf' || material.type === 'ppt' || material.type === 'word' || material.type === 'excel' ) {
            materialContent.value = data.content
        } else {
            // 从 storage 获取文件内容
            const filePath = data.content
            console.log('Attempting to fetch file from path:', filePath)
            const path = data.content.split('/materials/').pop()
            try {
                if (material.type === 'txt') {
                    // 文本文件处理
                    const { data: fileData, error: fileError } = await supabase
                        .storage
                        .from('materials')
                        .download(path)
                        
                    if (fileError) throw fileError
                    
                    const text = await fileData.text()
                    materialContent.value = text
                    
                    // 直接更新编辑器内容
                    if (joditInstance) {
                        joditInstance.value = materialContent.value
                    }
                } else if (material.type === 'md') {
                    // Markdown文件处理
                    const { data: fileData, error: fileError } = await supabase
                        .storage
                        .from('materials')
                        .download(path)
                        
                    if (fileError) throw fileError
                    
                    const text = await fileData.text()
                    materialContent.value = text
                    markdownContent.value = text
                    
                    // 重置markdown视图模式
                    markdownViewMode.value = 'preview'
                } else if (material.type === 'image') {
                    // 图片类型
                    const { data: { publicUrl } } = await supabase
                        .storage
                        .from('materials')
                        .getPublicUrl(path)
                    
                    materialContent.value = publicUrl
                    
                    // 直接更新编辑器内容
                    if (joditInstance) {
                        joditInstance.value = `<img src="${publicUrl}" alt="${material.title}" style="max-width: 100%;">`
                    }
                } else {
                    // 其他类型文件使用公共URL
                    const { data: { publicUrl } } = await supabase
                        .storage
                        .from('materials')
                        .getPublicUrl(path)
                    
                    materialContent.value = publicUrl
                    
                    // 直接更新编辑器内容
                    if (joditInstance) {
                        joditInstance.value = `
                            <div style="text-align: center; padding: 20px;">
                                <p>此文件类型不支持直接预览</p>
                                <a href="${publicUrl}" target="_blank" class="el-button el-button--primary">
                                    下载文件
                                </a>
                            </div>
                        `
                    }
                }
            } catch (storageError: any) {
                console.error('Storage error:', storageError)
                ElMessage.error(`无法获取文件: ${storageError.message}`)
                throw storageError
                
                // 显示错误信息
                if (joditInstance) {
                    joditInstance.value = `
                        <div style="color: red; text-align: center; padding: 20px;">
                            <p>文件加载失败: ${storageError.message || '未知错误'}</p>
                        </div>
                    `
                }
            }
        }
    } catch (error) {
        console.error('获取资料内容失败:', error)
        materialContent.value = ''
        ElMessage.error('获取文件内容失败')
        
        // 显示错误信息
        if (joditInstance) {
            joditInstance.value = `
                <div style="color: red; text-align: center; padding: 20px;">
                    <p>无法获取文件信息</p>
                </div>
            `
        }
    }
}

// 查看资料
const viewMaterial = () => {
    if (materialContent.value) {
        // 如果是Word或Excel文档，准备预览URL
        if (isWordMaterial.value || isExcelMaterial.value) {
            wordPreviewUrl.value = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(materialContent.value)}`
        }
        previewDialogVisible.value = true
    }
}

// 打开资料（保留原有方法）
const openMaterial = (material: any) => {
    if (!materialContent.value) return
    
    try {
        if (material.type === 'link' || material.type === 'video' || material.type === 'pdf' || material.type === 'word' || material.type === 'excel') {
            // 链接类型直接打开
            window.open(materialContent.value, '_blank')
        } else {
            // 其他类型文件下载
            const link = document.createElement('a')
            link.href = materialContent.value
            link.download = material.title
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    } catch (error) {
        console.error('打开文件失败:', error)
        ElMessage.error('打开文件失败')
    }
}

// 打开全屏预览
const openFullscreen = () => {
    fullscreenVisible.value = true
}

// 打开链接
const openLink = () => {
    if (materialContent.value) {
        window.open(materialContent.value, '_blank')
    }
}

// 下载文件
const downloadMaterial = () => {
    if (materialContent.value) {
        window.open(materialContent.value, '_blank')
    }
}

// 保存Markdown文件
const saveMarkdown = async () => {
    if (!selectedMaterial.value || !markdownContent.value) {
        ElMessage.warning('没有可保存的内容')
        return
    }
    
    savingMarkdown.value = true
    
    try {
        // 创建新的文件内容
        const file = new File([markdownContent.value], selectedMaterial.value.title + '.md', {
            type: 'text/markdown'
        })
        
        // 上传到storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        
        const { data: fileData, error: uploadError } = await supabase.storage
            .from('materials')
            .upload(`documents/${fileName}`, file, {
                upsert: true
            })
            
        if (uploadError) throw uploadError
        
        const { data: urlData } = supabase.storage
            .from('materials')
            .getPublicUrl(fileData.path)
        
        // 更新material_contents表
        const { error: updateError } = await supabase
            .from('material_contents')
            .update({
                content: urlData.publicUrl
            })
            .eq('material_id', selectedMaterial.value.id)
            
        if (updateError) throw updateError
        
        // 更新本地内容
        materialContent.value = urlData.publicUrl
        
        ElMessage.success('Markdown文件保存成功！')
        
    } catch (error: any) {
        console.error('保存Markdown失败:', error)
        ElMessage.error(`保存失败: ${error.message}`)
    } finally {
        savingMarkdown.value = false
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

// ========== 文件夹管理功能 ==========

// 获取文件夹图标
const getFolderIcon = () => {
    return new URL(`/src/assets/icons/file.png`, import.meta.url).href
}

// 获取文件图标
const getFileIcon = (type: string) => {
    return new URL(`/src/assets/icons/${type || 'file'}.png`, import.meta.url).href
}

// 格式化日期
const formatDate = (date: string) => {
    return date ? new Date(date).toLocaleString() : ''
}

// 仅加载平台列表，用于初始化文件夹标签页
const loadPlatformsOnly = async () => {
    folderLoading.value = true
    try {
        // 清空当前路径和状态
        currentPath.value = []
        currentLevel.value = null
        currentPlatformId.value = null
        currentPlatformName.value = null
        
        // 检查缓存
        const cacheKey = 'root';
        const cachedPlatforms = folderCache.value.get(cacheKey);
        
        if (cachedPlatforms) {
            folderItems.value = cachedPlatforms;
            return;
        }
        
        // 加载平台列表
        const { data, error } = await supabase
            .from('ad_platforms')
            .select('*')
            .order('name')
            
        if (error) throw error;
        
        const platforms = data.map(platform => ({
            ...platform,
            is_folder: true
        }));
        
        folderItems.value = platforms;
        folderCache.value.set(cacheKey, platforms);
    } catch (error) {
        console.error('加载平台列表失败:', error);
        ElMessage.error('加载平台列表失败');
    } finally {
        folderLoading.value = false;
    }
}

// 加载文件夹结构
const loadFolderStructure = async () => {
    folderLoading.value = true
    try {
        // 清空当前路径和状态
        currentPath.value = []
        currentLevel.value = null
        
        if (selectedPlatform.value) {
            const { data: platformData, error: platformError } = await supabase
                .from('ad_platforms')
                .select('*')
                .eq('platform', selectedPlatform.value)
                .single()

            if (platformError) throw platformError
            currentPlatformId.value = platformData.id
            currentPlatformName.value = platformData.name
        } else {
            currentPlatformId.value = null
            currentPlatformName.value = null
        }

        await loadCurrentLevelItems()
    } catch (error) {
        ElMessage.error('加载文件夹结构失败')
        console.error(error)
    } finally {
        folderLoading.value = false
    }
}

// 加载当前层级的项目 - 优化版本
const loadCurrentLevelItems = async () => {
    folderLoading.value = true
    try {
        let folderQuery;
        let materialsQuery;
        
        // 构建缓存键
        const getCacheKey = () => {
            if (!currentPlatformId.value) return 'root';
            if (currentPath.value.length === 1) return `platform_${currentPlatformId.value}`;
            if (currentPath.value.length === 2) return `category_${currentLevel.value}`;
            if (currentPath.value.length === 3) return `subcategory_${currentLevel.value}`;
            return `topic_${currentLevel.value}`;
        }
        
        const cacheKey = getCacheKey();
        
        // 先检查缓存
        const cachedFolders = folderCache.value.get(cacheKey);
        const cachedMaterials = materialCache.value.get(cacheKey);

        // 根据当前层级确定查询
        if (!currentPlatformId.value) {
            // 显示所有平台
            if (cachedFolders) {
                folderItems.value = cachedFolders;
                folderLoading.value = false;
                return;
            }
            
            const { data, error } = await supabase
                .from('ad_platforms')
                .select('*')
                .order('name')

            if (error) throw error
            
            const platforms = data.map(platform => ({
                ...platform,
                is_folder: true
            }));
            
            folderItems.value = platforms;
            folderCache.value.set(cacheKey, platforms);
            folderLoading.value = false;
            return
        }

        // 如果有缓存，使用缓存
        if (cachedFolders && cachedMaterials) {
            folderItems.value = [...cachedFolders, ...cachedMaterials];
            folderLoading.value = false;
            return;
        }

        // 确定文件夹和资料查询条件
        if (currentPath.value.length === 1) {
            // 加载平台下的顶级分类
            folderQuery = supabase
                .from('ad_categories')
                .select('*')
                .eq('platform_id', currentPlatformId.value)
                .order('sort_order, name')

            materialsQuery = supabase
                .from('study_materials')
                .select('*')
                .eq('platform_id', currentPlatformId.value)
                .is('category_id', null)
                .order('title')

        } else if (currentPath.value.length === 2) {
            // 加载当前分类下的子分类
            folderQuery = supabase
                .from('ad_subcategories')
                .select('*')
                .eq('category_id', currentLevel.value)
                .order('sort_order, name')

            materialsQuery = supabase
                .from('study_materials')
                .select('*')
                .eq('category_id', currentLevel.value)
                .is('subcategory_id', null)
                .order('title')

        } else if (currentPath.value.length === 3) {
            // 加载当前子分类下的主题
            folderQuery = supabase
                .from('ad_topics')
                .select('*')
                .eq('subcategory_id', currentLevel.value)
                .order('sort_order, name')

            materialsQuery = supabase
                .from('study_materials')
                .select('*')
                .eq('subcategory_id', currentLevel.value)
                .is('topic_id', null)
                .order('title')

        } else {
            // 加载当前主题下的资料
            folderQuery = null
            materialsQuery = supabase
                .from('study_materials')
                .select('*')
                .eq('topic_id', currentLevel.value)
                .order('title')
        }

        // 并行执行查询
        const [foldersResult, materialsResult] = await Promise.all([
            folderQuery ? folderQuery : Promise.resolve({ data: [], error: null }),
            materialsQuery
        ]);

        if (foldersResult?.error) throw foldersResult.error;
        if (materialsResult.error) throw materialsResult.error;

        // 转换结果
        const folders = (foldersResult?.data || []).map(item => ({
                ...item,
                is_folder: true
        }));
        
        const materials = (materialsResult.data || []).map(item => ({
                ...item,
                is_folder: false
        }));
        
        // 缓存结果
        folderCache.value.set(cacheKey, folders);
        materialCache.value.set(cacheKey, materials);
        
        // 合并文件夹和文件结果
        folderItems.value = [...folders, ...materials];
    } catch (error) {
        console.error('加载失败:', error);
        ElMessage.error('加载失败');
    } finally {
        folderLoading.value = false;
    }
}

// 处理文件夹项目点击
const handleFolderItemClick = async (item: any) => {
    if (item.is_folder) {
        // 如果是从搜索结果点击的文件夹，需要特殊处理
        if (folderSearchQuery.value.trim() && item.folder_level) {
            // 清除搜索关键词
            folderSearchQuery.value = '';
            
            // 重置当前路径
            currentPath.value = [];
            
            // 根据文件夹级别设置路径
            if (item.folder_level === 'platform') {
                // 平台级
                currentPlatformId.value = item.id;
                currentPlatformName.value = item.name;
                currentPath.value.push(item);
                currentLevel.value = item.id;
            } else if (item.folder_level === 'category') {
                // 分类级 - 先获取平台信息
                if (item.platform_id) {
                    try {
                        const { data: platform, error } = await supabase
                            .from('ad_platforms')
                            .select('*')
                            .eq('id', item.platform_id)
                            .single();
                            
                        if (error) throw error;
                        
                        // 设置平台信息
                        currentPlatformId.value = platform.id;
                        currentPlatformName.value = platform.name;
                        currentPath.value.push(platform);
                        
                        // 添加当前分类到路径
                        currentPath.value.push(item);
                        currentLevel.value = item.id;
                    } catch (error) {
                        console.error('获取平台信息失败:', error);
                        // 退回到处理普通点击
                        currentPlatformId.value = null;
                        currentPlatformName.value = null;
                    }
                }
            } else if (item.folder_level === 'subcategory') {
                // 子分类级 - 需要获取分类和平台信息
                if (item.category_id) {
                    try {
                        const { data: category, error: categoryError } = await supabase
                            .from('ad_categories')
                            .select('*, platform:ad_platforms(*)')
                            .eq('id', item.category_id)
                            .single();
                            
                        if (categoryError) throw categoryError;
                        
                        // 设置平台信息
                        if (category.platform) {
                            currentPlatformId.value = category.platform.id;
                            currentPlatformName.value = category.platform.name;
                            currentPath.value.push(category.platform);
                        }
                        
                        // 添加分类到路径
                        currentPath.value.push(category);
                        
                        // 添加当前子分类到路径
                        currentPath.value.push(item);
                        currentLevel.value = item.id;
                    } catch (error) {
                        console.error('获取分类信息失败:', error);
                        // 退回到处理普通点击
                        currentPlatformId.value = null;
                        currentPlatformName.value = null;
                    }
                }
            } else if (item.folder_level === 'topic') {
                // 主题级 - 需要获取子分类、分类和平台信息
                if (item.subcategory_id) {
                    try {
                        const { data: subcategory, error: subcategoryError } = await supabase
                            .from('ad_subcategories')
                            .select('*, category:ad_categories(*, platform:ad_platforms(*))')
                            .eq('id', item.subcategory_id)
                            .single();
                            
                        if (subcategoryError) throw subcategoryError;
                        
                        // 设置平台信息
                        if (subcategory.category?.platform) {
                            currentPlatformId.value = subcategory.category.platform.id;
                            currentPlatformName.value = subcategory.category.platform.name;
                            currentPath.value.push(subcategory.category.platform);
                        }
                        
                        // 添加分类到路径
                        if (subcategory.category) {
                            currentPath.value.push(subcategory.category);
                        }
                        
                        // 添加子分类到路径
                        currentPath.value.push(subcategory);
                        
                        // 添加当前主题到路径
                        currentPath.value.push(item);
                        currentLevel.value = item.id;
                    } catch (error) {
                        console.error('获取子分类信息失败:', error);
                        // 退回到处理普通点击
                        currentPlatformId.value = null;
                        currentPlatformName.value = null;
                    }
                }
            }
            
            // 加载子项目
            await loadCurrentLevelItems();
            return;
        }
        
        // 处理常规文件夹点击
        // 检查当前路径长度
        if (currentPath.value.length === 0) {
            // 点击平台
            currentPlatformId.value = item.id
            currentPlatformName.value = item.name
            currentPath.value.push(item)
            currentLevel.value = item.id
        } else if (currentPath.value.length === 1) {
            // 点击分类
            currentPath.value.push(item)
            currentLevel.value = item.id
        } else if (currentPath.value.length === 2) {
            // 点击子分类
            currentPath.value.push(item)
            currentLevel.value = item.id
        } else {
            // 点击主题
            currentPath.value.push(item)
            currentLevel.value = item.id
        }
        
        // 加载子项目
        await loadCurrentLevelItems()
    } else if (item.type) {
        // 如果是文件，显示详情
        showViewDialog(item)
    }
}

// 导航到上一级
const navigateToParent = async () => {
    if (currentPath.value.length > 0) {
        currentPath.value.pop() // 移除最后一级
        
        if (currentPath.value.length === 0) {
            // 如果返回到根目录，重置所有相关状态
            currentLevel.value = null
            currentPlatformId.value = null
            currentPlatformName.value = null
        } else {
            // 设置当前层级为路径中最后一项的ID
            currentLevel.value = currentPath.value[currentPath.value.length - 1].id
        }
        
        await loadCurrentLevelItems()
    }
}

// 导航到根目录
const navigateToRoot = async () => {
    currentPath.value = []
    currentLevel.value = null
    currentPlatformId.value = null
    currentPlatformName.value = null
    await loadCurrentLevelItems()
}

// 导航到指定层级
const navigateToLevel = async (item: any) => {
    // 找到点击的项目在路径中的位置
    const index = currentPath.value.findIndex(p => p.id === item.id)
    if (index >= 0) {
        currentPath.value = currentPath.value.slice(0, index + 1)
        currentLevel.value = item.id
        await loadCurrentLevelItems()
    }
}

// 删除文件夹项目
const handleFolderItemDelete = async (item: any) => {
    try {
        // 在此处调用 canDelete，而不是在渲染按钮时预先检查
        const canDeleteItem = await canDelete(item);
        if (!canDeleteItem) {
            ElMessage.warning(`无法删除，${item.is_folder ? '文件夹可能包含子项' : '无权删除此文件'}`)
            return
        }

        await ElMessageBox.confirm(
            `确定要删除${item.is_folder ? '文件夹' : '文件'} "${item.is_folder ? item.name : item.title}" 吗？此操作不可恢复。`,
            '警告',
            { type: 'warning' }
        )
        
        if (item.is_folder) {
            // 开始显示加载状态
            folderLoading.value = true;
            
            // 删除文件夹
            let tableName = '';
            let idField = 'id';
            let targetId = item.id;
            
            console.log('准备删除文件夹:', item);
            
            try {
                if (item.folder_level === 'platform' || (currentPath.value.length === 0 && !item.folder_level)) {
                    tableName = 'ad_categories';
                    idField = 'id';
                    console.log('删除类型: 分类, ID:', targetId);
                } else if (item.folder_level === 'category' || (currentPath.value.length === 1 && !item.folder_level)) {
                    tableName = 'ad_subcategories';
                    idField = 'id';
                    console.log('删除类型: 子分类, ID:', targetId);
                } else if (item.folder_level === 'subcategory' || (currentPath.value.length === 2 && !item.folder_level)) {
                    tableName = 'ad_topics';
                    idField = 'id';
                    console.log('删除类型: 主题, ID:', targetId);
                } else {
                    throw new Error('未知的文件夹类型');
                }
                
                console.log(`开始删除 ${tableName} 表中 ${idField}=${targetId} 的记录`);
                
                // 在删除前先检查记录是否存在
                const { data: checkData, error: checkError } = await supabase
                    .from(tableName)
                    .select('id')
                    .eq(idField, targetId)
                    .limit(1);
                
                if (checkError) {
                    console.error('检查记录是否存在失败:', checkError);
                    throw checkError;
                }
                
                if (!checkData || checkData.length === 0) {
                    console.warn('要删除的记录不存在');
                    ElMessage.warning('要删除的记录不存在');
                    folderLoading.value = false;
                    return;
                }
                
                // 执行删除
                const { error } = await supabase
                    .from(tableName)
                    .delete()
                    .eq(idField, targetId);
                
                if (error) {
                    console.error(`删除 ${tableName} 失败:`, error);
                    throw error;
                }
                
                // 删除后再次检查记录是否还存在
                const { data: verifyData, error: verifyError } = await supabase
                    .from(tableName)
                    .select('id')
                    .eq(idField, targetId)
                    .limit(1);
                
                if (verifyError) {
                    console.warn('验证删除结果时出错:', verifyError);
                    // 即使验证出错，也继续进行，因为删除操作本身没有报错
                }
                
                if (verifyData && verifyData.length > 0) {
                    console.error('删除操作执行了但记录仍然存在');
                    ElMessage.error('删除未成功，请刷新页面后重试');
                    folderLoading.value = false;
                    return;
                }
                
                // 完全清除缓存
                clearFolderCache();
                
                // 刷新当前级别的数据
                await loadCurrentLevelItems();
                
                // 删除成功
                ElMessage.success('删除成功');
                
            } catch (err: any) {
                console.error('删除过程中出错:', err);
                ElMessage.error(`删除失败: ${err.message || '未知错误'}`);
            } finally {
                folderLoading.value = false;
            }
        } else {
            // 删除资料
            await handleDelete(item);
        
            // 清除当前级别的缓存
            refreshCurrentLevel();
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除操作失败:', error);
            ElMessage.error('删除失败，请检查是否有关联的资料');
        }
    }
}

// 判断项目是否可以删除
const canDelete = async (item: any) => {
    if (!item.is_folder) {
        // 文件始终可以删除
        return true
    }
    
    // 检查缓存中是否已有结果
    const cacheKey = `delete_${item.id}`;
    if (deletePermissionCache.value.has(cacheKey)) {
        return deletePermissionCache.value.get(cacheKey);
    }
    
    // 检查文件夹是否为空
    try {
        let result = false;
        console.log('检查文件夹是否可删除:', item.id, item.name, '当前路径层级:', currentPath.value.length);
        
        // 根据item的类型检查（不依赖于currentPath.value）
        if (item.folder_level === 'platform' || (currentPath.value.length === 0 && !item.folder_level)) {
            // 检查平台下是否有分类
            const { count: categoryCount, error: categoryError } = await supabase
                .from('ad_categories')
                .select('*', { count: 'exact' })
                .eq('platform_id', item.id)
                
            if (categoryError) throw categoryError
            console.log('平台下分类数量:', categoryCount);
            
            // 检查平台是否有直接关联的资料
            const { count: materialCount, error: materialError } = await supabase
                .from('study_materials')
                .select('*', { count: 'exact' })
                .eq('platform_id', item.id)
                .is('category_id', null)
                
            if (materialError) throw materialError
            console.log('平台直接关联的资料数量:', materialCount);
            
            result = categoryCount === 0 && materialCount === 0;
        } else if (item.folder_level === 'category' || (currentPath.value.length === 1 && !item.folder_level)) {
            // 检查分类下是否有子分类
            const { count: subcategoryCount, error: subcategoryError } = await supabase
                .from('ad_subcategories')
                .select('*', { count: 'exact' })
                .eq('category_id', item.id)
                
            if (subcategoryError) throw subcategoryError
            console.log('分类下子分类数量:', subcategoryCount);
            
            // 检查分类是否有直接关联的资料
            const { count: materialCount, error: materialError } = await supabase
                .from('study_materials')
                .select('*', { count: 'exact' })
                .eq('category_id', item.id)
                .is('subcategory_id', null)
                
            if (materialError) throw materialError
            console.log('分类下直接关联的资料数量:', materialCount);
            
            result = subcategoryCount === 0 && materialCount === 0;
        } else if (item.folder_level === 'subcategory' || (currentPath.value.length === 2 && !item.folder_level)) {
            // 检查子分类是否有主题
            const { count: topicCount, error: topicError } = await supabase
                .from('ad_topics')
                .select('*', { count: 'exact' })
                .eq('subcategory_id', item.id)
                
            if (topicError) throw topicError
            console.log('子分类下主题数量:', topicCount);
            
            // 检查子分类是否有直接关联的资料
            const { count: materialCount, error: materialError } = await supabase
                .from('study_materials')
                .select('*', { count: 'exact' })
                .eq('subcategory_id', item.id)
                .is('topic_id', null)
                
            if (materialError) throw materialError
            console.log('子分类下直接关联的资料数量:', materialCount);
            
            result = topicCount === 0 && materialCount === 0;
        } else if (item.folder_level === 'topic' || (currentPath.value.length === 3 && !item.folder_level)) {
            // 检查主题是否有关联的资料
            const { count: materialCount, error: materialError } = await supabase
                .from('study_materials')
                .select('*', { count: 'exact' })
                .eq('topic_id', item.id)
                
            if (materialError) throw materialError
            console.log('主题下资料数量:', materialCount);
            
            result = materialCount === 0;
        }
        
        console.log('文件夹是否可删除结果:', result);
        // 缓存结果
        deletePermissionCache.value.set(cacheKey, result);
        return result;
    } catch (error) {
        console.error('检查删除权限失败:', error)
        return false
    }
}

// 显示创建文件夹对话框
const showCreateFolderDialog = (folder: any = null) => {
    parentFolder.value = folder;
    newFolder.name = '';
    newFolder.platform = selectedPlatform.value;
    newFolder.folderPath = [] as string[];
    
    console.log('showCreateFolderDialog 参数:', folder ? '有folder' : '无folder');
    console.log('parentFolder.value:', parentFolder.value);
    
    // 简化的创建流程
    if (folder) {
        // 点击表格行的"新建"按钮
        console.log('在特定文件夹下创建子文件夹:', folder);
        folderCreateOptions.value = []; // 不需要加载选项
        
        // 根据文件夹层级设置正确的路径
        if (folder.folder_level === 'platform' || (!folder.folder_level && currentPath.value.length === 0)) {
            // 在平台下创建分类
            newFolder.folderPath = [folder.id];
        } else if (folder.folder_level === 'category' || (!folder.folder_level && currentPath.value.length === 1)) {
            // 在分类下创建子分类
            newFolder.folderPath = [folder.id];
        } else if (folder.folder_level === 'subcategory' || (!folder.folder_level && currentPath.value.length === 2)) {
            // 在子分类下创建主题
            newFolder.folderPath = [currentPath.value[1]?.id, folder.id];
        }
    } else {
        // 点击顶部"新建文件夹"按钮，需要加载完整的文件夹路径选择器
        console.log('从顶部按钮创建，加载文件夹路径选择器');
        loadFolderOptionsForCreate();
    }
    
    // 延迟打开对话框，确保状态更新
    setTimeout(() => {
        createFolderDialogVisible.value = true;
    }, 100);
}

// 创建文件夹
const createFolder = async () => {
    if (!newFolder.name) {
        ElMessage.warning('请输入文件夹名称')
        return
    }
    
    // 如果是从表格行的新建按钮创建，则使用预设的路径
    // 如果是从顶部菜单的新建按钮创建，则要求用户选择路径
    if (!parentFolder.value && newFolder.folderPath.length === 0) {
        ElMessage.warning('请选择文件夹位置')
        return
    }
    
    // 显示加载状态
    folderLoading.value = true
    
    try {
        let result
        let folderPath = newFolder.folderPath
        
        // 判断当前在哪个层级并创建相应的文件夹
        if (parentFolder.value) {
            // 特定场景：从表格行的新建按钮创建
            console.log('使用预设路径创建文件夹:', folderPath);
            
            if (parentFolder.value.folder_level === 'platform' || (!parentFolder.value.folder_level && currentPath.value.length === 0)) {
                // 在平台下创建分类
                const { data, error } = await supabase
                    .from('ad_categories')
                    .insert({
                        name: newFolder.name,
                        platform_id: parentFolder.value.id,
                        sort_order: 0
                    })
                    .select()
                
                if (error) throw error
                result = data
                
                // 清除缓存
                clearFolderCache(`platform_${parentFolder.value.id}`);
                
            } else if (parentFolder.value.folder_level === 'category' || (!parentFolder.value.folder_level && currentPath.value.length === 1)) {
                // 在分类下创建子分类
                const { data, error } = await supabase
                    .from('ad_subcategories')
                    .insert({
                        name: newFolder.name,
                        category_id: parentFolder.value.id,
                        sort_order: 0
                    })
                    .select()
                
                if (error) throw error
                result = data
                
                // 清除缓存
                clearFolderCache(`category_${parentFolder.value.id}`);
                
            } else if (parentFolder.value.folder_level === 'subcategory' || (!parentFolder.value.folder_level && currentPath.value.length === 2)) {
                // 在子分类下创建主题
                const { data, error } = await supabase
                    .from('ad_topics')
                    .insert({
                        name: newFolder.name,
                        subcategory_id: parentFolder.value.id,
                        sort_order: 0
                    })
                    .select()
                
                if (error) throw error
                result = data
                
                // 清除缓存
                clearFolderCache(`subcategory_${parentFolder.value.id}`);
            }
        } else {
            // 常规场景：从顶部新建按钮创建，用户已选择路径
        // 判断当前在哪个层级
        if (folderPath.length === 1) {
            // 创建平台级的分类
                const platformId = folderPath[0]
            
            const { data, error } = await supabase
                .from('ad_categories')
                .insert({
                    name: newFolder.name,
                    platform_id: platformId,
                    sort_order: 0
                })
                .select()
                
            if (error) throw error
            result = data
                
                // 清除缓存
                clearFolderCache(`platform_${platformId}`);
        } else if (folderPath.length === 2) {
            // 创建分类下的子分类
            const categoryId = folderPath[0]
            
            const { data, error } = await supabase
                .from('ad_subcategories')
                .insert({
                    name: newFolder.name,
                    category_id: categoryId,
                    sort_order: 0
                })
                .select()
                
            if (error) throw error
            result = data
                
                // 清除缓存
                clearFolderCache(`category_${categoryId}`);
        } else if (folderPath.length === 3) {
            // 创建子分类下的主题
            const subcategoryId = folderPath[1]
            
            const { data, error } = await supabase
                .from('ad_topics')
                .insert({
                    name: newFolder.name,
                    subcategory_id: subcategoryId,
                    sort_order: 0
                })
                .select()
                
            if (error) throw error
            result = data
                
                // 清除缓存
                clearFolderCache(`subcategory_${subcategoryId}`);
        } else {
            throw new Error('无法在当前层级创建文件夹')
            }
        }
        
        ElMessage.success('创建成功')
        createFolderDialogVisible.value = false
        
        // 刷新当前级别
        refreshCurrentLevel();
    } catch (error: any) {
        console.error('创建文件夹失败:', error)
        ElMessage.error(`创建失败: ${error.message || '文件夹最多只能有3级'}`)
    } finally {
        folderLoading.value = false
    }
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

// 加载文件夹选项用于创建 - 优化版本
const loadFolderOptionsForCreate = async () => {
    // 构建缓存键
    const cacheKey = selectedPlatform.value 
        ? `folder_options_${selectedPlatform.value}_${currentPlatformId.value || ''}_${currentLevel.value || ''}`
        : 'folder_options_all';
    
    // 检查缓存
    if (folderOptionsCache.value.has(cacheKey)) {
        folderCreateOptions.value = folderOptionsCache.value.get(cacheKey) || [];
        return;
    }
    
    try {
        // 获取所有平台
        const { data: platforms, error: platformsError } = await supabase
            .from('ad_platforms')
            .select('*')
            .order('name')

        if (platformsError) throw platformsError

        // 定义类型
        interface FolderOption {
            id: string;
            name: string;
            children: FolderOption[];
        }

        // 预先创建平台选项
        const platformOptions: FolderOption[] = platforms.map(platform => ({
            id: platform.id,
            name: platform.name,
            children: []
        }))
        
        folderCreateOptions.value = platformOptions
        
        // 如果已选择了平台，只加载该平台的分类
        if (selectedPlatform.value && currentPlatformId.value) {
            try {
                const { data: categories } = await supabase
                .from('ad_categories')
                .select('*')
                    .eq('platform_id', currentPlatformId.value)
                .order('name')

                const platformIndex = platformOptions.findIndex(p => p.id === currentPlatformId.value)
                if (platformIndex >= 0 && categories) {
                    platformOptions[platformIndex].children = categories.map(category => ({
                        id: category.id,
                        name: category.name,
                        children: []
                    }))
                    
                    // 如果当前在分类层级，加载相关子分类
                    if (currentPath.value.length === 1 && currentLevel.value) {
                        const { data: subcategories } = await supabase
                    .from('ad_subcategories')
                    .select('*')
                            .eq('category_id', currentLevel.value)
                    .order('name')

                        const categoryIndex = platformOptions[platformIndex].children.findIndex(c => c.id === currentLevel.value)
                        if (categoryIndex >= 0 && subcategories) {
                            platformOptions[platformIndex].children[categoryIndex].children = subcategories.map(subcategory => ({
                        id: subcategory.id,
                        name: subcategory.name,
                            children: []
                        }))
                    }
                    }
                }
            } catch (error) {
                console.error('获取分类失败:', error)
            }
        }
        
        // 缓存结果
        folderOptionsCache.value.set(cacheKey, platformOptions);
        
        // 强制更新
        folderCreateOptions.value = platformOptions
    } catch (error) {
        console.error('加载文件夹选项失败:', error)
        ElMessage.error('加载文件夹结构失败')
        folderCreateOptions.value = []
    }
}

// 清除文件夹缓存
const clearFolderCache = (key?: string) => {
    if (key) {
        folderCache.value.delete(key);
        materialCache.value.delete(key);
        deletePermissionCache.value.clear();
        
        // 清除相关文件夹选项缓存
        folderOptionsCache.value.clear();
    } else {
        folderCache.value.clear();
        materialCache.value.clear();
        deletePermissionCache.value.clear();
        folderOptionsCache.value.clear();
    }
}

// 在删除或创建文件夹后清除相关缓存
const refreshCurrentLevel = () => {
    const getCacheKey = () => {
        if (!currentPlatformId.value) return 'root';
        if (currentPath.value.length === 1) return `platform_${currentPlatformId.value}`;
        if (currentPath.value.length === 2) return `category_${currentLevel.value}`;
        if (currentPath.value.length === 3) return `subcategory_${currentLevel.value}`;
        return `topic_${currentLevel.value}`;
    }
    
    // 清除当前级别的缓存
    clearFolderCache(getCacheKey());
    
    // 重新加载
    loadCurrentLevelItems();
}

// 搜索文件夹方法
const searchFolders = async () => {
    if (!folderSearchQuery.value.trim()) {
        // 如果搜索框为空，则加载常规根级目录结构
        if (currentPath.value.length === 0) {
            loadPlatformsOnly();
        }
        return;
    }
    
    folderLoading.value = true;
    try {
        // 只在根目录搜索文件夹，防止搜索结果过多
        const folders = [];
        
        // 搜索平台
        const { data: platforms, error: platformsError } = await supabase
            .from('ad_platforms')
            .select('*')
            .ilike('name', `%${folderSearchQuery.value}%`)
            .order('name');
            
        if (platformsError) throw platformsError;
        
        // 转换平台结果为文件夹格式
        const platformFolders = platforms.map(platform => ({
            ...platform,
            is_folder: true,
            folder_level: 'platform'
        }));
        
        folders.push(...platformFolders);
        
        // 搜索分类
        const { data: categories, error: categoriesError } = await supabase
            .from('ad_categories')
            .select('*, platform:ad_platforms(name)')
            .ilike('name', `%${folderSearchQuery.value}%`)
            .order('name');
            
        if (categoriesError) throw categoriesError;
        
        // 转换分类结果为文件夹格式
        const categoryFolders = categories.map(category => ({
            ...category,
            is_folder: true,
            folder_level: 'category',
            path_info: category.platform ? `${category.platform.name} > ${category.name}` : category.name
        }));
        
        folders.push(...categoryFolders);
        
        // 搜索子分类
        const { data: subcategories, error: subcategoriesError } = await supabase
            .from('ad_subcategories')
            .select('*, category:ad_categories(name, platform:ad_platforms(name))')
            .ilike('name', `%${folderSearchQuery.value}%`)
            .order('name');
            
        if (subcategoriesError) throw subcategoriesError;
        
        // 转换子分类结果为文件夹格式
        const subcategoryFolders = subcategories.map(subcategory => ({
            ...subcategory,
            is_folder: true,
            folder_level: 'subcategory',
            path_info: subcategory.category ? 
                `${subcategory.category.platform?.name || ''} > ${subcategory.category.name} > ${subcategory.name}` 
                : subcategory.name
        }));
        
        folders.push(...subcategoryFolders);
        
        // 搜索主题
        const { data: topics, error: topicsError } = await supabase
            .from('ad_topics')
            .select('*, subcategory:ad_subcategories(name, category:ad_categories(name, platform:ad_platforms(name)))')
            .ilike('name', `%${folderSearchQuery.value}%`)
            .order('name');
            
        if (topicsError) throw topicsError;
        
        // 转换主题结果为文件夹格式
        const topicFolders = topics.map(topic => ({
            ...topic,
            is_folder: true,
            folder_level: 'topic',
            path_info: topic.subcategory ? 
                `${topic.subcategory.category?.platform?.name || ''} > ${topic.subcategory.category?.name || ''} > ${topic.subcategory.name} > ${topic.name}` 
                : topic.name
        }));
        
        folders.push(...topicFolders);
        
        // 更新文件夹列表
        folderItems.value = folders;
    } catch (error) {
        console.error('搜索文件夹失败:', error);
        ElMessage.error('搜索文件夹失败');
    } finally {
        folderLoading.value = false;
    }
};

onMounted(() => {
    searchMaterials();
    
    // 仅在文件夹标签页时初始加载平台列表
    if (activeTab.value === 'folders') {
        // 默认只加载平台列表，不加载具体文件夹内容
        loadPlatformsOnly();
    }
})

// 监听标签页切换 - 修改为只在首次加载时触发
const foldersLoaded = ref(false);
watch(activeTab, (newTab) => {
    if (newTab === 'folders' && !foldersLoaded.value) {
        // 只在首次加载folders标签时执行，避免重复请求
        if (folderItems.value.length === 0) {
            loadPlatformsOnly();
            foldersLoaded.value = true;
        }
    }
})

// 监听选中平台变化 - 添加防抖处理
let platformChangeTimer: any = null;
watch(selectedPlatform, (newPlatform, oldPlatform) => {
    // 取消之前的定时器
    if (platformChangeTimer) {
        clearTimeout(platformChangeTimer);
    }
    
    // 如果平台没有实际变化，不触发加载
    if (newPlatform === oldPlatform) return;
    
    // 使用setTimeout实现防抖，避免频繁请求
    platformChangeTimer = setTimeout(() => {
        if (newPlatform) {
            loadFolderStructure()
        } else {
            // 如果清除了平台选择，重置状态并加载所有平台
            currentPlatformId.value = null
            currentPlatformName.value = null
            currentPath.value = []
            currentLevel.value = null
        loadCurrentLevelItems()
    }
    }, 300);
})

// 监听对话框关闭
const handleDialogClose = () => {
    if (joditInstance) {
        joditInstance.destruct()
        joditInstance = null
    }
}

onBeforeUnmount(() => {
    if (joditInstance) {
        joditInstance.destruct()
    }
})
</script>

<style scoped>
.tabs-container {
    margin-bottom: 20px;
}

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

.folder-breadcrumb :deep(.el-card__body) {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
}

.folder-title {
    color: #606266;
    cursor: pointer;
}

.folder-title:hover {
    color: #409EFF;
}
:deep(.el-tabs__item) {
    font-size: 16px;
    height: 60px;
}

:deep(.el-tabs__active-bar) {
    background-color: #409eff;
    height: 3px;
}
:deep(.el-breadcrumb__inner) {
    cursor: pointer;
}

.editor-container {
    margin-top: 20px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
}
.text-content {
    padding: 20px;
    border: 2px solid #ccc;
    margin-top: 20px;
    border-radius: 5px;
}

.material-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.material-image {
    max-width: 100%;
    max-height: 70vh;
    cursor: pointer;
    transition: transform 0.2s;
}

.material-image:hover {
    transform: scale(1.02);
}

.material-frame {
    width: 100%;
    height: 70vh;
    border: none;
}

.word-preview-frame {
    width: 100%;
    height: 70vh;
    border: none;
}

.link-preview {
    text-align: center;
    padding: 30px;
}

.video-preview {
    text-align: center;
    padding: 20px;
}

.material-video {
    max-width: 100%;
    max-height: 70vh;
}

.text-preview {
    padding: 20px;
    max-height: 70vh;
    overflow-y: auto;
}

.material-download {
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

/* Markdown预览和编辑样式 */
.markdown-preview {
    height: 70vh;
    display: flex;
    flex-direction: column;
}

.markdown-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #e4e7ed;
    margin-bottom: 15px;
}

.markdown-container {
    flex: 1;
    display: flex;
    gap: 15px;
    height: calc(100% - 60px);
}

.markdown-container.preview {
    justify-content: center;
}

.markdown-container.edit {
    justify-content: flex-start;
}

.markdown-container.split {
    justify-content: space-between;
}

.markdown-editor {
    flex: 1;
    min-width: 0;
}

.markdown-preview-content {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 15px;
    background-color: #fff;
}

.markdown-textarea {
    height: 100%;
}

.markdown-textarea :deep(.el-textarea__inner) {
    height: 100% !important;
    resize: none;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.5;
}

.markdown-html {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
}

.markdown-html h1,
.markdown-html h2,
.markdown-html h3,
.markdown-html h4,
.markdown-html h5,
.markdown-html h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
    color: #24292e;
}

.markdown-html h1 {
    font-size: 2em;
    border-bottom: 1px solid #eaecef;
    padding-bottom: 10px;
}

.markdown-html h2 {
    font-size: 1.5em;
    border-bottom: 1px solid #eaecef;
    padding-bottom: 10px;
}

.markdown-html h3 {
    font-size: 1.25em;
}

.markdown-html p {
    margin-bottom: 16px;
}

.markdown-html code {
    padding: 2px 4px;
    font-size: 85%;
    background-color: rgba(27, 31, 35, 0.05);
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.markdown-html pre {
    padding: 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: #f6f8fa;
    border-radius: 6px;
    margin-bottom: 16px;
}

.markdown-html pre code {
    padding: 0;
    background-color: transparent;
    border-radius: 0;
}

.markdown-html blockquote {
    padding: 0 1em;
    color: #6a737d;
    border-left: 0.25em solid #dfe2e5;
    margin: 0 0 16px 0;
}

.markdown-html table {
    border-spacing: 0;
    border-collapse: collapse;
    margin-bottom: 16px;
    width: 100%;
}

.markdown-html table th,
.markdown-html table td {
    padding: 6px 13px;
    border: 1px solid #dfe2e5;
}

.markdown-html table th {
    font-weight: 600;
    background-color: #f6f8fa;
}

.markdown-html ul,
.markdown-html ol {
    padding-left: 2em;
    margin-bottom: 16px;
}

.markdown-html li {
    margin-bottom: 4px;
}

.markdown-html a {
    color: #0366d6;
    text-decoration: none;
}

.markdown-html a:hover {
    text-decoration: underline;
}

.markdown-html img {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
}

/* 代码高亮样式 */
.markdown-html .hljs {
    background: #f6f8fa !important;
    color: #24292e !important;
}

.markdown-html .hljs-comment,
.markdown-html .hljs-quote {
    color: #6a737d;
    font-style: italic;
}

.markdown-html .hljs-keyword,
.markdown-html .hljs-selector-tag,
.markdown-html .hljs-subst {
    color: #d73a49;
    font-weight: 600;
}

.markdown-html .hljs-number,
.markdown-html .hljs-literal,
.markdown-html .hljs-variable,
.markdown-html .hljs-template-variable,
.markdown-html .hljs-tag .hljs-attr {
    color: #005cc5;
}

.markdown-html .hljs-string,
.markdown-html .hljs-doctag {
    color: #032f62;
}

.markdown-html .hljs-title,
.markdown-html .hljs-section,
.markdown-html .hljs-selector-id {
    color: #6f42c1;
    font-weight: 600;
}

.markdown-html .hljs-type,
.markdown-html .hljs-class .hljs-title {
    color: #d73a49;
    font-weight: 600;
}

.markdown-html .hljs-tag,
.markdown-html .hljs-name,
.markdown-html .hljs-attribute {
    color: #22863a;
    font-weight: normal;
}

.markdown-html .hljs-regexp,
.markdown-html .hljs-link {
    color: #032f62;
}

.markdown-html .hljs-symbol,
.markdown-html .hljs-bullet {
    color: #e36209;
}

.markdown-html .hljs-built_in,
.markdown-html .hljs-builtin-name {
    color: #005cc5;
}

.markdown-html .hljs-meta {
    color: #6a737d;
}

.markdown-html .hljs-deletion {
    background: #ffeef0;
}

.markdown-html .hljs-addition {
    background: #f0fff4;
}

.markdown-html .hljs-emphasis {
    font-style: italic;
}

.markdown-html .hljs-strong {
    font-weight: 600;
}
</style>