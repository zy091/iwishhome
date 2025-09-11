<template>
    <div class="upload">
        <el-dialog @close="emit('update:visible', false)" v-model="dialogVisible" title="资料上传" width="50%">
            <el-form :model="form" label-width="auto" style="max-width: 600px;margin:50px 30px;">
                <el-form-item label="文件标题">
                    <el-input size="large" v-model="form.title" placeholder="输入文件标题" />
                </el-form-item>
                <el-form-item label="文件类型">
                    <el-select size="large" v-model="form.type" placeholder="选择文件类型">
                        <el-option v-for="(type, index) in fileType" :label="type.label" :value="type.value"
                            :key="index" />
                    </el-select>
                </el-form-item>
                <el-form-item label="文件所属平台">
                    <el-select size="large" v-model="form.platform" placeholder="选择平台">
                        <el-option v-for="(platform, index) in filePlatform" :label="platform.label"
                            :value="platform.value" :key="index" />
                    </el-select>
                </el-form-item>
                <el-form-item label="选择文件夹">
                    <el-cascader size="large" v-model="form.folderPath"
                        :options="folderOptions" :props="{
                            checkStrictly: true,
                            emitPath: true,
                            value: 'id',
                            label: 'name',
                            children: 'children'
                        }" clearable placeholder="请选择资料存放位置" style="width: 100%">
                        <template #default="{ node, data }">
                            <span>{{ data.name }}</span>
                            <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
                        </template>
                        <template #empty>
                            <el-empty description="暂无数据，先选择平台" />
                        </template>
                    </el-cascader>
                </el-form-item>
                <!-- <el-form-item label="文件所属章节">
                <el-select size="large" v-model="form.chapter" placeholder="选择章节">
                    <el-option label="基础" value="base" />
                    <el-option label="中级" value="middle" />
                    <el-option label="高级" value="anvanced" />
                </el-select>
            </el-form-item> -->
                <!-- 
            <el-form-item label="Activity form">
                <el-input v-model="form.desc" type="textarea" />
            </el-form-item> -->
                <!-- 在文件上传el-form-item之前添加 -->
                <el-form-item label="链接地址" v-if="form.type === 'link'">
                    <el-input size="large" v-model="form.linkUrl" placeholder="请输入链接地址" />
                </el-form-item>

                <!-- 修改文件上传的显示条件 -->
                <el-form-item label="文件上传" v-if="form.type !== 'link'">
                    <el-upload class="upload-box" :auto-upload="false" :on-change="handleFileChange"
                        :file-list="fileList" :limit="1" drag
                        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple>
                        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                        <div class="el-upload__text">
                            拖拽文件或<em>点击上传</em>
                        </div>
                        <template #tip>
                            <div class="el-upload__tip">支持所有文本型、图片、视频等文件，且不超过 100MB</div>
                        </template>
                    </el-upload>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" :loading="isUploading" @click="handleUpload">开始上传</el-button>
                    <el-button @click="resetForm">清空内容</el-button>
                </el-form-item>
            </el-form>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, toRaw, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabaseClient'
import type { UploadProps, UploadUserFile, FormInstance } from 'element-plus'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
})
// 使用计算属性来处理 v-model
const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
})

const emit = defineEmits(['update:visible'])
const fileType = ref([
    {
        value: 'image',
        label: '图片'
    },
    {
        value: 'video',
        label: '视频'
    },
    {
        value: 'ppt',
        label: 'PPT'
    },
    {
        value: 'pdf',
        label: 'PDF'
    },
    {
        value: 'link',
        label: '链接'
    },
    {
        value: 'txt',
        label: '文本'
    },
    {
        value: 'word',
        label: 'Word'
    },
    {
        value: 'excel',
        label: 'Excel'
    },
    {
        value: 'zip',
        label: '压缩包'
    },
    {
        value: 'md',
        label: 'Markdown'
    },
])

const filePlatform = ref([
    {
        value: 'google',
        label: 'Google'
    },
    {
        value: 'facebook',
        label: 'Facebook'
    },
    {
        value: 'microsoft',
        label: 'Microsoft'
    },
    {
        value: 'meta',
        label: 'Meta'
    },
    {
        value: 'other',
        label: 'Other'
    },
])

// 文件夹选项接口
interface FolderOption {
    id: string
    name: string
    children?: FolderOption[]
}

const folderOptions = ref<FolderOption[]>([])
// 加载文件夹结构
const loadFolderStructure = async () => {
    try {
        // 获取所有平台
        const { data: platforms, error: platformsError } = await supabase
            .from('ad_platforms')
            .select('*')

        if (platformsError) throw platformsError

        // 构建完整的层级结构
        folderOptions.value = await Promise.all(platforms.map(async (platform) => {
            // 获取分类
            const { data: categories, error: categoriesError } = await supabase
                .from('ad_categories')
                .select('*')
                .eq('platform_id', platform.id)

            if (categoriesError) throw categoriesError

            // 构建分类层级
            const categoriesWithChildren = await Promise.all(categories.map(async (category) => {
                // 获取子分类
                const { data: subcategories, error: subcategoriesError } = await supabase
                    .from('ad_subcategories')
                    .select('*')
                    .eq('category_id', category.id)

                if (subcategoriesError) throw subcategoriesError

                // 获取主题
                const subcategoriesWithTopics = await Promise.all(subcategories.map(async (subcategory) => {
                    const { data: topics, error: topicsError } = await supabase
                        .from('ad_topics')
                        .select('*')
                        .eq('subcategory_id', subcategory.id)

                    if (topicsError) throw topicsError

                    return {
                        ...subcategory,
                        children: topics
                    }
                }))

                return {
                    ...category,
                    children: subcategoriesWithTopics
                }
            }))

            return {
                id: platform.id,
                name: platform.name,
                children: categoriesWithChildren
            }
        }))

    } catch (err: any) {
        ElMessage.error('加载文件夹结构失败：' + err.message)
    } finally {

    }
}
// do not use same name with ref
const form = reactive({
    title: '',
    type: '',
    platform: '',
    chapter: '',
    folderPath: [] as string[],
    linkUrl: ''
})

