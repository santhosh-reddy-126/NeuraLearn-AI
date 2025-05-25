
import jwt from 'jsonwebtoken'
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"

  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "neuralearn_secret_key");
    req.user = decoded; // Attach to request
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid Token' });
  }
}


export default verifyToken;