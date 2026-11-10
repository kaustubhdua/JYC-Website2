import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {isDerivativeDimensionEligible,orientedImageDimensions} from '../src/jyc-photo-intelligence.js';
const {JYC_SOURCE_ARCHIVE_PHOTO_ITEMS}=await import('../src/jyc-source-media.js');
const allowedArchive=new Set(JYC_SOURCE_ARCHIVE_PHOTO_ITEMS.map(item=>String(item?.url||'')));
const root=path.resolve('public/assets');
const outputRoot=path.resolve('public/assets/photo-derivatives');
const WIDTHS=[240,320,360,480,960,1600];
// Keep Vercel's small build machines responsive: Sharp already uses native workers,
// so a small JS work queue avoids turning derivative generation into a serial bottleneck
// without oversubscribing a 2-core builder.
sharp.concurrency(Math.min(2,Math.max(1,Number(process.env.JYC_SHARP_CONCURRENCY||2))));
const CONCURRENCY=Math.min(2,Math.max(1,Number(process.env.JYC_DERIVATIVE_CONCURRENCY||2)));
const ALLOWED=['source-archive','hub-photos','hub-photos-extra','events','home','team','banners','logos'];
const derivativeBaseForRel=rel=>{
 const extension=path.extname(rel).slice(1).toLowerCase();
 const stem=rel.slice(0,-extension.length-1);
 return rel.startsWith('logos/')||rel.startsWith('banners/')?`${stem}-${extension}`:stem;
};
const inputFiles=[];
const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(/\.(jpe?g|png|webp)$/i.test(file))inputFiles.push(file)}};
walk(root);
const sourceFiles=inputFiles.filter(file=>{if(file.includes(path.join('photo-derivatives',path.sep)))return false;const url='/assets/'+path.relative(root,file).replaceAll(path.sep,'/');if(url.startsWith('/assets/source-archive/'))return allowedArchive.has(url);return ALLOWED.some(folder=>url.startsWith('/assets/'+folder+'/'));});
const derivativeBaseOwners=new Map();
const duplicateDerivativeBases=[];
for(const file of sourceFiles){
 const rel=path.relative(root,file).replaceAll(path.sep,'/');
 const base=derivativeBaseForRel(rel);
 const previous=derivativeBaseOwners.get(base);
 if(previous)duplicateDerivativeBases.push({base,files:[previous,path.relative(root,file).replaceAll(path.sep,'/') ]});
 else derivativeBaseOwners.set(base,path.relative(root,file).replaceAll(path.sep,'/'));
}
if(duplicateDerivativeBases.length){
 console.error('Photo derivative output-name collisions: '+JSON.stringify(duplicateDerivativeBases.slice(0,12)));
 process.exit(1);
}
let generated=0,failed=0,skipped=0,completed=0,removed=0,reused=0;
const expectedDerivativeBases=new Set(sourceFiles.map(file=>derivativeBaseForRel(path.relative(root,file).replaceAll(path.sep,'/'))));
const pruneOrphanDerivatives=dir=>{if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory()){pruneOrphanDerivatives(file);continue}if(!/\.(?:avif|webp)$/i.test(entry.name))continue;const rel=path.relative(outputRoot,file).replaceAll(path.sep,'/');const match=rel.match(/-(\d+)\.(?:avif|webp)$/i);if(!match||!WIDTHS.includes(Number(match[1]))||!expectedDerivativeBases.has(rel.replace(/-\d+\.(?:avif|webp)$/i,''))){fs.rmSync(file,{force:true});removed++}}};
pruneOrphanDerivatives(outputRoot);
const processFile=async file=>{
 const rel=path.relative(root,file).replaceAll(path.sep,'/');
 const base=derivativeBaseForRel(rel);
 const outDir=path.join(outputRoot,path.dirname(rel));
 const sourceStat=fs.statSync(file);
 fs.mkdirSync(outDir,{recursive:true});
 const outputPath=(width,format)=>path.join(outDir,path.basename(base)+'-'+width+'.'+format);
 const removeVariant=(width,format)=>{const out=outputPath(width,format);if(fs.existsSync(out)){fs.rmSync(out);removed++}};
 try{
  const meta=await sharp(file).metadata();
  const display=orientedImageDimensions(meta.width,meta.height,meta.orientation);
  if(!display||!isDerivativeDimensionEligible(display.width,display.height)){
   for(const width of WIDTHS)for(const format of ['avif','webp'])removeVariant(width,format);
   skipped++;
   return;
  }
  for(const width of WIDTHS){
   if(width>display.width){for(const format of ['avif','webp'])removeVariant(width,format);continue}
   for(const format of ['avif','webp']){
    const out=outputPath(width,format);
    if(fs.existsSync(out)){
     try{
      const [outStat,outMeta]=await Promise.all([fs.promises.stat(out),sharp(out).metadata()]);
      const expectedHeight=Math.round(display.height*width/display.width);
      if(outStat.mtimeMs>=sourceStat.mtimeMs&&outMeta.width===width&&Math.abs((outMeta.height||0)-expectedHeight)<=1){reused++;continue}
     }catch{}
    }
    const pipeline=sharp(file).rotate().resize({width,withoutEnlargement:true});
    if(format==='avif')await pipeline.avif({quality:52,effort:2}).toFile(out);
    else await pipeline.webp({quality:82,effort:3}).toFile(out);
    generated++;
   }
  }
 }catch(error){const optionalBrandAsset=rel.startsWith('logos/')||rel.startsWith('banners/');if(optionalBrandAsset)skipped++;else failed++;console.warn(optionalBrandAsset?'Derivative skipped; original asset remains available:':'Derivative failed:',rel,error?.message||error)}
 finally{
  completed++;
  if(completed%25===0||completed===sourceFiles.length)console.log('Photo derivatives: '+completed+'/'+sourceFiles.length+' files processed');
 }
};
let cursor=0;
const workers=Array.from({length:Math.min(CONCURRENCY,sourceFiles.length)},async()=>{
 while(true){
  const index=cursor++;
  if(index>=sourceFiles.length)return;
  await processFile(sourceFiles[index]);
 }
});
await Promise.all(workers);
console.log('Photo derivatives: generated='+generated+' skipped='+skipped+' failed='+failed+' removed='+removed+' reused='+reused+' concurrency='+Math.min(CONCURRENCY,sourceFiles.length));
if(failed>0)process.exitCode=1;
