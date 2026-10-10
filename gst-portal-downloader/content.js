(()=>{if(window.__gstDownloader)return;window.__gstDownloader=true;
const SEARCH='https://services.gst.gov.in/litserv/auth/case/search';let running=false,runJobId=null;const runnerToken=crypto.randomUUID();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const visible=e=>e&&e.getClientRects().length&&!e.closest('.ng-hide');const all=s=>[...document.querySelectorAll(s)].filter(visible);const msg=async m=>{const r=await chrome.runtime.sendMessage(m);if(r?.error)throw Error(r.error);return r;};
async function job(){return(await chrome.storage.local.get('job')).job;}
async function change(fn){const j=await job();if(!j)return;if(runJobId&&j.id!==runJobId)throw Error('CONTROL');fn(j);await chrome.storage.local.set({job:j});return j;}
async function note(t){await change(j=>{j.message=t;j.logs=[...(j.logs||[]),new Date().toLocaleTimeString()+' '+t].slice(-1000);});}
async function check(){const lease=await msg({action:'lease',token:runnerToken});if(!lease.owned)throw Error('CONTROL');const j=await job();if(!j||j.status!=='running')throw Error('CONTROL');if(/\/login(?:\/|$)/i.test(location.pathname)||visible(document.querySelector('input[type="password"]'))||/session (?:has )?expired|session timed out|please login again/i.test(document.body.innerText))throw Error('GST session expired. Log in and resume.');const currentGstin=gstin();if(currentGstin&&currentGstin!==j.gstin)throw Error('GSTIN changed. Return to the original taxpayer before resuming.');}
function gstin(){return document.body.innerText.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/)?.[0];}
function tradeName(){
 const welcome=document.body.innerText.match(/Welcome\s+(.+?)\s+to GST(?: Common Portal)?/i);if(welcome)return welcome[1].trim();
 for(const selector of ['[data-ng-bind*="trdnm"]','[ng-bind*="trdnm"]','[data-ng-bind*="tradeName"]','[ng-bind*="tradeName"]']){const el=all(selector)[0];if(el?.innerText.trim())return el.innerText.trim();}
 const id=gstin();const lines=document.body.innerText.split('\n').map(x=>x.trim()).filter(Boolean);const idx=lines.findIndex(x=>x===id);if(idx>0){const name=lines[idx-1];if(name.length>2&&!/GSTIN|Government|Dashboard|Services|Taxpayer|Goods and|India|Date|Status/i.test(name))return name;}
 return '';
}
async function bindIdentity(){const j=await job();const id=gstin()||j.gstin;if(!id)throw Error('GSTIN could not be detected. Log in and resume.');const name=j.tradeName||tradeName();await change(j=>{j.gstin=id;j.tradeName=name;});}
async function wait(fn,timeout=30000){const start=Date.now();while(Date.now()-start<timeout){await check();const v=fn();if(v)return v;await sleep(300);}throw Error('Portal did not finish loading. Resume after checking the page.');}
function fmt(s){return s.split('-').reverse().join('/');}
function months(from,to){let d=new Date(from+'T12:00:00');const end=new Date(to+'T12:00:00');const out=[];while(d<=end){const last=new Date(d.getFullYear(),d.getMonth()+1,0,12);const finish=last<end?last:end;const iso=x=>`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;out.push({from:iso(d),to:iso(finish)});d=new Date(finish.getFullYear(),finish.getMonth(),finish.getDate()+1,12);}return out;}
async function search(type,range){await wait(()=>{const select=document.querySelector('#up_type');return visible(select)&&!select.disabled&&[...select.options].some(o=>o.value===type);});await sleep(400);await msg({action:'bridge',cmd:{kind:'dates',type,from:fmt(range.from),to:fmt(range.to)}});await sleep(2000);
 await wait(()=>!all('.blockUI.blockOverlay,.loading-overlay').length);const errors=all('.alert-danger,.text-danger').map(e=>e.innerText.trim()).filter(Boolean);if(errors.length)throw Error('Portal validation: '+errors.join(' '));
 await wait(()=>all('table[ng-table="tableParams"]').length||/no (records|record|data|results)|records? (not found|found\s*:\s*0)/i.test(document.body.innerText));}
const links=()=>all('table[ng-table="tableParams"] a[title="ARN/RFN"]');
async function download(el,key,folder,label,record){
 const registered=await msg({action:'registerDocument',key,record});if(registered.skip){await note('Already saved: '+label);return true;}
 const j=await job();const retries=Math.max(0,Math.min(3,Number(j.config.retryCount??2)));
 for(let attempt=0;attempt<=retries;attempt++){
 await check();await msg({action:'documentAttempt',key});await note('Downloading '+label+' (attempt '+(attempt+1)+')');
 let armed;
 try{if(el.isConnected===false)throw Error('Download control changed; retry the incomplete case.');armed=await msg({action:'arm',folder,label,token:runnerToken});if(!armed.adopt)el.click();const start=Date.now();while(Date.now()-start<90000){await check();const r=await msg({action:'downloadStatus'});if(r.complete){await msg({action:'documentResult',key,result:{status:'downloaded',filename:r.filename,downloadId:r.downloadId,at:new Date().toISOString(),error:''}});return true;}await sleep(500);}throw Error('No completed download detected within 90 seconds.');
 }catch(e){if(e.message==='CONTROL')throw e;await msg({action:'documentResult',key,result:{status:'failed',error:e.message}});await note('Failed: '+label+' — '+e.message);if(!/Download interrupted|network/i.test(e.message)||attempt===retries)return false;await sleep(1500);
 }finally{if(armed)await msg({action:'disarm',token:runnerToken});}
 }
 return false;
}
function categoryName(el){return el.innerText.replace(/\s+/g,' ').trim().replace(/\d+$/,'').trim();}
function refundFolder(arn,metadata){
 const kind=/inverted/i.test(metadata.refundType||'')?'Inverted':/export/i.test(metadata.refundType||'')?'Export':'Refund';
 const periodLabel=value=>{const match=String(value||'').trim().match(/^([A-Za-z]+)\s+(\d{4})$/);return match?match[1].slice(0,3)+'_'+match[2].slice(-2):'';};
 const from=periodLabel(metadata.fromPeriod),to=periodLabel(metadata.toPeriod);
 const period=from?(to&&to!==from?from+'_to_'+to:from):'Period_unknown';
 return arn+'_'+kind+'_'+period;
}
async function documents(type,arn,filing,metadata={}){await wait(()=>all('a[download-doc-secure],button[title="Download Form"],a.list-group-item').length);await sleep(1200);const j=await job();const parts=filing.split('/');if(parts.length!==3)throw Error('Filing date missing for '+arn);const month=new Date(Number(parts[2]),Number(parts[1])-1,1).toLocaleString('en-US',{month:'long'});const caseFolder=type==='RFUND'?refundFolder(arn,metadata):arn;const root=`GST_Portal/${GST.safe(j.gstin+(j.tradeName?'_'+j.tradeName:''))}/${type==='ADJVP'?'DRC_03':'Refund'}_${month}_${parts[2]}/${caseFolder}`;
 let tabs=all('a.list-group-item').map(categoryName).filter(Boolean);if(type==='ADJVP')tabs=tabs.filter(t=>/^APPLICATIONS$/i.test(t));if(!tabs.length)tabs=['APPLICATIONS'];
 const caseKey=GST.caseKey(j.gstin,type,arn);let foundDocuments=0;for(const category of tabs){await check();const tab=all('a.list-group-item').find(e=>categoryName(e)===category);if(tab){tab.click();await sleep(1800);await wait(()=>!all('.blockUI.blockOverlay,.loading-overlay').length);}
 const docs=all('button[title="Download Form"],a[download-doc-secure],a[data-ng-click="downloadARN();"]');
 foundDocuments+=docs.length;await msg({action:'recordCategory',caseKey,category,count:docs.length});
 // ARN link and Download Form can represent different generated documents; keep both.
 if(!docs.length)await note(arn+' / '+category+': no downloadable files');
 for(let i=0;i<docs.length;i++){const el=docs[i];const context=el.closest('td')?.innerText||el.innerText||el.title||'Document';const label=(el.title==='Download Form'?'Application_Form':context.trim().replace(/\s+/g,' ').slice(0,80)||'Attachment')+'_'+(i+1);const key=[j.gstin,type,arn,category,el.getAttribute('hashkey')||el.getAttribute('data-ng-click')||'',label].join('|');await download(el,key,root+'/'+category.replace(/[/\\]/g,'_'),label,{gstin:j.gstin,tradeName:j.tradeName,type,arn,filing,category,label,...metadata});}
 }
 await msg({action:'finishCase',caseKey,empty:!foundDocuments});
 await change(j=>{j.completedArns[type+'|'+arn]=true;j.activeCase=null;j.navigationRestarts=0;});}
async function backToSearch(){const back=all('button,a').find(e=>/^BACK$/i.test(e.innerText.trim()));if(back){back.click();await sleep(1200);}if(!document.querySelector('#up_type')){location.href=SEARCH;return false;}return true;}
async function setup(){
 let j=await job();if(!j.stage||j.stage==='downloads')return true;
 const setupCheck=async()=>{const state=await job();if(state.status!=='running')throw Error('CONTROL');const lease=await msg({action:'lease',token:runnerToken});if(!lease.owned)throw Error('CONTROL');};
 const setupWait=async(fn,timeout=30000)=>{const start=Date.now();while(Date.now()-start<timeout){await setupCheck();if(all('input[autocomplete="one-time-code"],input[name="otp"],#otp').length)throw Error('OTP required. Complete it in the GST tab, then Resume.');const result=fn();if(result)return result;await sleep(300);}throw Error('Login/navigation timed out. Check the GST tab and export the log.');};
 const loginPage=()=>/\/services\/login/.test(location.pathname)||all('input[type="password"]').length;
 if(loginPage()){
 if(j.stage==='logoutAwait'){await change(j=>{j.stage='login';});j=await job();}
 if(j.stage==='login'){
 await setupWait(()=>all('#username,input[name="username"],#user_name').length&&all('input[type="password"]').length);
 await msg({action:'fillLogin'});await note('Credentials filled; waiting for CAPTCHA from existing solver.');
 const captcha=await setupWait(()=>{const field=document.querySelector('#captcha');return field&&/^\d{6}$/.test(field.value)?field:null;},60000);
 const value=captcha.value,src=document.querySelector('#imgCaptcha')?.src;await sleep(800);
 if(captcha.value!==value||document.querySelector('#imgCaptcha')?.src!==src)throw Error('CAPTCHA changed. Wait for your solver and Resume.');
 await msg({action:'fillLogin'});await sleep(350);
 const registered=await msg({action:'loginState'});if(registered.passwordInvalid||registered.usernameInvalid)throw Error('Portal still considers a login field invalid after filling. Export log for field diagnostics.');
 const button=all('button,input[type="submit"]').find(e=>/^LOGIN$/i.test((e.innerText||e.value||'').trim()));if(!button||button.disabled)throw Error('Login button missing or disabled. Check the login page.');
 await change(j=>{j.stage='loginSubmitted';j.submittedAt=Date.now();});await note('Submitting login once.');await msg({action:'submitLogin'});
 }
 await setupWait(()=>{
 if(!loginPage())return true;
 if(all('.alert-danger,.error-message,.text-danger').some(e=>/invalid|incorrect|failed|locked/i.test(e.innerText)))throw Error('GST rejected login. Check credentials/CAPTCHA in the portal; Stop and start again.');
 return false;
 },30000);
 }
 await setupWait(()=>/\/auth\//.test(location.pathname)&&!all('input[type="password"]').length);
 j=await job();
 if(j.stage==='login'||j.stage==='logoutAwait'){
 // The login URL can redirect to an existing browser session. Never bind that account to the new run.
 if(j.stage==='logoutAwait')throw Error('Logout did not reach the login page. Finish logout manually, then Resume.');
 await note('Existing GST session detected. Logging out before entering the requested account.');
 await msg({action:'escape'});await sleep(500);
 const candidates=[...document.querySelectorAll('a,button')];
 const logout=candidates.find(e=>!e.closest('.ng-hide')&&(/^(?:log\s*out|sign\s*out)$/i.test(e.innerText.trim())||/\/logout(?:[/?#]|$)/i.test(e.getAttribute('href')||'')));
 if(!logout)throw Error('Existing GST session detected, but Logout control was not found. Log out manually, then Resume.');
 await change(j=>{j.stage='logoutAwait';});logout.click();
 await setupWait(()=>loginPage(),20000);
 await change(j=>{j.stage='login';});return await setup();
 }
 await msg({action:'clearCredentials'});
 await msg({action:'escape'});await sleep(600);
 if(all('.modal.in,.modal.show,[role="dialog"][aria-modal="true"]').length)throw Error('Popup remained open after Escape. Close it manually, then Resume.');
 if(/\/litserv\/auth\/case\/search/.test(location.pathname)){
 const id=await setupWait(()=>gstin());await change(j=>{j.gstin=id;});await bindIdentity();await change(j=>{j.stage='downloads';});await note('Login/navigation complete. Starting downloads.');return true;
 }
 if(!j.tradeName){const detected=tradeName();if(detected)await change(j=>{j.tradeName=detected;});}
 if(!/\/services\/auth\/quicklinks\/userservices/.test(location.pathname)){
 await change(j=>{j.stage='userServices';});await note('Opening User Services.');location.href='https://services.gst.gov.in/services/auth/quicklinks/userservices';return false;
 }
 await change(j=>{j.stage='applications';});await note('Opening My Applications.');
 const link=document.querySelector('a[href="//services.gst.gov.in/litserv/auth/case/search"],a[href="https://services.gst.gov.in/litserv/auth/case/search"]');if(link&&!link.classList.contains('disabledanchor'))link.click();else location.href=SEARCH;return false;
}
async function run(){if(running)return;running=true;runJobId=(await job())?.id;try{await msg({action:'claim',token:runnerToken});if(!await setup())return;let j=await job();await check();await bindIdentity();j=await job();
 await note('Page: '+location.pathname);
 if(j.activeCase){
 const c=j.activeCase;
 if(/\/case\/folder/.test(location.pathname)){
 await note('Continuing case '+c.arn);await documents(c.type,c.arn,c.filing,c.metadata||{});if(!await backToSearch())return;j=await job();
 }else{
 // A case selection was saved before a full page navigation. Re-open it from its search month.
 if(!document.querySelector('#up_type')){location.href=SEARCH;return;}
 await search(c.type,c.range);const target=links().find(e=>e.innerText.trim()===c.arn);
 if(!target)throw Error('Saved ARN is not on this results page: '+c.arn+'. Check the portal and start a smaller date range.');
 await note('Reopening case '+c.arn);target.click();await documents(c.type,c.arn,c.filing,c.metadata||{});if(!await backToSearch())return;j=await job();
 }
 }
 if(!document.querySelector('#up_type')){location.href=SEARCH;return;}const ranges=months(j.config.from,j.config.to);for(let ti=j.ti||0;ti<j.config.types.length;ti++){const type=j.config.types[ti];for(let ri=ti===(j.ti||0)?j.ri||0:0;ri<ranges.length;ri++){
 await change(j=>{j.ti=ti;j.ri=ri;});await note(`${type==='ADJVP'?'DRC-03':'Refunds'} ${ranges[ri].from} to ${ranges[ri].to}`);await search(type,ranges[ri]);
 let pages=new Set();while(true){await check();const rows=links();const signature=rows.map(e=>e.innerText.trim()).join('|');if(pages.has(signature))throw Error('Repeated results page detected; stopped to avoid skipping records.');pages.add(signature);
 for(const item of rows){const tr=item.closest('tr');await msg({action:'recordCase',case:{type,arn:item.innerText.trim(),filing:tr?.querySelector('[title="Date of Filing"]')?.innerText.trim()||tr?.innerText.match(/\b\d{2}\/\d{2}\/\d{4}\b/)?.[0]||''}});}
 let navigated=false;for(const link of rows){const arn=link.innerText.trim();j=await job();if(j.completedArns[type+'|'+arn])continue;if(j.retryOnly&&!j.failedCaseKeys?.includes(GST.caseKey(j.gstin,type,arn)))continue;const row=link.closest('tr');const filing=row.querySelector('[title="Date of Filing"]')?.innerText.trim()||row.innerText.match(/\b\d{2}\/\d{2}\/\d{4}\b/)?.[0];const metadata={refundType:row.querySelector('[title="Refund Type"]')?.innerText.trim()||'',fromPeriod:row.querySelector('[title="From Period"]')?.innerText.trim()||'',toPeriod:row.querySelector('[title="To Period"]')?.innerText.trim()||'',portalStatus:row.querySelector('[title="Status"]')?.innerText.trim()||''};await change(j=>{j.activeCase={type,arn,filing:filing||'',range:ranges[ri],metadata};});await note('Opening ARN '+arn);link.click();await documents(type,arn,filing||'',metadata);if(!await backToSearch())return;await search(type,ranges[ri]);navigated=true;break;}if(navigated){pages.clear();continue;}
 const next=all('.ng-table-pagination li:not(.disabled):not(.active) a').find(e=>/next|›|»/i.test((e.getAttribute('aria-label')||'')+' '+(e.title||'')+' '+e.innerText));if(!next)break;next.click();await sleep(1800);}
 await change(j=>{j.ri=ri+1;j.navigationRestarts=0;});}await change(j=>{j.ti=ti+1;j.ri=0;});}await msg({action:'finishClient'});
 }catch(e){if(e.message!=='CONTROL'){if((await job())?.id===runJobId)await change(j=>{j.status='paused';j.message=e.message;j.logs.push(e.message);});}}finally{running=false;}}
chrome.runtime.onMessage.addListener((m,s,reply)=>{(async()=>{if(m.action==='start'){if(running)throw Error('Pause the current run before starting another.');if(!document.querySelector('#up_type'))throw Error('Open My Applications search first.');const id=gstin();if(!id)throw Error('GSTIN could not be detected.');const now=new Date();const max=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;if(m.config.from<'2017-07-01'||m.config.to>max)throw Error('Dates must be between July 2017 and today.');const manual=GST.newJob(m.config,[],null);manual.stage='downloads';manual.gstin=id;manual.tradeName=tradeName();await chrome.storage.local.set({job:manual});run();}else if(m.action==='resume'){if(running)throw Error('Wait for the current operation to finish before resuming.');const j=await job();if(!j)throw Error('No saved run.');if(j.status.startsWith('complete'))throw Error('This run is already complete.');runJobId=j.id;await change(j=>j.status='running');run();}else if(m.action==='pause'||m.action==='stop'){await change(j=>{j.status=m.action==='pause'?'paused':'stopped';j.message=m.action==='pause'?'Paused; current download may finish.':'Stopped; progress retained.';});if(m.action==='stop')await msg({action:'clearCredentials'});}return {ok:true};})().then(reply).catch(e=>reply({error:e.message}));return true;});
job().then(async j=>{if(j?.status==='running'){
 const lease=await msg({action:'claim',token:runnerToken}).catch(()=>null);if(!lease)return;
 const updated=await change(j=>{j.navigationRestarts=(j.navigationRestarts||0)+1;});
 if(updated.navigationRestarts>5){await change(j=>{j.status='paused';j.message='Repeated page navigation detected. Export log for diagnosis.';});return;}
 run();}});
})();
