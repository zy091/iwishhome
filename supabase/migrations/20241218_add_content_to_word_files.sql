-- 为word_files表添加content字段
ALTER TABLE word_files ADD COLUMN IF NOT EXISTS content TEXT;

-- 添加注释
COMMENT ON COLUMN word_files.content IS 'Word文件转换后的HTML内容';