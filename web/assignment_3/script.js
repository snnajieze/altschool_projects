const studentForm = document.getElementById('studentForm');
const studentNameInput = document.getElementById('studentName');
const studentGradeInput = document.getElementById('studentGrade');
const errorMessage = document.getElementById('errorMessage');
const averageGradeElement = document.getElementById('averageGrade');
const studentTableBody = document.querySelector('#studentTable tbody');

let students = [];

function loadStudents() {
    const stored = localStorage.getItem('studentTrackerStudents');
    if (!stored) {
        return;
    }

    try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
            students = parsed;
        }
    } catch (error) {
        console.warn('Could not parse saved students.', error);
    }
}

function saveStudents() {
    localStorage.setItem('studentTrackerStudents', JSON.stringify(students));
}

function getAverageGrade() {
    if (students.length === 0) {
        return null;
    }
    const total = students.reduce((sum, student) => sum + student.grade, 0);
    return total / students.length;
}

function updateAverage() {
    const average = getAverageGrade();
    if (average === null) {
        averageGradeElement.textContent = 'No students yet';
        return;
    }
    averageGradeElement.textContent = average.toFixed(2);
}

function clearTable() {
    studentTableBody.innerHTML = '';
}

function renderStudents() {
    clearTable();
    const average = getAverageGrade();

    students.forEach((student) => {
        const row = document.createElement('tr');
        if (average !== null && student.grade > average) {
            row.classList.add('highlight');
        }

        const nameCell = document.createElement('td');
        nameCell.textContent = student.name;

        const gradeCell = document.createElement('td');
        gradeCell.textContent = student.grade.toString();

        const actionCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', () => removeStudent(student.id));
        actionCell.appendChild(deleteButton);

        row.appendChild(nameCell);
        row.appendChild(gradeCell);
        row.appendChild(actionCell);
        studentTableBody.appendChild(row);
    });

    updateAverage();
}

function showError(message) {
    errorMessage.textContent = message;
}

function clearError() {
    errorMessage.textContent = '';
}

function validateInputs() {
    const name = studentNameInput.value.trim();
    const gradeValue = studentGradeInput.value.trim();
    const grade = Number(gradeValue);

    if (!name) {
        showError('Student name cannot be empty.');
        return null;
    }

    if (gradeValue === '' || Number.isNaN(grade)) {
        showError('Grade must be a number between 0 and 100.');
        return null;
    }

    if (grade < 0 || grade > 100) {
        showError('Grade must be between 0 and 100.');
        return null;
    }

    clearError();
    return { name, grade };
}

function addStudent(student) {
    students.push(student);
    saveStudents();
    renderStudents();
}

function removeStudent(id) {
    students = students.filter((student) => student.id !== id);
    saveStudents();
    renderStudents();
}

function clearForm() {
    studentNameInput.value = '';
    studentGradeInput.value = '';
    studentNameInput.focus();
}

studentForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const validated = validateInputs();
    if (!validated) {
        return;
    }

    const nextId = students.length > 0 ? Math.max(...students.map((s) => s.id)) + 1 : 1;
    addStudent({ id: nextId, name: validated.name, grade: validated.grade });
    clearForm();
});

studentNameInput.addEventListener('input', clearError);
studentGradeInput.addEventListener('input', clearError);

loadStudents();
renderStudents();
