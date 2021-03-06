const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const { makeRecordsArray } = require('./records.fixtures')

describe(`Records endpoints`, function() {
  let db

  before(`make knex instance`, () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL
    })
    app.set('db', db)
  })

  after(`disconnect from db`, () => db.destroy())

  before(`clean up the records table`, () => db('records').truncate())

  afterEach(`cleanup`, () => db('records').truncate())

  describe(`GET api/recordslist`, () => {
    context(`given records in the database`, () => {
      const testRecords = makeRecordsArray()

      beforeEach(`insert records`, () => {
        return db
          .into('records')
          .insert(testRecords)
      })

      it(`responds with 200 and all of the records`, () => {
        return supertest(app)
          .get('/api/recordslist')
          .expect(200, testRecords)
      })
    })
  })
  
  describe(`POST /api/recordlist`, () => {
    it(`Creates a new record entry, responds with 201 and the new record`, () => {
      const newRecord = {
        id: '123',
        title: 'Michael Jackson - Bad'
      }
      return supertest(app)
        .post('/api/recordslist')
        .send(newRecord)
        .expect(res => {
          expect(res.body.id).to.eql(newRecord.id)
          expect(res.body.title).to.eql(newRecord.title)
        })
    })
  })
  describe(`DELETE /api/recordslist/:id`, () => {
    const testRecords = makeRecordsArray()

    beforeEach(`Insert records`, () => {
      return db
        .into('records')
        .insert(testRecords)
    })

    it(`Responds with 204 and removes the record`, () => {
      const idToRemove = '2'
      const expectedRecords = testRecords.filter(record => record.id !== idToRemove)
      return supertest(app)
        .delete(`/api/recordslist/${idToRemove}`)
        .expect(204)
        .then(res => 
          supertest(app)
            .get(`/api/recordslist`)
            .expect(expectedRecords)  
        )
    })
  })

  describe(`PATCH /api/recordslist/:id`, () => {
    const testRecords = makeRecordsArray()

    beforeEach(`Insert records`, () => {
      return db
        .into('records')
        .insert(testRecords)
    })

    it(`Responds with 204 and updates the article`, () => {
      const idToUpdate = '2'
      const updatedRecord = {
        id: '2',
        title: 'Updated record title'
      }
      const expectedRecord = {
        ...testRecords[parseFloat(idToUpdate) - 1],
        ...updatedRecord
      }
      return supertest(app)
        .patch(`/api/recordslist/${idToUpdate}`)
        .send(updatedRecord)
        .expect(204)
        .then(res => 
          supertest(app)
            .get(`/api/recordslist/${idToUpdate}`)
            .expect(expectedRecord)
        )
    })
  })
})