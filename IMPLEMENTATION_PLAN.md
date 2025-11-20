# FunaGig - Safe Implementation Plan

**Created:** 2025-01-27  
**Status:** Awaiting Approval  
**Approach:** Incremental, Low-Risk First

---

## 🎯 IMPLEMENTATION STRATEGY

### Core Principles
1. **Lowest Risk First** - Start with fixes that cannot break existing functionality
2. **Incremental Changes** - One group at a time, with verification between steps
3. **Backward Compatible** - All changes maintain existing API contracts
4. **Testable** - Each phase can be tested independently
5. **Reversible** - Changes can be rolled back if issues arise

---

## 📋 PHASE BREAKDOWN

### **PHASE 1: Zero-Risk Fixes** ⚡ (5-10 minutes)
**Risk Level:** None - These are cosmetic/obvious bugs  
**Dependencies:** None  
**Rollback:** Trivial

#### Group 1.1: HTML/CSS Fixes
- **Task 1.1.1:** Remove typo in `business-posted-gigs.html:31` (stray "a" character)
  - **File:** `business-posted-gigs.html`
  - **Change:** Remove single character
  - **Risk:** None
  - **Verification:** Visual check

**Impact:** None on functionality, only cosmetic

---

### **PHASE 2: Low-Risk Security Enhancements** 🔒 (30-45 minutes)
**Risk Level:** Very Low - Adding validation, not changing logic  
**Dependencies:** None  
**Rollback:** Easy (remove validation checks)

#### Group 2.1: Input Validation & Sanitization
- **Task 2.1.1:** Validate path parameters (conversationId, userId) in `php/api.php`
  - **File:** `php/api.php` (lines 91-96)
  - **Change:** Add `is_numeric()` checks before processing
  - **Risk:** Very Low - Only rejects invalid input
  - **Backward Compatible:** Yes - Valid requests work as before
  - **Verification:** Test with valid and invalid IDs

- **Task 2.1.2:** Add input validation to `handleUpdateGig()`
  - **File:** `php/api.php` (after line 860)
  - **Change:** Validate status enum, type enum, budget, text lengths
  - **Risk:** Very Low - Only rejects invalid data
  - **Backward Compatible:** Yes - Valid data works as before
  - **Verification:** Test with valid and invalid inputs

- **Task 2.1.3:** Add phone/website validation to `handleProfile()`
  - **File:** `php/api.php` (in `handleProfile()` function)
  - **Change:** Add regex validation for phone, URL validation for website
  - **Risk:** Very Low - Only rejects invalid formats
  - **Backward Compatible:** Yes - Existing valid data unaffected
  - **Verification:** Test profile updates

**Impact:** Better security, no breaking changes

#### Group 2.2: XSS Protection Verification
- **Task 2.2.1:** Verify `escapeHtml()` usage in `business-posted-gigs.html`
  - **File:** `business-posted-gigs.html`
  - **Change:** Ensure all user-generated content uses `escapeHtml()`
  - **Risk:** Very Low - Only adds safety, doesn't change behavior
  - **Backward Compatible:** Yes
  - **Verification:** Check rendered HTML for escaped content

**Impact:** Prevents XSS attacks, no functional changes

---

### **PHASE 3: Medium-Risk Security Fixes** 🛡️ (1-2 hours)
**Risk Level:** Low-Medium - Adding authorization checks  
**Dependencies:** Phase 2 (validation should be in place first)  
**Rollback:** Moderate (remove authorization checks)

#### Group 3.1: Authorization Checks
- **Task 3.1.1:** Add ownership verification to `handleUpdateGig()`
  - **File:** `php/api.php` (line 843, before update)
  - **Change:** Verify gig belongs to user before updating
  - **Risk:** Low - May reject previously allowed operations (but they were bugs)
  - **Backward Compatible:** Yes - Legitimate operations still work
  - **Verification:** Test updating own gig vs others' gigs

- **Task 3.1.2:** Add ownership verification to `handleDeleteGig()`
  - **File:** `php/api.php` (line 886, before delete)
  - **Change:** Verify gig belongs to user before deleting
  - **Risk:** Low - Same as above
  - **Backward Compatible:** Yes
  - **Verification:** Test deleting own gig vs others' gigs

- **Task 3.1.3:** Add ownership verification to `handleGetApplicants()`
  - **File:** `php/api.php` (line 911, when gigId provided)
  - **Change:** Verify user owns gig before showing applicants
  - **Risk:** Low - Prevents unauthorized access
  - **Backward Compatible:** Yes - Legitimate access still works
  - **Verification:** Test accessing applicants for own vs others' gigs

