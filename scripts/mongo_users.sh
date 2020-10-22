#!/bin/bash

action=${1:-list}
dbHost=${2:-localhost}
dbPort=${3:-37017}

mongoCmd=${MONGO_CMD:-mongo.exe}

ADMIN_USER="root"
ADMIN_PASSWORD="mypass"
ADMIN_DB="admin"

USERNAME="jojo"
USER_PASSWORD="papa"
ROLE="read"
DBNAME="test-jardin"

# SHOW_COLLECTIONS="printjson(db.getCollectionNames())"
SHOW_SYS_USERS="db.getCollection('system.users').find({})"

ADD_READ_USER="print('add ${USERNAME} user :');db.createUser({user: '${USERNAME}', pwd: '${USER_PASSWORD}', roles: []})"
GRANT_READ_USER="print('grant ${USERNAME} ${ROLE} on >${DBNAME}<');db.grantRolesToUser('${USERNAME}',[{ role: '${ROLE}', db: '${DBNAME}' }]);"
DROP_USER="print('drop ${USERNAME} user :');db.dropUser('${USERNAME}')"

MONGO_OPTS="${dbHost}:${dbPort}/${ADMIN_DB} --username ${ADMIN_USER} --password ${ADMIN_PASSWORD} --quiet"

# --authenticationDatabase 'admin'
# db.getSiblingDB('admin').getRoles({rolesInfo: 1,showPrivileges:true,showBuiltinRoles: true})

usage() {
  echo "$0 [<action = list/add/drop> <dbHost = localhost> <dbPort = 37017>";
  exit 1;
}

listUsers() {
  # shellcheck disable=SC2086
  ${mongoCmd} ${MONGO_OPTS} --eval "db = db.getSiblingDB('admin');${SHOW_SYS_USERS}"
}
addUser() {
  # shellcheck disable=SC2086
  ${mongoCmd} ${MONGO_OPTS} --eval "db = db.getSiblingDB('admin');${ADD_READ_USER};${GRANT_READ_USER}"
}
dropUser() {
  # shellcheck disable=SC2086
  ${mongoCmd} ${MONGO_OPTS} --eval "db = db.getSiblingDB('admin');${DROP_USER}"
}

if [[ "$action" == "list" ]]; then
  listUsers
elif [[ "$action" == "add" ]]; then
  addUser
elif [[ "$action" == "drop" ]]; then
  dropUser
else
  usage
fi
