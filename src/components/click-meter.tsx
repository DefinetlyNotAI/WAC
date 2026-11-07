'use client';
import {useEffect,useState,type ReactNode} from 'react';
const KEY='wac-paid-clicks-v1';
type Balance={remaining:number,unlimited:boolean};
export function ClickMeter({children,active}:{children:ReactNode,active:boolean}){
 const [balance,setBalance]=useState<Balance>({remaining:50,unlimited:false});const [loaded,setLoaded]=useState(false);
 const [choice,setChoice]=useState<'50'|'unlimited'|null>(null),[card,setCard]=useState(''),[error,setError]=useState('');
 useEffect(()=>{try{const b=JSON.parse(localStorage.getItem(KEY)||'null');if(b&&typeof b.remaining==='number'&&typeof b.unlimited==='boolean')setBalance(b);}catch{}setLoaded(true)},[]);
 useEffect(()=>{if(loaded)localStorage.setItem(KEY,JSON.stringify(balance));},[balance,loaded]);
 return <div onClickCapture={e=>{if(!active||!loaded||balance.unlimited)return;const target=e.target as HTMLElement;if(target.closest('[data-click-purchase]'))return;if(balance.remaining<=0){e.stopPropagation();e.preventDefault();return;}setBalance(s=>({...s,remaining:Math.max(0,s.remaining-1)}));}}>
 {children}
 {active&&loaded&&<><div className="click-counter">Remaining licensed clicks: {balance.unlimited?'Unlimited':balance.remaining}</div>{balance.remaining<=0&&!balance.unlimited&&<div className="overlay click-paywall"><section className="dialog" data-click-purchase><h2>Click allocation exhausted</h2><p>Your current subscription includes 50 clicks. Additional navigation requires authorization.</p><p>50 clicks: $999.99. Unlimited clicks: $1,000.99.</p><div className="actions"><button className="button" onClick={()=>setChoice('50')}>Buy 50 clicks</button><button className="button" onClick={()=>setChoice('unlimited')}>Unlimited for $1 more</button></div>{choice&&<form onSubmit={e=>{e.preventDefault();if(!/^4242424242424242$/.test(card.replace(/\s/g,''))){setError('Only local demo card 4242 4242 4242 4242 is accepted.');return;}setBalance(v=>({remaining:choice==='50'?50:v.remaining,unlimited:choice==='unlimited'}));setChoice(null);setCard('');setError('');}}><p>Simulated checkout: {choice==='50'?'$999.99':'$1,000.99'}. No real charges.</p><label className="field">Demo card number<input required value={card} onChange={e=>setCard(e.target.value)} placeholder="4242 4242 4242 4242"/></label>{error&&<p role="alert">{error}</p>}<button className="button">Approve pretend payment</button></form>}</section></div>}</>}
 </div>;
}