**Impact:** Prevents unauthorized access, improves security

---

### **PHASE 4: File Upload Security** 📁 (1-2 hours)
**Risk Level:** Medium - Changes file validation logic  
**Dependencies:** None  
**Rollback:** Moderate (revert to extension-based validation)

#### Group 4.1: Enhanced File Validation
- **Task 4.1.1:** Add MIME type validation to file uploads
  - **File:** `php/api.php` (lines 1484-1504)
  - **Change:** Use `finfo_file()` to verify actual file type, not just extension
  - **Risk:** Medium - May reject some files that were previously accepted
  - **Backward Compatible:** Mostly - Valid files still work, malicious ones rejected
  - **Verification:** Test with various file types (images, PDFs, documents)
  - **Note:** Keep extension validation as secondary check

- **Task 4.1.2:** Sanitize filenames in uploads
  - **File:** `php/api.php` (around line 1519)
  - **Change:** Use `preg_replace()` to sanitize filename
  - **Risk:** Low - Only affects filename, not file content
  - **Backward Compatible:** Yes - Files still upload, just with sanitized names
  - **Verification:** Test uploads with special characters in filenames

**Impact:** Prevents malicious file uploads, improves security

---

### **PHASE 5: Configuration Security** 🔐 (30-45 minutes)
**Risk Level:** Low - Adding config file, not changing logic  
**Dependencies:** None  
**Rollback:** Easy (remove config.local.php, restore defaults)

#### Group 5.1: Secure Configuration Management
- **Task 5.1.1:** Create `php/config.local.php` template
  - **File:** `php/config.local.php` (NEW FILE)
  - **Change:** Create local config file for sensitive data
  - **Risk:** Very Low - New file, doesn't affect existing code
  - **Backward Compatible:** Yes - Falls back to defaults if file missing
  - **Verification:** Test with and without config.local.php

- **Task 5.1.2:** Update `php/config.php` to load local config
  - **File:** `php/config.php` (add require_once at top)
  - **Change:** Load config.local.php if exists, use defaults otherwise
  - **Risk:** Very Low - Graceful fallback
  - **Backward Compatible:** Yes - Works with or without local config
  - **Verification:** Test application still works

- **Task 5.1.3:** Create `.gitignore` entry for `config.local.php`
  - **File:** `.gitignore` (create or update)
  - **Change:** Add `php/config.local.php` to gitignore
  - **Risk:** None
  - **Verification:** Check git status

**Impact:** Secures credentials, maintains backward compatibility

---

### **PHASE 6: Password Reset Security** 🔑 (1 hour)
**Risk Level:** Medium - Changes API response format  
**Dependencies:** Phase 5 (email config should be ready)  
**Rollback:** Moderate (restore token in response)

#### Group 6.1: Remove Token from Response
- **Task 6.1.1:** Create basic email sending function
  - **File:** `php/email.php` (NEW FILE)
  - **Change:** Create `sendPasswordResetEmail()` function using PHP mail()
  - **Risk:** Low - New file, doesn't affect existing code
  - **Backward Compatible:** Yes
  - **Verification:** Test email sending (if SMTP configured)

- **Task 6.1.2:** Remove token from password reset response
  - **File:** `php/api.php` (lines 1827-1833)
  - **Change:** Remove 'token' and 'dev_mode' from response, call email function
  - **Risk:** Medium - Changes API contract (but improves security)
  - **Backward Compatible:** No - Frontend must not rely on token in response
  - **Verification:** Test password reset flow
  - **Note:** Frontend already handles token from URL, so this should be safe

**Impact:** Removes security vulnerability, requires email configuration

---

### **PHASE 7: WebSocket Security** 🔌 (1-2 hours)
**Risk Level:** Medium-High - Changes authentication flow  
**Dependencies:** None (but should be after Phase 3)  
**Rollback:** Moderate (remove validation, restore simple auth)

#### Group 7.1: WebSocket Session Validation
- **Task 7.1.1:** Add session validation to WebSocket server
  - **File:** `websocket-server/server.js` (lines 96-120)
  - **Change:** Validate sessionToken against database before allowing connection
  - **Risk:** Medium-High - May break existing WebSocket connections
  - **Backward Compatible:** No - Requires valid session token
  - **Verification:** Test WebSocket connection with valid/invalid tokens
  - **Note:** Client must send valid session token (check `js/app.js`)

- **Task 7.1.2:** Enhance WebSocket error recovery in client
  - **File:** `js/app.js` (lines 1960-1968)
  - **Change:** Improve reconnection logic and error messages
  - **Risk:** Low - Only improves error handling
  - **Backward Compatible:** Yes
  - **Verification:** Test WebSocket disconnection scenarios

