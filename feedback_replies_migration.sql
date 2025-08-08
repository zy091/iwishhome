-- 1. 创建反馈回复表
CREATE TABLE public.feedback_replies (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  feedback_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT feedback_replies_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_replies_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
  CONSTRAINT feedback_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- 2. 创建更新时间触发器
CREATE TRIGGER update_feedback_replies_timestamp 
BEFORE UPDATE ON feedback_replies 
FOR EACH ROW 
EXECUTE FUNCTION update_timestamp();

-- 3. 删除依赖于admin_reply的策略
DROP POLICY IF EXISTS "Update own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can update feedback they created" ON public.feedback;

-- 4. 删除原有的feedback_with_users视图
DROP VIEW IF EXISTS public.feedback_with_users;

-- 5. 修改feedback表，移除原有的回复相关字段
ALTER TABLE public.feedback 
DROP COLUMN IF EXISTS admin_reply,
DROP COLUMN IF EXISTS admin_id,
DROP COLUMN IF EXISTS replied_at;

-- 6. 创建新的feedback_with_users视图
CREATE VIEW public.feedback_with_users AS
SELECT
  f.id,
  f.title,
  f.content,
  f.platform,
  f.status,
  f.created_at,
  f.updated_at,
  f.user_id,
  f.is_show,
  up.full_name,
  up.email,
  -- 获取最新回复信息
  latest_reply.content as latest_reply_content,
  latest_reply.created_at as latest_reply_time,
  latest_reply_user.full_name as latest_reply_user_name,
  -- 获取回复数量
  COALESCE(reply_count.count, 0) as reply_count
FROM
  feedback f
  JOIN user_profiles up ON f.user_id = up.user_id
  LEFT JOIN (
    SELECT 
      feedback_id,
      content,
      created_at,
      user_id
    FROM feedback_replies fr1
    WHERE created_at = (
      SELECT MAX(created_at) 
      FROM feedback_replies fr2 
      WHERE fr2.feedback_id = fr1.feedback_id
    )
  ) latest_reply ON f.id = latest_reply.feedback_id
  LEFT JOIN user_profiles latest_reply_user ON latest_reply.user_id = latest_reply_user.user_id
  LEFT JOIN (
    SELECT feedback_id, COUNT(*) as count
    FROM feedback_replies
    GROUP BY feedback_id
  ) reply_count ON f.id = reply_count.feedback_id;

-- 7. 创建回复详情视图
CREATE VIEW public.feedback_replies_with_users AS
SELECT
  fr.id,
  fr.feedback_id,
  fr.content,
  fr.created_at,
  fr.updated_at,
  fr.user_id,
  up.full_name,
  up.email
FROM
  feedback_replies fr
  JOIN user_profiles up ON fr.user_id = up.user_id
ORDER BY fr.created_at ASC;

-- 8. 为feedback表创建基本策略
CREATE POLICY "Users can view all feedback" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Users can create feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own feedback" ON public.feedback FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own feedback" ON public.feedback FOR DELETE USING (auth.uid() = user_id);

-- 9. 为feedback_replies表创建策略
CREATE POLICY "Users can view all replies" ON public.feedback_replies FOR SELECT USING (true);
CREATE POLICY "Users can create replies" ON public.feedback_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own replies" ON public.feedback_replies FOR UPDATE USING (auth.uid() = user_id);
-- 暂时允许所有用户删除回复，或者您可以根据需要调整这个策略
CREATE POLICY "Users can delete replies" ON public.feedback_replies FOR DELETE USING (auth.uid() = user_id); 