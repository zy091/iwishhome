<template>
    <el-card style="min-height: 400px;margin-top: 30px;">
        <template #header>
            <div class="subtitle">写下你的学习心得</div>
        </template>
        <el-form :model="form" ref="formRef" :rules="rules" label-width="50px"
            style="width: 100%;max-width: 800px;margin-top:40px;">
            <el-form-item label="日期">
                <el-date-picker v-model="value1" type="date" placeholder="Pick a day" size="default" :readonly="true" />
            </el-form-item>
            <el-form-item label="标题">
                <el-input v-model="form.title" />
            </el-form-item>
            <el-form-item label="内容">
                <el-input v-model="form.content" type="textarea" :autosize="{ minRows: 10, maxRows: 15 }" />
            </el-form-item>
            <el-form-item label="附件">
                <el-upload
                    class="upload-demo"
                    action="#"
                    :auto-upload="false"
                    :on-change="handleFileChange"
                    :on-remove="handleFileRemove"
                    :limit="1"
                    :file-list="fileList">
                    <el-button type="primary">选择文件</el-button>
                    <template #tip>
                        <div class="el-upload__tip">
                            可以上传PDF、Word、图片等文件，大小不超过10MB
                        </div>
                    </template>
                </el-upload>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleSubmit" :loading="uploading">提交</el-button>
            </el-form-item>
        </el-form>
    </el-card>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, UploadFile, UploadUserFile } from 'element-plus'
import { ref } from 'vue';
import { studyNoteService } from '@/stores/studyNoteService'
import { supabase } from '@/lib/supabaseClient'
import { useUserStore } from '@/stores/user'

const rules = {
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}
const value1 = ref(new Date())
const form = ref({
    title: '',
    content: ''
});
const formRef = ref<FormInstance>()
const fileList = ref<UploadUserFile[]>([])
const uploading = ref(false)
const userStore = useUserStore()

// 文件变化处理
const handleFileChange = (file: UploadFile) => {
    if (file.size && file.size > 10 * 1024 * 1024) {
        ElMessage.warning('文件大小不能超过10MB')
        fileList.value = []
        return false
    }
    fileList.value = [file]
}

// 文件移除处理
const handleFileRemove = () => {
    fileList.value = []
}

// 上传文件到存储
const uploadFile = async (file: File): Promise<{ url: string, name: string, type: string } | null> => {
    try {
        const userId = userStore.user?.user_id
        if (!userId) {
            throw new Error('用户未登录')
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}-${Date.now()}.${fileExt}`
        const filePath = `study-notes/${fileName}`

        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) throw error

        // 获取公共URL
        const { data: urlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath)

        return {
            url: urlData.publicUrl,
            name: file.name,
            type: file.type
        }
    } catch (error) {
        console.error('上传文件失败:', error)
        ElMessage.error('文件上传失败')
        return null
    }
}

// 提交表单
const handleSubmit = async () => {
    if (!formRef.value || !form.value.title || !form.value.content) {
        ElMessage.error('请填写完整信息')
        return
    }

    await formRef.value.validate(async (valid) => {
        if (valid) {
            uploading.value = true
            try {
                // 处理文件上传
                let fileData = null
                if (fileList.value.length > 0 && fileList.value[0].raw) {
                    fileData = await uploadFile(fileList.value[0].raw)
                    if (!fileData) {
                        uploading.value = false
                        return
                    }
                }

                // 创建笔记
                const noteData = {
                    title: form.value.title,
                    content: form.value.content,
                    ...(fileData && {
                        attachment_url: fileData.url,
                        attachment_name: fileData.name,
                        attachment_type: fileData.type
                    })
                }

                await studyNoteService.createNote(noteData)
                ElMessage.success('提交成功')
                formRef.value?.resetFields()
                form.value.title = ''
                form.value.content = ''
                fileList.value = []
            } catch (error) {
                console.error('提交失败:', error)
                ElMessage.error('提交失败')
            } finally {
                uploading.value = false
            }
        }
    })
}
</script>

<style scoped>
.upload-demo {
    width: 100%;
}
</style>