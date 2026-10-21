import React,{lazy,Suspense,useEffect,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {LivingPhoto} from './jyc-living-photo.jsx';
import {createRoot} from 'react-dom/client';
import {createPortal} from 'react-dom';
import {BrowserRouter,Navigate,useLocation,useNavigate} from 'react-router-dom';
import {supabase} from './lib/supabase';
import {uploadJycMedia} from './lib/media.js';
import {jycToast} from './lib/ui';
import './styles/public-entry.css';
import './styles/jyc-experience-system.css';
import './styles/v20-reference-restoration.css';
import './styles/innovation-inspired-3d.css';
import './styles/jyc-design-system.css';
import './styles/jyc-v203-restoration.css';
import {JYCEditorialSystem} from './jyc-editorial-system.jsx';
import {JYC_HUB_CONTENT, JYC_HUB_FAMILIES, hubProfile} from './v21-hub-content.js';
import {JYC_HUB_SOURCE_REGISTRY,JYC_HUB_SOURCE_ONLY} from './jyc-hub-registry.js';
import {JYC_ORIENTATION_FAMILIES,JYC_ORIENTATION_LAYERS,JYC_ORIENTATION_EVENTS,JYC_ORIENTATION_AT_A_GLANCE} from './jyc-orientation-insights.js';
import {hubDetails} from './v23.6-hub-details.js';
import {hubIdentity,eventIdentity} from './hub-identities.js';
import {PDF_HUB_GALLERY,PDF_HUB_STORIES,HUB_PHOTO_MAP} from './pdf-hub-content.js';
import {PDF_HUB_EXTRA_GALLERY,PDF_HUB_PROGRAMME} from './pdf-hub-extra.js';
import {enrichSourceClubs,mergeSourceGallery,sourceHubMedia,sourceEventMedia} from './jyc-source-media.js';
import {JYC_EVENT_CATEGORIES,JYC_COMMUNITY_DISCOVERY,JYC_PUBLIC_ACTIVITIES} from './public-v1/config.js';
import {JYC_SOCIALS,festSocialProfile,socialProfile,is128SocialProfile} from './jyc-socials.js';
import {JYCNowStrip,JYCNowPage,HubLatestUpdates} from './jyc-now.jsx';
import {HISTORY} from './jyc-history-page.jsx';
import {JYCBrandEditorial} from './jyc-next-experience.jsx';
import {JYCEditorialHome} from './jyc-editorial-home.jsx';
import {ResponsivePhoto} from './jyc-responsive-photo.jsx';
import { teamPhotoFor } from './jyc-team-media.js';

import {JYC57Events,JYC57Clubs,JYC57Gallery,JYCBestOf} from './jyc57-experience.jsx';


import {PUBLIC_TEAM_FALLBACK,JAI_OFFICIAL_MEDIA,PUBLIC_GALLERY_FALLBACK,PUBLIC_EVENT_FALLBACK} from './content/jyc-public-fallbacks.js';
import {JYC_EDITORIAL_ACHIEVEMENTS,JYC_TEAM_SOCIALS} from './jyc-editorial-content.js';


const LazyJYCBot=lazy(()=>import('./jyc-bot.jsx').then(m=>({default:m.JYCBot})));
const LazyJYCInnovationMotion=lazy(()=>import('./jyc-innovation-motion.jsx').then(m=>({default:m.JYCInnovationMotion})));
const LazyRubberSegment=lazy(()=>import('./react-bits/JYCMicro.jsx').then(m=>({default:m.RubberSegment})));
const LazyBellToggle=lazy(()=>import('./react-bits/JYCMicro.jsx').then(m=>({default:m.BellToggle})));
const LazyDepthCarousel=lazy(()=>import('./components/react-bits/DepthCarousel.jsx'));
const LazyDriftWall=lazy(()=>import('./components/react-bits/DriftWall.jsx'));
const LazyFlipCard=lazy(()=>import('./components/react-bits/FlipCard.jsx'));
const LazyJYC57Archive=lazy(()=>import('./jyc57-archive.jsx').then(m=>({default:m.JYC57Archive})));






const PUBLIC_ACTIVITIES=JYC_PUBLIC_ACTIVITIES;
function mergePublicFallback(d,{allowContentFallback=true}={}){
 const x=norm(d||{});
 const fallbackClubs=enrichSourceClubs(Object.entries(JYC_HUB_CONTENT).map(([name,p],i)=>({id:'hub-'+slug(name),name,type:p.family==='Technical'?'Technical':'Non-Technical',category:p.focus,description:p.summary,about:p.detail,interests:[p.family,p.focus],published:true,status:'published',pinned:i<5,theme:'jyc'})));
 const baseClubs=allowContentFallback&&x.clubs?.length===0?fallbackClubs:x.clubs;
 const enrichedClubs=enrichSourceClubs(baseClubs).map(club=>{const social=socialProfile(club.name);return social&&is128SocialProfile(social)?{...club,socials:{...(club.socials||{}),instagram:club.socials?.instagram||social.instagram||'',linkedin:club.socials?.linkedin||social.linkedin||'',website:club.socials?.website||social.website||'',instagramHandle:club.socials?.instagramHandle||social.instagramHandle||'',socialVerifiedBy:social.verifiedBy||'',socialVerifiedOn:social.verifiedOn||''}}:club;});
 const existingClubNames=new Set(enrichedClubs.map(c=>String(c.name||'').trim().toLowerCase()));
 const sourceOnlyClubs=JYC_HUB_SOURCE_ONLY.filter(meta=>!existingClubNames.has(meta.name.toLowerCase())).map(meta=>{const p=JYC_HUB_CONTENT[meta.name]||{};return enrichSourceClubs([{id:`hub-${slug(meta.name)}`,name:meta.name,type:p.family==='Technical'?'Technical':'Non-Technical',category:p.focus||p.family,description:p.summary||`${meta.name} is retained in the JYC source ecosystem.`,about:p.detail||'',interests:[p.family,p.focus].filter(Boolean),published:true,status:'source-material',sourceVerification:'source-material',sourceLabel:meta.source,theme:'jyc'}])[0]});
 const clubs=[...enrichedClubs,...sourceOnlyClubs];
 const enrichedTeam=(Array.isArray(x.team)?x.team:[]).map(member=>{const key=Object.keys(JYC_TEAM_SOCIALS).find(n=>n.toLowerCase()===String(member?.name||'').trim().toLowerCase());const social=key?JYC_TEAM_SOCIALS[key]:null;return social?{...member,socials:{...(member.socials||{}),linkedin:member.socials?.linkedin||social.linkedin||''},linkedin:member.linkedin||social.linkedin||'',socialVerifiedBy:social.verifiedBy||'',socialVerifiedOn:social.verifiedOn||''}:member});
 const sourceGallery=mergeSourceGallery(x.gallery);
 const gallery=[...sourceGallery,...JAI_OFFICIAL_MEDIA,...(allowContentFallback?[...PDF_HUB_GALLERY,...PDF_HUB_EXTRA_GALLERY,...PUBLIC_GALLERY_FALLBACK]:[])].filter((g,i,a)=>a.findIndex(x=>x.id===g.id)===i).filter(g=>g&&g.published!==false&&!String(g.url||'').toLowerCase().includes('jyc-01')&&!String(g.url||'').toLowerCase().includes('jyc-02')&&!String(g.url||'').toLowerCase().includes('jyc-03')&&!String(g.url||'').toLowerCase().includes('vamunique-03')&&!String(g.caption||'').toLowerCase().includes('portrait from the supplied archive'));
 const liveEvents=Array.isArray(x.events)?x.events:[];
 const fallbackEvents=allowContentFallback?PUBLIC_EVENT_FALLBACK:[];
 const events=allowContentFallback
   ? [...fallbackEvents,...liveEvents.filter(e=>!fallbackEvents.some(f=>String(f.id)===String(e.id)))]
   : liveEvents;
 const eventsWithVerifiedSources=events.map(event=>{
   const source=festSocialProfile(event.title);
   return source?{
     ...event,
     officialUrl:event.officialUrl||source.website||'',
     officialLinkedIn:event.officialLinkedIn||source.linkedin||'',
     officialSourceLabel:event.officialSourceLabel||source.label||''
   }:event;
 });
 return {...x,clubs,events:eventsWithVerifiedSources,gallery,team:((allowContentFallback&&x.team?.length===0?PUBLIC_TEAM_FALLBACK:enrichedTeam)),homepage:{...x.homepage,activities:Array.isArray(x.homepage?.activities)&&x.homepage.activities.length?x.homepage.activities:PUBLIC_ACTIVITIES}};
}
const QA_FIXTURES=import.meta.env.VITE_JYC_QA_FIXTURES==='true';
function publicDemoData(){
 const clubs=Object.entries(JYC_HUB_CONTENT).map(([name,p],i)=>({id:`hub-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,name,type:p.family==='Technical'?'Technical':'Non-Technical',category:p.focus,description:p.summary,about:p.detail,interests:[p.family,p.focus],published:true,status:'published',pinned:i<5,theme:'jyc'}));
 return mergePublicFallback(norm({...empty,clubs,events:PUBLIC_EVENT_FALLBACK,gallery:PUBLIC_GALLERY_FALLBACK,team:PUBLIC_TEAM_FALLBACK,homepage:{...empty.homepage,activities:PUBLIC_ACTIVITIES}}));
}
import { normalizeSearch, rankSearchResults } from './lib/search.js';
import {CREATOR,CREATORS,JYC_CONTACTS} from './lib/site-config.js';

import {MomentsSection} from './v14-platform.jsx';
import {SkipLink,InstallPrompt,MaintenanceGate,ErrorBoundary,EventTools,DownloadICS,JsonLd,usePageMeta,Gallery,GalleryItems,RecruitmentHub,RegistrationPage} from './extra-features.jsx';
import {readSiteCache,writeSiteCache,siteCacheAge,formatCacheAge,armStoredReminders,googleCalendarUrl,hasLocalReminder,scheduleEventReminder,clearLocalReminder} from './v15-functional.js';

const logo='/assets/jyc-logo.avif';
const logoTiny='/assets/jyc-logo-48.avif';
const logoSmall='/assets/jyc-logo-small.avif';
function LogoImage({alt='',...props}){
 const requestedWidth=Number(props.width??48);
 const portraitPlaceholder=String(props.className||'').includes('team-photo-missing-logo');
 const src=!portraitPlaceholder&&requestedWidth<=48?logoTiny:!portraitPlaceholder&&requestedWidth<=96?logoSmall:logo;
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 if(failed)return <span className={`jyc-logo-fallback ${props.className||''}`.trim()} role="img" aria-label={alt||'JIIT Youth Club logo'}>JYC</span>;
 return <img {...props} src={src} alt={alt} width={props.width??48} height={props.height??48} loading={props.loading??(props.fetchPriority==='high'?'eager':'lazy')} decoding={props.decoding??'async'} onError={event=>{const image=event.currentTarget;const stage=Number(image.dataset.logoFallbackStage||0);if(src===logoTiny&&stage===0){image.dataset.logoFallbackStage='1';image.src=logoSmall;return}if((src===logoTiny||src===logoSmall)&&stage<2){image.dataset.logoFallbackStage='2';image.src=logo;return}if(stage<3){image.dataset.logoFallbackStage='3';image.src='/JYC%20Logo(4).png';return}setFailed(true)}}/>
}
function FooterLogoImage({alt='',...props}){
 const [failed,setFailed]=useState(false);
 if(failed)return <span className={`jyc-logo-fallback ${props.className||''}`.trim()} role="img" aria-label={alt||'JIIT Youth Club logo'}>JYC</span>;
 return <img {...props} src="/assets/jyc-logo-48.avif" alt={alt} width={props.width??48} height={props.height??48} loading={props.loading??'lazy'} decoding={props.decoding??'async'} onError={()=>setFailed(true)}/>;
}
const isFestMode=data=>String(data?.mode||'events').toLowerCase()==='fest';
const recruitmentEnabled=data=>data?.flags?.recruitmentHub!==false;

const uid=()=>{const cryptoApi=globalThis.crypto;if(typeof cryptoApi?.randomUUID==='function')return cryptoApi.randomUUID();if(typeof cryptoApi?.getRandomValues!=='function')throw new Error('Secure random number generation is unavailable');const bytes=new Uint8Array(16);cryptoApi.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')};
const storageGet=(key,fallback=null)=>{try{const value=localStorage.getItem(key);return value===null?fallback:value}catch{return fallback}};
const storageSet=(key,value)=>{try{localStorage.setItem(key,String(value));return true}catch{return false}};
const storageRemove=(key)=>{try{localStorage.removeItem(key);return true}catch{return false}};
const empty={clubs:[],events:[],gallery:[],team:[],categories:{Technical:[], 'Non-Technical':[]},announcement:{on:false,text:'',link:''},maintenance:{on:false,title:'JYC is getting ready.',message:'We’re making a few improvements. Please check back shortly.'},flags:{recruitmentHub:true,pwaInstall:true,eventQr:true,advancedSearch:true,analytics:true},academicCalendar:{public:true,showInCalendar:true,showInSearch:true},mode:'events',fest:null,homepage:{heroEyebrow:'JIIT · SECTOR 128 · NOIDA',heroTitle:'THE VOICE. THE TALENT. THE SPIRIT.',heroSubtitle:'JIIT YOUTH CLUB · JIIT 128',heroLead:'JYC is the student-governed organisation that brings JIIT communities, events, creativity, technology, sport and campus spirit together.',heroPrimaryCta:'Explore Clubs ↗',heroSecondaryCta:"What's Next →",quick1Title:'About JYC',quick1Text:'Know the community →',quick2Title:'Clubs',quick2Text:'Find your community →',quick3Title:'Connect',quick3Text:'Find JYC online →',aboutTitle:'The JYC story belongs here.',aboutText:'JIIT Youth Club (JYC) is the student-led coordinating body for co-curricular life at JIIT Sector 128. It connects the apex student body, hubs and societies, coordinators, volunteers and festival committees so students can discover communities, build skills and create campus experiences together.',principles:[{title:'Student-led, faculty-advised',text:'JYC combines faculty guidance with an apex student body, hub coordinators, volunteers and festival committees.'},{title:'Five community families',text:'The maintained JYC index spans Cultural, Technical, Creative, Literary and Sports families; source status is kept visible where records differ.'},{title:'A year-round campus rhythm',text:'Induction, Ebullience, hackathons, Ethnic Day, Converge, Dron-O-War and Farewell sit alongside recurring hub activities.'}],eventsEyebrow:"WHAT'S NEXT",eventsTitle:'What happens next.',eventsText:'Upcoming experiences stay chronological. Live events surface automatically.',clubsEyebrow:'JYC CLUBS',clubsTitle:'Official JYC clubs.',clubsText:'Technical, non-technical, creative, cultural and everything between.',galleryEyebrow:'GALLERY',galleryTitle:'A visual archive in the making.',galleryText:'Official JYC images will appear here as they are published.',activitiesEyebrow:'WHAT WE DO',activitiesTitle:'Make space for participation.',activitiesText:'See how JYC connects communities, events, creativity and participation.',activities:[],ctaEyebrow:'READY TO SOAR',ctaTitle:'One campus. Many ways to belong.',ctaText:'Explore the public JYC experience and find your next community.',ctaButton:'Explore JYC ↗',jtvUrl:'',compactHome:true,layout:['intro','brandEditorial','ecosystem','routes','hubSignal','updates','events','activities','clubs','moments','photoStory','photoChapters','journal','hubPhotoWall','hubStories','team','cta'],showClubs:true,showEvents:true,showGallery:true},creator:CREATOR,certificates:[],campusMap:{mapUrl:'',locations:[]}};
const clubTemplate={name:'',type:'Technical',category:'',description:'',logo:'',banner:'',about:'',interests:[],instagram:'',whatsapp:'',website:'',linkedin:'',youtube:'',president:'',vicePresident:'',secretary:'',heads:[],recruitment:{on:false,title:'Recruitment Open',link:'',deadline:''},achievements:[],projects:[],customSections:[],theme:'jyc',pinned:false,published:false,status:'draft'};
const eventTemplate={title:'',clubId:'',club:'',eventType:'',poster:'',description:'',date:'',start:'',end:'',venue:'',registrationMode:'external',registrationUrl:'',registrationDeadline:'',map_url:'',contactName:'',contactPhone:'',contactEmail:'',speaker:'',guest:'',highlights:[],rules:[],eligibility:'',prizes:[],faqs:[],galleryIds:[],featured:false,pinned:false,published:false,archived:false};
const isSector128Venue=venue=>/sector\s*128|jiit[-\s]*128|wish\s*town/i.test(String(venue||''));
function norm(d){
  const x=d||{};
  const clubs=Array.isArray(x.clubs)?x.clubs:[];
  const events=Array.isArray(x.events)?x.events:[];
  const gallery=Array.isArray(x.gallery)?x.gallery:[];
  return {
    ...empty,...x,
    clubs,
    events:events.filter(e=>isSector128Venue(e.venue)).map(e=>({...e,club:e.club||clubs.find(c=>String(c.id)===String(e.clubId))?.name||'JYC'})),
    gallery,
    team:Array.isArray(x.team)?x.team:[],
    categories:x.categories||empty.categories,
    announcement:{...empty.announcement,...(x.announcement||{})},
    academicCalendar:{...empty.academicCalendar,...(x.academicCalendar||{})},
    campusMap:{...empty.campusMap,...(x.campusMap||{}),locations:Array.isArray(x.campusMap?.locations)?x.campusMap.locations:empty.campusMap.locations},
    certificates:Array.isArray(x.certificates)?x.certificates:empty.certificates,
    homepage:{...empty.homepage,...(x.homepage||{}),principles:Array.isArray(x.homepage?.principles)&&x.homepage.principles.length?x.homepage.principles:empty.homepage.principles,layout:Array.isArray(x.homepage?.layout)&&x.homepage.layout.length?x.homepage.layout:empty.homepage.layout},
    creator:CREATOR
  }
}
function stripLegacySeed(d){return norm(d)}
async function loadData(){if(QA_FIXTURES)return publicDemoData();if(supabase.__configured===false){const cached=readSiteCache();const usable=cached&&((cached.clubs||[]).length||(cached.events||[]).length||(cached.team||[]).length);if(usable)return mergePublicFallback(stripLegacySeed(cached),{allowContentFallback:false});if(import.meta.env.DEV)return publicDemoData();return norm(empty)}const {data,error}=await supabase.rpc('jyc_read_site_data');if(error){const message=String(error.message||'');const missingRpc=/Could not find the function public\.jyc_read_site_data|function public\.jyc_read_site_data|PGRST202|404|Not Found/i.test(message);if(missingRpc){if(import.meta.env.DEV)return publicDemoData();return norm(empty)}if(import.meta.env.DEV)return publicDemoData();return norm(empty)}return mergePublicFallback(stripLegacySeed(data||empty),{allowContentFallback:false})}
async function saveData(next,user,action,entity='site',id='main'){const payload=norm(next);let result=await supabase.rpc('jyc_save_site_data',{p_data:payload,p_action:action,p_entity_type:entity,p_entity_id:String(id||'main')});if(result.error&&/Could not find the function public\.jyc_save_site_data|schema cache/i.test(result.error.message||'')){result=await supabase.rpc('jyc_save_site_data',{p_action:action,p_data:payload,p_entity_id:String(id||'main'),p_entity_type:entity})}if(result.error)throw result.error;return stripLegacySeed(result.data)}
async function compressImage(file){if(file.size<900*1024)return file;const bitmap=await createImageBitmap(file);const max=2200;const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.82));return blob?new File([blob],(file.name.replace(/\.[^.]+$/,'')||'image')+'.webp',{type:'image/webp'}):file}
async function uploadMedia(file,folder='general'){if(!file)throw Error('Choose an image first.');if(!file.type.startsWith('image/'))throw Error('Only image files are allowed.');if(file.size>8*1024*1024)throw Error('Image must be 8 MB or smaller.');const optimized=await compressImage(file);return uploadJycMedia(optimized,folder)}
async function enablePushNotifications(){if(!('serviceWorker' in navigator)||!('PushManager' in window))throw Error('Web push is not supported in this browser.');const vapid=import.meta.env.VITE_VAPID_PUBLIC_KEY;if(!vapid)throw Error('VITE_VAPID_PUBLIC_KEY is not configured yet.');const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('Notification permission was not granted.');const registration=await navigator.serviceWorker.ready;let subscription=await registration.pushManager.getSubscription();if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(vapid)});const {data:userData}=await supabase.auth.getUser();if(!userData?.user?.id)throw Error('Sign in before enabling JYC notifications.');const {error}=await supabase.from('jyc_push_subscriptions').upsert({endpoint:subscription.endpoint,subscription:subscription.toJSON(),user_id:userData.user.id},{onConflict:'endpoint'});if(error)throw error;return true}
function urlBase64ToUint8Array(base64String){const padding='='.repeat((4-base64String.length%4)%4);const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');const raw=atob(base64);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}

function parseEventMoment(date,time,fallback='00:00'){
 const raw=String(date||'').trim();
 if(!raw)return NaN;
 if(/[T ]\d{1,2}:\d{2}/.test(raw))return Date.parse(raw.replace(' ','T'));
 const clock=String(time||fallback).trim();
 const normalized=/^\d{1,2}:\d{2}$/.test(clock)?clock.padStart(5,'0'):fallback;
 return Date.parse(`${raw}T${normalized}`);
}
function eventState(e){
 if(!e?.date)return 'draft';
 const start=parseEventMoment(e.date,e.start,'00:00');
 const end=parseEventMoment(e.dateEnd||e.date,e.end,'23:59');
 const now=Date.now();
 if(!Number.isFinite(start)||!Number.isFinite(end))return 'draft';
 if(now<start)return 'upcoming';
 if(now<=end)return 'live';
 return 'past';
}
function fmtDate(s){if(!s)return 'Date TBA';return new Date(`${s}T12:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
function safeExternalUrl(value){const raw=String(value||'').trim();if(!raw||/[\u0000-\u001f\u007f]/.test(raw))return '';try{const u=new URL(raw,window.location.origin);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return '';return u.href}catch{return ''}}
function slug(s){return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
const findEntity=(rows,key)=>rows.find(x=>x.id===key||slug(x.name||x.title)===slug(key));

function SiteAtmosphere(){
 const stars=React.useMemo(()=>Array.from({length:72},(_,i)=>({
  x:`${(i*47+11)%97}%`,y:`${(i*71+7)%94}%`,s:`${i%11===0?2.2:i%4===0?1.5:1}px`,d:`${4.5+(i%9)*.8}s`
 })),[]);
 return <div className="site-atmosphere" aria-hidden="true">
  <div className="site-star-field">{stars.map((star,i)=><i key={i} className="site-star" style={{'--x':star.x,'--y':star.y,'--s':star.s,'--d':star.d}}/> )}</div>
  <div className="constellation-field" aria-hidden="true">
   <svg viewBox="0 0 1200 700" preserveAspectRatio="none">
    <g>
     <polyline points="90,120 155,92 215,132 268,82 330,116"/>
     <circle cx="90" cy="120" r="2"/><circle cx="155" cy="92" r="1.5"/><circle cx="215" cy="132" r="1.8"/><circle cx="268" cy="82" r="2.2"/><circle cx="330" cy="116" r="1.5"/>
    </g>
    <g>
     <polyline points="890,155 940,105 1002,128 1065,78 1125,112 1160,72"/>
     <circle cx="890" cy="155" r="1.6"/><circle cx="940" cy="105" r="2"/><circle cx="1002" cy="128" r="1.5"/><circle cx="1065" cy="78" r="2.1"/><circle cx="1125" cy="112" r="1.5"/><circle cx="1160" cy="72" r="1.8"/>
    </g>
    <g>
     <polyline points="760,520 810,475 870,500 920,445 975,470"/>
     <circle cx="760" cy="520" r="1.6"/><circle cx="810" cy="475" r="1.5"/><circle cx="870" cy="500" r="2"/><circle cx="920" cy="445" r="1.6"/><circle cx="975" cy="470" r="1.5"/>
    </g>
   </svg>
  </div>
  <div className="light-dust"/>
  <div className="atmosphere-glow atmosphere-glow-a"/>
  <div className="atmosphere-glow atmosphere-glow-b"/>
  <div className="shooting-star shooting-one"/>
  <div className="shooting-star shooting-two"/>
 </div>
}

function EventReminderControl({event,notify}){if(!event?.date||eventState(event)==='past')return null;const[enabled,setEnabled]=useState(()=>hasLocalReminder(event?.id));useEffect(()=>{const on=e=>{if(e.detail?.eventId===event?.id)setEnabled(Boolean(e.detail.enabled))};window.addEventListener('jyc-reminder-changed',on);return()=>window.removeEventListener('jyc-reminder-changed',on)},[event?.id]);const change=async next=>{try{if(next){if('Notification' in window&&Notification.permission!=='granted'){const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error('Browser notifications were not enabled.');}await scheduleEventReminder(event);setEnabled(true);notify?.('JYC will remind you one hour before this event.','success')}else{clearLocalReminder(event.id);setEnabled(false)}}catch(error){setEnabled(false);notify?.(error?.message||'Could not set the event reminder.','error')}};return <Suspense fallback={<button type="button" className="btn secondary" disabled>Notify me</button>}><LazyBellToggle pressed={enabled} offLabel="Notify me" onLabel="Reminder set" label="Set a one-hour JYC event reminder" onChange={change}/></Suspense>}
function App(){const loc=useLocation();const [data,setData]=useState(()=>import.meta.env.DEV?publicDemoData():norm(empty));const [loading,setLoading]=useState(true);const [bootReady,setBootReady]=useState(false);const [bootStage,setBootStage]=useState('INITIALIZING');const [error,setError]=useState('');const [online,setOnline]=useState(()=>navigator.onLine!==false);const [theme,setTheme]=useState(()=>{
  const saved=storageGet('jyc-theme',null);
  if(saved==='dark'||saved==='light')return saved;
  // The approved JYC V20 identity is the warm paper/brass/oxblood system.
  // Respect an explicit saved choice, but do not let an OS dark-mode preference
  // silently replace the site's intended launch palette on first visit.
  return 'light';
});const [session,setSession]=useState(null);const [admin,setAdmin]=useState(null);const [toast,setToast]=useState(null);const [confirm,setConfirm]=useState(null);

 useEffect(()=>{const onToast=e=>notify(e.detail?.message||'',e.detail?.type||'success');const onConfirm=e=>setConfirm(e.detail||null);window.addEventListener('jyc-toast',onToast);window.addEventListener('jyc-confirm',onConfirm);return()=>{window.removeEventListener('jyc-toast',onToast);window.removeEventListener('jyc-confirm',onConfirm)}},[]);
 useEffect(()=>{const on=()=>setOnline(true),off=()=>setOnline(false);window.addEventListener('online',on);window.addEventListener('offline',off);return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off)}},[]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;storageSet('jyc-theme',theme);document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#0F0E11':'#f8fafc');},[theme]);
 useEffect(()=>{const low=Boolean(navigator.connection?.saveData||((navigator.deviceMemory||8)<4)||((navigator.hardwareConcurrency||8)<4));document.documentElement.dataset.performance=low?'lite':'full';document.documentElement.dataset.reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'true':'false'},[]);
 useEffect(()=>{const id=setTimeout(()=>setBootStage(readSiteCache()?'SYNCING':'LOADING'),420);return()=>clearTimeout(id)},[]);
 useEffect(()=>{let alive=true;const cached=readSiteCache();if(cached){setData(stripLegacySeed(cached));setLoading(false);setBootStage('SYNCING')}const refresh=async()=>{try{const next=await Promise.race([loadData(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('JYC data service is taking too long to respond.')),4500))]);if(alive){setData(next);writeSiteCache(next);setError('');setBootStage('READY');armStoredReminders(next.events||[])}}catch(e){if(alive){setError(e?.message||'Could not load JYC content.');setBootStage(cached?'READY':'OFFLINE')}}finally{if(alive)setLoading(false)}};refresh();const retry=()=>refresh();window.addEventListener('jyc-refresh-data',retry);supabase.auth.getSession().then(({data:{session:s}})=>resolve(s)).catch(()=>{});const {data:l}=supabase.auth.onAuthStateChange((_,s)=>resolve(s));return()=>{alive=false;l.subscription.unsubscribe();window.removeEventListener('jyc-refresh-data',retry)}},[]);
 const resolve=async s=>{setSession(s);if(!s?.user){setAdmin(null);return}let q=await supabase.from('jyc_admins').select('role,display_name,is_active,club_id').eq('user_id',s.user.id).eq('is_active',true).maybeSingle();if(q.error){q=await supabase.from('jyc_admins').select('role,display_name,is_active').eq('user_id',s.user.id).eq('is_active',true).maybeSingle()}if(q.data)setAdmin({userId:s.user.id,email:s.user.email||'',name:q.data.display_name||'JYC Administrator',role:q.data.role||'jyc_admin',clubId:q.data.club_id||null});else setAdmin(null)};
 const commit=async(next,action,entity,id)=>{if(!admin?.userId)throw Error('Administrator session expired. Please log in again.');const saved=await saveData(next,admin.userId,action,entity,id);setData(saved);writeSiteCache(saved);try{const latest=await supabase.from('jyc_content_versions').select('version_number').eq('entity_type',entity||'site').eq('entity_id',String(id||'main')).order('version_number',{ascending:false}).limit(1).maybeSingle();const version=(latest.data?.version_number||0)+1;await supabase.from('jyc_content_versions').insert({entity_type:entity||'site',entity_id:String(id||'main'),version_number:version,snapshot:next,changed_by:admin.userId,change_summary:action})}catch{}try{if(admin.role==='club_admin'&&(entity==='club'||entity==='event'))await supabase.from('jyc_content_reviews').insert({entity_type:entity,entity_id:String(id||'main'),submitted_by:admin.userId,status:'submitted',review_note:'Submitted from Club Admin Control Center.'})}catch{}notify('Saved successfully');return saved};
 const notify=(m,type='success')=>{setToast({message:m,type});setTimeout(()=>setToast(null),2800)};
 useEffect(()=>{window.scrollTo({top:0,behavior:'auto'})},[loc.pathname]);
 useEffect(()=>{
   const nodes=[...document.querySelectorAll('.reveal,.editorial-reveal')];
   if(!nodes.length)return;
   if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
     nodes.forEach(n=>n.classList.add('is-visible'));
     return;
   }
   const observer=new IntersectionObserver((entries)=>{
     entries.forEach(entry=>{
       if(entry.isIntersecting){
         entry.target.classList.add('is-visible');
         observer.unobserve(entry.target);
       }
     });
   },{threshold:.12,rootMargin:'0px 0px -40px'});
   nodes.forEach((node,index)=>{
     node.style.setProperty('--reveal-delay',`${Math.min(index*35,280)}ms`);
     observer.observe(node);
   });
   return()=>observer.disconnect();
 },[loc.pathname,data]);
 useEffect(()=>{if(!('serviceWorker' in navigator))return; if(import.meta.env.DEV){navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister()))).catch(()=>{}); if('caches' in window)caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).catch(()=>{}); return;} navigator.serviceWorker.register('/sw.js').catch(()=>{})},[]);
 useEffect(()=>{try{const views={};const key='jyc-pageviews';const parsed=JSON.parse(storageGet(key,'{}'));if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)){for(const [route,count] of Object.entries(parsed)){if(route==='total'||(route.startsWith('/')&&Number.isSafeInteger(count)&&count>=0))views[route]=count;}}const route=loc.pathname;views[route]=(Number.isSafeInteger(views[route])?views[route]:0)+1;views.total=(Number.isSafeInteger(views.total)&&views.total>=0?views.total:0)+1;storageSet(key,JSON.stringify(views))}catch{}},[loc.pathname]);
 useEffect(()=>{if(import.meta.env.VITE_ENABLE_ANALYTICS!=='true'||!data.flags?.analytics)return;let sessionKey=storageGet('jyc-analytics-session');if(!sessionKey){sessionKey=uid();storageSet('jyc-analytics-session',sessionKey)}supabase.from('jyc_page_views').insert({path:loc.pathname,referrer:document.referrer||null,session_key:sessionKey}).then(()=>{}).catch(()=>{})},[loc.pathname,data.flags?.analytics]);
 useEffect(()=>{
   const onImageError=e=>{
     const img=e.target;
     if(!(img instanceof HTMLImageElement)||img.closest('.jyc-responsive-picture')||img.dataset.jycFallback==='1')return;
     img.dataset.jycFallback='1';
     img.dataset.jycFallbackApplied='1';
     img.removeAttribute('srcset');
     img.src=logo;
   };
   document.addEventListener('error',onImageError,true);
   return()=>document.removeEventListener('error',onImageError,true);
 },[]);
 useEffect(()=>{const report=(message,stack)=>{if(!supabase?.__configured||!supabase?.functions||typeof supabase.functions.invoke!=='function')return;Promise.resolve(supabase.functions.invoke('error-report',{body:{message:String(message||'Unknown error').slice(0,2000),stack:stack||null,path:location.pathname,user_agent:navigator.userAgent}})).catch(()=>{})};const onError=e=>report(e.message,e.error?.stack);const onReject=e=>report(e.reason?.message||e.reason,e.reason?.stack);window.addEventListener('error',onError);window.addEventListener('unhandledrejection',onReject);return()=>{window.removeEventListener('error',onError);window.removeEventListener('unhandledrejection',onReject)}},[]);
 useEffect(()=>{if(loading)return;const minimum=error?150:(readSiteCache()?120:250);const id=setTimeout(()=>setBootReady(true),minimum);return()=>clearTimeout(id)},[loading,error]);
 useEffect(()=>{if(!bootReady){delete document.documentElement.dataset.jycContentReady;return}document.documentElement.dataset.jycContentReady='true';return()=>{delete document.documentElement.dataset.jycContentReady}},[bootReady,loc.pathname]);
  if(!bootReady)return <Loading stage={bootStage} cached={Boolean(readSiteCache())}/>;
  const connectionNotice=(!online||error)?<div className={`connection-notice ${readSiteCache()?'cached':'offline'} ${error==='JYC data service is not deployed. Run supabase/FINAL-PRODUCTION-REPAIR.sql in the connected Supabase project, then refresh.'?'setup-needed':''}`} role="status"><span>{!online?'You are offline. JYC will keep using cached content until the connection returns.':error==='JYC data service is not deployed. Run supabase/FINAL-PRODUCTION-REPAIR.sql in the connected Supabase project, then refresh.'?'JYC data service needs setup.':readSiteCache()?`Showing the last saved JYC snapshot · ${formatCacheAge(siteCacheAge())}.`:'JYC content is currently offline.'}</span><button type="button" onClick={()=>window.dispatchEvent(new CustomEvent('jyc-refresh-data'))}>Refresh</button></div>:null;
 const isAdmin=loc.pathname.startsWith('/admin');
 const content=<div className="app-frame"><SkipLink/><ScrollProgress/><BackToTop/>{!isAdmin&&<Suspense fallback={null}><LazyJYCInnovationMotion/></Suspense>}{!isAdmin&&<><Navbar data={data} admin={admin} theme={theme} setTheme={setTheme}/></>} {connectionNotice}<div id="main-content" className={isAdmin?'app admin-app':'app public-app'}><div className="route-stage" key={`${loc.pathname}${loc.search}`}><JYCEditorialSystem><Routes data={data} admin={admin} session={session} setAdmin={setAdmin} commit={commit} notify={notify} theme={theme} setTheme={setTheme}/></JYCEditorialSystem></div></div>{!isAdmin&&<Footer data={data} admin={admin}/>} {!isAdmin&&<Suspense fallback={null}><LazyJYCBot data={data}/></Suspense>} {toast&&<div className={`toast toast-${toast.type||'success'}`} role="status"><span>{toast.type==='error'?'!':'✓'}</span>{toast.message}</div>} {confirm&&<ConfirmDialog request={confirm} onClose={ok=>{confirm.resolve?.(ok);setConfirm(null)}}/>}
      <InstallPrompt/></div>;
 return <MaintenanceGate data={isAdmin?{maintenance:{on:false}}:data}>{content}</MaintenanceGate>}

