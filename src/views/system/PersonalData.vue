<!-- 个人中心 -->
<!-- 
2025-04-02
姓名不可更改，删除个人地址
-->
<template>
    <div class="layout">
        <Breadcrumb :breadbcrum="breadbcrum" />
        <div class="layout-title">
            <h1 class="title">个人中心</h1>
        </div>
        <div class="personal-info-container">
            <el-card class="info-card">
                <el-skeleton :loading="loading" animated>
                    <template #default>
                        <div class="profile-container">
                            <div class="profile-header">
                                <el-avatar :size="100" :src="avatarUrl" class="profile-avatar">
                                    {{ userForm.full_name?.charAt(0)?.toUpperCase() || 'U' }}
                                </el-avatar>
                                <div class="profile-basic-info">
                                    <h2 class="profile-name">{{ userForm.full_name }}</h2>
                                    <p class="profile-bio">{{ userForm.bio || '海纳百川，有容乃大' }}</p>
                                    <div class="profile-actions">
                                        <el-button type="primary" @click="isEditing = !isEditing">
                                            {{ isEditing ? '取消' : '编辑资料' }}
                                        </el-button>
                                    </div>
                                </div>
                            </div>

                            <div class="profile-details">
                                <div class="profile-detail-item">
                                    <el-icon>
                                        <UserFilled />
                                    </el-icon>
                                    <span>{{ userForm.role?.name || '交互专家' }}</span>
                                </div>
                                <div class="profile-detail-item">
                                    <el-icon>
                                        <Briefcase />
                                    </el-icon>
                                    <span>{{ userForm.organization_path || 'IWISH - 某某事业群 - 某某平台部 - 某某技术部' }}</span>
                                </div>
                                <!-- <div class="profile-detail-item">
                                    <el-icon>
                                        <Location />
                                    </el-icon>
                                    <span>{{ userForm.address || '浙江省杭州市' }}</span>
                                </div> -->
                                <div class="profile-detail-item">
                                    <el-icon>
                                        <Message />
                                    </el-icon>
                                    <span>{{ userForm.email }}</span>
                                </div>
                                <div class="profile-detail-item">
                                    <el-icon>
                                        <Phone />
                                    </el-icon>
                                    <span>{{ userForm.phone_number }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- 编辑表单，仅在编辑模式显示 -->
                        <el-form v-if="isEditing" ref="formRef" :model="userForm" :rules="rules" label-width="120px"
                            class="edit-form">
                            <el-form-item label="头像">
                                <div class="avatar-container">
                                    <el-upload class="avatar-uploader" action="#" :auto-upload="false"
                                        :show-file-list="false" :on-change="handleAvatarChange">
                                        <img v-if="avatarUrl" :src="avatarUrl" class="avatar" />
                                        <el-icon v-else class="avatar-uploader-icon">
                                            <Plus />
                                        </el-icon>
                                    </el-upload>
                                    <div v-if="avatarUrl" class="avatar-overlay">
                                        <el-button  circle class="delete-avatar-btn" @click.stop="removeAvatar">
                                            <el-icon><Delete /></el-icon>
                                        </el-button>
                                    </div>
                                </div>
                            </el-form-item>

                            <el-form-item label="姓名" prop="full_name">
                                <el-input v-model="userForm.full_name" disabled/>
                            </el-form-item>

                            <el-form-item label="个人简介" prop="bio">
                                <el-input v-model="userForm.bio" />
                            </el-form-item>

                            <el-form-item label="部门" prop="department">
                                <el-input v-model="userForm.organization_path" />
                            </el-form-item>

                            <el-form-item label="邮箱" prop="email">
                                <el-input v-model="userForm.email" disabled />
                            </el-form-item>

                            <el-form-item label="手机号码" prop="phone_number">
                                <el-input v-model="userForm.phone_number" />
                            </el-form-item>

                            <!-- <el-form-item label="地址" prop="address">
                                <el-input v-model="userForm.address" type="textarea" :rows="3" />
                            </el-form-item> -->

                            <el-form-item>
                                <el-button type="primary" @click="submitForm">保存</el-button>
                                <el-button @click="isEditing = !isEditing">
                                    取消
                                </el-button>
                            </el-form-item>
                        </el-form>
                    </template>
                </el-skeleton>
            </el-card>
            <el-card class="list-card">
                <template #header>
                    <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" 
                        :router="true">
                        <!-- <el-menu-item index="/system/personal-data/study-materials">学习资料</el-menu-item> -->
                        <el-menu-item index="/system/personal-data/test-result">学习测试</el-menu-item>
                        <el-menu-item index="/system/personal-data/study-notes">学习心得</el-menu-item>
                        <el-menu-item index="/system/personal-data/daily-assignments">日常作业</el-menu-item>
                        <el-menu-item index="/system/personal-data/change-password">修改密码</el-menu-item>
                    </el-menu>
                </template>
                <RouterView></RouterView>
            </el-card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElForm } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import Breadcrumb from '@/components/system/Breadcrumb.vue'
