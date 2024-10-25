#!/usr/bin/env node
/*
EASY DOCKER CONTAINER UPDATER v2.0
(c)2018-2024 by Klaas Leussink / hnldesign.nl
Usage: see README.md or https://github.com/c-kick/easy-docker-container-updater
*/

const configFile = './container-config.js';
let importedOptions = {};
let containers = {};

const {execSync, spawn} = require('child_process');
const fs = require('fs');
const logCache = [];

/**
 * Logger utility for colorized, leveled, and conditionally stored console messages.
 * Provides methods for logging (`log`, `info`, `warn`, `error`) at different levels
 * with optional color and configuration settings. Messages are stored in `logCache`,
 * so this needs to be defined outside the logger.
 *
 * Usage:
 * logger.log('My message', {override: true, color: 'cyan'});
 *
 * @typedef {Object} LoggerOptions - Options for log customization.
 * @property {string} [color='white'] - Color of the log message. Uses ANSI color codes, or falls back to a basic color if unsupported.
 * @property {boolean} [override=false] - Forces logging regardless of the current log level.
 * @property {boolean} [debug=false] - Enables debug mode for additional log details.
 * @property {number} [logLevel=0] - Minimum log level required to output the message.
 *
 * @property {Function} log - Logs a message at the default log level (0).
 * @property {Function} info - Logs an informational message at level 0.
 * @property {Function} warn - Logs a warning message at level 1.
 * @property {Function} error - Logs an error message at level 2.
 *
 * @param {string} msg - The message to log.
 * @param {LoggerOptions} [options={}] - Optional settings for color, override, and debug level.
 */
const logger = {
  colors: {
    reset: "\x1b[0m",
    // Standard and Bright Colors
    black:         "\x1b[30m", red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", blue: "\x1b[34m",
    magenta:       "\x1b[35m", cyan: "\x1b[36m", white: "\x1b[37m", brightBlack: "\x1b[90m",
    brightRed:     "\x1b[91m", brightGreen: "\x1b[92m", brightYellow: "\x1b[93m", brightBlue: "\x1b[94m",
    brightMagenta: "\x1b[95m", brightCyan: "\x1b[96m", brightWhite: "\x1b[97m",

    // Background Colors
    bgBlack:       "\x1b[40m", bgRed: "\x1b[41m", bgGreen: "\x1b[42m", bgYellow: "\x1b[43m",
    bgBlue:        "\x1b[44m", bgMagenta: "\x1b[45m", bgCyan: "\x1b[46m", bgWhite: "\x1b[47m",
    bgBrightBlack: "\x1b[100m", bgBrightRed: "\x1b[101m", bgBrightGreen: "\x1b[102m", bgBrightYellow: "\x1b[103m",
    bgBrightBlue:  "\x1b[104m", bgBrightMagenta: "\x1b[105m", bgBrightCyan: "\x1b[106m", bgBrightWhite: "\x1b[107m",

    // 256-Color Approximations
    orange:    "\x1b[38;5;214m", pink: "\x1b[38;5;205m", lightGreen: "\x1b[38;5;120m",
    lightBlue: "\x1b[38;5;81m", purple: "\x1b[38;5;135m"
  },
  // Mapping 256-color names to basic colors for fallbacks
  colorFallbacks: {
    orange:     'yellow',
    pink:       'magenta',
    lightGreen: 'green',
    lightBlue:  'cyan',
    purple:     'magenta'
  },
  /**
   * Checks if the terminal supports 256-color mode based on environment variables.
   * @returns {boolean} - True if 256-color mode is supported; otherwise false.
   */
  supports256Colors: function () {
    const term = process.env.TERM || '';
    const colorterm = process.env.COLORTERM || '';
    return term.includes('256color') || colorterm === 'truecolor' || colorterm === '24bit';
  },
  /**
   * Applies color to the provided text based on the selected color and terminal support.
   * @param {string} text - The text to colorize.
   * @param {string} [color='white'] - The color to apply.
   * @returns {string} - The colorized text with ANSI codes.
   */
  colorize(text, color = 'white') {
    const use256 = this.supports256Colors();
    const chosenColor = this.colors[color] || (use256 ? this.colors[color] : this.colors[this.colorFallbacks[color]]) || this.colors.white;
    return `${chosenColor}${text}${this.colors.reset}`;
  },
  /**
   * Logs a message at the specified level with optional color and debug options.
   * @param {string} msg - The message to log.
   * @param {number} [level=0] - The log level (0: log, 1: warn, 2: error).
   * @param {Object} [options={}] - Options for color, override, and log level.
   * @param {string} [options.color='white'] - The color to apply to the message.
   * @param {boolean} [options.override=false] - If true, forces logging regardless of level.
   * @param {number} [options.logLevel=0] - Minimum log level required to output the message.
   */
  logWithLevel: function (msg, level, options = {}) {
    const {color, override = false, logLevel = 0} = options;

    // Check log level and only log if allowed
    if (logLevel <= level || override) {
      // Check for 256-color support and apply fallback if necessary
      logCache.push(msg);

      // Choose the console method based on log level
      const consoleMethod = level === 2 ? console.error : level === 1 ? console.warn : console.log;
      consoleMethod(this.colorize(msg, color));
    }
  },
  log(msg, options = {}) {
    this.logWithLevel(msg, 0, options);
  },
  info(msg, options = {}) {
    this.logWithLevel(msg, 0, options);
  },
  warn(msg, options = {}) {
    this.logWithLevel(msg, 1, {...options, color: 'orange'});
  },
  error(msg, options = {}) {
    this.logWithLevel(msg, 2, {...options, color: 'red'});
  }
}


try {
  ({options: importedOptions, containers} = require(configFile));
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    logger.error(`Error: '${configFile}' not found. Can't continue.`);
    process.exit(1);
  } else {
    // Handle other errors or rethrow
    throw error;
  }
}

