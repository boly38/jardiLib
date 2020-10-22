COMPOSE=env/docker-compose.yml

# HELP
# This will output the help for each task
# thanks to https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
.PHONY: help

help: ## This help.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# DOCKER TASKS
start: ## start mongo
	docker-compose -f ${COMPOSE} up -d
stop: ## stop mongo
	docker-compose -f ${COMPOSE} stop
down: ## stop and remove mongo - >Warning< - this will remove mongo database
	docker-compose -f ${COMPOSE} down
ps: ## list docker containers and names, status, and ids
	docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.ID}}\t{{.Ports}}"
mongoUser: ## connect to mongo database as user
	winpty mongo.exe localhost:37017 --username jojo --password papa --authenticationDatabase 'admin'
