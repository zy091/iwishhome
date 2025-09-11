<template>
    <div class="layout">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="layout-title">
            <h1 class="title">文件转换工具</h1>
            <p class="subtitle">将Word文档和PDF文件转换为Markdown格式</p>
        </div>

        <!-- 转换工具卡片 -->
        <el-card class="converter-card" shadow="always">
            <template #header>
                <div class="card-header">
                    <span>文件转换</span>
                    <el-tag type="info">支持 .doc, .docx, .pdf 格式</el-tag>
                </div>
            </template>

            <div class="converter-content">
                <!-- 文件上传区域 -->
                <div class="upload-section">
                    <el-upload
                        class="upload-dragger"
                        drag
                        :auto-upload="false"
                        :on-change="handleFileChange"
                        :file-list="fileList"
                        :limit="1"
                        accept=".doc,.docx,.pdf"
                        :before-upload="beforeUpload"
                    >
                        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                        <div class="el-upload__text">
                            将文件拖到此处，或<em>点击上传</em>
                        </div>
                        <template #tip>
                            <div class="el-upload__tip">
                                支持 Word 文档 (.doc, .docx) 和 PDF 文件 (.pdf)，文件大小不超过 50MB
                            </div>
                        </template>
                    </el-upload>
                </div>

                <!-- 转换选项 -->
                <div class="conversion-options" v-if="selectedFile">
                    <el-form :model="conversionForm" label-width="120px">
                        <el-form-item label="输出文件名">
                            <el-input 
                                v-model="conversionForm.outputName" 
                                placeholder="请输入输出文件名（不含扩展名）"
                                clearable
                            />
                        </el-form-item>
                        <el-form-item label="转换选项">
                            <el-checkbox-group v-model="conversionForm.options">
                                <el-checkbox label="preserveFormatting">保留格式</el-checkbox>
                                <el-checkbox label="includeImages">包含图片</el-checkbox>
                                <el-checkbox label="includeTables">包含表格</el-checkbox>
                            </el-checkbox-group>
                        </el-form-item>
                        <el-form-item>
                            <el-button 
                                type="primary" 
                                @click="startConversion" 
                                :loading="converting"
                                :disabled="!selectedFile"
                            >
                                开始转换
                            </el-button>
                            <el-button @click="resetForm">重置</el-button>
                        </el-form-item>
                    </el-form>
                </div>

                <!-- 转换进度 -->
                <div class="conversion-progress" v-if="converting">
                    <el-progress 
                        :percentage="conversionProgress" 
                        :status="conversionStatus"
                        :stroke-width="8"
                    />
                    <p class="progress-text">{{ progressText }}</p>
                </div>

                <!-- 转换结果 -->
                <div class="conversion-result" v-if="conversionResult">
                    <el-alert
                        title="转换完成"
                        type="success"
                        :closable="false"
                        show-icon
                    />
                    <div class="result-actions">
                        <el-button type="primary" @click="previewMarkdown">
                            <el-icon><View /></el-icon>
                            预览Markdown
                        </el-button>
                        <el-button @click="downloadMarkdown">
                            <el-icon><Download /></el-icon>
                            下载文件
                        </el-button>
                        <el-button @click="resetForm">
                            <el-icon><Refresh /></el-icon>
                            转换新文件
                        </el-button>
                    </div>
                </div>
            </div>
        </el-card>

        <!-- 转换历史 -->
        <el-card class="history-card" shadow="always" style="margin-top: 20px;">
            <template #header>
                <div class="card-header">
                    <span>转换历史</span>
                    <el-button type="primary" size="small" @click="loadConversionHistory">
                        <el-icon><Refresh /></el-icon>
                        刷新
                    </el-button>
                </div>
            </template>

            <el-table :data="conversionHistory" v-loading="historyLoading" style="width: 100%">
                <el-table-column prop="original_name" label="原文件名" />
                <el-table-column prop="output_name" label="输出文件名" />
                <el-table-column prop="file_type" label="文件类型" />
                <el-table-column prop="status" label="状态">
                    <template #default="{ row }">
                        <el-tag :type="row.status === 'completed' ? 'success' : 'warning'">
                            {{ row.status === 'completed' ? '已完成' : '处理中' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="created_at" label="转换时间" width="180">
                    <template #default="{ row }">
                        {{ new Date(row.created_at).toLocaleString() }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                    <template #default="{ row }">
                        <el-button-group>
                            <el-button type="primary" size="small" @click="previewHistoryItem(row)">
                                预览
                            </el-button>
                            <el-button type="success" size="small" @click="editHistoryItem(row)">
                                编辑
                            </el-button>
                            <el-button type="danger" size="small" @click="deleteHistoryItem(row)">
                                删除
                            </el-button>
                        </el-button-group>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- Markdown预览对话框 -->
        <el-dialog 
            v-model="previewDialogVisible" 
            title="Markdown预览" 
            width="90%" 
            :close-on-click-modal="false"
            class="markdown-preview-dialog"
        >
            <div class="markdown-preview-container">
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
                            :rows="25"
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
            <template #footer>
                <el-button @click="previewDialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, View, Download, Refresh } from '@element-plus/icons-vue'
import { supabase } from '@/lib/supabaseClient'
import { marked } from 'marked'
import hljs from 'highlight.js'
import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'
import Breadbcrum from '@/components/system/Breadcrumb.vue'

// 配置 PDF.js worker - 使用多个备用CDN源
const pdfWorkerSources = [
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
]

// 设置第一个可用的worker源
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSources[0]

const breadbcrum = reactive([
    {
        name: '数据管理',
        path: '/system/data-management'
    },
    {
        name: '文件转换工具',
        path: '/system/file-converter'
    }
])

// 响应式数据
const fileList = ref<any[]>([])
const selectedFile = ref<File | null>(null)
const converting = ref(false)
const conversionProgress = ref(0)
const conversionStatus = ref<'success' | 'exception' | 'warning' | ''>('')
const progressText = ref('')
const conversionResult = ref<any>(null)
const conversionHistory = ref<any[]>([])
const historyLoading = ref(false)

// Markdown预览相关
const previewDialogVisible = ref(false)
const markdownViewMode = ref<'preview' | 'edit' | 'split'>('preview')
const markdownContent = ref('')
const savingMarkdown = ref(false)
const currentConversionId = ref<string | null>(null)

// 转换表单
const conversionForm = reactive({
    outputName: '',
    options: ['preserveFormatting', 'includeTables'] as string[]
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

// 清理文件名，移除不支持的字符
const sanitizeFileName = (fileName: string): string => {
    if (!fileName) return 'untitled'
    
    // 移除或替换不支持的字符
    let sanitized = fileName
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

// 文件上传前验证
const beforeUpload = (file: File) => {
    const isValidType = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
    const isValidSize = file.size / 1024 / 1024 < 50 // 50MB

    if (!isValidType) {
        ElMessage.error('只支持 PDF、DOC、DOCX 格式的文件！')
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
        // 自动生成输出文件名
        const originalName = file.name.replace(/\.[^/.]+$/, '')
        const sanitizedName = sanitizeFileName(originalName)
        conversionForm.outputName = sanitizedName + '_converted'
        
        // 如果文件名被修改，提示用户
        if (originalName !== sanitizedName) {
            ElMessage.info(`文件名已自动清理为: ${sanitizedName}_converted`)
        }
    }
}

// 开始转换
const startConversion = async () => {
    if (!selectedFile.value) {
        ElMessage.warning('请先选择要转换的文件')
        return
    }

    converting.value = true
    conversionProgress.value = 0
    conversionStatus.value = ''
    progressText.value = '准备转换...'

    try {
        // 创建转换记录
        const { data: conversionRecord, error: insertError } = await supabase
            .from('file_conversions')
            .insert({
                original_name: selectedFile.value.name,
                output_name: conversionForm.outputName,
                file_type: selectedFile.value.type,
                status: 'processing',
                options: conversionForm.options
            })
            .select('id')
            .single()

        if (insertError) throw insertError

        currentConversionId.value = conversionRecord.id

        // 执行转换
        let markdownContent = ''
        const fileType = selectedFile.value.type

        if (fileType === 'application/pdf') {
            markdownContent = await convertPdfToMarkdown(selectedFile.value)
        } else if (fileType.includes('word') || fileType.includes('document')) {
            markdownContent = await convertWordToMarkdown(selectedFile.value)
        }

        conversionProgress.value = 80
        progressText.value = '上传转换结果...'

        // 上传转换后的文件
        const sanitizedOutputName = sanitizeFileName(conversionForm.outputName)
        const fileName = `${sanitizedOutputName}.md`
        const file = new File([markdownContent], fileName, { type: 'text/markdown' })

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('converted_files')
            .upload(`markdown/${Date.now()}-${fileName}`, file)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
            .from('converted_files')
            .getPublicUrl(uploadData.path)

        conversionProgress.value = 100
        progressText.value = '转换完成！'

        // 更新转换记录
        const { error: updateError } = await supabase
            .from('file_conversions')
            .update({
                status: 'completed',
                output_file_url: urlData.publicUrl,
                markdown_content: markdownContent
            })
            .eq('id', currentConversionId.value)

        if (updateError) throw updateError

        conversionResult.value = {
            id: currentConversionId.value,
            fileName: fileName,
            url: urlData.publicUrl,
            content: markdownContent
        }

        conversionStatus.value = 'success'
        ElMessage.success('文件转换成功！')

        // 加载转换历史
        loadConversionHistory()

    } catch (error: any) {
        console.error('转换失败:', error)
        conversionStatus.value = 'exception'
        progressText.value = '转换失败'
        ElMessage.error(`转换失败: ${error.message}`)

        // 更新转换记录状态
        if (currentConversionId.value) {
            await supabase
                .from('file_conversions')
                .update({ status: 'failed' })
                .eq('id', currentConversionId.value)
        }
    } finally {
        converting.value = false
    }
}

// PDF转Markdown
const convertPdfToMarkdown = async (file: File): Promise<string> => {
    conversionProgress.value = 20
    progressText.value = '解析PDF文件...'

    try {
        const arrayBuffer = await file.arrayBuffer()
        
        // 尝试使用不同的worker源
        let pdf
        let lastError
        
        for (const workerSrc of pdfWorkerSources) {
            try {
                pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
                pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
                break // 成功加载，跳出循环
            } catch (error) {
                lastError = error
                console.warn(`Worker源 ${workerSrc} 失败，尝试下一个...`)
                continue
            }
        }
        
        if (!pdf) {
            throw lastError || new Error('所有PDF worker源都失败了')
        }
        
        conversionProgress.value = 30
        progressText.value = '提取PDF文本...'

        let fullText = ''
        const numPages = pdf.numPages

        // 逐页提取文本
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const textContent = await page.getTextContent()
            
            // 合并页面文本
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ')
            
            fullText += pageText + '\n\n'
            
            // 更新进度
            const progress = 30 + (pageNum / numPages) * 40
            conversionProgress.value = Math.round(progress)
            progressText.value = `提取第 ${pageNum}/${numPages} 页...`
        }
        
        conversionProgress.value = 70
        progressText.value = '转换为Markdown...'

        // 简单的文本到Markdown转换
        let markdown = `# ${conversionForm.outputName}\n\n`
        markdown += `> 从PDF文件转换而来 (共 ${numPages} 页)\n\n`
        markdown += `---\n\n`
        
        // 处理文本内容
        const lines = fullText.split('\n').filter((line: string) => line.trim())
        
        for (const line of lines) {
            const trimmedLine = line.trim()
            if (trimmedLine) {
                // 简单的标题检测
                if (trimmedLine.length < 50 && /^[A-Z\s]+$/.test(trimmedLine)) {
                    markdown += `## ${trimmedLine}\n\n`
                } else {
                    markdown += `${trimmedLine}\n\n`
                }
            }
        }

        return markdown
    } catch (error: any) {
        console.error('PDF解析失败:', error)
        throw new Error(`PDF解析失败: ${error.message}`)
    }
}

// Word转Markdown
const convertWordToMarkdown = async (file: File): Promise<string> => {
    conversionProgress.value = 20
    progressText.value = '解析Word文档...'

    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.convertToMarkdown({ arrayBuffer })
    
    conversionProgress.value = 50
    progressText.value = '处理转换结果...'

    let markdown = result.value

    // 添加文档头部信息
    const header = `# ${conversionForm.outputName}\n\n> 从Word文档转换而来\n\n---\n\n`
    markdown = header + markdown

    // 处理警告信息
    if (result.messages.length > 0) {
        markdown += `\n\n## 转换说明\n\n`
        result.messages.forEach((message: any) => {
            markdown += `- ${message.message}\n`
        })
    }

    return markdown
}

// 预览Markdown
const previewMarkdown = () => {
    if (conversionResult.value) {
        markdownContent.value = conversionResult.value.content
        previewDialogVisible.value = true
    }
}

// 下载Markdown文件
const downloadMarkdown = () => {
    if (conversionResult.value) {
        const link = document.createElement('a')
        link.href = conversionResult.value.url
        link.download = conversionResult.value.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
}

// 保存Markdown
const saveMarkdown = async () => {
    if (!currentConversionId.value || !markdownContent.value) {
        ElMessage.warning('没有可保存的内容')
        return
    }
    
    savingMarkdown.value = true
    
    try {
        // 创建新的文件内容
        const sanitizedOutputName = sanitizeFileName(conversionForm.outputName)
        const fileName = `${sanitizedOutputName}_edited.md`
        const file = new File([markdownContent.value], fileName, {
            type: 'text/markdown'
        })
        
        // 上传到storage
        const { data: fileData, error: uploadError } = await supabase.storage
            .from('converted_files')
            .upload(`markdown/${Date.now()}-${fileName}`, file, {
                upsert: true
            })
            
        if (uploadError) throw uploadError
        
        const { data: urlData } = supabase.storage
            .from('converted_files')
            .getPublicUrl(fileData.path)
        
        // 更新转换记录
        const { error: updateError } = await supabase
            .from('file_conversions')
            .update({
                markdown_content: markdownContent.value,
                output_file_url: urlData.publicUrl
            })
            .eq('id', currentConversionId.value)
            
        if (updateError) throw updateError
        
        ElMessage.success('Markdown文件保存成功！')
        
    } catch (error: any) {
        console.error('保存Markdown失败:', error)
        ElMessage.error(`保存失败: ${error.message}`)
    } finally {
        savingMarkdown.value = false
    }
}

// 加载转换历史
const loadConversionHistory = async () => {
    historyLoading.value = true
    try {
        const { data, error } = await supabase
            .from('file_conversions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) throw error
        conversionHistory.value = data || []
    } catch (error: any) {
        console.error('加载转换历史失败:', error)
        ElMessage.error('加载转换历史失败')
    } finally {
        historyLoading.value = false
    }
}

// 预览历史项目
const previewHistoryItem = (item: any) => {
    if (item.markdown_content) {
        markdownContent.value = item.markdown_content
        currentConversionId.value = item.id
        previewDialogVisible.value = true
    } else {
        ElMessage.warning('该转换记录没有可预览的内容')
    }
}

// 编辑历史项目
const editHistoryItem = (item: any) => {
    if (item.markdown_content) {
        markdownContent.value = item.markdown_content
        currentConversionId.value = item.id
        markdownViewMode.value = 'edit'
        previewDialogVisible.value = true
    } else {
        ElMessage.warning('该转换记录没有可编辑的内容')
    }
}

// 删除历史项目
const deleteHistoryItem = async (item: any) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除转换记录 "${item.original_name}" 吗？`,
            '警告',
            { type: 'warning' }
        )

        const { error } = await supabase
            .from('file_conversions')
            .delete()
            .eq('id', item.id)

        if (error) throw error

        ElMessage.success('删除成功')
        loadConversionHistory()
    } catch (error: any) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败')
        }
    }
}

// 重置表单
const resetForm = () => {
    fileList.value = []
    selectedFile.value = null
    conversionForm.outputName = ''
    conversionForm.options = ['preserveFormatting', 'includeTables']
    conversionResult.value = null
    conversionProgress.value = 0
    conversionStatus.value = ''
    progressText.value = ''
    currentConversionId.value = null
}

onMounted(() => {
    loadConversionHistory()
})
</script>

<style scoped>
.layout-title {
    margin-bottom: 20px;
}

.subtitle {
    color: #666;
    margin-top: 8px;
    font-size: 14px;
}

.converter-card {
    margin-bottom: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.converter-content {
    padding: 20px 0;
}

.upload-section {
    margin-bottom: 30px;
}

.upload-dragger {
    width: 100%;
}

.conversion-options {
    margin-bottom: 20px;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
}

.conversion-progress {
    margin: 20px 0;
    padding: 20px;
    background-color: #f0f9ff;
    border-radius: 8px;
}

.progress-text {
    text-align: center;
    margin-top: 10px;
    color: #666;
}

.conversion-result {
    margin-top: 20px;
    padding: 20px;
    background-color: #f0f9ff;
    border-radius: 8px;
}

.result-actions {
    margin-top: 15px;
    display: flex;
    gap: 10px;
}

.history-card {
    margin-top: 20px;
}

/* Markdown预览样式 */
.markdown-preview-dialog :deep(.el-dialog__body) {
    padding: 0;
}

.markdown-preview-container {
    height: 70vh;
    display: flex;
    flex-direction: column;
}

.markdown-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #e4e7ed;
    background-color: #f5f7fa;
}

.markdown-container {
    flex: 1;
    display: flex;
    gap: 15px;
    height: calc(100% - 60px);
    padding: 20px;
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