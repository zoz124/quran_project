# Quran Memorization Platform — Master Requirements & Development Plan

## 1. Project Vision

Build a professional, Arabic-first web platform that helps users memorize and revise the Quran through guided memorization sessions, Sheikh recitation, voice-based recitation, voice evaluation, tests, final recitation, Tafsir, and automatic progress tracking.

The product should feel like a premium Quran learning platform, not a generic admin dashboard.

The MVP has **one application role only: User/Student**.

There is no Teacher role and no Admin role in the MVP.

---

# 2. Core Product Principles

1. The Quran's core content must come from a **ready-made online Quran data provider**.
2. The application must **not manually create or populate** the 114 Surahs, Ayahs, Juz data, reciter audio, Tafsir, or Quran page/image data.
3. All user/application data must be stored **online/cloud-based**, not only on the user's device.
4. The same account must work across laptop, mobile, and other supported devices.
5. Memorization progress must be calculated from **Ayah-level progress**, not arbitrary manually entered percentages.
6. Quran audio must be available **Ayah by Ayah** so the user can listen to specific Ayahs.
7. The user recites using the **microphone/voice**, not by typing the Ayah.
8. Voice evaluation must be confidence-aware and must not claim perfect Tajweed or perfect speech recognition unless the selected technology genuinely supports it.
9. External Quran/audio/Tafsir providers must be isolated behind replaceable service interfaces.
10. The UI must be RTL and Arabic-first.
11. The experience should be simple for the user while the architecture remains scalable and maintainable.

---

# 3. Quran Content Strategy — Ready-Made Online Data

## 3.1 No Manual Quran Database

The project must NOT require the developer to manually insert:

- Surahs
- Ayahs
- Juz
- Quran page information
- Reciters
- Recitation audio
- Tafsir
- Quran images/pages

These are considered **master Quran content** and should come from an existing online Quran data provider/API.

The application consumes this data through a dedicated integration layer.

---

## 3.2 Required Quran Content

The selected provider should ideally provide:

- Surah/chapter list
- Surah names in Arabic
- Surah numbers
- Ayah/verse text
- Ayah numbers
- Juz information
- Page information when available
- Reciters/Sheikhs
- Ayah-by-Ayah audio
- Tafsir
- Quran page/image data when available
- Stable IDs that allow the application to reference content consistently

Example reciter:

- Mishary Rashid Alafasy

The exact provider must be verified during implementation for:

- API availability
- authentication requirements
- rate limits
- licensing/usage rights
- audio usage rights
- Tafsir usage rights
- image redistribution rules
- caching rules
- production usage limitations

---

# 4. Cloud / Online Data Architecture

The application must be designed as an online/cloud application.

## 4.1 User/Application Database

A cloud-hosted relational database should store application-specific data.

Examples:

- PostgreSQL on a managed cloud platform
- Supabase PostgreSQL
- Neon PostgreSQL
- Another managed PostgreSQL provider

The exact provider can be selected during implementation.

The application database stores:

- Users
- User Ayah Progress
- Memorization Sessions
- Session Ayahs
- Recitation Attempts
- Recitation Evaluations
- Memorization Tests
- Test Attempts
- Revision Sessions
- Revision Ayahs
- Session History
- User settings/preferences

---

## 4.2 Quran Master Data

The application must NOT recreate the Quran database manually.

Instead:

```text
Application
    ↓
Backend Quran Service
    ↓
Online Quran Provider/API
    ↓
Surahs / Ayahs / Juz / Audio / Tafsir / Images
```

The application may cache provider data when appropriate, but caching must follow the provider's terms.

If caching is implemented, it should be treated as a technical optimization and synchronization layer, not as a manually maintained Quran database.

---

## 4.3 Media Storage Principle

Do not store large audio files or Quran images directly inside relational database rows unless there is a strong technical reason.

Prefer:

```text
Database
    ↓
External content ID / URL / metadata
    ↓
Online audio/image/content provider
```

The database should primarily store references and metadata.

For example:

```text
ReciterId
ProviderAyahId
AudioUrl
Duration
```

rather than storing the complete audio binary inside SQL.

---

## 4.4 Cross-Device Synchronization

A user must be able to:

