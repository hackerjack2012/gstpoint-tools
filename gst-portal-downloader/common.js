/* Shared helpers. No credentials or master passwords are logged. */
const GST = (() => {
 const safe = s => String(s || 'Unknown').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/^\.+|[. ]+$/g, '').slice(0,150)||'Unknown';
 const caseKey = (gstin,type,arn) => [gstin,type,arn].join('|');
 function stats(job={}) {
  const docs=Object.values(job.documents||{}),cases=Object.values(job.cases||{});
  return {arns:cases.length,documents:docs.length,downloaded:docs.filter(d=>d.status==='downloaded').length,skipped:docs.filter(d=>d.status==='already_saved').length,failed:docs.filter(d=>d.status==='failed').length,pending:docs.filter(d=>d.status==='pending').length,emptyCategories:cases.reduce((n,c)=>n+Object.values(c.categories||{}).filter(v=>v.empty).length,0),incompleteCases:cases.filter(c=>c.status!=='complete').length};
 }
 function newJob(config,clients,tabId) {
  return {id:crypto.randomUUID(),config,clients:clients.map(c=>({username:c.username})),clientIndex:0,clientResults:[],gstin:null,tradeName:'',status:'running',stage:'login',tabId,done:{},documents:{},cases:{},completedArns:{},logs:[],ti:0,ri:0,startedAt:Date.now(),message:'Opening GST login; waiting for existing CAPTCHA solver.'};
 }
 return {safe,caseKey,stats,newJob};
})();
if(typeof globalThis!=='undefined')globalThis.GST=GST;
if(typeof module!=='undefined')module.exports=GST;
