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
let recentlyDeletedNote = null;                                         // Stores recently deleted note for Undo

// ===== INITIALIZE QUILL EDITOR =====
const quill = new Quill('#quillEditor', {
  theme: 'snow',
  modules: { toolbar: '#toolbar' }
});

// ===== TOAST MESSAGE UTILITY =====
// Creates a floating notification message
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
// Displays a modal to confirm destructive actions like delete
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
    // Offline fallback
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

// ===== DELETE NOTE WITH UNDO SUPPORT =====
window.deleteNote = function (id) {
  const note = allNotes.find(n => n.id === id || n.id.toString() === id.toString());
  recentlyDeletedNote = note;

  const showUndoToast = () => {
    const undoToast = document.createElement('div');
    undoToast.className = 'undo-toast show';
    undoToast.innerHTML = `
      <span>Note deleted</span>
      <button id="undoBtn">Undo</button>
      <button id="closeUndo">✖</button>
    `;
    document.body.appendChild(undoToast);

    // Undo click
    document.getElementById('undoBtn').onclick = async () => {
      clearTimeout(deleteTimer); // Cancel scheduled delete
      try {
        await fetch(`${API_BASE}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recentlyDeletedNote)
        });
        showToast('Undo successful');
      } catch {
        recentlyDeletedNote.id = crypto.randomUUID();
        allNotes.push(recentlyDeletedNote);
        saveToLocal(allNotes);
        renderNotes();
        showToast('Undo offline');
      }
      cleanupToast();
      fetchNotes();
    };

    // Close (✖) click
    document.getElementById('closeUndo').onclick = () => {
      cleanupToast();
    };

    // Auto-hide after 6s
    deleteTimer = setTimeout(async () => {
      await performPermanentDelete(id);
      cleanupToast();
    }, 6000);
  };

  const cleanupToast = () => {
    const existing = document.querySelector('.undo-toast');
    if (existing) document.body.removeChild(existing);
    recentlyDeletedNote = null;
  };

  const performPermanentDelete = async (noteId) => {
    try {
      await fetch(`${API_BASE}/notes/${noteId}`, { method: 'DELETE' });
      showToast('Note permanently deleted');
    } catch {
      allNotes = allNotes.filter(n => n.id !== noteId);
      saveToLocal(allNotes);
      renderNotes();
      showToast('Deleted offline');
    }
    fetchNotes();
  };

  // Step 1: Remove from UI immediately
  allNotes = allNotes.filter(n => n.id !== id);
  saveToLocal(allNotes);
  renderNotes();

  // Step 2: Ask for confirmation
  showModal('Delete this note?', showUndoToast);
};

// ===== FILTER EVENTS =====
searchInput.addEventListener('input', renderNotes);
importantOnly.addEventListener('change', renderNotes);

// ===== DARK MODE TOGGLE =====
toggleDarkMode.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-mode');
  toggleDarkMode.textContent = isDark ? 'Light Mode' : 'Dark Mode';
});

// ===== INITIAL LOAD =====
fetchNotes().then(renderNotes);
