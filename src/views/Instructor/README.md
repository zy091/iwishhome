# 讲师体系系统

## 系统概述

讲师体系系统是一个完整的讲师信息管理和展示平台，支持讲师信息的添加、编辑、删除以及课程管理功能。

## 功能模块

### 1. 讲师展示 (InstructorDisplay.vue)
- **展示讲师信息**：包括照片、姓名、职位、加入年份、个人简介、联系方式
- **展示讲授课程**：显示每位讲师所教授的所有课程
- **搜索功能**：支持按讲师姓名搜索
- **筛选功能**：支持按加入年份筛选
- **响应式设计**：适配不同屏幕尺寸

### 2. 讲师管理 (InstructorManage.vue)
- **添加讲师**：支持添加新讲师，包括上传头像
- **编辑讲师**：修改讲师基本信息
- **删除讲师**：删除讲师及其课程关联
- **课程管理**：为讲师分配或移除课程
- **权限控制**：仅管理员、运营管理员、项目经理、带教有权限访问

## 文件结构

```
src/views/Instructor/
├── index.vue                  # 主入口文件，包含Tab切换
├── InstructorDisplay.vue      # 讲师展示页面
├── InstructorManage.vue       # 讲师管理页面
├── database-schema.sql        # 数据库表结构
└── README.md                  # 说明文档
```

## 数据库表结构

### instructors (讲师表)
- `id`: 主键
- `name`: 讲师姓名
- `avatar_url`: 头像URL
- `position`: 职位
- `join_year`: 加入年份
- `bio`: 个人简介
- `email`: 邮箱
- `phone`: 电话
- `created_at`: 创建时间
- `updated_at`: 更新时间

### courses (课程表)
- `id`: 主键
- `course_name`: 课程名称
- `course_category`: 课程分类
- `course_description`: 课程描述
- `created_at`: 创建时间
- `updated_at`: 更新时间

### instructor_courses (讲师课程关联表)
- `id`: 主键
- `instructor_id`: 讲师ID（外键）
- `course_id`: 课程ID（外键）
- `created_at`: 创建时间

## 路由配置

```javascript
{
  path: 'instructor-system',
  name: 'instructor-system',
  component: () => import('../views/Instructor/index.vue'),
  meta: {
    requiresAuth: true
  }
}
```

访问路径：`/system/instructor-system`

## 权限说明

- **所有登录用户**：可以查看讲师展示页面
- **管理员(0)、运营管理员(1)、项目经理(11)、带教(15)**：可以访问讲师管理功能

## 使用说明

### 1. 初始化数据库
在 Supabase 中执行 `database-schema.sql` 文件创建必要的表结构。

### 2. 配置存储桶
确保 Supabase Storage 中有名为 `documents` 的存储桶，用于存储讲师头像。

### 3. 访问系统
从首页点击"讲师体系"卡片进入系统，或直接访问 `/system/instructor-system`。

### 4. 添加讲师
1. 点击"讲师管理"标签（需要管理权限）
2. 点击"添加讲师"按钮
3. 填写讲师信息
4. 上传头像（可选）
5. 点击"确定"保存

### 5. 管理课程
1. 在讲师列表中点击"课程"按钮
2. 在弹出的对话框中选择课程
3. 点击"保存"完成关联

## 技术栈

- **Vue 3**: 前端框架
- **TypeScript**: 类型安全
- **Element Plus**: UI组件库
- **Supabase**: 后端服务（数据库、存储、认证）
- **Pinia**: 状态管理

## 注意事项

1. 头像上传大小限制为 2MB
2. 删除讲师会同时删除其所有课程关联
3. 邮箱格式会自动验证
4. 需要先在 courses 表中添加课程，才能为讲师分配课程

## 后续优化建议

1. 添加讲师评价功能
2. 支持课程评分统计
3. 添加讲师排班功能
4. 支持批量导入讲师信息
5. 添加讲师教学时长统计
