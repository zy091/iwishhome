<template>
    <div class="layout">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="layout-title">
            <h1 class="title">NAS文件管理</h1>
            <div class="status-tabs">
                <el-tag type="success" size="large">UGREEN NAS</el-tag>
            </div>
        </div>

        <!-- 文件夹选择器 -->
        <el-card shadow="always" style="margin-bottom: 20px;">
            <template #header>
                <div class="card-header">
                    <span>选择存储文件夹</span>
                </div>
            </template>
            <div class="folder-selector">
                <el-radio-group v-model="selectedFolder" @change="handleFolderChange" size="large">
                    <el-radio-button value="/public/case-sharing/">知识分享</el-radio-button>
                    <el-radio-button value="/public/company-documents/">公司文档</el-radio-button>
                    <el-radio-button value="/public/operation-materials/">运营资料</el-radio-button>
                    <el-radio-button value="/public/temporary-storage/">临时存储</el-radio-button>
                    <el-radio-button value="/public/video/">视频文件</el-radio-button>
                </el-radio-group>
                <div class="current-folder-info">
                    <el-tag type="info" size="large">
                        当前选择：{{ getCurrentFolderName() }}
                    </el-tag>
                </div>
            </div>
        </el-card>

        <!-- NAS文件列表 -->
        <el-card shadow="always" style="min-height: 400px;">
            <template #header>
                <div class="card-header">
                    <div class="path-navigation">
                        <span class="path-label">当前文件夹：{{ getCurrentFolderName() }}</span>
                        <span class="path-label" v-if="currentPath"> | 当前路径：</span>
                        <el-breadcrumb v-if="currentPath" separator="/">
                            <el-breadcrumb-item 
                                v-for="(pathItem, index) in currentPathArray" 
                                :key="index"
                                @click="navigateToPath(index)"
                                :class="{ 'clickable': index < currentPathArray.length - 1 }"
                            >
                                {{ pathItem.name }}
                            </el-breadcrumb-item>
                        </el-breadcrumb>
                    </div>
                    <div class="header-actions">
                        <div class="file-stats">
                            <el-tag type="success" >
                                文件: {{ getFileCount() }}
                            </el-tag>
                        </div>
                        <el-button 
                            v-if="currentPath" 
                            type="warning" 
                            
                            @click="goBack"
                        >
                            返回上级
                        </el-button>
                        <el-button type="primary" @click="refreshFileList" :loading="loadingFiles">
                            刷新列表
                        </el-button>
                        <el-button type="success" @click="downloadSelectedFile" :disabled="selectedFiles.length === 0">
                            下载文件 ({{ selectedFiles.length }})
                        </el-button>
                        <el-button type="danger" @click="deleteSelectedFile" :disabled="selectedFiles.length === 0">
                            删除文件 ({{ selectedFiles.length }})
                        </el-button>
                        <el-button type="info" @click="clearSelection" :disabled="selectedFiles.length === 0">
                            清空选择
                        </el-button>
                        <el-button type="primary" @click="showUploadDialog">
                            上传文件
                        </el-button>
                    </div>
                </div>
            </template>
            <div class="file-list-content">
                                    <el-table 
                        v-loading="loadingFiles" 
                        :data="nasFiles" 
                        @selection-change="handleFileSelectionChange"
                        @select-all="handleSelectAll"
                        ref="fileTableRef"
                        style="width: 100%"
                        height="500"
                    >
                        <el-table-column type="selection" width="55" :selectable="isSelectable" />
                    <el-table-column prop="name" label="文件名" min-width="250">
                        <template #default="{ row }">
                            <div class="file-name">
                                <el-icon v-if="row.isDirectory" color="#409EFF">
                                    <Folder />
                                </el-icon>
                                <el-icon v-else-if="isImageFile(row.name)" color="#E6A23C">
                                    <Picture />
                                </el-icon>
                                <el-icon v-else-if="isPdfFile(row.name)" color="#F56C6C">
                                    <Document />
                                </el-icon>
                                <el-icon v-else-if="isVideoFile(row.name)" color="#E6A23C">
                                    <VideoPlay />
                                </el-icon>
                                <el-icon v-else color="#67C23A">
                                    <Document />
                                </el-icon>
                                <span 
                                    :class="{ 
                                        'image-filename': isImageFile(row.name),
                                        'pdf-filename': isPdfFile(row.name),
                                        'video-filename': isVideoFile(row.name),
                                        'folder-name': row.isDirectory 
                                    }"
                                    @click="handleFileClick(row)"
                                >
                                    {{ decodeFileName(row.name) }}
                                </span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="size" label="大小" width="120">
                        <template #default="{ row }">
                            <span v-if="!row.isDirectory">{{ formatFileSize(row.size) }}</span>
                            <span v-else>-</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="modified" label="修改时间" width="180">
                        <template #default="{ row }">
                            {{ formatDate(row.modified) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="" fixed="right">
                        <template #default="{ row }">
                            <el-button-group>
                                <el-button 
                                    v-if="row.isDirectory"
                                    type="success" 
                                    
                                    @click="enterFolder(row)"
                                >
                                    进入
                                </el-button>
                                <el-button 
                                    v-if="!row.isDirectory && isImageFile(row.name)"
                                    type="info" 
                                    @click="previewImage(row)"
                                >
                                    预览
                                </el-button>
                                <el-button 
                                    v-if="!row.isDirectory && isPdfFile(row.name)"
                                    type="warning" 
                                    @click="previewPdf(row)"
                                >
                                    预览
                                </el-button>
                                <el-button 
                                    v-if="!row.isDirectory && isVideoFile(row.name)"
                                    type="success" 
                                    @click="previewVideo(row)"
                                >
                                    预览
                                </el-button>
                                <el-button 
                                    v-if="!row.isDirectory"
                                    type="primary" 
                                    @click="downloadFile(row)"
                                >
                                    下载
                                </el-button>
                                <el-button 
                                    type="danger" 
                                    @click="deleteFile(row)"
                                >
                                    删除
                                </el-button>
                            </el-button-group>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-card>





        <!-- 图片预览对话框 -->
        <el-dialog 
            v-model="imagePreviewVisible" 
            :title="`图片预览 - ${currentPreviewFile ? decodeFileName(currentPreviewFile.name) : ''}`" 
            width="80%" 
            :close-on-click-modal="true"
            top="5vh"
            class="image-preview-dialog"
        >
            <div class="image-preview-content">
                <el-image 
                    v-if="previewImageUrl" 
                    :src="previewImageUrl" 
                    :preview-src-list="[previewImageUrl]"
                    fit="contain"
                    style="width: 100%; height: 500px;"
                >
                    <template #placeholder>
                        <div class="image-slot">
                            <el-icon><Picture /></el-icon>
                            <span>加载中...</span>
                        </div>
                    </template>
                    <template #error>
                        <div class="image-slot">
                            <el-icon><Picture /></el-icon>
                            <span>加载失败</span>
                        </div>
                    </template>
                </el-image>
                
                <!-- 图片信息 -->
                <div v-if="currentPreviewFile" class="image-info">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="文件名">
                            {{ decodeFileName(currentPreviewFile.name) }}
                        </el-descriptions-item>
                        <el-descriptions-item label="文件大小">
                            {{ formatFileSize(currentPreviewFile.size) }}
                        </el-descriptions-item>
                        <el-descriptions-item label="修改时间">
                            {{ formatDate(currentPreviewFile.modified) }}
                        </el-descriptions-item>
                        <el-descriptions-item label="文件类型">
                            {{ getFileType(currentPreviewFile.name) }}
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="imagePreviewVisible = false">关闭</el-button>
                    <el-button type="primary" @click="downloadPreviewImage">下载图片</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- PDF预览对话框 -->
        <el-dialog 
            v-model="pdfPreviewVisible" 
            :title="`PDF预览 - ${currentPreviewFile ? decodeFileName(currentPreviewFile.name) : ''}`" 
            width="90%" 
            :close-on-click-modal="true"
            top="3vh"
            class="pdf-preview-dialog"
        >
            <div class="pdf-preview-content">
                <iframe 
                    v-if="previewPdfUrl" 
                    :src="previewPdfUrl" 
                    style="width: 100%; height: 600px; border: none;"
                    frameborder="0"
                ></iframe>
                
                <!-- PDF信息 -->
                <div v-if="currentPreviewFile" class="file-info">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="文件名">
                            {{ decodeFileName(currentPreviewFile.name) }}
                        </el-descriptions-item>
                        <el-descriptions-item label="文件大小">
                            {{ formatFileSize(currentPreviewFile.size) }}
                        </el-descriptions-item>
                        <el-descriptions-item label="修改时间">
                            {{ formatDate(currentPreviewFile.modified) }}
                        </el-descriptions-item>
                        <el-descriptions-item label="文件类型">
                            {{ getFileType(currentPreviewFile.name) }}
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="pdfPreviewVisible = false">关闭</el-button>
                    <el-button type="primary" @click="downloadPreviewPdf">下载PDF</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 视频预览对话框 -->
        <el-dialog 
            v-model="videoPreviewVisible" 
            :title="`视频预览 - ${currentPreviewFile ? decodeFileName(currentPreviewFile.name) : ''}`" 
            width="80%" 
            :close-on-click-modal="true"
            top="5vh"
            class="video-preview-dialog"
        >
            <div class="video-preview-content">
                <video 
                    v-if="previewVideoUrl" 
                    :src="previewVideoUrl" 
                    controls
                    style="width: 100%; max-height: 500px;"
                    preload="metadata"
                >
                    您的浏览器不支持视频播放
                </video>
                
                <!-- 视频信息 -->
                <div v-if="currentPreviewFile" class="file-info">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="文件名">
                            {{ currentPreviewFile.name }}
                        </el-descriptions-item>
                        <el-descriptions-item label="文件大小">
                            {{ formatFileSize(currentPreviewFile.size) }}
                        </el-descriptions-item>
                        <el-descriptions-item label="修改时间">
                            {{ formatDate(currentPreviewFile.modified) }}
                        </el-descriptions-item>
                        <el-descriptions-item label="文件类型">
                            {{ getFileType(currentPreviewFile.name) }}
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="videoPreviewVisible = false">关闭</el-button>
                    <el-button type="primary" @click="downloadPreviewVideo">下载视频</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 文件上传弹窗 -->
        <el-dialog 
            v-model="uploadDialogVisible" 
            :title="`上传文件到 ${getCurrentFolderName()}`" 
            width="60%" 
            :close-on-click-modal="false"
            top="8vh"
            class="upload-dialog"
        >
            <div class="upload-content">
                <el-upload
                    class="upload-demo"
                    drag
                    :auto-upload="false"
                    :on-change="handleFileChange"
                    :file-list="fileList"
                    :limit="10"
                    multiple
                    ref="uploadRef"
                >
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">
                        将文件拖到此处，或<em>点击上传</em>
                    </div>
                    <template #tip>
                        <div class="el-upload__tip">
                            支持任意类型文件，文件将上传到UGREEN NAS存储
                        </div>
                    </template>
                </el-upload>
                
                <div class="upload-actions" v-if="fileList.length > 0">
                    <el-button type="primary" @click="handleUploadToNas" :loading="uploading">
                        上传到NAS
                    </el-button>
                    <el-button @click="clearFiles">清空文件</el-button>
                </div>

                <!-- 上传进度 -->
                <div v-if="uploadProgress.length > 0" class="upload-progress">
                    <h4>上传进度</h4>
                    <div v-for="(progress, index) in uploadProgress" :key="index" class="progress-item">
                        <div class="progress-info">
                            <span class="filename">{{ decodeFileName(progress.filename) }}</span>
                            <span class="status">{{ progress.status }}</span>
                        </div>
                        <el-progress 
                            v-if="progress.status === 'uploading'" 
                            :percentage="progress.percentage" 
                            :status="progress.percentage === 100 ? 'success' : ''"
                        />
                    </div>
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="closeUploadDialog">关闭</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { UploadFilled, Folder, Document, Picture, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Breadbcrum from '@/components/system/Breadcrumb.vue'
import UGREENStorageService from '@/stores/ugreenNas'

const breadbcrum = [

    {
        name: 'NAS文件管理',
        path: '/system/nas-files'
    }
]

// 文件上传相关
const fileList = ref<any[]>([])
const uploading = ref(false)
const uploadProgress = ref<Array<{
    filename: string
    status: string
    percentage: number
}>>([])
const uploadRef = ref<any>(null)

// NAS文件列表相关
const nasFiles = ref<any[]>([])
const loadingFiles = ref(false)
const selectedFile = ref<any>(null)
const fileTableRef = ref<any>(null)
const selectedFiles = ref<any[]>([])
const currentPath = ref('')
const currentPathArray = ref<Array<{name: string, path: string}>>([])

// 连接测试相关
const testingConnection = ref(false)
const connectionStatus = ref<{
    type: 'success' | 'error'
    message: string
} | null>(null)

// 图片预览相关
const imagePreviewVisible = ref(false)
const previewImageUrl = ref<string>('')
const currentPreviewFile = ref<any>(null)

// 上传弹窗相关
const uploadDialogVisible = ref(false)

// PDF预览相关
const pdfPreviewVisible = ref(false)
const previewPdfUrl = ref<string>('')

// 视频预览相关
const videoPreviewVisible = ref(false)
const previewVideoUrl = ref<string>('')

// 文件夹选择相关
const selectedFolder = ref('/public/case-sharing/')
const folderOptions = [
    { path: '/public/case-sharing/', name: '知识分享' },
    { path: '/public/company-documents/', name: '公司文档' },
    { path: '/public/operation-materials/', name: '运营资料' },
    { path: '/public/temporary-storage/', name: '临时存储' },
    { path: '/public/video/', name: '视频文件' }
]

// 初始化UGREEN NAS服务
const nasService = new UGREENStorageService()

// 处理文件选择
const handleFileChange = (file: any, uploadFileList: any[]) => {
    // 更新本地的fileList
    fileList.value = uploadFileList
}

// 上传文件到NAS
const handleUploadToNas = async () => {
    if (fileList.value.length === 0) {
        ElMessage.warning('请先选择要上传的文件')
        return
    }

    uploading.value = true
    uploadProgress.value = []

    try {
        for (let i = 0; i < fileList.value.length; i++) {
            const file = fileList.value[i].raw || fileList.value[i]
            const filename = file.name
            const timestamp = new Date().getTime()
            const targetPath = `${timestamp}_${filename}`

            // 添加进度项
            uploadProgress.value.push({
                filename,
                status: 'uploading',
                percentage: 0
            })

            try {
                const result = await nasService.uploadFile(file, targetPath)
                
                if (result.success) {
                    // 更新进度为完成
                    const progressIndex = uploadProgress.value.findIndex(p => p.filename === filename)
                    if (progressIndex !== -1) {
                        uploadProgress.value[progressIndex].status = 'success'
                        uploadProgress.value[progressIndex].percentage = 100
                    }
                    // 移除成功提示弹窗
                } else {
                    // 更新进度为失败
                    const progressIndex = uploadProgress.value.findIndex(p => p.filename === filename)
                    if (progressIndex !== -1) {
                        uploadProgress.value[progressIndex].status = 'error'
                        uploadProgress.value[progressIndex].percentage = 0
                    }
                    // 只在失败时显示弹窗
                    ElMessage.error(`${decodeFileName(filename)} 上传失败: ${result.error}`)
                }
            } catch (error) {
                // 更新进度为失败
                const progressIndex = uploadProgress.value.findIndex(p => p.filename === filename)
                if (progressIndex !== -1) {
                    uploadProgress.value[progressIndex].status = 'error'
                    uploadProgress.value[progressIndex].percentage = 0
                }
                ElMessage.error(`${decodeFileName(filename)} 上传失败: ${error}`)
            }
        }
        
        // 上传完成后刷新文件列表
        await refreshFileList()
        
        // 上传完成后关闭弹窗
        closeUploadDialog()
    } finally {
        uploading.value = false
    }
}

// 清空文件列表
const clearFiles = () => {
    fileList.value = []
    uploadProgress.value = []
    // 清空Element Plus上传组件的文件列表
    if (uploadRef.value) {
        uploadRef.value.clearFiles()
    }
}

// 刷新文件列表
const refreshFileList = async () => {
    loadingFiles.value = true
    try {
        const files = await nasService.getFileList(currentPath.value)
        nasFiles.value = files
        
        // 更新路径数组
        updatePathArray()
        
        // 清空选择状态
        clearSelection()
        // 移除成功提示弹窗
    } catch (error) {
        console.error('获取文件列表失败:', error)
        // 只在错误时显示弹窗
        ElMessage.error('获取文件列表失败')
    } finally {
        loadingFiles.value = false
    }
}

// 更新路径数组
const updatePathArray = () => {
    const pathArray: Array<{name: string, path: string}> = [
        { name: getCurrentFolderName(), path: '' }
    ]
    
    if (currentPath.value) {
        const pathParts = currentPath.value.split('/').filter(part => part)
        let currentFullPath = ''
        
        for (const part of pathParts) {
            currentFullPath += `/${part}`
            pathArray.push({
                name: part,
                path: currentFullPath
            })
        }
    }
    
    currentPathArray.value = pathArray
}

// 处理文件选择变化
const handleFileSelectionChange = (selection: any[]) => {
    try {
        // 过滤掉目录，只保留文件
        const filesOnly = selection.filter(item => !item.isDirectory)
        selectedFiles.value = filesOnly
        selectedFile.value = filesOnly.length > 0 ? filesOnly[0] : null
    } catch (error) {
        console.error('处理文件选择变化失败:', error)
        selectedFiles.value = []
        selectedFile.value = null
    }
}

// 处理全选
const handleSelectAll = (selection: any[]) => {
    try {
        // 过滤掉目录，只保留文件
        const filesOnly = selection.filter(item => !item.isDirectory)
        selectedFiles.value = filesOnly
        selectedFile.value = filesOnly.length > 0 ? filesOnly[0] : null
    } catch (error) {
        console.error('处理全选失败:', error)
        selectedFiles.value = []
        selectedFile.value = null
    }
}

// 判断文件是否可选
const isSelectable = (row: any) => {
    return !row.isDirectory
}

// 清空选择
const clearSelection = () => {
    selectedFiles.value = []
    selectedFile.value = null
    if (fileTableRef.value) {
        fileTableRef.value.clearSelection()
    }
}

// 导航到指定路径
const navigateToPath = async (index: number) => {
    if (index < currentPathArray.value.length - 1) {
        const targetPath = currentPathArray.value[index].path
        currentPath.value = targetPath
        await refreshFileList()
    }
}

// 进入文件夹
const enterFolder = async (folder: any) => {
    if (folder.isDirectory) {
        currentPath.value = folder.path
        await refreshFileList()
    }
}

// 返回上级目录
const goBack = async () => {
    if (currentPath.value) {
        const pathParts = currentPath.value.split('/').filter(part => part)
        if (pathParts.length > 0) {
            pathParts.pop() // 移除最后一级
            currentPath.value = pathParts.length > 0 ? `/${pathParts.join('/')}` : ''
            await refreshFileList()
        }
    }
}


// 获取文件数量
const getFileCount = () => {
    return nasFiles.value.filter(item => !item.isDirectory).length
}

// 处理文件夹选择变化
const handleFolderChange = async (folderPath: string) => {
    // 设置NAS服务的基础路径
    nasService.setBasePath(folderPath)
    
    // 重置当前路径
    currentPath.value = ''
    
    // 刷新文件列表
    await refreshFileList()
    
    // 移除成功提示弹窗
}

// 获取当前文件夹名称
const getCurrentFolderName = () => {
    const folder = folderOptions.find(option => option.path === selectedFolder.value)
    return folder ? folder.name : '未知文件夹'
}

// 下载选中的文件
const downloadSelectedFile = async () => {
    if (selectedFiles.value.length === 0) {
        ElMessage.warning('请先选择要下载的文件')
        return
    }
    
    try {
        for (const file of selectedFiles.value) {
            if (!file.isDirectory) {
                await downloadFile(file)
            }
        }
        ElMessage.success(`成功下载 ${selectedFiles.value.length} 个文件`)
    } catch (error) {
        console.error('批量下载失败:', error)
        ElMessage.error('批量下载失败')
    }
}

// 下载文件
const downloadFile = async (file: any) => {
    if (file.isDirectory) return
    
    try {
        const blob = await nasService.downloadFile(file.name)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        // 移除成功提示弹窗
    } catch (error) {
        console.error('下载文件失败:', error)
        ElMessage.error('下载文件失败')
    }
}

// 删除选中的文件
const deleteSelectedFile = async () => {
    if (selectedFiles.value.length === 0) {
        ElMessage.warning('请先选择要删除的文件')
        return
    }
    
    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedFiles.value.length} 个文件吗？此操作不可恢复。`,
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        
        let successCount = 0
        for (const file of selectedFiles.value) {
            if (!file.isDirectory) {
                const success = await nasService.deleteFile(file.name)
                if (success) successCount++
            }
        }
        
        ElMessage.success(`成功删除 ${successCount} 个文件`)
        refreshFileList() // 刷新列表
        selectedFiles.value = [] // 清空选择
        if (fileTableRef.value) {
            fileTableRef.value.clearSelection()
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量删除失败:', error)
            ElMessage.error('批量删除失败')
        }
    }
}

// 删除文件
const deleteFile = async (file: any) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除文件 "${decodeFileName(file.name)}" 吗？此操作不可恢复。`,
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        
        const success = await nasService.deleteFile(file.name)
        if (success) {
            // 移除成功提示弹窗
            refreshFileList() // 刷新列表
        } else {
            ElMessage.error('文件删除失败')
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除文件失败:', error)
            ElMessage.error('删除文件失败')
        }
    }
}



// 格式化文件大小
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateString: string): string => {
    if (!dateString) return '-'
    try {
        const date = new Date(dateString)
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch (error) {
        return dateString
    }
}

// URL解码文件名
const decodeFileName = (filename: string): string => {
    try {
        // 解码URL编码的字符
        return decodeURIComponent(filename)
    } catch (error) {
        // 如果解码失败，返回原文件名
        console.warn('文件名解码失败:', filename, error)
        return filename
    }
}

// 判断是否为图片文件
const isImageFile = (filename: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
    const lowerFilename = filename.toLowerCase()
    return imageExtensions.some(ext => lowerFilename.endsWith(ext))
}

// 判断是否为PDF文件
const isPdfFile = (filename: string): boolean => {
    const lowerFilename = filename.toLowerCase()
    return lowerFilename.endsWith('.pdf')
}

// 判断是否为视频文件
const isVideoFile = (filename: string): boolean => {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v']
    const lowerFilename = filename.toLowerCase()
    return videoExtensions.some(ext => lowerFilename.endsWith(ext))
}

// 预览图片
const previewImage = async (file: any) => {
    if (file.isDirectory) return
    
    try {
        currentPreviewFile.value = file
        imagePreviewVisible.value = true
        
        // 获取图片的blob URL用于预览
        const blob = await nasService.downloadFile(file.name)
        const url = window.URL.createObjectURL(blob)
        previewImageUrl.value = url
        
        // 移除成功提示弹窗
    } catch (error) {
        console.error('预览图片失败:', error)
        ElMessage.error('预览图片失败')
    }
}

// 下载预览的图片
const downloadPreviewImage = async () => {
    if (!currentPreviewFile.value) return
    
    try {
        await downloadFile(currentPreviewFile.value)
        imagePreviewVisible.value = false
    } catch (error) {
        console.error('下载预览图片失败:', error)
        ElMessage.error('下载预览图片失败')
    }
}

// 获取文件类型
const getFileType = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase() || ''
    const typeMap: { [key: string]: string } = {
        'jpg': 'JPEG图像',
        'jpeg': 'JPEG图像',
        'png': 'PNG图像',
        'gif': 'GIF图像',
        'bmp': 'BMP图像',
        'webp': 'WebP图像',
        'svg': 'SVG矢量图',
        'pdf': 'PDF文档',
        'mp4': 'MP4视频',
        'avi': 'AVI视频',
        'mov': 'MOV视频',
        'wmv': 'WMV视频',
        'flv': 'FLV视频',
        'webm': 'WebM视频',
        'mkv': 'MKV视频',
        'm4v': 'M4V视频'
    }
    return typeMap[extension] || '未知类型'
}

