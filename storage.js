import {mkdir,readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
// File-backed adapter for the app's object storage; DATA_DIR must be a Volume.
export class FileBucket {
  constructor(root){this.root=root}
  path(key){if(!/^[a-zA-Z0-9/_-]+$/.test(key)||key.includes('..'))throw Error('Invalid storage key');return join(this.root,key)}
  async get(key){try{const text=await readFile(this.path(key),'utf8');return {text:async()=>text,json:async()=>JSON.parse(text)}}catch(e){if(e.code==='ENOENT')return null;throw e}}
  async put(key,value,options={}){const path=this.path(key);await mkdir(join(path,'..'),{recursive:true});if(options.onlyIf?.etagDoesNotMatch==='*'){try{await writeFile(path,value,{flag:'wx',mode:0o600});return {etag:randomUUID()}}catch(e){if(e.code==='EEXIST')return null;throw e}}const temp=path+'.'+randomUUID()+'.tmp';await writeFile(temp,value,{mode:0o600});await rename(temp,path);return {etag:randomUUID()}}
  async delete(key){try{await unlink(this.path(key))}catch(e){if(e.code!=='ENOENT')throw e}}
}
