const Message = require('../models/messages_model');
const {message_validation_schema} = require('../middleware/validation');
const group_messages=require('../models/group_messagesModel');
const group=require('../models/group_model');
const mongoose = require('mongoose');
class Message_Controller{
    // async send_message(req,res){
    //     try{
    //         const {receiver,content} = req.body;
    //         const { error } = message_validation_schema.validate(req.body);

    //         if (error) {
    //             return res.status(400).json({ error: error.details[0].message });
    //         }
            
    //         const new_message = await new Message({
    //             sender:req.user.userId,
    //             receiver,
    //             content,
                
    //         }
    //         );
    //         await new_message.save();
    //         res.status(200).json({message: "Message sent successfully"});
    //     }catch(error){
    //         res.status(500).json({error: error.message});
    //     }
    // };

    async send_message(req,res){
    try{
        const {receiver,content} = req.body;
        const { error } = message_validation_schema.validate(req.body);

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        let message_type = "text"; // default

        if (typeof content === "string") {
            // Check for image/file URLs
            if (content.match(/\.(jpeg|jpg|png|gif|webp)$/i)) {
                message_type = "image";
            } else if (content.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)) {
                message_type = "document";
            } else if (content.match(/^https?:\/\/.+/)) {
                message_type = "link";
            }
        }
        
        const new_message = await new Message({
            sender: req.user.userId,
            receiver,
            content,
            message_type
        });
        await new_message.save();
        
        // Socket.io emit
        const io = req.app.get('io');
        if (io) {
            // Create a unique room ID for two users
            const participants = [req.user.userId, receiver].sort();
            const roomId = `chat:${participants.join('-')}`;
            
            io.to(roomId).emit('newMessage', {
                _id: new_message._id,
                sender: new_message.sender,
                receiver: new_message.receiver,
                content: new_message.content,
                message_type: new_message.message_type,
                is_seen: new_message.is_seen,
                timestamp: new_message.timestamp
            });
        }
        
        res.status(200).json({message: "Message sent successfully"});
    } catch(error){
        res.status(500).json({error: error.message});
    }
}

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
// async get_conversations(req, res) {
//  try {
//     const userId = req.user.userId;

//     // === USER-TO-USER CONVERSATIONS ===
//     const messages = await Message.find({
//       $or: [{ sender: userId }, { receiver: userId }]
//     })
//       .sort({ timestamp: -1 })
//       .populate('sender', 'name email phone_number profile_pic')
//       .populate('receiver', 'name email phone_number profile_pic')
//       .exec();



// const userConvoMap = new Map();

// for (const msg of messages) {
//   const isSender = msg.sender._id.toString() === userId;
//   const otherUser = isSender ? msg.receiver : msg.sender;
//   const otherUserId = otherUser._id.toString();

//   if (!userConvoMap.has(otherUserId)) {
//     userConvoMap.set(otherUserId, {
//       userId: otherUser._id,
//       name: otherUser.name,
//       profile_pic: otherUser.profile_pic || '',
//       total_messages: 0,
//       unread_messages: 0,
//       received_messages: [],
//       sent_messages: []
//     });
//   }

//   const convo = userConvoMap.get(otherUserId);

//   const formattedMessage = {
//     _id: msg._id,
//     content: msg.content,
//     sender: msg.sender._id,
//     receiver: msg.receiver._id,
//     message_type: msg.message_type,
//     is_seen: msg.is_seen,
//     timestamp: msg.timestamp
//   };

//   if (!msg.is_seen && msg.receiver._id.toString() === userId) {
//     convo.unread_messages += 1;
//   }

//   if (isSender) {
//     convo.sent_messages.push(formattedMessage);
//   } else {
//     convo.received_messages.push(formattedMessage);
//   }

//   convo.total_messages += 1;
// }

// const userConversations = Array.from(userConvoMap.values());


//     // === GROUP CONVERSATIONS ===
//     const groups = await group.find({ members: userId }).lean();

//     // 2. For each group, fetch messages and build response
//   const groupConversations = await Promise.all(
//   groups.map(async (group) => {
//     const messages = await group_messages.find({ group_id: group._id })
//       .populate('sender', 'name profile_pic')
//       .sort({ timestamp: 1 })
//       .lean();

//     const received_messages = [];
//     const sent_messages = [];

//     for (const msg of messages) {
//       const formatted = {
//         _id: msg._id,
//         content: msg.content,
//         message_type: msg.message_type,
//         is_seen: msg.is_seen,
//         timestamp: msg.timestamp,
//         sender: {
//           _id: msg.sender._id,
//           name: msg.sender.name,
//           profile_pic: msg.sender.profile_pic
//         }
//       };

//       if (msg.sender._id.toString() === userId) {
//         sent_messages.push(formatted);
//       } else {
//         received_messages.push(formatted);
//       }
//     }

//     const unread_messages = received_messages.filter(
//       msg => msg.is_seen === false
//     ).length;

