import request from '../utils/request'

export function getQuestionPage(page, pageSize, signal) {
  return request.get('/admin/question/page', { params: { page, pageSize }, signal })
}

export function getQuestion(id, signal) {
  return request.get(`/admin/question/${id}`, { signal })
}

export function createQuestion(data) {
  return request.post('/admin/question/add', data)
}

export function updateQuestion(data) {
  return request.put('/admin/question', data)
}

export function deleteQuestion(id) {
  return request.delete(`/admin/question/${id}`)
}
