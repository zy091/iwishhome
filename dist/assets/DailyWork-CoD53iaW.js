import{d as v,r as u,o as k,H as w,I as g,k as x,J as b,l as h,a as t,e as n,K as B,w as l,b as r,f as c,j as V,_ as N}from"./index-DCqMzgSt.js";const C={class:"daily-work"},I={class:"daily-work-content"},R=v({__name:"DailyWork",setup(q){const o=w(),m=u("/system/daily-work/personal-assignments");k(()=>{m.value=o.path});const d=(a,e)=>{console.log(a,e)},s=u(o.query.platform||"google");g(()=>o.query.platform,a=>{s.value=a||"google"},{immediate:!0});const p=x(()=>{switch(s.value){case"google":return"谷歌";case"facebook":return"FaceBook";default:return"谷歌"}}),_=b([{name:`${p.value}优化`,path:`/system/optimize?platform=${s.value}`},{name:"日常作业",path:"/system/daily-work/self-assignment"}]);return(a,e)=>{const i=r("el-menu-item"),f=r("el-menu"),y=r("RouterView");return V(),h("div",C,[t(B,{breadbcrum:_},null,8,["breadbcrum"]),e[2]||(e[2]=n("div",{class:"daily-work-title"},[n("h1",{class:"title"},"日常作业")],-1)),t(f,{"default-active":m.value,class:"el-menu-demo",mode:"horizontal",onSelect:d,router:!0},{default:l(()=>[t(i,{index:"/system/daily-work/personal-assignments"},{default:l(()=>e[0]||(e[0]=[c("我的作业")])),_:1}),t(i,{index:"/system/daily-work/self-assignment"},{default:l(()=>e[1]||(e[1]=[c("自行添加")])),_:1})]),_:1},8,["default-active"]),n("div",I,[t(y)])])}}}),D=N(R,[["__scopeId","data-v-00a85ae1"]]);export{D as default};
