# 🐳 Easy Docker Container Updater
[![NodeJS Version](https://img.shields.io/badge/Node.js->%3D%2015.14.0-6DA55F?logo=node.js&logoColor=98F483&style=plastic)](#requirements)
![Docker](https://img.shields.io/badge/Docker-%230db7ed.svg?logo=docker&logoColor=white&style=plastic)
[![License](https://img.shields.io/badge/License-GNU-blue.svg?logoColor=white&style=plastic)](https://github.com/c-kick/easy-docker-container-updater/blob/main/LICENSE)
![Synology](https://img.shields.io/badge/Synology%20DSM-compatible-555.svg?labelColor=4384F5&logo=synology&logoColor=white&style=plastic)

## Table of Contents
- [Introduction](#introduction)
  - [Features](#features)
  - [Example Usage](#example-usage)
  - [Why not just use Watchtower?](#why-not-just-use-watchtower)
- [Requirements](#requirements)
- [Installation](#installation)
  - [Using Git](#using-git)
  - [Manually](#manually) 
- [Configuration](#configuration)
- [Usage](#usage)
  - [Quick Start](#quick-start)
  - [Update a Single Container](#update-a-single-container)
  - [Update All Containers](#update-all-containers)
  - [Force Updating a Container](#force-updating-a-container)
  - [Force Updating a Container with a Different Image](#force-updating-a-container-with-a-different-image)
  - [Force Update All Containers](#force-update-all-containers)
  - [Optional: stay up to date](#optional-stay-up-to-date)
- [Reference](#reference)
  - [Options parameters](#options-parameters) 
  - [Container Configuration Entry](#container-configuration-entry)
  - [Command Structure Overview](#command-structure-overview)

## Introduction

Easy Docker Container Updater is a Node.js script I originally wrote to streamline the update process for my containers when I was just starting out with Docker. 
Years later, it’s still reliably handling my container updates, so I decided to publish it as open-source.
This tool is designed for users who want a simple way to manage and update Docker containers—particularly on private NAS or home servers. 
It’s perfect for beginners or home server enthusiasts who want more control over their containers, or just anyone looking for a lightweight, 
“fire-and-forget” solution without having to dive into something like [Watchtower](https://github.com/containrrr/watchtower).

### Features
- **Centralized**: Manage all your container settings in a single place.
- **Flexible**: Define and reuse variables across multiple containers for a more uniform setup; particularly useful for use with [*arr](https://wiki.servarr.com) containers.
- **Lightweight**: Just a single script—no additional containers or advanced tools needed.
- **Schedule Updates and Receive Email Reports**: Schedule updating all your container, whenever *you* want it, with optional email update reports.
- **Ideal for NAS/Home Server Users**: Designed to be simple yet powerful for small-scale setups

### Example Usage
To update all your containers in succession:
```bash
./container-update.js --all
```
To update a specific container:
```bash
./container-update.js <container_name>
```

### Why not just use Watchtower?

By all means, if you use them; great! Then this script is not for you. Easy Docker Container Updater doesn't offer any new features or functionality that those management-tools lack. Instead, it’s designed specifically for users who find those tools overly complex or intimidating for their needs.

The main *'raison d'être'* for Easy Docker Container Updater is that I needed to break out of the constraints of Synology's native container manager, create a simple way to define container configurations with common parameters that I could use across multiple containers (such as path mappings), and have my containers update automatically without any intervention from me whatsoever. And make all this managable in one place.

## Requirements:
- Docker
- NodeJS (15.14.0 or higher)
- A text-editor to configure the script

## Installation
### Using Git
If you have Git installed, you can clone the repository inside the directory of your choice:
   ```bash
   git clone https://github.com/c-kick/easy-docker-container-updater.git
   cd easy-docker-container-updater
   npm install
   npm run config
   ```
> **Note:** The `npm` commands are optional, and just make the process of creating a config file a little bit easier. If you have no NPM installed, just follow step 2 below ('Manually') to complete the configuration.
### Manually
1. Download `container-update.js` and `container-config-example.js` and place them (together) in a directory of your choosing.
2. Copy and rename the example configuration file, `container-config-example.js`, to `container-config.js`, i.e:

   ```bash
   cp container-config-example.js container-config.js
   ```

## Configuration
> **Note:** See the [Reference section](#reference) for a description of all options you can use.

- Open `container-config.js` in a text editor and adjust the `options` object to fit your setup (the only required, and mandatory settings is `configBasePath`).
- Each container you wish to manage/update should be defined in the `containers` object. See the 'plex' container example inside `container-config-example.js`, and consult the [reference section](#container-configuration-entry) for a list of available settings.

## Usage

### Quick Start
Run the script with the following commands to update containers:

- **Update a Single Container**: `node container-update.js <container_name>`
- **Update All Containers**: `node container-update.js --all`

### Update A Single Container

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

This will run the `plex` container update process, using the `plexinc/pms-docker:public` image, regardless of an actual image update, while retaining the configuration you defined. Useful if you just want to quickly try out another image version. 

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

# Reference

## Options parameters
This is a description of all the available parameters you can (or must) enter in the `options` inside your `container-config.js`.

| Parameter      | Description                                                                                                                         | Required | Example              | Default              |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------|----------|----------------------|----------------------|
| configBasePath | The base path used to store container configurations. This path will be appended with `/<container-name>/config/` on container creation. If the path already exists, it will be used; otherwise, it will be created as an empty directory. | Yes      | `/volume1/docker`    | N/A                  |
| debug          | Global debug flag that controls if detailed debug messages are shown.                                                               | No       | `false`              | `false`              |
| logLevel       | Logging level. `0` shows all logs, `1` shows info, warnings, and errors, `2` shows warnings and errors, `3` shows only errors.      | No       | `1`                  | `1`                  |
| network        | Global network type for containers.                                                                                                 | No       | `'host'`             | `'host'`             |
| timezone       | Global timezone setting for containers.                                                                                             | No       | `'Europe/Amsterdam'` | `'Europe/Amsterdam'` |
| alwaysRun      | If true, the container will always run after updating, even if it was stopped before.                                               | No       | `false`              | `false`              |
| prune          | Global setting for removing unused containers after updating.                                                                       | No       | `true`               | `true`               |
| restart        | Global restart policy for containers (e.g., `'always'`, `'unless-stopped'`).                                                        | No       | `'on-failure'`   	 | `'unless-stopped'`   |
| PUID           | User ID to set the Docker container user.                                                                                           | No       | `1234`               | `1000`               |
| PGID           | Group ID to set the Docker container group.                                                                                         | No       | `56789`              | `1000`               |
| email_from     | Sender email address for update reports.                                                                                            | No       | `'from@example.com'` | `null`               |
| email_to       | Receiver email address for update reports.                                                                                          | No       | `'to@example.com'`   | `null`               |
| sendmail       | Path to the `sendmail` executable, typically does not need modification.                                                            | No       | `'/usr/sbin/sendmail'` | `'/usr/sbin/sendmail'` |

## Container configuration entry
These are the assignable parameters for each container entry in `containers` inside your `container-config.js`.

| Parameter      | Description                                                                                           | Required | Example                         | Default  |
|----------------|-------------------------------------------------------------------------------------------------------|----------|---------------------------------|----------|
| name           | The name to use for this container.                                                                   | Yes      | `'plex'`                        | N/A      |
| debug          | Debug override for this container. If `true`, commands are output to the console instead of being run. | No       | `true`                          | `false`  |
| image          | The repository and image to use for the container.                                                    | Yes      | `'plexinc/pms-docker:plexpass'` | N/A      |
| alwaysRun      | If `true`, forces the container to run even if it was stopped before updating.                        | No       | `false`                         | `false`  |
| arguments      | Arguments to pass to the `docker create` command for container setup.                                 | No       | See the `arguments` parameters below        | N/A      |

#### The `arguments` section

| Parameter      | Description                                                                                           | Required | Example                         | Default  |
|----------------|-------------------------------------------------------------------------------------------------------|----------|---------------------------------|----------|
| net            | Network mode for the container (e.g., 'bridge', 'host').                                              | No       | `'bridge'`                      | `network` value as defined in `options` |
| p              | Port mapping-sets specified as `[host-side-port, container-side-port]` inside an array `[]`.          | No       | `[[32400, 32400], [80, 8080]]`  | `[]`     |
| v              | Volume mapping-sets as `[host-path, container-path]` inside an array `[]`.                            | No       | `[['/my-custom/path-1', '/path-1/'], ['/my-custom/path-2', '/path-2/']]` | `[]` |
| e              | Environment variables specified as key-value pairs.                                                   | No       | `{ TZ: 'Europe/Amsterdam', PLEX_UID: 1234, PLEX_GID: 45678 }` | `{}` |
| device         | Device mapping-sets as `[host-device, container-device]` inside an array `[]`.                        | No       | `[['/dev/dri', '/dev/dri']]`    | `[]`     |
| privileged     | Whether to run the container in privileged mode.                                                      | No       | `false`                         | `false`  |
| memory         | Memory limit for the container (e.g., '768m').                                                        | No       | `'768m'`                        | N/A      |
| restart        | Restart policy for the container (e.g., 'always', 'unless-stopped').                                  | No       | `'always'`                      | `restart` value as defined in `options` |
| whatever	 | You can keep adding parameters if you want, such as `gpus`, they should be processed into the docker create command automagically. If they are boolean `true` values, they are passed as `--whatever`, else as `--whatever=whateveryouwant` pairs.  | No       | `'whateveryouwant'`                      | N/A      |

## Command Structure Overview
Here are the main parameters you can use with `container-update.js`:

```bash
node container-update.js <container> <image> <forced>
```

| Parameter       | Description                                                                                         | Required | Example                           |
|-----------------|-----------------------------------------------------------------------------------------------------|----------|-----------------------------------|
| `<container>`   | The name of the container to update. You can also pass `--all` to update all configured containers. | Yes      | `plex`, `--all`                   |
| `<image>`       | (Optional) Specify an alternate Docker image (`repository:image`) to use for the container update.  | No       | `plexinc/pms-docker:latest`       |
| `<forced>`      | (Optional) Set to `true` to force-update a container, even if no new image is available.            | No       | `true`                            |
