const Status = require('../models/status_model');
const {status_validation_schema} = require('../middleware/validation');
class Status_Controller{
//    async add_status(req, res) {
//   try {
//     const { media_url, caption } = req.body;

//     // Check if media_url is present
//     if (!media_url) {
//       return res.status(400).json({ error: 'media_url is required' });
//     }

//     // Detect type from file extension
//     const extension = media_url.split('.').pop().toLowerCase();
//     let type = '';

//     if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
//       type = 'image';
//     } else if (['mp4', 'mov', 'avi', 'webm'].includes(extension)) {
//       type = 'video';
//     } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
//       type = 'audio';
//     } else {
//       return res.status(400).json({ error: 'Unsupported media type' });
//     }

//     // Optional: You can validate caption or other fields here
//     const { error } = status_validation_schema.validate({ media_url, caption }); // Assuming your schema allows no `type`
//     if (error) {
//       return res.status(400).json({ error: error.details[0].message });
//     }

//     const new_status = new Status({
//       user: req.user.userId,
//       media_url,
//       type,
//       caption
//     });

//     await new_status.save();
//     res.status(200).json({ message: 'Status added successfully' });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }


// Update add_status method
async add_status(req, res) {
  try {
    const { media_url, caption } = req.body;

    // Check if media_url is present
    if (!media_url) {
      return res.status(400).json({ error: 'media_url is required' });
    }

    // Detect type from file extension
    const extension = media_url.split('.').pop().toLowerCase();
    let type = '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      type = 'image';
    } else if (['mp4', 'mov', 'avi', 'webm'].includes(extension)) {
      type = 'video';
    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
      type = 'audio';
    } else {
      return res.status(400).json({ error: 'Unsupported media type' });
    }

    // Optional: You can validate caption or other fields here
    const { error } = status_validation_schema.validate({ media_url, caption });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const new_status = new Status({
      user: req.user.userId,
      media_url,
      type,
      caption
    });

    await new_status.save();
    
    // Socket.io emit
    const io = req.app.get('io');
    if (io) {
        io.emit('newStatus', {
            statusId: new_status._id,
            userId: req.user.userId
        });
    }
    
    res.status(200).json({ message: 'Status added successfully' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
   async get_all_status(req,res){
     try {
    const statuses = await Status.find()
      .populate('user', 'name profile_pic')
      .sort({ created_at: -1 });
    if (!statuses) {
      return res.status(404).json({ message: 'Status not found' });
    }
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
   }
   async get_user_status(req,res){
     try {
    const userId = req.params.userId;
    
    const statuses = await Status.find({ user: userId })
      .populate('user', 'name profile_pic')
      .sort({ created_at: -1 });
    if(statuses.length === 0) {
      return res.status(404).json({ message: 'Status not found' });
    }
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
   }
  async delete_status(req, res) {
  try {
    const status = await Status.findById(req.params.id);
    
    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    // Check if the requester is the owner of the status
    if (status.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only delete your own status' });
    }

    await status.deleteOne();

    res.json({ message: 'Status deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
async  mark_status_seen(req, res) {
  try {
    const { statusId } = req.params;
    const userId = req.user.userId;

    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ message: "Status not found" });

    // Skip marking seen if the viewer is the owner
    if (status.user.toString() === userId) {
      return res.status(200).json({ message: "Owner viewing own status, no action needed" });
    }

    const alreadySeen = status.seen_by.some(entry => entry.user.toString() === userId);
    if (!alreadySeen) {
      status.seen_by.push({ user: userId });
      await status.save();
    }

    res.status(200).json({ message: "Status marked as seen" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}


}
module.exports = new Status_Controller();