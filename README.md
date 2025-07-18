````markdown
# Daily Journal & Notes App

## Description

**Daily Journal & Notes App** is a rich-text, browser-based journaling and note-taking application that uses Quill WYSIWYG editor, a local `db.json` file for persistent storage, and a custom `server.js` with JSON Server to simulate a RESTful API. Users can create, edit, delete, search, and filter their notes, and also toggle between light and dark mode.

---

## Project Overview

This project enables users to keep a daily journal or take structured notes with rich formatting using Quill. The app supports all CRUD operations with a simple UI and a local JSON-based backend.

### Key Features:

- **Rich Text Editor**  
  Integrated using Quill, users can format their notes with headings, bold text, lists, and more.

- **Create & Edit Notes**  
  Users can add new notes and edit existing ones with real-time updates.

- **Delete Notes with Confirmation Modal**  
  A confirmation modal is displayed before deleting a note to prevent accidental removals.

- **Filter Notes**  
  Users can:
  - Search notes by title or content (case-insensitive).
  - Toggle "Important Only" to see only high-priority notes.

- **Dark Mode Toggle**  
  Users can switch between light and dark mode for comfortable viewing.

- **LocalStorage Backup**  
  Notes are temporarily cached in `localStorage` during network failures and automatically restored when the connection is reestablished.

- **Responsive Layout**  
  App works well across devices and adapts to various screen sizes, including mobile and tablet devices.

---

## Technologies Used

- HTML5, CSS3, JavaScript (ES6+)
- [Quill.js](https://quilljs.com) – WYSIWYG text editor
- Node.js + Express – Custom `server.js` to serve frontend and mock API
- json-server – Used for simulating a REST API with `db.json`
- localStorage – As a fallback in case of failed fetch calls
- Render – For hosting the app and backend

---

## Installations

To run this app locally, you'll need:

- Node.js & npm
- Git

Then install required dependencies:

```bash
npm install
````

This installs `express` and `json-server`.

---

## Project Setup

### 1. Clone the Repo

```bash
git clone git@github.com:BeatriceWN/Daily-Journal-Notes-App.git
cd Daily-Journal-Notes-App
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
npm start
```

This will run the app using your custom `server.js`.

### 4. Open App in Browser

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Author

**Beatrice Wambui**
GitHub: [@BeatriceWN](https://github.com/BeatriceWN)

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Live URLs

* **GitHub Pages (UI & Backend):** [https://beatricewn.github.io/Daily-Journal-Notes-App/](https://beatricewn.github.io/Daily-Journal-Notes-App/)
* **Live App (Backend/API):**    [https://daily-journal-notes-app-4.onrender.com](https://daily-journal-notes-app-4.onrender.com)
* **Render Live Site:** [https://daily-journal-and-notes-app.onrender.com](https://daily-journal-and-notes-app.onrender.com)

---

```