// 监听平台变化，重新加载文件夹结构
watch(() => form.platform, (newPlatform) => {
    if (newPlatform) {
    }
    loadFolderStructure()
})

// 修改重置表单函数
const resetForm = () => {
    form.title = '';
    form.type = '';
    form.platform = '';
    form.chapter = '';
    form.folderPath = [];
    form.linkUrl = '';  // 清空链接
    fileList.value = [];
    selectedFile.value = null;
};

// 响应式数据
const fileList = ref([])
const selectedFile = ref<UploadUserFile | null | undefined>(null)
const isUploading = ref(false)

// 文件选择回调
const handleFileChange = (file: UploadUserFile) => {
    // 验证文件类型和大小
    const validTypes = [
        'image/png',
        'image/jpeg',
        'image/webp',
        'video/mp4',
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'text/plain',
        'text/csv',
        'text/html',
        'text/xml',
        'application/json',
        'application/xml',
        'application/octet-stream',// 其他文本型文件
        'application/msword',       // doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
        'application/vnd.ms-excel',  // excel
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
        'text/markdown', // markdown
        'text/x-markdown', // markdown alternative
        'application/x-markdown', // markdown alternative
    ]
    
    // 支持的文件扩展名
    const validExtensions = [
        '.png', '.jpg', '.jpeg', '.webp', // 图片
        '.mp4', // 视频
        '.pdf', // PDF
        '.ppt', '.pptx', // PPT
        '.txt', '.csv', '.html', '.xml', '.json', '.md', // 文本文件
        '.doc', '.docx', // Word
        '.xls', '.xlsx', // Excel
        '.zip', '.rar', '.7z', // 压缩包
    ]
    
    // 检查MIME类型
    const isMimeTypeValid = file.raw && validTypes.includes(file.raw.type)
    
    // 检查文件扩展名
    const fileName = file.name || ''
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    const isExtensionValid = validExtensions.includes(fileExtension)
    
    // 只要MIME类型或扩展名其中一个匹配就认为有效
    const isTypeValid = isMimeTypeValid || isExtensionValid
    
    const isSizeValid = file.raw && (file.raw.size / 1024 / 1024 < 100) // 修改大小限制为100MB

    if (!isTypeValid) {
        ElMessage.error(`文件类型不支持！支持的格式：${validExtensions.join(', ')}`)
        return false
    }
    if (!isSizeValid) {
        ElMessage.error('文件大小超过 100MB 限制！')
        return false
    }

    selectedFile.value = file.raw as File; // 保存文件对象
    console.log('文件信息:', {
        name: file.name,
        type: file.raw?.type,
        extension: fileExtension,
        size: file.raw?.size
    })
}

// 执行上传
// 修改提交处理函数
const handleUpload = async () => {
    if (form.type === 'link' && !form.linkUrl) {
        ElMessage.warning('请输入链接地址');
        return;
    }

    if (form.type !== 'link' && !selectedFile.value) {
        ElMessage.warning('请选择文件');
        return;
    }

    isUploading.value = true;

    try {
        const fileUrl = await uploadFileAndLinkToDB(
            form.type === 'link' ? null : selectedFile.value as File,
            {
                title: form.title,
                platform: form.platform,
                type: form.type,
            },
            form.type === 'link' ? form.title : selectedFile.value?.name || ''
        );

        if (fileUrl) {
            ElMessage.success('上传成功！');
            resetForm();
        }
    } catch (error: unknown) {
        ElMessage.error(`上传失败: ${(error as Error).message}`);
    } finally {
        isUploading.value = false;
    }
};


// 文件上传函数

// 修改上传函数
const uploadFileAndLinkToDB = async (file: File | null, materialData: { title: string; platform: string; type: string }, contentTitle: string) => {
    try {
        let fileUrl = '';

        if (materialData.type === 'link') {
            // 如果是链接类型，直接使用输入的链接
            fileUrl = form.linkUrl;
        } else {
            // 如果是文件类型，执行文件上传逻辑
            if (!file) throw new Error('未选择文件');

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

            const { data: fileData, error: uploadError } = await supabase.storage
                .from('materials')
                .upload(`documents/${fileName}`, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('materials')
                
                .getPublicUrl(fileData.path);

            fileUrl = urlData.publicUrl;
        }
        const label = ['platform_id', 'category_id', 'subcategory_id', 'topic_id']
        // 插入学习资料记录
        const { data: material, error: materialError } = await supabase
            .from('study_materials')
            .insert({
                ...materialData,
                [label[form.folderPath.length - 1]]: form.folderPath[form.folderPath.length - 1] // 添加主题ID
            })
            .select('id')
            .single();

        if (materialError) throw materialError;

        // 插入内容记录
        const { error: contentError } = await supabase
            .from('material_contents')
            .insert({
                material_id: material.id,
                title: materialData.title,
                content: fileUrl,
                content_type: materialData.type
            });
        if (contentError) throw contentError;

        console.log('文件上传并关联成功！');
        return fileUrl;

    } catch (error: unknown) {
        console.error('操作失败:', (error as Error).message);
        return null;
    }
};


</script>

<style scoped>
.upload {
    padding: 10px 0;

    & .training-title {
        margin: 20px 0;
    }
}
:deep(.el-form-item__content) {
    width: 100%;
}
.upload-box {
    width: 100%;
}
:deep(.el-upload){
    --el-upload-dragger-padding-horizontal: 10px;
}
</style>