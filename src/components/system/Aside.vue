<template>
    <el-menu class="el-menu-vertical-demo" active-text-color="#fff" background-color="#05479a" text-color="#fff"
        style="position: fixed;z-index: 999; height: calc(100vh - 84px);left: 0; width:240px;" :router="true"
        :unique-opened="true" :default-active="activeIndex" :default-openeds="openedMenus" @select="handleMenuSelect"
        :loading="loading">

        <template v-for="item in menus" :key="item.id">
            <el-sub-menu v-if="item.children && item.children.length > 0" :index="`/system${item.path}`">
                <template #title>
                    <el-icon>
                        <component :is="item.icon" />
                    </el-icon>
                    <span>{{ item.name }}</span>
                </template>
                <el-menu-item v-for="children in item.children" :key="children.id" :index="`/system${children.path}`">{{
                    children.name
                }}</el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="`/system${item.path}`">
                <el-icon>
                    <component :is="item.icon" />
                </el-icon>
                <span>{{ item.name }}</span>
            </el-menu-item>
        </template>

    </el-menu>
</template>

<script lang="ts" setup>
import { ref, watchEffect, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
    Document,
    Menu as IconMenu,
    Location,
    Setting,
    CirclePlus,
    Briefcase,
    UserFilled,
    HomeFilled,
    ChromeFilled,
    SetUp,
    Folder,
    Notebook,
    DocumentAdd
} from '@element-plus/icons-vue'
import type { ElSubMenu } from 'element-plus'
const router = useRouter()
const activeIndex = ref('')
const openedMenus = ref<string[]>([])
import { useUserStore } from '@/stores/user' // 确保导入 useUserStore

const loading = ref(false)
const userStore = useUserStore()
const menus = computed(() => {
    return userStore.getMenus

})

onMounted(async () => {
    loading.value = true
    await userStore.fetchMenus()
    loading.value = false
    console.log(menus.value, 'aside menus')
})

// 直接使用 store 中的 menus

const handleSubMenuClick = (path: string, event: MouseEvent) => {
    if (!event?.currentTarget) return

    const target = event.currentTarget as HTMLElement
    const subMenu = target.closest('.el-sub-menu') || findParentElement(target)

    if (subMenu?.getAttribute('index') && !openedMenus.value.includes(path)) {
        openedMenus.value = [path]
        router.push(path)
        activeIndex.value = path
    }
}

const findParentElement = (element: HTMLElement): HTMLElement | null => {
    let current: HTMLElement | null = element
    while (current && current !== document.body) {
        if (current.classList.contains('el-sub-menu')) {
            return current
        }
        current = current.parentElement
    }
    return null
}

const handleMenuSelect = (index: string) => {
    activeIndex.value = index

    // 检查是否为demand路由
    if (index === '/system/demand') {
        handleDemandRedirect()
    }
}

// Base64URL 编码
// function toBase64Url(json: any) {
//     const s = typeof json === 'string' ? json : JSON.stringify(json)
//     return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
// }
function toBase64Url(json: any) {
    const s = typeof json === 'string' ? json : JSON.stringify(json);
    // 使用 encodeURIComponent 处理 UTF-8 字符
    const encoded = btoa(unescape(encodeURIComponent(s)));
    // 转换为 Base64URL 格式
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// 处理demand路由跳转
const handleDemandRedirect = () => {
    try {
        // 从当前登录用户构造载荷
        const userPayload = {
            id: userStore.user?.user_id || '',
            email: userStore.user?.email || '',
            name: userStore.user?.full_name || userStore.user?.email?.split('@')[0] || '用户',
            role: getUserRole(userStore.user?.role_id)
        }

        // 编码并在新标签页中打开
        const encoded = toBase64Url(userPayload)
        window.open(`https://iwishneed.netlify.app/auth/bridge?external_user=${encoded}`, '_blank')

    } catch (error) {
        console.error('处理demand跳转失败:', error)
        // 如果跳转失败，可以显示错误提示或回退到正常路由
        ElMessage.error('跳转失败，请稍后重试')
    }
}

// 根据角色ID获取角色名称
const getUserRole = (roleId: number | undefined): string => {
    if (!roleId) return 'submitter'

    switch (roleId) {
        case 0:
        case 1:
            return 'admin'
        case 2:
        case 3:
            return 'manager'
        case 4:
        case 5:
            return 'developer'
        default:
            return 'submitter'
    }
}

</script>

<style>
.el-menu-vertical-demo:not(.el-menu--collapse) {
    width: 200px;
    min-height: 400px;
}

.el-menu-item.is-active span,
.el-menu-item.is-active {
    color: #fff;
    background-color: var(--el-menu-hover-bg-color);
    font-weight: 700;
}

.el-sub-menu__title:has(div.is-active) {
    color: #fff;
    background-color: var(--el-menu-hover-bg-color);
    font-weight: 700;
}
</style>