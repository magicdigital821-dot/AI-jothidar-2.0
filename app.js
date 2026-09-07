/* AI Jothidar embedded offline astronomy engine */
/* AI Jothidar offline astronomy fallback engine.
 * Based on compact low-precision orbital-element methods for an offline app.
 * It intentionally avoids any network/CDN dependency.
 */
(function(g){
  const DEG=Math.PI/180;
  const RAD=180/Math.PI;
  const norm=x=>{x%=360; return x<0?x+360:x};
  const dsin=x=>Math.sin(x*DEG), dcos=x=>Math.cos(x*DEG), datan2=(y,x)=>Math.atan2(y,x)*RAD;
  const dacos=x=>Math.acos(Math.max(-1,Math.min(1,x)))*RAD;
  function kepler(M,e){
    let E=M*DEG;
    for(let i=0;i<12;i++) E-=(E-e*Math.sin(E)-M*DEG)/(1-e*Math.cos(E));
    return E;
  }
  // Orbital elements from the compact Paul Schlyter model, referenced to 2000 Jan 0.0.
  const EL={
    Mercury:[48.3313,3.24587E-5,7.0047,5.00E-8,29.1241,1.01444E-5,0.387098,0,0.205635,5.59E-10,168.6562,4.0923344368],
    Venus:[76.6799,2.46590E-5,3.3946,2.75E-8,54.8910,1.38374E-5,0.72333,0,0.006773,-1.302E-9,48.0052,1.6021302244],
    Earth:[0,0,0,0,282.9404,4.70935E-5,1,0,0.016709,-1.151E-9,356.0470,0.9856002585],
    Mars:[49.5574,2.11081E-5,1.8497,-1.78E-8,286.5016,2.92961E-5,1.523688,0,0.093405,2.516E-9,18.6021,0.5240207766],
    Jupiter:[100.4542,2.76854E-5,1.3030,-1.557E-7,273.8777,1.64505E-5,5.20256,0,0.048498,4.469E-9,19.8950,0.0830853001],
    Saturn:[113.6634,2.38980E-5,2.4886,-1.081E-7,339.3939,2.97661E-5,9.55475,0,0.055546,-9.499E-9,316.9670,0.0334442282],
    Uranus:[74.0005,1.3978E-5,0.7733,1.9E-8,96.6612,3.0565E-5,19.18171,-1.55E-8,0.047318,7.45E-9,142.5905,0.011725806],
    Neptune:[131.7806,3.0173E-5,1.7700,-2.55E-7,272.8461,-6.027E-6,30.05826,3.313E-8,0.008606,2.15E-9,260.2471,0.005995147],
  };
  function helio(body,d){
    const e=EL[body];
    let N=e[0]+e[1]*d, i=e[2]+e[3]*d, w=e[4]+e[5]*d, a=e[6]+e[7]*d, ec=e[8]+e[9]*d, M=norm(e[10]+e[11]*d);
    let E=kepler(M,ec);
    let xv=a*(Math.cos(E)-ec), yv=a*Math.sqrt(1-ec*ec)*Math.sin(E);
    let v=datan2(yv,xv), r=Math.sqrt(xv*xv+yv*yv);
    let xh=r*(dcos(N)*dcos(v+w)-dsin(N)*dsin(v+w)*dcos(i));
    let yh=r*(dsin(N)*dcos(v+w)+dcos(N)*dsin(v+w)*dcos(i));
    let zh=r*(dsin(v+w)*dsin(i));
    return {x:xh,y:yh,z:zh};
  }
  // Precess J2000 ecliptic coordinates to date using a first-order ecliptic longitude drift.
  function precessLon(lon,d){
    const T=d/36525;
    // General precession in longitude, close to 50.29 arcsec/year.
    return norm(lon + (3.82394E-5)*d);
  }
  function planetLon(body,d){
    const p=helio(body,d), earth=helio('Earth',d);
    const x=p.x-earth.x, y=p.y-earth.y, z=p.z-earth.z;
    return precessLon(datan2(y,x),d);
  }
  function moonLon(d){
    let N=norm(125.1228-0.0529538083*d), i=5.1454, w=norm(318.0634+0.1643573223*d), a=60.2666, e=0.054900, M=norm(115.3654+13.0649929509*d);
    let E=kepler(M,e), xv=a*(Math.cos(E)-e), yv=a*Math.sqrt(1-e*e)*Math.sin(E);
    let v=datan2(yv,xv), r=Math.sqrt(xv*xv+yv*yv);
    let xh=r*(dcos(N)*dcos(v+w)-dsin(N)*dsin(v+w)*dcos(i));
    let yh=r*(dsin(N)*dcos(v+w)+dcos(N)*dsin(v+w)*dcos(i));
    let zh=r*(dsin(v+w)*dsin(i));
    let lon=datan2(yh,xh), lat=datan2(zh,Math.sqrt(xh*xh+yh*yh));
    // Main lunar perturbations.
    const sun=planetLon('Earth',d); // used only to derive solar longitude below
    const sunLon=norm(sun+180);
    const Ms=norm(356.0470+0.9856002585*d);
    const Mm=M, Ls=norm(Ms+282.9404), Lm=norm(Mm+w+N), D=norm(Lm-Ls), F=norm(Lm-N);
    lon += -1.274*dsin(Mm-2*D)+0.658*dsin(2*D)-0.186*dsin(Ms)-0.059*dsin(2*Mm-2*D)+0.057*dsin(Mm-2*D+Ms)+0.053*dsin(Mm+2*D)+0.046*dsin(2*D-Ms)+0.041*dsin(Mm-Ms)-0.035*dsin(D)-0.031*dsin(Mm+Ms)+0.015*dsin(2*F-2*D)+0.011*dsin(Mm-4*D);
    return precessLon(norm(lon),d);
  }
  function gmst(jd){
    const T=(jd-2451545.0)/36525;
    return norm(280.46061837+360.98564736629*(jd-2451545.0)+0.000387933*T*T-T*T*T/38710000);
  }
  function tropicalAsc(jd,lat,lon){
    const T=(jd-2451545.0)/36525;
    const eps=(23+26/60+21.448/3600-(46.8150*T+0.00059*T*T-0.001813*T*T*T)/3600)*DEG;
    const lst=norm(gmst(jd)+lon)*DEG;
    const p=lat*DEG;
    return norm(Math.atan2(-Math.cos(lst),Math.sin(lst)*Math.cos(eps)+Math.tan(p)*Math.sin(eps))*RAD+180);
  }
  function ayanLahiri(jd){
    // Chitrapaksha/Lahiri approximation around J2000, deterministic and offline.
    const years=(jd-2451545.0)/365.2425;
    return 23.85709 + (50.2888/3600)*years;
  }
  function sidereal(lon,jd){return norm(lon-ayanLahiri(jd));}
  function calculate(date,lat,lon){
    const jd=date.getTime()/86400000+2440587.5;
    const d=jd-2451543.5;
    const out={};
    ['Sun','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'].forEach(b=>{
      let tropical=b==='Sun'?norm(datan2(-helio('Earth',d).y,-helio('Earth',d).x)):planetLon(b,d);
      out[b]=sidereal(tropical,jd);
    });
    out.Moon=sidereal(moonLon(d),jd);
    const node=norm(125.04452-1934.136261*((jd-2451545)/36525)+0.0020708*Math.pow((jd-2451545)/36525,2));
    out.Rahu=sidereal(node,jd); out.Ketu=norm(out.Rahu+180);
    const lag=sidereal(tropicalAsc(jd,lat,lon),jd);
    return {positions:out,lagna:lag,jd:jd};
  }
  g.AIOfflineAstro={calculate,ayanLahiri};
})(window);

