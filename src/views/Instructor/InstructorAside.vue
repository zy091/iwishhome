<template>
  <div class="aside-container">
    <el-menu
      :default-active="activeMenu"
       class="el-menu-vertical-demo" active-text-color="#fff" background-color="#05479a" text-color="#fff"
        style="position: fixed;z-index: 999; height: calc(100vh - 84px);left: 0; width:240px; overflow-y: auto;overflow-x: hidden;" :router="true"
        :unique-opened="true" 
    >
      <div class="menu-title">讲师体系</div>
      
      <el-menu-item 
        v-for="menu in visibleMenus" 
        :key="menu.id"
        :index="menu.path"
      >
        <el-icon>
          <component :is="getIconComponent(menu.icon)" />
        </el-icon>
        <span>{{ menu.title }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { User, Setting } from '@element-plus/icons-vue'
import { supabase } from '@/lib/supabaseClient'
import { ElMessage } from 'element-plus'

interface MenuItem {
  id: number
  title: string
  path: string
  icon: string
  parent_id: number | null
  sort_order: number
  is_visible: boolean
  required_role_ids: number[] | null
}

const route = useRoute()
const userStore = useUserStore()

const activeMenu = ref(route.path)
const menuList = ref<MenuItem[]>([])

// 监听路由变化
watch(() => route.path, (newPath) => {
  activeMenu.value = newPath
})

// 监听 userStore.roleId 的变化，确保权限实时更新
watch(() => userStore.roleId, (newRoleId) => {
  console.log('roleId 变化:', newRoleId)
})

// 获取图标组件
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'User': User,
    'Setting': Setting
  }
  return iconMap[iconName] || User
}

// 检查菜单是否有权限显示
const hasMenuPermission = (requiredRoleIds: number[] | null) => {
  const roleId = userStore.roleId
  
  
  // 没有角色限制,所有人可见
  if (!requiredRoleIds || requiredRoleIds.length === 0) {
    return true
  }
  
  // 检查用户角色是否在允许的角色列表中
  if (roleId !== null && roleId !== undefined) {
    const numRoleId = Number(roleId)
    const hasPermission = requiredRoleIds.includes(numRoleId)
    return hasPermission
  }
  
  return false
}

// 过滤出可见的菜单
const visibleMenus = computed(() => {
  // 确保 roleId 已加载
  if (!userStore.roleId && userStore.roleId !== 0) {
    userStore.loadRoleId()
  }
  
  const filtered = menuList.value
    .filter(menu => {
      const isVisible = menu.is_visible
      const hasPermission = hasMenuPermission(menu.required_role_ids)
      return isVisible && hasPermission
    })
    .sort((a, b) => a.sort_order - b.sort_order)
  
  return filtered
})

// 从数据库获取菜单数据
const fetchMenuData = async () => {
  try {
    const { data, error } = await supabase
      .from('menu_instructor')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })

    if (error) {
      ElMessage.error('获取菜单数据失败')
      return
    }

    menuList.value = data || []
  } catch (err) {
    ElMessage.error('获取菜单数据异常')
  }
}

onMounted(() => {
  // 确保先加载 roleId
  userStore.loadRoleId()
  fetchMenuData()
})
</script>

<style scoped>
.aside-container {
  height: 100%;
  background-color: #001529;
}

.menu-title {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 10px;
}

.el-menu-vertical {
  border-right: none;
  height: 100%;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  font-size: 14px;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #1890ff !important;
}

:deep(.el-icon) {
  margin-right: 8px;
  font-size: 16px;
}
</style>