1. Register/login on a laptop.
2. Create memorization sessions.
3. Complete part of a session.
4. Close the laptop.
5. Open the application on a mobile device.
6. Login with the same account.
7. Continue seeing the same progress/history/session data.

Therefore, progress and session data must be stored server-side.

The browser must not be the source of truth for user progress.

---

# 5. Primary User

## User / Student

The user can:

- Register
- Login
- Select Quran content
- Create memorization sessions
- Listen to a Sheikh
- Recite using microphone
- Receive voice evaluation
- Repeat recitation
- Take memorization tests
- Perform final recitation
- View results
- View progress
- Revise previously memorized Quran
- View Tafsir
- View session history
- Manage profile/settings

No Teacher/Admin role is required for MVP.

---

# 6. Main Application Screens

1. Landing / Home
2. Login
3. Register
4. Dashboard
5. Quran Progress
6. Juz Details
7. Create Memorization Session
8. Active Memorization Session
9. Voice Recitation
10. Voice Test
11. Final Recitation
12. Session Result
13. Revision Setup
14. Revision Session
15. Session History
16. Profile / Settings

---

# 7. Dashboard

The dashboard is the user's main home screen.

It should show:

## 7.1 Overall Quran Progress

Display:

```text
Overall Quran Memorization
██████████░░░░░░░░ 52%
```

This percentage must be calculated from Ayah-level progress.

Formula:

```text
Completed Ayahs
---------------- × 100
Total Quran Ayahs
```

Do not manually store a random overall percentage as the source of truth.

---

## 7.2 Juz Progress

Display all 30 Juz.

Each Juz can appear as a premium card containing:

- Juz number
- Progress percentage
- Progress bar
- Optional Quran/Juz image
- Completed Ayahs
- Total Ayahs

Formula:

```text
Completed Ayahs in Juz
----------------------- × 100
Total Ayahs in Juz
```

---

## 7.3 Last Memorization

Show:

- Surah
- Ayah range
- Completion date
- Result/performance

Example:

```text
Last Memorization

Surah Al-Mulk
Ayahs 1–15
Completed: September 20, 2026
```

---

## 7.4 Continue Memorization

The system may suggest the next memorization range based on the user's progress.

Example:

```text
Suggested:
Surah Al-Mulk — Ayahs 16–30
```

The user must still be able to edit/change the selection.

---

## 7.5 Main Dashboard Actions

Primary actions:

- Start Memorization
- Start Revision
- View Progress
- View History

---

# 8. Quran Progress Model

Progress must be based on individual Ayahs.

For example:

```text
User
  ↓
Ayah 1 → Completed
Ayah 2 → Completed
Ayah 3 → Completed
Ayah 4 → Not Completed
...
```

This allows the application to calculate:

- Overall Quran progress
- Surah progress
- Juz progress
- Memorization recommendations
- Revision recommendations

---

# 9. Memorization Session

A memorization session is the central feature.

The user creates a session by selecting:

- Surah
- Ayah range
- Sheikh/Reciter
- Sheikh repetition count
- User recitation attempts
- Number of tests
- Difficulty
- Tafsir preference

---

# 10. Surah and Ayah Selection

The user can select:

### Option A — Number of Ayahs

Example:

```text
Surah: Al-Mulk
Number of Ayahs: 15
```

### Option B — Exact Range

Example:

```text
Surah: Al-Mulk
From Ayah: 1
To Ayah: 15
```

The interface should make range selection easy.

---

# 11. Sheikh / Reciter Selection

The user can select a Sheikh/Reciter.

Example:

```text
Mishary Rashid Alafasy
```

The application should retrieve the Sheikh's available Ayah audio from the Quran content provider.

The application must not require the developer to manually upload and map thousands of audio files.

---

# 12. Sheikh Recitation Stage

For each selected Ayah:

1. Display the Ayah.
2. Play the selected Sheikh's audio.
3. Repeat the audio according to the configured number of repetitions.

Example:

```text
Ayah 1

Sheikh:
▶ Play

Repetitions:
3
```

The user can listen to the Ayah several times before reciting it.

---

# 13. Difficulty Presets

The MVP includes three difficulty presets.

## Easy

Default:

- Sheikh repetitions: 5
- Tests: 1
- More repetition/support

## Medium

Default:

- Sheikh repetitions: 3
- Tests: 2

## Hard

