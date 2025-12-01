-- ================================
-- 讲师体系 RLS 策略配置
-- ================================
-- 本文件包含讲师体系所有表的行级安全策略
-- 执行时间：2025-11-25
-- ================================

-- ================================
-- 1. INSTRUCTORS 表策略
-- ================================

-- 启用 RLS
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

-- 策略1：所有登录用户可以查看讲师
CREATE POLICY "Anyone can view instructors"
ON instructors FOR SELECT
TO authenticated
USING (true);

-- 策略2：管理员可以插入讲师
-- 管理员角色：0=管理员, 1=运营管理员, 11=项目经理, 15=带教
CREATE POLICY "Admins can insert instructors"
ON instructors FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role_id')::int IN (0, 1, 11, 15)
  )
);

-- 策略3：管理员可以更新讲师
CREATE POLICY "Admins can update instructors"
ON instructors FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role_id')::int IN (0, 1, 11, 15)
  )
);

-- 策略4：管理员可以删除讲师
CREATE POLICY "Admins can delete instructors"
ON instructors FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role_id')::int IN (0, 1, 11, 15)
  )
);

-- ================================
-- 2. INSTRUCTOR_COURSES 表策略
-- ================================

-- 启用 RLS
ALTER TABLE instructor_courses ENABLE ROW LEVEL SECURITY;

-- 策略1：所有登录用户可以查看课程
CREATE POLICY "Anyone can view instructor courses"
ON instructor_courses FOR SELECT
TO authenticated
USING (true);

-- 策略2：管理员可以管理课程（插入、更新、删除）
CREATE POLICY "Admins can manage instructor courses"
ON instructor_courses FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role_id')::int IN (0, 1, 11, 15)
  )
);

-- ================================
-- 3. INSTRUCTOR_REVIEWS 表策略
-- ================================

-- 启用 RLS
ALTER TABLE instructor_reviews ENABLE ROW LEVEL SECURITY;

-- 策略1：所有登录用户可以查看评价
CREATE POLICY "Anyone can view instructor reviews"
ON instructor_reviews FOR SELECT
TO authenticated
USING (true);

-- 策略2：用户只能添加自己的评价
CREATE POLICY "Users can insert own reviews"
ON instructor_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 策略3：用户只能更新自己的评价
CREATE POLICY "Users can update own reviews"
ON instructor_reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 策略4：用户只能删除自己的评价
CREATE POLICY "Users can delete own reviews"
ON instructor_reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ================================
-- 4. MENU_INSTRUCTOR 表策略
-- ================================

-- 启用 RLS
ALTER TABLE menu_instructor ENABLE ROW LEVEL SECURITY;

-- 策略1：所有登录用户可以查看菜单
CREATE POLICY "Anyone can view instructor menu"
ON menu_instructor FOR SELECT
TO authenticated
USING (true);

-- 策略2：仅超级管理员可以管理菜单
-- 超级管理员角色：0=管理员, 1=运营管理员
CREATE POLICY "Admins can manage instructor menu"
ON menu_instructor FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role_id')::int IN (0, 1)
  )
);

-- ================================
-- 策略验证查询
-- ================================

-- 查看所有讲师相关表的策略
SELECT 
  p.tablename AS "表名",
  p.policyname AS "策略名称",
  p.cmd AS "操作类型",
  t.rowsecurity AS "RLS已启用"
FROM pg_policies p
JOIN pg_tables t ON p.tablename = t.tablename
WHERE p.tablename IN ('instructors', 'instructor_courses', 'instructor_reviews', 'menu_instructor')
ORDER BY p.tablename, p.cmd;

-- ================================
-- 角色说明
-- ================================

/*
系统角色ID说明：
- 0: 管理员 (Admin)
- 1: 运营管理员 (Operations Manager)
- 11: 项目经理 (Project Manager)
- 12: Google优化师 (Google Optimizer)
- 14: Meta优化师 (Meta Optimizer)
- 15: 带教 (Teacher/Mentor)
- 17: Criteo优化师 (Criteo Optimizer)

讲师管理权限：
- 查看讲师：所有登录用户
- 管理讲师（增删改）：0, 1, 11, 15
- 管理课程：0, 1, 11, 15
- 管理菜单：0, 1
- 添加评价：所有登录用户（仅自己的评价）
*/

-- ================================
-- 测试查询（可选）
-- ================================

-- 测试1：查询讲师列表
-- SELECT * FROM instructors WHERE is_active = true LIMIT 5;

-- 测试2：查询讲师课程
-- SELECT * FROM instructor_courses WHERE instructor_id = 1;

-- 测试3：查询菜单
-- SELECT * FROM menu_instructor WHERE is_visible = true;

-- ================================
-- 删除策略（如需重建）
-- ================================

/*
-- 删除所有讲师表策略
DROP POLICY IF EXISTS "Anyone can view instructors" ON instructors;
DROP POLICY IF EXISTS "Admins can insert instructors" ON instructors;
DROP POLICY IF EXISTS "Admins can update instructors" ON instructors;
DROP POLICY IF EXISTS "Admins can delete instructors" ON instructors;

-- 删除所有课程表策略
DROP POLICY IF EXISTS "Anyone can view instructor courses" ON instructor_courses;
DROP POLICY IF EXISTS "Admins can manage instructor courses" ON instructor_courses;

-- 删除所有评价表策略
DROP POLICY IF EXISTS "Anyone can view instructor reviews" ON instructor_reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON instructor_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON instructor_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON instructor_reviews;

-- 删除所有菜单表策略
DROP POLICY IF EXISTS "Anyone can view instructor menu" ON menu_instructor;
DROP POLICY IF EXISTS "Admins can manage instructor menu" ON menu_instructor;
*/
