# Smart - Personal Organizer

A professional hierarchical data management tool built with React, Node.js, and PostgreSQL. Designed to help you organize and visualize complex organizational structures with an eye-friendly dark theme.

## 🌟 Features

- **Hierarchical Visualization**: Interactive tree view of organizational structure with collapsible nodes
- **Data Tables**: Comprehensive employee directory with search and filter capabilities
- **Dark Theme**: Eye-friendly interface optimized for extended use
- **Collapsible Sidebar**: Maximize screen space with a responsive navigation sidebar
- **Schema Mapping System**: Define database schemas in JSON and auto-generate tables
- **RESTful API**: Full CRUD operations for employee management
- **Responsive Design**: Built with Tailwind CSS for a modern, professional look

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 22.x (as specified)
- **PostgreSQL**: Version 12 or higher
- **npm**: Comes with Node.js

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
cd /Users/amitbaderia/Automation_Frameworks/Smart-PersonalOrganizer
```

### 2. Install Dependencies

Install root dependencies:
```bash
npm install
```

Install server dependencies:
```bash
cd server
npm install
cd ..
```

Install client dependencies:
```bash
cd client
npm install
cd ..
```

### 3. Configure Environment Variables

The `.env` file has been created with default credentials (demo/demo). Update it with your PostgreSQL credentials:

```bash
# Edit .env file
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_organizer
DB_USER=demo          # Change to your PostgreSQL username
DB_PASSWORD=demo      # Change to your PostgreSQL password

PORT=3001
NODE_ENV=development

VITE_API_URL=http://localhost:3001/api
```

### 4. Setup PostgreSQL Database

Create the database:
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE smart_organizer;

# Create user (if using demo/demo credentials)
CREATE USER demo WITH PASSWORD 'demo';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE smart_organizer TO demo;

# Exit psql
\q
```

### 5. Run Database Migrations

The schema mapping system will create tables based on `server/config/schema.json`:

```bash
cd server
npm run migrate
```

Expected output:
```
🚀 Starting database migration...

📋 Creating table: employees
   ✓ Dropped existing table (if any)
   ✓ Table created successfully
   ✓ Index created: idx_employees_manager_id
   ✓ Index created: idx_employees_level

✅ Migration completed successfully!
```

### 6. Seed Sample Data (Optional)

Populate the database with sample organizational data:

```bash
npm run seed
```

This will create a sample hierarchy with CEO, VPs, managers, and team members.

### 7. Start the Application

From the root directory:

```bash
npm run dev
```

This will start both the backend server and frontend client concurrently:
- **Backend API**: http://localhost:3001
- **Frontend App**: http://localhost:5173

## 📁 Project Structure

```
Smart-PersonalOrganizer/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── Layout.jsx    # Main layout with sidebar
│   │   │   └── HierarchyNode.jsx  # Hierarchy visualization
│   │   ├── pages/            # Page components
│   │   │   ├── HierarchyView.jsx  # Org chart view
│   │   │   ├── TablesView.jsx     # Employee table
│   │   │   └── Settings.jsx       # Settings page
│   │   ├── App.jsx           # Main app component
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── server/                    # Node.js backend
│   ├── config/
│   │   ├── database.js       # PostgreSQL connection
│   │   └── schema.json       # Database schema definition
│   ├── routes/
│   │   └── employees.js      # Employee API routes
│   ├── scripts/
│   │   ├── migrate.js        # Schema migration script
│   │   └── seed.js           # Sample data seeder
│   ├── server.js             # Express server
│   └── package.json
├── .env                       # Environment variables
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── package.json              # Root package.json
└── README.md                 # This file
```

## 🗄️ Database Schema

### Employees Table

The schema is defined in `server/config/schema.json` and includes:

