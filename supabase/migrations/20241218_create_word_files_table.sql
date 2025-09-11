-- 创建Word文件管理表
CREATE TABLE IF NOT EXISTS word_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_word_files_user_id ON word_files(user_id);
CREATE INDEX IF NOT EXISTS idx_word_files_created_at ON word_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_word_files_name ON word_files(name);
CREATE INDEX IF NOT EXISTS idx_word_files_file_type ON word_files(file_type);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_word_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_word_files_updated_at
    BEFORE UPDATE ON word_files
    FOR EACH ROW
    EXECUTE FUNCTION update_word_files_updated_at();

-- 启用RLS并设置策略
ALTER TABLE word_files ENABLE ROW LEVEL SECURITY;

-- 用户只能管理自己的文件
CREATE POLICY "Users can manage their own word files" ON word_files
    FOR ALL USING (auth.uid() = user_id);

-- 管理员可以管理所有文件
CREATE POLICY "Admins can manage all word files" ON word_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() 
            AND r.name = 'admin'
        )
    );