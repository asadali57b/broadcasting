const Message = require('../models/messages_model');
const {message_validation_schema} = require('../middleware/validation');
const group_messages=require('../models/group_messagesModel');
const mongoose = require('mongoose');
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
  // try {
  //   const userId = new mongoose.Types.ObjectId(req.user.userId);

  //   // 1. User-to-user conversations
  //   const userConversations = await Message.aggregate([
  //     {
  //       $match: {
  //         $or: [{ sender: userId }, { reciever: userId }]
  //       }
  //     },
  //     { $sort: { timestamp: -1 } },
  //     {
  //       $group: {
  //         _id: {
  //           $cond: [
  //             { $eq: ['$sender', userId] },
  //             '$reciever',
  //             '$sender'
  //           ]
  //         },
  //         lastMessage: { $first: '$content' },
  //         timestamp: { $first: '$timestamp' }
  //       }
  //     },
  //     {
  //       $lookup: {
  //         from: 'users', // collection name in MongoDB
  //         localField: '_id',
  //         foreignField: '_id',
  //         as: 'userInfo'
  //       }
  //     },
  //     {
  //       $unwind: '$userInfo'
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         userId: '$_id',
  //         lastMessage: 1,
  //         timestamp: 1,
  //         user: {
  //           _id: '$userInfo._id',
  //           name: '$userInfo.name',
  //           email: '$userInfo.email',
  //           phone_number: '$userInfo.phone_number',
  //           // Add more fields if needed
  //         }
  //       }
  //     }
  //   ]);

  //   // 2. Group conversations
  //   const groupConversations = await group_messages.aggregate([
  //     { $match: { sender: userId } },
  //     { $sort: { timestamp: -1 } },
  //     {
  //       $group: {
  //         _id: '$group_id',
  //         lastMessage: { $first: '$content' },
  //         timestamp: { $first: '$timestamp' }
  //       }
  //     },
  //     {
  //       $lookup: {
  //         from: 'groups', // adjust to your actual group collection name
  //         localField: '_id',
  //         foreignField: '_id',
  //         as: 'groupInfo'
  //       }
  //     },
  //     {
  //       $unwind: '$groupInfo'
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         groupId: '$_id',
  //         lastMessage: 1,
  //         timestamp: 1,
  //         group: {
  //           _id: '$groupInfo._id',
  //           name: '$groupInfo.name',
  //           description: '$groupInfo.description',
  //           // Add more fields if needed
  //         }
  //       }
  //     }
  //   ]);

  //   res.json({ userConversations, groupConversations });
  // } catch (error) {
  //   console.error(error);
  //   res.status(500).json({ error: error.message });
  // }
   try {
    const userId = req.params.userId;
    
    // Find all messages where the user is either sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { reciever: userId }
      ]
    })
    .populate('sender', 'name profile_pic is_active last_seen')
    .populate('reciever', 'name profile_pic is_active last_seen')
    .sort({ timestamp: -1 });
    
    // Group messages by conversation
    const conversations = {};
    
    messages.forEach(message => {
      // Determine the other user in the conversation
      const otherUser = message.sender._id.toString() === userId 
        ? message.reciever._id.toString() 
        : message.sender._id.toString();
      
      if (!conversations[otherUser]) {
        const user = message.sender._id.toString() === userId 
          ? message.reciever 
          : message.sender;
          
        conversations[otherUser] = {
          user: {
            _id: user._id,
            name: user.name,
            profile_pic: user.profile_pic,
            is_active: user.is_active,
            last_seen: user.last_seen
          },
          lastMessage: {
            _id: message._id,
            content: message.content,
            message_type: message.message_type,
            is_seen: message.is_seen,
            timestamp: message.timestamp,
            sender: message.sender._id.toString()
          },
          unreadCount: message.reciever._id.toString() === userId && !message.is_seen ? 1 : 0
        };
      } else if (message.timestamp > conversations[otherUser].lastMessage.timestamp) {
        // Update last message if this one is newer
        conversations[otherUser].lastMessage = {
          _id: message._id,
          content: message.content,
          message_type: message.message_type,
          is_seen: message.is_seen,
          timestamp: message.timestamp,
          sender: message.sender._id.toString()
        };
        
        // Update unread count
        if (message.reciever._id.toString() === userId && !message.is_seen) {
          conversations[otherUser].unreadCount++;
        }
      } else if (message.reciever._id.toString() === userId && !message.is_seen) {
        // Increment unread count for older messages
        conversations[otherUser].unreadCount++;
      }
    });
    
    // Convert to array and sort by last message timestamp
    const result = Object.values(conversations).sort((a, b) => 
      b.lastMessage.timestamp - a.lastMessage.timestamp
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
// GET /api/messages/user/:userId
async get_user_messages(req, res) {
  try {
    const currentUser = req.user.userId;
    const otherUser = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUser, reciever: otherUser },
        { sender: otherUser, reciever: currentUser }
      ]
    }).sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}






    
}

module.exports = new Message_Controller();