const options = {
  ...{
    network:   'host',
    timezone:  'Europe/Amsterdam',
    alwaysRun: false,
    prune:     true,
    debug:     false,
    logLevel:  1,
    restart:   'unless-stopped',
  }, ...importedOptions
};

/**
 * Checks if a Docker container exists.
 * @param {string} containerName - The name of the container to check.
 * @returns {boolean} - True if the container exists; false otherwise.
 */
function containerExists(containerName) {
  try {
    execSync(`docker inspect ${containerName}`, {stdio: 'pipe'});
    return true;
  } catch (error) {
    // Specifically handle "No such object" error from Docker
    if (error.message.includes(`No such object: ${containerName}`)) {
      return false;
    }
    // Re-throw if it's a different error
    throw error;
  }
}

/**
 * Checks if a Docker container is currently running.
 * @param {string} containerName - The name of the container to check.
 * @returns {boolean} - True if the container is running; false otherwise.
 */
function isContainerRunning(containerName) {
  try {
    // Capture the result of the docker inspect command
    const result = _execSync(`docker inspect --format="{{ .State.Running }}" ${containerName} 2> /dev/null`, {debug: false}).toString().trim();
    // Convert the result to a boolean
    return result === 'true';
  } catch (error) {
    // If the command fails, assume the container is not running
    return false;
  }
}

/**
 * Stops a Docker container.
 * @param {string} containerName - The name of the container to stop.
 * @param {boolean} debug - Whether to enable debug logging.
 */
function stopContainer(containerName, debug = false) {
  _execSync(`docker stop ${containerName}`, {
    debug,
    success: () => logger.log(`Container stopped.`)
  });
}

/**
 * Removes a Docker container.
 * @param {string} containerName - The name of the container to remove.
 * @param {boolean} debug - Whether to enable debug logging.
 */
function removeContainer(containerName, debug = false) {
  _execSync(`docker rm ${containerName}`, {
    debug,
    success: () => logger.log(`Container removed.`)
  });
}

/**
 * Creates a new Docker container with specified configuration.
 * @param {string} containerName - The name of the container to create.
 * @param {Object} container - The configuration for the container.
 */
