const AvUI = w.jsx, AvUIs = w.jsxs;
function ToolTabs({name,tabs,value,onChange}) {
  return AvUI('div',{role:'tablist','aria-label':name,className:'tool-tabs',children:tabs.map(([id,label])=>AvUI('button',{role:'tab',id:`${name}-${id}`,'aria-controls':`${name}-panel-${id}`,'aria-selected':value===id,tabIndex:value===id?0:-1,onClick:()=>onChange(id),onKeyDown:e=>{const i=tabs.findIndex(t=>t[0]===value);const next=e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:null;if(next!==null){e.preventDefault();e.stopPropagation();onChange(tabs[next][0]);document.getElementById(`${name}-${tabs[next][0]}`).focus()}},children:label},id))});
}
function TemplateTools({project,containerId,commit,select,addPower}) {
  const [kind,setKind]=Se.useState(null),[count,setCount]=Se.useState(3),[message,setMessage]=Se.useState('');
  const dialog=Se.useRef(null),origin=Se.useRef(null);
  Se.useEffect(()=>{if(kind){dialog.current.showModal();dialog.current.querySelector('input')?.focus()}},[kind]);
  const close=()=>{dialog.current?.close();setKind(null);setMessage('');origin.current?.focus()};
  const open=(type,event)=>{origin.current=event.currentTarget;setCount(type==='video'?3:2);setMessage('');setKind(type)};
  const add=event=>{event.preventDefault();try{const result=AVLayout.addTemplate(project,containerId,kind==='video'?count:0,kind==='audio'?count:0,vt);if(commit(result.project)){select(result.ids);close()}else setMessage('追加できません。画面サイズや部品数を確認してください。')}catch(error){setMessage(error.message)}};
  return AvUIs('section',{className:'template-tools',children:[AvUI('h2',{children:'部品テンプレート'}),AvUIs('div',{className:'template-buttons',children:[AvUI('button',{onClick:e=>open('video',e),children:'映像選択テンプレート'}),AvUI('button',{onClick:e=>open('audio',e),children:'音声テンプレート'}),AvUI('button',{onClick:addPower,children:'電源テンプレート'})]}),
    kind&&AvUIs('dialog',{ref:dialog,className:'template-dialog','aria-labelledby':'template-title',onCancel:e=>{e.preventDefault();close()},children:[AvUIs('form',{onSubmit:add,children:[AvUI('h2',{id:'template-title',children:kind==='video'?'映像選択を追加':'音声チャンネルを追加'}),AvUI('p',{children:kind==='video'?'映像ソースの数を指定してください。':'各チャンネルに音量とミュートボタンを追加します。'}),AvUIs('label',{children:[kind==='video'?'映像数':'音声チャンネル数',AvUI('input',{'aria-label':kind==='video'?'映像数':'音声チャンネル数',type:'number',min:1,max:8,step:1,required:true,value:count,onChange:e=>setCount(Number(e.target.value))})]}),message&&AvUI('p',{role:'alert',children:message}),AvUIs('div',{className:'dialog-actions',children:[AvUI('button',{type:'button',onClick:close,children:'キャンセル'}),AvUI('button',{type:'submit',className:'primary',children:'追加する'})]})]})]})]});
}
function EditorRibbon({selection,copy,paste,duplicate,remove,group,ungroup,align,arrange,zoomFit}) {
  const [tab,setTab]=Se.useState('home'),[gap,setGap]=Se.useState(16),[cols,setCols]=Se.useState(3);
  const btn=(label,fn,disabled=false)=>AvUI('button',{onClick:fn,disabled,children:label});
  const field=(label,value,set,min,max)=>AvUIs('label',{children:[label,AvUI('input',{'aria-label':label,type:'number',min,max,value,onChange:e=>set(Number(e.target.value))})]});
  return AvUIs('section',{className:'editor-ribbon',children:[AvUI(ToolTabs,{name:'上部操作',tabs:[['home','ホーム'],['arrange','配置'],['view','表示']],value:tab,onChange:setTab}),AvUIs('div',{id:`上部操作-panel-${tab}`,role:'tabpanel','aria-labelledby':`上部操作-${tab}`,className:'ribbon-content',children:tab==='home'?[btn('コピー',copy,!selection.length),btn('貼付',paste),btn('複製',duplicate,!selection.length),btn('選択を削除',remove,!selection.length),AvUI('span',{className:'ribbon-hint',children:'Ctrl＋クリックで複数選択（Macは⌘＋クリック）'})]:tab==='arrange'?[
      ...[['左揃え','left'],['左右中央揃え','centerX'],['右揃え','right'],['上揃え','top'],['上下中央揃え','centerY'],['下揃え','bottom'],['水平均等','horizontal'],['垂直均等','vertical']].map(([label,mode])=>btn(label,()=>align(mode),selection.length<(mode==='horizontal'||mode==='vertical'?3:2))),
      field('配置間隔 px',gap,setGap,0,200),field('グリッド列数',cols,setCols,1,20),...['横並び','縦並び','グリッド配置'].map((label,i)=>btn(label,()=>arrange(['row','column','grid'][i],gap,cols),selection.length<2)),btn('グループ化',group,selection.length<2),btn('グループ解除',ungroup,!selection.length)
    ]:[btn('画面全体を表示',zoomFit),AvUI('span',{className:'ribbon-hint',children:'ズーム・スナップはキャンバス上部で調整できます。'})]})]});
}
function InspectorTabs({children}) {
  const [tab,setTab]=Se.useState('basic');
  const buckets={basic:[],detail:[],actions:[],theme:[],state:[]};
  let section='basic';
  const visit=node=>{if(!node)return;if(Array.isArray(node)){node.forEach(visit);return}if(node.type===w.Fragment){visit(node.props.children);return}if(node.type===FA){buckets.detail.push(node);return}if(node.type===jA){buckets.actions.push(node);return}if(node.type==='h2'){const text=node.props.children;if(text==='テーマ')section='theme';else if(text==='状態定義')section='state';else if(text==='操作')section='help';}if(section!=='help')buckets[section].push(node)};
  visit(children);
  return AvUIs('aside',{className:'inspector',children:[AvUI(ToolTabs,{name:'詳細設定',tabs:[['basic','基本'],['detail','部品'],['actions','動作'],['theme','外観'],['state','状態']],value:tab,onChange:setTab}),...Object.keys(buckets).map(key=>AvUI('div',{id:`詳細設定-panel-${key}`,role:'tabpanel','aria-labelledby':`詳細設定-${key}`,hidden:tab!==key,className:'inspector-content',children:buckets[key].length?buckets[key]:AvUI('p',{className:'hint',children:'部品を選択して設定してください。'})},key))]});
}
