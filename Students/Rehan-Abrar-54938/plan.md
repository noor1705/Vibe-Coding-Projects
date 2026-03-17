# Plan: DueMate — Smart WhatsApp University Reminder System

## TL;DR
Build a completely free WhatsApp assignment & quiz reminder bot by combining Meta's free test API (WhatsApp), Render.com backend (Flask), MongoDB Atlas free database, spaCy NLP for parsing unstructured messages, and Vercel frontend. MVP within 4 weeks, expandable over the semester. Total cost: $0.

---

## Steps

### Phase 1: Foundation Setup (Week 1)
**Goal**: Establish infrastructure and get hello-world working across all layers

1. **Meta WhatsApp Account Setup** (*parallel with steps 2-3*)
   - Create Meta Developer Account & Business Account
   - Create WhatsApp Business Account (WABA)
   - Get free test phone number
   - Configure webhook settings
   - Keep track of: Phone Number ID, Business Account ID, Bearer Token

2. **Backend Infrastructure** (*parallel*)
   - Create Render.com account, connect GitHub
   - Create free Flask starter repo (`duemate-backend`) → push to GitHub
   - Deploy Flask hello-world to Render
   - Database: Create MongoDB Atlas free tier cluster (512MB Tier M0)
   - Document connection string in Render environment variables

3. **Frontend Scaffolding** (*parallel*)
   - Create React app locally (`npx create-react-app duemate-dashboard`)
   - Create Vercel account, connect GitHub
   - Deploy empty dashboard to Vercel
   - Set up API proxy config to backend

4. **Local Development Setup** (*depends on 1-3*)
   - Clone all repos locally (Flask backend, React frontend)
   - Install dependencies: Flask, pymongo, requests, spacy, apscheduler
   - Download spaCy model: `python -m spacy download en_core_web_sm`
   - Set up `.env` file locally with: MongoDB URI, Meta API tokens, Flask secret key

**Verification**: Can access Flask health endpoint, MongoDB connection works, React dashboard loads from Vercel

---

### Phase 2: WhatsApp Integration (Week 2)
**Goal**: Receive assignment messages from WhatsApp, store basic data

5. **WhatsApp Webhook Handler** (*depends on Phase 1 deployment*)
   - Create Flask endpoint: `POST /webhook/messages`
   - Set up webhook verification (`GET /webhook/messages` with challenge token)
   - Register webhook in Meta Dashboard pointing to: `https://your-render-app.onrender.com/webhook/messages`
   - Parse incoming webhook payloads (extract phone number, message text, timestamp)
   - Log incoming messages for debugging

6. **Database Schema Design**
   - Create MongoDB collections:
     - `users`: {phone_number, user_id, created_at, settings}
     - `tasks`: {  // Unified collection for assignments & quizzes
         user_id,
         task_type,             // "assignment" | "quiz"
         raw_message,           // ⭐ KEEP ORIGINAL for user corrections
         parsed_course,
         parsed_title,
         parsed_due_date,
         // QUIZ-SPECIFIC FIELDS:
         quiz_material,         // e.g., "Chapter 5-7", "Slides 10-25", null for assignments
         quiz_duration,         // e.g., "2 hours", null for assignments
         quiz_time,             // e.g., "2:00 PM", null for assignments
         parse_confidence,      // 0-1 score
         needs_review,          // true if confidence < 80%
         status,                // "pending" | "completed" | "needs_review"
         created_at,
         corrected_at           // when user manually fixed parsed fields
       }
     - `reminders_sent`: {user_id, task_id, sent_at}
   - Document schema with examples for each field

7. **Basic Message Storage**
   - Store raw incoming messages in `assignments.raw_message`
   - Store user phone number mapping in `users`
   - Create Flask endpoint: `/api/assignments/{user_id}` to retrieve stored assignments

**Verification**: Send test message via WhatsApp sandbox → verify it appears in MongoDB; retrieve via API

---

### Phase 3: NLP & Parsing (Week 2-3)
**Goal**: Extract course, task title, and due date from unstructured messages

