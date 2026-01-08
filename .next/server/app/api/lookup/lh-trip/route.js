"use strict";(()=>{var e={};e.id=2050,e.ids=[2050],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},78893:e=>{e.exports=require("buffer")},17702:e=>{e.exports=require("events")},92048:e=>{e.exports=require("fs")},85807:e=>{e.exports=require("module")},55315:e=>{e.exports=require("path")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},6162:e=>{e.exports=require("worker_threads")},8678:e=>{e.exports=import("pg")},92761:e=>{e.exports=require("node:async_hooks")},6005:e=>{e.exports=require("node:crypto")},65714:e=>{e.exports=require("node:diagnostics_channel")},15673:e=>{e.exports=require("node:events")},70612:e=>{e.exports=require("node:os")},49411:e=>{e.exports=require("node:path")},89176:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.r(t),r.d(t,{originalPathname:()=>x,patchFetch:()=>u,requestAsyncStorage:()=>d,routeModule:()=>l,serverHooks:()=>_,staticGenerationAsyncStorage:()=>c});var s=r(49303),i=r(88716),a=r(60670),n=r(78874),p=e([n]);n=(p.then?(await p)():p)[0];let l=new s.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/lookup/lh-trip/route",pathname:"/api/lookup/lh-trip",filename:"route",bundlePath:"app/api/lookup/lh-trip/route"},resolvedPagePath:"C:\\Users\\phlspxuser\\Documents\\Mrkcde\\Ongoing\\soc5-internalTool\\src\\app\\api\\lookup\\lh-trip\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:d,staticGenerationAsyncStorage:c,serverHooks:_}=l,x="/api/lookup/lh-trip/route";function u(){return(0,a.patchFetch)({serverHooks:_,staticGenerationAsyncStorage:c})}o()}catch(e){o(e)}})},78874:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.r(t),r.d(t,{GET:()=>u});var s=r(87070),i=r(75748),a=r(95456),n=r(11958),p=e([i,a]);[i,a]=p.then?(await p)():p;let u=(0,n.g)("/api/lookup/lh-trip",async e=>{if(!await (0,a.Gg)())return s.NextResponse.json({error:"Unauthorized"},{status:401});let{searchParams:t}=new URL(e.url),r=t.get("lhTrip")||t.get("lh_trip"),o=r?.trim().toUpperCase();if(!o)return s.NextResponse.json({error:"lhTrip is required"},{status:400});let n=await (0,i.I)(`SELECT
       trip_number AS lh_trip_number,
       NULL::text AS cluster_name,
       MAX(to_dest_station_name) AS station_name,
       NULL::text AS region,
       NULLIF(
         STRING_AGG(DISTINCT to_number, ', ') FILTER (WHERE to_number IS NOT NULL),
         ''
       ) AS count_of_to,
       COALESCE(SUM(to_parcel_quantity), 0)::int AS total_oid_loaded,
       NULL::timestamptz AS actual_docked_time,
       NULL::text AS dock_number,
       MAX(departure_timestamp) AS actual_depart_time,
       NULL::text AS processor_name,
       MAX(vehicle_number) AS plate_number,
       MAX(truck_size) AS fleet_size,
       NULL::text AS assigned_ops_id,
       MAX(dispatch_date) AS source_updated_at,
       MAX(updated_at) AS updated_at
     FROM dispatch_google_sheet_rows
     WHERE trip_number = $1
     GROUP BY trip_number`,[o]);return s.NextResponse.json({row:n.rows[0]||null})});o()}catch(e){o(e)}})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[9276,7936,5456],()=>r(89176));module.exports=o})();