function ClubDetail({data,id,virtualName}){
 const liveClub=findEntity(data.clubs,id);
 const virtualProfile=virtualName?JYC_HUB_CONTENT[virtualName]:null;
 const c=liveClub|| (virtualProfile?{id:`hub-${slug(virtualName)}`,name:virtualName,type:virtualProfile.family==='Technical'?'Technical':'Non-Technical',category:virtualProfile.family,description:virtualProfile.summary,about:virtualProfile.detail,interests:[virtualProfile.focus],theme:'jyc',published:true,status:'published',heads:[],achievements:[],projects:[],customSections:[],recruitment:{on:false},...(JYC_SOCIALS[virtualName]||{})}:null);
 if(!c||(!virtualProfile&&(!c.published||c.status==='archived')))return <section className="section page"><Back label="Back to clubs" to="/clubs"/><State title="Club not found." text="This club may be unpublished or archived."/></section>;
 const profile=hubProfile(c);
 const detail=hubDetails(c.name);
 const sections=[...(c.customSections||[])].filter(s=>s.visible!==false);
 const events=data.events.filter(e=>e.published&&!e.archived&&(e.clubId===c.id||e.club===c.name)).sort((a,b)=>`${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
 const upcomingEvents=events.filter(e=>eventState(e)!=='past');
 const sourceStory=PDF_HUB_STORIES.find(x=>String(x.name).toLowerCase()===String(c.name).toLowerCase())||(()=>{const m=sourceHubMedia(c.name);if(!m.photos.length||!profile)return null;return {name:profile.name||c.name,family:profile.family,focus:profile.focus,image:m.photos[0],text:detail?.experience||profile.detail||profile.summary||`${c.name} is part of the JYC ${profile.family} ecosystem.`}})();
 const sourceGallery=[...PDF_HUB_GALLERY,...PDF_HUB_EXTRA_GALLERY].filter(g=>String(g.association||'').trim().toLowerCase()===String(c.name).trim().toLowerCase());
 const gallery=[...data.gallery.filter(g=>g.clubId===c.id||g.association===c.name||g.association==='club:'+c.id),...sourceGallery].filter((g,i,a)=>a.findIndex(x=>x.id===g.id)===i);
 const links=[['Instagram',c.instagram],['WhatsApp',c.whatsapp],['Website',c.website],['LinkedIn',c.linkedin],['YouTube',c.youtube],...(Array.isArray(c.links)?c.links.map(x=>[x.label,x.url]):[])].filter(x=>x[1]).filter((x,i,a)=>a.findIndex(y=>y[1]===x[1])===i);
 const leadership=[['President',c.president],['Vice President',c.vicePresident],['Secretary',c.secretary]].filter(x=>x[1]);
 const sourcePeople=Array.isArray(detail?.sourcePeople)?detail.sourcePeople:[];
 const people=leadership.length?leadership:sourcePeople;
 const peopleSource=leadership.length?'Published JYC club record':'Supplied hub material';
 const clubTheme='jyc';
 const identity=hubIdentity(c.name);
 const identityStyle={'--hub-accent':identity.accent,'--hub-accent-soft':`color-mix(in srgb, ${identity.accent} 16%, transparent)`,'--hub-accent-line':`color-mix(in srgb, ${identity.accent} 34%, transparent)`,'--identity-shape':`var(--jyc-shape-${identity.shape||'community'})`};
 const relatedHubs=profile?Object.entries(JYC_HUB_CONTENT).filter(([name,p])=>p.family===profile.family&&name.toLowerCase()!==c.name.toLowerCase()).slice(0,4):[];
 return <section className={`section page club-detail club-detail-v41 club-theme-${clubTheme} club-identity-page`} data-hub={slug(c.name)} style={identityStyle}><Breadcrumbs items={[{label:'Clubs',href:'/clubs'},{label:c.name}]}/>
  <Back label="Back to clubs" to="/clubs"/>
  <div className="club-detail-hero reveal" style={identityStyle}>
   <div className="club-hero-photo-wall" aria-hidden="true">{c.banner?<ResponsivePhoto src={c.banner} alt="" loading="eager" fetchPriority="high" sizes="(max-width: 760px) 100vw, 55vw"/>:null}</div>
   <div className="club-hero-copy"><span className="eyebrow">{c.type} · {c.category||'COMMUNITY'}</span><h1>{c.name}</h1><p>{c.description||'An official JYC community.'}</p><div className="club-hero-actions">{links[0]&&safeExternalUrl(links[0][1])&&<a className="btn secondary" href={safeExternalUrl(links[0][1])} target="_blank" rel="noopener noreferrer">Connect ↗</a>}<ShareButton title={`Share ${c.name}`}/></div></div>
   <div className="detail-logo-wrap"><div className="detail-logo">{c.logo?<ResponsivePhoto src={c.logo} alt={c.name} loading="lazy" sizes="160px"/>:<LogoImage alt="JYC"/>}</div><span>JIIT · SECTOR 128</span></div>
  </div>
  {socialProfile(c.name)&&<section className="club-social-proof reveal" aria-label={`${c.name} official social links`}><div><span className="eyebrow">OFFICIAL CONNECTIONS</span><h2>Find {c.name} where the community is active.</h2><p>These links were checked against public club, Linktree, LinkedIn or official event material. JYC keeps the profile here as the structured source of truth.</p></div><div className="club-social-proof-links">{socialProfile(c.name).instagram&&<a href={socialProfile(c.name).instagram} target="_blank" rel="noopener noreferrer"><b>Instagram</b><span>{socialProfile(c.name).instagramHandle||'Official profile'} ↗</span></a>}{socialProfile(c.name).linkedin&&<a href={socialProfile(c.name).linkedin} target="_blank" rel="noopener noreferrer"><b>LinkedIn</b><span>Official organisation page ↗</span></a>}{socialProfile(c.name).website&&<a href={socialProfile(c.name).website} target="_blank" rel="noopener noreferrer"><b>Website</b><span>{socialProfile(c.name).label||'Official website'} ↗</span></a>}</div></section>}
  {profile&&<div className="hub-profile-banner reveal"><div><span className="eyebrow">HUB PROFILE · {profile.family}</span><h2>{profile.name}</h2><p className="large-copy">{profile.detail}</p></div><div className="hub-profile-meta"><span>Focus</span><strong>{profile.focus}</strong><span>{profile.summary}</span><span>Source: supplied JYC hub orientation material; current operational details should be updated through the Control Center.</span></div></div>}
  <section className="hub-identity-rail reveal" aria-label={`${c.name} community identity`}><div className="hub-identity-mark"><span className="hub-identity-display"><i className="hub-identity-glyph">{identity.glyph||'◆'}</i>{identity.motif}</span><b>{identity.signature}</b><small>{c.sourceMediaLabel||'Source-grounded identity'}</small></div><div className="hub-identity-traits">{identity.traits.map((t,i)=><span key={t}><small>0{i+1}</small>{t}</span>)}</div><span className="hub-identity-display">{identity.display||'JYC COMMUNITY'}</span></section>
  <section className="hub-evidence-rail reveal" aria-label={`${c.name} public profile evidence`}><div><span className="eyebrow">AT A GLANCE</span><h3>Know the community before you join.</h3><p>Orientation and hub material provide the context layer. Published JYC records provide the live layer for events, recruitment and current people.</p></div><div className="hub-evidence-stats"><span><b>{profile?.family||c.type||'JYC'}</b><small>FAMILY</small></span><span><b>{profile?.focus||c.category||'Community'}</b><small>FOCUS</small></span><span><b>{detail?.activities?.length||0}</b><small>ACTIVITY AREAS</small></span><span><b>{gallery.length}</b><small>ARCHIVE ITEMS</small></span></div></section>
  {detail&&<section className="hub-detail-system reveal"><div className="hub-detail-intro"><span className="eyebrow">WHAT YOU'LL FIND HERE</span><h2>{detail.label}</h2>{detail.officialDescription&&<p className="hub-official-description"><strong>Official identity</strong> · {detail.officialDescription}</p>}<p>{detail.experience}</p></div><div className="hub-detail-columns"><div><span className="eyebrow">ACTIVITIES</span><div className="hub-detail-tags">{detail.activities.map(x=><span key={x}>{x}</span>)}</div></div>{detail.signature?.length>0&&<div><span className="eyebrow">SIGNATURE EXPERIENCES</span><ul className="hub-signature-list">{detail.signature.map((x,i)=><li key={x}><b>{String(i+1).padStart(2,'0')}</b><span>{x}</span></li>)}</ul></div>}</div>{sourceHubMedia(c.name).photoItems?.length>0&&<><LivingPhoto items={sourceHubMedia(c.name).photoItems.map((item,i)=>({...item,association:c.name,club:c.name,family:profile?.family||c.family,id:item.id||`club-${c.id||c.name}-${i}`}))} seed={0} interval={5800} className="club-living-photo"/><section className="club-photo-carousel" aria-labelledby="club-photo-carousel-title"><div className="club-photo-carousel-head"><div><span className="eyebrow">CLUB PHOTOGRAPHY</span><h3 id="club-photo-carousel-title">Inside {c.name}.</h3><p>Source-backed photographs from this community, arranged as a focused visual archive.</p></div><span className="club-photo-count">{sourceHubMedia(c.name).photoItems.length} photos</span></div><Suspense fallback={<div className="depth-carousel depth-carousel--loading" aria-hidden="true"/>}><LazyDepthCarousel items={sourceHubMedia(c.name).photoItems.map((item,i)=>({...item,alt:item.alt||`${c.name} JYC photograph ${i+1}`,id:item.id||`club-${c.id||c.name}-${i}`}))} cardWidth={300} cardHeight={380} visibleCards={3} depth={190} spread={64} tilt={14} autoplay={false}/></Suspense></section></>}{detail?.sourceHighlights?.length>0&&<div className="hub-source-highlights"><span className="eyebrow">SOURCE HIGHLIGHTS</span><div className="hub-source-highlight-grid">{detail.sourceHighlights.map((x,i)=><article key={x}><b>{String(i+1).padStart(2,'0')}</b><span>{x}</span></article>)}</div></div>}{detail?.sourcePeople?.length>0&&<div className="hub-source-people"><span className="eyebrow">SOURCE LEADERSHIP · SUPPLIED MATERIAL</span><div>{detail.sourcePeople.map(([role,name])=><span key={role+name}><small>{role}</small><strong>{name}</strong></span>)}</div></div>}</section>}
  {sourceStory&&<section id="club-source" className="club-source-story reveal"><div className="club-source-story-copy"><span className="eyebrow">JYC STORY · SUPPLIED HUB MATERIAL</span><h2>{sourceStory.name}: {sourceStory.focus}</h2><p className="large-copy">{sourceStory.text}</p><a className="text-link" href="/archive">See the wider JYC archive →</a></div><div className="club-source-story-image"><ResponsivePhoto src={sourceStory.image} alt={`${sourceStory.name} supplied hub story`} loading="lazy" sizes="(max-width: 760px) 100vw, 42vw"/></div></section>}
  <div className="club-detail-nav reveal"><a href="#club-about">About</a><a href="#club-source">Source</a>{leadership.length||(c.heads||[]).length?<a href="#club-team">Team</a>:null}{c.recruitment?.on?<a href="#club-join">Join</a>:null}{events.length?<a href="#club-events">Events</a>:null}{gallery.length?<a href="#club-gallery">Gallery</a>:null}</div>
  <div className="club-detail-layout">
   <main>
    {c.about&&<section id="club-about" className="club-section-card reveal"><span className="eyebrow">ABOUT THE CLUB</span><h2>{'About '+c.name}</h2><p className="large-copy">{c.about}</p></section>}
    {(c.interests||[]).length>0&&<section className="club-section-card reveal"><span className="eyebrow">AREAS OF INTEREST</span><h2>What this club explores.</h2><div className="interest-cloud">{c.interests.map((x,i)=><span key={x+'-'+i}>{x}</span>)}</div></section>}
    {<section id="club-team" className="club-section-card reveal"><span className="eyebrow">PEOPLE & LEADERSHIP</span><h2>The people behind {c.name}.</h2>{people.length>0?<><div className="leadership-grid">{people.map(([r,n],i)=><div className="leader-card" key={r+String(n)+i}><span>{r}</span><strong>{n}</strong></div>)}{(c.heads||[]).map((h,i)=><div className="leader-card" key={'head-'+i}><span>{h.role||'Head'}</span><strong>{h.name||h}</strong></div>)}</div><p className="muted-note">Source: {peopleSource}. Current club leadership can change between publishing cycles; JYC only displays names supported by an approved record.</p></>:<div className="club-leadership-pending"><strong>Current club leadership is not publicly published yet.</strong><p>JYC has the community profile ready, but no current head, president, secretary or faculty-advisor names are being invented here. They will appear after an approved JYC record is published.</p><span className="tag">AWAITING VERIFIED PEOPLE RECORD</span></div>}</section>}
    {c.recruitment?.on&&<section id="club-join" className="club-section-card join-section reveal"><span className="eyebrow">JOIN THE CLUB</span><h2>There is a place for you here.</h2><div className="join-grid"><div className="join-card recruitment-card"><span className="tag">RECRUITMENT</span><h3>{c.recruitment.title||'Recruitment is open'}</h3>{c.recruitment.deadline&&<p>Deadline · {c.recruitment.deadline}</p>}{safeExternalUrl(c.recruitment.link)?<a className="btn" href={safeExternalUrl(c.recruitment.link)} target="_blank" rel="noopener noreferrer">Registration ↗</a>:<span className="muted-note">Application details will be published by the club.</span>}</div></div></section>}
    {c.achievements?.length>0&&<section className="club-section-card reveal"><span className="eyebrow">ACHIEVEMENTS</span><h2>What the club has built.</h2><ul className="feature-list">{c.achievements.map((x,i)=><li key={i}>{typeof x==='string'?x:x.text}</li>)}</ul></section>}
    {sections.map((x,i)=><section className="club-section-card reveal" key={x.id||x.title||i}><span className="eyebrow">CLUB SECTION</span><h2>{x.title}</h2>{x.type==='image'&&x.image&&<ResponsivePhoto className="section-image" src={x.image} alt="" loading="lazy" decoding="async" sizes="(max-width: 760px) 100vw, 60vw"/>}<p className="large-copy">{x.content}</p></section>)}
    {events.length>0&&<section id="club-events" className="club-section-card reveal"><div className="section-inline-head"><div><span className="eyebrow">EVENTS</span><h2>Featured experiences from {c.name}.</h2></div><a className="text-link" href="/events">All events →</a></div><div className="card-grid">{events.slice(0,4).map(e=><EventCard e={e} key={e.id}/>)}</div></section>}
    {gallery.length>0&&<section id="club-gallery" className="club-section-card reveal"><span className="eyebrow">GALLERY</span><h2>Moments from the club.</h2><GalleryItems items={gallery}/></section>}<HubLatestUpdates hub={c.name}/>
    {relatedHubs.length>0&&<section className="club-section-card reveal hub-related-section"><div className="section-inline-head"><div><span className="eyebrow">SAME JYC FAMILY</span><h2>Explore nearby communities.</h2></div><a className="text-link" href="/clubs">All communities →</a></div><div className="hub-related-grid">{relatedHubs.map(([name,p])=><a key={name} className="hub-related-card" href={`/clubs/${slug(name)}`}><small>{p.focus}</small><strong>{name}</strong><span>{p.summary}</span><b>Explore →</b></a>)}</div></section>}
   </main>
   <aside className="club-side-panel reveal"><span className="eyebrow">THE COMMUNITY</span><h3>{c.name}</h3><p>Explore this JYC community, its work, events and official connections.</p>{upcomingEvents.length>0&&<div className="club-next-event"><span>{eventState(upcomingEvents[0])==='live'?'HAPPENING NOW':'NEXT UP'}</span><strong>{upcomingEvents[0].title}</strong><small>{fmtDate(upcomingEvents[0].date)} · {upcomingEvents[0].start||'TBA'}</small></div>}{links.map(([n,u])=>safeExternalUrl(u)?<a className="side-link" key={n} href={safeExternalUrl(u)} target="_blank" rel="noopener noreferrer"><span>{n}</span><b>↗</b></a>:null)}<div className="side-divider"/><span className="eyebrow">JYC</span><p className="small-copy">JIIT Youth Club · Sector 128, Noida</p></aside>
  </div>
 </section>
}
function Team({data}){
 const nav=useNavigate();
 const [activeTier,setActiveTier]=useState('all');
 const members=data.team.filter(m=>m.published===true);
 const faculty=members.filter(m=>/faculty|advisor|coordinator/i.test(String(m.role||m.position||'')));
 const apex=members.filter(m=>/president|vice president|general secretary|joint secretary|finance secretary|treasurer/i.test(String(m.role||m.position||''))&&!/faculty/i.test(String(m.role||'')));
 const core=members.filter(m=>!faculty.includes(m)&&!apex.includes(m));
 const MemberCard=({m,index})=>{
  const name=m.name||'JYC Team Member';
  const role=m.role||m.position||'JYC Team';
  const photo=teamPhotoFor(m);
  const linkedinHeadline=m.linkedinHeadline||m.linkedin_headline||m.headline||m.tagline||'';
  const about=m.bio||m.about||m.description||m.linkedinBio||m.linkedin_bio||linkedinHeadline||'Official JYC leadership profile.';
  const linkedin=safeExternalUrl(m.linkedin||m.linkedinUrl||m.linkedin_url||m.socials?.linkedin);
  return <article className="team-layer-card team-flip-member reveal" key={m.id||name||index}>
   <Suspense fallback={<div className="team-flip-loading" aria-hidden="true"/>}>
    <LazyFlipCard label={`Open profile for ${name}`} className="team-member-flip">
     {/* Front Face: High-Res Portrait, Name, Position, Flip Trigger */}
     <div className="team-member-face-content" style={{position:'absolute',inset:0,width:'100%',height:'100%',minHeight:'100%',overflow:'hidden',padding:0}}>
      <div className="team-photo-editorial">
       {photo?<ResponsivePhoto src={photo} alt={name} width={600} height={720} loading="lazy" decoding="async" sizes="(max-width: 420px) 90vw, (max-width: 760px) 45vw, 25vw" fallbackSrc="/assets/photo-unavailable.svg" fallbackAlt={`Portrait unavailable for ${name}`}/>:<span className="jyc-logo-fallback team-photo-missing-logo" role="img" aria-label={`Portrait unavailable for ${name}`}>{String(name||'JYC').trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase()}</span>}
      </div>
      <div className="team-front-overlay">
       <span className="team-role-tag">{role}</span>
       <h3 className="team-name-front">{name}</h3>
       <span className="team-flip-indicator">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
        Click to view bio
       </span>
      </div>
     </div>
     {/* Back Face: Role, Name, Bio, LinkedIn Button, Return Trigger */}
     <div className="team-back-content">
      <div>
       <span className="team-back-role-eyebrow">{role} · JYC 128</span>
       <h3 className="team-back-name">{name}</h3>
       {linkedinHeadline&&linkedinHeadline!==about&&<div className="team-back-headline">{linkedinHeadline}</div>}
      </div>
      <p className="team-back-bio">{about}</p>
      <div className="team-back-actions">
       {linkedin&&<a href={linkedin} target="_blank" rel="noopener noreferrer" className="team-linkedin-btn" onClick={e=>e.stopPropagation()}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6Z"/></svg>
        LinkedIn Profile ↗
       </a>}
       
      </div>
     </div>
    </LazyFlipCard>
   </Suspense>
  </article>;
 };
 const roleFallback=members.length?null:<State title="The JYC team is being prepared." text="Official team profiles will appear here when JYC publishes them from the Control Center."><Button secondary onClick={()=>nav('/about')}>Learn about JYC →</Button></State>;
 return <section className="section page team-page jyc-team-page unified-public-page">
  <Breadcrumbs items={[{label:'Team'}]}/><EcosystemContextRail/>
  <div className="team-hero-panel reveal">
   <div><span className="eyebrow">JYC 128 · AY 2026–27</span><h1>Meet the people<br/><em>who move JYC.</em></h1><p>Faculty guidance, student leadership and committee heads form the people layer behind JYC communities, events and campus experiences.</p></div>
   <div className="team-hero-identity" aria-hidden="true"><div className="team-hero-logo"><LogoImage alt=""/></div><b>PEOPLE · PURPOSE · PARTICIPATION</b></div>
  </div>
  <div className="team-command-strip reveal">
   <article><b>{faculty.length || '—'}</b><span>{faculty.length ? 'Faculty profiles' : 'Faculty profiles awaiting publication'}</span></article>
   <article><b>{apex.length || '—'}</b><span>{apex.length ? 'Apex leaders' : 'Apex profiles awaiting publication'}</span></article>
   <article><b>{core.length || '—'}</b><span>{core.length ? 'Core team profiles' : 'Core profiles awaiting publication'}</span></article>
   <article><b>{JYC_HUB_FAMILIES.length}</b><span>Community families</span></article>
  </div>
  <div className="team-filter-bar reveal" role="tablist" aria-label="Filter leadership tiers">
   {[
     ['all', 'All Leadership', members.length],
     ['apex', 'Apex Leadership', apex.length],
     ['core', 'Core Committee Heads', core.length],
     ['faculty', 'Faculty Coordinators', faculty.length]
   ].map(([key, label, count]) => (
     <button
       type="button"
       key={key}
       role="tab"
       aria-selected={activeTier === key}
       className={`team-filter-tab ${activeTier === key ? 'is-active' : ''}`}
       onClick={() => setActiveTier(key)}
     >
       <span>{label}</span>
       <b>{count}</b>
     </button>
   ))}
  </div>
  <section className="team-structure-visual reveal"><span className="eyebrow">ORGANIZATIONAL STRUCTURE</span><h2>Faculty → Apex → Core → Clubs & Hubs.</h2><div className="team-structure-flow"><div><b>01</b><strong>Faculty Coordinators</strong><span>Guidance & institutional support</span></div><i>↓</i><div><b>02</b><strong>JYC Apex</strong><span>Student leadership & coordination</span></div><i>↓</i><div><b>03</b><strong>Core Team</strong><span>Committee heads & operations</span></div><i>↓</i><div><b>04</b><strong>Clubs & Hubs</strong><span>Communities · coordinators · volunteers</span></div></div></section>
  {(activeTier==='all'||activeTier==='faculty')&&faculty.length>0&&<section className="team-layer reveal"><div className="team-layer-head"><span className="eyebrow">01 · FACULTY COORDINATORS</span><h2>Institutional guidance.</h2><p>Faculty advisors provide guidance and institutional support to the student ecosystem.</p></div><div className={faculty.length===2?'team-layer-grid team-layer-grid--two':'team-layer-grid'}>{faculty.map((m,i)=><MemberCard m={m} index={i} key={m.id||m.name||i}/>)}</div></section>}
  {(activeTier==='all'||activeTier==='apex')&&apex.length>0&&<section className="team-layer reveal"><div className="team-layer-head"><span className="eyebrow">02 · JYC APEX</span><h2>Student leadership.</h2><p>The apex body coordinates the wider JYC ecosystem and its campus-facing execution.</p></div><div className="team-layer-grid">{apex.map((m,i)=><MemberCard m={m} index={i} key={m.id||m.name||i}/>)}</div></section>}
  {(activeTier==='all'||activeTier==='core')&&core.length>0&&<section className="team-layer reveal"><div className="team-layer-head"><span className="eyebrow">03 · CORE TEAM</span><h2>Heads who make programmes happen.</h2><p>Media, creative, PR, hospitality, security, management, digital and executive responsibilities sit here.</p></div><div className="team-layer-grid">{core.map((m,i)=><MemberCard m={m} index={i} key={m.id||m.name||i}/>)}</div></section>}
  <section className="team-layer reveal"><div className="team-layer-head"><span className="eyebrow">04 · CLUBS & HUBS</span><h2>One leadership layer. {Object.keys(JYC_HUB_CONTENT).length} named communities.</h2><p>Explore the five JYC families and open any community to see its profile, activities, events and official links.</p></div><div className="team-hub-directory">{Object.entries(JYC_HUB_CONTENT).map(([name,p])=><a href={'/clubs/'+slug(name)} key={name}><small>{p.family}</small><strong>{name}</strong></a>)}</div></section>
  {roleFallback}
  <div className="team-closeout reveal"><div className="team-closeout-mark"><LogoImage alt="JIIT Youth Club logo"/></div><div><span className="eyebrow">DIFFERENT ROLES · DIFFERENT COMMUNITIES</span><h2>One JYC.</h2><p>Explore the people, communities and experiences that make the JYC ecosystem visible on campus.</p><div className="hero-actions"><Button onClick={()=>nav('/clubs')}>Find your community ↗</Button><Button secondary onClick={()=>nav('/events')}>See events →</Button></div></div></div>
 </section>
}


function Contact({data}){
 const [form,setForm]=useState({name:'',email:'',message:''});
 const [sent,setSent]=useState(false);
 const [sending,setSending]=useState(false);
 const [submitError,setSubmitError]=useState('');
 const [fieldErrors,setFieldErrors]=useState({});
 const updateContactField=(field,value)=>{
  setForm(current=>({...current,[field]:value}));
  setFieldErrors(current=>({...current,[field]:''}));
  setSubmitError('');
 };
 const copyEmail=(text,label)=>{
  if(navigator?.clipboard?.writeText){
   navigator.clipboard.writeText(text).then(()=>jycToast(label+' copied to clipboard!')).catch(()=>jycToast(text));
  }else{
   jycToast(text);
  }
 };
 const submit=async e=>{
  e.preventDefault();
  setSubmitError('');
  const errors={};
  if(!form.name.trim())errors.name='Enter your name.';
  const email=form.email.trim();
  if(!email)errors.email='Enter your email address.';
  else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))errors.email='Enter a valid email address.';
  if(!form.message.trim())errors.message='Enter a message.';
  setFieldErrors(errors);
  if(Object.keys(errors).length){
   requestAnimationFrame(()=>document.querySelector('.contact-form [aria-invalid="true"]')?.focus());
   return;
  }
  setSending(true);try{
   if(!supabase.__configured){
     setSubmitError('The live contact inbox is not configured yet. Please use Instagram, LinkedIn or WhatsApp below.');
     return;
   }
   const {data:result,error}=await supabase.functions.invoke('public-submission',{body:{type:'contact',name:form.name.trim(),email:form.email.trim(),message:form.message.trim(),website:''}});if(error||!result?.ok)throw error||new Error(result?.error||'Could not submit your message.');
   setSent(true);
 }catch(err){
   console.warn('JYC contact submission unavailable:',err);
   setSubmitError('The live contact inbox is not configured yet. Please use Instagram or WhatsApp below.');
 }finally{setSending(false)}};
 return <section className="section page contact-page">
  <Back label="Back to home" to="/"/>
  <SectionHead level={1} eyebrow="COMMUNICATION HUB" title="Stay connected with JYC." text="Official portals, verified community channels, and campus assistance."/>
  <div className="contact-sla-banner reveal">
   <span className="sla-dot"/>
   <strong>STUDENT DESK ACTIVE</strong>
   <span>Monday – Saturday · 9:00 AM – 6:00 PM IST · Verified JIIT Sector 128 Channels</span>
  </div>
  <div className="contact-grid">
   <a className="contact-card" href={JYC_CONTACTS.official} target="_blank" rel="noreferrer">
    <span>01</span>
    <h3>Official Links</h3>
    <p>Verified Linktree directory with registration portals.</p>
    <span className="contact-arrow">↗</span>
   </a>
   <a className="contact-card" href={JYC_CONTACTS.instagram} target="_blank" rel="noreferrer">
    <span>02</span>
    <h3>Official Instagram</h3>
    <p>@jiityouthclub128 · Live story broadcasts, reels & recaps.</p>
    <span className="contact-arrow">↗</span>
   </a>
   <a className="contact-card" href={JYC_CONTACTS.linkedin} target="_blank" rel="noreferrer">
    <span>03</span>
    <h3>LinkedIn Page</h3>
    <p>Professional updates, hackathons & achievements.</p>
    <span className="contact-arrow">↗</span>
   </a>
   <a className="contact-card" href={JYC_CONTACTS.whatsapp} target="_blank" rel="noreferrer">
    <span>04</span>
    <h3>WhatsApp Community</h3>
    <p>Official broadcast group for enrolled JIIT students.</p>
    <span className="contact-arrow">↗</span>
   </a>
   <div className="contact-card contact-creator-card">
    <span>05</span>
    <h3>Website Creators</h3>
    <p>Website made by Aanya Goel and Kaustubh Dua</p>
    <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'12px'}}>
     {CREATORS.map(c=>(
      <div key={c.name}>
       <strong style={{color:'var(--gold,#bf9c6f)'}}>{c.name}</strong> · <span style={{fontSize:'12px',opacity:.8}}>{c.role}</span>
       <div className="social-row" style={{marginTop:'6px'}}>
        {c.linkedin&&<a href={c.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>}
        {c.github&&<a href={c.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
        {c.email&&<a href={'mailto:'+c.email}>Email ↗</a>}
       </div>
      </div>
     ))}
    </div>
   </div>
  </div>
  <div className="contact-location reveal">
   <span className="eyebrow">JYC 128 · OFFICIAL CAMPUS</span>
   <h3>Jaypee Institute of Information Technology, Sector 128</h3>
   <p>Jaypee Wish Town Village, Sultanpur, Noida–201304, Uttar Pradesh, India.</p>
   <a className="text-link" href="https://www.jiit.ac.in/contact-us" target="_blank" rel="noopener noreferrer">Verify campus contact details on JIIT ↗</a>
  </div>
  <div className="contact-form-container reveal">
   <div className="contact-form-card">
    <div className="contact-form-head">
     <span className="eyebrow">DIRECT DISPATCH</span>
     <h3>Write to JYC.</h3>
     <p>Send an inquiry to the student body. Official social channels remain available above for immediate assistance.</p>
    </div>
    {sent?<div className="contact-form-success" role="status">
     <b>Thanks, {form.name.split(' ')[0]||'friend'}!</b>
     <p>Your message has been received. JYC channels are also available above if you need a faster response.</p>
     <button type="button" className="btn" onClick={()=>{setSent(false);setForm({name:'',email:'',message:''});setFieldErrors({});setSubmitError('')}}>Send another message</button>
    </div>:<form className="contact-form" onSubmit={submit} noValidate>
     <label><span>Name</span><input name="name" value={form.name} onChange={e=>updateContactField('name',e.target.value)} placeholder="Your full name" required autoComplete="name" aria-invalid={fieldErrors.name?'true':undefined} aria-describedby={fieldErrors.name?'contact-name-error':undefined}/>{fieldErrors.name&&<span id="contact-name-error" className="contact-field-error" aria-live="polite">{fieldErrors.name}</span>}</label>
     <label><span>Email</span><input name="email" type="email" value={form.email} onChange={e=>updateContactField('email',e.target.value)} placeholder="you@email.com" required autoComplete="email" aria-invalid={fieldErrors.email?'true':undefined} aria-describedby={fieldErrors.email?'contact-email-error':undefined}/>{fieldErrors.email&&<span id="contact-email-error" className="contact-field-error" aria-live="polite">{fieldErrors.email}</span>}</label>
     <label><span>Message</span><textarea name="message" rows="5" value={form.message} onChange={e=>updateContactField('message',e.target.value)} placeholder="How can JYC help you?" required aria-invalid={fieldErrors.message?'true':undefined} aria-describedby={fieldErrors.message?'contact-message-error':undefined}/>{fieldErrors.message&&<span id="contact-message-error" className="contact-field-error" aria-live="polite">{fieldErrors.message}</span>}</label>
     {submitError&&<p className="contact-form-error" role="alert">{submitError}</p>}
     <button className="btn primary" type="submit" disabled={sending}>{sending?'Sending…':'Send message →'}</button>
    </form>}
   </div>
  </div>
 </section>
}
function FestsPage({data}){
 const nav=useNavigate();
 const fests=data.events.filter(e=>e.published&&isSector128Venue(e.venue)&&(/fest|impressions|converge|ebullience/i.test(`${e.title} ${e.eventType||''}`))).sort((a,b)=>`${b.date} ${b.start}`.localeCompare(`${a.date} ${a.start}`));
 return <section className="section page fests-page"><div className="compact-page-head reveal"><div><span className="eyebrow">JIIT Fests · JYC 128</span><h1>Fests that bring campus together.</h1><p>Browse published flagship experiences, including completed editions. Each record keeps its organiser, venue, media and external links visible when supplied.</p></div><div className="page-stat-row"><span><b>{fests.length}</b> published fest records</span></div></div><div className="seo-topic-panel reveal"><span className="eyebrow">CAMPUS FESTS</span><h2>One place for the JYC fest trail.</h2><p>Converge is the Sector 128 annual cultural and technical fest, while older JIIT material also documents Impressions and other JYC-led campus programmes. Current records are labelled by date and status rather than mixed together.</p><button type="button" className="btn secondary" onClick={()=>nav('/events')}>Browse all events →</button></div><div className="fests-social-rail reveal"><span className="eyebrow">OFFICIAL FEST / ORGANISER LINKS</span><div>{fests.slice(0,8).map(e=>{const sp=festSocialProfile(e.title);return sp?<a key={e.id} href={sp.website||sp.instagram||sp.linkedin} target="_blank" rel="noopener noreferrer"><b>{e.title}</b><span>{sp.instagramHandle||sp.label||'Official link'} ↗</span></a>:null})}</div></div>{fests.length?<div className="card-grid event-grid-premium">{fests.map((e,i)=><EventCard e={e} key={e.id} index={i}/>)}</div>:<State title="No published fest events yet." text="When JYC publishes a fest or flagship event, it will appear here automatically."/>}</section>
}
function EventDirectoryList({events}){
 const nav=useNavigate();
 return <div className="event-directory-list">{events.map((event,index)=>{
   const end=event.dateEnd||event.date;
   const ended=end?new Date(end+'T23:59:59')<new Date():false;
   const canRegister=(event.publicStatus!=='planned'||event.registrationVerified===true)&&!ended&&Boolean(safeExternalUrl(event.registrationUrl))&&(!event.registrationDeadline||new Date(event.registrationDeadline)>new Date());
   const registrationState=event.publicStatus==='planned'?'REGISTRATION NOT PUBLISHED':canRegister?'REGISTER':safeExternalUrl(event.registrationUrl)?'REGISTRATION CLOSED':'VIEW EVENT';
   return <button type="button" className="event-directory-row" key={event.id||event.title} onClick={()=>nav('/events/'+slug(event.title))}><span className="event-row-number">{String(index+1).padStart(2,'0')}</span><span className="event-row-date"><b>{fmtDate(event.date)}</b><small>{event.start||'TIME TBA'}</small></span><span className="event-row-copy"><small>{event.club||'JYC'}{event.venue?' · '+event.venue:''}</small><strong>{event.title}</strong><em>{event.description||'Open the official event record.'}</em></span><span className="event-row-state">{event.publicStatus==='planned'?'PLANNED':eventState(event).toUpperCase()}</span><span className="event-row-register">{registrationState}</span><b className="event-row-arrow" aria-hidden="true">↗</b></button>
 })}</div>
}
function Events({data}){
 const location=useLocation(); const nav=useNavigate();
 const params=new URLSearchParams(location.search||'');
 const [view,setView]=useState(()=>params.get('view')||'cards'),[q,setQ]=useState(()=>params.get('q')||''),[filter,setFilter]=useState(()=>params.get('club')||'All'),[family,setFamily]=useState(()=>params.get('category')||'All'),[scope,setScope]=useState(()=>params.get('scope')||'upcoming'),[filtersOpen,setFiltersOpen]=useState(false);
 const queryYear=params.get('year')||'';
 useEffect(()=>{
   const next=new URLSearchParams();
   if(q)next.set('q',q); if(filter!=='All')next.set('club',filter); if(family!=='All')next.set('category',family); if(scope!=='upcoming')next.set('scope',scope); if(view!=='cards')next.set('view',view); if(queryYear)next.set('year',queryYear);
   const target=next.toString(); const current=location.search.replace(/^\?/,'');
   if(target!==current)nav({pathname:'/events',search:target?`?${target}`:''},{replace:true});
 },[q,filter,family,scope,view,queryYear,location.search,nav]);
 if(data.mode==='fest'&&data.fest?.active)return <Fest data={data}/>;
 const all=data.events.filter(e=>e.published&&!e.archived).filter(e=>!queryYear||String(e.date||'').startsWith(queryYear)).sort((a,b)=>(Number(!!b.pinned)-Number(!!a.pinned))||`${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
 const clubs=[...new Set(all.map(e=>e.club).filter(Boolean))];
 const eventFamily=name=>{const raw=String(name||'').trim().toLowerCase();const key=Object.keys(JYC_HUB_CONTENT).find(k=>raw===k.toLowerCase()||raw.includes(k.toLowerCase()));return key?JYC_HUB_CONTENT[key].family:''};
 const eventCategories=JYC_EVENT_CATEGORIES;
 const eventCategoryOf=e=>{
  const raw=String(e.category||e.eventCategory||e.eventType||eventFamily(e.club)||'').trim();
  const key=raw.toLowerCase();
  if(/induction|orientation/.test(key))return 'Orientation';
  if(/ethnic|diwali|ebullience|freshers|fest|farewell|teacher|celebration|function/.test(key))return 'Fests & Celebrations';
  if(/hack|code|programming|technical|ai|robot|innovation|techtonic|bitbox|ride/.test(key))return 'Technical';
  if(/sport|drono-o-war|cricket|football|basketball/.test(key))return 'Sports';
  if(/nukkad|theatre|stage play|audition|drama|cultural|music|band|dance/.test(key))return /music|band|dance/.test(key)?'Music & Performance':'Theatre & Culture';
  if(/literary|debate|quiz|writing/.test(key))return 'Literary';
  if(/social|outreach/.test(key))return 'Social';
  if(/management|hospitality|pr|security/.test(key))return 'Management';
  if(/creative|design|media|photography|film/.test(key))return 'Creative';
  return raw;
};
 const filtered=all.filter(e=>filter==='All'||e.club===filter).filter(e=>family==='All'||eventCategoryOf(e).toLowerCase()===family.toLowerCase()).filter(e=>!q||`${e.title} ${e.club} ${e.venue} ${eventCategoryOf(e)} ${(e.highlights||[]).join(' ')}`.toLowerCase().includes(q.toLowerCase()));
 const planned=filtered.filter(e=>e.publicStatus==='planned');
 const dated=filtered.filter(e=>e.publicStatus!=='planned');
 const upcoming=dated.filter(e=>eventState(e)!=='past'),live=dated.filter(e=>eventState(e)==='live'),past=dated.filter(e=>eventState(e)==='past');
 const shown=scope==='planned'?planned:scope==='upcoming'?upcoming:scope==='live'?live:scope==='past'?past:filtered;
 const eventDriftItems=filtered.flatMap((e,eventIndex)=>{const media=sourceEventMedia(e)?.photoItems||[];const photos=media.filter(x=>x?.url).slice(0,3);const rows=photos.length?photos:[{url:e.poster}].filter(x=>x.url);return rows.map((x,i)=>({id:`${e.id||eventIndex}-${i}`,image:x.url,title:[e.title,e.club,e.date].filter(Boolean).join(' · '),href:'/events/'+slug(e.slug||e.title)}))}).slice(0,18);
 return <><section className="section page events-page v40-events-page"><Breadcrumbs items={[{label:'Events'}]}/><EcosystemContextRail/><div className="compact-page-head events-page-head reveal"><div><span className="eyebrow">JYC EVENTS{queryYear?` · ${queryYear}`:''}</span><h1>What's happening.</h1><p>Upcoming, live and past JIIT events — workshops, competitions, cultural activities, club programmes and campus experiences published by JYC.</p></div><div className="page-stat-row"><span><b>{upcoming.length}</b> upcoming</span><span><b>{live.length}</b> live</span><span><b>{past.length}</b> completed</span><span><b>{planned.length}</b> planned</span></div></div>
  <div className="event-program-band reveal"><div><span className="eyebrow">JYC EVENT PROGRAMME</span><h2>From induction to flagship experiences.</h2><p>The supplied JYC material highlights Induction, Ebullience, Hackathons, Ethnic Day, Converge, Dron-O-War and Farewell alongside periodic activities. Published event records below are the source of truth for current dates.</p></div><div className="event-program-list"><span>INDUCTION</span><span>EBULLIENCE</span><span>HACKATHONS</span><span>ETHNIC DAY</span><span>CONVERGE</span><span>DRON-O-WAR</span><span>FAREWELL</span></div></div>
  {live.length>0&&<div className="events-live-strip reveal"><span className="live-dot"/><div><small>HAPPENING NOW</small><strong>{live[0].title}</strong><span>{live[0].venue||'Venue TBA'} · {live[0].club||'JYC'}</span></div><a className="text-link" href={'/events/'+slug(live[0].title)}>Open event →</a></div>}
  <SearchTopicBand eyebrow="JIIT EVENTS · JYC 128" title="JIIT events, workshops and campus experiences" text="Discover officially published JYC events at JIIT Wish Town Campus, Sector 128, Noida — from technical programmes and competitions to cultural and student-community experiences." links={[["JYC clubs","/clubs"],["Event calendar","/calendar"],["JYC fests","/fests"]]}/>
   <EventTimelinePreview events={filtered}/>
  {filtered.length>0&&<section className="event-drift-wall-section reveal" aria-labelledby="event-drift-wall-title"><div className="section-inline-head"><div><span className="eyebrow">EVENT VISUALS · DRIFT WALL</span><h2 id="event-drift-wall-title">See the programme in motion.</h2><p>Published event posters and source-backed photography form a visual index before you open an individual event.</p></div><span className="muted-note">{filtered.length} published experiences</span></div><Suspense fallback={<div className="drift-wall-loading" aria-hidden="true"/>}><LazyDriftWall items={eventDriftItems} columns={3} tileWidth={230} tileHeight={148} gap={16} tilt={8} turn={-6} perspective={1250} depth={62} speed={2.4} direction="up" variance={.1} parallax={.08} pauseOnHover lift={20} fade={.62} dim={.52} ariaLabel="JYC event visual archive"/></Suspense></section>}
  <div className="event-toolbar events-toolbar-premium reveal">
   <label className="event-search">
    <span>⌕</span>
    <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search events..." aria-label="Search events"/>
    {q&&<button type="button" onClick={()=>setQ('')} aria-label="Clear event search">×</button>}
   </label>
   <button type="button" className={`filter-toggle ${filtersOpen?'active':''}`} onClick={()=>setFiltersOpen(v=>!v)} aria-expanded={filtersOpen}>Filters <span>{filtersOpen?'−':'+'}</span></button>
   <Suspense fallback={<div className="seg"><button type="button" className="active">Cards</button></div>}>
    <LazyRubberSegment items={['Cards','List','Calendar']} value={view} onChange={setView} ariaLabel="Event view"/>
   </Suspense>
  </div>
  {filtersOpen&&<div className="event-filter-panel reveal">
   <label><span>Category</span><select value={family} onChange={e=>setFamily(e.target.value)}><option value="All">All categories</option>{eventCategories.slice(1).map(f=><option key={f}>{f}</option>)}</select></label>
   <label><span>Club</span><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="All">All clubs</option>{clubs.map(c=><option key={c}>{c}</option>)}</select></label>
   <button type="button" className="filter-clear" onClick={()=>{setFamily('All');setFilter('All');setQ('');setScope('upcoming')}}>Clear filters</button>
  </div>}
  <section className="supplied-event-programme reveal"><div className="section-inline-head"><div><span className="eyebrow">FROM THE SUPPLIED HUB PRESENTATIONS</span><h2>The wider JYC programme.</h2><p>Programme names and visual material preserved from the supplied hub presentations. Current dates and registration remain controlled by published event records above.</p></div></div><div className="supplied-programme-grid">{PDF_HUB_PROGRAMME.map((p,i)=>{const identity=eventIdentity(p.name);return <article key={p.name} className="supplied-programme-card" style={{'--hub-accent':identity.accent,'--hub-accent-soft':`color-mix(in srgb, ${identity.accent} 12%, transparent)`}}><ResponsivePhoto className="supplied-programme-photo" src={p.image} alt={`${p.name} · supplied JYC material`} width={640} height={360} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw" loading="lazy" decoding="async" fallbackSrc="/assets/photo-unavailable.svg" fallbackAlt="Supplied programme artwork unavailable"/><div><span>{identity.motif}</span><h3>{p.name}</h3><p>{p.text}</p><b>{identity.signature}</b></div></article>})}</div></section>
  {view==='calendar'?<Calendar events={filtered}/>:<><div className="event-scope-tabs reveal">{[['upcoming','Upcoming',upcoming.length],['live','Ongoing',live.length],['planned','Planned',planned.length],['past','Completed',past.length],['all','All',filtered.length]].map(([id,label,count])=><button type="button" key={id} className={scope===id?'active':''} onClick={()=>setScope(id)}>{label}<b>{count}</b></button>)}</div>{view==='list'?(shown.length?<EventDirectoryList events={shown}/>:<State title={scope==='live'?'Nothing is ongoing right now.':scope==='past'?'No completed events in the archive.':'No published experiences in this view.'} text={scope==='planned'?'Planned dates are source-backed programme entries and may change; they are not presented as completed or officially published outcomes.':'The JYC archive and supplied programme material keep the page useful until new official event records are published.'}/>):(shown.length?<div className="card-grid event-grid-premium">{shown.map((e,i)=><EventCard e={e} key={e.id} index={i}/>)}</div>:<State title={scope==='live'?'Nothing is live right now.':scope==='past'?'No past events in the archive.':'No published experiences in this view.'} text="The JYC archive and supplied programme material keep the page useful until new official event records are published."/>)}</>}
 </section>
 </>
}



function JYCCalendarPage({data}){
 const events=(Array.isArray(data.events)?data.events:[]).filter(e=>e.published&&!e.archived).sort((a,b)=>`${a.date||''}${a.start||''}`.localeCompare(`${b.date||''}${b.start||''}`));
 const [month,setMonth]=useState(()=>new Date());
 const year=month.getFullYear(), m=month.getMonth();
 const monthEvents=events.filter(e=>{const d=new Date(`${e.date}T12:00:00`);return d.getFullYear()===year&&d.getMonth()===m});
 const label=month.toLocaleDateString('en-IN',{month:'long',year:'numeric'});
 const shift=n=>setMonth(new Date(year,m+n,1));
 const downloadMonthICS=()=>{
  if(!monthEvents.length)return;
  const esc=v=>String(v||'').replace(/\\/g,'\\\\').replace(/[;,]/g,m=>'\\'+m).replace(/\\r?\\n/g,'\\n');
  const iso=(date,time='09:00')=>{const match=String(time||'09:00').match(/^(\d{1,2}):(\d{2})/);if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date))||!match)return '';return String(date).replace(/-/g,'')+'T'+String(Number(match[1])).padStart(2,'0')+match[2]+'00'};
  const rows=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//JYC//EN','CALSCALE:GREGORIAN','X-WR-CALNAME:JYC Events · '+year+'-'+String(m+1).padStart(2,'0')];
  monthEvents.forEach(e=>{const start=iso(e.date,e.start||'09:00'),end=iso(e.dateEnd||e.date,e.end||'23:59');if(!start||!end)return;rows.push('BEGIN:VEVENT','UID:'+esc(e.id)+'@jyc128','DTSTART:'+start,'DTEND:'+end,'SUMMARY:'+esc(e.title),'LOCATION:'+esc(e.venue),'DESCRIPTION:'+esc(e.description),'END:VEVENT')});
  rows.push('END:VCALENDAR');
  const blob=new Blob([rows.join('\\r\\n')],{type:'text/calendar;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='jyc-events-'+year+'-'+String(m+1).padStart(2,'0')+'.ics';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 };
 return <section className="section page unified-public-page jyc-calendar-page">
  <Breadcrumbs items={[{label:'Event Calendar'}]}/><EcosystemContextRail/>
  <div className="compact-page-head reveal"><div><span className="eyebrow">JYC EVENT CALENDAR</span><h1>Find the next JYC experience.</h1><p>A calendar for JYC events only. Academic schedules and campus utilities do not live here.</p></div><div className="page-stat-row"><span><b>{events.filter(e=>e.publicStatus!=='planned').length}</b> published events</span><span><b>{events.filter(e=>e.publicStatus==='planned').length}</b> planned</span><span><b>{monthEvents.length}</b> this month</span></div></div>
  <div className="calendar-controls reveal"><button type="button" className="btn secondary" aria-label="Previous month" onClick={()=>shift(-1)}>← Previous</button><strong aria-live="polite">{label}</strong><button type="button" className="btn secondary" aria-label="Next month" onClick={()=>shift(1)}>Next →</button><button type="button" className="btn" onClick={()=>setMonth(new Date())}>Today</button><button type="button" className="btn secondary" aria-label={monthEvents.length?'Add this month of JYC events to your device calendar':'No JYC events in this month'} onClick={downloadMonthICS} disabled={!monthEvents.length}>Add month to device</button></div>
  <div className="calendar"><Calendar events={monthEvents}/></div>
  <div className="calendar-footer-note reveal"><span className="eyebrow">CALENDAR SOURCES</span><p>JYC events are shown in the calendar above. For university dates, registration windows, examinations and academic schedules, use JIIT’s official academic calendar; those dates are maintained by the institute and may be updated independently.</p><div className="academic-calendar-source"><a href="/events">Browse all JYC events <span aria-hidden="true">↗</span></a><a href="https://www.jiit.ac.in/academics/academic-calendars" target="_blank" rel="noreferrer noopener">Official JIIT academic calendar <span aria-hidden="true">↗</span></a></div></div>
 </section>
}

function Routes({data,admin,session,setAdmin,commit,notify,theme,setTheme}){
 const nav=useNavigate();
 const p=useLocation().pathname;
 const clean=p.replace(/\/$/,'')||'/';
 const parts=clean.split('/').filter(Boolean);
 const slugId=parts[1]||'';
  const legacyEventSlugMap={'agentic-ai-2026':'jai-2026-jaypee-agentic-ai-hackathon'};
  const eventLookupSlug=legacyEventSlugMap[slugId]||slugId;
 const legacyEventRedirect=legacyEventSlugMap[slugId]||null;
 const liveClub=clean.startsWith('/clubs/')?data.clubs.find(c=>String(c.id)===String(slugId)||slug(c.name)===slug(slugId)):null;const hubKey=clean.startsWith('/clubs/')?Object.keys(JYC_HUB_CONTENT).find(k=>slug(k)===slug(slugId)):null;const club=liveClub||(!clean.startsWith('/clubs/')||!hubKey?null:{id:`hub-${slug(hubKey)}`,name:hubKey,type:JYC_HUB_CONTENT[hubKey].family==='Technical'?'Technical':'Non-Technical',category:JYC_HUB_CONTENT[hubKey].family,description:JYC_HUB_CONTENT[hubKey].summary,about:JYC_HUB_CONTENT[hubKey].detail,interests:[JYC_HUB_CONTENT[hubKey].focus],published:true,status:'published',theme:'jyc',customSections:[],achievements:[],projects:[],heads:[],recruitment:{on:false},logo:'',banner:'',instagram:'',whatsapp:'',website:'',linkedin:'',youtube:''});
 const event=clean.startsWith('/events/')?data.events.find(e=>String(e.id)===String(eventLookupSlug)||slug(e.slug||e.title)===slug(eventLookupSlug)||slug(e.slug||e.title)===slug(eventLookupSlug)):null;
 const titles={
  '/':'JIIT Youth Club (JYC) — Clubs, Events & Fests | JIIT Noida',
  '/about':'What is JIIT Youth Club (JYC)? | JIIT Noida',
  '/history':'About JIIT Youth Club 128 | JYC',
  '/clubs':'JIIT Clubs & Student Communities | JIIT Youth Club',
  '/events':'JIIT Events & Campus Activities | JIIT Youth Club',
  '/fests':'JIIT Fests & Flagship Events | JIIT Youth Club',
  '/team':'JYC 128 Leadership | Faculty, Apex & Core Team',
  '/leadership':'JYC 128 Leadership | Faculty, Apex & Core Team',
  '/gallery':'JYC Gallery | JIIT Youth Club 128',
  '/archive':'JYC Archive | JIIT Youth Club 128',
  '/contact':'Contact JIIT Youth Club | JYC',
  '/recruitment':'JIIT Club Recruitment & Auditions | JIIT Youth Club',
  '/calendar':'JYC 128 Event Calendar | JIIT Youth Club',
  '/event-calendar':'JYC 128 Event Calendar | JIIT Youth Club',

  '/achievements':'JYC Achievements & Wall of Fame | JIIT Noida',
  '/best-of-jyc':'The Best of JYC | JIIT Youth Club 128',
  '/join-jyc':'Join JYC | JIIT Youth Club',
  '/announcements':'JYC Announcements & Updates | JIIT Noida',
  '/updates':'JYC Now · Recent JYC & Hub Updates | JIIT Youth Club',
  '/resources':'JIIT Youth Club | JYC Clubs & Events',
  '/guide':'About JIIT Youth Club | JYC',
  '/admin':'JYC Control Center'
 };
 const descriptions={
  '/':'Official JIIT Youth Club (JYC) website for JIIT Noida. Discover JIIT clubs, student communities, JIIT events, annual fests and co-curricular activities.',
  '/history':'Explore the combined About JYC page and its source-backed timeline of student-led communities, programmes and milestones.',
  '/clubs':'Explore the official JIIT club list and student communities across technical, cultural, literary, creative, sports and other campus interests through JIIT Youth Club.',
  '/events':'Find JIIT events, workshops, competitions, cultural activities and campus events published by JIIT Youth Club at JIIT Noida.',
  '/fests':'Explore JIIT fests and flagship campus events such as officially published JYC programmes, with dates, venues, clubs and registration details when available.',
  '/resources':'JIIT Youth Club — official clubs, events, fests and community information.',
  '/guide':'About JIIT Youth Club — purpose, communities, events and campus life.',
    '/calendar':'Browse the JYC 128 event calendar by date, category and event status.',
  '/recruitment':'Find published JIIT club recruitment opportunities, auditions and official application links through JIIT Youth Club.',
  '/about':'Learn about JIIT Youth Club 128: its purpose, student-led communities, values, programmes and documented milestones.',
  '/contact':'Official JYC 128 contact details, social channels and query form.',
  '/archive':'JYC archive of published events, clubs, gallery moments and campus stories from JIIT.',
  '/announcements':'Official JYC announcements, notices, registration updates and published student-community updates.',
  '/updates':'Recent verified public updates from JYC and its published community channels, presented as an editorial JYC feed.',
  '/gallery':'Browse the JYC 128 visual archive by event, year and published source media.',
  '/leadership':'Meet the JYC 128 faculty advisors, apex leadership and core team.',
  '/achievements':'JYC 128 achievements, Wall of Fame, community milestones and published outcomes.',
  '/best-of-jyc':'A curated selection of the strongest JYC photographs across people, performance, innovation, campus and celebrations.',
  '/join-jyc':'Join JYC 128 is currently coming soon. Recruitment and application opportunities will be published here when the next official cycle opens.'
 };
 const privateRoute=clean==='/admin'||clean.startsWith('/admin/');
 const knownPublic=['/','/about','/history','/clubs','/events','/fests','/gallery','/team','/leadership','/contact','/archive','/calendar','/event-calendar','/achievements','/best-of-jyc','/announcements','/updates','/recruitment','/join-jyc'].includes(clean)||clean.startsWith('/gallery/');
 const knownDetail=Boolean(club||event);
 const unknownRoute=!privateRoute&&!knownPublic&&!knownDetail;
 const pageType=club?'club':event?'event':clean==='/fests'?'fests':clean==='/clubs'?'clubs':clean==='/events'?'events':clean.startsWith('/gallery')?'gallery':clean==='/team'||clean==='/leadership'?'team':clean==='/history'||clean==='/about'?'about':clean==='/archive'?'archive':clean==='/announcements'?'announcements':clean==='/updates'?'updates':clean==='/achievements'?'achievements':clean==='/best-of-jyc'?'best-of-jyc':clean==='/calendar'||clean==='/event-calendar'?'calendar':clean==='/recruitment'?'recruitment':clean==='/join-jyc'?'join-jyc':clean==='/contact'?'contact':'home';
 const canonicalPath=club?`/clubs/${slug(club.name)}`:event?`/events/${slug(event.slug||event.title)}${parts[2]==='register'?'/register':''}`:clean;
 useEffect(()=>{if((club||event)&&(slugId!==slug(event?(event.slug||event.title):club.name)||Boolean(legacyEventSlugMap[slugId]))){const target=event?`/events/${slug(event.slug||event.title)}${parts[2]==='register'?'/register':''}`:`/clubs/${slug(club.name)}`;nav(target,{replace:true});}},[slugId,club?.id,event?.id,parts[2],nav]);
 const galleryAlbumName=clean.startsWith('/gallery/')?decodeURIComponent(parts[1]||'').replace(/-/g,' '):'';
 const title=club?`${club.name} — ${club.category||'Student Community'} | JIIT Youth Club 128`:event?`${event.title} | JIIT Event · JYC`:galleryAlbumName?`${galleryAlbumName} — JYC Visual Archive`:titles[clean]||'JIIT Youth Club';
 const description=club?`${club.name} at JIIT Wish Town Campus, Sector 128, Noida. ${club.description||club.about||'Explore activities, events, community focus and official JYC information.'}`.slice(0,300):event?(event.description||`${event.title} — official JIIT Youth Club event at JIIT Noida.`):(clean.startsWith('/gallery/')?`Browse the ${decodeURIComponent(parts[1]||'').replace(/-/g,' ')} collection in the JYC 128 visual archive.`:(descriptions[clean]||'Official JIIT Youth Club website for JIIT Noida. Discover clubs, events, fests, recruitment and student activities.'));
 usePageMeta(title,description,canonicalPath,{noindex:privateRoute||unknownRoute,type:event?'event':'website',image:event?.poster||club?.logo||undefined,imageAlt:event?.title||club?.name||'JIIT Youth Club 128 official visual'});
 const schema=<JsonLd data={data} pageType={pageType} item={club||event} path={canonicalPath}/>;
 // Resolve route aliases after all hooks have run, keeping hook order stable on navigation.
 const routeRedirects={
  '/admin':'/','/leadership':'/team','/event-calendar':'/calendar','/moments':'/gallery',
  '/planner':'/events','/agenda':'/events','/discover':'/clubs','/guide':'/about','/resources':'/about',
  '/my-jyc':'/','/login':'/','/notifications':'/','/settings':'/about','/download':'/about',
  '/projects':'/clubs','/projects/submit':'/clubs','/map':'/events'
 };
 if(routeRedirects[clean])return <Navigate to={routeRedirects[clean]} replace/>;
 if(clean.startsWith('/admin/')||clean.startsWith('/qr/'))return <Navigate to={clean.startsWith('/admin/')?'/':'/events'} replace/>;

 if(clean==='/')return <>{schema}<Home data={data}/></>;
 if(clean==='/history')return <Navigate to="/about#history" replace/>;
 if(clean==='/achievements')return <>{schema}<Achievements data={data}/></>;
 if(clean==='/best-of-jyc')return <>{schema}<JYCBestOf data={data}/></>;
 if(clean==='/about')return <>{schema}<About data={data}/></>;if(clean==='/clubs')return <>{schema}<JYC57Clubs data={data}/></>;if(club)return <>{schema}<ClubDetail data={data} id={slugId} virtualName={hubKey||undefined}/></>;
 if(clean==='/events')return <>{schema}<JYC57Events data={data}/></>;if(clean==='/fests')return <>{schema}<FestsPage data={data}/></>;if(clean.startsWith('/events/')&&legacyEventRedirect)return <Navigate to={'/events/'+legacyEventRedirect} replace/>;if(event&&parts[2]==='register')return <><RegistrationPage data={data} id={slugId} session={session}/></>;if(event)return <>{schema}<EventDetail data={data} id={slugId} session={session} notify={notify}/></>;
 if(clean==='/gallery'||clean.startsWith('/gallery/'))return <>{schema}<JYC57Gallery data={data}/></>;if(clean==='/leadership')return <Navigate to="/team" replace/>;if(clean==='/team')return <>{schema}<Team data={data}/></>;if(clean==='/contact')return <>{schema}<Contact data={data}/></>;if(clean==='/archive')return <>{schema}<Suspense fallback={<div className="jyc57-empty" role="status">Loading the JYC archive…</div>}><LazyJYC57Archive data={data}/></Suspense></>;
 if(clean==='/announcements')return <>{schema}<Announcements data={data}/></>;
 if(clean==='/updates')return <>{schema}<JYCNowPage data={data}/></>;
 if(clean==='/join-jyc')return <>{schema}<JoinJYC/></>;if(clean==='/recruitment')return <>{schema}{recruitmentEnabled(data)?<RecruitmentHub data={data}/>:<JoinJYC/>}</>;if(clean==='/event-calendar')return <Navigate to="/calendar" replace/>;if(clean==='/calendar')return <>{schema}<JYCCalendarPage data={data}/></>;if(clean==='/moments')return <Navigate to="/gallery" replace/>;if(clean==='/discover')return <Navigate to="/clubs" replace/>;if(clean==='/resources')return <Navigate to="/about" replace/>;if(clean==='/guide')return <Navigate to="/about" replace/>;if(clean==='/my-jyc'||clean==='/login'||clean==='/notifications')return <Navigate to="/" replace/>;;if(clean==='/settings'||clean==='/download')return <Navigate to="/about" replace/>;if(clean.startsWith('/qr/'))return <Navigate to="/events" replace/>;if(clean==='/admin'||clean.startsWith('/admin/'))return <Navigate to="/" replace/>;return <section className="section page not-found-page"><div className="not-found-art"><span>404</span><i aria-hidden="true">JYC</i></div><span className="eyebrow">JYC · ROUTE MISSED</span><h1>This route is not part of the published JYC experience.</h1><p>The page you requested is not part of the published JYC experience.</p><div className="detail-actions"><Button onClick={()=>nav('/')}>Return home</Button><Button secondary onClick={()=>nav('/clubs')}>Explore clubs</Button></div></section>
}
function NavIcon({kind}){const paths={home:'M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5M9 21v-6h6v6',clubs:'M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-1.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 20a5.5 5.5 0 0 1 11 0M14 20a6 6 0 0 1 7.5 0',events:'M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',gallery:'M4 5h16v14H4zM4 16l4-4 3 3 2-2 5 5M15 9h.01',team:'M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-1.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 20a5.5 5.5 0 0 1 11 0M14 20a6 6 0 0 1 7.5 0',more:'M5 7h14M5 12h14M5 17h14',search:'M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.5-2 5 5'};return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={paths[kind]||paths.more}/></svg>}


function Navbar({data,admin,theme,setTheme}){
 const nav=useNavigate();const loc=useLocation();
 const [open,setOpen]=useState(false),[moreOpen,setMoreOpen]=useState(false),[search,setSearch]=useState(false),[homeSection,setHomeSection]=useState('hero');
 const shortcutRef=React.useRef('');
 const routeLinks=[['Home','/'],['About','/about'],['Clubs','/clubs'],['Events','/events'],['Gallery','/gallery'],['Leadership','/team'],['Contact','/contact']];
 const homeLinks=[['Home','hero'],['About','about'],['Clubs','clubs'],['Events','events'],['Gallery','moments'],['Team','team'],['Contact','/contact']];
 useEffect(()=>{
   const onKey=e=>{
     if((e.ctrlKey||e.metaKey)&&(e.key?.toLowerCase()==='k'||e.code==='KeyK')){e.preventDefault();e.stopPropagation();setSearch(true);return}
     if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){e.preventDefault();setSearch(true);return}
     if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
     if(e.key.toLowerCase()==='g'){shortcutRef.current='g';window.clearTimeout(shortcutRef._timer);shortcutRef._timer=window.setTimeout(()=>shortcutRef.current='',700);return}
     if(shortcutRef.current==='g'){const routes={c:'/clubs',e:'/events',t:'/team',a:'/archive',m:'/gallery'};if(routes[e.key.toLowerCase()]){e.preventDefault();shortcutRef.current='';nav(routes[e.key.toLowerCase()]);return}}
     if(e.key==='Escape'){setOpen(false);setSearch(false);setMoreOpen(false)}
   };
   const openSearch=()=>setSearch(true);window.addEventListener('keydown',onKey,true);window.addEventListener('jyc-open-search',openSearch);
   return()=>{window.removeEventListener('keydown',onKey,true);window.removeEventListener('jyc-open-search',openSearch)}
 },[]);
 useEffect(()=>{setOpen(false);setMoreOpen(false);const query=new URLSearchParams(loc.search||'').get('q');setSearch(Boolean(query));},[loc.pathname,loc.search]);
 useEffect(()=>{document.body.classList.toggle('menu-open',open);return()=>document.body.classList.remove('menu-open')},[open]);
 useEffect(()=>{
   if(loc.pathname!=='/') return;
   const ids=['hero','about','clubs','events','moments','team'];
   const nodes=ids.map(id=>document.getElementById(id)).filter(Boolean);
   if(!nodes.length)return;
   const observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);if(visible[0])setHomeSection(visible[0].target.id)},{rootMargin:'-22% 0px -58% 0px',threshold:[0,.2,.45,.7]});
   nodes.forEach(n=>observer.observe(n));
   const syncHash=()=>{const id=window.location.hash.replace('#','');if(ids.includes(id))requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}))};
   syncHash();
   return()=>observer.disconnect();
 },[loc.pathname]);
 const goHomeSection=id=>{setOpen(false);setMoreOpen(false);if(String(id).startsWith('/')){nav(id);return}if(loc.pathname!=='/'){nav('/#'+id);return}document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});setHomeSection(id)};
 const dockItems=[['Home','/','home'],['Clubs','/clubs','clubs'],['Events','/events','events'],['Gallery','/gallery','gallery'],['More','__more','more']];
 const dockActive=loc.pathname==='/'?0:loc.pathname.startsWith('/clubs')?1:loc.pathname.startsWith('/events')?2:loc.pathname.startsWith('/gallery')?3:4;
 const dock=<div className="mobile-dock" style={{'--dock-index':dockActive}} aria-label="Mobile navigation"><i className="dock-active-pill" aria-hidden="true"/>{dockItems.map(([n,p,icon],i)=>{const active=i===dockActive;return <button type="button" key={n} className={active?'active':''} onClick={()=>p==='__more'?setMoreOpen(v=>!v):nav(p)} aria-current={active?'page':undefined}><span><NavIcon kind={icon}/></span><b>{n}</b></button>})}</div>;
 const more=moreOpen?<MobileMoreSheet data={data} admin={admin} close={()=>setMoreOpen(false)} openSearch={()=>{setMoreOpen(false);setSearch(true)}}/>:null;
 const searchView=search?<Search data={data} admin={admin} close={()=>setSearch(false)}/>:null;
 const navButtons = routeLinks.map(([n, p]) => {
    const active = loc.pathname === p || (p !== '/' && loc.pathname.startsWith(p + '/'));
    return (
      <button
        type="button"
        key={n}
        className={active ? 'active' : ''}
        onClick={() => {
          setOpen(false);
          nav(p);
        }}
        aria-current={active ? 'page' : undefined}
      >
        {n}
      </button>
    );
  });
 return <>
 <header className="nav"><div className="nav-inner">
   <button type="button" className="brand" aria-label="JIIT Youth Club home" onClick={()=>{setOpen(false);nav('/')}}><span className="brand-mark"><LogoImage alt="JIIT Youth Club logo" loading="eager" fetchPriority="high" srcSet={`${logoTiny} 1x, ${logoSmall} 2x`}/></span><span>JIIT YOUTH CLUB</span></button>
   <nav className={open?'open':''}>{navButtons}<button type="button" className={`nav-more-trigger ${moreOpen?'active':''}`} onClick={()=>{setOpen(false);setMoreOpen(v=>!v)}} aria-expanded={moreOpen}>More <span aria-hidden="true">⌄</span></button></nav>
   <button type="button" className="nav-join-cta" onClick={()=>nav('/join-jyc')}>Join JYC <span>↗</span></button>
   <Theme theme={theme} setTheme={setTheme}/><button type="button" className={`hamb ${open?'open':''}`} onClick={()=>setOpen(v=>!v)} aria-label="Menu" aria-expanded={open}><i/><i/><i/></button>
   {open&&<button type="button" className="mobile-nav-scrim" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}<button type="button" className="search-trigger" aria-label="Search Ctrl K" onClick={()=>setSearch(true)} title="Search JYC (Ctrl/Cmd + K)"><span className="search-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/></svg></span><span className="search-label">Search</span><kbd aria-hidden="true">Ctrl K</kbd></button>
 </div></header>
 {createPortal(dock,document.body)}{createPortal(more,document.body)}{searchView}</>
}
function MobileMoreSheet({data,admin,close,openSearch}){
 const nav=useNavigate();
 const sheetRef=React.useRef(null);
 useEffect(()=>{
  const previous=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const timer=setTimeout(()=>sheetRef.current?.querySelector('button,a')?.focus(),30);
  const onKey=e=>{
   if(e.key==='Escape'){e.preventDefault();close();return}
   if(e.key!=='Tab')return;
   const root=sheetRef.current;if(!root)return;
   const focusable=[...root.querySelectorAll('button,a,input,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled&&el.offsetParent!==null);
   if(!focusable.length)return;
   const first=focusable[0],last=focusable[focusable.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',onKey);
  return()=>{clearTimeout(timer);document.body.style.overflow=previous;document.removeEventListener('keydown',onKey)};
 },[close]);
 const go=p=>{close();nav(p)};
const explore=[
    ['/about','About JYC','Purpose, communities, values and the JYC story'],
    ['/team','Leadership','Faculty, Apex and Core Team'],
    ['/clubs','Clubs & Communities','Explore the official hub ecosystem'],
    ['/events','Events','Upcoming, ongoing and completed experiences'],
    ['/calendar','Event Calendar','Browse JYC events by date'],
    ['/gallery','Gallery','Event memories, years and visual archive'],
    ['/best-of-jyc','Best of JYC','A curated visual selection of published JYC moments'],
    ['/achievements','Achievements','Source-backed milestones and community outcomes'],
    ['/updates','JYC Now','Recent verified updates from JYC and the hubs'],
    ['/announcements','Announcements','Registrations, notices and JYC updates'],
    ['/join-jyc','Join JYC','Official recruitment pathway and onboarding guide'],
    ['/archive','Archive','The published JYC story by year'],
    ['/contact','Contact','Official public channels and query form']
   ];
 return <div ref={sheetRef} className="more-sheet-overlay" role="dialog" aria-modal="true" aria-label="More JYC" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}>
  <div className="more-sheet jyc-more-club-sheet">
   <div className="sheet-grabber"/>
   <div className="more-sheet-head"><div><span className="eyebrow">MORE JYC</span><h3>Useful pages. Nothing repeated.</h3><p>About, communities, events, archive and official JYC channels live here.</p></div><button type="button" className="sheet-close" onClick={close}>×</button></div>
   <div className="more-sheet-section"><span className="eyebrow">JYC</span><div className="more-sheet-grid jyc-more-grid">{explore.map(([path,title,text])=><button type="button" key={path} onClick={()=>go(path)}><b>{title}</b><span>{text} →</span></button>)}</div></div>
   <div className="more-sheet-section"><span className="eyebrow">SEARCH JYC</span><div className="more-sheet-grid more-sheet-guide"><button type="button" onClick={openSearch}><b>Search JYC</b><span>Find a page, club or event →</span></button>{safeExternalUrl(data.homepage?.jtvUrl)&&<a className="more-sheet-link" href={safeExternalUrl(data.homepage.jtvUrl)} target="_blank" rel="noopener noreferrer"><b>JTV</b><span>Official JYC media ↗</span></a>}</div></div>
   <div className="more-sheet-connect"><span className="eyebrow">CONNECT WITH JYC</span><div><a href={JYC_CONTACTS.instagram} target="_blank" rel="noreferrer">Instagram ↗</a><a href={JYC_CONTACTS.whatsapp} target="_blank" rel="noreferrer">WhatsApp ↗</a><a href={'mailto:'+data.creator.email}>Email ↗</a></div></div>
  </div>
 </div>
}

function Search({data,admin,close}){
 const nav=useNavigate();
 const [q,setQ]=useState(()=>{try{return new URLSearchParams(window.location.search).get('q')||''}catch{return ''}});
 const [selected,setSelected]=useState(0);
 const [recent,setRecent]=useState(()=>{try{return JSON.parse(storageGet('jyc-search-recent','[]')).filter(Boolean).slice(0,5)}catch{return []}});
 const inputRef=React.useRef(null);
 const term=normalizeSearch(q);
 useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow='hidden';const timer=setTimeout(()=>inputRef.current?.focus(),40);const onKeyDown=e=>{if(e.key!=='Tab')return;const root=document.querySelector('.search-modal');if(!root)return;const focusable=[...root.querySelectorAll('button,input,a,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled&&el.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}};document.addEventListener('keydown',onKeyDown);return()=>{clearTimeout(timer);document.body.style.overflow=previous;document.removeEventListener('keydown',onKeyDown)}},[]);
 useEffect(()=>{setSelected(0)},[term]);
 const remember=value=>{if(!value)return;try{const next=[value,...recent.filter(x=>x!==value)].slice(0,5);storageSet('jyc-search-recent',JSON.stringify(next));setRecent(next)}catch{}};
 const clubs=data.clubs.filter(c=>c.published&&c.status!=='archived');
 const events=data.events.filter(e=>e.published&&!e.archived);
 const team=data.team.filter(m=>m.published===true);
 const pageIndex=[
  ['JIIT Youth Club','Official JYC website for JIIT Noida clubs, events, people and campus experiences.','PAGE','/'],
  ['About JYC','About the JIIT Youth Club community, purpose and student-led work.','PAGE','/about'],
  ['Clubs','Explore official JIIT student clubs, societies, communities and interests.','PAGE','/clubs'],
  ['Events','Upcoming, live and past JYC events, workshops, competitions and campus activities.','PAGE','/events'],
  ...(isFestMode(data)?[['Fests','Flagship JYC fest experiences.','PAGE','/fests']]:[]),
  ['JYC Team','Meet the people behind JYC.','PAGE','/team'],
  ['Contact JYC','Official JYC contact information.','PAGE','/contact'],
  ['JYC Archive','Published JYC events, clubs, gallery moments and campus stories.','PAGE','/archive'],
  ['Best of JYC','Curated published JYC photography and memories.','PAGE','/best-of-jyc'],
  ['Achievements','Source-backed JYC milestones and community outcomes.','PAGE','/achievements'],
  ['Announcements','JYC announcements, registration notices and updates.','PAGE','/announcements'],
  ['Achievements','JYC achievements, wall of fame and published outcomes.','PAGE','/achievements'],
  ['JYC Event Calendar','Published JYC events by date.','PAGE','/calendar'],
  ['Events & venues','Find published JYC event locations.','PAGE','/events']
 ];
 const adminPages=[];
 const rawResults=[
  ...adminPages.map(x=>({key:'a'+x[3]+x[0],type:x[2],title:x[0],meta:x[1],searchText:`${x[0]} ${x[1]} JYC JIIT`,icon:'⚙',go:()=>nav(x[3])})),
  ...pageIndex.map(x=>({key:'p'+x[3],type:x[2],title:x[0],meta:x[1],searchText:`${x[0]} ${x[1]} JYC JIIT Noida`,icon:'⌘',go:()=>nav(x[3])})),
  ...clubs.map(c=>({key:'c'+c.id,type:'CLUB',title:c.name,meta:c.category||'Community',searchText:`${c.name} ${c.category||''} ${(c.interests||[]).join(' ')} ${c.description||''}`,icon:'◈',go:()=>nav('/clubs/'+encodeURIComponent(slug(c.name)))})),
  ...events.map(e=>({key:'e'+e.id,type:'EVENT',title:e.title,meta:e.club||'JYC',searchText:`${e.title} ${e.club||''} ${e.venue||''} ${e.eventType||''} ${e.date||''} ${(e.highlights||[]).join(' ')}`,icon:'◷',go:()=>nav('/events/'+encodeURIComponent(slug(e.slug||e.title)))})),
  ...team.map(m=>({key:'t'+m.id,type:'TEAM',title:m.name,meta:m.role||'JYC Team',searchText:`${m.name} ${m.role||''} ${m.bio||''}`,icon:'✦',go:()=>nav('/team')})),
  ...data.gallery.filter(g=>g&&g.url).map((g,i)=>({key:'g'+(g.id||i),type:'PHOTO',title:g.caption||g.title||g.association||'JYC photo',meta:[g.association,g.year].filter(Boolean).join(' · ')||'JYC visual archive',searchText:`${g.caption||''} ${g.title||''} ${g.association||''} ${g.year||''} ${g.alt||''} ${g.sourceLabel||''}`,icon:'▧',go:()=>nav('/gallery')})),
 ];
 const intentResults=term?(
  /(tomorrow|today|this week|upcoming|events)/.test(term)?[{key:'intent-events',type:'QUICK ACTION',title:'Upcoming events',meta:'Open the JYC event calendar',searchText:'upcoming events today tomorrow this week',icon:'◷',priority:120,go:()=>nav('/events')}]:
  /(sector\s*62|62 campus|sector\s*128|128 campus|venue|where)/.test(term)?[{key:'intent-map',type:'QUICK ACTION',title:'Events & venues',meta:'Find event venues from published JYC events',searchText:'venue event location',icon:'⌖',priority:100,go:()=>nav('/events')}]:
  false?[]:
  []
 ):[];
 const ranked=rankSearchResults(rawResults,term).map(r=>({...r, _score:r._score+(r.priority||0)}));
 const results=term?ranked.sort((a,b)=>b._score-a._score).slice(0,16):[];
 const searchResults=[...results,...(results.length<16?intentResults:[])];
 const total=results.length;
 const goResult=r=>{remember(term);r.go();close()};
 const runRecent=x=>{setQ(x);setTimeout(()=>inputRef.current?.focus(),0)};
 const onInputKeyDown=e=>{
   if(e.key==='Escape'){e.preventDefault();close();return;}
   if(e.key==='ArrowDown'&&searchResults.length){e.preventDefault();setSelected(i=>(i+1)%searchResults.length);return}
   if(e.key==='ArrowUp'&&searchResults.length){e.preventDefault();setSelected(i=>(i-1+searchResults.length)%searchResults.length);return}
   if(e.key==='Enter'&&searchResults[selected]){e.preventDefault();goResult(searchResults[selected]);}
 };
 const content=<div className="overlay search-overlay" role="dialog" aria-modal="true" aria-label="JYC search" onMouseDown={close} onTouchStart={e=>{if(e.target===e.currentTarget)close()}}>
  <div className="search-modal" onMouseDown={e=>e.stopPropagation()}>
   <div className="search-mobile-grabber"/>
   <div className="modal-head"><div><span className="eyebrow">JYC SEARCH</span><span className="search-subtitle">Search the whole public JYC experience.</span></div><button type="button" className="icon-btn search-close" onClick={close} aria-label="Close search"><span>ESC</span><b>×</b></button></div>
   <div className="search-input-wrap"><span className="search-field-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/></svg></span><input ref={inputRef} autoFocus aria-autocomplete="list" aria-expanded={Boolean(q&&searchResults.length)} aria-controls="jyc-search-results" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={onInputKeyDown} placeholder={isFestMode(data)?"Search clubs, events, people, fests…":"Search clubs, events and people…"} aria-label="Search JYC" aria-activedescendant={searchResults[selected]?`jyc-search-result-${selected}`:undefined}/><kbd>↑↓</kbd>{q&&<button type="button" className="search-clear" onClick={()=>{setQ('');inputRef.current?.focus()}} aria-label="Clear search">×</button>}</div>
   {!q&&<div className="search-suggestions"><span>EXPLORE</span>{[['EXPLORE CLUBS','/clubs'],['FIND EVENTS','/events'],...(isFestMode(data)?[['JIIT FESTS','/fests']]:[]),['JYC TEAM','/team'],['JYC ARCHIVE','/archive']].map(([label,path])=><button type="button" key={path} onClick={()=>{remember(label.toLowerCase());nav(path);close()}}>{label}<b>↗</b></button>)}</div>}
   {!q&&recent.length>0&&<div className="search-recent"><span>RECENT</span>{recent.map(x=><button type="button" key={x} onClick={()=>runRecent(x)}>{x}<b>×</b></button>)}</div>}
   <div className="search-meta"><span>{q?`${total} ranked result${total===1?'':'s'}`:'Search published JYC content'}</span><span className="search-shortcuts"><kbd>↑↓</kbd><span>move</span><kbd>Enter</kbd><span>open</span><kbd>Esc</kbd><span>close</span></span></div>
   <div className="search-list" id="jyc-search-results" role="listbox" aria-label="JYC search results">{q&&searchResults.length>0&&searchResults.map((r,i)=><button type="button" id={`jyc-search-result-${i}`} role="option" aria-selected={i===selected} className={i===selected?'search-result-active':''} key={r.key} style={{'--result-delay':`${Math.min(i*25,180)}ms`}} onMouseEnter={()=>setSelected(i)} onClick={()=>goResult(r)}><small>{i===0?'BEST MATCH · ':''}{r.icon} {r.type}</small><strong>{r.title}</strong><span>{r.meta}</span><b>↗</b></button>)}{q&&!searchResults.length&&<div className="search-no-results"><span>⌕</span><strong>No matches for “{q}”</strong><p>Try the exact club name, event title, person, fest or venue.</p><button type="button" onClick={()=>setQ('')}>Clear search</button></div>}{!q&&<div className="search-empty"><span className="search-empty-icon">⌕</span><strong>Start with a JYC route.</strong><p>Search exact club names, event titles, people, fests or venues — or jump straight into a section.</p><div className="search-empty-actions"><button type="button" onClick={()=>{remember('clubs');nav('/clubs');close()}}>Clubs <b>↗</b></button><button type="button" onClick={()=>{remember('events');nav('/events');close()}}>Events <b>↗</b></button><button type="button" onClick={()=>{remember('archive');nav('/archive');close()}}>Archive <b>↗</b></button></div><div className="search-key-hints"><kbd>Ctrl K</kbd><kbd>/</kbd><kbd>↑↓</kbd><kbd>Enter</kbd></div></div>}</div>
   <div className="search-footer"><span>JIIT YOUTH CLUB · SECTOR 128</span><span>RELEVANCE FIRST</span></div>
  </div>
 </div>;
 return createPortal(content,document.body)
}
function ConfirmDialog({request,onClose}){useEffect(()=>{const onKey=e=>{if(e.key==='Escape')onClose(false);if(e.key==='Enter')onClose(true)};document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey)},[onClose]);return <div className="confirm-overlay" role="presentation" onMouseDown={e=>{if(e.currentTarget===e.target)onClose(false)}}><div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="jyc-confirm-title" aria-describedby="jyc-confirm-text"><span className="eyebrow">JYC · CONFIRM</span><h2 id="jyc-confirm-title">{request.title||'Are you sure?'}</h2><p id="jyc-confirm-text">{request.text||''}</p><div className="confirm-actions"><button type="button" className="btn secondary" onClick={()=>onClose(false)}>Cancel</button><button type="button" className={`btn ${request.danger?'danger':''}`} onClick={()=>onClose(true)}>{request.confirmLabel||'Confirm'}</button></div></div></div>}

function Footer({data,admin}){
  const nav=useNavigate();
  const links=[
    ['/about','About'],['/clubs','Clubs'],['/events','Events'],
    ...(isFestMode(data)?[['/fests','Fests']]:[]),
    ['/team','Team'],['/recruitment','Join JYC'],['/calendar','Event calendar'],
    ['/archive','Archive'],['/gallery','Gallery'],['/contact','Contact']
  ];
  return <footer className="jyc-footer jyc-footer-v6">
    <div className="footer-v6-inner">
      <div className="footer-v6-rail">
        <div className="footer-v6-brand">
          <div className="footer-logo-lockup"><FooterLogoImage alt="JYC logo"/></div>
          <div><strong>JIIT YOUTH CLUB</strong><span>READY TO SOAR · JIIT SECTOR 128</span></div>
        </div>
        <span className="footer-v6-index">JYC / 128</span>
      </div>
      <div className="footer-v6-main">
        <div className="footer-v6-intro">
          <span className="eyebrow">STUDENT-LED · SECTOR 128</span>
          <h2>Make your mark<br/>on campus.</h2>
          <p>Communities, events and experiences built by JIIT students, for JIIT students.</p>
        </div>
        <nav className="footer-v6-links" aria-label="JYC footer navigation">
          <span className="eyebrow">EXPLORE</span>
          <div>{links.map(([href,label])=><button key={href} type="button" onClick={()=>nav(href)}>{label}<span aria-hidden="true">↗</span></button>)}</div>
        </nav>
        <div className="footer-v6-connect">
          <span className="eyebrow">CONNECT</span>
          <a href={JYC_CONTACTS.instagram} target="_blank" rel="noopener noreferrer">Instagram <span>↗</span></a>
          <a href={JYC_CONTACTS.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp <span>↗</span></a>
          <a href={'mailto:'+data.creator.email}>Email <span>↗</span></a>
        </div>
      </div>
      <div className="footer-v6-biglink"><button type="button" onClick={()=>nav('/recruitment')}>JOIN JYC <span aria-hidden="true">↗</span></button></div>
      <div className="footer-bottom footer-v6-bottom">
        <span>JIIT YOUTH CLUB · JIIT SECTOR 128</span>
        <small className="jyc-creator-credit">Website made by <a href="https://www.linkedin.com/in/aanya-goel26" target="_blank" rel="noopener noreferrer">Aanya Goel</a> and <a href="https://www.linkedin.com/in/kaustubh-dua-2b5a76416" target="_blank" rel="noopener noreferrer">Kaustubh Dua</a></small>
      </div>
    </div>
  </footer>;
}

function Loading({stage='INITIALIZING',cached=false}){ 
 const labels={
   INITIALIZING:['BOOTING JYC ENGINE','CONNECTING TO CAMPUS GRAPH'],
   LOADING:['SYNCING SOCIETIES','INITIALIZING 28+ STUDENT COMMUNITIES'],
   SYNCING:['RESOLVING ASSETS',cached?'LOADING CACHED CAMPUS ARCHIVE':'FETCHING LIVE EVENT DATA'],
   READY:['SYSTEM OPERATIONAL','ENTERING JYC 128 DIGITAL ECOSYSTEM'],
   OFFLINE:['OFFLINE READY','OPENING VERIFIED LOCAL SNAPSHOT']
 };
 const current=labels[stage]||labels.INITIALIZING;
 const progress={INITIALIZING:25,LOADING:55,SYNCING:80,READY:100,OFFLINE:88}[stage]||25;
 return (
   <div className="loading loading-v41 loading-cyber-suite" role="status" aria-live="polite" aria-label="Loading JYC">
     <div className="loading-v41-backdrop" aria-hidden="true">
       <span className="backdrop-aurora" />
       <i className="backdrop-star-a" />
       <b className="backdrop-star-b" />
     </div>
     <div className="loading-center-v41">
       <div className="loading-kicker">
         <i /> JIIT · SECTOR 128 · NOIDA · AY 2026–27
       </div>
       <div className="loading-v41-mark-wrap loading-cyber-rings">
         <span className="cyber-ring-outer" />
         <span className="cyber-ring-inner" />
         <div className="loading-mark">
           <LogoImage alt="JIIT Youth Club Crest" />
         </div>
       </div>
       <div className="loading-logo">
         <span>JIIT YOUTH CLUB</span>
         <strong>READY TO SOAR</strong>
       </div>
       <p className="loading-tagline">One campus. Many communities. One JYC.</p>
       <div className="loading-v41-steps" aria-hidden="true">
         <span className={progress>=25?'done':''}>01</span><i/>
         <span className={progress>=55?'done':''}>02</span><i/>
         <span className={progress>=80?'done':''}>03</span><i/>
         <span className={progress>=100?'done':''}>04</span>
       </div>
       <div className="loadline loading-laser-line" style={{'--boot-progress':`${progress}%`}}>
         <i />
       </div>
       <div className="loading-status">
         <span>{current[0]} · {progress}%</span>
         <span>{current[1]}</span>
       </div>
     </div>
     <div className="loading-foot">
       JYC · 128 <span>SEC-128, NOIDA · OFFICIAL PLATFORM</span>
     </div>
   </div>
 );
}
function BackToTop(){const [show,setShow]=useState(false);useEffect(()=>{const onScroll=()=>setShow(window.scrollY>520);window.addEventListener('scroll',onScroll,{passive:true});return()=>window.removeEventListener('scroll',onScroll)},[]);if(!show)return null;return <button type="button" className="back-to-top" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} aria-label="Back to top" title="Back to top">↑</button>}
function ScrollProgress(){const [progress,setProgress]=useState(0);useEffect(()=>{const update=()=>{const d=document.documentElement;const max=d.scrollHeight-d.clientHeight;setProgress(max>0?Math.min(100,(d.scrollTop/max)*100):0)};update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update)}},[]);return <div className="scroll-progress" aria-hidden="true" style={{'--scroll-progress-width':`${progress}%`}}><i/></div>}
function Theme({theme,setTheme}){
 const switchMode=()=>{
  const next=theme==='dark'?'light':'dark';
  const apply=()=>setTheme(next);
  document.documentElement.classList.add('theme-is-switching');
  try{
   if(document.startViewTransition){
    const transition=document.startViewTransition(apply);
    transition.finished?.finally(()=>window.setTimeout(()=>document.documentElement.classList.remove('theme-is-switching'),180));
   }else{
    apply();
    window.setTimeout(()=>document.documentElement.classList.remove('theme-is-switching'),420);
   }
  }catch{
   apply();
   window.setTimeout(()=>document.documentElement.classList.remove('theme-is-switching'),420);
  }
 };
 return <button type="button" className={`theme-toggle theme-toggle-rb ${theme==='dark'?'is-dark':'is-light'}`} onClick={switchMode} aria-label={`${theme==='dark'?'Dark':'Light'} Mode; switch to ${theme==='dark'?'light':'dark'} mode`} title={`Switch to ${theme==='dark'?'light':'dark'} mode`}>
  <span className="theme-toggle-track" aria-hidden="true">
   <span className="theme-toggle-orb"><span>{theme==='dark'?'☾':'☀'}</span></span>
  </span>
  <span className="theme-toggle-copy"><b>{theme==='dark'?'Dark':'Light'}</b><small>Mode</small></span>
 </button>
}
function State({title,text,children,compact=false}){return <section className={`state ${compact?'compact':''}`}><span className="eyebrow">JYC</span><h1>{title}</h1><p>{text}</p>{children}</section>}
function Button({children,onClick,secondary=false,danger=false,disabled=false}){return <button type="button" disabled={disabled} className={`btn ${secondary?'secondary':''} ${danger?'danger':''}`} onClick={onClick}>{children}</button>}
function Back({to,label='Back'}){const nav=useNavigate();return <button type="button" className="back" onClick={()=>to?nav(to):nav(-1)}>← {label}</button>}
function SectionHead({eyebrow,title,text,level=2}){const Heading=level===1?"h1":"h2";return <div className="section-head reveal"><span className="eyebrow">{eyebrow}</span><Heading>{title}</Heading>{text&&<p>{text}</p>}</div>}
function SearchTopicBand({eyebrow='JYC · JIIT NOIDA',title,text,links=[]}){return <section className="search-topic-band reveal" aria-label="About this JYC page"><style>{`.search-topic-band{display:grid;grid-template-columns:1.5fr .8fr;gap:16px;margin:20px 0;padding:24px;border:1px solid var(--jyc-line);border-radius:18px;background:var(--jyc-surface)}.search-topic-copy h2{margin:5px 0 7px;font-size:clamp(1.3rem,2.2vw,2rem);line-height:1.1}.search-topic-copy p{margin:0;color:var(--jyc-muted);line-height:1.6}.search-topic-links{display:grid;grid-template-columns:1fr 1fr;gap:7px;align-content:center}.search-topic-links a{display:flex;align-items:center;justify-content:space-between;min-height:44px;padding:9px 11px;border:1px solid var(--jyc-line);border-radius:10px;color:inherit;text-decoration:none}.search-topic-links a span{color:var(--jyc-accent)}@media(max-width:760px){.search-topic-band{grid-template-columns:1fr;padding:19px}.search-topic-links{grid-template-columns:1fr}}`}</style><div className="search-topic-copy"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>{links.length>0&&<nav className="search-topic-links" aria-label="Related JYC pages">{links.map(([label,href])=><a key={href} href={href}>{label}<span aria-hidden="true">↗</span></a>)}</nav>}</section>}
function Breadcrumbs({items=[]}){if(!items.length)return null;return <nav className="visible-breadcrumbs reveal" aria-label="Breadcrumb"><a href="/">JYC</a>{items.map((item,i)=><React.Fragment key={`${item.href||item.label}-${i}`}><span aria-hidden="true">/</span>{item.href&&i<items.length-1?<a href={item.href}>{item.label}</a>:<span aria-current="page">{item.label}</span>}</React.Fragment>)}</nav>}
function EcosystemContextRail(){
 const nav=useNavigate();
 const items=React.useMemo(()=>JYC_HUB_FAMILIES.map(family=>{
   const meta=JYC_HUB_CONTENT&&Object.entries(JYC_HUB_CONTENT).find(([name,p])=>p.family===family);
   return meta?{family,name:meta[0],path:'/clubs/'+slug(meta[0])}:null;
 }).filter(Boolean).slice(0,5),[]);
 return <nav className="ecosystem-context-rail" aria-label="JYC ecosystem shortcuts"><span className="ecosystem-context-label">Explore</span>{items.map(item=><button type="button" key={item.name} onClick={()=>nav(item.path)}><small>{item.family}</small><strong>{item.name}</strong><b aria-hidden="true">↗</b></button>)}</nav>
}
function DetailSection({title,eyebrow='JYC DETAIL',children}){return <section className="detail-section reveal"><div className="detail-section-head"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div></div>{children}</section>}
function ShareButton({title='Share JYC'}){const share=async()=>{try{if(navigator.share){await navigator.share({title,text:title,url:window.location.href});return}await navigator.clipboard?.writeText(window.location.href);jycToast('Link copied to clipboard.')}catch{}};return <button type="button" className="btn secondary share-button" onClick={share} aria-label={`Share ↗ — ${title}`}>Share ↗</button>}

function Card({children,className='',onClick}){const interactive=typeof onClick==='function';const ref=React.useRef(null);const handleClick=e=>{if(!interactive)return;if(e.target instanceof Element&&e.target.closest('button,a,input,textarea,select,[data-no-card-nav]'))return;onClick(e)};const handleKey=e=>{if(interactive&&e.currentTarget===e.target&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onClick(e)}};const tilt=className.includes('tilt-card'),magnetic=className.includes('magnetic-card');const move=e=>{if((!tilt&&!magnetic)||!window.matchMedia?.('(hover:hover) and (pointer:fine)').matches||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;const el=ref.current;if(!el)return;const r=el.getBoundingClientRect();if(!r.width||!r.height)return;const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;if(magnetic){el.style.setProperty('--magnetic-x',`${(x*7).toFixed(2)}px`);el.style.setProperty('--magnetic-y',`${(y*7).toFixed(2)}px`)}if(tilt){el.style.setProperty('--pointer-x',`${((x+.5)*100).toFixed(1)}%`);el.style.setProperty('--pointer-y',`${((y+.5)*100).toFixed(1)}%`);el.style.setProperty('--magnetic-rx',`${(-y*4).toFixed(2)}deg`);el.style.setProperty('--magnetic-ry',`${(x*5).toFixed(2)}deg`)}};const leave=()=>{const el=ref.current;if(!el)return;['--magnetic-x','--magnetic-y','--magnetic-rx','--magnetic-ry','--pointer-x','--pointer-y'].forEach(name=>el.style.removeProperty(name))};return <article ref={ref} className={`card ${className}`} onClick={handleClick} onKeyDown={handleKey} onPointerMove={move} onPointerLeave={leave} tabIndex={interactive?0:undefined}>{children}</article>}

function useCountUp(target,active){const [value,setValue]=useState(0);useEffect(()=>{if(!active){setValue(0);return}const numeric=Math.max(0,Number(target)||0);if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){setValue(numeric);return}let raf;const start=performance.now();const duration=1500;const tick=now=>{const p=Math.min(1,(now-start)/duration);const eased=1-Math.pow(1-p,3);setValue(Math.round(numeric*eased));if(p<1)raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)},[target,active]);return value}
function HeroStats({communities=0,families=0,programmes=0,campus='128'}){
 const ref=React.useRef(null);const [active,setActive]=useState(false);
 useEffect(()=>{const el=ref.current;if(!el)return;if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){setActive(true);return}
 const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setActive(true);observer.disconnect()}},{threshold:.4});
 observer.observe(el);return()=>observer.disconnect()},[]);
 const values=[useCountUp(communities,active),useCountUp(families,active),useCountUp(programmes,active)];
 const items=[['Communities',values[0],''],['Families',values[1],''],['Major programmes',values[2],''],['Campus',campus,'']];
 return <div ref={ref} className="hero-stats" aria-label="JYC at a glance">
  {items.map(([label,value,suffix])=><div key={label}><strong>{value}<span className="stat-suffix">{suffix}</span></strong><span>{label}</span></div>)}
 </div>
}
function ImpactStats({data}){const ref=React.useRef(null);const [active,setActive]=useState(false);const events=data.events.filter(e=>e.published&&!e.archived).length;const clubs=data.clubs.filter(c=>c.published&&c.status!=='archived').length;const families=JYC_HUB_FAMILIES.length;const total=events+clubs+families;const e=useCountUp(events,active),c=useCountUp(clubs,active),f=useCountUp(families,active);useEffect(()=>{const el=ref.current;if(!el)return;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setActive(true);return}const o=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setActive(true);o.disconnect()}},{threshold:.35});o.observe(el);return()=>o.disconnect()},[]);if(!total)return <section ref={ref} className="impact-strip impact-empty reveal"><div><span className="eyebrow">JYC IS READY</span><h2>The platform is ready for its next chapter.</h2><p>Official clubs and campus experiences will appear here as JYC publishes them.</p></div><span className="impact-empty-mark">READY TO SOAR</span></section>;return <section ref={ref} className="impact-strip reveal"><div className="impact-heading"><span className="eyebrow">JYC IN NUMBERS</span><h2>Built by participation.</h2><p>Live counts from the published JYC ecosystem.</p></div><div className="impact-stat"><strong>{e}</strong><span>Published events</span></div><div className="impact-stat"><strong>{c}</strong><span>Active clubs</span></div><div className="impact-stat"><strong>{f}</strong><span>Community families</span></div></section>}
function JYCPulse({data}){const ref=React.useRef(null);const [active,setActive]=useState(false);const published=data.events.filter(e=>e.published&&!e.archived);const upcoming=published.filter(e=>eventState(e)!=='past').length;const live=published.filter(e=>eventState(e)==='live').length;const now=new Date();const todayKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;const today=published.filter(e=>e.date===todayKey).length;const clubs=data.clubs.filter(c=>c.published&&c.status!=='archived').length;const recruitment=data.clubs.filter(c=>c.published&&c.recruitment?.on).length;const hasActivity=upcoming||live||today||clubs||recruitment;const upcomingCount=useCountUp(upcoming,active),liveCount=useCountUp(live,active),todayCount=useCountUp(today,active),clubCount=useCountUp(clubs,active),recruitmentCount=useCountUp(recruitment,active);useEffect(()=>{const el=ref.current;if(!el)return;if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){setActive(true);return}const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setActive(true);observer.disconnect()}},{threshold:.35});observer.observe(el);return()=>observer.disconnect()},[]);if(!hasActivity)return null;return <section ref={ref} className="pulse-strip reveal"><div className="pulse-brand"><i/> <span>JYC PULSE</span></div><div className="pulse-items">{live?<span>{liveCount} live now</span>:today?<span>{todayCount} {today===1?'event':'events'} today</span>:upcoming?<span>{upcomingCount} upcoming</span>:null}{clubs>0&&<span>{clubCount} active {clubs===1?'club':'clubs'}</span>}{recruitment>0&&<span>{recruitmentCount} recruitment {recruitment===1?'window':'windows'}</span>}</div></section>}
function TodayAtJYC({data}){
 const todayKey=(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})();
 const rows=data.events.filter(e=>e.published&&!e.archived&&e.date===todayKey).sort((a,b)=>String(a.start||'').localeCompare(String(b.start||'')));
 return <section className="section today-at-jyc reveal"><div className="today-head"><div><span className="eyebrow">TODAY AT JYC</span><h2>What is happening today.</h2><p>Published JYC experiences scheduled for today. If nothing is published, the archive stays quiet.</p></div><span className="today-date">{new Date(`${todayKey}T12:00`).toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short'})}</span></div>{rows.length?<div className="today-list">{rows.map((e,i)=><button type="button" key={e.id||i} className="today-row" onClick={()=>window.location.assign(`/events/${slug(e.slug||e.title)}`)}><span className="today-time">{e.start||'TBA'}</span><span className="today-main"><strong>{e.title}</strong><small>{e.club||'JYC'} · {e.venue||'Venue TBA'}</small></span><span className="today-arrow">↗</span></button>)}</div>:<div className="today-empty"><span>NO PUBLISHED EVENTS TODAY</span><strong>Nothing scheduled for today.</strong><p>Visit Events or the JYC archive for the next published experience.</p></div>}</section>
}
function ArchivePage({data}){
 const nav=useNavigate();
 const years=[...new Set([...data.events.filter(e=>e.published&&!e.archived).map(e=>e.date?.slice(0,4)),...data.gallery.map(g=>g.year||g.date?.slice(0,4)),...data.clubs.filter(c=>c.published&&c.status!=='archived').map(c=>c.year||c.created_at?.slice(0,4))].filter(Boolean))].sort((a,b)=>String(b).localeCompare(String(a)));
 const past=data.events.filter(e=>e.published&&!e.archived&&eventState(e)==='past').sort((a,b)=>`${b.date} ${b.start}`.localeCompare(`${a.date} ${a.start}`));
 const publishedClubs=data.clubs.filter(c=>c.published&&c.status!=='archived');
 return <section className="section page archive-page unified-public-page"><Breadcrumbs items={[{label:'Archive'}]}/><EcosystemContextRail/><div className="archive-hero reveal"><div><span className="eyebrow">JYC ARCHIVE</span><h1>The story we keep.</h1><p>A living record of officially published JYC events, communities and moments. Nothing is invented here; the archive grows with JYC.</p></div><div className="archive-seal"><LogoImage alt="JIIT Youth Club logo"/><span>JYC · NOIDA</span></div></div><div className="archive-year-strip"><span className="eyebrow">YEARS IN THE RECORD</span><div>{years.length?years.map(y=><a key={y} href={`#year-${y}`}>{y}</a>):<span>Awaiting published archive data</span>}</div></div><div className="archive-summary"><div><b>{publishedClubs.length}</b><span>published clubs</span></div><div><b>{past.length}</b><span>past events</span></div><div><b>{data.gallery.length}</b><span>gallery moments</span></div></div><section className="archive-section" id={past[0]?.date?`year-${past[0].date.slice(0,4)}`:undefined}><div className="section-head"><span className="eyebrow">EVENT RECORD</span><h2>Past JYC experiences.</h2><p>Open any published event to revisit its official details.</p></div>{past.length?<div className="archive-event-list">{past.slice(0,12).map((e,i)=><button type="button" className="archive-event" key={e.id} onClick={()=>nav('/events/'+slug(e.slug||e.title))}><span>{String(i+1).padStart(2,'0')}</span><div><small>{fmtDate(e.date)} · {e.club||'JYC'}</small><strong>{e.title}</strong><p>{e.venue||'Venue TBA'}</p></div><b>↗</b></button>)}</div>:<State compact title="The archive is waiting." text="Published past events will appear here when JYC adds them."/>}</section><section className="archive-section archive-stories"><div className="section-head"><span className="eyebrow">JYC STORIES</span><h2>People, places, performances and making.</h2><p>Selected visual stories drawn from the supplied hub presentations.</p></div><div className="archive-story-collage">{PDF_HUB_EXTRA_GALLERY.map((g,i)=><figure className={`archive-story-photo story-photo-${i%6}`} key={g.id}><ResponsivePhoto className="archive-story-image" src={g.url} alt={g.caption} width={900} height={600} sizes="(max-width: 600px) 92vw, (max-width: 1000px) 45vw, 30vw" loading="lazy"/><figcaption><small>{g.association}</small><span>{g.caption.split(" · ")[1]||g.caption}</span></figcaption></figure>)}</div></section><section className="archive-section"><div className="section-head"><span className="eyebrow">COMMUNITY RECORD</span><h2>Communities in the ecosystem.</h2><p>Official published club profiles remain part of the JYC record.</p></div>{publishedClubs.length?<div className="archive-club-grid">{publishedClubs.slice(0,12).map(c=><button type="button" key={c.id} className="archive-club" onClick={()=>nav('/clubs/'+slug(c.name))}><span>{c.type||'JYC'}</span><strong>{c.name}</strong><small>{c.category||'Community'}</small></button>)}</div>:<State compact title="No published clubs yet." text="Published club profiles will appear here automatically."/>}</section></section>
}

