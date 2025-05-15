const Poll = require('../models/poll_model');
const poll_validation_schema = require('../middleware/validation').poll_validation_schema;
const vote_validation_schema = require('../middleware/validation').vote_validation_schema;
class poll_controller{
    async create_poll(req,res){
        try {
        const { group_id, question, options } = req.body;
        const { error } = poll_validation_schema.validate(req.body);

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const userId = req.user.userId;

        if (!question || !options || options.length < 2) {
            return res.status(400).json({ error: 'Poll must have a question and at least 2 options' });
        }

        const poll = await Poll.create({
            group_id,
            question,
            options: options.map(text => ({ text })),
            createdBy: userId
        });

        res.status(201).json({ message: 'Poll created successfully', poll });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
    }
    async vote_poll(req,res){
        try {
        const poll_id = req.params.poll_id;
        const { optionIndex } = req.body;
        const { error } = vote_validation_schema.validate(req.body);

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const userId = req.user.userId;

        const poll = await Poll.findById(poll_id);

        if (!poll) return res.status(404).json({ error: 'Poll not found' });

        // Prevent double voting
        const alreadyVoted = poll.options.some(opt =>
            opt.votes.includes(userId)
        );
        if (alreadyVoted) return res.status(400).json({ error: 'You have already voted' });

        poll.options[optionIndex].votes.push(userId);
        await poll.save();

        res.status(200).json({ message: 'Vote recorded', poll });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
    }
}
module.exports = new poll_controller();