8. **NLP Pipeline Design** (*depends on Phase 2*)
   - Since messages are very unstructured, use **hybrid approach**:
     - **Rule-based layer** (regex): Extract common patterns first
       - Course codes: `[A-Z]{2,4}\d{3,4}` (CS101, MATH2020)
       - Dates: Any date format (3/20, March 20, 2026-03-20, etc.) → parse with `dateutil`
       - Task type detection:
         - Keywords: "due", "deadline", "submit", "assignment" → task_type = "assignment"
         - Keywords: "quiz", "exam", "test" → task_type = "quiz"
       - **QUIZ-SPECIFIC patterns** (regex):
         - Material: `Chapter\s*\d+|Slides?\s*\d+|Section\s*\d+` → extract chapter/slide ranges
         - Duration: `\d+\s*(hour|minute|min|hr)` → quiz duration
         - Time: `\d{1,2}:\d{2}\s*(AM|PM|am|pm)` → quiz start time
     - **NLP layer** (spaCy): For entities the regex misses
       - DATE entities: "next Monday", "end of semester"
       - ORG/PERSON entities: May contain course info
       - Custom trained model (optional, Phase 2 enhancements)

9. **Parsing Function Implementation**
   - Create `utils/parse_task.py` with unified parsing for assignments & quizzes:
     ```
     parse_task(message_text) → {
       "task_type": "assignment" | "quiz",
       "course": "CS101",
       "title": "Assignment 1" | "Quiz Midterm",
       "due_date": datetime(2026, 3, 20),
       // QUIZ-SPECIFIC:
       "quiz_material": "Chapter 5-7" | null,  // null for assignments
       "quiz_duration": "2 hours" | null,
       "quiz_time": "2:00 PM" | null,
       "confidence": 0.85,  // confidence score (0-1)
       "needs_review": bool  // flag for confidence < 80%
     }
     ```
   - ⭐ **Always store original message** so users can review + correct if parser makes mistakes
   - Create test dataset: ~20-30 real WhatsApp messages (assignments & quizzes) from your university groups
   - Test accuracy on both assignment & quiz parsing (target 80%+)
   - Handle failures gracefully: if confidence < 80%, flag for on-dashboard review

10. **Update Message Storage endpoint** (Phase 2 step 7)
    - When storing, also run parse_task() and store all parsed fields
    - For assignments: `parsed_course`, `parsed_title`, `parsed_due_date`
    - For quizzes: above PLUS `parsed_material`, `parsed_duration`, `parsed_time`
    - If `needs_review=True`, flag for manual review on frontend

**Verification**: Test parsing on 10 varied message formats; verify accuracy > 80%

---

### Phase 4: Dashboard UI (Week 3)
**Goal**: Display assignments with filtering and task management

11. **React Dashboard Components** (⭐ Mobile-first design from start)
    - **Component: TaskList** (responsive grid on mobile, table on desktop)
      - Fetch tasks from `/api/tasks/{user_id}`
      - Display: Type Icon | Course | Title | Due Date | Status
      - Filter by: All, Assignments, Quizzes, Today, This Week, Overdue, Completed
      - Sort by: Due date (ascending/descending)
    
    - **Component: TaskCard** (swipeable on mobile)
      - **For Assignments**: Show course, title, due date, days until due
      - **For Quizzes**: Show course, title, due date, time, material (e.g., "📝 Quiz | CS101 | Chapters 5-7 | March 20, 2:00 PM")
      - Toggle completion with checkbox → PATCH `/api/tasks/{id}/status`
      - ⭐ "Edit" button → modal showing:
        - Raw message (original, un-editable)
        - Parsed fields (editable): course, title, due_date
        - **For quizzes**: Also editable: material, duration, time
        - Student can fix parser mistakes without losing context

    - **Authentication** (Simple)
      - Phone number login (enter phone, verify via WhatsApp)
      - Store JWT token in localStorage

12. **API Endpoints for Frontend**
    - `GET /api/user/verify` - Check logged-in status
    - `GET /api/tasks/{user_id}` - Get all tasks (assignments & quizzes)
    - `GET /api/tasks/{user_id}?type=assignment` - Get only assignments
    - `GET /api/tasks/{user_id}?type=quiz` - Get only quizzes
    - `PATCH /api/tasks/{id}/status` - Mark complete/incomplete
    - `PATCH /api/tasks/{id}` - Update parsed fields (varies by task_type)
    - `GET /api/tasks?needs_review=true` - Get flagged tasks needing review
    - Add CORS headers to all endpoints

