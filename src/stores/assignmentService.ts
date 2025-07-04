import { supabase } from '@/lib/supabaseClient'
import { useUserStore } from '@/stores/user'
import { generateDateRange } from '@/utils/dateUtils'

export interface Assignment {
    id?: string
    title: string
    content: string
    created_by?: string
    assigned_to?: string
    organization_id?: string
    created_at?: string
    updated_at?: string
    replies?: AssignmentReply[]
    creator_profile?: {
        full_name: string
        email: string
    }
    assignee_profile?: {
        full_name: string
        email: string
    }
}

export interface AssignmentReply {
    id?: string
    assignment_id: string
    user_id: string
    content: string
    full_name: string
    created_at?: string
    updated_at?: string
    profile?: {
        full_name: string
        email: string
    }
}

export const assignmentService = {
    // 获取用户所在组织的所有作业
    async getAssignments(page: number = 1, pageSize: number = 10, filters?: {
        query?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
    }) {
        const userStore = useUserStore()
        if (!userStore.user) throw new Error('用户未登录')

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('organization_id, organization_parent_id')
            .eq('user_id', userStore.user.user_id)
            .single()

        if (!profile?.organization_parent_id) throw new Error('用户未关联上级组织')

        // 如果有搜索关键词且需要查询分配人的全名
        if (filters?.query) {
            // 首先获取匹配关键词的用户 ID
            const { data: matchingUsers } = await supabase
                .from('user_profiles')
                .select('user_id')
                .ilike('full_name', `%${filters.query}%`)
                .eq('organization_parent_id', profile.organization_parent_id)
            
            const matchingUserIds = matchingUsers?.map(user => user.user_id) || []
            
            let query = supabase
                .from('assignments')
                .select(`
                    *,
                    creator_profile:user_profiles!created_by(full_name, email),
                    assignee_profile:user_profiles!assigned_to(full_name, email),
                    replies:assignment_replies(*, profile:user_profiles(full_name, email))
                `, { count: 'exact' })
                .eq('organization_parent_id', profile.organization_parent_id)
                
            // 基于标题或分配给匹配用户的作业进行筛选
            if (matchingUserIds.length > 0) {
                query = query.or(`title.ilike.%${filters.query}%,assigned_to.in.(${matchingUserIds.join(',')})`)
            } else {
                // 如果没有匹配的用户，只按标题筛选
                query = query.ilike('title', `%${filters.query}%`)
            }
            
            // 处理日期范围
            if (filters?.startDate && filters?.endDate) {
                const { startUTC, endUTC } = generateDateRange(filters.startDate, filters.endDate);
                query = query
                    .gte('created_at', startUTC)
                    .lte('created_at', endUTC);
            }
            
            // 添加回复状态过滤
            if (filters?.status === 'replied') {
                // 查询已完成并已回复的作业 (有指定人员和管理员的回复)
                query = query.not('replies', 'is', null)
            } else if (filters?.status === 'pending') {
                // 查询待回复的作业 (没有指定人员的回复)
                query = query.not('replies', 'is', null)
            }

            // 排序和分页
            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range((page - 1) * pageSize, page * pageSize - 1)

            if (error) throw error
            return { data, total: count || 0 }
        } else {
            // 原有查询逻辑，无关键词搜索
            let query = supabase
                .from('assignments')
                .select(`
                    *,
                    creator_profile:user_profiles!created_by(full_name, email),
                    assignee_profile:user_profiles!assigned_to(full_name, email),
                    replies:assignment_replies(*, profile:user_profiles(full_name, email))
                `, { count: 'exact' })
                .eq('organization_parent_id', profile.organization_parent_id)
            
            // 处理日期范围
            if (filters?.startDate && filters?.endDate) {
                const { startUTC, endUTC } = generateDateRange(filters.startDate, filters.endDate);
                query = query
                    .gte('created_at', startUTC)
                    .lte('created_at', endUTC);
            }
            
            // 添加回复状态过滤
            if (filters?.status === 'replied') {
                // 查询已完成并已回复的作业 (有指定人员和管理员的回复)
                query = query.not('replies', 'is', null)
            } else if (filters?.status === 'pending') {
                // 查询待回复的作业 (没有指定人员的回复)
                query = query.not('replies', 'is', null)
            }

            // 排序和分页
            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range((page - 1) * pageSize, page * pageSize - 1)

            if (error) throw error
            return { data, total: count || 0 }
        }
    },

    // 获取组织成员
    async getOrganizationMembers() {
        const userStore = useUserStore()
        if (!userStore.user) throw new Error('用户未登录')

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('organization_id, organization_parent_id')
            .eq('user_id', userStore.user.user_id)
            .single()

        console.log('当前用户profile:', profile); // 添加日志

        if (!profile?.organization_id) throw new Error('用户未加入组织')
        
        // 确保有上级组织ID
        if (!profile.organization_parent_id) {
            console.log('用户没有上级组织ID，尝试使用organization_id代替');
            
            // 如果没有organization_parent_id，则使用organization_id作为过滤条件
            const { data, error } = await supabase
                .from('user_profiles')
                .select(`
                    user_id,
                    role_id,
                    full_name,
                    email,
                    organization_id,
                    organization_path
                `)
                .eq('organization_id', profile.organization_id)
                .neq('user_id', userStore.user.user_id) // 排除当前用户
            
            console.log('查询结果:', data); // 添加日志
            
            if (error) {
                console.error('查询错误:', error); // 添加日志
                throw error;
            }
            return data;
        }
        
        // 尝试获取所有与当前用户相同organization_parent_id的成员
        console.log('使用organization_parent_id查询:', profile.organization_parent_id); // 添加日志
        
        const { data, error } = await supabase
            .from('user_profiles')
            .select(`
                user_id,
                role_id,
                full_name,
                email,
                organization_id,
                organization_path
            `)
            .eq('organization_parent_id', profile.organization_parent_id)
            .neq('user_id', userStore.user.user_id) // 排除当前用户

        console.log('查询结果:', data); // 添加日志
        
        if (error) {
            console.error('查询错误:', error); // 添加日志
            throw error;
        }
        
        // 如果没有找到结果，尝试使用更宽松的条件
        if (!data || data.length === 0) {
            console.log('没有找到相同parent_id的成员，尝试使用更宽松的条件');
            
            // 尝试获取同一组织的成员
            const { data: orgData, error: orgError } = await supabase
                .from('user_profiles')
                .select(`
                    user_id,
                    role_id,
                    full_name,
                    email,
                    organization_id,
                    organization_path
                `)
                .eq('organization_id', profile.organization_id)
                .neq('user_id', userStore.user.user_id);
                
            console.log('同组织查询结果:', orgData); // 添加日志
            
            if (orgError) {
                console.error('同组织查询错误:', orgError); // 添加日志
                throw orgError;
            }
            
            return orgData;
        }
        
        return data;
    },

    // 创建作业
    async createAssignment(assignment: Assignment) {
        const userStore = useUserStore()
        if (!userStore.user) throw new Error('用户未登录')

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('organization_id, organization_parent_id')
            .eq('user_id', userStore.user.user_id)
            .single()

        if (!profile?.organization_id) throw new Error('用户未加入组织')

        const { data, error } = await supabase
            .from('assignments')
            .insert({
                ...assignment,
                created_by: userStore.user.user_id,
                organization_id: profile.organization_id,
                organization_parent_id: profile.organization_parent_id
            })
            .select(`
            *,
            creator_profile:user_profiles!created_by(full_name, email),
            assignee_profile:user_profiles!assigned_to(full_name, email)
        `)
            .single()

        if (error) throw error
        return data
    },

    // 添加作业回复
    async addReply(reply: AssignmentReply) {
        const userStore = useUserStore()
        if (!userStore.user) throw new Error('用户未登录')

        const { data, error } = await supabase
            .from('assignment_replies')
            .insert({
                ...reply,
                user_id: userStore.user.user_id,
                full_name: userStore.user.full_name || ''
            })
            .select(`
                *,
                profile:user_profiles(full_name, email)
            `)
            .single()

        if (error) throw error
        return data
    },

    // 获取作业详情
    async getAssignmentById(assignmentId: string) {
        const { data, error } = await supabase
            .from('assignments')
            .select(`
                *,
                creator_profile:user_profiles!created_by(full_name, email),
                assignee_profile:user_profiles!assigned_to(full_name, email),
                replies:assignment_replies(*, profile:user_profiles(full_name, email))
            `)
            .eq('id', assignmentId)
            .single();

        if (error) throw error;
        return data;
    },

    // 获取分配给当前用户的作业
    async getPersonalAssignments(page: number = 1, pageSize: number = 10, filters?: {
        query?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
    }) {
        const userStore = useUserStore()
        if (!userStore.user) throw new Error('用户未登录')

        const userId = userStore.user.user_id
        
        // 直接查询指定给当前用户的作业
        let query = supabase
            .from('assignments')
            .select(`
                *,
                creator_profile:user_profiles!created_by(full_name, email),
                assignee_profile:user_profiles!assigned_to(full_name, email),
                replies:assignment_replies(*, profile:user_profiles(full_name, email))
            `, { count: 'exact' })
            .eq('assigned_to', userId) // 直接筛选assigned_to等于当前用户ID的作业
        
        // 添加标题搜索
        if (filters?.query) {
            query = query.ilike('title', `%${filters.query}%`)
        }
        
        // 处理日期范围
        if (filters?.startDate && filters?.endDate) {
            const { startUTC, endUTC } = generateDateRange(filters.startDate, filters.endDate);
            query = query
                .gte('created_at', startUTC)
                .lte('created_at', endUTC);
        }
        
        // 添加回复状态过滤
        if (filters?.status === 'replied') {
            // 查询已完成并已回复的作业 (有指定人员和管理员的回复)
            query = query.not('replies', 'is', null)
        } else if (filters?.status === 'pending') {
            // 查询待回复的作业 (没有指定人员的回复)
            query = query.not('replies', 'is', null)
        }

        // 排序和分页
        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1)

        if (error) throw error
        return { data, total: count || 0,error }
    },

    // 删除作业
    async deleteAssignment(assignmentId: string) {
        const { error } = await supabase
            .from('assignments')
            .delete()
            .eq('id', assignmentId);

        if (error) throw error;
        return true;
    }
}