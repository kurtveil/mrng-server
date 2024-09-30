const mongoose = require('mongoose');


const ProductSchema = new mongoose.Schema({

    name: { 
        type: String,
    },
    description: { 
        type: String,
    },
    price: { 
        type: String,
    },
    image: { 
        type: String,
    },
    amount:{
        type: String
    },
    characteristics: { 
        type: String
    }
});

module.exports = mongoose.model('Product', ProductSchema);