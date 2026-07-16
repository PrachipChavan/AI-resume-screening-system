// ==========================================================================
// API Configuration
// ==========================================================================
const API_BASE = window.location.protocol === 'file:' ? 'http://127.0.0.1:8000' : '';

// ==========================================================================
// Application State
// ==========================================================================
const state = {
    // Array of user-selected local File objects
    localFiles: [],
    // Array of server sample filenames (strings)
    selectedSamples: [],
    // All available samples loaded from the backend
    availableSamples: {
        job_descriptions: [],
        resumes: []
    },
    // Final screened candidates details mapped by filename/id
    screenedCandidates: {},
    // Currently active filters
    filters: {
        searchQuery: '',
        scoreLevel: 'all'
    }
};

// ==========================================================================
// DOM Elements
// ==========================================================================
const elements = {
    themeToggle: document.getElementById('theme-toggle'),
    infoBtn: document.getElementById('info-btn'),
    infoModal: document.getElementById('info-modal'),
    infoModalOverlay: document.getElementById('info-modal-overlay'),
    closeModalBtn: document.querySelector('.close-modal-btn'),
    
    apiKeyInput: document.getElementById('api-key-input'),
    toggleKeyVisibility: document.getElementById('toggle-key-visibility'),
    
    jdPresets: document.getElementById('jd-presets'),
    jdTextarea: document.getElementById('jd-textarea'),
    
    weightsAccordionTrigger: document.getElementById('weights-accordion-trigger'),
    weightsAccordionContent: document.getElementById('weights-accordion-content'),
    weightsAccordion: document.querySelector('.accordion'),
    
    skillsWeight: document.getElementById('skills-weight'),
    experienceWeight: document.getElementById('experience-weight'),
    educationWeight: document.getElementById('education-weight'),
    otherWeight: document.getElementById('other-weight'),
    skillsWeightVal: document.getElementById('skills-weight-val'),
    experienceWeightVal: document.getElementById('experience-weight-val'),
    educationWeightVal: document.getElementById('education-weight-val'),
    otherWeightVal: document.getElementById('other-weight-val'),
    weightWarning: document.getElementById('weight-sum-warning'),
    
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('file-input'),
    browseBtn: document.getElementById('browse-btn'),
    sampleResumesList: document.getElementById('sample-resumes-list'),
    
    queueContainer: document.getElementById('queue-container'),
    queueCount: document.getElementById('queue-count'),
    queueList: document.getElementById('queue-list'),
    clearQueueBtn: document.getElementById('clear-queue-btn'),
    startScreeningBtn: document.getElementById('start-screening-btn'),
    
    statTotal: document.getElementById('stat-total'),
    statAvg: document.getElementById('stat-avg'),
    statTop: document.getElementById('stat-top'),
    
    searchInput: document.getElementById('search-input'),
    scoreFilter: document.getElementById('score-filter'),
    resultsTable: document.getElementById('results-table'),
    resultsTbody: document.getElementById('results-tbody'),
    emptyState: document.getElementById('empty-state'),
    
    drawerOverlay: document.getElementById('drawer-overlay'),
    sideDrawer: document.getElementById('side-drawer'),
    closeDrawerBtn: document.getElementById('close-drawer-btn'),
    
    drawerAvatarLetters: document.getElementById('drawer-avatar-letters'),
    drawerCandidateName: document.getElementById('drawer-candidate-name'),
    drawerCurrentTitle: document.getElementById('drawer-current-title'),
    drawerEmailLink: document.getElementById('drawer-email-link'),
    drawerPhoneText: document.getElementById('drawer-phone-text'),
    drawerRecommendationBadge: document.getElementById('drawer-recommendation-badge'),
    drawerOverallScorePill: document.getElementById('drawer-overall-score-pill'),
    drawerSummaryText: document.getElementById('drawer-summary-text'),
    
    drawerSkillsScore: document.getElementById('drawer-skills-score'),
    drawerSkillsBar: document.getElementById('drawer-skills-bar'),
    drawerExperienceScore: document.getElementById('drawer-experience-score'),
    drawerExperienceBar: document.getElementById('drawer-experience-bar'),
    drawerEducationScore: document.getElementById('drawer-education-score'),
    drawerEducationBar: document.getElementById('drawer-education-bar'),
    
    drawerMatchedSkillsTags: document.getElementById('drawer-matched-skills-tags'),
    drawerMissingSkillsTags: document.getElementById('drawer-missing-skills-tags'),
    drawerStrengthsUl: document.getElementById('drawer-strengths-ul'),
    drawerWeaknessesUl: document.getElementById('drawer-weaknesses-ul'),
    drawerQuestionsDiv: document.getElementById('drawer-questions-div'),
    
    drawerDownloadJsonBtn: document.getElementById('drawer-download-json-btn'),
    drawerPrintBtn: document.getElementById('drawer-print-btn')
};

