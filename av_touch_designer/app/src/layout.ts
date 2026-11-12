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
