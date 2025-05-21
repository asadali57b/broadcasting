const User = require('../models/user_model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const user_services=require('../services/user_services');


const {user_validation_schema,uodate_user_validation_schema} = require('../middleware/validation');
class User_controller{
    async register(req,res) {

        try {
            console.log("Request Body:", req.body);

            // 2. Check if req.body exists
            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({ error: "Request body is empty" });
            }
    
            // 3. Destructure and validate
            const { name, email, password, phone_number } = req.body;
            const { error } = user_validation_schema.validate(req.body);
    
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }
            let user= await User.findOne({email: req.body.email});
        if(user) return res.status(400).json({"message":"User Already resgistered"});
            
            const hashedPassword = await bcrypt.hash(password, 10);
    
            const newUser = new User({
                name,
                phone_number,
                email,
                password: hashedPassword
            });
    
            await newUser.save();
    
            const savedUser = newUser.toObject();
            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    _id: savedUser._id,
                    name: savedUser.name,
                    email: savedUser.email,
                    phone_number: savedUser.phone_number,
                }
            });        } catch (err) {
            res.status(500).json({ error: err.message });
        }
      }
    //   async login(req,res) {
    //     const { email, password } = req.body;
    //     try {
    //         const user = await User.findOne({ email });
    //         if (!user) {
    //             return res.status(401).json({ message: 'User not found' });
    //         }
    //         const isPasswordValid = await bcrypt.compare(password, user.password);
    //         if (!isPasswordValid) {
    //             return res.status(401).json({ message: 'Invalid password' });
    //         }
    //         user.last_seen = Math.floor(Date.now() / 1000);
    // user.is_active = true;
    // await user.save();
    //         const token = jwt.sign({
    //              userId: user._id,
    //              email: user.email,
    //              is_admin: user.is_admin,
    //              is_active: user.is_active,
    //              name: user.name,
    //              profile_pic: user.profile_pic,
    //              phone_number: user.phone_number 
                
    //             }, 'secret', { expiresIn: '24hr' });
    //         res.status(200).json({ token });
    //     } catch (err) {
    //         res.status(500).json({ error: err.message });
    //     }
    //   }

    async login(req,res) {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        user.last_seen = Math.floor(Date.now() / 1000);
        user.is_active = true;
        await user.save();
        
        const token = jwt.sign({
             userId: user._id,
             email: user.email,
             is_admin: user.is_admin,
             is_active: user.is_active,
             name: user.name,
             profile_pic: user.profile_pic,
             phone_number: user.phone_number 
            
            }, 'secret', { expiresIn: '24hr' });
            
        // Socket.io emit
        const io = req.app.get('io');
        if (io) {
            io.emit('userStatusChange', {
                userId: user._id,
                status: 'online'
            });
        }
        
        res.status(200).json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

      async forgot_password(req,res){
        const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ error: 'User with this email does not exist.' });

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');

    user.resetPasswordToken = resetToken;
     user.resetPasswordExpires = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    await user.save();

    const resetLink = `http://localhost:5000/api/broadcasting/reset_password/${resetToken}`;

    // Send email (you'll define sendEmail)
    await user_services.sendEmail(user.email, 'Password Reset', `Click to reset your password: ${resetLink}`);

    res.status(200).json({ message: 'Password reset link sent to email.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
      }
async reset_password(req,res){
         const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const currentUnix = Math.floor(Date.now() / 1000);

const user = await User.findOne({
  resetPasswordToken: token,
  resetPasswordExpires: { $gt: currentUnix }
});

    if (!user)
      return res.status(400).json({ error: 'Invalid or expired token' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
      }
     async get_all_users(req, res) {
  try {
    const users = await User.find({ _id: { $ne: req.user.userId } }).select('-password');

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    // Optionally, you can format each user if needed:
    const data = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      profile_pic: user.profile_pic,
      last_seen: user.last_seen,
    }));

    res.status(200).json( data );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

      async get_user_by_id(req,res){
         try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const data = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      profile_pic: user.profile_pic,
      last_seen: user.last_seen,
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
      }
   async update_user(req,res){
        try {
    const {id, name, email, phone_number, profile_pic, is_active } = req.body;
    const { error } = uodate_user_validation_schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const updatedUser = await User.findByIdAndUpdate(id,
      // req.params.id,
      { 
        name, 
        email, 
        phone_number, 
        profile_pic, 
        is_active,
        last_seen: Math.floor(Date.now() / 1000)
      },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
      const data = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone_number: updatedUser.phone_number,
      profile_pic: updatedUser.profile_pic,
      last_seen: updatedUser.last_seen,
    };
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
      }

      async logout(req, res) {
    try {
        // Update user status to offline
        await User.findByIdAndUpdate(req.user.userId, {
            is_active: false,
            last_seen: Math.floor(Date.now() / 1000)
        });
        
        // Socket.io emit
        const io = req.app.get('io');
        if (io) {
            io.emit('userStatusChange', {
                userId: req.user.userId,
                status: 'offline'
            });
        }
        
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
}
module.exports = new User_controller();