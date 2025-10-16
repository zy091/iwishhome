<template>
    <el-header style="font-size: 16px">
        <el-row justify="space-between" :gutter="16" style="height: 100%;align-items: center;">
            <el-col :span="3">
                <!-- <el-image style="width: 170px; height: auto" src="https://iwishweb.com/wp-content/uploads/2023/09/LOGO-new.webp" fit="scale-down" /> -->
                <h1 style="font-size: 40px;font-weight: 700;">IWISH</h1>
            </el-col>
            <el-col :span="4">
                <div class="toolbar" style="display: flex;justify-content: end;align-items: center;">
                    <el-avatar
                        style="margin-right:10px ;min-width: 40px;font-size: 20px;font-weight: 700;align-items: center;line-height: 40px;justify-content: center;background: #2f87ff;" :src="user?.avatar_url">
                        {{ user?.full_name?.charAt(0)?.toUpperCase() || 'U' }}
                    </el-avatar>
                    <span
                        style="display: inline-block; overflow: hidden;text-overflow: ellipsis;white-space: nowrap;margin-right: 5px;">{{ user?.full_name }}</span>
                    <el-dropdown>
                        <el-icon style="margin-right: 10px; margin-top: 1px;font-size: 18px;color: #fff;">
                            <CaretBottom />
                        </el-icon>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <template v-if="!isTrainingHome">
                                <el-dropdown-item><el-link href="/system/personal-data">
                                        个人中心</el-link></el-dropdown-item>
                                <template v-if="hasPermission">
                                    <el-dropdown-item><el-link href="/system/" @click="goAdmin('')">
                                            全部菜单</el-link></el-dropdown-item>
                                    <el-dropdown-item><el-link href="/system/" @click="goAdmin('admin')">
                                            管理员</el-link></el-dropdown-item>
                                    <el-dropdown-item><el-link href="/system/" @click="goAdmin('google')">
                                            Google</el-link></el-dropdown-item>
                                    <el-dropdown-item><el-link href="/system/" @click="goAdmin('meta')">
                                            Meta</el-link></el-dropdown-item>
                                    <el-dropdown-item><el-link href="/system/" @click="goAdmin('criteo')">
                                            Criteo</el-link></el-dropdown-item>
                                </template>
                                </template>
                                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </el-col>
        </el-row>
    </el-header>
</template>

<script setup lang="ts">
import { Menu as IconMenu, Message, Setting, CaretBottom } from '@element-plus/icons-vue'
import { ref, onMounted, computed } from 'vue'
import { useUserStore ,hasManagmentPermission} from '@/stores/user'
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const userStore = useUserStore()
const hasPermission = computed(() =>
    hasManagmentPermission(Number(userStore.roleId))
)
const user = ref(userStore.user)
console.log(user.value, 'user')
const route = useRoute()
const circleUrl = ref('') // Define circleUrl as a reactive reference
onMounted(() => {
    // userStore.fetchUserProfile(user.value?.id)
    user.value = userStore.getUser()
})
const handleLogout = () => {
    userStore.logout()
    router.push('/login')
}

const isTrainingHome = computed(() => {
    return route.path.includes('/training-') || route.path.includes('/training-home')
})

const goAdmin = (category: string) => {
    localStorage.setItem('category',category)
}

</script>

<style scoped>
.el-header {
    position: fixed;
    width: 100%;
    background-color: #02347d;
    color: #fff;
    height: auto;
    padding: 10px 30px;
    z-index: 1000;
}
:deep(.el-dropdown-menu__item) {
    padding: 0 3px;
}
:deep(.el-dropdown-menu__item:last-child) {
    padding: 5px 13px;
}
.el-link {
    text-align: left;
    width: 100%;
    padding: 5px 10px;
}
</style>