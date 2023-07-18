const express = require('express');
const app = express();
const router = express.Router();
const connection = require('./db');
const crypto = require('crypto');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
// const { log } = require('console');

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
      req.flash('error', 'Не вдалося додати користувача');
      req.flash('isTemporary', true);
    } else {
      console.log('User added to SQL table successfully');
      req.flash('success', 'Користувача додано успішно!');
      req.flash('isTemporary', true);
    }
    res.redirect('/');
  });
});

router.post('/add-vacation', (req, res) => {
  const { worker_uuid, year_vac, type_vac, reason, period_from, period_to, quantity } = req.body;

  const query = 'INSERT INTO vacation_records (worker_uuid, year_vac, type_vac, reason_vac, from_vac, to_vac, days_vac) VALUES (?, ?, ?, ?, ?, ?, ?)';
  connection.query(query, [worker_uuid, year_vac, type_vac, reason, period_from, period_to, quantity], (err, result) => {
    if (err) {
      console.error('Error adding vacation record to SQL table:', err);
      req.flash('error', 'Не вдалося додати запис відпустки');
    } else {
      console.log('Vacation record added to SQL table successfully');
      req.flash('success', 'Запис відпустки додано успішно!');
      req.flash('isTemporary', true);
    }
    res.redirect('/');
  });
});

router.get('/search', (req, res) => {
    const query = req.query.query;
    const searchQuery = `
      SELECT * FROM workers
      WHERE second_name LIKE '%${query}%'
      OR name LIKE '%${query}%'
      OR middle_name LIKE '%${query}%'
    `;
connection.query(searchQuery, (err, workers) => {
    if (err) {
      console.error('Error searching for workers:', err);
      req.flash('error', 'Error searching for workers');
      req.flash('isTemporary', true);
      res.redirect('/');
    } else {
        if (workers.length > 0) {
            const worker = workers[0];
            const vacationQuery = `
              SELECT worker_uuid, year_vac, type_vac, reason_vac, from_vac, to_vac, days_vac
              FROM vacation_records
            `;

            connection.query(vacationQuery, (err, vacationData) => {
              if (err) {
                console.error('Error retrieving vacation data:', err);
                req.flash('error', 'Error retrieving vacation data');
                req.flash('isTemporary', true);
              } else {
                res.render('main', {
                  worker,
                  vacationData,
                  successMessage: `Found worker: ${worker.second_name} ${worker.name} ${worker.middle_name}`
                });
                console.log(`Found worker:${worker.second_name} ${worker.name} ${worker.middle_name}`);
                req.flash('success', 'Працівника знайдено!');
                req.flash('isTemporary', true);
              }
            });
          } else {
            flashMessage(req, 'error', 'Працівника не знайдено!', true, true);
            // req.flash('error', 'Працівника не знайдено!');
            // req.flash('isTemporary', true);
            // req.flash('isError', true);
            res.redirect('/');
          }
        }
  });
});

module.exports = router;
