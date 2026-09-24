import {compare} from 'bcryptjs';
import {cookies} from 'next/headers';
import {z} from 'zod';
import {apiError,checkOrigin,ApiError} from '@/lib/auth';
import {signSession,cookieName} from '@/lib/session';
import {limit} from '@/lib/limits';
export async function POST(req:Request){try{checkOrigin(req);if(!process.env.DATABASE_URL||!process.env.ADMIN_EMAIL||!process.env.ADMIN_PASSWORD_HASH||!process.env.NEXTAUTH_SECRET)throw new ApiError('Admin-Zugang ist noch nicht konfiguriert.',503);const input=z.object({email:z.email().max(254),password:z.string().min(1).max(200)}).parse(await req.json());await limit('admin-login',30);await limit('admin:'+input.email.toLowerCase(),8);const valid=await compare(input.password,process.env.ADMIN_PASSWORD_HASH);if(!valid||input.email.toLowerCase()!==process.env.ADMIN_EMAIL.toLowerCase())throw new ApiError('E-Mail oder Passwort ist falsch.',401);(await cookies()).set(cookieName,await signSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:8*3600});return Response.json({ok:true});}catch(e){return apiError(e);}}
