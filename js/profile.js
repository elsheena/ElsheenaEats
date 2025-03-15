import { getProfile, updateProfile } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('token')) {
        window.location.href = '/pages/login.html';
        return;
    }

    try {
        const profile = await getProfile();
        if (profile) {
            populateProfileForm(profile);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        if (error.message.includes('401')) {
            window.location.href = '/pages/login.html';
        }
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userData = {
                fullName: document.getElementById('fullName').value.trim(),
                gender: document.getElementById('gender').value,
                birthDate: document.getElementById('birthDate').value ? new Date(document.getElementById('birthDate').value).toISOString() : null,
                address: document.getElementById('address').value.trim() || null,
                phoneNumber: document.getElementById('phoneNumber').value.trim() || null
            };

            try {
                await updateProfile(userData);
                const successMsg = document.getElementById('profileSuccess');
                if (successMsg) {
                    successMsg.textContent = 'Profile updated successfully!';
                    successMsg.style.display = 'block';
                    setTimeout(() => {
                        successMsg.style.display = 'none';
                    }, 3000);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                const errorElement = document.getElementById('profileError');
                if (errorElement) {
                    errorElement.textContent = error.message || 'Failed to update profile. Please try again.';
                    errorElement.style.display = 'block';
                }
            }
        });
    }
});

function populateProfileForm(profile) {
    console.log('Profile data received:', profile);
    
    document.getElementById('fullName').value = profile.fullName || '';
    document.getElementById('gender').value = profile.gender || 'Male';
    document.getElementById('birthDate').value = profile.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : '';
    document.getElementById('address').value = profile.address || '';
    document.getElementById('phoneNumber').value = profile.phoneNumber || '';
    
    const phoneInput = document.getElementById('phoneNumber');
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^\d+]/g, '');
        if (value.includes('+') && value.indexOf('+') > 0) {
            value = value.replace(/\+/g, '');
        }
        e.target.value = value;
    });
    
    const emailElement = document.getElementById('email');
    if (emailElement) {
        emailElement.value = profile.email || '';
        emailElement.setAttribute('readonly', true);
    }
}