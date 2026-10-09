/* Extracted from the original Brain Hill HTML. */

const KEY='school_register_7am_820am_v4';
const PERIODS=6;
let db=JSON.parse(localStorage.getItem(KEY)||'null')||{
 students:[],teachers:[],days:{}
};
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function today(){
 const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
 return `${y}-${m}-${day}`;
}
function ensureDay(d){
 if(!db.days[d]) db.days[d]={clockins:{},closed:false,periods:{},movements:[]};
 if(!Array.isArray(db.days[d].movements)) db.days[d].movements=[];
 db.days[d].movements.forEach(m=>{ if(m.year==null && m.class!=null) m.year=m.class; if(m.year==null && m.cl!=null) m.year=m.cl; if(m.periodLabel==null && m.immediatePeriod!=null) m.periodLabel=m.immediatePeriod; if(m.immediatePeriod==null && m.periodLabel!=null) m.immediatePeriod=m.periodLabel; });
 db.students.forEach(st=>{ if(st.year==null && st.cl!=null) st.year=st.cl; });
db.teachers.forEach(t=>{ if(t.year==null && t.cl!=null) t.year=t.cl; });
 return db.days[d]
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function getStudentYear(s){return String(s?.year??s?.cl??'').trim();}
function getTeacherYear(t){return String(t?.year??t?.cl??'').trim();}
function timeText(d){return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}
function minutesNow(){
 const d=new Date(); return d.getHours()*60+d.getMinutes()+d.getSeconds()/60;
}
function tutorWindowStatus(){
 const m=minutesNow();
 if(m<420) return ['NOT_STARTED','Tutor Hour has not started. Clock-in opens at 7:00 AM.','warn'];
 if(m<=500) return ['OPEN','Tutor Hour is open until 8:20 AM.','present'];
 return ['ENDED','Tutor Hour ended at 8:20 AM.','absent'];
}
function studentById(id){return db.students.find(s=>s.id.toLowerCase()===id.toLowerCase())}
function renderClock(){
 const d=document.getElementById('clockDate').value||today(), day=ensureDay(d);
 document.getElementById('now').textContent=timeText(new Date());
 const [st,msg,cls]=tutorWindowStatus();
 const card=document.getElementById('tutorStatusCard'), icon=document.getElementById('tutorStatusIcon');
 const title=document.getElementById('tutorStatusTitle'), textEl=document.getElementById('tutorStatusText');
 title.textContent=st==='OPEN'?'Tutor Hour is OPEN':st==='ENDED'?'Tutor Hour has ENDED':'Tutor Hour has NOT STARTED';
 textEl.textContent=msg;
 card.classList.remove('status-open','status-ended','status-notstarted');
 card.classList.add(st==='OPEN'?'status-open':st==='ENDED'?'status-ended':'status-notstarted');
 icon.textContent=st==='OPEN'?'✓':st==='ENDED'?'⚠':'◷';
 icon.className='status-icon '+(st==='OPEN'?'open':st==='ENDED'?'ended':'notstarted');
 const total=db.students.length, present=Object.keys(day.clockins).length;
 let later=0;
 for(const s of db.students){
   const p=day.periods[s.cl]||{};
   if(!day.clockins[s.id] && Object.values(p).some(v=>v===true)) later++;
 }
 document.getElementById('tTotal').textContent=total;
 document.getElementById('tPresent').textContent=present;
 document.getElementById('tAbsent').textContent=Math.max(0,total-present);
 document.getElementById('tMissedLater').textContent=later;
 const q=(document.getElementById('tutorSearch')?.value||'').trim().toLowerCase();
 const filtered=db.students.filter(s=>{const y=getStudentYear(s);return (s.name+' '+s.id+' '+y).toLowerCase().includes(q);});
 const count=document.getElementById('registerCount'); if(count)count.textContent=filtered.length+' / '+total;
 let h='<div class="tutor-register-scroll"><table class="tutor-register-table"><thead><tr><th>#</th><th>Student ID</th><th>Student Name</th><th>Year</th><th>Tutor Hour Status</th><th>Clock-In Time</th></tr></thead><tbody>';
 filtered.forEach((s,i)=>{
   const t=day.clockins[s.id];
   const studentYear=getStudentYear(s);
   h+=`<tr><td>${i+1}</td><td class="id-cell">${esc(s.id)}</td><td class="student-name-cell">${esc(s.name)}${studentYear?` <span class="student-name-year">(${esc(studentYear)})</span>`:''}</td><td class="class-cell">${esc(studentYear)}</td><td>${t?'<span class="tutor-status-pill present"><span class="dot"></span>PRESENT</span>':'<span class="tutor-status-pill absent"><span class="dot"></span>ABSENT</span>'}</td><td>${t?'<strong>'+esc(t)+'</strong>':'<span class="muted">—</span>'}</td></tr>`;
 });
 if(!filtered.length)h+='<tr><td colspan="6" style="text-align:center;padding:24px;color:#667085">No students match the search.</td></tr>';
 h+='</tbody></table></div>';
 document.getElementById('studentClockTable').innerHTML=h;
}
function updateClockStudentPreview(){
 const el=document.getElementById('studentIdClock'), preview=document.getElementById('clockStudentPreview');
 const id=el.value.trim(); preview.className='student-preview';
 if(!id){preview.textContent='Enter a Student ID to identify the student.';return}
 const s=studentById(id);
 if(!s){preview.textContent='Student ID not found in the registered student list.';preview.classList.add('error');return}
 const d=document.getElementById('clockDate').value||today(), day=ensureDay(d);
 if(day.clockins[s.id]){preview.textContent=`${s.name} • ${s.cl} • Already clocked in at ${day.clockins[s.id]}`;preview.classList.add('found');return}
 preview.textContent=`${s.name} • ${s.cl} • Ready to clock in`;
 preview.classList.add('found');
}

function clockIn(){
 const id=document.getElementById('studentIdClock').value.trim();
 const d=document.getElementById('clockDate').value||today(), day=ensureDay(d);
 const msg=document.getElementById('clockMsg');
 if(!id){msg.textContent='Enter the Student ID.';msg.className='clock-message error';return}
 const s=studentById(id);
 if(!s){msg.textContent='Student ID not found in the registered student list.';msg.className='clock-message error';return}
 if(d!==today()){msg.textContent='Tutor Hour clock-in can only be recorded using the current device date.';msg.className='clock-message error';return}
 if(day.closed){msg.textContent='Tutor Hour has been finalized for today.';msg.className='clock-message error';return}
 const m=minutesNow();
 if(m<420){msg.textContent='Tutor Hour has not started. Clock-in opens at 7:00 AM.';msg.className='clock-message error';return}
 if(m>500){day.closed=true;save();msg.textContent='Tutor Hour has ended. Clock-in closed at 8:20 AM.';msg.className='clock-message error';renderClock();return}
 if(day.clockins[s.id]){msg.textContent='This student has already clocked into Tutor Hour.';msg.className='clock-message error';return}
 day.clockins[s.id]=timeText(new Date());
 save();msg.textContent='✓ '+s.name+' clocked in successfully at '+day.clockins[s.id]+'.';msg.className='clock-message success';
 document.getElementById('studentIdClock').value='';updateClockStudentPreview();renderClock();
}
function finalizeTutor(){
 const d=document.getElementById('clockDate').value||today(),day=ensureDay(d);
 if(d===today() && minutesNow()<500){
   document.getElementById('clockMsg').textContent='Tutor Hour cannot be finalized before 8:20 AM.';
   return;
 }
 day.closed=true;save();renderClock();
 document.getElementById('clockMsg').textContent='Tutor Hour finalized. Students without a clock-in are absent.';
}
function renderStudents(){
 let h='<table><thead><tr><th>ID</th><th>Name</th><th>Year</th><th>Action</th></tr></thead><tbody>';
 for(const s of db.students) h+=`<tr><td>${esc(s.id)}</td><td>${esc(s.name)}</td><td>${esc(getStudentYear(s))}</td><td><button type=\"button\" class=\"btn btn-danger row-delete-btn delete-student\" data-id=\"${esc(s.id)}\">🗑 Delete</button></td></tr>`;
 if(!db.students.length) h+='<tr><td colspan=\"4\" style=\"text-align:center;color:#667085;padding:20px\">No students registered.</td></tr>';
 h+='</tbody></table>';document.getElementById('studentList').innerHTML=h;
 document.querySelectorAll('.delete-student').forEach(btn=>btn.addEventListener('click',()=>deleteStudent(btn.dataset.id)));
 updateClassOptions();
 updateMovementClassOptions();
}
function deleteStudent(id){
 const s=studentById(id);
 if(!s)return;
 if(!confirm(`Delete student \"${s.name}\" (${s.id}) from the register?\n\nThe student will be removed from the current student list. Existing historical attendance records will be retained.`))return;
 db.students=db.students.filter(x=>x.id.toLowerCase()!==String(id).toLowerCase());
 save();renderStudents();renderClock();renderMovements();
}
function addStudent(){
 const id=document.getElementById('sId').value.trim(),name=document.getElementById('sName').value.trim(),cl=document.getElementById('sClass').value.trim();
 if(!id||!name||!cl)return alert('Enter Student ID, name and year.');
 if(studentById(id))return alert('Student ID already exists.');
 db.students.push({id,name,cl,year:cl});save();
 ['sId','sName','sClass'].forEach(x=>document.getElementById(x).value='');renderStudents();renderClock();
}
function renderTeachers(){
 let h='<table><thead><tr><th>ID</th><th>Teacher</th><th>Subject</th><th>Year</th><th>Action</th></tr></thead><tbody>';
 for(const t of db.teachers) h+=`<tr><td>${esc(t.id)}</td><td>${esc(t.name)}</td><td>${esc(t.subject)}</td><td>${esc(getTeacherYear(t))}</td><td><button type=\"button\" class=\"btn btn-danger row-delete-btn delete-teacher\" data-id=\"${esc(t.id)}\">🗑 Delete</button></td></tr>`;
 if(!db.teachers.length) h+='<tr><td colspan=\"5\" style=\"text-align:center;color:#667085;padding:20px\">No teachers registered.</td></tr>';
 h+='</tbody></table>';document.getElementById('teacherList').innerHTML=h;
 document.querySelectorAll('.delete-teacher').forEach(btn=>btn.addEventListener('click',()=>deleteTeacher(btn.dataset.id)));
 updateTeacherOptions();
}
function deleteTeacher(id){
 const t=db.teachers.find(x=>String(x.id).toLowerCase()===String(id).toLowerCase());
 if(!t)return;
 if(!confirm(`Delete teacher \"${t.name}\" (${t.id}) from the teacher register?\n\nExisting attendance records will be retained.`))return;
 db.teachers=db.teachers.filter(x=>String(x.id).toLowerCase()!==String(id).toLowerCase());
 save();renderTeachers();
}
function addTeacher(){
 const id=document.getElementById('teacherId').value.trim(),name=document.getElementById('teacherName').value.trim(),subject=document.getElementById('teacherSubject').value.trim(),cl=document.getElementById('teacherClass').value.trim();
 if(!id||!name||!subject||!cl)return alert('Complete all teacher fields.');
 if(db.teachers.some(t=>t.id.toLowerCase()===id.toLowerCase()))return alert('Teacher ID already exists.');
 db.teachers.push({id,name,subject,cl,year:cl});save();
 ['teacherId','teacherName','teacherSubject','teacherClass'].forEach(x=>document.getElementById(x).value='');renderTeachers();
}
function updateClassOptions(){
 const sel=document.getElementById('periodClass'),old=sel.value;
 const years=[...new Set(db.students.map(getStudentYear).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
 sel.innerHTML='<option value="">Select year</option>'+years.map(y=>`<option value="${esc(y)}">${esc(y)}</option>`).join('');
 if(years.includes(old))sel.value=old;
 updateTeacherOptions();
}
function updateTeacherOptions(){
 const year=document.getElementById('periodClass').value,sel=document.getElementById('periodTeacher'),old=sel.value;
 const ts=db.teachers.filter(t=>!year||getTeacherYear(t)===year);
 sel.innerHTML='<option value="">Select teacher</option>'+ts.map(t=>`<option value="${esc(t.id)}">${esc(t.name)} — ${esc(t.subject)}</option>`).join('');
 if(ts.some(t=>t.id===old))sel.value=old;
}
const PERIOD_SCHEDULE={
  1:[510,565,'8:30 AM – 9:25 AM'],
  2:[565,620,'9:25 AM – 10:20 AM'],
  // Break: 10:20 AM – 10:50 AM
  3:[650,705,'10:50 AM – 11:45 AM'],
  4:[705,755,'11:45 AM – 12:35 PM'],
  // Lunch: 12:35 PM – 1:20 PM
  5:[800,855,'1:20 PM – 2:15 PM'],
  6:[855,900,'2:15 PM – 3:00 PM']
};
function activePeriodNow(){
  const d=new Date(), wd=d.getDay(), m=d.getHours()*60+d.getMinutes()+d.getSeconds()/60;
  if(wd===0||wd===6) return 0;
  for(const p of [1,2,3,4,5,6]){ const [start,end]=PERIOD_SCHEDULE[p]; if(m>=start&&m<end) return p; }
  return 0;
}
function periodEditState(date,p){
  const d=date||today();
  if(d>today()) return {allowed:false,viewOnly:false,reason:'Future dates cannot be recorded yet.'};
  if(d<today()) return {allowed:false,viewOnly:true,reason:`Attendance for ${d} has expired. This year attendance is available for viewing only; editing is locked.`};
  const active=activePeriodNow();
  if(active===p) return {allowed:true,viewOnly:false,reason:`Period ${p} is ACTIVE (${PERIOD_SCHEDULE[p][2]}). Attendance recording is open.`};
  if(active===0) return {allowed:false,viewOnly:true,reason:'No period is currently active. Attendance is available for viewing only until a period opens.'};
  return {allowed:false,viewOnly:true,reason:`Period ${p} is closed/not active. Attendance is available for viewing only.`};
}
function refreshPeriodLockUI(){
  const sel=document.getElementById('periodNo'); if(!sel)return;
  const date=document.getElementById('periodDate')?.value||today();
  const active=(date===today()) ? activePeriodNow() : 0;
  [...sel.options].forEach(o=>{ o.disabled=false; });

  if(date===today() && active>=1 && active<=6){
    sel.value=String(active);
  } else if(!sel.value){
    sel.value='';
  }

  const p=+sel.value, st=periodEditState(date,p), box=document.getElementById('periodWindowStatus');
  if(box){
    box.textContent=st.reason;
    box.style.fontWeight='700';
    box.style.color=st.allowed?'#166534':'#991b1b';
  }

  const load=document.getElementById('loadPeriod');
  if(load) load.disabled = false;
}

function loadPeriod(){
 const date=document.getElementById('periodDate').value||today(), p=+document.getElementById('periodNo').value, cl=document.getElementById('periodClass').value,tid=document.getElementById('periodTeacher').value;
 const state=periodEditState(date,p);
 refreshPeriodLockUI();
 if(!cl){document.getElementById('periodMsg').textContent='Please select a year first.';document.getElementById('periodAttendance').innerHTML='';return;}
 if(!state.allowed && !state.viewOnly){
   document.getElementById('periodMsg').textContent=state.reason;
   document.getElementById('periodAttendance').innerHTML='<div class="daily-note"><strong>Attendance entry is locked.</strong><br>'+esc(state.reason)+'</div>';
   return;
 }

 // Historical/expired attendance is loaded without creating or modifying records.
 const day=db.days[date]||{clockins:{},closed:false,periods:{},movements:[]};
 if(!day.periods) day.periods={};
 const students=db.students.filter(s=>getStudentYear(s)===cl);
 const editable=state.allowed;
 const statusText=editable ? 'ACTIVE • '+PERIOD_SCHEDULE[p][2] : 'EXPIRED / VIEW ONLY • '+PERIOD_SCHEDULE[p][2];
 const statusColor=editable ? '#166534' : '#991b1b';
 let h='<h3>Period '+p+' — '+esc(cl)+' <span style="color:'+statusColor+';font-size:12px">'+esc(statusText)+'</span></h3>';
 if(!editable) h+='<div class="daily-note"><strong>Year attendance loaded for viewing only.</strong><br>'+esc(state.reason)+' Attendance records cannot be changed.</div>';
 h+='<table><thead><tr><th>ID</th><th>Student</th><th>Attendance Status</th></tr></thead><tbody>';
 for(const s of students){
   const rec=day.periods[p] ? day.periods[p][s.id] : undefined;
   const val=rec===true;
   const isAbsent=rec===false;
   const disabled=editable?'':' disabled aria-disabled="true"';
   const selected=val?'present':isAbsent?'absent':'';
   const selectClass=val?'status-present':isAbsent?'status-absent':'status-none';
   h+=`<tr><td>${esc(s.id)}</td><td>${esc(s.name)}</td><td>
   <select class="attendance-status-select ${selectClass}"${disabled} aria-label="Attendance status for ${esc(s.name)}" onchange="setPeriod('${esc(s.id)}',this.value)">
   <option value="" ${selected===''?'selected':''}>Not recorded</option>
   <option value="present" ${selected==='present'?'selected':''}>///</option>
   <option value="absent" ${selected==='absent'?'selected':''}>000</option>
   </select>
   </td></tr>`;
 }
 h+='</tbody></table>';document.getElementById('periodAttendance').innerHTML=h;
 document.getElementById('periodMsg').textContent='Teacher: '+(db.teachers.find(t=>t.id===tid)?.name||'')+' • '+(editable?'Period '+p+' is currently open for editing.':'Expired/closed attendance loaded for viewing only; editing is locked.');
 renderSixPeriodExceptionSummary();
}

function setPeriod(id,val){
 const date=document.getElementById('periodDate').value||today(),p=+document.getElementById('periodNo').value;
 const state=periodEditState(date,p);
 if(!state.allowed){alert('Attendance editing is locked. '+state.reason);refreshPeriodLockUI();return;}
 const day=ensureDay(date);
 if(!day.periods[p])day.periods[p]={};
 if(val==='') delete day.periods[p][id];
 else day.periods[p][id]=(val==='present');
 save();loadPeriod();renderClock();
}
function periodHasExpired(date,p){
 const d=date||today();
 if(d<today()) return true;
 if(d>today()) return false;
 return minutesNow()>=PERIOD_SCHEDULE[p][1];
}
function getPeriodStats(day,p,cl=''){
 const records=day.periods[p]||{};
 const students=cl ? db.students.filter(s=>getStudentYear(s)===cl) : db.students;
 const presentStudents=students.filter(s=>records[s.id]===true);
 const explicitAbsentStudents=students.filter(s=>records[s.id]===false);
 const expired=periodHasExpired(day.__date||today(),p);
 const absentStudents=expired ? students.filter(s=>records[s.id]!==true) : explicitAbsentStudents;
 const tutorAbsentPresent=presentStudents.filter(s=>!day.clockins[s.id]);
 return {presentStudents,absentStudents,tutorAbsentPresent,expired,notRecorded:students.filter(s=>records[s.id]===undefined)};
}
function renderSixPeriodExceptionSummary(){
 const d=document.getElementById('periodDate').value||today(),day=ensureDay(d); Object.defineProperty(day,'__date',{value:d,configurable:true});
 const cl=document.getElementById('periodClass')?.value||'';
 const classLabel=cl?` — ${esc(cl)}`:'';
 let h=`<div class="period-summary-head"><strong>Year Period Performance${classLabel}</strong><span class="muted">${esc(d)}</span></div>`;
 h+='<div class="table-wrap"><table class="professional-period-table"><thead><tr><th>Period</th><th><span class="year-symbol present-symbol" style="padding:4px 8px">Present</span></th><th><span class="year-symbol absent-symbol" style="padding:4px 8px">Absent</span></th><th>Not Recorded</th><th>Period Performance</th><th>Tutor Hour Absent → Period Present</th></tr></thead><tbody>';
 for(let p=1;p<=6;p++){
   const stats=getPeriodStats(day,p,cl);
   const total=cl?db.students.filter(s=>getStudentYear(s)===cl).length:db.students.length;
   const notRecorded=stats.expired ? 0 : stats.notRecorded.length;
   const rate=total?Math.round((stats.presentStudents.length/total)*100):0;
   const rateLabel=total?rate+'%':'—';
   h+=`<tr><td><span class="period-badge">Period ${p}</span></td><td><span class="metric present-metric">${stats.presentStudents.length}</span></td><td><span class="metric absent-metric">${stats.absentStudents.length}</span></td><td><span class="metric neutral-metric">${notRecorded}</span></td><td><div class="performance-cell"><strong>${rateLabel}</strong><div class="performance-bar"><span style="width:${Math.min(100,rate)}%"></span></div></div></td><td><span class="metric warning-metric">${stats.tutorAbsentPresent.length}</span></td></tr>`;
 }
 h+='</tbody></table></div>';

 // Attendance Exceptions — explicitly grouped by Year so the Year is never omitted.
 const years=cl?[cl]:[...new Set(db.students.map(getStudentYear).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
 h+='<div class="period-summary-head" style="margin-top:18px"><strong>Attendance Exceptions by Year</strong><span class="muted">Tutor Hour absent → later Period present</span></div>';
 h+='<div class="table-wrap"><table class="professional-period-table"><thead><tr><th>Year</th><th>Students</th><th>Exceptions</th><th>Exception Rate</th><th>Students Requiring Review</th></tr></thead><tbody>';
 let anyException=false;
 for(const y of years){
   const students=db.students.filter(s=>getStudentYear(s)===y);
   const ids=[];
   for(const s of students){
     let exception=false;
     for(let p=1;p<=6;p++){ const rec=(day.periods[p]||{})[s.id]; if(rec===true && !day.clockins[s.id]){exception=true;break;} }
     if(exception) ids.push(s.id);
   }
   anyException ||= ids.length>0;
   const rate=students.length?Math.round(ids.length/students.length*100):0;
   h+=`<tr><td><strong>${esc(y)}</strong></td><td>${students.length}</td><td><span class="metric warning-metric">${ids.length}</span></td><td>${rate}%</td><td>${ids.length?ids.map(id=>{const st=students.find(s=>s.id===id);return esc((st?.name||id)+(getStudentYear(st)?' ('+getStudentYear(st)+')':''))}).join(', '):'—'}</td></tr>`;
 }
 if(!years.length || !anyException) h+='<tr><td colspan="5" style="text-align:center">No attendance exceptions were identified for the selected date.</td></tr>';
 h+='</tbody></table></div>';
 document.getElementById('sixPeriodExceptionSummary').innerHTML=h;
}
function updateGraphClassOptions(){
 const sel=document.getElementById('graphClass'),old=sel.value;
 const years=[...new Set(db.students.map(getStudentYear).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
 sel.innerHTML='<option value="">Select year</option>'+years.map(y=>`<option value="${esc(y)}">${esc(y)}</option>`).join('');
 if(years.includes(old)) sel.value=old; else sel.value='';
}
function generateTutorPeriodGraph(){
 const date=document.getElementById('graphDate').value||today();
 const cl=document.getElementById('graphClass').value;
 const msg=document.getElementById('graphMsg');
 const canvas=document.getElementById('tutorPeriodChart');
 const ctx=canvas.getContext('2d');
 ctx.clearRect(0,0,canvas.width,canvas.height);
 const day=ensureDay(date);
 const students=db.students.filter(s=>getStudentYear(s)===cl);
 if(!students.length){msg.textContent='Select a year with students.';return;}
 const tutorPresent=students.filter(s=>!!day.clockins[s.id]).length;
 const values=[tutorPresent];
 for(let p=1;p<=6;p++) values.push(students.filter(s=>(day.periods[p]||{})[s.id]===true).length);
 const labels=['Tutor Hour','Period 1','Period 2','Period 3','Period 4','Period 5','Period 6'];
 const max=Math.max(students.length,...values,1);
 const pad={l:65,r:25,t:55,b:75};
 const plotW=canvas.width-pad.l-pad.r,plotH=canvas.height-pad.t-pad.b;
 ctx.font='14px Arial';ctx.fillStyle='#111827';ctx.textAlign='center';
 ctx.fillText(`Tutor Hour vs Periods — ${cl} — ${date}`,canvas.width/2,25);
 ctx.strokeStyle='#d1d5db';ctx.lineWidth=1;
 const steps=Math.max(1,Math.min(5,max));
 for(let i=0;i<=steps;i++){
   const v=Math.round(max*i/steps),y=pad.t+plotH-(v/max)*plotH;
   ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(canvas.width-pad.r,y);ctx.stroke();
   ctx.fillStyle='#6b7280';ctx.textAlign='right';ctx.fillText(String(v),pad.l-8,y+5);
 }
 const slot=plotW/labels.length,barW=Math.min(70,slot*0.58);
 values.forEach((v,i)=>{
   const x=pad.l+slot*i+(slot-barW)/2;
   const h=(v/max)*plotH,y=pad.t+plotH-h;
   const graphColors=['#2563eb','#16a34a','#dc2626','#f59e0b','#7c3aed','#0891b2','#db2777'];ctx.fillStyle=graphColors[i%graphColors.length];ctx.fillRect(x,y,barW,h);
   ctx.fillStyle='#111827';ctx.textAlign='center';ctx.fillText(String(v),x+barW/2,y-8);
   ctx.fillStyle='#374151';ctx.font='12px Arial';ctx.fillText(labels[i],x+barW/2,canvas.height-42);
   ctx.font='14px Arial';
 });
 msg.textContent=`${students.length} students in ${cl}. Tutor Hour present: ${tutorPresent}.`;
}
function localDateString(d){
 const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
 return `${y}-${m}-${day}`;
}
function mondayFridayDates(value){
 const parts=(value||today()).split('-').map(Number);
 const base=new Date(parts[0],parts[1]-1,parts[2]);
 const day=base.getDay();
 const diff=day===0?-6:1-day;
 const monday=new Date(base);
 monday.setDate(base.getDate()+diff);
 const out=[];
 for(let i=0;i<5;i++){
   const d=new Date(monday);
   d.setDate(monday.getDate()+i);
   out.push(localDateString(d));
 }
 return out;
}
function buildWeeklyReport(){
 const selected=document.getElementById('weeklyReportDate').value||today();
 const selectedClass=document.getElementById('weeklyReportClass')?.value||'';
 const dates=mondayFridayDates(selected);
 if(!selectedClass){
   document.getElementById('weeklyReport').innerHTML='<div class="daily-note"><strong>Select a year</strong> to generate the Monday–Friday Report.</div>';
   return;
 }
 const dayNames=['Monday','Tuesday','Wednesday','Thursday','Friday'];
 const students=db.students.filter(s=>getStudentYear(s)===selectedClass);
 const total=students.length;
 const getDay=d=>{const x=db.days[d]||{clockins:{},periods:{}}; Object.defineProperty(x,'__date',{value:d,configurable:true}); return x;};

 // One student = one daily attendance result. Periods are only used to decide
 // whether the student was present/absent; they are NEVER added together.
 function studentDayStatus(day,s,dayDate){
   const d=dayDate||day.__date||today();
   const tutorPresent=!!day.clockins[s.id];
   let periodPresent=false, periodAbsent=false;
   for(let p=1;p<=PERIODS;p++){
     const rec=(day.periods&&day.periods[p])||{};
     if(rec[s.id]===true) periodPresent=true;
     if(rec[s.id]===false) periodAbsent=true;
   }
   const present=tutorPresent||periodPresent;
   if(present) return {status:'present',tutorPresent,periodPresent,periodAbsent};
   if(d>today()) return {status:'nr',tutorPresent:false,periodPresent:false,periodAbsent};
   if(d<today()) return {status:'absent',tutorPresent:false,periodPresent:false,periodAbsent:true};
   // Today: only expired attendance opportunities can turn an unrecorded
   // student into absent. A future/current period remains Not Recorded.
   let expiredOpportunity=false;
   for(let p=1;p<=PERIODS;p++) if(periodHasExpired(d,p)) expiredOpportunity=true;
   const tutorExpired=minutesNow()>500;
   if(periodAbsent || tutorExpired || expiredOpportunity || day.closed)
     return {status:'absent',tutorPresent:false,periodPresent:false,periodAbsent:true};
   return {status:'nr',tutorPresent:false,periodPresent:false,periodAbsent};
 }

 let daily=[];
 dates.forEach((d,i)=>{
   const day=getDay(d);
   let studentsPresent=0,studentsAbsent=0,studentsNR=0,sourceTutor=0,sourcePeriod=0;
   const absentSet=new Set();
   const presentSet=new Set();
   students.forEach(s=>{
     const x=studentDayStatus(day,s,d);
     if(x.tutorPresent) sourceTutor++;
     if(x.periodPresent) sourcePeriod++;
     // Tutor Hour is the authoritative status for this Tutor Hour report.
     // Being present in a later period must NOT turn Tutor Hour ABSENT into PRESENT.
     if(x.tutorPresent) presentSet.add(s.id);
     else absentSet.add(s.id);
   });
   studentsPresent=Math.min(total,presentSet.size);
   // A student who is present at least once that day is not an absent student.
   presentSet.forEach(id=>absentSet.delete(id));
   studentsAbsent=Math.min(Math.max(0,total-studentsPresent),absentSet.size);
   studentsNR=Math.max(0,total-studentsPresent-studentsAbsent);
   // This is deliberately the same number as daily unique absent students.
   daily.push({d,name:dayNames[i],studentsPresent,studentsAbsent,studentsNR,uniqueAbsentStudents:studentsAbsent,sourceTutor,sourcePeriod,totalStudents:total});
 });

 let studentRows='';
 students.forEach(s=>{
   let daysPresent=0,daysAbsent=0,daysNR=0,tutorDays=0,periodDays=0,cells='';
   dates.forEach(d=>{
     const x=studentDayStatus(getDay(d),s,d);
     // Keep Tutor Hour attendance separate from later-period attendance.
     if(x.tutorPresent){
       daysPresent++; tutorDays++; if(x.periodPresent)periodDays++;
       const source=x.periodPresent?'Tutor Hour + Later Period':'Tutor Hour';
       cells+=`<td class="weekly-day"><span class="status-pill present">TUTOR PRESENT</span><span class="status-source">${source}</span></td>`;
     } else if(x.status==='nr' && d===today()){
       daysNR++; if(x.periodPresent)periodDays++;
       cells+=`<td class="weekly-day"><span class="status-pill nr">NOT RECORDED</span><span class="status-source">Tutor Hour not finalized</span></td>`;
     } else {
       daysAbsent++; if(x.periodPresent)periodDays++;
       cells+=`<td class="weekly-day"><span class="status-pill absent">TUTOR ABSENT</span><span class="status-source">${x.periodPresent?'PRESENT LATER':'No Tutor clock-in'}</span></td>`;
     }
   });
   const recorded=daysPresent+daysAbsent;
   const attendancePct=recorded?((daysPresent/recorded)*100).toFixed(1):'0.0';
   studentRows+=`<tr><td><div class="student-name">${esc(s.name)}</div><div class="student-id">${esc(s.id)}</div></td><td class="class-cell">${esc(s.cl)}</td>${cells}<td class="weekly-total">${daysPresent}</td><td class="weekly-total">${daysAbsent}</td><td class="weekly-total">${daysNR}</td><td class="weekly-rate">${attendancePct}%</td></tr>`;
 });

 // Weekly unique absent students: a student is counted once across Monday-Friday.
 // This value is hard-limited by the selected year registration count.
 const weeklyAbsentSet=new Set();
 const weeklyPresentSet=new Set();
 students.forEach(s=>{
   let wasPresent=false, wasAbsent=false;
   dates.forEach(d=>{
     const x=studentDayStatus(getDay(d),s,d);
     if(x.status==='present') wasPresent=true;
     else if(x.status==='absent') wasAbsent=true;
   });
   if(wasPresent) weeklyPresentSet.add(s.id);
   if(wasAbsent) weeklyAbsentSet.add(s.id);
 });
 weeklyPresentSet.forEach(id=>weeklyAbsentSet.delete(id));
 const totalUniquePresent=Math.min(total,weeklyPresentSet.size);
 const totalUniqueAbsent=Math.min(Math.max(0,total-totalUniquePresent),weeklyAbsentSet.size);
 const weeklyRecorded=Math.min(total,totalUniquePresent+totalUniqueAbsent);
 const weeklyPct=weeklyRecorded?((totalUniquePresent/weeklyRecorded)*100).toFixed(1):'0.0';

 let dailyRows='';
 daily.forEach(x=>{
   dailyRows+=`<tr><td><strong>${x.name}</strong></td><td>${x.d}</td><td>${x.studentsPresent}</td><td>${x.studentsAbsent}</td><td>${x.studentsNR}</td><td>${x.uniqueAbsentStudents}</td><td>${x.sourceTutor}</td><td>${x.sourcePeriod}</td></tr>`;
 });
 const startLabel=dates[0],endLabel=dates[4];
 const dayHeaders=dates.map((d,i)=>`<th class="weekly-day">${dayNames[i]}<span class="day-date">${d.slice(5).replace('-','/')}</span></th>`).join('');
 const h=`<div class="weekly-report"><div class="weekly-head"><div><h3>Student Weekly Attendance</h3><p>Monday–Friday • ${esc(startLabel)} to ${esc(endLabel)}</p></div><div class="small"><strong>Attendance register</strong><br>Each student is counted once per school day.</div></div>
 <div class="weekly-kpis"><div class="weekly-kpi"><div class="label">Registered Students</div><div class="value">${total}</div></div><div class="weekly-kpi good"><div class="label">Students Present At Least Once</div><div class="value">${totalUniquePresent}</div></div><div class="weekly-kpi bad"><div class="label">Students Absent At Least Once</div><div class="value">${totalUniqueAbsent}</div></div><div class="weekly-kpi"><div class="label">Weekly Attendance Rate</div><div class="value">${weeklyPct}%</div></div></div>
 <div class="weekly-table-wrap"><table class="weekly-table"><thead><tr><th>Student</th><th>Year</th>${dayHeaders}<th>Present</th><th>Absent</th><th>Not Recorded</th><th>Rate</th></tr></thead><tbody>${studentRows}</tbody></table></div>
 <div class="weekly-legend"><span class="legend-item"><span class="legend-dot p"></span><strong>Tutor Present</strong> — student clocked in during Tutor Hour</span><span class="legend-item"><span class="legend-dot a"></span><strong>Tutor Absent</strong> — no Tutor Hour clock-in, even if present later</span><span class="legend-item"><span class="legend-dot n"></span><strong>Not Recorded</strong> — not yet due</span></div>
 <div class="weekly-daily"><h3>Daily Attendance Summary</h3><div class="weekly-table-wrap"><table class="weekly-table" style="min-width:760px"><thead><tr><th>Day</th><th>Date</th><th>Present Students</th><th>Absent Students</th><th>Not Recorded</th><th>Unique Absent Students</th><th>Present via Tutor</th><th>Present via Period</th></tr></thead><tbody>${dailyRows}</tbody></table></div></div>
 <p class="weekly-note"><strong>Daily Attendance Summary:</strong> counts registered students in the selected year. Each student is counted only once for the day. If a student is absent in Period 1 and Period 2, the Daily Attendance Summary counts that student as <strong>1 absent student</strong>, not 2. Tutor Hour presence is counted separately from later-period presence; a later-period entry never changes Tutor Hour ABSENT to PRESENT. Future days and unexpired periods remain Not Recorded. No Daily Attendance Summary count can exceed the selected year registration total.</p></div>`;
 document.getElementById('weeklyReport').innerHTML=h;
}

function updateWeeklyReportClassOptions(){
 const sel=document.getElementById('weeklyReportClass');
 if(!sel)return;
 const old=sel.value;
 const cls=[...new Set(db.students.map(getStudentYear).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
 sel.innerHTML='<option value="">Select year</option>'+cls.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
 if(cls.includes(old))sel.value=old;
 else if(!old && cls.length===1)sel.value=cls[0];
}
function updateReportClassOptions(){
 const sel=document.getElementById('reportClass');
 if(!sel)return;
 const old=sel.value;
 const cls=[...new Set(db.students.map(getStudentYear).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
 sel.innerHTML='<option value="">Select year</option>'+cls.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
 if(cls.includes(old))sel.value=old;
 else if(!old && cls.length===1)sel.value=cls[0];
}
function buildReport(){
 const d=document.getElementById('reportDate').value||today(),day=ensureDay(d);
 const cl=document.getElementById('reportClass')?.value||'';
 if(!cl){
   document.getElementById('report').innerHTML='<div class="daily-note"><strong>Select a year</strong> to generate the Daily Attendance Report.</div>';
   return;
 }
 const students=db.students.filter(s=>getStudentYear(s)===cl);
 const ids=new Set(students.map(s=>s.id));
 const total=students.length;
 const present=students.filter(s=>!!day.clockins[s.id]).length;
 const absent=Math.max(0,total-present);
 const rate=total?Math.round(present/total*100):0;
 let later=[], periodTotals=[];
 for(let p=1;p<=6;p++){
   const stats=getPeriodStats(day,p,cl);
   const pr=stats.presentStudents.length;
   const ab=stats.absentStudents.length;
   const recorded=pr+ab;
   periodTotals.push({p,pr,ab,recorded,exceptions:stats.tutorAbsentPresent.length});
 }
 for(const s of students){
   if(!day.clockins[s.id]){
     let attended=false;
     for(let p=1;p<=6;p++)if((day.periods[p]||{})[s.id]===true)attended=true;
     if(attended)later.push(s);
   }
 }
 const finalized=!!day.closed;
 const reportStatus=finalized?'Finalized':'Working Record';
 const generated=new Date().toLocaleString([], {dateStyle:'medium',timeStyle:'short'});
 let h=`<div class="daily-report">
 <div class="daily-report-head">
   <div><div class="eyebrow">Official School Attendance</div><h2>Daily Attendance Report</h2><p>Year: ${esc(cl)} • Comprehensive attendance record for Tutor Hour and all six year periods.</p></div>
   <div class="daily-report-meta"><div>Attendance Date</div><strong>${esc(d)}</strong><div>Status: <strong>${reportStatus}</strong></div><div>Generated: ${esc(generated)}</div></div>
 </div>
 <div class="daily-report-body">
   <div class="daily-kpis">
    <div class="daily-kpi"><div class="label">Registered Students</div><div class="value">${total}</div></div>
    <div class="daily-kpi good"><div class="label">Tutor Hour Present</div><div class="value">${present}</div></div>
    <div class="daily-kpi bad"><div class="label">Tutor Hour Absent</div><div class="value">${absent}</div></div>
    <div class="daily-kpi ${rate>=90?'good':rate>=75?'warnk':'bad'}"><div class="label">Attendance Rate</div><div class="value">${rate}%</div></div>
   </div>
   <div class="daily-section">
    <div class="daily-section-title"><h3>Year Period Performance</h3><span>${esc(cl)} • Periods 1–6</span></div>
    <table><thead><tr><th>Period</th><th>Present</th><th>Absent</th><th>Not Recorded</th><th>Rate</th><th>Tutor Absent → Later Present</th></tr></thead><tbody>`;
 for(const x of periodTotals){
   const notRecorded=Math.max(0,total-x.pr-x.ab);
   const prRate=total?Math.round((x.pr/total)*100):0;
   h+=`<tr><td><strong>Period ${x.p}</strong></td><td class="num">${x.pr}</td><td class="num">${x.ab}</td><td class="num">${notRecorded}</td><td class="num">${prRate}%</td><td class="num">${x.exceptions}</td></tr>`;
 }
 h+=`</tbody></table></div>
   <div class="daily-section">
    <div class="daily-section-title"><h3>Student Attendance Register</h3><span>${esc(cl)} • ${total} registered</span></div>
    <table><thead><tr><th>#</th><th>Student ID</th><th>Student Name</th><th>Year</th><th>Tutor Hour</th><th>Clock-In</th><th>Later Period</th></tr></thead><tbody>`;
 students.forEach((s,i)=>{
   const t=day.clockins[s.id];
   const hasLater=later.some(x=>x.id===s.id);
   const tutor=t?`<span class="daily-status present"><i class="daily-dot"></i>Present</span>`:`<span class="daily-status absent"><i class="daily-dot"></i>Absent</span>`;
   const laterBadge=hasLater?`<span class="daily-status later"><i class="daily-dot"></i>Present Later</span>`:`<span class="daily-status none">—</span>`;
   h+=`<tr><td class="num">${i+1}</td><td><strong>${esc(s.id)}</strong></td><td>${esc(s.name)}</td><td>${esc(s.cl)}</td><td>${tutor}</td><td>${t?`<strong>${esc(t)}</strong>`:'—'}</td><td>${laterBadge}</td></tr>`;
 });
 if(!total) h+='<tr><td colspan="7" style="text-align:center">No students are registered.</td></tr>';
 h+=`</tbody></table></div>
   <div class="daily-section">
    <div class="daily-section-title"><h3>Attendance Exceptions</h3><span>Follow-up required</span></div>`;
 if(later.length){
   h+=`<div class="daily-note"><strong>${later.length} student${later.length===1?'':'s'}</strong> missed Tutor Hour but were recorded as Present in at least one later year period.</div>
   <table><thead><tr><th>Student ID</th><th>Student Name</th><th>Year</th><th>Action</th></tr></thead><tbody>`;
   later.forEach(s=>{
     const laterPeriods=[];
     for(let p=1;p<=6;p++) if((day.periods[p]||{})[s.id]===true) laterPeriods.push('Period '+p);
     h+=`<tr><td><strong>${esc(s.id)}</strong></td><td>${esc(s.name)}${getStudentYear(s)?` <span class="student-name-year">(${esc(getStudentYear(s))})</span>`:''}</td><td>${esc(getStudentYear(s))}</td><td><span class="daily-status absent">TUTOR ABSENT</span> <span class="daily-status later">${esc(laterPeriods.join(', '))}</span></td></tr>`;
   });
   h+='</tbody></table>';
 }else{
   h+='<div class="daily-note">No Tutor Hour / later-period attendance exceptions were identified for this date.</div>';
 }
 h+=`</div>
   <div class="daily-footer"><span>Prepared from the school's stored attendance register.</span><span>Daily Attendance Report • ${esc(d)}</span></div>
 </div></div>`;
 document.getElementById('report').innerHTML=h;
}


function updateMovementClassOptions(){
 const sel=document.getElementById('movementYear'); if(!sel)return; const old=sel.value;
 const years=[...new Set(db.students.map(s=>s.year??s.cl).filter(Boolean))].sort();
 sel.innerHTML='<option value="">Select Year</option>'+years.map(y=>`<option value="${esc(y)}">${esc(y)}</option>`).join('');
 if(years.includes(old))sel.value=old;
 updateMovementStudentOptions();
}
function updateMovementStudentOptions(){
 const sel=document.getElementById('movementStudent'); if(!sel)return; const old=sel.value; const yearSel=document.getElementById('movementYear'); const year=yearSel?yearSel.value:'';
 const students=db.students.filter(s=>!year||(s.year??s.cl)===year).sort((a,b)=>a.name.localeCompare(b.name));
 sel.innerHTML='<option value="">Select student</option>'+students.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} — ${esc(s.id)}</option>`).join('');
 if(students.some(s=>s.id===old))sel.value=old;
 sel.disabled=students.length===0;
}
function movementIsOpen(){const now=new Date();const minutes=now.getHours()*60+now.getMinutes();return minutes>=420&&minutes<900;}
function updateMovementOperatingHours(){const page=document.getElementById('movementPage');if(!page)return;const open=movementIsOpen();page.classList.toggle('movement-locked',!open);const notice=document.getElementById('movementClosedNotice');if(notice)notice.querySelector('span').innerHTML=open?'Student Movement / Exit Register is open. <b>Operating hours: 7:00 AM–3:00 PM.</b>':'School is currently closed. This page is available only from <b>7:00 AM to 3:00 PM</b>.';const ids=['movementDate','movementYear','movementStudent','movementReason','movementOutBtn','movementRefreshBtn','movementPrintBtn','movementDeleteDateBtn'];ids.forEach(id=>{const el=document.getElementById(id);if(el)el.disabled=!open;});return open;}
function movementNow(){return timeText(new Date());}
function openMovementForStudent(day,id){return (day.movements||[]).find(m=>m.studentId===id&&!m.timeIn);}
function getImmediateMovementPeriod(date, cl){
 const p=(date===today())?activePeriodNow():0;
 const teacher=db.teachers.find(t=>t.cl===cl);
 return {period:p||0,label:p?'Period '+p+' • '+PERIOD_SCHEDULE[p][2]:'—',teacherName:teacher?teacher.name:'Teacher not assigned',teacherId:teacher?teacher.id:''};
}
function recordMovementOut(){if(!movementIsOpen()){updateMovementOperatingHours();alert("Student Movement / Exit Register is closed. Operating hours are 7:00 AM to 3:00 PM.");return;}
 const yearSel=document.getElementById('movementYear'), studentSel=document.getElementById('movementStudent');
 updateMovementClassOptions();
 if(yearSel.value) updateMovementStudentOptions();
 const date=document.getElementById('movementDate').value||today(), id=studentSel.value, reason=document.getElementById('movementReason').value;
 const msg=document.getElementById('movementMsg');
 const s=db.students.find(x=>x.id===id); if(!s){msg.textContent='Select a student first.';msg.className='movement-status out';return;}
 const day=ensureDay(date); if(openMovementForStudent(day,id)){msg.textContent=s.name+' is already recorded as outside. Record the return first.';msg.className='movement-status out';return;}
 const studentYear=s.year??s.cl??'';
 const immediate=getImmediateMovementPeriod(date,studentYear);
 day.movements.push({id:'MV-'+Date.now(),studentId:id,studentName:s.name,year:studentYear,reason,timeOut:movementNow(),timeIn:'',date,
   period:immediate.period,immediatePeriod:immediate.label,periodLabel:immediate.label,teacherId:immediate.teacherId,teacherName:immediate.teacherName});
 save();
 renderMovementRanking();
 msg.textContent=`${s.name} left at ${day.movements.at(-1).timeOut} for ${reason}.`;msg.className='movement-status out'; renderMovements();
}
function recordMovementIn(mid){
 const date=document.getElementById('movementDate').value||today(), day=ensureDay(date); const m=day.movements.find(x=>x.id===mid); if(!m)return; m.timeIn=movementNow();
 const outParts=m.timeOut.match(/(\d+):(\d+):(\d+)\s*(AM|PM)?/i); const inParts=m.timeIn.match(/(\d+):(\d+):(\d+)\s*(AM|PM)?/i);
 if(outParts&&inParts){let oh=+outParts[1],ih=+inParts[1]; if((outParts[4]||'').toUpperCase()==='PM'&&oh<12)oh+=12;if((outParts[4]||'').toUpperCase()==='AM'&&oh===12)oh=0;if((inParts[4]||'').toUpperCase()==='PM'&&ih<12)ih+=12;if((inParts[4]||'').toUpperCase()==='AM'&&ih===12)ih=0;m.duration=Math.max(0,(ih*60+ +inParts[2])-(oh*60+ +outParts[2]));}
 save(); renderMovements(); renderMovementRanking();
}
function refreshMovementData(){
 const stored=localStorage.getItem(KEY);
 if(stored){try{db=JSON.parse(stored)||db;}catch(e){}}
 updateMovementClassOptions(); updateMovementStudentOptions(); renderMovements(); updateMovementRankingYearOptions(); renderMovementRanking();
 const msg=document.getElementById('movementMsg'); if(msg){msg.textContent='Register refreshed from saved data.';msg.className='movement-status returned';}
}
function deleteMovement(mid){
 const date=document.getElementById('movementDate')?.value||today(), day=db.days[date]; if(!day)return;
 const m=(day.movements||[]).find(x=>x.id===mid); if(!m)return;
 if(!confirm('Delete the movement record for '+m.studentName+' at '+m.timeOut+'? This cannot be undone.'))return;
 day.movements=day.movements.filter(x=>x.id!==mid); save(); renderMovements();
}
function deleteSelectedMovementData(){if(!movementIsOpen()){updateMovementOperatingHours();alert("Student Movement / Exit Register is closed. Operating hours are 7:00 AM to 3:00 PM.");return;}
 const date=document.getElementById('movementDate')?.value||today(), cl=document.getElementById('movementYear')?.value||'', day=db.days[date];
 if(!day||!day.movements?.length){alert('There is no movement data to delete for the selected date.');return;}
 const count=cl?day.movements.filter(m=>(m.year||m.class)===cl).length:day.movements.length;
 if(!count){alert('There is no movement data matching the selected year.');return;}
 if(!confirm('Delete '+count+' movement record'+(count===1?'':'s')+(cl?' for '+cl:'')+' on '+date+'? This cannot be undone.'))return;
 day.movements=cl?day.movements.filter(m=>(m.year||m.class)!==cl):[]; save(); renderMovements();
}
function printMovementRegister(){if(!movementIsOpen()){updateMovementOperatingHours();alert("Student Movement / Exit Register is closed. Operating hours are 7:00 AM to 3:00 PM.");return;}
 document.body.classList.add('printing-movement');
 setTimeout(()=>window.print(),50);
}
function updateMovementRankingYearOptions(){
 const sel=document.getElementById('movementRankYear'); if(!sel)return; const old=sel.value;
 const years=[...new Set(db.students.map(s=>s.year??s.cl).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
 sel.innerHTML='<option value="">All years</option>'+years.map(y=>`<option value="${esc(y)}">${esc(y)}</option>`).join('');
 if(years.includes(old))sel.value=old;
}
function renderMovementRanking(){
 const year=document.getElementById('movementRankYear')?.value||'';
 const counts=new Map();
 for(const day of Object.values(db.days||{})){
   for(const m of (day?.movements||[])){
     const y=m.year??m.class??''; if(year&&y!==year)continue;
     const id=m.studentId||m.studentName||''; if(!id)continue;
     const existing=counts.get(id)||{studentId:m.studentId||'',studentName:m.studentName||'Unknown Student',year:y||'—',count:0};
     existing.count++; if(!existing.year||existing.year==='—')existing.year=y||'—'; counts.set(id,existing);
   }
 }
 const rows=[...counts.values()].sort((a,b)=>b.count-a.count||String(a.studentName).localeCompare(String(b.studentName)));
 const total=rows.reduce((n,x)=>n+x.count,0);
 document.getElementById('movementRankStudents').textContent=rows.length;
 document.getElementById('movementRankTotal').textContent=total;
 document.getElementById('movementRankHighest').textContent=rows[0]?.count||0;
 document.getElementById('movementRankTop').textContent=rows[0]?rows[0].count:'—';
 let h='<div class="movement-table-wrap"><table class="movement-ranking-table"><thead><tr><th>Rank</th><th>Student</th><th>Student ID</th><th>Year</th><th>Total Movements</th></tr></thead><tbody>';
 rows.forEach((r,i)=>{const rank=i+1; h+=`<tr><td><strong>${rank}</strong></td><td><strong>${esc(r.studentName)}</strong></td><td>${esc(r.studentId||'—')}</td><td>${esc(r.year)}</td><td><strong>${r.count}</strong></td></tr>`});
 if(!rows.length)h+='<tr><td colspan="5" style="text-align:center;padding:24px;color:#98a2b3">No student movement records found.</td></tr>';
 h+='</tbody></table></div><div class="movement-rank-note">Ranking is calculated from all saved Student Movement / Exit Register records.</div>';
 document.getElementById('movementRankingTable').innerHTML=h;
}

function renderMovements(){
 const date=document.getElementById('movementDate')?.value||today(), day=ensureDay(date), rows=day.movements||[], cl=document.getElementById('movementYear')?.value||'';
 const filtered=rows.filter(m=>!cl||(m.year||m.class)===cl).slice().reverse(), current=filtered.filter(m=>!m.timeIn);
 document.getElementById('movementTotal').textContent=filtered.length;
 document.getElementById('movementOutside').textContent=current.length;
 const countReason=(reason)=>filtered.filter(m=>m.reason===reason).length;
 document.getElementById('movementMedical').textContent=countReason('Medical / Sick Bay');
 document.getElementById('movementToilet').textContent=countReason('Toilet');
 document.getElementById('movementUrination').textContent=countReason('Urination');
 document.getElementById('movementVomiting').textContent=countReason('Vomiting');
 document.getElementById('movementMedication').textContent=countReason('Medication');
 document.getElementById('movementOffice').textContent=countReason('Sent to Office');
 document.getElementById('movementParent').textContent=countReason('Called by Parent/Guardian');
 document.getElementById('movementOther').textContent=countReason('Other');
 const live=document.getElementById('movementLiveCount'); if(live)live.textContent=current.length;
 const liveText=document.getElementById('movementLivePillText'); if(liveText)liveText.textContent=current.length+(current.length===1?' outside':' outside');
 const msg=document.getElementById('movementMsg');
 msg.innerHTML=current.length?`<span class="movement-current"><strong>${current.length}</strong> student${current.length===1?' is':'s are'} currently outside the classroom.</span>`:'No student is currently recorded as outside the classroom.';
 msg.className='movement-status '+(current.length?'out':'returned');
 const currentEl=document.getElementById('movementCurrentTable');
 let ch='';
 if(current.length){
   ch='<div class="movement-table-wrap"><table class="movement-table"><thead><tr><th>Student</th><th>Year</th><th>Teacher</th><th>Reason</th><th>Time Out</th><th>Action</th><th>Delete</th></tr></thead><tbody>';
   current.forEach(m=>{ch+=`<tr><td><strong>${esc(m.studentName)}</strong><br><span class="movement-note">${esc(m.studentId)}</span></td><td><strong>${esc(m.year||m.class||'—')}</strong></td><td>${esc(m.teacherName||'—')}</td><td>${esc(m.reason)}</td><td><strong>${esc(m.timeOut)}</strong></td><td><button class="btn movement-primary" onclick="recordMovementIn('${esc(m.id)}')">Record Time In</button></td><td><button class="btn movement-danger" onclick="deleteMovement('${esc(m.id)}')">Delete</button></td></tr>`});
   ch+='</tbody></table></div>';
 }else ch='<div class="movement-empty"><strong>All students are accounted for</strong>No student from the selected year/date is currently outside the classroom.</div>';
 currentEl.innerHTML=ch;
 let h='<div class="movement-table-wrap"><table class="movement-table"><thead><tr><th>Student</th><th>Year</th><th>Teacher</th><th>Reason</th><th>Time Out</th><th>Time In</th><th>Duration</th><th>Status</th><th>Delete</th></tr></thead><tbody>';
 filtered.forEach(m=>{const dur=m.duration!=null?m.duration+' min':'—';h+=`<tr><td><strong>${esc(m.studentName)}</strong><br><span class="movement-note">${esc(m.studentId)}</span></td><td>${esc(m.year||m.class||'—')}</td><td>${esc(m.teacherName||'—')}</td><td>${esc(m.reason)}</td><td>${esc(m.timeOut)}</td><td>${m.timeIn?esc(m.timeIn):'—'}</td><td>${dur}</td><td><span class="movement-badge ${m.timeIn?'returned':'out'}">${m.timeIn?'Returned':'Outside'}</span></td><td><button class="btn movement-danger" onclick="deleteMovement('${esc(m.id)}')">Delete</button></td></tr>`});
 if(!filtered.length)h+='<tr><td colspan="10" style="text-align:center;padding:24px;color:#98a2b3">No student movement recorded for this date.</td></tr>'; h+='</tbody></table></div>'; document.getElementById('movementTable').innerHTML=h;
}


function csvEscape(v){const s=String(v??'');return '"'+s.replace(/"/g,'""')+'"'}
function downloadCsv(filename,rows){
 const csv=rows.map(r=>r.map(csvEscape).join(',')).join('\r\n');
 const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function schoolDates(){
 // School operates Monday-Friday only. Weekend dates are never included in attendance calculations/history.
 return Object.keys(db.days||{}).filter(d=>{
   const dt=new Date(d+'T12:00:00');
   const day=dt.getDay();
   return day!==0 && day!==6;
 }).sort();
}
function tutorStatsForStudent(id){
 const dates=schoolDates().filter(d=>db.days[d]?.clockins && (db.days[d].clockins[id] || db.days[d].closed || Object.keys(db.days[d].periods||{}).length));
 let present=0; const recent=[];
 dates.forEach(d=>{const v=db.days[d]?.clockins?.[id];if(v)present++;recent.push([d,v||'Absent']);});
 return {dates,present,recent,rate:dates.length?Math.round(present/dates.length*100):0};
}
function periodStatsForStudent(id){
 let total=0,present=0;
 for(const d of schoolDates()){
   const ps=db.days[d]?.periods||{};
   for(let p=1;p<=6;p++) if(ps[p] && Object.prototype.hasOwnProperty.call(ps[p],id)){total++;if(ps[p][id]===true)present++;}
 }
 return {total,present,rate:total?Math.round(present/total*100):0};
}
function movementStatsForStudent(id){
 let total=0,outside=0;
 for(const d of schoolDates()) for(const m of (db.days[d]?.movements||[])){
   if(m.studentId===id){total++;if(!m.timeIn)outside++;}
 }
 return {total,outside};
}
function renderDashboard(){
 const now=new Date(), ds=today(), day=ensureDay(ds), total=db.students.length;
 const tutorPresent=Object.keys(day.clockins||{}).length, tutorRate=total?Math.round(tutorPresent/total*100):0;
 const ap=activePeriodNow();
 document.getElementById('dashClock').textContent=timeText(now);
 document.getElementById('dashStudents').textContent=total;
 document.getElementById('dashTutorPresent').textContent=tutorPresent;
 document.getElementById('dashTutorSub').textContent=tutorRate+'% present today • '+Math.max(0,total-tutorPresent)+' not clocked in';
 document.getElementById('dashTutorBar').style.width=Math.min(100,tutorRate)+'%';
 document.getElementById('dashPeriod').textContent=ap?('P'+ap):'—';
 document.getElementById('dashPeriodSub').textContent=ap?PERIOD_SCHEDULE[ap][2]:'No active period';
 const outside=(day.movements||[]).filter(m=>!m.timeIn).length;
 document.getElementById('dashOutside').textContent=outside;
 const periodPresent=ap?Object.values(day.periods?.[ap]||{}).filter(v=>v===true).length:0;
 document.getElementById('dashHealth').innerHTML=`<div class="feature-grid">
 <div class="feature-card"><div class="label">Tutor Hour</div><div class="value">${tutorRate}%</div><div class="sub">${tutorPresent} of ${total} students</div></div>
 <div class="feature-card"><div class="label">Current Period</div><div class="value">${ap?'P'+ap:'—'}</div><div class="sub">${ap?periodPresent+' marked present':'Attendance entry closed'}</div></div>
 <div class="feature-card"><div class="label">Finalized</div><div class="value">${day.closed?'YES':'NO'}</div><div class="sub">${day.closed?'Tutor Hour is locked':'Tutor Hour can still be open'}</div></div>
 </div>`;
 const alerts=[];
 db.students.forEach(s=>{const st=tutorStatsForStudent(s.id);if(st.dates.length>=3&&st.rate<75)alerts.push({s,st});});
 alerts.sort((a,b)=>a.st.rate-b.st.rate);
 let ah='<div class="mini-table"><table><thead><tr><th>Student</th><th>Year</th><th>Recorded Days</th><th>Tutor Hour</th><th>Action</th></tr></thead><tbody>';
 if(!alerts.length) ah+='<tr><td colspan="5" class="good-row">No student below 75% in the currently recorded days.</td></tr>';
 alerts.slice(0,15).forEach(x=>ah+=`<tr class="alert-row"><td><strong>${esc(x.s.name)}</strong><br><span class="small">${esc(x.s.id)}</span></td><td>${esc(getStudentYear(x.s))}</td><td>${x.st.dates.length}</td><td><strong>${x.st.rate}%</strong></td><td><button class="btn" onclick="openStudentAnalytics('${esc(x.s.id)}')">View</button></td></tr>`);
 ah+='</tbody></table></div>'; document.getElementById('dashAlerts').innerHTML=ah;
 const events=[];
 for(const d of schoolDates()) for(const [id,t] of Object.entries(db.days[d]?.clockins||{})){const s=studentById(id);if(s)events.push({d,t,s});}
 events.sort((a,b)=>(b.d+b.t).localeCompare(a.d+a.t));
 let eh='<div class="mini-table"><table><thead><tr><th>Date</th><th>Time</th><th>Student</th><th>Year</th></tr></thead><tbody>';
 if(!events.length)eh+='<tr><td colspan="4" class="muted">No clock-in activity yet.</td></tr>';
 events.slice(0,10).forEach(ehrow=>eh+=`<tr><td>${esc(ehrow.d)}</td><td>${esc(ehrow.t)}</td><td>${esc(ehrow.s.name)}</td><td>${esc(getStudentYear(ehrow.s))}</td></tr>`);
 eh+='</tbody></table></div>';document.getElementById('dashActivity').innerHTML=eh;
}
function openStudentAnalytics(id){
 const s=studentById(id); if(!s)return;
 document.querySelectorAll('.tabBtn').forEach(x=>x.classList.toggle('active',x.dataset.tab==='analytics'));
 document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.id==='analytics'));
 document.getElementById('analyticsSearch').value=s.id;
 renderStudentAnalytics(s.id);
 updatePrintCurrentPageButton();
}
function renderStudentAnalytics(id){
 const box=document.getElementById('analyticsResult'), s=studentById(id);
 if(!s){box.innerHTML='<div class="daily-note">Student not found. Check the ID or name.</div>';return;}
 const t=tutorStatsForStudent(s.id), p=periodStatsForStudent(s.id), m=movementStatsForStudent(s.id);
 let recent='<div class="mini-table"><table><thead><tr><th>Date</th><th>Tutor Hour</th></tr></thead><tbody>';
 t.recent.slice(-15).reverse().forEach(r=>recent+=`<tr><td>${esc(r[0])}</td><td>${r[1]?'<span class="badge present">PRESENT</span>':'<span class="badge absent">ABSENT</span>'}${r[1]?` <span class="small muted">${esc(r[1])}</span>`:''}</td></tr>`);
 recent+='</tbody></table></div>';
 box.innerHTML=`<div class="feature-card profile-head"><div><div class="profile-name">${esc(s.name)}</div><div class="muted">${esc(s.id)} • Year ${esc(getStudentYear(s))}</div></div><div><span class="kpi-pill">Tutor ${t.rate}%</span><span class="kpi-pill">Periods ${p.rate}%</span><span class="kpi-pill">Movements ${m.total}</span></div></div>
 <div class="feature-grid">
 <div class="feature-card"><div class="label">Tutor Hour</div><div class="value">${t.rate}%</div><div class="sub">${t.present}/${t.dates.length} recorded days</div></div>
 <div class="feature-card"><div class="label">Period Attendance</div><div class="value">${p.rate}%</div><div class="sub">${p.present}/${p.total} recorded periods</div></div>
 <div class="feature-card"><div class="label">Movement</div><div class="value">${m.total}</div><div class="sub">${m.outside} currently outside</div></div>
 <div class="feature-card"><div class="label">Attendance Status</div><div class="value">${t.dates.length<3?'NEW':t.rate>=90?'GOOD':t.rate>=75?'WATCH':'LOW'}</div><div class="sub">Based on recorded Tutor Hour days</div></div>
 </div>
 <div class="card"><h3>Recent Tutor Hour History</h3>${recent}</div>`;
}
function findStudentAnalytics(){
 const q=(document.getElementById('analyticsSearch').value||'').trim().toLowerCase();
 if(!q){document.getElementById('analyticsResult').innerHTML='<div class="daily-note">Enter a Student ID or name.</div>';return;}
 const matches=db.students.filter(s=>(s.id+' '+s.name).toLowerCase().includes(q));
 if(matches.length===1)renderStudentAnalytics(matches[0].id);
 else if(matches.length>1)document.getElementById('analyticsResult').innerHTML='<div class="daily-note"><strong>Multiple students found.</strong> Please enter a more specific ID or name.</div>';
 else document.getElementById('analyticsResult').innerHTML='<div class="daily-note">No matching student found.</div>';
}

function updateOverviewYearOptions(){
 const sel=document.getElementById('overviewYear'); if(!sel)return; const old=sel.value;
 const years=[...new Set(db.students.map(getStudentYear).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
 sel.innerHTML='<option value="">All years</option>'+years.map(y=>`<option value="${esc(y)}">${esc(y)}</option>`).join('');
 if(years.includes(old))sel.value=old;
}
function monthDates(month){
 if(!month)return schoolDates();
 const [y,m]=month.split('-').map(Number); if(!y||!m)return [];
 const out=[]; const days=new Date(y,m,0).getDate();
 for(let d=1;d<=days;d++){
   const date=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
   const dt=new Date(date+'T12:00:00');
   const day=dt.getDay();
   if(day!==0 && day!==6) out.push(date);
 }
 return out;
}
function renderClassOverview(){
 const year=document.getElementById('overviewYear')?.value||'';
 const month=document.getElementById('overviewMonth')?.value||'';
 const students=db.students.filter(s=>!year||getStudentYear(s)===year);
 const dates=monthDates(month);
 const rows=students.map(s=>{let total=0,present=0;for(const d of dates){const v=db.days[d]?.clockins?.[s.id];if(v){total++;present++;}}return {...s,total,present,rate:total?Math.round(present/total*100):0};}).sort((a,b)=>b.rate-a.rate||b.present-a.present||String(a.name).localeCompare(String(b.name)));
 const recordedDates=dates.filter(d=>{const c=db.days[d]?.clockins||{};return students.some(s=>c[s.id]);});
 let totalPossible=0,totalPresent=0; for(const d of recordedDates){for(const st of students){totalPossible++;if(db.days[d]?.clockins?.[st.id])totalPresent++;}}
 const avg=totalPossible?Math.round(totalPresent/totalPossible*100):0;
 document.getElementById('overviewStudents').textContent=students.length;
 document.getElementById('overviewRate').textContent=avg+'%';
 const best=rows.filter(r=>r.total>0)[0];
 document.getElementById('overviewBest').textContent=best?best.rate+'%':'—';
 document.getElementById('overviewBestSub').textContent=best?best.name:'No recorded Tutor Hour data';
 document.getElementById('overviewLow').textContent=rows.filter(r=>r.total>=3&&r.rate<75).length;
 let rh='<table><thead><tr><th>Rank</th><th>Student</th><th>ID</th><th>Year</th><th>Present</th><th>Recorded</th><th>Attendance</th><th>Status</th></tr></thead><tbody>';
 if(!rows.length)rh+='<tr><td colspan="8" class="muted">No students found.</td></tr>';
 rows.forEach((r,i)=>{const status=r.total<3?'NEW':r.rate>=90?'GOOD':r.rate>=75?'WATCH':'LOW';const cls=status==='GOOD'?'status-good':status==='WATCH'?'status-watch':status==='LOW'?'status-low':'';rh+=`<tr><td class="rank-number">${i+1}</td><td><strong>${esc(r.name)}</strong></td><td>${esc(r.id)}</td><td>${esc(getStudentYear(r))}</td><td>${r.present}</td><td>${r.total}</td><td><div class="attendance-bar"><span style="width:${Math.min(100,r.rate)}%"></span></div><strong>${r.rate}%</strong></td><td class="${cls}">${status}</td></tr>`;});
 rh+='</tbody></table>';document.getElementById('overviewRanking').innerHTML=rh;
 let dh='<table><thead><tr><th>Date</th><th>Day</th><th>Present</th><th>Absent</th><th>Attendance</th><th>Status</th></tr></thead><tbody>';
 if(!dates.length)dh+='<tr><td colspan="6" class="muted">No dates available.</td></tr>';
 let currentWeek='';
 dates.forEach(d=>{
   const dt=new Date(d+'T12:00:00');
   const dayName=dt.toLocaleDateString(undefined,{weekday:'long'});
   const dayNum=dt.getDay();
   const monday=new Date(dt); monday.setDate(dt.getDate()-(dayNum===0?6:dayNum-1));
   const weekKey=monday.toISOString().slice(0,10);
   if(weekKey!==currentWeek){
     if(currentWeek) dh+='<tr class="week-divider"><td colspan="6"></td></tr>';
     const friday=new Date(monday); friday.setDate(monday.getDate()+4);
     const labelStart=monday.toLocaleDateString(undefined,{day:'2-digit',month:'short'});
     const labelEnd=friday.toLocaleDateString(undefined,{day:'2-digit',month:'short'});
     dh+=`<tr class="week-group-row"><td colspan="6">Monday – Friday: ${labelStart} – ${labelEnd}</td></tr>`;
     currentWeek=weekKey;
   }
   const day=db.days[d];const clock=day?.clockins||{};const recorded=students.filter(st=>clock[st.id]);const present=recorded.length;const has=present>0;const absent=has?Math.max(0,students.length-present):0;const rate=students.length?Math.round(present/students.length*100):0;
   dh+=`<tr class="week-day-row"><td>${esc(d)}</td><td>${dayName}</td><td class="day-present">${present}</td><td class="day-absent">${has?absent:'—'}</td><td>${has?rate+'%':'—'}</td><td>${has?'<span class="status-good">RECORDED</span>':'<span class="day-none">NO RECORD</span>'}</td></tr>`;
 });
 if(dates.length) dh+='<tr class="week-divider"><td colspan="6"></td></tr>';
 dh+='</tbody></table>';document.getElementById('overviewDaily').innerHTML=dh;
}
function exportClassOverviewCsv(){
 const year=document.getElementById('overviewYear')?.value||'';const month=document.getElementById('overviewMonth')?.value||'';const students=db.students.filter(s=>!year||getStudentYear(s)===year),dates=monthDates(month);
 const rows=[['Rank','Student ID','Student Name','Year','Present','Recorded Days','Attendance','Status']];
 students.map(s=>{let total=0,p=0;for(const d of dates){if(db.days[d]?.clockins?.[s.id]){total++;p++;}}return {...s,total,p,rate:total?Math.round(p/total*100):0};}).sort((a,b)=>b.rate-a.rate).forEach((r,i)=>rows.push([i+1,r.id,r.name,getStudentYear(r),r.p,r.total,r.rate+'%',r.total<3?'NEW':r.rate>=90?'GOOD':r.rate>=75?'WATCH':'LOW']));
 downloadCsv('class-attendance-overview.csv',rows);
}

function exportTutorCsv(){
 const rows=[['Date','Student ID','Student Name','Year','Tutor Hour Time','Status']];
 for(const d of schoolDates()) for(const s of db.students){
   const v=db.days[d]?.clockins?.[s.id]||'';
   rows.push([d,s.id,s.name,getStudentYear(s),v,v?'Present':'Absent']);
 }
 downloadCsv('tutor-hour-attendance.csv',rows);
}
function exportPeriodCsv(){
 const rows=[['Date','Period','Student ID','Student Name','Year','Status']];
 for(const d of schoolDates()) for(let p=1;p<=6;p++) for(const s of db.students){
   const rec=db.days[d]?.periods?.[p]; if(rec&&Object.prototype.hasOwnProperty.call(rec,s.id))
     rows.push([d,'Period '+p,s.id,s.name,getStudentYear(s),rec[s.id]===true?'Present':'Absent']);
 }
 downloadCsv('period-attendance.csv',rows);
}

document.querySelectorAll('.tabBtn').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('.tabBtn').forEach(x=>x.classList.remove('active'));b.classList.add('active');
 document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.getElementById(b.dataset.tab).classList.add('active');
 updatePrintCurrentPageButton();
});
function updatePrintCurrentPageButton(){
 const btn=document.getElementById('printCurrentPageBtn');
 if(!btn)return;
 const active=document.querySelector('.tabBtn.active');
 btn.style.display=(active && active.dataset.tab==='dataTransfer')?'none':'inline-block';
}
const printCurrentPageBtn=document.getElementById('printCurrentPageBtn');
if(printCurrentPageBtn) printCurrentPageBtn.onclick=()=>{
 const active=document.querySelector('.tabBtn.active');
 if(active && active.dataset.tab!=='dataTransfer') window.print();
};
updatePrintCurrentPageButton();
updateMovementOperatingHours();setInterval(updateMovementOperatingHours,30000);document.getElementById('clockDate').value=today();document.getElementById('movementDate').value=today();updateMovementClassOptions();document.getElementById('periodDate').value=today();updateClassOptions();document.getElementById('reportDate').value=today();updateReportClassOptions();updateWeeklyReportClassOptions();document.getElementById('weeklyReportDate').value=today();updateWeeklyReportClassOptions();document.getElementById('graphDate').value=today();
updateMovementRankingYearOptions(); renderMovementRanking();
document.getElementById('movementRankYear').onchange=renderMovementRanking; document.getElementById('movementRankRefresh').onclick=()=>{updateMovementRankingYearOptions();renderMovementRanking();};
document.getElementById('movementYear').onchange=()=>{updateMovementStudentOptions();renderMovements();updateMovementRankingYearOptions();renderMovementRanking()};document.getElementById('movementDate').onchange=renderMovements;document.getElementById('movementOutBtn').onclick=recordMovementOut;document.getElementById('movementRefreshBtn').onclick=refreshMovementData;document.getElementById('movementPrintBtn').onclick=printMovementRegister;document.getElementById('movementDeleteDateBtn').onclick=deleteSelectedMovementData;
document.getElementById('clockBtn').onclick=clockIn;
document.getElementById('studentIdClock').addEventListener('keydown',e=>{if(e.key==='Enter')clockIn();});document.getElementById('closeTutorBtn').onclick=finalizeTutor;
document.getElementById('studentIdClock').addEventListener('keydown',e=>{if(e.key==='Enter')clockIn()});
document.getElementById('clockDate').onchange=()=>{renderClock();updateClockStudentPreview()};
document.getElementById('studentIdClock').addEventListener('input',updateClockStudentPreview);
document.getElementById('tutorSearch').addEventListener('input',renderClock);
document.getElementById('addStudent').onclick=addStudent;document.getElementById('addTeacher').onclick=addTeacher;
document.getElementById('reportClass').onchange=buildReport;document.getElementById('periodDate').onchange=()=>{refreshPeriodLockUI();renderSixPeriodExceptionSummary();};document.getElementById('periodClass').onchange=()=>{updateTeacherOptions();refreshPeriodLockUI();renderSixPeriodExceptionSummary();};document.getElementById('periodNo').onchange=()=>{refreshPeriodLockUI();};document.getElementById('loadPeriod').onclick=loadPeriod;document.getElementById('buildReport').onclick=buildReport;document.getElementById('buildWeeklyReport').onclick=buildWeeklyReport;buildWeeklyReport();
let lastActivePeriod=-1;
function autoAdvancePeriod(active){
  const sel=document.getElementById('periodNo');
  if(!sel)return;
  if(active>=1&&active<=6){
    // The finished period is automatically closed and the next active period is selected.
    sel.value=String(active);
    refreshPeriodLockUI();
    loadPeriod();
    const msg=document.getElementById('periodMsg');
    if(msg) msg.textContent='Period '+active+' is now ACTIVE automatically. The previous period is closed and cannot be edited.';
  }else{
    refreshPeriodLockUI();
    const box=document.getElementById('periodAttendance');
    if(box)box.innerHTML='<div class="daily-note"><strong>Attendance entry is locked.</strong><br>No Year period is active right now. The previous period is closed automatically. The next period will open automatically at its scheduled start time.</div>';
  }
}
setInterval(()=>{
  renderClock();
  const active=activePeriodNow();
  if(active!==lastActivePeriod){
    lastActivePeriod=active;
    autoAdvancePeriod(active);
  }
},1000);

function updateTransferYearOptions(){
 const sel=document.getElementById('transferYear'); if(!sel)return; const old=sel.value;
 const classes=[...new Set(db.students.map(getStudentYear).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
 sel.innerHTML='<option value="">Select year</option>'+classes.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
 if(classes.includes(old))sel.value=old;
}
function downloadJson(filename,payload){const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function updateBestClockinClassOptions(){
 const sel=document.getElementById('bestClockinClass'); if(!sel)return;
 const old=sel.value;
 const classes=[...new Set(db.students.map(getStudentYear).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
 sel.innerHTML='<option value="">All years</option>'+classes.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
 if(classes.includes(old))sel.value=old;
}
function generateBestClockins(){
 const cl=document.getElementById('bestClockinClass')?.value||'';
 const students=db.students.filter(s=>!cl||getStudentYear(s)===cl);
 const totals=students.map(s=>{
   let total=0;
   for(const day of Object.values(db.days||{})) if(day&&day.clockins&&day.clockins[s.id]) total++;
   return {...s,total};
 }).sort((a,b)=>b.total-a.total||String(a.name||'').localeCompare(String(b.name||'')));
 const box=document.getElementById('bestClockinsTable'),msg=document.getElementById('bestClockinsMsg');
 if(!students.length){box.innerHTML='<p class="muted">No students found.</p>';if(msg)msg.textContent='';return;}
 let h='<div class="table-wrap"><table><thead><tr><th>Rank</th><th>Student</th><th>Student ID</th><th>Year</th><th>Total Tutor Hour Clock-Ins</th></tr></thead><tbody>';
 totals.forEach((s,i)=>{
   const first=i===0;
   const rank=first?'🥇':String(i+1);
   const award=first?'<span class=\"best-award\"><span class=\"best-award-icon\">🏆</span> Overall Best Clock-In</span>':'';
   h+=`<tr class=\"${first?'best-rank-one':''}\"><td><span class=\"best-rank-medal\">${rank}</span></td><td><strong>${esc(s.name||'Unnamed Student')}</strong>${award}</td><td>${esc(s.id||'')}</td><td>${esc(getStudentYear(s))}</td><td><strong>${s.total}</strong></td></tr>`;
 });
 h+='</tbody></table></div>';
 box.innerHTML=h;
 if(msg)msg.textContent=`${totals.length} student${totals.length===1?'':'s'} ranked from highest to lowest.`;
}
function exportSchoolData(){downloadJson('school-register-school-data.json',{format:'School Register Data',version:1,exportedAt:new Date().toISOString(),scope:'school',db});const m=document.getElementById('transferMsg');if(m)m.textContent='School data exported successfully.';}
async function exportTutorClockins(){const year=document.getElementById('transferYear')?.value||'';if(!year){alert('Select a year first.');return;}const ids=new Set(db.students.filter(s=>getStudentYear(s)===year).map(s=>s.id)),students=db.students.filter(s=>getStudentYear(s)===year),clockins={};for(const [date,src] of Object.entries(db.days||{})){const dayClockins={};for(const [id,time] of Object.entries((src&&src.clockins)||{})){if(ids.has(id))dayClockins[id]=time;}if(Object.keys(dayClockins).length)clockins[date]=dayClockins;}if(!Object.keys(clockins).length){alert('No Tutor Hour clock-ins found for '+year+'.');return;}const payload={format:'School Register Data',version:2,exportedAt:new Date().toISOString(),scope:'tutor-hour-clockins',year:year,students,clockins};const filename='school-register-'+year.replace(/[^a-z0-9]+/gi,'_')+'-tutor-hour-clock-ins.json';const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const file=new File([blob],filename,{type:'application/json'});const m=document.getElementById('transferMsg');try{if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:'Tutor Hour Clock-In',text:'School Register Tutor Hour clock-in data — send this file to the receiving teacher.',files:[file]});if(m)m.textContent='Tutor Hour clock-in file ready for Bluetooth/Nearby Share or another sharing method.';return;}}catch(e){if(e&&e.name==='AbortError'){if(m)m.textContent='Transfer cancelled.';return;}}downloadJson(filename,payload);if(m)m.textContent='Direct sharing is unavailable on this browser. The importable JSON file was downloaded; use Bluetooth file sharing to send it, then import it on the other device.';}
function exportClassroomData(){const year=document.getElementById('transferYear')?.value||'';if(!year){alert('Select a year first.');return;}const ids=new Set(db.students.filter(s=>getStudentYear(s)===year).map(s=>s.id));const students=db.students.filter(s=>getStudentYear(s)===year),teachers=db.teachers.filter(t=>getTeacherYear(t)===year),days={};for(const [date,src] of Object.entries(db.days||{})){const day={clockins:{},closed:!!src.closed,periods:{},movements:[]};for(const id of Object.keys(src.clockins||{}))if(ids.has(id))day.clockins[id]=src.clockins[id];for(let p=1;p<=6;p++){const rec=src.periods?.[p]||{},out={};for(const id of Object.keys(rec))if(ids.has(id))out[id]=rec[id];if(Object.keys(out).length)day.periods[p]=out;}day.movements=(src.movements||[]).filter(m=>ids.has(m.studentId));if(Object.keys(day.clockins).length||Object.keys(day.periods).length||day.movements.length||day.closed)days[date]=day;}downloadJson('school-register-'+year.replace(/[^a-z0-9]+/gi,'_')+'-classroom-data.json',{format:'School Register Data',version:1,exportedAt:new Date().toISOString(),scope:'classroom',year:year,students,teachers,days});const m=document.getElementById('transferMsg');if(m)m.textContent='Classroom data exported for '+year+'.';}
function mergeImportedData(payload){
 if(!payload||payload.format!=='School Register Data'||(!payload.db&&payload.scope!=='classroom'&&payload.scope!=='tutor-hour-clockins'))throw new Error('Invalid School Register data file.');
 if(payload.scope==='tutor-hour-clockins'){
   const incomingStudents=payload.students||[];
   for(const st of incomingStudents){const i=db.students.findIndex(x=>x.id===st.id);if(i<0)db.students.push(st);}
   for(const [date,src] of Object.entries(payload.clockins||{})){const dst=ensureDay(date);Object.assign(dst.clockins,src||{});}
   save();return;
 }
 const incoming=payload.scope==='school'?payload.db:payload;
 for(const s of incoming.students||[]){const i=db.students.findIndex(x=>x.id===s.id);if(i>=0)db.students[i]={...db.students[i],...s};else db.students.push(s);}
 for(const t of incoming.teachers||[]){const i=db.teachers.findIndex(x=>x.id===t.id);if(i>=0)db.teachers[i]={...db.teachers[i],...t};else db.teachers.push(t);}
 for(const [date,src] of Object.entries(incoming.days||{})){
   const dst=ensureDay(date); if(src.closed)dst.closed=true;
   Object.assign(dst.clockins,src.clockins||{});
   for(let p=1;p<=6;p++){if(src.periods?.[p]){if(!dst.periods[p])dst.periods[p]={};Object.assign(dst.periods[p],src.periods[p]);}}
   const existing=new Set((dst.movements||[]).map(m=>m.id));
   for(const m of (src.movements||[]))if(!existing.has(m.id))dst.movements.push(m);
 }
 save();
}
function resetAndDeleteAllData(){
 const confirmed=confirm('RESET & DELETE ALL DATA?\\n\\nThis will permanently remove all registered students, teachers, tutor-hour clock-ins, period attendance, movement/exit records, reports, and saved school-register data from this device.\\n\\nThis cannot be undone. Continue?');
 if(!confirmed)return;
 const finalConfirm=confirm('FINAL CONFIRMATION\\n\\nDelete ALL School Register data now?');
 if(!finalConfirm)return;
 try{
   localStorage.removeItem(KEY);
   db={students:[],teachers:[],days:{}};
   alert('All School Register data has been reset and deleted from this device.');
   location.reload();
 }catch(e){
   alert('Data reset failed: '+e.message);
 }
}
function importDataFile(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{mergeImportedData(JSON.parse(r.result));updateTransferYearOptions();
renderStudents();renderTeachers();updateClassOptions();updateMovementClassOptions();updateMovementStudentOptions();updateReportClassOptions();updateWeeklyReportClassOptions();updateGraphClassOptions();renderClock();refreshPeriodLockUI();renderSixPeriodExceptionSummary();renderMovements();buildReport();generateTutorPeriodGraph();const m=document.getElementById('transferMsg');if(m)m.textContent='Data imported and merged successfully.';}catch(e){alert('Import failed: '+e.message);}};r.readAsText(file);}
renderStudents();renderTeachers();updateClassOptions();updateTransferYearOptions();updateBestClockinClassOptions();generateBestClockins();updateMovementClassOptions();updateReportClassOptions();updateWeeklyReportClassOptions();updateGraphClassOptions();renderClock();refreshPeriodLockUI();lastActivePeriod=activePeriodNow();renderSixPeriodExceptionSummary();renderMovements();buildReport();document.getElementById('buildBestClockins').onclick=generateBestClockins;
document.getElementById('dashRefresh').onclick=renderDashboard;
document.getElementById('analyticsFind').onclick=findStudentAnalytics;
document.getElementById('analyticsClear').onclick=()=>{document.getElementById('analyticsSearch').value='';document.getElementById('analyticsResult').innerHTML='';};
document.getElementById('analyticsSearch').addEventListener('keydown',e=>{if(e.key==='Enter')findStudentAnalytics();});
document.getElementById('exportTutorCsv').onclick=exportTutorCsv;
document.getElementById('exportPeriodCsv').onclick=exportPeriodCsv;
document.getElementById('bestClockinClass').onchange=generateBestClockins;document.getElementById('exportSchoolData').onclick=exportSchoolData;document.getElementById('exportClassData').onclick=exportClassroomData;document.getElementById('exportTutorClockins').onclick=exportTutorClockins;document.getElementById('importDataBtn').onclick=()=>document.getElementById('importDataFile').click();document.getElementById('resetAllDataBtn').onclick=resetAndDeleteAllData;document.getElementById('importDataFile').onchange=e=>importDataFile(e.target.files[0]);document.getElementById('generateGraph').onclick=generateTutorPeriodGraph;document.getElementById('graphDate').onchange=generateTutorPeriodGraph;document.getElementById('graphClass').onchange=generateTutorPeriodGraph;generateTutorPeriodGraph();window.addEventListener('afterprint',()=>document.body.classList.remove('printing-movement'));
// Final Year selector synchronization: Daily Attendance Report, Monday–Friday Report, Year Periods, Graphs and Students use the registered student Year.
function syncAllYearSelectors(){ updateClassOptions(); updateMovementClassOptions(); updateReportClassOptions(); updateWeeklyReportClassOptions(); updateGraphClassOptions(); updateTransferYearOptions(); updateBestClockinClassOptions(); }
syncAllYearSelectors();
renderDashboard();

updateOverviewYearOptions();
document.getElementById('overviewMonth').value=today().slice(0,7);
document.getElementById('overviewRefresh').onclick=renderClassOverview;
document.getElementById('overviewYear').onchange=renderClassOverview;
document.getElementById('overviewMonth').onchange=renderClassOverview;
document.getElementById('overviewPrint').onclick=()=>window.print();
document.getElementById('overviewCsv').onclick=exportClassOverviewCsv;
renderClassOverview();
setInterval(()=>{renderDashboard();},1000);
