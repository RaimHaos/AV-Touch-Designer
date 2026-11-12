export interface Element {
  id: string; type: string; x: number; y: number; width: number; height: number;
  zIndex: number; locked: boolean; props: Record<string, unknown>;
  [key: string]: unknown;
}
export interface Container { id: string; elements: Element[]; [key: string]: unknown }
export interface Project {
  canvas: {width: number; height: number}; pages: Container[]; popups: Container[];
  stateDefinitions: Record<string, unknown>[]; [key: string]: unknown;
}
const container = (p: Project, id: string) => {
  const c = [...p.pages, ...p.popups].find(c => c.id === id);
  if (!c) throw Error('ページがありません');
  return c;
};
function replace(p: Project, id: string, elements: Element[]): Project {
  return {...p, pages:p.pages.map(c=>c.id===id?{...c,elements}:c), popups:p.popups.map(c=>c.id===id?{...c,elements}:c)};
}
export function arrange(p: Project, id: string, ids: string[], mode: string, gap = 16, columns = 3): Project {
  const c = container(p,id), items = c.elements.filter(e=>ids.includes(e.id)&&!e.locked);
  if(items.length < 2) throw Error('ロックされていない部品を2個以上選択してください');
  const x = Math.min(...items.map(e=>e.x)), y=Math.min(...items.map(e=>e.y));
  const right=Math.max(...items.map(e=>e.x+e.width)), bottom=Math.max(...items.map(e=>e.y+e.height));
  const changes=new Map<string,Element>();
  if (mode==='centerX'||mode==='centerY') {
    for(const e of items) changes.set(e.id,{...e,...(mode==='centerX'?{x:Math.round((x+right-e.width)/2)}:{y:Math.round((y+bottom-e.height)/2)})});
  } else {
    if(!Number.isInteger(gap)||gap<0||gap>200) throw Error('間隔は0〜200pxで指定してください');
    if(!Number.isInteger(columns)||columns<1||columns>20) throw Error('列数は1〜20で指定してください');
    if(!['row','column','grid'].includes(mode)) throw Error('未対応の配置です');
    const cols=mode==='row'?items.length:mode==='column'?1:Math.min(columns,items.length);
    const widths=Array.from({length:cols},(_,i)=>Math.max(...items.filter((_,j)=>j%cols===i).map(e=>e.width)));
    const rows=Math.ceil(items.length/cols);
    const heights=Array.from({length:rows},(_,i)=>Math.max(...items.slice(i*cols,(i+1)*cols).map(e=>e.height)));
    items.forEach((e,i)=>changes.set(e.id,{...e,x:x+widths.slice(0,i%cols).reduce((a,b)=>a+b+gap,0), y:y+heights.slice(0,Math.floor(i/cols)).reduce((a,b)=>a+b+gap,0)}));
  }
  const bounds = p.popups.find(c=>c.id===id) as ({width:number;height:number}|undefined) ?? p.canvas;
  for(const e of changes.values()) if(e.x<0||e.y<0||e.x+e.width>bounds.width||e.y+e.height>bounds.height) throw Error('配置が画面外になります。間隔・列数または部品サイズを調整してください');
  return replace(p,id,c.elements.map(e=>changes.get(e.id)??e));
}
export function reflow(before: Project, after: Project): Project {
  let result=after;
  for(const old of [...before.pages,...before.popups]) {
    const next=[...result.pages,...result.popups].find(c=>c.id===old.id); if(!next) continue; let elements=next.elements;
    const owners=new Set<string>();
    for(const panel of old.elements.filter(e=>e.type==='panel'&&e.props.responsive===true)) {
      const target=next.elements.find(e=>e.id===panel.id);
      if(!target||['x','y','width','height'].every(k=>panel[k]===target[k])) continue;
      elements=elements.map(e=>{
        const base=old.elements.find(b=>b.id===e.id);
        if(!base||base.type==='panel'||base.zIndex<=panel.zIndex||base.x<panel.x||base.y<panel.y||base.x+base.width>panel.x+panel.width||base.y+base.height>panel.y+panel.height) return e;
        if(owners.has(e.id)) throw Error('追従パネルが重複しています');
        owners.add(e.id);
        if(base.locked) throw Error('内部にロックされた部品があります。解除してから変更してください');
        // Always derive from the gesture's original geometry, avoiding cumulative rounding.
        return {...e,x:Math.round(target.x+(base.x-panel.x)*target.width/panel.width),y:Math.round(target.y+(base.y-panel.y)*target.height/panel.height),width:Math.round(base.width*target.width/panel.width),height:Math.round(base.height*target.height/panel.height)};
      });
    }
    result=replace(result,old.id,elements);
  }
  return result;
}
export function addTemplate(p: Project,id:string,video:number,audio:number,uid:(prefix?:string)=>string): {project:Project;ids:string[]} {
  if(!Number.isInteger(video)||video<0||video>8||!Number.isInteger(audio)||audio<0||audio>8||video+audio===0) throw Error('映像・音声は各0〜8、合計1以上で指定してください');
  const c=container(p,id), bounds=p.popups.find(c=>c.id===id) as ({width:number;height:number}|undefined)??p.canvas;
  const width=Math.min(640,bounds.width-32), height=80+(video?132:0)+audio*104;
  if(width<300||height>bounds.height-32) throw Error('テンプレートが収まりません。チャンネル数を減らすか画面を広げてください');
  const top=Math.max(0,...c.elements.map(e=>e.zIndex))+1;
  const make=(type:string,x:number,y:number,w:number,h:number,props:Record<string,unknown>,z:number):Element=>({id:uid('el'),type,x,y,width:w,height:h,zIndex:z,locked:false,props,interactions:{}});
  const items:Element[]=[make('panel',16,16,width,height,{title:video?'映像選択':'音声',responsive:true},top)];
  const definitions:Record<string,unknown>[]=[];
  let y=80;
  if(video){const key=uid('video');definitions.push({key,type:'string',initialValue:'input_1'});items.push(make('sourceSelector',32,y,width-32,112,{stateKey:key,columns:Math.min(video,4),options:Array.from({length:video},(_,i)=>({label:`映像 ${i+1}`,value:`input_${i+1}`}))},top+1));y+=132;}
  for(let i=0;i<audio;i++){const key=uid('audio'), mute=uid('mute');definitions.push({key,type:'number',initialValue:50,min:0,max:100,step:1},{key:mute,type:'boolean',initialValue:false});items.push(make('volume',32,y,width-32,96,{label:`音声 ${i+1}`,stateKey:key,muteStateKey:mute,showValue:true},top+1));y+=104;}
  return {project:{...replace(p,id,[...c.elements,...items]),stateDefinitions:[...p.stateDefinitions,...definitions]},ids:items.map(e=>e.id)};
}