Default:

- Sheikh repetitions: 1
- Tests: 3

These are **presets**, not hard-coded restrictions.

The architecture should allow future customization.

---

# 14. User Voice Recitation

After listening to the Sheikh, the user recites the Ayah using the microphone.

The user must NOT type the Ayah as the primary memorization interaction.

Basic flow:

```text
Listen
  ↓
Repeat Sheikh audio
  ↓
User recites
  ↓
Voice evaluation
  ↓
Result
  ↓
Retry if needed
```

---

# 15. User Recitation Attempts

The user can configure the number of attempts.

Example:

```text
Attempts per Ayah: 3
```

The system records each attempt.

Example:

```text
Ayah 7

Attempt 1 → Possible mistake
Attempt 2 → Correct
```

The application should keep the evaluation history.

---

# 16. Voice Evaluation

The system receives:

- Expected Ayah
- User audio

and returns an evaluation.

Conceptually:

```text
Expected Ayah
      +
User Voice
      ↓
Speech Recognition / Voice Evaluation
      ↓
Evaluation
```

The evaluation may contain:

- Transcribed text
- Matching score
- Confidence
- Possible missing words
- Possible extra words
- Possible substitutions
- Error locations
- Overall result

---

# 17. Evaluation States

Do not force every voice attempt into only Correct/Incorrect.

Recommended states:

### Correct

The system has sufficient confidence that the recitation matches the expected text.

### Possible Mistake

The system detects a likely mismatch but confidence is not high enough for a definitive conclusion.

### Could Not Evaluate

The audio quality, speech recognition, provider availability, or confidence level is insufficient.

This is important because automatic speech evaluation is not perfect.

---

# 18. Voice Evaluation UI

Example:

```text
Your Recitation

✓ Looks Correct

Accuracy: 94%

[Listen to your recording]
[Continue]
```

Possible mistake:

```text
Possible issue detected

Expected:
... Quran text ...

Detected:
... detected text ...

[Listen to correct Ayah]
[Try Again]
```

The system should clearly distinguish AI/system evaluation from guaranteed Quranic/Tajweed correctness.

---

# 19. Memorization Test

After the learning/recitation stage, the user takes a configurable number of tests.

Example:

```text
Tests: 2
```

The MVP test type:

> Hide part of an Ayah and ask the user to complete the missing part by voice.

Example:

```text
"قل هو الله ___"

User recites the missing part.
```

The user answers using the microphone.

The system evaluates the answer against the expected Quran text.

---

# 20. Test Configuration

The number of tests is configurable.

Difficulty presets provide defaults:

```text
Easy   → 1 test
Medium → 2 tests
Hard   → 3 tests
```

Future versions may support:

- Different missing sections
- Random Ayah selection
- Start-of-Ayah completion
- Middle-of-Ayah completion
- End-of-Ayah completion
- More advanced recall tests

These are not required for the MVP.

---

# 21. Final Full-Session Recitation

After learning and tests are completed, the user performs one final continuous recitation of the selected range.

Example:

```text
Selected range:
Al-Mulk — Ayahs 1–15

Final Recitation:
Ayah 1 → Ayah 2 → Ayah 3 → ... → Ayah 15
```

The user recites continuously using the microphone.

The system evaluates the full session.

---

# 22. Final Session Result

The result page should show:

- Surah
- Ayah range
- Difficulty
- Sheikh
- Sheikh repetition count
- Number of user attempts
- Number of tests
- Test results
- Final recitation result
- Possible issues/errors
- Overall performance
- Completion status

Example:

```text
Session Completed

Surah: Al-Mulk
Ayahs: 1–15

Sheikh: Mishary Alafasy
Sheikh Repetitions: 3

Attempts: 2
Tests: 2

Final Recitation: 92%

Status:
Completed
```

---

# 23. Session Completion

A session should be considered completed only after the required workflow is finished.

Conceptually:

```text
Session Created
      ↓
Sheikh Recitation
      ↓
User Recitation
      ↓
Required Attempts
      ↓
Tests
      ↓
Final Recitation
      ↓
Session Result
      ↓
Progress Update
```

---

# 24. Automatic Progress Update

When the session is completed, the system updates the user's Ayah-level progress.

For example:

```text
Ayah 1 → Memorized
Ayah 2 → Memorized
...
Ayah 15 → Memorized
```

The dashboard recalculates:

- Surah progress
- Juz progress
- Overall Quran progress

No manual percentage update is required.

---

# 25. Revision

Revision is separate from learning new Quran content.

The user can choose:

- Full Surah
- Specific Ayah range

Example:

```text
Revision
Surah: Al-Baqarah
From: Ayah 1
To: Ayah 20
```

Revision flow:

```text
Select range
    ↓
Listen / Recite
    ↓
Voice evaluation
    ↓
Result
```

Revision should not automatically behave exactly like a new memorization session.

---

# 26. Tafsir

Tafsir is optional.

The user can enable it during the session or from settings.

Possible modes:

### On Request

User taps:

```text
View Tafsir
```

### After Recitation

Tafsir appears after completing the Ayah.

### Always Visible

Tafsir is shown alongside the Ayah.

Recommended MVP default:

```text
On Request
```

Tafsir content should come from the selected online Quran content provider or another properly licensed source.

---

# 27. Core Application Database

The application database should contain only application/user-specific data.

Recommended entities:

## Users

Stores account information.

Possible fields:

- Id
- Email
- Password/Identity reference
- Name
- CreatedAt
- Settings/preferences

---

## UserAyahProgress

Stores the user's progress per Ayah.

Possible fields:

- Id
- UserId
- ProviderAyahId
- SurahId/reference
- AyahNumber
- Status
- FirstMemorizedAt
- LastReviewedAt
- LastScore
- UpdatedAt

Important:

The Quran text itself should not be manually duplicated here unless there is a verified technical reason.

---

## MemorizationSessions

Stores session-level information.

Possible fields:

- Id
- UserId
- SurahId/reference
- StartAyah
- EndAyah
- ReciterId/reference
- Difficulty
- SheikhRepetitions
- UserAttempts
- NumberOfTests
- TafsirMode
- Status
- StartedAt
- CompletedAt

---

## SessionAyahs

Stores the Ayahs included in a session.

Possible fields:

- Id
- SessionId
- ProviderAyahId
- Order
- Status

---

## RecitationAttempts

Stores user voice attempts.

Possible fields:

- Id
- SessionAyahId
- AttemptNumber
- AudioReference
- Duration
- CreatedAt

---

## RecitationEvaluations

Stores evaluation results.

Possible fields:

- Id
- AttemptId
- Status
- Score
- Confidence
- Transcription
- ErrorData
- EvaluatedAt

---

## MemorizationTests

Stores test definitions/results at session level.

Possible fields:

- Id
- SessionId
- TestNumber
- TestType
- TargetAyahId
- MissingStart
- MissingEnd
- Status

---

## TestAttempts

Stores user answers to tests.

Possible fields:

- Id
- TestId
- AudioReference
- Transcription
- Score
- Confidence
- Status
- CreatedAt

---

## RevisionSessions

Stores revision sessions.

Possible fields:

- Id
- UserId
- SurahId/reference
- StartAyah
- EndAyah
- StartedAt
- CompletedAt
- Status

---

## RevisionAyahs

Stores Ayahs included in revision.

Possible fields:

- Id
- RevisionSessionId
- ProviderAyahId
- Score
- Status

---

## SessionHistory

Can either be a dedicated read model or derived from session entities.

It should allow the user to see:

- Date
- Surah
- Ayah range
- Session type
- Score
- Status
- Completion time

---

# 28. Quran Provider Integration Layer

Create an abstraction such as:

```text
IQuranContentProvider
```

Possible responsibilities:

```text
GetSurahs()
GetSurah()
GetAyahs()
GetAyahsByRange()
GetJuz()
GetJuzAyahs()
GetReciters()
GetAyahAudio()
GetTafsir()
GetQuranPage()
```

The exact interface depends on the selected provider.

The application should not spread provider-specific HTTP calls throughout controllers.

---

# 29. External Service Abstractions

Use replaceable interfaces for external services.

Recommended:

```text
IQuranContentProvider
IAudioProvider
ITafsirProvider
IVoiceEvaluationService
```

This allows replacing a provider without rewriting the entire application.

---

# 30. Recommended System Architecture

