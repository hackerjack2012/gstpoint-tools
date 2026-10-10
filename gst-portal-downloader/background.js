importScripts('common.js');
const safe=s=>String(s||'Document').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/^\.+|[. ]+$/g,'').slice(0,150)||'Document';
async function nativeLoginInput(tabId,credentials){
 const target={tabId};await chrome.debugger.attach(target,'1.3');
 try{for(const [selector,text]of [['#username,input[name="username"],#user_name',credentials.username],['#user_pass',credentials.password]]){
 const result=await chrome.debugger.sendCommand(target,'Runtime.evaluate',{expression:`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return false;e.focus();e.select();return true;})()`,returnByValue:true});if(result.result?.value!==true)throw Error('Login field not found.');
 await chrome.debugger.sendCommand(target,'Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Backspace',code:'Backspace',windowsVirtualKeyCode:8});
 await chrome.debugger.sendCommand(target,'Input.dispatchKeyEvent',{type:'keyUp',key:'Backspace',code:'Backspace',windowsVirtualKeyCode:8});
 for(const char of text)await chrome.debugger.sendCommand(target,'Input.insertText',{text:char});
 await chrome.debugger.sendCommand(target,'Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 await chrome.debugger.sendCommand(target,'Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 }
 return {ok:true};}finally{try{await chrome.debugger.detach(target);}catch{}}
}
async function nativeLoginClick(tabId){
 const target={tabId};await chrome.debugger.attach(target,'1.3');
 try{const r=await chrome.debugger.sendCommand(target,'Runtime.evaluate',{expression:`(()=>{const b=[...document.querySelectorAll('button[type="submit"]')].find(e=>/^login$/i.test(e.innerText.trim()));if(!b||b.disabled)return null;b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`,returnByValue:true});const point=r.result?.value;if(!point)throw Error('Login button unavailable.');
 await chrome.debugger.sendCommand(target,'Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
 await chrome.debugger.sendCommand(target,'Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});return {ok:true};
 }finally{try{await chrome.debugger.detach(target);}catch{}}
}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{(async()=>{
 if(m.action==='controlJob'){
 if(sender.tab||!sender.url?.startsWith(chrome.runtime.getURL('')))throw Error('Use the extension popup.');
 const {job}=await chrome.storage.local.get('job');if(job){job.status=m.control==='pause'?'paused':'stopped';job.message=m.control==='pause'?'Paused; current download may finish.':'Stopped; progress retained.';await chrome.storage.local.set({job});}
 if(m.control==='stop')await chrome.storage.session.remove(['loginCredentials','queueSecrets']);return {ok:true};
 }
 if(m.action==='startLogin'){
 if(sender.tab||!sender.url?.startsWith(chrome.runtime.getURL('')))throw Error('Use the extension panel to start login.');
 const {job}=await chrome.storage.local.get('job');if(job){job.status='stopped';await chrome.storage.local.set({job});}
 const clients=m.clients?.length?m.clients:[{username:m.username,password:m.password}];
 if(clients.some(c=>!c.username||!c.password))throw Error('Every queued client needs username and password.');
 if(!m.config?.from||!m.config?.to||m.config.from>m.config.to||!m.config.types?.length)throw Error('Enter a valid date range and application types.');
 await chrome.storage.session.remove(['pending','runner']);await chrome.storage.local.remove('rememberedLogin');
 await chrome.storage.session.set({queueSecrets:clients,loginCredentials:{username:clients[0].username,password:clients[0].password}});
 const tab=await chrome.tabs.create({url:'about:blank',active:false});
 const fresh=GST.newJob(m.config,clients,tab.id);
 if(m.failedOnly){const keys=Object.entries(job?.cases||{}).filter(([k,c])=>c.status!=='complete'||Object.values(job.documents||{}).some(d=>GST.caseKey(d.gstin,d.type,d.arn)===k&&['failed','pending'].includes(d.status))).map(([k])=>k);if(!keys.length){await chrome.tabs.remove(tab.id);await chrome.storage.session.remove(['queueSecrets','loginCredentials']);throw Error('No failed or incomplete cases.');}fresh.retryOnly=true;fresh.failedCaseKeys=keys;fresh.cases=Object.fromEntries(keys.map(k=>[k,{...job.cases[k],status:'pending'}]));}
 await chrome.storage.local.set({job:fresh});
 await chrome.tabs.update(tab.id,{url:'https://services.gst.gov.in/services/login',active:true});return {ok:true};
 }
 if(m.action==='retryFailed'){
 if(sender.tab||!sender.url?.startsWith(chrome.runtime.getURL('')))throw Error('Use the extension panel.');
 const {job}=await chrome.storage.local.get('job');if(!job?.gstin)throw Error('No run to retry.');if(job.status==='running')throw Error('Pause the current run first.');
 const failed=Object.values(job.documents||{}).filter(d=>d.status==='failed'||d.status==='pending');const unresolved=Object.values(job.cases||{}).filter(c=>c.status!=='complete');
 const keys=[...new Set([...failed.map(d=>GST.caseKey(d.gstin,d.type,d.arn)),...unresolved.map(c=>GST.caseKey(c.gstin,c.type,c.arn))])];if(!keys.length)throw Error('No failed or incomplete cases.');
 if(keys.some(k=>!k.startsWith(job.gstin+'|')))throw Error('Failures span other taxpayers. Start a new incremental queue for those clients.');
 job.failedCaseKeys=keys;job.retryOnly=true;job.status='paused';job.stage='downloads';job.ti=0;job.ri=0;job.activeCase=null;job.completedArns={};job.message='Retry prepared. Ensure the original GSTIN is logged in, then Resume.';await chrome.storage.local.set({job});return {ok:true};
 }
 if(!sender.tab||!sender.url?.startsWith('https://services.gst.gov.in/'))throw Error('Unsupported page');
 const {job:activeJob}=await chrome.storage.local.get('job');if(activeJob?.tabId&&activeJob.tabId!==sender.tab.id)throw Error('CONTROL');
 if(m.action==='recordCase'){
 const {job}=await chrome.storage.local.get('job');const key=GST.caseKey(job.gstin,m.case.type,m.case.arn);if(job.retryOnly&&!job.failedCaseKeys?.includes(key))return {ok:true};const prior=job.cases[key]||{};job.cases[key]={...prior,...m.case,gstin:job.gstin,tradeName:job.tradeName,categories:prior.categories||{},status:prior.status||'pending'};await chrome.storage.local.set({job});return {ok:true};
 }
 if(m.action==='recordCategory'){
 const {job}=await chrome.storage.local.get('job');const c=job.cases[m.caseKey];if(c){c.categories[m.category]={count:m.count,empty:m.count===0,visited:true};await chrome.storage.local.set({job});}return {ok:true};
 }
 if(m.action==='registerDocument'){
 const {job,archive={}}=await chrome.storage.local.get(['job','archive']);
 const saved=job.done[m.key]||(job.config.incremental?archive[m.key]:null);let exists=false;
 if(saved?.downloadId){const [file]=await chrome.downloads.search({id:saved.downloadId});exists=file?.state==='complete'&&file.exists!==false;}
 const prior=job.documents[m.key];const record={...m.record,status:exists?'already_saved':'pending',attempts:prior?.attempts||0,...(exists?{filename:saved.filename,at:saved.at,downloadId:saved.downloadId}:{})};
 if(prior?.status==='downloaded'&&exists)record.status='downloaded';job.documents[m.key]=record;await chrome.storage.local.set({job});return {skip:exists};
 }
 if(m.action==='documentAttempt'){
 const {job}=await chrome.storage.local.get('job');if(job.documents[m.key]){job.documents[m.key].attempts++;job.documents[m.key].status='pending';job.documents[m.key].error='';}await chrome.storage.local.set({job});return {ok:true};
 }
 if(m.action==='documentResult'){
 const {job,archive={}}=await chrome.storage.local.get(['job','archive']);const d=job.documents[m.key];if(!d)throw Error('Document ledger entry missing.');Object.assign(d,m.result);if(m.result.status==='downloaded'){const saved={filename:d.filename,at:d.at,downloadId:d.downloadId};job.done[m.key]=saved;archive[m.key]=saved;}await chrome.storage.local.set({job,archive});return {ok:true};
 }
 if(m.action==='finishCase'){
 const {job}=await chrome.storage.local.get('job');const c=job.cases[m.caseKey];if(c){const docs=Object.values(job.documents).filter(d=>GST.caseKey(d.gstin,d.type,d.arn)===m.caseKey);c.status=m.empty?'no_download_controls':docs.some(d=>['failed','pending'].includes(d.status))?'incomplete':'complete';c.error=m.empty?'No downloadable controls found':'';}await chrome.storage.local.set({job});return {ok:true};
 }
 if(m.action==='finishClient'){
 const {job}=await chrome.storage.local.get('job');const currentCases=Object.values(job.cases).filter(c=>c.gstin===job.gstin);const issues=currentCases.some(c=>c.status!=='complete');
 job.clientResults=job.clientResults.filter(c=>c.gstin!==job.gstin);job.clientResults.push({username:job.clients[job.clientIndex]?.username||'',gstin:job.gstin,tradeName:job.tradeName,status:issues?'complete_with_issues':'complete'});
 if(job.clientIndex+1>=job.clients.length){job.status=Object.values(job.cases).some(c=>c.status!=='complete')?'complete_with_issues':'complete';job.message=job.status==='complete'?'Finished. Review reconciliation and export the Excel index.':'Finished with issues. Review incomplete cases and retry failed files.';job.finishedAt=Date.now();await chrome.storage.local.set({job});await chrome.storage.session.remove(['loginCredentials','queueSecrets','runner']);return {complete:true};}
 const {queueSecrets}=await chrome.storage.session.get('queueSecrets');const next=queueSecrets?.[job.clientIndex+1];if(!next)throw Error('Client credentials expired. Enter credentials and start an incremental queue for remaining clients.');
 job.clientIndex++;job.stage='login';job.gstin=null;job.tradeName='';job.ti=0;job.ri=0;job.completedArns={};job.activeCase=null;job.navigationRestarts=0;job.message='Opening login for next client.';
 await chrome.storage.local.set({job});await chrome.storage.session.set({loginCredentials:{username:next.username,password:next.password}});await chrome.storage.session.remove(['runner','pending']);await chrome.tabs.update(job.tabId,{url:'https://services.gst.gov.in/services/login'});return {next:true};
 }
 if(m.action==='clearCredentials'){await chrome.storage.session.remove('loginCredentials');return {ok:true};}
 if(m.action==='fillLogin'){
 const {job}=await chrome.storage.local.get('job');if(job?.tabId!==sender.tab.id||job.stage!=='login')throw Error('Login is not active for this tab.');
 const {loginCredentials:c}=await chrome.storage.session.get('loginCredentials');if(!c)throw Error('Credentials expired. Stop and start login again.');
 return await nativeLoginInput(sender.tab.id,c);
 }
 if(m.action==='loginState'){
 const [{result}]=await chrome.scripting.executeScript({target:{tabId:sender.tab.id},world:'MAIN',func:()=>{
 const get=selector=>{const el=document.querySelector(selector);if(!el)return {invalid:true};const model=window.angular?.element(el).controller('ngModel');return {invalid:!el.value||el.classList.contains('ng-invalid')||Boolean(model?.$invalid),hasModel:Boolean(model),modelEmpty:model?model.$isEmpty(model.$modelValue):null};};
 const password=get('#user_pass'),username=get('#username,input[name="username"],#user_name');return {passwordInvalid:password.invalid,usernameInvalid:username.invalid,passwordModelPresent:password.hasModel,passwordModelEmpty:password.modelEmpty};
 }});const {job}=await chrome.storage.local.get('job');if(job){job.logs.push('Login field check: '+JSON.stringify(result));await chrome.storage.local.set({job});}return result;
 }
 if(m.action==='submitLogin'){
 const {job}=await chrome.storage.local.get('job');if(job?.tabId!==sender.tab.id||job.stage!=='loginSubmitted')throw Error('Login submission is not active.');
 return await nativeLoginClick(sender.tab.id);
 }
 if(m.action==='escape'){
 await chrome.scripting.executeScript({target:{tabId:sender.tab.id},world:'MAIN',func:()=>{for(const type of ['keydown','keyup']){const event=new KeyboardEvent(type,{key:'Escape',code:'Escape',keyCode:27,which:27,bubbles:true});(document.activeElement||document.body).dispatchEvent(event);}
 if(window.jQuery)jQuery(document).trigger(jQuery.Event('keydown',{key:'Escape',keyCode:27,which:27}));}});return {ok:true};
 }

 if(m.action==='claim'){const {job}=await chrome.storage.local.get('job');if(job?.tabId&&job.tabId!==sender.tab.id)throw Error('CONTROL');if(job&&!job.tabId){job.tabId=sender.tab.id;await chrome.storage.local.set({job});}await chrome.storage.session.set({runner:{tabId:sender.tab.id,token:m.token}});return {ok:true};}
 if(m.action==='lease'){const {runner}=await chrome.storage.session.get('runner');return {owned:runner?.token===m.token&&runner?.tabId===sender.tab.id};}
 if(m.action==='bridge'){
 const [{result}]=await chrome.scripting.executeScript({target:{tabId:sender.tab.id},world:'MAIN',func:(cmd)=>{
 try{const visible=e=>e&&e.getClientRects().length; if(cmd.kind==='dates'){
 const roots=[document.querySelector('[ng-app]'),document.querySelector('[data-ng-app]'),document.body,document.documentElement,document];
 let injector;for(const root of roots){try{injector=window.angular?.element(root).injector();if(injector)break;}catch{}}
 const rootScope=injector?.get('$rootScope');
 for(const [selector,value]of [['#up_type',cmd.type],['input[name="fromdate"]',cmd.from],['input[name="todate"]',cmd.to]]){
 const el=document.querySelector(selector);if(!el)throw Error('Missing '+selector);
 const model=window.angular?.element(el).controller('ngModel');
 if(el.tagName==='SELECT'){
 if(![...el.options].some(o=>o.value===value))throw Error('Application options are still loading. Wait and resume.');
 Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,value);
 el.dispatchEvent(new Event('change',{bubbles:true}));
 if(el.value!==value)throw Error('Application dropdown reset after selection. Please export the log.');
 continue;
 }
 const update=()=>{
 if(model){model.$setViewValue(value);el.value=value;return;}
 // Angular's native input/change listeners work even when debug scope lookup is disabled.
 const setter=Object.getOwnPropertyDescriptor(el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set;
 setter.call(el,value);
 el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
 };
 if(rootScope&&!rootScope.$$phase)rootScope.$apply(update);else update();
 // Keep an attached calendar widget in sync without relying on Angular debug scope data.
 if(el.tagName==='INPUT'&&window.jQuery){const widget=jQuery(el);const parts=value.split('/');const date=new Date(+parts[2],+parts[1]-1,+parts[0]);
 try{if(widget.data('datepicker')&&typeof widget.datepicker==='function'){widget.datepicker('setDate',date);widget.trigger('change');}}catch{}
 }
 if(el.value!==value)throw Error('Portal did not accept '+selector+' = '+value);
 if(model&&model.$viewValue!==value)throw Error('Portal date model did not accept '+value);
 }
 const button=document.querySelector('button[title="Search"]');if(!visible(button)||button.disabled)throw Error('Search disabled');button.click();
 }return {ok:true};}catch(e){return {error:e.message};}
 },args:[m.cmd]});return result;}
 if(m.action==='arm'){
 const {runner}=await chrome.storage.session.get('runner');if(runner?.token!==m.token)throw Error('CONTROL');
 const {pending:p}=await chrome.storage.session.get('pending');
 if(p&&!p.finished){
 const same=p.folder===m.folder&&p.label===m.label;
 if(p.id){const [d]=await chrome.downloads.search({id:p.id});
 if(d?.state==='complete'&&same){await chrome.storage.session.set({pending:{...p,owner:m.token}});return {adopt:true};}
 if(d?.state==='in_progress'){if(!same)throw Error('A previous download is still in progress. Check Chrome Downloads before resuming.');await chrome.storage.session.set({pending:{...p,owner:m.token}});return {adopt:true};}
 }else if(Date.now()-p.armed<90000){if(!same)throw Error('A previous download has not started yet. Check Chrome Downloads, wait 90 seconds, then resume.');await chrome.storage.session.set({pending:{...p,owner:m.token}});return {adopt:true};}
 }
 await chrome.storage.session.set({pending:{tabId:sender.tab.id,folder:m.folder,label:m.label,owner:m.token,armed:Date.now()}});return {ok:true};}
 if(m.action==='downloadStatus'){const {pending}=await chrome.storage.session.get('pending');if(!pending)return {error:'Download tracking lost'};if(pending.id){const [d]=await chrome.downloads.search({id:pending.id});if(d?.state==='complete'){await chrome.storage.session.set({pending:{...pending,finished:true}});return {complete:true,filename:d.filename,downloadId:d.id};}if(d?.state==='interrupted')return {error:'Download interrupted: '+d.error};}return {waiting:true};}
 if(m.action==='disarm'){const {pending}=await chrome.storage.session.get('pending');if(pending?.owner===m.token)await chrome.storage.session.remove('pending');return {ok:true};}
 throw Error('Unknown command');
 })().then(reply).catch(e=>reply({error:e.message}));return true;});
chrome.downloads.onDeterminingFilename.addListener((item,suggest)=>{
 chrome.storage.session.get('pending').then(async({pending:p})=>{const originOK=[item.url,item.finalUrl,item.referrer].some(u=>/^https:\/\/([^/]+\.)?gst\.gov\.in\//.test(u||'')||/^blob:https:\/\/services\.gst\.gov\.in\//.test(u||''));if(!p||p.id||p.finished||Date.now()-p.armed>90000||!originOK){suggest();return;}await chrome.storage.session.set({pending:{...p,id:item.id}});const base=safe(item.filename.split(/[\\/]/).pop());suggest({filename:p.folder.split('/').map(safe).join('/')+'/'+safe(p.label)+'__'+base,conflictAction:'uniquify'});}).catch(()=>suggest());return true;
});
