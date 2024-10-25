# 🐳 Easy Docker Container Updater
Easy Docker Container Updater is a NodeJS script which offers an extremely simple way to automate updates to Docker containers, running or not. It is intended specifically for users with limited knowledge of Docker, who run containers on their (private NAS) server and want a fire-and-forget update solution. 

It is particularly useful for those running a large amount of [*arr](https://wiki.servarr.com) containers. 

## Requirements:
- NodeJS (v8.0.0 or higher)
- A text-editor to configure the script

## Installation
1. Download `container-update.js` and `container-config-example.js` and place them (together) in a directory of your choosing.
	- Alternativeley, you can clone the repository inside the directory of your choice:
   ```bash
   git clone https://github.com/c-kick/easy-docker-container-updater.git
   cd easy-docker-container-updater
   npm install
   ```
2. Copy and rename the example configuration file, `container-config-example.js`, to `container-config.js`, i.e:
	```
	cp container-config-example.js container-config.js
	```
3. Open `container-config.js` with a text-editor and first adjust the `options` object to fit your configuration. The file is annotated, so should be self-explanatory.
The actual configurations for each container reside in the `container` object.
   - Note: you can basically assign anything you want to the `arguments` object inside each container configuration entry; it will eventually get flattened into a `docker create` command.

## Usage examples

### Updating containers

Running the command

```bash
node container-update.js plex
```

Will:
- Check if a container entry named `plex` exists inside the `containers` object in `container-config.js`,
- Check if a container named `plex` exists in Docker,
- Check if a container config path for the container exists, and if not create it,
- Download the `plexinc/pms-docker:plexpass` image,
- Check if the image is up-to-date or has been updated, and if it is;
	- Stop and delete the old `plex` container,
	- (Re)create a `plex` container based on the config defined for `plex` inside the `containers` object in `container-config.js`,
	- Start the container if it existed and was already running before the update (or run it if `alwaysRun` is `true`),
- If the container was actually updated, an e-mail is dispatched with the update summary, 
  if a recipient was entered in `email_to` inside the `options` object.

### Update all containers

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

## Command structure overview

```bash
node container-update.js <container> <image> <forced>
```

Breakdown:
- `./container-update.js` - The (path to) the Easy Docker Container Updater script
- `<container>` - The name of the container to update.
  - You can also pass `--all` here, to update *all* configured containers.
- `<image>` - (optional) The name of the repository:image to use. Use this to override the `image` configured for this container in the `containers` object in `container-config.js`.
- `<forced>` - (optional) Set `true` if you want to force-update a container, even when its image has no available update.

### Notes
- If you don't want any e-mail reports, blank out the `email_to` option (or set it to `null`) in  the `options` in `container-config.js`.
- If you have many containers configured, but want to debug just one of them, you can override the global `debug` flag from *inside* a container config. Just set `debug : true` in the container's config entry.
