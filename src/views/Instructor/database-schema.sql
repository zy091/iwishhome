-- 讲师表
CREATE TABLE IF NOT EXISTS instructors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    position VARCHAR(100) NOT NULL,
    join_year INTEGER NOT NULL,
    bio TEXT,
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 课程表（如果不存在）
CREATE TABLE IF NOT EXISTS courses (
    id BIGSERIAL PRIMARY KEY,
    course_name VARCHAR(200) NOT NULL,
    course_category VARCHAR(100),
    course_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 讲师课程关联表
CREATE TABLE IF NOT EXISTS instructor_courses (
    id BIGSERIAL PRIMARY KEY,
    instructor_id BIGINT NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(instructor_id, course_id)
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_instructors_join_year ON instructors(join_year);
CREATE INDEX IF NOT EXISTS idx_instructors_name ON instructors(name);
CREATE INDEX IF NOT EXISTS idx_instructor_courses_instructor_id ON instructor_courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_courses_course_id ON instructor_courses(course_id);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_instructors_updated_at
    BEFORE UPDATE ON instructors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE instructors IS '讲师信息表';
COMMENT ON TABLE courses IS '课程信息表';
COMMENT ON TABLE instructor_courses IS '讲师课程关联表';

COMMENT ON COLUMN instructors.name IS '讲师姓名';
COMMENT ON COLUMN instructors.avatar_url IS '讲师头像URL';
COMMENT ON COLUMN instructors.position IS '讲师职位';
COMMENT ON COLUMN instructors.join_year IS '加入年份';
COMMENT ON COLUMN instructors.bio IS '个人简介';
COMMENT ON COLUMN instructors.email IS '邮箱';
COMMENT ON COLUMN instructors.phone IS '电话';

-- 插入示例数据
INSERT INTO courses (course_name, course_category) VALUES
('Google搜索广告基础', 'Google广告'),
('Google购物广告优化', 'Google广告'),
('Meta广告投放策略', 'Meta广告'),
('GA4数据分析', '数据分析'),
('网站优化与SEO', '网站优化')
ON CONFLICT DO NOTHING;

INSERT INTO instructors (name, position, join_year, bio, email, phone) VALUES
('张三', '高级讲师', 2020, '拥有5年Google广告优化经验，擅长搜索广告和购物广告优化', 'zhangsan@iwishweb.com', '13800138000'),
('李四', '资深讲师', 2019, '专注Meta广告投放策略研究，帮助众多企业实现品效合一', 'lisi@iwishweb.com', '13800138001')
ON CONFLICT DO NOTHING;
