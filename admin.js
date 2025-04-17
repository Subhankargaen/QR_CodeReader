// Sample user data (replace with actual data from your backend)
let users = [
    { username: 'user1', email: 'user1@example.com', status: 'active' },
    { username: 'user2', email: 'user2@example.com', status: 'blocked' },
    { username: 'user3', email: 'user3@example.com', status: 'active' }
];

// DOM Elements
const totalUsersElement = document.getElementById('totalUsers');
const activeUsersElement = document.getElementById('activeUsers');
const blockedUsersElement = document.getElementById('blockedUsers');
const userTableBody = document.getElementById('userTableBody');
const userSearch = document.getElementById('userSearch');
const logoutBtn = document.querySelector('.logout-btn');

// Initialize the admin panel
function initAdminPanel() {
    updateStats();
    renderUserTable();
    setupEventListeners();
}

// Update statistics
function updateStats() {
    const total = users.length;
    const active = users.filter(user => user.status === 'active').length;
    const blocked = users.filter(user => user.status === 'blocked').length;

    totalUsersElement.textContent = total;
    activeUsersElement.textContent = active;
    blockedUsersElement.textContent = blocked;
}

// Render user table
function renderUserTable(filteredUsers = users) {
    userTableBody.innerHTML = '';
    
    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>
                <span class="status-badge ${user.status}">${user.status}</span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="editUser('${user.username}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn block-btn" onclick="toggleUserStatus('${user.username}')">
                    <i class="fas ${user.status === 'active' ? 'fa-lock' : 'fa-unlock'}"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteUser('${user.username}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        userTableBody.appendChild(row);
    });
}

// Search functionality
function setupEventListeners() {
    userSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredUsers = users.filter(user => 
            user.username.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );
        renderUserTable(filteredUsers);
    });

    logoutBtn.addEventListener('click', () => {
        // Add logout functionality here
        window.location.href = 'login.html';
    });
}

// User management functions
function editUser(username) {
    const user = users.find(u => u.username === username);
    if (user) {
        // Implement edit functionality
        console.log('Editing user:', user);
    }
}

function toggleUserStatus(username) {
    const user = users.find(u => u.username === username);
    if (user) {
        user.status = user.status === 'active' ? 'blocked' : 'active';
        updateStats();
        renderUserTable();
    }
}

function deleteUser(username) {
    if (confirm('Are you sure you want to delete this user?')) {
        users = users.filter(u => u.username !== username);
        updateStats();
        renderUserTable();
    }
}

// Initialize the admin panel when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Security check for admin access
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const isAdmin = localStorage.getItem('isAdmin');
    
    if (!isLoggedIn || isLoggedIn !== 'true' || !isAdmin || isAdmin !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // Set admin username
    const adminUsername = localStorage.getItem('username');
    document.getElementById('admin-username').textContent = adminUsername || 'Admin';

    // Initialize Firebase listeners
    initializeFirebaseListeners();

    // Handle search functionality
    const searchInput = document.getElementById('search-users');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
        const filteredUsers = users.filter(user => 
            user.email.toLowerCase().includes(searchTerm)
        );
        displayUsers(filteredUsers);
    });

    // Handle logout
    document.getElementById('logout-btn').addEventListener('click', function() {
        // Clear admin session
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('username');
        
        // Sign out from Firebase
        firebase.auth().signOut().then(() => {
            window.location.href = 'login.html';
        });
    });
});

function initializeFirebaseListeners() {
    // Listen for real-time updates to users
    const usersRef = database.ref('users');
    
    usersRef.on('value', (snapshot) => {
        const users = snapshot.val() || {};
        const usersArray = Object.values(users);
        
        // Update localStorage
        localStorage.setItem('registeredUsers', JSON.stringify(usersArray));
        
        // Update UI
        displayUsers(usersArray);
    });
}

function displayUsers(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    if (users.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="4" style="text-align: center; padding: 20px;">
                No registered users found
            </td>
        `;
        tbody.appendChild(tr);
        return;
    }

    users.forEach(user => {
        const tr = document.createElement('tr');
        
        // Format registration date
        const registrationDate = new Date(user.registrationDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        tr.innerHTML = `
            <td>${user.email}</td>
            <td>${registrationDate}</td>
            <td>
                <span class="status-badge ${user.isAdmin ? 'status-active' : 'status-inactive'}">
                    ${user.isAdmin ? 'Admin' : 'User'}
                </span>
            </td>
            <td>
                <button class="action-btn view-btn" onclick="viewUser('${user.email}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editUser('${user.email}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteUser('${user.email}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function viewUser(email) {
    const usersRef = database.ref('users');
    usersRef.orderByChild('email').equalTo(email).once('value', (snapshot) => {
        const user = snapshot.val();
        if (user) {
            const userData = Object.values(user)[0];
            alert(`User Details:\nEmail: ${userData.email}\nRole: ${userData.isAdmin ? 'Admin' : 'User'}\nRegistration Date: ${new Date(userData.registrationDate).toLocaleDateString()}`);
        }
    });
}

function editUser(email) {
    const usersRef = database.ref('users');
    usersRef.orderByChild('email').equalTo(email).once('value', (snapshot) => {
        const user = snapshot.val();
        if (user) {
            const userKey = Object.keys(user)[0];
            const userData = user[userKey];
            const newRole = userData.isAdmin ? 'User' : 'Admin';
            
            if (confirm(`Do you want to change ${email}'s role to ${newRole}?`)) {
                usersRef.child(userKey).update({
                    isAdmin: !userData.isAdmin
                });
            }
        }
    });
}

function deleteUser(email) {
    if (confirm(`Are you sure you want to delete ${email}?`)) {
        const usersRef = database.ref('users');
        usersRef.orderByChild('email').equalTo(email).once('value', (snapshot) => {
            const user = snapshot.val();
            if (user) {
                const userKey = Object.keys(user)[0];
                usersRef.child(userKey).remove();
            }
        });
    }
} 