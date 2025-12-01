import{s as _,u as c,j as p}from"./index-BID3odBW.js";const z={async getAssignments(n=1,r=10,e){const s=c();if(!s.user)throw new Error("用户未登录");const{data:o}=await _.from("user_profiles").select("organization_id, organization_parent_id, role_id").eq("user_id",s.user.user_id).single();if(!(o!=null&&o.organization_id))throw new Error("用户未加入组织");const i=o.role_id===0;if(e!=null&&e.query){const t=_.from("user_profiles").select("user_id").ilike("full_name",`%${e.query}%`);i||t.eq("organization_id",o.organization_id);const{data:u}=await t,l=(u==null?void 0:u.map(m=>m.user_id))||[];let a=_.from("assignments").select(`
                    *,
                    creator_profile:user_profiles!created_by(full_name, email),
                    assignee_profile:user_profiles!assigned_to(full_name, email),
                    replies:assignment_replies(*, profile:user_profiles(full_name, email))
                `,{count:"exact"});if(i||(a=a.eq("organization_id",o.organization_id)),l.length>0?a=a.or(`title.ilike.%${e.query}%,assigned_to.in.(${l.join(",")})`):a=a.ilike("title",`%${e.query}%`),e!=null&&e.startDate&&(e!=null&&e.endDate)){const{startUTC:m,endUTC:y}=p(e.startDate,e.endDate);a=a.gte("created_at",m).lte("created_at",y)}((e==null?void 0:e.status)==="replied"||(e==null?void 0:e.status)==="pending")&&(a=a.not("replies","is",null));const{data:d,error:g,count:w}=await a.order("created_at",{ascending:!1}).range((n-1)*r,n*r-1);if(g)throw g;return{data:d,total:w||0}}else{let t=_.from("assignments").select(`
                    *,
                    creator_profile:user_profiles!created_by(full_name, email),
                    assignee_profile:user_profiles!assigned_to(full_name, email),
                    replies:assignment_replies(*, profile:user_profiles(full_name, email))
                `,{count:"exact"});if(i||(t=t.eq("organization_id",o.organization_id)),e!=null&&e.startDate&&(e!=null&&e.endDate)){const{startUTC:d,endUTC:g}=p(e.startDate,e.endDate);t=t.gte("created_at",d).lte("created_at",g)}((e==null?void 0:e.status)==="replied"||(e==null?void 0:e.status)==="pending")&&(t=t.not("replies","is",null));const{data:u,error:l,count:a}=await t.order("created_at",{ascending:!1}).range((n-1)*r,n*r-1);if(l)throw l;return{data:u,total:a||0}}},async getOrganizationMembers(){const n=c();if(!n.user)throw new Error("用户未登录");const{data:r}=await _.from("user_profiles").select("organization_id, organization_parent_id, role_id").eq("user_id",n.user.user_id).single();if(!(r!=null&&r.organization_id))throw new Error("用户未加入组织");if(r.role_id===0){const{data:s,error:o}=await _.from("user_profiles").select(`
                    user_id,
                    role_id,
                    full_name,
                    email,
                    organization_id,
                    organization_path
                `).neq("user_id",n.user.user_id);if(o)throw console.error("超级管理员查询错误:",o),o;return s}else{const{data:s,error:o}=await _.from("user_profiles").select(`
                    user_id,
                    role_id,
                    full_name,
                    email,
                    organization_id,
                    organization_path
                `).eq("organization_id",r.organization_id).neq("user_id",n.user.user_id);if(o)throw console.error("非超级管理员查询错误:",o),o;return s}},async createAssignment(n){const r=c();if(!r.user)throw new Error("用户未登录");const{data:e}=await _.from("user_profiles").select("organization_id, organization_parent_id, role_id").eq("user_id",r.user.user_id).single();if(!((e==null?void 0:e.role_id)===0)&&!(e!=null&&e.organization_id))throw new Error("用户未加入组织");const{data:o,error:i}=await _.from("assignments").insert({...n,created_by:r.user.user_id,organization_id:(e==null?void 0:e.organization_id)||null,organization_parent_id:(e==null?void 0:e.organization_parent_id)||null}).select(`
            *,
            creator_profile:user_profiles!created_by(full_name, email),
            assignee_profile:user_profiles!assigned_to(full_name, email)
        `).single();if(i)throw i;return o},async addReply(n){const r=c();if(!r.user)throw new Error("用户未登录");const{data:e,error:s}=await _.from("assignment_replies").insert({...n,user_id:r.user.user_id,full_name:r.user.full_name||""}).select(`
                *,
                profile:user_profiles(full_name, email)
            `).single();if(s)throw s;return e},async getAssignmentById(n){const{data:r,error:e}=await _.from("assignments").select(`
                *,
                creator_profile:user_profiles!created_by(full_name, email),
                assignee_profile:user_profiles!assigned_to(full_name, email),
                replies:assignment_replies(*, profile:user_profiles(full_name, email))
            `).eq("id",n).single();if(e)throw e;return r},async getPersonalAssignments(n=1,r=10,e){const s=c();if(!s.user)throw new Error("用户未登录");const o=s.user.user_id;try{let i=_.from("assignments").select(`
                *,
                    creator_profile:user_profiles!created_by(full_name, email, role_id),
                assignee_profile:user_profiles!assigned_to(full_name, email),
                replies:assignment_replies(*, profile:user_profiles(full_name, email))
            `,{count:"exact"}).eq("assigned_to",o);if(e!=null&&e.query&&(i=i.ilike("title",`%${e.query}%`)),e!=null&&e.startDate&&(e!=null&&e.endDate)){const{startUTC:a,endUTC:d}=p(e.startDate,e.endDate);i=i.gte("created_at",a).lte("created_at",d)}((e==null?void 0:e.status)==="replied"||(e==null?void 0:e.status)==="pending")&&(i=i.not("replies","is",null));const{data:t,error:u,count:l}=await i.order("created_at",{ascending:!1}).range((n-1)*r,n*r-1);if(u)throw console.error("查询个人作业失败:",u),u;return console.log("作业详情:",t==null?void 0:t.map(a=>{var d;return{id:a.id,title:a.title,created_by:a.created_by,assigned_to:a.assigned_to,creator_role:(d=a.creator_profile)==null?void 0:d.role_id}})),{data:t||[],total:l||0}}catch(i){throw console.error("获取个人作业失败:",i),i}},async deleteAssignment(n){const{error:r}=await _.from("assignments").delete().eq("id",n);if(r)throw r;return!0}};export{z as a};
