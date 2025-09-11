<template>
    <div class="study">
        <el-card class="study-search" style="margin-bottom: 20px;">
            <el-space wrap alignment="start" :size="30">
                <el-radio-group v-model="viewMode" size="large">
                    <el-radio-button :value="'grid'">图标</el-radio-button>
                    <el-radio-button :value="'list'">列表</el-radio-button>
                </el-radio-group>

                <el-input v-model="searchKeyword" clearable style="width: 240px" placeholder="搜索..."
                    suffix-icon="Search" size="large" />

                <el-button type="primary" size="large" @click="handleSearch">搜索</el-button>
            </el-space>
        </el-card>

        <!-- 面包屑导航 -->
        <el-card class="study-breadcrumb" style="margin-bottom: 20px;">
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
                <el-breadcrumb-item :to="{ path: '' }" @click="navigateToRoot()">
                    {{ platform ? platform : "根目录" }}
                </el-breadcrumb-item>
                <el-breadcrumb-item v-for="item in currentPath" :key="item.id" @click="navigateToLevel(item)">
                    {{ item.name }}
                </el-breadcrumb-item>
            </el-breadcrumb>
        </el-card>

        <!-- 网格视图 -->
        <el-card v-if="viewMode === 'grid'" v-loading="loading" style="min-height: 400px;">
            <el-row :gutter="40" style="row-gap: 30px;">
                <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="item in currentItems" :key="item.id">
                    <div class="grid-content-column" @click="handleItemClick(item)">
                        <el-image style="width: 120px; height: 120px"
                            :src="item.is_folder ? getFolderIcon() : getFileIcon(item.type)" fit="fill" />
                        <div class="study-content-title hide-text-2">{{ item.name || item.title }}</div>
                    </div>
                </el-col>
            </el-row>
            <el-empty v-if="!loading && currentItems.length === 0" description="暂无数据" />
        </el-card>

        <!-- 列表视图 -->
        <el-card v-else v-loading="loading" style="min-height: 400px;">
            <el-table :data="currentItems" style="width: 100%">
                <el-table-column label="" width="60">
                    <template #default="{ row }">
                        <el-image style="width: 24px; height: 24px"
                            :src="row.is_folder ? getFolderIcon() : getFileIcon(row.type)" fit="contain" />
                    </template>
                </el-table-column>
                <el-table-column prop="name" label="名称">
                    <template #default="{ row }">
                        <el-text class="folder-title" @click="handleItemClick(row)">
                            {{ row.is_folder ? row.name : row.title }}
                        </el-text>
                    </template>
                </el-table-column>
                <el-table-column prop="type" label="类型">
                    <template #default="{ row }">
                        {{ row.is_folder ? '文件夹' : row.type }}
                    </template>
                </el-table-column>
                <el-table-column prop="created_at" label="创建时间" width="180">
                    <template #default="{ row }">
                        {{ formatDate(row.created_at) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="120">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handleItemClick(row)">
                            {{ row.is_folder ? '打开' : '查看' }}
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 查看资料对话框 -->
        <el-dialog title="资料详情" v-model="dialogVisible" width="70%" @closed="handleDialogClose">
            <div class="dialog-content">
                <div class="material-details">
                    <div class="material-header">
                        <el-image style="width: 40px; height: 40px" :src="getFileIcon(selectedMaterial?.type)"
                            fit="contain" />
                        <h2 class="material-title">{{ selectedMaterial?.title || '无标题' }}</h2>
                    </div>
                    <p><strong>类型:</strong> <span>{{ selectedMaterial?.type }}</span></p>
                    <p><strong>创建时间:</strong> <span>{{ selectedMaterial?.created_at ?
                        formatDate(selectedMaterial.created_at) :
                            '' }}</span></p>
                    
                    <!-- 文件预览区域 -->
                    <div class="material-preview" v-if="materialContent">
                        <div class="preview-actions">
                            <el-button type="primary" @click="viewMaterial">
                                {{ getPreviewButtonText() }}
                            </el-button>
                            <el-button v-if="canPreview" @click="openFullscreen">
                                全屏预览
                            </el-button>
                        </div>
                        
                        <!-- 内嵌预览内容 -->
                        <div class="preview-content" v-if="showPreview">
                            <template v-if="selectedMaterial?.type === 'image'">
                                <img :src="materialContent" class="preview-image" @click="openFullscreen" />
                            </template>
                            <template v-else-if="selectedMaterial?.type === 'pdf'">
                                <iframe :src="getPdfPreviewUrl(materialContent)" class="preview-frame"></iframe>
                            </template>
                            <template v-else-if="selectedMaterial?.type === 'word'">
                                <iframe :src="wordPreviewUrl" class="word-preview-frame"></iframe>
                            </template>
                            <template v-else-if="selectedMaterial?.type === 'link' || selectedMaterial?.type === 'video'">
                                <div class="link-preview">
                                    <p>链接地址: {{ materialContent }}</p>
                                    <el-button type="primary" @click="openMaterial(selectedMaterial)">
                                        在新窗口中打开
                                    </el-button>
                                </div>
                            </template>
                            <template v-else-if="selectedMaterial?.type === 'txt'">
                                <div class="text-content" v-html="materialContent"></div>
                            </template>
                            <template v-else>
                                <div class="editor-container">
                                    <div ref="editor"></div>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <el-button @click="dialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>

        <!-- 全屏预览对话框 -->
        <el-dialog v-model="fullscreenVisible" title="全屏预览" width="100%" top="0" :show-close="true" destroy-on-close class="fullscreen-dialog">
            <div class="fullscreen-preview">
                <template v-if="selectedMaterial?.type === 'image'">
                    <img :src="materialContent" class="fullscreen-image" />
                </template>
                <template v-else-if="selectedMaterial?.type === 'pdf'">
                    <iframe :src="getPdfPreviewUrl(materialContent)" class="fullscreen-frame"></iframe>
                </template>
                <template v-else-if="selectedMaterial?.type === 'word'">
                    <iframe :src="wordPreviewUrl" class="fullscreen-frame"></iframe>
                </template>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, onBeforeUnmount, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, ArrowLeft, House } from '@element-plus/icons-vue'
import { supabase } from '@/lib/supabaseClient'
import { useRoute, useRouter } from 'vue-router'
import { Jodit } from 'jodit'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import * as pdfjsLib from 'pdfjs-dist'

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

// 视图模式
const viewMode = ref('grid')
const loading = ref(false)
const searchKeyword = ref('')
const route = useRoute()
const router = useRouter()
const platformName = ref(route.query.platform || 'google')
const platform = ref<string | null>(null)
const platformId = ref<string | null>(null)
const currentLevel = ref<string | null>(null)
const currentItems = ref<any[]>([])
const currentPath = ref<any[]>([])

// 添加缺失的变量
const folderLoading = ref(false)
const currentPlatformId = ref<string | null>(null)
const currentPlatformName = ref<string | null>(null)
const selectedPlatform = ref<string | null>(platformName.value as string)
const folderItems = ref<any[]>([])

// 新增资料查看对话框相关变量
const dialogVisible = ref(false)
const selectedMaterial = ref<any | null>(null)
const materialContent = ref('')
const editor = ref<HTMLElement | null>(null)
let joditInstance: any = null

// 新增预览相关变量
const showPreview = ref(false)
const fullscreenVisible = ref(false)
const wordPreviewUrl = ref('')
const wordFileUrl = ref('') // 存储Word文件的公共URL

// 获取文件夹图标
const getFolderIcon = () => {
    return new URL(`/src/assets/icons/file.png`, import.meta.url).href
}

// 获取文件图标
const getFileIcon = (type: string) => {
    const icon = iconList.find(icon => icon.icon === type)
    return icon ? icon.src : iconList[0].src
}

// 格式化日期
const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
}

