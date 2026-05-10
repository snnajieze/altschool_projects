const form = document.getElementById('registrationForm');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const ageInput = document.getElementById('age');

const fullNameMessage = document.getElementById('fullNameMessage');
const emailMessage = document.getElementById('emailMessage');
const passwordMessage = document.getElementById('passwordMessage');
const confirmPasswordMessage = document.getElementById('confirmPasswordMessage');
const ageMessage = document.getElementById('ageMessage');
const successMessage = document.getElementById('successMessage');

function showError(input, messageElement, message) {
    input.classList.add('invalid');
    input.classList.remove('valid');
    messageElement.textContent = message;
}

function showSuccess(input, messageElement) {
    input.classList.remove('invalid');
    input.classList.add('valid');
    messageElement.textContent = '';
}

function validateFullName() {
    const value = fullNameInput.value.trim();
    const nameParts = value.split(/\s+/).filter(Boolean);

    if (!value) {
        showError(fullNameInput, fullNameMessage, 'Full name cannot be empty.');
        return false;
    }
    if (nameParts.length < 2) {
        showError(fullNameInput, fullNameMessage, 'Please enter at least two words.');
        return false;
    }

    showSuccess(fullNameInput, fullNameMessage);
    return true;
}

function validateEmail() {
    const value = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!value) {
        showError(emailInput, emailMessage, 'Email address is required.');
        return false;
    }
    if (!emailPattern.test(value)) {
        showError(emailInput, emailMessage, 'Enter a valid email address.');
        return false;
    }

    showSuccess(emailInput, emailMessage);
    return true;
}

function validatePassword() {
    const value = passwordInput.value;
    const lengthValid = value.length >= 8;
    const uppercaseValid = /[A-Z]/.test(value);
    const numberValid = /[0-9]/.test(value);
    const specialCharValid = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (!value) {
        showError(passwordInput, passwordMessage, 'Password is required.');
        return false;
    }
    if (!lengthValid || !uppercaseValid || !numberValid || !specialCharValid) {
        showError(
            passwordInput,
            passwordMessage,
            'Password must be at least 8 characters and include one uppercase letter, one number, and one special character.'
        );
        return false;
    }

    showSuccess(passwordInput, passwordMessage);
    return true;
}

function validateConfirmPassword() {
    const passwordValue = passwordInput.value;
    const confirmValue = confirmPasswordInput.value;

    if (!confirmValue) {
        showError(confirmPasswordInput, confirmPasswordMessage, 'Please confirm your password.');
        return false;
    }
    if (passwordValue !== confirmValue) {
        showError(confirmPasswordInput, confirmPasswordMessage, 'Passwords do not match.');
        return false;
    }

    showSuccess(confirmPasswordInput, confirmPasswordMessage);
    return true;
}

function validateAge() {
    const value = parseInt(ageInput.value, 10);

    if (!ageInput.value) {
        showError(ageInput, ageMessage, 'Age is required.');
        return false;
    }
    if (Number.isNaN(value) || value < 18) {
        showError(ageInput, ageMessage, 'You must be 18 or older.');
        return false;
    }

    showSuccess(ageInput, ageMessage);
    return true;
}

function validateForm() {
    const isFullNameValid = validateFullName();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const isAgeValid = validateAge();

    return isFullNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid && isAgeValid;
}

form.addEventListener('submit', function (event) {
    event.preventDefault();
    successMessage.style.display = 'none';

    if (validateForm()) {
        successMessage.textContent = 'Registration successful! All inputs are valid.';
        successMessage.style.display = 'block';
        alert('Success! Your registration form is valid.');
        form.reset();
        document.querySelectorAll('input').forEach(input => input.classList.remove('valid'));
    } else {
        alert('Please fix the errors before submitting the form.');
    }
});

fullNameInput.addEventListener('input', validateFullName);
emailInput.addEventListener('input', validateEmail);
passwordInput.addEventListener('input', validatePassword);
confirmPasswordInput.addEventListener('input', validateConfirmPassword);
ageInput.addEventListener('input', validateAge);
