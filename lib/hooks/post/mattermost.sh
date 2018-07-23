#!/bin/bash

# https://vaneyckt.io/posts/safer_bash_scripts_with_set_euxo_pipefail/
set -euo pipefail

APP_SLUG=$1
APP_VERSION=$2

function sendMattermostMsg {
  if [[ -z "${MATTERMOST_CHANNEL-}" ]]; then
    echo "No MATTERMOST_CHANNEL specified";
  elif [[ -z "${MATTERMOST_HOOK_URL-}" ]]; then
    echo "Missing MATTERMOST_HOOK_URL environment variable";
  else
    INSTANCE=$1
    APP_SLUG=$2
    MATTERMOST_ICON="https://travis-ci.com/images/logos/TravisCI-Mascot-1.png"
    MATTERMOST_USERNAME="Travis"

    GIT_LOG=$(git log -1 "--pretty=format:%h %s")

    MATTERMOST_MESSAGE="[$INSTANCE](http://$INSTANCE) updated for __${APP_SLUG}__ version \`$APP_VERSION\`"

    if [[ -z "${TRAVIS-}" ]]; then
      echo "No TRAVIS environment detected";
    else
        MATTERMOST_MESSAGE="$MATTERMOST_MESSAGE [$GIT_LOG](https://github.com/$TRAVIS_REPO_SLUG/commit/$TRAVIS_COMMIT)."
    fi

    curl -X POST -d "payload=\
        {\"channel\":\"${MATTERMOST_CHANNEL}\",\
         \"icon_url\": \"${MATTERMOST_ICON}\",\
         \"username\": \"${MATTERMOST_USERNAME}\", \
         \"text\": \"${MATTERMOST_MESSAGE}\"}" ${MATTERMOST_HOOK_URL}

    echo "";
  fi
}

function deploy {
  INSTANCE=$1
  APP_SLUG=$2

  sendMattermostMsg $INSTANCE $APP_SLUG

  sleep 5 # Cannot have the same rundeck job running twice
}

echo "Deploying ${APP_SLUG} on recette:"
deploy "recette.cozy.works" ${APP_SLUG}
