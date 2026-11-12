/* Minhas Tarefas — reconstrução independente baseada nas telas fornecidas.
   Dados separados por usuário e protegidos com políticas RLS no Supabase. */
(() => {
'use strict';
const SUPABASE_URL='https://dbzgcydwevpjsfindwcx.supabase.co';
const KEY='sb_publishable_SJIFc-jOXfQdYJjrkH334A_UAw3_1uG';
const sb=window.supabase?.createClient(SUPABASE_URL,KEY);
const screen=document.getElementById('screen'),root=document.getElementById('modal-root');
const nav=document.getElementById('nav'),logout=document.getElementById('logout'),label=document.getElementById('account-label');
const footer=document.getElementById('footer'),statusEl=document.getElementById('save-status');
const today=()=>{let d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const parseDate=s=>new Date((s||today())+'T12:00:00');
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const plus=(s,n)=>{const d=parseDate(s);d.setDate(d.getDate()+n);return iso(d)};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const datefmt=(s,opts={day:'2-digit',month:'2-digit',year:'numeric'})=>s?parseDate(s).toLocaleDateString('pt-BR',opts):'—';
const dateTime=s=>s?new Date(s).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'—';
const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
let user=null,items=[],cats=[],view='today',day=today(),rtype='monthly',rdate=today(),busy=false,toastTimer=null,loadSeq=0;
let mode=localStorage.getItem('mt-mode')||'dark',palette=localStorage.getItem('mt-palette')||'emerald';
document.body.dataset.mode=mode;document.body.dataset.palette=palette;
const toast=(message,error=false)=>{const el=document.getElementById('toast');el.textContent=message;el.style.borderColor=error?'#d67e76':'';el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3400)};
const saving=state=>{statusEl.textContent=state;statusEl.style.color=/erro/i.test(state)?'#ed9487':''};
function setBusy(v){busy=v;document.querySelectorAll('[data-loading]').forEach(b=>b.disabled=v)}
function ehandler(container,selector,event,fn){container.querySelectorAll(selector).forEach(el=>el.addEventListener(event,fn))}
function errorMessage(err){return err?.message||'Não foi possível concluir a operação.'}
async function run(query){const {data,error}=await query;if(error)throw error;return data}
const modal=(title,body,actions='',large=false)=>{
 root.innerHTML='<div class="modal-shade"><section class="dialog '+(large?'large':'')+'" role="dialog" aria-modal="true"><div class="dialog-head"><h2>'+esc(title)+'</h2><button type="button" data-close aria-label="Fechar">×</button></div>'+body+actions+'</section></div>';
 root.querySelector('[data-close]').onclick=()=>root.innerHTML='';
 root.querySelector('.modal-shade').onclick=e=>{if(e.target===e.currentTarget)root.innerHTML=''};
 root.onkeydown=e=>{if(e.key==='Escape')root.innerHTML=''};
 root.querySelector('input:not([type=hidden]),textarea,select')?.focus();
};
const close=()=>root.innerHTML='';
const field=(name,text,type='text',val='',extra='')=>'<label class="field"><span>'+text+'</span><input name="'+name+'" type="'+type+'" value="'+esc(val)+'" '+extra+'></label>';
const tail='<div class="dialog-actions"><button type="button" class="outline" data-close2>Cancelar</button><button class="primary" data-loading type="submit">Salvar</button></div>';
function bindCancel(){const el=root.querySelector('[data-close2]');if(el)el.onclick=close}
const matches=(it,when)=>it.data===when&&!it.excluida;
function weekBounds(s){let d=parseDate(s),delta=d.getDay();return [plus(s,-delta),plus(s,6-delta)]}
function reportBounds(){if(rtype==='weekly')return weekBounds(rdate);let d=parseDate(rdate);return [iso(new Date(d.getFullYear(),d.getMonth(),1)),iso(new Date(d.getFullYear(),d.getMonth()+1,0))]}
function relevant(start,end){return items.filter(t=>!t.excluida&&t.data>=start&&t.data<=end).sort((a,b)=>a.data.localeCompare(b.data)||(a.horario||'99:99').localeCompare(b.horario||'99:99')||a.titulo.localeCompare(b.titulo,'pt-BR'))}
function stats(arr){let total=arr.length,done=arr.filter(t=>t.concluida_em).length;return {total,done,pending:total-done,pc:total?Math.round(done/total*100):0}}
function catName(id){return cats.find(c=>c.id===id)?.nome||''}
function dashboard(){
 const arr=relevant(day,day),s=stats(arr),dateLabel=parseDate(day).toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
 screen.innerHTML='<section class="panel"><div class="day-top"><div><small class="eyebrow">HOJE</small><h1 class="page-title">'+esc(dateLabel[0].toUpperCase()+dateLabel.slice(1))+'</h1></div><div class="date-control"><button class="outline" id="previous" title="Dia anterior">‹</button><input id="day-date" type="date" value="'+day+'" aria-label="Selecionar data"><button class="outline" id="next" title="Próximo dia">›</button><button class="text-link" id="go-today">Hoje</button></div></div><hr class="separator"><div class="progress-line"><span>'+s.done+' de '+s.total+' tarefas concluídas</span><strong>'+s.pc+'%</strong></div><div class="progress-bg"><div class="progress-fill" style="width:'+s.pc+'%"></div></div></section>'+
 '<section class="panel"><div class="card-heading"><h2>Tarefas do dia</h2><button class="primary" id="new-task">＋ Nova tarefa</button></div><div id="task-list">'+(arr.length?arr.map(taskRow).join(''):'<div class="task-empty"><h3>Nenhuma tarefa neste dia</h3><p>Comece adicionando a primeira atividade para acompanhar o seu progresso.</p><button class="outline" id="empty-add">＋ Adicionar tarefa</button></div>')+'</div></section>';
 document.getElementById('previous').onclick=()=>navigateDay(plus(day,-1));
 document.getElementById('next').onclick=()=>navigateDay(plus(day,1));
 document.getElementById('go-today').onclick=()=>navigateDay(today());
 document.getElementById('day-date').onchange=e=>navigateDay(e.target.value);
 document.getElementById('new-task').onclick=()=>taskDialog();
 document.getElementById('empty-add')?.addEventListener('click',()=>taskDialog());
 ehandler(screen,'[data-check]','change',async e=>{const id=e.target.dataset.check;await changeTask(id,{concluida_em:e.target.checked?new Date().toISOString():null})});
 ehandler(screen,'[data-edit]','click',e=>taskDialog(items.find(t=>t.id===e.currentTarget.dataset.edit)));
 ehandler(screen,'[data-delete]','click',e=>deleteDialog(items.find(t=>t.id===e.currentTarget.dataset.delete)));
}
function taskRow(t){
 const cat=catName(t.categoria_id),overdue=!t.concluida_em&&t.prazo_data&&(t.prazo_data<today()||(t.prazo_data===today()&&t.prazo_horario&&t.prazo_horario<new Date().toTimeString().slice(0,5)));
 return '<div class="task-row"><input class="task-check" type="checkbox" aria-label="Concluir tarefa" data-check="'+t.id+'" '+(t.concluida_em?'checked':'')+'><div class="task-main"><div class="task-title '+(t.concluida_em?'done':'')+'">'+esc(t.titulo)+'</div>'+(t.descricao?'<div class="task-desc">'+esc(t.descricao)+'</div>':'')+'<div class="task-meta">'+(t.horario?'<span>◷ '+esc(t.horario.slice(0,5))+'</span>':'')+(cat?'<span class="task-badge">'+esc(cat)+'</span>':'')+(t.repeticao!=='nenhuma'?'<span>↻ '+esc(({diaria:'Diária',dias_uteis:'Dias úteis',semanal:'Semanal',mensal:'Mensal'})[t.repeticao])+'</span>':'')+(t.concluida_em?'<span class="completed-text">✓ '+dateTime(t.concluida_em)+'</span>':'')+(overdue?'<span class="task-overdue">⚠ Atrasada</span>':'')+(t.prazo_data?'<span>Prazo: '+datefmt(t.prazo_data)+(t.prazo_horario?' '+t.prazo_horario.slice(0,5):'')+'</span>':'')+'</div></div><div class="task-actions"><button data-edit="'+t.id+'" aria-label="Editar tarefa">✎</button><button data-delete="'+t.id+'" aria-label="Excluir tarefa">×</button></div></div>';
}
async function navigateDay(d){day=d;await ensureRange(d,d);dashboard()}
const repeatOptions=[['nenhuma','Não repetir'],['diaria','Todos os dias'],['dias_uteis','Dias úteis (seg. a sex.)'],['semanal','Semanalmente'],['mensal','Mensalmente']];
function taskDialog(t=null){
 const isEdit=!!t,base=t||{},dt=base.data||day;
 const option=(v,label,selected)=>'<option value="'+v+'" '+(v===selected?'selected':'')+'>'+label+'</option>';
 const body='<p>Preencha o essencial. Descrição, horário e categoria são opcionais.</p><form id="task-form">'+field('titulo','Título','text',base.titulo||'','maxlength="250" placeholder="Ex.: Enviar relatório semanal" required')+
 '<label class="field"><span>Descrição (opcional)</span><textarea name="descricao" placeholder="Detalhes que ajudam a lembrar do que precisa ser feito">'+esc(base.descricao||'')+'</textarea></label>'+
 '<div class="two">'+field('data','Data','date',dt,'required')+field('horario','Horário (opcional)','time',base.horario?.slice(0,5)||'')+'</div>'+
 '<label class="field"><span>Categoria (opcional)</span><select name="categoria_id"><option value="">Sem categoria</option>'+cats.map(c=>option(c.id,esc(c.nome),base.categoria_id)).join('')+'</select><small>Categorias criadas aqui ficam salvas para as próximas tarefas. <button class="text-link" type="button" id="add-category">＋ Nova categoria</button></small></label>'+
 '<label class="field"><span>Repetição</span><select name="repeticao">'+repeatOptions.map(([v,label])=>option(v,label,base.repeticao||'nenhuma')).join('')+'</select><small>As próximas ocorrências são criadas automaticamente, cada uma com seu status próprio.</small></label><hr class="separator">'+
 '<div class="two">'+field('prazo_data','Prazo: data (opcional)','date',base.prazo_data||'')+field('prazo_horario','Prazo: horário (opcional)','time',base.prazo_horario?.slice(0,5)||'')+'</div><p>Sem prazo definido, a tarefa é considerada atrasada após o horário do dia.</p>'+
 '<div class="dialog-actions"><button class="outline" type="button" data-close2>Cancelar</button><button class="primary" data-loading type="submit">'+(isEdit?'Salvar alterações':'Adicionar tarefa')+'</button></div><p id="form-error" class="error" role="alert"></p></form>';
 modal(isEdit?'Editar tarefa':'Nova tarefa',body,'',true);bindCancel();
 root.querySelector('#add-category').onclick=()=>categoryDialog(t?.id||null);
 root.querySelector('#task-form').onsubmit=async e=>{
 e.preventDefault();if(busy)return;
 const fd=new FormData(e.currentTarget),title=String(fd.get('titulo')).trim();
 if(!title){root.querySelector('#form-error').textContent='Informe o título.';return}
 const rec=String(fd.get('repeticao')),date=String(fd.get('data'));
 const payload={user_id:user.id,titulo:title,descricao:String(fd.get('descricao')).trim(),data:date,horario:fd.get('horario')||null,categoria_id:fd.get('categoria_id')||null,repeticao:rec,prazo_data:fd.get('prazo_data')||null,prazo_horario:fd.get('prazo_horario')||null,updated_at:new Date().toISOString()};
 try{
 setBusy(true);saving('Salvando…');
 if(isEdit){
   // Editar uma ocorrência não altera as outras da mesma série.
   if(rec!==base.repeticao){payload.serie_id=null;payload.data_ancora=date;}
   await run(sb.from('agenda_tarefas').update(payload).eq('id',base.id).eq('user_id',user.id));
 }else{
   payload.serie_id=rec==='nenhuma'?null:crypto.randomUUID();
   payload.data_ancora=date;
   await run(sb.from('agenda_tarefas').insert(payload));
 }
 close();await reload();await ensureRange(day,day);render();saving('Tudo salvo na sua conta');toast('Tarefa salva!');
 }catch(err){root.querySelector('#form-error').textContent=errorMessage(err);saving('Erro ao salvar');}finally{setBusy(false)}
 };
}
function categoryDialog(returnTask=null){
 const body='<p>Use uma categoria para organizar suas tarefas.</p><form id="cat-form">'+field('nome','Nome da categoria','text','','maxlength="100" required placeholder="Ex.: Departamento Pessoal"')+'<p class="error" id="cat-error"></p>'+tail+'</form>';
 modal('Nova categoria',body);bindCancel();
 root.querySelector('#cat-form').onsubmit=async e=>{
 e.preventDefault();const name=new FormData(e.currentTarget).get('nome')?.toString().trim();if(!name)return;
 try{setBusy(true);await run(sb.from('agenda_categorias').insert({user_id:user.id,nome:name}));await reload();toast('Categoria criada!');taskDialog(returnTask?items.find(t=>t.id===returnTask):null)}catch(err){root.querySelector('#cat-error').textContent=errorMessage(err)}finally{setBusy(false)}
 };
}
async function changeTask(id,fields){
 const t=items.find(x=>x.id===id);if(!t)return;
 try{saving('Salvando…');await run(sb.from('agenda_tarefas').update({...fields,updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',user.id));Object.assign(t,fields);render();saving('Tudo salvo na sua conta')}catch(e){saving('Erro ao salvar');toast(errorMessage(e),true);render()}
}
function deleteDialog(t){if(!t)return;
 modal('Excluir tarefa?','<p>A tarefa <strong>'+esc(t.titulo)+'</strong> será removida desta data. As outras ocorrências de uma repetição não serão apagadas.</p><div class="dialog-actions"><button class="outline" data-close2>Cancelar</button><button class="primary" id="confirm-delete">Excluir</button></div>');bindCancel();
 root.querySelector('#confirm-delete').onclick=async()=>{try{saving('Salvando…');await run(sb.from('agenda_tarefas').update({excluida:true,updated_at:new Date().toISOString()}).eq('id',t.id).eq('user_id',user.id));t.excluida=true;close();render();saving('Tudo salvo na sua conta');toast('Tarefa removida')}catch(e){toast(errorMessage(e),true)}}}
function intervalApplies(anchor,d,kind){
 const a=parseDate(anchor),v=parseDate(d),days=Math.round((v-a)/86400000);
 if(days<=0)return false;
 if(kind==='diaria')return true;
 if(kind==='dias_uteis')return v.getDay()!==0&&v.getDay()!==6;
 if(kind==='semanal')return days%7===0;
 if(kind==='mensal')return a.getDate()===v.getDate();
 return false;
}
async function ensureRange(from,to){
 if(!user)return;
 const recurring=items.filter(t=>t.serie_id&&t.data===t.data_ancora&&!t.excluida&&t.repeticao!=='nenhuma');
 const known=new Set(items.filter(t=>t.serie_id).map(t=>t.serie_id+'|'+t.data));
 const inserts=[];
 for(const parent of recurring){
  let first=from>parent.data?from:parent.data;
  // Dates before a series starts never receive occurrences.
  for(let d=first;d<=to;d=plus(d,1)){
   if(!intervalApplies(parent.data,d,parent.repeticao))continue;
   const key=parent.serie_id+'|'+d;
   if(known.has(key))continue;
   known.add(key);
   let deadline=parent.prazo_data?plus(d,Math.round((parseDate(parent.prazo_data)-parseDate(parent.data))/86400000)):null;
   inserts.push({user_id:user.id,titulo:parent.titulo,descricao:parent.descricao||'',data:d,horario:parent.horario,categoria_id:parent.categoria_id,repeticao:parent.repeticao,serie_id:parent.serie_id,data_ancora:parent.data_ancora,prazo_data:deadline,prazo_horario:parent.prazo_horario});
   if(inserts.length>=1500)break;
  }
 }
 if(!inserts.length)return;
 try{
   // Índice único impede ocorrências duplicadas mesmo com dois dispositivos.
   for(let k=0;k<inserts.length;k+=250)await run(sb.from('agenda_tarefas').upsert(inserts.slice(k,k+250),{onConflict:'user_id,serie_id,data',ignoreDuplicates:true}));
   const start=from,end=to;
   const fresh=await run(sb.from('agenda_tarefas').select('*').eq('user_id',user.id).gte('data',start).lte('data',end));
   const map=new Map(items.map(t=>[t.id,t]));fresh.forEach(t=>map.set(t.id,t));items=[...map.values()];
 }catch(e){console.warn('Não foi possível gerar algumas repetições:',e);toast('Falha ao sincronizar repetições',true)}
}
async function reload(){if(!user)return;const seq=++loadSeq;const [t,c]=await Promise.all([run(sb.from('agenda_tarefas').select('*').eq('user_id',user.id).order('data',{ascending:true})),run(sb.from('agenda_categorias').select('*').eq('user_id',user.id).order('nome'))]);if(seq!==loadSeq)return;items=t||[];cats=c||[]}
function statCard(title,val,green=false){return '<div class="panel stat"><small>'+title+'</small><strong class="number '+(green?'green':'')+'">'+val+'</strong></div>'}
async function reports(){
 const [start,end]=reportBounds();await ensureRange(start,end);const arr=relevant(start,end),s=stats(arr);
 let d=parseDate(rdate),title=rtype==='weekly'?'Semana de '+datefmt(start,{day:'2-digit',month:'2-digit'})+' a '+datefmt(end):months[d.getMonth()]+' de '+d.getFullYear();
 screen.innerHTML='<section><div class="section-head"><div><small class="eyebrow">RELATÓRIOS</small><h1 class="page-title">'+esc(title)+'</h1></div><div class="report-switch"><div class="seg"><button class="'+(rtype==='monthly'?'active':'')+'" data-report-type="monthly">Mensal</button><button class="'+(rtype==='weekly'?'active':'')+'" data-report-type="weekly">Semanal</button></div>'+(rtype==='monthly'?'<select id="report-month" aria-label="Mês">'+months.map((m,i)=>'<option value="'+i+'" '+(d.getMonth()===i?'selected':'')+'>'+m+'</option>').join('')+'</select><select id="report-year" aria-label="Ano">'+Array.from({length:11},(_,i)=>d.getFullYear()-5+i).map(y=>'<option '+(y===d.getFullYear()?'selected':'')+'>'+y+'</option>').join('')+'</select>':'<button class="outline" id="week-back">‹</button><input class="report-date" id="week-date" type="date" value="'+rdate+'"><button class="outline" id="week-forward">›</button><button class="text-link" id="current-week">Semana atual</button>')+'</div></div>'+
 '<div class="stats-grid">'+statCard('TOTAL DE TAREFAS',s.total)+statCard('CONCLUÍDAS',s.done,true)+statCard('PENDENTES',s.pending)+statCard('CONCLUSÃO',s.pc+'%')+'</div>'+
 '<section class="panel"><div class="card-heading"><h2>Atividades '+(rtype==='weekly'?'da semana':'do mês')+'</h2><div class="report-actions"><button class="outline" id="export-word">♧ &nbsp;Baixar Word (.docx)</button><button class="outline" id="export-excel">▤ &nbsp;Baixar Excel (.xlsx)</button></div></div><div class="table-scroll">'+(arr.length?'<table><thead><tr><th>DATA</th><th>TÍTULO</th><th>DESCRIÇÃO</th><th>CATEGORIA</th><th>STATUS</th><th>CONCLUÍDA EM</th></tr></thead><tbody>'+arr.map(t=>'<tr><td>'+datefmt(t.data)+'</td><td class="title-cell">'+esc(t.titulo)+'</td><td><div class="task-desc">'+esc(t.descricao||'—')+'</div></td><td>'+(catName(t.categoria_id)?'<span class="task-badge">'+esc(catName(t.categoria_id))+'</span>':'—')+'</td><td class="'+(t.concluida_em?'status-dot':'status-pending')+'">'+(t.concluida_em?'● Concluída':'○ Pendente')+'</td><td>'+dateTime(t.concluida_em)+'</td></tr>').join('')+'</tbody></table>':'<p class="message">Nenhuma atividade encontrada neste período.</p>')+'</div></section></section>';
 ehandler(screen,'[data-report-type]','click',async e=>{rtype=e.currentTarget.dataset.reportType;await reports()});
 const changeMonth=async()=>{const m=Number(document.getElementById('report-month').value),y=Number(document.getElementById('report-year').value);rdate=iso(new Date(y,m,Math.min(d.getDate(),28)));await reports()};
 document.getElementById('report-month')?.addEventListener('change',changeMonth);
 document.getElementById('report-year')?.addEventListener('change',changeMonth);
 document.getElementById('week-date')?.addEventListener('change',async e=>{rdate=e.target.value;await reports()});
 document.getElementById('week-back')?.addEventListener('click',async()=>{rdate=plus(rdate,-7);await reports()});
 document.getElementById('week-forward')?.addEventListener('click',async()=>{rdate=plus(rdate,7);await reports()});
 document.getElementById('current-week')?.addEventListener('click',async()=>{rdate=today();await reports()});
 document.getElementById('export-word').onclick=()=>exportWord(arr,title,s);
 document.getElementById('export-excel').onclick=()=>exportExcel(arr,title,s);
}
function exportRows(arr){return arr.map(t=>({Data:datefmt(t.data),Título:t.titulo,Descrição:t.descricao||'',Categoria:catName(t.categoria_id),Status:t.concluida_em?'Concluída':'Pendente','Concluída em':dateTime(t.concluida_em)}))}
function exportExcel(arr,title,s){
 if(!window.XLSX){toast('Biblioteca Excel indisponível. Verifique sua conexão.',true);return}
 let wb=XLSX.utils.book_new(),ws=XLSX.utils.json_to_sheet(exportRows(arr));
 if(!arr.length)ws=XLSX.utils.aoa_to_sheet([['Sem atividades neste período']]);
 ws['!cols']=[{wch:14},{wch:48},{wch:56},{wch:26},{wch:16},{wch:26}];
 XLSX.utils.book_append_sheet(wb,ws,'Atividades');
 let summary=XLSX.utils.aoa_to_sheet([['Relatório',title],['Total',s.total],['Concluídas',s.done],['Pendentes',s.pending],['Conclusão',s.pc+'%']]);
 XLSX.utils.book_append_sheet(wb,summary,'Resumo');
 XLSX.writeFile(wb,'minhas-tarefas-'+rdate+'.xlsx');
}
const xml=s=>String(s??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
async function exportWord(arr,title,s){
 if(!window.JSZip){toast('Biblioteca Word indisponível. Verifique sua conexão.',true);return}
 // DOCX real (Office Open XML), não um arquivo HTML renomeado.
 const rows=[['DATA','TÍTULO','DESCRIÇÃO','CATEGORIA','STATUS','CONCLUÍDA EM'],...exportRows(arr).map(o=>Object.values(o))];
 const p=t=>'<w:p><w:r><w:t xml:space="preserve">'+xml(t)+'</w:t></w:r></w:p>';
 const table='<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr>'+rows.map((cells,i)=>'<w:tr>'+cells.map(v=>'<w:tc><w:tcPr><w:tcW w:w="1700" w:type="dxa"/></w:tcPr>'+p(v)+'</w:tc>').join('')+'</w:tr>').join('')+'</w:tbl>';
 const documentXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+p('Minhas Tarefas — '+title)+p('Total: '+s.total+'   Concluídas: '+s.done+'   Pendentes: '+s.pending+'   Conclusão: '+s.pc+'%')+table+'<w:sectPr/></w:body></w:document>';
 const z=new JSZip();z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
 z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 z.file('word/document.xml',documentXml);
 try{const blob=await z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});const a=document.createElement('a');const u=URLObject(blob);a.href=u;a.download='minhas-tarefas-'+rdate+'.docx';a.click();setTimeout(()=>window.URL.revokeObjectURL(u),5000)}
 catch(e){toast('Erro ao gerar Word: '+errorMessage(e),true)}
}
function URLObject(b){return window.URL.createObjectURL(b)}
const palettes=[
 ['emerald','Esmeralda','Papel quente com verde profundo — o padrão do site.',['#fff','#11624b','#c9ea77']],
 ['ocean','Oceano','Azuis calmos com destaque em turquesa.',['#eefbff','#246b9a','#88d2e5']],
 ['amethyst','Ametista','Roxos suaves com toque de magenta.',['#fff','#4d246d','#df9ce8']],
 ['terracotta','Terracota','Tons de barro e âmbar, quentes e terrosos.',['#fff','#9f4e2d','#edc68b']],
 ['graphite','Grafite','Neutro e discreto, com cinzas frios.',['#fff','#515c71','#bbc3d0']]
];
function settings(){
 screen.innerHTML='<section><small class="eyebrow">CONFIGURAÇÕES</small><h1 class="page-title">Aparência do site</h1><p class="muted">Escolha entre o modo claro ou escuro e a paleta de cores usada em todas as páginas. A preferência fica salva neste navegador.</p><section class="panel settings-panel"><h2>Modo</h2><p>Define o brilho geral das superfícies.</p><div class="settings-mode"><button class="outline '+(mode==='light'?'active':'')+'" data-mode-set="light">☼ Claro</button><button class="outline '+(mode==='dark'?'active':'')+'" data-mode-set="dark">☾ Escuro</button></div></section><section class="panel settings-panel"><div class="section-head"><h2>Cores do site</h2><button id="reset-palette" class="text-link">↻ Restaurar padrão</button></div><p>Trocar a paleta aplica as cores na hora, em todas as telas.</p><div class="palette-grid">'+palettes.map(([id,name,desc,colors])=>'<button data-palette-set="'+id+'" class="palette-card '+(palette===id?'active':'')+'"><span class="dots">'+colors.map(c=>'<i style="background:'+c+'"></i>').join('')+'</span><b>'+name+(palette===id?' ✓':'')+'</b><small>'+desc+'</small></button>').join('')+'</div></section></section>';
 ehandler(screen,'[data-mode-set]','click',e=>{mode=e.currentTarget.dataset.modeSet;document.body.dataset.mode=mode;localStorage.setItem('mt-mode',mode);settings()});
 ehandler(screen,'[data-palette-set]','click',e=>{palette=e.currentTarget.dataset.paletteSet;document.body.dataset.palette=palette;localStorage.setItem('mt-palette',palette);settings()});
 document.getElementById('reset-palette').onclick=()=>{palette='emerald';localStorage.setItem('mt-palette',palette);document.body.dataset.palette=palette;settings()};
}
function guest(){
 nav.hidden=true;logout.hidden=true;footer.hidden=true;label.textContent='';
 screen.innerHTML='<section class="welcome"><div><small class="eyebrow">AGENDA DIÁRIA</small><h1>Um dia por vez,<br><span>tudo no lugar.</span></h1><p>Registre as tarefas do dia, marque o que já foi feito e acompanhe o seu mês em relatórios prontos para baixar em Word ou Excel.</p><hr class="separator"><p class="feature">• &nbsp;Tarefas organizadas por dia, com horário e categoria</p><p class="feature">• &nbsp;Conclusão registrada com data e hora</p><p class="feature">• &nbsp;Relatório mensal com exportação em .docx e .xlsx</p></div><div class="panel login-card"><h2>Entrar na sua conta</h2><p>Acesse com seu e-mail e senha para abrir sua agenda. Se ainda não tem conta, crie uma em poucos segundos.</p><button class="primary full" id="show-login">▦ &nbsp;Entrar ou criar conta</button><button class="text-link" id="show-reset">Esqueci minha senha</button><p class="muted small">O login, o cadastro e a recuperação de senha são realizados pelo Supabase Auth. Sua sessão permanece ativa neste navegador.</p></div></section>';
 document.getElementById('show-login').onclick=()=>authDialog('login');document.getElementById('show-reset').onclick=()=>authDialog('reset');
}
function authDialog(type='login'){
 const titles={login:'Entrar na sua conta',signup:'Criar conta',reset:'Recuperar senha',password:'Definir nova senha'};
 const body='<p>'+(type==='signup'?'Cadastre-se com seu e-mail e senha.':type==='reset'?'Enviaremos um link de recuperação para o seu e-mail.':'Informe seus dados de acesso.')+'</p><form id="auth-form">'+(type==='password'?'':field('email','E-mail','email','','autocomplete="email" required'))+(type==='reset'?'':field('password',type==='password'?'Nova senha':'Senha','password','','minlength="8" autocomplete="'+(type==='login'?'current-password':'new-password')+'" required'))+'<p role="alert" id="auth-error" class="error"></p><div class="dialog-actions"><button class="outline" type="button" data-close2>Cancelar</button><button data-loading class="primary" type="submit">'+({login:'Entrar',signup:'Cadastrar',reset:'Enviar link',password:'Atualizar senha'})[type]+'</button></div></form>'+(type==='login'?'<button class="text-link" id="switch-signup">Criar nova conta</button><button class="text-link" id="switch-reset">Esqueci minha senha</button>':type==='signup'?'<button class="text-link" id="switch-login">Já tenho conta</button>':'');
 modal(titles[type],body);bindCancel();
 root.querySelector('#switch-signup')?.addEventListener('click',()=>authDialog('signup'));
 root.querySelector('#switch-reset')?.addEventListener('click',()=>authDialog('reset'));
 root.querySelector('#switch-login')?.addEventListener('click',()=>authDialog('login'));
 root.querySelector('#auth-form').onsubmit=async e=>{
 e.preventDefault();if(busy)return;const fd=new FormData(e.currentTarget),email=String(fd.get('email')||'').trim(),password=String(fd.get('password')||'');
 try{setBusy(true);
   if(type==='login')await run(sb.auth.signInWithPassword({email,password}));
   if(type==='signup'){const result=await run(sb.auth.signUp({email,password}));toast(result.session?'Conta criada!':'Confira seu e-mail para confirmar a conta.')}
   if(type==='reset'){await run(sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname}));toast('Confira seu e-mail para recuperar o acesso.')}
   if(type==='password'){await run(sb.auth.updateUser({password}));toast('Senha atualizada!')}
   close();
 }catch(err){root.querySelector('#auth-error').textContent=errorMessage(err)}finally{setBusy(false)}
 };
}
async function render(){
 if(!user){guest();return}
 nav.hidden=false;logout.hidden=false;footer.hidden=false;label.textContent=(user.email||'').split('@')[0];
 document.querySelectorAll('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===view));
 try{
 if(view==='today'){await ensureRange(day,day);dashboard()}
 if(view==='reports')await reports();
 if(view==='settings')settings();
 }catch(e){screen.innerHTML='<div class="panel"><h2>Não foi possível carregar a agenda.</h2><p class="error">'+esc(errorMessage(e))+'</p><button class="outline" id="retry">Tentar novamente</button></div>';document.getElementById('retry').onclick=()=>render()}
}
async function start(){
 if(!sb){toast('Falha ao carregar autenticação. Atualize a página.',true);guest();return}
 sb.auth.onAuthStateChange((event,session)=>{
  if(event==='PASSWORD_RECOVERY'){authDialog('password');return}
  const uid=session?.user?.id||null;
  if(uid!==user?.id){user=session?.user||null;items=[];cats=[];if(user){saving('Sincronizando…');reload().then(()=>{saving('Tudo salvo na sua conta');render()}).catch(e=>{saving('Erro de conexão');toast(errorMessage(e),true)})}else guest()}
 });
 const {data,error}=await sb.auth.getSession();
 if(error){toast(errorMessage(error),true);guest();return}
 if(data.session?.user){user=data.session.user;await reload();saving('Tudo salvo na sua conta')}
 await render();
}
document.querySelectorAll('[data-nav]').forEach(btn=>btn.addEventListener('click',async e=>{e.preventDefault();if(!user)return;view=btn.dataset.nav;await render()}));
document.getElementById('theme-toggle').onclick=()=>{mode=mode==='dark'?'light':'dark';localStorage.setItem('mt-mode',mode);document.body.dataset.mode=mode;if(view==='settings')settings()};
logout.onclick=async()=>{try{await run(sb.auth.signOut());user=null;guest()}catch(e){toast(errorMessage(e),true)}};
window.addEventListener('visibilitychange',()=>{if(!document.hidden&&user){reload().then(()=>render()).catch(console.warn)}});
start().catch(e=>{toast(errorMessage(e),true);guest()});
})();