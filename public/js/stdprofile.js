document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load profile information on page load
    await fetchProfileDetails();

    // 2. Attach form submit handler
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // 3. Attach file input change listener for PDF resume preview name
    const resumeFileInput = document.getElementById('resumeFile');
    if (resumeFileInput) {
        resumeFileInput.addEventListener('change', (e) => {
            const fileNameDisplay = document.getElementById('fileNameDisplay');
            if (e.target.files && e.target.files.length > 0) {
                fileNameDisplay.textContent = e.target.files[0].name;
            }
        });
    }

    // 4. Attach Logout Button Listener
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Clear local authentication tokens & app cache
            localStorage.removeItem('token');
            localStorage.clear();
            sessionStorage.clear();
            
            // Redirect smoothly to login page
            window.location.replace('/login');
        });
    }
});

// GET profile data from backend API
async function fetchProfileDetails() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('/login');
        return;
    }

    try {
        const response = await fetch('/api/student/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            const studentData = result.data || result.student || result;
            populateFormFields(studentData);
        } else {
            console.error('Fetch error:', result.message);
        }
    } catch (error) {
        console.error('Error fetching profile details:', error);
    }
}

// Populate input fields supporting both camelCase and snake_case backend keys
function populateFormFields(data) {
    if (!data) return;

    // Full Name
    const fullNameVal = data.full_name || data.fullName || data.name || '';
    if (fullNameVal) {
        const profName = document.getElementById('profName');
        if (profName) profName.value = fullNameVal;
    }

    // Email Address
    if (data.email) {
        const profEmail = document.getElementById('profEmail');
        if (profEmail) profEmail.value = data.email;
    }

    // Department / Branch
    const deptVal = data.department || data.dept || data.branch;
    if (deptVal) {
        const profDept = document.getElementById('profDept');
        if (profDept) profDept.value = deptVal;
    }

    // Division
    if (data.division) {
        const profDivision = document.getElementById('profDivision');
        if (profDivision) profDivision.value = data.division;
    }

    // Batch Year
    const batchVal = data.batch_year || data.batchYear || data.batch;
    if (batchVal) {
        const profBatch = document.getElementById('profBatch');
        if (profBatch) profBatch.value = batchVal;
    }

    // CGPA Grade
    const cgpaVal = data.cgpa || data.cgpa_grade;
    if (cgpaVal) {
        const profCgpa = document.getElementById('profCgpa');
        if (profCgpa) profCgpa.value = cgpaVal;
    }

    // Phone Number
    const phoneVal = data.phone_number || data.phoneNumber || data.phone;
    if (phoneVal) {
        const profPhone = document.getElementById('profPhone');
        if (profPhone) profPhone.value = phoneVal;
    }

    // Resume Original Name Display
    const resumeVal = data.resume_original_name || data.resumeOriginalName || data.resume_name;
    if (resumeVal) {
        const fileNameDisplay = document.getElementById('fileNameDisplay');
        if (fileNameDisplay) fileNameDisplay.textContent = resumeVal;
    }
}

// PUT request handler for profile updates
async function handleProfileUpdate(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('/login');
        return;
    }

    const profileData = {
        fullName: document.getElementById('profName').value,
        full_name: document.getElementById('profName').value,
        
        department: document.getElementById('profDept').value,
        
        division: document.getElementById('profDivision').value,
        
        batchYear: document.getElementById('profBatch').value,
        batch_year: document.getElementById('profBatch').value,
        
        cgpa: document.getElementById('profCgpa').value,
        
        phoneNumber: document.getElementById('profPhone').value,
        phone_number: document.getElementById('profPhone').value
    };

    try {
        const response = await fetch('/api/student/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert('Profile updated successfully!');
            
            const updatedData = result.data || result.student || profileData;
            populateFormFields(updatedData);
        } else {
            alert(result.message || 'Failed to update profile.');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Server connection error while saving.');
    }
}