// 处理文件点击
const handleFileClick = (file: any) => {
    if (file.isDirectory) {
        enterFolder(file)
    } else if (isImageFile(file.name)) {
        previewImage(file)
    } else if (isPdfFile(file.name)) {
        previewPdf(file)
    } else if (isVideoFile(file.name)) {
        previewVideo(file)
    }
}

// 预览PDF
const previewPdf = async (file: any) => {
    if (file.isDirectory) return
    
    try {
        currentPreviewFile.value = file
        pdfPreviewVisible.value = true
        
        // 获取PDF的blob URL用于预览
        const blob = await nasService.downloadFile(file.name)
        const url = window.URL.createObjectURL(blob)
        previewPdfUrl.value = url
    } catch (error) {
        console.error('预览PDF失败:', error)
        ElMessage.error('预览PDF失败')
    }
}

// 预览视频
const previewVideo = async (file: any) => {
    if (file.isDirectory) return
    
    try {
        currentPreviewFile.value = file
        videoPreviewVisible.value = true
        
        // 获取视频的blob URL用于预览
        const blob = await nasService.downloadFile(file.name)
        const url = window.URL.createObjectURL(blob)
        previewVideoUrl.value = url
    } catch (error) {
        console.error('预览视频失败:', error)
        ElMessage.error('预览视频失败')
    }
}

