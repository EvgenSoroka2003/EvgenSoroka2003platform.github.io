// ===== Налаштування методики (звірити з наказом № 1277) =====
const THRESHOLDS = { optimal: 5, critical: 0 };   // %, оптимальний ≥ optimal; критичний < critical
function calcROD(income, costs){ return (income - costs) / costs * 100; }
// ============================================================
const COUNTRIES=["Україна","Польща","Німеччина","Чехія","Словаччина","Румунія","Литва","Латвія","Естонія","Молдова","Туреччина","Велика Британія","США","Інша країна…"];
const $=id=>document.getElementById(id);
const tb=$("inp").tBodies[0];
$("country").innerHTML=COUNTRIES.map(c=>`<option>${c}</option>`).join("");
$("country").onchange=()=>{$("otherBox").hidden=$("country").value!=="Інша країна…"};
["t1","t2","t3"].forEach((id,i)=>$(id).textContent=[THRESHOLDS.optimal,THRESHOLDS.critical,THRESHOLDS.critical][i]);

function addRow(y="",d="",v=""){
  const tr=tb.insertRow();
  tr.innerHTML=`<td><input type="number" step="1" min="1990" max="2100" value="${y}" aria-label="Рік"></td>
  <td><input type="text" inputmode="decimal" value="${d}" aria-label="Дохід"></td>
  <td><input type="text" inputmode="decimal" value="${v}" aria-label="Витрати"></td>
  <td><button class="sec" title="Видалити">✕</button></td>`;
  tr.querySelector("button").onclick=()=>{if(tb.rows.length>1)tr.remove()};
}
const num=s=>{s=String(s).trim().replace(/\s/g,"").replace(",",".");return s!==""&&/^-?\d+(\.\d+)?$/.test(s)?parseFloat(s):NaN};
function level(x){
  if(x>=THRESHOLDS.optimal)return{t:"Оптимальний (безпечний)",c:"ok"};
  if(x>=THRESHOLDS.critical)return{t:"Небезпечний",c:"wr"};
  return{t:"Критичний",c:"er"};
}
const f=(x,d=2)=>x.toLocaleString("uk-UA",{minimumFractionDigits:d,maximumFractionDigits:d});

function run(){
  const errs=[],data=[],years=new Set();
  document.querySelectorAll("#inp input").forEach(i=>i.classList.remove("bad"));
  [...tb.rows].forEach((tr,idx)=>{
    const [iy,id,iv]=tr.querySelectorAll("input"),n=idx+1;
    const y=Number(iy.value),d=num(id.value),v=num(iv.value);let ok=true;
    if(!Number.isInteger(y)||y<1990||y>2100){errs.push(`Рядок ${n}: рік має бути цілим числом від 1990 до 2100.`);iy.classList.add("bad");ok=false}
    else if(years.has(y)){errs.push(`Рядок ${n}: рік ${y} повторюється.`);iy.classList.add("bad");ok=false}
    if(isNaN(d)){errs.push(`Рядок ${n}: дохід має бути числом.`);id.classList.add("bad");ok=false}
    else if(d<0){errs.push(`Рядок ${n}: дохід не може бути від’ємним.`);id.classList.add("bad");ok=false}
    if(isNaN(v)){errs.push(`Рядок ${n}: витрати мають бути числом.`);iv.classList.add("bad");ok=false}
    else if(v<=0){errs.push(`Рядок ${n}: витрати мають бути більшими за нуль (ділення на нуль неможливе).`);iv.classList.add("bad");ok=false}
    if(ok){years.add(y);data.push({y,d,v})}
  });
  if($("country").value==="Інша країна…"&&!$("other").value.trim())errs.push("Вкажіть назву країни.");
  $("errs").innerHTML=errs.map(e=>`<li>${e}</li>`).join("");
  if(errs.length){$("res").hidden=true;return}
  data.sort((a,b)=>a.y-b.y);
  const unit=$("unit").value,country=$("country").value==="Інша країна…"?$("other").value.trim():$("country").value;
  const rows=data.map(r=>({...r,p:calcROD(r.d,r.v),r:r.d-r.v}));
  $("out").tBodies[0].innerHTML=rows.map(r=>{const l=level(r.p);
    return`<tr><td>${r.y}</td><td class="n">${f(r.r)}</td><td class="n">${f(r.v)}</td><td class="n">${f(r.p)}</td><td class="${l.c}"><b>${l.t}</b></td></tr>`}).join("");
  const avg=rows.reduce((s,r)=>s+r.p,0)/rows.length,al=level(avg);
  $("ctry").textContent=`Країна: ${country}. Суми в таблиці — ${unit}.`;
  $("avg").innerHTML=`Середнє значення за ${rows[0].y}–${rows[rows.length-1].y} (${rows.length} р.): <b>${f(avg)} %</b> — <span class="badge ${al.c}">${al.t}</span>`;
  const cnt=k=>rows.filter(r=>level(r.p).c===k).length;
  const best=rows.reduce((a,b)=>b.p>a.p?b:a),worst=rows.reduce((a,b)=>b.p<a.p?b:a,rows[0]);
  const first=rows[0],last=rows[rows.length-1];
  const dyn=rows.length>1?(last.p>first.p?"зросла":last.p<first.p?"знизилася":"не змінилася"):"";
  let t=`За даними для країни «${country}» середня рентабельність операційної діяльності промислових підприємств становить ${f(avg)} %, що відповідає ${al.t.toLowerCase()} рівню виробничої безпеки (порогове значення — ${THRESHOLDS.optimal} %). `;
  t+=`З ${rows.length} р. оптимальний рівень зафіксовано у ${cnt("ok")}, небезпечний — у ${cnt("wr")}, критичний — у ${cnt("er")}. `;
  if(rows.length>1)t+=`Найвище значення (${f(best.p)} %) — у ${best.y} р., найнижче (${f(worst.p)} %) — у ${worst.y} р.; за період рентабельність ${dyn} з ${f(first.p)} % до ${f(last.p)} %. `;
  t+=al.c==="ok"?"Підприємства мають фінансову основу для інвестицій і модернізації."
    :al.c==="wr"?"Прибутковість операційної діяльності недостатня для стійкого розвитку; потрібні заходи зі зниження витрат і підвищення ефективності."
    :"Операційна діяльність у середньому збиткова, що є загрозою виробничій безпеці й потребує термінових заходів.";
  $("concl").textContent=t;$("res").hidden=false;$("res").scrollIntoView({behavior:"smooth"});
}
$("add").onclick=()=>addRow();
$("calc").onclick=run;
$("clr").onclick=()=>{tb.innerHTML="";addRow();$("errs").innerHTML="";$("res").hidden=true};
$("demo").onclick=()=>{tb.innerHTML="";[[2019,1250,1180],[2020,1100,1090],[2021,1420,1300],[2022,1010,1060],[2023,1330,1250]].forEach(r=>addRow(...r))};
addRow();
