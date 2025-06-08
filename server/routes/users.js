const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }

        // Get user's recent posts
        const recentPosts = await Post.find({ author: user._id })
            .select('title createdAt views likes replies')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            user,
            recentPosts
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// Update user profile
router.put('/profile', auth, [
    body('username').optional().isLength({ min: 3, max: 20 }).withMessage('用户名长度应在3-20个字符之间'),
    body('bio').optional().isLength({ max: 500 }).withMessage('个人简介不能超过500个字符'),
    body('avatar').optional().isURL().withMessage('头像必须是有效的URL')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, bio, avatar } = req.body;
        const userId = req.user._id;

        // Check if username is already taken (if provided)
        if (username) {
            const existingUser = await User.findOne({
                username,
                _id: { $ne: userId }
            });

            if (existingUser) {
                return res.status(400).json({ message: '用户名已被使用' });
            }
        }

        const updateData = {};
        if (username) updateData.username = username;
        if (bio !== undefined) updateData.bio = bio;
        if (avatar !== undefined) updateData.avatar = avatar;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-password');

        res.json({
            message: '个人资料更新成功',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// Search users
router.get('/', async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;

        if (!search) {
            return res.status(400).json({ message: '请提供搜索关键词' });
        }

        const query = {
            $or: [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        };

        const users = await User.find(query)
            .select('username avatar bio joinDate postCount reputation lastActive')
            .sort({ reputation: -1, postCount: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// Get user's posts
router.get('/:id/posts', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.params.id;

        // Check if user exists
        const user = await User.findById(userId).select('username');
        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }

        const posts = await Post.find({ author: userId })
            .populate('author', 'username avatar')
            .select('title content category createdAt views likes replies')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Post.countDocuments({ author: userId });

        res.json({
            posts,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total,
            user
        });
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router; 