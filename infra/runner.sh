#!/bin/bash

terraform apply --auto-approve

ansible-playbook setup_argocd.yml

ansible-playbook deploy_talkz.yml