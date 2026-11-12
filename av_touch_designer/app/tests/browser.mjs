import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,readFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1600,height:1100}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
await mkdir('test-results',{recursive:true});
const download=async(name)=>{const pending=page.waitForEvent('download');await page.getByRole('button',{name,exact:true}).click();const d=await pending;const path=await d.path();return readFile(path,'utf8')};
const save=async()=>JSON.parse(await download('JSON保存'));
const load=async data=>{await page.locator('input[type=file]').setInputFiles({name:'test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await page.waitForTimeout(150)};
const fixture=JSON.parse(await readFile('../examples/sample-project-v2.json','utf8'));
const element=(id,x,y,w=100,h=60)=>({id,type:'button',x,y,width:w,height:h,zIndex:2,locked:false,props:{text:id},interactions:{}});
fixture.pages[0].elements=[{...element('panel',40,60,600,400),type:'panel',zIndex:1,props:{title:'追従パネル',responsive:true}},element('a',80,140),element('b',300,220,120),element('c',480,320)];
fixture.pages[0].elements[1].interactions={hold:{durationMs:1000,indicator:'outline'},onTap:[{type:'setValue',stateKey:'volume',value:10}],onLongPressComplete:[{type:'setValue',stateKey:'volume',value:90}]};
fixture.pages[0].elements.push({...element('meter',700,120,400,112),type:'volume',props:{label:'検証音量',stateKey:'volume',muteStateKey:'muted'}});
try {
await page.goto('http://127.0.0.1:4173');await load(fixture);
// Real inspector resizing propagates geometry and survives JSON round trip / undo.
await page.locator('.editor-canvas [data-element-id=panel]').click({position:{x:10,y:10}});
await page.getByRole('spinbutton',{name:'width',exact:true}).fill('900');await page.getByRole('spinbutton',{name:'width',exact:true}).press('Enter');
let data=await save();assert.equal(data.pages[0].elements.find(e=>e.id==='a').width,150);assert.equal(data.pages[0].elements.find(e=>e.id==='a').x,100);
await page.getByRole('button',{name:'元に戻す',exact:true}).click();data=await save();assert.equal(data.pages[0].elements.find(e=>e.id==='a').width,100);
await load(data);
// Shift-select canvas items, align, grid, undo, save.
await page.locator('.editor-canvas [data-element-id=a]').click();await page.locator('.editor-canvas [data-element-id=b]').click({modifiers:['Shift']});await page.locator('.editor-canvas [data-element-id=c]').click({modifiers:['Shift']});
await page.getByRole('button',{name:'左右中央揃え',exact:true}).click();data=await save();const items=data.pages[0].elements.filter(e=>['a','b','c'].includes(e.id));assert.equal(new Set(items.map(e=>e.x+e.width/2)).size,1);
await page.getByRole('button',{name:'元に戻す',exact:true}).click();await page.getByRole('spinbutton',{name:'グリッド列数',exact:true}).fill('2');await page.getByRole('button',{name:'グリッド配置',exact:true}).click();data=await save();assert.deepEqual(data.pages[0].elements.filter(e=>['a','b','c'].includes(e.id)).map(e=>[e.x,e.y]),[[80,140],[196,140],[80,216]]);
// Exercise every alignment/distribution and automatic row/column using real controls.
for (const [label,check] of [
 ['左揃え',es=>new Set(es.map(e=>e.x)).size===1],['右揃え',es=>new Set(es.map(e=>e.x+e.width)).size===1],
 ['上揃え',es=>new Set(es.map(e=>e.y)).size===1],['下揃え',es=>new Set(es.map(e=>e.y+e.height)).size===1],
 ['上下中央揃え',es=>new Set(es.map(e=>e.y+e.height/2)).size===1],
 ['水平均等',es=>{es.sort((a,b)=>a.x-b.x);return Math.abs((es[1].x-es[0].x-es[0].width)-(es[2].x-es[1].x-es[1].width))<=1}],
 ['垂直均等',es=>{es.sort((a,b)=>a.y-b.y);return Math.abs((es[1].y-es[0].y-es[0].height)-(es[2].y-es[1].y-es[1].height))<=1}],
 ['横並び',es=>new Set(es.map(e=>e.y)).size===1],['縦並び',es=>new Set(es.map(e=>e.x)).size===1]
]) {await load(fixture);await page.locator('.editor-canvas [data-element-id=a]').click();for(const id of ['b','c'])await page.locator(`.editor-canvas [data-element-id=${id}]`).click({modifiers:['Shift']});await page.getByRole('button',{name:label,exact:true}).click();const result=await save();assert(check(result.pages[0].elements.filter(e=>['a','b','c'].includes(e.id))),label);}
// A real panel drag follows interior content, in addition to the numeric resize above.
await load(fixture);const panelBox=await page.locator('.editor-canvas [data-element-id=panel]').boundingBox();await page.mouse.move(panelBox.x+10,panelBox.y+10);await page.mouse.down();await page.mouse.move(panelBox.x+42,panelBox.y+34,{steps:5});await page.mouse.up();data=await save();const movedPanel=data.pages[0].elements.find(e=>e.id==='panel'), movedA=data.pages[0].elements.find(e=>e.id==='a');assert(movedPanel.x>40);assert.equal(movedA.x-80,movedPanel.x-40);assert.equal(movedA.y-140,movedPanel.y-60);
// Reset fixture; hold cancel, accumulating stroke, completed state, tap suppression.
await load(fixture);await page.getByRole('button',{name:'プレビュー',exact:true}).click();
let hold=page.locator('.preview [data-element-id=a] button.av-button');let box=await hold.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(300);const progress=page.getByRole('progressbar',{name:'長押し進捗'});const first=Number(await progress.getAttribute('aria-valuenow'));assert(first>0&&first<90);await page.waitForTimeout(200);assert(Number(await progress.getAttribute('aria-valuenow'))>first);await page.screenshot({path:'test-results/hold-progress.png'});await page.mouse.move(1,1);await page.mouse.up();assert.equal(await page.getByRole('progressbar').count(),0);assert.equal(await page.locator('.preview input[type=range]').inputValue(),'65');
await hold.click({delay:1150});assert.equal(await page.locator('.preview input[type=range]').inputValue(),'90');
await page.getByRole('button',{name:'編集へ戻る',exact:true}).click();
// Count-driven template and state persistence.
await page.getByRole('spinbutton',{name:'映像数',exact:true}).fill('5');await page.getByRole('spinbutton',{name:'音声チャンネル数',exact:true}).fill('2');await page.getByRole('button',{name:'AVテンプレートを追加',exact:true}).click();data=await save();const source=data.pages[0].elements.find(e=>e.type==='sourceSelector');assert.equal(source.props.options.length,5);assert.equal(data.pages[0].elements.filter(e=>e.type==='volume').length,3);await load(data);assert.equal((await save()).pages[0].elements.find(e=>e.id===source.id).props.options.length,5);
await page.screenshot({path:'test-results/editor.png',fullPage:true});
// Export ZIP contains standalone runtime with identical long-press renderer.
await load(fixture);const pending=page.waitForEvent('download');await page.getByRole('button',{name:'HTML出力',exact:true}).click();const zip=await pending;await zip.saveAs('test-results/runtime.zip');
const exported=execFileSync('unzip',['-p','test-results/runtime.zip','index.html'],{encoding:'utf8',maxBuffer:4*1024*1024});
const standalone=await browser.newPage({viewport:{width:1280,height:800}});standalone.on('pageerror',e=>errors.push(e.message));let externalRequests=0;await standalone.route('**/*',route=>{externalRequests++;return route.abort()});await standalone.setContent(exported);await standalone.waitForTimeout(200);const exportedHold=standalone.locator('[data-element-id=a] button.av-button');await exportedHold.click({delay:1150});assert.equal(await standalone.locator('[data-element-id=meter] input[type=range]').inputValue(),'90');assert.equal(externalRequests,0);await standalone.screenshot({path:'test-results/runtime.png'});await standalone.close();
assert.deepEqual(errors,[]);console.log('PASS: inspector resize / undo / JSON / multi-select alignment / grid / hold cancellation and completion / templates / HTML ZIP');
} finally {await browser.close()}
