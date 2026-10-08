const token=localStorage.getItem('adminToken');if(!token)location.replace('/admin-login');const roundId=new URLSearchParams(location.search).get('round');const socket=io('/coding',{auth:{token}});socket.emit('join-round',roundId);let latest={attempts:[],flags:[]};
async function refresh(){const r=await fetch(`/api/coding/admin/rounds/${roundId}/monitor`,{headers:{Authorization:`Bearer ${token}`}});if(!r.ok)return;latest=await r.json();render()}
function render(){
  const a=latest.attempts;
  const f=latest.flags;

  document.querySelector('#stats').innerHTML=[
    ['Candidates',a.length],
    ['Active',a.filter(x=>x.state==='started').length],
    ['Warnings',a.reduce((n,x)=>n+Number(x.warnings_count||0),0)],
    ['Submitted',a.filter(x=>x.state!=='started').length]
  ].map(x=>`<div class="stat"><small>${x[0]}</small><h2>${x[1]}</h2></div>`).join('');

  // Preserve active WebRTC streams while refreshing database data.
  const oldStreams={};
  document.querySelectorAll('.candidate-video').forEach(v=>{
    const id=v.id.replace('video-','');
    if(v.srcObject) oldStreams[id]=v.srcObject;
  });

  const root=document.querySelector('#attempts');
  const existingIds=[...root.querySelectorAll('.candidate')].map(x=>x.dataset.attempt).sort().join(',');
  const nextIds=a.map(x=>String(x.attempt_id)).sort().join(',');

  if(existingIds!==nextIds){
    root.innerHTML=a.length?a.map(x=>`
      <article class="candidate" data-attempt="${esc(x.attempt_id)}">
        <b>${esc(x.fullName)}</b>
        <div class="meta" id="meta-${esc(x.attempt_id)}"></div>
        <video class="candidate-video" id="video-${esc(x.attempt_id)}" autoplay playsinline muted></video>
        <pre class="code" id="code-${esc(x.attempt_id)}">Waiting for live code…</pre>
        <button class="ghost monitor-btn" data-attempt="${esc(x.attempt_id)}">Request camera/screen</button>
      </article>`).join(''):'<div class="panel">No candidates have started this round.</div>';

    Object.entries(oldStreams).forEach(([id,stream])=>{
      const v=document.getElementById(`video-${id}`);
      if(v) v.srcObject=stream;
    });

    document.querySelectorAll('.monitor-btn').forEach(b=>{
      b.onclick=()=>socket.emit('monitor-attempt',b.dataset.attempt);
    });
  }

  a.forEach(x=>{
    const meta=document.getElementById(`meta-${x.attempt_id}`);
    if(meta){
      meta.innerHTML=`${esc(x.email)}<br>
        State: ${esc(x.state)} · Score: ${x.final_score==null?'—':Number(x.final_score).toFixed(2)+'%'}<br>
        Warnings: ${Number(x.warnings_count||0)}`;
    }
  });

  document.querySelector('#flags').innerHTML=f.length
    ?f.map(x=>`<div class="flag">
        <b>${esc(x.fullName)} · ${esc(x.event_type)}</b><br>
        ${esc(x.message)}<br>
        <button class="ghost" data-flag="${esc(x.id)}">Resolve warning</button>
      </div>`).join('')
    :'<p>No open flags.</p>';

  document.querySelectorAll('[data-flag]').forEach(b=>{
    b.onclick=async()=>{
      const r=await fetch(`/api/coding/admin/flags/${b.dataset.flag}/resolve`,{
        method:'PATCH',
        headers:{Authorization:`Bearer ${token}`}
      });
      if(r.ok) refresh();
    };
  });
}
socket.on('coding:code-update',d=>{const el=document.getElementById(`code-${d.attemptId}`);if(el)el.textContent=d.sourceCode});socket.on('coding:flag',refresh);socket.on('coding:warning-resolved',refresh);socket.on('coding:submission',refresh);const peers={};
socket.on('webrtc:offer',async d=>{const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});peers[d.attemptId]=pc;pc.ontrack=e=>{const v=document.getElementById(`video-${d.attemptId}`);if(v&&e.streams[0])v.srcObject=e.streams[0]};pc.onicecandidate=e=>{if(e.candidate)socket.emit('webrtc:ice',{attemptId:d.attemptId,candidate:e.candidate,target:'student'})};await pc.setRemoteDescription(d.offer);const answer=await pc.createAnswer();await pc.setLocalDescription(answer);socket.emit('webrtc:answer',{attemptId:d.attemptId,answer})});
socket.on('webrtc:ice',async d=>{try{await peers[d.attemptId]?.addIceCandidate(d.candidate)}catch{}});
setInterval(refresh,5000);refresh();
function esc(v){const d=document.createElement('div');d.textContent=v??'';return d.innerHTML}
