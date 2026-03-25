const STORAGE_KEY = 'nomad_tracker_v3';

const FLOW_BY_SAMPLE = {
  tejido: {
    tests: ['Foundation One Heme', 'Foundation One CDx', 'Her2', 'Tempus xT'],
    stages: [
      { id: 'pedido', title: 'Servicio pedido', desc: 'La prueba fue registrada y se generó la orden.' },
      { id: 'patologia', title: 'Muestra en patología', desc: 'Patología valida calidad, cantidad y viabilidad del material.' },
      { id: 'entregada', title: 'Muestra entregada', desc: 'La muestra quedó formalmente preparada o entregada para continuar.' },
      { id: 'curso', title: 'Pruebas en curso', desc: 'El laboratorio ya trabaja la muestra y se sigue la fecha estimada.' },
      { id: 'listo', title: 'El informe está listo', desc: 'El resultado final fue liberado y compartido.' }
    ]
  },
  sangre: {
    tests: ['Foundation Liquid', 'Tempus xT + xR', 'Tempus xF', 'Tempus xF+', 'Invitae'],
    stages: [
      { id: 'pedido', title: 'Servicio pedido', desc: 'La prueba fue capturada y quedó lista para operar.' },
      { id: 'transito', title: 'Muestra en tránsito', desc: 'La muestra se encuentra en recolección o traslado.' },
      { id: 'entregada', title: 'Muestra entregada', desc: 'El laboratorio confirmó la recepción física.' },
      { id: 'curso', title: 'Pruebas en curso', desc: 'La muestra ya está en proceso analítico.' },
      { id: 'listo', title: 'El informe está listo', desc: 'El reporte final fue liberado.' }
    ]
  }
};


const STAGE_ICONS = {
  pedido: '🛒',
  transito: '📦',
  patologia: '🔬',
  entregada: '🧾',
  curso: '🧪',
  listo: '🏁'
};
function iconForStage(stageId){
  return STAGE_ICONS[stageId] || '•';
}

const els = {
  orderNumber: document.getElementById('orderNumber'),
  eta: document.getElementById('eta'),
  patientName: document.getElementById('patientName'),
  doctor: document.getElementById('doctor'),
  sampleType: document.getElementById('sampleType'),
  testType: document.getElementById('testType'),
  editorName: document.getElementById('editorName'),
  caseId: document.getElementById('caseId'),
  saveBtn: document.getElementById('saveBtn'),
  resetBtn: document.getElementById('resetBtn'),
  searchInput: document.getElementById('searchInput'),
  flowVisual: document.getElementById('flowVisual'),
  stagesEditor: document.getElementById('stagesEditor'),
  recordsList: document.getElementById('recordsList'),
  stageTemplate: document.getElementById('stageTemplate'),
  recordTemplate: document.getElementById('recordTemplate'),
  editorBadge: document.getElementById('editorBadge'),
  pvOrder: document.getElementById('pvOrder'),
  pvTest: document.getElementById('pvTest'),
  pvEta: document.getElementById('pvEta'),
  pvPatient: document.getElementById('pvPatient')
};

let editingId = null;
let records = loadRecords();

