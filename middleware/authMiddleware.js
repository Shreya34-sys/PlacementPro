const jwt = require('jsonwebtoken'); //Importing JWT Library.Provides functions like jwt.verify() to validate whether a token presented by a client is genuine and hasn't expired.

exports.verifyToken = (req, res, next) => {         //Makes this function available to attach to routes in routes/authRoutes.js
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];  //Uses short-circuit evaluation (&&) to check if authHeader exists, then splits the string "Bearer <TOKEN>" by space and grabs the second element (index 1), isolating the raw JWT token.

    if (!token) {
        return res.status(401).json({ message: 'Access denied. Token missing.' }); //If no token was provided in the headers, it immediately halts execution and returns a 401 Unauthorized HTTP error
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  //Validates the token against your secret key stored in .env. If valid, decoded becomes a plain JavaScript object containing the user's encoded payload data (e.g., { id: "123", role: "student" }). If invalid or expired, it throws an error and triggers the catch block.
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

exports.verifyAdmin = (req, res, next) => {             
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
};

//Inspects req.user (which was attached by verifyToken). If the user exists and their role is 'admin', next() allows access to the route. Otherwise, it blocks the request with a 403 Forbidden error.



// req: Incoming HTTP request data.
// res: Express response object.

// next(): A trigger function that says "Everything is valid, pass control to the next middleware or controller."


//"Bearer" is a standard web naming convention that means: "Whoever is the bearer (holder) of this token has permission to access this resource."