# ComicRack Frontend

The frontend application for ComicRack, a local comic viewer built with React.

## Tech Stack

- React 18
- Ant Design for UI components
- React Router for navigation
- Sass for styling
- Axios for API requests

## Project Structure

```
src/
├── components/             # Reusable UI components
│   └── ComicCard/          # Comic card component 
│
├── pages/                  # Page components
│   ├── Home/               # Home page with comic list
│   ├── ChapterList/        # Chapter selection page
│   ├── Reader/             # Comic reader page
│   └── NotFound/           # 404 page
│
├── utils/                  # Utility functions and hooks
│   ├── api.js              # API service functions
│   └── helpers.js          # Helper utilities
│
├── App.js                  # Main application component
└── index.js                # Application entry point
```

## Features

- Responsive grid layout for comics listing
- Search functionality
- Favorites system
- Comic reader with multiple viewing modes
- Theme switching (light/dark mode)
- Automatic device detection for layout optimization

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Build for production:
   ```
   npm run build
   ```

## Dependencies

- React & React DOM (^18.2.0)
- React Router DOM (^6.15.0)
- Ant Design (^5.9.0)
- Axios (^1.5.0)
- Sass (^1.66.1)

## Notes

- Make sure the backend server is running on port 3001 before starting the frontend
- The frontend expects specific API endpoints as defined in the `utils/api.js` file
- The application is designed to work with the `/manhua` directory structure as specified in the main README 