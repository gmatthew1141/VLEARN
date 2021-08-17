#!/bin/sh
set -e

#######################################################
#   Use this to publish a new tag of the project to SVN

# Description: 
#   Creates a tag, makes a new tag folder, and moves 
#   the working copy of trunk into the new tag folder 
# Usage:
# - Create $VLEARN_USER and $VLEARN_PASS in ~/.bashrc
#   by adding 
#   export VLEARN_USER=USER
#   export VLEARN_PASS=PASSWORD
# - ./create-tag.sh "<npm_version arguments>"
#   See possible arguments at this link: 
#   https://docs.npmjs.com/cli/v7/commands/npm-version
#######################################################

# check for $VLEARN_USER and $VLEARN_PASS, otherwise
# prompt for password

if [ ! -z "$VLEARN_USER" ] && [ ! -z "$VLEARN_PASS" ]; then
    svn="svn --username $VLEARN_USER --password $VLEARN_PASS"
elif  [ ! -z "$VLEARN_USER" ]; then
    svn="svn --username $VLEARN_USER"
else 
    svn="svn"
fi

website='https://vis.cs.umd.edu/svn/projects/vlearn2/Webapp'

# update the package.json and package-lock.json
# sed removes the v prefix from the npm version
#   output
version=`npm version $1 | sed 's/v//' `

# makes a new directory in the tags repository with the latest version of the build
$svn ci -m "Updated package.json and package-lock.json to $version"
$svn mkdir "$website/tags/$version" -m "Creating tag folder for $version"

# Create the new 
$svn copy https://vis.cs.umd.edu/svn/projects/vlearn2/Webapp/trunk/vlearn_webapp/ https://vis.cs.umd.edu/svn/projects/vlearn2/Webapp/tags/$version/vlearn_webapp/ -m "Tagging the $version release of the vlearn_webapp"
