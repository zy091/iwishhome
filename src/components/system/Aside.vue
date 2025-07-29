<template>
    <el-menu class="el-menu-vertical-demo" active-text-color="#fff" background-color="#05479a" text-color="#fff"
        style="position: fixed;z-index: 999; height: calc(100vh - 84px);left: 0; width:240px;" :router="true"
        :unique-opened="true" :default-active="activeIndex" :default-openeds="openedMenus" @select="handleMenuSelect" :loading="loading">

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
    Notebook
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