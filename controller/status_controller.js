const Status = require('../models/status_model');
const {status_validation_schema} = require('../middleware/validation');
class Status_Controller{
   async add_status(req,res){
       try{
           const {media_url,type,caption} = req.body;
           const {error} = status_validation_schema.validate(req.body);
           if(error){
               return res.status(400).json({error:error.details[0].message});
           }
           const new_status = await new Status({user:req.user.userId,media_url,type,caption});
           await new_status.save();
           res.status(200).json({message:"Status added successfully"});
       }catch(error){
           res.status(500).json({error:error.message});
       }
   }
}
module.exports = new Status_Controller();