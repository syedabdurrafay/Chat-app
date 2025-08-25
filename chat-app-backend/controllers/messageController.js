import asyncHandler from 'express-async-handler';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { uploadFile, getFileType } from '../middleware/uploadMiddleware.js';
import path from 'path';
import fs from 'fs';

const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId, deleted: false })
      .populate("sender", "name pic email")
      .populate("chat")
      .populate("reactions.userId", "name pic");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const uploadMessageFile = asyncHandler(async (req, res) => {
  uploadFile(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }

    const fileType = getFileType(req.file.originalname);
    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      url: fileUrl,
      type: fileType,
      filename: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    });
  });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId, fileUrl, fileType, filename, size, mimeType } = req.body;

  if (!content && !fileUrl) {
    res.status(400);
    throw new Error('Invalid data passed into request');
  }

  const newMessage = {
    sender: req.user._id,
    content: content || (fileType === 'document' ? filename : 'Shared a file'),
    chat: chatId,
  };

  if (fileUrl) {
    newMessage.file = {
      url: fileUrl,
      type: fileType,
      filename: filename,
      size: size,
      mimeType: mimeType
    };
    newMessage.isFile = true;
  }

  try {
    let message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(chatId, { 
      latestMessage: message,
      $inc: { unreadMessages: 1 }
    });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const deleteFile = asyncHandler(async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        res.status(500);
        throw new Error('Failed to delete file');
      }
      res.status(200).json({ message: 'File deleted successfully' });
    });
  } else {
    res.status(404);
    throw new Error('File not found');
  }
});

const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    const existingReactionIndex = message.reactions.findIndex(
      r => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReactionIndex >= 0) {
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      message.reactions = message.reactions.filter(
        r => r.userId.toString() !== userId.toString()
      );
      
      if (emoji) {
        message.reactions.push({ userId, emoji });
      }
    }

    const updatedMessage = await message.save();
    const populatedMessage = await Message.populate(updatedMessage, [
      { path: 'sender', select: 'name pic email' },
      { path: 'chat' },
      { path: 'reactions.userId', select: 'name pic' }
    ]);

    res.json(populatedMessage);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;

  if (!content) {
    res.status(400);
    throw new Error('Content is required');
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to edit this message');
    }

    if (message.isFile) {
      res.status(400);
      throw new Error('File messages cannot be edited');
    }

    message.content = content;
    message.isEdited = true;
    const updatedMessage = await message.save();
    const populatedMessage = await Message.populate(updatedMessage, [
      { path: 'sender', select: 'name pic email' },
      { path: 'chat' },
      { path: 'reactions.userId', select: 'name pic' }
    ]);

    res.json(populatedMessage);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this message');
    }

    // Delete associated file if exists
    if (message.isFile && message.file?.url) {
      const filename = message.file.url.split('/').pop();
      const filePath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    message.deleted = true;
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export { 
  allMessages, 
  sendMessage, 
  uploadMessageFile, 
  deleteFile,
  reactToMessage,
  editMessage,
  deleteMessage
};