```text
┌───────────────────────────────┐
│         Web Frontend          │
│        Arabic / RTL UI        │
└───────────────┬───────────────┘
                │ HTTPS
                ▼
┌───────────────────────────────┐
│         Backend API            │
│                               │
│ Authentication               │
│ Dashboard                    │
│ Progress                     │
│ Memorization                 │
│ Revision                     │
│ Session Management           │
│ Voice Evaluation             │
└───────┬─────────┬─────────────┘
        │         │
        │         ├──────────────────────┐
        │         │                      │
        ▼         ▼                      ▼
┌────────────┐ ┌────────────────┐ ┌──────────────────┐
│ Cloud DB   │ │ Quran Provider │ │ Voice Evaluation │
│ PostgreSQL │ │ Online API     │ │ Service/API      │
└────────────┘ └────────────────┘ └──────────────────┘
```

---

# 31. Backend Services

Recommended application services:

```text
QuranService
MemorizationSessionService
RevisionService
ProgressService
RecitationService
VoiceEvaluationService
TafsirService
HistoryService
```

Controllers should remain thin and delegate business logic to services.

---

# 32. Authentication

The application requires user authentication.

Recommended:

- Secure registration
- Secure login
- Password hashing through a trusted authentication framework
- Session/token management
- Logout
- Protected user data
- Authorization so users can access only their own data

The MVP has one role, but the system should still maintain ownership boundaries.

---

# 33. Security and Privacy

The system must protect:

- Account credentials
- User profile data
- Voice recordings
- Progress data
- Session history

Important rules:

1. Never store plaintext passwords.
2. Do not expose another user's progress.
3. Protect API endpoints.
4. Validate all user input.
5. Use HTTPS in production.
6. Store API keys/secrets in environment variables or a secure secrets manager.
7. Do not expose external provider secrets in frontend code.
8. Define a retention strategy for voice recordings.
9. Delete temporary audio when no longer needed, if allowed by the product requirements.
10. Follow the terms/privacy requirements of the voice and Quran providers.

---

# 34. Voice Data Strategy

Voice is sensitive user-generated data.

The architecture should decide:

- Whether recordings are permanently stored.
- Whether recordings are only temporarily uploaded for evaluation.
- How long recordings remain available.
- Whether the user can delete recordings.
- Whether the voice provider stores or processes the audio.

For MVP, temporary processing is preferable unless permanent recordings are explicitly needed.

---

# 35. UI/UX Direction

The UI must feel:

- Premium
- Calm
- Spiritual
- Modern
- Professional
- Minimal
- Easy to use

It should NOT look like a generic SaaS/admin dashboard.

---

# 36. Visual Identity

Main colors:

- Deep/emerald green
- Off-white / ivory
- Silver / neutral gray
- Very subtle muted gold accents

Avoid:

- Excessive gradients
- Excessive gold
- Overly bright colors
- Crowded patterns
- Visual noise

---

# 37. Islamic Visual Language

Use subtle:

- Islamic geometric patterns
- Arches
- Mashrabiya-inspired motifs
- Elegant borders
- Fine separators
- Minimal decorative details

Do not put distracting patterns behind Quran text.

The Quran reading area should remain highly readable.

---

# 38. Typography

Arabic-first typography.

Possible UI fonts:

- IBM Plex Sans Arabic
- Cairo
- Noto Sans Arabic
- Noto Kufi Arabic

A dedicated Quran font may be used if its licensing permits the intended use.

The Quran text must prioritize:

- Readability
- Correct shaping
- Proper Arabic rendering
- Clear diacritics
- Comfortable line height

---

# 39. Dashboard Visual Concept

The dashboard should include a premium hero section showing:

```text
السلام عليكم، زِياد

استمر في طريق حفظك للقرآن

██████████████░░░░░ 68%

68% من القرآن
```

Then:

```text
Continue Memorization
Surah Al-Mulk
Ayahs 16–30

[Continue]
```

Then:

```text
Quick Actions

[Start Memorization]
[Start Revision]
```

Then:

```text
Your Progress

Juz 1
████████░░ 80%

Juz 2
██████░░░░ 60%

...
```

The exact UI can evolve during design.

---

# 40. Memorization Session Visual Concept

The memorization screen should be distraction-free.

Possible structure:

```text
Surah Al-Mulk
Ayah 7 / 15

────────────────────

Quran Ayah

[Arabic Ayah Text]

────────────────────

Sheikh Recitation

▶ Play
Repeat: 3x

────────────────────

Your Recitation

🎙 Start Recording

────────────────────

Result

✓ Correct

[Continue]
```

Recording state must be visually obvious.

---

# 41. Accessibility

The application should support:

- Clear contrast
- Large readable Quran text
- Keyboard navigation where applicable
- Accessible buttons
- Clear recording states
- Screen-reader-friendly labels
- Responsive layouts
- Mobile-first interaction

---

# 42. Mobile-First Session Experience

The active memorization session is one of the most important mobile experiences.

It should work comfortably on:

- Mobile phones
- Tablets
- Laptops

The microphone interaction should be simple and obvious.

---

# 43. Error Handling

The system must handle:

- Quran provider unavailable
- Audio unavailable
- Tafsir unavailable
- Voice provider unavailable
- Microphone permission denied
- Poor audio quality
- Network failure
- Session timeout
- Invalid Ayah range
- Authentication expiration

Errors should be user-friendly and should not expose technical secrets.

---

# 44. Provider Failure Strategy

Because Quran/audio/Tafsir data may come from external services, the application should consider:

- Request retries where appropriate
- Timeouts
- Rate-limit handling
- Caching where permitted
- Provider health checks
- Graceful fallback messages

The application must not silently invent Quran content if an external provider fails.

---

# 45. API Design Principles

Backend APIs should be organized around application capabilities.

Examples:

```text
GET    /api/quran/surahs
GET    /api/quran/surahs/{id}
GET    /api/quran/ayahs
GET    /api/quran/reciters
GET    /api/quran/ayahs/{id}/audio

GET    /api/dashboard
GET    /api/progress
GET    /api/progress/juz/{juzNumber}

POST   /api/memorization/sessions
GET    /api/memorization/sessions/{id}
POST   /api/memorization/sessions/{id}/attempts
POST   /api/memorization/sessions/{id}/tests
POST   /api/memorization/sessions/{id}/final-recitation

POST   /api/revision/sessions
GET    /api/history
```

Exact routes may change during API design.

---

# 46. Application Database vs Quran Provider

This distinction must remain clear throughout development.

## Quran Provider owns:

- Quran text
- Surah metadata
- Ayah metadata
- Juz metadata
- Reciter data
- Recitation audio
- Tafsir
- Quran page/image content

## Application Database owns:

- User account
- User progress
- Sessions
- Attempts
- Evaluations
- Tests
- Revision history
- User settings

The application should reference Quran content rather than manually recreating it.

---

# 47. What Must NOT Be Hard-Coded

Do not hard-code:

- All 114 Surahs
- All 6236 Ayahs
- Ayah text copied manually into source code
- Thousands of audio URLs manually
- Tafsir content manually
- Juz mapping manually

The application should retrieve these from the selected provider.

Small UI configuration values are allowed to be configured normally.

---

# 48. Development Phases

## Phase 0 — Product & Architecture

Finalize:

- Requirements
- User journey
- Use Case Diagram
- User Flow
- ERD
- System Architecture
- API boundaries
- UI design system
- Quran provider
- Audio provider
- Tafsir provider
- Voice evaluation strategy
- Cloud database provider
- Licensing/usage requirements

Documents:

```text
requirements.md
use-cases.md
user-flows.md
architecture.md
database.md
api-contract.md
ui-design.md
```

---

# 49. Phase 1 — Project Foundation

Build:

- Frontend
- Backend
- Cloud database
- Authentication
- RTL layout
- Design system
- Basic routing
- API structure
- Error handling
- Environment configuration

At the end of this phase:

```text
User can register/login
User data is stored online
```

---

# 50. Phase 2 — Quran Provider Integration

Build:

- Surah list
- Surah details
- Ayah retrieval
- Ayah ranges
- Juz retrieval
- Reciter list
- Ayah audio
- Tafsir integration
- Quran page/image integration if required

Important:

Do not manually populate the Quran database.

The application should prove that real provider data is being retrieved.

---

# 51. Phase 3 — Dashboard & Progress

Build:

- Overall Quran percentage
- Surah progress
- Juz progress
- Ayah-level progress
- Last memorization
- Continue memorization
- Memorization button
- Revision button
- History

