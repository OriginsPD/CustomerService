# Application Routes Documentation

This document provides a comprehensive list of all frontend and backend routes in the Virtual Customer Care (VCC) project.

## Frontend Routes (Client-side)

The frontend is built using React with TanStack Router. Routes are defined in `client/src/routes/`.

| Route Path | Description |
|------------|-------------|
| `/` | **Home Redirect**: Automatically redirects the user to the `/kiosk` page. |
| `/kiosk` | **Kiosk Display**: Shows a large QR code for clients to scan with their phones to begin the check-in process. |
| `/check-in` | **Client Check-In**: A form for clients to enter their details (Name, Email, Phone, Company, Purpose) to join the virtual queue. |
| `/queue` | **Queue Status**: Shows the client their current position in the queue, estimated wait time, and their unique queue number. |
| `/check-out/$sessionId` | **Client Check-Out**: A feedback form where clients provide a star rating and comments after being served. Includes AI-driven dynamic questions. |
| `/staff/login` | **Staff Login**: Secure authentication page for office staff. |
| `/staff/dashboard` | **Staff Portal (Layout)**: The main container for all staff-related administrative views. |
| `/staff/dashboard/index` | **Queue Management**: The primary staff view for seeing the live queue and marking clients as "In Progress" (calling them up). |
| `/staff/dashboard/analytics` | **Analytics & Insights**: Displays operational metrics, sentiment charts, and AI-generated office insights. |
| `/staff/dashboard/questions` | **Question Management**: Interface for staff to manage the dynamic feedback questions generated/suggested by AI. |
| `/evaluation` | **Framework Evaluation**: A technical comparison matrix of AI frameworks used during the PoC phase. |
| `$` | **Not Found**: Catch-all route for handling 404 errors. |

---

## Backend API Routes (Server-side)

The backend is built with Hono and mounted under the `/api` prefix. Routes are defined in `server/src/routes/`.

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/login` | Authenticates staff and returns a JWT. |

### Check-In (`/api/checkin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Registers a new client session and assigns a queue number. |
| `GET` | `/:id` | Retrieves session details for a specific client. |
| `POST` | `/:id/cancel` | Cancels a session and records cancellation feedback. |
| `PATCH` | `/:id/status` | Updates the status of a session (waiting, in_progress, completed, cancelled). |

### Check-Out (`/api/checkout`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Submits client feedback, performs AI sentiment analysis, and completes the session. |
| `GET` | `/:sessionId` | Retrieves feedback and AI analysis for a specific session. |

### Queue Management (`/api/queue`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Returns the list of all currently waiting sessions (Staff only). |
| `GET` | `/depth` | Returns the total count of clients currently in the queue. |
| `GET` | `/stream` | **SSE Endpoint**: Provides real-time updates to connected clients when the queue changes. |
| `PATCH` | `/:sessionId/process` | Marks a client as "In Progress" (Staff only, requires JWT). |
| `GET` | `/position/:sessionId` | Returns the current queue position and wait estimate for a specific client. |

### Feedback Questions (`/api/questions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Lists all active dynamic feedback questions. |
| `POST` | `/` | Creates a new feedback question. |
| `PATCH` | `/:id` | Updates or toggles (active/inactive) a question. |
| `DELETE` | `/:id` | Removes a question from the system. |

### Dashboard & Analytics (`/api/dashboard`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/metrics` | Returns operational KPIs (Avg wait time, sentiment trends, etc.). |
| `GET` | `/insights` | Returns the latest AI-generated qualitative insights about office performance. |
| `GET` | `/logs` | Returns the logs of AI analysis cycles. |

### Admin/System (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | System health check (Database connectivity, etc.). |
| `POST` | `/seed` | Re-seeds the database with mock data for testing. |
