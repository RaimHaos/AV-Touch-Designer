import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1600,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
const save=async()=>{const pending=page.waitForEvent('download');await page.getByRole('button',{name:'JSON保存',exact:true}).click();return JSON.parse(await readFile(await (await pending).path(),'utf8'))};
const load=async data=>{await page.locator('input[type=file]').setInputFiles({name:'project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await page.waitForTimeout(100)};
const exportHTML=async()=>{const pending=page.waitForEvent('download');await page.getByRole('button',{name:'HTML出力',exact:true}).click();const zip=await pending;await zip.saveAs('test-results/system-runtime.zip');return execFileSync('unzip',['-p','test-results/system-runtime.zip','index.html'],{encoding:'utf8',maxBuffer:4*1024*1024})};
const chromeStyles=()=>page.evaluate(()=>['.editor-header','.sidebar-left','.inspector','.editor-ribbon','.template-buttons button'].map(selector=>{const s=getComputedStyle(document.querySelector(selector));return [s.backgroundColor,s.color,s.borderColor]}));
const panelButtonStyles=locator=>locator.evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,color:s.color,border:s.borderColor,radius:s.borderRadius}});
try{
 await mkdir('test-results',{recursive:true});await page.goto('http://127.0.0.1:4173');
 let data=await save();const startup=data.pages.find(p=>p.role==='startup');assert(startup);assert.equal(data.startPageId,startup.id);assert.equal(data.pages.filter(p=>p.role==='startup').length,1);
 await page.getByRole('button',{name:'プレビュー',exact:true}).click();await expect(page.getByRole('button',{name:'システムを起動',exact:true})).toBeVisible();await page.getByRole('button',{name:'システムを起動',exact:true}).click();
 await page.getByRole('button',{name:'Wireless',exact:true}).click();const wireless=page.getByRole('button',{name:'Wireless',exact:true});assert.equal(await wireless.getAttribute('aria-pressed'),'true');assert.notEqual((await panelButtonStyles(wireless)).background,(await panelButtonStyles(page.getByRole('button',{name:'PC',exact:true}))).background);assert.equal(await page.locator('.selection-indicator').count(),0);
 await page.getByRole('button',{name:/電源 OFF/}).click({delay:2150});await page.getByRole('button',{name:'キャンセル',exact:true}).click();await expect(page.getByRole('button',{name:'Wireless',exact:true})).toBeVisible();
 await page.getByRole('button',{name:/電源 OFF/}).click({delay:2150});await page.getByRole('button',{name:'OFFにする',exact:true}).click();await expect(page.getByRole('button',{name:'システムを起動',exact:true})).toBeVisible();await page.getByRole('button',{name:'システムを起動',exact:true}).click();await expect(page.getByRole('button',{name:/電源 OFF/})).toBeVisible();await page.getByRole('button',{name:'編集へ戻る',exact:true}).click();
 const baseline=await chromeStyles();assert.equal(baseline[0][0],'rgb(255, 255, 255)');const backgrounds=new Set();
 for(const [label,id] of [['ダーク・シアン','modern-dark'],['ライト・ブルー','minimal-light'],['ネイビー','navy-blue'],['ウォーム','warm-light']]){
  await page.getByRole('tab',{name:'デザイン',exact:true}).click();await page.getByRole('button',{name:label,exact:true}).click();assert.deepEqual(await chromeStyles(),baseline);
  data=await save();assert.equal(data.themeId,id);await load(data);assert.equal((await save()).themeId,id);assert.equal((await save()).pages.filter(p=>p.role==='startup').length,1);
  backgrounds.add(await page.locator('.editor-canvas').evaluate(el=>getComputedStyle(el).backgroundColor));
  const startId=data.pages.find(p=>p.role==='startup').elements.find(e=>e.type==='button').id;const editorButton=await panelButtonStyles(page.locator(`.editor-canvas [data-element-id="${startId}"] .av-button`));
  await page.screenshot({path:`test-results/theme-${id}.png`});const html=await exportHTML();const runtime=await browser.newPage({viewport:{width:1280,height:800}});runtime.on('pageerror',e=>errors.push(e.message));let external=0;await runtime.route('**/*',route=>{external++;return route.abort()});await runtime.setContent(html);await expect(runtime.getByRole('button',{name:'システムを起動',exact:true})).toBeVisible();
  assert.deepEqual(await panelButtonStyles(runtime.getByRole('button',{name:'システムを起動',exact:true})),editorButton,'panel buttons must not inherit editor chrome');await runtime.getByRole('button',{name:'システムを起動',exact:true}).click();await runtime.getByRole('button',{name:'Wireless',exact:true}).click();assert.equal(await runtime.locator('.selection-indicator').count(),0);
  await runtime.getByRole('button',{name:/電源 OFF/}).click({delay:2150});await runtime.getByRole('button',{name:'OFFにする',exact:true}).click();await expect(runtime.getByRole('button',{name:'システムを起動',exact:true})).toBeVisible();assert.equal(external,0);await runtime.close();
 }
 assert.equal(backgrounds.size,4);
 // Explicit startup template works for legacy projects; power import reuses it, persists and undoes atomically.
 const legacy=JSON.parse(await readFile('../examples/sample-project-v2.json','utf8'));await load(legacy);await page.getByRole('button',{name:'起動ページテンプレート',exact:true}).click();data=await save();assert.equal(data.pages.filter(p=>p.role==='startup').length,1);assert.equal(data.startPageId,data.pages.find(p=>p.role==='startup').id);
 await page.getByRole('button',{name:'元に戻す',exact:true}).click();assert.equal((await save()).pages.length,1);await page.getByRole('button',{name:'やり直す',exact:true}).click();assert.equal((await save()).pages.length,2);
 // Select main before adding power so the generated component lives on the operating page.
 await page.locator('.sidebar-left').getByRole('button',{name:'メイン',exact:true}).click();await page.getByRole('button',{name:'電源テンプレート',exact:true}).click();data=await save();const pwr=data.pages.flatMap(p=>p.elements).find(e=>e.type==='powerControl');const popup=data.popups.find(p=>p.id===pwr.props.popupId);assert(popup.elements.some(e=>e.interactions?.onTap?.some(a=>a.type==='navigate'&&a.pageId===data.startPageId)));assert.equal(data.pages.filter(p=>p.role==='startup').length,1);await load(data);assert.equal((await save()).pages.filter(p=>p.role==='startup').length,1);
 await page.getByRole('button',{name:'プレビュー',exact:true}).click();await page.getByRole('button',{name:'システムを起動',exact:true}).click();await expect(page.getByRole('button',{name:/電源 OFF/})).toBeVisible();await page.getByRole('button',{name:/電源 OFF/}).click({delay:2150});await page.getByRole('button',{name:'OFFにする',exact:true}).click();await expect(page.getByRole('button',{name:'システムを起動',exact:true})).toBeVisible();
 assert.deepEqual(errors,[]);console.log('PASS: startup cycle / automatic OFF routing / startup reuse + undo / marker-free selection / 4 panel designs / fixed white editor / offline export parity');
}finally{await browser.close()}
