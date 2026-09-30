import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "@/lib/supabase/config";
export async function GET(request: NextRequest) {
 const code=request.nextUrl.searchParams.get("code");
 const rawNext=request.nextUrl.searchParams.get("next");
 const next=rawNext?.startsWith("/")&&!rawNext.startsWith("//")?rawNext:"/account";
 if(code){const jar=await cookies();const {url,key}=getSupabaseConfig();const supabase=createServerClient(url,key,{cookies:{getAll(){return jar.getAll()},setAll(values){values.forEach(({name,value,options})=>jar.set(name,value,options));}}});const {error}=await supabase.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(next,request.url));}
 return NextResponse.redirect(new URL("/sign-in?error=oauth_callback",request.url));
}
