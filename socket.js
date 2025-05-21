const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/user_model');
const Message = require('./models/messages_model');
const GroupMessage = require('./models/group_messagesModel');
const Group = require('./models/group_model');
const Status = require('./models/status_model');

const setupSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  // Socket middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, 'secret'); // Use your JWT secret
      socket.userId = decoded.userId;
      
      // Update user status to online
      await User.findByIdAndUpdate(decoded.userId, { 
        is_active: true,
        last_seen: Math.floor(Date.now() / 1000)
      });
      
      next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  });
  
  // Connected users map
  const users = {};
  
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.userId);
    
    // Add user to connected users
    users[socket.userId] = socket.id;
    
    // Join personal room
    socket.join(socket.userId);
    
    // Emit online user list
    io.emit('usersOnline', Object.keys(users));
    
    // Handle joining chat room (for direct messages)
    socket.on('joinChat', (otherUserId) => {
      // Create a unique room ID for two users (sorted to ensure consistency)
      const participants = [socket.userId, otherUserId].sort();
      const roomId = `chat:${participants.join('-')}`;
      socket.join(roomId);
      console.log(`User ${socket.userId} joined chat with: ${otherUserId}`);
    });

    // Handle joining group chat room
    socket.on('joinGroupChat', (groupId) => {
      const roomId = `group:${groupId}`;
      socket.join(roomId);
      console.log(`User ${socket.userId} joined group chat: ${groupId}`);
    });
    
    // Handle sending direct message
    socket.on('sendMessage', async (messageData) => {
      try {
        const { receiver, content, message_type = 'text' } = messageData;
        
        // Save message to database
        const newMessage = new Message({
          sender: socket.userId,
          receiver,
          content,
          message_type,
          timestamp: Math.floor(Date.now() / 1000)
        });
        
        await newMessage.save();
        
        // Create a unique room ID for two users (sorted to ensure consistency)
        const participants = [socket.userId, receiver].sort();
        const roomId = `chat:${participants.join('-')}`;
        
        // Emit to the room
        io.to(roomId).emit('newMessage', {
          _id: newMessage._id,
          sender: newMessage.sender,
          receiver: newMessage.receiver,
          content: newMessage.content,
          message_type: newMessage.message_type,
          is_seen: newMessage.is_seen,
          timestamp: newMessage.timestamp
        });
        
        // Send notification to receiver if they're online but not in the chat
        if (users[receiver]) {
          socket.to(users[receiver]).emit('messageNotification', {
            senderId: socket.userId,
            content: content.length > 30 ? content.substring(0, 30) + '...' : content,
            timestamp: newMessage.timestamp
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });
    
    // Handle sending group message
    socket.on('sendGroupMessage', async (messageData) => {
      try {
        const { group_id, content, message_type = 'text' } = messageData;
        
        // Save message to database
        const newMessage = new GroupMessage({
          sender: socket.userId,
          group_id,
          content,
          message_type,
          timestamp: Math.floor(Date.now() / 1000)
        });
        
        await newMessage.save();
        
        // Get group details to find members
        const groupDetails = await Group.findById(group_id);
        
        // Emit to the group room
        const roomId = `group:${group_id}`;
        io.to(roomId).emit('newGroupMessage', {
          _id: newMessage._id,
          sender: newMessage.sender,
          group_id: newMessage.group_id,
          content: newMessage.content,
          message_type: newMessage.message_type,
          timestamp: newMessage.timestamp
        });
        
        // Send notification to all group members who are online but not in the group chat
        if (groupDetails && groupDetails.members) {
          groupDetails.members.forEach(memberId => {
            const memberIdStr = memberId.toString();
            if (memberIdStr !== socket.userId && users[memberIdStr]) {
              socket.to(users[memberIdStr]).emit('groupMessageNotification', {
                senderId: socket.userId,
                groupId: group_id,
                groupName: groupDetails.name,
                content: content.length > 30 ? content.substring(0, 30) + '...' : content,
                timestamp: newMessage.timestamp
              });
            }
          });
        }
      } catch (error) {
        console.error('Error sending group message:', error);
      }
    });
    
    // Handle typing indicator
    socket.on('typing', ({ receiverId, isGroup }) => {
      if (isGroup) {
        const roomId = `group:${receiverId}`;
        socket.to(roomId).emit('typing', {
          userId: socket.userId,
          groupId: receiverId
        });
      } else {
        // Create a unique room ID for two users
        const participants = [socket.userId, receiverId].sort();
        const roomId = `chat:${participants.join('-')}`;
        socket.to(roomId).emit('typing', {
          userId: socket.userId
        });
      }
    });
    
    // Handle stop typing
    socket.on('stopTyping', ({ receiverId, isGroup }) => {
      if (isGroup) {
        const roomId = `group:${receiverId}`;
        socket.to(roomId).emit('stopTyping', {
          userId: socket.userId,
          groupId: receiverId
        });
      } else {
        // Create a unique room ID for two users
        const participants = [socket.userId, receiverId].sort();
        const roomId = `chat:${participants.join('-')}`;
        socket.to(roomId).emit('stopTyping', {
          userId: socket.userId
        });
      }
    });
    
    // Handle read messages
    socket.on('markRead', async ({ senderId }) => {
      try {
        // Mark messages as read in database
        await Message.updateMany(
          { sender: senderId, receiver: socket.userId, is_seen: false },
          { $set: { is_seen: true } }
        );
        
        // Create a unique room ID for two users
        const participants = [socket.userId, senderId].sort();
        const roomId = `chat:${participants.join('-')}`;
        
        // Notify the sender that their messages were read
        socket.to(roomId).emit('messagesRead', {
          readBy: socket.userId
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });
    
    // Handle read group messages
    socket.on('markGroupRead', async ({ groupId }) => {
      try {
        // Mark group messages as read in database
        await GroupMessage.updateMany(
          { 
            group_id: groupId, 
            seen_by: { $ne: socket.userId } 
          },
          { 
            $addToSet: { seen_by: socket.userId } 
          }
        );
        
        const roomId = `group:${groupId}`;
        
        // Notify the group that messages were read
        socket.to(roomId).emit('groupMessagesRead', {
          groupId,
          readBy: socket.userId
        });
      } catch (error) {
        console.error('Error marking group messages as read:', error);
      }
    });
    
    // Handle status update
    socket.on('statusUpdate', async (statusData) => {
      try {
        const { media_url, caption, type } = statusData;
        
        // Create new status
        const newStatus = new Status({
          user: socket.userId,
          media_url,
          caption,
          type,
          created_at: Math.floor(Date.now() / 1000),
          expires_at: Math.floor(Date.now() / 1000) + 86400 // 24 hours
        });
        
        await newStatus.save();
        
        // Broadcast to all online users
        io.emit('newStatus', {
          statusId: newStatus._id,
          userId: socket.userId
        });
      } catch (error) {
        console.error('Error creating status:', error);
      }
    });
    
    // Handle status seen
    socket.on('statusSeen', async ({ statusId }) => {
      try {
        await Status.findByIdAndUpdate(
          statusId,
          { 
            $addToSet: { 
              seen_by: { 
                user: socket.userId, 
                seen_at: Math.floor(Date.now() / 1000) 
              } 
            } 
          }
        );
        
        const status = await Status.findById(statusId);
        
        // Notify status owner that someone viewed their status
        if (status && users[status.user.toString()]) {
          socket.to(users[status.user.toString()]).emit('statusViewed', {
            statusId,
            viewerId: socket.userId
          });
        }
      } catch (error) {
        console.error('Error marking status as seen:', error);
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.userId);
      
      try {
        // Update user status to offline
        await User.findByIdAndUpdate(socket.userId, { 
          is_active: false,
          last_seen: Math.floor(Date.now() / 1000)
        });
        
        // Remove from connected users
        delete users[socket.userId];
        
        // Broadcast updated online users
        io.emit('usersOnline', Object.keys(users));
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });
  
  return io;
};

module.exports = setupSocket;









// // Client-side implementation
// import io from 'socket.io-client';

// // Initialize socket connection
// const initializeSocket = (token) => {
//   const socket = io('http://localhost:5000', {
//     auth: { token }
//   });
  
//   // Connection events
//   socket.on('connect', () => {
//     console.log('Connected to socket server');
//   });
  
//   socket.on('connect_error', (error) => {
//     console.error('Socket connection error:', error);
//   });
  
//   // Listen for online users
//   socket.on('usersOnline', (onlineUsers) => {
//     console.log('Online users:', onlineUsers);
//     // Update UI with online users
//   });
  
//   // Listen for new messages
//   socket.on('newMessage', (message) => {
//     console.log('New message received:', message);
//     // Update UI with new message
//   });
  
//   // Listen for new group messages
//   socket.on('newGroupMessage', (message) => {
//     console.log('New group message received:', message);
//     // Update UI with new group message
//   });
  
//   // Listen for typing indicators
//   socket.on('typing', (data) => {
//     console.log('User is typing:', data);
//     // Show typing indicator in UI
//   });
  
//   socket.on('stopTyping', (data) => {
//     console.log('User stopped typing:', data);
//     // Hide typing indicator in UI
//   });
  
//   // Listen for read receipts
//   socket.on('messagesRead', (data) => {
//     console.log('Messages read by:', data.readBy);
//     // Update read status in UI
//   });
  
//   socket.on('groupMessagesRead', (data) => {
//     console.log('Group messages read by:', data.readBy);
//     // Update read status in UI
//   });
  
//   // Listen for status updates
//   socket.on('newStatus', (data) => {
//     console.log('New status from user:', data);
//     // Update UI with new status
//   });
  
//   socket.on('statusViewed', (data) => {
//     console.log('Status viewed by:', data.viewerId);
//     // Update status views in UI
//   });
  
//   // Listen for user status changes
//   socket.on('userStatusChange', (data) => {
//     console.log('User status changed:', data);
//     // Update user status in UI
//   });
  
//   return socket;
// };

// // Example usage
// const token = localStorage.getItem('token');
// const socket = initializeSocket(token);

// // Join a direct chat
// const joinChat = (otherUserId) => {
//   socket.emit('joinChat', otherUserId);
// };

// // Join a group chat
// const joinGroupChat = (groupId) => {
//   socket.emit('joinGroupChat', groupId);
// };

// // Send a direct message
// const sendMessage = (receiverId, content) => {
//   socket.emit('sendMessage', {
//     receiver: receiverId,
//     content
//   });
// };

// // Send a group message
// const sendGroupMessage = (groupId, content) => {
//   socket.emit('sendGroupMessage', {
//     group_id: groupId,
//     content
//   });
// };

// // Indicate typing
// const sendTypingIndicator = (receiverId, isGroup = false) => {
//   socket.emit('typing', { receiverId, isGroup });
// };

// // Stop typing indicator
// const stopTypingIndicator = (receiverId, isGroup = false) => {
//   socket.emit('stopTyping', { receiverId, isGroup });
// };

// // Mark messages as read
// const markMessagesAsRead = (senderId) => {
//   socket.emit('markRead', { senderId });
// };

// // Mark group messages as read
// const markGroupMessagesAsRead = (groupId) => {
//   socket.emit('markGroupRead', { groupId });
// };

// // Disconnect when needed
// const disconnectSocket = () => {
//   socket.disconnect();
// };