13. **Dashboard Layout** (mobile-responsive)
    - Mobile: Vertical stack, card-based layout, large tap targets
    - Desktop: Sidebar filters, table view, compact
    - Header: User phone #, logout button
    - Filters: Type (All/Assignments/Quizzes) | Date (Today/This Week/All) | Status (Overdue/Completed)
    - Show red warning for overdue tasks
    - **Task Type Icons**: 📚 for assignments, 📝 for quizzes (for quick visual distinction)

**Verification**: Log in → see assignments → filter by week → mark one complete → verify in MongoDB

---

### Phase 5: Reminder System (Week 4)
**Goal**: Send WhatsApp reminders before due dates

14. **Scheduling Setup** (*depends on Phase 4*)
    - Use **APScheduler** in Flask app background thread
    - Create cron-like jobs:
      - Every hour: Check tasks due in next 24 hours → send reminder
      - Logic: `due_date - 24 hours < now < due_date`
    
    - Pseudocode:
      ```python
      def check_and_send_reminders():
          now = datetime.now()
          due_soon = db.tasks.find({
              "due_date": {"$gt": now, "$lt": now + timedelta(hours=24)},
              "status": "pending"
          })
          for task in due_soon:
              if not already_reminded(task):
                  send_whatsapp_reminder(task)
                  db.reminders_sent.insert({task_id, user_id, sent_at: now})
      
      scheduler.add_job(check_and_send_reminders, 'interval', hours=1)
      ```

15. **WhatsApp Message Sending** (*depends on 14*)
    - Create `utils/whatsapp_sender.py`:
      - Function: `send_reminder(user_phone, task)`
      - Use Meta Cloud API: POST to `/messages` endpoint
      - **For Assignments**: "📚 Reminder: {course} - {title} due in 24 hours (March 20, 2:00 PM)"
      - **For Quizzes**: "📝 Quiz Reminder: {course} - {title} | {material} | {duration} on March 20 at {time}"
    - Implement retry logic for failed sends
    - Log all sends to `reminders_sent` collection

16. **Verify No Double-Sends**
    - Query `reminders_sent` before sending
    - Only send if user hasn't received reminder for this task yet
    - Handle edge case: User marks task complete → no reminder needed

**Verification**: Create test assignment due tomorrow → manually trigger cron → verify message in WhatsApp

---

### Phase 6: Error Handling & Polish (Week 4-5)
**Goal**: Make system robust for actual use

17. **Error Handling for Unstructured Input**
    - If `needs_review=True` on parse, show in dashboard with "⚠️ Review" indicator
    - Add button: "Fix Task Details" → modal to manually edit parsed fields
    - Display raw message in modal so user has context for corrections
    - Log unparseable messages separately for model improvement
    - Handle quiz-specific fields: if material parsing fails, flag for review

18. **Edge Cases**
    - Duplicate messages (same user, same text, same timestamp) → check before storing
    - Empty messages → reject silently
    - Invalid phone numbers → validation
    - Timezone handling → store all times in UTC, convert on frontend
    - **Quiz-specific**: Missing material info → flag but don't reject (material is optional)

19. **Data Archival** (⭐ Prevent 512MB MongoDB overflow)
    - Add weekly cron job:
      ```python
      # Archive completed tasks (assignments & quizzes) > 30 days old
      # Move to "archived_tasks" collection OR delete
      # Keep last 50 completed tasks for history view
      ```
    - Monitor storage usage; alert if > 400MB
    - At semester end: cleanup old tasks, keep only last month of data

20. **Logging & Monitoring**
    - Add logging to all endpoints (Flask)
    - Monitor parse success rate (dashboard metric)
    - Log all WhatsApp API failures (with error codes)
    - Create simple admin route: `/admin/logs` (password protected) to view errors

21. **Testing & QA** (use the test dataset from Phase 3)
    - Run parsing on full test dataset: 20-30 real messages → verify accuracy > 80%
    - Test reminder scheduling with tomorrow's date assignment
    - Test frontend filters, sorting, completion toggle
    - Test mobile responsiveness: iOS + Android phones
    - Test edge cases: timezone changes, overdue assignments, rapid updates

**Verification**: Dashboard fully functional, no crashes, 80%+ parse accuracy, archive job runs weekly

---

### Phase 7: Deployment & Launch (Week 5+)
**Goal**: Ready for actual use by students

