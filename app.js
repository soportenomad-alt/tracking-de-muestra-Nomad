// Actualizado con 'Comentarios Plataforma Track 21-04-2026.docx'. Conserva la funcionalidad previa y agrega los nuevos paneles Cordex.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const STORAGE_KEY = 'nomad_tracker_v5';
const COLLECTION_NAME = 'tracks';

const firebaseConfig = {
  apiKey: 'AIzaSyCt-jjPPowg2rWffoz0aeUo6bkhHaisTFg',
  authDomain: 'tracking-nomad.firebaseapp.com',
  projectId: 'tracking-nomad',
  storageBucket: 'tracking-nomad.firebasestorage.app',
  messagingSenderId: '735736477673',
  appId: '1:735736477673:web:e016d70bd963141bc0bd78'
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const BIOMARKERS_BY_FAMILY = {
  foundationone: ['PD-L1'],
  tempus: ['PD-L1 22C3', 'PD-L1 SP142', 'PD-L1 SP263', 'PD-L1 28-8', 'MMR', 'HER2 + FISH', 'FOLR1', 'CLDN18 FDA', 'MGMT Methylation', '1p19q FISH', 'c-Met FDA'],
  cordex: ['PD-L1', 'HER2']
};

const ALGORITHMS_TEMPUS = ['HRD', 'DPYD', 'UGT1A1', 'Tumor Origin', 'Immune Profile Score'];

const FLOW_BY_SAMPLE = {
  sangre: {
    label: 'Sangre',
    dateFields: [
      { id: 'sampleDate1', label: 'Fecha de colecta' }
    ],
    tests: [
      { value: 'FoundationOne Liquid CDx', biomarkerGroup: null, algorithm: false },
      { value: 'Tempus xF', biomarkerGroup: null, algorithm: false },
      { value: 'Tempus xF+', biomarkerGroup: null, algorithm: false },
      { value: 'Invitae Multicancer Panel', biomarkerGroup: null, algorithm: false },
      { value: 'Guardant Reveal', biomarkerGroup: null, algorithm: false },
      { value: 'Guardant 360', biomarkerGroup: null, algorithm: false },
      { value: 'Cordex 1021 Liquid + PGx', biomarkerGroup: null, algorithm: false }
    ],
    stages: [
      { id: 'pedido', title: 'Servicio pedido', desc: 'La prueba fue registrada y se generó la orden.' },
      { id: 'validacion', title: 'Validación', desc: 'Se valida la calidad, cantidad y viabilidad de la muestra o del material recibido.' },
      { id: 'transito', title: 'Muestra en tránsito', desc: 'Seguimiento logístico de la muestra: en tránsito o entregada.' },
      { id: 'curso', title: 'Pruebas en curso', desc: 'El laboratorio ya trabaja la muestra o solicita acción adicional.' },
      { id: 'informe', title: 'Informe', desc: 'Estado final de liberación del resultado.' }
    ]
  },
  tejido: {
    label: 'Tejido',
    dateFields: [
      { id: 'sampleDate1', label: 'Fecha de biopsia' }
    ],
    tests: [
      { value: 'FoundationOne CDx', biomarkerGroup: 'foundationone', algorithm: false },
      { value: 'FoundationOne CDx HEME', biomarkerGroup: 'foundationone', algorithm: false },
      { value: 'Tempus xT', biomarkerGroup: 'tempus', algorithm: true },
      { value: 'Cordex500 xT', biomarkerGroup: 'cordex', algorithm: false },
      { value: 'Cordex40 Tiroides', biomarkerGroup: 'cordex', algorithm: false },
      { value: 'Cordex40 Mama', biomarkerGroup: 'cordex', algorithm: false },
      { value: 'Cordex40 Colorectal', biomarkerGroup: 'cordex', algorithm: false },
      { value: 'Cordex40 Pulmón', biomarkerGroup: 'cordex', algorithm: false },
      { value: 'Cordex40 Gástrico', biomarkerGroup: 'cordex', algorithm: false },
      { value: 'Cordex40 Gastrointestinal', biomarkerGroup: 'cordex', algorithm: false },
      { value: 'Cordex40 Vejiga', biomarkerGroup: 'cordex', algorithm: false },
      { value: 'Cordex40 Colangiocarcinoma', biomarkerGroup: 'cordex', algorithm: false },
      { value: 'Cordex40 Endometrio', biomarkerGroup: 'cordex', algorithm: false }
    ],
    stages: [
      { id: 'pedido', title: 'Servicio pedido', desc: 'La prueba fue registrada y se generó la orden.' },
      { id: 'validacion', title: 'Validación', desc: 'Se valida la calidad, cantidad y viabilidad del material.' },
      { id: 'transito', title: 'Muestra en tránsito', desc: 'Seguimiento logístico de la muestra: en tránsito o entregada.' },
      { id: 'curso', title: 'Pruebas en curso', desc: 'El laboratorio ya trabaja la muestra o solicita acción adicional.' },
      { id: 'informe', title: 'Informe', desc: 'Estado final de liberación del resultado.' }
    ]
  },
  tejido_sangre: {
    label: 'Tejido y sangre',
    dateFields: [
      { id: 'sampleDate1', label: 'Fecha de biopsia' },
      { id: 'sampleDate2', label: 'Fecha de toma' }
    ],
    tests: [
      { value: 'Tempus xT + Xr (Normal Match)', biomarkerGroup: 'tempus', algorithm: true },
      { value: 'Cordex40 Mama + BRCA', biomarkerGroup: 'cordex', algorithm: false }
    ],
    stages: [
      { id: 'pedido', title: 'Servicio pedido', desc: 'La prueba fue registrada y se generó la orden.' },
      { id: 'validacion', title: 'Validación', desc: 'Se valida la muestra de tejido, sangre y el soporte del caso.' },
      { id: 'transito', title: 'Muestra en tránsito', desc: 'Seguimiento logístico de las muestras: en tránsito o entregadas.' },
      { id: 'curso', title: 'Pruebas en curso', desc: 'El laboratorio ya trabaja la muestra o solicita acción adicional.' },
      { id: 'informe', title: 'Informe', desc: 'Estado final de liberación del resultado.' }
    ]
  }
};

const STAGE_STATUS_OPTIONS = {
  default: [
    { value: '', label: 'Seleccionar estatus' },
    { value: 'cancelada', label: 'Cancelada' }
  ],
  pedido: [
    { value: '', label: 'Seleccionar estatus' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' }
  ],
  validacion: [
    { value: '', label: 'Seleccionar estatus' },
    { value: 'en_revision', label: 'En revisión' },
    { value: 'valida', label: 'Válida' },
    { value: 'no_valida', label: 'No válida' },
    { value: 'cancelada', label: 'Cancelada' }
  ],
  transito: [
    { value: '', label: 'Seleccionar estatus' },
    { value: 'en_transito', label: 'En tránsito' },
    { value: 'enviada', label: 'Enviada' },
    { value: 'entregada', label: 'Entregada' },
    { value: 'retraso_aduana', label: 'Retraso de aduana' },
    { value: 'cancelada', label: 'Cancelada' }
  ],
  curso: [
    { value: '', label: 'Seleccionar estatus' },
    { value: 'en_curso', label: 'En curso' },
    { value: 'nueva_muestra', label: 'Se solicita nueva muestra' },
    { value: 'cancelada', label: 'Cancelada' }
  ],
  informe: [
    { value: '', label: 'Seleccionar estatus' },
    { value: 'fallido', label: 'Fallido' },
    { value: 'entregado', label: 'Entregado' },
    { value: 'cancelada', label: 'Cancelada' }
  ]
};

const STAGE_ICONS = {
  pedido: '🛒',
  validacion: '🔬',
  transito: '📦',
  curso: '🧪',
  informe: '📄'
};

const els = {
  orderNumber: document.getElementById('orderNumber'),
  eta: document.getElementById('eta'),
  patientName: document.getElementById('patientName'),
  doctor: document.getElementById('doctor'),
  requestingDoctor: document.getElementById('requestingDoctor'),
  paymentType: document.getElementById('paymentType'),
  sampleType: document.getElementById('sampleType'),
  testType: document.getElementById('testType'),
  biomarker: document.getElementById('biomarker'),
  algorithm: document.getElementById('algorithm'),
  biomarkerWrap: document.getElementById('biomarkerWrap'),
  algorithmWrap: document.getElementById('algorithmWrap'),
  dynamicDates: document.getElementById('dynamicDates'),
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
  pvPatient: document.getElementById('pvPatient'),
  pvPayment: document.getElementById('pvPayment'),
  pvDoctor: document.getElementById('pvDoctor')
};

let editingId = null;
let records = loadRecords();
let selectedBiomarkers = [];
let selectedAlgorithms = [];
let isSyncing = false;

function normalizeArrayValue(value){
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) return value.split(/\s*\|\s*/).map(v => v.trim()).filter(Boolean);
  return [];
}
function renderMultiSelect(container, options, selectedValues){
  const selected = new Set(normalizeArrayValue(selectedValues));
  container.innerHTML = '';
  if (!options || !options.length){
    container.innerHTML = '<div class="multi-select-placeholder">No aplica</div>';
    return;
  }
  const selectedWrap = document.createElement('div');
  selectedWrap.className = 'multi-selected';
  if (selected.size){
    Array.from(selected).forEach(value => {
      const chip = document.createElement('span');
      chip.className = 'selected-chip';
      chip.textContent = value;
      selectedWrap.appendChild(chip);
    });
  } else {
    selectedWrap.innerHTML = '<span class="multi-select-placeholder">Puedes seleccionar uno o varios.</span>';
  }
  const optionsWrap = document.createElement('div');
  optionsWrap.className = 'multi-select-options';
  options.forEach(optionText => {
    const label = document.createElement('label');
    label.className = 'multi-option';
    label.innerHTML = `<input type="checkbox" value="${escapeHtml(optionText)}" ${selected.has(optionText) ? 'checked' : ''}> <span>${optionText}</span>`;
    optionsWrap.appendChild(label);
  });
  container.appendChild(selectedWrap);
  container.appendChild(optionsWrap);
}
function getMultiSelectValues(container){
  return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(input => input.value.trim()).filter(Boolean);
}
function bindMultiSelect(container, options, getSelected, onChange){
  container.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', () => {
      const values = getMultiSelectValues(container);
      onChange(values);
      renderMultiSelect(container, options, getSelected());
      bindMultiSelect(container, options, getSelected, onChange);
    });
  });
}

