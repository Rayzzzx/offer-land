const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', [
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度应在3-20个字符之间'),
    body('password').isLength({ min: 6 }).withMessage('密码长度至少6个字符')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email ? '邮箱已被注册' : '用户名已被使用'
            });
        }

        // Create new user
        const user = new User({ email, username, password });
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: '注册成功',
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                joinDate: user.joinDate
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// Login
router.post('/login', [
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').notEmpty().withMessage('请输入密码')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: '邮箱或密码错误' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: '邮箱或密码错误' });
        }

        // Update last active
        user.lastActive = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        );

        res.json({
            message: '登录成功',
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                joinDate: user.joinDate,
                postCount: user.postCount,
                reputation: user.reputation
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            email: req.user.email,
            username: req.user.username,
            avatar: req.user.avatar,
            bio: req.user.bio,
            joinDate: req.user.joinDate,
            postCount: req.user.postCount,
            reputation: req.user.reputation
        }
    });
});

module.exports = router; 