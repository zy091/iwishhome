<template>
    <div class="word-file-manager">
        <!-- 页面标题 -->
        <div class="page-header">
            <h1 class="page-title">Word文件管理</h1>
            <p class="page-subtitle">上传和管理Word文档，支持在线查看和编辑</p>
        </div>

        <!-- 操作工具栏 -->
        <el-card class="toolbar-card" shadow="always">
            <div class="toolbar">
                <div class="toolbar-left">
                    <el-button type="primary" @click="showUploadDialog = true" :icon="Upload">
                        上传Word文件
                    </el-button>
                    <el-button @click="refreshFileList" :icon="Refresh" :loading="loading">
                        刷新列表
                    </el-button>
                </div>
                <div class="toolbar-right">
                    <el-input
                        v-model="searchKeyword"
                        placeholder="搜索文件名..."
                        :prefix-icon="Search"
                        clearable
                        style="width: 300px"
                        @input="handleSearch"
                    />
                </div>
            </div>
        </el-card>

        <!-- 文件列表 -->
        <el-card class="file-list-card" shadow="always">
            <template #header>
                <div class="card-header">
                    <span>文件列表</span>
                    <el-tag type="info">{{ filteredFiles.length }} 个文件</el-tag>
                </div>
            </template>

            <el-table 
                :data="filteredFiles" 
                v-loading="loading" 
                style="width: 100%"
                @row-click="handleRowClick"
                row-class-name="file-row"
            >
                <el-table-column label="" width="60">
                    <template #default="{ row }">
                        <el-icon :size="24" color="#1890ff">
                            <Document />
                        </el-icon>
                    </template>
                </el-table-column>
                
                <el-table-column prop="name" label="文件名" min-width="200">
                    <template #default="{ row }">
                        <div class="file-name">
                            <span class="name-text">{{ row.name }}</span>
                            <el-tag size="small" type="success">{{ getFileTypeDisplay(row.file_type) }}</el-tag>
                        </div>
                    </template>
                </el-table-column>
                
                <el-table-column prop="file_size" label="文件大小" width="120">
                    <template #default="{ row }">
                        {{ formatFileSize(row.file_size) }}
                    </template>
                </el-table-column>
                
                <el-table-column prop="created_at" label="上传时间" width="180">
                    <template #default="{ row }">
                        {{ formatDate(row.created_at) }}
                    </template>
                </el-table-column>
                
                <el-table-column prop="updated_at" label="最后修改" width="180">
                    <template #default="{ row }">
                        {{ formatDate(row.updated_at) }}
                    </template>
                </el-table-column>
                
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="{ row }">
                        <el-button-group>
                            <el-button 
                                type="primary" 
                                size="small" 
                                @click.stop="openFile(row)"
                                :icon="View"
                            >
                                打开
                            </el-button>
                            <el-button 
                                type="success" 
                                size="small" 
                                @click.stop="downloadFile(row)"
                                :icon="Download"
                            >
                                下载
                            </el-button>
                            <el-button 
                                type="danger" 
                                size="small" 
                                @click.stop="deleteFile(row)"
                                :icon="Delete"
                            >
                                删除
                            </el-button>
                        </el-button-group>
                    </template>
                </el-table-column>
            </el-table>

            <el-empty v-if="!loading && filteredFiles.length === 0" description="暂无文件" />
        </el-card>

        <!-- 上传对话框 -->
        <el-dialog 
            v-model="showUploadDialog" 
            title="上传Word文件" 
            width="600px"
            :close-on-click-modal="false"
        >
            <div class="upload-content">
                <el-upload
                    class="upload-dragger"
                    drag
                    :auto-upload="false"
                    :on-change="handleFileChange"
                    :file-list="uploadFileList"
                    :limit="1"
                    accept=".doc,.docx"
                    :before-upload="beforeUpload"
                >
                    <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                    <div class="el-upload__text">
                        将Word文件拖到此处，或<em>点击上传</em>
                    </div>
                    <template #tip>
                        <div class="el-upload__tip">
                            支持 .doc 和 .docx 格式，文件大小不超过 50MB
                        </div>
                    </template>
                </el-upload>

                <div v-if="selectedFile" class="file-info">
                    <h4>文件信息</h4>
                    <p><strong>文件名:</strong> {{ selectedFile.name }}</p>
                    <p><strong>文件大小:</strong> {{ formatFileSize(selectedFile.size) }}</p>
                    <p><strong>文件类型:</strong> {{ selectedFile.type }}</p>
                </div>
            </div>

            <template #footer>
                <el-button @click="showUploadDialog = false">取消</el-button>
                <el-button 
                    type="primary" 
                    @click="uploadFile" 
                    :loading="uploading"
                    :disabled="!selectedFile"
                >
                    上传文件
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
    Upload, 
    Refresh, 
    Search, 
    Document, 
    View, 
    Download, 
    Delete,
    UploadFilled 
} from '@element-plus/icons-vue'
import { supabase } from '@/lib/supabaseClient'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const uploading = ref(false)
const showUploadDialog = ref(false)
const searchKeyword = ref('')
const fileList = ref<any[]>([])
const uploadFileList = ref<any[]>([])
const selectedFile = ref<File | null>(null)

