function clearErrors(formType) {
    let container;
    if (formType === 'login') container = document.getElementById('loginFormContainer');
    else if (formType === 'register') container = document.getElementById('registerFormContainer');
    else container = document.getElementById('bookingForm');
    
    container.querySelectorAll('input, select').forEach(el => el.classList.remove('error-input'));
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
    const emailField = document.getElementById('regEmail');
    const passField = document.getElementById('regPass');

    let hasError = false;
    if(!nameField.value.trim()) { nameField.classList.add('error-input'); hasError = true; }
    if(!phoneField.value.trim()) { phoneField.classList.add('error-input'); hasError = true; }
    if(!emailField.value.trim()) { emailField.classList.add('error-input'); hasError = true; }
    if(!passField.value) { passField.classList.add('error-input'); hasError = true; }

    if (hasError) {
        showMsg('regMsg', 'جميع الخانات إجبارية وتم تمييز الحقول الفارغة.', 'var(--danger)');
        return;
    }

    if (passField.value.length < 8) {
        passField.classList.add('error-input');
        showMsg('regMsg', 'كلمة المرور يجب ألا تقل عن 8 خانات.', 'var(--danger)');
        return;
    }

    let patients = JSON.parse(localStorage.getItem('medicare_patients')) || [];
    let doctors = JSON.parse(localStorage.getItem('medicare_doctors')) || [];
    
    if(patients.some(p => p.name === nameField.value.trim())) {
        nameField.classList.add('error-input');
        showMsg('regMsg', 'خطأ: هذا الاسم الثلاثي مسجل مسبقاً.', 'var(--danger)');
        return;
    }

    const emailVal = emailField.value.trim();
    if(patients.some(p => p.email === emailVal) || doctors.some(d => d.email === emailVal)) {
        emailField.classList.add('error-input');
        showMsg('regMsg', 'خطأ: البريد الإلكتروني مستخدم مسبقاً.', 'var(--danger)');
        return;
    }

    patients.push({
        name: nameField.value.trim(),
        phone: phoneField.value.trim(),
        email: emailVal,
        pass: passField.value
    });
    localStorage.setItem('medicare_patients', JSON.stringify(patients));

    showMsg('regMsg', 'تم إنشاء الحساب بنجاح! جاري تحويلك للدخول...', 'var(--success)');
    setTimeout(() => switchTab('login'), 1500);
}

function handleLogin(e) {
    e.preventDefault();
    clearErrors('login');
    const nameField = document.getElementById('logName');
    const passField = document.getElementById('logPass');

    let hasError = false;
    if(!nameField.value.trim()) { nameField.classList.add('error-input'); hasError = true; }
    if(!passField.value) { passField.classList.add('error-input'); hasError = true; }

    if (hasError) {
        showMsg('logMsg', 'الرجاء تعبئة كافة الحقول الفارغة.', 'var(--danger)');
        return;
    }

    let patients = JSON.parse(localStorage.getItem('medicare_patients')) || [];
    const patient = patients.find(p => p.name === nameField.value.trim() && p.pass === passField.value);

    if(patient) {
        localStorage.setItem('medicare_current_patient', JSON.stringify(patient));
        openDashboard(patient);
    } else {
        nameField.classList.add('error-input');
        passField.classList.add('error-input');
        showMsg('logMsg', 'خطأ في اسم المريض أو كلمة المرور.', 'var(--danger)');
    }
}

function showMsg(elementId, text, color) {
    const el = document.getElementById(elementId);
    el.style.color = color;
    el.innerText = text;
}

function openDashboard(patient) {
    document.getElementById('authSection').classList.remove('active');
    document.getElementById('dashboardSection').classList.add('active');
    document.getElementById('mainWrapper').classList.add('dashboard-mode');
    document.getElementById('mainTitle').innerText = 'بوابة المريض';
    document.getElementById('patientWelcomeName').innerText = 'مرحباً، ' + patient.name;

    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('appointmentDate').setAttribute('min', todayStr);

    populateDoctorsDropdown();
    renderPatientAppointments(patient.name);
}

function populateDoctorsDropdown() {
    const select = document.getElementById('doctorSelect');
    let doctors = JSON.parse(localStorage.getItem('medicare_doctors')) || [];

    select.innerHTML = '<option value="">-- اختر طبيب من القائمة --</option>';
    doctors.forEach(doc => {
        let opt = document.createElement('option');
        opt.value = doc.name;
        opt.textContent = `${doc.name} (${doc.spec})`;
        select.appendChild(opt);
    });
}