**Impact:** Secures WebSocket, may require client updates

---

### **PHASE 8: API Improvements** 📡 (2-3 hours)
**Risk Level:** Low-Medium - Adding features, not breaking changes  
**Dependencies:** None  
**Rollback:** Easy (remove pagination, restore old queries)

#### Group 8.1: Pagination
- **Task 8.1.1:** Add pagination to `handleGigs()`
  - **File:** `php/api.php` (in `handleGigs()` function)
  - **Change:** Add page/limit parameters, return pagination metadata
  - **Risk:** Low - Backward compatible (defaults to page 1, limit 20)
  - **Backward Compatible:** Yes - Old clients get first page by default
  - **Verification:** Test with and without pagination params

- **Task 8.1.2:** Add pagination to `handleConversations()`
  - **File:** `php/api.php` (in `handleConversations()` function)
  - **Change:** Similar to above
  - **Risk:** Low
  - **Backward Compatible:** Yes
  - **Verification:** Test conversation listing

- **Task 8.1.3:** Add pagination to `handleNotifications()`
  - **File:** `php/api.php` (in `handleNotifications()` function)
  - **Change:** Similar to above
  - **Risk:** Low
  - **Backward Compatible:** Yes
  - **Verification:** Test notification listing

**Impact:** Improves performance, maintains backward compatibility

#### Group 8.2: Error Response Standardization
- **Task 8.2.1:** Standardize error response format
  - **File:** `php/api.php` (all error responses)
  - **Change:** Ensure all errors use `sendError()` function consistently
  - **Risk:** Low - Only standardizes format
  - **Backward Compatible:** Yes - Error format remains similar
  - **Verification:** Test error scenarios

**Impact:** Better API consistency, no breaking changes

---

### **PHASE 9: Database Optimizations** 🗄️ (30 minutes)
**Risk Level:** Very Low - Adding indexes only  
**Dependencies:** None  
**Rollback:** Easy (drop indexes)

#### Group 9.1: Performance Indexes
- **Task 9.1.1:** Add missing database indexes
  - **File:** `database/database.sql` (add at end) OR create migration file
  - **Change:** Add indexes for deadline, applied_at, created_at fields
  - **Risk:** Very Low - Indexes only improve performance
  - **Backward Compatible:** Yes - No schema changes
  - **Verification:** Run SQL, check query performance

**Impact:** Improves query performance, no functional changes

---

### **PHASE 10: Frontend Improvements** 🎨 (1-2 hours)
**Risk Level:** Low - UI enhancements only  
**Dependencies:** None  
**Rollback:** Easy (revert changes)

#### Group 10.1: Client-Side Validation
- **Task 10.1.1:** Add form validation to gig posting form
  - **File:** `business-post-gig.html`
  - **Change:** Add real-time validation feedback
  - **Risk:** Low - Only improves UX
  - **Backward Compatible:** Yes
  - **Verification:** Test form submission with invalid data

- **Task 10.1.2:** Add form validation to profile forms
  - **Files:** `student-profile.html`, `business-profile.html`
  - **Change:** Add validation for phone, website, email formats
  - **Risk:** Low
  - **Backward Compatible:** Yes
  - **Verification:** Test profile updates

**Impact:** Better UX, prevents invalid submissions

#### Group 10.2: API Path Auto-Detection
- **Task 10.2.1:** Make API path configurable
  - **File:** `js/app.js` (line 5)
  - **Change:** Auto-detect API path from current location
  - **Risk:** Low - Has fallback to current path
  - **Backward Compatible:** Yes - Falls back to `/funagig/php/api.php`
  - **Verification:** Test from different directory structures

**Impact:** More flexible deployment, maintains compatibility

---

## 🔄 DEPENDENCY GRAPH

```
Phase 1 (Zero-Risk)
    ↓
Phase 2 (Low-Risk Security)
    ↓
Phase 3 (Authorization) ← Can run in parallel with Phase 4
    ↓
Phase 4 (File Uploads) ← Can run in parallel with Phase 3
    ↓
Phase 5 (Config Security)
    ↓
Phase 6 (Password Reset) ← Depends on Phase 5
    ↓
Phase 7 (WebSocket) ← Should be after Phase 3
    ↓
Phase 8 (API Improvements) ← Independent
    ↓
Phase 9 (Database) ← Independent
    ↓
Phase 10 (Frontend) ← Independent
```

---

## ✅ TESTING CHECKLIST (After Each Phase)

### Phase 1-2 Testing
- [ ] Application loads without errors
- [ ] HTML displays correctly
- [ ] Forms submit successfully
- [ ] Invalid inputs are rejected

