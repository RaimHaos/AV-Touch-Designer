let holdPointer;
function RecoveredHold({children,onTap,onHold,duration=2000,indicator='outline',disabled=false,selected=false,label,className='',onPressChange}) {
  const R=HOLD_REACT,J=HOLD_JSX;
  const [progress,setProgress]=R.useState(0),[size,setSize]=R.useState([200,80]);
  const button=R.useRef(null),pointer=R.useRef(),frame=R.useRef(0),done=R.useRef(false),cancelled=R.useRef(false);
  const press=R.useRef(onPressChange);press.current=onPressChange;
  const reset=()=>{press.current?.(false);cancelAnimationFrame(frame.current);if(holdPointer===pointer.current)holdPointer=undefined;pointer.current=undefined;setProgress(0)};
  R.useEffect(()=>{const cancel=()=>{cancelled.current=true;reset()};window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',cancel);return()=>{cancel();window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',cancel)}},[]);
  R.useEffect(()=>{if(disabled){cancelled.current=true;reset()}},[disabled]);
  R.useLayoutEffect(()=>{const b=button.current;const measure=()=>setSize([b.clientWidth,b.clientHeight]);const observer=new ResizeObserver(measure);observer.observe(b);measure();return()=>observer.disconnect()},[]);
  const [width,height]=size, radius=Math.min(11,(height-6)/2,(width-6)/2);
  const path=`M ${width/2} 3 H ${width-3-radius} Q ${width-3} 3 ${width-3} ${3+radius} V ${height-3-radius} Q ${width-3} ${height-3} ${width-3-radius} ${height-3} H ${3+radius} Q 3 ${height-3} 3 ${height-3-radius} V ${3+radius} Q 3 3 ${3+radius} 3 Z`;
  return J.jsxs('div',{className:`hold-wrap ${className}`,children:[J.jsxs('button',{
    ref:button,type:'button',className:`av-button ${selected?'selected':''}`,'aria-label':label,'aria-pressed':selected,disabled,
    onKeyDown:e=>{if(!disabled&&(e.key===' '||e.key==='Enter')&&!e.repeat)press.current?.(true)},onKeyUp:e=>{if(e.key===' '||e.key==='Enter')press.current?.(false)},onBlur:()=>{cancelled.current=true;reset()},
    onContextMenu:e=>{if(onHold)e.preventDefault()},
    onPointerDown:e=>{if(pointer.current!==undefined)return;if(disabled||holdPointer!==undefined||e.button!==0){cancelled.current=true;return}holdPointer=e.pointerId;pointer.current=e.pointerId;done.current=false;cancelled.current=false;e.currentTarget.setPointerCapture(e.pointerId);press.current?.(true);if(onHold){const start=performance.now();const tick=now=>{const p=Math.min(1,(now-start)/duration);setProgress(p);if(p===1){done.current=true;onHold()}else frame.current=requestAnimationFrame(tick)};frame.current=requestAnimationFrame(tick)}},
    onPointerMove:e=>{if(pointer.current!==e.pointerId)return;const b=e.currentTarget.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom){cancelled.current=true;reset()}},
    onPointerCancel:e=>{if(pointer.current===e.pointerId){cancelled.current=true;reset()}},
    onPointerUp:e=>{if(pointer.current===e.pointerId){cancelled.current=done.current;reset()}},
    onClick:e=>{if(!disabled&&(e.detail===0||(!cancelled.current&&!done.current)))onTap?.();cancelled.current=false;done.current=false},
    children:[children,
      onHold&&progress>0&&indicator!=='none'&&J.jsx('svg',{className:'hold-progress perimeter',viewBox:`0 0 ${width} ${height}`,preserveAspectRatio:'none',role:'progressbar','aria-label':'長押し進捗','aria-valuenow':Math.round(progress*100),'aria-valuemin':0,'aria-valuemax':100,children:J.jsx('path',{d:path,pathLength:100,fill:'none',stroke:'var(--accent)',strokeWidth:4,strokeLinecap:'round',strokeDasharray:'100',strokeDashoffset:100-progress*100})})]
  }),onHold&&J.jsx('button',{className:'hold-alternative',disabled,onClick:()=>{reset();onHold()},children:'長押し操作を実行'})]});
}

function SimpleButton({element:e,disabled=false,interactive=false,onTap,onLong,legacyHold}) {
 const R=HOLD_REACT,J=HOLD_JSX,s=e.props.simple;
 const [on,setOn]=R.useState(false),[pressed,setPressed]=R.useState(false),root=R.useRef(null),active=R.useRef(false),held=R.useRef(false);
 const change=value=>{active.current=value;if(root.current)root.current.dataset.on=String(value);setOn(value)};
 R.useEffect(()=>{const node=root.current;const off=()=>change(false);node.addEventListener('av-simple-off',off);return()=>node.removeEventListener('av-simple-off',off)},[]);
 R.useEffect(()=>{if(disabled){change(false);setPressed(false)}},[disabled]);
 const activate=value=>{
  if(value&&s.group){const scope=root.current.closest('.preview')??root.current.closest('#root')??document;
   const members=Array.from(scope.querySelectorAll('[data-simple-group]')).filter(n=>n.dataset.simpleGroup===s.group);
   const peers=members.filter(n=>n!==root.current&&n.dataset.on==='true').sort((a,b)=>a.avOnTime-b.avOnTime);
   const limit=Math.max(1,Math.min(s.maxOn,...members.map(n=>Number(n.dataset.maxOn))));
   while(peers.length>=limit)peers.shift().dispatchEvent(new Event('av-simple-off'));
  }if(value)root.current.avOnTime=performance.now();change(value);
 };
 const perform=()=>{if(s.mode==='toggle')activate(!active.current);if(s.mode==='momentary')activate(true)};
 const hold=s.holdMs>0?s.holdMs:legacyHold;
 return J.jsx('div',{ref:root,className:`av-control ${e.props.variant??''}`, 'data-simple-group':s.group,'data-max-on':s.maxOn,'data-on':String(on),children:interactive?J.jsx(RecoveredHold,{label:e.props.text,disabled,selected:on||pressed,onPressChange:value=>{held.current=value;setPressed(value&&s.mode==='visual');if(s.mode==='momentary'){if(value&&!hold)activate(true);if(!value)activate(false)}},onTap:()=>{if(!hold&&s.mode==='toggle')perform();onTap?.()},onHold:hold?()=>{perform();onLong?.();if(s.mode==='momentary'&&!held.current)queueMicrotask(()=>activate(false))}:undefined,duration:hold,children:e.props.text}):J.jsx('div',{className:'av-button',children:e.props.text})});
}
