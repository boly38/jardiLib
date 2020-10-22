#!/bin/bash
# create mongo db free plan from https://cloud.mongodb.com/
# export JARDI_MONGO_URI="mongodb+srv://userHere:passwordHere@clusterHere.xzryx.mongodb.net/dbNameHere?retryWrites=true&w=majority"
export JARDI_MONGO_URI="mongodb://root:mypass@127.0.0.1:37017/jardin?retryWrites=true&w=majority&authSource=admin"
export JARDI_ADMIN_MONGO_DB_NAME=jardinAdmin


# test
#export JARDI_TEST_MONGO_URI="mongodb://root:mypass@127.0.0.1:37017/test-jardin?retryWrites=true&w=majority&authSource=admin"
#export JARDI_TEST_ADMIN_MONGO_DB_NAME=test-jardinAdmin
#export JARDI_TEST_USER_MONGO_URI="mongodb://jojo:papa@127.0.0.1:37017/test-jardin?retryWrites=true&w=majority&authSource=admin"