function createContainer(containerName, container) {
  const {debug: containerDebug, image, arguments, network, configDir} = container;
  // Construct arguments
  let argumentString = '';
  const args = arguments ?? {};

  if (!args.e) args.e = [];
  //always set PGID and PUID, if defined in options or container arguments
  const groupUser = ['PGID', 'PUID'];
  if (groupUser.some(item => args.e.includes(item) || Object.keys(options).includes(item))) {
    groupUser.forEach((item) => {
      const exists = args.e.some(pair => pair[0] === item);
      if (!exists) {
        const value = args[item] ?? options[item];
        args.e.push([item, value]);
      }
    });
  }

  //loop through arguments
  Object.entries(args).forEach(([key, value]) => {
    let param = ((key.length === 1) ? '-' : ((key.length > 1) ? '--' : '')) + key;
    let separator = (['e', 'memory', 'restart'].includes(key)) ? '=' : ':';
    if (typeof value == 'boolean') {
      argumentString += `${param} `;
    } else if (typeof value == 'string') {
      argumentString += `${conditionalQuote(param)}${separator}${conditionalQuote(value)} `;
    } else if (typeof value == 'object') {
      value.map(([key, val]) => {
        argumentString += `${param} ${conditionalQuote(key)}${separator}${conditionalQuote(val)} `;
      }).join(' ');
    }
  })

  const createCmd = `docker create --name=${containerName} --net=${(network ?? options.network)} ${((args && args.e && args.e.some(pair => pair[0] === 'TZ')) ? '' : `-e TZ=${options.timezone}`)} -v "${configDir}:/config/" ${argumentString.trim()} ${(args && args.restart ? '' : `--restart=${options.restart}`)} ${image}`;
  _execSync(createCmd.replace(/\s+/g, ' '), {
    debug:   (containerDebug ?? options.debug),
    success: (output) => {
      logger.log(`Container created.`, {override: true});
    }
  });
}

/**
 * Updates a single container by pulling the latest image and recreating it if necessary.
 * @param {string} containerName - The name of the container to update.
 * @param {string|boolean} [forcedImage=false] - The image to force update, if specified.
 * @param {boolean} [forcedUpdate=false] - If true, forces an update regardless of image status.
 * @returns {number} - 1 if updated, 2 if no update, 0 if update failed.
 */
function updateContainer(containerName, forcedImage, forcedUpdate = false) {

  const container = containers[containerName];
  logger.log(`Container: '${containerName}'`, {override: true});

  if (!container) {
    logger.error(`❌\tError: No configuration found for container '${containerName}'. No soup for you.\n`);
    return;
  } else if (container.debug) {
    logger.warn(`\n⚠ Note: Container config has debugging enabled!\nOnly showing commands, not running them.\n`, {override: true});
  }

  container.configDir = `${options.configBasePath}/${containerName}/config`;
  container.image = (typeof forcedImage === 'string' ? forcedImage : null) || container.image

  const debug = (container.debug ?? options.debug);
  const exists = containerExists(containerName);
  const wasRunning = exists ? isContainerRunning(containerName) : false;

  // Check if config directory exists, create if not
  if (!fs.existsSync(container.configDir)) {
    fs.mkdirSync(container.configDir, {recursive: true});
    logger.warn(`⚠ Config directory didn't exist, so was created`, {override: debug});
  } else {
    logger.log(`Config directory exists.`, {override: debug});
  }

  if (!container.image.toLowerCase().includes(containerName.toLowerCase())) {
    logger.warn(`\n⚠ Warning: there seems to be a mismatch in the container's name ('${containerName}')\nand the image used ('${container.configDir}').\nCheck your configuration, or ignore this warning if you are sure.\n`, {override: debug});
  }

  // Pull the latest image
  try {
    logger.log(`Checking for image update...`, {override: debug});
    const pullResult = _execSync(`docker pull ${container.image}`, {debug}).toString();
    const hasUpdate = !pullResult.includes('up to date');
    const updateMsg = `${hasUpdate ? '' : 'No '}update available${(hasUpdate) ? '!' : '.'}`;
    logger.log(`${updateMsg.charAt(0).toUpperCase() + updateMsg.slice(1)}`, {override: true});

    if (hasUpdate || forcedUpdate || !exists || forcedImage) {
      if (forcedUpdate) {
        logger.warn(`Update was forced!`, {override: true});
      }
      // If update found or forced, remove existing container and recreate

      if (exists) {
        if (wasRunning) {
          logger.log(`Container running, so start after update.`, {override: debug});
        } else {
          logger.log(`Container not running. ${(container.alwaysRun ?? options.alwaysRun) ? `Will start after update.` : ''}`, {override: debug});
        }
      }

      try {
        if (exists) {
          if (wasRunning) {
            stopContainer(containerName, debug);
          }
          removeContainer(containerName, debug);
        } else {
          logger.warn(`Container does not exist.`, {override: debug});
        }
      } catch (error) {
        logger.error(`Something went wrong: ${error.message}`);
        return 0;
      }

      // Create the new container
      createContainer(containerName, container);

      // Start the container if set, or if not set check default option
      if ((container.alwaysRun ?? options.alwaysRun) || wasRunning) {
        _execSync(`docker start ${containerName}`, {
          debug, success: (output) => {
            logger.log(`Container started.`);
          }
        });
      }
      logger.log(`Container '${containerName}' was updated!`, {override: true, color: 'lightGreen'});
      logger.log('————————————————————————————————————\n', {override: true});
      return 1;
    } else {
      logger.log('————————————————————————————————————\n', {override: true});
      return 2;
    }
  } catch (err) {
    logger.error(`Container '${containerName}' update failed: ${err.message}\n`, {override: debug});
    console.error(err);
    return 0;
  }
}

