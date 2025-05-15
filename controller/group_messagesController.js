const group_messages=require('../models/group_messagesModel');
const group_message_validation_schema = require("../middleware/validation").group_message_validation_schema;
class group_messages_controller{
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
                
            }
            );
            await new_message.save();
            res.status(200).json({message: "Message sent successfully"},new_message);
        }catch(error){
            res.status(500).json({error: error.message});
        }
    }
}

module.exports = new group_messages_controller();