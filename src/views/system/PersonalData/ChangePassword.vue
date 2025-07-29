<!-- 修改密码 -->
<template>
    <div class="change-password-container">
        <el-form ref="formRef" :model="passwordForm" :rules="rules" label-width="120px" class="password-form"  height="300px">
            <el-form-item label="当前密码" prop="currentPassword">
                <el-input v-model="passwordForm.currentPassword" type="password" show-password />
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>

            <el-form-item label="确认新密码" prop="confirmPassword">
                <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
            </el-form-item>

            <el-form-item>
                <el-button type="primary" @click="submitForm" :loading="loading">确认修改</el-button>
                <el-button @click="resetForm">重置</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { supabase } from '@/lib/supabaseClient'

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

// 表单数据
const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

// 验证规则
const validatePass = (rule: any, value: string, callback: any) => {
    if (value === '') {
        callback(new Error('请输入密码'))
    } else {
        if (passwordForm.confirmPassword !== '') {
            if (formRef.value) {
                formRef.value.validateField('confirmPassword')
            }
        }
        callback()
    }
}

const validatePass2 = (rule: any, value: string, callback: any) => {
    if (value === '') {
        callback(new Error('请再次输入密码'))
    } else if (value !== passwordForm.newPassword) {
        callback(new Error('两次输入密码不一致!'))
    } else {
        callback()
    }
}

const rules = reactive<FormRules>({
    currentPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
    ],
    newPassword: [
        { required: true, validator: validatePass, trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, validator: validatePass2, trigger: 'blur' }
    ]
})

// 提交表单
const submitForm = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                const { error } = await supabase.auth.updateUser({
                    password: passwordForm.newPassword
                })

                if (error) throw error

                ElMessage.success('密码修改成功')
                resetForm()
            } catch (error: any) {
                console.error('修改密码失败:', error)
                ElMessage.error(error.message || '修改密码失败')
            } finally {
                loading.value = false
            }
        }
    })
}

// 重置表单
const resetForm = () => {
    if (formRef.value) {
        formRef.value.resetFields()
    }
}
</script>

<style scoped>
.change-password-container {
    padding: 20px;
}

.password-form {
    max-width: 500px;
    margin: 0 auto;
}
</style>