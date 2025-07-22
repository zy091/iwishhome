import{s as _,u as c,a8 as p}from"./index-w0Vcq8R-.js";const z={async getAssignments(r=1,a=10,e){const i=c();if(!i.user)throw new Error("用户未登录");const{data:n}=await _.from("user_profiles").select("organization_id, organization_parent_id, role_id").eq("user_id",i.user.user_id).single();if(!(n!=null&&n.organization_id))throw new Error("用户未加入组织");const t=n.role_id===0;if(e!=null&&e.query){const s=_.from("user_profiles").select("user_id").ilike("full_name",`%${e.query}%`);t||s.eq("organization_id",n.organization_id);const{data:u}=await s,d=(u==null?void 0:u.map(m=>m.user_id))||[];let o=_.from("assignments").select(`
                    *,
                    creator_profile:user_profiles!created_by(full_name, email),
                    assignee_profile:user_profiles!assigned_to(full_name, email),
                    replies:assignment_replies(*, profile:user_profiles(full_name, email))
                `,{count:"exact"});if(t||(o=o.eq("organization_id",n.organization_id)),d.length>0?o=o.or(`title.ilike.%${e.query}%,assigned_to.in.(${d.join(",")})`):o=o.ilike("title",`%${e.query}%`),e!=null&&e.startDate&&(e!=null&&e.endDate)){const{startUTC:m,endUTC:f}=p(e.startDate,e.endDate);o=o.gte("created_at",m).lte("created_at",f)}((e==null?void 0:e.status)==="replied"||(e==null?void 0:e.status)==="pending")&&(o=o.not("replies","is",null));const{data:l,error:g,count:w}=await o.order("created_at",{ascending:!1}).range((r-1)*a,r*a-1);if(g)throw g;return{data:l,total:w||0}}else{let s=_.from("assignments").select(`
                    *,
                    creator_profile:user_profiles!created_by(full_name, email),
                    assignee_profile:user_profiles!assigned_to(full_name, email),
                    replies:assignment_replies(*, profile:user_profiles(full_name, email))
                `,{count:"exact"});if(t||(s=s.eq("organization_id",n.organization_id)),e!=null&&e.startDate&&(e!=null&&e.endDate)){const{startUTC:l,endUTC:g}=p(e.startDate,e.endDate);s=s.gte("created_at",l).lte("created_at",g)}((e==null?void 0:e.status)==="replied"||(e==null?void 0:e.status)==="pending")&&(s=s.not("replies","is",null));const{data:u,error:d,count:o}=await s.order("created_at",{ascending:!1}).range((r-1)*a,r*a-1);if(d)throw d;return{data:u,total:o||0}}},async getOrganizationMembers(){const r=c();if(!r.user)throw new Error("用户未登录");const{data:a}=await _.from("user_profiles").select("organization_id, organization_parent_id, role_id").eq("user_id",r.user.user_id).single();if(console.log("当前用户profile:",a),!(a!=null&&a.organization_id))throw new Error("用户未加入组织");if(a.role_id===0){console.log("超级管理员，查询所有用户");const{data:i,error:n}=await _.from("user_profiles").select(`
                    user_id,
                    role_id,
                    full_name,
                    email,
                    organization_id,
                    organization_path
                `).neq("user_id",r.user.user_id);if(console.log("超级管理员查询结果:",i),n)throw console.error("超级管理员查询错误:",n),n;return i}else{console.log("非超级管理员，查询本组织成员:",a.organization_id);const{data:i,error:n}=await _.from("user_profiles").select(`
                    user_id,
                    role_id,
                    full_name,
                    email,
                    organization_id,
                    organization_path
                `).eq("organization_id",a.organization_id).neq("user_id",r.user.user_id);if(console.log("非超级管理员查询结果:",i),n)throw console.error("非超级管理员查询错误:",n),n;return i}},async createAssignment(r){const a=c();if(!a.user)throw new Error("用户未登录");const{data:e}=await _.from("user_profiles").select("organization_id, organization_parent_id").eq("user_id",a.user.user_id).single();if(!(e!=null&&e.organization_id))throw new Error("用户未加入组织");const{data:i,error:n}=await _.from("assignments").insert({...r,created_by:a.user.user_id,organization_id:e.organization_id,organization_parent_id:e.organization_parent_id}).select(`
                *,
                creator_profile:user_profiles!created_by(full_name, email),
                assignee_profile:user_profiles!assigned_to(full_name, email)
            `).single();if(n)throw n;return i},async addReply(r){const a=c();if(!a.user)throw new Error("用户未登录");const{data:e,error:i}=await _.from("assignment_replies").insert({...r,user_id:a.user.user_id,full_name:a.user.full_name||""}).select(`
                *,
                profile:user_profiles(full_name, email)
            `).single();if(i)throw i;return e},async getAssignmentById(r){const{data:a,error:e}=await _.from("assignments").select(`
                *,
                creator_profile:user_profiles!created_by(full_name, email),
                assignee_profile:user_profiles!assigned_to(full_name, email),
                replies:assignment_replies(*, profile:user_profiles(full_name, email))
            `).eq("id",r).single();if(e)throw e;return a},async getPersonalAssignments(r=1,a=10,e){const i=c();if(!i.user)throw new Error("用户未登录");const n=i.user.user_id;let t=_.from("assignments").select(`
                *,
                creator_profile:user_profiles!created_by(full_name, email),
                assignee_profile:user_profiles!assigned_to(full_name, email),
                replies:assignment_replies(*, profile:user_profiles(full_name, email))
            `,{count:"exact"}).eq("assigned_to",n);if(e!=null&&e.query&&(t=t.ilike("title",`%${e.query}%`)),e!=null&&e.startDate&&(e!=null&&e.endDate)){const{startUTC:o,endUTC:l}=p(e.startDate,e.endDate);t=t.gte("created_at",o).lte("created_at",l)}((e==null?void 0:e.status)==="replied"||(e==null?void 0:e.status)==="pending")&&(t=t.not("replies","is",null));const{data:s,error:u,count:d}=await t.order("created_at",{ascending:!1}).range((r-1)*a,r*a-1);if(u)throw u;return{data:s,total:d||0}},async deleteAssignment(r){const{error:a}=await _.from("assignments").delete().eq("id",r);if(a)throw a;return!0}};export{z as a};