function handleBooking(e) {
    e.preventDefault();
    clearErrors('booking');
    const doctorField = document.getElementById('doctorSelect');
    const dateField = document.getElementById('appointmentDate');
    const timeField = document.getElementById('appointmentTime');
    const currentPatient = JSON.parse(localStorage.getItem('medicare_current_patient'));

    let hasError = false;
    if(!doctorField.value) { doctorField.classList.add('error-input'); hasError = true; }
    if(!dateField.value) { dateField.classList.add('error-input'); hasError = true; }
    if(!timeField.value) { timeField.classList.add('error-input'); hasError = true; }

    if (hasError) {
        showMsg('bookingMsg', 'جميع حقول الحجز إجبارية وتم تعليمها باللون الأحمر.', 'var(--danger)');
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (dateField.value < todayStr) {
        dateField.classList.add('error-input');
        showMsg('bookingMsg', 'عذراً، لا يمكن اختيار تاريخ قديم للحجز.', 'var(--danger)');
        return;
    }

    let appointments = JSON.parse(localStorage.getItem('medicare_appointments')) || [];
    
    appointments.push({
        doctor: doctorField.value,
        patientName: currentPatient.name,
        patientContact: `${currentPatient.phone} / ${currentPatient.email}`,
        date: dateField.value,
        time: timeField.value,
        status: 'قيد الانتظار'
    });

    localStorage.setItem('medicare_appointments', JSON.stringify(appointments));

    showMsg('bookingMsg', 'تم إرسال طلب الحجز بنجاح وهو بانتظار موافقة الطبيب!', 'var(--success)');
    
    doctorField.value = '';
    dateField.value = '';
    timeField.value = '';
    renderPatientAppointments(currentPatient.name);
}

function renderPatientAppointments(patientName) {
    let appointments = JSON.parse(localStorage.getItem('medicare_appointments')) || [];
    let myAppointments = appointments.filter(a => a.patientName === patientName);
    const container = document.getElementById('patientAppointmentsContainer');

    if(myAppointments.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--text-muted); background: #f8fafc; border-radius: 12px; border: 1px solid var(--border);">
                <i class="fa-regular fa-folder-open" style="font-size: 32px; margin-bottom: 8px; color: #cbd5e1;"></i>
                <p style="font-size: 13px;">ليس لديك أي مواعيد محجوزة حتى الآن.</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="table-container" style="max-height: 320px; overflow-y: auto;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>الطبيب</th>
                        <th>الموعد</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
    `;

    myAppointments.forEach(item => {
        let badgeClass = "badge";
        let statusText = item.status || "قيد الانتظار";
        
        if (statusText === "قيد الانتظار") badgeClass = "badge badge-warning";
        else if (statusText === "مؤكد" || statusText === "مكتمل") badgeClass = "badge badge-success";
        else if (statusText === "ملغي") badgeClass = "badge badge-danger";

        html += `
            <tr>
                <td><strong>د. ${item.doctor}</strong></td>
                <td>${item.date}<br><small style="color: var(--text-muted);">${item.time}</small></td>
                <td><span class="${badgeClass}">${statusText}</span></td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

function handleDeleteAccount() {
    if(confirm('هل أنت متأكد من رغبتك في حذف حسابك النهائي؟')) {
        const currentPat = JSON.parse(localStorage.getItem('medicare_current_patient'));
        let patients = JSON.parse(localStorage.getItem('medicare_patients')) || [];
        patients = patients.filter(p => p.name !== currentPat.name);
        localStorage.setItem('medicare_patients', JSON.stringify(patients));

        let appointments = JSON.parse(localStorage.getItem('medicare_appointments')) || [];
        appointments = appointments.filter(a => a.patientName !== currentPat.name);
        localStorage.setItem('medicare_appointments', JSON.stringify(appointments));

        handleLogout();
    }
}

function handleLogout() {
    localStorage.removeItem('medicare_current_patient');
    document.getElementById('dashboardSection').classList.remove('active');
    document.getElementById('authSection').classList.add('active');
    document.getElementById('mainWrapper').classList.remove('dashboard-mode');
    document.getElementById('mainTitle').innerText = 'بوابة المرضى';
    document.getElementById('logName').value = '';
    document.getElementById('logPass').value = '';
    document.getElementById('logMsg').innerText = '';
    clearErrors('login');
}

window.onload = function() {
    const activePat = JSON.parse(localStorage.getItem('medicare_current_patient'));
    if(activePat) {
        openDashboard(activePat);
    }
}