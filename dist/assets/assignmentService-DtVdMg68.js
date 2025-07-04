import{s,u as g,a7 as m}from"./index-CF7jzyo9.js";const z={async getAssignments(n=1,a=10,e){const t=g();if(!t.user)throw new Error("用户未登录");const{data:i}=await s.from("user_profiles").select("organization_id, organization_parent_id").eq("user_id",t.user.user_id).single();if(!(i!=null&&i.organization_parent_id))throw new Error("用户未关联上级组织");if(e!=null&&e.query){const{data:r}=await s.from("user_profiles").select("user_id").ilike("full_name",`%${e.query}%`).eq("organization_parent_id",i.organization_parent_id),_=(r==null?void 0:r.map(c=>c.user_id))||[];let o=s.from("assignments").select(`
                    *,
                    creator_profile:user_profiles!created_by(full_name, email),
                    assignee_profile:user_profiles!assigned_to(full_name, email),
                    replies:assignment_replies(*, profile:user_profiles(full_name, email))
                `,{count:"exact"}).eq("organization_parent_id",i.organization_parent_id);if(_.length>0?o=o.or(`title.ilike.%${e.query}%,assigned_to.in.(${_.join(",")})`):o=o.ilike("title",`%${e.query}%`),e!=null&&e.startDate&&(e!=null&&e.endDate)){const{startUTC:c,endUTC:p}=m(e.startDate,e.endDate);o=o.gte("created_at",c).lte("created_at",p)}((e==null?void 0:e.status)==="replied"||(e==null?void 0:e.status)==="pending")&&(o=o.not("replies","is",null));const{data:d,error:u,count:l}=await o.order("created_at",{ascending:!1}).range((n-1)*a,n*a-1);if(u)throw u;return{data:d,total:l||0}}else{let r=s.from("assignments").select(`
                    *,
                    creator_profile:user_profiles!created_by(full_name, email),
                    assignee_profile:user_profiles!assigned_to(full_name, email),
                    replies:assignment_replies(*, profile:user_profiles(full_name, email))
                `,{count:"exact"}).eq("organization_parent_id",i.organization_parent_id);if(e!=null&&e.startDate&&(e!=null&&e.endDate)){const{startUTC:u,endUTC:l}=m(e.startDate,e.endDate);r=r.gte("created_at",u).lte("created_at",l)}((e==null?void 0:e.status)==="replied"||(e==null?void 0:e.status)==="pending")&&(r=r.not("replies","is",null));const{data:_,error:o,count:d}=await r.order("created_at",{ascending:!1}).range((n-1)*a,n*a-1);if(o)throw o;return{data:_,total:d||0}}},async getOrganizationMembers(){const n=g();if(!n.user)throw new Error("用户未登录");const{data:a}=await s.from("user_profiles").select("organization_id, organization_parent_id").eq("user_id",n.user.user_id).single();if(console.log("当前用户profile:",a),!(a!=null&&a.organization_id))throw new Error("用户未加入组织");if(!a.organization_parent_id){console.log("用户没有上级组织ID，尝试使用organization_id代替");const{data:i,error:r}=await s.from("user_profiles").select(`
                    user_id,
                    role_id,
                    full_name,
                    email,
                    organization_id,
                    organization_path
                `).eq("organization_id",a.organization_id).neq("user_id",n.user.user_id);if(console.log("查询结果:",i),r)throw console.error("查询错误:",r),r;return i}console.log("使用organization_parent_id查询:",a.organization_parent_id);const{data:e,error:t}=await s.from("user_profiles").select(`
                user_id,
                role_id,
                full_name,
                email,
                organization_id,
                organization_path
            `).eq("organization_parent_id",a.organization_parent_id).neq("user_id",n.user.user_id);if(console.log("查询结果:",e),t)throw console.error("查询错误:",t),t;if(!e||e.length===0){console.log("没有找到相同parent_id的成员，尝试使用更宽松的条件");const{data:i,error:r}=await s.from("user_profiles").select(`
                    user_id,
                    role_id,
                    full_name,
                    email,
                    organization_id,
                    organization_path
                `).eq("organization_id",a.organization_id).neq("user_id",n.user.user_id);if(console.log("同组织查询结果:",i),r)throw console.error("同组织查询错误:",r),r;return i}return e},async createAssignment(n){const a=g();if(!a.user)throw new Error("用户未登录");const{data:e}=await s.from("user_profiles").select("organization_id, organization_parent_id").eq("user_id",a.user.user_id).single();if(!(e!=null&&e.organization_id))throw new Error("用户未加入组织");const{data:t,error:i}=await s.from("assignments").insert({...n,created_by:a.user.user_id,organization_id:e.organization_id,organization_parent_id:e.organization_parent_id}).select(`
            *,
            creator_profile:user_profiles!created_by(full_name, email),
            assignee_profile:user_profiles!assigned_to(full_name, email)
        `).single();if(i)throw i;return t},async addReply(n){const a=g();if(!a.user)throw new Error("用户未登录");const{data:e,error:t}=await s.from("assignment_replies").insert({...n,user_id:a.user.user_id,full_name:a.user.full_name||""}).select(`
                *,
                profile:user_profiles(full_name, email)
            `).single();if(t)throw t;return e},async getAssignmentById(n){const{data:a,error:e}=await s.from("assignments").select(`
                *,
                creator_profile:user_profiles!created_by(full_name, email),
                assignee_profile:user_profiles!assigned_to(full_name, email),
                replies:assignment_replies(*, profile:user_profiles(full_name, email))
            `).eq("id",n).single();if(e)throw e;return a},async getPersonalAssignments(n=1,a=10,e){const t=g();if(!t.user)throw new Error("用户未登录");const i=t.user.user_id;let r=s.from("assignments").select(`
                *,
                creator_profile:user_profiles!created_by(full_name, email),
                assignee_profile:user_profiles!assigned_to(full_name, email),
                replies:assignment_replies(*, profile:user_profiles(full_name, email))
            `,{count:"exact"}).eq("assigned_to",i);if(e!=null&&e.query&&(r=r.ilike("title",`%${e.query}%`)),e!=null&&e.startDate&&(e!=null&&e.endDate)){const{startUTC:u,endUTC:l}=m(e.startDate,e.endDate);r=r.gte("created_at",u).lte("created_at",l)}((e==null?void 0:e.status)==="replied"||(e==null?void 0:e.status)==="pending")&&(r=r.not("replies","is",null));const{data:_,error:o,count:d}=await r.order("created_at",{ascending:!1}).range((n-1)*a,n*a-1);if(o)throw o;return{data:_,total:d||0,error:o}},async deleteAssignment(n){const{error:a}=await s.from("assignments").delete().eq("id",n);if(a)throw a;return!0}};export{z as a};
