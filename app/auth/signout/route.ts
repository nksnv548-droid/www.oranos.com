import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
export async function POST(request: Request) {
 const jar=await cookies(); const { url, key } = getSupabaseConfig();
 const supabase=createServerClient(url,key,{cookies:{getAll(){return jar.getAll();},setAll(values){values.forEach(({name,value,options})=>jar.set(name,value,options));}}});
 await supabase.auth.signOut();
 return NextResponse.redirect(new URL("/sign-in",request.url),303);
}