// 判断是否可以预览
const canPreview = computed(() => {
    if (!selectedMaterial.value?.type) return false
    const type = selectedMaterial.value.type
    return ['image', 'pdf', 'word',  'video', 'txt'].includes(type)
})

// 获取预览按钮文本
const getPreviewButtonText = () => {
    if (!selectedMaterial.value?.type) return '预览'
    const type = selectedMaterial.value.type
    switch (type) {
        case 'image':
            return '预览图片'
        case 'pdf':
            return '预览PDF'
        case 'word':
            return '预览Word'
        case 'link':
        case 'video':
            return '打开链接'
        case 'txt':
            return '查看文本'
        default:
            return '预览'
    }
}

// 获取PDF预览URL（禁用打印和下载）
const getPdfPreviewUrl = (url: string) => {
    if (!url) return ''
    // 添加参数禁用打印和下载功能
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&disableprint=1&disablesave=1`
}

// 处理项目点击
const handleItemClick = async (item: any) => {
    if (item.is_folder) {
        // 如果是文件夹，更新当前路径并加载子项
        currentPath.value.push(item)
        currentLevel.value = item.id
        await loadCurrentLevelItems()
    } else if (item.type) {
        // 如果是Word文件，跳转到专门的Word查看器
        if (item.type === 'word' || item.type === 'doc' || item.type === 'docx') {
            // 获取文件的URL
            const { data: contentData, error: contentError } = await supabase
                .from('material_contents')
                .select('public_url')
                .eq('material_id', item.id)
                .single()
            
            if (contentError) {
                ElMessage.error('获取文件URL失败')
                return
            }
            
            // 跳转到Word查看器
            router.push({
                name: 'word-viewer',
                params: { id: item.id },
                query: { 
                    url: contentData.public_url,
                    name: item.title || item.name
                }
            })
        } else {
            // 其他文件类型，使用原有的预览方式
            fetchMaterialWithContents(item.id)
        }
    }
}

// 同时获取学习资料及其所有内容项
const fetchMaterialWithContents = async (materialId: string) => {
    try {
        // 先获取资料基本信息
        const { data: materialData, error: materialError } = await supabase
            .from('study_materials')
            .select('*')
            .eq('id', materialId)
            .single()

        if (materialError) throw materialError

        // 设置选中资料和显示对话框
        selectedMaterial.value = materialData
        dialogVisible.value = true

        // 如果有之前的编辑器实例，先销毁
        if (joditInstance) {
            joditInstance.destruct()
            joditInstance = null
        }

        // 提前初始化编辑器
        if (materialData.type !== 'link' && materialData.type !== 'video' && materialData.type !== 'pdf' && editor.value) {
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

        // 获取资料内容
        const { data, error } = await supabase
            .from('material_contents')
            .select('*')
            .eq('material_id', materialId)
            .single()

        if (error) throw error

        // 如果是链接类型，直接使用链接内容
        if (materialData.type === 'link' || materialData.type === 'video' || materialData.type === 'pdf') {
            materialContent.value = data.content
        } else {
            // 从 storage 获取文件内容
            const filePath = data.content
            console.log('Attempting to fetch file from path:', filePath)
            const path = data.content.split('/materials/').pop()
            try {
                if (materialData.type === 'word') {
                    // Word文件处理逻辑
                    const { data: fileData, error: fileError } = await supabase
                        .storage
                        .from('materials')
                        .download(path)

                    if (fileError) throw fileError

                    // 获取Word文件的公共URL用于预览
                    const { data: { publicUrl } } = await supabase
                        .storage
                        .from('materials')
                        .getPublicUrl(path)
                    
                    wordFileUrl.value = publicUrl

                    const arrayBuffer = await fileData.arrayBuffer()
                    const result = await mammoth.convertToHtml({ arrayBuffer })
                    materialContent.value = result.value

                    const wordStyles = `
                        <style>
                            .word-content {
                                font-family: Arial, sans-serif;
                                line-height: 1.6;
                                padding: 20px;
                            }
                            .word-content p {
                                margin: 0 0 1em 0;
                            }
                            .word-content h1, .word-content h2, .word-content h3 {
                                margin: 1em 0 0.5em 0;
                            }
                            .word-content table {
                                border-collapse: collapse;
                                margin: 1em 0;
                            }
                            .word-content td, .word-content th {
                                border: 1px solid #ddd;
                                padding: 8px;
                            }
                        </style>
                    `
                    materialContent.value = wordStyles + '<div class="word-content">' + materialContent.value + '</div>'

                    // 直接更新编辑器内容
                    if (joditInstance) {
                        joditInstance.value = materialContent.value
                    }
                } else if (materialData.type === 'excel') {
                    // Excel文件处理
                    const { data: fileData, error: fileError } = await supabase
                        .storage
                        .from('materials')
                        .download(path)

                    if (fileError) throw fileError

                    const arrayBuffer = await fileData.arrayBuffer()
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

                    // 获取第一个工作表
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
                    const html = XLSX.utils.sheet_to_html(firstSheet)

                    // 添加Excel样式
                    const excelStyles = `
                        <style>
                            .excel-content {
                                font-family: Arial, sans-serif;
                                line-height: 1.6;
                                padding: 20px;
                            }
                            .excel-content table {
                                border-collapse: collapse;
                                width: 100%;
                                margin: 1em 0;
                            }
                            .excel-content td, .excel-content th {
                                border: 1px solid #ddd;
                                padding: 8px;
                                text-align: left;
                            }
                            .excel-content th {
                                background-color: #f5f5f5;
                            }
                            .excel-content tr:nth-child(even) {
                                background-color: #f9f9f9;
                            }
                        </style>
                    `
                    materialContent.value = excelStyles + '<div class="excel-content">' + html + '</div>'

                    // 直接更新编辑器内容
                    if (joditInstance) {
                        joditInstance.value = materialContent.value
                    }

                } else if (materialData.type === 'txt') {
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
                } else if (materialData.type === 'image') {
                    // 图片类型
                    const { data: { publicUrl } } = await supabase
                        .storage
                        .from('materials')
                        .getPublicUrl(path)

                    materialContent.value = publicUrl

                    // 直接更新编辑器内容
                    if (joditInstance) {
                        joditInstance.value = `<img src="${publicUrl}" alt="${materialData.title}" style="max-width: 100%;">`
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
    } catch (err) {
        console.error('查询失败:', err)
        ElMessage.error('获取资料失败')
    }
}

// 打开资料链接
const openMaterial = (material: any) => {
    if (!materialContent.value) return

    if (material.type === 'link' || material.type === 'video' || material.type === 'pdf') {
        window.open(materialContent.value, '_blank')
    }
}

// 查看资料
const viewMaterial = () => {
    if (!selectedMaterial.value) return
    
    const type = selectedMaterial.value.type
    
    if (type === 'word') {
        // 为Word文档准备预览URL，使用文件的公共URL
        if (wordFileUrl.value) {
            wordPreviewUrl.value = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(wordFileUrl.value)}`
        } else {
            ElMessage.error('Word文件URL获取失败')
            return
        }
    }
    
    showPreview.value = true
}

