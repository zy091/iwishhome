<template>
  <div class="instructor-manage">
    <div class="manage-header">
      <h2>讲师管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加讲师
      </el-button>
    </div>

    <!-- 讲师表格 -->
    <el-table
      :data="instructors"
      v-loading="loading"
      stripe
      style="width: 100%"
      class="instructor-table"
    >
      <el-table-column type="index" label="序号" width="60" />
      
      <el-table-column label="头像" width="80">
        <template #default="{ row }">
          <el-avatar :src="row.avatar_url || getDefaultAvatar(row.name)" :size="50">
            {{ row.name.charAt(0) }}
          </el-avatar>
        </template>
      </el-table-column>

      <el-table-column prop="name" label="姓名" width="120" />
      
      <el-table-column prop="title" label="职称" width="150" />
      
      <el-table-column prop="department" label="部门" width="120" />
      
      <el-table-column label="专业领域" min-width="200">
        <template #default="{ row }">
          <el-tag
            v-for="(specialty, index) in row.specialties?.slice(0, 2)"
            :key="index"
            size="small"
            type="info"
            effect="plain"
            style="margin-right: 5px;"
          >
            {{ specialty }}
          </el-tag>
          <span v-if="row.specialties?.length > 2" style="color: #909399; font-size: 12px;">
            +{{ row.specialties.length - 2 }}
          </span>
        </template>
      </el-table-column>
      
      <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
      
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'info'">
            {{ row.is_active ? '在职' : '离职' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="课程/学员" width="120">
        <template #default="{ row }">
          <div style="font-size: 12px;">
            <div>课程: {{ row.total_courses || 0 }}</div>
            <div>学员: {{ row.total_students || 0 }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button link type="warning" @click="handleManageCourses(row)">
            <el-icon><Reading /></el-icon>
            课程
          </el-button>
          <el-button link type="danger" @click="handleDelete(row)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑讲师对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入讲师姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职称" prop="title">
              <el-input v-model="form.title" placeholder="如：高级讲师" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门" prop="department">
              <el-select v-model="form.department" placeholder="请选择部门" style="width: 100%">
                <el-option label="Google广告部" value="Google广告部" />
                <el-option label="Meta广告部" value="Meta广告部" />
                <el-option label="数字营销部" value="数字营销部" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="教学经验" prop="teaching_experience">
              <el-input-number
                v-model="form.teaching_experience"
                :min="0"
                :max="50"
                placeholder="年"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="专业领域" prop="specialties">
          <el-select
            v-model="form.specialties"
            multiple
            filterable
            allow-create
            placeholder="请选择或输入专业领域"
            style="width: 100%"
          >
            <el-option label="Google Ads" value="Google Ads" />
            <el-option label="PLA" value="PLA" />
            <el-option label="PMax" value="PMax" />
            <el-option label="Facebook Ads" value="Facebook Ads" />
            <el-option label="Instagram Ads" value="Instagram Ads" />
            <el-option label="数字营销策略" value="数字营销策略" />
            <el-option label="SEO" value="SEO" />
            <el-option label="SEM" value="SEM" />
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="个人简介" prop="introduction">
          <el-input
            v-model="form.introduction"
            type="textarea"
            :rows="4"
            placeholder="请输入个人简介，包括工作经历、专业特长等"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="is_active">
              <el-switch
                v-model="form.is_active"
                active-text="在职"
                inactive-text="离职"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="头像" prop="avatar_url">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            :http-request="handleAvatarUpload"
          >
            <img v-if="form.avatar_url" :src="form.avatar_url" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">建议上传 1:1 比例的图片，大小不超过 2MB</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 课程管理对话框 -->
    <el-dialog
      v-model="courseDialogVisible"
      title="管理讲师课程"
      width="700px"
    >
      <div class="course-manage-content">
        <div class="selected-instructor" v-if="selectedInstructor">
          <el-avatar :src="selectedInstructor.avatar_url" :size="60">
            {{ selectedInstructor.name.charAt(0) }}
          </el-avatar>
          <div>
            <h3>{{ selectedInstructor.name }}</h3>
            <p>{{ selectedInstructor.position }}</p>
          </div>
        </div>

        <el-divider />

        <div class="course-selection">
          <h4>添加课程</h4>
          <el-select
            v-model="selectedCourses"
            multiple
            filterable
            placeholder="请选择课程"
            style="width: 100%"
          >
            <el-option
              v-for="course in availableCourses"
              :key="course.id"
              :label="course.course_name"
              :value="course.id"
            />
          </el-select>
        </div>

        <div class="current-courses">
          <h4>当前课程</h4>
          <el-tag
            v-for="course in currentInstructorCourses"
            :key="course.id"
            closable
            @close="removeCourse(course.id)"
            type="success"
            class="course-tag-item"
          >
            {{ course.course_name }}
          </el-tag>
          <el-empty v-if="currentInstructorCourses.length === 0" description="暂无课程" :image-size="60" />
        </div>
      </div>

      <template #footer>
        <el-button @click="courseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCourses" :loading="submitting">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadProps } from 'element-plus'
import { Plus, Edit, Delete, Reading } from '@element-plus/icons-vue'

interface Instructor {
  id?: number
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
}

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const courseDialogVisible = ref(false)
const dialogTitle = ref('添加讲师')
const formRef = ref<FormInstance>()
const instructors = ref<Instructor[]>([])
const availableCourses = ref<Course[]>([])
const currentInstructorCourses = ref<Course[]>([])
const selectedInstructor = ref<Instructor | null>(null)
const selectedCourses = ref<number[]>([])

const form = reactive<Instructor>({
  name: '',
  avatar_url: null,
  title: '',
  department: '',
  specialties: [],
  introduction: '',
  teaching_experience: 0,
  total_courses: 0,
  total_students: 0,
  rating: 5.0,
  email: '',
  phone: '',
  is_active: true
})

const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入讲师姓名', trigger: 'blur' }],
  title: [{ required: true, message: '请输入职称', trigger: 'blur' }],
  department: [{ required: true, message: '请选择部门', trigger: 'change' }],
  specialties: [{ required: true, message: '请选择专业领域', trigger: 'change' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  introduction: [{ required: true, message: '请输入个人简介', trigger: 'blur' }]
})

// 获取讲师列表
const fetchInstructors = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    instructors.value = data || []
  } catch (error: any) {
    console.error('获取讲师列表失败:', error)
    ElMessage.error('获取讲师列表失败')
  } finally {
    loading.value = false
  }
}

