<template>
    <el-card style="min-height: 400px;margin-top: 30px;">
        <template #header>
            <div class="subtitle">添加个人作业</div>
        </template>
        <el-form :model="form" ref="formRef" :rules="rules" label-width="80px"
            style="width: 100%;max-width: 800px;margin-top:40px;">
            <el-form-item label="标题" prop="title">
                <el-input v-model="form.title" />
            </el-form-item>
            <el-form-item label="内容" prop="content">
                <el-input v-model="form.content" type="textarea" :autosize="{ minRows: 10, maxRows: 15 }" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleSubmit">提交</el-button>
            </el-form-item>
        </el-form>
    </el-card>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { ref } from 'vue'
import { assignmentService } from '@/stores/assignmentService'
import type { Assignment } from '@/stores/assignmentService'
import { useUserStore } from '@/stores/user'

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

                // 手动设置assigned_to字段为当前用户
                const assignmentData: Assignment = {
                    ...form.value,
                    assigned_to: userId
                }

                await assignmentService.createAssignment(assignmentData)
                ElMessage.success('提交成功')
                formRef.value?.resetFields()
                form.value = {
                    title: '',
                    content: ''
                }
            } catch (error) {
                console.error('提交失败:', error)
                ElMessage.error('提交失败')
            }
        }
    })
}
</script>