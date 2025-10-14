<!-- Login.vue -->
<template>
    <div class="login-container">
        <h1 class="long-title">IWISH企业学习系统</h1>
        <!-- 登录表单 -->
        <el-form v-if="isLoginMode" label-position="left" label-width="auto" :model="formLabelAlign" :rules="loginRules" ref="loginFormRef" class="login-form">
            <div class="title-container">登录</div>
            <el-form-item prop="email" label="账号">
                <el-input v-model="formLabelAlign.email" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
                <el-input v-model="formLabelAlign.password" type="password" autocomplete="off" show-password />
            </el-form-item>
            <el-form-item class="button-container">
                <el-button class="login-button" type="primary" @click="submitForm(loginFormRef)">
                    登录
                </el-button>
                <el-button type="primary" link @click="isLoginMode = false" class="register-link-button">
                    注册
                </el-button>
            </el-form-item>
        </el-form>

        <!-- 注册表单 -->
        <el-form v-else label-position="left" label-width="auto" :model="registerForm" :rules="registerRules" ref="registerFormRef" class="register-form">
            <div class="title-container">注册</div>
            <el-form-item label="用户名" prop="username">
                <el-input v-model="registerForm.username" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
                <el-input v-model="registerForm.email" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
                <el-input v-model="registerForm.password" type="password" autocomplete="off" show-password />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
                <el-input v-model="registerForm.confirmPassword" type="password" autocomplete="off" show-password />
            </el-form-item>
            <el-form-item label="所属组织" prop="bio">
                <el-input type="textarea" v-model="registerForm.bio" autosize  placeholder="例：效果营销部-运营一部-谷歌优化师助理" />
            </el-form-item>
            <el-form-item class="button-container">
                <el-button type="primary" @click="handleRegister(registerFormRef)">
                    注册
                </el-button>
                <el-button type="primary" link @click="isLoginMode = true" class="login-link-button">
                    已有账号？去登录
                </el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isLoginMode = ref(true) // 控制显示登录或注册表单

const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()

// 登录表单
const formLabelAlign = reactive({
    email: '',
    password: ''
})

// 登录表单验证规则
const loginRules = reactive<FormRules>({
    email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' }
    ]
})

// 注册表单
const registerForm = reactive({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio:''
})

// 注册表单验证规则
const registerRules = reactive<FormRules>({
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    bio: [
        { required: true, message: '请输所在组织', trigger: 'blur' },
    ],
    email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        { 
            validator: (rule, value, callback) => {
                if (value !== registerForm.password) {
                    callback(new Error('两次输入密码不一致'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ]
})

// 登录方法
const submitForm = async (formEl: FormInstance | undefined) => {
    if (!formEl) return
    await formEl.validate(async (valid, fields) => {
        if (valid) {
            const { email, password } = formLabelAlign
            const result = await userStore.login(email, password)
            
            if (!result.error) {
                if (route.query.redirect) {
                    router.push(route.query.redirect as string)
                } else {
                    router.push('/system')
                }
            }
        } else {
            console.log('error submit!', fields)
        }
    })
}

// 注册方法
const handleRegister = async (formEl: FormInstance | undefined) => {
    if (!formEl) return
    await formEl.validate(async (valid, fields) => {
        if (valid) {
            const { username, email, password ,bio} = registerForm
            const result = await userStore.register({
                username,
                email,
                password,
                bio
            })
            
            if (!result.error) { // 检查 result 对象中是否存在 error 属性
                ElMessage.success('注册成功，请联系管理员通过审核')
                isLoginMode.value = true // 注册成功后切换回登录模式
                formLabelAlign.email = email // 预填充邮箱
                formEl.resetFields() // 清空注册表单
            }
        } else {
            console.log('error submit!', fields)
        }
    })
}
</script>

<style scoped>
.login-container {
    width: 100%;
    height: 100vh;
    background: #05479a;
    padding-top: 15vh;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.long-title {
    color: #fff;
    text-align: center;
    margin-bottom: 30px;
    font-size: 35px;
}

.el-form-item {
    margin-bottom: 22px;
}

.login-form, .register-form {
    background: #fff;
    margin: 0 auto;
    padding: 30px;
    border-radius: 10px;
    max-width: 460px; /* 保持与之前 tabs 容器的宽度一致 */
    width: 100%; /* 确保在 max-width 范围内自适应 */
}

.title-container {
    margin-bottom: 30px;
    text-align: center;
    font-size: 25px;
    font-weight: 600;
    color: #333;
}

.button-container .el-form-item__content {
    flex-direction: column;
    margin-left: 0;
    gap: 10px !important;
}

.button-container .el-form-item__content > .el-button {
    width: 100%;
    margin: 0;
}

.button-container .el-form-item__content > .login-button {
    margin-bottom: 10px;
}

.button-container .el-form-item__content > .register-link-button,
.button-container .el-form-item__content > .login-link-button {
    color: #f56c6c; /* 红色 */
}
</style>