// ==========================================================================
// Initialization & API Config
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Info Modal
    elements.infoBtn.addEventListener('click', () => showModal(true));
    elements.closeModalBtn.addEventListener('click', () => showModal(false));
    elements.infoModalOverlay.addEventListener('click', () => showModal(false));
    
    // Toggle API Key visibility
    elements.toggleKeyVisibility.addEventListener('click', () => {
        const type = elements.apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
        elements.apiKeyInput.setAttribute('type', type);
        const icon = elements.toggleKeyVisibility.querySelector('i');
        icon.className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    });
    
    // Load API Key from local storage if saved previously
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        elements.apiKeyInput.value = savedKey;
    }
    elements.apiKeyInput.addEventListener('input', () => {
        localStorage.setItem('gemini_api_key', elements.apiKeyInput.value.trim());
    });
    
    // Load Presets & Server Samples
    fetchSamples();
    
    // Setup JD presets selector
    elements.jdPresets.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        const jd = state.availableSamples.job_descriptions.find(j => j.id === selectedId);
        if (jd) {
            elements.jdTextarea.value = jd.content;
            checkReadyToScreen();
        }
    });
    
    elements.jdTextarea.addEventListener('input', checkReadyToScreen);
    
    // Custom Weights Accordion
    elements.weightsAccordionTrigger.addEventListener('click', () => {
        elements.weightsAccordion.classList.toggle('active');
    });
    
    // Setup Weight Sliders
    const sliders = [elements.skillsWeight, elements.experienceWeight, elements.educationWeight, elements.otherWeight];
    sliders.forEach(slider => {
        slider.addEventListener('input', () => {
            updateWeightDisplay();
        });
    });
    updateWeightDisplay();
    
    // Setup Drag and Drop
    setupDragAndDrop();
    
    // Start Screening
    elements.startScreeningBtn.addEventListener('click', startScreening);
    
    // Clear Queue
    elements.clearQueueBtn.addEventListener('click', clearQueue);
    
    // Drawer handlers
    elements.closeDrawerBtn.addEventListener('click', () => showDrawer(false));
    elements.drawerOverlay.addEventListener('click', () => showDrawer(false));
    
    // Search & Filter
    elements.searchInput.addEventListener('input', handleSearchFilter);
    elements.scoreFilter.addEventListener('change', handleSearchFilter);
    
    // Detail buttons
    elements.drawerDownloadJsonBtn.addEventListener('click', downloadCandidateJson);
    elements.drawerPrintBtn.addEventListener('click', () => window.print());
}

// ==========================================================================
// Theme & Modal Handlers
// ==========================================================================
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    document.body.classList.toggle('dark-theme');
}

function showModal(show) {
    if (show) {
        elements.infoModal.classList.add('active');
        elements.infoModalOverlay.classList.add('active');
    } else {
        elements.infoModal.classList.remove('active');
        elements.infoModalOverlay.classList.remove('active');
    }
}

