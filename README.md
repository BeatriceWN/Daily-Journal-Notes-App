````markdown
# Daily Journal & Notes App

A lightweight, responsive, and offline-friendly journaling web app that allows users to write, format, search, and manage daily journal entries or notes. Built using vanilla JavaScript, Quill editor, and a local JSON server backend.

---

## Features

- Rich text editing using Quill with a custom toolbar
- Dark mode toggle
- Search and filter notes
- Mark notes as important
- Undo delete functionality (5-second timeout)
- Offline support via localStorage fallback
- Add, edit, and delete notes
- Live filtering by search term and importance
- Auto-date entry when none is selected
- Fully styled UI

---

## Tech Stack

| Layer        | Technology             |
|--------------|------------------------|
| Frontend     | HTML, CSS, JavaScript  |
| Text Editor  | Quill (custom toolbar) |
| Styling      | Flexbox, Media Queries |
| Backend API  | JSON Server (`db.json`)|
| Storage      | localStorage fallback  |

---

## Getting Started

### 1. Clone this repository

```bash
git clone https://github.com/your-username/Daily-Journal-Notes-App.git
cd Daily-Journal-Notes-App
````

### 2. Install JSON Server (if not already installed)

```bash
npm install -g json-server
```

### 3. Run the backend (JSON server)

```bash
json-server --watch db.json --port 3000
```

> The app expects the API to be available at: `http://localhost:3000/notes`

### 4. Open `index.html` in your browser

You can use the Live Server extension in VS Code or open the file directly in a browser.

---

## Contributing

Pull requests are welcome. To contribute:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m "Add YourFeature"`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a pull request

---

## License

This project is open source and free to use.

---

## Author

Created by Beatrice Wambui
2025

```