---

# 52. Phase 4 — Memorization Session MVP

Build the complete session flow using real Quran/audio data but initially allow the voice evaluation layer to use a **mock evaluator**.

Flow:

```text
Select Surah
↓
Select Ayah range
↓
Select Sheikh
↓
Select repetitions
↓
Select attempts
↓
Select tests
↓
Start session
↓
Listen
↓
Recite
↓
Mock evaluation
↓
Tests
↓
Final recitation
↓
Result
↓
Progress update
```

This allows the entire product flow to be tested before integrating complex AI voice evaluation.

---

# 53. Phase 5 — Real Voice Evaluation

Replace the mock evaluator with a real voice evaluation service.

Build:

- Microphone capture
- Audio upload/streaming
- Speech recognition
- Expected Ayah comparison
- Confidence scoring
- Error detection
- Evaluation states
- Retry flow

The service must be abstracted so it can be replaced later.

---

# 54. Phase 6 — Voice Tests & Final Recitation

Implement:

- Hidden Ayah section
- Voice answer
- Test evaluation
- Configurable number of tests
- Full-session continuous recitation
- Final evaluation
- Session result

---

# 55. Phase 7 — Tafsir & Revision

Implement:

- Tafsir On Request
- Tafsir After Recitation
- Tafsir Always Visible
- Revision setup
- Revision session
- Revision voice evaluation
- Revision history

---

# 56. Phase 8 — UI/UX Polish

Improve:

- Responsive design
- Mobile experience
- Arabic typography
- Islamic visual details
- Animations
- Loading states
- Empty states
- Error states
- Accessibility
- Audio controls
- Recording controls

---

# 57. Phase 9 — Testing

Test:

## Authentication

- Registration
- Login
- Logout
- Protected routes

## Quran

- Surahs
- Ayahs
- Ranges
- Juz
- Audio
- Tafsir

## Progress

- Ayah completion
- Surah percentage
- Juz percentage
- Overall percentage

## Memorization

- Session creation
- Sheikh repetition
- Attempts
- Tests
- Final recitation
- Completion

## Voice

- Microphone permissions
- Audio upload
- Evaluation
- Low confidence
- Failed evaluation
- Retry

## Revision

- Range selection
- Recitation
- Evaluation
- History

## Cross-device

- Login on different device
- Progress synchronization
- Session history synchronization

---

# 58. Phase 10 — Deployment

Deploy:

```text
Frontend
    ↓
Cloud Hosting

Backend
    ↓
Cloud Hosting

Database
    ↓
Managed PostgreSQL

Quran
    ↓
Online Quran Provider

Voice
    ↓
Voice Evaluation Provider
```

Configure:

- HTTPS
- Environment variables
- Production database
- Database migrations
- Backups
- Logging
- Monitoring
- Rate limits
- Error tracking

---

# 59. MVP Definition of Done

The MVP is complete when a user can:

1. Register.
2. Login.
3. Open the dashboard.
4. See Quran progress.
5. See all 30 Juz progress.
6. Select a Surah.
7. Select an Ayah range.
8. Select a Sheikh.
9. Configure Sheikh repetitions.
10. Configure recitation attempts.
11. Configure number of tests.
12. Start a memorization session.
13. Listen to real Ayah audio.
14. Recite through microphone.
15. Receive voice evaluation.
16. Retry when needed.
17. Take voice-based memorization tests.
18. Perform final full-range recitation.
19. Receive session results.
20. Automatically update Ayah-level progress.
21. See updated dashboard progress.
22. Start a revision session.
23. Use Tafsir when enabled.
24. View session history.
25. Login from another device and see the same online data.

---

# 60. AI Coding Agent Rules

If an AI coding agent is used to build the project:

## Rule 1

Do not invent Quran content.

Always retrieve Quran content from the configured provider.

## Rule 2

Do not manually generate 114 Surahs / 6236 Ayahs in the application code.

## Rule 3

Do not manually upload thousands of recitation files.

Use the selected online content provider.

## Rule 4

Do not store secrets in frontend code.

Use environment variables/secrets management.

## Rule 5

Do not use local storage as the source of truth for progress.

Progress must be stored online.

## Rule 6

Do not expose another user's data.

Every application record must be associated with the authenticated user where applicable.

