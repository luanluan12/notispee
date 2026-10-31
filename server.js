import http from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomBytes} from 'node:crypto';
import app from './app.js';
import {FileBucket} from './storage.js';
const dir=resolve(process.env.DATA_DIR||'./data');await mkdir(dir,{recursive:true,mode:0o700});
let key=process.env.BOT_ENCRYPTION_KEY;
if(!key){const file=join(dir,'encryption.key');try{key=(await readFile(file,'utf8')).trim()}catch(e){if(e.code!=='ENOENT')throw e;key=randomBytes(32).toString('hex');await writeFile(file,key,{flag:'wx',mode:0o600})}}
if(!/^[a-f0-9]{64}$/i.test(key))throw Error('BOT_ENCRYPTION_KEY must contain 64 hex characters');
const env={BOT_ENCRYPTION_KEY:key,BUCKET:new FileBucket(dir),LAST_CHECK:null,CHECK_STATUS:'Chưa kiểm tra'};
let busy=false,stopping=false;
async function tick(){if(busy||stopping)return;busy=true;try{const response=await app.fetch(new Request('http://localhost/api/bot/check',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),env);const result=await response.json();env.LAST_CHECK=new Date().toISOString();const labels={disabled:'Bot đang tắt',already_notified:'Hôm nay đã gửi báo cáo',notified:'Đã gửi Telegram',in_progress:'Đang xử lý'};env.CHECK_STATUS=response.ok?(labels[result.result]||'Đã kiểm tra'):(result.message||'Lỗi kết nối');console.log(JSON.stringify({event:'background_check',status:response.status,result:result.result||'error'}))}catch{env.LAST_CHECK=new Date().toISOString();env.CHECK_STATUS='Lỗi kiểm tra nền; sẽ thử lại sau 10 phút';console.error('Background check failed')}finally{busy=false}}
const server=http.createServer(async(req,res)=>{try{if(req.url==='/health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end('{"ok":true}')}const host=req.headers.host||'localhost';const proto=req.headers['x-forwarded-proto']==='https'?'https':'http';let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>16384){res.writeHead(413);return res.end('Request too large')}chunks.push(chunk)}const method=req.method||'GET';const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(','):v);const request=new Request(proto+'://'+host+req.url,{method,headers,body:['GET','HEAD'].includes(method)?undefined:Buffer.concat(chunks)});const response=await app.fetch(request,env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch{res.writeHead(500,{'Content-Type':'application/json'});res.end('{"message":"Lỗi máy chủ. Vui lòng thử lại."}')}});
server.requestTimeout=60000;server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>{console.log('Web ready; automatic checks every 10 minutes');tick()});
const timer=setInterval(tick,600000);
process.on('SIGTERM',()=>{stopping=true;clearInterval(timer);server.close();setTimeout(()=>process.exit(0),45000).unref()});
