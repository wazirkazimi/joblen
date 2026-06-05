const jwt = require("jsonwebtoken");

function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token format" });
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = process.env.ADMIN_JWT_SECRET;

  if (!jwtSecret) {
    console.error("ADMIN_JWT_SECRET environment variable is missing.");
    return res.status(500).json({ error: "Server authentication misconfiguration" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.admin = decoded;
    next();
  } catch (error) {
    console.error("JWT Verification failed:", error.message);
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}

module.exports = adminAuth;
