
import { useState, useEffect } from "react";

const months = [
"January","February","March","April","May","June",
"July","August","September","October","November","December"
];

function currency(v){
 return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(v||0);
}

function tier(gm){
 if(gm>=18 && gm<=20) return {rate:7, quick:1.4};
 if(gm>=20.01 && gm<=22.5) return {rate:8, quick:1.6};
 if(gm>=22.51 && gm<=25) return {rate:9, quick:1.8};
 if(gm>=25.01 && gm<=28) return {rate:10, quick:2.0};
 if(gm>=28.1) return {rate:11, quick:2.2};
 return {rate:0, quick:0};
}

function calc(value,gm,split){
 const t=tier(gm);
 const pool=value*(t.rate/100);
 const solo=pool*0.2;
 const yours=solo*(split/100);
 return {pool,solo,yours};
}

function payoutStart(month){
 if(month<=2) return {month:4,yearAdd:0};
 if(month<=5) return {month:7,yearAdd:0};
 if(month<=8) return {month:10,yearAdd:0};
 return {month:1,yearAdd:1};
}

function payouts(incentive,closeMonth,closeYear){
 const splits=[0.35,0.35,0.15,0.15];
 const payMonths=[1,4,7,10];
 let first=payoutStart(closeMonth);
 let month=first.month;
 let year=closeYear+first.yearAdd;
 const out=[];

 for(let i=0;i<4;i++){
  out.push({
   label:months[month]+" "+year,
   amount:incentive*splits[i]
  });
  let idx=payMonths.indexOf(month);
  idx=(idx+1)%4;
  if(payMonths[idx]<=month) year++;
  month=payMonths[idx];
 }
 return out;
}

export default function App(){

 const [value,setValue]=useState(10000000);
 const [gm,setGm]=useState(20);
 const [split,setSplit]=useState(100);
 const [name,setName]=useState("");
 const [client,setClient]=useState("");
 const [closeMonth,setCloseMonth]=useState(new Date().getMonth());
 const [closeYear,setCloseYear]=useState(new Date().getFullYear());
 const [deals,setDeals]=useState(()=>{
  const s=localStorage.getItem("veregyDeals");
  return s?JSON.parse(s):[];
 });

 useEffect(()=>{
  localStorage.setItem("veregyDeals",JSON.stringify(deals));
 },[deals]);

 const c=calc(Number(value),Number(gm),Number(split));
 const p=payouts(c.yours,Number(closeMonth),Number(closeYear));

 function save(){
  const deal={
   id:Date.now(),
   name,
   client,
   value:Number(value),
   gm:Number(gm),
   split:Number(split),
   closeMonth,
   closeYear,
   incentive:c.yours,
   payouts:p
  };
  setDeals([deal,...deals]);
 }

 const total=deals.reduce((s,d)=>s+d.incentive,0);

 return (
 <div className="container">

 <h1>Veregy Incentive Dashboard</h1>

 <div className="card">
 <h2>New Deal</h2>
 <input placeholder="Project Name" value={name} onChange={e=>setName(e.target.value)}/>
 <input placeholder="Client" value={client} onChange={e=>setClient(e.target.value)}/>
 <input type="number" value={value} onChange={e=>setValue(e.target.value)}/>
 <input type="number" step="0.01" value={gm} onChange={e=>setGm(e.target.value)}/>
 <input type="number" value={split} onChange={e=>setSplit(e.target.value)}/>

 <select value={closeMonth} onChange={e=>setCloseMonth(e.target.value)}>
 {months.map((m,i)=>(<option key={i} value={i}>{m}</option>))}
 </select>

 <input type="number" value={closeYear} onChange={e=>setCloseYear(e.target.value)}/>

 <button onClick={save}>Save Deal</button>
 </div>

 <div className="card">
 <h2>Current Incentive</h2>
 <p>{currency(c.yours)}</p>
 <h3>Payout Projection</h3>
 {p.map((x,i)=>(<div key={i}>{x.label}: {currency(x.amount)}</div>))}
 </div>

 <div className="card">
 <h2>Pipeline</h2>
 <p>Total Incentive: {currency(total)}</p>
 {deals.map(d=>(
 <div key={d.id} className="deal">
 <strong>{d.name}</strong> {currency(d.incentive)}
 <div>{months[d.closeMonth]} {d.closeYear}</div>
 </div>
 ))}
 </div>

 </div>
 );
}
