const mongoose = require('mongoose'), Schema = mongoose.Schema;

var periodSchema = new Schema({
    txt: String,
    m : [Number]
},{ _id : false });

var sourceSchema = new Schema({
    a: String,
    href : String
},{ _id : false });

var Document = new Schema({
   nom: String,
   description: String,
   type: [String],
   semi: periodSchema,
   plantation: periodSchema,
   floraison: periodSchema,
   sources: [sourceSchema],
   version: Number
});

module.exports = Document;