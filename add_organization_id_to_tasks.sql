-- 为tasks表添加organization_id字段
ALTER TABLE public.tasks 
ADD COLUMN organization_id uuid NULL;

-- 添加外键约束，引用organizations表的id字段
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations (id);

-- 为organization_id创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id 
ON public.tasks USING btree (organization_id);

-- 为现有的任务设置默认组织ID（如果需要的话）
-- 注意：这里需要根据实际情况来设置，可能需要先查询用户所属组织
-- UPDATE public.tasks 
-- SET organization_id = (
--     SELECT organization_id 
--     FROM user_profiles 
--     WHERE user_profiles.user_id = tasks.user_id
-- )
-- WHERE organization_id IS NULL;

-- 验证表结构
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position; 