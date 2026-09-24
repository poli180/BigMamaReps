import {jwtVerify,SignJWT} from 'jose';
export const cookieName='bmr-admin';
function key(){const secret=process.env.NEXTAUTH_SECRET;if(!secret || secret.length<32)throw new Error('Admin-Secret fehlt oder ist zu kurz');return new TextEncoder().encode(secret);}
export async function verifySession(token?:string){if(!token)return false;try{const {payload}=await jwtVerify(token,key(),{issuer:'bigmamareps',audience:'admin'});return payload.role==='admin'&&payload.sub===process.env.ADMIN_EMAIL;}catch{return false;}}
export async function signSession(){return new SignJWT({role:'admin'}).setProtectedHeader({alg:'HS256'}).setSubject(process.env.ADMIN_EMAIL!).setIssuer('bigmamareps').setAudience('admin').setIssuedAt().setExpirationTime('8h').sign(key());}
