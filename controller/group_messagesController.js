const group_messages=require('../models/group_messagesModel');
const Group = require('../models/group_model');
const group_message_validation_schema = require("../middleware/validation").group_message_validation_schema;
class group_messages_controller{
    // async send_group_message(req,res){
    //     try{
    //         const {group_id,content} = req.body;
    //         const { error } = group_message_validation_schema.validate(req.body);

    //         if (error) {
    //             return res.status(400).json({ error: error.details[0].message });
    //         }
    //         const new_message = await new group_messages({
    //             sender:req.user.userId,
    //             group_id,
    //             content,
                
    //         }
    //         );
    //         await new_message.save();
    //         res.status(200).json({message: "Message sent successfully"},new_message);
    //     }catch(error){
    //         res.status(500).json({error: error.message});
    //     }
    // }

    async send_group_message(req,res){
    try{
        const {group_id,content} = req.body;
        const { error } = group_message_validation_schema.validate(req.body);

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const new_message = await new group_messages({
            sender:req.user.userId,
            group_id,
            content,
        });
        await new_message.save();
        
        // Socket.io emit
        const io = req.app.get('io');
        if (io) {
            const roomId = `group:${group_id}`;
            
            io.to(roomId).emit('newGroupMessage', {
                _id: new_message._id,
                sender: new_message.sender,
                group_id: new_message.group_id,
                content: new_message.content,
                message_type: new_message.message_type,
                timestamp: new_message.timestamp
            });
        }
        
        res.status(200).json({message: "Message sent successfully", data: new_message});
    }catch(error){
        res.status(500).json({error: error.message});
    }
}
    async get_all_messages_of_group(req,res){
         try {
    const groupId = req.params.groupId;
    
    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    const messages = await group_messages.find({ group_id: groupId })
      .populate('sender', 'name profile_pic')
      .sort({ timestamp: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
    }
//  async mark_seen_group_message(req, res) {
//   try {
//     const userId = req.user.userId;
//     const groupId = req.params.groupId;

//     // Check if the group exists
//     const groupExists = await Group.findById(groupId);
//     if (!groupExists) {
//       return res.status(404).json({ message: 'Group not found' });
//     }

//     // Mark only text messages not seen by this user as seen
//     await group_messages.updateMany(
//       {
//         group_id: groupId,
//         message_type: 'text',
//         seen_by: { $ne: userId }
//       },
//       {
//         $addToSet: { seen_by: userId },
//         $set: { is_seen: true }
//       }
//     );

//     res.json({ message: 'All text messages marked as seen' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// }

async mark_seen_group_message(req, res) {
  try {
    const userId = req.user.userId;
    const groupId = req.params.groupId;

    // Check if the group exists
    const groupExists = await Group.findById(groupId);
    if (!groupExists) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Mark only text messages not seen by this user as seen
    await group_messages.updateMany(
      {
        group_id: groupId,
        message_type: 'text',
        seen_by: { $ne: userId }
      },
      {
        $addToSet: { seen_by: userId },
        $set: { is_seen: true }
      }
    );
    
    // Socket.io emit
    const io = req.app.get('io');
    if (io) {
        const roomId = `group:${groupId}`;
        
        io.to(roomId).emit('groupMessagesRead', {
            groupId,
            readBy: userId
        });
    }

    res.json({ message: 'All text messages marked as seen' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


    async mark_seen_single_message(req,res){
      try {
    const userId = req.user.userId;
    const { messageId } = req.params;

    const message = await group_messages.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Add user to seen_by if not already present
    if (!message.seen_by.includes(userId)) {
      message.seen_by.push(userId);
      await message.save();
    }

    res.json({ message: 'Marked as seen' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
    }
    async get_latest_messages_for_all_groups(req, res) {
  try {
    const userId = req.user.userId;

    const groups = await Group.find({ members: userId });
    const groupIds = groups.map(group => group._id);

    const latestMessages = await Promise.all(
      groupIds.map(async (groupId) => {
        const message = await group_messages.findOne({ group_id: groupId })
          .sort({ timestamp: -1 })
          .populate('sender', 'name profile_pic')
          .populate({
            path: 'group_id',
            select: 'name members group_pic',
            populate: {
              path: 'members',
              select: 'name profile_pic'
            }
          });

        if (!message) return null;

        // New unreadCount logic: total messages not seen by this user
        const unreadCount = await group_messages.countDocuments({
          group_id: groupId,
          sender: { $ne: userId },
          seen_by: { $ne: userId }
        });

        return {
          group: {
            _id: message.group_id._id,
            name: message.group_id.name,
            group_pic: message.group_id.group_pic,
            memberCount: message.group_id.members.length
          },
          lastMessage: {
            _id: message._id,
            content: message.content,
            message_type: message.message_type,
            sender: {
              _id: message.sender._id,
              name: message.sender.name
            },
            timestamp: message.timestamp
          },
          unreadCount
        };
      })
    );

    const result = latestMessages
      .filter(item => item !== null)
      .sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
    async delete_message_by_sender(req, res) {
  try {
    const userId = req.user.userId;
    const messageId = req.params.messageId;

    // Step 1: Find the message
    const message = await group_messages.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Step 2: Check if the requester is the sender
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    // Step 3: Delete the message
    await group_messages.findByIdAndDelete(messageId);
    res.json({ message: 'Message deleted successfully' });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
async  delete_message_for_me(req, res) {
  try {
    const userId = req.user.userId;
    const messageId = req.params.messageId;

    const message = await group_messages.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Add userId to deleted_for if not already present
    if (!message.deleted_for.includes(userId)) {
      message.deleted_for.push(userId);
      await message.save();
    }

    res.json({ message: 'Message deleted for you only' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
async  delete_all_messages_for_me(req, res) {
  try {
    const userId = req.user.userId;
    const groupId = req.params.groupId;

    // Find the group (optional validation)
    const groupExists = await Group.findById(groupId);
    if (!groupExists) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Update all messages in the group: add userId to deleted_for if not present
    await group_messages.updateMany(
      { group_id: groupId, deleted_for: { $ne: userId } },
      { $addToSet: { deleted_for: userId } }
    );

    res.json({ message: 'All messages deleted for you successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


}

module.exports = new group_messages_controller();