## Rule 7

Keep external providers behind interfaces/services.

Do not scatter provider-specific API calls throughout the application.

## Rule 8

Keep controllers thin.

Business logic belongs in services.

## Rule 9

Do not add unnecessary features outside the requirements.

Build the required MVP first.

## Rule 10

Do not replace the Quran provider with fake/static Quran data unless explicitly requested for testing.

## Rule 11

When voice evaluation is unavailable, fail gracefully instead of pretending that evaluation succeeded.

## Rule 12

Preserve Arabic RTL and Quran text readability throughout the UI.

---

# 61. Immediate Next Steps

Before writing production code, complete these artifacts in order:

1. **Use Case Diagram**
2. **Detailed User Flow**
3. **ERD / Database Design**
4. **System Architecture Diagram**
5. **API Contract**
6. **Quran Provider Selection & Verification**
7. **Voice Evaluation Provider/Strategy**
8. **UI/UX Design System**
9. **Project Folder Structure**
10. **Cloud Database Setup**
11. **Authentication**
12. **Quran Provider Integration**
13. **Dashboard**
14. **Progress**
15. **Memorization Session**
16. **Voice Evaluation**
17. **Tests**
18. **Final Recitation**
19. **Revision**
20. **Tafsir**
21. **Testing**
22. **Deployment**

---

# 62. Recommended First Implementation Milestone

Do not start by building AI voice evaluation.

First build:

```text
Authentication
      ↓
Cloud Database
      ↓
Quran Provider
      ↓
Real Surah/Ayah Selection
      ↓
Dashboard
      ↓
Ayah-Level Progress
      ↓
Memorization Session
      ↓
Mock Voice Evaluation
```

Once the complete workflow works, replace the mock evaluator with the real voice evaluation service.

This reduces technical risk and allows the product to be tested early.

---

# 63. Final Product Experience

The intended experience is:

```text
Login
  ↓
Dashboard
  ↓
See Quran Progress
  ↓
Start Memorization
  ↓
Choose Surah
  ↓
Choose Ayah Range
  ↓
Choose Sheikh
  ↓
Choose Difficulty
  ↓
Listen to Sheikh
  ↓
Recite by Voice
  ↓
Receive Evaluation
  ↓
Retry if Needed
  ↓
Take Voice Tests
  ↓
Final Full Recitation
  ↓
Session Result
  ↓
Automatic Progress Update
  ↓
Dashboard Updated
```

For revision:

```text
Dashboard
  ↓
Revision
  ↓
Choose Surah / Ayah Range
  ↓
Recite
  ↓
Voice Evaluation
  ↓
Revision Result
  ↓
History / Progress
```

---

# 64. Final Architecture Principle

The most important architectural distinction is:

```text
                    ONLINE QURAN CONTENT
             ┌──────────────────────────────┐
             │ Surahs                       │
             │ Ayahs                        │
             │ Juz                          │
             │ Reciters                     │
             │ Audio                        │
             │ Tafsir                       │
             │ Images / Pages               │
             └──────────────┬───────────────┘
                            │
                         Provider
                            │
                            ▼
                    YOUR BACKEND API
                            │
                            ▼
                    YOUR CLOUD DATABASE
             ┌──────────────────────────────┐
             │ Users                        │
             │ Ayah Progress                │
             │ Sessions                     │
             │ Attempts                     │
             │ Evaluations                  │
             │ Tests                        │
             │ Revision                     │
             │ History                      │
             └──────────────────────────────┘
                            │
                            ▼
                    YOUR WEB APPLICATION
```

The project therefore does **not** become a manually maintained Quran database.

It becomes a cloud-based Quran learning application that consumes professional, ready-made Quran content and stores only the user's learning/application data.

---

# 65. Important Provider Verification Before Production

Before committing to a specific Quran provider, verify:

- Quran text source and accuracy
- Stable Ayah identifiers
- Surah/Juz mappings
- Ayah-by-Ayah audio availability
- Mishary Alafasy availability
- Tafsir availability
- Image/page availability
- API authentication
- Rate limits
- Commercial/non-commercial usage
- Caching permissions
- Audio redistribution permissions
- Tafsir redistribution permissions
- Production reliability
- Terms of service

The provider decision must be documented before production implementation.

