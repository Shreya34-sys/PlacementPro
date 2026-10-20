const jwt = require('jsonwebtoken'); //Importing JWT Library.Provides functions like jwt.verify() to validate whether a token presented by a client is genuine and hasn't expired.

function extractToken(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    if (req.cookies) {
        if (req.cookies.adminToken) return req.cookies.adminToken;
        if (req.cookies.token) return req.cookies.token;
    }
    if (req.headers && req.headers.cookie) {
        const adminMatch = req.headers.cookie.match(/(?:^|;\s*)adminToken=([^;]+)/);
        if (adminMatch) return decodeURIComponent(adminMatch[1]);
        const tokenMatch = req.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
        if (tokenMatch) return decodeURIComponent(tokenMatch[1]);
    }
    if (req.query && req.query.token) {
        return req.query.token;
    }
    return null;
}

exports.verifyToken = (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ message: 'Access denied. Token missing.' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'placementpro_secret_key_@987';
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

exports.verifyAdmin = (req, res, next) => {             
    if (req.user && (req.user.role === 'admin' || req.user.role === 'ADMIN')) {
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