function loadRecords(){
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return raw.map(normalizeRecordStages);
  } catch {
    return [];
  }
}

function saveRecordsLocal(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function normalizeStageForTransit(stage){
  if (!stage) return null;
  const normalized = { ...stage };
  if (normalized.status === 'completada') normalized.status = 'entregada';
  return normalized;
}

function normalizeRecordStages(record){
  const config = FLOW_BY_SAMPLE[record?.sampleType];
  if (!config || !Array.isArray(record?.stages)) return record;

  const current = record.stages;
  const oldPattern = current.some(stage => ['patologia', 'entregada'].includes(stage?.id)) || (record.sampleType === 'sangre' && current[1]?.id === 'transito');
  if (!oldPattern) {
    return {
      ...record,
      stages: config.stages.map((stage, index) => ({ ...stage, ...(current[index] || {}) }))
    };
  }

  let migratedStages;
  if (record.sampleType === 'sangre') {
    const pedido = current[0] || {};
    const transitoViejo = current[1] || {};
    const entregadaVieja = current[2] || {};
    const curso = current[3] || {};
    const informe = current[4] || {};
    const transitoFusionado = normalizeStageForTransit(
      entregadaVieja.status || entregadaVieja.date || entregadaVieja.owner || entregadaVieja.comment ? entregadaVieja : transitoViejo
    ) || {};
    migratedStages = [
      { ...config.stages[0], ...pedido },
      { ...config.stages[1] },
      { ...config.stages[2], ...transitoFusionado },
      { ...config.stages[3], ...curso },
      { ...config.stages[4], ...informe }
    ];
  } else {
    const pedido = current[0] || {};
    const validacionVieja = current[1] || {};
    const transitoViejo = normalizeStageForTransit(current[2] || {}) || {};
    const curso = current[3] || {};
    const informe = current[4] || {};
    migratedStages = [
      { ...config.stages[0], ...pedido },
      { ...config.stages[1], ...validacionVieja },
      { ...config.stages[2], ...transitoViejo },
      { ...config.stages[3], ...curso },
      { ...config.stages[4], ...informe }
    ];
  }

  migratedStages = migratedStages.map((stage, index) => ({
    ...stage,
    id: config.stages[index].id,
    title: config.stages[index].title,
    desc: config.stages[index].desc
  }));

  return { ...record, stages: migratedStages };
}

function hydrateFirestoreRecord(docSnap){
  const data = docSnap.data() || {};
  return normalizeRecordStages({
    ...data,
    id: docSnap.id,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null)
  });
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
function titleCaseStatus(value){
  const map = Object.values(STAGE_STATUS_OPTIONS).flat().reduce((acc, item) => {
    if (item.value) acc[item.value] = item.label;
    return acc;
  }, {});
  return map[value] || 'Pendiente';
}
function iconForStage(stageId){
  return STAGE_ICONS[stageId] || '•';
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
function renderDynamicDates(sampleType, values = {}){
  const config = FLOW_BY_SAMPLE[sampleType];
  els.dynamicDates.innerHTML = '';
  if (!config) return;
  config.dateFields.forEach(field => {
    const label = document.createElement('label');
    label.innerHTML = `
      <span>${field.label}</span>
      <input id="${field.id}" type="date" value="${escapeHtml(values[field.id] || '')}">
    `;
    els.dynamicDates.appendChild(label);
    const input = label.querySelector('input');
    input.addEventListener('input', updatePreview);
    input.addEventListener('change', updatePreview);
  });
}
function updateTestOptions(sampleType, selectedTest = ''){
  const config = FLOW_BY_SAMPLE[sampleType];
  els.testType.innerHTML = '';
  if (!config){
    els.testType.innerHTML = '<option value="">Primero selecciona tipo de muestra</option>';
    updateAuxiliaryOptions();
    updatePreview();
    return;
  }
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Seleccionar prueba';
  els.testType.appendChild(defaultOption);
  config.tests.forEach(test => {
    const opt = document.createElement('option');
    opt.value = test.value;
    opt.textContent = test.value;
    els.testType.appendChild(opt);
  });
  els.testType.value = selectedTest;
  updateAuxiliaryOptions();
  updatePreview();
}
function getSelectedTestConfig(){
  const config = FLOW_BY_SAMPLE[els.sampleType.value];
  if (!config) return null;
  return config.tests.find(test => test.value === els.testType.value) || null;
}
function updateAuxiliaryOptions(record = null){
  const testConfig = getSelectedTestConfig();
  if (testConfig?.biomarkerGroup){
    selectedBiomarkers = normalizeArrayValue(record?.biomarkerList?.length ? record.biomarkerList : record?.biomarker);
    renderMultiSelect(els.biomarker, BIOMARKERS_BY_FAMILY[testConfig.biomarkerGroup] || [], selectedBiomarkers);
    bindMultiSelect(els.biomarker, BIOMARKERS_BY_FAMILY[testConfig.biomarkerGroup] || [], () => selectedBiomarkers, values => { selectedBiomarkers = values; });
    els.biomarkerWrap.hidden = false;
  } else {
    selectedBiomarkers = [];
    els.biomarker.innerHTML = '<div class="multi-select-placeholder">No aplica</div>';
    els.biomarkerWrap.hidden = true;
  }

  if (testConfig?.algorithm){
    selectedAlgorithms = normalizeArrayValue(record?.algorithmList?.length ? record.algorithmList : record?.algorithm);
    renderMultiSelect(els.algorithm, ALGORITHMS_TEMPUS, selectedAlgorithms);
    bindMultiSelect(els.algorithm, ALGORITHMS_TEMPUS, () => selectedAlgorithms, values => { selectedAlgorithms = values; });
    els.algorithmWrap.hidden = false;
  } else {
    selectedAlgorithms = [];
    els.algorithm.innerHTML = '<div class="multi-select-placeholder">No aplica</div>';
    els.algorithmWrap.hidden = true;
  }
}
function computeStageState(stage, currentIndex, index){
  if (stage.status === 'cancelada') return 'cancelled';
  if (stage.status && stage.status !== '') return 'done';
  return index === currentIndex ? 'current' : 'pending';
}
function renderFlowVisual(sampleType, previousStages = []){
  const config = FLOW_BY_SAMPLE[sampleType];
  if (!config){
    els.flowVisual.className = 'flow-visual empty-block';
    els.flowVisual.textContent = 'Selecciona tipo de muestra para mostrar el track visual.';
    return;
  }
  els.flowVisual.className = 'flow-visual';
  const completedCount = previousStages.filter(s => s.status && s.status !== 'cancelada').length;
  const currentIndex = Math.min(completedCount, config.stages.length - 1);
  const fill = config.stages.length > 1 ? ((Math.max(completedCount - 1, 0)) / (config.stages.length - 1)) * 100 : 0;
  els.flowVisual.innerHTML = `
    <div class="flow-track" style="--steps:${config.stages.length}">
      ${config.stages.map((stage, index) => {
        const data = previousStages[index] || {};
        const state = computeStageState(data, currentIndex, index);
        return `
          <article class="flow-step ${state}">
            <div class="flow-step-icon-wrap">
              <span class="flow-step-icon" aria-hidden="true">${iconForStage(stage.id)}</span>
            </div>
            <span class="flow-step-index">Paso ${index + 1}</span>
            <h4 class="flow-step-title">${stage.title}</h4>
            <p class="flow-step-sub">${stage.desc}</p>
            <span class="flow-step-status-label">${titleCaseStatus(data.status)}</span>
            <span class="flow-dot"></span>
          </article>
        `;
      }).join('')}
      <div class="flow-line"><div class="flow-line-fill" style="width:${fill}%"></div></div>
    </div>`;
}
function getStageOptions(stageId){
  return STAGE_STATUS_OPTIONS[stageId] || STAGE_STATUS_OPTIONS.default;
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
    node.querySelector('.stage-date').value = data.date || '';
    node.querySelector('.stage-owner').value = data.owner || '';
    node.querySelector('.stage-comment').value = data.comment || '';
    const statusSelect = node.querySelector('.stage-status');
    statusSelect.innerHTML = getStageOptions(stage.id).map(option => `<option value="${option.value}">${option.label}</option>`).join('');
    statusSelect.value = data.status || '';
    ['change','input'].forEach(evt => {
      node.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener(evt, () => {
          renderFlowVisual(sampleType, collectStageData());
        });
      });
    });
    els.stagesEditor.appendChild(node);
  });
  updateEditorLock();
}
function collectStageData(){
  return Array.from(els.stagesEditor.querySelectorAll('.stage-card')).map(card => ({
    id: card.dataset.stageId,
    title: card.querySelector('.stage-title').textContent,
    desc: card.querySelector('.stage-desc').textContent,
    status: card.querySelector('.stage-status').value,
    date: card.querySelector('.stage-date').value,
    owner: card.querySelector('.stage-owner').value.trim(),
    comment: card.querySelector('.stage-comment').value.trim()
  }));
}
function getDateFieldValue(id){
  return document.getElementById(id)?.value || '';
}
function updatePreview(){
  els.pvOrder.textContent = els.orderNumber.value.trim() || '—';
  els.pvTest.textContent = els.testType.value || '—';
  els.pvEta.textContent = els.eta.value ? formatDate(els.eta.value) : '—';
  els.pvPatient.textContent = els.patientName.value.trim() || '—';
  els.pvPayment.textContent = els.paymentType.value || '—';
  els.pvDoctor.textContent = els.requestingDoctor.value.trim() || '—';
}
function clearForm(){
  editingId = null;
  document.getElementById('caseForm').reset();
  renderDynamicDates('');
  updateTestOptions('');
  selectedBiomarkers = [];
  selectedAlgorithms = [];
  updateAuxiliaryOptions();
  renderFlowVisual('');
  renderStageEditor('');
  updatePreview();
  updateEditorLock();
}

