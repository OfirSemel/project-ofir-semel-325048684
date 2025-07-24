let incidents = [];
let filteredIncidents = [];

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('incidentsList')) {
        loadItems();
        renderItems();
        updateStats();
    }
    
    const form = document.getElementById('reportForm');
    const successMessage = document.getElementById('successMessage');
    
    if (form) {
        const requiredFields = ['channelNumber', 'securityLevel', 'email'];
        
        function validateChannelNumber(value) {
            if (!value.trim()) {
                return 'מספר תעלת זמן הוא שדה חובה';
            }
            return '';
        }
        
        function validateEmail(value) {
            if (!value.trim()) {
                return 'כתובת אימייל היא שדה חובה';
            }
            
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value.trim())) {
                return 'כתובת אימייל לא תקינה';
            }
            
            return '';
        }
        
        function validateSecurityLevel(value) {
            if (!value) {
                return 'יש לבחור רמת אבטחה';
            }
            
            if (value === '5') {
                const channelNumberField = document.getElementById('channelNumber');
                const channelNumber = channelNumberField ? channelNumberField.value : '';
                if (!channelNumber.includes('EMERGENCY')) {
                    return 'רמת אבטחה 5 דורשת שמספר התעלה יכיל את המילה EMERGENCY';
                }
            }
            
            return '';
        }
        
        function validateDate(value) {
            if (!value.trim()) {
                return '';
            }
            
            const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
            const match = value.trim().match(datePattern);
            
            if (!match) {
                return 'פורמט לא תקין. השתמש בפורמט: יום/חודש/שנה';
            }
            
            const [, day, month, year] = match;
            const dayNum = parseInt(day);
            const monthNum = parseInt(month);
            const yearNum = parseInt(year);
            
            if (dayNum < 1 || dayNum > 31) {
                return 'יום לא תקין (1-31)';
            }
            if (monthNum < 1 || monthNum > 12) {
                return 'חודש לא תקין (1-12)';
            }
            if (yearNum < 1900 || yearNum > 2100) {
                return 'שנה לא תקינה';
            }
            
            const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (yearNum % 4 === 0 && (yearNum % 100 !== 0 || yearNum % 400 === 0)) {
                daysInMonth[1] = 29;
            }
            
            if (dayNum > daysInMonth[monthNum - 1]) {
                return 'יום לא קיים בחודש זה';
            }
            
            return '';
        }
        
        function validateTime(value) {
            if (!value.trim()) {
                return '';
            }
            
            const timePattern = /^(\d{1,2}):(\d{2})$/;
            const match = value.trim().match(timePattern);
            
            if (!match) {
                return 'פורמט לא תקין. השתמש בפורמט: שעה:דקות';
            }
            
            const [, hours, minutes] = match;
            const hoursNum = parseInt(hours);
            const minutesNum = parseInt(minutes);
            
            if (hoursNum < 0 || hoursNum > 23) {
                return 'שעה לא תקינה (0-23)';
            }
            if (minutesNum < 0 || minutesNum > 59) {
                return 'דקות לא תקינות (0-59)';
            }
            
            return '';
        }
        
        function showError(fieldId, message) {
            const errorElement = document.getElementById(fieldId + 'Error');
            const fieldElement = document.getElementById(fieldId);
            
            if (errorElement && fieldElement) {
                const formGroup = fieldElement.parentElement;
                errorElement.textContent = message;
                formGroup.classList.add('error');
                formGroup.classList.remove('valid');
            }
        }
        
        function clearError(fieldId) {
            const errorElement = document.getElementById(fieldId + 'Error');
            const fieldElement = document.getElementById(fieldId);
            
            if (errorElement && fieldElement) {
                const formGroup = fieldElement.parentElement;
                errorElement.textContent = '';
                formGroup.classList.remove('error');
                formGroup.classList.add('valid');
            }
        }
        
        function validateField(fieldId, value) {
            let errorMessage = '';
            
            switch(fieldId) {
                case 'channelNumber':
                    errorMessage = validateChannelNumber(value);
                    break;
                case 'email':
                    errorMessage = validateEmail(value);
                    break;
                case 'securityLevel':
                    errorMessage = validateSecurityLevel(value);
                    break;
                case 'targetDate':
                case 'actualDate':
                    errorMessage = validateDate(value);
                    break;
                case 'targetTime':
                case 'actualTime':
                    errorMessage = validateTime(value);
                    break;
            }
            
            if (errorMessage) {
                showError(fieldId, errorMessage);
                return false;
            } else {
                clearError(fieldId);
                return true;
            }
        }
        
        function validateForm() {
            let isValid = true;
            
            requiredFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    if (!validateField(fieldId, field.value)) {
                        isValid = false;
                    }
                }
            });
            
            const timeFields = ['targetDate', 'targetTime', 'actualDate', 'actualTime'];
            timeFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field && field.value.trim()) {
                    if (!validateField(fieldId, field.value)) {
                        isValid = false;
                    }
                }
            });
            
            const targetDateField = document.getElementById('targetDate');
            const actualDateField = document.getElementById('actualDate');
            
            if (targetDateField.value.trim() && actualDateField.value.trim()) {
                const targetDateParts = targetDateField.value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                const actualDateParts = actualDateField.value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                
                if (targetDateParts && actualDateParts) {
                    const targetDate = new Date(parseInt(targetDateParts[3]), parseInt(targetDateParts[2]) - 1, parseInt(targetDateParts[1]));
                    const actualDate = new Date(parseInt(actualDateParts[3]), parseInt(actualDateParts[2]) - 1, parseInt(actualDateParts[1]));
                    
                    if (actualDate < targetDate) {
                        showError('actualDate', 'תאריך נחיתה בפועל לא יכול להיות לפני תאריך היעד');
                        isValid = false;
                    }
                }
            }
            
            return isValid;
        }
        
        function getIssueDescription(type) {
            const types = {
                'tremor': 'רעד',
                'hole': 'חור בזמן', 
                'dinosaur': 'מפגש עם דינוזאור',
                'other': 'אחר'
            };
            return types[type] || 'אחר';
        }
        
        function getSecurityLevelText(level) {
            const levels = {
                '1': 'רמה 1 - נמוכה',
                '2': 'רמה 2 - בינונית', 
                '3': 'רמה 3 - גבוהה',
                '4': 'רמה 4 - קריטית',
                '5': 'רמה 5 - חירום'
            };
            return levels[level] || level;
        }
        
        function showSuccessMessage() {
            if (form.dataset.submitted === 'true') {
                return;
            }
            form.dataset.submitted = 'true';
            
            const channelNumber = document.getElementById('channelNumber').value;
            const email = document.getElementById('email').value;
            
            const formData = new FormData(form);
            const incident = {
                id: Date.now().toString(),
                channelNumber: formData.get('channelNumber'),
                targetTime: formData.get('targetTime'),
                actualTime: formData.get('actualTime'),
                issueDescription: getIssueDescription(formData.get('incidentType')),
                multiplePeople: formData.get('multipleTravelers'), 
                securityLevel: getSecurityLevelText(formData.get('securityLevel')),
                email: formData.get('email'),
                status: 'פתוחה',
                timestamp: new Date().toISOString()
            };
            
            let incidents = [];
            const existing = localStorage.getItem('timePortalIncidents');
            if (existing) {
                incidents = JSON.parse(existing);
            }
            incidents.push(incident);
            localStorage.setItem('timePortalIncidents', JSON.stringify(incidents));
            
            let successContent = '<h3>הדיווח נשלח בהצלחה!</h3>';
            successContent += '<p><strong>מספר תעלת זמן:</strong> ' + channelNumber + '</p>';
            successContent += '<p>תקבל עדכון באימייל: <strong>' + email + '</strong> בתוך 24-48 שעות.</p>';
            
            successMessage.innerHTML = successContent;
            form.style.display = 'none';
            successMessage.classList.remove('hidden');
            
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            
            if (field) {
                field.addEventListener('blur', function() {
                    validateField(fieldId, this.value);
                });
                
                field.addEventListener('input', function() {
                    if (this.value.trim()) {
                        const formGroup = this.parentElement;
                        if (formGroup) {
                            formGroup.classList.remove('error');
                        }
                    }
                });
            }
        });
        
        const timeFields = ['targetDate', 'targetTime', 'actualDate', 'actualTime'];
        timeFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            
            if (field) {
                field.addEventListener('blur', function() {
                    if (this.value.trim()) {
                        validateField(fieldId, this.value);
                    }
                });
            }
        });
        
        const incidentTypeField = document.getElementById('incidentType');
        const multipleTravelersField = document.getElementById('multipleTravelers');
        const descriptionField = document.getElementById('description');
        
        if (incidentTypeField) {
            incidentTypeField.addEventListener('change', function() {
                const formGroup = this.parentElement;
                if (this.value) {
                    formGroup.classList.add('valid');
                    formGroup.classList.remove('error');
                }
            });
        }
        
        if (multipleTravelersField) {
            multipleTravelersField.addEventListener('change', function() {
                const formGroup = this.parentElement;
                if (this.value) {
                    formGroup.classList.add('valid');
                    formGroup.classList.remove('error');
                }
            });
        }
        
        if (descriptionField) {
            descriptionField.addEventListener('blur', function() {
                const formGroup = this.parentElement;
                if (this.value.trim().length > 0) {
                    if (this.value.trim().length < 10) {
                        const errorElement = document.getElementById('descriptionError');
                        if (errorElement) {
                            errorElement.textContent = 'תיאור קצר מדי - לפחות 10 תווים';
                            formGroup.classList.add('error');
                            formGroup.classList.remove('valid');
                        }
                    } else {
                        const errorElement = document.getElementById('descriptionError');
                        if (errorElement) {
                            errorElement.textContent = '';
                            formGroup.classList.remove('error');
                            formGroup.classList.add('valid');
                        }
                    }
                } else {
                    formGroup.classList.remove('error');
                    formGroup.classList.remove('valid');
                }
            });
        }
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateForm()) {
                showSuccessMessage();
            } else {
                const firstError = document.querySelector('.form-group.error');
                if (firstError) {
                    firstError.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }
        });
    }
});

