// Global variables
const API_URL = 'https://jsonplaceholder.typicode.com/users';
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
const usersPerPage = 5;
let editingUserId = null;

// Initialize app
async function init() {
    await fetchUsers();
    setupEventListeners();
}

// Fetch users from API
async function fetchUsers() {
    try {
        showLoading(true);
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        
        allUsers = await response.json();
        filteredUsers = [...allUsers];
        currentPage = 1;
        renderUsers();
        renderPagination();
        showLoading(false);
    } catch (error) {
        showLoading(false);
        showAlert('Error loading users: ' + error.message, 'error');
    }
}

// Render users table
function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    const start = (currentPage - 1) * usersPerPage;
    const end = start + usersPerPage;
    const usersToShow = filteredUsers.slice(start, end);

    if (usersToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = usersToShow.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-success" onclick="openEditModal(${user.id})">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="deleteUser(${user.id})">🗑️ Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Render pagination
function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = `
        <button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            ⬅️ Previous
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }

    html += `
        <button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Next ➡️
        </button>
    `;

    pagination.innerHTML = html;
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderUsers();
    renderPagination();
}

// Search users
function searchUsers(query) {
    query = query.toLowerCase().trim();
    if (query === '') {
        filteredUsers = [...allUsers];
    } else {
        filteredUsers = allUsers.filter(user => 
            user.name.toLowerCase().includes(query)
        );
    }
    currentPage = 1;
    renderUsers();
    renderPagination();
}

// Open create modal
function openCreateModal() {
    editingUserId = null;
    document.getElementById('modalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('userModal').classList.add('active');
}

// Open edit modal
function openEditModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    editingUserId = userId;
    document.getElementById('modalTitle').textContent = 'Edit User';
    document.getElementById('userName').value = user.name;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userPhone').value = user.phone;
    document.getElementById('userModal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('userModal').classList.remove('active');
    document.getElementById('userForm').reset();
    editingUserId = null;
}

// Create user
async function createUser(userData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error('Failed to create user');
        }

        const newUser = await response.json();
        
        // Manually update UI
        newUser.id = allUsers.length > 0 ? Math.max(...allUsers.map(u => u.id)) + 1 : 1;
        allUsers.unshift(newUser);
        filteredUsers = [...allUsers];
        currentPage = 1;
        renderUsers();
        renderPagination();
        
        showAlert('User created successfully!', 'success');
        closeModal();
    } catch (error) {
        showAlert('Error creating user: ' + error.message, 'error');
    }
}

// Update user
async function updateUser(userId, userData) {
    try {
        const response = await fetch(`${API_URL}/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error('Failed to update user');
        }

        // Manually update UI
        const index = allUsers.findIndex(u => u.id === userId);
        if (index !== -1) {
            allUsers[index] = { ...allUsers[index], ...userData };
            filteredUsers = [...allUsers];
            renderUsers();
        }
        
        showAlert('User updated successfully!', 'success');
        closeModal();
    } catch (error) {
        showAlert('Error updating user: ' + error.message, 'error');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${userId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete user');
        }

        // Manually update UI
        allUsers = allUsers.filter(u => u.id !== userId);
        filteredUsers = filteredUsers.filter(u => u.id !== userId);
        
        // Adjust current page if needed
        const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        
        renderUsers();
        renderPagination();
        showAlert('User deleted successfully!', 'success');
    } catch (error) {
        showAlert('Error deleting user: ' + error.message, 'error');
    }
}

// Form submit handler
async function handleFormSubmit(e) {
    e.preventDefault();

    const userData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        phone: document.getElementById('userPhone').value
    };

    if (editingUserId) {
        await updateUser(editingUserId, userData);
    } else {
        await createUser(userData);
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchUsers(e.target.value);
    });

    document.getElementById('userForm').addEventListener('submit', handleFormSubmit);

    // Close modal on outside click
    document.getElementById('userModal').addEventListener('click', (e) => {
        if (e.target.id === 'userModal') {
            closeModal();
        }
    });
}

// Show/hide loading
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
    document.getElementById('tableContainer').style.display = show ? 'none' : 'block';
}

// Show alert
function showAlert(message, type) {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = type;
    alert.textContent = message;
    container.innerHTML = '';
    container.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Start the app
init();