21. **Production Checklist**
    - [ ] Change `FLASK_ENV` to `production` in Render
    - [ ] Use Meta production WhatsApp account (optional, can stay in test for semester)
    - [ ] Enable HTTPS (automatic on Render)
    - [ ] Set secure JWT secrets
    - [ ] Database backups automated (MongoDB Atlas automatic)
    - [ ] Rate limiting on API endpoints
    - [ ] Verify webhook certificate validation

22. **User Onboarding**
    - Create simple user guide: "How to submit assignments"
    - Provide WhatsApp bot phone number to share with students
    - Share dashboard link (Vercel URL)
    - Create test group with 3-5 beta users first

23. **Monitoring Phase** (Semester)
    - Monitor parse accuracy weekly
    - Collect feedback from users
    - Improve NLP model with common misparses (Phase 2 enhancements)
    - Update documentation

---

## Relevant Files / Architecture

**Backend (Render)** - `duemate-backend` Python Flask repo:
- `app.py` (main Flask app, APScheduler init)
- `routes/webhook.py` (WhatsApp message webhook)
- `routes/api.py` (REST endpoints for dashboard)
- `utils/parse_task.py` (NLP parsing pipeline for assignments & quizzes)
- `utils/whatsapp_sender.py` (Meta API integration)
- `models/db.py` (MongoDB collections schema)
- `requirements.txt` (dependencies)
- `.env` (secrets: MongoDB URI, Meta API tokens)

**Frontend (Vercel)** - `duemate-dashboard` React repo:
- `src/components/AssignmentList.tsx` (main UI)
- `src/components/AssignmentCard.tsx` (individual assignment)
- `src/components/Filters.tsx` (sidebar filters)
- `src/pages/Dashboard.tsx` (main page)
- `src/services/api.ts` (API client)
- `src/utils/auth.ts` (JWT handling)
- `src/App.tsx`

**Database (MongoDB Atlas)**:
- Collection: `users` {phone_number, user_id, created_at}
- Collection: `tasks` {user_id, task_type, raw_message, parsed_course, parsed_title, parsed_due_date, quiz_material, quiz_duration, quiz_time, status, created_at}
- Collection: `reminders_sent` {user_id, task_id, sent_at}

---

## Verification Checklist

### Functional Tests
1. ✅ Can send message via WhatsApp sandbox → stored in MongoDB (both assignments & quizzes)
2. ✅ Dashboard loads and shows stored tasks
3. ✅ Parse accuracy test: 20-30 varied messages (mix of assignments & quizzes), 80%+ success for both
4. ✅ Can filter tasks by type (assignments/quizzes) and date range
5. ✅ Can mark tasks complete
6. ✅ Reminders sent 24 hours before due date (different messages for assignment vs quiz)
7. ✅ No double-sends of reminders
8. ✅ Unparseable messages flagged and reviewable
9. ✅ Quiz material/duration/time extracted and displayed correctly

### Non-Functional
1. ✅ Dashboard loads in < 2 seconds
2. ✅ WhatsApp messages processed within 5 seconds
3. ✅ Mobile responsive (test on phone)
4. ✅ No errors in console logs

---

## Architecture Diagram
```
┌──────────────────────────────────────────────────────────┐
│         Student sends message via WhatsApp               │
└────────────────────────┬─────────────────────────────────┘
                         │
                    [Webhook]
                         │
        ┌────────────────┴────────────────┐
        │      Render.com Flask App       │
        │  ┌────────────────────────────┐ │
        │  │ POST /webhook/messages     │ │
        │  │ - Receive message          │ │
        │  │ - Call parse_assignment()  │ │
        │  │ - Store in MongoDB         │ │
        │  └────────────────────────────┘ │
        │  ┌────────────────────────────┐ │
        │  │ APScheduler (hourly)       │ │
        │  │ - Check due assignments    │ │
        │  │ - Send WhatsApp reminders  │ │
        │  └────────────────────────────┘ │
        └────────┬──────────────┬──────────┘
                 │              │
        ┌────────┴──┐    ┌──────┴───────┐
        │ MongoDB   │    │ Meta API      │
        │ Atlas     │    │ (Reminders)   │
        └───────────┘    └───────────────┘

        ┌──────────────────────────────────┐
        │ Vercel React Dashboard           │
        │ ├─ Assignment List               │
        │ ├─ Filter (Today/Week/All)       │
        │ ├─ Mark Complete                 │
        │ └─ Edit Parsed Fields            │
        └──────────────────────────────────┘
```

