<template>
    <div class="word-viewer-container">
        <!-- 顶部工具栏 -->
        <div class="viewer-header">
            <div class="header-left">
                <el-button @click="goBack" :icon="ArrowLeft" v-if="showBackButton">返回</el-button>
                <span class="file-title">{{ title }}</span>
            </div>
            <div class="header-right">
                <el-button type="success" @click="downloadDocument" :icon="Document" v-if="showDownloadButton">
                    下载文档
                </el-button>
            </div>
        </div>

        <div class="viewer-content">
            <!-- 侧边目录 -->
            <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
                <div class="sidebar-header">
                    <span v-if="!sidebarCollapsed">目录</span>
                    <div class="sidebar-actions">
                        <el-button 
                            class="sidebar-toggle-btn"
                            @click="sidebarCollapsed = !sidebarCollapsed"
                            :icon="sidebarCollapsed ? Expand : ArrowLeft" 
                        />
                    </div>
                </div>
                <div class="sidebar-content" v-if="!sidebarCollapsed">
                    <div class="toc-tree">
                        <div v-for="(item, index) in tableOfContents" :key="index" class="toc-item"
                            :class="{ active: activeSection === item.id }" @click="scrollToSection(item.id)">
                            <span class="toc-level" :class="`level-${item.level}`">
                                {{ item.title }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 主内容区域 -->
            <div class="main-content">
                <div class="content-wrapper">
                    <!-- 查看模式 -->
                    <div class="view-mode">
                        <div class="word-content" v-html="wordContent" ref="wordContentRef" />
                    </div>
                </div>
            </div>
        </div>

        <!-- 加载状态 -->
        <!-- <div v-if="loading" class="loading-overlay">
            <el-loading element-loading-text="正在加载文档..." element-loading-spinner="el-icon-loading"
                element-loading-background="rgba(0, 0, 0, 0.8)" />
        </div> -->
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import {
    ArrowLeft,
    ArrowRight,
    Expand,
    Document
} from '@element-plus/icons-vue'
import mammoth from 'mammoth'

// Props
interface Props {
    documentUrl: string
    title?: string
    showBackButton?: boolean
    showDownloadButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    title: '文档查看器',
    showBackButton: true,
    showDownloadButton: true
})

const router = useRouter()

// 响应式数据
const loading = ref()
const wordContent = ref('')
const sidebarCollapsed = ref(false)
const activeSection = ref('')
const tableOfContents = ref<any[]>([])

const openFullScreenLoading = () => {
    loading.value = ElLoading.service({
        lock: true,
        text: 'Loading',
        background: 'rgba(0, 0, 0, 0.7)',
    })
    setTimeout(() => {
        loading.value = null
    }, 2000)
}
// 引用
const wordContentRef = ref<HTMLElement>()