interface Action { type:string; stateKey?:string; value?:unknown; pageId?:string; [key:string]:unknown }
interface Interactions {onTap?:Action[]; [key:string]:unknown}
/** Create/reuse the system standby page and wire OFF -> standby -> ON -> operating page. */
export function addStartup(p:Project,targetId:string,uid:(prefix?:string)=>string):{project:Project;pageId:string} {
  const next=structuredClone(p);
  let startup=next.pages.find(page=>page.role==='startup');
  let target=next.pages.find(page=>page.id===targetId&&page.role!=='startup');
  const existingLaunch=startup?.elements.find(e=>e.id.startsWith('system_start_'));
  const existingTarget=(existingLaunch?.interactions as Interactions|undefined)?.onTap?.find(a=>a.type==='navigate')?.pageId;
  target??=next.pages.find(page=>page.id===existingTarget&&page.role!=='startup')??next.pages.find(page=>page.role!=='startup');
  if(!target){target={id:uid('page'),name:'メイン',elements:[]};next.pages.push(target);}
  if(!startup){
    if(next.pages.length>=30)throw Error('起動ページを追加できません。ページ数の上限は30です。');
    const {width:w,height:h}=next.canvas;
    const make=(type:string,x:number,y:number,width:number,height:number,props:Record<string,unknown>,prefix='el'):Element=>({id:uid(prefix),type,x,y,width,height,zIndex:1,locked:false,props,interactions:{}});
    const bw=Math.min(360,w-64),bh=h<400?64:88;
    startup={id:uid('startup'),name:'システム起動',role:'startup',elements:[
      make('label',24,Math.round(h*.20),w-48,48,{text:'SYSTEM STANDBY',fontSize:h<400?24:36,align:'center',weight:'bold'}),
      make('label',24,Math.round(h*.20)+56,w-48,32,{text:'ボタンを押してシステムを起動してください',fontSize:h<400?12:20,align:'center',colorToken:'mutedText'}),
      make('button',Math.round((w-bw)/2),Math.max(Math.round(h*.55),Math.round(h*.20)+96),bw,bh,{text:'システムを起動',icon:'power',variant:'primary'},'system_start')
    ]};
    next.pages.push(startup);
  }
  const keys=new Set([...next.pages,...next.popups].flatMap(page=>page.elements).filter(e=>e.type==='powerControl').map(e=>String(e.props.powerStateKey)));
  next.stateDefinitions=next.stateDefinitions.map(d=>keys.has(String(d.key))?{...d,initialValue:false}:d);
  let launch=startup.elements.find(e=>e.id.startsWith('system_start_'));
  if(!launch){const width=Math.min(360,next.canvas.width-64);launch={id:uid('system_start'),type:'button',x:Math.round((next.canvas.width-width)/2),y:Math.max(Math.round(next.canvas.height*.55),Math.round(next.canvas.height*.20)+96),width,height:64,zIndex:2,locked:false,props:{text:'システムを起動',icon:'power',variant:'primary'}};startup.elements.push(launch);}
  launch.interactions={...(launch.interactions as Interactions|undefined),onTap:[...Array.from(keys,key=>({type:'setValue',stateKey:key,value:true})),{type:'navigate',pageId:target.id}]};
  for(const page of [...next.pages,...next.popups])for(const e of page.elements){
    const interactions=e.interactions as Interactions|undefined;
    if(interactions?.onTap?.some(a=>a.type==='setValue'&&a.value===false&&keys.has(String(a.stateKey)))){
      e.interactions={...interactions,onTap:[...interactions.onTap.filter(a=>a.type!=='navigate'),{type:'navigate',pageId:startup.id}]};
    }
  }
  next.startPageId=startup.id;
  return {project:next,pageId:startup.id};
}

