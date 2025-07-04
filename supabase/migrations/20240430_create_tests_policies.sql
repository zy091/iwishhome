-- 创建策略：所有用户可以查看测试
CREATE POLICY "Tests are viewable by all users"
  ON public.tests FOR SELECT
  USING (true);

-- 创建策略：只有管理员可以创建和修改测试
CREATE POLICY "Only admins can insert tests"
  ON public.tests FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update tests"
  ON public.tests FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete tests"
  ON public.tests FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- 创建策略：用户只能查看自己的测试记录
CREATE POLICY "Users can view their own test records"
  ON public.user_tests FOR SELECT
  USING (auth.uid() = user_id);

-- 创建策略：用户只能创建自己的测试记录
CREATE POLICY "Users can insert their own test records"
  ON public.user_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 创建策略：用户只能更新自己的测试记录
CREATE POLICY "Users can update their own test records"
  ON public.user_tests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id); 