// 加载Word文档
const loadWordDocument = async () => {
    openFullScreenLoading()
    try {
        console.log('开始加载Word文档:', props.documentUrl)

        const response = await fetch(props.documentUrl)
        if (!response.ok) {
            throw new Error('文件下载失败')
        }

        const arrayBuffer = await response.arrayBuffer()

        // 使用mammoth转换为HTML，保留更多格式
        const result = await mammoth.convertToHtml({
            arrayBuffer,
            convertImage: mammoth.images.imgElement(function (image: any) {
                return image.read("base64").then(function (imageBuffer: any) {
                    return {
                        src: "data:" + image.contentType + ";base64," + imageBuffer
                    };
                });
            }),
            styleMap: [
                // 标准标题样式映射
                "p[style-name='Heading 1'] => h1:fresh",
                "p[style-name='Heading 2'] => h2:fresh",
                "p[style-name='Heading 3'] => h3:fresh",
                "p[style-name='Heading 4'] => h4:fresh",
                "p[style-name='Heading 5'] => h5:fresh",
                "p[style-name='Heading 6'] => h6:fresh",
                "p[style-name='Title'] => h1.title:fresh",
                "p[style-name='Subtitle'] => h2.subtitle:fresh",
                // 中文标题样式映射
                "p[style-name='标题 1'] => h1:fresh",
                "p[style-name='标题 2'] => h2:fresh",
                "p[style-name='标题 3'] => h3:fresh",
                "p[style-name='标题 4'] => h4:fresh",
                "p[style-name='标题 5'] => h5:fresh",
                "p[style-name='标题 6'] => h6:fresh",
                // 其他常见标题样式
                "p[style-name='标题1'] => h1:fresh",
                "p[style-name='标题2'] => h2:fresh",
                "p[style-name='标题3'] => h3:fresh",
                "p[style-name='标题4'] => h4:fresh",
                "p[style-name='标题5'] => h5:fresh",
                "p[style-name='标题6'] => h6:fresh",
                // 文本样式映射
                "r[style-name='Strong'] => strong",
                "r[style-name='Emphasis'] => em",
                "r[style-name='Hyperlink'] => a",
                "r[style-name='加粗'] => strong",
                "r[style-name='倾斜'] => em",
                "r[style-name='超链接'] => a",
                // 表格样式映射
                "table => table.table:fresh",
                "tr => tr:fresh",
                "td => td:fresh",
                "th => th:fresh"
            ],
            transformDocument: function (document: any) {
                // 确保链接正确转换
                document.children.forEach(function (element: any) {
                    if (element.children) {
                        element.children.forEach(function (child: any) {
                            if (child.type === "hyperlink") {
                                
                                child.type = "hyperlink"
                            }
                        })
                    }
                })
                return document
            }
        })

        wordContent.value = result.value

        // 等待DOM更新后生成目录
        await nextTick()
        setTimeout(() => {
            generateTableOfContents()
        }, 500)

        ElMessage.success('文档加载成功')
    } catch (error: any) {
        console.error('加载文档失败:', error)
        ElMessage.error(`加载文档失败: ${error.message}`)
    } finally {
        loading.value.close()
        loading.value = null
    }
}

// 生成目录
const generateTableOfContents = () => {
    const content = wordContentRef.value
    if (!content) {
        console.log('wordContentRef.value 为空，无法生成目录')
        return
    }

    const toc: any[] = []

    // 方法1: 查找带有id="heading_X"的锚点元素
    const headingAnchors = content.querySelectorAll('a[id^="heading_"]')

    headingAnchors.forEach((anchor, index) => {
        const id = anchor.getAttribute('id') || `heading-${index}`

        // 查找锚点后面的strong元素作为标题
        let titleElement = anchor.nextElementSibling
        let title = ''

        // 如果下一个元素是strong，使用其文本
        if (titleElement && titleElement.tagName.toLowerCase() === 'strong') {
            title = titleElement.textContent?.trim() || ''
        } else {
            // 否则查找父元素中的strong
            const parent = anchor.parentElement
            if (parent) {
                const strongElement = parent.querySelector('strong')
                if (strongElement) {
                    title = strongElement.textContent?.trim() || ''
                }
            }
        }

        // 如果还是没找到标题，使用锚点ID
        if (!title) {
            title = `标题 ${index + 1}`
        }

        if (title && title.length > 0) {
            toc.push({
                id,
                title,
                level: 1, // 默认级别为1
                element: anchor
            })
        }
    })

    // 方法2: 查找标准HTML标题元素（h1-h6）
    if (toc.length === 0) {
        const standardHeadings = content.querySelectorAll('h1, h2, h3, h4, h5, h6')

        standardHeadings.forEach((heading, index) => {
            const level = getHeadingLevel(heading)
            const title = heading.textContent?.trim() || ''

            if (title && title.length > 0) {
                const id = `heading-${index}`

                // 为标题添加ID
                heading.id = id

                toc.push({
                    id,
                    title,
                    level,
                    element: heading
                })
            }
        })
    }

    // 方法3: 如果没找到锚点，查找标准标题元素
    if (toc.length === 0) {
        const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, .subtitle, p[style*="heading"], p[style*="title"], p[style*="Heading"]')

        headings.forEach((heading, index) => {
            const level = getHeadingLevel(heading)
            const title = heading.textContent?.trim() || ''

            if (title && title.length > 0) {
                const id = `heading-${index}`

                // 为标题添加ID
                heading.id = id

                toc.push({
                    id,
                    title,
                    level,
                    element: heading
                })
            }
        })
    }

    // 方法4: 如果还是没找到，查找包含中文数字的段落
    if (toc.length === 0) {
        const paragraphs = content.querySelectorAll('p')

        paragraphs.forEach((p, index) => {
            const text = p.textContent?.trim() || ''

            // 查找包含中文数字的段落（如：一、二、三、等）
            if (text.match(/^[一二三四五六七八九十]+[、．.]/) ||
                text.match(/^\d+[、．.]/) ||
                text.includes('了解') || text.includes('申请') || text.includes('培训')) {

                const id = `heading-${index}`
                p.id = id

                toc.push({
                    id,
                    title: text,
                    level: 1,
                    element: p
                })
            }
        })
    }

    tableOfContents.value = toc

    // 如果仍然没有目录，创建测试目录
    if (toc.length === 0) {
        tableOfContents.value = [
            { id: 'test-1', title: '文档开始', level: 1 },
            { id: 'test-2', title: '主要内容', level: 2 }
        ]
    } else {
        console.log('目录生成成功，共', toc.length, '个条目')
    }
}