// 计算属性
const filteredFiles = computed(() => {
    if (!searchKeyword.value) {
        return fileList.value
    }
    return fileList.value.filter(file => 
        file.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
})

// 中文转拼音映射表（常用词汇）
const chineseToPinyin: Record<string, string> = {
    '年': 'nian',
    '月': 'yue', 
    '日': 'ri',
    '培训': 'peixun',
    '流程': 'liucheng',
    '手册': 'shouce',
    '文档': 'wendang',
    '资料': 'ziliao',
    '教程': 'jiaocheng',
    '指南': 'zhinan',
    '说明': 'shuoming',
    '报告': 'baogao',
    '总结': 'zongjie',
    '计划': 'jihua',
    '方案': 'fangan',
    '优化': 'youhua',
    '师': 'shi',
    'Google': 'google',
    '百度': 'baidu',
    '腾讯': 'tencent',
    '阿里': 'ali',
    '测试': 'ceshi',
    '开发': 'kaifa',
    '设计': 'sheji',
    '产品': 'chanpin',
    '运营': 'yunying',
    '市场': 'shichang',
    '销售': 'xiaoshou',
    '客服': 'kefu',
    '技术': 'jishu',
    '管理': 'guanli',
    '财务': 'caiwu',
    '人事': 'renshi',
    '行政': 'xingzheng'
}

// 中文转英文映射表
const chineseToEnglish: Record<string, string> = {
    '年': 'year',
    '月': 'month',
    '日': 'day',
    '培训': 'training',
    '流程': 'process',
    '手册': 'manual',
    '文档': 'document',
    '资料': 'material',
    '教程': 'tutorial',
    '指南': 'guide',
    '说明': 'instruction',
    '报告': 'report',
    '总结': 'summary',
    '计划': 'plan',
    '方案': 'solution',
    '优化': 'optimization',
    '师': 'specialist',
    'Google': 'google',
    '百度': 'baidu',
    '腾讯': 'tencent',
    '阿里': 'alibaba',
    '测试': 'test',
    '开发': 'development',
    '设计': 'design',
    '产品': 'product',
    '运营': 'operation',
    '市场': 'market',
    '销售': 'sales',
    '客服': 'customer_service',
    '技术': 'technology',
    '管理': 'management',
    '财务': 'finance',
    '人事': 'hr',
    '行政': 'administration'
}

// 智能文件名转换
const translateFileName = (fileName: string): string => {
    if (!fileName) return 'untitled'
    
    let translated = fileName
    
    // 先尝试英文映射
    for (const [chinese, english] of Object.entries(chineseToEnglish)) {
        translated = translated.replace(new RegExp(chinese, 'g'), english)
    }
    
    // 如果还有中文字符，使用拼音映射
    for (const [chinese, pinyin] of Object.entries(chineseToPinyin)) {
        translated = translated.replace(new RegExp(chinese, 'g'), pinyin)
    }
    
    // 处理剩余的中文字符（转换为拼音或移除）
    translated = translated.replace(/[\u4e00-\u9fff]/g, (char) => {
        // 简单的中文字符处理，可以扩展
        const charCode = char.charCodeAt(0)
        return `char_${charCode}`
    })
    
    return translated
}

// 清理文件名，移除不支持的字符
const sanitizeFileName = (fileName: string): string => {
    if (!fileName) return 'untitled'
    
    // 先进行中文转译
    let translated = translateFileName(fileName)
    
    // 移除或替换不支持的字符
    let sanitized = translated
        .replace(/[^\w\s\-_.]/g, '') // 只保留字母、数字、空格、连字符、下划线和点
        .replace(/\s+/g, '_') // 将空格替换为下划线
        .replace(/_+/g, '_') // 将多个连续下划线替换为单个下划线
        .replace(/^_|_$/g, '') // 移除开头和结尾的下划线
        .toLowerCase() // 转换为小写
        .substring(0, 100) // 限制长度
    
    // 如果清理后为空，使用默认名称
    if (!sanitized || sanitized.trim() === '') {
        sanitized = 'untitled'
    }
    
    return sanitized
}

// 反向转译：将存储的文件名转回友好的显示名称
const reverseTranslateFileName = (storedFileName: string, originalFileName: string): string => {
    // 如果原始文件名存在，优先使用原始文件名
    if (originalFileName) {
        return originalFileName
    }
    
    // 否则尝试从存储的文件名推断
    // 移除时间戳前缀
    const withoutTimestamp = storedFileName.replace(/^\d+-/, '')
    
    // 移除文件扩展名
    const withoutExtension = withoutTimestamp.replace(/\.[^/.]+$/, '')
    
    // 简单的反向映射（可以扩展）
    const englishToChinese: Record<string, string> = {
        'year': '年',
        'month': '月',
        'day': '日',
        'training': '培训',
        'process': '流程',
        'manual': '手册',
        'document': '文档',
        'material': '资料',
        'tutorial': '教程',
        'guide': '指南',
        'instruction': '说明',
        'report': '报告',
        'summary': '总结',
        'plan': '计划',
        'solution': '方案',
        'optimization': '优化',
        'specialist': '师',
        'google': 'Google',
        'baidu': '百度',
        'tencent': '腾讯',
        'alibaba': '阿里',
        'test': '测试',
        'development': '开发',
        'design': '设计',
        'product': '产品',
        'operation': '运营',
        'market': '市场',
        'sales': '销售',
        'customer_service': '客服',
        'technology': '技术',
        'management': '管理',
        'finance': '财务',
        'hr': '人事',
        'administration': '行政'
    }
    
    let displayName = withoutExtension
    
    // 尝试反向映射
    for (const [english, chinese] of Object.entries(englishToChinese)) {
        displayName = displayName.replace(new RegExp(english, 'g'), chinese)
    }
    
    // 处理下划线
    displayName = displayName.replace(/_/g, ' ')
    
    return displayName || storedFileName
}

// 获取文件类型显示名称
const getFileTypeDisplay = (fileType: string): string => {
    if (!fileType) return 'UNKNOWN'
    
    if (fileType.includes('wordprocessingml')) {
        return 'DOCX'
    } else if (fileType.includes('msword')) {
        return 'DOC'
    } else if (fileType.includes('pdf')) {
        return 'PDF'
    } else if (fileType.includes('text')) {
        return 'TXT'
    } else {
        return fileType.toUpperCase()
    }
}

// 文件上传前验证
const beforeUpload = (file: File) => {
    const isValidType = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ].includes(file.type)
    
    const isValidSize = file.size / 1024 / 1024 < 50 // 50MB

    if (!isValidType) {
        ElMessage.error('只支持 Word 文档格式！')
        return false
    }
    if (!isValidSize) {
        ElMessage.error('文件大小不能超过 50MB！')
        return false
    }
    return true
}

