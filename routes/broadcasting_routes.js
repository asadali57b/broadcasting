const express = require('express');
const router = express.Router();
const User_controller = require('../controller/user_controller');
const Message_controller = require('../controller/messages_controller');
const auth = require('../middleware/auth');
const status_controller = require('../controller/status_controller');
const Group_controller = require('../controller/group_controller');
const group_messages_controller = require('../controller/group_messagesController');
const poll_controller = require('../controller/poll_controller');
router.post('/user_register',User_controller.register );
router.post('/user_login',User_controller.login);
router.get('/get_all_users',auth, User_controller.get_all_users);
router.get('/get_user_by_id/:id',auth, User_controller.get_user_by_id);
router.put('/update_user',auth, User_controller.update_user);
router.post('/forgot_password',User_controller.forgot_password);
router.post('/reset_password/:token',User_controller.reset_password);


router.post('/send_message',auth, Message_controller.send_message);
router.get('/get_messages',auth, Message_controller.get_messages);
router.delete('/delete_all_messages/:receiverId',auth, Message_controller.delete_chat_with_user);
router.get('/get_conversations',auth, Message_controller.get_conversations);
router.get('/get_user_messages/:userId',auth, Message_controller.get_user_messages);
router.put('/mark_seen',auth, Message_controller.mark_seen);


router.post('/create_group',auth, Group_controller.create_group);
router.post('/create_poll',auth, poll_controller.create_poll);
router.post('/vote_poll',auth, poll_controller.vote_poll);
router.get('/get_all_groups',auth, Group_controller.get_all_groups);
router.get('/get_group_by_id/:id',auth, Group_controller.get_group_by_id);
router.get('/get_group_for_user',auth, Group_controller.get_group_for_user);
router.put('/update_group',auth, Group_controller.update_group);
router.put('/add_members_to_group',auth, Group_controller.add_members_to_group);
router.delete('/remove_members_from_group',auth, Group_controller.remove_members_from_group);
router.delete('/delete_group/:id',auth, Group_controller.delete_group);
router.put('/leave_group/:groupId',auth, Group_controller.leave_group);
router.put('/make_group_admin',auth, Group_controller.make_group_admin);

router.post('/send_group_message',auth, group_messages_controller.send_group_message);
router.get('/get_all_group_messages/:groupId',auth, group_messages_controller.get_all_messages_of_group);
router.put('/mark_seen_group_message/:groupId',auth, group_messages_controller.mark_seen_group_message);
router.put('/mark_seen_single_group_message/:messageId',auth, group_messages_controller.mark_seen_single_message);
router.get('/get_latest_messages_for_all_groups',auth, group_messages_controller.get_latest_messages_for_all_groups);
router.delete('/delete_message_by_sender/:messageId',auth, group_messages_controller.delete_message_by_sender);
router.delete('/delete_message_for_me/:messageId',auth, group_messages_controller.delete_message_for_me);
router.delete('/delete_all_messages_for_me/:groupId',auth, group_messages_controller.delete_all_messages_for_me);


router.post('/add_status',auth, status_controller.add_status);
router.get('/get_all_status',auth, status_controller.get_all_status);
router.get('/get_user_status/:userId',auth, status_controller.get_user_status);
router.delete('/delete_status/:id',auth, status_controller.delete_status);
router.put('/mark_status_seen/:statusId',auth, status_controller.mark_status_seen);

module.exports = router;