const RASHIS=[
["மேஷம்","Aries","♈"],["ரிஷபம்","Taurus","♉"],["மிதுனம்","Gemini","♊"],["கடகம்","Cancer","♋"],
["சிம்மம்","Leo","♌"],["கன்னி","Virgo","♍"],["துலாம்","Libra","♎"],["விருச்சிகம்","Scorpio","♏"],
["தனுசு","Sagittarius","♐"],["மகரம்","Capricorn","♑"],["கும்பம்","Aquarius","♒"],["மீனம்","Pisces","♓"]];
const NAK=[
["அஸ்வினி","Ashwini","கேது",7],["பரணி","Bharani","சுக்கிரன்",20],["கார்த்திகை","Krittika","சூரியன்",6],
["ரோகிணி","Rohini","சந்திரன்",10],["மிருகசீரிஷம்","Mrigashira","செவ்வாய்",7],["திருவாதிரை","Ardra","ராகு",18],
["புனர்பூசம்","Punarvasu","குரு",16],["பூசம்","Pushya","சனி",19],["ஆயில்யம்","Ashlesha","புதன்",17],
["மகம்","Magha","கேது",7],["பூரம்","Purva Phalguni","சுக்கிரன்",20],["உத்திரம்","Uttara Phalguni","சூரியன்",6],
["ஹஸ்தம்","Hasta","சந்திரன்",10],["சித்திரை","Chitra","செவ்வாய்",7],["சுவாதி","Swati","ராகு",18],
["விசாகம்","Vishakha","குரு",16],["அனுஷம்","Anuradha","சனி",19],["கேட்டை","Jyeshtha","புதன்",17],
["மூலம்","Mula","கேது",7],["பூராடம்","Purva Ashadha","சுக்கிரன்",20],["உத்திராடம்","Uttara Ashadha","சூரியன்",6],
["திருவோணம்","Shravana","சந்திரன்",10],["அவிட்டம்","Dhanishtha","செவ்வாய்",7],["சதயம்","Shatabhisha","ராகு",18],
["பூரட்டாதி","Purva Bhadrapada","குரு",16],["உத்திரட்டாதி","Uttara Bhadrapada","சனி",19],["ரேவதி","Revati","புதன்",17]];
const ORDER=["கேது","சுக்கிரன்","சூரியன்","சந்திரன்","செவ்வாய்","ராகு","குரு","சனி","புதன்"];
const YEARS={"கேது":7,"சுக்கிரன்":20,"சூரியன்":6,"சந்திரன்":10,"செவ்வாய்":7,"ராகு":18,"குரு":16,"சனி":19,"புதன்":17};
const PLANETS=[["சூரியன்","Sun"],["சந்திரன்","Moon"],["செவ்வாய்","Mars"],["புதன்","Mercury"],["குரு","Jupiter"],["சுக்கிரன்","Venus"],["சனி","Saturn"]];
let state=null, english=false;

