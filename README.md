# 🐳 Easy Docker Container Updater
Easy Docker Container Updater is a NodeJS script which offers an extremely simple way to automate updates to Docker containers, running or not. It is aimed especially at users with limited knowledge of Docker, who run containers on their own (NAS) server.

## Requirements:
- NodeJS
- A text-editor to configure the script

## Basic configuration
First, adjust the `options` object to fit your configuration.

```JavaScript
const options = {
	// email report options
	email_from:	'docker_updater@your-domain.com', //the e-mail address that will be used as a sender address for the update report
	email_to:	'your-email@domain.com', //the e-mail address that will receive the update report
	sendmail: 	'/usr/sbin/sendmail', //the path to your sendmail binary (you probably don't need to change this)

	// Configure the user:group id's for the user that runs the Docker containers here.
	// Based on best practices with linuxserver.io containers.
	// These are *always* passed to the container as environment variables,
	// unless specifically overridden in an individual container configuration
	PUID : 		1027,
	PGID : 		100,

	// Path where you store all your container configurations. Will be used to store
	// configurations as: '<base_config>/<container-name>/config/'
	base_config:	'/volume/my-docker-configs',

	// configure path variables, useful for repetitive configurations,
	// or for example to create requalized configurations in Servarr containers
	video : 	'/volume/my-videos',
	movies : 	'/volume/my-videos/movies',
	series : 	'/volume/my-videos/series',
	music : 	'/volume/my-music',
	downloads : 	'/volume/my-downloads',

	// configure the default network type
	// (global setting, ignored when set in individiual container configuration)
	network : 	'host',

	// configure the default restart policy
	// (global setting, ignored when set in individiual container configuration)

    	restart:	'unless-stopped', //or 'always'

	// configure the default timezone
	// (global setting, ignored when set in individiual container configuration)
    	timezone:	'Europe/Amsterdam',

	// configure the default alwaysrun policy
	// (global setting, ignored when set in individiual container configuration)
	alwaysrun:	false,

    	// Enable this to prune dead containers after updating *all* (--all)
    	prune:		true,

    	// set debugging true to show the commands that will be executed, but don't execute them
    	debug:		false,

	// Set default logging level. 0 = show all, 1 = only warnings & errors, 2 = only errors
	logLevel:	1, 
}
```

### Optional: helper object
You can consider creating another helper-object, for example to define preset path mappings, useful for *arr containers, so they have a uniform data-structure, according to [Servarr best practices](https://wiki.servarr.com/):

```JavaScript
const servarr_options = {
    downloads:  [options.downloads, '/data/downloads/'],
    movies:     [options.movies,    '/data/films/'],
    series:     [options.series,    '/data/series/'],
    music:      [options.music,     '/data/music/'],
    memlimit:   '786m',
}
```
### Container configurations
Then, enter your container configurations in the `container` object. A basic container entry looks like this:

```JavaScript
const containers = {

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
	          servarr_options.downloads,
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

	//Add more configurations as needed
}
```

## Running the script

Considering the above example options and configuration, running the command

```JavaScript
./container-update.js plex
```

will:
- Check if a container entry named `plex` exists inside the `containers` object,
- Check if a container named `plex` exists in Docker,
- Check if a container config path named `/volume/my-docker-configs/plex/config` exists,
- Download the `plexinc/pms-docker:plexpass` image,
- Check if the image is up to date or has been updated, and if it is;
	- Stop and delete the old `plex` container,
	- Recreate it with the config defined for `plex` inside the `containers` object:
		- maps the `/my-custom/path-1` directory of the host to the `/path-1/` directory in the container,
		- maps a preset path mapping, `downloads`, as defined in the optional `servarr_options` helper object,
		- sets the timezone to `Europe/Amsterdam`, and specifies the `PLEX_UID` and `PLEX_GID` variables to user `1234` and group `56789`,
		- maps all devices inside `/dev/dri` on the host to the same path in the container,
		- sets the container to run with elevated rights (`privileged`)
		- limits the container's max memory usage to `768` MB (ignoring the global setting in `options`),
		- sets an `always` restart policy (ignoring the global setting in `options`).
	- If there was no container 'plex' in Docker to begin with, it will be created,
	- The container is then started if it already existed and was running before the update,
- If the container was actually updated, an e-mail is dispatched with the update summary, 
  if a recipient was entered in `email_to` inside the `options` object.

### Update all

Considering all the above, running the command

```JavaScript
./container-update.js --all
```

Will do the same as above, but for **all** containers configured in `containers`

## Command structure overview

```JavaScript
./container-update.js <container> <image> <forced>
```

Breakdown:
- `./container-update.js` - The (path to) the Easy Docker Container Updater script
- `<container>` - The name of the container to update.
  - You can also pass `--all` here, to update *all* configured containers.
- `<image>` - (optional) The name of the repository:image to use. Use this to override the one configured in `containers`.
- `<forced>` - (optional) Set `true` if you want to force-update a container, even when its image has no available update.


## What it does