function loadRecords(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveRecords(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}
function escapeHtml(text){
  return (text || '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}
function formatDate(dateString){
  if (!dateString) return 'Sin fecha';
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(date);
}
function canEdit(){
  return (els.editorName.value || '').trim().toLowerCase() === 'mario';
}
function updateEditorLock(){
  const editable = canEdit();
  els.editorBadge.textContent = editable ? 'Edición habilitada para Mario' : 'Edición bloqueada';
  els.editorBadge.className = `editor-badge ${editable ? 'unlocked' : 'locked'}`;
  els.stagesEditor.querySelectorAll('input, textarea, select').forEach(el => {
    if (!el.classList.contains('stage-view-only')) el.disabled = !editable;
  });
}
function updateTestOptions(sampleType){
  const config = FLOW_BY_SAMPLE[sampleType];
  els.testType.innerHTML = '';
  if (!config){
    els.testType.innerHTML = '<option value="">Primero selecciona tipo de muestra</option>';
    updatePreview();
    return;
  }
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Seleccionar prueba';
  els.testType.appendChild(defaultOption);
  config.tests.forEach(test => {
    const opt = document.createElement('option');
    opt.value = test;
    opt.textContent = test;
    els.testType.appendChild(opt);
  });
  updatePreview();
}
function renderFlowVisual(sampleType, previousStages = []){
  const config = FLOW_BY_SAMPLE[sampleType];
  if (!config){
    els.flowVisual.className = 'flow-visual empty-block';
    els.flowVisual.textContent = 'Selecciona tipo de muestra para mostrar el track visual.';
    return;
  }
  els.flowVisual.className = 'flow-visual';
  const completedCount = previousStages.filter(s => s.done).length;
  const currentIndex = Math.min(completedCount, config.stages.length - 1);
  const fill = config.stages.length > 1 ? ((Math.max(completedCount - 1, 0)) / (config.stages.length - 1)) * 100 : 0;
  els.flowVisual.innerHTML = `
    <div class="flow-track" style="--steps:${config.stages.length}">
      ${config.stages.map((stage, index) => {
        const state = previousStages[index]?.done ? 'done' : index === currentIndex ? 'current' : 'pending';
        return `
          <article class="flow-step ${state}">
            <div class="flow-step-icon-wrap">
              <span class="flow-step-icon" aria-hidden="true">${iconForStage(stage.id)}</span>
            </div>
            <span class="flow-step-index">Paso ${index + 1}</span>
            <h4 class="flow-step-title">${stage.title}</h4>
            <p class="flow-step-sub">${stage.desc}</p>
            <span class="flow-dot"></span>
          </article>
        `;
      }).join('')}
      <div class="flow-line"><div class="flow-line-fill" style="width:${fill}%"></div></div>
    </div>`;
}
function renderStageEditor(sampleType, previousStages = []){
  const config = FLOW_BY_SAMPLE[sampleType];
  if (!config){
    els.stagesEditor.className = 'stages-editor empty-block';
    els.stagesEditor.textContent = 'Selecciona tipo de muestra para cargar las etapas editables.';
    return;
  }
  els.stagesEditor.className = 'stages-editor';
  els.stagesEditor.innerHTML = '';
  config.stages.forEach((stage, index) => {
    const node = els.stageTemplate.content.firstElementChild.cloneNode(true);
    const data = previousStages[index] || {};
    node.dataset.stageId = stage.id;
    node.querySelector('.stage-title').textContent = stage.title;
    node.querySelector('.stage-desc').textContent = stage.desc;
    node.querySelector('.stage-check').checked = Boolean(data.done);
    node.querySelector('.stage-date').value = data.date || '';
    node.querySelector('.stage-owner').value = data.owner || '';
    node.querySelector('.stage-comment').value = data.comment || '';
    node.querySelector('.stage-check').addEventListener('change', () => {
      renderFlowVisual(sampleType, collectStageData());
    });
    node.querySelector('.stage-date').addEventListener('change', () => renderFlowVisual(sampleType, collectStageData()));
    els.stagesEditor.appendChild(node);
  });
  updateEditorLock();
}
function collectStageData(){
  return Array.from(els.stagesEditor.querySelectorAll('.stage-card')).map(card => ({
    id: card.dataset.stageId,
    title: card.querySelector('.stage-title').textContent,
    desc: card.querySelector('.stage-desc').textContent,
    done: card.querySelector('.stage-check').checked,
    date: card.querySelector('.stage-date').value,
    owner: card.querySelector('.stage-owner').value.trim(),
    comment: card.querySelector('.stage-comment').value.trim()
  }));
}
function updatePreview(){
  els.pvOrder.textContent = els.orderNumber.value.trim() || '—';
  els.pvTest.textContent = els.testType.value || '—';
  els.pvEta.textContent = els.eta.value ? formatDate(els.eta.value) : '—';
  els.pvPatient.textContent = els.patientName.value.trim() || '—';
}
function clearForm(){
  editingId = null;
  document.getElementById('caseForm').reset();
  updateTestOptions('');
  renderFlowVisual('');
  renderStageEditor('');
  updatePreview();
  updateEditorLock();
}
function upsertRecord(){
  if (!els.orderNumber.value.trim() || !els.patientName.value.trim() || !els.sampleType.value || !els.testType.value){
    alert('Completa número de orden, paciente, tipo de muestra y prueba.');
    return;
  }
  if (!canEdit()){
    alert('Solo Mario puede editar y guardar el track.');
    return;
  }
  const payload = {
    id: editingId || crypto.randomUUID(),
    orderNumber: els.orderNumber.value.trim(),
    eta: els.eta.value,
    patientName: els.patientName.value.trim(),
    doctor: els.doctor.value.trim(),
    sampleType: els.sampleType.value,
    testType: els.testType.value,
    editorName: els.editorName.value.trim(),
    caseId: els.caseId.value.trim(),
    stages: collectStageData(),
    updatedAt: new Date().toISOString()
  };
  const existingIndex = records.findIndex(r => r.id === payload.id);
  if (existingIndex >= 0) records[existingIndex] = payload; else records.unshift(payload);
  saveRecords();
  renderRecords(els.searchInput.value.trim());
  alert(existingIndex >= 0 ? 'Seguimiento actualizado correctamente.' : 'Seguimiento guardado correctamente.');
  clearForm();
}
function recordMatches(record, term){
  if (!term) return true;
  const haystack = [record.orderNumber, record.patientName, record.testType, record.sampleType, record.caseId, record.doctor].join(' ').toLowerCase();
  return haystack.includes(term.toLowerCase());
}
function renderRecords(term=''){
  els.recordsList.innerHTML = '';
  const filtered = records.filter(record => recordMatches(record, term));
  if (!filtered.length){
    els.recordsList.innerHTML = '<div class="empty-message">No hay seguimientos guardados con esos criterios.</div>';
    return;
  }
  filtered.forEach(record => {
    const node = els.recordTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector('.sample-tag').textContent = record.sampleType;
    node.querySelector('.test-tag').textContent = record.testType;
    node.querySelector('.record-name').textContent = record.patientName;
    node.querySelector('.record-meta').textContent = `${record.orderNumber}${record.caseId ? ` · ${record.caseId}` : ''}${record.eta ? ` · ETA ${formatDate(record.eta)}` : ''}${record.doctor ? ` · ${record.doctor}` : ''}`;

    const miniTrack = node.querySelector('.mini-track');
    const doneCount = record.stages.filter(s => s.done).length;
    const currentIndex = Math.min(doneCount, record.stages.length - 1);
    record.stages.forEach((stage, index) => {
      const step = document.createElement('div');
      const state = stage.done ? 'done' : index === currentIndex ? 'current' : 'pending';
      step.className = `mini-step ${state}`;
      step.innerHTML = `
        <p class="mini-step-title">${stage.title}</p>
        <p class="mini-step-meta">${stage.date ? formatDate(stage.date) : 'Pendiente'}${stage.owner ? ` · ${escapeHtml(stage.owner)}` : ''}</p>
      `;
      miniTrack.appendChild(step);
    });

    const historyList = node.querySelector('.history-list');
    record.stages.filter(stage => stage.comment || stage.done || stage.date || stage.owner).forEach(stage => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <p class="history-item-title">${stage.title}</p>
        <p class="history-item-meta">${stage.date ? formatDate(stage.date) : 'Sin fecha'}${stage.owner ? ` · ${escapeHtml(stage.owner)}` : ''}${stage.done ? ' · Etapa completada' : ''}</p>
        ${stage.comment ? `<div class="history-comment">${escapeHtml(stage.comment)}</div>` : ''}
      `;
      historyList.appendChild(item);
    });

    if (!historyList.children.length){
      historyList.innerHTML = '<div class="empty-message">Todavía no hay movimientos documentados en el histórico.</div>';
    }

    node.querySelector('.record-footer').textContent = `Última actualización: ${new Intl.DateTimeFormat('es-MX',{dateStyle:'medium', timeStyle:'short'}).format(new Date(record.updatedAt))}`;
    node.querySelector('.open-record').addEventListener('click', () => openRecord(record.id));
    node.querySelector('.delete-record').addEventListener('click', () => deleteRecord(record.id));
    els.recordsList.appendChild(node);
  });
}
function openRecord(id){
  const record = records.find(r => r.id === id);
  if (!record) return;
  editingId = record.id;
  els.orderNumber.value = record.orderNumber || '';
  els.eta.value = record.eta || '';
  els.patientName.value = record.patientName || '';
  els.doctor.value = record.doctor || '';
  els.sampleType.value = record.sampleType || '';
  updateTestOptions(record.sampleType || '');
  els.testType.value = record.testType || '';
  els.editorName.value = record.editorName || '';
  els.caseId.value = record.caseId || '';
  updatePreview();
  renderFlowVisual(record.sampleType, record.stages || []);
  renderStageEditor(record.sampleType, record.stages || []);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function deleteRecord(id){
  const record = records.find(r => r.id === id);
  if (!record) return;
  if (!confirm(`¿Eliminar el seguimiento ${record.orderNumber}?`)) return;
  records = records.filter(r => r.id !== id);
  saveRecords();
  renderRecords(els.searchInput.value.trim());
  if (editingId === id) clearForm();
}

['orderNumber','eta','patientName','doctor','testType'].forEach(key => {
  els[key].addEventListener('input', updatePreview);
  els[key].addEventListener('change', updatePreview);
});
els.sampleType.addEventListener('change', e => {
  updateTestOptions(e.target.value);
  renderFlowVisual(e.target.value, []);
  renderStageEditor(e.target.value, []);
});
els.editorName.addEventListener('input', updateEditorLock);
els.testType.addEventListener('change', updatePreview);
els.saveBtn.addEventListener('click', upsertRecord);
els.resetBtn.addEventListener('click', clearForm);
els.searchInput.addEventListener('input', e => renderRecords(e.target.value.trim()));

updatePreview();
updateTestOptions('');
renderFlowVisual('');
renderStageEditor('');
renderRecords();
updateEditorLock();