// 获取标题级别
const getHeadingLevel = (element: Element): number => {
    const tagName = element.tagName.toLowerCase()

    if (tagName.startsWith('h')) {
        return parseInt(tagName.charAt(1))
    }

    // 根据样式判断级别
    const className = element.className
    if (className.includes('title')) return 1
    if (className.includes('subtitle')) return 2

    // 根据文本长度和样式判断
    const text = element.textContent || ''
    if (text.length < 20 && element.tagName === 'P') return 2
    if (text.length < 50 && element.tagName === 'P') return 3

    return 4 // 默认级别
}

// 滚动到指定章节
const scrollToSection = (sectionId: string) => {
    // 首先尝试通过ID查找元素
    let element = document.getElementById(sectionId)

    // 如果没找到，尝试查找锚点元素
    if (!element) {
        element = document.querySelector(`a[id="${sectionId}"]`)
    }

    // 如果还是没找到，尝试查找包含该ID的元素
    if (!element) {
        element = document.querySelector(`[id="${sectionId}"]`)
    }

    if (element) {
        // 滚动到元素位置
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        })

        // 高亮显示目标元素
        element.style.backgroundColor = '#fff3cd'
        setTimeout(() => {
            element.style.backgroundColor = ''
        }, 2000)

        activeSection.value = sectionId
    } else {
        ElMessage.warning('未找到对应的标题位置')
    }
}

// 下载文档
const downloadDocument = () => {
    const link = document.createElement('a')
    link.href = props.documentUrl
    link.download = props.title + '.docx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('开始下载文档')
}

// 返回上一页
const goBack = () => {
    router.go(-1)
}

// 监听滚动，更新活动章节
const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const sections = tableOfContents.value

    for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        const element = document.getElementById(section.id)
        if (element && element.offsetTop <= scrollTop + 100) {
            activeSection.value = section.id
            break
        }
    }
}

onMounted(() => {
    loadWordDocument()
    window.addEventListener('scroll', handleScroll)
})

