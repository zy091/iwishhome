-- 创建文件转换记录表
CREATE TABLE IF NOT EXISTS file_conversions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_name TEXT NOT NULL,
    output_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    options JSONB DEFAULT '[]'::jsonb,
    output_file_url TEXT,
    markdown_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_file_conversions_user_id ON file_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_file_conversions_status ON file_conversions(status);
CREATE INDEX IF NOT EXISTS idx_file_conversions_created_at ON file_conversions(created_at DESC);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_file_conversions_updated_at 
    BEFORE UPDATE ON file_conversions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public) 
VALUES ('converted_files', 'converted_files', true)
ON CONFLICT (id) DO NOTHING;

-- 设置存储桶策略
CREATE POLICY "Allow authenticated users to manage converted files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'converted_files' 
        AND auth.role() = 'authenticated'
    );

-- 设置RLS策略
ALTER TABLE file_conversions ENABLE ROW LEVEL SECURITY;

-- 允许认证用户查看自己的转换记录
CREATE POLICY "Users can view their own conversions" ON file_conversions
    FOR SELECT USING (auth.uid() = user_id);

-- 允许认证用户创建转换记录
CREATE POLICY "Users can create conversions" ON file_conversions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许认证用户更新自己的转换记录
CREATE POLICY "Users can update their own conversions" ON file_conversions
    FOR UPDATE USING (auth.uid() = user_id);

-- 允许认证用户删除自己的转换记录
CREATE POLICY "Users can delete their own conversions" ON file_conversions
    FOR DELETE USING (auth.uid() = user_id);