document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let state = {
        currentView: 'calendar',
        theme: 'light',
        focusedDate: new Date(),
        leaveTypes: [],
        leaveRecords: {},
        isDragging: false,
        dragStartDate: null,
        selectedDates: new Set(),
        dragMode: null, // 'add' or 'remove'
        selectedLeaveType: null
    };

    // Beautiful gradient colors for leave types
    const LEAVE_COLORS = [
        { bg: '#667eea', light: '#f093fb' }, // Purple to Pink
        { bg: '#f093fb', light: '#f5576c' }, // Pink to Red
        { bg: '#4facfe', light: '#00f2fe' }, // Blue to Cyan
        { bg: '#43e97b', light: '#38f9d7' }, // Green to Teal
        { bg: '#fa709a', light: '#fee140' }, // Pink to Yellow
        { bg: '#a8edea', light: '#fed6e3' }, // Mint to Pink
        { bg: '#ff9a9e', light: '#fecfef' }, // Coral to Light Pink
        { bg: '#a18cd1', light: '#fbc2eb' }, // Purple to Pink
        { bg: '#ffecd2', light: '#fcb69f' }, // Cream to Peach
        { bg: '#ff8a80', light: '#ffb74d' }  // Red to Orange
    ];

    const mainContent = document.getElementById('main-content');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');

    // --- LOCAL STORAGE ---
    function saveState() {
        localStorage.setItem('leaveBuddyState_v11', JSON.stringify({
            theme: state.theme,
            leaveTypes: state.leaveTypes,
            leaveRecords: state.leaveRecords,
        }));
    }

    function loadState() {
        const saved = localStorage.getItem('leaveBuddyState_v11');
        if (saved) {
            const parsedState = JSON.parse(saved);
            state.theme = parsedState.theme || 'light';
            state.leaveTypes = parsedState.leaveTypes || [];
            state.leaveRecords = parsedState.leaveRecords || {};
            state.focusedDate = new Date();
        }
        applyTheme();
    }

    function applyTheme() {
        document.body.className = state.theme === 'dark' ? 'dark-mode' : '';
        const themeColor = state.theme === 'dark' ? '#0f172a' : '#ffffff';
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', themeColor);
        }
    }

    // --- RENDER FUNCTIONS ---
    function render() {
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === state.currentView);
        });

        let viewHTML = '';
        switch (state.currentView) {
            case 'stats': 
                viewHTML = getStatsViewHTML(); 
                break;
            case 'settings': 
                viewHTML = getSettingsViewHTML(); 
                break;
            default: 
                viewHTML = getCalendarViewHTML(); 
                break;
        }
        
        mainContent.innerHTML = viewHTML;
        
        if (state.currentView === 'calendar') {
            renderCalendarGrid();
            setupDragAndDrop();
        }
    }

    function getCalendarViewHTML() {
        const year = state.focusedDate.getFullYear();
        const monthName = state.focusedDate.toLocaleString('default', { month: 'long' });
        
        return `
            <div class="calendar-container">
                <div class="calendar-header">
                    <button class="nav-btn" data-action="change-month" data-delta="-1">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <h2 class="calendar-title">${monthName} ${year}</h2>
                    <button class="nav-btn" data-action="change-month" data-delta="1">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                <div class="calendar-actions">
                    <div class="leave-type-selector" id="leave-type-selector">
                        ${state.leaveTypes.map(lt => `
                            <button class="leave-type-pill ${state.selectedLeaveType === lt.id ? 'active' : ''}" 
                                    data-action="select-leave-type" data-id="${lt.id}"
                                    style="background: linear-gradient(135deg, ${lt.color.bg}, ${lt.color.light});">
                                ${lt.name}
                            </button>
                        `).join('')}
                        ${state.leaveTypes.length === 0 ? '<p class="no-types">Add leave types in Stats to get started!</p>' : ''}
                    </div>
                </div>

                <div class="calendar-grid-container">
                    <table class="calendar-grid">
                        <thead>
                            <tr>
                                <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
                            </tr>
                        </thead>
                        <tbody id="calendar-body"></tbody>
                    </table>
                </div>

                <div class="calendar-legend">
                    <div class="legend-item">
                        <i class="fas fa-mouse-pointer"></i>
                        <span>Click & drag to select multiple days</span>
                    </div>
                    <div class="legend-item">
                        <i class="fas fa-palette"></i>
                        <span>Select a leave type above first</span>
                    </div>
                </div>
            </div>
        `;
    }

    function renderCalendarGrid() {
        const year = state.focusedDate.getFullYear();
        const month = state.focusedDate.getMonth();
        const calendarBody = document.getElementById('calendar-body');
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let html = '';
        let currentDate = new Date(startDate);

        for (let week = 0; week < 6; week++) {
            html += '<tr>';
            for (let day = 0; day < 7; day++) {
                const dateStr = toDateString(currentDate);
                const dayNum = currentDate.getDate();
                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = currentDate.getTime() === today.getTime();
                const isWeekend = day === 0 || day === 6;
                const isPast = currentDate < today;
                
                const leaveId = state.leaveRecords[dateStr];
                const leaveType = leaveId ? state.leaveTypes.find(lt => lt.id === leaveId) : null;
                
                let cellClass = 'day-cell';
                if (!isCurrentMonth) cellClass += ' other-month';
                if (isToday) cellClass += ' today';
                if (isWeekend) cellClass += ' weekend';
                if (isPast) cellClass += ' past';
                if (state.selectedDates.has(dateStr)) cellClass += ' selected';
                
                html += `
                    <td>
                        <div class="${cellClass}" data-date="${dateStr}">
                            <span class="day-number">${dayNum}</span>
                            ${leaveType ? `
                                <div class="leave-indicator" 
                                     style="background: linear-gradient(135deg, ${leaveType.color.bg}, ${leaveType.color.light});">
                                    ${leaveType.name}
                                </div>
                            ` : ''}
                        </div>
                    </td>
                `;
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
            html += '</tr>';
            
            if (currentDate.getMonth() !== month && currentDate.getDate() > 7) break;
        }
        
        calendarBody.innerHTML = html;
    }

    function getStatsViewHTML() {
        const currentYear = new Date().getFullYear();
        
        let statsHTML = '';
        if (state.leaveTypes.length === 0) {
            statsHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-plus"></i>
                    <h3>No Leave Types Yet</h3>
                    <p>Create your first leave type to start tracking your time off!</p>
                    <button class="btn-primary" data-action="add-leave-type">
                        <i class="fas fa-plus"></i> Add Leave Type
                    </button>
                </div>
            `;
        } else {
            statsHTML = state.leaveTypes.map(lt => {
                const usedDays = Object.values(state.leaveRecords).filter(id => id === lt.id).length;
                const remaining = Math.max(0, lt.total - usedDays);
                const percentage = lt.total > 0 ? (usedDays / lt.total) * 100 : 0;
                
                return `
                    <div class="stats-card">
                        <div class="stats-card-header">
                            <div class="leave-type-info">
                                <div class="leave-type-color" 
                                     style="background: linear-gradient(135deg, ${lt.color.bg}, ${lt.color.light});"></div>
                                <div>
                                    <h3>${lt.name}</h3>
                                    <p class="leave-type-subtitle">${currentYear} Allocation</p>
                                </div>
                            </div>
                            <button class="btn-icon" data-action="edit-leave-type" data-id="${lt.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                        
                        <div class="stats-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" 
                                     style="width: ${percentage}%; background: linear-gradient(90deg, ${lt.color.bg}, ${lt.color.light});"></div>
                            </div>
                            <div class="progress-text">
                                <span class="used">${usedDays} used</span>
                                <span class="remaining">${remaining} remaining</span>
                            </div>
                        </div>
                        
                        <div class="stats-summary">
                            <div class="stat-item">
                                <span class="stat-value">${remaining}</span>
                                <span class="stat-label">Days Left</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${lt.total}</span>
                                <span class="stat-label">Total Days</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${Math.round(percentage)}%</span>
                                <span class="stat-label">Used</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        return `
            <div class="stats-container">
                <div class="stats-header">
                    <div>
                        <h2>Leave Statistics</h2>
                        <p class="stats-subtitle">Track your time off for ${currentYear}</p>
                    </div>
                    ${state.leaveTypes.length > 0 ? `
                        <button class="btn-primary" data-action="add-leave-type">
                            <i class="fas fa-plus"></i> Add Type
                        </button>
                    ` : ''}
                </div>
                <div class="stats-grid">
                    ${statsHTML}
                </div>
            </div>
        `;
    }

    function getSettingsViewHTML() {
        const isDark = state.theme === 'dark';
        
        return `
            <div class="settings-container">
                <div class="settings-header">
                    <h2>Settings</h2>
                    <p class="settings-subtitle">Customize your Leave Buddy experience</p>
                </div>
                
                <div class="settings-grid">
                    <div class="setting-card">
                        <div class="setting-icon">
                            <i class="fas fa-palette"></i>
                        </div>
                        <div class="setting-content">
                            <h3>Appearance</h3>
                            <p>Choose between light and dark themes</p>
                            <div class="theme-options">
                                <button class="theme-option ${!isDark ? 'active' : ''}" data-action="set-theme" data-theme="light">
                                    <i class="fas fa-sun"></i>
                                    <span>Light</span>
                                </button>
                                <button class="theme-option ${isDark ? 'active' : ''}" data-action="set-theme" data-theme="dark">
                                    <i class="fas fa-moon"></i>
                                    <span>Dark</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="setting-card">
                        <div class="setting-icon">
                            <i class="fas fa-download"></i>
                        </div>
                        <div class="setting-content">
                            <h3>Export Data</h3>
                            <p>Download a backup of all your leave data</p>
                            <button class="btn-secondary" data-action="export-data">
                                <i class="fas fa-download"></i>
                                Export Backup
                            </button>
                        </div>
                    </div>

                    <div class="setting-card">
                        <div class="setting-icon">
                            <i class="fas fa-upload"></i>
                        </div>
                        <div class="setting-content">
                            <h3>Import Data</h3>
                            <p>Restore from a previously exported backup file</p>
                            <label for="import-file" class="btn-secondary">
                                <i class="fas fa-upload"></i>
                                Import Backup
                            </label>
                            <input type="file" id="import-file" accept=".json" data-action="import-data" style="display: none;">
                        </div>
                    </div>

                    <div class="setting-card">
                        <div class="setting-icon">
                            <i class="fas fa-trash-alt"></i>
                        </div>
                        <div class="setting-content">
                            <h3>Reset Data</h3>
                            <p>Clear all leave types and records (cannot be undone)</p>
                            <button class="btn-danger" data-action="reset-data">
                                <i class="fas fa-trash-alt"></i>
                                Reset All Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- DRAG AND DROP FUNCTIONALITY ---
    function setupDragAndDrop() {
        let isMouseDown = false;
        
        mainContent.addEventListener('mousedown', (e) => {
            const dayCell = e.target.closest('.day-cell');
            if (!dayCell || dayCell.classList.contains('other-month')) return;
            
            if (!state.selectedLeaveType) {
                showToast('Please select a leave type first!', 'warning');
                return;
            }
            
            e.preventDefault();
            isMouseDown = true;
            state.isDragging = true;
            state.selectedDates.clear();
            
            const dateStr = dayCell.dataset.date;
            const hasLeave = state.leaveRecords[dateStr];
            state.dragMode = hasLeave ? 'remove' : 'add';
            
            handleDateSelection(dateStr);
            updateDragVisuals();
        });

        mainContent.addEventListener('mouseover', (e) => {
            if (!state.isDragging) return;
            
            const dayCell = e.target.closest('.day-cell');
            if (!dayCell || dayCell.classList.contains('other-month')) return;
            
            handleDateSelection(dayCell.dataset.date);
            updateDragVisuals();
        });

        document.addEventListener('mouseup', () => {
            if (state.isDragging) {
                applySelectedDates();
                state.isDragging = false;
                state.selectedDates.clear();
                updateDragVisuals();
            }
            isMouseDown = false;
        });
    }

    function handleDateSelection(dateStr) {
        if (state.dragMode === 'add') {
            state.selectedDates.add(dateStr);
        } else {
            state.selectedDates.add(dateStr);
        }
    }

    function updateDragVisuals() {
        document.querySelectorAll('.day-cell').forEach(cell => {
            const dateStr = cell.dataset.date;
            cell.classList.toggle('selected', state.selectedDates.has(dateStr));
        });
    }

    function applySelectedDates() {
        let changesCount = 0;
        
        state.selectedDates.forEach(dateStr => {
            if (state.dragMode === 'add') {
                state.leaveRecords[dateStr] = state.selectedLeaveType;
                changesCount++;
            } else {
                delete state.leaveRecords[dateStr];
                changesCount++;
            }
        });
        
        if (changesCount > 0) {
            saveState();
            render();
            const action = state.dragMode === 'add' ? 'added' : 'removed';
            showToast(`${changesCount} day${changesCount > 1 ? 's' : ''} ${action}!`, 'success');
        }
    }

    // --- MODAL FUNCTIONS ---
    function showModal(content) {
        modalContent.innerHTML = content;
        modalOverlay.classList.add('visible');
    }

    function hideModal() {
        modalOverlay.classList.remove('visible');
    }

    function showLeaveTypeModal(id = null) {
        const isEditing = id !== null;
        const leaveType = isEditing ? state.leaveTypes.find(lt => lt.id === id) : { name: '', total: 20 };
        
        const colorOptions = LEAVE_COLORS.map((color, index) => `
            <button class="color-option ${isEditing && state.leaveTypes.find(lt => lt.id === id)?.colorIndex === index ? 'selected' : ''}" 
                    data-color-index="${index}"
                    style="background: linear-gradient(135deg, ${color.bg}, ${color.light});">
            </button>
        `).join('');

        showModal(`
            <div class="modal-header">
                <h3>${isEditing ? 'Edit' : 'Add'} Leave Type</h3>
                <button class="btn-icon" data-action="close-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="leave-name">Leave Type Name</label>
                    <input type="text" id="leave-name" value="${leaveType.name}" placeholder="e.g., Annual Leave, Sick Leave">
                </div>
                <div class="form-group">
                    <label for="leave-total">Total Days per Year</label>
                    <input type="number" id="leave-total" value="${leaveType.total}" min="1" max="365">
                </div>
                <div class="form-group">
                    <label>Choose Color</label>
                    <div class="color-picker" id="color-picker">
                        ${colorOptions}
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                ${isEditing ? `<button class="btn-danger" data-action="delete-leave-type" data-id="${id}">Delete</button>` : ''}
                <button class="btn-primary" data-action="save-leave-type" data-id="${id || ''}">
                    ${isEditing ? 'Update' : 'Create'}
                </button>
            </div>
        `);

        // Handle color selection
        setTimeout(() => {
            document.querySelectorAll('.color-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                });
            });
        }, 100);
    }

    // --- TOAST NOTIFICATIONS ---
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- EVENT HANDLERS ---
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const { action, view, delta, id, theme } = target.dataset;

        switch (action) {
            case 'change-view':
                state.currentView = view;
                render();
                break;

            case 'change-month':
                state.focusedDate.setMonth(state.focusedDate.getMonth() + parseInt(delta));
                render();
                break;

            case 'select-leave-type':
                state.selectedLeaveType = id;
                document.querySelectorAll('.leave-type-pill').forEach(pill => {
                    pill.classList.toggle('active', pill.dataset.id === id);
                });
                break;

            case 'add-leave-type':
                showLeaveTypeModal();
                break;

            case 'edit-leave-type':
                showLeaveTypeModal(id);
                break;

            case 'save-leave-type':
                const name = document.getElementById('leave-name').value.trim();
                const total = parseInt(document.getElementById('leave-total').value);
                const selectedColor = document.querySelector('.color-option.selected');
                
                if (!name || !total || !selectedColor) {
                    showToast('Please fill all fields and select a color!', 'warning');
                    return;
                }

                const colorIndex = parseInt(selectedColor.dataset.colorIndex);
                const color = LEAVE_COLORS[colorIndex];

                if (id) {
                    const leaveType = state.leaveTypes.find(lt => lt.id === id);
                    leaveType.name = name;
                    leaveType.total = total;
                    leaveType.color = color;
                    leaveType.colorIndex = colorIndex;
                } else {
                    state.leaveTypes.push({
                        id: 'lt_' + Date.now(),
                        name,
                        total,
                        color,
                        colorIndex
                    });
                }

                hideModal();
                saveState();
                render();
                showToast(`Leave type ${id ? 'updated' : 'created'} successfully!`, 'success');
                break;

            case 'delete-leave-type':
                if (confirm('Are you sure? This will remove all recorded leave days of this type.')) {
                    state.leaveTypes = state.leaveTypes.filter(lt => lt.id !== id);
                    Object.keys(state.leaveRecords).forEach(date => {
                        if (state.leaveRecords[date] === id) {
                            delete state.leaveRecords[date];
                        }
                    });
                    hideModal();
                    saveState();
                    render();
                    showToast('Leave type deleted successfully!', 'success');
                }
                break;

            case 'set-theme':
                state.theme = theme;
                applyTheme();
                saveState();
                render();
                break;

            case 'export-data':
                const dataStr = JSON.stringify({
                    theme: state.theme,
                    leaveTypes: state.leaveTypes,
                    leaveRecords: state.leaveRecords
                }, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `leave-buddy-backup-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                URL.revokeObjectURL(url);
                showToast('Data exported successfully!', 'success');
                break;

            case 'import-data':
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const importedData = JSON.parse(e.target.result);
                            state.leaveTypes = importedData.leaveTypes || [];
                            state.leaveRecords = importedData.leaveRecords || {};
                            state.theme = importedData.theme || 'light';
                            applyTheme();
                            saveState();
                            render();
                            showToast('Data imported successfully!', 'success');
                        } catch (error) {
                            showToast('Invalid backup file!', 'warning');
                        }
                    };
                    reader.readAsText(file);
                }
                break;

            case 'reset-data':
                if (confirm('Are you sure you want to reset all data? This cannot be undone!')) {
                    state.leaveTypes = [];
                    state.leaveRecords = {};
                    saveState();
                    render();
                    showToast('All data has been reset!', 'success');
                }
                break;

            case 'close-modal':
                hideModal();
                break;
        }
    });

    // Handle file input change for import
    document.body.addEventListener('change', (e) => {
        if (e.target.dataset.action === 'import-data') {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const importedData = JSON.parse(event.target.result);
                        state.leaveTypes = importedData.leaveTypes || [];
                        state.leaveRecords = importedData.leaveRecords || {};
                        state.theme = importedData.theme || 'light';
                        applyTheme();
                        saveState();
                        render();
                        showToast('Data imported successfully!', 'success');
                    } catch (error) {
                        showToast('Invalid backup file!', 'warning');
                    }
                };
                reader.readAsText(file);
            }
        }
    });

    // --- UTILITY FUNCTIONS ---
    function toDateString(date) {
        return date.toISOString().split('T')[0];
    }

    // --- INITIALIZATION ---
    loadState();
    render();
});