const $=id=>document.getElementById(id);
function norm(x){x%=360;if(x<0)x+=360;return x}
function jd(y,m,d,h){if(m<=2){y--;m+=12}let A=Math.floor(y/100),B=2-A+Math.floor(A/4);return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5+h/24}
function ayan(j){ return window.AIOfflineAstro.ayanLahiri(j); }
function sid(x,j){return norm(x-ayan(j))}
function rasi(l){return Math.floor(norm(l)/30)}
function degIn(l){return norm(l)%30}
function nakInfo(l){let span=360/27,i=Math.floor(norm(l)/span),p=Math.floor((norm(l)-i*span)/(span/4))+1;return{i,p}}
function dateObj(d,t,tz){const [Y,M,D]=d.split("-").map(Number),[h,mi]=t.split(":").map(Number);return new Date(Date.UTC(Y,M-1,D,h,mi)-tz*3600000)}
function d9Rasi(l){return (rasi(l)*9+Math.floor(degIn(l)/(30/9)))%12}
function fmt(x){return degIn(x).toFixed(2)+"°"}
function setStatus(s){$("status").textContent=s}

function d9Rasi(l){return (rasi(l)*9+Math.floor(degIn(l)/(30/9)))%12}
function fmt(x){return degIn(x).toFixed(2)+"°"}
function setStatus(s){$("status").textContent=s}

