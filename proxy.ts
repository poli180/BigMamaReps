import {NextResponse,type NextRequest} from 'next/server';
import {cookieName,verifySession} from './lib/session';
export async function proxy(req:NextRequest){if(req.nextUrl.pathname==='/admin/login')return NextResponse.next();if(!await verifySession(req.cookies.get(cookieName)?.value))return NextResponse.redirect(new URL('/admin/login',req.url));return NextResponse.next();}
export const config={matcher:['/admin/:path*']};