import { UserFilled, Briefcase, Location, Message, Phone, Plus, Delete } from '@element-plus/icons-vue'
import type { Role } from '@/stores/roleService'
import { supabase } from '@/lib/supabaseClient'
import { useRoute } from 'vue-router'

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(true)
const isEditing = ref(false)
const avatarUrl = ref('')
const breadbcrum = reactive([
    {
        name: '个人信息',
        path: '/system/personal-information'
    },
])
// 表单数据
const userForm = reactive({
    full_name: '',
    email: '',
    phone_number: '',
    // address: '',
    bio: '',  // 新增个人简介字段
    department: '', // 新增部门字段
    role: null as Role | null, // 修改为Role类型
    avatar_url: '', // 添加头像URL字段
    organization_path: ''
})

// 表单验证规则
const rules = reactive<FormRules>({
    // full_name: [
    //     { required: true, message: '请输入姓名', trigger: 'blur' },
    //     { min: 2, max: 50, message: '长度应为2到50个字符', trigger: 'blur' }
    // ],
    phone_number: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
    ]
})

// 获取用户信息
const fetchUserInfo = async () => {
    loading.value = true
    try {
        // 优先使用本地存储的用户信息
        const currentUser = userStore.getUser()

        if (!currentUser) {
            ElMessage.error('未登录或无法获取用户信息')
            return
        }

        // 设置头像URL
        if (currentUser.avatar_url) {
            avatarUrl.value = currentUser.avatar_url
            userForm.avatar_url = currentUser.avatar_url
        }

        // 如果有用户ID，获取最新的用户资料
        if (currentUser.user_id) {
            const { data: userInfo, error } = await userStore.fetchUserProfile(currentUser.user_id)

            if (error) throw error

            // 更新表单数据
            userForm.full_name = currentUser.full_name || ''
            userForm.email = currentUser.email || ''
            userForm.phone_number = currentUser.phone_number || ''
            // userForm.address = currentUser.address || ''
            userForm.bio = currentUser.bio || ''
            userForm.department = currentUser.department || ''
            userForm.role = currentUser.role || null
            userForm.organization_path = currentUser.organization_path || ''
        }
    } catch (error) {
        console.error('获取用户信息失败:', error)
        ElMessage.error('获取用户信息失败')
    } finally {
        loading.value = false
    }
}

// 处理头像上传
const handleAvatarChange = (file: any) => {
    // 立即预览头像
    const reader = new FileReader()
    reader.onload = (e) => {
        avatarUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(file.raw)
}

// 上传头像到Supabase存储
const uploadAvatar = async (file: File) => {
    loading.value = true
    try {
        const currentUser = userStore.getUser()
        if (!currentUser || !currentUser.user_id) {
            ElMessage.error('未登录或无法获取用户信息')
            return null
        }

        // 创建唯一的文件名
        const fileExt = file.name.split('.').pop()
        const fileName = `${currentUser.user_id}_${Date.now()}.${fileExt}`
        const filePath = `user_avatar/${fileName}`

        // 上传到Supabase存储
        const { data, error } = await supabase.storage
            .from('materials')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            })

        if (error) throw error

        // 获取公共URL
        const { data: urlData } = supabase.storage
            .from('materials')
            .getPublicUrl(filePath)

        return urlData.publicUrl
    } catch (error) {
        console.error('上传头像失败:', error)
        ElMessage.error('上传头像失败')
        return null
    } finally {
        loading.value = false
    }
}

// 删除头像
const removeAvatar = () => {
    avatarUrl.value = ''
    userForm.avatar_url = ''
    ElMessage.success('头像已删除，保存后生效')
}

