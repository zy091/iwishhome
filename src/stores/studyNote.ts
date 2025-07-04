export interface StudyNote {
    id: string
    user_id: string
    title: string
    content: string
    created_at: string
    updated_at: string
    admin_reply?: string
    admin_id?: string
    replied_at?: string
    attachment_url?: string
    attachment_name?: string
    attachment_type?: string
}
export interface StudyNoteView {
    note_id: string
    user_id: string
    title: string
    content: string
    note_created_at: string
    note_updated_at: string
    admin_reply?: string
    admin_id?: string
    replied_at?: string
    attachment_url?: string
    attachment_name?: string
    attachment_type?: string
}

export interface CreateStudyNote {
    title: string;
    content: string;
    user_id?: string;  // 可选，因为会在 service 中自动添加
    attachment_url?: string;
    attachment_name?: string;
    attachment_type?: string;
}

export interface UpdateStudyNote {
    title?: string
    content?: string
    admin_reply?: string
    admin_id?: string
    replied_at?: string
}

export interface Profile {
    username: string
    avatar_url?: string
}

// 带用户资料的笔记类型
export interface StudyNoteWithProfile extends StudyNoteView {
    profile?: {
        user_id: string;
        full_name: string;
        email: string;
    }
}

// 为分页新增返回类型
export interface PaginatedNotes {
    data: StudyNoteWithProfile[];
    total: number;  // 总记录数（用于分页显示）
    page: number;
    pageSize: number;
}