function loadItems() {
    try {
        const storedIncidents = localStorage.getItem('timePortalIncidents');
        if (storedIncidents) {
            incidents = JSON.parse(storedIncidents);
            filteredIncidents = [...incidents];
        } else {
            incidents = [];
            filteredIncidents = [];
        }
    } catch (error) {
        console.error('שגיאה בטעינת נתונים:', error);
        incidents = [];
        filteredIncidents = [];
    }
}

function saveItem(incidentData) {
    try {
        const newIncident = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            status: 'פתוחה',
            ...incidentData
        };
        
        incidents.push(newIncident);
        localStorage.setItem('timePortalIncidents', JSON.stringify(incidents));
        filteredIncidents = [...incidents];
        renderItems();
        updateStats();
        return true;
    } catch (error) {
        console.error('שגיאה בשמירת נתונים:', error);
        return false;
    }
}

function renderItems() {
    const incidentsList = document.getElementById('incidentsList');
    const noIncidents = document.getElementById('noIncidents');
    
    if (!incidentsList) return;
    
    if (filteredIncidents.length === 0) {
        incidentsList.innerHTML = '';
        if (noIncidents) noIncidents.style.display = 'block';
        return;
    }
    
    if (noIncidents) noIncidents.style.display = 'none';
    
    incidentsList.innerHTML = filteredIncidents.map(incident => {
        return `
            <div class="incident-card status-${incident.status === 'פתוחה' ? 'open' : 'closed'}">
                <div class="incident-header">
                    <div class="incident-id">תעלה מספר ${incident.channelNumber}</div>
                    <div class="incident-status status-${incident.status === 'פתוחה' ? 'open' : 'closed'}">
                        ${incident.status}
                    </div>
                </div>
                
                <div class="incident-details">
                    <div class="detail-item">
                        <div class="detail-label">זמן יעד</div>
                        <div class="detail-value">${incident.targetTime}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">זמן נחיתה בפועל</div>
                        <div class="detail-value">${incident.actualTime}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">תיאור התקלה</div>
                        <div class="detail-value">${incident.issueDescription}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">מספר אנשים</div>
                        <div class="detail-value">${incident.multiplePeople === 'yes' ? 'יותר מאדם אחד' : 'אדם אחד'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">רמת אבטחה</div>
                        <div class="detail-value">${incident.securityLevel}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">אימייל ליצירת קשר</div>
                        <div class="detail-value">${incident.email}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">תאריך דיווח</div>
                        <div class="detail-value">${formatDate(incident.timestamp)}</div>
                    </div>
                </div>
                
                <div class="incident-actions">
                    <button class="action-btn status-btn" onclick="toggleStatus('${incident.id}')">
                        ${incident.status === 'פתוחה' ? 'סמן כטופלה' : 'סמן כפתוחה'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteItem('${incident.id}')">
                        מחק תקלה
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteItem(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק תקלה זו?')) {
        incidents = incidents.filter(incident => incident.id !== id);
        localStorage.setItem('timePortalIncidents', JSON.stringify(incidents));
        applyCurrentFilters();
        renderItems();
        updateStats();
    }
}

function updateItem(id, changes) {
    const incidentIndex = incidents.findIndex(incident => incident.id === id);
    if (incidentIndex !== -1) {
        incidents[incidentIndex] = { ...incidents[incidentIndex], ...changes };
        localStorage.setItem('timePortalIncidents', JSON.stringify(incidents));
        applyCurrentFilters();
        renderItems();
        updateStats();
        return true;
    }
    return false;
}

function toggleStatus(id) {
    const incident = incidents.find(item => item.id === id);
    if (incident) {
        const newStatus = incident.status === 'פתוחה' ? 'טופלה' : 'פתוחה';
        updateItem(id, { status: newStatus });
    }
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('he-IL') + ' ' + date.toLocaleTimeString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function filterByStatus() {
    const statusFilter = document.getElementById('statusFilter');
    if (!statusFilter) return;
    
    if (statusFilter.value === 'all') {
        filteredIncidents = [...incidents];
    } else {
        filteredIncidents = incidents.filter(incident => incident.status === statusFilter.value);
    }
    
    renderItems();
    updateStats();
}

function filterByIssueType() {
    const issueFilter = document.getElementById('issueFilter');
    if (!issueFilter) return;
    
    if (issueFilter.value === 'all') {
        filteredIncidents = [...incidents];
    } else {
        filteredIncidents = incidents.filter(incident => {
            const description = incident.issueDescription.toLowerCase();
            if (issueFilter.value === 'אחר') {
                return !description.includes('רעד') && 
                       !description.includes('חור בזמן') && 
                       !description.includes('דינוזאור');
            }
            return description.includes(issueFilter.value.toLowerCase());
        });
    }
    
    renderItems();
    updateStats();
}

function filterByTargetTime() {
    const timeFilter = document.getElementById('timeFilter');
    if (!timeFilter) return;
    
    if (timeFilter.value === 'all') {
        filteredIncidents = [...incidents];
    } else {
        filteredIncidents = incidents.filter(incident => {
            const targetTime = incident.targetTime;
            const hour = parseInt(targetTime.split(':')[0]);
            
            switch (timeFilter.value) {
                case 'morning':
                    return hour >= 6 && hour < 12;
                case 'afternoon':
                    return hour >= 12 && hour < 18;
                case 'evening':
                    return hour >= 18 && hour < 24;
                case 'night':
                    return hour >= 0 && hour < 6;
                default:
                    return true;
            }
        });
    }
    
    renderItems();
    updateStats();
}

function clearFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const issueFilter = document.getElementById('issueFilter');
    const timeFilter = document.getElementById('timeFilter');
    
    if (statusFilter) statusFilter.value = 'all';
    if (issueFilter) issueFilter.value = 'all';
    if (timeFilter) timeFilter.value = 'all';
    
    filteredIncidents = [...incidents];
    renderItems();
    updateStats();
}

function applyCurrentFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const issueFilter = document.getElementById('issueFilter');
    const timeFilter = document.getElementById('timeFilter');
    
    let filtered = [...incidents];
    
    if (statusFilter && statusFilter.value !== 'all') {
        filtered = filtered.filter(incident => incident.status === statusFilter.value);
    }
    
    if (issueFilter && issueFilter.value !== 'all') {
        filtered = filtered.filter(incident => {
            const description = incident.issueDescription.toLowerCase();
            if (issueFilter.value === 'אחר') {
                return !description.includes('רעד') && 
                       !description.includes('חור בזמן') && 
                       !description.includes('דינוזאור');
            }
            return description.includes(issueFilter.value.toLowerCase());
        });
    }
    
    if (timeFilter && timeFilter.value !== 'all') {
        filtered = filtered.filter(incident => {
            const targetTime = incident.targetTime;
            const hour = parseInt(targetTime.split(':')[0]);
            
            switch (timeFilter.value) {
                case 'morning':
                    return hour >= 6 && hour < 12;
                case 'afternoon':
                    return hour >= 12 && hour < 18;
                case 'evening':
                    return hour >= 18 && hour < 24;
                case 'night':
                    return hour >= 0 && hour < 6;
                default:
                    return true;
            }
        });
    }
    
    filteredIncidents = filtered;
}

function updateStats() {
    const totalCountElement = document.getElementById('totalCount');
    const openCountElement = document.getElementById('openCount');
    
    if (!totalCountElement || !openCountElement) return;
    
    const totalCount = incidents.length;
    const openCount = incidents.filter(incident => incident.status === 'פתוחה').length;
    
    totalCountElement.textContent = totalCount;
    openCountElement.textContent = openCount;
}

function goToReportForm() {
    window.location.href = 'index.html';
}