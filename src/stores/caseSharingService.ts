import { supabase } from '@/lib/supabaseClient'

export interface CaseSharing {
    id: string;
    title: string;
    content: string;
    category: string;
    is_show: boolean;
    attachment_url?: string;
    attachment_name?: string;
    attachment_type?: string;
    link_url?: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    created_by_name: string;
    organization_id?: string;
}

export interface CaseSharingSearchParams {
    query?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
    category?: string;
    showStatus?: string;
    viewType?: 'all' | 'my'; // 全部案例或我的案例
}

export interface CreateCaseSharingParams {
    title: string;
    content: string;
    category: string;
    is_show: boolean;
    attachment_url?: string;
    attachment_name?: string;
    attachment_type?: string;
    link_url?: string;
}

export const hasAdminPermission = (roleId: number): boolean => {
    return roleId === 0 || roleId === 1 || roleId === 11;
}

export const caseSharingService = {
    // 获取所有案例（根据条件筛选）
    async getAllCases(params: CaseSharingSearchParams = {}): Promise<{ data: CaseSharing[], total: number }> {
        let query = supabase
            .from('case_sharing')
            .select('*', { count: 'exact' });

        // 添加查询条件
        if (params.query) {
            query = query.ilike('title', `%${params.query}%`);
        }

        if (params.category && params.category !== 'all') {
            query = query.eq('category', params.category);
        }

        if (params.startDate && params.endDate) {
            query = query.gte('created_at', params.startDate).lte('created_at', params.endDate);
        }

        // 根据查看类型过滤
        if (params.viewType === 'my') {
            // 只查看自己的案例
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                query = query.eq('created_by', user.id);
            }
        }

        if (params.showStatus !== undefined) {
            query = query.eq('is_show', params.showStatus === 'true');
        } else {
            // 非管理员只能看到显示状态为true的案例
            query = query.eq('is_show', true);
        }

        // 分页
        const from = ((params.page || 1) - 1) * (params.pageSize || 10);
        const to = from + (params.pageSize || 10) - 1;
        
        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        return {
            data: data as CaseSharing[],
            total: count || 0
        };
    },

    // 获取单个案例详情
    async getCase(id: string): Promise<CaseSharing> {
        const { data, error } = await supabase
            .from('case_sharing')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as CaseSharing;
    },

    // 创建案例
    async createCase(params: CreateCaseSharingParams): Promise<CaseSharing> {
        // 获取当前用户信息
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error('User not authenticated');

        // 获取用户信息
        const { data: userData, error: userError } = await supabase
            .from('user_profiles')
            .select('full_name, organization_id')
            .eq('user_id', user.id)
            .single();

        if (userError) throw userError;

        const { data, error } = await supabase
            .from('case_sharing')
            .insert({
                ...params,
                created_by: user.id,
                created_by_name: userData.full_name || user.email,
                organization_id: userData.organization_id
            })
            .select()
            .single();

        if (error) throw error;
        return data as CaseSharing;
    },

    // 更新案例
    async updateCase(id: string, params: Partial<CreateCaseSharingParams>): Promise<CaseSharing> {
        const { data, error } = await supabase
            .from('case_sharing')
            .update(params)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as CaseSharing;
    },

    // 删除案例
    async deleteCase(id: string): Promise<void> {
        const { error } = await supabase
            .from('case_sharing')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // 上传文件
    async uploadFile(file: File, path: string): Promise<{ url: string, filename: string }> {
        const fileName = `${new Date().getTime()}_${file.name}`;
        const filePath = `${path}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('materials')
            .upload(filePath, file);

        if (error) throw error;

        // 获取公共URL
        const { data: { publicUrl } } = supabase.storage
            .from('materials')
            .getPublicUrl(filePath);

        return {
            url: publicUrl,
            filename: fileName
        };
    }
}; 