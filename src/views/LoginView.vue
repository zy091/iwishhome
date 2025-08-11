<!-- Login.vue -->
<template>
    <div class="login-container">
        <h1 class="long-title">IWISH企业学习系统</h1>
        <!-- 登录表单 -->
        <el-form label-position="left" label-width="auto" :model="formLabelAlign" style="max-width: 400px">
            <div class="title-container">登录</div>
            <el-form-item prop="email" label="账号" :rules="[
                {
                    type: 'email',
                    message: '请输入正确的邮箱地址',
                    trigger: ['blur', 'change'],
                },
            ]">
                <el-input v-model="formLabelAlign.email" />
            </el-form-item>
            <el-form-item label="密码" prop="pass">
                <el-input v-model="formLabelAlign.password" type="password" autocomplete="off" show-password />
            </el-form-item>
            <el-form-item class="button-container">
                <el-button class="login-button" type="primary" @click="submitForm">
                    登录
                </el-button>
                <!-- <el-button type="primary" link @click="resetForm">
                    注册
                </el-button> -->
            </el-form-item>
        </el-form>
    </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import type { FormInstance } from 'element-plus'

import { useRouter } from 'vue-router' // 导入路由
import { useUserStore } from '@/stores/user';

const router = useRouter(); // 创建路由实例
const formLabelAlign = reactive<{
    email: string,
    password: string,
}>({
    email: '',
    password: ''
})
const userStore = useUserStore(); // 创建 store 实例

const submitForm = async () => {
    const { email, password } = formLabelAlign

    const {error } = await userStore.login(email, password)
    if (!error) {
        router.push('/system'); // 登录成功后跳转
    } 

}

const resetForm = (formEl: FormInstance | undefined) => {
    if (!formEl) return
    formEl.resetFields()
}
</script>

<style scoped>
.login-container {
    width: 100%;
    height: 100vh;
    background: #05479a;
    padding-top: 25vh;
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

.el-form {
    background: #fff;
    margin: 0 auto;
    padding: 30px;
    border-radius: 10px;
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

    & .el-button {
        width: 100%;
        margin: 0;
    }

    & .login-button {
        margin-bottom: 10px;
    }
}
</style>