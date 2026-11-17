/* Pruebas sin dependencias externas para el cliente REST. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const local = new Map(), session = new Map();
const storage = map => ({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)});
const calls=[];
const context = {
  window:{BACKEND_HOST:'localhost',BACKEND_PORT:8080,BACKEND_URL:''},
  localStorage:storage(local),sessionStorage:storage(session),
  location:{origin:'http://localhost:5500'},URL,AbortController,TextDecoder,
  setTimeout,clearTimeout,
  fetch:async(url,opts)=>{
    calls.push({url,opts});
    if(url.endsWith('/auth/login'))return {status:200,ok:true,text:async()=>JSON.stringify({token:'abc.def.xyz'})};
    if(url.includes('/api/missing'))return {status:404,ok:false,text:async()=>JSON.stringify({message:'No encontrado',errorCode:'RESOURCE_NOT_FOUND'})};
    if(url.endsWith('/api/empty'))return {status:204,ok:true,text:async()=>''};
    return {status:200,ok:true,text:async()=>JSON.stringify([{id:1}])};
  }
};
context.window.window = context.window;
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../frontend/js/api.js'),'utf8'),context);
(async()=>{
  const api=context.window.LogiAPI;
  assert.equal(api.baseURL(),'http://localhost:8080');
  const login=await api.request('/auth/login',{method:'POST',body:{correo:'test@example.com',password:'12345678'},publicEndpoint:true});
  assert.equal(login.token,'abc.def.xyz');
  assert.ok(!calls[0].opts.headers.Authorization,'Login público no debe enviar JWT');
  api.setToken(login.token);
  const rows=await api.request('/api/productos');
  assert.equal(rows[0].id,1);
  assert.equal(calls[1].opts.headers.Authorization,'Bearer abc.def.xyz');
  assert.equal(await api.request('/api/empty'),null);
  await assert.rejects(api.request('/api/missing'),/No encontrado/);
  api.setBaseURL('http://127.0.0.1:9090');
  assert.equal(api.baseURL(),'http://127.0.0.1:9090');
  await api.request('/api/productos',{query:{categoria:'A&B'}});
  assert.ok(calls.at(-1).url.includes('categoria=A%26B'));
  api.resetBaseURL();
  assert.equal(api.baseURL(),'http://localhost:8080');
  api.clearToken();assert.equal(api.token(),null);
  console.log('OK: URL configurable, auth pública, JWT, GET, 204, errores, query params y cierre de sesión.');
})().catch(e=>{console.error(e);process.exitCode=1});
