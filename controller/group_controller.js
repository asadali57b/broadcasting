const group = require("../models/group_model");
const User = require("../models/user_model");
const {group_validation_schema,update_group_validation_schema} = require("../middleware/validation");
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
async get_all_groups(req,res){
     try {
    const groups = await group.find()
      .populate('admin', 'name profile_pic')
      .populate('members', 'name profile_pic');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async get_group_by_id(req,res){
     try {
    const data = await group.findById(req.params.id)
      .populate('admin', 'name profile_pic')
      .populate('members', 'name profile_pic');
    
    if (!data) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
async get_group_for_user(req,res){
    try {
    const userId = req.user.userId;
    
    const groups = await group.find({
      $or: [
        { admin: userId },
        { members: userId }
      ]
    })
    .populate('admin', 'name profile_pic')
    .populate('members', 'name profile_pic');
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async update_group(req, res) {
  try {
    const { id, name, members, group_pic } = req.body;
    const { error } = update_group_validation_schema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const data = await group.findById(id);
    if (!data) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // ✅ Check if the requester is the group admin
    const isRequesterAdmin = data.admin.map(String).includes(req.user.userId);
if (!isRequesterAdmin) {
  return res.status(403).json({ message: 'Only group admins can update group' });
}


    // ✅ Update fields
    if (name) data.name = name;
    if (group_pic) data.group_pic = group_pic;

   if (members) {
  const uniqueMembers = [...new Set([
    ...data.admin.map(id => id.toString()),
    ...members
  ])];

  const memberCount = await User.countDocuments({
    _id: { $in: uniqueMembers }
  });

  if (memberCount !== uniqueMembers.length) {
    return res.status(400).json({ message: 'One or more invalid member IDs' });
  }

  data.members = uniqueMembers;
}


    const updatedGroup = await data.save();

    const populatedGroup = await group.findById(updatedGroup._id)
      .populate('admin', 'name profile_pic')
      .populate('members', 'name profile_pic');

    res.json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


async add_members_to_group(req, res) {
  try {
    const { userIds, groupId } = req.body;
    if (!groupId) {
      return res.status(400).json({ message: 'groupId is required' });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one user ID' });
    }

    const groupData = await group.findById(groupId);
    if (!groupData) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // ✅ Check if requester is the group admin
   const isRequesterAdmin = groupData.admin.map(String).includes(req.user.userId);
if (!isRequesterAdmin) {
  return res.status(403).json({ message: 'Only group admins can add members' });
}


    // Filter valid users who are not already members
    const usersToAdd = [];
    for (const userId of userIds) {
      const userExists = await User.findById(userId);
      if (userExists && !groupData.members.includes(userId)) {
        usersToAdd.push(userId);
      }
    }

    if (usersToAdd.length === 0) {
      return res.status(400).json({ message: 'No valid new members to add' });
    }

    groupData.members.push(...usersToAdd);
    await groupData.save();

    const updatedGroup = await group.findById(groupId)
      .populate('admin', 'name profile_pic')
      .populate('members', 'name profile_pic');

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async remove_members_from_group(req, res) {
  try {
    const { groupId, userIds } = req.body; // Expect an array of user IDs to remove
    if(!groupId) {
      return res.status(400).json({ message: 'groupId is required' });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one user ID to remove' });
    }

    const groupDoc = await group.findById(groupId);
    if (!groupDoc) {
      return res.status(404).json({ message: 'Group not found' });
    }
    const isRequesterAdmin = groupDoc.admin.map(String).includes(req.user.userId);
if (!isRequesterAdmin) {
  return res.status(403).json({ message: 'Only group admins can remove members' });
}


    // Prevent removing admin
    if (userIds.includes(groupDoc.admin.toString())) {
      return res.status(400).json({ message: 'Cannot remove group admin' });
    }

    // Filter out the users to be removed
    groupDoc.members = groupDoc.members.filter(
      memberId => !userIds.includes(memberId.toString())
    );

    await groupDoc.save();

    const updatedGroup = await group.findById(groupId)
      .populate('admin', 'name profile_pic')
      .populate('members', 'name profile_pic');

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async delete_group(req, res) {
  try {
    const groupData = await group.findById(req.params.id);
    
    if (!groupData) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // ✅ Check if requester is the group admin
    if (groupData.admin.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the group admin can delete the group' });
    }

    await group.findByIdAndDelete(req.params.id);

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async leave_group(req, res) {
  try {
    const groupData = await group.findById(req.params.groupId);
    if (!groupData) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const userId = req.user.userId;

    // ✅ Check if requester is a member
    if (!groupData.members.map(id => id.toString()).includes(userId)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    const isAdmin = groupData.admin.map(id => id.toString()).includes(userId);

    // ✅ If user is admin
    if (isAdmin) {
      if (groupData.admin.length === 1) {
        return res.status(403).json({ message: 'You are the only admin. Assign another admin before leaving.' });
      }

      // ✅ Remove user from admin list
      groupData.admin = groupData.admin.filter(adminId => adminId.toString() !== userId);
    }

    // ✅ Remove user from members
    groupData.members = groupData.members.filter(memberId => memberId.toString() !== userId);

    await groupData.save();

    res.json({ message: 'You have left the group successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async  make_group_admin(req, res) {
  try {
    const { groupId, userId } = req.body;

    if (!groupId || !userId) {
      return res.status(400).json({ message: 'groupId and userId are required' });
    }

    const groupData = await group.findById(groupId);
    if (!groupData) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // ✅ Check if the requester is already one of the admins
    const isRequesterAdmin = groupData.admin.map(String).includes(req.user.userId);
    if (!isRequesterAdmin) {
      return res.status(403).json({ message: 'Only group admins can add another admin' });
    }

    // ✅ Check if the user to be promoted is already an admin
    if (groupData.admin.map(String).includes(userId)) {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    // ✅ Add the user to the admin array
    groupData.admin.push(userId);
    await groupData.save();

    res.json({ message: 'User added as admin successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
async  get_non_group_members(req, res) {
  try {
    const { groupId } = req.params; // or req.body / req.query depending on your route setup

    // Find the group by ID
    const targetGroup = await group.findById(groupId);
    if (!targetGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Get users not in the group's members array
    const nonGroupMembers = await User.find({ _id: { $nin: targetGroup.members } });

    res.json(nonGroupMembers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
async  get_common_groups(req, res) {
  try {
    const loggedInUserId = req.user.userId; // Authenticated user
    const { otherUserId } = req.params; // ID of the specific user

    // Find groups where both users are members
    const commonGroups = await group.find({
      members: { $all: [loggedInUserId, otherUserId] }
    });

    res.json(commonGroups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
async  get_group_members(req, res) {
   try {
    const { groupId } = req.params;

    // Find the group and populate members and admin
    const targetGroup = await group.findById(groupId)
      .populate('members', 'name email')
      .populate('admin', 'name email'); // Assuming `admin` is a user reference

    if (!targetGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json({
      admin: targetGroup.admin,
      members: targetGroup.members,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


    };

    module.exports = new Group();