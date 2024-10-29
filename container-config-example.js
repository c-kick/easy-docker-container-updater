/*
EASY DOCKER CONTAINER UPDATER v2.0 - CONTAINER CONFIGURATION FILE
(c)2018-2024 by Klaas Leussink / hnldesign.nl
Usage: see README.md or https://github.com/c-kick/easy-docker-container-updater/#reference

Make sure you remove '-example' from the filename when you're done!

*/

// REQUIRED - Options for Ease Docker Container Updater
const options = {
  // ---- REQUIRED settings ----
  configBasePath: '/volume1/docker', // The base path that will be used to store your container configs.
  // This path will be appended with '/<container-name>/config/' on container creation and assigned to the '/config' path of the container.
  // If the path already exists for the container, it will be used, else it will be created (as an empty directory).

  // ---- OPTIONAL settings ----
  debug:      false,                // Global debug flag (default: false)
  logLevel:   1,                    // Logging level. 0 = show all, 1 = only info, warnings & errors, 2 = only warnings & errors, 3 = only errors (default: 1)

  network:    'host',               // Global network type for containers (default: 'host')
  timezone:   'Europe/Amsterdam',   // Global timezone (default: 'Europe/Amsterdam')
  alwaysRun:  false,                // Global alwaysRun value (default: false)
  prune:      true,                 // Global setting for removing unused containers after updating (default: true)
  restart:    'unless-stopped',     // Global restart policy (default: 'unless-stopped')

  PUID:       1000,                 // Set to your Docker user's ID
  PGID:       1000,                 // Set to your Docker user's group ID
  // If specified, and not overwritten in an individual container config, PUID an dPGID will always be set in the container create command.
  // To read more about why this is, head over to https://docs.linuxserver.io/general/understanding-puid-and-pgid/

  email_from: 'from@example.com',   // Sender address for update reports (default: null)
  email_to:   'to@example.com',     // Receiver address for update reports (default: null)
  sendmail:   '/usr/sbin/sendmail', // Path to sendmail executable, you will likely not need to change this (default: /usr/sbin/sendmail)

};

// OPTIONAL - object to store your paths, to centralize container management.
const paths = {
  downloads: '/path/to/downloads',  // Directory for downloads
  video:     '/path/to/video',      // Video directory

  // Add other directories as needed...
};

// OPTIONAL - intermediate object to make configurations more uniform and easier to maintain.
// This is basically an object with 'pre-mapped' paths that assign both the host path and the container path.
// This allows you to use the exact same mappings for certain directories across multiple containers, and maintain them in one single place: here.
// I've introduced this object to help create consistent *arr container configurations (see https://wiki.servarr.com/)
const servarr_options = {
  downloads: [paths.downloads, '/data/downloads/'],
  memlimit:  '786m',
}

// REQUIRED - Container configurations
const containers = {

  // EXAMPLE CONFIGURATION:
  // The name to use for this container
  'plex': {

    // OPTIONAL - Debug override - If set to true, this override the global debug flag, specifically for this container,
    // and will NOT actually run any docker-commands, and instead outputs the commands to the console
    // (useful for testing your configuration).
    debug: true,

    // The repository & image to use
    image: 'plexinc/pms-docker:plexpass',

    // Set alwaysRun - if true, this will force the container to run, even when it was stopped prior to updating
    alwaysRun: false,

    // The arguments that will be passed to 'docker create'
    // Note: all these arguments are optional.
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

  // Add more containers here...
};

//don't change this!
module.exports = {
  options,
  containers
}