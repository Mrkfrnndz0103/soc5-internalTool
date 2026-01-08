"use strict";(()=>{var e={};e.id=2050,e.ids=[2050],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8678:e=>{e.exports=import("pg")},89176:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.r(t),r.d(t,{originalPathname:()=>A,patchFetch:()=>u,requestAsyncStorage:()=>_,routeModule:()=>l,serverHooks:()=>d,staticGenerationAsyncStorage:()=>c});var a=r(49303),i=r(88716),n=r(60670),s=r(78874),p=e([s]);s=(p.then?(await p)():p)[0];let l=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/lookup/lh-trip/route",pathname:"/api/lookup/lh-trip",filename:"route",bundlePath:"app/api/lookup/lh-trip/route"},resolvedPagePath:"C:\\Users\\phlspxuser\\Documents\\Mrkcde\\Ongoing\\soc5-internalTool\\src\\app\\api\\lookup\\lh-trip\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:_,staticGenerationAsyncStorage:c,serverHooks:d}=l,A="/api/lookup/lh-trip/route";function u(){return(0,n.patchFetch)({serverHooks:d,staticGenerationAsyncStorage:c})}o()}catch(e){o(e)}})},78874:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.r(t),r.d(t,{GET:()=>s});var a=r(87070),i=r(75748),n=e([i]);async function s(e){let{searchParams:t}=new URL(e.url),r=t.get("lhTrip")||t.get("lh_trip"),o=r?.trim().toUpperCase();if(!o)return a.NextResponse.json({error:"lhTrip is required"},{status:400});let n=await (0,i.I)(`SELECT
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
     GROUP BY trip_number`,[o]);return a.NextResponse.json({row:n.rows[0]||null})}i=(n.then?(await n)():n)[0],o()}catch(e){o(e)}})},75748:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.d(t,{I:()=>n});var a=r(8678),i=e([a]);a=(i.then?(await i)():i)[0];let s=process.env.DATABASE_URL;if(!s)throw Error("DATABASE_URL is not set");let p="true"===process.env.DATABASE_SSL,u=globalThis.__pgPool||new a.Pool({connectionString:s,ssl:p?{rejectUnauthorized:!1}:void 0});async function n(e,t){return u.query(e,t)}globalThis.__pgPool||(globalThis.__pgPool=u),o()}catch(e){o(e)}})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[9276,5972],()=>r(89176));module.exports=o})();