-- 创建讲师体系菜单表
CREATE TABLE IF NOT EXISTS menu_instructor (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL COMMENT '菜单标题',
  path VARCHAR(200) NOT NULL COMMENT '菜单路径',
  icon VARCHAR(50) COMMENT '菜单图标',
  parent_id INTEGER COMMENT '父菜单ID',
  sort_order INTEGER DEFAULT 0 COMMENT '排序顺序',
  is_visible BOOLEAN DEFAULT TRUE COMMENT '是否可见',
  required_role_ids INTEGER[] COMMENT '需要的角色ID数组',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入讲师体系菜单数据
INSERT INTO menu_instructor (title, path, icon, parent_id, sort_order, required_role_ids) VALUES
('讲师展示', '/instructor/display', 'User', NULL, 1, '{}'),
('讲师管理', '/instructor/manage', 'Setting', NULL, 2, '{0,1,11,15}');

-- 创建讲师表
CREATE TABLE IF NOT EXISTS instructors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '讲师姓名',
  avatar_url TEXT COMMENT '头像URL',
  title VARCHAR(100) COMMENT '职称',
  department VARCHAR(100) COMMENT '部门',
  specialties TEXT[] COMMENT '专业领域',
  introduction TEXT COMMENT '个人简介',
  teaching_experience INTEGER COMMENT '教学经验(年)',
  total_courses INTEGER DEFAULT 0 COMMENT '总课程数',
  total_students INTEGER DEFAULT 0 COMMENT '总学员数',
  rating DECIMAL(3,2) DEFAULT 5.0 COMMENT '评分',
  email VARCHAR(100) COMMENT '邮箱',
  phone VARCHAR(20) COMMENT '电话',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否在职',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建讲师课程关联表
CREATE TABLE IF NOT EXISTS instructor_courses (
  id SERIAL PRIMARY KEY,
  instructor_id INTEGER REFERENCES instructors(id) ON DELETE CASCADE,
  course_name VARCHAR(200) NOT NULL COMMENT '课程名称',
  course_description TEXT COMMENT '课程描述',
  course_category VARCHAR(50) COMMENT '课程类别',
  duration_hours INTEGER COMMENT '课程时长(小时)',
  student_count INTEGER DEFAULT 0 COMMENT '学员人数',
  start_date DATE COMMENT '开课日期',
  end_date DATE COMMENT '结课日期',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否进行中',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建讲师评价表
CREATE TABLE IF NOT EXISTS instructor_reviews (
  id SERIAL PRIMARY KEY,
  instructor_id INTEGER REFERENCES instructors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) COMMENT '评分(1-5)',
  comment TEXT COMMENT '评价内容',
  course_name VARCHAR(200) COMMENT '相关课程',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入示例讲师数据
INSERT INTO instructors (name, title, department, specialties, introduction, teaching_experience, total_courses, total_students, rating, email, phone) VALUES
('张明', '高级讲师', 'Google广告部', ARRAY['Google Ads', 'PLA', 'PMax'], '拥有8年Google广告投放经验，擅长电商广告优化，帮助多家企业实现ROI翻倍增长。', 8, 25, 300, 4.8, 'zhangming@example.com', '13800138001'),
('李娜', '资深讲师', 'Meta广告部', ARRAY['Facebook Ads', 'Instagram Ads', '社交媒体营销'], '专注于Meta广告投放与优化，对社交媒体营销有深入研究，培训学员超过500人。', 6, 20, 500, 4.9, 'lina@example.com', '13800138002'),
('王强', '首席讲师', '数字营销部', ARRAY['数字营销策略', 'SEO', 'SEM'], '数字营销领域专家，拥有10年行业经验，曾服务多家知名品牌，擅长整合营销方案设计。', 10, 30, 450, 4.7, 'wangqiang@example.com', '13800138003'),
('赵丽', '高级讲师', 'Google广告部', ARRAY['搜索广告', '展示广告', '转化优化'], 'Google认证讲师，精通各类Google广告产品，擅长数据分析和转化率优化。', 7, 22, 380, 4.8, 'zhaoli@example.com', '13800138004'),
('刘洋', '讲师', 'Meta广告部', ARRAY['电商广告', 'DPA', 'Catalog营销'], '专注于电商领域的Meta广告投放，对DPA和目录营销有丰富实战经验。', 5, 15, 280, 4.6, 'liuyang@example.com', '13800138005');

-- 插入示例课程数据
INSERT INTO instructor_courses (instructor_id, course_name, course_description, course_category, duration_hours, student_count, start_date, is_active) VALUES
(1, 'Google PLA广告进阶', '深入讲解Google购物广告的优化技巧与实战案例', 'Google广告', 20, 45, '2024-01-15', true),
(1, 'PMax广告策略', 'Performance Max广告的全面解析与应用', 'Google广告', 16, 38, '2024-02-01', true),
(2, 'Facebook广告入门', 'Facebook广告基础知识与账户搭建', 'Meta广告', 12, 60, '2024-01-20', true),
(2, 'Instagram广告创意设计', 'Instagram广告素材制作与创意优化', 'Meta广告', 10, 42, '2024-02-10', true),
(3, '数字营销全流程', '从策略制定到执行落地的完整营销体系', '数字营销', 30, 55, '2024-01-10', true),
(4, 'Google搜索广告优化', '搜索广告的关键词策略与出价优化', 'Google广告', 18, 50, '2024-01-25', true),
(5, 'Meta电商广告实战', 'DPA与Catalog在电商场景的应用', 'Meta广告', 14, 35, '2024-02-05', true);

COMMENT ON TABLE menu_instructor IS '讲师体系菜单表';
COMMENT ON TABLE instructors IS '讲师信息表';
COMMENT ON TABLE instructor_courses IS '讲师课程关联表';
COMMENT ON TABLE instructor_reviews IS '讲师评价表';
