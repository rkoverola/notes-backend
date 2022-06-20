const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Note = require('../models/note')
const helper = require('./test_helper')

const api = supertest(app)

beforeEach( async () => {
  await Note.deleteMany({})

  for(const note of helper.initialNotes) {
    let noteObject = new Note(note)
    await noteObject.save()
  }
})

describe('notes api', () => {
  test('notes are returned as json', async () => {
    await api
      .get('/api/notes')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  }, 100000)

  test('all notes are returned', async () => {
    const response = await api.get('/api/notes')
    expect(response.body).toHaveLength(helper.initialNotes.length)
  })

  test('a specific note is within returned notes', async () => {
    const response = await api.get('/api/notes')
    const contents = response.body.map(r => r.content)
    expect(contents).toContain('Browser can execute only Javascript')
  })

  test('a specific note can be added', async () => {
    const newNote = {
      content: 'async/await says hi',
      important: true
    }
    await api
      .post('/api/notes')
      .send(newNote)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const notesAtEnd = await helper.notesInDb()
    const contents = notesAtEnd.map(n => n.content)
    expect(notesAtEnd).toHaveLength(helper.initialNotes.length + 1)
    expect(contents).toContain('async/await says hi')
  })

  test('empty note cannot be saved', async () => {
    const emptyNote = {
      important: true
    }
    await api
      .post('/api/notes')
      .send(emptyNote)
      .expect(400)

    const notesAtEnd = await helper.notesInDb()
    expect(notesAtEnd).toHaveLength(helper.initialNotes.length)
  })

  test('specific note can be viewed', async () => {
    const notesAtStart = await helper.notesInDb()
    const noteToView = notesAtStart[1]

    const resultNote = await api
      .get(`/api/notes/${noteToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const processedNoteToView = JSON.parse(JSON.stringify(noteToView))
    expect(resultNote.body).toEqual(processedNoteToView)
  })

  test('specific note can be deleted', async () => {
    const notesAtStart = await helper.notesInDb()
    const noteToDelete = notesAtStart[1]

    await api
      .delete(`/api/notes/${noteToDelete.id}`)
      .expect(204)

    const notesAtEnd = await helper.notesInDb()
    expect(notesAtEnd).toHaveLength(notesAtStart.length - 1)
    const contents = notesAtEnd.map(n => n.content)
    expect(contents).not.toContain(noteToDelete.content)
  })
})


afterAll( () => {
  mongoose.connection.close()
})