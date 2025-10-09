// Database Manager untuk localStorage
class DatabaseManager {
    constructor() {
        this.initializeDatabase();
    }

    initializeDatabase() {
        if (!localStorage.getItem('sis_database')) {
            const initialData = {
                students: [],
                teachers: [],
                classes: [],
                subjects: [],
                grades: [],
                attendance: [],
                settings: {
                    schoolName: 'SMA Negeri 1 Jakarta',
                    schoolYear: '2024/2025',
                    semester: 'Ganjil',
                    address: 'Jl. Pendidikan No. 1 Jakarta',
                    phone: '(021) 1234567',
                    email: 'info@sman1jakarta.sch.id'
                }
            };
            localStorage.setItem('sis_database', JSON.stringify(initialData));
        }
    }

    get(table) {
        const db = JSON.parse(localStorage.getItem('sis_database'));
        return db[table] || [];
    }

    set(table, data) {
        const db = JSON.parse(localStorage.getItem('sis_database'));
        db[table] = data;
        localStorage.setItem('sis_database', JSON.stringify(db));
    }

    add(table, record) {
        const data = this.get(table);
        record.id = this.generateId();
        record.createdAt = new Date().toISOString();
        data.push(record);
        this.set(table, data);
        return record;
    }

    update(table, id, updates) {
        const data = this.get(table);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
            this.set(table, data);
            return data[index];
        }
        return null;
    }

    delete(table, id) {
        const data = this.get(table);
        const filtered = data.filter(item => item.id !== id);
        this.set(table, filtered);
        return true;
    }

    find(table, id) {
        const data = this.get(table);
        return data.find(item => item.id === id);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    exportToCSV(table) {
        const data = this.get(table);
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');

        return csvContent;
    }

    importFromCSV(table, csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length < 2) return false;

        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
            const record = {};
            headers.forEach((header, index) => {
                record[header] = values[index] || '';
            });
            record.id = this.generateId();
            record.createdAt = new Date().toISOString();
            data.push(record);
        }

        this.set(table, data);
        return true;
    }
}

// Global database instance
const db = new DatabaseManager();

// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
    }

    login(username, password) {
        // Default credentials: admin/admin123
        if (username === 'admin' && password === 'admin123') {
            this.currentUser = {
                id: '1',
                username: 'admin',
                name: 'Administrator',
                role: 'admin'
            };
            localStorage.setItem('sis_current_user', JSON.stringify(this.currentUser));
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('sis_current_user');
    }

    isLoggedIn() {
        if (!this.currentUser) {
            const user = localStorage.getItem('sis_current_user');
            if (user) {
                this.currentUser = JSON.parse(user);
            }
        }
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

const auth = new AuthSystem();

// UI Manager
class UIManager {
    constructor() {
        this.currentPage = 'dashboard';
    }

    showPage(page) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
        
        // Show selected page
        const pageElement = document.getElementById(`${page}Page`);
        if (pageElement) {
            pageElement.classList.remove('hidden');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        document.querySelector(`[onclick="show${page.charAt(0).toUpperCase() + page.slice(1)}()"]`)?.classList.add('active');

        this.currentPage = page;
    }

    showNotification(message, type = 'success') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="close" data-dismiss="alert">
                <span>×</span>
            </button>
        `;
        document.querySelector('.content').prepend(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    showModal(title, content, size = 'modal-lg') {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog ${size}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>×</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        $(modal).modal('show');
        
        $(modal).on('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    confirmAction(message, callback) {
        if (confirm(message)) {
            callback();
        }
    }
}

const ui = new UIManager();

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (auth.isLoggedIn()) {
        showMainApp();
    } else {
        showLoginPage();
    }

    // Setup login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (auth.login(username, password)) {
            showMainApp();
            ui.showNotification('Login berhasil! Selamat datang ' + auth.getCurrentUser().name, 'success');
        } else {
            ui.showNotification('Username atau password salah!', 'danger');
        }
    });
});

function showLoginPage() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('currentUser').textContent = auth.getCurrentUser().name;
    showDashboard();
}

function logout() {
    auth.logout();
    showLoginPage();
    ui.showNotification('Anda telah logout', 'info');
}

// Dashboard Functions
function showDashboard() {
    document.getElementById('pageTitle').textContent = 'Dashboard';
    document.getElementById('breadcrumb').textContent = 'Dashboard';
    
    const students = db.get('students');
    const teachers = db.get('teachers');
    const classes = db.get('classes');
    const subjects = db.get('subjects');
    
    const content = `
        <div class="row fade-in">
            <div class="col-lg-3 col-6">
                <div class="small-box bg-info stat-card">
                    <div class="inner">
                        <h3>${students.length}</h3>
                        <p>Total Siswa</p>
                    </div>
                    <div class="icon">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-6">
                <div class="small-box bg-success stat-card">
                    <div class="inner">
                        <h3>${teachers.length}</h3>
                        <p>Total Guru</p>
                    </div>
                    <div class="icon">
                        <i class="fas fa-chalkboard-teacher"></i>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-6">
                <div class="small-box bg-warning stat-card">
                    <div class="inner">
                        <h3>${classes.length}</h3>
                        <p>Total Kelas</p>
                    </div>
                    <div class="icon">
                        <i class="fas fa-door-open"></i>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-6">
                <div class="small-box bg-danger stat-card">
                    <div class="inner">
                        <h3>${subjects.length}</h3>
                        <p>Mata Pelajaran</p>
                    </div>
                    <div class="icon">
                        <i class="fas fa-book"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Grafik Persebaran Siswa per Kelas</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="studentChart" height="200"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Aktivitas Terkini</h3>
                    </div>
                    <div class="card-body">
                        <div class="timeline timeline-inverse">
                            <div class="time-label">
                                <span class="bg-info">Hari Ini</span>
                            </div>
                            <div>
                                <i class="fas fa-user-plus bg-blue"></i>
                                <div class="timeline-item">
                                    <h3 class="timeline-header">Siswa baru ditambahkan</h3>
                                    <div class="timeline-body">
                                        Sistem telah menambahkan data siswa baru.
                                    </div>
                                </div>
                            </div>
                            <div>
                                <i class="fas fa-edit bg-green"></i>
                                <div class="timeline-item">
                                    <h3 class="timeline-header">Data diperbarui</h3>
                                    <div class="timeline-body">
                                        Data guru telah diperbarui.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
    
    // Create chart
    setTimeout(() => {
        const ctx = document.getElementById('studentChart').getContext('2d');
        const classData = {};
        students.forEach(student => {
            const className = student.className || 'Tidak Diketahui';
            classData[className] = (classData[className] || 0) + 1;
        });
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(classData),
                datasets: [{
                    label: 'Jumlah Siswa',
                    data: Object.values(classData),
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }, 100);
}

// Students Management
function showStudents() {
    document.getElementById('pageTitle').textContent = 'Manajemen Siswa';
    document.getElementById('breadcrumb').textContent = 'Siswa';
    
    const students = db.get('students');
    const classes = db.get('classes');
    
    const content = `
        <div class="row fade-in">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Data Siswa</h3>
                        <div class="card-tools">
                            <button class="btn btn-primary btn-sm" onclick="showAddStudentForm()">
                                <i class="fas fa-plus"></i> Tambah Siswa
                            </button>
                            <button class="btn btn-success btn-sm" onclick="exportStudents()">
                                <i class="fas fa-download"></i> Export CSV
                            </button>
                            <button class="btn btn-info btn-sm" onclick="document.getElementById('importStudents').click()">
                                <i class="fas fa-upload"></i> Import CSV
                            </button>
                            <input type="file" id="importStudents" style="display:none" accept=".csv" onchange="importStudents(event)">
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-striped">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>NIS</th>
                                        <th>Nama</th>
                                        <th>Kelas</th>
                                        <th>Jenis Kelamin</th>
                                        <th>Telepon</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${students.map((student, index) => `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${student.nis}</td>
                                            <td>${student.name}</td>
                                            <td>${student.className}</td>
                                            <td>${student.gender}</td>
                                            <td>${student.phone}</td>
                                            <td>
                                                <button class="btn btn-warning btn-sm" onclick="editStudent('${student.id}')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-danger btn-sm" onclick="deleteStudent('${student.id}')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            ${students.length === 0 ? '<p class="text-center">Belum ada data siswa</p>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function showAddStudentForm() {
    const classes = db.get('classes');
    
    const formContent = `
        <form id="studentForm">
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>NIS</label>
                        <input type="text" class="form-control" name="nis" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Nama Lengkap</label>
                        <input type="text" class="form-control" name="name" required>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Kelas</label>
                        <select class="form-control" name="className" required>
                            <option value="">Pilih Kelas</option>
                            ${classes.map(cls => `<option value="${cls.name}">${cls.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Jenis Kelamin</label>
                        <select class="form-control" name="gender" required>
                            <option value="">Pilih</option>
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tempat Lahir</label>
                        <input type="text" class="form-control" name="birthPlace">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tanggal Lahir</label>
                        <input type="date" class="form-control" name="birthDate">
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Telepon</label>
                        <input type="tel" class="form-control" name="phone">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" class="form-control" name="email">
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Alamat</label>
                <textarea class="form-control" name="address" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label>Nama Orang Tua/Wali</label>
                <input type="text" class="form-control" name="parentName">
            </div>
            <div class="form-group">
                <label>Telepon Orang Tua/Wali</label>
                <input type="tel" class="form-control" name="parentPhone">
            </div>
            <div class="text-right">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan</button>
            </div>
        </form>
    `;
    
    ui.showModal('Tambah Siswa Baru', formContent);
    
    document.getElementById('studentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const student = Object.fromEntries(formData);
        
        db.add('students', student);
        ui.showNotification('Siswa berhasil ditambahkan!', 'success');
        $(this).closest('.modal').modal('hide');
        showStudents();
    });
}

function editStudent(id) {
    const student = db.find('students', id);
    if (!student) return;
    
    const classes = db.get('classes');
    
    const formContent = `
        <form id="editStudentForm">
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>NIS</label>
                        <input type="text" class="form-control" name="nis" value="${student.nis}" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Nama Lengkap</label>
                        <input type="text" class="form-control" name="name" value="${student.name}" required>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Kelas</label>
                        <select class="form-control" name="className" required>
                            <option value="">Pilih Kelas</option>
                            ${classes.map(cls => `<option value="${cls.name}" ${cls.name === student.className ? 'selected' : ''}>${cls.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Jenis Kelamin</label>
                        <select class="form-control" name="gender" required>
                            <option value="">Pilih</option>
                            <option value="Laki-laki" ${student.gender === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
                            <option value="Perempuan" ${student.gender === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tempat Lahir</label>
                        <input type="text" class="form-control" name="birthPlace" value="${student.birthPlace || ''}">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tanggal Lahir</label>
                        <input type="date" class="form-control" name="birthDate" value="${student.birthDate || ''}">
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Telepon</label>
                        <input type="tel" class="form-control" name="phone" value="${student.phone || ''}">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" class="form-control" name="email" value="${student.email || ''}">
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Alamat</label>
                <textarea class="form-control" name="address" rows="3">${student.address || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Nama Orang Tua/Wali</label>
                <input type="text" class="form-control" name="parentName" value="${student.parentName || ''}">
            </div>
            <div class="form-group">
                <label>Telepon Orang Tua/Wali</label>
                <input type="tel" class="form-control" name="parentPhone" value="${student.parentPhone || ''}">
            </div>
            <div class="text-right">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                <button type="submit" class="btn btn-primary">Update</button>
            </div>
        </form>
    `;
    
    ui.showModal('Edit Siswa', formContent);
    
    document.getElementById('editStudentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const updates = Object.fromEntries(formData);
        
        db.update('students', id, updates);
        ui.showNotification('Data siswa berhasil diperbarui!', 'success');
        $(this).closest('.modal').modal('hide');
        showStudents();
    });
}

function deleteStudent(id) {
    ui.confirmAction('Apakah Anda yakin ingin menghapus data siswa ini?', () => {
        db.delete('students', id);
        ui.showNotification('Data siswa berhasil dihapus!', 'success');
        showStudents();
    });
}

function exportStudents() {
    const csvContent = db.exportToCSV('students');
    if (!csvContent) {
        ui.showNotification('Tidak ada data untuk diekspor!', 'warning');
        return;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    ui.showNotification('Data siswa berhasil diekspor!', 'success');
}

function importStudents(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvContent = e.target.result;
        if (db.importFromCSV('students', csvContent)) {
            ui.showNotification('Data siswa berhasil diimpor!', 'success');
            showStudents();
        } else {
            ui.showNotification('Gagal mengimpor data. Periksa format CSV!', 'danger');
        }
    };
    reader.readAsText(file);
}

// Teachers Management
function showTeachers() {
    document.getElementById('pageTitle').textContent = 'Manajemen Guru';
    document.getElementById('breadcrumb').textContent = 'Guru';
    
    const teachers = db.get('teachers');
    
    const content = `
        <div class="row fade-in">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Data Guru</h3>
                        <div class="card-tools">
                            <button class="btn btn-primary btn-sm" onclick="showAddTeacherForm()">
                                <i class="fas fa-plus"></i> Tambah Guru
                            </button>
                            <button class="btn btn-success btn-sm" onclick="exportTeachers()">
                                <i class="fas fa-download"></i> Export CSV
                            </button>
                            <button class="btn btn-info btn-sm" onclick="document.getElementById('importTeachers').click()">
                                <i class="fas fa-upload"></i> Import CSV
                            </button>
                            <input type="file" id="importTeachers" style="display:none" accept=".csv" onchange="importTeachers(event)">
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-striped">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>NIP</th>
                                        <th>Nama</th>
                                        <th>Mata Pelajaran</th>
                                        <th>Jenis Kelamin</th>
                                        <th>Telepon</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${teachers.map((teacher, index) => `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${teacher.nip}</td>
                                            <td>${teacher.name}</td>
                                            <td>${teacher.subject}</td>
                                            <td>${teacher.gender}</td>
                                            <td>${teacher.phone}</td>
                                            <td>
                                                <button class="btn btn-warning btn-sm" onclick="editTeacher('${teacher.id}')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-danger btn-sm" onclick="deleteTeacher('${teacher.id}')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            ${teachers.length === 0 ? '<p class="text-center">Belum ada data guru</p>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function showAddTeacherForm() {
    const subjects = db.get('subjects');
    
    const formContent = `
        <form id="teacherForm">
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>NIP</label>
                        <input type="text" class="form-control" name="nip" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Nama Lengkap</label>
                        <input type="text" class="form-control" name="name" required>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Mata Pelajaran</label>
                        <select class="form-control" name="subject" required>
                            <option value="">Pilih Mata Pelajaran</option>
                            ${subjects.map(subj => `<option value="${subj.name}">${subj.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Jenis Kelamin</label>
                        <select class="form-control" name="gender" required>
                            <option value="">Pilih</option>
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tempat Lahir</label>
                        <input type="text" class="form-control" name="birthPlace">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tanggal Lahir</label>
                        <input type="date" class="form-control" name="birthDate">
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Telepon</label>
                        <input type="tel" class="form-control" name="phone">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" class="form-control" name="email">
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Alamat</label>
                <textarea class="form-control" name="address" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label>Pendidikan Terakhir</label>
                <input type="text" class="form-control" name="education">
            </div>
            <div class="form-group">
                <label>Tahun Mengajar</label>
                <input type="number" class="form-control" name="teachingYear" min="1900" max="2024">
            </div>
            <div class="text-right">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan</button>
            </div>
        </form>
    `;
    
    ui.showModal('Tambah Guru Baru', formContent);
    
    document.getElementById('teacherForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const teacher = Object.fromEntries(formData);
        
        db.add('teachers', teacher);
        ui.showNotification('Guru berhasil ditambahkan!', 'success');
        $(this).closest('.modal').modal('hide');
        showTeachers();
    });
}

function editTeacher(id) {
    const teacher = db.find('teachers', id);
    if (!teacher) return;
    
    const subjects = db.get('subjects');
    
    const formContent = `
        <form id="editTeacherForm">
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>NIP</label>
                        <input type="text" class="form-control" name="nip" value="${teacher.nip}" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Nama Lengkap</label>
                        <input type="text" class="form-control" name="name" value="${teacher.name}" required>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Mata Pelajaran</label>
                        <select class="form-control" name="subject" required>
                            <option value="">Pilih Mata Pelajaran</option>
                            ${subjects.map(subj => `<option value="${subj.name}" ${subj.name === teacher.subject ? 'selected' : ''}>${subj.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Jenis Kelamin</label>
                        <select class="form-control" name="gender" required>
                            <option value="">Pilih</option>
                            <option value="Laki-laki" ${teacher.gender === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
                            <option value="Perempuan" ${teacher.gender === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tempat Lahir</label>
                        <input type="text" class="form-control" name="birthPlace" value="${teacher.birthPlace || ''}">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tanggal Lahir</label>
                        <input type="date" class="form-control" name="birthDate" value="${teacher.birthDate || ''}">
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Telepon</label>
                        <input type="tel" class="form-control" name="phone" value="${teacher.phone || ''}">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" class="form-control" name="email" value="${teacher.email || ''}">
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Alamat</label>
                <textarea class="form-control" name="address" rows="3">${teacher.address || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Pendidikan Terakhir</label>
                <input type="text" class="form-control" name="education" value="${teacher.education || ''}">
            </div>
            <div class="form-group">
                <label>Tahun Mengajar</label>
                <input type="number" class="form-control" name="teachingYear" value="${teacher.teachingYear || ''}" min="1900" max="2024">
            </div>
            <div class="text-right">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                <button type="submit" class="btn btn-primary">Update</button>
            </div>
        </form>
    `;
    
    ui.showModal('Edit Guru', formContent);
    
    document.getElementById('editTeacherForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const updates = Object.fromEntries(formData);
        
        db.update('teachers', id, updates);
        ui.showNotification('Data guru berhasil diperbarui!', 'success');
        $(this).closest('.modal').modal('hide');
        showTeachers();
    });
}

function deleteTeacher(id) {
    ui.confirmAction('Apakah Anda yakin ingin menghapus data guru ini?', () => {
        db.delete('teachers', id);
        ui.showNotification('Data guru berhasil dihapus!', 'success');
        showTeachers();
    });
}

function exportTeachers() {
    const csvContent = db.exportToCSV('teachers');
    if (!csvContent) {
        ui.showNotification('Tidak ada data untuk diekspor!', 'warning');
        return;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    ui.showNotification('Data guru berhasil diekspor!', 'success');
}

function importTeachers(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvContent = e.target.result;
        if (db.importFromCSV('teachers', csvContent)) {
            ui.showNotification('Data guru berhasil diimpor!', 'success');
            showTeachers();
        } else {
            ui.showNotification('Gagal mengimpor data. Periksa format CSV!', 'danger');
        }
    };
    reader.readAsText(file);
}

// Classes Management
function showClasses() {
    document.getElementById('pageTitle').textContent = 'Manajemen Kelas & Jurusan';
    document.getElementById('breadcrumb').textContent = 'Kelas & Jurusan';
    
    const classes = db.get('classes');
    
    const content = `
        <div class="row fade-in">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Data Kelas</h3>
                        <div class="card-tools">
                            <button class="btn btn-primary btn-sm" onclick="showAddClassForm()">
                                <i class="fas fa-plus"></i> Tambah Kelas
                            </button>
                            <button class="btn btn-success btn-sm" onclick="exportClasses()">
                                <i class="fas fa-download"></i> Export CSV
                            </button>
                            <button class="btn btn-info btn-sm" onclick="document.getElementById('importClasses').click()">
                                <i class="fas fa-upload"></i> Import CSV
                            </button>
                            <input type="file" id="importClasses" style="display:none" accept=".csv" onchange="importClasses(event)">
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-striped">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Nama Kelas</th>
                                        <th>Jurusan</th>
                                        <th>Tingkat</th>
                                        <th>Kapasitas</th>
                                        <th>Wali Kelas</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${classes.map((cls, index) => `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${cls.name}</td>
                                            <td>${cls.major}</td>
                                            <td>${cls.level}</td>
                                            <td>${cls.capacity}</td>
                                            <td>${cls.homeroomTeacher || '-'}</td>
                                            <td>
                                                <button class="btn btn-warning btn-sm" onclick="editClass('${cls.id}')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-danger btn-sm" onclick="deleteClass('${cls.id}')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            ${classes.length === 0 ? '<p class="text-center">Belum ada data kelas</p>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function showAddClassForm() {
    const teachers = db.get('teachers');
    
    const formContent = `
        <form id="classForm">
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Nama Kelas</label>
                        <input type="text" class="form-control" name="name" placeholder="Contoh: X IPA 1" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Jurusan</label>
                        <select class="form-control" name="major" required>
                            <option value="">Pilih Jurusan</option>
                            <option value="IPA">IPA</option>
                            <option value="IPS">IPS</option>
                            <option value="Bahasa">Bahasa</option>
                            <option value="TKJ">TKJ</option>
                            <option value="AK">Akuntansi</option>
                            <option value="AP">Administrasi Perkantoran</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tingkat</label>
                        <select class="form-control" name="level" required>
                            <option value="">Pilih Tingkat</option>
                            <option value="X">X (Kelas 10)</option>
                            <option value="XI">XI (Kelas 11)</option>
                            <option value="XII">XII (Kelas 12)</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Kapasitas</label>
                        <input type="number" class="form-control" name="capacity" min="1" max="50" required>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Wali Kelas</label>
                <select class="form-control" name="homeroomTeacher">
                    <option value="">Pilih Wali Kelas</option>
                    ${teachers.map(teacher => `<option value="${teacher.name}">${teacher.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Deskripsi</label>
                <textarea class="form-control" name="description" rows="3"></textarea>
            </div>
            <div class="text-right">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan</button>
            </div>
        </form>
    `;
    
    ui.showModal('Tambah Kelas Baru', formContent);
    
    document.getElementById('classForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const cls = Object.fromEntries(formData);
        
        db.add('classes', cls);
        ui.showNotification('Kelas berhasil ditambahkan!', 'success');
        $(this).closest('.modal').modal('hide');
        showClasses();
    });
}

function editClass(id) {
    const cls = db.find('classes', id);
    if (!cls) return;
    
    const teachers = db.get('teachers');
    
    const formContent = `
        <form id="editClassForm">
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Nama Kelas</label>
                        <input type="text" class="form-control" name="name" value="${cls.name}" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Jurusan</label>
                        <select class="form-control" name="major" required>
                            <option value="">Pilih Jurusan</option>
                            <option value="IPA" ${cls.major === 'IPA' ? 'selected' : ''}>IPA</option>
                            <option value="IPS" ${cls.major === 'IPS' ? 'selected' : ''}>IPS</option>
                            <option value="Bahasa" ${cls.major === 'Bahasa' ? 'selected' : ''}>Bahasa</option>
                            <option value="TKJ" ${cls.major === 'TKJ' ? 'selected' : ''}>TKJ</option>
                            <option value="AK" ${cls.major === 'AK' ? 'selected' : ''}>Akuntansi</option>
                            <option value="AP" ${cls.major === 'AP' ? 'selected' : ''}>Administrasi Perkantoran</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tingkat</label>
                        <select class="form-control" name="level" required>
                            <option value="">Pilih Tingkat</option>
                            <option value="X" ${cls.level === 'X' ? 'selected' : ''}>X (Kelas 10)</option>
                            <option value="XI" ${cls.level === 'XI' ? 'selected' : ''}>XI (Kelas 11)</option>
                            <option value="XII" ${cls.level === 'XII' ? 'selected' : ''}>XII (Kelas 12)</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Kapasitas</label>
                        <input type="number" class="form-control" name="capacity" value="${cls.capacity}" min="1" max="50" required>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Wali Kelas</label>
                <select class="form-control" name="homeroomTeacher">
                    <option value="">Pilih Wali Kelas</option>
                    ${teachers.map(teacher => `<option value="${teacher.name}" ${teacher.name === cls.homeroomTeacher ? 'selected' : ''}>${teacher.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Deskripsi</label>
                <textarea class="form-control" name="description" rows="3">${cls.description || ''}</textarea>
            </div>
            <div class="text-right">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                <button type="submit" class="btn btn-primary">Update</button>
            </div>
        </form>
    `;
    
    ui.showModal('Edit Kelas', formContent);
    
    document.getElementById('editClassForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const updates = Object.fromEntries(formData);
        
        db.update('classes', id, updates);
        ui.showNotification('Data kelas berhasil diperbarui!', 'success');
        $(this).closest('.modal').modal('hide');
        showClasses();
    });
}

function deleteClass(id) {
    ui.confirmAction('Apakah Anda yakin ingin menghapus data kelas ini?', () => {
        db.delete('classes', id);
        ui.showNotification('Data kelas berhasil dihapus!', 'success');
        showClasses();
    });
}

function exportClasses() {
    const csvContent = db.exportToCSV('classes');
    if (!csvContent) {
        ui.showNotification('Tidak ada data untuk diekspor!', 'warning');
        return;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    ui.showNotification('Data kelas berhasil diekspor!', 'success');
}

function importClasses(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvContent = e.target.result;
        if (db.importFromCSV('classes', csvContent)) {
            ui.showNotification('Data kelas berhasil diimpor!', 'success');
            showClasses();
        } else {
            ui.showNotification('Gagal mengimpor data. Periksa format CSV!', 'danger');
        }
    };
    reader.readAsText(file);
}

// Subjects Management
function showSubjects() {
    document.getElementById('pageTitle').textContent = 'Manajemen Mata Pelajaran';
    document.getElementById('breadcrumb').textContent = 'Mata Pelajaran';
    
    const subjects = db.get('subjects');
    
    const content = `
        <div class="row fade-in">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Data Mata Pelajaran</h3>
                        <div class="card-tools">
                            <button class="btn btn-primary btn-sm" onclick="showAddSubjectForm()">
                                <i class="fas fa-plus"></i> Tambah Mata Pelajaran
                            </button>
                            <button class="btn btn-success btn-sm" onclick="exportSubjects()">
                                <i class="fas fa-download"></i> Export CSV
                            </button>
                            <button class="btn btn-info btn-sm" onclick="document.getElementById('importSubjects').click()">
                                <i class="fas fa-upload"></i> Import CSV
                            </button>
                            <input type="file" id="importSubjects" style="display:none" accept=".csv" onchange="importSubjects(event)">
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-striped">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Kode</th>
                                        <th>Nama Mata Pelajaran</th>
                                        <th>Kelompok</th>
                                        <th>Jumlah Jam</th>
                                        <th>Kurikulum</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${subjects.map((subject, index) => `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${subject.code}</td>
                                            <td>${subject.name}</td>
                                            <td>${subject.group}</td>
                                            <td>${subject.hours}</td>
                                            <td>${subject.curriculum}</td>
                                            <td>
                                                <button class="btn btn-warning btn-sm" onclick="editSubject('${subject.id}')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-danger btn-sm" onclick="deleteSubject('${subject.id}')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            ${subjects.length === 0 ? '<p class="text-center">Belum ada data mata pelajaran</p>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function showAddSubjectForm() {
    const formContent = `
        <form id="subjectForm">
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Kode Mata Pelajaran</label>
                        <input type="text" class="form-control" name="code" placeholder="Contoh: MTK001" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Nama Mata Pelajaran</label>
                        <input type="text" class="form-control" name="name" placeholder="Contoh: Matematika" required>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Kelompok</label>
                        <select class="form-control" name="group" required>
                            <option value="">Pilih Kelompok</option>
                            <option value="A">Kelompok A (Wajib)</option>
                            <option value="B">Kelompok B (Wajib)</option>
                            <option value="C1">Kelompok C1 (Peminatan IPA)</option>
                            <option value="C2">Kelompok C2 (Peminatan IPS)</option>
                            <option value="C3">Kelompok C3 (Bahasa dan Budaya)</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Jumlah Jam per Minggu</label>
                        <input type="number" class="form-control" name="hours" min="1" max="10" required>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Kurikulum</label>
                <select class="form-control" name="curriculum" required>
                    <option value="">Pilih Kurikulum</option>
                    <option value="2013">Kurikulum 2013</option>
                    <option value="Merdeka">Kurikulum Merdeka</option>
                    <option value="Revisi 2016">Kurikulum 2013 Revisi 2016</option>
                </select>
            </div>
            <div class="form-group">
                <label>Deskripsi</label>
                <textarea class="form-control" name="description" rows="3"></textarea>
            </div>
            <div class="text-right">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan</button>
            </div>
        </form>
    `;
    
    ui.showModal('Tambah Mata Pelajaran Baru', formContent);
    
    document.getElementById('subjectForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const subject = Object.fromEntries(formData);
        
        db.add('subjects', subject);
        ui.showNotification('Mata pelajaran berhasil ditambahkan!', 'success');
        $(this).closest('.modal').modal('hide');
        showSubjects();
    });
}

function editSubject(id) {
    const subject = db.find('subjects', id);
    if (!subject) return;
    
    const formContent = `
        <form id="editSubjectForm">
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Kode Mata Pelajaran</label>
                        <input type="text" class="form-control" name="code" value="${subject.code}" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Nama Mata Pelajaran</label>
                        <input type="text" class="form-control" name="name" value="${subject.name}" required>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Kelompok</label>
                        <select class="form-control" name="group" required>
                            <option value="">Pilih Kelompok</option>
                            <option value="A" ${subject.group === 'A' ? 'selected' : ''}>Kelompok A (Wajib)</option>
                            <option value="B" ${subject.group === 'B' ? 'selected' : ''}>Kelompok B (Wajib)</option>
                            <option value="C1" ${subject.group === 'C1' ? 'selected' : ''}>Kelompok C1 (Peminatan IPA)</option>
                            <option value="C2" ${subject.group === 'C2' ? 'selected' : ''}>Kelompok C2 (Peminatan IPS)</option>
                            <option value="C3" ${subject.group === 'C3' ? 'selected' : ''}>Kelompok C3 (Bahasa dan Budaya)</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Jumlah Jam per Minggu</label>
                        <input type="number" class="form-control" name="hours" value="${subject.hours}" min="1" max="10" required>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Kurikulum</label>
                <select class="form-control" name="curriculum" required>
                    <option value="">Pilih Kurikulum</option>
                    <option value="2013" ${subject.curriculum === '2013' ? 'selected' : ''}>Kurikulum 2013</option>
                    <option value="Merdeka" ${subject.curriculum === 'Merdeka' ? 'selected' : ''}>Kurikulum Merdeka</option>
                    <option value="Revisi 2016" ${subject.curriculum === 'Revisi 2016' ? 'selected' : ''}>Kurikulum 2013 Revisi 2016</option>
                </select>
            </div>
            <div class="form-group">
                <label>Deskripsi</label>
                <textarea class="form-control" name="description" rows="3">${subject.description || ''}</textarea>
            </div>
            <div class="text-right">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                <button type="submit" class="btn btn-primary">Update</button>
            </div>
        </form>
    `;
    
    ui.showModal('Edit Mata Pelajaran', formContent);
    
    document.getElementById('editSubjectForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const updates = Object.fromEntries(formData);
        
        db.update('subjects', id, updates);
        ui.showNotification('Data mata pelajaran berhasil diperbarui!', 'success');
        $(this).closest('.modal').modal('hide');
        showSubjects();
    });
}

function deleteSubject(id) {
    ui.confirmAction('Apakah Anda yakin ingin menghapus data mata pelajaran ini?', () => {
        db.delete('subjects', id);
        ui.showNotification('Data mata pelajaran berhasil dihapus!', 'success');
        showSubjects();
    });
}

function exportSubjects() {
    const csvContent = db.exportToCSV('subjects');
    if (!csvContent) {
        ui.showNotification('Tidak ada data untuk diekspor!', 'warning');
        return;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subjects_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    ui.showNotification('Data mata pelajaran berhasil diekspor!', 'success');
}

function importSubjects(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvContent = e.target.result;
        if (db.importFromCSV('subjects', csvContent)) {
            ui.showNotification('Data mata pelajaran berhasil diimpor!', 'success');
            showSubjects();
        } else {
            ui.showNotification('Gagal mengimpor data. Periksa format CSV!', 'danger');
        }
    };
    reader.readAsText(file);
}

// Grades Management
function showGrades() {
    document.getElementById('pageTitle').textContent = 'Manajemen Nilai';
    document.getElementById('breadcrumb').textContent = 'Nilai';
    
    const grades = db.get('grades');
    const students = db.get('students');
    const subjects = db.get('subjects');
    
    const content = `
        <div class="row fade-in">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Data Nilai Siswa</h3>
                        <div class="card-tools">
                            <button class="btn btn-primary btn-sm" onclick="showAddGradeForm()">
                                <i class="fas fa-plus"></i> Tambah Nilai
                            </button>
                            <button class="btn btn-success btn-sm" onclick="exportGrades()">
                                <i class="fas fa-download"></i> Export CSV
                            </button>
                            <button class="btn btn-info btn-sm" onclick="document.getElementById('importGrades').click()">
                                <i class="fas fa-upload"></i> Import CSV
                            </button>
                            <input type="file" id="importGrades" style="display:none" accept=".csv" onchange="importGrades(event)">
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-striped">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>NIS</th>
                                        <th>Nama Siswa</th>
                                        <th>Mata Pelajaran</th>
                                        <th>Tipe Nilai</th>
                                        <th>Nilai</th>
                                        <th>Semester</th>
                                        <th>Tahun Ajaran</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${grades.map((grade, index) => {
                                        const student = students.find(s => s.id === grade.studentId);
                                        const subject = subjects.find(s => s.id === grade.subjectId);
                                        return `
                                            <tr>
                                                <td>${index + 1}</td>
                                                <td>${student ? student.nis : '-'}</td>
                                                <td>${student ? student.name : '-'}</td>
                                                <td>${subject ? subject.name : '-'}</td>
                                                <td>${grade.type}</td>
                                                <td>${grade.score}</td>
                                                <td>${grade.semester}</td>
                                                <td>${grade.academicYear}</td>
                                                <td>
                                                    <button class="btn btn-warning btn-sm" onclick="editGrade('${grade.id}')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-danger btn-sm" onclick="deleteGrade('${grade.id}')">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                            ${grades.length === 0 ? '<p class="text-center">Belum ada data nilai</p>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function showAddGradeForm() {
    const students = db.get('students');
    const subjects = db.get('subjects');
    
    const formContent = `
        <form id="gradeForm">
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Siswa</label>
                        <select class="form-control" name="studentId" required>
                            <option value="">Pilih Siswa</option>
                            ${students.map(student => `<option value="${student.id}">${student.name} (${student.nis})</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Mata Pelajaran</label>
                        <select class="form-control" name="subjectId" required>
                            <option value="">Pilih Mata Pelajaran</option>
                            ${subjects.map(subject => `<option value="${subject.id}">${subject.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tipe Nilai</label>
                        <select class="form-control" name="type" required>
                            <option value="">Pilih Tipe</option>
                            <option value="Tugas">Tugas</option>
                            <option value="UTS">UTS</option>
                            <option value="UAS">UAS</option>
                            <option value="Praktik">Praktik</option>
                            <option value="Quiz">Quiz</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Nilai (0-100)</label>
                        <input type="number" class="form-control" name="score" min="0" max="100" required>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Semester</label>
                        <select class="form-control" name="semester" required>
                            <option value="">Pilih Semester</option>
                            <option value="Ganjil">Ganjil</option>
                            <option value="Genap">Genap</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tahun Ajaran</label>
                        <input type="text" class="form-control" name="academicYear" placeholder="Contoh: 2024/2025" required>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Keterangan</label>
                <textarea class="form-control" name="description" rows="3"></textarea>
            </div>
            <div class="text-right">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan</button>
            </div>
        </form>
    `;
    
    ui.showModal('Tambah Nilai Baru', formContent);
    
    document.getElementById('gradeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const grade = Object.fromEntries(formData);
        
        db.add('grades', grade);
        ui.showNotification('Nilai berhasil ditambahkan!', 'success');
        $(this).closest('.modal').modal('hide');
        showGrades();
    });
}

function editGrade(id) {
    const grade = db.find('grades', id);
    if (!grade) return;
    
    const students = db.get('students');
    const subjects = db.get('subjects');
    
    const formContent = `
        <form id="editGradeForm">
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Siswa</label>
                        <select class="form-control" name="studentId" required>
                            <option value="">Pilih Siswa</option>
                            ${students.map(student => `<option value="${student.id}" ${student.id === grade.studentId ? 'selected' : ''}>${student.name} (${student.nis})</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Mata Pelajaran</label>
                        <select class="form-control" name="subjectId" required>
                            <option value="">Pilih Mata Pelajaran</option>
                            ${subjects.map(subject => `<option value="${subject.id}" ${subject.id === grade.subjectId ? 'selected' : ''}>${subject.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tipe Nilai</label>
                        <select class="form-control" name="type" required>
                            <option value="">Pilih Tipe</option>
                            <option value="Tugas" ${grade.type === 'Tugas' ? 'selected' : ''}>Tugas</option>
                            <option value="UTS" ${grade.type === 'UTS' ? 'selected' : ''}>UTS</option>
                            <option value="UAS" ${grade.type === 'UAS' ? 'selected' : ''}>UAS</option>
                            <option value="Praktik" ${grade.type === 'Praktik' ? 'selected' : ''}>Praktik</option>
                            <option value="Quiz" ${grade.type === 'Quiz' ? 'selected' : ''}>Quiz</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Nilai (0-100)</label>
                        <input type="number" class="form-control" name="score" value="${grade.score}" min="0" max="100" required>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Semester</label>
                        <select class="form-control" name="semester" required>
                            <option value="">Pilih Semester</option>
                            <option value="Ganjil" ${grade.semester === 'Ganjil' ? 'selected' : ''}>Ganjil</option>
                            <option value="Genap" ${grade.semester === 'Genap' ? 'selected' : ''}>Genap</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tahun Ajaran</label>
                        <input type="text" class="form-control" name="academicYear" value="${grade.academicYear}" required>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Keterangan</label>
                <textarea class="form-control" name="description" rows="3">${grade.description || ''}</textarea>
            </div>
            <div class="text-right">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                <button type="submit" class="btn btn-primary">Update</button>
            </div>
        </form>
    `;
    
    ui.showModal('Edit Nilai', formContent);
    
    document.getElementById('editGradeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const updates = Object.fromEntries(formData);
        
        db.update('grades', id, updates);
        ui.showNotification('Data nilai berhasil diperbarui!', 'success');
        $(this).closest('.modal').modal('hide');
        showGrades();
    });
}

function deleteGrade(id) {
    ui.confirmAction('Apakah Anda yakin ingin menghapus data nilai ini?', () => {
        db.delete('grades', id);
        ui.showNotification('Data nilai berhasil dihapus!', 'success');
        showGrades();
    });
}

function exportGrades() {
    const csvContent = db.exportToCSV('grades');
    if (!csvContent) {
        ui.showNotification('Tidak ada data untuk diekspor!', 'warning');
        return;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grades_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    ui.showNotification('Data nilai berhasil diekspor!', 'success');
}

function importGrades(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvContent = e.target.result;
        if (db.importFromCSV('grades', csvContent)) {
            ui.showNotification('Data nilai berhasil diimpor!', 'success');
            showGrades();
        } else {
            ui.showNotification('Gagal mengimpor data. Periksa format CSV!', 'danger');
        }
    };
    reader.readAsText(file);
}

// Attendance Management
function showAttendance() {
    document.getElementById('pageTitle').textContent = 'Manajemen Absensi';
    document.getElementById('breadcrumb').textContent = 'Absensi';
    
    const attendance = db.get('attendance');
    const students = db.get('students');
    
    const content = `
        <div class="row fade-in">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Data Absensi Siswa</h3>
                        <div class="card-tools">
                            <button class="btn btn-primary btn-sm" onclick="showAddAttendanceForm()">
                                <i class="fas fa-plus"></i> Tambah Absensi
                            </button>
                            <button class="btn btn-success btn-sm" onclick="exportAttendance()">
                                <i class="fas fa-download"></i> Export CSV
                            </button>
                            <button class="btn btn-info btn-sm" onclick="document.getElementById('importAttendance').click()">
                                <i class="fas fa-upload"></i> Import CSV
                            </button>
                            <input type="file" id="importAttendance" style="display:none" accept=".csv" onchange="importAttendance(event)">
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-striped">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Tanggal</th>
                                        <th>NIS</th>
                                        <th>Nama Siswa</th>
                                        <th>Status</th>
                                        <th>Keterangan</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${attendance.map((att, index) => {
                                        const student = students.find(s => s.id === att.studentId);
                                        return `
                                            <tr>
                                                <td>${index + 1}</td>
                                                <td>${att.date}</td>
                                                <td>${student ? student.nis : '-'}</td>
                                                <td>${student ? student.name : '-'}</td>
                                                <td>
                                                    <span class="badge badge-${att.status === 'Hadir' ? 'success' : att.status === 'Sakit' ? 'warning' : att.status === 'Izin' ? 'info' : 'danger'}">
                                                        ${att.status}
                                                    </span>
                                                </td>
                                                <td>${att.description || '-'}</td>
                                                <td>
                                                    <button class="btn btn-warning btn-sm" onclick="editAttendance('${att.id}')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-danger btn-sm" onclick="deleteAttendance('${att.id}')">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                            ${attendance.length === 0 ? '<p class="text-center">Belum ada data absensi</p>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function showAddAttendanceForm() {
    const students = db.get('students');
    
    const formContent = `
        <form id="attendanceForm">
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tanggal</label>
                        <input type="date" class="form-control" name="date" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Siswa</label>
                        <select class="form-control" name="studentId" required>
                            <option value="">Pilih Siswa</option>
                            ${students.map(student => `<option value="${student.id}">${student.name} (${student.nis})</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Status</label>
                        <select class="form-control" name="status" required>
                            <option value="">Pilih Status</option>
                            <option value="Hadir">Hadir</option>
                            <option value="Sakit">Sakit</option>
                            <option value="Izin">Izin</option>
                            <option value="Tanpa Keterangan">Tanpa Keterangan</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Jam Masuk</label>
                        <input type="time" class="form-control" name="checkIn">
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Keterangan</label>
                <textarea class="form-control" name="description" rows="3"></textarea>
            </div>
            <div class="text-right">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan</button>
            </div>
        </form>
    `;
    
    ui.showModal('Tambah Absensi Baru', formContent);
    
    document.getElementById('attendanceForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const attendance = Object.fromEntries(formData);
        
        db.add('attendance', attendance);
        ui.showNotification('Absensi berhasil ditambahkan!', 'success');
        $(this).closest('.modal').modal('hide');
        showAttendance();
    });
}

function editAttendance(id) {
    const attendance = db.find('attendance', id);
    if (!attendance) return;
    
    const students = db.get('students');
    
    const formContent = `
        <form id="editAttendanceForm">
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tanggal</label>
                        <input type="date" class="form-control" name="date" value="${attendance.date}" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Siswa</label>
                        <select class="form-control" name="studentId" required>
                            <option value="">Pilih Siswa</option>
                            ${students.map(student => `<option value="${student.id}" ${student.id === attendance.studentId ? 'selected' : ''}>${student.name} (${student.nis})</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Status</label>
                        <select class="form-control" name="status" required>
                            <option value="">Pilih Status</option>
                            <option value="Hadir" ${attendance.status === 'Hadir' ? 'selected' : ''}>Hadir</option>
                            <option value="Sakit" ${attendance.status === 'Sakit' ? 'selected' : ''}>Sakit</option>
                            <option value="Izin" ${attendance.status === 'Izin' ? 'selected' : ''}>Izin</option>
                            <option value="Tanpa Keterangan" ${attendance.status === 'Tanpa Keterangan' ? 'selected' : ''}>Tanpa Keterangan</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Jam Masuk</label>
                        <input type="time" class="form-control" name="checkIn" value="${attendance.checkIn || ''}">
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Keterangan</label>
                <textarea class="form-control" name="description" rows="3">${attendance.description || ''}</textarea>
            </div>
            <div class="text-right">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                <button type="submit" class="btn btn-primary">Update</button>
            </div>
        </form>
    `;
    
    ui.showModal('Edit Absensi', formContent);
    
    document.getElementById('editAttendanceForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const updates = Object.fromEntries(formData);
        
        db.update('attendance', id, updates);
        ui.showNotification('Data absensi berhasil diperbarui!', 'success');
        $(this).closest('.modal').modal('hide');
        showAttendance();
    });
}

function deleteAttendance(id) {
    ui.confirmAction('Apakah Anda yakin ingin menghapus data absensi ini?', () => {
        db.delete('attendance', id);
        ui.showNotification('Data absensi berhasil dihapus!', 'success');
        showAttendance();
    });
}

function exportAttendance() {
    const csvContent = db.exportToCSV('attendance');
    if (!csvContent) {
        ui.showNotification('Tidak ada data untuk diekspor!', 'warning');
        return;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    ui.showNotification('Data absensi berhasil diekspor!', 'success');
}

function importAttendance(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvContent = e.target.result;
        if (db.importFromCSV('attendance', csvContent)) {
            ui.showNotification('Data absensi berhasil diimpor!', 'success');
            showAttendance();
        } else {
            ui.showNotification('Gagal mengimpor data. Periksa format CSV!', 'danger');
        }
    };
    reader.readAsText(file);
}

// Reports Management
function showReports() {
    document.getElementById('pageTitle').textContent = 'Laporan';
    document.getElementById('breadcrumb').textContent = 'Laporan';
    
    const students = db.get('students');
    const teachers = db.get('teachers');
    const classes = db.get('classes');
    const subjects = db.get('subjects');
    const grades = db.get('grades');
    const attendance = db.get('attendance');
    
    const content = `
        <div class="row fade-in">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Ringkasan Laporan</h3>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="info-box">
                                    <span class="info-box-icon bg-info"><i class="fas fa-users"></i></span>
                                    <div class="info-box-content">
                                        <span class="info-box-text">Total Siswa</span>
                                        <span class="info-box-number">${students.length}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-box">
                                    <span class="info-box-icon bg-success"><i class="fas fa-chalkboard-teacher"></i></span>
                                    <div class="info-box-content">
                                        <span class="info-box-text">Total Guru</span>
                                        <span class="info-box-number">${teachers.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row mt-4">
                            <div class="col-md-6">
                                <h5>Laporan Absensi Hari Ini</h5>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Status</th>
                                                <th>Jumlah</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><span class="badge badge-success">Hadir</span></td>
                                                <td>${attendance.filter(a => a.status === 'Hadir').length}</td>
                                            </tr>
                                            <tr>
                                                <td><span class="badge badge-warning">Sakit</span></td>
                                                <td>${attendance.filter(a => a.status === 'Sakit').length}</td>
                                            </tr>
                                            <tr>
                                                <td><span class="badge badge-info">Izin</span></td>
                                                <td>${attendance.filter(a => a.status === 'Izin').length}</td>
                                            </tr>
                                            <tr>
                                                <td><span class="badge badge-danger">Tanpa Keterangan</span></td>
                                                <td>${attendance.filter(a => a.status === 'Tanpa Keterangan').length}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h5>Statistik Nilai</h5>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Rata-rata Nilai</th>
                                                <th>Jumlah</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>85 - 100 (Sangat Baik)</td>
                                                <td>${grades.filter(g => g.score >= 85).length}</td>
                                            </tr>
                                            <tr>
                                                <td>70 - 84 (Baik)</td>
                                                <td>${grades.filter(g => g.score >= 70 && g.score < 85).length}</td>
                                            </tr>
                                            <tr>
                                                <td>55 - 69 (Cukup)</td>
                                                <td>${grades.filter(g => g.score >= 55 && g.score < 70).length}</td>
                                            </tr>
                                            <tr>
                                                <td>< 55 (Kurang)</td>
                                                <td>${grades.filter(g => g.score < 55).length}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row mt-4">
                            <div class="col-12">
                                <h5>Export Laporan</h5>
                                <div class="btn-group">
                                    <button class="btn btn-primary" onclick="generateFullReport()">
                                        <i class="fas fa-file-pdf"></i> Generate Laporan Lengkap
                                    </button>
                                    <button class="btn btn-success" onclick="exportAllData()">
                                        <i class="fas fa-database"></i> Export Semua Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function generateFullReport() {
    const reportData = {
        generatedAt: new Date().toISOString(),
        students: db.get('students'),
        teachers: db.get('teachers'),
        classes: db.get('classes'),
        subjects: db.get('subjects'),
        grades: db.get('grades'),
        attendance: db.get('attendance'),
        settings: db.get('settings')
    };
    
    const reportContent = `
LAPORAN LENGKAP SISTEM INFORMASI SEKOLAH
========================================
Tanggal Generate: ${new Date().toLocaleString('id-ID')}

INFORMASI SEKOLAH
-----------------
Nama Sekolah: ${reportData.settings.schoolName}
Tahun Ajaran: ${reportData.settings.schoolYear}
Semester: ${reportData.settings.semester}
Alamat: ${reportData.settings.address}
Telepon: ${reportData.settings.phone}
Email: ${reportData.settings.email}

RINGKASAN DATA
---------------
Total Siswa: ${reportData.students.length}
Total Guru: ${reportData.teachers.length}
Total Kelas: ${reportData.classes.length}
Total Mata Pelajaran: ${reportData.subjects.length}
Total Data Nilai: ${reportData.grades.length}
Total Data Absensi: ${reportData.attendance.length}

DATA SISWA
----------
${reportData.students.map((s, i) => `${i+1}. ${s.name} (${s.nis}) - Kelas: ${s.className}`).join('\n')}

DATA GURU
---------
${reportData.teachers.map((t, i) => `${i+1}. ${t.name} (${t.nip}) - ${t.subject}`).join('\n')}

DATA KELAS
----------
${reportData.classes.map((c, i) => `${i+1}. ${c.name} - ${c.major} - Kapasitas: ${c.capacity}`).join('\n')}

STATISTIK ABSENSI
-----------------
Hadir: ${reportData.attendance.filter(a => a.status === 'Hadir').length}
Sakit: ${reportData.attendance.filter(a => a.status === 'Sakit').length}
Izin: ${reportData.attendance.filter(a => a.status === 'Izin').length}
Tanpa Keterangan: ${reportData.attendance.filter(a => a.status === 'Tanpa Keterangan').length}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_lengkap_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    ui.showNotification('Laporan lengkap berhasil di-generate!', 'success');
}

function exportAllData() {
    const allData = {
        students: db.get('students'),
        teachers: db.get('teachers'),
        classes: db.get('classes'),
        subjects: db.get('subjects'),
        grades: db.get('grades'),
        attendance: db.get('attendance'),
        settings: db.get('settings')
    };
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    ui.showNotification('Semua data berhasil di-backup!', 'success');
}

// Settings Management
function showSettings() {
    document.getElementById('pageTitle').textContent = 'Pengaturan';
    document.getElementById('breadcrumb').textContent = 'Pengaturan';
    
    const settings = db.get('settings');
    
    const content = `
        <div class="row fade-in">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Pengaturan Sistem</h3>
                    </div>
                    <div class="card-body">
                        <form id="settingsForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Nama Sekolah</label>
                                        <input type="text" class="form-control" name="schoolName" value="${settings.schoolName}" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Tahun Ajaran</label>
                                        <input type="text" class="form-control" name="schoolYear" value="${settings.schoolYear}" placeholder="Contoh: 2024/2025" required>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Semester</label>
                                        <select class="form-control" name="semester" required>
                                            <option value="Ganjil" ${settings.semester === 'Ganjil' ? 'selected' : ''}>Ganjil</option>
                                            <option value="Genap" ${settings.semester === 'Genap' ? 'selected' : ''}>Genap</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Telepon</label>
                                        <input type="tel" class="form-control" name="phone" value="${settings.phone}">
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Alamat</label>
                                <input type="text" class="form-control" name="address" value="${settings.address}">
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" class="form-control" name="email" value="${settings.email}">
                            </div>
                            <div class="text-right">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Simpan Pengaturan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Pengaturan Data</h3>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>Perhatian!</strong> Tindakan ini akan mempengaruhi seluruh data sistem.
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-info" onclick="importBackup()">
                                <i class="fas fa-upload"></i> Import Backup
                            </button>
                            <button class="btn btn-warning" onclick="clearAllData()">
                                <i class="fas fa-trash"></i> Hapus Semua Data
                            </button>
                            <button class="btn btn-danger" onclick="resetSystem()">
                                <i class="fas fa-redo"></i> Reset Sistem
                            </button>
                        </div>
                        <input type="file" id="backupFile" style="display:none" accept=".json" onchange="processBackup(event)">
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
    
    document.getElementById('settingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const updates = Object.fromEntries(formData);
        
        db.set('settings', { ...settings, ...updates });
        ui.showNotification('Pengaturan berhasil disimpan!', 'success');
    });
}

function importBackup() {
    document.getElementById('backupFile').click();
}

function processBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);
            
            // Restore all data
            db.set('students', backupData.students || []);
            db.set('teachers', backupData.teachers || []);
            db.set('classes', backupData.classes || []);
            db.set('subjects', backupData.subjects || []);
            db.set('grades', backupData.grades || []);
            db.set('attendance', backupData.attendance || []);
            db.set('settings', backupData.settings || db.get('settings'));
            
            ui.showNotification('Backup berhasil diimport!', 'success');
            showSettings();
        } catch (error) {
            ui.showNotification('Gagal mengimport backup. File tidak valid!', 'danger');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    ui.confirmAction('Apakah Anda yakin ingin menghapus SEMUA data? Tindakan ini tidak dapat dibatalkan!', () => {
        db.set('students', []);
        db.set('teachers', []);
        db.set('classes', []);
        db.set('subjects', []);
        db.set('grades', []);
        db.set('attendance', []);
        
        ui.showNotification('Semua data berhasil dihapus!', 'success');
        showSettings();
    });
}

function resetSystem() {
    ui.confirmAction('Apakah Anda yakin ingin mereset seluruh sistem ke pengaturan awal? Tindakan ini tidak dapat dibatalkan!', () => {
        localStorage.removeItem('sis_database');
        localStorage.removeItem('sis_current_user');
        
        // Reinitialize database
        db.initializeDatabase();
        
        ui.showNotification('Sistem berhasil direset ke pengaturan awal!', 'success');
        setTimeout(() => {
            location.reload();
        }, 2000);
    });
}

function showProfile() {
    const user = auth.getCurrentUser();
    
    const profileContent = `
        <div class="text-center">
            <i class="fas fa-user-circle fa-5x text-primary mb-3"></i>
            <h4>${user.name}</h4>
            <p class="text-muted">${user.role === 'admin' ? 'Administrator' : 'User'}</p>
            <hr>
            <div class="text-left">
                <p><strong>Username:</strong> ${user.username}</p>
                <p><strong>Role:</strong> ${user.role}</p>
                <p><strong>ID:</strong> ${user.id}</p>
            </div>
        </div>
    `;
    
    ui.showModal('Profile User', profileContent, 'modal-md');
}