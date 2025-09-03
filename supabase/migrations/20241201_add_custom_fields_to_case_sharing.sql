-- 为 case_sharing 表添加自定义字段
-- 迁移时间: 2024-12-01

-- 添加新字段
ALTER TABLE public.case_sharing 
ADD COLUMN IF NOT EXISTS custom_month text NULL,
ADD COLUMN IF NOT EXISTS custom_sharer text NULL,
ADD COLUMN IF NOT EXISTS custom_department text NULL;

-- 添加字段注释
COMMENT ON COLUMN public.case_sharing.custom_month IS '自定义月份';
COMMENT ON COLUMN public.case_sharing.custom_sharer IS '自定义分享人';
COMMENT ON COLUMN public.case_sharing.custom_department IS '自定义分享部门';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_case_sharing_custom_month ON public.case_sharing USING btree (custom_month);
CREATE INDEX IF NOT EXISTS idx_case_sharing_custom_sharer ON public.case_sharing USING btree (custom_sharer);
CREATE INDEX IF NOT EXISTS idx_case_sharing_custom_department ON public.case_sharing USING btree (custom_department);

-- 验证字段已添加
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'case_sharing' 
AND column_name IN ('custom_month', 'custom_sharer', 'custom_department'); 