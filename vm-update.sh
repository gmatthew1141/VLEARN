#!/bin/sh
set -e

# This script is to be run on the VM in the home/vlearn_webapp folder to update the latest tag

# $VLEARN_USER and $VLEARN_PASS should be in ~/.bashrc if they aren't, add them then source ~/.bashrc

# Get all the tags and pull out the one that appears at the bottom
version=`wget --user $VLEARN_USER --password $VLEARN_PASS -O - https://vis.cs.umd.edu/svn/projects/vlearn2/Webapp/tags/ | grep -io '<a href=['"'"'"][^"'"'"']*['"'"'"]' | \
  sed -e 's/^<a href=["'"'"']//i' -e 's/["'"'"']$//i' | tail -1`

svn --username $VLEARN_USER --password $VLEARN_PASS switch https://vis.cs.umd.edu/svn/projects/vlearn2/Webapp/tags/$version/vlearn_webapp

# install the latest npm packages to the server (we use ci here to not modify the package-lock.json)
npm ci