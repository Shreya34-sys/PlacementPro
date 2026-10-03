const token=localStorage.getItem('token'), id=new URLSearchParams(location.search).get('assignment');
const $=x=>document.getElementById(x);
if(!token||!id)location.href='/';
(async()=>{
 const r=await fetch('/api/versant/student/assignments/'+id+'/result',{headers:{Authorization:'Bearer '+token}});
 const d=await r.json(); if(!r.ok){$('status').textContent=d.message||'Result unavailable.';return}
 $('score').textContent=Number(d.overall_score).toFixed(1)+'/100';
 $('cefr').textContent=`CEFR ${d.cefr_level} · ${d.passed?'PASS':'NOT PASSED'}`;
 const items=[['Fluency',d.fluency_score],['Pronunciation',d.pronunciation_score],['Grammar',d.grammar_score],['Vocabulary',d.vocabulary_score],['Sentence Mastery',d.sentence_mastery_score],['Coherence',d.coherence_score],['Speaking Rate',d.wpm+' WPM'],['Hesitations',d.hesitation_count]];
 $('metrics').innerHTML=items.map(([a,b])=>`<div><b>${a}</b><strong>${typeof b==='number'?Number(b).toFixed(1):b}</strong></div>`).join('');
})();
