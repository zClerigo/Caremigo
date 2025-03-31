# Caremigo - Technical Documentation

## Project Overview
Caremigo is a full-stack web application designed to help users understand and manage their medical documents. The application uses AI to analyze medical documents, provide layman-friendly interpretations, and recommend specialists based on medical values.

## Architecture

### Tech Stack
- **Frontend**: React.js with Vite
- **Backend**: Django (Python)
- **AI Integration**: 
  - Perplexity AI API
  - Gemini AI API
  - Google Cloud Vision API
- **Database**: SQLite
- **UI Framework**: Tailwind CSS

### Project Structure
```
caremigo/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── assets/         # Static assets
│   │   ├── App.jsx         # Main application component
│   │   └── main.jsx        # Application entry point
│   └── package.json        # Frontend dependencies
│
└── backend/                 # Django backend application
    ├── api/                # Main API application
    │   ├── models.py      # Database models
    │   ├── views.py       # API endpoints
    │   ├── serializers.py # Data serialization
    │   └── urls.py        # URL routing
    ├── profiles/          # User profiles application
    └── manage.py          # Django management script
```

## Frontend Architecture

### Key Components

#### Core Components
1. **HomeScreen.jsx** (5.9KB)
   - Main landing page component
   - Handles initial user interaction and navigation

2. **Header.jsx** (1.2KB)
   - Navigation and app header
   - Provides consistent navigation across the application

3. **MedicalRecords.jsx** (5.5KB)
   - Displays list of medical records
   - Handles record organization and display

4. **AddRecord.jsx** (7.3KB)
   - Form for adding new medical records
   - Handles file upload and initial data entry

#### Medical Analysis Components
1. **MedicalAnalysis.jsx** (39KB)
   - Core analysis component
   - Displays AI analysis results
   - Handles document processing and interpretation

2. **MedicalTerm.jsx** (15KB)
   - Displays individual medical terms
   - Provides detailed explanations and context

#### Task Management Components
1. **ProfileKanbanBoard.jsx** (21KB)
   - Main Kanban board implementation
   - Manages task organization and workflow

2. **KanbanTask.jsx** (1.7KB)
   - Individual task card component
   - Displays task details and status

3. **KanbanColumn.jsx** (1.6KB)
   - Column component for Kanban board
   - Manages task grouping by status

4. **KanbanContainer.jsx** (3.2KB)
   - Container for Kanban board
   - Handles drag-and-drop functionality

5. **EditTaskModal.jsx** (3.4KB)
   - Modal for editing task details
   - Provides task update interface

#### UI Enhancement Components
1. **ScrollFadeIn.jsx** (854B)
   - Adds scroll-based animation effects
   - Enhances user experience with smooth transitions

2. **HighlightedLink.jsx** (362B)
   - Custom link component with highlighting
   - Improves navigation visibility

3. **SortableBoardItem.jsx** (721B)
   - Handles sortable items in Kanban board
   - Enables drag-and-drop reordering

### Component Hierarchy
```
App.jsx
├── Header.jsx
├── HomeScreen.jsx
│   └── HighlightedLink.jsx
├── MedicalRecords.jsx
│   └── AddRecord.jsx
├── MedicalAnalysis.jsx
│   └── MedicalTerm.jsx
└── ProfileKanbanBoard.jsx
    ├── KanbanContainer.jsx
    │   ├── KanbanColumn.jsx
    │   │   └── KanbanTask.jsx
    │   └── SortableBoardItem.jsx
    └── EditTaskModal.jsx
```

### Dependencies
- `axios`: HTTP client for API requests
- `react-router-dom`: Client-side routing
- `react-markdown`: Markdown rendering
- `react-zoom-pan-pinch`: Image zoom functionality
- `@dnd-kit/core`: Drag and drop functionality
- `framer-motion`: Animation library

## Backend Architecture

### Data Models

#### Profile Model
```python
class Profile(models.Model):
    name = models.CharField(max_length=100)
    relationship = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```
- Represents a person whose medical records are being managed
- Contains basic information like name and relationship to the user
- Tracks creation and update timestamps

#### MedicalRecord Model
```python
class MedicalRecord(models.Model):
    profile = models.ForeignKey(Profile, related_name='records', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    date = models.DateField()
    description = models.TextField()
    image = models.ImageField(upload_to='medical_records/')
    image_data = models.TextField(blank=True, null=True)
    analysis_summary = models.TextField(blank=True, null=True)
    analysis_actions = models.TextField(blank=True, null=True)
    analysis_recommendations = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```
- Stores medical documents and their analysis results
- Links to a Profile through a foreign key relationship
- Stores both the document image and processed image data
- Contains fields for AI analysis results (summary, actions, recommendations)
- Tracks document date and timestamps

#### Task Model
```python
class Task(models.Model):
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('inprogress', 'In Progress'),
        ('done', 'Done'),
    ]
    
    profile = models.ForeignKey(Profile, related_name='tasks', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```
- Manages tasks related to medical records
- Supports a Kanban-style board with three statuses: To Do, In Progress, Done
- Includes ordering capability for tasks within each status
- Links to a Profile through a foreign key relationship
- Tracks creation and update timestamps

### API Structure
1. **Models**:
   - User profiles
   - Medical documents
   - Analysis results
   - Specialist recommendations

2. **Views**:
   - Document upload and processing
   - AI analysis endpoints
   - User management
   - Specialist recommendations

3. **Serializers**:
   - Data transformation between frontend and backend
   - Validation and formatting

### AI Integration
The application integrates multiple AI services:
- **Perplexity AI**: For document analysis and interpretation
- **Gemini AI**: For additional analysis capabilities
- **Google Cloud Vision**: For document image processing

## Setup Instructions

### Frontend Setup
1. Navigate to the frontend directory
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

### Backend Setup
1. Navigate to the backend directory
2. Install Python dependencies:
   ```bash
   pip install django djangorestframework django-cors-headers Pillow
   ```
3. Start Django server: `python manage.py runserver`

## API Endpoints

### Document Management
- `POST /api/documents/`: Upload new medical documents
- `GET /api/documents/`: List user's documents
- `GET /api/documents/{id}/`: Get specific document details

### Analysis
- `POST /api/analyze/`: Submit document for AI analysis
- `GET /api/analysis/{id}/`: Get analysis results

### User Management
- `POST /api/auth/register/`: User registration
- `POST /api/auth/login/`: User authentication
- `GET /api/profile/`: Get user profile

## Security Considerations
- API endpoints are protected with authentication
- CORS is configured for frontend-backend communication
- Sensitive data is handled securely
- API keys are stored in environment variables

## Development Guidelines

### Code Style
- Frontend: ESLint configuration for React
- Backend: PEP 8 style guide for Python
- Use meaningful variable and function names
- Include comments for complex logic

### Version Control
- Use feature branches for new development
- Follow conventional commit messages
- Keep commits focused and atomic

## Future Improvements
1. Implement real-time updates for document analysis
2. Add support for more document types
3. Enhance AI analysis accuracy
4. Implement user feedback system
5. Add offline support for basic features

## Support
For technical support or questions, please contact the development team or refer to the project's issue tracker. 