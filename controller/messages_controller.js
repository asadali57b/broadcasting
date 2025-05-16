const Message = require('../models/messages_model');
const {message_validation_schema} = require('../middleware/validation');
const group_messages=require('../models/group_messagesModel');
class Message_Controller{
    async send_message(req,res){
        try{
            const {reciever,content} = req.body;
            const { error } = message_validation_schema.validate(req.body);

            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }
            
            const new_message = await new Message({
                sender:req.user.userId,
                reciever,
                content,
                
            }
            );
            await new_message.save();
            res.status(200).json({message: "Message sent successfully"});
        }catch(error){
            res.status(500).json({error: error.message});
        }
    };
    async get_messages(req, res) {
        try {
            const userId = req.user.userId;
    
            const messages = await Message.find({
                $or: [
                    { sender: userId },
                    { receiver: userId }
                ]
            }).sort({ created_at: -1 }); // Optional: newest first
    
            res.status(200).json({ messages });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
   async delete_chat_with_user(req, res) {
    try {
        const currentUserId = req.user.userId; // Assuming you are using auth middleware
        const otherUserId = req.params.receiverId;

        const result = await Message.deleteMany({
            $or: [
                { sender: currentUserId, receiver: otherUserId },
                { sender: otherUserId, receiver: currentUserId }
            ]
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'No chat found with this user' });
        }

        res.status(200).json({ message: `${result.deletedCount} message(s) deleted successfully` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// GET /api/messages/conversations
async get_conversations(req, res) {
  try {
    const userId = req.user.userId;

    // Get distinct users the current user has messaged with
    const userConversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { reciever: userId }]
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
              '$reciever',
              '$sender'
            ]
          },
          lastMessage: { $first: '$content' },
          timestamp: { $first: '$createdAt' }
        }
      }
    ]);

    // Get all group chats the user is part of (optional: filter by group membership)
    const groupConversations = await group_messages.aggregate([
      { $match: { sender: userId } },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$group_id',
          lastMessage: { $first: '$content' },
          timestamp: { $first: '$createdAt' }
        }
      }
    ]);

    res.json({ userConversations, groupConversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}



    
}

module.exports = new Message_Controller();