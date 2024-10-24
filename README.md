# 🐳 Easy Docker Container Updater
Easy Docker Container Updater is a NodeJS script which offers an extremely simple way to automate updates to Docker containers, running or not. It is aimed especially at users with limited knowledge of Docker, who run containers on their own (NAS) server.

## Requirements:
- NodeJS
- A text-editor to configure the script

## Basic usage:
```JavaScript
./container-update.js <container> <image> <forced>
```

Breakdown:
- `./container-update.js` - The (path to) the Easy Docker Container Updater script
- `<container>` - The name of the container to update.
  - You can also pass `--all` here, to update *all* configured containers.
- `<image>` - (optional) The name of the repository:image to use. Use this to override the one configured in `containers`.
- `<forced>` - (optional) Set `true` if you want to force-update a container, even when its image has no available update.

## Configuration
First, adjust the `options` object to fit your configuration. Descriptions are commented inside of it to guide you through the settings.

Then, enter your container configurations in the `container` object. A basic container entry looks like this:

```JavaScript

// The name to use for this container
'plex': {

    // OPTIONAL - Debug override - If set to true, this override the global debug flag, specifically for this container,
    // and will NOT actually run any docker-commands, and instead outputs the commands to the console
    // (useful for testing your configuration).
    debug: true, 

    // The repository & image to use
    image: 'plexinc/pms-docker:plexpass',

    // The arguments that will be passed to docker create
    // Note: all arguments are optional.
    arguments: {

        // Volume mappings
        v: [ 
          ['/my-custom/path-1', '/path-1/'],
          ['/my-custom/path-2', '/another-path/'],
          //add more if needed
        ],

        // Environment variables
        e: [
           ['TZ', 'Europe/Amsterdam'],
           ['PLEX_UID', 1234],
           ['PLEX_GID', 56789],
          //add more if needed
        ],

        // Device mappings
        device: [
          ['/dev/dri', '/dev/dri'],
          //add more if needed
        ],

        // Privileged mode
        privileged: true,

        // Memory limit
        memory:     '768m',

        // Restart policy
        restart: 	'always',
		},

    // Set network mode (bridge, host, etc)
    network: 'host',

    // Set alwaysrun - if true, this will force the container to run, even when it was stopped prior to updating
    alwaysrun: false
   },
```
The above example configuration:
- Creates a container named `plex`,
- using the 'plexinc/pms-docker:plexpass' image,
- maps the `/my-custom/path-1` directory of the host to the `/path-1/` directory in the container, as well as the host's `/my-custom/path-2` to `/another-path/` in the container,
- sets the timezone to `Europe/Amsterdam`, and specifies the `PLEX_UID` and `PLEX_GID` variables to user `1234` and group `56789`,
- maps all devices inside `/dev/dri` on the host to the same path in the container,

This example creates or updates the container 'plex' using the,
it maps any and all devices inside /dev/dri to the container's /dev/dri,
maps the movies and tv-series paths, and another path (added as an example) and explicitly assigns PUID and PGID as
'PLEX_UID' and 'PLEX_GID' environment variables because the Plex docker container doesn't use the PUID and PGID variables.
For demonstration purposes, it also sets a specific timezone (ignoring the global setting in 'options'), sets the
container to run priviliged, assigns a 768mb memory limit, and specifies a 'always' restart policy (ignoring the global setting in 'options').

## What it does
When properly configured, triggering the script for a container (e.g. 'my-container') will:
- Check if a container entry named `my-container` exists inside the `containers` object,
- Check if a container named `my-container` exists in Docker,
- Check if a container config path named `/volume1/docker/my-container/config` exists,
- Download the image, as defined in the config for `my-container` inside the `containers` object,
- Check if the image is up to date or has been updated, and if it is;
- Stop and delete the old container,
- Recreate it with the config defined for `my-container` inside the `containers` object,
- If there was no container 'my-container' in Docker to begin with, it will be created,
- The container is then started if it already existed and was running before the update,
- If the container was actually updated, an e-mail is dispatched with the update summary, 
  if a recipient was entered in `email_to` inside the `options` object.
