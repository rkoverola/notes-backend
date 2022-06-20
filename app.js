const config = require('./utils/config')
const express = require('express')
const app = express()
const cors = require('cors')
const notesRouter = require('./controllers/notes')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')

// DO NOT pass passwords to logger
const destination = config.MONGODB_URI.includes('testNoteApp')
  ? 'TEST MongoDB'
  : 'PRODUCTION MongoDB'
logger.info('Connecting to', destination)

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('Connected to', destination)
  })
  .catch((error) => {
    logger.error('Error connecting to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.static('build'))
app.use(express.json())
app.use(middleware.requestLogger)

app.use('/api/notes', notesRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app