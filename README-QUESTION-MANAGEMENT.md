# 问题管理功能说明

## 功能介绍

问题管理功能允许管理员添加、编辑、删除系统中的问题，包括选择题和问答题。每个问题都可以关联到特定的平台和章节。

## 已完成的工作

1. 创建了问题管理页面 (`src/views/system/DataManagement/QuestionManagement.vue`)
2. 添加了路由配置 (`src/router/index.ts` 中添加了 `question-management` 路由)

## 如何在菜单中添加问题管理

由于菜单是从数据库中动态加载的，您需要通过菜单管理页面添加问题管理菜单项：

1. 登录系统，以管理员身份访问"系统设置 > 菜单设置"
2. 点击"添加菜单"按钮
3. 填写以下信息：
   - 名称：问题管理
   - 图标：可选择合适的图标，如 `QuestionFilled`
   - 路径：`/system/question-management`
   - 父级菜单：选择"数据管理"或其他适当的父级菜单
   - 排序：根据需要设置
   - 角色权限：选择需要授予权限的角色
4. 点击"保存"按钮

## 问题管理功能使用说明

### 查看问题列表

问题管理页面默认显示所有问题的列表，您可以通过搜索框和筛选器来查找特定问题。

### 添加问题

1. 点击"添加问题"按钮
2. 选择题型（选择题或问答题）
3. 选择平台和填写章节信息
4. 填写问题内容
5. 如果是选择题，添加选项并指定正确答案
6. 点击"确定"按钮保存

### 编辑问题

1. 在问题列表中找到要编辑的问题
2. 点击"编辑"按钮
3. 修改问题信息
4. 点击"确定"按钮保存

### 删除问题

1. 在问题列表中找到要删除的问题
2. 点击"删除"按钮
3. 确认删除操作

也可以通过选择多个问题，然后点击"批量删除"按钮来一次删除多个问题。

## 数据结构

问题管理功能使用 `googlequestions` 表存储问题数据，表结构如下：

```sql
create table public.googlequestions (
  id serial not null,
  text text not null,
  options text[] null,
  correct_answer text null,
  question_type text not null,
  platform text not null,
  chapter text not null,
  constraint googlequestions_pkey primary key (id),
  constraint googlequestions_id_key unique (id),
  constraint googlequestions_question_type_check check (
    (
      question_type = any (
        array[
          'select'::text,
          'judge'::text,
          'fill'::text,
          'question'::text,
          'reading'::text
        ]
      )
    )
  )
)
```