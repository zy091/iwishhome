import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'
import { ElMessage } from 'element-plus'
import { roleService } from './roleService'
import type { Role } from './roleService'
import router from '@/router'

// Define a custom type that combines User with profile fields
type UserProfile = User & {
    full_name?: string;
    role_id?: number;
    address?: string;
    user_id?: string;
    email?: string;
    phone_number?: string;
    bio?: string;
    department?: string;
    avatar_url?: string;
    role?: Role; // 添加角色信息
    organization_id?: string;  // 添加组织ID
    organization_parent_id?: string; // 添加上级组织ID
    organization?: {          // 添加组织信息
        id: string;
        name: string;
        path: string;
        level: number;
        parent_id: string;
    };
    organization_path?: string;
}

interface UserState {
    user: UserProfile | null
    session: Session | null
    roleId: number | string | null
    menus: MenuItem[]
}

interface MenuItem {
    id: number
    name: string
    path: string
    icon: string
    parent_id: number | null
    order_index: number
    role_ids?: number[] | string[]  // 修改为支持 number[] 和 string[]
    children?: MenuItem[]
    created_at?: string
    updated_at?: string
    category: string
}

// 添加角色常量
export enum UserRole {
    ADMIN = 0,
    OPERATIONS_MANAGER = 1,
    PRODUCT_MANAGER = 11,
    TEACHER = 15
}

// 添加检查权限的函数
export const hasManagmentPermission = (roleId: number | null): boolean => {
    return roleId !== null && [
        UserRole.ADMIN,
        UserRole.OPERATIONS_MANAGER,
        UserRole.PRODUCT_MANAGER,
        UserRole.TEACHER
    ].includes(roleId);
}

