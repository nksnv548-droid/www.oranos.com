import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function GET(request: NextRequest) {
 const code=request.nextUrl.searchParams.get("code");
 const rawNext=request.nextUrl.searchParams.get("next");
 const next=rawNext?.startsWith("/")&&!rawNext.startsWith("//")?rawNext:"/account";
 if(code){const jar=await cookies();const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll(){return jar.getAll()},setAll(values){values.forEach(({name,value,options})=>jar.set(name,value,options));}}});const {error}=await supabase.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(next,request.url));}
 return NextResponse.redirect(new URL("/sign-in?error=oauth_callback",request.url));
}