// 文件选择处理
const handleFileChange = (file: any) => {
    if (file.raw) {
        selectedFile.value = file.raw
    }
}

// 上传文件
const uploadFile = async () => {
    if (!selectedFile.value) {
        ElMessage.warning('请先选择要上传的文件')
        return
    }

    uploading.value = true
    try {
        // 生成唯一文件名
        const timestamp = Date.now()
        const originalFileName = selectedFile.value.name
        const fileExtension = originalFileName.split('.').pop()
        const sanitizedFileName = sanitizeFileName(originalFileName.replace(/\.[^/.]+$/, ''))
        const uniqueFileName = `${timestamp}-${sanitizedFileName}.${fileExtension}`
        
        console.log('原始文件名:', originalFileName)
        console.log('转译后文件名:', sanitizedFileName)
        console.log('最终存储文件名:', uniqueFileName)

        // 上传到Supabase存储
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(`word-files/${uniqueFileName}`, selectedFile.value)

        if (uploadError) throw uploadError

        // 获取公共URL
        const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(uploadData.path)

        // 保存文件信息到数据库
        const { data: insertData, error: insertError } = await supabase
            .from('word_files')
            .insert({
                name: originalFileName, // 使用原始文件名作为显示名称
                original_name: originalFileName,
                file_path: uploadData.path,
                public_url: urlData.publicUrl,
                file_size: selectedFile.value.size,
                file_type: selectedFile.value.type,
                mime_type: selectedFile.value.type
            })
            .select()
            .single()

        if (insertError) throw insertError




        
        // 如果文件名被修改，提示用户
        if (originalFileName !== sanitizedFileName + '.' + fileExtension) {
            ElMessage.success(`文件上传成功！文件名已转译`)
        } else {
            ElMessage.success('文件上传成功！')
        }
        
        // 重置上传状态
        showUploadDialog.value = false
        selectedFile.value = null
        uploadFileList.value = []
        
        // 刷新文件列表
        await loadFileList()

    } catch (error: any) {
        console.error('上传失败:', error)
        ElMessage.error(`上传失败: ${error.message}`)
    } finally {
        uploading.value = false
    }
}

