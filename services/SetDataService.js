import http from './http-common'

class SetDataService {
  getAll() {
    return http.get('/userGtms')
  }

  get(id) {
    return http.get(`/userGtms/${id}`)
  }

  create(data) {
    return http.post('/userGtms', data)
  }

  update(id, data) {
    return http.put(`/userGtms/${id}`, data)
  }

  delete(id) {
    return http.delete(`/userGtms/${id}`)
  }

  deleteAll() {
    return http.delete(`/userGtms`)
  }

  findByTitle(title) {
    return http.get(`/userGtms?title=${title}`)
  }
}

export default new SetDataService()
