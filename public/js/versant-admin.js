const token = localStorage.getItem('adminToken');
if (!token) location.href = '/admin-login';

const $ = id => document.getElementById(id);
const api = async (url, options={}) => {
  options.headers = {...(options.headers||{}), Authorization:`Bearer ${token}`};
  const r = await fetch(url, options);
  const data = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(data.message || `Request failed (${r.status})`);
  return data;
};
let selectedTest = null;

$('createTestForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await api('/api/versant/admin/tests', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        title:$('title').value,
        description:$('description').value,
        durationSeconds:Number($('duration').value),
        passScore:Number($('passScore').value),
        cefrPassLevel:$('cefr').value
      })
    });
    e.target.reset();
    await loadTests();
    alert('Test created. Add questions and publish it when ready.');
  } catch(e){ alert(e.message); }
});

async function loadTests(){
  try {
    const tests=await api('/api/versant/admin/tests');
    $('tests').innerHTML=tests.map(t=>`
      <div class="row">
        <div>
          <b>${esc(t.title)}</b>
          <small>${esc(t.status)} · ${t.question_count} questions · ${t.attempt_count} student attempts</small>
        </div>
        <div class="row-actions"><button onclick="openTest(${t.id})">Manage</button><button class="danger-btn" onclick="deleteTest(${t.id})">Delete</button></div>
      </div>`).join('') || '<p>No tests yet.</p>';
  } catch(e){ $('tests').textContent=e.message; }
}

window.openTest=async id=>{
  try{
    selectedTest=await api('/api/versant/admin/tests/'+id);
    $('editor').classList.remove('hidden');
    $('editorTitle').textContent=selectedTest.title;
    $('sectionId').innerHTML=selectedTest.sections.map(s=>`<option value="${s.id}">${esc(s.display_name)}</option>`).join('');
    renderQuestions();
    await loadAttempts();
  }catch(e){alert(e.message);}
};

function renderQuestions(){
  $('questions').innerHTML=selectedTest.sections.map(s=>`<h3>${esc(s.display_name)}</h3>`+
    s.questions.map(q=>`<div class="question"><b>#${q.question_order}</b> ${esc(q.question_text)}<small>${q.response_seconds}s · ${q.prompt_audio_url?'<a href="'+q.prompt_audio_url+'" target="_blank">audio</a>':''}</small></div>`).join('')
  ).join('');
}

$('questionForm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(!selectedTest)return;
  const f=new FormData();
  f.append('sectionId',$('sectionId').value);
  f.append('questionText',$('questionText').value);
  f.append('expectedText',$('expectedText').value);
  f.append('acceptedAnswers',$('acceptedAnswers').value);
  f.append('responseSeconds',$('responseSeconds').value);
  f.append('silenceSeconds',$('silenceSeconds').value);
  f.append('questionOrder',$('questionOrder').value);
  f.append('points',$('points').value);
  if($('promptAudio').files[0])f.append('promptAudio',$('promptAudio').files[0]);
  try{
    await api('/api/versant/admin/tests/'+selectedTest.id+'/questions',{method:'POST',body:f});
    selectedTest=await api('/api/versant/admin/tests/'+selectedTest.id);
    renderQuestions();
    e.target.reset();
  }catch(e){alert(e.message);}
});

window.closeEditor=()=>{
  selectedTest=null;
  $('editor').classList.add('hidden');
  $('editorTitle').textContent='Test';
  $('questions').innerHTML='';
  $('attempts').innerHTML='';
};

window.deleteTest=async(id)=>{
  const name='this test';
  const confirmed=confirm(`Delete \"${name}\"?\n\nThis permanently removes the test, its questions, student attempts, responses, results, and uploaded test audio. This cannot be undone.`);
  if(!confirmed)return;

  try{
    await api('/api/versant/admin/tests/'+id,{method:'DELETE'});
    if(selectedTest && Number(selectedTest.id)===Number(id)) closeEditor();
    await loadTests();
    alert('Test deleted successfully.');
  }catch(e){
    alert('Could not delete test: '+e.message);
  }
};

$('publishBtn').onclick=async()=>{
  if(!selectedTest)return alert('Please select a test first.');
  if(!confirm('Publish this test? Every student will be able to take it.'))return;
  try{
    await api('/api/versant/admin/tests/'+selectedTest.id+'/status',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({status:'published'})
    });
    selectedTest=await api('/api/versant/admin/tests/'+selectedTest.id);
    alert('Published. The test is now available to every student.');
    await loadTests();
  }catch(e){alert(e.message)}
};

$('refreshAttemptsBtn').onclick=()=>loadAttempts();

async function loadAttempts(){
  if(!selectedTest)return;
  const rows=await api('/api/versant/admin/tests/'+selectedTest.id+'/assignments');
  $('attempts').innerHTML=`<h3>Student Attempts</h3>`+
    `<p>Students are added here automatically when they start the published test.</p>`+
    rows.map(a=>`
      <div class="row">
        <div>
          <b>${esc(a.fullName||('Student '+a.student_id))}</b>
          <small>${esc(a.status)} · Started: ${a.started_at ? esc(a.started_at) : 'Not started'}</small>
        </div>
        <div>
          ${a.overall_score!=null?`Score: ${Number(a.overall_score).toFixed(1)} (${esc(a.cefr_level)})`:''}
          ${a.status==='submitted'?`<button onclick="viewResult(${a.id})">Result</button>`:''}
        </div>
      </div>`).join('') || '<p>No students have started this test yet.</p>';
}

window.viewResult=async id=>{
  try{
    const d=await api('/api/versant/admin/assignments/'+id+'/result');
    alert(`Score: ${d.result.overall_score}\nCEFR: ${d.result.cefr_level}\nFluency: ${d.result.fluency_score}\nPronunciation: ${d.result.pronunciation_score}\nGrammar: ${d.result.grammar_score}\nVocabulary: ${d.result.vocabulary_score}\nCoherence: ${d.result.coherence_score}`);
  }catch(e){alert(e.message)}
};

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
loadTests();
