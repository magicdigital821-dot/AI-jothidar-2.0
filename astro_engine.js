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