function Home({data}){
 return <JYCEditorialHome data={data}/>;
}
function JoinJYC(){
 const nav=useNavigate();
 return <section className="section page unified-public-page join-jyc-page">
  <Breadcrumbs items={[{label:'Join JYC'}]}/><EcosystemContextRail/>
  <div className="join-soon-hero reveal">
   <div className="join-soon-mark"><LogoImage alt="JIIT Youth Club logo"/></div>
   <span className="eyebrow">JYC 128 · ACADEMIC YEAR 2026–27</span>
   <h1>Ready to Soar.<br/><em>Join the JYC Student Ecosystem.</em></h1>
   <p>Explore the published JYC communities and current recruitment notices. When an application is open, its official deadline and application link should be shown on the relevant community or recruitment page.</p>
   <div className="join-notify-box">
    <Button onClick={()=>nav('/recruitment')}>View recruitment status ↗</Button>
    <small>Only published opportunities and verified application links are treated as open. This page does not register a notification.</small>
   </div>
   <div className="hero-actions" style={{justifyContent:'center',marginTop:24}}>
    <Button onClick={()=>nav('/clubs')}>Explore All Communities ↗</Button>
    <Button secondary onClick={()=>nav('/events')}>See Published Events →</Button>
   </div>
  </div>
  <section className="join-roadmap-section reveal">
   <div className="section-inline-head" style={{marginBottom:28}}>
    <div><span className="eyebrow">APPLICATION ROADMAP</span><h2>How induction works.</h2><p>Four structured phases from campus newcomer to official community member.</p></div>
   </div>
   <div className="join-roadmap-grid">
    {[{num:'01',title:'Explore Societies',text:'Discover communities across technical, cultural, creative, literary and sports interests.'},{num:'02',title:'Orientation & Inductions',text:'Attend live introductory workshops and interact with society heads.'},{num:'03',title:'Auditions & Code Sprints',text:'Showcase your coding, performance, design, writing or management skills.'},{num:'04',title:'Join the Cohort',text:'Receive your official badge, join the WhatsApp groups, and start organizing.'}].map(s=><article key={s.num} className="join-roadmap-card">
     <span className="roadmap-num">{s.num}</span>
     <h3>{s.title}</h3>
     <p>{s.text}</p>
    </article>)}
   </div>
  </section>
  <section className="join-domains-section reveal">
   <div className="section-inline-head" style={{marginBottom:24}}>
    <div><span className="eyebrow">COMMUNITY AREAS</span><h2>Find where your passion belongs.</h2><p>Whether you write code, fly drones, dance, direct plays, design or play sports, there is a dedicated space for you.</p></div>
    <a className="text-link" href="/clubs">All clubs →</a>
   </div>
   <div className="join-domain-grid">
    {[{name:'AI & Software Dev',hub:'OSDC / ZenCoders / RPH',family:'Technical',accent:'#A82420'},{name:'Robotics & Drone Tech',hub:'CICR / Dronotics',family:'Technical',accent:'#BF9C6F'},{name:'Performing Arts & Dance',hub:'VamUnique / BDS / Jhankaar',family:'Cultural',accent:'#A82420'},{name:'Music & Band',hub:'Fortissimo',family:'Cultural',accent:'#BF9C6F'},{name:'Fashion & Runway',hub:'Panache',family:'Cultural',accent:'#A82420'},{name:'Fine Arts & Design',hub:'Aakriti / Prismatic',family:'Creative',accent:'#BF9C6F'},{name:'Photography & Visuals',hub:'Aura',family:'Creative',accent:'#A82420'},{name:'Debate & Literature',hub:'Eloquence / Parola',family:'Literary',accent:'#BF9C6F'},{name:'Competitive Sports',hub:'JSA / Sports Club',family:'Sports',accent:'#BF9C6F'}].map(d=><button type="button" key={d.name} className="join-domain-card" style={{'--domain-accent':d.accent}} onClick={()=>nav('/clubs')}>
     <div className="domain-top"><small>{d.family}</small><span className="domain-arrow">↗</span></div>
     <h3>{d.name}</h3>
     <p>{d.hub}</p>
    </button>)}
   </div>
  </section>
  <div className="join-benefits reveal">
   <article><b>01</b><h3>Apex Leadership</h3><p>Develop real-world leadership coordinating national hackathons, cultural fests and college operations.</p></article>
   <article><b>02</b><h3>Lifelong Friendships</h3><p>Connect with passionate peers, seniors, and alumni across technical, cultural and athletic domains.</p></article>
   <article><b>03</b><h3>Official Recognition</h3><p>Earn verified university leadership credits, awards and certificates of merit on your resume.</p></article>
  </div>
 </section>
}