// 修改提交表单函数，增加头像上传处理
const submitForm = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid: boolean) => {
        if (valid) {
            loading.value = true
            try {
                // 使用getUser确保获取最新的用户信息
                const currentUser = userStore.getUser()

                if (!currentUser) {
                    ElMessage.error('未登录或无法获取用户信息')
                    return
                }

                // 确保user_id存在且为字符串
                if (!currentUser.user_id) {
                    ElMessage.error('无法获取用户ID')
                    return
                }

                // 准备更新数据
                const updateData: any = {
                    full_name: userForm.full_name,
                    phone_number: userForm.phone_number,
                    // address: userForm.address,
                    bio: userForm.bio,
                    department: userForm.department
                }

                // 如果头像被删除，设置为null
                if (avatarUrl.value === '') {
                    updateData.avatar_url = null
                }
                // 如果有新的头像文件，先上传获取URL
                else if (avatarUrl.value && !avatarUrl.value.startsWith('http')) {
                    // 在浏览器环境中处理头像文件
                    try {
                        // 将base64字符串转换为文件对象
                        const base64Response = await fetch(avatarUrl.value)
                        const blob = await base64Response.blob()
                        const fileName = `avatar_${Date.now()}.${blob.type.split('/')[1]}`
                        const avatarFile = new File([blob], fileName, { type: blob.type })

                        // 上传文件并获取URL
                        const uploadedAvatarUrl = await uploadAvatar(avatarFile)
                        if (uploadedAvatarUrl) {
                            updateData.avatar_url = uploadedAvatarUrl
                        }
                    } catch (error) {
                        console.error('处理头像文件失败:', error)
                        ElMessage.warning('头像处理失败，将使用默认头像')
                    }
                }

                // 使用userStore的updateUserProfile方法更新用户信息
                const { error } = await userStore.updateUserProfile(currentUser.user_id, updateData)

                if (error) throw error

                ElMessage.success('个人信息更新成功')
                isEditing.value = false
            } catch (error) {
                console.error('更新用户信息失败:', error)
                ElMessage.error('更新用户信息失败,或刷新重试')
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
        fetchUserInfo() // 重新获取原始数据
    }
}
const route = useRoute()
const activeIndex = ref('/system/personal-data/study-notes')

onMounted(() => {
    activeIndex.value = route.path // 获取当前路由的路径
    fetchUserInfo()
})
</script>

<style scoped>
.personal-info-container {
    /* max-width: 800px; */
    /* margin: 20px auto; */
    /* padding: 0 20px; */
    display: flex;
    gap: 20px;
    align-items: flex-start;
    justify-content: space-between;
}

.info-card {
    margin-bottom: 20px;
    width: 35%;
    min-width: 300px;
}

.list-card {
    width: 65%;
    min-width: 300px;
}
:deep(.el-card__header) {
    padding: 0;
}
:deep(.el-menu--horizontal.el-menu)  {
    border-bottom: none;
}
:deep(.el-menu--horizontal.el-menu .el-menu-item)  {
    font-size: 16px;
    color: #000;
}
/* 新增样式 */
.profile-container {
    padding: 20px;
}

.profile-header {
    display: flex;
    align-items: center;
    margin-bottom: 24px;
}

.profile-avatar {
    background: #1890ff;
    color: #fff;
    font-weight: bold;
    margin-right: 24px;
    font-size: 24px;
}

.profile-basic-info {
    flex: 1;
}

.profile-name {
    margin: 0 0 8px 0;
    font-size: 24px;
    color: #333;
}

.profile-bio {
    margin: 0 0 16px 0;
    color: #666;
    font-size: 14px;
}

.profile-actions {
    margin-top: 16px;
}

.profile-details {
    border-top: 1px solid #eee;
    padding-top: 16px;
}

.profile-detail-item {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}

.profile-detail-item .el-icon {
    margin-right: 8px;
    color: #1890ff;
    font-size: 16px;
}

.edit-form {
    margin-top: 24px;
    border-top: 1px solid #eee;
    padding-top: 24px;
}

.avatar-uploader {
    width: 100px;
    height: 100px;
    border: 1px dashed #d9d9d9;
    border-radius: 50%;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}

.avatar-uploader:hover {
    border-color: #409EFF;
}

.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
}

.avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
}

.avatar-container {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    overflow: hidden;
}

.avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.avatar-container:hover .avatar-overlay {
    opacity: 1;
}

.delete-avatar-btn {
    border: none;
}

</style>