/**
 * Updates all containers defined in the configuration.
 * @param {boolean} [forced=false] - If true, forces an update for all containers.
 */
async function updateAllContainers(forced = false) {
  try {
    logger.log('Updating all containers...\n', {override: true});

    // Object to store the update results
    const updateResults = {
      success: 0,  // Counter for successful updates
      failed:  0,   // Counter for failed updates
      total:   0     // Total containers processed
    };

    for (const containerName of Object.keys(containers)) {
      const result = await updateContainer(containerName, forced);

      // Increment the total containers processed
      updateResults.total++;

      // Check if the updateContainer returned true or false
      if (result === 1) {
        updateResults.success++;
      } else if (!result) {
        updateResults.failed++;
      }
    }

    if (options.prune && updateResults.success) {
      logger.log("\nContainers updated, now pruning...", {override: true});
      _execSync(`docker image prune -a`, {
        success: (output) => {
          logger.log(`Pruning done!\n`, {override: true});
        }
      });
    }

    // Log the results
    logger.log(`${updateResults.total} Containers processed -- summary:`, {override: true});
    logger.log('————————————————————————————————————', {override: true});
    logger.log(`${updateResults.success} updated, ${updateResults.failed} failed.\n`, {override: true});

  } catch (error) {

    logger.error(`Error updating all containers: ${error.message}`);

  }

}

/**
 * MIME-encodes a string for use in email headers.
 * @param {string} text - The text to MIME-encode.
 * @returns {string} - The MIME-encoded string.
 */
function mimeEncodeHeader(text) {
  return `=?UTF-8?B?${Buffer.from(text, 'utf8').toString('base64')}?=`;
}

/**
 * Dispatches an email report summarizing the update process.
 * @param {Function} [callback=null] - Optional callback function to handle email send status.
 */
function dispatchMailReport(callback = null) {
  const to = options.email_to;
  if (!to) return;
  const sendmailPath = options.sendmail;
  const email = `From: ${mimeEncodeHeader('🐳')} Easy Docker Container Updater <${options.email_from}>
To: ${to}
Subject: Update report
Content-type: text/html; charset=UTF-8

<pre style=\"font-family:monospace,Consolas;font-size:12px;\">${logCache.join('\n')}</pre>`.trim();

  if (options.debug) {
    logger.log(`> Email report:`, {color: 'orange'});
    logger.log(to, {color: 'cyan'});
    logger.log(sendmailPath, {color: 'yellow'});
    logger.log(email);
  } else {
    // Spawn the sendmail process
    const sendmail = spawn(sendmailPath, ['-t']);

    // Write the email body to sendmail's stdin
    sendmail.stdin.write(email);
    sendmail.stdin.end();

    // Handle the output or error
    sendmail.on('close', (code) => {
      if (typeof callback === 'function') {
        callback(code);
      } else {
        if (code === 0) {
          console.log('Email sent successfully.');
        } else {
          console.error(`Sendmail process exited with code ${code}`);
        }
      }
    });

    sendmail.on('error', (error) => {
      console.error(`Failed to send email: ${error.message}`);
    });
  }
}