// 下载预览的PDF
const downloadPreviewPdf = async () => {
    if (!currentPreviewFile.value) return
    
    try {
        await downloadFile(currentPreviewFile.value)
        pdfPreviewVisible.value = false
    } catch (error) {
        console.error('下载预览PDF失败:', error)
        ElMessage.error('下载预览PDF失败')
    }
}

// 下载预览的视频
const downloadPreviewVideo = async () => {
    if (!currentPreviewFile.value) return
    
    try {
        await downloadFile(currentPreviewFile.value)
        videoPreviewVisible.value = false
    } catch (error) {
        console.error('下载预览视频失败:', error)
        ElMessage.error('下载预览视频失败')
    }
}

// 显示上传弹窗
const showUploadDialog = () => {
    uploadDialogVisible.value = true
}

// 关闭上传弹窗
const closeUploadDialog = () => {
    uploadDialogVisible.value = false
    // 清空文件列表和进度
    clearFiles()
}

onMounted(() => {
    // 设置初始文件夹
    nasService.setBasePath(selectedFolder.value)
    
    // 页面加载时获取文件列表
    refreshFileList()
    
    // 初始化路径数组
    updatePathArray()
})

// 监听文件列表变化，确保选择状态正确
watch(nasFiles, (newFiles) => {
    // 如果文件列表发生变化，检查选中的文件是否仍然存在
    if (selectedFiles.value.length > 0) {
        const existingFiles = selectedFiles.value.filter(selected => 
            newFiles.some(file => file.name === selected.name)
        )
        if (existingFiles.length !== selectedFiles.value.length) {
            selectedFiles.value = existingFiles
            selectedFile.value = existingFiles.length > 0 ? existingFiles[0] : null
        }
    }
}, { deep: true })
</script>