---

## Tech Stack Summary (All Free)

| Component | Technology | Free Tier | Notes |
|-----------|-----------|-----------|-------|
| WhatsApp Bot | Meta Cloud API | ✅ Test account | Official, no cost |
| Backend | Flask + Python | ✅ Open-source | Simple & powerful |
| Hosting | Render.com | ✅ Free tier + Free Postgres | Includes 512MB DB |
| Frontend | React + TypeScript | ✅ Open-source | Industry standard |
| Frontend Hosting | Vercel | ✅ Free tier | Unlimited deployments |
| Database | MongoDB Atlas | ✅ Tier M0 (512MB) | Best free NoSQL option |
| NLP | spaCy | ✅ Open-source | Industry standard |
| Scheduling | APScheduler | ✅ Open-source | Built into Flask |
| Total Cost | — | ✅ $0 forever | No credit card needed |

---

## Scope Boundaries

**INCLUDED in MVP** (must-have):
- WhatsApp message ingestion (assignments & quizzes)
- Assignment & quiz parsing (unstructured text)
- Quiz-specific field extraction (material, duration, time)
- Dashboard with filter/sort (by type, date, status)
- Reminder scheduling (differentiated for each type)
- Mark tasks complete
- Edit parsed fields (including quiz-specific fields)

**EXCLUDED from MVP** (Phase 2 enhancements):
- Daily summary messages
- Priority/importance levels
- Assignment collaboration
- Grade tracking
- Custom notification times per user
- Machine learning model refinement
- User analytics

**DELIBERATELY EXCLUDED** (not in scope):
- SMS/email notifications (focus: WhatsApp)
- Integration with university LMS
- Student-to-teacher collaboration
- File attachment support

---

## Decisions & Assumptions

1. **Decision**: Use Meta WhatsApp API test account (not Twilio)
   - **Rationale**: Official, fully free, no credit card required, best docs

2. **Decision**: MongoDB over Supabase for Phase 1
   - **Rationale**: More forgiving schema for unstructured parsing feedback; easier NoSQL queries
   - **Could switch**: To Supabase later if need relational structure

3. **Decision**: Regex + spaCy hybrid parsing (not pure ML)
   - **Rationale**: 80-90% accuracy sufficient for MVP, faster to implement, offline
   - **Future**: Train custom NER model if accuracy becomes bottleneck

4. **Decision**: 1-hour reminder check interval
   - **Rationale**: Balance between notification freshness and scheduler load
   - **Could adjust**: To 30min if users want more frequent checks

5. **Decision**: Semester project scope = complete MVP + iterate for improvements
   - **Rationale**: MVP in 4 weeks leaves time for user testing & refinement

6. **Assumption**: Messages have at least 1-2 identifying features (course code or date)
   - **If wrong**: Will need to fall back to manual review mode

---

## Further Considerations

1. **Accuracy vs. User Friction**
   - Trade-off: 100% accuracy (always ask user to review) vs. 80% auto-parsing with manual fixes
   - **Recommendation**: Start with 80% + "Review" flag; iterate based on user feedback

2. **Scaling Beyond Semester**
   - If successful, might hit 512MB MongoDB limit (future step: upgrade to paid tier or archive old data)
   - **Plan**: Add data cleanup job at end of semester to archive completed assignments

3. **University Integration & Future Enhancements**
   - **Future consideration**: Some universities may want to officially deploy this
   - **Current MVP**: Standalone system, no LMS integration needed
   - **Path forward**: Would require institutional WhatsApp account (different API tier)
   
   **Enhancement: Automatic Group Message Forwarding** (Phase 2+ future)
   - Current ("manual"): Students forward assignment messages to bot
   - Future ("automatic"): Add bot to class WhatsApp groups → captures new assignment messages automatically
   - Technical path: Twilio WhatsApp sandbox supports group message webhooks (simpler than full Meta integration)
   - This would feel more "magical" to users — no manual forwarding needed

---

## Success Metrics (End of Semester)

- ✅ 10+ active users consistently using the system
- ✅ 80%+ parse accuracy on real student messages
- ✅ 95%+ reminders delivered successfully
- ✅ Average dashboard response < 500ms
- ✅ Zero cost throughout development