// 组件卸载时移除事件监听
onBeforeUnmount(() => {
    window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.word-viewer-container {
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

.viewer-content {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.sidebar {
    width: 280px;
    background: white;
    border-right: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar.collapsed {
    width: 50px;
}

.sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid #e4e7ed;
    background: #f8f9fa;
}

.sidebar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.sidebar-toggle-btn {
    background: none !important;
    border: none !important;
    color: #606266 !important;
    padding: 4px 8px !important;
    font-size: 14px !important;
    box-shadow: none !important;
}

.sidebar-toggle-btn:hover {
    background: #f5f7fa !important;
    color: #409eff !important;
}

.sidebar-toggle-btn:focus {
    background: #f5f7fa !important;
    color: #409eff !important;
}

.sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
}

.toc-tree {
    padding: 10px 0;
}

.toc-item {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
    margin-bottom: 2px;
}

.toc-item:hover {
    background-color: #f0f2f5;
}

.toc-item.active {
    background-color: #e6f7ff;
    color: #1890ff;
    font-weight: 600;
}

.toc-level {
    display: block;
    font-size: 14px;
    line-height: 1.4;
}

.toc-level.level-1 {
    font-weight: 600;
    color: #303133;
}

.toc-level.level-2 {
    padding-left: 15px;
    color: #606266;
}

.toc-level.level-3 {
    padding-left: 30px;
    color: #909399;
    font-size: 13px;
}

.toc-level.level-4 {
    padding-left: 45px;
    color: #c0c4cc;
    font-size: 12px;
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.content-wrapper {
    flex: 1;
    overflow-y: auto;
    background: white;
    margin: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.view-mode {
    padding: 40px;
    min-height: 100%;
}

.word-content {
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.8;
    font-size: 16px;
    color: #333;
}

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
}

/* Word内容样式 */
.word-content :deep(h1),
.word-content :deep(h2),
.word-content :deep(h3),
.word-content :deep(h4),
.word-content :deep(h5),
.word-content :deep(h6) {
    color: #303133;
    margin-top: 30px;
    margin-bottom: 15px;
    font-weight: 600;
    line-height: 1.3;
}

.word-content :deep(h1) {
    font-size: 28px;
    border-bottom: 2px solid #e4e7ed;
    padding-bottom: 10px;
}

.word-content :deep(h2) {
    font-size: 24px;
    border-bottom: 1px solid #e4e7ed;
    padding-bottom: 8px;
}

.word-content :deep(h3) {
    font-size: 20px;
}

.word-content :deep(h4) {
    font-size: 18px;
}

.word-content :deep(h5) {
    font-size: 16px;
}

.word-content :deep(h6) {
    font-size: 14px;
}

.word-content :deep(p) {
    margin-bottom: 15px;
    text-align: justify;
    line-height: 1.6;
}

.word-content :deep(ul),
.word-content :deep(ol) {
    margin: 15px 0;
    padding-left: 30px;
}

.word-content :deep(li) {
    margin-bottom: 8px;
    line-height: 1.5;
}

/* 表格样式 */
.word-content :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    border: 1px solid #ddd;
}

.word-content :deep(table th),
.word-content :deep(table td) {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: left;
    vertical-align: top;
}

.word-content :deep(table th) {
    background-color: #f8f9fa;
    font-weight: 600;
}

.word-content :deep(table tr:nth-child(even)) {
    background-color: #f8f9fa;
}

/* 图片样式 */
.word-content :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 20px 0;
    display: block;
}

/* 强调文本样式 */
.word-content :deep(strong),
.word-content :deep(b) {
    font-weight: 600;
    color: #303133;
}

.word-content :deep(em),
.word-content :deep(i) {
    font-style: italic;
    color: #606266;
}

.word-content :deep(u) {
    text-decoration: underline;
}

.word-content :deep(s),
.word-content :deep(strike) {
    text-decoration: line-through;
}

/* 引用样式 */
.word-content :deep(blockquote) {
    border-left: 4px solid #409eff;
    padding-left: 20px;
    margin: 20px 0;
    color: #666;
    font-style: italic;
    background-color: #f8f9fa;
    padding: 15px 20px;
    border-radius: 4px;
}

/* 代码样式 */
.word-content :deep(code) {
    background-color: #f1f2f3;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9em;
}

.word-content :deep(pre) {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 20px 0;
}

.word-content :deep(pre code) {
    background: none;
    padding: 0;
}

/* 水平线样式 */
.word-content :deep(hr) {
    border: none;
    border-top: 2px solid #e4e7ed;
    margin: 30px 0;
}

/* 标题样式类 */
.word-content :deep(.title) {
    font-size: 32px;
    font-weight: 700;
    color: #303133;
    margin: 40px 0 20px 0;
    text-align: center;
}

.word-content :deep(.subtitle) {
    font-size: 20px;
    font-weight: 500;
    color: #606266;
    margin: 20px 0 30px 0;
    text-align: center;
}

/* 链接样式 */
.word-content :deep(a) {
    color: #1890ff;
    text-decoration: underline;
    cursor: pointer;
    transition: color 0.2s ease;
}

.word-content :deep(a:hover) {
    color: #40a9ff;
    text-decoration: underline;
}

.word-content :deep(a:visited) {
    color: #722ed1;
}

.word-content :deep(a:active) {
    color: #096dd9;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .sidebar {
        width: 200px;
    }

    .sidebar.collapsed {
        width: 40px;
    }

    .viewer-header {
        padding: 10px 15px;
    }

    .file-title {
        font-size: 18px;
    }

    .content-wrapper {
        margin: 10px;
    }

    .view-mode {
        padding: 20px;
    }
}
</style>
