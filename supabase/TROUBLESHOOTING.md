# 讲师体系故障排查指南

## 问题：无法获取讲师数据

### ❌ 症状
- 前端调用 `supabase.from('instructors').select()` 返回空数组或错误
- 控制台显示权限错误或403错误
- 数据在数据库中存在，但前端获取不到

### ✅ 原因
Supabase 默认启用 **行级安全（Row Level Security, RLS）**。所有表在启用 RLS 后，如果没有配置相应的安全策略，客户端将无法访问数据。

### 🔧 解决方案

#### 方案1：启用 RLS 并添加策略（推荐）

已为所有讲师相关表配置了完整的 RLS 策略：

```sql
-- 查看策略配置文件
-- 文件位置：supabase/instructor_rls_policies.sql

-- 验证策略是否生效
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('instructors', 'instructor_courses', 'instructor_reviews', 'menu_instructor')
ORDER BY tablename, cmd;
```

#### 方案2：临时禁用 RLS（仅用于开发测试）

```sql
-- ⚠️ 不推荐在生产环境使用
ALTER TABLE instructors DISABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_instructor DISABLE ROW LEVEL SECURITY;
```

## 已配置的策略概览

### 📊 instructors 表
| 操作 | 权限 |
|------|------|
| SELECT (查看) | ✅ 所有登录用户 |
| INSERT (插入) | ✅ 管理员 [0,1,11,15] |
| UPDATE (更新) | ✅ 管理员 [0,1,11,15] |
| DELETE (删除) | ✅ 管理员 [0,1,11,15] |

### 📚 instructor_courses 表
| 操作 | 权限 |
|------|------|
| SELECT (查看) | ✅ 所有登录用户 |
| ALL (增删改) | ✅ 管理员 [0,1,11,15] |

### ⭐ instructor_reviews 表
| 操作 | 权限 |
|------|------|
| SELECT (查看) | ✅ 所有登录用户 |
| INSERT (插入) | ✅ 仅可添加自己的评价 |
| UPDATE (更新) | ✅ 仅可更新自己的评价 |
| DELETE (删除) | ✅ 仅可删除自己的评价 |

### 📋 menu_instructor 表
| 操作 | 权限 |
|------|------|
| SELECT (查看) | ✅ 所有登录用户 |
| ALL (增删改) | ✅ 超级管理员 [0,1] |

## 测试数据访问

### 前端测试代码

```typescript
// 1. 测试获取讲师列表
const { data: instructors, error } = await supabase
  .from('instructors')
  .select('*')
  .eq('is_active', true)

if (error) {
  console.error('获取讲师失败:', error)
} else {
  console.log('讲师数据:', instructors)
}

// 2. 测试获取讲师课程
const { data: courses, error: coursesError } = await supabase
  .from('instructor_courses')
  .select('*')
  .eq('instructor_id', 1)

// 3. 测试获取菜单
const { data: menu, error: menuError } = await supabase
  .from('menu_instructor')
  .select('*')
  .eq('is_visible', true)
```

### SQL测试查询

```sql
-- 测试1：查看讲师列表
SELECT id, name, title, department, is_active 
FROM instructors 
WHERE is_active = true;

-- 测试2：查看课程列表
SELECT ic.course_name, i.name as instructor_name
FROM instructor_courses ic
JOIN instructors i ON ic.instructor_id = i.id;

-- 测试3：查看菜单
SELECT * FROM menu_instructor WHERE is_visible = true;

-- 测试4：检查 RLS 状态
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('instructors', 'instructor_courses', 'instructor_reviews', 'menu_instructor');
```

## 常见错误及解决

### 错误1: "permission denied for table instructors"

**原因**: RLS 已启用但没有策略，或策略配置错误

**解决**:
```sql
-- 检查策略是否存在
SELECT * FROM pg_policies WHERE tablename = 'instructors';

-- 如果没有策略，执行策略配置文件
-- 文件: supabase/instructor_rls_policies.sql
```

### 错误2: "null value in column violates not-null constraint"

**原因**: 尝试插入数据时，旧字段（position, join_year, bio）有NOT NULL约束

**解决**:
```sql
-- 已修复：旧字段约束已移除
ALTER TABLE instructors 
  ALTER COLUMN position DROP NOT NULL,
  ALTER COLUMN join_year DROP NOT NULL,
  ALTER COLUMN bio DROP NOT NULL;
```

### 错误3: 用户角色ID检查失败

**原因**: 用户的 `role_id` 未正确存储在 `auth.users.raw_user_meta_data`

**解决**:
```sql
-- 检查用户元数据
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE id = auth.uid();

-- 确保用户注册时设置了 role_id
-- 在注册时：
INSERT INTO auth.users (email, raw_user_meta_data)
VALUES ('user@example.com', '{"role_id": 12}');
```

## 权限检查清单

在遇到数据访问问题时，按以下顺序检查：

- [ ] 1. 用户是否已登录？
- [ ] 2. 表的 RLS 是否启用？
- [ ] 3. 表是否有相应的策略？
- [ ] 4. 策略的角色ID是否正确？
- [ ] 5. 用户的 role_id 是否正确设置？
- [ ] 6. 网络请求是否成功？
- [ ] 7. Supabase 项目配置是否正确？

## 快速修复脚本

```sql
-- 一键重建所有策略（如果策略丢失）
-- 执行文件: supabase/instructor_rls_policies.sql

-- 或手动执行：
\i supabase/instructor_rls_policies.sql
```

## 生产环境检查清单

部署到生产环境前，确保：

- [x] 所有表都启用了 RLS
- [x] 所有策略都已正确配置
- [x] 测试了各个角色的访问权限
- [x] 敏感操作（INSERT/UPDATE/DELETE）有正确的权限控制
- [ ] 配置了适当的数据库备份
- [ ] 记录了所有数据库迁移

## 联系支持

如果以上方法都无法解决问题，请：

1. 收集错误日志
2. 检查 Supabase Dashboard 的日志
3. 联系开发团队

---

**文档更新**: 2025-11-25  
**相关文件**: 
- `supabase/instructor_rls_policies.sql` - RLS策略配置
- `supabase/INSTRUCTOR_SYSTEM_README.md` - 系统文档
- `supabase/instructor_menu.sql` - 数据库结构
