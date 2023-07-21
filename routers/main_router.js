const express = require('express');
const router = express.Router();
const connection = require('./db');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');

router.use(bodyParser.urlencoded({ extended: true }));

router.use(session({
  secret: 'your_secret_key',
  resave: true,
  saveUninitialized: true
}));
router.use(flash());

function flashMessage(req, type, message, isTemporary, isError) {
    req.flash(type, message);
    req.flash('isTemporary', isTemporary);
    req.flash('isError', isError);
}

router.get('/', (req, res) => {
  res.render('main', {
    title: 'main_page'
  });
});

router.post('/add-user', (req, res) => {
  const { name, second_name, middle_name } = req.body;

  const query = 'INSERT INTO workers (name, second_name, middle_name, worker_uuid) VALUES (?, ?, ?, ?)';
  connection.query(query, [name, second_name, middle_name, crypto.randomUUID()], (err, result) => {
    if (err) {
      console.error('Error adding user to SQL table:', err);
      flashMessage(req, 'error', 'Не вдалося додати користувача', true, true);
    } else {
      console.log('User added to SQL table successfully');
      flashMessage(req, 'success', 'Користувача додано успішно!', true, false);
    }
    res.redirect(`/search?query=${second_name}`);
  });
});

router.post('/add-vacation', (req, res) => {
  const { worker_uuid, year_vac, type_vac, reason_numer, reason_date, period_from, period_to, quantity } = req.body;
  const second_name = req.body.second_name;
  const reason = `Роспорядження № ${reason_numer}, з дати: ${reason_date}`;

  const query = 'INSERT INTO vacation_records (worker_uuid, year_vac, type_vac, reason_vac, from_vac, to_vac, days_vac) VALUES (?, ?, ?, ?, ?, ?, ?)';
  connection.query(query, [worker_uuid, year_vac, type_vac, reason, period_from, period_to, quantity], (err, result) => {
    if (err) {
      console.error('Error adding vacation record to SQL table:', err);
      flashMessage(req, 'error', 'Не вдалося додати запис відпустки', true, true);
    } else {
      console.log('Vacation record added to SQL table successfully');
      flashMessage(req, 'success', 'Запис відпустки додано успішно!', true, false);
      res.redirect(`/search?query=${second_name}`);
    }
  });
});

router.get('/search', (req, res) => {
  const query = req.query.query;
  const searchQuery = `
    SELECT * FROM workers
    WHERE ${getSearchCondition(query)}
  `;

  connection.query(searchQuery, (err, workers) => {
    if (err) {
      console.error('Error searching for workers:', err);
      flashMessage(req, 'error', 'Error searching for workers', true, true);
      res.redirect('/');
    } else {
      if (workers.length > 0) {
        const worker = workers[0];
        const workerUUID = worker.worker_uuid;
        const today = new Date();
        const currentYear = new Date().getFullYear();
        const lastThreeYears = [currentYear, currentYear - 1, currentYear - 2];

        const getVacationRecordsQuery = `
          SELECT worker_uuid, year_vac, type_vac, reason_vac, from_vac, to_vac, days_vac
          FROM vacation_records
          WHERE worker_uuid = ? AND year_vac IN (${lastThreeYears.join(',')})
          ORDER BY year_vac DESC, type_vac ASC, !from_vac DESC
        `;

        connection.query(getVacationRecordsQuery, [workerUUID], (err, records) => {
          if (err) {
            console.error('Error retrieving vacation data:', err);
            flashMessage(req, 'error', 'Error retrieving vacation data', true, true);
          } else {
            const vacationData = {};

            // Parse the records and group them by vacation year and type
            records.forEach(record => {
              const year = record.year_vac;
              const type = record.type_vac;
              if (!vacationData[year]) vacationData[year] = {};
              if (!vacationData[year][type]) vacationData[year][type] = [];
              vacationData[year][type].push(record);
            }); 
            let isOnVacation = false;
            for (const record of records) {
              const startDate = new Date(record.from_vac);
              const endDate = new Date(record.to_vac);
              
              // Check if the current date falls within the vacation period
              if (today >= startDate && today <= endDate) {
                isOnVacation = true;
                break;
              }
            }
            res.render('main', {
              worker,
              vacationData,
              isOnVacation: isOnVacation,
              successMessage: `Found worker: ${worker.second_name} ${worker.name} ${worker.middle_name}`
            });
            console.log(`Found worker: ${worker.second_name} ${worker.name} ${worker.middle_name}`);
            flashMessage(req, 'success', 'Працівника знайдено!', true, false);
          }
        });
      } else {
        console.log('Працівника не знайдено');
        flashMessage(req, 'error', 'Працівника не знайдено!', true, true);
        res.redirect('/');
      }
    }
  });
});
function getSearchCondition(query) {
  const searchTerms = query.trim().split(' ');

  if (searchTerms.length === 1) {
    return `second_name LIKE '%${searchTerms[0]}%'`;
  } else if (searchTerms.length === 2) {
    return `second_name LIKE '%${searchTerms[0]}%' AND name LIKE '%${searchTerms[1]}%'`;
  } else if (searchTerms.length === 3) {
    return `second_name LIKE '%${searchTerms[0]}%' AND name LIKE '%${searchTerms[1]}%' AND middle_name LIKE '%${searchTerms[2]}%'`;
  } else {
    return '';
  }
}

module.exports = router;
