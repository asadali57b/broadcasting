const group = require("../models/group_model");
const group_validation_schema = require("../middleware/validation").group_validation_schema;
class Group{
    async create_group(req,res){
         try {
        const { name, members, group_pic } = req.body;
        const { error } = group_validation_schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const adminId = req.user.userId;

        if (!name || !members || members.length < 1) {
            return res.status(400).json({ error: "Group name and at least one member required." });
        }

        // Include admin in members
        const allMembers = [...new Set([...members, adminId])];

        const data = await group.create({
            name,
            admin: adminId,
            members: allMembers,
            group_pic
        });

        res.status(201).json({ message: "Group created successfully", data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

    };

    module.exports = new Group();