| Column       | Type         | Description                    |
|-------------|--------------|--------------------------------|
| id          | SERIAL       | Primary key (auto-increment)   |
| name        | VARCHAR(255) | Employee name (required)       |
| email       | VARCHAR(255) | Email address (optional)       |
| designation | VARCHAR(255) | Job title/role                 |
| level       | INTEGER      | Organizational level           |
| manager_id  | INTEGER      | Foreign key to manager         |
| created_at  | TIMESTAMP    | Record creation time           |
| updated_at  | TIMESTAMP    | Last update time               |

**Indexes:**
- `idx_employees_manager_id` on `manager_id`
- `idx_employees_level` on `level`

## 🔧 Adding New Tables

To add new tables to the database:

1. Edit `server/config/schema.json`:
```json
{
  "tables": [
    {
      "name": "your_table_name",
      "columns": [
        {
          "name": "id",
          "type": "SERIAL",
          "constraints": ["PRIMARY KEY"]
        },
        {
          "name": "field_name",
          "type": "VARCHAR(255)",
          "constraints": ["NOT NULL"]
        }
      ],
      "indexes": []
    }
  ]
}
```

2. Run migration:
```bash
cd server
npm run migrate
```

## 📡 API Endpoints

### Employees

- `GET /api/employees` - Get all employees
- `GET /api/employees/hierarchy` - Get hierarchical structure
- `GET /api/employees/:id` - Get single employee
- `GET /api/employees/:id/reportees` - Get employee's direct reports
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Health Check

- `GET /api/health` - Check API status

## 🎨 UI Features

### Hierarchy View
- Interactive organizational chart
- Collapsible/expandable nodes
- Color-coded by level
- Click to expand reportees
- Horizontal scrolling for large hierarchies

### Tables View
- Sortable employee directory
- Quick actions (view, edit, delete)
- Status indicators
- Level badges
- Export functionality (UI ready)

### Settings
- Database configuration
- Server settings
- Theme customization (dark mode default)

## 🛠️ Development

### Run Backend Only
```bash
cd server
npm run dev
```

### Run Frontend Only
```bash
cd client
npm run dev
```

### Build for Production
```bash
cd client
npm run build
```

## 📝 Git Commands

### Initial Commit

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Smart Personal Organizer with React, PostgreSQL, and hierarchical visualization"

# Add remote (replace with your repository URL)
git remote add origin <your-repository-url>

# Push to remote
git push -u origin main
```

### Subsequent Commits

```bash
# Check status
git status

# Add changes
git add .

# Commit with message
git commit -m "Your commit message"

# Push
git push
```

## 🔐 Security Notes

- The `.env` file is gitignored to protect credentials
- Default credentials (demo/demo) should be changed in production
- Update `.env` with your actual PostgreSQL credentials
- Never commit `.env` to version control

## 🐛 Troubleshooting

### Database Connection Issues

If you see "Connection refused":
1. Ensure PostgreSQL is running: `brew services start postgresql` (macOS)
2. Verify credentials in `.env`
3. Check if database exists: `psql -U postgres -l`

### Port Already in Use

If port 3001 or 5173 is in use:
1. Change `PORT` in `.env` for backend
2. Change `server.port` in `client/vite.config.js` for frontend

### Migration Fails

If migration fails:
1. Check PostgreSQL connection
2. Ensure user has proper permissions
3. Manually drop tables if needed: `DROP TABLE employees CASCADE;`

## 📚 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router, Axios, Lucide Icons
- **Backend**: Node.js, Express, PostgreSQL (pg)
- **Development**: Nodemon, Concurrently

## 🎯 Future Enhancements

- [ ] Advanced search and filtering
- [ ] Bulk import/export (CSV, Excel)
- [ ] User authentication and authorization
- [ ] Real-time updates with WebSockets
- [ ] Advanced analytics and reporting
- [ ] Mobile responsive improvements
- [ ] Light theme option
- [ ] Multi-language support

## 📄 License

MIT

## 👤 Author

Created for personal organization and productivity enhancement.

---

**Note**: This application uses demo credentials by default. Please update the `.env` file with your actual PostgreSQL credentials before deploying to production.
