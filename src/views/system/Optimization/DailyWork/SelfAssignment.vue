<template>
    <el-card style="min-height: 400px;margin-top: 30px;">
        <template #header>
            <div class="subtitle">添加个人作业</div>
        </template>
        <el-form :model="form" ref="formRef" :rules="rules" label-width="80px"
            style="width: 100%;max-width: 800px;margin-top:20px;">
            <el-form-item label="标题" prop="title">
                <el-input v-model="form.title" />
            </el-form-item>
            <el-form-item label="内容" prop="content">
                <el-input v-model="form.content" type="textarea" :autosize="{ minRows: 7, maxRows: 15 }" />
            </el-form-item>
            <el-form-item label="附件">
                <el-upload
                    class="upload-container"
                    drag
                    :auto-upload="true"
                    :http-request="customUploadRequest"
                    :on-remove="handleRemoveFile"
                    :before-upload="beforeUpload"
                    :limit="1"
                    :file-list="fileList"
                >
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">
                        将文件拖到此处，或<em>点击上传</em>
                    </div>
                    <template #tip>
                        <div class="el-upload__tip">
                            支持 PDF、Word、Excel、图片等类型文件，大小不超过10MB
                        </div>
                    </template>
                </el-upload>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleSubmit">提交</el-button>
            </el-form-item>
        </el-form>
    </el-card>
</template>

<script setup lang="ts">
import { ElMessage, ElLoading } from 'element-plus'
import type { FormInstance, UploadFile, UploadRequestOptions } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { assignmentService } from '@/stores/assignmentService'
import type { Assignment } from '@/stores/assignmentService'
import { useUserStore } from '@/stores/user'
import { supabase } from '@/lib/supabaseClient'

const userStore = useUserStore()

const rules = {
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const form = ref<Assignment>({
    title: '',
    content: ''
})

const formRef = ref<FormInstance>()
const fileList = ref<UploadFile[]>([])
const attachmentInfo = ref<{
    url: string;
    name: string;
    type: string;
} | null>(null)

// 上传前检查
const beforeUpload = (file: File) => {
    // 检查文件大小 (10MB)
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
        ElMessage.error('文件大小不能超过 10MB!')
        return false
    }
    return true
}

// 自定义上传请求处理
const customUploadRequest = async (options: UploadRequestOptions) => {
    const { file, onSuccess, onError } = options
    
    if (!file) {
        onError?.(new Error('文件不存在') as any)
        return
    }
    
    const loadingInstance = ElLoading.service({
        text: '正在上传文件...',
        background: 'rgba(0, 0, 0, 0.7)'
    })
    
    try {
        // 生成唯一文件名
        const fileObj = file as File
        const fileExt = fileObj.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        const filePath = `assignments/${fileName}`
        
        // 上传到supabase存储
        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(filePath, fileObj, {
                cacheControl: '3600',
                upsert: false
            })
            
        if (error) throw error
        
        // 获取公共URL
        const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(data.path)
        
        // 保存附件信息
        attachmentInfo.value = {
            url: publicUrl,
            name: fileObj.name,
            type: fileObj.type
        }
        
        // 上传成功回调
        onSuccess?.(attachmentInfo.value as any)
        ElMessage.success('文件上传成功')
    } catch (err) {
        console.error('文件上传错误:', err)
        onError?.(new Error(err instanceof Error ? err.message : '上传失败') as any)
        ElMessage.error('文件上传失败，请重试')
    } finally {
        loadingInstance.close()
    }
}

// 移除文件处理
const handleRemoveFile = () => {
    attachmentInfo.value = null
}

const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            try {
                // 确保当前用户同时是创建者和接收者
                const userId = userStore.user?.user_id
                if (!userId) {
                    ElMessage.error('用户未登录')
                    return
                }

                // 手动设置assigned_to字段为当前用户，并包含附件信息
                const assignmentData: Assignment = {
                    ...form.value,
                    assigned_to: userId,
                    attachment_url: attachmentInfo.value?.url,
                    attachment_name: attachmentInfo.value?.name,
                    attachment_type: attachmentInfo.value?.type
                }

                await assignmentService.createAssignment(assignmentData)
                ElMessage.success('提交成功')
                formRef.value?.resetFields()
                form.value = {
                    title: '',
                    content: ''
                }
                fileList.value = []
                attachmentInfo.value = null
            } catch (error) {
                console.error('提交失败:', error)
                ElMessage.error('提交失败')
            }
        }
    })
}
</script>

<style scoped>
.upload-container {
    width: 100%;
}

.el-upload__tip {
    color: #909399;
    font-size: 12px;
    margin-top: 8px;
}

:deep(.el-upload-dragger) {
    width: 100%;
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
}
</style>