<style scoped>
.layout {
    min-height: calc(100vh - 60px);
}

.layout-title {
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.title {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
    margin: 0;
}

.status-tabs {
    margin-bottom: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header h2 {
    margin: 0;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.file-stats {
    display: flex;
    gap: 8px;
    margin-right: 15px;
}

.folder-selector {
    display: flex;
    justify-content: start;
    align-items: center;
    gap: 20px;
}

/* .folder-selector .el-radio-group {
    margin-bottom: 20px;
} */

.current-folder-info {
    text-align: center;
}

.path-navigation {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
}

.path-label {
    font-weight: 500;
    color: #606266;
    white-space: nowrap;
}

.path-navigation :deep(.el-breadcrumb) {
    flex: 1;
}

.path-navigation :deep(.el-breadcrumb__item) {
    cursor: pointer;
}

.path-navigation :deep(.el-breadcrumb__item.clickable) {
    color: #409eff;
}

.path-navigation :deep(.el-breadcrumb__item.clickable:hover) {
    color: #66b1ff;
    text-decoration: underline;
}

/* 文件上传模块样式 */
.upload-content {
    padding: 10px 0;
}

.upload-actions {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    justify-content: center;
}

.upload-actions .el-button {
    min-width: 120px;
}

.upload-progress {
    margin-top: 20px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.upload-progress h4 {
    margin: 0 0 15px 0;
    color: #303133;
    font-size: 16px;
    font-weight: bold;
}

.progress-item {
    margin-bottom: 15px;
    padding: 15px;
    background-color: white;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.filename {
    font-weight: 500;
    color: #303133;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.status {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
    background-color: #f0f9eb;
    color: #67c23a;
}

.status.error {
    background-color: #fef0f0;
    color: #f56c6c;
}

.status.success {
    background-color: #f0f9eb;
    color: #67c23a;
}

/* 文件列表样式 */
.file-name {
    display: flex;
    align-items: center;
    gap: 8px;
}

.file-name .el-icon {
    font-size: 16px;
}

.image-filename {
    cursor: pointer;
    color: #E6A23C;
    font-weight: 500;
    transition: all 0.3s ease;
}

.image-filename:hover {
    text-decoration: underline;
    color: #D69E1F;
    transform: translateY(-1px);
}

.folder-name {
    cursor: pointer;
    color: #409EFF;
    font-weight: 500;
    transition: all 0.3s ease;
}

.folder-name:hover {
    text-decoration: underline;
    color: #66b1ff;
    transform: translateY(-1px);
}

.pdf-filename {
    cursor: pointer;
    color: #F56C6C;
    font-weight: 500;
    transition: all 0.3s ease;
}

.pdf-filename:hover {
    text-decoration: underline;
    color: #f78989;
    transform: translateY(-1px);
}

.video-filename {
    cursor: pointer;
    color: #E6A23C;
    font-weight: 500;
    transition: all 0.3s ease;
}

.video-filename:hover {
    text-decoration: underline;
    color: #D69E1F;
    transform: translateY(-1px);
}

.file-list-content {
    padding: 15px 0;
}

/* 连接状态样式 */
.connection-status {
    margin-top: 15px;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    text-align: center;
    font-weight: 500;
}

.connection-status.success {
    background-color: #f0f9eb;
    color: #67c23a;
    border: 1px solid #c2e7b0;
    box-shadow: 0 2px 4px rgba(103, 194, 58, 0.1);
}

.connection-status.error {
    background-color: #fef0f0;
    color: #f56c6c;
    border: 1px solid #fbc4c4;
    box-shadow: 0 2px 4px rgba(245, 108, 108, 0.1);
}

/* Element Plus 上传组件样式 */
:deep(.el-upload-dragger) {
    width: 100%;
    border: 2px dashed #dcdfe6;
    border-radius: 6px;
    transition: all 0.3s ease;
}

:deep(.el-upload-dragger:hover) {
    border-color: #409eff;
    background-color: #f0f9ff;
}

:deep(.el-icon--upload) {
    margin: 10px 0;
    font-size: 28px;
    color: #c0c4cc;
}

:deep(.el-upload__text) {
    color: #606266;
    font-size: 14px;
    margin: 8px 0;
}

:deep(.el-upload__text em) {
    color: #409EFF;
    font-style: normal;
    font-weight: 500;
}

/* 表格样式增强 */
:deep(.el-table) {
    border-radius: 6px;
    overflow: hidden;
}

:deep(.el-table__header) {
    background-color: #f5f7fa;
}

:deep(.el-table__row:hover) {
    background-color: #f0f9ff;
}

/* 按钮组样式 */
:deep(.el-button-group .el-button) {
    margin-right: 0;
}

:deep(.el-button-group .el-button:not(:last-child)) {
    border-right: 1px solid #dcdfe6;
}

/* 图片预览对话框样式 */
.image-preview-dialog :deep(.el-dialog__body) {
    padding: 20px;
    text-align: center;
}

/* 上传弹窗样式 */
.upload-dialog :deep(.el-dialog__body) {
    padding: 20px;
}

.upload-dialog :deep(.el-dialog__header) {
    padding: 15px 25px;
    margin-right: 0;
    background-color: #f5f7fa;
    border-bottom: 1px solid #eaeaea;
}

.upload-dialog :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}

.upload-dialog :deep(.el-dialog__footer) {
    padding: 15px 25px;
    border-top: 1px solid #eaeaea;
}

/* PDF预览弹窗样式 */
.pdf-preview-dialog :deep(.el-dialog__body) {
    padding: 20px;
}

.pdf-preview-dialog :deep(.el-dialog__header) {
    padding: 15px 25px;
    margin-right: 0;
    background-color: #f5f7fa;
    border-bottom: 1px solid #eaeaea;
}

.pdf-preview-dialog :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}

.pdf-preview-dialog :deep(.el-dialog__footer) {
    padding: 15px 25px;
    border-top: 1px solid #eaeaea;
}

/* 视频预览弹窗样式 */
.video-preview-dialog :deep(.el-dialog__body) {
    padding: 20px;
}

.video-preview-dialog :deep(.el-dialog__header) {
    padding: 15px 25px;
    margin-right: 0;
    background-color: #f5f7fa;
    border-bottom: 1px solid #eaeaea;
}

.video-preview-dialog :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}

.video-preview-dialog :deep(.el-dialog__footer) {
    padding: 15px 25px;
    border-top: 1px solid #eaeaea;
}

.image-preview-dialog :deep(.el-dialog__header) {
    padding: 15px 25px;
    margin-right: 0;
    background-color: #f5f7fa;
    border-bottom: 1px solid #eaeaea;
}

.image-preview-dialog :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}

.image-preview-dialog :deep(.el-dialog__footer) {
    padding: 15px 25px;
    border-top: 1px solid #eaeaea;
}

.image-preview-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 500px;
}

