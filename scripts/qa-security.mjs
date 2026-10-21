import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root=process.cwd();
const walk=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const p=path.join(dir,entry.name);
  if(entry.isDirectory() && !['node_modules','.git','dist'].includes(entry.name)) return walk(p);
  return entry.isFile()?[p]:[];
});
const files=[...walk(path.join(root,'src')),...walk(path.join(root,'public')),...walk(path.join(root,'scripts')),path.join(root,'index.html'),path.join(root,'vercel.json')].filter(fs.existsSync);
const findings=[];
const checks=[];
const add=(name,ok,detail='')=>checks.push({name,ok,detail});
const read=p=>fs.readFileSync(p,'utf8');

const secretPatterns=[
  /sb_secret_[A-Za-z0-9_-]{12,}/,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\n#]+/i,
  /VITE_[A-Z0-9_]*(SERVICE_ROLE|SECRET|PRIVATE|TOKEN)[A-Z0-9_]*\s*=\s*[^\n#]+/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
];
for(const file of files){
  const text=read(file);
  for(const pattern of secretPatterns) if(pattern.test(text)) findings.push(`${path.relative(root,file)} matches ${pattern}`);
}
add('No browser-shipped secret key patterns',findings.length===0,findings.join('; '));
const supabase=read(path.join(root,'src/lib/supabase.js'));
add('Frontend Supabase client uses publishable key only',supabase.includes('VITE_SUPABASE_PUBLISHABLE_KEY')&&!/SERVICE_ROLE|sb_secret_/i.test(supabase));
const indexHtml=read(path.join(root,'index.html'));
add('Strict CSP bootstrap scripts are external rather than inline',!/<script(?![^>]*\bsrc=)(?![^>]*type=["']application\/ld\+json["'])[^>]*>/i.test(indexHtml));
add('Theme bootstrap is served as a same-origin script',indexHtml.includes('<script src="/boot-theme.js"></script>')&&fs.existsSync(path.join(root,'public/boot-theme.js')));
add('Boot image fallback is served as a same-origin script',indexHtml.includes('<script src="/boot-image-fallback.js"></script>')&&fs.existsSync(path.join(root,'public/boot-image-fallback.js')));
const vercel=JSON.parse(read(path.join(root,'vercel.json')));
const headers=vercel.headers?.find(x=>x.source==='/(.*)')?.headers||[];
const headerMap=new Map(headers.map(x=>[x.key.toLowerCase(),x.value]));
for(const [key,value] of [['x-content-type-options','nosniff'],['x-frame-options','DENY'],['referrer-policy','strict-origin-when-cross-origin'],['strict-transport-security','max-age=31536000; includeSubDomains; preload'],['content-security-policy','default-src']]){
  add(`Security header ${key}`,String(headerMap.get(key)||'').includes(value),String(headerMap.get(key)||''));
}
add('CSP blocks inline script attributes',String(headerMap.get('content-security-policy')||'').includes("script-src-attr 'none'"));
add('CSP has frame-ancestors protection',String(headerMap.get('content-security-policy')||'').includes("frame-ancestors 'none'"));
const adminNoindex=vercel.headers?.find(x=>x.source==='/admin/:path*')?.headers?.find(x=>x.key.toLowerCase()==='x-robots-tag')?.value||'';
add('Private admin route is not indexable',adminNoindex.includes('noindex')&&adminNoindex.includes('nofollow'));
const loginNoindex=vercel.headers?.find(x=>x.source==='/login')?.headers?.find(x=>x.key.toLowerCase()==='x-robots-tag')?.value||'';
add('Login route is not indexable',loginNoindex.includes('noindex'));
add('Service worker only caches same-origin runtime assets',/new URL\(request\.url\)\.origin === self\.location\.origin/.test(read(path.join(root,'public/sw.js'))));
add('Service worker bypasses same-origin API responses',read(path.join(root,'public/sw.js')).includes("pathname.startsWith('/api/')")&&/pathname\.startsWith\('\/api\/'\)\) return;/.test(read(path.join(root,'public/sw.js'))));
add('Public JSON CMS table is not directly readable',!read(path.join(root,'supabase/PRODUCTION-BOOTSTRAP-ALL.sql')).includes('create policy "Public can read published site data"') && read(path.join(root,'supabase/PRODUCTION-BOOTSTRAP-ALL.sql')).includes('create policy "Admins can read site data"'));
add('JSON-LD is escaped against script-breakout',/JSON\.stringify\(\{\'@context\':\'https:\/\/schema\.org\'/.test(read(path.join(root,'src/extra-features.jsx'))) && /replace\(\/</.test(read(path.join(root,'src/extra-features.jsx'))));
add('No raw innerHTML usage',!files.some(file=>/\.jsx?$/.test(file)&&/\.innerHTML\s*=/.test(read(file))));
add('JYC Now validates external navigation URLs',read(path.join(root,'src/jyc-now.jsx')).includes('function safeExternalUrl')&&read(path.join(root,'src/jyc-now.jsx')).includes("['http:','https:']"));
add('External navigation rejects embedded URL credentials',read(path.join(root,'src/main.jsx')).includes('u.username||u.password')&&read(path.join(root,'src/jyc-now.jsx')).includes('u.username||u.password')&&read(path.join(root,'src/v14-platform-plus.jsx')).includes('!u.username&&!u.password'));
add('Remote feed URL guard normalizes IPv6 and rejects credentialed URLs',read(path.join(root,'api/jyc-updates.js')).includes("replace(/^\\[|\\]$/g,'')")&&read(path.join(root,'api/jyc-updates.js')).includes("host.startsWith('::ffff:')")&&read(path.join(root,'api/jyc-updates.js')).includes('u.username||u.password'));
add('RPC payloads are not persisted in browser storage',/export function writeSiteCache\(_data\)\s*\{[\s\S]*?remove\(SITE_CACHE_KEY\);\s*remove\(SITE_CACHE_META_KEY\);\s*\}/.test(read(path.join(root,'src/v15-functional.js')))&&! /export function writeSiteCache\(_data\)\s*\{[^}]*localStorage\.setItem/s.test(read(path.join(root,'src/v15-functional.js'))));



add('Session identifier generation never falls back to Math.random',/const uid=\(\)=>\{const cryptoApi=globalThis\.crypto;[\s\S]{0,350}cryptoApi\.getRandomValues\(bytes\)/.test(read(path.join(root,'src/main.jsx')))&&! /Math\.random\(\)/.test(read(path.join(root,'src/main.jsx'))));
add('Session identifiers use Web Crypto with no insecure random fallback',/const uid=\(\)=>\{const cryptoApi=globalThis\.crypto;[\s\S]{0,350}cryptoApi\.getRandomValues\(bytes\)/.test(read(path.join(root,'src/main.jsx')))&&! /Math\.random\(\)/.test(read(path.join(root,'src/main.jsx'))));
add('Pageview local storage rejects malformed shapes and invalid counters',/const parsed=JSON\.parse\(storageGet\(key,'\{\}'\)\);[\s\S]{0,650}!Array\.isArray\(parsed\)[\s\S]{0,250}Number\.isSafeInteger\(count\)/.test(read(path.join(root,'src/main.jsx'))));
add('Featured-event announcement is intentionally disabled and cannot render an overlay',/export function FeaturedEventPopup\(\)\s*\{\s*return null;\s*\}/.test(read(path.join(root,'src/featured-event-popup.jsx'))) && !/FEATURED_EVENT_DISMISS_MS|jyc-featured-event-overlay/.test(read(path.join(root,'src/featured-event-popup.jsx'))));
const updatesApi=read(path.join(root,'api/jyc-updates.js'));
const recordGuardMatch=updatesApi.match(/const isRecord=(value=>[^;]+);/);
let recordGuard;
try { if(recordGuardMatch) recordGuard=vm.runInNewContext('('+recordGuardMatch[1]+')'); } catch {}
add('JYC Now record guard behaviour handles objects, null, arrays, and primitives',typeof recordGuard==='function'&&recordGuard({configured:true})===true&&recordGuard(Object.create(null))===true&&recordGuard(null)===false&&recordGuard([])===false&&recordGuard('source')===false&&recordGuard(42)===false);
add('JYC Now record guard is defined before configuration checks',updatesApi.indexOf('const isRecord=value=>value!==null&&typeof value===\'object\'&&!Array.isArray(value);')>=0&&updatesApi.indexOf('const isRecord=')<updatesApi.indexOf('const hasEntries=value=>isRecord(value)'));
add('JYC Now record guard accepts plain objects and rejects null, arrays, and primitives',/const isRecord=value=>value!==null&&typeof value===\'object\'&&!Array.isArray\(value\);/.test(updatesApi)&&updatesApi.includes('const hasEntries=value=>isRecord(value)&&Object.keys(value).length>0;'));
add('Updates API validates remote URLs before persistence and requires HTTPS RSS sources',read(path.join(root,'api/jyc-updates.js')).includes('const safeRemoteUrl=')&&read(path.join(root,'api/jyc-updates.js')).includes("169.254.169.254")&&read(path.join(root,'api/jyc-updates.js')).includes("safeHttpsUrl(feedUrl)")&&read(path.join(root,'api/jyc-updates.js')).includes("new URL(safe).protocol==='https:'"));
add('Updates API bounds and validates remote and persisted records before response',read(path.join(root,'api/jyc-updates.js')).includes('const sanitizeItem=row=>')&&read(path.join(root,'api/jyc-updates.js')).includes('const sanitizeItems=rows=>')&&read(path.join(root,'api/jyc-updates.js')).includes('return sanitizeItems(rows)')&&read(path.join(root,'api/jyc-updates.js')).includes('sanitizeItems(collected.items)'));
const submission=read(path.join(root,'supabase/functions/public-submission/index.ts'));
const projectSubmissionMigration=read(path.join(root,'supabase/migrations/20261015171000_restrict_public_project_submission_to_edge_function.sql'));
const bootstrapSql=read(path.join(root,'supabase/PRODUCTION-BOOTSTRAP-ALL.sql'));
const clientSourceFiles=walk(path.join(root,'src'));
add('Public project submissions cannot bypass server-side rate limiting',projectSubmissionMigration.includes('DROP POLICY IF EXISTS "public submit projects" ON public.jyc_project_submissions;')&&projectSubmissionMigration.includes('REVOKE INSERT ON TABLE public.jyc_project_submissions FROM PUBLIC, anon, authenticated;')&&submission.includes('jyc_allow_public_submission')&&submission.includes("p_limit:type==='project'?4:6")&&!clientSourceFiles.some(file=>/from\(['"]jyc_project_submissions['"]\)\s*\.\s*(?:insert|upsert)\(/.test(read(file)))&&bootstrapSql.includes('revoke insert on public.jyc_project_submissions from public, anon, authenticated'));
add('Rate-limit fingerprint prefers trusted edge IP data over spoofable first forwarding entries',submission.includes("req.headers.get('cf-connecting-ip')")&&submission.includes("forwarded.at(-1)")&&!submission.includes("split(',')[0].trim()"));
add('Public submissions always allow the canonical production origin alongside configured origins',submission.includes("'https://jyc-website-eight.vercel.app'")&&submission.includes('configuredOrigins')&&submission.includes('...configuredOrigins')&&submission.includes('SITE_ORIGINS')&&submission.includes('SITE_ORIGIN')&&submission.includes('if(!allowedOrigin(origin)'));
add('Public project submissions reject credentialed and malformed URLs',submission.includes('const validUrl=(v:string)=>')&&submission.includes("!u.username&&!u.password")&&submission.includes("/[\\u0000-\\u001f\\u007f]/"));
const galleryGrantMigration=read(path.join(root,'supabase/migrations/20261017000000_restrict_public_gallery_table_grants.sql'));
add('Direct public gallery reads require rights clearance and reviewed focal points',galleryGrantMigration.includes('DROP POLICY IF EXISTS "public read approved gallery" ON public.jyc_gallery_items;')&&galleryGrantMigration.includes("rights_status = 'cleared'")&&galleryGrantMigration.includes('focal_x IS NOT NULL')&&galleryGrantMigration.includes('focal_y IS NOT NULL')&&galleryGrantMigration.includes("media_kind = 'photo'")&&galleryGrantMigration.includes("NULLIF(public_url, '') IS NOT NULL")&&bootstrapSql.includes("using (status='approved' and media_kind='photo' and rights_status='cleared' and focal_x is not null and focal_y is not null and nullif(public_url,'') is not null)"));
add('Anonymous gallery role has read-only table grants in migration and production bootstrap',galleryGrantMigration.includes('REVOKE ALL PRIVILEGES ON TABLE public.jyc_gallery_items FROM anon;')&&galleryGrantMigration.includes('REVOKE ALL PRIVILEGES ON TABLE public.jyc_media_albums FROM anon;')&&galleryGrantMigration.includes('GRANT SELECT ON TABLE public.jyc_gallery_items TO anon;')&&galleryGrantMigration.includes('GRANT SELECT ON TABLE public.jyc_media_albums TO anon;')&&bootstrapSql.includes('REVOKE ALL PRIVILEGES ON TABLE public.jyc_gallery_items FROM anon;')&&bootstrapSql.includes('REVOKE ALL PRIVILEGES ON TABLE public.jyc_media_albums FROM anon;'));
add('Authenticated gallery admin retains RLS-governed CRUD without DDL grants',galleryGrantMigration.includes('REVOKE REFERENCES, TRIGGER ON TABLE public.jyc_gallery_items FROM authenticated;')&&galleryGrantMigration.includes('REVOKE REFERENCES, TRIGGER ON TABLE public.jyc_media_albums FROM authenticated;')&&bootstrapSql.includes('REVOKE REFERENCES, TRIGGER ON TABLE public.jyc_gallery_items FROM authenticated;')&&bootstrapSql.includes('REVOKE REFERENCES, TRIGGER ON TABLE public.jyc_media_albums FROM authenticated;')&&bootstrapSql.includes('create policy "admins manage gallery"')&&bootstrapSql.includes('create policy "admins manage albums"'));
if(checks.some(x=>!x.ok)){for(const c of checks)console.log(`${c.ok?'PASS':'FAIL'}: ${c.name}${c.detail?` — ${c.detail}`:''}`);process.exit(1)}
for(const c of checks)console.log(`PASS: ${c.name}${c.detail?` — ${c.detail}`:''}`);
console.log(`SECURITY QA PASS (${checks.length} checks)`);
