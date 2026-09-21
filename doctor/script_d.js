function clearErrors(formType) {
    const container = formType === 'login' ? document.getElementById('loginFormContainer') : document.getElementById('registerFormContainer');
    container.querySelectorAll('input').forEach(input => input.classList.remove('error-input'));
}

function switchTab(tabType) {
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
    if(tabType === 'login') {
        document.querySelectorAll('.tab-item')[0].classList.add('active');
        document.getElementById('loginFormContainer').style.display = 'block';
        document.getElementById('registerFormContainer').style.display = 'none';
    } else {
        document.querySelectorAll('.tab-item')[1].classList.add('active');
        document.getElementById('loginFormContainer').style.display = 'none';
        document.getElementById('registerFormContainer').style.display = 'block';
    }
}

function handleRegister(e) {
    e.preventDefault();
    clearErrors('register');
    const nameField = document.getElementById('regName');
    const phoneField = document.getElementById('regPhone');
    const specField = document.getElementById('regSpec');
    const hoursField = document.getElementById('regHours');
    const clinicField = document.getElementById('regClinic');
    const emailField = document.getElementById('regEmail');
    const passField = document.getElementById('regPass');

    let hasError = false;
    if (!nameField.value.trim()) { nameField.classList.add('error-input'); hasError = true; }
    if (!phoneField.value.trim()) { phoneField.classList.add('error-input'); hasError = true; }
    if (!specField.value.trim()) { specField.classList.add('error-input'); hasError = true; }
    if (!hoursField.value.trim()) { hoursField.classList.add('error-input'); hasError = true; }
    if (!clinicField.value.trim()) { clinicField.classList.add('error-input'); hasError = true; }
    if (!emailField.value.trim()) { emailField.classList.add('error-input'); hasError = true; }
    if (!passField.value) { passField.classList.add('error-input'); hasError = true; }

    if (hasError) {
        showMsg('regMsg', 'جميع الحقول مطلوبة، تم تمييز الحقول الفارغة باللون الأحمر.', 'var(--danger)');
        return;
    }

    if (passField.value.length < 8) {
        passField.classList.add('error-input');
        showMsg('regMsg', 'كلمة المرور يجب ألا تقل عن 8 خانات.', 'var(--danger)');
        return;
    }

    let doctors = JSON.parse(localStorage.getItem('medicare_doctors')) || [];
    let patients = JSON.parse(localStorage.getItem('medicare_patients')) || [];
    
    if(doctors.some(d => d.name === nameField.value.trim())) {
        nameField.classList.add('error-input');
        showMsg('regMsg', 'خطأ: اسم الطبيب مسجل مسبقاً.', 'var(--danger)');
        return;
    }
    
    const emailVal = emailField.value.trim();
    if(doctors.some(d => d.email === emailVal) || patients.some(p => p.email === emailVal)) {
        emailField.classList.add('error-input');
        showMsg('regMsg', 'خطأ: البريد الإلكتروني مستخدم مسبقاً.', 'var(--danger)');
        return;
    }

    doctors.push({
        name: nameField.value.trim(),
        phone: phoneField.value.trim(),
        spec: specField.value.trim(),
        hours: hoursField.value.trim(),
        clinic: clinicField.value.trim(),
        email: emailVal,
        pass: passField.value
    });
    localStorage.setItem('medicare_doctors', JSON.stringify(doctors));

    showMsg('regMsg', 'تم إنشاء الحساب بنجاح! جاري تحويلك لتسجيل الدخول...', 'var(--success)');
    setTimeout(() => switchTab('login'), 1500);
}

function handleLogin(e) {
    e.preventDefault();
    clearErrors('login');
    const nameField = document.getElementById('logName');
    const passField = document.getElementById('logPass');

    let hasError = false;
    if (!nameField.value.trim()) { nameField.classList.add('error-input'); hasError = true; }
    if (!passField.value) { passField.classList.add('error-input'); hasError = true; }

    if (hasError) {
        showMsg('logMsg', 'الرجاء تعبئة كافة الحقول الفارغة باللون الأحمر.', 'var(--danger)');
        return;
    }

    let doctors = JSON.parse(localStorage.getItem('medicare_doctors')) || [];
    const doctor = doctors.find(d => d.name === nameField.value.trim() && d.pass === passField.value);

    if(doctor) {
        localStorage.setItem('medicare_current_doctor', doctor.name);
        loadDashboard(doctor.name);
    } else {
        nameField.classList.add('error-input');
        passField.classList.add('error-input');
        showMsg('logMsg', 'خطأ في اسم الطبيب أو كلمة المرور.', 'var(--danger)');
    }
}

function showMsg(elementId, text, color) {
    const el = document.getElementById(elementId);
    el.style.color = color;
    el.innerText = text;
}

