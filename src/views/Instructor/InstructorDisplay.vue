<template>
  <div class="instructor-display">
    <div class="page-header">
      <h2>讲师团队</h2>
      <p>优秀的讲师团队，为您提供专业的培训服务</p>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索讲师姓名或专业领域"
            clearable
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="selectedDepartment"
            placeholder="选择部门"
            clearable
            @change="handleSearch"
          >
            <el-option label="全部部门" value="" />
            <el-option label="Google广告部" value="Google广告部" />
            <el-option label="Meta广告部" value="Meta广告部" />
            <el-option label="数字营销部" value="数字营销部" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 讲师卡片列表 -->
    <div class="instructor-grid" v-loading="loading">
      <div
        v-for="instructor in instructors"
        :key="instructor.id"
        class="instructor-card"
        @click="viewDetail(instructor.id)"
      >
        <div class="card-header">
          <img
            :src="instructor.avatar_url || getDefaultAvatar(instructor.name)"
            :alt="instructor.name"
            class="avatar"
          />
          <div class="status-badge" :class="{ active: instructor.is_active }">
            {{ instructor.is_active ? '在职' : '离职' }}
          </div>
        </div>

        <div class="card-body">
          <h3 class="instructor-name">{{ instructor.name }}</h3>
          <p class="instructor-title">{{ instructor.title }} · {{ instructor.department }}</p>

          <div class="specialties">
            <el-tag
              v-for="(specialty, index) in instructor.specialties"
              :key="index"
              size="small"
              type="info"
              effect="plain"
            >
              {{ specialty }}
            </el-tag>
          </div>

          <p class="introduction">{{ truncateText(instructor.introduction, 80) }}</p>

          <div class="stats">
            <div class="stat-item">
              <el-icon><Document /></el-icon>
              <span>{{ instructor.total_courses }} 门课程</span>
            </div>
            <div class="stat-item">
              <el-icon><UserFilled /></el-icon>
              <span>{{ instructor.total_students }} 学员</span>
            </div>
            <div class="stat-item">
              <el-icon><Star /></el-icon>
              <span>{{ instructor.rating }} 分</span>
            </div>
          </div>

          <div class="experience">
            <el-icon><Trophy /></el-icon>
            <span>{{ instructor.teaching_experience }} 年教学经验</span>
          </div>
        </div>

        <div class="card-footer">
          <el-button type="primary"  @click.stop="viewDetail(instructor.id)">
            查看详情
          </el-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!loading && instructors.length === 0" description="暂无讲师数据" />

    <!-- 分页 -->
    <div class="pagination" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 48, 96]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { ElMessage } from 'element-plus'
import { Search, Document, UserFilled, Star, Trophy } from '@element-plus/icons-vue'

interface Instructor {
  id: number
  name: string
  avatar_url: string | null
  title: string
  department: string
  specialties: string[]
  introduction: string
  teaching_experience: number
  total_courses: number
  total_students: number
  rating: number
  email: string
  phone: string
  is_active: boolean
}

const router = useRouter()
const loading = ref(false)
const instructors = ref<Instructor[]>([])
const searchKeyword = ref('')
const selectedDepartment = ref('')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 获取讲师列表
const fetchInstructors = async () => {
  loading.value = true
  try {
    let query = supabase
      .from('instructors')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('rating', { ascending: false })

    // 搜索条件
    if (searchKeyword.value) {
      query = query.or(`name.ilike.%${searchKeyword.value}%,introduction.ilike.%${searchKeyword.value}%`)
    }

    // 部门筛选
    if (selectedDepartment.value) {
      query = query.eq('department', selectedDepartment.value)
    }

    // 分页
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value - 1
    query = query.range(start, end)

    const { data, error, count } = await query

    if (error) throw error

    instructors.value = data || []
    total.value = count || 0
  } catch (error: any) {
    ElMessage.error('获取讲师列表失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchInstructors()
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchInstructors()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchInstructors()
}

// 查看详情
const viewDetail = (id: number) => {
  router.push({ name: 'instructor-detail', params: { id } })
}

// 获取默认头像
const getDefaultAvatar = (name: string) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
  const index = name.charCodeAt(0) % colors.length
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${colors[index].substring(1)}&color=fff&size=200`
}

// 文本截断
const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

onMounted(() => {
  fetchInstructors()
})
</script>

<style scoped>
.instructor-display {
  padding: 24px 0;
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h2 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
}

.page-header p {
  font-size: 14px;
  color: #909399;
}

.filter-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.instructor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.instructor-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.instructor-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-header {
  position: relative;
  height: 200px;
      background: linear-gradient(135deg, #d0e7ffcb 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.3);
  color: white;
}

.status-badge.active {
  background: rgba(103, 194, 58, 0.9);
}

.card-body {
  padding: 20px;
}

.instructor-name {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  text-align: center;
}

.instructor-title {
  font-size: 14px;
  color: #909399;
  text-align: center;
  margin-bottom: 16px;
}

.specialties {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.introduction {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 16px;
  min-height: 60px;
}

.stats {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  border-top: 1px solid #EBEEF5;
  border-bottom: 1px solid #EBEEF5;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}

.stat-item .el-icon {
  font-size: 18px;
  color: #409EFF;
}

.experience {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #E6A23C;
  font-weight: 500;
}

.experience .el-icon {
  font-size: 16px;
}

.card-footer {
  padding: 16px 20px;
  background: #f5f7fa;
  text-align: center;
}

.card-footer .el-button {
  width: 100%;
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}
</style>