function About({data}){
 const nav=useNavigate();
 const h=data.homepage||{};
 const principles=h.principles||[];
 return <section className="section page unified-public-page about-page">
  <Breadcrumbs items={[{label:'About JYC'}]}/><EcosystemContextRail/><SearchTopicBand eyebrow="ABOUT JYC · JIIT NOIDA" title="What is JIIT Youth Club?" text="JIIT Youth Club (JYC) is the student-led community ecosystem at JIIT Wish Town Campus, Sector 128, Noida, connecting clubs, hubs, events, leadership and campus experiences beyond academics." links={[["JYC clubs","/clubs"],["JYC events","/events"],["JYC leadership","/team"]]}/>
  <div className="about-hero-v28 v40-about-hero reveal">
   <div className="about-hero-copy"><span className="eyebrow">ABOUT JYC · JIIT 128</span><h1>JYC brings student communities together.</h1><p>{h.aboutText||'JIIT Youth Club connects students, communities, leadership and campus experiences across JIIT Sector 128.'}</p><div className="about-hero-actions"><Button onClick={()=>nav('/clubs')}>Find your community ↗</Button><Button secondary onClick={()=>nav('/events')}>See what is happening →</Button></div></div>
   <div className="about-hero-mark"><div><LogoImage alt="JIIT Youth Club"/></div><span>VOICE · TALENT · SPIRIT</span></div>
  </div>
  
  <section className="v40-about-snapshot reveal" aria-label="JYC at a glance">
   <div className="v40-about-snapshot-intro"><span className="eyebrow">JYC AT A GLANCE</span><h2>One coordinating body. A whole campus ecosystem.</h2><p>JYC connects faculty guidance, student leadership, communities, volunteers and experiences so students can move from discovering an interest to actually participating.</p></div>
   <div className="v40-about-metrics"><article><strong>{JYC_HUB_FAMILIES.length}</strong><span>community families</span></article><article><strong>{Object.keys(JYC_HUB_CONTENT).length}</strong><span>named communities</span></article><article><strong>{PDF_HUB_PROGRAMME.length}</strong><span>programme strands</span></article><article><strong>{data.team.filter(m=>m.published===true).length}</strong><span>published people</span></article></div>
   <div className="v40-about-leadership"><div><span className="eyebrow">LEADERSHIP LAYERS</span><strong>Faculty → Apex → Core → Communities</strong><p>The public structure reflects the supplied orientation material instead of inventing a parallel hierarchy.</p></div><button type="button" className="reference-view-all" onClick={()=>nav('/team')}>Meet the team →</button></div>
  </section>
  <section className="about-intro-v28 reveal"><span className="eyebrow">WHY JYC EXISTS</span><h2>A place to participate, create, lead and belong.</h2><p>JYC is a student-governed organisation that gives students a platform to display their talents, organises inter- and intra-institutional activities and helps first-year students acclimate to campus life.</p><div className="about-principles-v28">{(principles.length?principles:[{title:'Student-led, faculty-advised',text:'Student leadership works with faculty guidance and institutional support.'},{title:'Communities with purpose',text:'Clubs and hubs give students focused spaces to learn, create, compete and perform.'},{title:'Experiences that connect',text:'Events turn those communities into shared campus moments.'}]).map((p,i)=><article key={i}><b>{String(i+1).padStart(2,'0')}</b><h3>{p.title}</h3><p>{p.text}</p></article>)}</div></section>
  <section className="about-families-v28 reveal"><div className="about-section-title-v28"><span className="eyebrow">THE JYC ECOSYSTEM</span><h2>Five families. Many ways to belong.</h2><p>The supplied JYC material groups communities across Cultural, Technical, Creative, Literary and Sports families. The current named list on this site is derived directly from that supplied orientation material.</p></div><div className="about-family-grid-v28">{JYC_HUB_FAMILIES.map((family,i)=>{const profile=JYC_ORIENTATION_FAMILIES.find(item=>item.name===family);const count=Object.values(JYC_HUB_CONTENT).filter(item=>item.family===family).length;return <button type="button" key={family} style={{'--family-accent':['#A82420','#A82420','#BF9C6F','#BF9C6F','#BF9C6F'][i%5]}} onClick={()=>nav('/clubs')}><span>{String(i+1).padStart(2,'0')} / {String(count).padStart(2,'0')}</span><strong>{profile?.label||family}</strong><p>{profile?.description||`Explore the ${family.toLowerCase()} communities in JYC.`}</p><small>{(profile?.examples||[]).slice(0,4).join(' · ')||`${count} communities`} →</small></button>})}</div></section>
  <section className="about-flow-v28 reveal"><div className="about-section-title-v28"><span className="eyebrow">HOW JYC WORKS</span><h2>Guidance → leadership → communities → experiences.</h2></div><div className="about-flow-grid-v28">{[['01','Faculty guidance','Institutional support and direction'],['02','Apex Body','Student leadership and coordination'],['03','Hubs & Societies','Communities built around interests and talent'],['04','Coordinators & Volunteers','People who turn plans into execution'],['05','Events & Experiences','The campus moments students actually join']].map(x=><article key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong><p>{x[2]}</p></article>)}</div></section>
  <section className="about-programmes-v28 reveal"><div className="about-section-title-v28"><span className="eyebrow">THE CAMPUS RHYTHM</span><h2>From welcome to farewell.</h2><p>The supplied JYC programme material highlights recurring major experiences. Current dates and registrations remain controlled by published event records.</p></div><div className="about-programme-grid-v28">{PDF_HUB_PROGRAMME.map((p,i)=><article key={p.name}><div className="about-programme-image"><ResponsivePhoto src={p.image} alt={p.name+' · JYC programme'} loading="lazy" sizes="(max-width: 760px) 100vw, 30vw"/><span>{String(i+1).padStart(2,'0')}</span></div><div><small>{p.type}</small><h3>{p.name}</h3><p>{p.text}</p><button type="button" onClick={()=>nav('/events')}>Open events →</button></div></article>)}</div></section>
  <section className="about-vision-v28 reveal"><article><span className="eyebrow">VISION</span><h2>A campus where every student can find a place to participate, create, lead and belong.</h2></article><article><span className="eyebrow">MISSION</span><p>Connect students with clubs and communities, create meaningful experiences, develop leadership and teamwork, and make campus life more participatory.</p><div className="about-inline-links"><button type="button" onClick={()=>nav('/team')}>Meet the people →</button><button type="button" onClick={()=>nav('/gallery')}>See the archive →</button></div></article></section>
  <section className="about-history-section reveal" id="history" aria-labelledby="about-history-heading">
    <div className="about-section-title-v28">
     <span className="eyebrow">THE JYC STORY · 2019–2026</span>
     <h2 id="about-history-heading">JYC, built by generations of students.</h2>
     <p>A source-backed record of JYC milestones, community coordination, student orientations and flagship JYC experiences. This timeline is part of About JYC—not a separate history destination.</p>
    </div>
    <div className="about-history-timeline-v2">
     {HISTORY.map((item,index)=><article key={item.year} id={item.year.replace('–','-')} className="about-history-node">
      <div className="about-history-node-rail">
       <span className="about-history-node-idx">{String(index+1).padStart(2,'0')}</span>
       <b className="about-history-node-yr">{item.year}</b>
       <div className="about-history-node-line" aria-hidden="true"/>
      </div>
      <div className="about-history-node-card">
       <span className="about-history-badge">{item.label}</span>
       <h3>{item.title}</h3>
       <p>{item.text}</p>
       <div className="about-history-cite"><span>Verified source: </span><a href={item.href} target="_blank" rel="noopener noreferrer">{item.source} ↗</a></div>
      </div>
     </article>)}
    </div>
   </section>
   <div className="about-source-note reveal">Content scope: JYC 128 orientation material and published JYC milestones. Current events, recruitment and team records remain on their dedicated JYC pages.</div>
  <section className="about-next-v28 reveal"><span className="eyebrow">YOUR NEXT STEP</span><h2>See the organisation in action.</h2><div><Button onClick={()=>nav('/clubs')}>Explore clubs ↗</Button><Button secondary onClick={()=>nav('/events')}>Explore events →</Button><Button secondary onClick={()=>nav('/team')}>Meet JYC →</Button></div></section>
 </section>
}
function Clubs({data}){
 const [family,setFamily]=useState('All'),[type,setType]=useState('All'),[cat,setCat]=useState('All'),[interest,setInterest]=useState('All'),[q,setQ]=useState(''),[filtersOpen,setFiltersOpen]=useState(false);
 const visible=data.clubs.filter(c=>c.published&&c.status!=='archived').sort((a,b)=>(Number(!!b.pinned)-Number(!!a.pinned))||String(a.name).localeCompare(String(b.name)));
 const familyOf=c=>hubProfile(c)?.family||c.family||'';
 const familyVisible=visible.filter(c=>family==='All'||familyOf(c)===family);
 const cats=[...new Set(familyVisible.filter(c=>type==='All'||c.type===type).map(c=>c.category).filter(Boolean))];
 const ints=[...new Set(familyVisible.filter(c=>type==='All'||c.type===type).flatMap(c=>c.interests||[]))];
 const discoveryAliases=Object.fromEntries(Object.entries(JYC_COMMUNITY_DISCOVERY).map(([key,terms])=>[key.toLowerCase(),terms]));
 const query=String(q||'').trim().toLowerCase();
 const discoveryTerms=discoveryAliases[query]||[];
 const list=familyVisible.filter(c=>type==='All'||c.type===type).filter(c=>cat==='All'||c.category===cat).filter(c=>interest==='All'||(c.interests||[]).includes(interest)).filter(c=>{if(!query)return true;const hay=`${c.name} ${c.category} ${familyOf(c)} ${(c.interests||[]).join(' ')} ${c.description||''} ${c.about||''}`.toLowerCase();return hay.includes(query)||discoveryTerms.some(term=>hay.includes(term))});
 const clear=()=>{setQ('');setFamily('All');setType('All');setCat('All');setInterest('All')};
 return <section className="section page clubs-page clubs-page-v41 unified-public-page"><Breadcrumbs items={[{label:'Clubs'}]}/><EcosystemContextRail/><SearchTopicBand eyebrow="JIIT CLUBS · JYC 128" title="Official JIIT clubs and student communities" text="Explore JYC's published technical, cultural, literary, creative and sports communities at JIIT Wish Town Campus, Sector 128, Noida. Open a community to see its story, people, events, links and published media." links={[["JYC events","/events"],["JYC leadership","/team"],["JYC archive","/archive"]]}/><div className="compact-page-head clubs-page-head reveal"><div><span className="eyebrow">JYC CLUBS</span><h1>Explore the JYC ecosystem.</h1><p>Explore the official JYC community list through the five families defined in the supplied orientation material — then narrow by type, category or interest.</p></div><div className="page-stat-row"><span><b>{visible.length}</b> named communities</span><span><b>{JYC_HUB_FAMILIES.length}</b> families</span><span><b>{visible.filter(c=>c.type==='Technical').length}</b> technical</span></div></div>
  <section className="club-drift-wall-section reveal" aria-labelledby="club-drift-wall-title"><div className="section-inline-head"><div><span className="eyebrow">COMMUNITY VISUALS · DRIFT WALL</span><h2 id="club-drift-wall-title">The JYC ecosystem, in frames.</h2><p>Source-backed community photography gives the directory a visual layer without turning the club list into a generic image grid.</p></div><span className="muted-note">{list.length} communities</span></div><Suspense fallback={<div className="drift-wall-loading" aria-hidden="true"/>}><LazyDriftWall items={list.flatMap((c,index)=>{const media=sourceHubMedia(c.name);const photos=(media.photoItems||[]).slice(0,2);return photos.map((p,i)=>({id:`${c.id||index}-${i}`,image:p.url||p.src||p.image,title:[c.name,media.family||c.type].filter(Boolean).join(' · '),href:'/clubs/'+slug(c.name)}))}).filter(x=>x.image).slice(0,24)} columns={4} tileWidth={200} tileHeight={132} gap={14} tilt={9} turn={-7} perspective={1250} depth={65} speed={2.2} direction="up" variance={.12} parallax={.08} pauseOnHover lift={20} fade={.6} dim={.55} ariaLabel="JYC community visual archive"/></Suspense></section>
  <div className="hub-spectrum reveal"><div><span className="eyebrow">THE JYC HUB SPECTRUM</span><h2>Start with what interests you.</h2><p>Culture, technology, creative work, literature and sport all sit inside the same JYC ecosystem. The filters below are derived from the supplied orientation list.</p></div><div className="hub-spectrum-tags">{JYC_HUB_FAMILIES.map((x,i)=><button type="button" className={family===x?'is-active':''} key={x} onClick={()=>{setFamily(x);setCat('All');setInterest('All')}}><b>{String(i+1).padStart(2,'0')}</b>{x}</button>)}</div></div>
  <section className="find-community-panel reveal" aria-labelledby="find-community-title"><div><span className="eyebrow">JYC COMMUNITY MAP</span><h2 id="find-community-title">Explore by craft, culture, technology and sport.</h2><p>Use the themes below to browse the JYC ecosystem. This is a discovery aid—not a ranking of clubs.</p></div><div className="find-community-chips">{['Build & code','AI & robotics','Music & dance','Theatre & performance','Writing & debate','Design & media','Sports & fitness','Social impact','Leadership & events'].map(label=><button type="button" key={label} className={q.toLowerCase().includes(label.toLowerCase())?'is-active':''} onClick={()=>setQ(label)}>{label}</button>)}</div><div className="find-community-actions"><button type="button" className="btn" onClick={()=>{setQ('');setFamily('All');setType('All');setCat('All');setInterest('All');setFiltersOpen(true)}}>View full directory</button><span>{visible.length} published communities · {JYC_HUB_FAMILIES.length} families</span></div></section>
  <div className="discover-panel discover-panel-compact reveal"><label className="club-search"><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search communities..." aria-label="Search communities"/>{q&&<button type="button" onClick={()=>setQ('')} aria-label="Clear club search">×</button>}</label><button type="button" className={`filter-toggle ${filtersOpen?'active':''}`} onClick={()=>setFiltersOpen(v=>!v)} aria-expanded={filtersOpen}>More filters <span>{filtersOpen?'−':'+'}</span></button></div>
  {filtersOpen&&<div className="club-filter-panel reveal"><div className="discover"><span>FAMILY</span>{['All',...JYC_HUB_FAMILIES].map(x=><button type="button" className={family===x?'active':''} onClick={()=>{setFamily(x);setCat('All');setInterest('All')}} key={x}>{x==='All'?'Everything':x}</button>)}</div><label><span>Type</span><select value={type} onChange={e=>setType(e.target.value)}><option value="All">All types</option>{['Technical','Non-Technical'].map(x=><option key={x}>{x}</option>)}</select></label><label><span>Category</span><select value={cat} onChange={e=>setCat(e.target.value)}><option value="All">All categories</option>{cats.map(x=><option key={x}>{x}</option>)}</select></label><label><span>Interest</span><select value={interest} onChange={e=>setInterest(e.target.value)}><option value="All">All interests</option>{ints.map(x=><option key={x}>{x}</option>)}</select></label><button type="button" className="filter-clear" onClick={clear}>Clear filters</button></div>}
  <div className="results-line"><span>{list.length} {list.length===1?'community':'communities'} found</span>{(q||family!=='All'||type!=='All'||cat!=='All'||interest!=='All')&&<button type="button" onClick={clear}>Clear filters</button>}</div>
  {list.length?<div className="club-grid clubs-grid-premium">{list.map((c,i)=><ClubCard key={c.id} c={c} index={i}/>)}</div>:<State title="No published communities match those filters." text="Try another family or clear the filters."/>}
 <HubDirectory data={data}/>
 </section>
}
function HubDirectory({data}){
 const nav=useNavigate();
 const entries=Object.entries(JYC_HUB_CONTENT);
 const [active,setActive]=useState(entries[0]?.[0]||'');
 const [family,setFamily]=useState('All');
 const activeMedia=sourceHubMedia(active);
 const visibleEntries=family==='All'?entries:entries.filter(([,p])=>p.family===family);
 const photoBacked=entries.filter(([name])=>sourceHubMedia(name).photos.length>0).length;
 const activeIdentity=hubIdentity(active);
 useEffect(()=>{if(!visibleEntries.some(([name])=>name===active))setActive(visibleEntries[0]?.[0]||'')},[family]);
 return <section className="hub-directory hub-directory-v41 reveal">
  <div className="hub-directory-head">
   <div><span className="eyebrow">JYC HUB DIRECTORY · SOURCE MEDIA</span><h2>Twenty-three communities. Source-grounded identities.</h2><p className="small-copy">Move through the maintained All Hubs archive. Brochure-verified and source-material communities remain visibly distinguished, while real supplied photography is used wherever it exists.</p></div>
   <div className="hub-directory-stats"><span><b>{entries.length}</b> communities</span><span><b>{photoBacked}</b> photo-backed</span><span><b>{entries.length-photoBacked}</b> profile-led</span></div>
  </div>
  <div className="hub-family-row" role="group" aria-label="Filter communities by family">
   <button type="button" aria-pressed={family==='All'} className={family==='All'?'is-active':''} onClick={()=>setFamily('All')}>All <b>{entries.length}</b></button>
   {JYC_HUB_FAMILIES.map(x=><button type="button" aria-pressed={family===x} className={family===x?'is-active':''} key={x} onClick={()=>setFamily(x)}>{x} <b>{entries.filter(([,p])=>p.family===x).length}</b></button>)}
  </div>
  <div className="hub-directory-stage">
   <div className="hub-directory-list" role="list">
    {visibleEntries.map(([name,p],i)=>{
      const live=data.clubs.find(c=>String(c.name||'').trim().toLowerCase()===name.toLowerCase());
      const identity=hubIdentity(name); const media=sourceHubMedia(name);
      return <button type="button" key={name} className={`hub-directory-card ${active===name?'is-active':''}`} style={{'--hub-accent':identity.accent,'--hub-accent-soft':`color-mix(in srgb, ${identity.accent} 12%, transparent)`}} onMouseEnter={()=>setActive(name)} onFocus={()=>setActive(name)} onClick={()=>nav(live?'/clubs/'+slug(live.name):'/clubs/'+slug(name))}>
       <span className="hub-directory-index">{String(entries.findIndex(([n])=>n===name)+1).padStart(2,'0')}</span>
       <span className="hub-directory-copy"><small>{p.family} · {p.focus}</small><strong>{name}</strong><em>{identity.signature}</em></span>
       <span className="hub-directory-count">{media.photos.length?media.photos.length+' photos':'profile-led'} ↗</span>
      </button>
    })}
   </div>
   <aside className="hub-directory-preview" aria-live="polite" style={{'--hub-accent':activeIdentity.accent,'--hub-accent-soft':`color-mix(in srgb, ${activeIdentity.accent} 14%, transparent)`}}>
    <div className="hub-preview-image">
     {activeMedia.photos[0]?<ResponsivePhoto className="hub-preview-source-image" src={activeMedia.photos[0]} alt={active+' supplied JYC visual'} width={900} height={600} sizes="(max-width: 900px) 92vw, 42vw" loading="lazy"/>:<div className="hub-preview-fallback"><span className="hub-identity-glyph">{activeIdentity.glyph}</span><strong>{active}</strong><small>Source profile is available; standalone photography has not been extracted for this community.</small></div>}
     <span>{activeMedia.photos.length?activeMedia.photos.length+' source visuals':'PROFILE-LED SOURCE'}</span>
    </div>
    <div className="hub-preview-copy"><span className="eyebrow">{activeMedia.family||'JYC COMMUNITY'} · {activeMedia.focus||'COMMUNITY'}</span><h3>{active}</h3><p>{activeMedia.summary||'Source-grounded community profile.'}</p><div>{(activeIdentity.traits||[]).slice(0,4).map(x=><span key={x}>{x}</span>)}</div><button type="button" className="text-link" onClick={()=>nav('/clubs/'+slug(active))}>Open full profile →</button></div>
   </aside>
  </div>
 </section>
}
function ClubCard({c,index=0}){
 const nav=useNavigate();
 const identity=hubIdentity(c.name);
 const clubMedia=sourceHubMedia(c.name); const clubPhotos=clubMedia.photos||[]; const sourcePhoto=clubPhotos.length?clubPhotos[index%clubPhotos.length]:(clubMedia.visuals?.[index%Math.max(1,clubMedia.visuals.length)]||'');
 const social=socialProfile(c.name);
 const identityStyle={'--hub-accent':identity.accent,'--hub-accent-soft':`color-mix(in srgb, ${identity.accent} 14%, transparent)`,'--hub-accent-line':`color-mix(in srgb, ${identity.accent} 30%, transparent)`};
 return <Card className="club-card club-card-premium club-card-v41 reveal club-identity-card magnetic-card" data-hub={slug(c.name)} style={identityStyle} onClick={()=>nav('/clubs/'+slug(c.name))}><div className="club-card-visual">{(c.banner||sourcePhoto)&&<ResponsivePhoto className="club-card-photo" src={c.banner||sourcePhoto} alt="" loading="lazy" sizes="(max-width: 600px) 92vw, (max-width: 1000px) 45vw, 30vw" fallbackSrc="/assets/photo-unavailable.svg" fallbackAlt="Club photograph unavailable"/>}<div className="club-logo">{c.logo?<img src={c.logo} alt={`${c.name} logo`} width={128} height={128} loading="lazy" onError={e=>{const image=e.currentTarget;const stage=image.dataset.logoFallback||'0';if(stage==='0'){image.dataset.logoFallback='1';image.src=logo;image.alt=`Official JYC logo placeholder; ${c.name} logo unavailable`;image.style.objectFit='contain';image.style.padding='6px';return}if(stage==='1'&&logo!=="/JYC%20Logo(4).png"){image.dataset.logoFallback='2';image.src="/JYC%20Logo(4).png";image.alt=`Official JYC logo placeholder; ${c.name} logo unavailable`;image.style.objectFit='contain';image.style.padding='6px';return}image.style.visibility='hidden';image.alt=''}}/>:<LogoImage alt="JIIT Youth Club logo"/>}</div><span className="club-index">{String(index+1).padStart(2,'0')}</span></div><div className="card-body"><div className="club-identity-mini"><span><b className="hub-identity-glyph">{identity.glyph}</b>{identity.motif}</span><b>{identity.signature}</b>{c.sourceMediaLabel&&<small>{c.sourceMediaLabel}</small>}</div><div className="card-topline"><span className="tag">{c.type} · {c.category||'Community'}</span>{c.sourceVerification==='source-material'&&<span className="pin-badge source-badge">SOURCE MATERIAL</span>}{c.pinned&&<span className="pin-badge">PINNED</span>}</div><h3>{c.name}</h3><p>{c.description||'Official JYC club information will appear here.'}</p><div className="chips">{(c.interests||[]).slice(0,4).map(i=><span key={i}>{i}</span>)}</div><div className="club-card-footer"><span className="text-link">Explore club</span><span>↗</span></div>{(c.socials?.instagram||c.socials?.linkedin||c.socials?.website)&&<div className="club-socials" onClick={ev=>ev.stopPropagation()}>{safeExternalUrl(c.socials?.instagram)&&<a href={safeExternalUrl(c.socials.instagram)} target="_blank" rel="noopener noreferrer" aria-label={`${c.name} Instagram`}>IG {c.socials.instagramHandle||'Instagram'} ↗</a>}{safeExternalUrl(c.socials?.linkedin)&&<a href={safeExternalUrl(c.socials.linkedin)} target="_blank" rel="noopener noreferrer" aria-label={`${c.name} LinkedIn`}>LinkedIn ↗</a>}{safeExternalUrl(c.socials?.website)&&<a href={safeExternalUrl(c.socials.website)} target="_blank" rel="noopener noreferrer" aria-label={`${c.name} website`}>Website ↗</a>}{social?.verifiedOn&&<small>Verified {social.verifiedOn}</small>}</div>}</div></Card>
}

