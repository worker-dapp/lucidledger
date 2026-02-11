# Worker Profile Buildout

## Current State

**Skills and Work Experience are wired to the database and visible to employers.**

- **Database**: Migration `014-add-employee-profile-fields.sql` adds `skills TEXT` and `work_experience JSONB` to the `employee` table. Model updated in `server/models/Employee.js`.
- **Employee Profile** (`EmployeeProfile.jsx`): Skills tag input and Work Experience rows save correctly via `PUT /employees/:id`.
- **Employer Application Review** (`ApplicationReviewTab.jsx`): Worker Profile section shows location, skills (as pill tags), and work experience (title + date range) between the info grid and Offer Letter box. Only renders if the worker has data — otherwise hidden.

## What's Done

- [x] Database migration + model update (skills TEXT, work_experience JSONB)
- [x] Employer-side Worker Profile display in ApplicationReviewTab

## What Remains

### 3. Profile form improvements (see recommendations below)

---

## Recommendations: What to Ask Workers For

### Design Principles for This Platform
- **Target users**: Low-wage workers in low- and middle-income countries
- **Literacy varies**: Keep forms simple, use dropdowns/selections over free text where possible
- **Mobile-first**: Many users will be on phones — minimize typing
- **Trust barrier**: Workers may be wary of sharing too much info upfront; let them build their profile over time
- **Employer needs**: Employers need enough info to make hiring decisions, but this isn't LinkedIn — it's a wage-theft prevention platform where the contract terms and oracle verifications matter more than a polished resume
- **Do NOT collect**: Age, gender, race, marital status, or other protected class information. This exposes both the platform and employers to discrimination liability and is not relevant to job matching.

### Recommended Profile Fields

#### Tier 1: Onboarding (required to complete signup)
Keep this minimal — the goal is to get workers onto the platform quickly.

| Field | Format | Why |
|-------|--------|-----|
| First name | Text | Identity |
| Last name | Text | Identity |
| Email or Phone | Via Privy linking | Contact/auth (already implemented) |
| City + Country | Dropdowns | Basic location for job matching |
| Primary language | Dropdown (multi-select) | Critical for international low-wage workers |

**Note**: Currently onboarding also asks for full street address and zip code. Consider making street address **optional** at onboarding — city + country is enough for job matching, and requiring a full address upfront is a barrier for workers who may not have a stable one.

#### Tier 2: Profile completion (prompted after onboarding, not required)
Show a "Complete your profile" nudge on the dashboard. Let workers add these at their own pace.

| Field | Format | Why |
|-------|--------|-----|
| Skills | Tag selector from list (already built) | Job matching, employer review |
| Work experience | Structured rows (already built) | Employer review |
| Bio / About me | Short text area (280 char limit) | Personal pitch, humanizes the profile |
| Availability | Checkboxes: Full-time / Part-time / Weekends / Evenings | Helps employers filter |
| Can travel / willing to relocate | Yes/No toggle | Relevant for location-dependent work |
| Phone number (if signed up with email) | Via Privy linking | Backup contact |

#### Tier 3: Optional enrichment (available but never prompted)
These add value but should never feel mandatory.

| Field | Format | Notes |
|-------|--------|-------|
| Certifications / licenses | Text tags or free text | e.g., forklift license, food safety cert |
| Education level | Dropdown (None / Primary / Secondary / Vocational / University) | Keep it simple, no school names |
| References | Name + phone/email (max 2) | Optional, for workers who want to stand out |
| Profile photo | Image upload | Humanizes profile but is sensitive — never required |
| Full street address | Text fields | Move from onboarding to here; optional |

---

## Onboarding Flow Suggestion

```
Step 1: Auth (Privy — email, phone, or wallet)        [already built]
Step 2: "Tell us about yourself"
        - First name, Last name
        - City, Country (dropdowns)
        - Primary language(s)
        → [Create Account]
Step 3: Dashboard with "Complete your profile" card
        - Skills (tag picker)
        - Work experience
        - Availability
        - Bio
        → Each section saves independently
        → Progress indicator: "Profile 40% complete"
```

This is simpler than the current onboarding which asks for full address upfront. The idea is: **get workers in fast, then incentivize them to flesh out their profile** by showing employers prefer complete profiles.

---

## Profile Completeness as a Signal

Consider showing employers a **profile completeness indicator** on applications:
- "Profile: 80% complete" with a small progress ring
- This incentivizes workers to fill out more without requiring it
- Employers get a soft signal about worker engagement without gatekeeping access

---

## Implementation Order

1. **DB migration + model update** — wire skills and work_experience to the database (quick win, fixes the silent data loss bug)
2. **Employer review UI** — show skills and work history on ApplicationReviewTab
3. **Add language and availability fields** — new migration, model update, profile form section
4. **Simplify onboarding** — move street address to optional profile, add language selection
5. **Profile completeness** — progress indicator on dashboard + employer-visible badge
6. **Optional fields** — certifications, education, bio, photo upload

Steps 1-2 are the immediate priority since the UI already exists and data is being silently lost.