function loadDashboard(doctorName) {
    document.getElementById('authSection').classList.remove('active');
    document.getElementById('dashboardSection').classList.add('active');
    document.getElementById('mainWrapper').classList.add('dashboard-mode');
    document.getElementById('mainTitle').innerText = 'لوحة التحكم';
    document.getElementById('docWelcomeName').innerText = 'أهلاً بك، ' + doctorName;
    renderAppointmentsTable(doctorName);
}

function renderAppointmentsTable(doctorName) {
    let appointments = JSON.parse(localStorage.getItem('medicare_appointments')) || [];
    let docAppointments = appointments.filter(a => a.doctor === doctorName);
    
    document.getElementById('totalAppointmentsCount').innerText = docAppointments.length;
    const container = document.getElementById('appointmentsTableContainer');

    if(docAppointments.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-regular fa-folder-open" style="font-size: 40px; margin-bottom: 10px; color: #cbd5e1;"></i>
                <p>لا توجد أي مواعيد محجوزة لديك حتى الآن.</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th><i class="fa-solid fa-user"></i> اسم المريض</th>
                        <th><i class="fa-solid fa-phone"></i> وسائل الاتصال</th>
                        <th><i class="fa-solid fa-calendar-day"></i> الموعد والساعة</th>
                        <th><i class="fa-solid fa-circle-check"></i> الحالة</th>
                        <th><i class="fa-solid fa-gears"></i> الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
    `;

    docAppointments.forEach((item, index) => {
        let badgeClass = "badge";
        let statusText = item.status || "قيد الانتظار";
        
        if (statusText === "قيد الانتظار") badgeClass = "badge badge-warning";
        else if (statusText === "مؤكد") badgeClass = "badge badge-success";
        else if (statusText === "ملغي") badgeClass = "badge badge-danger";
        else if (statusText === "مكتمل") badgeClass = "badge badge-success";

        html += `
            <tr>
                <td><strong>${item.patientName}</strong></td>
                <td>${item.patientContact}</td>
                <td>${item.date} (${item.time})</td>
                <td><span class="${badgeClass}">${statusText}</span></td>
                <td>
                    <button onclick="updateAppointmentStatus('${doctorName}', ${index}, 'مؤكد')" class="btn-action btn-success" title="موافقة على الموعد"><i class="fa-solid fa-check"></i></button>
                    <button onclick="updateAppointmentStatus('${doctorName}', ${index}, 'مكتمل')" class="btn-action" style="background: var(--primary);" title="تحديد كمكتمل"><i class="fa-solid fa-flag-checkered"></i></button>
                    <button onclick="updateAppointmentStatus('${doctorName}', ${index}, 'ملغي')" class="btn-action btn-danger" title="رفض أو إلغاء الموعد"><i class="fa-solid fa-xmark"></i></button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

function updateAppointmentStatus(doctorName, targetIndex, newStatus) {
    let appointments = JSON.parse(localStorage.getItem('medicare_appointments')) || [];
    let docAppointments = appointments.filter(a => a.doctor === doctorName);
    
    if(docAppointments[targetIndex]) {
        let targetItem = docAppointments[targetIndex];
        let globalIndex = appointments.findIndex(a => 
            a.doctor === targetItem.doctor && 
            a.patientName === targetItem.patientName && 
            a.date === targetItem.date && 
            a.time === targetItem.time
        );

        if(globalIndex !== -1) {
            appointments[globalIndex].status = newStatus;
            localStorage.setItem('medicare_appointments', JSON.stringify(appointments));
            renderAppointmentsTable(doctorName);
        }
    }
}

function handleDeleteAccount() {
    if(confirm('هل أنت متأكد من رغبتك في حذف حسابك النهائي وإزالة كافة مواعيدك؟')) {
        const currentDoc = localStorage.getItem('medicare_current_doctor');
        let doctors = JSON.parse(localStorage.getItem('medicare_doctors')) || [];
        doctors = doctors.filter(d => d.name !== currentDoc);
        localStorage.setItem('medicare_doctors', JSON.stringify(doctors));

        let appointments = JSON.parse(localStorage.getItem('medicare_appointments')) || [];
        appointments = appointments.filter(a => a.doctor !== currentDoc);
        localStorage.setItem('medicare_appointments', JSON.stringify(appointments));

        handleLogout();
    }
}

function handleLogout() {
    localStorage.removeItem('medicare_current_doctor');
    document.getElementById('dashboardSection').classList.remove('active');
    document.getElementById('authSection').classList.add('active');
    document.getElementById('mainWrapper').classList.remove('dashboard-mode');
    document.getElementById('mainTitle').innerText = 'بوابة الأطباء';
    document.getElementById('logName').value = '';
    document.getElementById('logPass').value = '';
    document.getElementById('logMsg').innerText = '';
    clearErrors('login');
}

window.onload = function() {
    const activeDoc = localStorage.getItem('medicare_current_doctor');
    if(activeDoc) {
        loadDashboard(activeDoc);
    }
}