const Joi = require('joi');

const user_validation_schema = Joi.object({
    name: Joi.string()
        .required()
        .messages({
            'any.required': 'name is required',
            'string.empty': 'name cannot be empty',
        }),

    email: Joi.string()
        .email()
        .required()
        .messages({
            'any.required': 'email is required',
            'string.email': 'email must be a valid email address',
            'string.empty': 'email cannot be empty',
        }),

    password: Joi.string()
        .required()
        .messages({
            'any.required': 'password is required',
            'string.empty': 'password cannot be empty',
        }),

    profile_pic: Joi.string()
        .uri()
        .optional()
        .default("https://cdn-icons-png.flaticon.com/512/149/149071.png")
        .messages({
            'string.uri': 'profile pic must be a valid URL',
        }),

    phone_number: Joi.string()
        .required()
        .messages({
            'any.required': 'phone_number is required',
            'string.empty': 'phone_number cannot be empty',
        }),

    is_admin: Joi.boolean()
        .optional()
        .default(false),

    is_active: Joi.boolean()
        .optional()
        .default(false),
});

const uodate_user_validation_schema = Joi.object({
    id: Joi.string()
        .required()
        .messages({
            'any.required': 'id is required',
            'string.empty': 'id cannot be empty',
        }),
    name: Joi.string()
        .optional()
        .messages({
            'string.empty': 'name cannot be empty',
        }),
    email: Joi.string()
        .email()
        .optional()
        .messages({
            'string.email': 'email must be a valid email address',
            'string.empty': 'email cannot be empty',
        }),
     phone_number: Joi.string()
        .optional()
        .messages({
            'string.empty': 'phone_number cannot be empty',
        }),
    profile_pic: Joi.string()
        .uri()
        .optional().messages({
            'string.uri': 'profile pic must be a valid URL',
        }),
        is_active: Joi.boolean()
        .optional().messages({
            'string.empty': 'is_active cannot be empty',
        })   
   
});

const message_validation_schema = Joi.object({
   receiver: Joi.string()
        .required()
        .messages({
            'any.required': 'receiver is required',
            'string.empty': 'receiver cannot be empty',
        }),
    content: Joi.string()
        .required()
        .messages({
            'any.required': 'content is required',
            'string.empty': 'content cannot be empty',
        }),

});


const group_validation_schema = Joi.object({
    name: Joi.string()
        .required()
        .messages({
            'any.required': 'name is required',
            'string.empty': 'name cannot be empty',
        }),
        members: Joi.array()
        .required().min(1)
        .messages({
            'any.required': 'members is required',
            'string.empty': 'members cannot be empty',
        }),
        group_pic: Joi.string()
        .uri()
        .optional()
        .default("https://cdn-icons-png.flaticon.com/512/149/149071.png")
        .messages({
            'string.uri': 'group pic must be a valid URL',
        }),
});

const update_group_validation_schema = Joi.object({
    id: Joi.string()
        .required()
        .messages({
            'any.required': 'id is required',
            'string.empty': 'id cannot be empty',
        }),
    name: Joi.string()
        .optional()
        .messages({
            'string.empty': 'name cannot be empty',
        }),
    group_pic: Joi.string()
        .uri()
        .optional()
        .messages({
            'string.uri': 'group pic must be a valid URL',
        }),
        members: Joi.array()
        .optional()
        .messages({
            'string.empty': 'members cannot be empty',
        }),
})
const group_message_validation_schema = Joi.object({
    group_id: Joi.string()
        .required()
        .messages({
            'any.required': 'group_id is required',
            'string.empty': 'group_id cannot be empty',
        }),
    content: Joi.string()
        .required()
        .messages({
            'any.required': 'content is required',
            'string.empty': 'content cannot be empty',
        }),
})
const poll_validation_schema = Joi.object({
    group_id: Joi.string()
        .required()
        .messages({
            'any.required': 'group_id is required',
            'string.empty': 'group_id cannot be empty',
        }),
    
    question: Joi.string()
        .required()
        .messages({
            'any.required': 'question is required',
            'string.empty': 'question cannot be empty',
        }),
    options: Joi.array()
        .required().min(2)
        .messages({
            'any.required': 'options is required',
            'string.empty': 'options cannot be empty',
        }),

})
const vote_validation_schema = Joi.object({
    poll_id: Joi.string()
        .required()
        .messages({
            'any.required': 'poll_id is required',
            'string.empty': 'poll_id cannot be empty',
        }),
    optionIndex: Joi.number()
        .required()
        .messages({
            'any.required': 'optionIndex is required',
            'string.empty': 'optionIndex cannot be empty',
        }),
})
const status_validation_schema = Joi.object({
    media_url: Joi.string()
        .required()
        .messages({
            'any.required': 'media_url is required',
            'string.empty': 'media_url cannot be empty',
        }),
    type: Joi.string()
        .optional()
        .default("image")
        .messages({
            'any.required': 'type is required',
            'string.empty': 'type cannot be empty',
        }),
    caption: Joi.string()
        .optional()
        .default(''),
})
module.exports = {user_validation_schema,uodate_user_validation_schema, message_validation_schema,group_validation_schema,update_group_validation_schema,group_message_validation_schema,poll_validation_schema,vote_validation_schema,status_validation_schema};
