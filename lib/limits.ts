import {db} from './db';
import {createHash} from 'node:crypto';
import {ApiError} from './auth';
export async function limit(key:string,max:number,minutes=15){const id=createHash('sha256').update(key).digest('hex');const now=new Date();const next=new Date(+now+minutes*60000); const rows=await db.$queryRaw<{attempts:number}[]>`INSERT INTO "RateLimit" (id, attempts, "resetAt") VALUES (${id},1,${next}) ON CONFLICT (id) DO UPDATE SET attempts=CASE WHEN "RateLimit"."resetAt" < ${now} THEN 1 ELSE "RateLimit".attempts+1 END, "resetAt"=CASE WHEN "RateLimit"."resetAt" < ${now} THEN ${next} ELSE "RateLimit"."resetAt" END RETURNING attempts`;if(rows[0].attempts>max)throw new ApiError('Zu viele Versuche. Bitte später erneut versuchen.',429);}