// ==========================================================================
// Load Presets from Server
// ==========================================================================
async function fetchSamples() {
    try {
        const response = await fetch(`${API_BASE}/api/samples`);
        if (!response.ok) throw new Error("Failed to load server samples.");
        
        const data = await response.json();
        state.availableSamples = data;
        
        // Populate JD presets dropdown
        elements.jdPresets.innerHTML = '<option value="" disabled selected>Choose a sample Job Profile...</option>';
        data.job_descriptions.forEach(jd => {
            const opt = document.createElement('option');
            opt.value = jd.id;
            opt.textContent = jd.title;
            elements.jdPresets.appendChild(opt);
        });
        
        // Populate Server Resumes badges
        elements.sampleResumesList.innerHTML = '';
        data.resumes.forEach(res => {
            const btn = document.createElement('button');
            btn.className = 'sample-badge-btn';
            btn.type = 'button';
            btn.innerHTML = `<i class="fa-solid fa-plus"></i> ${res.display_name}`;
            btn.addEventListener('click', () => toggleServerSample(res.filename, btn));
            elements.sampleResumesList.appendChild(btn);
        });
        
    } catch (e) {
        console.error(e);
        elements.sampleResumesList.innerHTML = '<span class="warning-text"><i class="fa-solid fa-circle-exclamation"></i> Offline: Call run.py first.</span>';
    }
}

// ==========================================================================
// Weight Sliders logic
// ==========================================================================
function updateWeightDisplay() {
    const s = parseInt(elements.skillsWeight.value);
    const x = parseInt(elements.experienceWeight.value);
    const ed = parseInt(elements.educationWeight.value);
    const o = parseInt(elements.otherWeight.value);
    
    elements.skillsWeightVal.textContent = `${s}%`;
    elements.experienceWeightVal.textContent = `${x}%`;
    elements.educationWeightVal.textContent = `${ed}%`;
    elements.otherWeightVal.textContent = `${o}%`;
    
    const sum = s + x + ed + o;
    if (sum !== 100) {
        elements.weightWarning.style.display = 'flex';
    } else {
        elements.weightWarning.style.display = 'none';
    }
}

function getNormalizedWeights() {
    const s = parseInt(elements.skillsWeight.value);
    const x = parseInt(elements.experienceWeight.value);
    const ed = parseInt(elements.educationWeight.value);
    const o = parseInt(elements.otherWeight.value);
    const total = s + x + ed + o;
    
    if (total === 100) {
        return { skills: s/100, experience: x/100, education: ed/100, other: o/100 };
    }
    
    // Normalize if sum is not 100
    return {
        skills: s / total,
        experience: x / total,
        education: ed / total,
        other: o / total
    };
}

// ==========================================================================
// Drag & Drop & Upload Queue
// ==========================================================================
function setupDragAndDrop() {
    elements.browseBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', (e) => {
        handleFileSelection(e.target.files);
    });
    
    elements.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropzone.classList.add('dragover');
    });
    
    elements.dropzone.addEventListener('dragleave', () => {
        elements.dropzone.classList.remove('dragover');
    });
    
    elements.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.dropzone.classList.remove('dragover');
        handleFileSelection(e.dataTransfer.files);
    });
}

function toggleServerSample(filename, buttonElement) {
    const idx = state.selectedSamples.indexOf(filename);
    if (idx > -1) {
        // Unselect
        state.selectedSamples.splice(idx, 1);
        buttonElement.classList.remove('selected');
        buttonElement.querySelector('i').className = 'fa-solid fa-plus';
    } else {
        // Select
        state.selectedSamples.push(filename);
        buttonElement.classList.add('selected');
        buttonElement.querySelector('i').className = 'fa-solid fa-check';
    }
    updateQueueUI();
}

function handleFileSelection(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Avoid duplicate files
        if (!state.localFiles.some(f => f.name === file.name)) {
            state.localFiles.push(file);
        }
    }
    updateQueueUI();
}

function removeLocalFile(name) {
    state.localFiles = state.localFiles.filter(f => f.name !== name);
    updateQueueUI();
}

function removeServerSample(filename) {
    state.selectedSamples = state.selectedSamples.filter(f => f !== filename);
    // Uncheck sample button in DOM
    const buttons = elements.sampleResumesList.querySelectorAll('.sample-badge-btn');
    buttons.forEach(btn => {
        if (btn.textContent.trim().includes(filename.replace(/_/g, ' ').replace(/\.pdf|\.docx|\.txt/i, '').trim())) {
            btn.classList.remove('selected');
            btn.querySelector('i').className = 'fa-solid fa-plus';
        }
    });
    updateQueueUI();
}

