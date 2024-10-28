# 🐳 Easy Docker Container Updater
[![NodeJS Version](https://img.shields.io/badge/Node.js->%3D%208.0.0-6DA55F?style=for-the-badge&logo=node.js&logoColor=98F483&style=plastic)](#requirements)
![Docker](https://img.shields.io/badge/Docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white&style=plastic)
[![License](https://img.shields.io/badge/License-GNU-blue.svg?style=for-the-badge&logoColor=white&style=plastic)](https://github.com/c-kick/easy-docker-container-updater/blob/main/LICENSE)
![Synology](https://img.shields.io/badge/Synology%20DSM-compatible-555.svg?style=for-the-badge&labelColor=4384F5&style=for-the-badge&logo=synology&logoColor=white&style=plastic)

## Table of Contents
- [Introduction](#introduction)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Example container configuration](#example-container-configuration)
- [Usage](#usage)
  - [Command Structure Overview](#command-structure-overview)
  - [Update a Single Container](#update-a-single-container)
  - [Update All Containers](#update-all-containers)
  - [Force Updating a Container](#force-updating-a-container)
  - [Force Updating a Container with a Different Image](#force-updating-a-container-with-a-different-image)
  - [Force Update All Containers](#force-update-all-containers)
  - [Optional: stay up to date](#optional-stay-up-to-date)

## Introduction
Easy Docker Container Updater is a NodeJS script that offers a simple way to maintain centralized configurations & automate updates to Docker containers. It is intended specifically for users with limited knowledge of Docker, who run containers on their (private NAS) server and want a fire-and-forget update solution. 

It is particularly useful for those running a large amount of [*arr](https://wiki.servarr.com) containers. 

## Requirements:
- Docker
- NodeJS (v8.0.0 or higher)
- A text-editor to configure the script

## Installation
If you have Git installed, you can clone the repository inside the directory of your choice:
   ```bash
   git clone https://github.com/c-kick/easy-docker-container-updater.git
   cd easy-docker-container-updater
   npm install
   npm run config
   ```
Or:
1. Download `container-update.js` and `container-config-example.js` and place them (together) in a directory of your choosing.
2. Copy and rename the example configuration file, `container-config-example.js`, to `container-config.js`, i.e:

	```bash
	cp container-config-example.js container-config.js
	```
## Configuration

Open `container-config.js` with a text-editor and first adjust the `options` object to fit your configuration. The file is annotated, so should be self-explanatory.
The actual configurations for each container reside in the `container` object.
   - Note: you can basically assign anything you want to the `arguments` object inside each container configuration entry; it will eventually get flattened into a `docker create` command.

### Example container configuration

<details>
  <summary>Click here for an example container config entry</summary>

  Note: `container-config-example.js` also contains an example configuration.

  ```js
  'plex': {

    debug: true, //optional - override debug mode for this container

    image: 'plexinc/pms-docker:plexpass', // required - the repository & image to use

    alwaysRun: false, // optional - if true, this will force the container to run, even when it was stopped prior to updating. Note: this is *not* the restart policy, which is configured inside the `arguments` object (below).

    // The arguments that will be passed to 'docker create'
    // Note: all arguments are optional. If you have no arguments, just leave it empty (`arguments: {}`)
    arguments: {

      net: 	'bridge', // Network mode (bridge, host, etc)

      // If you need ports (i.e. in 'bridge' network mode)
      // specify them here, as [host-side-port, container-side-port]
      p: [
      	[32400, 32400],
      ],

      // Volume mappings
      v: [
        ['/my-custom/path-1', '/path-1/'],
        //add more if needed
      ],

      // Environment variables
      e: {
        TZ: 'Europe/Amsterdam',
        PLEX_UID: 1234,
        PLEX_GID: 45678
        //add more if needed
      },

      // Device mappings
      device: [
        ['/dev/dri', '/dev/dri'],
        //add more if needed
      ],

      privileged: 	false,	// optional - privileged mode

      memory:		'768m', // optional - memory limit
     
      restart: 		'always', // optional - restart policy

      // Add whatever other arguments you need. E.g. stuff like: gpus: 'all'
    },

  },
  ```
> **Note:** Optional values will fall back to defaults inside the `options` object (and if not there, to hard-coded defaults), if not specified.

> **Note:** If you have many containers configured, but want to debug just one of them, you can override the global `debug` flag from *inside* a container config. Just set `debug : true` in the container's config entry (as shown in the example).
</details>

## Usage

### Command structure overview

```bash
node container-update.js <container> <image> <forced>
```

| Parameter       | Description                                                                                         | Required | Example                           |
|-----------------|-----------------------------------------------------------------------------------------------------|----------|-----------------------------------|
| `<container>`   | The name of the container to update. You can also pass `--all` to update all configured containers. | Yes      | `plex`, `--all`                   |
| `<image>`       | (Optional) Specify an alternate Docker image (`repository:image`) to use for the container update.  | No       | `plexinc/pms-docker:latest`       |
| `<forced>`      | (Optional) Set to `true` to force-update a container, even if no new image is available.            | No       | `true`                             |

### Update a single container

Running the command

```bash
node container-update.js plex
```

Updates the `plex` container, if there is an update available for the image configured for it. 

In more detail, it will:
- Check if a container entry named `plex` exists inside the `containers` object in `container-config.js`,
- Check if a container config path for `plex` exists inside the `configBasePath` path, and if not; create it,
- Download the (let's assume this is the configured image) `plexinc/pms-docker:plexpass` image,
- Check if the image is up-to-date or has been updated, and if it is;
	- Check if a container named `plex` exists in Docker, and if it does; stop and delete the old container,
	- (Re)create a `plex` container based on the config defined for `plex` inside the `containers` object in `container-config.js`,
	- Start the container if it existed and was already running before the update (or run it if `alwaysRun` is `true`),
- If the container was actually updated, an e-mail is dispatched with the update summary, 
  if a recipient was entered in `email_to` inside the `options` object.
- If there is no update for the image, the script does nothing, and if something is wrong, it will output an error.

> **Note:** If you don't want any e-mail reports, blank out the `email_to` option (or set it to `null`) in  the `options` in `container-config.js`.

### Update *all* containers

Running the command

```bash
node container-update.js --all
```

Will do the same as above, but for **all** containers configured in the `containers` object in `container-config.js`. 
After all containers are processed, a report is sent, detailing how many were processed, how many were updated, and how many 
failed. 

This option is especially useful if you want your containers to update regularly; just create a scheduled task with this command, 
and the script handles the rest.

### Force updating a container

If a container has no updates, but you explicitely need to delete and re-create it, run:

```bash
node container-update.js plex true
```

This will run the `plex` container update process, regardless of an actual image update.

### Force updating a container with a different image

To force an update using a different image, run:

```bash
node container-update.js plex plexinc/pms-docker:public
```

This will run the `plex` container update process, using the `plexinc/pms-docker:public` image, regardless of an actual image update.

### Force update *all* containers

You probably only ever want to do this, but if you do, running the command:

```bash
node container-update.js --all true
```

Will run a forced update on *all* configured containers.

### Optional: stay up to date
If you have pulled the script via Git, and want to make sure you have the latest version of the updater each time you run it, you can call:

```bash
cd /your/path/to/easy-docker-container-updater && git pull && node ./container-update.js --all
```
