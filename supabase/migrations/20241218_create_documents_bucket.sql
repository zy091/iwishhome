-- 创建documents存储桶用于Word文件管理

-- 创建documents存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 删除现有的存储桶策略（如果存在）
DROP POLICY IF EXISTS "Allow authenticated users to manage documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to documents" ON storage.objects;

-- 创建存储桶策略 - 允许认证用户管理文档
CREATE POLICY "Allow authenticated users to manage documents" ON storage.objects
    FOR ALL USING (
        bucket_id = 'documents' 
        AND auth.role() = 'authenticated'
    );

-- 创建存储桶策略 - 允许公开访问文档（用于查看）
CREATE POLICY "Allow public access to documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents'
    );