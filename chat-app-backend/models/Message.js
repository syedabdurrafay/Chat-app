import mongoose from 'mongoose';

const messageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    file: {
      url: { type: String },
      type: { type: String, enum: ['image', 'video', 'document', 'audio'] },
      filename: { type: String },
      size: { type: Number }
    },
    isFile: { type: Boolean, default: false },
    reactions: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      emoji: { type: String }
    }],
    isEdited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

messageSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
  }
  next();
});

const Message = mongoose.model("Message", messageSchema);

export default Message;