// 获取所有可用课程
const fetchCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('instructor_courses')
      .select('*')
      .order('course_name', { ascending: true })

    if (error) throw error
    availableCourses.value = data || []
  } catch (error: any) {
    console.error('获取课程列表失败:', error)
  }
}

// 获取默认头像
const getDefaultAvatar = (name: string) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
  const index = name.charCodeAt(0) % colors.length
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${colors[index].substring(1)}&color=fff&size=200`
}

// 添加讲师
const handleAdd = () => {
  dialogTitle.value = '添加讲师'
  resetForm()
  dialogVisible.value = true
}

// 编辑讲师
const handleEdit = (row: Instructor) => {
  dialogTitle.value = '编辑讲师'
  Object.assign(form, row)
  dialogVisible.value = true
}

// 删除讲师
const handleDelete = async (row: Instructor) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除讲师"${row.name}"吗？此操作将同时删除该讲师的所有课程关联。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const { error } = await supabase
      .from('instructors')
      .delete()
      .eq('id', row.id)

    if (error) throw error

    ElMessage.success('删除成功')
    fetchInstructors()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 管理讲师课程
const handleManageCourses = async (row: Instructor) => {
  selectedInstructor.value = row
  courseDialogVisible.value = true

  // 获取讲师当前课程
  try {
    const { data, error } = await supabase
      .from('instructor_courses')
      .select('*')
      .eq('instructor_id', row.id)

    if (error) throw error
    currentInstructorCourses.value = data || []
    selectedCourses.value = currentInstructorCourses.value.map(c => c.id)
  } catch (error: any) {
    console.error('获取讲师课程失败:', error)
  }
}

// 移除课程
const removeCourse = async (courseId: number) => {
  try {
    const { error } = await supabase
      .from('instructor_courses')
      .delete()
      .eq('id', courseId)

    if (error) throw error

    currentInstructorCourses.value = currentInstructorCourses.value.filter(c => c.id !== courseId)
    selectedCourses.value = selectedCourses.value.filter(id => id !== courseId)
    ElMessage.success('移除成功')
    
    // 更新讲师课程数
    await updateInstructorCourseCount()
  } catch (error: any) {
    console.error('移除课程失败:', error)
    ElMessage.error('移除课程失败')
  }
}

// 更新讲师课程统计
const updateInstructorCourseCount = async () => {
  if (!selectedInstructor.value) return
  
  const { count } = await supabase
    .from('instructor_courses')
    .select('*', { count: 'exact', head: true })
    .eq('instructor_id', selectedInstructor.value.id)
  
  await supabase
    .from('instructors')
    .update({ total_courses: count || 0 })
    .eq('id', selectedInstructor.value.id)
  
  fetchInstructors()
}

// 保存课程
const saveCourses = async () => {
  if (!selectedInstructor.value) return

  submitting.value = true
  try {
    ElMessage.success('课程关联已更新')
    courseDialogVisible.value = false
    await updateInstructorCourseCount()
  } catch (error: any) {
    console.error('保存课程失败:', error)
    ElMessage.error('保存课程失败')
  } finally {
    submitting.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const data = {
        name: form.name,
        avatar_url: form.avatar_url,
        title: form.title,
        department: form.department,
        specialties: form.specialties,
        introduction: form.introduction,
        teaching_experience: form.teaching_experience,
        email: form.email,
        phone: form.phone,
        is_active: form.is_active,
        rating: form.rating || 5.0
      }

      if (form.id) {
        // 更新
        const { error } = await supabase
          .from('instructors')
          .update(data)
          .eq('id', form.id)

        if (error) throw error
        ElMessage.success('更新成功')
      } else {
        // 新增
        const { error } = await supabase
          .from('instructors')
          .insert(data)

        if (error) throw error
        ElMessage.success('添加成功')
      }

      dialogVisible.value = false
      fetchInstructors()
    } catch (error: any) {
      console.error('操作失败:', error)
      ElMessage.error('操作失败：' + error.message)
    } finally {
      submitting.value = false
    }
  })
}

// 头像上传前验证
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

// 头像上传
const handleAvatarUpload = async (options: any) => {
  const file = options.file
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `instructor-avatars/${fileName}`

  try {
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    form.avatar_url = data.publicUrl
    ElMessage.success('上传成功')
  } catch (error: any) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败')
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    id: undefined,
    name: '',
    avatar_url: null,
    title: '',
    department: '',
    specialties: [],
    introduction: '',
    teaching_experience: 0,
    total_courses: 0,
    total_students: 0,
    rating: 5.0,
    email: '',
    phone: '',
    is_active: true
  })
}

onMounted(() => {
  fetchInstructors()
  fetchCourses()
})
</script>

<style scoped>
.instructor-manage {
  padding: 20px 0;
}

.manage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.manage-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.instructor-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}

.upload-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

.course-manage-content {
  padding: 10px;
}

.selected-instructor {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.selected-instructor h3 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.selected-instructor p {
  margin: 0;
  color: #606266;
  font-size: 0.9rem;
}

.course-selection,
.current-courses {
  margin-top: 20px;
}

.course-selection h4,
.current-courses h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.course-tag-item {
  margin-right: 10px;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .manage-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}
</style>
