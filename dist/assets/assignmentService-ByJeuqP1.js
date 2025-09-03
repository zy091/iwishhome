import{s as _,u as c,g as p}from"./index-BM5_-GNy.js";const z={async getAssignments(a=1,r=10,e){const t=c();if(!t.user)throw new Error("用户未登录");const{data:n}=await _.from("user_profiles").select("organization_id, organization_parent_id, role_id").eq("user_id",t.user.user_id).single();if(!(n!=null&&n.organization_id))throw new Error("用户未加入组织");const i=n.role_id===0;if(e!=null&&e.query){const s=_.from("user_profiles").select("user_id").ilike("full_name",`%${e.query}%`);i||s.eq("organization_id",n.organization_id);const{data:l}=await s,d=(l==null?void 0:l.map(m=>m.user_id))||[];let o=_.from("assignments").select(`
                    *,
                    creator_profile:user_profiles!created_by(full_name, email),
                    assignee_profile:user_profiles!assigned_to(full_name, email),
                    replies:assignment_replies(*, profile:user_profiles(full_name, email))
                `,{count:"exact"});if(i||(o=o.eq("organization_id",n.organization_id)),d.length>0?o=o.or(`title.ilike.%${e.query}%,assigned_to.in.(${d.join(",")})`):o=o.ilike("title",`%${e.query}%`),e!=null&&e.startDate&&(e!=null&&e.endDate)){const{startUTC:m,endUTC:y}=p(e.startDate,e.endDate);o=o.gte("created_at",m).lte("created_at",y)}((e==null?void 0:e.status)==="replied"||(e==null?void 0:e.status)==="pending")&&(o=o.not("replies","is",null));const{data:u,error:g,count:w}=await o.order("created_at",{ascending:!1}).range((a-1)*r,a*r-1);if(g)throw g;return{data:u,total:w||0}}else{let s=_.from("assignments").select(`
                    *,
                    creator_profile:user_profiles!created_by(full_name, email),
                    assignee_profile:user_profiles!assigned_to(full_name, email),
                    replies:assignment_replies(*, profile:user_profiles(full_name, email))
                `,{count:"exact"});if(i||(s=s.eq("organization_id",n.organization_id)),e!=null&&e.startDate&&(e!=null&&e.endDate)){const{startUTC:u,endUTC:g}=p(e.startDate,e.endDate);s=s.gte("created_at",u).lte("created_at",g)}((e==null?void 0:e.status)==="replied"||(e==null?void 0:e.status)==="pending")&&(s=s.not("replies","is",null));const{data:l,error:d,count:o}=await s.order("created_at",{ascending:!1}).range((a-1)*r,a*r-1);if(d)throw d;return{data:l,total:o||0}}},async getOrganizationMembers(){const a=c();if(!a.user)throw new Error("用户未登录");const{data:r}=await _.from("user_profiles").select("organization_id, organization_parent_id, role_id").eq("user_id",a.user.user_id).single();if(console.log("当前用户profile:",r),!(r!=null&&r.organization_id))throw new Error("用户未加入组织");if(r.role_id===0){console.log("超级管理员，查询所有用户");const{data:t,error:n}=await _.from("user_profiles").select(`
                    user_id,
                    role_id,
                    full_name,
                    email,
                    organization_id,
                    organization_path
                `).neq("user_id",a.user.user_id);if(console.log("超级管理员查询结果:",t),n)throw console.error("超级管理员查询错误:",n),n;return t}else{console.log("非超级管理员，查询本组织成员:",r.organization_id);const{data:t,error:n}=await _.from("user_profiles").select(`
                    user_id,
                    role_id,
                    full_name,
                    email,
                    organization_id,
                    organization_path
                `).eq("organization_id",r.organization_id).neq("user_id",a.user.user_id);if(console.log("非超级管理员查询结果:",t),n)throw console.error("非超级管理员查询错误:",n),n;return t}},async createAssignment(a){const r=c();if(!r.user)throw new Error("用户未登录");const{data:e}=await _.from("user_profiles").select("organization_id, organization_parent_id, role_id").eq("user_id",r.user.user_id).single();if(!((e==null?void 0:e.role_id)===0)&&!(e!=null&&e.organization_id))throw new Error("用户未加入组织");const{data:n,error:i}=await _.from("assignments").insert({...a,created_by:r.user.user_id,organization_id:(e==null?void 0:e.organization_id)||null,organization_parent_id:(e==null?void 0:e.organization_parent_id)||null}).select(`
            *,
            creator_profile:user_profiles!created_by(full_name, email),
            assignee_profile:user_profiles!assigned_to(full_name, email)
        `).single();if(i)throw i;return n},async addReply(a){const r=c();if(!r.user)throw new Error("用户未登录");const{data:e,error:t}=await _.from("assignment_replies").insert({...a,user_id:r.user.user_id,full_name:r.user.full_name||""}).select(`
                *,
                profile:user_profiles(full_name, email)
            `).single();if(t)throw t;return e},async getAssignmentById(a){const{data:r,error:e}=await _.from("assignments").select(`
                *,
                creator_profile:user_profiles!created_by(full_name, email),
                assignee_profile:user_profiles!assigned_to(full_name, email),
                replies:assignment_replies(*, profile:user_profiles(full_name, email))
            `).eq("id",a).single();if(e)throw e;return r},async getPersonalAssignments(a=1,r=10,e){const t=c();if(!t.user)throw new Error("用户未登录");const n=t.user.user_id;console.log("获取个人作业，用户ID:",n);try{let i=_.from("assignments").select(`
                *,
                    creator_profile:user_profiles!created_by(full_name, email, role_id),
                assignee_profile:user_profiles!assigned_to(full_name, email),
                replies:assignment_replies(*, profile:user_profiles(full_name, email))
            `,{count:"exact"}).eq("assigned_to",n);if(console.log("查询条件: assigned_to =",n),e!=null&&e.query&&(i=i.ilike("title",`%${e.query}%`),console.log("添加标题搜索:",e.query)),e!=null&&e.startDate&&(e!=null&&e.endDate)){const{startUTC:o,endUTC:u}=p(e.startDate,e.endDate);i=i.gte("created_at",o).lte("created_at",u),console.log("添加日期范围:",o,"到",u)}(e==null?void 0:e.status)==="replied"?(i=i.not("replies","is",null),console.log("过滤状态: 已回复")):(e==null?void 0:e.status)==="pending"&&(i=i.not("replies","is",null),console.log("过滤状态: 待回复"));const{data:s,error:l,count:d}=await i.order("created_at",{ascending:!1}).range((a-1)*r,a*r-1);if(l)throw console.error("查询个人作业失败:",l),l;return console.log("查询到的作业数量:",s==null?void 0:s.length,"总数:",d),console.log("作业详情:",s==null?void 0:s.map(o=>{var u;return{id:o.id,title:o.title,created_by:o.created_by,assigned_to:o.assigned_to,creator_role:(u=o.creator_profile)==null?void 0:u.role_id}})),{data:s||[],total:d||0}}catch(i){throw console.error("获取个人作业失败:",i),i}},async deleteAssignment(a){const{error:r}=await _.from("assignments").delete().eq("id",a);if(r)throw r;return!0}};export{z as a};