.image-info {
    margin-top: 20px;
    width: 100%;
    max-width: 600px;
}

.image-info :deep(.el-descriptions__header) {
    margin-bottom: 15px;
}

.image-info :deep(.el-descriptions__body) {
    background-color: #f8f9fa;
    border-radius: 6px;
}

.pdf-preview-content,
.video-preview-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 600px;
}

.file-info {
    margin-top: 20px;
    width: 100%;
    max-width: 600px;
}

.file-info :deep(.el-descriptions__header) {
    margin-bottom: 15px;
}

.file-info :deep(.el-descriptions__body) {
    background-color: #f8f9fa;
    border-radius: 6px;
}

.image-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 500px;
    color: #909399;
    font-size: 14px;
    background-color: #f8f9fa;
    border-radius: 6px;
    border: 2px dashed #dcdfe6;
}

.image-slot .el-icon {
    font-size: 48px;
    margin-bottom: 16px;
    color: #c0c4cc;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .layout-title {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
    }
    
    .header-actions {
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .header-actions .el-button {
        flex: 1;
        min-width: auto;
    }
    
    .upload-actions {
        flex-direction: column;
        align-items: center;
    }
    
    .upload-actions .el-button {
        width: 100%;
        max-width: 200px;
    }
}

/* 过渡动画 */
.el-card {
    transition: all 0.3s ease;
}

.el-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.el-button {
    transition: all 0.3s ease;
}

.el-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style> 