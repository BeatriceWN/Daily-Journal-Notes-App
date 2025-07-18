// ===== DOM ELEMENT REFERENCES =====
const notesContainer = document.getElementById('notesContainer');       // Where all notes will be displayed
const searchInput = document.getElementById('searchInput');             // Search bar input
const importantOnly = document.getElementById('importantOnly');         // Checkbox to filter only important notes
const noteForm = document.getElementById('noteForm');                   // The main note form
const noteTitle = document.getElementById('noteTitle');                 // Input for note title
const noteDate = document.getElementById('noteDate');                   // Input for date
const noteImportant = document.getElementById('noteImportant');         // Checkbox to mark note as important
const toggleDarkMode = document.getElementById('toggleDarkMode');       // Button to toggle dark mode

// ===== STATE VARIABLES =====
const API_BASE = "http://localhost:3000";                               // Local JSON-server endpoint
let allNotes = [];                                                      // Array to hold notes from API or localStorage
noteForm.dataset.editingId = '';                                        // Tracks which note is currently being edited

// ===== INITIALIZE QUILL EDITOR =====
const quill = new Quill('#quillEditor', {
  theme: 'snow',
  modules: { toolbar: '#toolbar' }
});

// ===== TOAST MESSAGE UTILITY =====
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast show';
  toast.textContent = message;

  if (document.body.classList.contains('dark-mode')) {
    toast.style.background = '#333';
    toast.style.color = 'white';
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('show');
    document.body.removeChild(toast);
  }, 3000);
}

// ===== MODAL CONFIRMATION UTILITY =====
function showModal(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <p>${message}</p>
      <button id="confirmDelete">Yes</button>
      <button id="cancelDelete">Cancel</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const dismiss = () => document.body.contains(overlay) && document.body.removeChild(overlay);
  overlay.querySelector('#confirmDelete').onclick = () => { onConfirm(); dismiss(); };
  overlay.querySelector('#cancelDelete').onclick = dismiss;

  setTimeout(dismiss, 5000); // Auto-close modal after 5 seconds
}

// ===== LOCAL STORAGE UTILITIES =====
function saveToLocal(notes) {
  localStorage.setItem('localNotes', JSON.stringify(notes));
}

function loadFromLocal() {
  const saved = localStorage.getItem('localNotes');
  return saved ? JSON.parse(saved) : [];
}

// ===== FETCH NOTES FROM API OR FALLBACK =====
async function fetchNotes() {
  try {
    const res = await fetch(`${API_BASE}/notes`);
    if (!res.ok) throw new Error();
    allNotes = await res.json();     // Load from API
    saveToLocal(allNotes);           // Update local storage
  } catch {
    allNotes = loadFromLocal();      // Fallback to local storage
  }
  renderNotes();                     // Re-render UI
}

// ===== RENDER NOTES ON SCREEN =====
function renderNotes() {
  const query = searchInput.value.toLowerCase();

  const filtered = allNotes.filter(note => {
    const matchesText = note.title.toLowerCase().includes(query) || note.body.toLowerCase().includes(query);
    const matchesImportance = importantOnly.checked ? note.important : true;
    return matchesText && matchesImportance;
  });

  notesContainer.innerHTML = ''; // Clear previous notes

  filtered.forEach(note => {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note' + (note.important ? ' important' : '');
    noteDiv.innerHTML = `
      <h3>${note.title}</h3>
      <div>${note.body}</div>
      <div class="note-footer">
        <span>${note.date}</span>
        <div>
          <button onclick="editNote('${note.id}')">Edit</button>
          <button onclick="deleteNote('${note.id}')">Delete</button>
        </div>
      </div>
    `;
    notesContainer.appendChild(noteDiv);
  });
}

// ===== FORM SUBMIT HANDLER =====
noteForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const isEdit = !!noteForm.dataset.editingId;
  const editingId = noteForm.dataset.editingId;

  const note = {
    title: noteTitle.value,
    body: quill.root.innerHTML,
    date: noteDate.value || new Date().toISOString().split('T')[0],
    important: noteImportant.checked
  };

  try {
    let res;
    if (isEdit) {
      res = await fetch(`${API_BASE}/notes/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });
      if (!res.ok) throw new Error('Update failed');
      allNotes = allNotes.map(n => n.id.toString() === editingId ? { ...n, ...note } : n);
      showToast('Note updated');
    } else {
      res = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });
      if (!res.ok) throw new Error('Save failed');
      showToast('Note saved');
    }

    saveToLocal(allNotes);
    noteForm.reset();
    quill.root.innerHTML = '';
    noteForm.dataset.editingId = '';
    fetchNotes();
  } catch {
    showToast(isEdit ? 'Update failed. Saved offline.' : 'Save failed. Using offline storage.');
    if (isEdit) {
      allNotes = allNotes.map(n => n.id.toString() === editingId ? { ...n, ...note } : n);
    } else {
      note.id = crypto.randomUUID();
      allNotes.push(note);
    }
    saveToLocal(allNotes);
    renderNotes();
    quill.root.innerHTML = '';
    noteForm.reset();
    noteForm.dataset.editingId = '';
  }
});

// ===== EDIT NOTE HANDLER =====
window.editNote = function (id) {
  const note = allNotes.find(n => n.id.toString() === id.toString());
  if (!note) return;
  noteTitle.value = note.title;
  noteDate.value = note.date;
  noteImportant.checked = note.important;
  quill.root.innerHTML = note.body;
  noteForm.dataset.editingId = note.id;
};

// ===== DELETE NOTE (NO UNDO) =====
window.deleteNote = function (id) {
  showModal('Delete this note?', async () => {
    allNotes = allNotes.filter(n => n.id !== id);
    saveToLocal(allNotes);
    renderNotes();

    try {
      await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
      showToast('Note deleted');
    } catch {
      showToast('Deleted offline');
    }

    fetchNotes();
  });
};

// ===== FILTER EVENTS =====
searchInput.addEventListener('input', renderNotes);
importantOnly.addEventListener('change', renderNotes);

// ===== DARK MODE TOGGLE =====
// ===== DARK MODE STATE (persistent with localStorage) =====

// Save state to localStorage
function setDarkModeState(isDark) {
  localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
}

// Load saved state from localStorage
function loadDarkMode() {
  const mode = localStorage.getItem('darkMode');
  const isDark = mode === 'enabled';
  document.body.classList.toggle('dark-mode', isDark);
  toggleDarkMode.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

// Toggle dark mode and update localStorage
toggleDarkMode.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-mode');
  toggleDarkMode.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  setDarkModeState(isDark);
});

// Load dark mode state immediately on page load
loadDarkMode();

// ===== INITIAL LOAD =====
fetchNotes().then(renderNotes);