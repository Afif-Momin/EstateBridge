# Estate Bridge - Local Testing Guide

## 🚀 Servers Running

Both servers are now running and ready for testing:

- **Backend API**: http://localhost:3000
- **Frontend App**: http://localhost:5173
- **API Health Check**: http://localhost:3000/api/v1/health

## 📋 Testing Checklist

### 1. Authentication Flow

#### Register New Users
1. Open http://localhost:5173 in your browser
2. Click "Register" or navigate to http://localhost:5173/register
3. Create two accounts for testing:
   - **Seller Account**:
     - Full Name: John Seller
     - Email: seller@test.com
     - Password: Test1234
     - Role: Seller
   - **Buyer Account**:
     - Full Name: Jane Buyer
     - Email: buyer@test.com
     - Password: Test1234
     - Role: Buyer

#### Login
1. After registration, you'll be redirected to the appropriate dashboard
2. Test logout and login with both accounts
3. Verify role-based redirects work correctly

### 2. Seller Features

Login as the seller account (seller@test.com) to test:

#### Create Property Listing
1. Navigate to "Create New Listing" from the dashboard
2. Fill in property details:
   - Title: Beautiful 3BR House in North Region
   - Description: Spacious family home with modern amenities
   - Price: 450000
   - Region: North Region (from dropdown)
   - Address: 123 Main Street, North City
   - Property Type: House
   - Status: Available
3. Upload 1-3 images (optional, max 10 images, 5MB each)
4. Click "Create Listing"
5. Verify redirect to property detail page

#### Manage Listings
1. Go to "My Listings" from dashboard
2. View all your properties
3. Click "Edit" on a property
4. Update any field (e.g., change price to 475000)
5. Save changes and verify update
6. Test "Delete" with confirmation modal

#### Manage Appointments
1. Go to "Appointments" from dashboard
2. View appointment requests from buyers
3. Accept or decline pending appointments
4. Verify real-time status updates

### 3. Buyer Features

Login as the buyer account (buyer@test.com) to test:

#### Browse Properties
1. Navigate to "Browse Properties"
2. Test search filters:
   - Keyword search (e.g., "house")
   - Region filter (select "North Region")
   - Property type filter (select "House")
   - Price range (min: 400000, max: 500000)
3. Click "Search" and verify filtered results
4. Test "Clear" to reset filters
5. Test pagination if multiple properties exist

#### View Property Details
1. Click on any property card
2. View full property information
3. Check image gallery navigation
4. Scroll to see reviews/feedback section

#### Book Appointment
1. On a property detail page, click "Book Appointment"
2. Select a future date and time
3. Submit appointment request
4. Verify success message
5. Try booking duplicate appointment (should fail)

#### Manage Appointments
1. Go to "My Appointments" from dashboard
2. View all your appointments
3. Cancel a confirmed appointment
4. Verify real-time status updates

#### Submit Feedback
1. View a property detail page
2. Scroll to the feedback section
3. Select a star rating (1-5)
4. Write a comment (10-500 characters)
5. Submit review
6. Verify it appears in the feedback list
7. Try submitting duplicate feedback (should fail)

### 4. AI Support (Both Roles)

1. Navigate to "AI Support" from the navbar
2. Type a message: "Tell me about Estate Bridge"
3. Wait for AI response
4. Ask follow-up questions
5. Verify conversation history persists
6. Refresh page and verify history restored from session storage
7. Logout and verify conversation cleared

### 5. Dashboard Statistics

#### Seller Dashboard
1. Login as seller
2. View dashboard statistics:
   - Total Listings
   - Active Listings
   - Pending Appointments
   - Confirmed Appointments
3. Create/delete properties and verify stats update

#### Buyer Dashboard
1. Login as buyer
2. View dashboard statistics:
   - Total Appointments
   - Pending Appointments
   - Confirmed Appointments
   - Feedback Submitted
3. Book appointments and submit feedback, verify stats update

### 6. Real-time Updates (Firestore Listeners)

Test real-time synchronization:

1. Open two browser windows side-by-side
2. Login as seller in one, buyer in the other
3. Buyer books appointment → Seller sees it appear immediately
4. Seller accepts appointment → Buyer sees status change immediately
5. Buyer submits feedback → Rating updates immediately on property page

### 7. Error Handling & Validation

Test error scenarios:

#### Form Validation
- Try submitting empty forms
- Enter invalid email format
- Use weak password (missing uppercase/number)
- Enter price as negative number
- Try address less than 10 characters

#### Authentication Errors
- Login with wrong password
- Login with non-existent email
- Try accessing protected routes without login

#### Business Logic Errors
- Book appointment in the past (should fail)
- Submit feedback twice on same property (should fail)
- Try editing another seller's property (should fail)
- Upload image larger than 5MB (should fail)

### 8. Accessibility Testing

1. Navigate using keyboard only (Tab, Enter, Escape)
2. Test screen reader compatibility (if available)
3. Verify all images have alt text
4. Check form labels and error messages
5. Test focus indicators on interactive elements

### 9. Responsive Design

Test on different screen sizes:
1. Desktop (1920x1080)
2. Tablet (768x1024)
3. Mobile (375x667)

Use browser DevTools to simulate different devices.

## 🔍 API Testing (Optional)

You can also test the backend API directly using tools like Postman or curl:

### Health Check
```bash
curl http://localhost:3000/api/v1/health
```

### Register User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "fullName": "Test User",
    "role": "buyer"
  }'
```

### Get Regions
```bash
curl http://localhost:3000/api/v1/search/regions
```

## 🐛 Known Issues to Watch For

1. **Firebase Rate Limits**: If you see authentication errors, you might have hit Firebase's rate limits. Wait a few minutes.
2. **Image Upload**: Large images may take time to upload. Progress indicator shows loading state.
3. **AI Support**: Requires valid OpenAI API key in backend .env. If not configured, you'll see error messages.

## 📊 Monitoring

### Backend Logs
Check the backend terminal for:
- Request logs (Morgan HTTP logger)
- Error logs (Winston)
- Firebase operations
- API endpoint hits

### Frontend Console
Open browser DevTools Console to see:
- React Query cache updates
- Redux state changes
- Firebase client operations
- Network requests

## 🛑 Stopping Servers

When done testing, you can stop the servers from the terminal or use Ctrl+C in each terminal window.

## ✅ Success Criteria

Your testing is successful if:
- ✅ Users can register and login with both roles
- ✅ Sellers can create, edit, and delete properties
- ✅ Buyers can browse, search, and view properties
- ✅ Appointment booking and management works
- ✅ Feedback submission and display works
- ✅ Real-time updates work across browser windows
- ✅ Form validation catches errors
- ✅ Role-based access control works
- ✅ Navigation and routing work correctly
- ✅ Toast notifications appear for actions
- ✅ Loading states show during async operations

## 🎉 Next Steps

After testing, you can:
1. Deploy to production (Firebase Hosting + Cloud Functions)
2. Add more features from the spec
3. Implement optional property-based tests
4. Set up CI/CD pipeline
5. Configure Firebase Security Rules (Task 20)

Happy Testing! 🚀
