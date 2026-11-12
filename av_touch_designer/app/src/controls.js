function RecoveryTools({project,containerId,selection,commit,select,error}) {
  const [video,setVideo]=Se.useState(3),[audio,setAudio]=Se.useState(2),[gap,setGap]=Se.useState(16),[cols,setCols]=Se.useState(3);
  const el=w.jsx, els=w.jsxs;
  const run=fn=>{try{fn()}catch(e){error(e)}};
  const field=(label,value,set,min,max)=>els('label',{children:[label,el('input',{'aria-label':label,type:'number',min,max,value,onChange:e=>set(Number(e.target.value))})]});
  const button=(label,fn,disabled=false)=>el('button',{children:label,disabled,onClick:()=>run(fn)});
  return els('section',{className:'recovery-tools',children:[
    el('h2',{children:'部品テンプレート'}),
    field('映像数',video,setVideo,0,8),field('音声チャンネル数',audio,setAudio,0,8),
    button('AVテンプレートを追加',()=>{const r=AVLayout.addTemplate(project,containerId,video,audio,vt);if(commit(r.project))select(r.ids)}),
    el('h2',{children:'配置'}),
    el('p',{className:'hint',children:'Shift＋クリックで複数選択。ロック部品は配置対象外です。'}),
    els('div',{className:'row',children:[button('左右中央揃え',()=>commit(AVLayout.arrange(project,containerId,selection,'centerX')),selection.length<2),button('上下中央揃え',()=>commit(AVLayout.arrange(project,containerId,selection,'centerY')),selection.length<2)]}),
    field('配置間隔 px',gap,setGap,0,200),field('グリッド列数',cols,setCols,1,20),
    ...[['横並び','row'],['縦並び','column'],['グリッド配置','grid']].map(([label,mode])=>button(label,()=>commit(AVLayout.arrange(project,containerId,selection,mode,gap,cols)),selection.length<2)),
    el('p',{className:'hint',children:'自動配置はレイヤーの元の順番で並べます。画面外になる配置は変更せず通知します。'})
  ]});
}
