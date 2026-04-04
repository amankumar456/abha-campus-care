## Plan

### Note 1 & 2: PDF Watermark
- Add permanent diagonal watermark text "NOT AN OFFICIAL DOCUMENT – DO NOT USE FOR LEAVE, CERTIFICATION, OR ANY OFFICIAL PURPOSE" to all printed documents via the `printDocument` utility
- Add top/bottom disclaimer text on every page
- Applies to: prescriptions, lab reports, medical leave, fitness certificates, referral letters, all certificates

### Note 3 & 4: Contact/Review System + Admin Dashboard
- Create `contact_submissions` database table to store contact form data, reviews, and suggestions
- Split the contact section into: **Contact Owner** (for inquiries) and **Reviews** (for students/professors with different fields)
- Add AI validation via edge function to reject spam/random data
- Create new admin dashboard section to display all submissions
- Add PDF export for reviews/professor responses

### Note 5 & 6: Login Restrictions
- Replace "Faculty Mentor" portal with "Admin" portal, restricted to `akkumarsingh456@gmail.com` only
- Remove signup option for Doctor, Pharmacy, Lab Officer, Medical Staff, Admin portals — signin only
- Add clear disclaimer that signup is restricted
- Restrict doctor login to only existing test doctor accounts (not real doctor names)
- Block signup with real doctor names

### Database Migration Needed
- Create `contact_submissions` table with fields for type (contact/review), name, email, subject, message, role (student/professor), branch, year, college, rating, and AI validation status
