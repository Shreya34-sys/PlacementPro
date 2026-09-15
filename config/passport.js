
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy; // 1. Import JwtStrategy
const ExtractJwt = require('passport-jwt').ExtractJwt; // 2. Import ExtractJwt
const User = require('../models/userModel');
const nodemailer = require('nodemailer');

// Sets up email sending engine using standard Gmail SMTP credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- GOOGLE STRATEGY ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {

    try {

        const email =
            profile.emails && profile.emails[0]
                ? profile.emails[0].value
                : null;

        if (!email) {
            return done(new Error('No email found in Google profile'), null);
        }

        console.log('Google authentication successful for:', email);

        let user = await User.findByEmail(email);

if (!user) {

    user = await User.createGoogleUser({
        fullName: profile.displayName,
        email: email,
        googleId: profile.id
    });

} else {

    // Existing student account
    if (!user.googleId) {
        await User.linkGoogleAccount(user.id, profile.id);
        user.googleId = profile.id;
    }
}

return done(null, user);

    } catch (err) {

        console.error('GOOGLE AUTH ERROR:', err);

        return done(err, null);
    }
}));
// --- JWT STRATEGY (ADD THIS SECTION) ---
const jwtOpts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your_fallback_secret_key'
};

passport.use('jwt', new JwtStrategy(jwtOpts, async (jwtPayload, done) => {
    try {
        // Fetch user based on id stored in JWT payload
        const userId = jwtPayload.id || jwtPayload.userId;
        const user = await User.findById(userId);

        if (user) {
            return done(null, user); // Attaches user to req.user
        }
        return done(null, false);
    } catch (err) {
        return done(err, false);
    }
}));

// Required session serialization hooks
passport.serializeUser((user, done) => {
    done(null, user.id || user);
});

passport.deserializeUser((id, done) => {
    done(null, { id });
});

module.exports = passport;





































//Neither process nor profile are imported using require(). They come from standard Node.js runtime globals and function parameters
//When a user logs in with Google, Google sends back an object containing their profile data (Name, ID, Email). Passport packages that data and hands it directly to your function under the variable name profile.


// callbackURL: "/api/auth/google/callback"
// This is the Return Address for Google's OAuth process.

// How the Google Auth sequence works:

// The student clicks "Continue with Google".

// The browser redirects the student away from your site to Google's official login screen.

// Once the student approves the login, Google needs to know where to send the user back to on your server.

// Google looks at callbackURL and redirects the student back to http://localhost:5000/api/auth/google/callback along with an authorization code.

// Your server receives that code at this endpoint, verifies it, issues a JWT token, and logs the user into PlacementPro.

// (Note: This URL path must match the Authorized redirect URIs setting configured inside your Google Cloud Console project settings).










// 1. What is async?
// In JavaScript, functions run line-by-line almost instantaneously. However, operations like querying a database, making network calls to Google, or sending an email take a few milliseconds (or seconds) to finish.

// By default, JavaScript won't wait for those operations—it keeps running the next line of code, which can cause errors if the data isn't ready yet.

// async (Asynchronous): Placing async before a function declaration tells JavaScript: "This function will perform tasks that take time to finish."

// await: Used inside an async function. It tells JavaScript: "Pause execution right here until this specific background task finishes and returns its result, then move to the next line."

// 2. The 4 Callback Variables
// Inside config/passport.js:

// JavaScript
// async (accessToken, refreshToken, profile, done) => { ... }
// When Google verifies a student's login, Google automatically invokes this function and passes in four specific arguments:

// accessToken

// What it is: A temporary access token provided by Google.

// Use: Allows your application to make direct API requests to Google on behalf of the user (for example, fetching their Google Calendar or Google Drive files if your app requested those permissions). In PlacementPro, you only need basic profile info, so you don't actively use this variable.

// refreshToken

// What it is: A long-lived credential sent by Google alongside the access token.

// Use: Used to automatically obtain a new accessToken when the current one expires without forcing the user to type their credentials again. Not actively used in your current setup.

// profile

// What it is: A JavaScript object containing the user's verified identity details straight from Google's servers.

// Use: Contains properties like profile.id (Google's unique user ID), profile.displayName (their full name), and profile.emails[0].value (their email address). You use these fields to create or locate the student's record in your MySQL database.

// done

// What it is: A built-in Passport callback function used to finish the authentication process.

// Use: Tells Passport whether authentication succeeded or failed so Express can proceed to the next step:

// Success: return done(null, user); (Passes the MySQL user object to the next handler).

// Error: return done(err, null); (Informs Passport an error occurred during database lookup/creation).