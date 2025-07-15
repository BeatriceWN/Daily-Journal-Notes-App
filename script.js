// DOM element references
const notesContainer = document.getElementById('notesContainer');
const searchInput = document.getElementById('searchInput');
const importantOnly = document.getElementById('importantOnly');
const noteForm = document.getElementById('noteForm');
const noteTitle = document.getElementById('noteTitle');
const noteDate = document.getElementById('noteDate');
const noteImportant = document.getElementById('noteImportant');
const toggleDarkMode = document.getElementById('toggleDarkMode');

let allNotes = [];
noteForm.dataset.editingId = '';
let recentlyDeletedNote = null;

// Initialize Quill rich text editor
const quill = new Quill('#quillEditor', {
  placeholder: 'Type your note...',
  theme: 'snow',
  modules: {
    toolbar: '#toolbar'
  }
});

// Display toast messages (light/dark mode aware)
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

// Display modal confirmation dialog with auto-dismiss
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

  const dismiss = () => {
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  };

  overlay.querySelector('#confirmDelete').onclick = () => {
    onConfirm();
    dismiss();
  };
  overlay.querySelector('#cancelDelete').onclick = dismiss;

  // Auto-dismiss modal after 5 seconds
  setTimeout(dismiss, 5000);
}

// Save notes to localStorage
function saveToLocal(notes) {
  localStorage.setItem('localNotes', JSON.stringify(notes));
}

// Load notes from localStorage
function loadFromLocal() {
  const saved = localStorage.getItem('localNotes');
  return saved ? JSON.parse(saved) : [];
}

// Fetch notes from server or fallback to localStorage
async function fetchNotes() {
  try {
    const res = await fetch('/notes');
    if (!res.ok) throw new Error();
    allNotes = await res.json();
    saveToLocal(allNotes);
  } catch {
    allNotes = loadFromLocal();
  }
  renderNotes();
}

// Render filtered notes to the DOM
function renderNotes() {
  const filtered = allNotes.filter(note => {
    const query = searchInput.value.toLowerCase();
    const matchesText = note.title.toLowerCase().includes(query) || note.body.toLowerCase().includes(query);
    const matchesImportance = importantOnly.checked ? note.important : true;
    return matchesText && matchesImportance;
  });

  notesContainer.innerHTML = '';
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

// Handle form submission for creating or updating notes
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
    if (isEdit) {
      // PATCH the note
      const res = await fetch(`/notes/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });
      if (!res.ok) throw new Error('Failed to update note on server');

      // Optional: update local array manually to reflect change immediately
      allNotes = allNotes.map(n => n.id.toString() === editingId ? { ...n, ...note } : n);
      saveToLocal(allNotes);

      showToast('Note updated');
    } else {
      // POST new note
      const res = await fetch('/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });
      if (!res.ok) throw new Error('Failed to save note');

      showToast('Note saved');
    }

    // Clear form + editor
    noteForm.reset();
    quill.setContents([]);
    noteForm.dataset.editingId = '';

    // Refresh notes list
    fetchNotes();
  } catch {
    // Offline fallback
    showToast(isEdit ? 'Update failed. Saving offline.' : 'Saving failed. Using offline storage.');
    
    if (isEdit) {
      allNotes = allNotes.map(n => n.id.toString() === editingId ? { ...n, ...note } : n);
    } else {
      note.id = crypto.randomUUID();
      allNotes.push(note);
    }

    saveToLocal(allNotes);
    renderNotes();
    noteForm.dataset.editingId = '';
    quill.setContents([]);
    noteForm.reset();
  }
});


// Populate form fields for editing a note
window.editNote = function (id) {
  const note = allNotes.find(n => n.id.toString() === id.toString());
  if (!note) return;

  noteTitle.value = note.title;
  noteDate.value = note.date;
  noteImportant.checked = note.important;
  noteForm.dataset.editingId = note.id;
  quill.clipboard.dangerouslyPasteHTML(note.body);
};

// Delete a note with confirmation, toast, and undo
window.deleteNote = function (id) {
  const note = allNotes.find(n => n.id === id || n.id.toString() === id.toString());
  recentlyDeletedNote = note;

  const confirmAndDelete = async () => {
    try {
      await fetch(`/notes/${id}`, { method: 'DELETE' });
      showToast('Note deleted');
      fetchNotes();
    } catch {
      allNotes = allNotes.filter(n => n.id !== id);
      saveToLocal(allNotes);
      renderNotes();
      showToast('Note deleted offline');
    }

    // Create undo button
    const undo = document.createElement('button');
    undo.textContent = 'Undo';
    undo.className = 'undo-toast';
    document.body.appendChild(undo);

    undo.onclick = async () => {
      if (!recentlyDeletedNote) return;
      try {
        await fetch('/notes', {
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
      document.body.removeChild(undo);
      recentlyDeletedNote = null;
      fetchNotes();
    };

    setTimeout(() => {
      if (document.body.contains(undo)) {
        document.body.removeChild(undo);
      }
      recentlyDeletedNote = null;
    }, 5000);
  };

  showModal('Delete this note?', confirmAndDelete);
};

// Apply live filtering as user types or toggles important only
searchInput.addEventListener('input', renderNotes);
importantOnly.addEventListener('change', renderNotes);

// Toggle light/dark mode
toggleDarkMode.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

// Load notes when page loads
fetchNotes();
