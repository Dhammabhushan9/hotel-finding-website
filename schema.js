const Joi = require('joi');

module.exports.listingschema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        country: Joi.string().required(),
       
        price: Joi.number().required().min(0),  // Changed .max(0) to .min(0) for positive prices
      
        image: Joi.string().required(),
        
    }).required()
});


module.exports.reviewschema = Joi.object({
    review: Joi.object({
       comment:Joi.string().required(),
       rating:Joi.number().required().min(1).max(5),
        
    }).required()
});
