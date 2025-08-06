const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const mongoose = require('mongoose');
const Record = require('./models/Record');
const mongoURI = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/evrecord";
const postServerURL = process.env.POSTSERVER_URL || "http://localhost:3000/save"

// Simple structured logging
const log = {
  info: (message, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data),
  error: (message, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error),
  warn: (message, data = {}) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data)
};

mongoose.connect(mongoURI)
  .then(() => log.info('Database connected successfully'))
  .catch(err => log.error('Database connection failed', err));

const postInterval = process.env.POSTINTERVAL || 60;

const app = express();
app.use(cors());
app.use(express.json({limit: '25mb'}));

app.listen(PORT, () => {
    log.info(`EvRecord server started on port ${PORT}`);
});

app.get('/start', (req, res) => {
    log.info('Configuration requested');
    try {
        const configPath = path.join(__dirname, 'configExample.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        const settings = JSON.parse(configData);
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        log.error('Error reading configExample.json', error);
        res.status(500).json({
            success: false,
            message: 'Error loading configuration',
            error: error.message
        });
    }
})
  
const importData = async (data) => {
  try {
    await Record.create(data);
    log.info('Record imported successfully', { userId: data.userId, eventCount: data.events?.length });
  } catch (error) {
    log.error('Failed to import record', error);
  }
}

app.post('/save', (req, res) => {
    let data;
    try {
      data = req.body || {};
      
      // Validate expected structure from dataExample.json
      if (!data.userId || !data.events || !Array.isArray(data.events)) {
        throw new Error('Incorrect data structure: missing userId or events');
      }
      
      // Validate that all events have at least the type field
      const invalidEvents = data.events.filter(event => !event.type);
      if (invalidEvents.length > 0) {
        throw new Error('All events must have a type field');
      }
    } 
    catch (error) {
      log.warn('Invalid record format received', { error: error.message });
      res.status(422).json({
        success: false,
        message: 'Incorrect record format: ' + error.message
      });
      return
    }
    try {
      importData(data);
      res.status(201).json({
        success: true,
        message: 'Record has been processed successfully'
      });
    }
    catch (error) {
      log.error('Error processing data', error);
      res.status(500).json({
        success: false,
        message: 'Error processing data'
      });
    }
});

app.get('/', function(req,res) {
  res.json({ 
    status: 'alive', 
    service: 'EvRecord Server',
    version: '1.0.0' 
  });
});

const DATA_PASS = process.env.DATA_PASS
app.get("/fetchall",(req,res) => {
  if (req.body.pass === DATA_PASS) {
    Record.find({}).exec(function(err, data) {
      if (err) {
        log.error('Error fetching all records', err);
        res.status(500).json({
          success: false,
          message: 'Error fetching records'
        });
      } else {
        log.info('All records fetched', { count: data.length });
        res.json({
          success: true,
          data: data,
          count: data.length
        });
      }
    })
  }
  else {
    log.warn('Unauthorized access attempt to fetchall');
    res.status(401).json({
      success: false,
      message: 'Access denied'
    });
  }
})

const ITEMS_PER_PAGE = 10;
app.get("/fetchpage", async (req, res) => {
  const providedPassword = req.query.pass;

  if (providedPassword !== DATA_PASS) {
    log.warn('Unauthorized access attempt to fetchpage');
    return res.status(401).json({ 
      success: false,
      message: 'Access denied' 
    });
  }

  const page = parseInt(req.query.page) || 1;

  try {
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const data = await Record.find({}).skip(skip).limit(ITEMS_PER_PAGE).exec();
    const total = await Record.countDocuments();
    
    log.info('Page fetched', { page, itemsReturned: data.length, total });
    
    res.json({
      success: true,
      data: data,
      pagination: {
        page: page,
        itemsPerPage: ITEMS_PER_PAGE,
        totalItems: total,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE)
      }
    });
  } catch (error) {
    log.error('Error querying database', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});
