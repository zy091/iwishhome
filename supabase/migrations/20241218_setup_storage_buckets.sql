-- 设置存储桶和策略

-- 创建converted_files存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('converted_files', 'converted_files', true)
ON CONFLICT (id) DO NOTHING;

-- 删除现有的存储桶策略（如果存在）
DROP POLICY IF EXISTS "Allow authenticated users to upload converted files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view converted files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update converted files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete converted files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to manage converted files" ON storage.objects;

-- 创建新的存储桶策略
CREATE POLICY "Allow authenticated users to manage converted files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'converted_files' 
        AND auth.role() = 'authenticated'
    );