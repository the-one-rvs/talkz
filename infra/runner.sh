#!/bin/bash
cd eks

terraform apply --auto-approve
cd ../playbooks

ansible-playbook setup_argocd.yml

ansible-playbook deploy_talkz.yml