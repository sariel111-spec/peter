import {seedEntries} from '../../archive';
import {bindings,identity,json,unauthorized} from '../shared';
export async function POST(){
 const owner=await identity();if(!owner)return unauthorized();const db=bindings().DB;
 // A conditional insert in one batch prevents duplicate starter records across tabs.
 const entries=seedEntries.map(r=>db.prepare('INSERT OR IGNORE INTO records (id,owner,kind,title,content,tags,data,date,favorite,deleted,revision,updated) SELECT ?,?,?,?,?,?,?,?,?,?,1,? WHERE NOT EXISTS (SELECT 1 FROM preferences WHERE owner=?)').bind(`${owner}:${r.id}`,owner,r.kind,r.title,r.content,JSON.stringify(r.tags),JSON.stringify(r.data),r.date,0,0,new Date().toISOString(),owner));
 await db.batch([...entries,db.prepare('INSERT OR IGNORE INTO preferences (owner,initialized) VALUES (?,1)').bind(owner)]);
 return json({ok:true});
}
