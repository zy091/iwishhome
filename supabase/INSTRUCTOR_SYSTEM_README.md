# 讲师体系系统说明文档

## 系统概述

讲师体系系统是一个独立的模块，用于管理和展示公司的讲师资源。系统分为两个主要页面：
- **讲师展示页**：所有用户可见，卡片式展示所有在职讲师
- **讲师管理页**：仅管理员可见，用于CRUD操作和课程分配

## 路由结构

讲师体系已从 `/system` 路由中独立出来，成为一级路由：

```
/instructor                    # 讲师体系主路由
  ├── /display                 # 讲师展示页（默认）
  ├── /manage                  # 讲师管理页（需要管理员权限）
  └── /detail/:id              # 讲师详情页
```

### 访问入口

- **HomeView**: `/instructor/display` （讲师体系卡片）
- **TrainingHome**: 可根据需要添加链接

## 文件结构

```
src/views/Instructor/
├── InstructorMain.vue           # 主布局组件（Header + Aside + RouterView）
├── InstructorAside.vue          # 侧边栏菜单组件
├── InstructorDisplay.vue        # 讲师展示页（卡片式）
├── InstructorDetail.vue         # 讲师详情页
├── InstructorManage.vue         # 讲师管理页
└── index.vue                    # 旧文件（已弃用，可删除）
```

## 数据库结构

### 1. menu_instructor（讲师菜单表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| title | VARCHAR(100) | 菜单标题 |
| path | VARCHAR(200) | 菜单路径 |
| icon | VARCHAR(50) | 图标名称 |
| parent_id | INTEGER | 父菜单ID |
| sort_order | INTEGER | 排序 |
| is_visible | BOOLEAN | 是否可见 |
| required_role_ids | INTEGER[] | 所需角色ID数组 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**菜单数据：**
- 讲师展示：所有用户可见
- 讲师管理：仅 [0, 1, 11, 15] 角色可见（管理员、运营管理员、项目经理、带教）

### 2. instructors（讲师信息表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| name | VARCHAR(100) | 讲师姓名 |
| avatar_url | TEXT | 头像URL |
| title | VARCHAR(100) | 职称（如：高级讲师） |
| department | VARCHAR(100) | 部门 |
| specialties | TEXT[] | 专业领域数组 |
| introduction | TEXT | 个人简介 |
| teaching_experience | INTEGER | 教学经验（年） |
| total_courses | INTEGER | 总课程数 |
| total_students | INTEGER | 总学员数 |
| rating | DECIMAL(3,2) | 评分（1-5） |
| email | VARCHAR(100) | 邮箱 |
| phone | VARCHAR(20) | 电话 |
| is_active | BOOLEAN | 是否在职 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**旧字段（保留兼容）：**
- position: VARCHAR(100)
- join_year: INTEGER
- bio: TEXT

### 3. instructor_courses（讲师课程关联表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| instructor_id | INTEGER | 讲师ID（外键） |
| course_name | VARCHAR(200) | 课程名称 |
| course_description | TEXT | 课程描述 |
| course_category | VARCHAR(50) | 课程类别 |
| duration_hours | INTEGER | 课程时长（小时） |
| student_count | INTEGER | 学员人数 |
| start_date | DATE | 开课日期 |
| end_date | DATE | 结课日期 |
| is_active | BOOLEAN | 是否进行中 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**旧字段（保留兼容）：**
- course_id: INTEGER

### 4. instructor_reviews（讲师评价表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| instructor_id | INTEGER | 讲师ID（外键） |
| user_id | UUID | 用户ID（外键） |
| rating | INTEGER | 评分（1-5） |
| comment | TEXT | 评价内容 |
| course_name | VARCHAR(200) | 相关课程 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

## 功能特性

### 讲师展示页（InstructorDisplay.vue）

**功能：**
- 卡片式展示所有在职讲师
- 搜索功能：支持姓名、专业领域搜索
- 筛选功能：按部门筛选
- 分页显示：默认每页12条
- 点击卡片跳转到详情页

**卡片信息：**
- 讲师头像（渐变背景）
- 姓名、职称、部门
- 专业领域标签
- 个人简介（截断显示）
- 统计信息：课程数、学员数、评分、教学经验
- 在职状态标识

### 讲师详情页（InstructorDetail.vue）

**功能：**
- 完整的讲师信息展示
- 统计数据卡片
- 个人简介
- 联系方式
- 授课课程列表（包含课程详情）

### 讲师管理页（InstructorManage.vue）

**权限：** 仅 [0, 1, 11, 15] 角色可访问

**功能：**
1. **讲师列表**
   - 表格展示所有讲师
   - 显示头像、姓名、职称、部门、专业领域、状态等
   - 支持编辑、课程管理、删除操作

