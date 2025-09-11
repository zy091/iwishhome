-- 完整的存储桶设置脚本
-- 用于设置Word文件管理系统的存储桶和策略

-- 1. 创建documents存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 创建converted_files存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('converted_files', 'converted_files', true)
ON CONFLICT (id) DO NOTHING;

-- 3. 清理现有的存储桶策略
DROP POLICY IF EXISTS "Allow authenticated users to manage documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to manage converted files" ON storage.objects;

-- 4. 为documents存储桶创建策略
-- 允许认证用户管理文档（上传、更新、删除）
CREATE POLICY "Allow authenticated users to manage documents" ON storage.objects
    FOR ALL USING (
        bucket_id = 'documents' 
        AND auth.role() = 'authenticated'
    );

-- 允许公开访问文档（用于查看和下载）
CREATE POLICY "Allow public access to documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents'
    );

-- 5. 为converted_files存储桶创建策略
CREATE POLICY "Allow authenticated users to manage converted files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'converted_files' 
        AND auth.role() = 'authenticated'
    );

-- 6. 验证存储桶创建
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id IN ('documents', 'converted_files');

-- 7. 验证策略创建
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%documents%' OR policyname LIKE '%converted_files%';