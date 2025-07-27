# Chai Blog

A modern blogging platform built with React and Appwrite backend services. This application provides a complete solution for creating and managing blog content with user authentication.

![Chai Blog Screenshot](https://placeholder-image-url.com/blog-screenshot.png)

## 📋 Features

- **User Authentication**: Secure signup and login functionality
- **Blog Management**: Create, read, update, and delete blog posts
- **Rich Text Editing**: Create beautiful content with TinyMCE editor
- **Image Upload**: Support for featured images in blog posts
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 19 with Vite
- **Backend**: Appwrite (Authentication, Database, Storage)
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **Form Handling**: React Hook Form
- **Content Editing**: TinyMCE React

## 📦 Prerequisites

- Node.js (v16.0 or higher)
- npm or yarn
- Appwrite instance (cloud or self-hosted)

## 🚀 Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/chai-blog.git
cd chai-blog
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with your Appwrite credentials (see Environment Variables section)

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Build for production
```bash
npm run build
# or
yarn build
```

## ⚙️ Appwrite Setup

1. Create an Appwrite project at [cloud.appwrite.io](https://cloud.appwrite.io)
2. Set up a database with a collection for blog posts with these attributes:
   - Title (string)
   - Content (string)
   - FeaturedImage (string)
   - Status (string)
   - UserId (string)
3. Create a storage bucket for blog images
4. Configure authentication methods (email/password)
5. Set appropriate security rules and permissions for collections and buckets

## 🔑 Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_APPWRITE_ENDPOINT=YOUR_APPWRITE_ENDPOINT
VITE_APPWRITE_PROJECT_ID=YOUR_PROJECT_ID
VITE_APPWRITE_DATABASE_ID=YOUR_DATABASE_ID
VITE_APPWRITE_COLLECTION=YOUR_COLLECTION_ID
VITE_APPWRITE_BUCKET_ID=YOUR_BUCKET_ID
VITE_APPWRITE_API=YOUR_API_KEY
VITE_RTE_APIKEY=YOUR_TINYMCE_API_KEY
```

## 📁 Project Structure

```
chai-blog/
├── public/
├── src/
│   ├── appwrite/       # Appwrite configuration and services
│   │   ├── auth.js     # Authentication service
│   │   └── config.js   # Appwrite configuration
│   ├── components/     # Reusable UI components
│   │   ├── AuthLayout.jsx
│   │   ├── Button.jsx
│   │   ├── Footer/
│   │   ├── Header/
│   │   ├── Input.jsx
│   │   ├── Login.jsx
│   │   ├── Logo.jsx
│   │   ├── PostCard.jsx
│   │   ├── RTE.jsx
│   │   ├── Select.jsx
│   │   ├── Signup.jsx
│   │   ├── container/
│   │   ├── index.js
│   │   └── post-form/
│   ├── conf/           # Configuration
│   │   └── conf.js
│   ├── pages/          # Application pages
│   │   ├── AddPost.jsx
│   │   ├── AllPosts.jsx
│   │   ├── EditPost.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Post.jsx
│   │   └── SignUp.jsx
│   ├── store/          # Redux store
│   │   ├── authSlice.js
│   │   └── store.js
│   ├── App.css
│   ├── App.jsx        # Main App component
│   ├── index.css      # Global styles
│   └── main.jsx       # Entry point
├── .env               # Environment variables
├── .gitignore
├── eslint.config.js   # ESLint configuration
├── index.html         # HTML entry
├── package.json       # Dependencies and scripts
├── README.md          # Project documentation
└── vite.config.js     # Vite configuration
```

## 📱 Usage

### Authentication
- Users can sign up with email and password
- Existing users can login to their accounts
- Authenticated users can logout

### Blog Management
- View all blog posts on the home page
- Click on a post to view its detailed content
- Authenticated users can create new posts
- Post owners can edit and delete their posts

### Creating & Editing Posts
1. Navigate to "Add Post" to create a new blog post
2. Fill in the title, content, and optionally add a featured image
3. Set the status (active/inactive)
4. Submit to publish your post

## 🌐 Deployment

### Build the project
```bash
npm run build
# or
yarn build
```

### Deployment options:
1. **Vercel**: Connect your GitHub repository for automatic deployments
2. **Netlify**: Connect your GitHub repository or manually upload the build folder
3. **GitHub Pages**: Deploy the build folder to GitHub Pages
4. **Firebase Hosting**: Use Firebase CLI to deploy the build folder

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work - [YourGitHubUsername](https://github.com/YourGitHubUsername)

## 🙏 Acknowledgements

- [Appwrite](https://appwrite.io) - Backend as a Service
- [React](https://reactjs.org) - UI Library
- [TinyMCE](https://www.tiny.cloud) - Rich Text Editor
- [Tailwind CSS](https://tailwindcss.com) - CSS Framework

