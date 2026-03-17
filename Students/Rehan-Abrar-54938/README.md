# DueMate: Smart WhatsApp Assignment & Quiz Reminder System

## Overview
DueMate is a completely free WhatsApp-based assignment and quiz reminder bot for university students. Built with Meta's WhatsApp API, Flask backend, MongoDB, and React frontend — zero cost for the entire semester.

## Project Status
**MVP Development**: 4 weeks  
**Semester Expansion**: Continuous improvements based on user feedback  
**Cost**: $0 (fully free tier)

## Key Features
- ✅ Auto-parses unstructured WhatsApp messages
- ✅ Supports assignments and quizzes with distinct fields
- ✅ Mobile-first web dashboard with filtering
- ✅ 24-hour WhatsApp reminders
- ✅ Manual review capability for uncertain parses
- ✅ Data archival to prevent database overflow

## Technology Stack

| Layer | Technology | Free Tier |
|-------|-----------|----------|
| WhatsApp API | Meta Cloud API test account | ✅ |
| Backend | Python 3.9+ + Flask | ✅ |
| Hosting | Render.com (0.5GB free) | ✅ |
| Frontend | React 18+ | ✅ |
| Frontend Hosting | Vercel (unlimited deploys) | ✅ |
| Database | MongoDB Atlas (512MB free) | ✅ |
| NLP | spaCy (open-source) | ✅ |
| Task Scheduling | APScheduler | ✅ |

## Documentation

### 1. **plan.md** - Implementation Roadmap
Detailed 7-phase plan covering:
- Month 1 (Weeks 1-5): Foundation, WhatsApp integration, NLP parsing, dashboard, reminders, error handling, deployment
- Verification checklist for each phase
- Architecture diagram and tech stack justification

### 2. **SRS.md** - Software Requirements Specification
Comprehensive requirements document including:
- 31+ functional requirements (user registration, message ingestion, parsing, filtering, reminders, error handling)
- 20+ non-functional requirements (performance, security, scalability, usability)
- Complete MongoDB schema definitions
- Risk analysis with mitigations
- API endpoint specifications
- NLP parsing examples
- Testing strategy

### 3. **SKILL.md** - Developer Knowledge Base
Complete technical reference for developers:
- Tech stack overview and learning curves
- Frontend development guide (React components, patterns, mobile-first CSS)
- Backend development guide (Flask skeleton, webhooks, API endpoints)
- Database operations (MongoDB queries, indexes, connection)
- NLP parsing implementation (task type detection, course extraction, date parsing, confidence scoring)
- WhatsApp integration (Meta API setup, message sending, scheduler)
- Deployment guide (Render, Vercel, MongoDB Atlas)
- Troubleshooting guide (10 common issues + solutions)
- Testing strategies and sample code

## Quick Start

1. **Read** [plan.md](plan.md) for high-level overview
2. **Reference** [SRS.md](SRS.md) for detailed requirements
3. **Develop** using [SKILL.md](SKILL.md) as your technical guide

## Submission Timeline

- **Week 1**: Phase 1 infrastructure
- **Week 2**: Phase 2-3 WhatsApp + parsing
- **Week 3**: Phase 4 dashboard
- **Week 4**: Phase 5-6 reminders + polish
- **Week 5+**: Phase 7 launch + semester improvements

## Key Metrics (MVP Success Criteria)

- ✅ Parse accuracy: 80%+ on real student messages
- ✅ Dashboard load time: < 2 seconds
- ✅ Reminder success rate: 95%+
- ✅ Active users: 10+
- ✅ Zero external costs

## Team
**Student**: Rehan Abrar (SAP ID: 54938)  
**Course**: AI Driven Software Development  
**Semester**: Spring 2026

## Contact
For questions about implementation, refer to the detailed documentation:
- Architecture & design → [plan.md](plan.md)
- Specific requirements → [SRS.md](SRS.md)
- Development help → [SKILL.md](SKILL.md)