/**
 * Executes a shell command with additional success and failure handling.
 * @param {string} cmd - The command to execute.
 * @param {Object} [args={}] - Optional arguments for callbacks and debugging.
 * @param {Function} [args.success=null] - Callback on successful execution.
 * @param {Function} [args.fail] - Callback on failed execution.
 * @returns {string|boolean} - The result of the command or true if debug mode is enabled.
 * @throws Will throw an error if the command fails in non-debug mode.
 */
function _execSync(cmd, args = {}) {
  const {
    success = null,
    fail = (error) => logger.error(`Something went wrong: ${error.message}`)
  } = args;

  if (options.debug || args.debug) {
    // Log the command for debugging purposes if debug is enabled
    const regex = /(\s+)(?=-)/g;
    logger.info(`> "${cmd.replace(regex, '\n    ').trim()}"`, {override: true, color: 'orange'});
    //fake success
    if (typeof success === 'function') {
      success();
    }
    return true;
  } else {
    try {
      // Execute the command and return the result
      const result = execSync(cmd).toString().trim();
      // If a success callback is provided, call it with the result
      if (typeof success === 'function') {
        success(result);
      }
      return result;
    } catch (error) {
      // If a fail callback is provided, call it with the error
      if (typeof fail === 'function') {
        fail(error);
      }
      throw error;
    }
  }

}

/**
 * Wraps a value in quotes if it contains spaces.
 * @param {string|*} value - The value to wrap in quotes if needed.
 * @returns {string|*} - The quoted value if it contains spaces, or the original value.
 */
function conditionalQuote(value) {
  return ((typeof value == 'string') && value.includes(' ')) ? `"${value}"` : value;
}


// Entry point checks and command line argument handling
const containerToUpdate = process.argv[2];
const forceUpdate = (process.argv[3] === 'true' || process.argv[4] === 'true');
const forceImage = process.argv[3] !== ('true' || 'false') ? process.argv[3] : '';

logger.log('\n————————————————————————————————————', {override: true});
logger.log('🐳 Easy Docker Container Updater 2.0', {override: true, color: 'cyan'});
logger.log('     © 2018-2024 Klaas Leussink     ', {override: true});
logger.log('————————————————————————————————————\n', {override: true});

if (!containerToUpdate) {
  logger.error('Error: Container not specified. No soup for you\n');
  logger.error('Usage: ./container-update.js <container> <image> <forced>\n');
  process.exit(1);
}

if (containerToUpdate === '--all') {
  updateAllContainers(forceUpdate).then(() => {
    dispatchMailReport((code) => {
      if (!code) {
        logger.log(`Done. 📨 Report sent. 👋 Bye!\n`, {override: true});
        process.exit(0);
      } else {
        logger.error(`Done, but mail failed: ${code}`);
        process.exit(1);
      }
    });
  });
} else if (containerToUpdate === '--help') {
  logger.error('Usage: ./container-update.js <container> <image> <forced>\n');
  process.exit(0);
} else {
  if (updateContainer(containerToUpdate, forceImage, forceUpdate) === 1) {
    //was updated
    dispatchMailReport((code) => {
      if (!code) {
        logger.log(`Done. 📨 Report sent. 👋 Bye!\n`, {override: true});
        process.exit(0);
      } else {
        logger.error(`Done, but mail failed: ${code}`);
        process.exit(1);
      }
    });
  } else {
    //not updated
    logger.log(`Done. 👋 Bye!\n`, {override: true});
  }
}
