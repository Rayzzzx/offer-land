const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get conversations list
router.get('/conversations', auth, async (req, res) => {
    try {
        const userId = req.user._id;

        // Get all messages where user is sender or receiver
        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', userId] },
                            '$receiver',
                            '$sender'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$receiver', userId] },
                                        { $eq: ['$isRead', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'otherUser'
                }
            },
            {
                $unwind: '$otherUser'
            },
            {
                $project: {
                    otherUser: {
                        _id: 1,
                        username: 1,
                        avatar: 1,
                        lastActive: 1
                    },
                    lastMessage: 1,
                    unreadCount: 1
                }
            },
            {
                $sort: { 'lastMessage.createdAt': -1 }
            }
        ]);

        res.json(messages);
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// Get messages with specific user
router.get('/:userId', auth, async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const otherUserId = req.params.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        // Check if other user exists
        const otherUser = await User.findById(otherUserId).select('username avatar');
        if (!otherUser) {
            return res.status(404).json({ message: '用户不存在' });
        }

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: otherUserId },
                { sender: otherUserId, receiver: currentUserId }
            ]
        })
            .populate('sender', 'username avatar')
            .populate('receiver', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Mark messages as read
        await Message.updateMany(
            {
                sender: otherUserId,
                receiver: currentUserId,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        const total = await Message.countDocuments({
            $or: [
                { sender: currentUserId, receiver: otherUserId },
                { sender: otherUserId, receiver: currentUserId }
            ]
        });

        res.json({
            messages: messages.reverse(),
            otherUser,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// Send message
router.post('/', auth, [
    body('receiverId').notEmpty().withMessage('请指定接收者'),
    body('content').isLength({ min: 1, max: 2000 }).withMessage('消息内容长度应在1-2000个字符之间')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { receiverId, content } = req.body;
        const senderId = req.user._id;

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: '接收者不存在' });
        }

        // Can't send message to self
        if (senderId.toString() === receiverId) {
            return res.status(400).json({ message: '不能给自己发消息' });
        }

        const message = new Message({
            sender: senderId,
            receiver: receiverId,
            content
        });

        await message.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'username avatar')
            .populate('receiver', 'username avatar');

        res.status(201).json({
            message: '消息发送成功',
            data: populatedMessage
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// Mark message as read
router.put('/:messageId/read', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({ message: '消息不存在' });
        }

        // Only receiver can mark as read
        if (message.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: '无权限操作' });
        }

        message.isRead = true;
        message.readAt = new Date();
        await message.save();

        res.json({ message: '标记为已读' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// Get unread messages count
router.get('/unread/count', auth, async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiver: req.user._id,
            isRead: false
        });

        res.json({ count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router; 