/** Change presentation only; state bindings, options and event actions stay intact. */
export function changeComponentLayout(p:Project,containerId:string,id:string,layout:string|number):Project {
 const c=container(p,containerId),e=c.elements.find(e=>e.id===id);
 if(!e)throw Error('部品がありません');if(e.locked)throw Error('ロックを解除してからレイアウトを変更してください');
 const bounds=(p.popups.find(c=>c.id===containerId) as {width:number;height:number}|undefined)??p.canvas;
 let props={...e.props},width=e.width,height=e.height;
 if(['sourceSelector','sceneSelector','cameraPreset'].includes(e.type)){
  const count=Array.isArray(props.options)?props.options.length:1;const cols=Number(layout);
  if(!Number.isInteger(cols)||cols<1||cols>count)throw Error('列数は選択肢の数以内で指定してください');
  const oldCols=Number(props.columns??(e.type==='cameraPreset'?Math.min(2,count):count)),oldRows=Math.ceil(count/oldCols);
  props.columns=cols;const rows=Math.ceil(count/cols),padding=e.type==='cameraPreset'?88:0;
  width=Math.max(width,cols*64+(cols-1)*12+(padding?48:0));const minRowHeight=Array.isArray(props.options)&&props.options.some(o=>o&&typeof o==="object"&&"icon" in o&&o.icon)?112:76;
  const rowHeight=Math.max(minRowHeight,Math.ceil((height-padding-(oldRows-1)*12)/oldRows));
  height=rows*rowHeight+(rows-1)*12+padding;
 }else if(e.type==='volume'){
  if(layout!=='horizontal'&&layout!=='vertical')throw Error('フェーダーの向きが不正です');
  if((props.orientation??'horizontal')===layout)return p;
  props.orientation=layout;
  if(layout==='vertical'){width=Math.max(160,Math.min(e.height,200));height=Math.max(280,Math.min(e.width,360));}
  else {width=Math.max(320,e.height);height=Math.max(112,Math.min(e.width,180));}
 }else throw Error('この部品はレイアウト切り替えの対象ではありません');
 if(width>bounds.width||height>bounds.height)throw Error('変更後の部品が画面に収まりません。画面サイズや列数を調整してください');
 const next={...e,props,width,height,x:Math.min(e.x,bounds.width-width),y:Math.min(e.y,bounds.height-height)};
 return replace(p,containerId,c.elements.map(e=>e.id===id?next:e));
}

/** Friendly UI names keep existing opaque keys intact. */
export function stateChoices(p:Project):{key:string;label:string;type:string}[]{
 const aliases:Record<string,string>={selectedSource:'映像ソース',volume:'音量',muted:'ミュート',power:'システム電源',cameraPreset:'カメラプリセット',registeredPreset:'登録済みプリセット',pan:'パン',tilt:'チルト',zoom:'ズーム'};
 const items=[...p.pages,...p.popups].flatMap(page=>page.elements.map(element=>({page,element})));
 const seen=new Map<string,number>();
 return p.stateDefinitions.map(d=>{
  const key=String(d.key);let label=aliases[key];
  if(!label){const owner=items.find(({element:e})=>['stateKey','muteStateKey','powerStateKey','selectedStateKey','registrationStateKey'].some(prop=>e.props[prop]===key));
   if(owner){const e=owner.element,base=String(e.props.label??e.props.cameraLabel??({sourceSelector:'映像選択',sceneSelector:'シーン',powerControl:'電源',cameraPreset:'プリセット'}[e.type]??e.type));
    const suffix=e.props.muteStateKey===key?'ミュート':e.type==='volume'?'音量':e.props.registrationStateKey===key?'登録状態':'';
    label=`${String(owner.page.name??'ページ')} / ${base}${suffix?' / '+suffix:''}`;
   }
  }
  const base=label??key,index=(seen.get(base)??0)+1;seen.set(base,index);
  return {key,label:index>1?`${base} (${index})`:base,type:String(d.type)};
 });
}