async function upsertRecord(){
  if (!els.orderNumber.value.trim() || !els.patientName.value.trim() || !els.sampleType.value || !els.testType.value){
    alert('Completa número de orden, paciente, tipo de muestra y prueba.');
    return;
  }
  if (!canEdit()){
    alert('Solo Mario puede editar y guardar el track.');
    return;
  }

  const recordId = editingId || crypto.randomUUID();
  const existingRecord = records.find(r => r.id === recordId);
  const payload = {
    id: recordId,
    orderNumber: els.orderNumber.value.trim(),
    eta: els.eta.value,
    patientName: els.patientName.value.trim(),
    doctor: els.doctor.value.trim(),
    requestingDoctor: els.requestingDoctor.value.trim(),
    paymentType: els.paymentType.value,
    sampleType: els.sampleType.value,
    testType: els.testType.value,
    biomarkerList: els.biomarkerWrap.hidden ? [] : selectedBiomarkers,
    algorithmList: els.algorithmWrap.hidden ? [] : selectedAlgorithms,
    biomarker: els.biomarkerWrap.hidden ? '' : selectedBiomarkers.join(' | '),
    algorithm: els.algorithmWrap.hidden ? '' : selectedAlgorithms.join(' | '),
    sampleDates: {
      sampleDate1: getDateFieldValue('sampleDate1'),
      sampleDate2: getDateFieldValue('sampleDate2')
    },
    editorName: els.editorName.value.trim(),
    caseId: els.caseId.value.trim(),
    stages: collectStageData(),
    updatedAt: serverTimestamp(),
    createdAt: existingRecord?.createdAt || serverTimestamp()
  };

  try {
    els.saveBtn.disabled = true;
    await setDoc(doc(db, COLLECTION_NAME, recordId), payload, { merge: true });
    alert(existingRecord ? 'Seguimiento actualizado correctamente.' : 'Seguimiento guardado correctamente.');
    clearForm();
  } catch (error) {
    console.error('Error al guardar en Firebase:', error);
    alert('No se pudo guardar en Firebase. Revisa las reglas y la consola.');
  } finally {
    els.saveBtn.disabled = false;
  }
}
function recordMatches(record, term){
  if (!term) return true;
  const haystack = [record.orderNumber, record.patientName, record.testType, record.sampleType, record.caseId, record.doctor, record.requestingDoctor, record.paymentType].join(' ').toLowerCase();
  return haystack.includes(term.toLowerCase());
}
function renderSampleDates(record){
  const config = FLOW_BY_SAMPLE[record.sampleType];
  if (!config) return '';
  return config.dateFields
    .map(field => {
      const value = record.sampleDates?.[field.id];
      return value ? `<span class="tag soft-tag">${field.label}: ${formatDate(value)}</span>` : '';
    })
    .join('');
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
    node.querySelector('.sample-tag').textContent = FLOW_BY_SAMPLE[record.sampleType]?.label || record.sampleType;
    node.querySelector('.test-tag').textContent = record.testType;
    node.querySelector('.record-name').textContent = record.patientName;
    node.querySelector('.record-meta').textContent = `${record.orderNumber}${record.caseId ? ` · ${record.caseId}` : ''}${record.eta ? ` · ETA ${formatDate(record.eta)}` : ''}${record.requestingDoctor ? ` · Médico solicitante: ${record.requestingDoctor}` : ''}${record.paymentType ? ` · ${record.paymentType}` : ''}`;

    const extraTags = node.querySelector('.extra-tags');
    const biomarkerText = normalizeArrayValue(record.biomarkerList?.length ? record.biomarkerList : record.biomarker).join(', ');
    const algorithmText = normalizeArrayValue(record.algorithmList?.length ? record.algorithmList : record.algorithm).join(', ');
    if (biomarkerText) {
      extraTags.insertAdjacentHTML('beforeend', `<span class="tag soft-tag">Biomarcador: ${escapeHtml(biomarkerText)}</span>`);
    }
    if (algorithmText) {
      extraTags.insertAdjacentHTML('beforeend', `<span class="tag soft-tag">Algoritmo: ${escapeHtml(algorithmText)}</span>`);
    }
    extraTags.insertAdjacentHTML('beforeend', renderSampleDates(record));

    const miniTrack = node.querySelector('.mini-track');
    const doneCount = record.stages.filter(s => s.status && s.status !== 'cancelada').length;
    const currentIndex = Math.min(doneCount, record.stages.length - 1);
    record.stages.forEach((stage, index) => {
      const step = document.createElement('div');
      const state = computeStageState(stage, currentIndex, index);
      step.className = `mini-step ${state}`;
      step.innerHTML = `
        <p class="mini-step-title">${stage.title}</p>
        <p class="mini-step-meta">${titleCaseStatus(stage.status)}${stage.date ? ` · ${formatDate(stage.date)}` : ''}${stage.owner ? ` · ${escapeHtml(stage.owner)}` : ''}</p>
      `;
      miniTrack.appendChild(step);
    });

    const historyList = node.querySelector('.history-list');
    record.stages.filter(stage => stage.comment || stage.status || stage.date || stage.owner).forEach(stage => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <p class="history-item-title">${stage.title}</p>
        <p class="history-item-meta">${titleCaseStatus(stage.status)}${stage.date ? ` · ${formatDate(stage.date)}` : ''}${stage.owner ? ` · ${escapeHtml(stage.owner)}` : ''}</p>
        ${stage.comment ? `<div class="history-comment">${escapeHtml(stage.comment)}</div>` : ''}
      `;
      historyList.appendChild(item);
    });

    if (!historyList.children.length){
      historyList.innerHTML = '<div class="empty-message">Todavía no hay movimientos documentados en el histórico.</div>';
    }

    const footerDate = record.updatedAt ? new Date(record.updatedAt) : new Date();
    node.querySelector('.record-footer').textContent = `Última actualización: ${new Intl.DateTimeFormat('es-MX',{dateStyle:'medium', timeStyle:'short'}).format(footerDate)}`;
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
  els.requestingDoctor.value = record.requestingDoctor || '';
  els.paymentType.value = record.paymentType || '';
  els.sampleType.value = record.sampleType || '';
  renderDynamicDates(record.sampleType || '', record.sampleDates || {});
  updateTestOptions(record.sampleType || '', record.testType || '');
  updateAuxiliaryOptions(record);
  els.editorName.value = record.editorName || '';
  els.caseId.value = record.caseId || '';
  updatePreview();
  renderFlowVisual(record.sampleType, record.stages || []);
  renderStageEditor(record.sampleType, record.stages || []);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function deleteRecord(id){
  const record = records.find(r => r.id === id);
  if (!record) return;
  if (!confirm(`¿Eliminar el seguimiento ${record.orderNumber}?`)) return;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    if (editingId === id) clearForm();
  } catch (error) {
    console.error('Error al eliminar en Firebase:', error);
    alert('No se pudo eliminar en Firebase. Revisa las reglas y la consola.');
  }
}

function subscribeToRecords(){
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('updatedAt', 'desc'));
    onSnapshot(q, snapshot => {
      isSyncing = true;
      records = snapshot.docs.map(hydrateFirestoreRecord);
      saveRecordsLocal();
      renderRecords(els.searchInput.value.trim());
      isSyncing = false;
    }, error => {
      console.error('Error al leer Firebase:', error);
      renderRecords(els.searchInput.value.trim());
      alert('No se pudo leer Firebase. Verifica que Firestore esté creado y que las reglas permitan acceso.');
    });
  } catch (error) {
    console.error('Error al inicializar suscripción:', error);
  }
}

['orderNumber','eta','patientName','doctor','requestingDoctor','paymentType','testType'].forEach(key => {
  els[key].addEventListener('input', updatePreview);
  els[key].addEventListener('change', updatePreview);
});
els.sampleType.addEventListener('change', e => {
  renderDynamicDates(e.target.value);
  updateTestOptions(e.target.value);
  renderFlowVisual(e.target.value, []);
  renderStageEditor(e.target.value, []);
});
els.testType.addEventListener('change', () => {
  updateAuxiliaryOptions();
  updatePreview();
});
els.editorName.addEventListener('input', updateEditorLock);
els.saveBtn.addEventListener('click', upsertRecord);
els.resetBtn.addEventListener('click', clearForm);
els.searchInput.addEventListener('input', e => renderRecords(e.target.value.trim()));

updatePreview();
renderDynamicDates('');
updateTestOptions('');
updateAuxiliaryOptions();
renderFlowVisual('');
renderStageEditor('');
renderRecords();
updateEditorLock();
subscribeToRecords();
