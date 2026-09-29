import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
 const jar=await cookies(); const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(url&&key){const supabase=createServerClient(url,key,{cookies:{getAll(){return jar.getAll();},setAll(values){values.forEach(({name,value,options})=>jar.set(name,value,options));}}});await supabase.auth.signOut();}
 return NextResponse.redirect(new URL("/sign-in",request.url),303);
}