function eventVisualFor(e,index=0){
 const explicit=safeExternalUrl(e?.poster)||'';
 if(explicit)return explicit;
 const sourceItems=sourceEventMedia(e)?.photoItems||[]; const source=sourceItems.length?sourceItems[index%sourceItems.length]:null;
 if(source?.url)return source.url;
 const hay=`${e?.title||''} ${e?.club||''}`.toLowerCase();
 const candidates=[...PDF_HUB_GALLERY,...PDF_HUB_EXTRA_GALLERY,...PUBLIC_GALLERY_FALLBACK];
 const matched=candidates.find(g=>{const a=String(g.association||'').toLowerCase();const cap=String(g.caption||'').toLowerCase();return (a&&hay.includes(a.split(' · ')[0]))||(cap&&hay.split(/\\s+/).some(w=>w.length>4&&cap.includes(w)));});
 if(matched?.url)return matched.url;
 return candidates.length?candidates[Math.abs(String(e?.id||e?.title||index).split('').reduce((n,ch)=>n+ch.charCodeAt(0),0))%candidates.length]?.url:'';
}
function EventCard({e,index=0}){
 const nav=useNavigate();
 const shouldReduceMotion=useReducedMotion();
 const state=eventState(e);
 const eventPoster=e.poster||sourceEventMedia(e)?.photoItems?.find(item=>item?.url)?.url||'';
 const identity=eventIdentity(e);
 const eventEnd=e.dateEnd||e.date;
 const eventEnded=eventEnd?new Date(eventEnd+'T23:59:59')<new Date():false;
 const regOpen=(e.publicStatus!=='planned'||e.registrationVerified===true)&&!eventEnded&&(!e.registrationDeadline||new Date(e.registrationDeadline)>new Date())&&Boolean(safeExternalUrl(e.registrationUrl));
 const regClosed=Boolean(safeExternalUrl(e.registrationUrl))&&!regOpen;
 const registrationLabel=e.publicStatus==='planned'?'REGISTRATION NOT PUBLISHED':regOpen?'REGISTER':regClosed?'REGISTRATION CLOSED':'VIEW EVENT';
 const identityStyle={'--hub-accent':identity.accent,'--hub-accent-soft':'color-mix(in srgb, '+identity.accent+' 12%, transparent)','--hub-accent-line':'color-mix(in srgb, '+identity.accent+' 28%, transparent)','--identity-shape':'var(--jyc-shape-'+(identity.shape||'event')+')'};
 const openRegistration=(ev)=>{ev.stopPropagation();if(!regOpen)return;if(safeExternalUrl(e.registrationUrl))window.open(safeExternalUrl(e.registrationUrl),'_blank','noopener,noreferrer')};
 return <Card className="event-card event-card-premium reveal event-identity-card magnetic-card" data-hub={slug(e.club||'JYC')} style={identityStyle} onClick={()=>nav('/events/'+slug(e.slug||e.title))}><motion.div layoutId={`event-media-${slug(e.id||e.slug||e.title)}`} transition={{duration:shouldReduceMotion?0:.32,ease:[.22,1,.36,1]}} className="event-poster">{eventVisualFor(e,index)&&<ResponsivePhoto className="event-poster-photo" src={eventVisualFor(e,index)} alt="" loading="lazy" sizes="(max-width: 600px) 92vw, (max-width: 1000px) 45vw, 30vw" fallbackSrc="/assets/photo-unavailable.svg" fallbackAlt="Event image unavailable"/>}<span className={state==='live'?'live':e.publicStatus==='planned'?'planned':''}>{e.publicStatus==='planned'?'PLANNED':state==='live'?'LIVE NOW':fmtDate(e.date)}</span><span className="event-number">{String(index+1).padStart(2,'0')}</span><span className="event-domain-mark">{identity.glyph||'◆'}</span><span className="event-domain-label">{identity.motif}</span></motion.div><div className="card-body"><div className="event-identity-mini"><span>{identity.motif}</span><b>{identity.signature}</b><i>{identity.traits?.join(' · ')}</i></div><div className="card-topline"><span className="tag">{e.club||'JYC'}</span>{e.pinned&&<span className="pin-badge">FEATURED</span>}</div><h3>{e.title}</h3><p>{e.description||'Official JYC event details.'}</p>{e.publicStatus==='planned'&&<small className="event-planned-note">Planned programme date · source currently under review</small>}<div className="event-card-meta"><span><b>{e.start||'TBA'}</b>{e.end?' – '+e.end:''}</span><span>{e.venue||'Venue TBA'}</span></div><div className="event-card-actions"><span className="text-link">Open event details →</span>{regOpen?<button type="button" className="event-card-register" onClick={openRegistration} aria-label={'REGISTER ↗ — Register for '+e.title}>REGISTER ↗</button>:<span className={regClosed?'event-card-register event-card-register--closed':'event-card-register event-card-register--muted'}>{registrationLabel}</span>}</div></div></Card>;
}
function EventTimelinePreview({events}){
 const nav=useNavigate();
 const items=[...events].slice(0,8);
 return <section className="event-timeline-preview reveal"><div className="event-timeline-head"><div><span className="eyebrow">EVENT TIMELINE</span><h2>Experiences with their own visual language.</h2><p>Every published event carries its own identity. Hover a row to see its organiser, date and source poster when one exists.</p></div><a className="text-link" href="/events">Open full archive →</a></div><div className="event-timeline-list">{items.map((e,i)=>{const identity=eventIdentity(e);return <button type="button" key={e.id||i} className="event-timeline-row" style={{'--hub-accent':identity.accent,'--hub-accent-soft':`color-mix(in srgb, ${identity.accent} 12%, transparent)`}} onClick={()=>nav('/events/'+slug(e.slug||e.title))}><span className="event-timeline-number">{String(i+1).padStart(2,'0')}</span><span className="event-timeline-date">{fmtDate(e.date)}</span><span className="event-timeline-title"><small>{identity.motif}</small><strong>{e.title}</strong></span><span className="event-timeline-club">{e.club||'JYC'}</span><span className="event-timeline-media">{e.poster?<ResponsivePhoto className="event-timeline-poster" src={e.poster} alt={`${e.title} event poster`} width={320} height={180} sizes="120px" loading="lazy" decoding="async" fallbackSrc="/assets/photo-unavailable.svg" fallbackAlt="Event poster unavailable"/>:<i>{identity.glyph}</i>}</span><b>↗</b></button>})}</div></section>
}
function EventDetail({data,id,session,notify}){
 const shouldReduceMotion=useReducedMotion();
 const e=findEntity(data.events,id);
 if(!e||(!e.published&&!e.publicStatus)||e.archived)return <section className="section page"><Back label="Back to events" to="/events"/><State title="Event not found." text="This event may be unpublished or archived."/></section>;
 const state=eventState(e);
 const eventPoster=e.poster||sourceEventMedia(e)?.photoItems?.find(item=>item?.url)?.url||'';
 const registrationTarget=safeExternalUrl(e.registrationUrl);
 const related=[...data.gallery.filter(g=>e.galleryIds?.includes(g.id)||g.eventId===e.id),...PDF_HUB_EXTRA_GALLERY.filter(g=>{const a=String(g.association||'').toLowerCase();const t=String(e.title||'').toLowerCase();const club=String(e.club||'').toLowerCase();return (t&&a&&t.includes(a))||(club&&a&&club.includes(a))||(a&&t.includes(a.split(' · ')[0]||'___'));})].filter((g,i,a)=>a.findIndex(x=>x.id===g.id)===i);
 const relatedClub=data.clubs.find(c=>String(c.id)===String(e.clubId)||String(c.name||'').trim().toLowerCase()===String(e.club||'').trim().toLowerCase());
 const identity=eventIdentity(e);
 const identityStyle={'--hub-accent':identity.accent,'--hub-accent-soft':`color-mix(in srgb, ${identity.accent} 12%, transparent)`,'--hub-accent-line':`color-mix(in srgb, ${identity.accent} 28%, transparent)`,'--identity-shape':`var(--jyc-shape-${identity.shape||'event'})`};
 const eventRegistrationEnd=String(e.dateEnd||e.date||'').trim();
 const eventEndMs=eventRegistrationEnd?( /^\d{4}-\d{2}-\d{2}$/.test(eventRegistrationEnd)?Date.parse(eventRegistrationEnd+'T23:59:59'):Date.parse(eventRegistrationEnd)):NaN;
 const eventEnded=Number.isFinite(eventEndMs)&&eventEndMs<Date.now();
 const deadlineRaw=String(e.registrationDeadline||'').trim();
 const deadlineMs=deadlineRaw?( /^\d{4}-\d{2}-\d{2}$/.test(deadlineRaw)?Date.parse(deadlineRaw+'T23:59:59'):Date.parse(deadlineRaw)):NaN;
 const deadlineAllowsRegistration=!deadlineRaw||(Number.isFinite(deadlineMs)&&deadlineMs>Date.now());
 const registrationPublished=e.publicStatus!=='planned'||e.registrationVerified===true;
 const regOpen=registrationPublished&&!eventEnded&&deadlineAllowsRegistration&&Boolean(safeExternalUrl(e.registrationUrl));
 const timeline=Array.isArray(e.timeline)?e.timeline:(Array.isArray(e.schedule)?e.schedule:[]);
 const relatedEvents=data.events.filter(x=>x.published&&!x.archived&&x.id!==e.id&&((e.clubId&&String(x.clubId)===String(e.clubId))||(e.club&&String(x.club||'').toLowerCase()===String(e.club).toLowerCase()))).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))).slice(0,3);
 return <section className="section page event-detail-page event-identity-page" data-hub={slug(e.club||'JYC')} style={identityStyle}><Breadcrumbs items={[{label:'Events',href:'/events'},{label:e.title}]}/><Back label="Back to events" to="/events"/><nav className="event-jump-nav" aria-label="Event sections"><a href="#event-overview">Overview</a>{timeline.length>0&&<a href="#event-programme">Programme</a>}{(e.rules?.length||e.eligibility||e.prizes?.length||e.faqs?.length)&&<a href="#event-info">Rules & info</a>}{related.length>0&&<a href="#event-gallery">Gallery</a>}<a href="#event-register">Register</a></nav>
  <div id="event-overview" className="event-detail-hero reveal" data-event={slug(e.slug||e.title)}><motion.div layoutId={`event-media-${slug(e.id||e.slug||e.title)}`} transition={{duration:shouldReduceMotion?0:.32,ease:[.22,1,.36,1]}} className="event-detail-poster" style={identityStyle}><div className="event-detail-poster-image-wrap">{eventPoster?<ResponsivePhoto src={eventPoster} alt="" loading="eager" fetchPriority="high" sizes="(max-width: 760px) 100vw, 50vw"/>:<div className="event-poster-fallback" aria-hidden="true">{identity.glyph||'JYC'}</div>}</div>{state==='live'&&<span className="live">LIVE NOW</span>}<span className="event-detail-badge">{fmtDate(e.date)}</span><span className="event-domain-mark">{identity.motif}</span></motion.div><div className="event-copy">{e.summitLogo&&<div className="event-summit-logo"><ResponsivePhoto src={e.summitLogo} alt={e.summitTitle||'JAI 2026 summit'} loading="eager" sizes="180px"/></div>}<div className="card-topline"><span className="tag">{e.club||'JYC'}</span><span className={`state-label ${e.publicStatus==='planned'?'planned':state}`}>{e.publicStatus==='planned'?'PLANNED':state.toUpperCase()}</span></div><div className="event-identity-lockup"><span className="event-identity-glyph">{identity.glyph||'◆'}</span><div><span className="event-identity-signature">{identity.signature}</span><small>{identity.motif}</small></div></div><h1>{e.title}</h1><div className="event-facts"><span>◷ {fmtDate(e.date)}{e.dateEnd?(' – '+fmtDate(e.dateEnd)):''} · {e.start||'TBA'}{e.end?(' – '+e.end):''}</span>{e.capacity&&<span>◉ Capacity {e.capacity}{e.waitlist?' · Waitlist enabled':''}</span>}<span>⌖ {e.venue||'Venue TBA'}{safeExternalUrl(e.map_url)&&<a className="inline-map" href={safeExternalUrl(e.map_url)} target="_blank" rel="noopener noreferrer">Map ↗</a>}</span></div><div className="event-reminder-row"><EventReminderControl event={e} notify={notify}/></div><p className="large-copy">{e.description||'Official JYC event details.'}</p>{e.publicStatus==='planned'&&<div className="event-planned-note">PLANNED PROGRAMME · The date comes from a source currently under review and may change before confirmation.</div>}{e.highlights?.length>0&&<div className="event-highlight-block"><span className="eyebrow">HIGHLIGHTS</span><ul className="feature-list">{e.highlights.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}{e.tracks?.length>0&&<div className="event-highlight-block event-track-grid"><span className="eyebrow">AGENTIC AI TRACKS</span><div className="event-track-cards">{e.tracks.map((x,i)=><article key={i}><b>0{i+1}</b><h3>{x.name}</h3><p>{x.detail}</p></article>)}</div></div>}{e.summitStats?.length>0&&<div className="event-highlight-block event-summit-stats"><span className="eyebrow">SUMMIT AT A GLANCE</span><div>{e.summitStats.map((x,i)=><span key={i}><b>{String(i+1).padStart(2,'0')}</b>{x}</span>)}</div></div>}{(e.rules?.length||e.eligibility||e.prizes?.length||e.faqs?.length)&&<section id="event-info" className="event-extended-info reveal"><div className="event-extended-grid">{e.eligibility&&<article><span className="eyebrow">ELIGIBILITY</span><h3>Who can participate?</h3><p>{e.eligibility}</p></article>}{e.rules?.length>0&&<article><span className="eyebrow">RULES</span><h3>Before you register.</h3><ul className="feature-list">{e.rules.map((x,i)=><li key={i}>{typeof x==='string'?x:x.text||x.title}</li>)}</ul></article>}{e.prizes?.length>0&&<article><span className="eyebrow">PRIZES</span><h3>Recognition & prizes.</h3><ul className="feature-list">{e.prizes.map((x,i)=><li key={i}>{typeof x==='string'?x:x.title||x.text}</li>)}</ul></article>}{e.faqs?.length>0&&<article><span className="eyebrow">FAQS</span><h3>Common questions.</h3><div className="event-faq-list">{e.faqs.map((x,i)=><details key={i}><summary>{x.question||x.q||'Question'}</summary><p>{x.answer||x.a||''}</p></details>)}</div></article>}</div></section>}{(e.speaker||e.guest)&&<div className="speaker"><span>FEATURED</span><strong>{e.speaker||e.guest}</strong><small>{e.speaker?'Speaker':'Guest'}</small></div>}{e.id==='jai-2026-jaypee-agentic-ai-hackathon'&&<><div className="event-external-links">{safeExternalUrl(e.officialUrl)&&<a href={safeExternalUrl(e.officialUrl)} target="_blank" rel="noopener noreferrer">Official JAI website ↗</a>}{safeExternalUrl(e.discordUrl)&&<a href={safeExternalUrl(e.discordUrl)} target="_blank" rel="noopener noreferrer">Discord ↗</a>}{safeExternalUrl(e.mapUrl)&&<a href={safeExternalUrl(e.mapUrl)} target="_blank" rel="noopener noreferrer">Venue map ↗</a>}</div><section className="event-jai-support"><div className="event-jai-qr">{regOpen&&registrationTarget?<><img src="https://www.jiityouthclub128.in/imgs/unstop-qr.png" alt="JAI 2026 Unstop registration QR" loading="lazy" decoding="async" onError={event=>{const image=event.currentTarget;image.style.display="none";image.alt="";image.setAttribute("aria-hidden","true");const label=image.parentElement?.querySelector("span");if(label)label.textContent="QR unavailable — use the link below"}}/><span>Scan to register</span><a className="event-jai-qr-link" href={registrationTarget} target="_blank" rel="noopener noreferrer">Open registration ↗</a></>:<div className="event-jai-registration-closed" role="status"><strong>{eventEnded?'Event completed':!deadlineAllowsRegistration?'Registration closed':'Registration link unavailable'}</strong><span>{eventEnded?'This event has ended.':!deadlineAllowsRegistration?'The published registration deadline has passed. Check the official event page above for updates.':'A verified registration link is not currently available. Check the official event page above for updates.'}</span></div>}</div><div><span className="eyebrow">OFFICIAL SUMMIT CONTACT</span><h3>Need help before you build?</h3><p>For team formation, participant questions and challenge submissions, contact the Hackathon Desk.</p><div className="event-jai-contact"><a href="mailto:hackathonquery.jai@gmail.com">hackathonquery.jai@gmail.com</a><a href="mailto:sponsorquery.jai@gmail.com">Sponsorship Desk</a></div><small>Supported by {e.sponsor||'RIDE Initiative'} · JIIT Wish Town, Sector 128, Noida.</small></div></section></>}{(e.officialUrl&&e.id!=='jai-2026-jaypee-agentic-ai-hackathon'||e.officialLinkedIn)&&<div className="event-external-links" aria-label="Official event sources">{safeExternalUrl(e.officialUrl)&&e.id!=='jai-2026-jaypee-agentic-ai-hackathon'&&<a href={safeExternalUrl(e.officialUrl)} target="_blank" rel="noopener noreferrer">Official website ↗</a>}{safeExternalUrl(e.officialLinkedIn)&&<a href={safeExternalUrl(e.officialLinkedIn)} target="_blank" rel="noopener noreferrer">Official LinkedIn ↗</a>}</div>}<div id="event-register" className="detail-actions">{regOpen&&safeExternalUrl(e.registrationUrl)?<a className="btn" href={safeExternalUrl(e.registrationUrl)} target="_blank" rel="noopener noreferrer">REGISTER NOW ↗</a>:e.registrationUrl?<Button secondary disabled>{eventEnded?'EVENT COMPLETED':!deadlineAllowsRegistration?'REGISTRATION CLOSED':'REGISTRATION LINK UNAVAILABLE'}</Button>:null}<ShareButton title={`Share ${e.title}`}/><EventTools event={e}/><DownloadICS event={e}/></div>{(()=>{const media=sourceEventMedia(e);return media.items.length>0?<section className="event-source-gallery reveal" aria-label={`${e.title} source photography`}><div className="section-inline-head"><div><span className="eyebrow">VISUAL RECORD</span><h2>Moments from the JYC archive.</h2><p>Published source photography connected to this experience. Images retain their available collection and page context.</p></div><span className="event-source-count">{media.items.length} source visuals</span></div><LivingPhoto items={media.items.map((m,i)=>({...m,association:e.title,event:e.title,id:m.id||`event-${e.id}-${i}`}))} seed={0} interval={6000} className="event-living-photo"/></section>:null})()}{(e.contactName||e.contactEmail||e.contactPhone)&&<div className="contact-line"><b>Contact</b><span>{e.contactName}</span><span>{e.contactEmail}</span><span>{e.contactPhone}</span></div>}</div></div>
  {(timeline.length>0||relatedClub)&&<div id="event-programme" className="event-context-grid reveal"><aside className="event-identity-panel"><span className="eyebrow">EVENT DNA</span><strong>{identity.display||'JYC EVENT'}</strong><span>{identity.traits?.join(' · ')}</span><small>{identity.motif}</small></aside>{timeline.length>0&&<section className="event-context-card"><span className="eyebrow">PROGRAMME</span><h2>How the experience unfolds.</h2><div className="event-timeline">{timeline.map((x,i)=><div key={x.id||i}><b>{x.time||x.date||String(i+1).padStart(2,'0')}</b><div><strong>{x.title||x.name||'Programme item'}</strong>{(x.description||x.venue)&&<span>{x.description||x.venue}</span>}</div></div>)}</div></section>}{relatedClub&&<section className="event-context-card event-related-club"><span className="eyebrow">COMMUNITY CONNECTION</span><h2>Presented with {relatedClub.name}.</h2><p>{relatedClub.description||relatedClub.about||identity.signature}</p><a className="text-link" href={`/clubs/${slug(relatedClub.name)}`}>Explore the hub →</a></section>}</div>}
  {related.length>0&&<div id="event-gallery"><DetailSection title="Event gallery"><GalleryItems items={related}/></DetailSection></div>}
  {relatedEvents.length>0&&<section className="event-related-events reveal"><div className="section-inline-head"><div><span className="eyebrow">MORE FROM {e.club||'JYC'}</span><h2>Other experiences.</h2></div><a className="text-link" href="/events">All events →</a></div><div className="event-related-grid">{relatedEvents.map(x=><a className="event-related-card" key={x.id} href={`/events/${slug(x.title)}`}><small>{fmtDate(x.date)} · {x.start||'TBA'}</small><strong>{x.title}</strong><span>{x.venue||'Venue TBA'}</span><b>Open →</b></a>)}</div></section>}
  </section>
}

