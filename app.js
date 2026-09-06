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
function ayan(j){
  // Lahiri / Chitrapaksha approximation anchored to 23.85709° at J2000.
  // Annual drift ≈ 50.29 arcsec/year. This keeps the engine deterministic and offline.
  const years=(j-2451545.0)/365.2425;
  return 23.85709 + (50.2888/3600)*years;
}
function sid(x,j){return norm(x-ayan(j))}
function rasi(l){return Math.floor(norm(l)/30)}
function degIn(l){return norm(l)%30}
function nakInfo(l){let span=360/27,i=Math.floor(norm(l)/span),p=Math.floor((norm(l)-i*span)/(span/4))+1;return{i,p}}
function dateObj(d,t,tz){const [Y,M,D]=d.split("-").map(Number),[h,mi]=t.split(":").map(Number);return new Date(Date.UTC(Y,M-1,D,h,mi)-tz*3600000)}
function obliquity(j){
  const T=(j-2451545.0)/36525;
  const sec=21.448-T*(46.8150+T*(0.00059-T*0.001813));
  return 23+(26+sec/60)/60;
}
function ascendant(j,lat,lon,dt){
  const eps=obliquity(j)*Math.PI/180;
  const gast=window.Astronomy.SiderealTime(dt)*15;
  const ramc=norm(gast+lon)*Math.PI/180;
  const p=lat*Math.PI/180;
  const tropical=norm(Math.atan2(Math.cos(ramc),-(Math.sin(ramc)*Math.cos(eps)+Math.tan(p)*Math.sin(eps)))*180/Math.PI);
  return norm(tropical-ayan(j));
}
function nodeMean(j){
  const T=(j-2451545.0)/36525;
  return norm(125.0445479-1934.1362891*T+0.0020754*T*T+T*T*T/467441-T*T*T*T/60616000);
}
function geoSidereal(body,dt,j){
  const v=window.Astronomy.GeoVector(body,dt,true);
  const e=window.Astronomy.Ecliptic(v);
  return sid(e.elon,j);
}
function d9Rasi(l){return (rasi(l)*9+Math.floor(degIn(l)/(30/9)))%12}
function fmt(x){return degIn(x).toFixed(2)+"°"}
function setStatus(s){$("status").textContent=s}

function calc(){
  try{
    if(!window.Astronomy){setStatus("கணக்கீட்டு engine load ஆகவில்லை. APK-ஐ மீண்டும் build செய்யவும்.");return}
    const d=$("dob").value,t=$("time").value;
    if(!d||!t){setStatus("பிறந்த தேதி மற்றும் நேரத்தை உள்ளிடவும்.");return}
    const tz=Number($("tz").value),lat=Number($("lat").value),lon=Number($("lon").value);
    if(!Number.isFinite(tz)||!Number.isFinite(lat)||!Number.isFinite(lon)||lat<-90||lat>90||lon<-180||lon>180){setStatus("இடத்தின் latitude / longitude சரியாக உள்ளிடவும்.");return}
    const dt=dateObj(d,t,tz),j=jd(dt.getUTCFullYear(),dt.getUTCMonth()+1,dt.getUTCDate(),dt.getUTCHours()+dt.getUTCMinutes()/60);
    const positions={};
    PLANETS.forEach(([ta,en])=>positions[ta]=geoSidereal(en,dt,j));
    // Mean Rahu/Ketu: standard, deterministic lunar-node convention for this build.
    const node=sid(nodeMean(j),j);
    positions["ராகு"]=node;positions["கேது"]=norm(node+180);
    const lag=ascendant(j,lat,lon,dt);
    state={dt,j,lat,lon,positions,lag,moon:positions["சந்திரன்"],ni:nakInfo(positions["சந்திரன்"]) };
    render();
    localStorage.setItem("aiJothidarLast",JSON.stringify({name:$("name").value||"Guest User",dob:d,time:t,lat,lon,lag:rasi(state.lag),moon:rasi(state.moon),star:NAK[state.ni.i][0]}));
    updateProfile();
  }catch(err){
    console.error("AI Jothidar calculation error",err);
    setStatus("கணக்கீட்டில் பிழை: "+(err&&err.message?err.message:"தெரியாத பிழை"));
  }
}
function render(){
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
  const now=new Date(),j=jd(now.getUTCFullYear(),now.getUTCMonth()+1,now.getUTCDate(),now.getUTCHours()+now.getUTCMinutes()/60);
  const moon=geoSidereal("Moon",now,j),sun=geoSidereal("Sun",now,j),mr=rasi(moon),sr=rasi(sun),from=(mr-rasi(state.moon)+12)%12;
  $("transitText").innerHTML=`இன்று சந்திரன் <strong>${RASHIS[mr][0]}</strong> ராசியிலும், சூரியன் <strong>${RASHIS[sr][0]}</strong> ராசியிலும் உள்ளது. உங்கள் பிறப்பு சந்திர ராசியிலிருந்து சந்திரன் <strong>${from+1}ம் இடத்தில்</strong> உள்ளது.`;
}
function renderAI(){
  $("aiText").innerHTML=`<p><strong>Chart Snapshot:</strong> லக்னம் ${RASHIS[rasi(state.lag)][0]}, சந்திர ராசி ${RASHIS[rasi(state.moon)][0]}, ${NAK[state.ni.i][0]} நட்சத்திரம், ${state.ni.p}ம் பாதம்.</p><p>இது ஒரு rule-based ஆரம்ப விளக்கம். அடுத்த production கட்டத்தில் structured chart data-க்கு உண்மையான AI backend இணைக்கலாம்.</p>`;
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
