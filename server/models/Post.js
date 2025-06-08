const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        maxlength: 10000
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['求职', '面经', '内推', '生活', '技术', '其他']
    },
    tags: [{
        type: String,
        trim: true
    }],
    views: {
        type: Number,
        default: 0
    },
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    replies: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            maxlength: 5000
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        likes: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        }]
    }],
    isPinned: {
        type: Boolean,
        default: false
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    lastReplyAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update lastReplyAt when new reply is added
postSchema.pre('save', function (next) {
    if (this.isModified('replies') && this.replies.length > 0) {
        this.lastReplyAt = new Date();
    }
    next();
});

module.exports = mongoose.model('Post', postSchema); 