### Phase 3 Testing
- [ ] Users can only modify their own resources
- [ ] Unauthorized access attempts are blocked
- [ ] Legitimate operations still work

### Phase 4 Testing
- [ ] Valid files upload successfully
- [ ] Invalid files are rejected
- [ ] Filenames are sanitized
- [ ] MIME types are verified

### Phase 5-6 Testing
- [ ] Application works with/without local config
- [ ] Password reset emails are sent (if configured)
- [ ] Tokens are not exposed in responses

### Phase 7 Testing
- [ ] WebSocket connects with valid session
- [ ] WebSocket rejects invalid sessions
- [ ] Reconnection works properly

### Phase 8-10 Testing
- [ ] Pagination works correctly
- [ ] Error messages are consistent
- [ ] Forms validate properly
- [ ] API path detection works

---

## 🚨 HIGH-RISK CHANGES & ALTERNATIVES

### High-Risk: WebSocket Session Validation (Phase 7)
**Risk:** May break existing connections  
**Alternative Approach:**
1. **Option A (Recommended):** Implement validation but make it optional initially
   - Add feature flag: `REQUIRE_WS_AUTH = false`
   - Validate if flag is true, allow if false
   - Gradually enable after testing

2. **Option B:** Deploy to staging first, test thoroughly
   - Test with multiple clients
   - Monitor connection success rate
   - Roll back if issues found

### High-Risk: Password Reset Token Removal (Phase 6)
**Risk:** May break frontend if it relies on token in response  
**Alternative Approach:**
1. Check frontend code first - verify it doesn't use token from response
2. If it does, update frontend first, then backend
3. Or: Keep token in dev mode, remove in production config

### Medium-Risk: File Upload MIME Validation (Phase 4)
**Risk:** May reject previously accepted files  
**Alternative Approach:**
1. Log rejected files for analysis
2. Start with warning mode (log but allow)
3. Switch to strict mode after monitoring

---

## 📝 ROLLBACK PLAN

### For Each Phase:
1. **Git Commit:** Commit before starting phase
2. **Backup:** Backup database before database changes
3. **Test:** Test after each phase
4. **Rollback:** If issues found, `git revert` or restore from backup

### Quick Rollback Commands:
```bash
# Rollback code changes
git log --oneline  # Find commit hash
git revert <commit-hash>

# Rollback database (if indexes added)
# Run: DROP INDEX statements from Phase 9
```

---

## ⏱️ ESTIMATED TIMELINE

- **Phase 1:** 5-10 minutes
- **Phase 2:** 30-45 minutes
- **Phase 3:** 1-2 hours
- **Phase 4:** 1-2 hours
- **Phase 5:** 30-45 minutes
- **Phase 6:** 1 hour
- **Phase 7:** 1-2 hours
- **Phase 8:** 2-3 hours
- **Phase 9:** 30 minutes
- **Phase 10:** 1-2 hours

**Total:** 9-14 hours (can be done incrementally over multiple days)

---

## 🎯 RECOMMENDED EXECUTION ORDER

### Week 1: Critical Security (Phases 1-4)
- Day 1: Phases 1-2 (Zero/Low risk)
- Day 2: Phase 3 (Authorization)
- Day 3: Phase 4 (File Uploads)
- Day 4: Testing & fixes

### Week 2: Configuration & WebSocket (Phases 5-7)
- Day 1: Phase 5 (Config)
- Day 2: Phase 6 (Password Reset)
- Day 3: Phase 7 (WebSocket) - with careful testing
- Day 4: Testing & fixes

### Week 3: Improvements (Phases 8-10)
- Day 1: Phase 8 (API)
- Day 2: Phase 9 (Database)
- Day 3: Phase 10 (Frontend)
- Day 4: Final testing

---

## ✅ APPROVAL CHECKLIST

Before I proceed with implementation, please confirm:

- [ ] You understand the phased approach
- [ ] You agree with the risk assessment
- [ ] You approve starting with Phase 1 (zero-risk fixes)
- [ ] You want me to proceed incrementally (one phase at a time)
- [ ] You'll test after each phase before I continue
- [ ] You have database backups ready
- [ ] You understand rollback procedures

---

## 📋 NEXT STEPS

1. **Review this plan** - Check if any phases need adjustment
2. **Approve Phase 1** - I'll start with zero-risk fixes
3. **Test after each phase** - Verify everything works
4. **Approve next phase** - Only proceed after your approval
5. **Iterate** - Continue until all phases complete

---

**Status:** ⏳ Awaiting Approval  
**Ready to Start:** Phase 1 (Zero-Risk Fixes)