//     return {
//       group_id: group._id,
//       name: group.name,
//       group_pic: group.group_pic,
//       total_members: group.members.length,
//       total_messages: messages.length,
//       unread_messages,
//       received_messages,
//       sent_messages
//     };
//   })
// );
//     res.json({ userConversations,groupConversations });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// }

async get_conversations(req, res) {
  try {
    const userId = req.user.userId;

    // === USER-TO-USER CONVERSATIONS ===
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .sort({ timestamp: -1 })
      .populate('sender', 'name email phone_number profile_pic')
      .populate('receiver', 'name email phone_number profile_pic')
      .exec();

    const userConvoMap = new Map();

    for (const msg of messages) {
      // Skip messages with null sender or receiver
      if (!msg.sender || !msg.receiver) continue;
      
      const isSender = msg.sender._id.toString() === userId;
      const otherUser = isSender ? msg.receiver : msg.sender;
      
      // Skip if otherUser is null or doesn't have _id
      if (!otherUser || !otherUser._id) continue;
      
      const otherUserId = otherUser._id.toString();

      if (!userConvoMap.has(otherUserId)) {
        userConvoMap.set(otherUserId, {
          userId: otherUser._id,
          name: otherUser.name,
          profile_pic: otherUser.profile_pic || '',
          total_messages: 0,
          unread_messages: 0,
          received_messages: [],
          sent_messages: []
        });
      }

      const convo = userConvoMap.get(otherUserId);

      const formattedMessage = {
        _id: msg._id,
        content: msg.content,
        sender: msg.sender._id,
        receiver: msg.receiver._id,
        message_type: msg.message_type,
        is_seen: msg.is_seen,
        timestamp: msg.timestamp
      };

      if (!msg.is_seen && msg.receiver._id.toString() === userId) {
        convo.unread_messages += 1;
      }

      if (isSender) {
        convo.sent_messages.push(formattedMessage);
      } else {
        convo.received_messages.push(formattedMessage);
      }

      convo.total_messages += 1;
    }

    const userConversations = Array.from(userConvoMap.values());

    // === GROUP CONVERSATIONS ===
    const groups = await group.find({ members: userId }).lean();

    // 2. For each group, fetch messages and build response
    const groupConversations = await Promise.all(
      groups.map(async (group) => {
        const messages = await group_messages.find({ group_id: group._id })
          .populate('sender', 'name profile_pic')
          .sort({ timestamp: 1 })
          .lean();

        const received_messages = [];
        const sent_messages = [];

        for (const msg of messages) {
          // Skip messages with null sender
          if (!msg.sender) continue;
          
          const formatted = {
            _id: msg._id,
            content: msg.content,
            message_type: msg.message_type,
            is_seen: msg.is_seen,
            timestamp: msg.timestamp,
            sender: {
              _id: msg.sender._id,
              name: msg.sender.name,
              profile_pic: msg.sender.profile_pic || ''
            }
          };

          if (msg.sender._id.toString() === userId) {
            sent_messages.push(formatted);
          } else {
            received_messages.push(formatted);
          }
        }

        const unread_messages = received_messages.filter(
          msg => msg.is_seen === false
        ).length;

        return {
          group_id: group._id,
          name: group.name,
          group_pic: group.group_pic || '',
          total_members: group.members.length,
          total_messages: messages.length,
          unread_messages,
          received_messages,
          sent_messages
        };
      })
    );
    
    res.json({ userConversations, groupConversations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
// GET /api/messages/user/:userId
async get_user_messages(req, res) {
  try {
    const currentUser = req.user.userId;
    const otherUser = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender: currentUser, receiver: otherUser },
        { sender: otherUser, receiver: currentUser }
      ]
    }).sort({ createdAt: 1 });
    
    res.json( messages );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// async mark_seen(req,res){
//   try {
//     const { sender, receiver } = req.body;
    
//     if (!sender || !receiver) {
//       return res.status(400).json({ message: 'Sender and receiver IDs are required' });
//     }
    
//     const result = await Message.updateMany(
//       { sender, receiver, is_seen: false },
//       { $set: { is_seen: true } }
//     );
    
//     res.json({ message: 'Messages marked as seen', count: result.modifiedCount });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// }

async mark_seen(req,res){
  try {
    const { sender, receiver } = req.body;
    
    if (!sender || !receiver) {
      return res.status(400).json({ message: 'Sender and receiver IDs are required' });
    }
    
    const result = await Message.updateMany(
      { sender, receiver, is_seen: false },
      { $set: { is_seen: true } }
    );
    
    // Socket.io emit
    const io = req.app.get('io');
    if (io) {
        // Create a unique room ID for two users
        const participants = [sender, receiver].sort();
        const roomId = `chat:${participants.join('-')}`;
        
        io.to(roomId).emit('messagesRead', {
            readBy: receiver
        });
    }
    
    res.json({ message: 'Messages marked as seen', count: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
}

module.exports = new Message_Controller();