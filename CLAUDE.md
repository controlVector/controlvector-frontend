# ControlVector Frontend

## Status: Authentication + LLM Configuration Complete ✅

This is the React frontend for the ControlVector platform, built with TypeScript, Vite, and TailwindCSS.

## Current Features

### Authentication System ✅
- **Login Page**: Clean, professional authentication interface
- **Sign Up Page**: User registration with validation
- **OAuth Integration**: Framework ready for GitHub & Google OAuth
- **JWT Token Management**: Secure token storage and refresh
- **Protected Routes**: Route guards for authenticated areas
- **Auth State Management**: Zustand-based authentication store
- **Error Handling**: Comprehensive auth error management

### Onboarding System ✅
- **Multi-step Wizard**: Guided setup for provider credentials
- **DNS Providers**: Cloudflare, AWS Route 53, DigitalOcean DNS
- **Cloud Providers**: DigitalOcean, AWS, GCP, Microsoft Azure
- **Git Providers**: GitHub, GitLab, SSH key management
- **LLM Providers**: OpenAI (GPT-4, GPT-3.5), Anthropic Claude (Opus, Sonnet, Haiku), Google Gemini, Local models, ControlVector AI
- **Progress Tracking**: Visual progress indicators and step navigation
- **Secure Storage**: Encrypted credential storage via Context Manager
- **Skip Options**: Flexible onboarding with skip capabilities

### Context Manager Integration ✅
- **Context API Service**: Full integration with Context Manager (port 3005)
- **Encrypted Credentials**: Secure storage of API keys, tokens, SSH keys
- **Three-tier Context**: Secret, user, and global context management
- **JWT Authentication**: All context operations secured with JWT tokens
- **Error Handling**: Comprehensive error management for context operations

### UI/UX Components
- **Modern Design**: TailwindCSS with professional styling
- **Responsive Layout**: Mobile-first responsive design
- **Loading States**: Smooth loading transitions
- **Toast Notifications**: React Hot Toast integration
- **Form Validation**: Client-side validation with feedback
- **Motion Animations**: Framer Motion for smooth transitions

## Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development
- **Styling**: TailwindCSS for utility-first CSS
- **State Management**: Zustand for authentication state
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router DOM
- **Forms**: React Hook Form with validation
- **Animations**: Framer Motion
- **Icons**: Heroicons via TailwindCSS

### Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/           # Authentication components
│   │   └── onboarding/     # Onboarding provider forms
│   ├── pages/
│   │   ├── auth/          # Login/signup pages
│   │   ├── OnboardingPage.tsx # Multi-step onboarding
│   │   └── DashboardPage.tsx
│   ├── services/
│   │   ├── authAPI.ts     # Authentication API
│   │   └── contextAPI.ts  # Context Manager API
│   ├── stores/            # Zustand stores
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── public/               # Static assets
└── package.json         # Dependencies
```

## Integration Status

### Backend Services Integration
- ✅ **Auth Service**: Complete integration with JWT authentication (port 3002)
- ✅ **Context Manager**: Full integration for credential management (port 3005)
- ✅ **Service Discovery**: All services auto-discovered and connected
- ⏳ **Watson Service**: Framework ready for chat integration (port 3004)
- ⏳ **Atlas Service**: Ready for infrastructure management UI (port 3003)

## Development

### Environment Setup
```bash
npm install          # Install dependencies
npm run dev         # Start development server (port 3000)
npm run build       # Build for production
npm run preview     # Preview production build
```

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:3002
```

## Authentication + Onboarding Flow

### Current Implementation  
1. **Authentication**: Login/Register → JWT tokens → Dashboard
2. **Onboarding**: Dashboard → Setup providers → Credential storage
3. **Provider Setup**: DNS → Cloud → Git → LLM → Completion
4. **Context Storage**: All credentials encrypted in Context Manager
5. **Ready State**: User configured for AI-driven infrastructure management

### Supported Providers
- **DNS**: Cloudflare, AWS Route 53, DigitalOcean DNS
- **Cloud**: DigitalOcean, AWS, GCP, Microsoft Azure  
- **Git**: GitHub (tokens), GitLab (tokens), SSH keys
- **LLM**: OpenAI (GPT-4, GPT-3.5), Anthropic Claude (Opus, Sonnet, Haiku), Google Gemini, Local models, ControlVector AI

## Context Manager Integration

### Security Features
- **Encrypted Storage**: All credentials encrypted at rest
- **JWT Protected**: All context operations require authentication
- **Three-tier System**: Secret, user, and global context separation
- **Audit Logging**: All context operations logged for security

### API Integration
- **Secret Context**: Store/retrieve encrypted credentials via `/api/v1/context/secret/*`
- **User Context**: Manage user preferences via `/api/v1/context/user/*`
- **Global Context**: System-wide configuration management

## Next Steps

### Immediate Priorities
1. **Watson Chat Interface**: Build conversational UI for infrastructure management
2. **Infrastructure Dashboard**: Connect Atlas service for resource viewing  
3. **Provider Testing**: Test actual provider credentials in sandbox
4. **OAuth Completion**: Finish GitHub and Google OAuth flows

### Future Enhancements
1. **Real-time Updates**: WebSocket integration for live infrastructure status
2. **Advanced UI Components**: Charts, graphs, infrastructure visualizations
3. **Mobile App**: React Native version
4. **Offline Support**: Service worker for offline functionality

## Current User Flow

1. **Authentication** → Login/Signup → JWT token acquisition
2. **Dashboard** → Welcome screen with service status
3. **Onboarding** → Multi-step provider credential setup (DNS → Cloud → Git → LLM)
4. **Context Storage** → Encrypted credential storage in Context Manager
5. **Ready State** → Prepared for Watson-driven AI infrastructure management

## Repository Architecture Integration

This frontend integrates with the ControlVector microservices architecture:
- **core-services/cv-context-manager**: Three-tier context management system
- **core-services/auth-service**: JWT authentication and user management  
- **core-services/watson**: AI orchestration and conversation management
- **core-services/atlas**: Infrastructure resource management

The frontend serves as the primary user interface for the entire ControlVector ecosystem, providing secure credential onboarding and preparing users for AI-driven infrastructure management through Watson.