function Announcements({data}){
 const updates=[];
 if(data.announcement?.on&&data.announcement?.text) updates.push({title:'JYC Update',text:data.announcement.text,link:data.announcement.link||''});
 const upcoming=data.events.filter(e=>{
  if(!e.published||e.archived||eventState(e)==='past'||(e.publicStatus==='planned'&&e.registrationVerified!==true))return false;
  const url=safeExternalUrl(e.registrationUrl);
  const deadline=String(e.registrationDeadline||'').trim();
  const deadlineMs=deadline?Date.parse(/T\d{2}:\d{2}/.test(deadline)?deadline:deadline+'T23:59:59'):NaN;
  return Boolean(url)&&(!Number.isFinite(deadlineMs)||deadlineMs>Date.now());
 }).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))).slice(0,8);
 upcoming.forEach(e=>updates.push({title:`Registration · ${e.title}`,text:`${fmtDate(e.date)} · ${e.venue||'Venue TBA'} · ${e.club||'JYC'}`,link:`/events/${slug(e.slug||e.title)}`}));
 return <section className="section page announcements-page unified-public-page"><Breadcrumbs items={[{label:'Announcements'}]}/><EcosystemContextRail/><div className="announcements-hero reveal"><div><span className="eyebrow">JYC UPDATES</span><h1>Know what needs your attention.</h1><p>Registrations, notices and published updates — kept simple, current and action-oriented.</p></div><div className="announcements-mark"><LogoImage alt="JIIT Youth Club"/><span>STAY UPDATED · STAY CONNECTED</span></div></div><div className="announcement-index reveal">{updates.length?updates.map((u,i)=><article key={i} className="announcement-card"><span>{String(i+1).padStart(2,'0')}</span><div><small>JYC UPDATE</small><h2>{u.title}</h2><p>{u.text}</p>{u.link&&<a className="text-link" href={u.link.startsWith('/')?u.link:safeExternalUrl(u.link)||'#'} target={u.link.startsWith('/')?'_self':'_blank'} rel={u.link.startsWith('/')?undefined:'noopener noreferrer'}>Open update →</a>}</div></article>):<State title="No announcements published." text="When JYC publishes a notice, registration update or important announcement, it will appear here."/>}</div><div className="announcement-footer-card reveal"><span className="eyebrow">OFFICIAL SOURCE OF TRUTH</span><h2>Follow JYC without missing the campus rhythm.</h2><p>Use Events for full event details, Clubs for communities and Gallery for the visual record.</p><div className="hero-actions"><Button onClick={()=>window.location.assign('/events')}>Explore events →</Button><Button secondary onClick={()=>window.location.assign('/clubs')}>Explore clubs →</Button></div></div></section>
}
function EditorialCard({item,index,label='PUBLIC RECORD'}){
 return <article className="achievement-feature reveal"><div><span className="eyebrow">{label} · {item.year||'CURRENT'}</span><h2>{item.title}</h2><p>{item.summary}</p>{item.community&&<p><strong>Community:</strong> {item.community}</p>}{item.status&&<p><strong>Outcome:</strong> {item.status}</p>}{item.sourceUrl&&<a className="text-link" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.sourceLabel||'Official source'} ↗</a>}{!item.sourceUrl&&item.sourceLabel&&<small>{item.sourceLabel}</small>}</div><span className="achievement-number">{String(index+1).padStart(2,'0')}</span></article>
}
function Achievements({data}){
 const nav=useNavigate();
 const derived=(data.clubs||[]).flatMap(c=>(Array.isArray(c.achievements)?c.achievements:[]).map((x,i)=>({id:`club-${c.id}-achievement-${i}`,title:typeof x==='string'?x:(x.title||x.text||'Published club achievement'),summary:typeof x==='string'?x:(x.text||x.summary||''),community:c.name,year:x?.year||'',sourceUrl:x?.sourceUrl||'',sourceLabel:x?.sourceLabel||'Published JYC club record'})));
 const records=[...JYC_EDITORIAL_ACHIEVEMENTS,...derived].filter((x,i,a)=>a.findIndex(y=>y.id===x.id||String(y.title).toLowerCase()===String(x.title).toLowerCase())===i);
 return <section className="section page achievements-page unified-public-page"><Breadcrumbs items={[{label:'Achievements'}]}/><EcosystemContextRail/><div className="achievements-hero reveal"><div><span className="eyebrow">JYC WALL OF FAME</span><h1>What the community has built.</h1><p>Recognition, competition outcomes and community milestones — published only when a source can be attributed.</p></div><div className="achievements-seal"><span>{records.length}</span><strong>RECORDS</strong><small>JYC · 128</small></div></div><div className="announcement-index">{records.map((item,i)=><EditorialCard key={item.id||i} item={item} index={i} label="ACHIEVEMENT"/>)}</div><section className="achievement-footer-card reveal"><span className="eyebrow">SOURCE-FIRST RECORD</span><h2>Recognition without invented claims.</h2><p>New awards, finalist positions, projects and competition results can be added as JYC publishes verified records.</p><div className="hero-actions"><Button onClick={()=>nav('/events')}>Explore events →</Button><Button secondary onClick={()=>nav('/archive')}>Open archive →</Button></div></section></section>
}
function addCalendar(e){const dt=(s,t)=>{const [y,m,d]=String(s||'').split('-');const raw=String(t||'00:00').trim();const parts=raw.split(':');const hh=String(Math.max(0,Math.min(23,Number(parts[0]||0)))).padStart(2,'0');const mm=String(Math.max(0,Math.min(59,Number(parts[1]||0)))).padStart(2,'0');return `${y}${m}${d}T${hh}${mm}00`};if(!e?.date)return;const startTime=e.start||'09:00';const start=dt(e.date,startTime);const startDate=new Date(`${e.date}T${startTime}:00`);const endDate=e.dateEnd||e.date;const endTime=e.end||(e.dateEnd?'23:59':new Date(startDate.getTime()+60*60*1000).toTimeString().slice(0,5));const end=dt(endDate,endTime);const url=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title||'JYC Event')}&dates=${start}/${end}&details=${encodeURIComponent(e.description||'')}&location=${encodeURIComponent(e.venue||'')}`;window.open(url,'_blank','noopener')}
function Calendar({events}){const by=events.reduce((a,e)=>{(a[e.date]??=[]).push(e);return a},{});return <div className="calendar">{Object.keys(by).sort().map(d=><div className="calendar-day" key={d}><div><span>{fmtDate(d)}</span><b>{by[d].length}</b></div>{by[d].map(e=><div className="calendar-event" key={e.id}><strong>{e.publicStatus==='planned'?'PLANNED':e.start||'TBA'}</strong><span>{e.title}</span><small>{e.club||'JYC'} · {e.venue||'TBA'}</small></div>)}</div>)}{!events.length&&<State compact title="Calendar is empty." text="Published events will appear here."/>}</div>}
function Fest({data}){
 const f=data.fest||{};
 const rows=Array.isArray(f.events)?f.events:[];
 const [tab,setTab]=useState('now');
 const [q,setQ]=useState('');
 const [category,setCategory]=useState('All');
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[]);
 const allowedFestThemes=['jyc'];
 const storedFestTheme=storageGet(`jyc-fest-theme-${f.id||f.name||'default'}`,null);
 const [festTheme,setFestTheme]=useState(()=>allowedFestThemes.includes(storedFestTheme)?storedFestTheme:(allowedFestThemes.includes(f.theme)?f.theme:'jyc'));
 const theme=festTheme;
 const categories=[...new Set(['All',...(Array.isArray(f.categories)?f.categories:[]),...rows.map(e=>e.category).filter(Boolean)])];
 const normalizeStatus=e=>String(e.status||'Upcoming').toLowerCase();
 const searchText=q.trim().toLowerCase();
 const filtered=rows.filter(e=>category==='All'||String(e.category||'')===category).filter(e=>!searchText||`${e.name||''} ${e.venue||''} ${e.category||''} ${e.day||''}`.toLowerCase().includes(searchText));
 const liveRows=filtered.filter(e=>normalizeStatus(e)==='live');
 const upcomingRows=filtered.filter(e=>!['past','live'].includes(normalizeStatus(e)));
 const pastRows=filtered.filter(e=>normalizeStatus(e)==='past');
 const current=liveRows[0]||((f.liveNow||f.liveVenue)?{id:'live-now',name:f.liveNow||'Happening now',venue:f.liveVenue||'Venue TBA',status:'Live'}:null);
 const tabRows=tab==='past'?pastRows:tab==='schedule'?filtered:[...liveRows,...upcomingRows].slice(0,10);
 const splitLines=value=>Array.isArray(value)?value.filter(Boolean):String(value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
 const updates=splitLines(f.announcements);
 const results=splitLines(f.results);
 const startMs=f.startDate?new Date(`${f.startDate}T00:00:00`).getTime():NaN;
 const endMs=f.endDate?new Date(`${f.endDate}T23:59:59`).getTime():NaN;
 const countdownTarget=Number.isFinite(startMs)&&now<startMs?startMs:(Number.isFinite(endMs)&&now<endMs?endMs:null);
 const countdown=countdownTarget?Math.max(0,countdownTarget-now):0;
 const cd={days:Math.floor(countdown/86400000),hours:Math.floor(countdown%86400000/3600000),minutes:Math.floor(countdown%3600000/60000),seconds:Math.floor(countdown%60000/1000)};
 const share=async()=>{try{if(navigator.share)await navigator.share({title:f.name||'JYC Fest',text:f.description||'JYC Fest',url:location.href});else{await navigator.clipboard?.writeText(location.href);jycToast('Fest link copied.')}}catch{}};
 const changeFestTheme=next=>{
  if(!allowedFestThemes.includes(next)||next===festTheme)return;
  const apply=()=>{setFestTheme(next);storageSet(`jyc-fest-theme-${f.id||f.name||'default'}`,next)};
  document.body.classList.add('fest-theme-switching');
  try{
   if(document.startViewTransition){const t=document.startViewTransition(apply);t.finished?.finally(()=>window.setTimeout(()=>document.body.classList.remove('fest-theme-switching'),260))}
   else{apply();window.setTimeout(()=>document.body.classList.remove('fest-theme-switching'),720)}
  }catch{apply();window.setTimeout(()=>document.body.classList.remove('fest-theme-switching'),720)}
 };
 const programmeEvent=e=>({...eventTemplate,title:e.name||'JYC Fest Programme',date:e.date||f.startDate||'',start:e.time||'00:00',end:e.end||e.time||'23:59',venue:e.venue||'',description:`${e.category||'JYC Fest'} · ${e.day||''}`});
 const addProgrammeCalendar=e=>{if(e.date||f.startDate)addCalendar(programmeEvent(e));else jycToast('Add a date to this programme item first.','error')};
 const navLabel=tab==='schedule'?'FULL SCHEDULE':tab==='past'?'FEST ARCHIVE':'NEXT ON THE PROGRAMME';
 return <div className={`fest-shell fest-theme-${theme}`}>
  <span key={festTheme} className="fest-theme-sheen" aria-hidden="true"/>
  <div className="fest-global-nav"><span className="fest-mark">JYC</span><strong>{f.name||'JYC FEST'}</strong><span className="fest-live-indicator"><i/>FEST EXPERIENCE</span><div className="fest-theme-switcher" aria-label="Fest visual themes">{allowedFestThemes.map(id=><button type="button" key={id} className={festTheme===id?'active':''} onClick={()=>changeFestTheme(id)} title={`Use ${id} fest theme`} aria-label={`Use ${id} fest theme`}><i className={`fest-theme-dot dot-${id}`}/></button>)}</div><button type="button" className="fest-share-btn" onClick={share}>Share ↗</button></div>
  <section className="fest-hero-full"><div className="fest-hero-photo-wall" aria-hidden="true">{f.banner?<ResponsivePhoto src={f.banner} alt="" loading="eager" fetchPriority="high" sizes="(max-width: 760px) 100vw, 60vw"/>:null}</div><div className="fest-hero-inner"><div className="fest-logo-wrap">{f.logo?<ResponsivePhoto src={f.logo} alt="" loading="lazy" sizes="160px"/>:<LogoImage alt="JYC"/>}</div><span className="eyebrow">JYC · FEST EXPERIENCE</span><h1>{f.name||'JYC Fest Experience'}</h1><p>{f.description||'The JYC campus is getting ready for a new experience.'}</p><div className="fest-date-line">{f.startDate&&fmtDate(f.startDate)}{f.endDate&&` — ${fmtDate(f.endDate)}`}</div>{countdownTarget&&<div className="fest-countdown" aria-label="Fest countdown"><div><b>{String(cd.days).padStart(2,'0')}</b><span>DAYS</span></div><div><b>{String(cd.hours).padStart(2,'0')}</b><span>HOURS</span></div><div><b>{String(cd.minutes).padStart(2,'0')}</b><span>MINUTES</span></div><div><b>{String(cd.seconds).padStart(2,'0')}</b><span>SECONDS</span></div></div>}{current&&<div className="fest-live-pulsebar"><i/> LIVE PROGRAMME · {current.name}{current.venue?` · ${current.venue}`:''}</div>}</div></section>
  <section className="fest-content">
   <div className="fest-controlbar"><label className="fest-search"><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search programme, venue or category..." aria-label="Search fest programme"/></label><button type="button" className="fest-nav-theme" onClick={share}>Share fest ↗</button></div>
   <div className="fest-category-scroll" aria-label="Programme categories">{categories.map(c=><button type="button" key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
   <div className="fest-board"><div className="fest-live-card">{current?<><div className="live-label"><i/> LIVE NOW</div><h2>{current.name}</h2><p>{current.venue||'Venue TBA'}{current.day?` · ${current.day}`:''}{current.time?` · ${current.time}`:''}</p><div className="fest-live-actions"><button type="button" className="primary" onClick={()=>setTab('schedule')}>Open live board →</button>{current.id!=='live-now'&&<button type="button" onClick={()=>addProgrammeCalendar(current)}>Add to calendar</button>}</div></>:<><span className="eyebrow">FEST LIVE BOARD</span><h2>The stage is getting ready.</h2><p>Live programme updates will appear here when the fest schedule is published.</p><div className="fest-empty-actions"><button type="button" onClick={()=>setTab('schedule')}>View schedule</button><button type="button" onClick={share}>Share fest</button></div></>}</div><div className="fest-upnext-card"><span className="eyebrow">UP NEXT</span>{upcomingRows[0]?<><h3>{upcomingRows[0].name}</h3><p>{upcomingRows[0].day||''}{upcomingRows[0].time?` · ${upcomingRows[0].time}`:''}{upcomingRows[0].venue?` · ${upcomingRows[0].venue}`:''}</p><button type="button" className="fest-nav-theme" onClick={()=>addProgrammeCalendar(upcomingRows[0])}>Add to calendar</button></>:<p>No upcoming programme published.</p>}<div className="fest-stats"><div><b>{liveRows.length}</b><span>Live</span></div><div><b>{upcomingRows.length}</b><span>Upcoming</span></div><div><b>{pastRows.length}</b><span>Archived</span></div></div></div></div>
   <div className="fest-tabs"><button type="button" className={tab==='now'?'active':''} onClick={()=>setTab('now')}>Now</button><button type="button" className={tab==='schedule'?'active':''} onClick={()=>setTab('schedule')}>Full Schedule</button><button type="button" className={tab==='announcements'?'active':''} onClick={()=>setTab('announcements')}>Announcements</button><button type="button" className={tab==='results'?'active':''} onClick={()=>setTab('results')}>Results</button><button type="button" className={tab==='gallery'?'active':''} onClick={()=>setTab('gallery')}>Gallery</button><button type="button" className={tab==='past'?'active':''} onClick={()=>setTab('past')}>Archive</button></div>
   {tab==='announcements'?<div className="fest-update-grid"><section className="fest-update-card"><span className="eyebrow">FEST UPDATES</span><h3>Latest announcements</h3><div className="fest-update-list">{updates.length?updates.map((x,i)=><article key={i}><strong>UPDATE {String(i+1).padStart(2,'0')}</strong><span>{x}</span></article>):<State compact title="No announcements yet." text="Published fest updates will appear here."/>}</div></section><section className="fest-update-card"><span className="eyebrow">QUICK ACTIONS</span><h3>Stay connected.</h3><p>Share the official fest page and keep the live board close while the programme changes.</p><div className="fest-empty-actions"><button type="button" onClick={share}>Share fest ↗</button><button type="button" onClick={()=>setTab('schedule')}>View schedule →</button></div></section></div>:tab==='results'?<div className="fest-update-grid"><section className="fest-update-card"><span className="eyebrow">RESULTS</span><h3>Winners & outcomes</h3><div className="fest-update-list">{results.length?results.map((x,i)=><article key={i}><strong>RESULT {String(i+1).padStart(2,'0')}</strong><span>{x}</span></article>):<State compact title="Results will appear here." text="Publish winners or outcomes from the JYC Control Center."/>}</div></section><section className="fest-update-card"><span className="eyebrow">ARCHIVE</span><h3>Keep the story alive.</h3><p>Past programme items remain available in the archive, while published fest photos can live in the Gallery tab.</p><button type="button" className="fest-nav-theme" onClick={()=>setTab('past')}>Open archive →</button></section></div>:tab==='gallery'?<div className="fest-gallery-panel"><span className="eyebrow">FEST GALLERY</span><h2>Moments from the experience.</h2><GalleryItems items={data.gallery.filter(g=>g.festId===f.id||g.association===f.name||g.association==='fest:'+f.id)}/>{!data.gallery.some(g=>g.festId===f.id||g.association===f.name||g.association==='fest:'+f.id)&&<State compact title="Gallery coming soon." text="Fest photos will appear here when published."/>}</div>:<DetailSection title={navLabel}><div className="fest-programme-grid">{tabRows.map((e,i)=><article className="fest-programme-row" key={e.id||i}><div className="fest-programme-time"><b>{e.time||'—'}</b><span>{e.day||'Date TBA'}</span></div><div className="fest-programme-main"><strong>{e.name||'Untitled programme'}</strong><span>{e.venue||'Venue TBA'}{e.category?` · ${e.category}`:''}</span></div><div className="fest-programme-meta"><em className={normalizeStatus(e)==='live'?'live':''}>{String(e.status||'Upcoming').toUpperCase()}</em>{safeExternalUrl(e.link)&&<a className="fest-nav-theme" href={safeExternalUrl(e.link)} target="_blank" rel="noopener noreferrer">Details ↗</a>}{(e.date||f.startDate)&&<button type="button" className="fest-nav-theme" onClick={()=>addProgrammeCalendar(e)}>＋ Calendar</button>}</div></article>)}{!tabRows.length&&<State compact title={tab==='past'?'No archived programme.':'Schedule coming soon.'} text="The fest programme has not been published yet."/>}</div></DetailSection>}
  </section><nav className="fest-mobile-dock" aria-label="Fest navigation">{[['now','Now','●'],['schedule','Schedule','☷'],['announcements','Updates','!'],['results','Results','◇'],['gallery','Gallery','▧']].map(([id,label,icon])=><button type="button" key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><span>{icon}</span>{label}</button>)}</nav>
 </div>
}


const rootElement=document.getElementById('root');
if(rootElement){createRoot(rootElement).render(<ErrorBoundary><BrowserRouter><App/></BrowserRouter></ErrorBoundary>);}
