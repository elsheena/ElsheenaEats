import { getProfile, updateProfile } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('token')) {
        window.location.href = '/pages/login.html';
        return;
    }

    try {
        const profile = await getProfile();
        console.log('Full profile data:', profile);
        
        if (profile) {
            populateProfileForm(profile);
        } else {
            console.error('No profile data received');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        if (error.message.includes('401')) {
            window.location.href = '/pages/login.html';
        } else {
            const errorElement = document.getElementById('profileError');
            if (errorElement) {
                errorElement.textContent = 'Failed to load profile data. Please try again.';
                errorElement.style.display = 'block';
            }
        }
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const phoneNumber = document.getElementById('phoneNumber').value;
            const formattedPhone = phoneNumber ? phoneNumber.replace(/[^\d+]/g, '') : null;
            
            const userData = {
                fullName: document.getElementById('fullName').value.trim(),
                gender: document.getElementById('gender').value,
                birthDate: document.getElementById('birthDate').value ? new Date(document.getElementById('birthDate').value).toISOString() : null,
                address: document.getElementById('address').value.trim() || null,
                phoneNumber: formattedPhone
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
    
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        console.log('Phone number from profile:', profile.phoneNumber);
        if (profile.phoneNumber) {
            phoneInput.value = formatPhoneNumber(profile.phoneNumber);
        }
        
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value) {
                if (!value.startsWith('7')) {
                    value = '7' + value;
                }
                
                if (value.length <= 11) {
                    value = value.replace(/(\d{1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/, function(match, p1, p2, p3, p4, p5) {
                        let parts = ['+' + p1];
                        if (p2) parts.push(' (' + p2 + ')');
                        if (p3) parts.push(' ' + p3);
                        if (p4) parts.push('-' + p4);
                        if (p5) parts.push('-' + p5);
                        return parts.join('');
                    });
                }
            }
            
            e.target.value = value;
        });

        phoneInput.placeholder = '+7 (xxx) xxx-xx-xx';
        phoneInput.pattern = '\\+7 \\(\\d{3}\\) \\d{3}-\\d{2}-\\d{2}';
    } else {
        console.error('Phone number input not found');
    }

    document.getElementById('fullName').value = profile.fullName || '';
    document.getElementById('gender').value = profile.gender || 'Male';
    
    if (profile.birthDate) {
        const birthDate = new Date(profile.birthDate);
        if (!isNaN(birthDate.getTime())) {
            document.getElementById('birthDate').value = birthDate.toISOString().split('T')[0];
        }
    }
    
    document.getElementById('address').value = profile.address || '';
    
    const emailElement = document.getElementById('email');
    if (emailElement) {
        emailElement.value = profile.email || '';
        emailElement.setAttribute('readonly', true);
    }
}

function formatPhoneNumber(phone) {
    let numbers = phone.replace(/\D/g, '');
    
    if (!numbers.startsWith('7')) {
        numbers = '7' + numbers;
    }

    numbers = numbers.slice(0, 11);
    
    return numbers.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3-$4-$5');
}