2. **添加/编辑讲师**
   - 完整的表单验证
   - 支持头像上传（Supabase Storage）
   - 专业领域多选（支持自定义）
   - 状态切换（在职/离职）

3. **课程管理**
   - 查看讲师当前课程
   - 添加新课程
   - 移除课程
   - 自动更新讲师课程统计

## 权限控制

### 页面级权限

- **讲师展示页**：所有登录用户
- **讲师管理页**：需要 `requiresAdmin` 元信息
- **讲师详情页**：所有登录用户

### 角色权限

管理员角色ID（可访问管理页）：
- 0: 管理员
- 1: 运营管理员
- 11: 项目经理
- 15: 带教

## 示例数据

系统已预置5位讲师和7门课程的示例数据：

### 讲师
1. 张明 - Google广告部高级讲师
2. 李娜 - Meta广告部资深讲师
3. 王强 - 数字营销部首席讲师
4. 赵丽 - Google广告部高级讲师
5. 刘洋 - Meta广告部讲师

### 课程类别
- Google广告
- Meta广告
- 数字营销

## 技术栈

- **前端框架**：Vue 3 + TypeScript
- **UI组件库**：Element Plus
- **路由**：Vue Router
- **状态管理**：Pinia
- **数据库**：Supabase (PostgreSQL)
- **文件存储**：Supabase Storage

## 开发指南

### 添加新功能

1. **添加新字段到讲师表**
```sql
ALTER TABLE instructors ADD COLUMN new_field VARCHAR(100);
```

2. **更新TypeScript接口**
```typescript
interface Instructor {
  // ... existing fields
  new_field: string
}
```

3. **更新表单和展示组件**

### 自定义样式

所有组件都使用 scoped 样式，可以安全修改而不影响其他页面。

主要颜色变量：
- 主色：`#409EFF`
- 成功色：`#67C23A`
- 警告色：`#E6A23C`
- 危险色：`#F56C6C`

### 头像默认处理

使用 UI Avatars API 生成默认头像：
```
https://ui-avatars.com/api/?name={name}&background={color}&color=fff&size=200
```

## RLS 安全策略

所有讲师相关表都已启用行级安全（Row Level Security）策略：

### instructors 表策略
- ✅ **查看**：所有登录用户
- ✅ **插入**：管理员 [0, 1, 11, 15]
- ✅ **更新**：管理员 [0, 1, 11, 15]
- ✅ **删除**：管理员 [0, 1, 11, 15]

### instructor_courses 表策略
- ✅ **查看**：所有登录用户
- ✅ **管理（增删改）**：管理员 [0, 1, 11, 15]

### instructor_reviews 表策略
- ✅ **查看**：所有登录用户
- ✅ **插入**：仅可添加自己的评价
- ✅ **更新**：仅可更新自己的评价
- ✅ **删除**：仅可删除自己的评价

### menu_instructor 表策略
- ✅ **查看**：所有登录用户
- ✅ **管理**：超级管理员 [0, 1]

详细策略配置见：`supabase/instructor_rls_policies.sql`

## 注意事项

1. **数据库字段兼容**：保留了旧字段（position, join_year, bio, course_id）以保持向后兼容
2. **文件上传**：头像上传到 `documents/instructor-avatars/` bucket
3. **软删除**：使用 `is_active` 字段标记讲师状态，不直接删除数据
4. **外键级联**：删除讲师会自动删除相关的课程和评价记录
5. **RLS安全**：所有表都已启用RLS策略，确保数据访问安全

## 未来扩展

可以考虑的功能扩展：
- [ ] 讲师评价系统（使用 instructor_reviews 表）
- [ ] 课程报名功能
- [ ] 讲师排行榜
- [ ] 高级筛选（按评分、经验等）
- [ ] 讲师工作量统计
- [ ] 课程时间表管理
- [ ] 学员反馈收集

## 迁移记录

### 数据库迁移
- `add_instructor_columns`: 添加新字段到 instructors 表
- `create_instructor_tables`: 创建菜单和课程表
- SQL执行：插入示例数据

### RLS 策略配置
- 所有表已启用 RLS
- 创建了 12 条安全策略
- 配置文件：`instructor_rls_policies.sql`

### 已执行的SQL操作
```sql
-- 1. 更新表结构
ALTER TABLE instructors ADD COLUMN title, department, specialties, ...
ALTER TABLE instructor_courses ADD COLUMN course_name, description, ...

-- 2. 创建新表
CREATE TABLE menu_instructor (...)
CREATE TABLE instructor_reviews (...)

-- 3. 插入示例数据
INSERT INTO instructors (5条记录)
INSERT INTO instructor_courses (7条记录)
INSERT INTO menu_instructor (2条记录)

-- 4. 启用 RLS 并创建策略
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view instructors" ON instructors ...
-- ... 共12条策略
```

## 联系方式

如有问题，请联系开发团队。
