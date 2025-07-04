import { supabase } from '@/lib/supabaseClient'

export interface Document {
    id: string;
    title: string;
    content: string;
    category: string;
    is_show: boolean;
    created_at: string;
    created_by: string;
    created_by_name: string;
    updated_at?: string;
    attachment_url?: string;
    attachment_name?: string;
}

export interface DocumentSearchParams {
    query?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
    category?: string;
    showStatus?: string;
}

export interface CreateDocumentParams {
    title: string;
    content: string;
    category: string;
    is_show: boolean;
    attachment_url?: string;
    attachment_name?: string;
}

export const hasAdminPermission = (roleId: number): boolean => {
    // 假设roleId为1是管理员
    return roleId === 0;
}

export const documentService = {
    // 获取所有文档（根据条件筛选）
    async getAllDocuments(params: DocumentSearchParams = {}): Promise<{ data: Document[], total: number }> {
        let query = supabase
            .from('documents')
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

        if (params.showStatus !== undefined) {
            query = query.eq('is_show', params.showStatus === 'true');
        } else {
            // 非管理员只能看到显示状态为true的文档
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
            data: data as Document[],
            total: count || 0
        };
    },

    // 获取单个文档详情
    async getDocument(id: string): Promise<Document> {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Document;
    },

    // 创建文档
    async createDocument(params: CreateDocumentParams): Promise<Document> {
        // 获取当前用户信息
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error('User not authenticated');

        // 获取用户姓名
        const { data: userData, error: userError } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', user.id)
            .single();

        if (userError) throw userError;

        const { data, error } = await supabase
            .from('documents')
            .insert({
                ...params,
                created_by: user.id,
                created_by_name: userData.full_name || user.email
            })
            .select()
            .single();

        if (error) throw error;
        return data as Document;
    },

    // 更新文档
    async updateDocument(id: string, params: Partial<CreateDocumentParams>): Promise<Document> {
        const { data, error } = await supabase
            .from('documents')
            .update(params)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Document;
    },

    // 删除文档
    async deleteDocument(id: string): Promise<void> {
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // 上传文件
    async uploadFile(file: File, path: string): Promise<{ url: string, filename: string }> {
        const fileName = `${new Date().getTime()}_${file.name}`;
        const filePath = `${path}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('documents')
            .upload(filePath, file);

        if (error) throw error;

        // 获取公共URL
        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

        return {
            url: publicUrl,
            filename: fileName
        };
    }
}; 