<template>
    <div class="pdf-viewer-container">
        <!-- 顶部工具栏 -->
        <div class="viewer-header">
            <div class="header-left">
                <el-button @click="goBack" :icon="ArrowLeft" v-if="showBackButton">返回</el-button>
                <span class="file-title">{{ title }}</span>
            </div>
            <div class="header-right">
                <el-button 
                    type="success" 
                    @click="downloadDocument" 
                    :icon="Document"
                >
                    下载文档
                </el-button>
            </div>
        </div>

        <!-- PDF显示区域 -->
        <div class="pdf-content">
            <iframe 
                :src="pdfUrl" 
                class="pdf-iframe"
                frameborder="0"
                @load="onPdfLoad"
                @error="onPdfError"
            ></iframe>
            
            <!-- 加载状态 -->
            <div v-if="loading" class="loading-overlay">
                <el-loading 
                    element-loading-text="正在加载PDF文档..."
                    element-loading-spinner="el-icon-loading"
                    element-loading-background="rgba(0, 0, 0, 0.8)"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
    ArrowLeft, 
    Document
} from '@element-plus/icons-vue'

// Props
interface Props {
    documentUrl: string
    title?: string
    showBackButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    title: 'PDF文档查看器',
    showBackButton: true
})

const router = useRouter()

// 响应式数据
const loading = ref(true)

// 计算PDF URL，添加浏览器PDF查看器参数
const pdfUrl = computed(() => {
    // 使用Google Docs Viewer作为PDF查看器
    return `https://docs.google.com/gview?url=${encodeURIComponent(props.documentUrl)}&embedded=true`
})

// PDF加载完成
const onPdfLoad = () => {
    loading.value = false
    ElMessage.success('PDF文档加载成功')
}

// PDF加载失败
const onPdfError = () => {
    loading.value = false
    ElMessage.error('PDF文档加载失败，请检查网络连接或文档链接')
}

// 下载文档
const downloadDocument = async () => {
    try {
        // 方法1: 尝试通过fetch下载
        const response = await fetch(props.documentUrl)
        if (response.ok) {
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = props.title + '.pdf'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            ElMessage.success('文档下载成功')
        } else {
            throw new Error('下载失败')
        }
    } catch (error) {
        console.error('Fetch下载失败:', error)
        
        // 方法2: 直接链接下载
        try {
            const link = document.createElement('a')
            link.href = props.documentUrl
            link.download = props.title + '.pdf'
            link.target = '_blank'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            ElMessage.success('开始下载文档')
        } catch (linkError) {
            console.error('链接下载失败:', linkError)
            
            // 方法3: 打开新窗口
            try {
                window.open(props.documentUrl, '_blank')
                ElMessage.info('已在新窗口中打开文档，请手动保存')
            } catch (openError) {
                console.error('打开新窗口失败:', openError)
                ElMessage.error('下载失败，请检查网络连接或文档链接')
            }
        }
    }
}

// 返回上一页
const goBack = () => {
    router.go(-1)
}

onMounted(() => {
    // 设置加载超时
    setTimeout(() => {
        if (loading.value) {
            loading.value = false
            ElMessage.warning('PDF文档加载超时，请检查网络连接')
        }
    }, 10000) // 10秒超时
})
</script>

<style scoped>
.pdf-viewer-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.viewer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: white;
    border-bottom: 1px solid #e4e7ed;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 100;
}

.header-left {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    flex: 1;
}

.file-title {
    font-size: 22px;
    font-weight: 600;
    color: #303133;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 15px;
}

.pdf-content {
    flex: 1;
    position: relative;
    background: #f5f5f5;
}

.pdf-iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: white;
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .viewer-header {
        padding: 10px 15px;
    }
    
    .file-title {
        font-size: 18px;
    }
}
</style>