export const useUserStore = defineStore('user', {
    state: (): UserState => ({
        user: null,
        session: null,
        roleId: null, // 存储 role_id ，存到本地
        menus: []  // 初始化 menus
    }),

    actions: {
        setRoleId(roleId: number | string | null) {
            this.roleId = roleId
            localStorage.setItem('roleId', JSON.stringify(roleId))
        },
        loadRoleId() {
            const storedRoleId = localStorage.getItem('roleId');
            if (storedRoleId) {
                this.roleId = JSON.parse(storedRoleId); // 从本地加载
            }
        },
        setUser(user: UserProfile | null) {
            this.user = user
            if (user) {
                localStorage.setItem('user', JSON.stringify(user))
            } else {
                localStorage.removeItem('user')
            }
        },
        getUser() {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                this.user = JSON.parse(storedUser);
            }
            return this.user;
        },
        async fetchUserProfile(userId: string) {
            const { data: userProfileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)

            if (profileError) {
                return { error: profileError }
            }

            // 确保有数据返回
            if (userProfileData && userProfileData.length > 0) {
                const roleId = userProfileData[0]?.role_id

                // 确保用户数据结构完整
                if (this.user) {
                    this.user = {
                        ...this.user,
                        ...userProfileData[0],
                        user_id: userProfileData[0].user_id // 显式设置user_id
                    }
                } else {
                    this.user = userProfileData[0] as UserProfile
                }

                this.setRoleId(roleId)
                this.setUser(this.user) // 确保数据保存到localStorage

                // 获取角色详情 - 修复判断条件
                if (roleId !== undefined && roleId !== null) {
                    await this.fetchUserRole();
                }
            }

            return { data: userProfileData }
        },

        async updateUserProfile(userId: string, profileData: Partial<UserProfile>) {
            try {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .update({
                        ...profileData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', userId)
                    .select()
                    .single()

                if (error) {
                    return { error }
                }

                // 更新当前用户数据
                if (this.user) {
                    this.setUser({
                        ...this.user,
                        ...profileData
                    })
                }

                return { data }
            } catch (error: any) {
                return { error }
            }
        },

        async initializeAuth() {
            // 获取初始会话
            const { data: { session } } = await supabase.auth.getSession()
            this.session = session

            // 不直接覆盖用户数据，而是在必要时从localStorage加载
            const storedUser = localStorage.getItem('user');

            if (session?.user) {
                if (!storedUser) {
                    // 如果没有本地存储的用户数据，先设置基本数据
                    this.user = session.user as UserProfile

                    // 然后尝试获取完整的用户资料
                    if (session.user.id) {
                        await this.fetchUserProfile(session.user.id);
                    }
                } else {
                    // 如果已有本地存储的用户数据，优先使用
                    this.user = JSON.parse(storedUser);

                    // 更新session相关字段，但保留profile数据
                    if (this.user) {
                        this.user = {
                            ...this.user,
                            ...session.user,
                            // 确保user_id字段不被覆盖
                            user_id: this.user.user_id || session.user.id,
                            // 保留原有role对象
                            role: this.user.role
                        };
                        this.setUser(this.user);
                    }
                }
            } else {
                // 无有效会话
                this.user = null;
            }

            // 监听认证状态变化
            supabase.auth.onAuthStateChange(async (event, session) => {
                this.session = session

                if (session?.user) {
                    const currentUser = this.getUser();

                    if (event === 'SIGNED_IN') {
                        if (currentUser) {
                            // 会话刷新情况：保留当前用户所有信息，仅更新session相关字段
                            this.user = {
                                ...currentUser,
                                // 只更新这些session相关字段
                                aud: session.user.aud,
                                // 确保不覆盖重要字段
                                user_id: currentUser.user_id || session.user.id,
                                role_id: currentUser.role_id,
                                role: currentUser.role
                            };
                            this.setUser(this.user);
                            // 更新roleId，确保权限检查正常工作
                            if (currentUser.role_id !== undefined && currentUser.role_id !== null) {
                                this.setRoleId(currentUser.role_id);
                            }
                        } else {
                            // 真正的新登录，从服务器获取完整资料
                            if (session.user.id) {
                                await this.fetchUserProfile(session.user.id);
                            }
                        }
                    } else if (currentUser) {
                        // 其他认证状态变化，保留profile数据

                        this.user = {
                            ...currentUser,
                            ...session.user,
                            user_id: currentUser.user_id || session.user.id,
                            role_id: currentUser.role_id,
                            role: currentUser.role
                        };
                        this.setUser(this.user);
                    } else {
                        // 没有本地数据，设置基本用户信息
                        this.user = session.user as UserProfile;
                        // 尝试获取用户资料
                        if (session.user.id) {
                            await this.fetchUserProfile(session.user.id);
                        }
                    }
                } else if (event === 'SIGNED_OUT') {
                    // 登出时清除数据
                    this.user = null;
                    this.setUser(null);
                }
            })
        },

        async login(email: string, password: string) {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (data.session) {
                    this.session = data.session
                    this.user = data.session.user as UserProfile

                    // 登录成功后立即获取用户资料
                    const { data: userInfo, error: userError } = await this.fetchUserProfile(data.session.user.id)
                    if (userInfo && userInfo[0]) {
                        if (userInfo[0].role_id == null) {
                            ElMessage.warning('请联系管理员分配角色')
                            //返回到登录页面
                            router.push('/login')
                            return
                        }
                        ElMessage.success('登录成功！')
                        // 确保user_id字段被正确设置
                        this.user = {
                            ...this.user,
                            full_name: userInfo[0].full_name,
                            role_id: userInfo[0].role_id,
                            address: userInfo[0].address,
                            user_id: userInfo[0].user_id || data.session.user.id, // 确保user_id存在
                            phone_number: userInfo[0].phone_number,
                            bio: userInfo[0].bio,
                            department: userInfo[0].department,
                            avatar_url: userInfo[0].avatar_url
                        }

                        // 显式保存到localStorage
                        this.setUser(this.user)

                        // 获取角色详情
                        await this.fetchUserRole();
                    }
                } else {
                    // 处理错误
                    ElMessage.error('登录失败，请检查邮箱和密码')
                }
                return { data, error }
            } catch (err: any) {
                ElMessage.error(`登录失败: ${err.message || '未知错误'}`);
                return { data: null, error: err };
            }
        },

        async logout() {
            const { error } = await supabase.auth.signOut()
            if (!error) {
                this.session = null
                this.user = null
                localStorage.removeItem('user')
                localStorage.removeItem('roleId')
                localStorage.removeItem('category')
                ElMessage.warning('已退出登录！')
            }
            return { error }
        },

        // 注册方法
        async register(userData: { username: string; email: string; password: string, bio: string }) {
            try {
                // 1. 创建认证用户
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: userData.email,
                    password: userData.password,
                })

                if (authError) {
                    ElMessage.error(`注册失败: ${authError.message}`)
                    return { error: authError }
                }

                if (!authData.user) {
                    ElMessage.error('注册失败: 用户创建失败')
                    return { error: new Error('用户创建失败') }
                }

                // 2. 创建用户资料
                const { data: profileData, error: profileError } = await supabase
                    .from('user_profiles')
                    .insert({
                        user_id: authData.user.id,
                        full_name: userData.username,
                        email: userData.email,
                        role_id: null, // 默认角色ID，可以根据需要调整,
                        bio: userData.bio,
                    })
                    .select()
                    .single()

                if (profileError) {
                    // 如果资料创建失败，尝试删除已创建的用户
                    await supabase.auth.admin.deleteUser(authData.user.id)
                    ElMessage.error(`注册失败: ${profileError.message}`)
                    return { error: profileError }
                }

                // ElMessage.success('注册成功！请检查邮箱验证邮件')
                return { data: { auth: authData, profile: profileData } }

            } catch (error: any) {
                ElMessage.error(`注册失败: ${error.message}`)
                return { error }
            }
        },
        //处理菜单结构
        transformMenus(rawMenus: MenuItem[]): MenuItem[] {
            // 首先按 order_index 排序
            const sortedMenus = [...rawMenus].sort((a, b) => a.order_index - b.order_index)

            // 获取顶级菜单
            const topLevelMenus = sortedMenus.filter(menu => menu.parent_id === null)

            // 为每个顶级菜单添加子菜单
            const result = topLevelMenus.map(menu => ({
                ...menu,
                children: sortedMenus
                    .filter(item => item.parent_id === menu.order_index)
                    .sort((a, b) => a.order_index - b.order_index)
            }))

            return result
        },
        //获取菜单
        async fetchMenus() {
            // 确保用户已登录
            if (!this.session?.access_token) {
                ElMessage.error('请先登录！')
                return { error: new Error('Unauthorized') }
            }

            // 可以在这里添加更多的条件判断

            const { data, error } = await supabase
                .from('menu')
                .select('*')

            if (error) {
                ElMessage.error(`获取菜单失败！错误信息: ${error.message}`)
                return { error }
            }
            this.loadRoleId()
            // 根据角色 ID 筛选菜单
            let filteredMenus = data.filter(menu =>
                !menu.role_ids ||
                (this.roleId !== null && menu.role_ids.includes(this.roleId))
            )
            const category = localStorage.getItem('category')
            if (category) {
                filteredMenus = [...filteredMenus.filter(item => item.category == category), ...filteredMenus.filter(item => item.category == 'all')]

            }
            // 转换菜单结构
            this.menus = this.transformMenus(filteredMenus)
            return { data: this.menus }
        },

        // 获取当前用户的角色详情
        async fetchUserRole() {
            // 修复判断条件，考虑roleId可能为0的情况
            if (!this.user || (this.user.role_id === undefined || this.user.role_id === null)) {
                return { error: new Error('用户未登录或无角色ID') };
            }

            try {
                const roleData = await roleService.getRole(Number(this.user.role_id));

                // 将角色信息添加到用户对象中
                if (roleData && this.user) {
                    // 使用类型断言来明确告诉TypeScript这是安全的
                    (this.user as any).role = roleData;

                    // 更新本地存储
                    localStorage.setItem('user', JSON.stringify(this.user));
                }

                return { data: roleData };
            } catch (error: any) {
                return { error };
            }
        },
    },

    getters: {
        isAuthenticated(): boolean {
            return !!this.user
        },

        getMenus(): MenuItem[] {
            return this.menus
        },

        // 获取当前用户角色
        getUserRole(): Role | null {
            return this.user?.role || null;
        }
    }
})