// 加载文件列表
const loadFileList = async () => {
    loading.value = true
    try {
        const { data, error } = await supabase
            .from('word_files')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        
        console.log('加载的文件列表:', data)
        fileList.value = data || []
        console.log('设置的文件列表:', fileList.value)
    } catch (error: any) {
        console.error('加载文件列表失败:', error)
        ElMessage.error('加载文件列表失败')
    } finally {
        loading.value = false
    }
}

// 打开文件
const openFile = (file: any) => {
    router.push({
        name: 'word-viewer',
        params: { id: file.id },
        query: { 
            url: file.public_url,
            name: file.name
        }
    })
}

// 处理行点击
const handleRowClick = (row: any) => {
    openFile(row)
}

// 下载文件
const downloadFile = async (file: any) => {
    try {
        const link = document.createElement('a')
        link.href = file.public_url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        ElMessage.success('文件下载开始')
    } catch (error: any) {
        console.error('下载失败:', error)
        ElMessage.error('下载失败')
    }
}

// 删除文件
const deleteFile = async (file: any) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除文件 "${file.name}" 吗？`,
            '警告',
            { type: 'warning' }
        )

        // 删除存储中的文件
        const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([file.file_path])

        if (storageError) {
            console.warn('删除存储文件失败:', storageError)
        }

        // 删除数据库记录
        const { error: deleteError } = await supabase
            .from('word_files')
            .delete()
            .eq('id', file.id)

        if (deleteError) throw deleteError

        ElMessage.success('文件删除成功')
        await loadFileList()

    } catch (error: any) {
        if (error !== 'cancel') {
            console.error('删除失败:', error)
            ElMessage.error('删除失败')
        }
    }
}

// 搜索处理
const handleSearch = () => {
    // 搜索逻辑在计算属性中处理
}

// 刷新文件列表
const refreshFileList = async () => {
    await loadFileList()
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateString: string): string => {
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

// 测试数据库连接
const testDatabaseConnection = async () => {
    try {
        console.log('测试数据库连接...')
        
        // 测试表是否存在
        const { data, error } = await supabase
            .from('word_files')
            .select('count')
            .limit(1)
            
        if (error) {
            console.error('数据库连接测试失败:', error)
            ElMessage.error(`数据库连接失败: ${error.message}`)
        } else {
            console.log('数据库连接成功')
        }
    } catch (error: any) {
        console.error('数据库连接测试异常:', error)
    }
}

onMounted(() => {
    testDatabaseConnection()
    loadFileList()
})
</script>

<style scoped>
.word-file-manager {
    /* padding: 20px;
    background-color: #f5f5f5; */
    min-height: 100vh;
}

.page-header {
    margin-bottom: 20px;
}

.page-title {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 8px 0;
}

.page-subtitle {
    color: #666;
    margin: 0;
    font-size: 14px;
}

.toolbar-card {
    margin-bottom: 20px;
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.toolbar-left {
    display: flex;
    gap: 12px;
}

.toolbar-right {
    display: flex;
    align-items: center;
}

.file-list-card {
    min-height: 400px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.file-row {
    cursor: pointer;
    transition: background-color 0.2s;
}

.file-row:hover {
    background-color: #f0f9ff;
}

.file-name {
    display: flex;
    align-items: center;
    gap: 8px;
}

.name-text {
    font-weight: 500;
    color: #303133;
}

.upload-content {
    padding: 20px 0;
}

.upload-dragger {
    width: 100%;
}

.file-info {
    margin-top: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
}

.file-info h4 {
    margin: 0 0 10px 0;
    color: #303133;
    font-size: 16px;
}

.file-info p {
    margin: 5px 0;
    color: #606266;
    font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .word-file-manager {
        padding: 15px;
    }
    
    .toolbar {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
    }
    
    .toolbar-left,
    .toolbar-right {
        justify-content: center;
    }
    
    .page-title {
        font-size: 24px;
    }
}

/* 表格样式优化 */
:deep(.el-table .file-row) {
    cursor: pointer;
}

:deep(.el-table .file-row:hover) {
    background-color: #f0f9ff;
}

:deep(.el-table .el-table__row) {
    transition: background-color 0.2s;
}

/* 上传区域样式 */
:deep(.el-upload-dragger) {
    border: 2px dashed #d9d9d9;
    border-radius: 6px;
    width: 100%;
    height: 180px;
    text-align: center;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s;
}

:deep(.el-upload-dragger:hover) {
    border-color: #409eff;
}

:deep(.el-upload-dragger .el-icon--upload) {
    font-size: 67px;
    color: #c0c4cc;
    line-height: 50px;
}

:deep(.el-upload__text) {
    color: #606266;
    font-size: 14px;
    text-align: center;
}

:deep(.el-upload__text em) {
    color: #409eff;
    font-style: normal;
}
</style>