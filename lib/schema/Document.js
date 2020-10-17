const mongoose = require('mongoose'), Schema = mongoose.Schema;

var periodSchema = new Schema({
    m : [Number]
},{ _id : false });

var Document = new Schema({
   "nom": String,
   "nom_scientifique": String,
   "type": [String],
   "familles": [String],
   "semi": periodSchema,
   "plantation": periodSchema,
   "floraison": periodSchema,
   "recolte": periodSchema,
   "version": Number
});

module.exports = Document;