const mongoose = require('mongoose'), Schema = mongoose.Schema;

const periodSchema = new Schema({
    m : [Number]
},{ _id : false });

const sourceSchema = new Schema({
    "label": "String",
    "href": "String"
},{ _id : false });

const Document = new Schema({
   "nom": String,
   "nom_scientifique": String,
   "type": [String],
   "familles": [String],
   "semi": periodSchema,
   "plantation": periodSchema,
   "floraison": periodSchema,
   "recolte": periodSchema,
   "version": Number,
   "sources": [sourceSchema]
});

module.exports = Document;