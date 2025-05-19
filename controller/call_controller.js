const Call = require("../models/call_model");

class call_controller {
   async initiate_call(req, res) {
       const { receiver_id, call_type, channel_id } = req.body;
  const callerId = req.user.userId;
  const start_time = Math.floor(Date.now() / 1000);

  const call = await Call.create({
    caller_id: callerId,
    receiver_id,
    call_type,
    status: "initiated",
    started_at: start_time,
    channel_id,
  });

  res.json({ message: "Call initiated", callId: call._id });
   }

   async accept_call(req, res) {
    const { caller_id } = req.body;
      const start_time = Math.floor(Date.now() / 1000);


  await Call.findByIdAndUpdate(caller_id, {
    status: "accepted",
    started_at: start_time
  });

  res.json({ message: "Call accepted" });
}

async end_call(req, res) {
    const { caller_id } = req.body;
      const end_time = Math.floor(Date.now() / 1000);


  const call = await Call.findById(caller_id);
  const endTime = end_time;
  const duration = Math.floor((endTime - call.startedAt) / 1000);

  call.status = "ended";
  call.ended_at = endTime;
  call.duration = duration;
  await call.save();

  res.json({ message: "Call ended", duration });
}
async reject_call(req, res) {
 const { caller_id } = req.body;
      const end_time = Math.floor(Date.now() / 1000);

  await Call.findByIdAndUpdate(caller_id, {
    status: "rejected",
    ended_at: end_time
  });

  res.json({ message: "Call rejected" });}
}
module.exports = new call_controller();