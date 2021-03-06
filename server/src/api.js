const express = require('express');
const albumUploader = require('./album-uploader');
const {errors, sendError} = require('./errors');

const {OK, CREATED} = require('http-status-codes');

const {
  UNKNOWN_ERROR,
  NOT_FOUND
} = errors;

const API_VERSION = 'v0.0.1';

module.exports = (store, config) => {
  const router = express.Router();

  router
    .route('/')
    .get((req, res) => {
      res.send(`Album API ${API_VERSION}'`);
    });

  router
    .route('/upload')
    .post(albumUploader(config.get('upload')));

  router
    .route('/album')
    .get((req, res) => {
      store.getAll(onStoreResponse(res, OK));
    })
    .post((req, res) => {
      const item = req.body;
      store.add(item, onStoreResponse(res, CREATED));
    });

  router
    .route('/album/:picId')
    .get((req, res) => {
      const id = +req.params.picId;
      store.getById(id, onStoreResponse(res, OK));
    })
    .put((req, res) => {
      const id = +req.params.picId;
      const item = req.body;
      store.update(id, onStoreResponse(res, OK));
    })
    .delete((req, res) => {
      const id = +req.params.picId;
      store.remove(id, onStoreResponse(res, OK));
    });

  /**
   * Error handling middleware. These will be quite
   * bad errors that other layers didn't handle. For example
   * programming errors.
   */
  router.use(((err, req, res, next) => {
    console.error(err.stack);
    sendError(res, UNKNOWN_ERROR, err.message);
  }));

  return router;
};

const onStoreResponse = (res, successCode) => {
  return (err, data) => {
    if (!err) {
      res.status(successCode).json(data);
      return;
    }

    /**
     * Similarly we could distinguish other errors
     * in the same switch and return well-explained
     * errors to calling clients with the relevant
     * error codes.
     */
    switch (err.name) {
      case 'ItemNotFound':
        sendError(res, NOT_FOUND, err.message);
        break;
      default:
        sendError(res, UNKNOWN_ERROR, err.message);
        break;
    }
  }
};
