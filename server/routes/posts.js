const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all posts with pagination
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category;
        const search = req.query.search;

        let query = {};

        if (category && category !== 'all') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const posts = await Post.find(query)
            .populate('author', 'username avatar')
            .populate('replies.user', 'username avatar')
            .sort({ isPinned: -1, lastReplyAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Post.countDocuments(query);

        res.json({
            posts,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// Get single post
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username avatar bio joinDate postCount reputation')
            .populate('replies.user', 'username avatar bio joinDate postCount reputation');

        if (!post) {
            return res.status(404).json({ message: '帖子不存在' });
        }

        // Increment view count
        post.views += 1;
        await post.save();

        res.json(post);
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// Create new post
router.post('/', auth, [
    body('title').isLength({ min: 5, max: 200 }).withMessage('标题长度应在5-200个字符之间'),
    body('content').isLength({ min: 10, max: 10000 }).withMessage('内容长度应在10-10000个字符之间'),
    body('category').isIn(['求职', '面经', '内推', '生活', '技术', '其他']).withMessage('请选择有效的分类')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, category, tags } = req.body;

        const post = new Post({
            title,
            content,
            category,
            tags: tags || [],
            author: req.user._id
        });

        await post.save();

        // Update user post count
        await User.findByIdAndUpdate(req.user._id, { $inc: { postCount: 1 } });

        const populatedPost = await Post.findById(post._id)
            .populate('author', 'username avatar');

        res.status(201).json({
            message: '发帖成功',
            post: populatedPost
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// Add reply to post
router.post('/:id/replies', auth, [
    body('content').isLength({ min: 1, max: 5000 }).withMessage('回复内容长度应在1-5000个字符之间')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: '帖子不存在' });
        }

        if (post.isLocked) {
            return res.status(403).json({ message: '帖子已被锁定，无法回复' });
        }

        const reply = {
            user: req.user._id,
            content: req.body.content,
            createdAt: new Date()
        };

        post.replies.push(reply);
        await post.save();

        const updatedPost = await Post.findById(req.params.id)
            .populate('replies.user', 'username avatar');

        res.json({
            message: '回复成功',
            reply: updatedPost.replies[updatedPost.replies.length - 1]
        });
    } catch (error) {
        console.error('Add reply error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// Like/Unlike post
router.post('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: '帖子不存在' });
        }

        const likeIndex = post.likes.findIndex(like =>
            like.user.toString() === req.user._id.toString()
        );

        if (likeIndex > -1) {
            // Unlike
            post.likes.splice(likeIndex, 1);
        } else {
            // Like
            post.likes.push({ user: req.user._id });
        }

        await post.save();

        res.json({
            message: likeIndex > -1 ? '取消点赞' : '点赞成功',
            likesCount: post.likes.length,
            isLiked: likeIndex === -1
        });
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// Like/Unlike reply
router.post('/:postId/replies/:replyId/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: '帖子不存在' });
        }

        const reply = post.replies.id(req.params.replyId);
        if (!reply) {
            return res.status(404).json({ message: '回复不存在' });
        }

        const likeIndex = reply.likes.findIndex(like =>
            like.user.toString() === req.user._id.toString()
        );

        if (likeIndex > -1) {
            // Unlike
            reply.likes.splice(likeIndex, 1);
        } else {
            // Like
            reply.likes.push({ user: req.user._id });
        }

        await post.save();

        res.json({
            message: likeIndex > -1 ? '取消点赞' : '点赞成功',
            likesCount: reply.likes.length,
            isLiked: likeIndex === -1
        });
    } catch (error) {
        console.error('Like reply error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router; 