function updateQueueUI() {
    const totalQueue = state.localFiles.length + state.selectedSamples.length;
    elements.queueCount.textContent = totalQueue;
    
    if (totalQueue > 0) {
        elements.queueContainer.style.display = 'block';
        elements.clearQueueBtn.style.display = 'inline-flex';
    } else {
        elements.queueContainer.style.display = 'none';
        elements.clearQueueBtn.style.display = 'none';
    }
    
    elements.queueList.innerHTML = '';
    
    // Add local files to list
    state.localFiles.forEach(file => {
        const item = createQueueItemDOM(file.name, file.size, 'Local File', () => removeLocalFile(file.name));
        elements.queueList.appendChild(item);
    });
    
    // Add server samples to list
    state.selectedSamples.forEach(filename => {
        const display = state.availableSamples.resumes.find(r => r.filename === filename)?.display_name || filename;
        const item = createQueueItemDOM(filename, null, 'Server Sample', () => removeServerSample(filename), display);
        elements.queueList.appendChild(item);
    });
    
    checkReadyToScreen();
}

function createQueueItemDOM(filename, bytes, typeLabel, onRemove, customDisplay = null) {
    const item = document.createElement('div');
    item.className = 'queue-item';
    item.id = `queue-item-${escapeId(filename)}`;
    
    const sizeStr = bytes ? formatBytes(bytes) : typeLabel;
    const nameDisplay = customDisplay || filename;
    
    item.innerHTML = `
        <div class="queue-item-info">
            <div class="queue-item-name" title="${filename}">${nameDisplay}</div>
            <div class="queue-item-meta">
                <span>${sizeStr}</span>
                <span class="status-indicator ready" id="status-${escapeId(filename)}">
                    <i class="fa-regular fa-clock"></i> Ready to Screen
                </span>
            </div>
        </div>
        <button type="button" class="remove-queue-btn"><i class="fa-solid fa-xmark"></i></button>
    `;
    
    item.querySelector('.remove-queue-btn').addEventListener('click', onRemove);
    return item;
}

function clearQueue() {
    state.localFiles = [];
    state.selectedSamples = [];
    
    // Unselect all badge buttons
    const buttons = elements.sampleResumesList.querySelectorAll('.sample-badge-btn');
    buttons.forEach(btn => {
        btn.classList.remove('selected');
        btn.querySelector('i').className = 'fa-solid fa-plus';
    });
    
    updateQueueUI();
}

function checkReadyToScreen() {
    const hasJd = elements.jdTextarea.value.trim().length > 10;
    const hasFiles = (state.localFiles.length + state.selectedSamples.length) > 0;
    
    elements.startScreeningBtn.disabled = !(hasJd && hasFiles);
}

// ==========================================================================
// Screening Action
// ==========================================================================
async function startScreening() {
    const jd = elements.jdTextarea.value.trim();
    const apiKey = elements.apiKeyInput.value.trim();
    const weights = getNormalizedWeights();
    
    if (!jd) return;
    
    // Update button states
    elements.startScreeningBtn.disabled = true;
    elements.startScreeningBtn.querySelector('.btn-text').style.display = 'none';
    elements.startScreeningBtn.querySelector('.spinner-container').style.display = 'inline-flex';
    
    // Disable inputs during processing
    elements.jdTextarea.disabled = true;
    elements.jdPresets.disabled = true;
    elements.apiKeyInput.disabled = true;
    elements.clearQueueBtn.disabled = true;
    
    // Reset table if screening fresh
    // If we want to append, we can do that, but let's clear the old results to avoid duplicates
    state.screenedCandidates = {};
    elements.resultsTbody.innerHTML = '';
    
    // 1. Process server-side samples
    if (state.selectedSamples.length > 0) {
        await screenServerSamples(state.selectedSamples, jd, weights, apiKey);
    }
    
    // 2. Process locally uploaded files
    if (state.localFiles.length > 0) {
        await screenLocalFiles(state.localFiles, jd, weights, apiKey);
    }
    
    // Re-enable everything
    elements.startScreeningBtn.disabled = false;
    elements.startScreeningBtn.querySelector('.btn-text').style.display = 'inline-flex';
    elements.startScreeningBtn.querySelector('.spinner-container').style.display = 'none';
    elements.jdTextarea.disabled = false;
    elements.jdPresets.disabled = false;
    elements.apiKeyInput.disabled = false;
    elements.clearQueueBtn.disabled = false;
    
    updateDashboardStats();
    handleSearchFilter(); // Triggers table update with empty state check
}

