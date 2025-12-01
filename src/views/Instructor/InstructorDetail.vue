<template>
  <div class="instructor-detail" v-loading="loading">
    <el-page-header @back="goBack" title="返回列表">
      <template #content>
        <span class="page-title">讲师详情</span>
      </template>
    </el-page-header>

    <div class="detail-container" v-if="instructor">
      <!-- 讲师基本信息 -->
      <el-card class="info-card" shadow="hover">
        <div class="instructor-header">
          <img
            :src="instructor.avatar_url || getDefaultAvatar(instructor.name)"
            :alt="instructor.name"
            class="large-avatar"
          />
          <div class="header-info">
            <div class="name-section">
              <h1>{{ instructor.name }}</h1>
              <el-tag :type="instructor.is_active ? 'success' : 'info'" size="large">
                {{ instructor.is_active ? '在职' : '离职' }}
              </el-tag>
            </div>
            <p class="title-dept">{{ instructor.title }} · {{ instructor.department }}</p>
            
            <div class="specialties-section">
              <el-tag
                v-for="(specialty, index) in instructor.specialties"
                :key="index"
                type="primary"
                effect="plain"
                size="large"
              >
                {{ specialty }}
              </el-tag>
            </div>

            <div class="stats-row">
              <div class="stat-box">
                <div class="stat-value">{{ instructor.total_courses }}</div>
                <div class="stat-label">授课数</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">{{ instructor.total_students }}</div>
                <div class="stat-label">学员数</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">{{ instructor.rating }}</div>
                <div class="stat-label">评分</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">{{ instructor.teaching_experience }}年</div>
                <div class="stat-label">教学经验</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 个人简介 -->
      <el-card class="intro-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>个人简介</span>
          </div>
        </template>
        <p class="introduction-text">{{ instructor.introduction }}</p>
      </el-card>

      <!-- 联系方式 -->
      <el-card class="contact-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Message /></el-icon>
            <span>联系方式</span>
          </div>
        </template>
        <div class="contact-info">
          <div class="contact-item">
            <el-icon><Message /></el-icon>
            <span class="label">邮箱：</span>
            <span class="value">{{ instructor.email }}</span>
          </div>
          <div class="contact-item">
            <el-icon><Phone /></el-icon>
            <span class="label">电话：</span>
            <span class="value">{{ instructor.phone }}</span>
          </div>
        </div>
      </el-card>

      <!-- 授课课程 -->
      <el-card class="courses-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Reading /></el-icon>
            <span>授课课程</span>
          </div>
        </template>
        
        <div class="courses-list" v-if="courses.length > 0">
          <div
            v-for="course in courses"
            :key="course.id"
            class="course-item"
          >
            <div class="course-header">
              <h3>{{ course.course_name }}</h3>
              <el-tag :type="course.is_active ? 'success' : 'info'">
                {{ course.is_active ? '进行中' : '已结束' }}
              </el-tag>
            </div>
            <p class="course-desc">{{ course.course_description }}</p>
            <div class="course-meta">
              <span><el-icon><FolderOpened /></el-icon> {{ course.course_category }}</span>
              <span><el-icon><Clock /></el-icon> {{ course.duration_hours }}小时</span>
              <span><el-icon><User /></el-icon> {{ course.student_count }}人</span>
              <span v-if="course.start_date">
                <el-icon><Calendar /></el-icon> 
                {{ formatDate(course.start_date) }}
              </span>
            </div>
          </div>
        </div>
        
        <el-empty v-else description="暂无课程数据" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { ElMessage } from 'element-plus'
import {
  Document,
  Message,
  Phone,
  Reading,
  FolderOpened,
  Clock,
  User,
  Calendar
} from '@element-plus/icons-vue'

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

interface Course {
  id: number
  course_name: string
  course_description: string
  course_category: string
  duration_hours: number
  student_count: number
  start_date: string
  end_date: string
  is_active: boolean
}

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const instructor = ref<Instructor | null>(null)
const courses = ref<Course[]>([])

const instructorId = ref(Number(route.params.id))

// 获取讲师详情
const fetchInstructorDetail = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .eq('id', instructorId.value)
      .single()

    if (error) throw error
    instructor.value = data
  } catch (error: any) {
    ElMessage.error('获取讲师详情失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 获取讲师课程
const fetchInstructorCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('instructor_courses')
      .select('*')
      .eq('instructor_id', instructorId.value)
      .order('start_date', { ascending: false })

    if (error) throw error
    courses.value = data || []
  } catch (error: any) {
    ElMessage.error('获取课程列表失败：' + error.message)
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 获取默认头像
const getDefaultAvatar = (name: string) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
  const index = name.charCodeAt(0) % colors.length
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${colors[index].substring(1)}&color=fff&size=400`
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchInstructorDetail()
  fetchInstructorCourses()
})
</script>

<style scoped>
.instructor-detail {
  padding: 24px 0;
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.detail-container {
  margin-top: 24px;
}

.info-card {
  margin-bottom: 24px;
}

.instructor-header {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.large-avatar {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header-info {
  flex: 1;
}

.name-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.name-section h1 {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.title-dept {
  font-size: 16px;
  color: #909399;
  margin-bottom: 20px;
}

.specialties-section {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  padding: 12px 24px;
      background: linear-gradient(135deg, #4ca1f7 0%, #3499ff 100%);
  border-radius: 12px;
}

.stat-box {
  text-align: center;
  color: white;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.intro-card,
.contact-card,
.courses-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-header .el-icon {
  font-size: 18px;
  color: #409EFF;
}

.introduction-text {
  font-size: 15px;
  line-height: 1.8;
  color: #606266;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
}

.contact-item .el-icon {
  font-size: 18px;
  color: #409EFF;
}

.contact-item .label {
  color: #909399;
  min-width: 60px;
}

.contact-item .value {
  color: #303133;
  font-weight: 500;
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.course-item {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.course-item:hover {
  background: #e8eaf0;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.course-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.course-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.course-meta {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: #909399;
}

.course-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.course-meta .el-icon {
  font-size: 14px;
}
</style>
