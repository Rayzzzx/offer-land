const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: '没有提供访问令牌' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ message: '用户不存在' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: '无效的访问令牌' });
    }
};

module.exports = auth; 