function calc(){
  try{
    if(!window.AIOfflineAstro){setStatus("கணக்கீட்டு engine கிடைக்கவில்லை. இந்த APK build சரியாக update செய்யப்படவில்லை.");return}
    const d=$("dob").value,t=$("time").value;
    if(!d||!t){setStatus("பிறந்த தேதி மற்றும் நேரத்தை உள்ளிடவும்.");return}
    const tz=Number($("tz").value),lat=Number($("lat").value),lon=Number($("lon").value);
    if(!Number.isFinite(tz)||!Number.isFinite(lat)||!Number.isFinite(lon)||lat<-90||lat>90||lon<-180||lon>180){setStatus("இடத்தின் latitude / longitude சரியாக உள்ளிடவும்.");return}
    const dt=dateObj(d,t,tz);
    const result=window.AIOfflineAstro.calculate(dt,lat,lon);
    const map={Sun:"சூரியன்",Moon:"சந்திரன்",Mercury:"புதன்",Venus:"சுக்கிரன்",Mars:"செவ்வாய்",Jupiter:"குரு",Saturn:"சனி",Rahu:"ராகு",Ketu:"கேது"};
    const positions={}; Object.keys(map).forEach(k=>positions[map[k]]=result.positions[k]);
    state={dt,j:result.jd,lat,lon,positions,lag:result.lagna,moon:positions["சந்திரன்"],ni:nakInfo(positions["சந்திரன்"]) };
    render();
    localStorage.setItem("aiJothidarLast",JSON.stringify({name:$("name").value||"Guest User",dob:d,time:t,lat,lon,lag:rasi(state.lag),moon:rasi(state.moon),star:NAK[state.ni.i][0]}));
    updateProfile();
  }catch(err){
    console.error("AI Jothidar calculation error",err);
    setStatus("கணக்கீட்டில் பிழை: "+(err&&err.message?err.message:"தெரியாத பிழை"));
  }
}
function render(){
async function sendAIQuestion(){
  const q=$("aiQuestion").value.trim();
  if(!q) return;

  if(!state){
    alert("முதலில் உங்கள் ஜாதகத்தை கணக்கிடுங்கள்.");
    return;
  }

  const apiUrl=(window.AI_JOTHIDAR_CONFIG&&window.AI_JOTHIDAR_CONFIG.apiUrl)||"";

  if(!apiUrl || apiUrl.includes("YOUR-WORKER-NAME")){
    appendChat("assistant","AI Chat backend இன்னும் இணைக்கப்படவில்லை.");
    return;
  }

  appendChat("user",q);
  $("aiQuestion").value="";

  aiHistory.push({role:"user",text:q});

  try{
    const response=await fetch(apiUrl,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        message:q,
        history:aiHistory.slice(-12),
        chart:chartContext()
      })
    });
    const data=await response.json().catch(()=>({}));

    if(!response.ok){
      throw new Error(data.error||("HTTP "+response.status));
    }

    const answer=String(data.answer||"பதில் கிடைக்கவில்லை.");

    aiHistory.push({role:"assistant",text:answer});
    appendChat("assistant",answer);

  }catch(err){
    console.error("AI chat error",err);
    appendChat("assistant",
      "AI சேவையை இப்போது தொடர்புகொள்ள முடியவில்லை. Internet அல்லது backend அமைப்பைச் சரிபார்க்கவும்."
    );
  }
}
  ["summary","charts","houses","planets"].forEach(id=>$(id).classList.remove("hidden"));
  setStatus("கணக்கீடு முடிந்தது ✓");
  $("lagna").textContent=RASHIS[rasi(state.lag)][0]+" "+RASHIS[rasi(state.lag)][2];
  $("moonRasi").textContent=RASHIS[rasi(state.moon)][0]+" "+RASHIS[rasi(state.moon)][2];
  $("star").textContent=NAK[state.ni.i][0];$("pada").textContent=state.ni.p;
  renderChart("rasi");renderHouses();renderPlanets();renderDasha();renderTransit();renderAI();
}
function renderChart(type){
  const arr=Array.from({length:12},()=>[]);
  Object.entries(state.positions).forEach(([p,l])=>arr[type==="rasi"?rasi(l):d9Rasi(l)].push(p));
  if(type==="rasi")arr[rasi(state.lag)].push("லக்னம்");
  $("chartGrid").innerHTML=arr.map((ps,i)=>`<div class="cell"><b>${RASHIS[i][2]} ${RASHIS[i][0]}</b>${ps.map(p=>`<span class="planet">${p}</span>`).join("")||"<span class='muted'>—</span>"}</div>`).join("");
}
function renderHouses(){
  const lr=rasi(state.lag);
  $("houseGrid").innerHTML=Array.from({length:12},(_,i)=>{const rr=(lr+i)%12,ps=Object.entries(state.positions).filter(([p,l])=>rasi(l)===rr).map(x=>x[0]);return `<div class="house"><b>${i+1}ம் பாவம் • ${RASHIS[rr][0]}</b><small>${ps.join(" • ")||"கிரகம் இல்லை"}</small></div>`}).join("");
}
function renderPlanets(){
  $("planetBody").innerHTML=Object.entries(state.positions).map(([p,l])=>{const n=NAK[nakInfo(l).i];return `<tr><td>${p}</td><td>${RASHIS[rasi(l)][0]}</td><td>${fmt(l)}</td><td>${n[0]} • ${nakInfo(l).p}</td></tr>`}).join("");
}
function addYears(date,y){const x=new Date(date);x.setUTCDate(x.getUTCDate()+y*365.2425);return x}
function renderDasha(){
  const moonDeg=norm(state.moon),span=360/27,idx=Math.floor(moonDeg/span),lord=NAK[idx][2],pos=(moonDeg-idx*span)/span,remain=1-pos;
  let start=new Date(state.dt.getTime()-(YEARS[lord]*365.2425*(1-remain))*86400000),rows=[],k=ORDER.indexOf(lord),cur=start;
  for(let i=0;i<9;i++){const l=ORDER[(k+i+9)%9],end=addYears(cur,YEARS[l]);rows.push([l,cur,end]);cur=end}
  const now=new Date(),current=rows.find(r=>now>=r[1]&&now<r[2])||rows[0];
  $("currentDasha").innerHTML=`தற்போது: <strong>${current[0]} மகாதசை</strong> • காலம் ${current[1].toISOString().slice(0,10)} → ${current[2].toISOString().slice(0,10)}`;
  $("dashaBody").innerHTML=rows.map(r=>`<div class="dash-row"><div class="lord">${r[0]}</div><div><b>${r[1].toISOString().slice(0,10)}</b><small> → ${r[2].toISOString().slice(0,10)}</small></div><div class="years">${YEARS[r[0]]} ஆண்டுகள்</div></div>`).join("");
}
function renderTransit(){
  const now=new Date();
  const result=window.AIOfflineAstro.calculate(now,state.lat,state.lon);
  const mr=rasi(result.positions.Moon),sr=rasi(result.positions.Sun),from=(mr-rasi(state.moon)+12)%12;
  $("transitText").innerHTML=`இன்று சந்திரன் <strong>${RASHIS[mr][0]}</strong> ராசியிலும், சூரியன் <strong>${RASHIS[sr][0]}</strong> ராசியிலும் உள்ளது. உங்கள் பிறப்பு சந்திர ராசியிலிருந்து சந்திரன் <strong>${from+1}ம் இடத்தில்</strong> உள்ளது.`;
}
function renderAI(){
 function renderAI(){
  const el = $("aiText");
  if(!el) return;

  el.innerHTML = `
    <p><strong>Chart Snapshot:</strong>
    லக்னம் ${RASHIS[rasi(state.lag)][0]},
    சந்திர ராசி ${RASHIS[rasi(state.moon)][0]},
    ${NAK[state.ni.i][0]} நட்சத்திரம்,
    ${state.ni.p}ம் பாதம்.</p>

    <p>உங்கள் ஜாதகத் தகவல் தயாராக உள்ளது. கீழே உங்கள் கேள்வியை கேளுங்கள்.</p>

    <div class="chat-box">
      <div id="chatMessages"></div>

      <div class="chat-input-row">
        <input id="aiQuestion" type="text"
          placeholder="உதாரணம்: என் தொழில் எப்படி இருக்கும்?">
        <button onclick="sendAIQuestion()">கேள்</button>
      </div>
    </div>
  `;

  appendChat("assistant",
    "வணக்கம்! ✦ உங்கள் ஜாதகத்தை அடிப்படையாக வைத்து கேள்விகளுக்கு விளக்கம் தருகிறேன். உங்கள் கேள்வியை கேளுங்கள்."
  );
}
function updateProfile(){
  const raw=localStorage.getItem("aiJothidarLast");if(!raw)return;
  const x=JSON.parse(raw);$("profileName").textContent=x.name||"Guest User";$("profileMeta").textContent=`DOB ${x.dob} • ${x.time}`;$("savedText").textContent=`${x.name||"Guest User"} — ${x.dob} ${x.time} • ${RASHIS[x.lag][0]} லக்னம் • ${RASHIS[x.moon][0]} சந்திர ராசி`;
}
function showView(target){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  const el=$("view-"+target);if(el)el.classList.add("active");
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.go===target));
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
$("calc").addEventListener("click",calc);
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");if(state)renderChart(b.dataset.chart)}));
$("langBtn").addEventListener("click",()=>{english=!english;document.documentElement.lang=english?"en":"ta";$("langBtn").textContent=english?"English / தமிழ்":"தமிழ் / English";setStatus(english?"English mode: calculation labels remain Tamil-first in this MVP.":"தமிழ் mode.");});
document.querySelectorAll(".suggestions button").forEach(b=>b.addEventListener("click",()=>{$("aiInput").value=b.dataset.q;$("aiInput").focus()}));
$("aiSend").addEventListener("click",()=>{const q=$("aiInput").value.trim();if(!q)return;$("aiText").innerHTML=`<p><strong>உங்கள் கேள்வி:</strong> ${q}</p><p>உங்கள் ஜாதகத்தை கணக்கிட்டிருந்தால், இந்த கேள்விக்கு chart data-வை வைத்து விளக்கம் உருவாக்கும் AI layer இங்கே இணைக்கப்படும். தற்போது இது UI demo.</p>`;$("aiInput").value=""});
$("clearSaved").addEventListener("click",()=>{localStorage.removeItem("aiJothidarLast");$("profileName").textContent="Guest User";$("profileMeta").textContent="Saved locally on this device";$("savedText").textContent="இன்னும் எந்த ஜாதகமும் சேமிக்கப்படவில்லை.";});
window.addEventListener("error",e=>{
  if(e&&e.message) setStatus("App error: "+e.message);
});
updateProfile();
