# 测试系统数据库设计

## 表结构

### tests 表
存储所有测试的基本信息。

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 主键 |
| title | TEXT | 测试标题 |
| type | TEXT | 测试类型（select/case/comprehensive） |
| question_count | INTEGER | 题目数量 |
| score_weight | INTEGER | 分值权重 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### user_tests 表
存储用户与测试之间的关系，包括完成状态和成绩。

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID（外键） |
| test_id | UUID | 测试ID（外键） |
| completion_status | TEXT | 完成状态（not_started/in_progress/completed） |
| latest_score | INTEGER | 最新得分 |
| started_at | TIMESTAMP | 开始时间 |
| completed_at | TIMESTAMP | 完成时间 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

## 安全策略

1. 所有用户都可以查看测试列表
2. 只有管理员可以创建、修改和删除测试
3. 用户只能查看、创建和更新自己的测试记录

## 应用迁移

在Supabase项目中应用这些迁移脚本的步骤：

1. 登录Supabase管理界面
2. 进入SQL编辑器
3. 按顺序执行以下SQL文件：
   - `20240430_create_tests_tables.sql`
   - `20240430_create_tests_policies.sql`
   - `20240430_seed_tests_data.sql`

或者使用Supabase CLI执行迁移：

```bash
supabase db push
``` 