// 打开全屏预览
const openFullscreen = () => {
    if (!selectedMaterial.value) return
    
    const type = selectedMaterial.value.type
    
    if (type === 'word') {
        // 为Word文档准备预览URL，使用文件的公共URL
        if (wordFileUrl.value) {
            wordPreviewUrl.value = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(wordFileUrl.value)}`
        } else {
            ElMessage.error('Word文件URL获取失败')
            return
        }
    }
    
    fullscreenVisible.value = true
}

// 对话框关闭时清理编辑器
const handleDialogClose = () => {
    if (joditInstance) {
        joditInstance.destruct()
        joditInstance = null
    }
    // 重置预览状态
    showPreview.value = false
    fullscreenVisible.value = false
    wordPreviewUrl.value = ''
    wordFileUrl.value = ''
}

// 返回上一级
const navigateToParent = async () => {
    if (currentPath.value.length > 0) {
        currentPath.value.pop() // 移除最后一级
        currentLevel.value = currentPath.value.length > 0
            ? currentPath.value[currentPath.value.length - 1].id
            : null
        await loadCurrentLevelItems()
    }
}

// 返回根目录
const navigateToRoot = async () => {
    currentPath.value = []
    currentLevel.value = null
    await loadCurrentLevelItems()
}

// 导航到指定层级
const navigateToLevel = async (item: any) => {
    // 找到点击的项目在路径中的位置
    const index = currentPath.value.findIndex(p => p.id === item.id)
    currentPath.value = currentPath.value.slice(0, index + 1)
    currentLevel.value = item.id
    await loadCurrentLevelItems()
}

// 加载当前层级的项目
const loadCurrentLevelItems = async () => {
    loading.value = true
    folderLoading.value = true
    try {
        // 处理平台ID获取
        if (!currentPlatformId.value && selectedPlatform.value) {
            const { data, error } = await supabase
                .from('ad_platforms')
                .select('*')
                .eq('platform', selectedPlatform.value)
                .single()

            if (error) throw error
            currentPlatformId.value = data.id
            currentPlatformName.value = data.name
        }

        let folderQuery;
        let materialsQuery;

        // 根据当前层级确定查询
        if (!currentPlatformId.value && !selectedPlatform.value) {
            // 显示所有平台
            const { data, error } = await supabase
                .from('ad_platforms')
                .select('*')
                .order('name')

            if (error) throw error
            folderItems.value = data.map(platform => ({
                ...platform,
                is_folder: true
            }))
            currentItems.value = folderItems.value
            return
        }

        if (!currentLevel.value) {
            // 加载平台下的顶级分类和资料
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
        } else if (currentPath.value.length === 1) {
            // 加载分类下的子分类和资料
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
        } else if (currentPath.value.length === 2) {
            // 加载子分类下的主题和资料
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
            // 加载主题下的资料
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
        ])

        if (foldersResult.error) throw foldersResult.error
        if (materialsResult.error) throw materialsResult.error

        // 合并文件夹和文件结果
        folderItems.value = [
            ...(foldersResult.data || []).map(item => ({
                ...item,
                is_folder: true
            })),
            ...(materialsResult.data || []).map(item => ({
                ...item,
                is_folder: false
            }))
        ]
        currentItems.value = folderItems.value
    } catch (error) {
        console.error('加载失败:', error)
        ElMessage.error('加载失败')
    } finally {
        loading.value = false
        folderLoading.value = false
    }
}

// 搜索处理
const handleSearch = () => {
    loadCurrentLevelItems()
}

onMounted(() => {
    loadCurrentLevelItems()
})

onBeforeUnmount(() => {
    if (joditInstance) {
        joditInstance.destruct()
    }
})

// 图标配置
const iconList = [
    { icon: 'image', label: '图片', src: getIconUrl('image') },
    { icon: 'pdf', label: 'PDF', src: getIconUrl('pdf') },
    { icon: 'word', label: 'Word 文档', src: getIconUrl('word') },
    { icon: 'excel', label: 'Excel 表格', src: getIconUrl('excel') },
    { icon: 'txt', label: '文本文件', src: getIconUrl('txt') },
    { icon: 'link', label: '链接', src: getIconUrl('link') },
    { icon: 'video', label: '视频', src: getIconUrl('video') },
    { icon: 'zip', label: 'ZIP 压缩文件', src: getIconUrl('zip') },
    { icon: 'ppt', label: 'PPT 演示文稿', src: getIconUrl('ppt') }
]

function getIconUrl(name: string) {
    return new URL(`/src/assets/icons/${name}.png`, import.meta.url).href
}
</script>

<style scoped>
.study-search {
    margin: 20px 0 10px;
}

.grid-content-column {
    width: 100%;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    padding: 10px 0;
    cursor: pointer;
    position: relative;
    text-align: center;
}

.grid-content-column:hover {
    box-shadow: 0 1px 2px -2px rgba(0, 0, 0, 0.16),
        0 3px 6px 0 rgba(0, 0, 0, 0.12),
        0 5px 12px 4px rgba(0, 0, 0, 0.09);
    color: #46a2ff;
}

.study-content-title {
    font-size: 14px;
    margin: 5px 0 0;
    padding: 0 5px;
    line-height: 1.2;
    text-align: center;
}

.hide-text-2 {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
}

.el-breadcrumb__item {
    cursor: pointer;
}

.folder-title {
    color: #606266;
    cursor: pointer;
}

.folder-title:hover {
    color: #46a2ff;
}

.study-breadcrumb :deep(.el-card__body) {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
}

/* 新增对话框样式 */
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
    color: #46a2ff;
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

/* 新增预览相关样式 */
.material-preview {
    margin-top: 20px;
}

.preview-actions {
    margin-bottom: 15px;
    display: flex;
    gap: 10px;
}

.preview-content {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    overflow: hidden;
}

.preview-image {
    width: 100%;
    max-height: 400px;
    object-fit: contain;
    cursor: pointer;
    transition: transform 0.2s;
}

.preview-image:hover {
    transform: scale(1.02);
}

.preview-frame {
    width: 100%;
    height: 400px;
    border: none;
}

.word-preview-frame {
    width: 100%;
    height: 400px;
    border: none;
}

.link-preview {
    padding: 20px;
    text-align: center;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.link-preview p {
    margin-bottom: 15px;
    word-break: break-all;
    color: #606266;
}

/* 全屏预览样式 */
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
</style>