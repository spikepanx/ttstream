const { EventEmitter } = require('events');
const { Transform } = require('stream');
// @ts-ignore
const { Worker } = require('worker_threads'); // eslint-disable-line

const numCores = require('os').cpus().length;

/**
 * @description StreamWorker
 * @class StreamWorker
 * @extends {Worker}
 */
class StreamWorker extends Worker {
  constructor(path, options) {
    super(path, options);
    this.foo = 'bar';
  }
}

/**
 * @description instantiates a StreamWorker
 * @param {string} path absolute or relative path to worker sourcecode file
 * @param {NodeJS.EventEmitter} coordinator the magic coordinator
 * @param {*} [options={}] thread options
 * @returns {StreamWorker} instance of StreamWorker
 */
function getWorker(path, coordinator, options = {}) {
  const worker = new StreamWorker(path, options);
  const { threadId } = worker;

  worker.on('online', data => coordinator.emit('online', { threadId, data }));
  worker.on('message', data => coordinator.emit('message', { threadId, data }));
  worker.on('error', data => coordinator.emit('error', { threadId, data }));
  worker.on('exit', data => coordinator.emit('exit', { threadId, data }));

  return worker;
}

function transform(chunk, enc, cb) {}

function flush(cb) {}

/**
 * @description
 * @param {any} options foobar options
 * @property {number=} options.count how many threads, defaults to os.cpus.length
 * @property {string} options.path path to worker code
 * @property {any} options.options thread options
 * @param {NodeJS.ReadWriteStream} streamOptions transform stream options
 * @returns {NodeJS.ReadWriteStream} transform stream
 */
function getThreadedTransformStream(options, streamOptions) {
  const {
    count = numCores,
    path,
    options: workerOptions,
  } = options;

  const opts = {
    transform,
    flush,
    streamOptions,
  };

  const coordinator = new EventEmitter();
  coordinator.on('online', (value) => {
    const { threadId, data } = value;

    return console.log(`thread ${threadId} is online: ${data}`);
  });

  const workers = [].fill(getWorker(path, coordinator, workerOptions), 0, count);



  return new Transform(opts);
}

module.exports = {
  getWorker,
  getThreadedTransformStream,
};
