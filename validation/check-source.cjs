const fs=require('fs'), vm=require('vm'), assert=require('assert/strict'), path=require('path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const blocks=[...read('index.html').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!(/\bsrc\s*=/.test(m[1]))).map(m=>m[2]);
for(const js of blocks)new vm.Script(js);
for(const file of ['product-data.js','workspace.js'])new vm.Script(read(file));
const c=vm.createContext({console});
vm.runInContext(read('product-data.js'),c);
vm.runInContext(blocks[0],c);
vm.runInContext(blocks[1].split('function render(){')[0]+'\nfunction wdUseOf(w){return w?.useSel||""}',c);
const refs=JSON.parse(read('validation/source-examples.json'));
let values=0,configs=0,rows=0;
const close=(a,b,label)=>assert(Math.abs(a-b)<1e-5,`${label}: ${a} != ${b}`);
for(const [product,ref] of Object.entries(refs)){
  vm.runInContext(`state.product=${JSON.stringify(product)}`,c);
  const result=vm.runInContext(`simulate(${ref.term},${JSON.stringify(ref.gender)},${ref.age},${ref.premium})`,c);
  close(result.sa,ref.sa,`${product} sum assured`);
  assert.equal(result.rows.length,ref.rows.length);
  for(let i=0;i<ref.rows.length;i++)for(const [field,v]of Object.entries(ref.rows[i])){
    close(result.rows[i][field],v,`${product} year ${i+1} ${field}`);values++;
  }
  const tables=vm.runInContext('prod().tbl',c), premiums=vm.runInContext('prod().prem',c);
  assert.deepEqual(Object.keys(tables).map(Number),product==='zx'?[1,3,5,10]:[1,3,6,10,15,20]);
  for(const [term,sexes]of Object.entries(tables))for(const [gender,ages]of Object.entries(sexes))for(const [age,t]of Object.entries(ages)){
    assert.equal(t.cv.length,105-Number(age));
    assert(Number.isFinite(premiums[term][gender][age]));
    for(const f of ['cv','dv','rt','pc','pd'])assert.equal(t[f].length,t.cv.length);
    const result=vm.runInContext(`simulate(${term},${JSON.stringify(gender)},${age},10000)`,c);
    for(const r of result.rows){
      for(const f of ['total','cv','div','death','traffic'])assert(Number.isFinite(r[f])&&r[f]>=0,`${product}/${term}/${gender}/${age}/${r.n}/${f}`);
      close(r.total,r.cv+r.puCV+r.div,'benefit reconciliation');
      assert.equal(r.traffic===0, r.age<19||r.age>80);
      rows++;
    }
    configs++;
  }
}
// Withdrawal caps, the paid-up death branch, and age boundaries are distinct risks.
vm.runInContext("state.product='qd30'",c);
const wd=vm.runInContext("runSim(6,'男',30,10000,[{from:7,to:12,x:1e9,y:1e9}])",c);
for(const r of wd.rows){assert(r.wdX<=r.capX+1e-8);assert(r.wdY<=r.capY+1e-8);assert(r.afterTotal>=-1e-8);}
assert(refs.qd30.rows[6].death>refs.qd30.rows[6].cumPrem*1.6+refs.qd30.rows[6].puCV+refs.qd30.rows[6].div);
console.log(`PASS: ${values} values match workbook cached examples within 0.00001 yuan; ${configs} configurations / ${rows} policy years; withdrawal caps and syntax OK.`);
