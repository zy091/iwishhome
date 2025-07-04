import { supabase } from '@/lib/supabaseClient'

export interface Organization {
    id: string;
    name: string;
    parent_id?: string;
    level: number;
    path: string;
    order_index: number;  // 添加排序字段
    created_at?: string;
    updated_at?: string;
    children?: Organization[];
}

export const organizationService = {
    // 获取组织树
    async getOrganizationTree() {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('order_index');  // 添加 order_index 排序

        if (error) throw error;

        const buildTree = (items: Organization[], parentId: string | null = null): Organization[] => {
            return items
                .filter(item => item.parent_id === parentId)
                .sort((a, b) => a.order_index - b.order_index)  // 按 order_index 排序
                .map(item => ({
                    ...item,
                    children: buildTree(items, item.id)
                }));
        };

        return buildTree(data || []);
    },

    // 获取子组织
    async getChildren(parentId: string) {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('parent_id', parentId)
            .order('order_index, name');  // 先按 order_index 排序，再按名称排序

        if (error) throw error;
        return data;
    },

    // 获取组织路径
    async getOrganizationPath(orgId: string) {
        // 首先获取当前组织
        const { data: currentOrg, error: currentError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .single();

        if (currentError) throw currentError;
        if (!currentOrg) return [];

        // 获取父级组织路径
        const parentPath = currentOrg.path.split('/').filter(Boolean);
        
        // 获取所有相关组织（父级和当前组织）
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .in('id', [...parentPath, orgId])
            .order('level, order_index');

        if (error) throw error;
        return data;
    },

    // 创建组织
    async createOrganization(organization: Partial<Organization>) {
        // 获取同级组织中最大的 order_index
        const { data: siblings } = await supabase
            .from('organizations')
            .select('order_index')
            .eq('parent_id', organization.parent_id || null)
            .order('order_index', { ascending: false })
            .limit(1);

        const nextOrderIndex = siblings && siblings[0] ? siblings[0].order_index + 1 : 0;

        const { data, error } = await supabase
            .from('organizations')
            .insert({
                ...organization,
                order_index: nextOrderIndex  // 设置为最大值 + 1
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 移动组织
    async moveOrganization(orgId: string, newParentId: string | null) {
        // 获取目标位置的最大 order_index
        const { data: siblings } = await supabase
            .from('organizations')
            .select('order_index')
            .eq('parent_id', newParentId)
            .order('order_index', { ascending: false })
            .limit(1);

        const nextOrderIndex = siblings && siblings[0] ? siblings[0].order_index + 1 : 0;

        const { data, error } = await supabase
            .from('organizations')
            .update({ 
                parent_id: newParentId,
                order_index: nextOrderIndex  // 更新排序索引
            })
            .eq('id', orgId)
            .select()
            .single();

        if (error) throw error;

        // 更新所有相关用户的组织路径
        await this.updateUsersOrganizationPath(orgId);

        return data;
    },

    // 新增：更新用户组织路径
    async updateUsersOrganizationPath(orgId: string) {
        // 获取组织路径
        const orgPath = await this.getOrganizationPath(orgId);
        const pathString = orgPath.map(org => org.name).join(' > ');

        // 更新所有相关用户的组织路径
        const { error } = await supabase
            .from('user_profiles')
            .update({ organization_path: pathString })
            .eq('organization_id', orgId);

        if (error) throw error;
    },

    // 新增：更新组织排序
    async updateOrganizationOrder(orgId: string, newOrderIndex: number) {
        const { data, error } = await supabase
            .from('organizations')
            .update({ order_index: newOrderIndex })
            .eq('id', orgId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 新增：批量更新组织排序
    async batchUpdateOrder(updates: { id: string, order_index: number }[]) {
        const { data, error } = await supabase
            .from('organizations')
            .upsert(updates)
            .select();

        if (error) throw error;
        return data;
    }
};