const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--allow-file-access-from-files']});const p=await b.newPage({viewport:{width:1080,height:1620}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+path.join(__dirname,'snap.html'));await p.evaluate(()=>window.ready);
for(let k=0;k<=8;k++){await p.evaluate(k=>window.show(k),k);await p.waitForTimeout(80);await p.screenshot({path:path.join(__dirname,`assets/pages/b-${k}.jpg`),type:'jpeg',quality:95});}
await b.close();})();