async function screenServerSamples(filenames, jd, weights, apiKey) {
    filenames.forEach(fn => updateQueueItemStatus(fn, 'pending', 'Screening...'));
    
    try {
        const response = await fetch(`${API_BASE}/api/screen-samples`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filenames: filenames,
                job_description: jd,
                weights: weights,
                api_key: apiKey
            })
        });
        
        if (!response.ok) throw new Error("Server error during sample screening.");
        
        const results = await response.json();
        
        results.forEach(res => {
            if (res.status === 'success') {
                updateQueueItemStatus(res.filename, 'success', 'Completed');
                saveResult(res.filename, res.evaluation);
            } else {
                updateQueueItemStatus(res.filename, 'error', `Failed: ${res.error_message}`);
            }
        });
        
    } catch (err) {
        console.error(err);
        filenames.forEach(fn => updateQueueItemStatus(fn, 'error', 'Server Error'));
    }
}

async function screenLocalFiles(files, jd, weights, apiKey) {
    files.forEach(f => updateQueueItemStatus(f.name, 'pending', 'Screening...'));
    
    // We upload files in chunks or single multipart request. FastAPI endpoint screens files array in loop.
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('job_description', jd);
    formData.append('weights', JSON.stringify(weights));
    if (apiKey) formData.append('api_key', apiKey);
    
    try {
        const response = await fetch(`${API_BASE}/api/screen`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error("Server error during file screening.");
        
        const results = await response.json();
        
        results.forEach(res => {
            if (res.status === 'success') {
                updateQueueItemStatus(res.filename, 'success', 'Completed');
                saveResult(res.filename, res.evaluation);
            } else {
                updateQueueItemStatus(res.filename, 'error', `Failed: ${res.error_message}`);
            }
        });
        
    } catch (err) {
        console.error(err);
        files.forEach(f => updateQueueItemStatus(f.name, 'error', 'Upload Error'));
    }
}

function updateQueueItemStatus(filename, statusClass, statusLabel) {
    const statusEl = document.getElementById(`status-${escapeId(filename)}`);
    if (statusEl) {
        statusEl.className = `status-indicator ${statusClass}`;
        let iconHtml = '<i class="fa-regular fa-clock"></i>';
        if (statusClass === 'pending') {
            iconHtml = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
        } else if (statusClass === 'success') {
            iconHtml = '<i class="fa-solid fa-circle-check"></i>';
        } else if (statusClass === 'error') {
            iconHtml = '<i class="fa-solid fa-circle-exclamation"></i>';
        }
        statusEl.innerHTML = `${iconHtml} ${statusLabel}`;
    }
}

function saveResult(filename, evaluation) {
    // Save to global state mapped by a unique identifier
    const uniqueId = `cand_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    state.screenedCandidates[uniqueId] = {
        id: uniqueId,
        filename: filename,
        evaluation: evaluation
    };
    
    // Add row to table right away
    appendCandidateRow(uniqueId, filename, evaluation);
}

// ==========================================================================
// Results Table Rendering & Filtering
// ==========================================================================
function appendCandidateRow(id, filename, evaluation) {
    if (elements.emptyState) {
        elements.emptyState.style.display = 'none';
    }
    
    const overallScore = evaluation.match_scores.overall;
    let badgeClass = 'badge-danger';
    if (overallScore >= 80) badgeClass = 'badge-success';
    else if (overallScore >= 60) badgeClass = 'badge-warning';
    
    let barColorClass = 'fill-danger';
    if (overallScore >= 80) barColorClass = 'fill-success';
    else if (overallScore >= 60) barColorClass = 'fill-warning';
    
    const row = document.createElement('tr');
    row.id = `row-${id}`;
    row.setAttribute('data-id', id);
    
    row.innerHTML = `
        <td class="candidate-name-cell">${evaluation.candidate_name}</td>
        <td><span class="badge ${badgeClass}">${evaluation.recommendation}</span></td>
        <td>
            <div class="score-cell-container">
                <div class="score-progress-bar">
                    <div class="score-progress-fill ${barColorClass}" style="width: ${overallScore}%;"></div>
                </div>
                <span class="score-text">${overallScore}%</span>
            </div>
        </td>
        <td>${evaluation.experience_years} Years</td>
        <td title="${evaluation.education}">${evaluation.education.length > 30 ? evaluation.education.substring(0, 30) + '...' : evaluation.education}</td>
        <td class="text-right">
            <button class="secondary-btn view-details-btn" style="padding: 6px 12px; font-size: 11px;">
                <i class="fa-solid fa-eye"></i> View Profile
            </button>
        </td>
    `;
    
    // Row click opens drawer
    row.addEventListener('click', () => openCandidateDetails(id));
    
    elements.resultsTbody.appendChild(row);
}

function handleSearchFilter() {
    const query = elements.searchInput.value.toLowerCase().trim();
    const filter = elements.scoreFilter.value;
    
    let visibleCount = 0;
    const candidates = Object.values(state.screenedCandidates);
    
    candidates.forEach(cand => {
        const row = document.getElementById(`row-${cand.id}`);
        if (!row) return;
        
        const evalData = cand.evaluation;
        const score = evalData.match_scores.overall;
        
        // Search filter match
        const matchesSearch = 
            evalData.candidate_name.toLowerCase().includes(query) ||
            evalData.skills_matched.some(s => s.toLowerCase().includes(query)) ||
            evalData.education.toLowerCase().includes(query);
            
        // Score range match
        let matchesScore = true;
        if (filter === 'strong') matchesScore = (score >= 80);
        else if (filter === 'potential') matchesScore = (score >= 60 && score < 80);
        else if (filter === 'low') matchesScore = (score < 60);
        
        if (matchesSearch && matchesScore) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    if (candidates.length === 0) {
        elements.emptyState.style.display = '';
        elements.emptyState.querySelector('h3').textContent = 'No Resumes Screened Yet';
        elements.emptyState.querySelector('p').textContent = 'Upload files or load server samples, then click "Screen Resumes" to view results.';
    } else if (visibleCount === 0) {
        elements.emptyState.style.display = '';
        elements.emptyState.querySelector('h3').textContent = 'No Matching Results';
        elements.emptyState.querySelector('p').textContent = 'Try adjusting your search query or score filters.';
    } else {
        elements.emptyState.style.display = 'none';
    }
}

// ==========================================================================
// Dashboard Stats Computations
// ==========================================================================
function updateDashboardStats() {
    const candidates = Object.values(state.screenedCandidates);
    const count = candidates.length;
    
    elements.statTotal.textContent = count;
    
    if (count === 0) {
        elements.statAvg.textContent = '-%';
        elements.statTop.textContent = '-';
        return;
    }
    
    const sum = candidates.reduce((acc, c) => acc + c.evaluation.match_scores.overall, 0);
    const avg = Math.round(sum / count);
    elements.statAvg.textContent = `${avg}%`;
    
    // Find candidate with max score
    let topCand = null;
    let maxScore = -1;
    candidates.forEach(c => {
        if (c.evaluation.match_scores.overall > maxScore) {
            maxScore = c.evaluation.match_scores.overall;
            topCand = c.evaluation;
        }
    });
    
    if (topCand) {
        elements.statTop.innerHTML = `${topCand.candidate_name} <span class="gradient-text">(${maxScore}%)</span>`;
    }
}

// ==========================================================================
// Candidate Details Slide Drawer
// ==========================================================================
let currentActiveCandidateId = null;

function openCandidateDetails(id) {
    const cand = state.screenedCandidates[id];
    if (!cand) return;
    
    currentActiveCandidateId = id;
    const ev = cand.evaluation;
    
    // Set headers
    elements.drawerCandidateName.textContent = ev.candidate_name;
    elements.drawerCurrentTitle.textContent = ev.current_title || "Software Professional";
    
    // Avatar Initials
    const initials = ev.candidate_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    elements.drawerAvatarLetters.textContent = initials;
    
    // Contacts
    if (ev.email) {
        elements.drawerEmailSpan.style.display = 'inline-flex';
        elements.drawerEmailLink.textContent = ev.email;
        elements.drawerEmailLink.href = `mailto:${ev.email}`;
    } else {
        elements.drawerEmailSpan.style.display = 'none';
    }
    
    if (ev.phone) {
        elements.drawerPhoneSpan.style.display = 'inline-flex';
        elements.drawerPhoneText.textContent = ev.phone;
    } else {
        elements.drawerPhoneSpan.style.display = 'none';
    }
    
    // Match badge recommendations
    const score = ev.match_scores.overall;
    elements.drawerOverallScorePill.textContent = `${score}% Match`;
    
    elements.drawerRecommendationBadge.textContent = ev.recommendation;
    elements.drawerRecommendationBadge.className = 'recommendation-badge'; // reset classes
    if (score >= 80) elements.drawerRecommendationBadge.classList.add('strong');
    else if (score >= 60) elements.drawerRecommendationBadge.classList.add('potential');
    else elements.drawerRecommendationBadge.classList.add('low');
    
    // Summary
    elements.drawerSummaryText.textContent = ev.summary;
    
    // Score Bars
    elements.drawerSkillsScore.textContent = `${ev.match_scores.skills}%`;
    elements.drawerSkillsBar.style.width = `${ev.match_scores.skills}%`;
    
    elements.drawerExperienceScore.textContent = `${ev.match_scores.experience}%`;
    elements.drawerExperienceBar.style.width = `${ev.match_scores.experience}%`;
    
    elements.drawerEducationScore.textContent = `${ev.match_scores.education}%`;
    elements.drawerEducationBar.style.width = `${ev.match_scores.education}%`;
    
    // Matched skills tags
    elements.drawerMatchedSkillsTags.innerHTML = '';
    if (ev.skills_matched && ev.skills_matched.length > 0) {
        ev.skills_matched.forEach(sk => {
            const span = document.createElement('span');
            span.className = 'skill-tag tag-matched';
            span.textContent = sk;
            elements.drawerMatchedSkillsTags.appendChild(span);
        });
    } else {
        elements.drawerMatchedSkillsTags.innerHTML = '<span class="input-helper-text">No matched skills identified.</span>';
    }
    
    // Missing skills tags
    elements.drawerMissingSkillsTags.innerHTML = '';
    if (ev.skills_missing && ev.skills_missing.length > 0) {
        ev.skills_missing.forEach(sk => {
            const span = document.createElement('span');
            span.className = 'skill-tag tag-missing';
            span.textContent = sk;
            elements.drawerMissingSkillsTags.appendChild(span);
        });
    } else {
        elements.drawerMissingSkillsTags.innerHTML = '<span class="input-helper-text">No missing requirements identified.</span>';
    }
    
    // Strengths
    elements.drawerStrengthsUl.innerHTML = '';
    ev.strengths.forEach(str => {
        const li = document.createElement('li');
        li.textContent = str;
        elements.drawerStrengthsUl.appendChild(li);
    });
    
    // Weaknesses
    elements.drawerWeaknessesUl.innerHTML = '';
    ev.weaknesses.forEach(wk => {
        const li = document.createElement('li');
        li.textContent = wk;
        elements.drawerWeaknessesUl.appendChild(li);
    });
    
    // Suggested Questions
    elements.drawerQuestionsDiv.innerHTML = '';
    ev.suggested_questions.forEach((q, idx) => {
        const qBox = document.createElement('div');
        qBox.className = 'question-box';
        qBox.innerHTML = `
            <div class="question-num">Q${idx + 1}</div>
            <div class="question-text">${q}</div>
        `;
        elements.drawerQuestionsDiv.appendChild(qBox);
    });
    
    showDrawer(true);
}

function showDrawer(show) {
    if (show) {
        elements.sideDrawer.classList.add('active');
        elements.drawerOverlay.classList.add('active');
    } else {
        elements.sideDrawer.classList.remove('active');
        elements.drawerOverlay.classList.remove('active');
        currentActiveCandidateId = null;
    }
}

function downloadCandidateJson() {
    if (!currentActiveCandidateId) return;
    const cand = state.screenedCandidates[currentActiveCandidateId];
    if (!cand) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cand.evaluation, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${cand.evaluation.candidate_name.replace(/\s+/g, '_')}_ai_screening.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// ==========================================================================
// Utility Helper Functions
// ==========================================================================
function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeId(str) {
    // Create a safe HTML ID string from filenames
    return str.replace(/[^a-zA-Z0-9-_]/g, '_');
}
