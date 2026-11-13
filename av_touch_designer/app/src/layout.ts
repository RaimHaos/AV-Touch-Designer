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
/** Panels are independent, including legacy responsive panels. Explicit selection is handled by the editor. */
export function reflow(_before: Project, after: Project): Project { return after; }
export function resizeMany(p:Project,id:string,ids:string[],width:number,height:number,orientation?:string):Project {
 const c=container(p,id),bounds=(p.popups.find(c=>c.id===id) as {width:number;height:number}|undefined)??p.canvas;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<24||height<24)throw Error('幅・高さは24以上の整数で指定してください');
 if(orientation&& !['horizontal','vertical'].includes(orientation))throw Error('向きが不正です');
 const elements=c.elements.map(e=>{
  if(!ids.includes(e.id))return e;
  if(e.locked)throw Error('選択部品のロックを解除してください');
  const props=orientation&&e.type==='volume'?{...e.props,orientation}:e.props;
  if(e.type==='volume'&&(width<((props.orientation??'horizontal')==='vertical'?96:240)||height<((props.orientation??'horizontal')==='vertical'?240:96)))throw Error('音量の最小サイズは横240×96、縦96×240です');
  if(e.x+width>bounds.width||e.y+height>bounds.height)throw Error('変更後の部品が画面外になります');
  return {...e,width,height,props};
 });
 return replace(p,id,elements);
}
export function addTemplate(p: Project,id:string,video:number,audio:number,uid:(prefix?:string)=>string): {project:Project;ids:string[]} {
  if(!Number.isInteger(video)||video<0||video>8||!Number.isInteger(audio)||audio<0||audio>8||video+audio===0) throw Error('映像・音声は各0〜8、合計1以上で指定してください');
  const c=container(p,id), bounds=p.popups.find(c=>c.id===id) as ({width:number;height:number}|undefined)??p.canvas;
  const width=Math.min(640,bounds.width-32), height=80+(video?132:0)+audio*104;
  if(width<300||height>bounds.height-32) throw Error('テンプレートが収まりません。チャンネル数を減らすか画面を広げてください');
  const top=Math.max(0,...c.elements.map(e=>e.zIndex))+1;
  const make=(type:string,x:number,y:number,w:number,h:number,props:Record<string,unknown>,z:number):Element=>({id:uid('el'),type,x,y,width:w,height:h,zIndex:z,locked:false,props,interactions:{}});
  const items:Element[]=[make('panel',16,16,width,height,{title:video?'映像選択':'音声',responsive:false},top)];
  const definitions:Record<string,unknown>[]=[];
  let y=80;
  if(video){const key=uid('video');definitions.push({key,type:'string',initialValue:'input_1'});items.push(make('sourceSelector',32,y,width-32,112,{stateKey:key,columns:Math.min(video,4),options:Array.from({length:video},(_,i)=>({label:`映像 ${i+1}`,value:`input_${i+1}`}))},top+1));y+=132;}
  for(let i=0;i<audio;i++){const key=uid('audio'), mute=uid('mute');definitions.push({key,type:'number',initialValue:50,min:0,max:100,step:1},{key:mute,type:'boolean',initialValue:false});items.push(make('volume',32,y,width-32,96,{label:`音声 ${i+1}`,stateKey:key,muteStateKey:mute,showValue:true},top+1));y+=104;}
  items[0].props.memberIds=items.filter(e=>e.type==='volume').map(e=>e.id);
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

export function selectionBounds(elements:Element[],ids:string[]):{x:number;y:number;width:number;height:number}|undefined {
 const items=elements.filter(e=>ids.includes(e.id));if(!items.length)return;
 const x=Math.min(...items.map(e=>e.x)),y=Math.min(...items.map(e=>e.y));
 return {x,y,width:Math.max(...items.map(e=>e.x+e.width))-x,height:Math.max(...items.map(e=>e.y+e.height))-y};
}
/** Scale an explicit selection about its combined bounds, atomically. Panels never imply children. */
export function resizeSelection(p:Project,id:string,ids:string[],box:{x:number;y:number;width:number;height:number}):Project {
 const c=container(p,id),old=selectionBounds(c.elements,ids);if(!old)throw Error('部品を選択してください');
 if(!Object.values(box).every(Number.isFinite)||box.width<=0||box.height<=0)throw Error('グループのサイズが不正です');
 const bounds=(p.popups.find(c=>c.id===id) as {width:number;height:number}|undefined)??p.canvas;
 const mins:Record<string,number[]>={button:[64,44],label:[48,24],panel:[80,60],navigation:[64,44],sourceSelector:[200,80],sceneSelector:[200,80],cameraPreset:[240,120],ptzPad:[220,220],powerControl:[200,80]};
 return replace(p,id,c.elements.map(e=>{
  if(!ids.includes(e.id))return e;if(e.locked)throw Error('グループ内のロックを解除してください');
  const next={...e,x:Math.round(box.x+(e.x-old.x)*box.width/old.width),y:Math.round(box.y+(e.y-old.y)*box.height/old.height),width:Math.round(e.width*box.width/old.width),height:Math.round(e.height*box.height/old.height)};
  const min=e.type==='volume'?(e.props.orientation==='vertical'?[96,240]:[240,96]):mins[e.type]??[24,24];
  if(next.width<min[0]||next.height<min[1])throw Error('内部部品が最小サイズを下回ります');
  if(next.x<0||next.y<0||next.x+next.width>bounds.width||next.y+next.height>bounds.height)throw Error('変更後のグループが画面外になります');
  return next;
 }));
}
export function placeAdded(before:Project,after:Project,id:string,point:{x:number;y:number}):Project {
 const c=container(after,id),old=new Set(container(before,id).elements.map(e=>e.id)),ids=c.elements.filter(e=>!old.has(e.id)).map(e=>e.id),box=selectionBounds(c.elements,ids);
 if(!box)return after;
 const bounds=(after.popups.find(c=>c.id===id) as {width:number;height:number}|undefined)??after.canvas;
 if(box.width>bounds.width||box.height>bounds.height)throw Error('追加部品が画面に収まりません');
 const x=Math.max(0,Math.min(Math.round(point.x),bounds.width-box.width)),y=Math.max(0,Math.min(Math.round(point.y),bounds.height-box.height));
 return replace(after,id,c.elements.map(e=>ids.includes(e.id)?{...e,x:e.x+x-box.x,y:e.y+y-box.y}:e));
}
export function resizeSelectionDrag(p:Project,id:string,ids:string[],dx:number,dy:number,handle:string,snap=false):Project {
 const box=selectionBounds(container(p,id).elements,ids);if(!box)return p;
 const round=(v:number)=>snap?Math.round(v/8)*8:Math.round(v);
 let {x,y,width,height}=box;
 if(handle.includes('e'))width=round(width+dx);
 if(handle.includes('s'))height=round(height+dy);
 if(handle.includes('w')){x=round(x+dx);width=box.x+box.width-x}
 if(handle.includes('n')){y=round(y+dy);height=box.y+box.height-y}
 return resizeSelection(p,id,ids,{x,y,width,height});
}
export function configureSwitching(p:Project,id:string,ids:string[],groupId:string,mode:string,maxOn:number,holdMs:number):Project {
 const c=container(p,id),items=c.elements.filter(e=>ids.includes(e.id));
 if(items.length<2||items.length!==ids.length||items.some(e=>e.type!=='button'||e.locked))throw Error('ロックされていないボタンを2個以上選択してください');
 if(!['toggle','momentary'].includes(mode)||!groupId)throw Error('操作モードが不正です');
 if(!Number.isInteger(maxOn)||maxOn<1||maxOn>Math.min(100,items.length))throw Error('同時ON数は1〜ボタン数以内で指定してください');
 if(!Number.isInteger(holdMs)||holdMs<0||holdMs>10000)throw Error('長押し時間は0〜10000msの整数で指定してください');
 return replace(p,id,c.elements.map(e=>ids.includes(e.id)?{...e,props:{...e.props,simple:{...(e.props.simple as Record<string,unknown>|undefined),mode,group:groupId,maxOn,holdMs}}}:e));
}
export function ungroupSelection(p:Project,ids:string[]):Project {
 const groups=(p.groups??[]) as {id:string;memberIds:string[]}[],removed=groups.filter(g=>g.memberIds.some(id=>ids.includes(id))),keys=new Set(removed.map(g=>g.id));
 const update=(c:Container)=>({...c,elements:c.elements.map(e=>{const simple=e.props.simple as Record<string,unknown>|undefined;return simple&&keys.has(String(simple.group))?{...e,props:{...e.props,simple:{...simple,group:''}}}:e})});
 return {...p,groups:groups.filter(g=>!keys.has(g.id)),pages:p.pages.map(update),popups:p.popups.map(update)};
}
